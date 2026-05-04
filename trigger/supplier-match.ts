// Workflow 1: Enhanced requirement-based supplier search
// Triggered via Supabase Edge Function proxy, streams status updates via Trigger.dev realtime

import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
import { fetchSuppliers, updateSearchStatus, saveSearchResults } from "./lib/supplier-fetcher.js";
import { scoreSuppliers, buildRecommendedTechnologies, buildRecommendedCertifications } from "./lib/scoring.js";
import { analyzeRequirements, generateExplanations, generateTechnologyRationale } from "./lib/claude-client.js";
import { mapTaskErrorToUserMessage } from "./lib/sanitize-error.js";
import type { SupplierMatchOutput } from "./lib/types.js";

export const supplierMatch = schemaTask({
  id: "supplier-match",
  schema: z.object({
    searchResultId: z.string().uuid(),
    project: z.object({
      description: z.string().min(1).max(2000),
      quantity: z.string().optional(),
      preferredRegion: z.string().optional(),
      applicationType: z.string().optional(),
      industry: z.string().optional(),
      mechanicalRequirements: z.array(z.string()).optional(),
      surfaceFinish: z.string().optional(),
      partSize: z.string().optional(),
      certificationsNeeded: z.array(z.string()).optional(),
    }),
  }),
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30_000,
  },
  run: async (payload) => {
    const startTime = Date.now();
    const { searchResultId, project } = payload;

    try {
      // Step 1: Analyzing requirements
      await updateSearchStatus(searchResultId, "analyzing");
      console.log(`[supplier-match] Analyzing requirements for: ${project.description.substring(0, 80)}...`);

      // Build recommended techs/certs from structured inputs
      const recommendedTechs = buildRecommendedTechnologies(project);
      const recommendedCerts = buildRecommendedCertifications(project);
      console.log(`[supplier-match] Recommended techs: ${recommendedTechs.join(", ")}`);

      // Call Claude Sonnet to extract structured requirements
      const requirements = await analyzeRequirements(project, recommendedTechs, recommendedCerts);
      console.log(`[supplier-match] Extracted: ${requirements.requiredTechnologies.length} techs, ${requirements.requiredMaterials.length} materials`);

      // Step 2: Matching suppliers
      await updateSearchStatus(searchResultId, "matching", {
        extracted_requirements: requirements,
      });

      const suppliers = await fetchSuppliers();
      console.log(`[supplier-match] Fetched ${suppliers.length} verified suppliers`);

      const matches = scoreSuppliers(suppliers, requirements, 8);
      console.log(`[supplier-match] Found ${matches.length} matches (top score: ${matches[0]?.score || 0}%)`);

      // Step 3: Ranking and generating explanations
      await updateSearchStatus(searchResultId, "ranking");

      // Generate explanations and technology rationale in parallel
      const [explanations, technologyRationale] = await Promise.all([
        generateExplanations(matches, requirements).catch((e) => {
          console.error("[supplier-match] Failed to generate explanations:", e);
          return [] as string[];
        }),
        generateTechnologyRationale(requirements).catch((e) => {
          console.error("[supplier-match] Failed to generate rationale:", e);
          return null;
        }),
      ]);

      // Apply explanations to matches
      explanations.forEach((exp, i) => {
        if (matches[i]) {
          matches[i].matchDetails.overallExplanation = exp;
        }
      });

      // Step 4: Save results
      const durationMs = Date.now() - startTime;
      const output: SupplierMatchOutput = {
        requirements,
        matches,
        totalSuppliersAnalyzed: suppliers.length,
        technologyRationale,
      };

      await saveSearchResults(searchResultId, {
        extracted_requirements: requirements,
        matches,
        technology_rationale: technologyRationale,
        total_suppliers_analyzed: suppliers.length,
        duration_ms: durationMs,
      });

      console.log(`[supplier-match] Completed in ${durationMs}ms with ${matches.length} matches`);
      return output;
    } catch (error) {
      console.error(`[supplier-match] Failed:`, error);

      await saveSearchResults(searchResultId, {
        error_message: mapTaskErrorToUserMessage(error),
        duration_ms: Date.now() - startTime,
      });

      throw error; // Re-throw so Trigger.dev retries
    }
  },
});
