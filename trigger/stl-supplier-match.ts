// Workflow 2: STL-file-based supplier search
// Downloads STL from Supabase Storage, parses it, matches suppliers via Claude Sonnet

import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { parseSTL } from "./lib/stl-parser.js";
import { fetchSuppliers, updateSearchStatus, saveSearchResults } from "./lib/supplier-fetcher.js";
import { scoreSuppliers } from "./lib/scoring.js";
import { generateExplanations } from "./lib/claude-client.js";
import Anthropic from "@anthropic-ai/sdk";
import type { EnrichedSupplier, ExtractedRequirements, MatchResult } from "./lib/types.js";

const MODEL = "claude-sonnet-4-20250514";

export const stlSupplierMatch = schemaTask({
  id: "stl-supplier-match",
  schema: z.object({
    searchResultId: z.string().uuid(),
    stlFilePath: z.string(),
    technology: z.string(),
    material: z.string(),
    quantity: z.number().optional(),
    preferredRegion: z.string().optional(),
  }),
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 5000,
    maxTimeoutInMs: 30_000,
  },
  run: async (payload) => {
    const startTime = Date.now();
    const { searchResultId, stlFilePath, technology, material, quantity, preferredRegion } = payload;

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

      // Step 2: Matching suppliers
      await updateSearchStatus(searchResultId, "matching");

      const allSuppliers = await fetchSuppliers();
      console.log(`[stl-match] Fetched ${allSuppliers.length} verified suppliers`);

      // Pre-filter suppliers by selected technology and material
      const filteredSuppliers = allSuppliers.filter((s) => {
        const hasTech = s.technologies.some(
          (t) => t.name.toLowerCase().includes(technology.toLowerCase()) ||
                 technology.toLowerCase().includes(t.name.toLowerCase())
        );
        const hasMat = s.materials.some(
          (m) => m.name.toLowerCase().includes(material.toLowerCase()) ||
                 material.toLowerCase().includes(m.name.toLowerCase())
        );
        return hasTech || hasMat; // Include if they have either
      });

      console.log(`[stl-match] Pre-filtered to ${filteredSuppliers.length} suppliers (tech: ${technology}, mat: ${material})`);

      // Use Claude to analyze STL metrics + create requirements for scoring
      const anthropic = new Anthropic();
      const analysisResponse = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system: "You are an expert 3D printing consultant. Analyze part specifications and recommend optimal supplier matching criteria.",
        messages: [{
          role: "user",
          content: `Analyze this 3D printed part and extract supplier matching requirements.

PART SPECIFICATIONS:
- Technology: ${technology}
- Material: ${material}
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
      });

      const toolBlock = analysisResponse.content.find((b: any) => b.type === "tool_use");
      if (!toolBlock || toolBlock.type !== "tool_use") {
        throw new Error("Claude did not return requirements extraction");
      }

      const extractedReqs = toolBlock.input as any;
      const requirements: ExtractedRequirements = {
        requiredTechnologies: extractedReqs.requiredTechnologies || [technology],
        requiredMaterials: extractedReqs.requiredMaterials || [material],
        preferredRegions: extractedReqs.preferredRegions || (preferredRegion ? [preferredRegion] : []),
        requiredCertifications: extractedReqs.requiredCertifications || [],
        isProductionRun: extractedReqs.isProductionRun || (quantity ? quantity >= 100 : false),
        requiresMetal: extractedReqs.requiresMetal || false,
        requiresHighPrecision: extractedReqs.requiresHighPrecision || false,
        requiresFlexibility: extractedReqs.requiresFlexibility || false,
        industry: "",
        mechanicalNeeds: [],
        surfaceRequirement: "",
        projectSummary: extractedReqs.projectSummary || `${technology} part in ${material}`,
      };

      // Score using the filtered suppliers
      const suppliersToScore = filteredSuppliers.length >= 3 ? filteredSuppliers : allSuppliers;
      const matches = scoreSuppliers(suppliersToScore, requirements, 8);
      console.log(`[stl-match] Found ${matches.length} matches`);

      // Step 3: Ranking
      await updateSearchStatus(searchResultId, "ranking");

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
