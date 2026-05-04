// Claude Sonnet wrapper for Trigger.dev tasks
// Uses @anthropic-ai/sdk directly (not Lovable gateway)

import Anthropic from "@anthropic-ai/sdk";
import { buildSignature, readExplanationCache, writeExplanationCache } from "./explanation-cache.js";
import type { ExtractedRequirements, MatchResult, TechnologyRationale, ProjectRequirements } from "./types.js";

const MODEL = "claude-haiku-4-5-20251001";

function getClient(): Anthropic {
  // 30s per-request timeout bounds hanging Claude API calls. Without this the
  // SDK default (10 min) lets a silent hang block the Trigger.dev task long
  // enough to strand the UI (see use-trigger-stl-match watchdog).
  return new Anthropic({ timeout: 30_000, maxRetries: 1 });
}

/** Extract structured requirements from project description using Claude tool_use */
export async function analyzeRequirements(
  project: ProjectRequirements,
  recommendedTechs: string[],
  recommendedCerts: string[]
): Promise<ExtractedRequirements> {
  const client = getClient();

  const prompt = `Analyze this 3D printing project and extract specific requirements.

PROJECT DESCRIPTION:
${project.description}

STRUCTURED USER INPUTS:
${project.industry ? `INDUSTRY: ${project.industry}` : ""}
${project.applicationType ? `APPLICATION TYPE: ${project.applicationType}` : ""}
${project.mechanicalRequirements?.length ? `MECHANICAL REQUIREMENTS: ${project.mechanicalRequirements.join(", ")}` : ""}
${project.surfaceFinish ? `SURFACE FINISH: ${project.surfaceFinish}` : ""}
${project.partSize ? `PART SIZE: ${project.partSize}` : ""}
${project.certificationsNeeded?.length ? `REQUIRED CERTIFICATIONS: ${project.certificationsNeeded.join(", ")}` : ""}
${project.quantity ? `QUANTITY: ${project.quantity}` : ""}
${project.preferredRegion ? `PREFERRED REGION: ${project.preferredRegion}` : ""}

RECOMMENDED TECHNOLOGIES (based on user inputs): ${recommendedTechs.join(", ") || "Not specified"}

AVAILABLE TECHNOLOGIES: FDM/FFF, SLA, SLS, Multi Jet Fusion, DMLS, SLM, Material Jetting, Binder Jetting, DLP, SAF, Direct Metal Printing, PolyJet
AVAILABLE MATERIALS: PLA, ABS, PETG, Nylon PA-12, PA-11, TPU, Polycarbonate, Carbon Fiber Reinforced, Titanium Ti-6Al-4V, Aluminum AlSi10Mg, Stainless Steel 316L, Inconel 718, Clear Resin, Tough Resin, PEEK, ULTEM
AVAILABLE REGIONS: Scandinavia, Western Europe, Central Europe, UK & Ireland, North America, Asia Pacific, Global

Extract the requirements. Prioritize the recommended technologies if they match the project needs.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: "You are an expert 3D printing consultant. Analyze project requirements and extract structured data. Use the structured user inputs to inform your technology and material recommendations.",
    messages: [{ role: "user", content: prompt }],
    tools: [
      {
        name: "extract_requirements",
        description: "Extract structured project requirements for supplier matching",
        input_schema: {
          type: "object" as const,
          properties: {
            requiredTechnologies: { type: "array", items: { type: "string" }, description: "Required 3D printing technologies" },
            requiredMaterials: { type: "array", items: { type: "string" }, description: "Required materials" },
            preferredRegions: { type: "array", items: { type: "string" }, description: "Preferred geographic regions" },
            requiredCertifications: { type: "array", items: { type: "string" }, description: "Required certifications" },
            isProductionRun: { type: "boolean", description: "Whether this is a production run (100+ units)" },
            requiresMetal: { type: "boolean", description: "Whether metal 3D printing is required" },
            requiresHighPrecision: { type: "boolean", description: "Whether high precision is required" },
            requiresFlexibility: { type: "boolean", description: "Whether flexible materials are needed" },
            industry: { type: "string", description: "The industry sector" },
            mechanicalNeeds: { type: "array", items: { type: "string" }, description: "Mechanical requirements" },
            surfaceRequirement: { type: "string", description: "Surface finish requirement" },
            projectSummary: { type: "string", description: "Brief 1-2 sentence project summary" },
          },
          required: ["requiredTechnologies", "requiredMaterials", "preferredRegions", "projectSummary"],
        },
      },
    ],
    tool_choice: { type: "tool" as const, name: "extract_requirements" },
  });

  // Extract tool result
  const toolBlock = response.content.find((b: any) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") {
    throw new Error("Claude did not return a tool_use response");
  }

  const result = toolBlock.input as any;

  // Merge AI-extracted certifications with user-specified ones
  if (recommendedCerts.length > 0) {
    result.requiredCertifications = [
      ...new Set([...(result.requiredCertifications || []), ...recommendedCerts]),
    ];
  }

  return {
    requiredTechnologies: result.requiredTechnologies || [],
    requiredMaterials: result.requiredMaterials || [],
    preferredRegions: result.preferredRegions || [],
    requiredCertifications: result.requiredCertifications || [],
    isProductionRun: result.isProductionRun || false,
    requiresMetal: result.requiresMetal || false,
    requiresHighPrecision: result.requiresHighPrecision || false,
    requiresFlexibility: result.requiresFlexibility || false,
    industry: result.industry || project.industry || "",
    mechanicalNeeds: result.mechanicalNeeds || [],
    surfaceRequirement: result.surfaceRequirement || "",
    projectSummary: result.projectSummary || "",
  };
}

/** Generate match explanations for top suppliers (with persistent cache) */
export async function generateExplanations(
  matches: MatchResult[],
  requirements: ExtractedRequirements
): Promise<string[]> {
  if (matches.length === 0) return [];

  // Look up every match in the cache first. Misses get sent to Claude in a
  // single batched call to preserve the original "20 explanations, one prompt"
  // pattern — going one-by-one would multiply request count.
  const signatures = matches.map((m) => buildSignature(m, requirements, MODEL));
  const cached = await readExplanationCache(signatures).catch((e) => {
    console.error("[explanations] cache read error:", e);
    return new Map<string, string>();
  });

  const result: string[] = new Array(matches.length).fill("");
  const missIndices: number[] = [];
  for (let i = 0; i < matches.length; i++) {
    const hit = cached.get(signatures[i]);
    if (hit) {
      result[i] = hit;
    } else {
      missIndices.push(i);
    }
  }

  console.log(`[explanations] cache: ${matches.length - missIndices.length}/${matches.length} hits`);

  if (missIndices.length === 0) return result;

  const missMatches = missIndices.map((i) => matches[i]);
  const client = getClient();

  const prompt = `Based on this 3D printing project:
"${requirements.projectSummary}"

Industry: ${requirements.industry || "Not specified"}
Mechanical needs: ${requirements.mechanicalNeeds?.join(", ") || "Not specified"}

Generate brief, friendly explanations (1-2 sentences each in English) for why each supplier is a good match:

${missMatches.map((m, i) => `${i + 1}. ${m.supplier.name} - Score: ${m.score}%, Matched: ${m.matchDetails.matchedTechnologies.join(", ")}, ${m.matchDetails.matchedMaterials.join(", ")}${m.matchDetails.matchedCertifications.length ? `, Certs: ${m.matchDetails.matchedCertifications.join(", ")}` : ""}`).join("\n")}`;

  const response = await client.messages.create({
    model: MODEL,
    // 1024 was right at the budget for 20 × 1–2 sentences and would silently
    // truncate mid tool_use, returning an empty array with no error. Headroom
    // here is cheaper than a stuck "Generating match explanations…" spinner.
    max_tokens: 4096,
    system: "You are a helpful assistant. Write in English. Be concise and friendly.",
    messages: [{ role: "user", content: prompt }],
    tools: [
      {
        name: "provide_explanations",
        description: "Provide match explanations for suppliers",
        input_schema: {
          type: "object" as const,
          properties: {
            explanations: {
              type: "array",
              items: { type: "string" },
              description: "Array of explanation strings, one per supplier in order",
            },
          },
          required: ["explanations"],
        },
      },
    ],
    tool_choice: { type: "tool" as const, name: "provide_explanations" },
  });

  const toolBlock = response.content.find((b: any) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") return result;

  const fresh = ((toolBlock.input as any).explanations || []) as string[];
  const toCache: { signature: string; explanation: string; model: string }[] = [];
  for (let i = 0; i < missIndices.length; i++) {
    const explanation = fresh[i];
    if (!explanation) continue;
    const idx = missIndices[i];
    result[idx] = explanation;
    toCache.push({ signature: signatures[idx], explanation, model: MODEL });
  }

  // Fire-and-forget — don't block the user's results on a cache write.
  writeExplanationCache(toCache).catch((e) =>
    console.error("[explanations] cache write error:", e)
  );

  return result;
}

/** Generate technology rationale explaining WHY specific technologies are recommended */
export async function generateTechnologyRationale(
  requirements: ExtractedRequirements
): Promise<TechnologyRationale | null> {
  const client = getClient();

  const prompt = `Based on this 3D printing project, explain WHY specific technologies and materials are recommended.

PROJECT: "${requirements.projectSummary}"
INDUSTRY: ${requirements.industry || "Not specified"}
MECHANICAL NEEDS: ${requirements.mechanicalNeeds?.join(", ") || "Not specified"}
SURFACE REQUIREMENT: ${requirements.surfaceRequirement || "Not specified"}

RECOMMENDED TECHNOLOGIES: ${requirements.requiredTechnologies?.join(", ") || "Not specified"}
RECOMMENDED MATERIALS: ${requirements.requiredMaterials?.join(", ") || "Not specified"}

Write in Danish. Be educational and friendly. Explain for someone who may not know about 3D printing.`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: "You are an expert 3D printing consultant who explains complex technology choices in simple terms. Write in Danish.",
    messages: [{ role: "user", content: prompt }],
    tools: [
      {
        name: "provide_rationale",
        description: "Provide technology and material rationale",
        input_schema: {
          type: "object" as const,
          properties: {
            recommendedTechnologies: { type: "array", items: { type: "string" }, description: "Top 2-3 recommended technologies" },
            recommendedMaterials: { type: "array", items: { type: "string" }, description: "Top 2-3 recommended materials" },
            technologyExplanation: { type: "string", description: "Short explanation of why these technologies are best. In Danish." },
            materialExplanation: { type: "string", description: "Short explanation of why these materials are best. In Danish." },
            whyTheseTechnologies: { type: "string", description: "A friendly 2-3 sentence explanation for non-experts. In Danish." },
          },
          required: ["recommendedTechnologies", "recommendedMaterials", "technologyExplanation", "materialExplanation", "whyTheseTechnologies"],
        },
      },
    ],
    tool_choice: { type: "tool" as const, name: "provide_rationale" },
  });

  const toolBlock = response.content.find((b: any) => b.type === "tool_use");
  if (!toolBlock || toolBlock.type !== "tool_use") return null;

  return toolBlock.input as TechnologyRationale;
}
