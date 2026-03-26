import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ProjectRequirements {
  description: string;
  quantity?: string;
  preferredRegion?: string;
  // New needs-driven fields
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
  verified: boolean;
  premium: boolean;
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

interface UseSupplierMatchingReturn {
  isLoading: boolean;
  error: string | null;
  result: MatchingResult | null;
  matchProject: (project: ProjectRequirements) => Promise<MatchingResult | null>;
  reset: () => void;
}

export function useSupplierMatching(): UseSupplierMatchingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchingResult | null>(null);

  const matchProject = useCallback(async (project: ProjectRequirements): Promise<MatchingResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('ai-supplier-matching', {
        body: { project }
      });

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to match suppliers');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data as MatchingResult);
      return data as MatchingResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Could not match suppliers';
      setError(errorMessage);
      console.error('Supplier matching error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    result,
    matchProject,
    reset,
  };
}
