// Weighted scoring logic for supplier matching
// Ported from supabase/functions/ai-supplier-matching/index.ts
// Upgraded to use normalized relational data instead of legacy text arrays

import type { EnrichedSupplier, ExtractedRequirements, MatchResult } from "./types.js";

const WEIGHTS = {
  technology: 0.30,
  material: 0.25,
  location: 0.10,
  certification: 0.20,
  capacity: 0.15,
};

// Industry -> recommended technologies
const INDUSTRY_TO_TECHNOLOGIES: Record<string, string[]> = {
  automotive: ["SLS", "Multi Jet Fusion", "DMLS", "SLM"],
  aerospace: ["DMLS", "SLM", "SLS"],
  medical: ["SLA", "SLS", "DMLS"],
  food: ["SLS", "Multi Jet Fusion"],
  "consumer-electronics": ["SLS", "Multi Jet Fusion", "SLA", "Material Jetting"],
  industrial: ["SLS", "FDM", "Multi Jet Fusion", "DMLS"],
  architecture: ["SLA", "Material Jetting", "Binder Jetting", "FDM"],
  "consumer-goods": ["SLS", "Multi Jet Fusion", "SLA", "Material Jetting"],
};

// Industry -> recommended certifications
const INDUSTRY_TO_CERTIFICATIONS: Record<string, string[]> = {
  automotive: ["IATF 16949", "ISO 9001"],
  aerospace: ["AS9100", "NADCAP", "ISO 9001"],
  medical: ["ISO 13485", "FDA", "ISO 9001"],
  food: ["FDA", "ISO 9001"],
  "consumer-electronics": ["UL", "ISO 9001"],
  industrial: ["ISO 9001"],
};

// Application type -> technologies
const APPLICATION_TO_TECHNOLOGIES: Record<string, string[]> = {
  "functional-prototype": ["SLS", "Multi Jet Fusion", "FDM", "SLA"],
  "visual-prototype": ["SLA", "Material Jetting", "PolyJet", "DLP"],
  "end-use-production": ["SLS", "Multi Jet Fusion", "DMLS", "SLM", "SAF"],
  "tooling-fixtures": ["FDM", "SLS", "Multi Jet Fusion", "DMLS"],
  "replacement-part": ["SLS", "FDM", "DMLS", "Multi Jet Fusion"],
  "medical-device": ["SLA", "DMLS", "SLM"],
};

// Mechanical needs -> technologies
const MECHANICAL_TO_TECHNOLOGIES: Record<string, string[]> = {
  "high-strength": ["SLS", "Multi Jet Fusion", "DMLS", "SLM"],
  "heat-resistant": ["DMLS", "SLM"],
  "chemical-resistant": ["SLS"],
  "wear-resistant": ["SLS", "DMLS"],
  flexibility: ["SLS", "Multi Jet Fusion"],
  lightweight: ["SLS", "Multi Jet Fusion"],
  watertight: ["SLA", "SLS", "Multi Jet Fusion"],
};

// Surface -> technologies
const SURFACE_TO_TECHNOLOGIES: Record<string, string[]> = {
  standard: ["FDM", "SLS", "Multi Jet Fusion"],
  smooth: ["SLA", "Material Jetting", "DLP"],
  cosmetic: ["SLA", "Material Jetting", "PolyJet"],
  sterilizable: ["SLA", "DMLS", "SLM"],
  painted: ["SLS", "Multi Jet Fusion", "SLA", "FDM"],
};

// Size -> technologies
const SIZE_TO_TECHNOLOGIES: Record<string, string[]> = {
  small: ["SLA", "DLP", "Material Jetting", "DMLS", "SLS"],
  medium: ["SLS", "Multi Jet Fusion", "SLA", "FDM", "DMLS"],
  large: ["FDM", "SLS", "Binder Jetting"],
  "very-large": ["FDM"],
};

/** Build recommended technologies from structured project inputs */
export function buildRecommendedTechnologies(project: {
  industry?: string;
  applicationType?: string;
  mechanicalRequirements?: string[];
  surfaceFinish?: string;
  partSize?: string;
}): string[] {
  const techs: string[] = [];
  if (project.industry && INDUSTRY_TO_TECHNOLOGIES[project.industry]) {
    techs.push(...INDUSTRY_TO_TECHNOLOGIES[project.industry]);
  }
  if (project.applicationType && APPLICATION_TO_TECHNOLOGIES[project.applicationType]) {
    techs.push(...APPLICATION_TO_TECHNOLOGIES[project.applicationType]);
  }
  if (project.mechanicalRequirements) {
    for (const req of project.mechanicalRequirements) {
      if (MECHANICAL_TO_TECHNOLOGIES[req]) techs.push(...MECHANICAL_TO_TECHNOLOGIES[req]);
    }
  }
  if (project.surfaceFinish && SURFACE_TO_TECHNOLOGIES[project.surfaceFinish]) {
    techs.push(...SURFACE_TO_TECHNOLOGIES[project.surfaceFinish]);
  }
  if (project.partSize && SIZE_TO_TECHNOLOGIES[project.partSize]) {
    techs.push(...SIZE_TO_TECHNOLOGIES[project.partSize]);
  }
  return [...new Set(techs)];
}

/** Build recommended certifications from industry */
export function buildRecommendedCertifications(project: {
  industry?: string;
  certificationsNeeded?: string[];
}): string[] {
  const certs: string[] = [];
  if (project.industry && INDUSTRY_TO_CERTIFICATIONS[project.industry]) {
    certs.push(...INDUSTRY_TO_CERTIFICATIONS[project.industry]);
  }
  if (project.certificationsNeeded) {
    certs.push(...project.certificationsNeeded.filter((c) => c !== "none"));
  }
  return [...new Set(certs)];
}

