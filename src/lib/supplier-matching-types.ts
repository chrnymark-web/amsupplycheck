export interface ProjectRequirements {
  description: string;
  quantity?: string;
  preferredRegion?: string;
  applicationType?: string;
  industry?: string;
  mechanicalRequirements?: string[];
  surfaceFinish?: string;
  partSize?: string;
  certificationsNeeded?: string[];
}

export interface MatchedSupplier {
  supplier_id: string;
  name: string;
  website: string | null;
  description: string | null;
  technologies: string[] | null;
  materials: string[] | null;
  region: string | null;
  location_city: string | null;
  location_country: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  verified: boolean;
  premium: boolean;
  is_partner: boolean;
  instant_quote_url: string | null;
  logo_url: string | null;
}

export interface MatchResult {
  supplier: MatchedSupplier;
  score: number;
  matchDetails: {
    technologyScore: number;
    materialScore: number;
    locationScore: number;
    certificationScore?: number;
    overallExplanation: string;
    matchedTechnologies: string[];
    matchedMaterials: string[];
    matchedCertifications?: string[];
  };
}

export interface TechnologyRationale {
  recommendedTechnologies: string[];
  recommendedMaterials: string[];
  technologyExplanation: string;
  materialExplanation: string;
  whyTheseTechnologies: string;
}

export interface MatchingResult {
  requirements: {
    requiredTechnologies: string[];
    requiredMaterials: string[];
    preferredRegions: string[];
    requiredCertifications?: string[];
    isProductionRun: boolean;
    requiresMetal: boolean;
    requiresHighPrecision: boolean;
    projectSummary: string;
    industry?: string;
    mechanicalNeeds?: string[];
    surfaceRequirement?: string;
  };
  matches: MatchResult[];
  totalSuppliersAnalyzed: number;
  technologyRationale?: TechnologyRationale | null;
}

export type SearchStatus =
  | "idle"
  | "pending"
  | "analyzing"
  | "matching"
  | "ranking"
  | "completed"
  | "failed";
