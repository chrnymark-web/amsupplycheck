import { corsHeaders } from "../_shared/cors.ts";

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get("SHAPEWAYS_CLIENT_ID");
  const clientSecret = Deno.env.get("SHAPEWAYS_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("Shapeways client credentials not configured");
  }

  const response = await fetch("https://api.shapeways.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("OAuth token error:", err);
    throw new Error("Failed to obtain Shapeways access token");
  }

  const data = await response.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = await getAccessToken();

    const { fileName, fileBase64 } = await req.json();

    if (!fileName || !fileBase64) {
      return new Response(
        JSON.stringify({ error: "fileName and fileBase64 are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const shapewaysResponse = await fetch("https://api.shapeways.com/models/v1", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName,
        file: encodeURIComponent(fileBase64),
        description: "Printability check via AMSupplyCheck",
        hasRightsToModel: 1,
        acceptTermsAndConditions: 1,
      }),
    });

    const data = await shapewaysResponse.json();
    console.log("Shapeways response keys:", Object.keys(data));
    if (data.materials) {
      const sample = Object.values(data.materials).slice(0, 2);
      console.log("Sample materials:", JSON.stringify(sample));
    }

    if (!shapewaysResponse.ok) {
      console.error("Shapeways API error:", data);
      return new Response(
        JSON.stringify({ error: "Shapeways API error", details: data }),
        { status: shapewaysResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
