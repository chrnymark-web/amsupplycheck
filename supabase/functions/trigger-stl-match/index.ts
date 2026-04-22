// Thin proxy: creates search_results row, triggers Trigger.dev STL task, returns run handle
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { SignJWT } from "https://deno.land/x/jose@v5.2.0/index.ts";

/** Generate a public access token for a Trigger.dev run (same logic as @trigger.dev/core/jwt.js) */
async function generatePublicAccessToken(runId: string, secretKey: string): Promise<string> {
  return new SignJWT({ scopes: [`read:runs:${runId}`] })
    .setIssuer("https://id.trigger.dev")
    .setAudience("https://api.trigger.dev")
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secretKey));
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { stlFilePath, technology, material, quantity, preferredRegion } = body;

    if (!stlFilePath) {
      return new Response(
        JSON.stringify({ error: "stlFilePath is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const technologyStr = typeof technology === "string" ? technology.trim() : "";
    const materialStr = typeof material === "string" ? material.trim() : "";

    // Create search_results row
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: searchResult, error: insertError } = await supabase
      .from("search_results")
      .insert({
        search_type: "stl",
        status: "pending",
        stl_file_url: stlFilePath,
        selected_technology: technologyStr.slice(0, 100),
        selected_material: materialStr.slice(0, 100),
      })
      .select("id")
      .single();

    if (insertError || !searchResult) {
      console.error("Failed to create search_results row:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to initialize search" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const searchResultId = searchResult.id;

    // Trigger the Trigger.dev task via REST API
    const TRIGGER_SECRET_KEY = Deno.env.get("TRIGGER_SECRET_KEY");
    if (!TRIGGER_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Trigger.dev not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const triggerResponse = await fetch(
      "https://api.trigger.dev/api/v1/tasks/stl-supplier-match/trigger",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TRIGGER_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: {
            searchResultId,
            stlFilePath: String(stlFilePath).trim(),
            technology: technologyStr,
            material: materialStr,
            quantity: typeof quantity === "number" ? quantity : undefined,
            preferredRegion: typeof preferredRegion === "string" ? preferredRegion.trim() : undefined,
          },
        }),
      }
    );

    if (!triggerResponse.ok) {
      const errorText = await triggerResponse.text();
      console.error("Trigger.dev API error:", triggerResponse.status, errorText);
      await supabase.from("search_results").update({
        status: "failed",
        error_message: `Trigger.dev error: ${triggerResponse.status}`,
      }).eq("id", searchResultId);

      return new Response(
        JSON.stringify({ error: "Failed to start STL search task" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const triggerData = await triggerResponse.json();
    const runId = triggerData.id;

    // Generate public access token for frontend realtime subscriptions
    let publicAccessToken = triggerResponse.headers.get("x-trigger-jwt");
    if (!publicAccessToken) {
      publicAccessToken = await generatePublicAccessToken(runId, TRIGGER_SECRET_KEY);
    }

    // Update search_results with trigger run ID
    await supabase.from("search_results").update({
      trigger_run_id: runId,
    }).eq("id", searchResultId);

    console.log(`[trigger-stl-match] Created search ${searchResultId}, run ${runId}`);

    return new Response(
      JSON.stringify({
        searchResultId,
        runId,
        publicAccessToken,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("trigger-stl-match error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
