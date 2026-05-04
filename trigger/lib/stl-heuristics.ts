// Deterministic requirement extraction for the STL match flow.
// The previous implementation called Claude to "extract" requirements that are
// in fact already known from the user's dropdown selections, with simple
// fallbacks for unspecified fields. AI added 3-5s of latency on the critical
// path without changing the matching outcome — scoring (lib/scoring.ts) only
// reads requiredTechnologies, requiredMaterials, preferredRegions, and
// isProductionRun. The other flags exist for type compatibility downstream.

import type { ExtractedRequirements, STLMetrics } from "./types.js";

const FLEX_KEYWORDS = ["tpu", "tpe", "flex", "elastic", "rubber"];
const METAL_KEYWORDS = ["titanium", "aluminum", "aluminium", "steel", "inconel", "metal", "alsi", "ti-6al"];

// Volume-based technology buckets. Picked to match the AVAILABLE TECHNOLOGIES
// list in claude-client.ts so scoring (fuzzyMatch) finds the same names.
const SMALL_PART_TECHS = ["SLA", "DLP", "Material Jetting", "PolyJet"];
const MEDIUM_PART_TECHS = ["SLS", "Multi Jet Fusion", "FDM/FFF"];
const LARGE_PART_TECHS = ["FDM/FFF", "SLS"];

const SAFE_DEFAULT_MATERIALS = ["PLA", "PETG", "Nylon PA-12"];

export function extractRequirementsFromStl(
  metrics: STLMetrics,
  options: {
    technology?: string;
    material?: string;
    quantity?: number;
    preferredRegion?: string;
  }
): ExtractedRequirements {
  const { technology, material, quantity, preferredRegion } = options;
  const { volumeCm3, triangleCount, boundingBox } = metrics;

  // Technology: explicit user pick wins; otherwise size-based heuristic.
  let requiredTechnologies: string[];
  if (technology) {
    requiredTechnologies = [technology];
  } else if (volumeCm3 < 10) {
    requiredTechnologies = SMALL_PART_TECHS;
  } else if (volumeCm3 > 500) {
    requiredTechnologies = LARGE_PART_TECHS;
  } else {
    requiredTechnologies = MEDIUM_PART_TECHS;
  }

  const requiredMaterials = material ? [material] : SAFE_DEFAULT_MATERIALS;

  const lowerMaterial = (material || "").toLowerCase();
  const requiresFlexibility = FLEX_KEYWORDS.some((k) => lowerMaterial.includes(k));
  const requiresMetal = METAL_KEYWORDS.some((k) => lowerMaterial.includes(k));

  // High precision: small parts with dense triangulation, OR very small bbox.
  const minBbox = Math.min(boundingBox.x, boundingBox.y, boundingBox.z);
  const triangleDensity = volumeCm3 > 0 ? triangleCount / volumeCm3 : 0;
  const requiresHighPrecision = minBbox < 30 || triangleDensity > 200;

  const isProductionRun = quantity != null && quantity >= 100;

  // Project summary mirrors the previous AI fallback shape so downstream
  // explanation prompts have something to anchor on.
  const summaryParts: string[] = [];
  summaryParts.push(`${volumeCm3.toFixed(0)} cm³ part`);
  summaryParts.push(`${boundingBox.x.toFixed(0)}×${boundingBox.y.toFixed(0)}×${boundingBox.z.toFixed(0)} mm`);
  if (technology) summaryParts.push(`for ${technology}`);
  if (material) summaryParts.push(`in ${material}`);
  if (isProductionRun) summaryParts.push(`production run (${quantity} units)`);
  const projectSummary = summaryParts.join(", ");

  return {
    requiredTechnologies,
    requiredMaterials,
    preferredRegions: preferredRegion ? [preferredRegion] : [],
    requiredCertifications: [],
    isProductionRun,
    requiresMetal,
    requiresHighPrecision,
    requiresFlexibility,
    industry: "",
    mechanicalNeeds: [],
    surfaceRequirement: "",
    projectSummary,
  };
}
