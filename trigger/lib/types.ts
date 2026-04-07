// Shared types for Trigger.dev tasks

export interface EnrichedSupplier {
  id: string;
  supplier_id: string;
  name: string;
  website: string | null;
  description: string | null;
  location_city: string | null;
  location_country: string | null;
  region: string | null;
  verified: boolean;
  premium: boolean;
  logo_url: string | null;
  technologies: { id: string; name: string; slug: string; category: string | null }[];
  materials: { id: string; name: string; slug: string; category: string | null }[];
  certifications: { id: string; name: string; slug: string }[];
  tags: { id: string; name: string; slug: string; category: string | null }[];
  country: { id: string; name: string; code: string | null; region: string | null } | null;
}

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

export interface ExtractedRequirements {
  requiredTechnologies: string[];
  requiredMaterials: string[];
  preferredRegions: string[];
  requiredCertifications: string[];
  isProductionRun: boolean;
  requiresMetal: boolean;
  requiresHighPrecision: boolean;
  requiresFlexibility: boolean;
  industry: string;
  mechanicalNeeds: string[];
  surfaceRequirement: string;
  projectSummary: string;
}

export interface MatchResult {
  supplier: {
    supplier_id: string;
    name: string;
    website: string | null;
    description: string | null;
    technologies: string[];
    materials: string[];
    region: string | null;
    location_city: string | null;
    location_country: string | null;
    verified: boolean;
    premium: boolean;
    logo_url: string | null;
  };
  score: number;
  matchDetails: {
    technologyScore: number;
    materialScore: number;
    locationScore: number;
    certificationScore: number;
    overallExplanation: string;
    matchedTechnologies: string[];
    matchedMaterials: string[];
    matchedCertifications: string[];
  };
}

export interface TechnologyRationale {
  recommendedTechnologies: string[];
  recommendedMaterials: string[];
  technologyExplanation: string;
  materialExplanation: string;
  whyTheseTechnologies: string;
}

export interface SupplierMatchOutput {
  requirements: ExtractedRequirements;
  matches: MatchResult[];
  totalSuppliersAnalyzed: number;
  technologyRationale: TechnologyRationale | null;
}

export interface STLMetrics {
  volumeCm3: number;
  surfaceAreaCm2: number;
  boundingBox: { x: number; y: number; z: number };
  triangleCount: number;
}