/** Strip non-alphanumerics so "PA-12" and "PA12 Nylon" both reduce to "pa12"-containing keys */
export function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Fuzzy match: check if two tech/material names refer to the same thing */
export function fuzzyMatch(a: string, b: string): boolean {
  const la = normalizeKey(a);
  const lb = normalizeKey(b);
  if (!la || !lb) return false;
  return la.includes(lb) || lb.includes(la);
}

/** Score and rank suppliers against extracted requirements.
 *  `maxResults` is optional — omit (or pass `undefined`) to return every
 *  supplier with a positive score. */
export function scoreSuppliers(
  suppliers: EnrichedSupplier[],
  requirements: ExtractedRequirements,
  maxResults?: number
): MatchResult[] {
  const matches: MatchResult[] = [];

  for (const supplier of suppliers) {
    // Technology score: match against supplier.technologies[].name
    let techScore = 0;
    const matchedTechs: string[] = [];
    if (requirements.requiredTechnologies.length > 0) {
      for (const reqTech of requirements.requiredTechnologies) {
        const match = supplier.technologies.find((t) => fuzzyMatch(t.name, reqTech));
        if (match) {
          matchedTechs.push(match.name);
          techScore += 1 / requirements.requiredTechnologies.length;
        }
      }
    } else {
      techScore = 0;
    }

    // Material score: match against supplier.materials[].name
    let materialScore = 0;
    const matchedMats: string[] = [];
    if (requirements.requiredMaterials.length > 0) {
      for (const reqMat of requirements.requiredMaterials) {
        const match = supplier.materials.find((m) => fuzzyMatch(m.name, reqMat));
        if (match) {
          matchedMats.push(match.name);
          materialScore += 1 / requirements.requiredMaterials.length;
        }
      }
    } else {
      materialScore = 0;
    }

    // Location score: match against supplier.country.region or location_country
    let locationScore = 0;
    if (requirements.preferredRegions.length > 0) {
      const supplierRegion = supplier.country?.region || supplier.region || "";
      const supplierCountry = supplier.location_country || "";
      for (const region of requirements.preferredRegions) {
        if (fuzzyMatch(supplierRegion, region) || fuzzyMatch(supplierCountry, region)) {
          locationScore = 1;
          break;
        } else if (supplierRegion === "Global") {
          locationScore = 0.5; // Global = partial match, not perfect
        }
      }
    } else {
      locationScore = 0.3;
    }

    // Certification score: match against supplier.certifications[].name
    let certificationScore = 0;
    const matchedCerts: string[] = [];
    if (requirements.requiredCertifications.length > 0) {
      for (const reqCert of requirements.requiredCertifications) {
        const match = supplier.certifications.find((c) => fuzzyMatch(c.name, reqCert));
        if (match) {
          matchedCerts.push(match.name);
          certificationScore += 1 / requirements.requiredCertifications.length;
        }
      }
    } else {
      certificationScore = (supplier.verified ? 0.5 : 0) + (supplier.premium ? 0.5 : 0);
    }

    // Capacity score
    let capacityScore = 0.3;
    if (requirements.isProductionRun) {
      const productionTechs = ["Multi Jet Fusion", "SLS", "SAF"];
      if (supplier.technologies.some((t) => productionTechs.some((pt) => fuzzyMatch(t.name, pt)))) {
        capacityScore = 1;
      }
    }

    // Weighted total + small trust bonus so verified/premium suppliers win
    // ties without overpowering the price sort applied client-side.
    const trustBonus = (supplier.verified ? 0.05 : 0) + (supplier.premium ? 0.05 : 0);
    const totalScore =
      techScore * WEIGHTS.technology +
      materialScore * WEIGHTS.material +
      locationScore * WEIGHTS.location +
      certificationScore * WEIGHTS.certification +
      capacityScore * WEIGHTS.capacity +
      trustBonus;

    // Include every supplier with a positive score. When the user specifies a
    // tech/material, the pre-filter in stl-supplier-match.ts already narrows
    // the pool; a strict overlap check here just drops otherwise-valid
    // suppliers whenever the user picks "any".
    if (totalScore > 0) {
      matches.push({
        supplier: {
          supplier_id: supplier.supplier_id,
          name: supplier.name,
          website: supplier.website,
          description: supplier.description,
          technologies: supplier.technologies.map((t) => t.name),
          materials: supplier.materials.map((m) => m.name),
          region: supplier.country?.region || supplier.region,
          location_city: supplier.location_city,
          location_country: supplier.location_country,
          location_lat: supplier.location_lat,
          location_lng: supplier.location_lng,
          verified: supplier.verified,
          premium: supplier.premium,
          is_partner: supplier.is_partner,
          instant_quote_url: supplier.instant_quote_url,
          logo_url: supplier.logo_url,
        },
        score: Math.round(totalScore * 100),
        matchDetails: {
          technologyScore: Math.round(techScore * 100),
          materialScore: Math.round(materialScore * 100),
          locationScore: Math.round(locationScore * 100),
          certificationScore: Math.round(certificationScore * 100),
          overallExplanation: "",
          matchedTechnologies: [...new Set(matchedTechs)],
          matchedMaterials: [...new Set(matchedMats)],
          matchedCertifications: [...new Set(matchedCerts)],
        },
      });
    }
  }

  // Paying partners pinned to top, ahead of raw score, so the slice never
  // drops them. Within each tier (partner / non-partner) score decides order.
  matches.sort((a, b) => {
    if (a.supplier.is_partner !== b.supplier.is_partner) {
      return a.supplier.is_partner ? -1 : 1;
    }
    return b.score - a.score;
  });
  return maxResults ? matches.slice(0, maxResults) : matches;
}
