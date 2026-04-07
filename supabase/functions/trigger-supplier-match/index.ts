// Thin proxy: creates search_results row, triggers Trigger.dev task, returns run handle
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
    const project = body?.project;

    if (!project || typeof project.description !== "string" || !project.description.trim()) {
      return new Response(
        JSON.stringify({ error: "Project description is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize inputs
    const sanitizedProject = {
      description: project.description.trim().slice(0, 2000),
      quantity: typeof project.quantity === "string" ? project.quantity.trim().slice(0, 100) : undefined,
      preferredRegion: typeof project.preferredRegion === "string" ? project.preferredRegion.trim().slice(0, 100) : undefined,
      industry: typeof project.industry === "string" ? project.industry.trim().slice(0, 100) : undefined,
      applicationType: typeof project.applicationType === "string" ? project.applicationType.trim().slice(0, 100) : undefined,
      mechanicalRequirements: Array.isArray(project.mechanicalRequirements)
        ? project.mechanicalRequirements.filter((r: unknown) => typeof r === "string").map((r: string) => r.trim().slice(0, 50)).slice(0, 20)
        : undefined,
      surfaceFinish: typeof project.surfaceFinish === "string" ? project.surfaceFinish.trim().slice(0, 100) : undefined,
      partSize: typeof project.partSize === "string" ? project.partSize.trim().slice(0, 100) : undefined,
      certificationsNeeded: Array.isArray(project.certificationsNeeded)
        ? project.certificationsNeeded.filter((c: unknown) => typeof c === "string").map((c: string) => c.trim().slice(0, 50)).slice(0, 20)
        : undefined,
    };

    // Create search_results row
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: searchResult, error: insertError } = await supabase
      .from("search_results")
      .insert({
        search_type: "requirement",
        status: "pending",
        project_requirements: sanitizedProject,
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
      "https://api.trigger.dev/api/v1/tasks/supplier-match/trigger",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${TRIGGER_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payload: {
            searchResultId,
            project: sanitizedProject,
          },
        }),
      }
    );

    if (!triggerResponse.ok) {
      const errorText = await triggerResponse.text();
      console.error("Trigger.dev API error:", triggerResponse.status, errorText);
      // Update search_results with error
      await supabase.from("search_results").update({
        status: "failed",
        error_message: `Trigger.dev error: ${triggerResponse.status}`,
      }).eq("id", searchResultId);

      return new Response(
        JSON.stringify({ error: "Failed to start search task" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const triggerData = await triggerResponse.json();
    const runId = triggerData.id;

    // Generate public access token for frontend realtime subscriptions
    // The REST API returns the JWT in x-trigger-jwt header, or we generate it ourselves
    let publicAccessToken = triggerResponse.headers.get("x-trigger-jwt");
    if (!publicAccessToken) {
      publicAccessToken = await generatePublicAccessToken(runId, TRIGGER_SECRET_KEY);
    }

    // Update search_results with trigger run ID
    await supabase.from("search_results").update({
      trigger_run_id: runId,
    }).eq("id", searchResultId);

    console.log(`[trigger-supplier-match] Created search ${searchResultId}, run ${runId}`);

    return new Response(
      JSON.stringify({
        searchResultId,
        runId,
        publicAccessToken,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("trigger-supplier-match error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
