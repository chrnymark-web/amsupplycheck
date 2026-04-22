// Workflow 2: STL-file-based supplier search
// Downloads STL from Supabase Storage, parses it, matches suppliers via Claude Sonnet

import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { parseSTL } from "./lib/stl-parser.js";
import { fetchSuppliers, updateSearchStatus, saveSearchResults } from "./lib/supplier-fetcher.js";
import { scoreSuppliers, fuzzyMatch } from "./lib/scoring.js";
import { generateExplanations } from "./lib/claude-client.js";
import { getAreaForCountry } from "./lib/area.js";
import Anthropic from "@anthropic-ai/sdk";
import type { EnrichedSupplier, ExtractedRequirements, MatchResult } from "./lib/types.js";

const MODEL = "claude-sonnet-4-20250514";

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

      // Step 2: Matching suppliers — run Claude requirement extraction and DB fetch in parallel.
      // They're independent: Claude needs stlMetrics, DB fetch needs nothing from Claude.
      await updateSearchStatus(searchResultId, "matching");

      const anthropic = new Anthropic();
      const parallelStart = Date.now();
      const [allSuppliers, analysisResponse] = await Promise.all([
        fetchSuppliers(),
        anthropic.messages.create({
          model: MODEL,
          max_tokens: 1024,
          system: "You are an expert 3D printing consultant. Analyze part specifications and recommend optimal supplier matching criteria.",
          messages: [{
            role: "user",
            content: `Analyze this 3D printed part and extract supplier matching requirements.

PART SPECIFICATIONS:
- Technology: ${technology || "any (user has not specified — recommend based on geometry)"}
- Material: ${material || "any (user has not specified — recommend based on geometry)"}
- Volume: ${stlMetrics.volumeCm3.toFixed(2)} cm³
- Surface area: ${stlMetrics.surfaceAreaCm2.toFixed(2)} cm²
- Bounding box: ${stlMetrics.boundingBox.x}mm x ${stlMetrics.boundingBox.y}mm x ${stlMetrics.boundingBox.z}mm
- Triangle count: ${stlMetrics.triangleCount} (complexity indicator)
- Quantity: ${quantity || 1}
${preferredRegion ? `- Preferred region: ${preferredRegion}` : ""}

Based on the part size, complexity, and material, what should we look for in a supplier?`,
          }],
          tools: [{
            name: "extract_stl_requirements",
            description: "Extract requirements based on STL analysis",
            input_schema: {
              type: "object" as const,
              properties: {
                requiredTechnologies: { type: "array", items: { type: "string" }, description: "Technologies suitable for this part" },
                requiredMaterials: { type: "array", items: { type: "string" }, description: "Materials suitable for this part" },
                preferredRegions: { type: "array", items: { type: "string" }, description: "Preferred regions" },
                requiredCertifications: { type: "array", items: { type: "string" }, description: "Relevant certifications" },
                isProductionRun: { type: "boolean", description: "Whether quantity suggests production" },
                requiresMetal: { type: "boolean" },
                requiresHighPrecision: { type: "boolean" },
                requiresFlexibility: { type: "boolean" },
                projectSummary: { type: "string", description: "Brief summary of the part and its requirements" },
              },
              required: ["requiredTechnologies", "requiredMaterials", "preferredRegions", "projectSummary"],
            },
          }],
          tool_choice: { type: "tool" as const, name: "extract_stl_requirements" },
        }),
      ]);
      console.log(`[stl-match] Parallel DB+Claude done in ${Date.now() - parallelStart}ms, ${allSuppliers.length} suppliers`);

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

      const toolBlock = analysisResponse.content.find((b: any) => b.type === "tool_use");
      if (!toolBlock || toolBlock.type !== "tool_use") {
        throw new Error("Claude did not return requirements extraction");
      }

      const extractedReqs = toolBlock.input as any;
      const fallbackTechs = technology ? [technology] : [];
      const fallbackMats = material ? [material] : [];
      const summaryFallback =
        technology && material
          ? `${technology} part in ${material}`
          : technology
          ? `${technology} part`
          : material
          ? `Part in ${material}`
          : "3D-printed part";
      const requirements: ExtractedRequirements = {
        requiredTechnologies: extractedReqs.requiredTechnologies || fallbackTechs,
        requiredMaterials: extractedReqs.requiredMaterials || fallbackMats,
        preferredRegions: extractedReqs.preferredRegions || (preferredRegion ? [preferredRegion] : []),
        requiredCertifications: extractedReqs.requiredCertifications || [],
        isProductionRun: extractedReqs.isProductionRun || (quantity ? quantity >= 100 : false),
        requiresMetal: extractedReqs.requiresMetal || false,
        requiresHighPrecision: extractedReqs.requiresHighPrecision || false,
        requiresFlexibility: extractedReqs.requiresFlexibility || false,
        industry: "",
        mechanicalNeeds: [],
        surfaceRequirement: "",
        projectSummary: extractedReqs.projectSummary || summaryFallback,
      };

      // Score using the pre-filtered suppliers
      const matches = scoreSuppliers(suppliersToScore, requirements, 8);
      console.log(`[stl-match] Found ${matches.length} matches`);

      // Step 3: Ranking — publish matches now so the frontend can render cards immediately
      // while Claude writes explanations in the background.
      await updateSearchStatus(searchResultId, "ranking", {
        extracted_requirements: requirements,
        matches,
        total_suppliers_analyzed: suppliersToScore.length,
      });

      // Generate explanations
      const explanations = await generateExplanations(matches, requirements).catch((e) => {
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
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`[stl-match] Failed:`, error);

      await saveSearchResults(searchResultId, {
        error_message: errorMessage,
        duration_ms: Date.now() - startTime,
      });

      throw error;
    }
  },
});
