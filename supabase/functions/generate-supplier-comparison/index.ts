import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Validate admin auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const userId = claimsData.claims.sub;

    // Check admin role
    const { data: roleData } = await supabaseAuth.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').single();
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin role required' }), { status: 403, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { supplier_ids, batch_size = 5 } = await req.json();

    // Fetch suppliers to process
    let query = supabase.from("suppliers").select("id, supplier_id, name, description, description_extended, technologies, materials, location_city, location_country, has_instant_quote, has_rush_service, lead_time_indicator, verified, premium");
    
    if (supplier_ids && supplier_ids.length > 0) {
      query = query.in("id", supplier_ids);
    } else {
      // Process suppliers that don't have pros/cons yet
      query = query.limit(batch_size);
    }

    const { data: suppliers, error: fetchError } = await query;
    if (fetchError) throw fetchError;
    if (!suppliers || suppliers.length === 0) {
      return new Response(JSON.stringify({ message: "No suppliers to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const results: { id: string; name: string; status: string }[] = [];

    for (const supplier of suppliers) {
      try {
        const existing = (supplier.description_extended as Record<string, unknown>) || {};
        
        // Skip if already has pros/cons/price_range
        if (existing.pros && existing.cons && existing.price_range) {
          results.push({ id: supplier.id, name: supplier.name, status: "skipped" });
          continue;
        }

        const techList = (supplier.technologies || []).join(", ");
        const matList = (supplier.materials || []).join(", ");
        const location = [supplier.location_city, supplier.location_country].filter(Boolean).join(", ");

        const prompt = `You are a 3D printing industry analyst. Generate comparison data for this supplier.

Supplier: ${supplier.name}
Description: ${supplier.description || "N/A"}
Technologies: ${techList || "N/A"}
Materials: ${matList || "N/A"}
Location: ${location || "N/A"}
Instant Quote: ${supplier.has_instant_quote ? "Yes" : "No"}
Rush Service: ${supplier.has_rush_service ? "Yes" : "No"}
Lead Time: ${supplier.lead_time_indicator || "N/A"}
Verified: ${supplier.verified ? "Yes" : "No"}
Premium: ${supplier.premium ? "Yes" : "No"}

Return ONLY valid JSON (no markdown). Generate realistic, factual data based on what you know about this supplier and similar 3D printing companies.`;

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You generate structured comparison data for 3D printing suppliers. Always respond with valid JSON only." },
              { role: "user", content: prompt },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "set_comparison_data",
                  description: "Set the pros, cons, and pricing data for a supplier",
                  parameters: {
                    type: "object",
                    properties: {
                      pros: {
                        type: "array",
                        items: { type: "string" },
                        description: "3-5 specific advantages of this supplier (e.g. 'Wide range of metal alloys including Inconel and titanium')",
                      },
                      cons: {
                        type: "array",
                        items: { type: "string" },
                        description: "2-4 potential disadvantages or limitations (e.g. 'Higher pricing compared to Asian suppliers')",
                      },
                      price_range: {
                        type: "string",
                        description: "A realistic pricing description, e.g. 'Starting from $15-25 per part for FDM prototypes. SLS parts typically $50-150. Metal parts from $200+. Volume discounts available for orders over 50 units.'",
                      },
                    },
                    required: ["pros", "cons", "price_range"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "set_comparison_data" } },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`AI error for ${supplier.name}:`, response.status, errText);
          results.push({ id: supplier.id, name: supplier.name, status: `ai_error_${response.status}` });
          continue;
        }

        const aiResult = await response.json();
        const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
        if (!toolCall) {
          results.push({ id: supplier.id, name: supplier.name, status: "no_tool_call" });
          continue;
        }

        const comparisonData = JSON.parse(toolCall.function.arguments);

        // Merge with existing description_extended
        const updatedExtended = {
          ...existing,
          pros: comparisonData.pros,
          cons: comparisonData.cons,
          price_range: comparisonData.price_range,
        };

        const { error: updateError } = await supabase
          .from("suppliers")
          .update({ description_extended: updatedExtended })
          .eq("id", supplier.id);

        if (updateError) {
          console.error(`Update error for ${supplier.name}:`, updateError);
          results.push({ id: supplier.id, name: supplier.name, status: "update_error" });
        } else {
          results.push({ id: supplier.id, name: supplier.name, status: "success" });
        }
      } catch (err) {
        console.error(`Error processing ${supplier.name}:`, err);
        results.push({ id: supplier.id, name: supplier.name, status: "error" });
      }
    }

    return new Response(JSON.stringify({ results, processed: results.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-supplier-comparison error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
