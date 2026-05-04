// Workflow 2: STL-file-based supplier search
// Downloads STL from Supabase Storage, parses it, matches suppliers deterministically.
// Claude is only used downstream for short match explanations (lib/claude-client.ts).

import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { parseSTL } from "./lib/stl-parser.js";
import { fetchSuppliers, updateSearchStatus, saveSearchResults } from "./lib/supplier-fetcher.js";
import { scoreSuppliers, fuzzyMatch } from "./lib/scoring.js";
import { generateExplanations } from "./lib/claude-client.js";
import { getAreaForCountry } from "./lib/area.js";
import { mapTaskErrorToUserMessage } from "./lib/sanitize-error.js";
import { extractRequirementsFromStl } from "./lib/stl-heuristics.js";
import type { ExtractedRequirements } from "./lib/types.js";

export const stlSupplierMatch = schemaTask({
  id: "stl-supplier-match",
  schema: z.object({
    searchResultId: z.string().uuid(),
    stlFilePath: z.string(),
    technology: z.string().optional().default(''),
    material: z.string().optional().default(''),
    quantity: z.number().optional(),
    preferredRegion: z.string().optional(),
    area: z.string().optional(),
  }),
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30_000,
  },
  run: async (payload) => {
    const startTime = Date.now();
    const { searchResultId, stlFilePath, technology, material, quantity, preferredRegion, area } = payload;

    try {
      // Step 1: Analyzing STL file
      await updateSearchStatus(searchResultId, "analyzing");
      console.log(`[stl-match] Downloading STL: ${stlFilePath}`);

      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Download STL from Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("stl-uploads")
        .download(stlFilePath);

      if (downloadError || !fileData) {
        throw new Error(`Failed to download STL: ${downloadError?.message || "No data"}`);
      }

      // Parse STL
      const buffer = await fileData.arrayBuffer();
      const stlMetrics = parseSTL(buffer);

      if (stlMetrics.triangleCount === 0 || stlMetrics.volumeCm3 === 0) {
        throw new Error("Invalid STL file: no geometry found");
      }

      console.log(`[stl-match] Parsed STL: ${stlMetrics.triangleCount} triangles, ${stlMetrics.volumeCm3.toFixed(2)} cm³, bbox ${stlMetrics.boundingBox.x}x${stlMetrics.boundingBox.y}x${stlMetrics.boundingBox.z}mm`);

      // Save STL metrics to DB
      await updateSearchStatus(searchResultId, "analyzing", {
        stl_metrics: stlMetrics,
      });

      // Step 2: Matching suppliers. Requirement "extraction" is now deterministic
      // (see lib/stl-heuristics.ts) — the user's dropdown selections plus a few
      // size/density heuristics cover everything scoring needs. Skipping Claude
      // here cuts ~3-5s off the critical path and the entire AI cost of this step.
      await updateSearchStatus(searchResultId, "matching");

      const fetchStart = Date.now();
      const allSuppliers = await fetchSuppliers();
      console.log(`[stl-match] Fetched ${allSuppliers.length} suppliers in ${Date.now() - fetchStart}ms`);

      // Pre-filter suppliers by selected technology and/or material.
      // Empty values mean "any" — skip that filter.
      const hasTechFilter = Boolean(technology);
      const hasMatFilter = Boolean(material);

      let suppliersToScore: typeof allSuppliers;
      let filterTier: "both" | "tech-only" | "material-only" | "all";

      if (!hasTechFilter && !hasMatFilter) {
        suppliersToScore = allSuppliers;
        filterTier = "all";
      } else if (hasTechFilter && hasMatFilter) {
        const bothMatch = allSuppliers.filter(
          (s) =>
            s.technologies.some((t) => fuzzyMatch(t.name, technology)) &&
            s.materials.some((m) => fuzzyMatch(m.name, material))
        );
        if (bothMatch.length > 0) {
          suppliersToScore = bothMatch;
          filterTier = "both";
        } else {
          const techOnly = allSuppliers.filter((s) =>
            s.technologies.some((t) => fuzzyMatch(t.name, technology))
          );
          if (techOnly.length > 0) {
            suppliersToScore = techOnly;
            filterTier = "tech-only";
          } else {
            suppliersToScore = allSuppliers;
            filterTier = "all";
          }
        }
      } else if (hasTechFilter) {
        const techOnly = allSuppliers.filter((s) =>
          s.technologies.some((t) => fuzzyMatch(t.name, technology))
        );
        suppliersToScore = techOnly.length > 0 ? techOnly : allSuppliers;
        filterTier = techOnly.length > 0 ? "tech-only" : "all";
      } else {
        const matOnly = allSuppliers.filter((s) =>
          s.materials.some((m) => fuzzyMatch(m.name, material))
        );
        suppliersToScore = matOnly.length > 0 ? matOnly : allSuppliers;
        filterTier = matOnly.length > 0 ? "material-only" : "all";
      }

      console.log(`[stl-match] Pre-filtered to ${suppliersToScore.length} suppliers (tech: ${technology || "any"}, mat: ${material || "any"}, tier: ${filterTier})`);

      // Hard area filter: when the user picks a continent, drop suppliers whose
      // country doesn't resolve to that continent. Suppliers with no country
      // data are dropped too, so the filter stays meaningful. Skip when "any".
      if (area) {
        const beforeArea = suppliersToScore.length;
        suppliersToScore = suppliersToScore.filter(
          (s) => getAreaForCountry(s.location_country) === area
        );
        console.log(`[stl-match] Area filter (${area}): ${beforeArea} → ${suppliersToScore.length} suppliers`);
      }

      const requirements: ExtractedRequirements = extractRequirementsFromStl(stlMetrics, {
        technology: technology || undefined,
        material: material || undefined,
        quantity,
        preferredRegion,
      });

      // Score every pre-filtered supplier — return the full ranked list.
      // Cheapest-first ordering happens client-side once live / estimated
      // prices resolve (see supplier-price-matcher.ts).
      const matches = scoreSuppliers(suppliersToScore, requirements);
      console.log(`[stl-match] Found ${matches.length} matches`);

      // Step 3: Ranking — publish matches now so the frontend can render cards immediately
      // while Claude writes explanations in the background.
      await updateSearchStatus(searchResultId, "ranking", {
        extracted_requirements: requirements,
        matches,
        total_suppliers_analyzed: suppliersToScore.length,
      });

      // Generate explanations for the top 20 only. The Claude call shares a
      // single 1024-token budget across all matches; sending 250+ would
      // truncate to a few tokens each and burn API cost. Cards without an
      // explanation still render cleanly (see InstantQuote SupplierResultCard).
      const EXPLANATION_CAP = 20;
      const matchesForExplanation = matches.slice(0, EXPLANATION_CAP);
      const explanations = await generateExplanations(matchesForExplanation, requirements).catch((e) => {
        console.error("[stl-match] Failed to generate explanations:", e);
        return [] as string[];
      });

      explanations.forEach((exp, i) => {
        if (matches[i]) matches[i].matchDetails.overallExplanation = exp;
      });

      // Step 4: Save results
      const durationMs = Date.now() - startTime;

      await saveSearchResults(searchResultId, {
        extracted_requirements: requirements,
        matches,
        total_suppliers_analyzed: suppliersToScore.length,
        duration_ms: durationMs,
      });

      console.log(`[stl-match] Completed in ${durationMs}ms with ${matches.length} matches`);

      return {
        requirements,
        matches,
        totalSuppliersAnalyzed: suppliersToScore.length,
        stlMetrics,
        technologyRationale: null,
      };
    } catch (error) {
      console.error(`[stl-match] Failed:`, error);

      await saveSearchResults(searchResultId, {
        error_message: mapTaskErrorToUserMessage(error),
        duration_ms: Date.now() - startTime,
      });

      throw error;
    }
  },
});
