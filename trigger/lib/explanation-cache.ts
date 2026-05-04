// Cache for per-supplier match explanations. Same supplier × same project
// signature → same prose, so we hash the inputs and reuse. Survives across
// search runs (and users), so popular suppliers warm the cache fast.

import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import type { ExtractedRequirements, MatchResult } from "./types.js";

// Bumping this invalidates all existing cache entries — do it whenever the
// prompt template in generateExplanations changes shape.
const PROMPT_VERSION = "v1";

function getClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  return createClient(url, key);
}

export function buildSignature(
  match: MatchResult,
  requirements: ExtractedRequirements,
  model: string
): string {
  // Round score to nearest 5 to widen cache hits ("75%" and "76%" produce the
  // same prose anyway). Sort arrays for stable hashing.
  const scoreBucket = Math.round(match.score / 5) * 5;
  const techs = [...match.matchDetails.matchedTechnologies].sort().join("|");
  const mats = [...match.matchDetails.matchedMaterials].sort().join("|");
  const certs = [...match.matchDetails.matchedCertifications].sort().join("|");
  const mechNeeds = [...(requirements.mechanicalNeeds || [])].sort().join("|");

  const payload = [
    PROMPT_VERSION,
    model,
    match.supplier.supplier_id,
    scoreBucket.toString(),
    techs,
    mats,
    certs,
    requirements.projectSummary || "",
    requirements.industry || "",
    mechNeeds,
  ].join("\n");

  return createHash("sha256").update(payload).digest("hex");
}

export async function readExplanationCache(signatures: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (signatures.length === 0) return result;

  const supabase = getClient();
  const { data, error } = await supabase
    .from("match_explanations_cache")
    .select("signature, explanation")
    .in("signature", signatures);

  if (error) {
    console.error("[explanation-cache] read failed:", error.message);
    return result;
  }

  for (const row of data || []) {
    result.set(row.signature, row.explanation);
  }

  if (result.size > 0) {
    // Best-effort hit-stats update; don't block on it.
    const now = new Date().toISOString();
    supabase
      .from("match_explanations_cache")
      .update({ last_hit_at: now })
      .in("signature", Array.from(result.keys()))
      .then(({ error: updateError }) => {
        if (updateError) console.error("[explanation-cache] hit-stats update failed:", updateError.message);
      });
  }

  return result;
}

export async function writeExplanationCache(
  entries: { signature: string; explanation: string; model: string }[]
): Promise<void> {
  if (entries.length === 0) return;
  const supabase = getClient();
  const { error } = await supabase
    .from("match_explanations_cache")
    .upsert(
      entries.map((e) => ({
        signature: e.signature,
        explanation: e.explanation,
        model: e.model,
      })),
      { onConflict: "signature", ignoreDuplicates: true }
    );
  if (error) console.error("[explanation-cache] write failed:", error.message);
}
