import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AISearchFilters {
  technologies: string[];
  materials: string[];
  areas: string[];
  certifications: string[];
  productionVolume: string;
  urgency: string;
  keywords: string;
  explanation: string;
  confidence: number;
  originalQuery: string;
}

export interface UseAISearchResult {
  isLoading: boolean;
  error: string | null;
  filters: AISearchFilters | null;
  search: (query: string) => Promise<AISearchFilters | null>;
  debouncedSearch: (query: string) => void;
  reset: () => void;
  removeFilter: (type: 'technologies' | 'materials' | 'areas' | 'certifications', value: string) => void;
}

// Simple cache for recent searches
const searchCache = new Map<string, { filters: AISearchFilters; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function useAISearch(): UseAISearchResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AISearchFilters | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const search = useCallback(async (query: string): Promise<AISearchFilters | null> => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return null;
    }

    const normalizedQuery = query.trim().toLowerCase();

    // Check cache first
    const cached = searchCache.get(normalizedQuery);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Using cached search result');
      setFilters(cached.filters);
      return cached.filters;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-search', {
        body: { query }
      });

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        // Handle specific error types
        if (data.fallback) {
          toast.info('AI search unavailable, using keyword search');
          const fallbackFilters: AISearchFilters = {
            technologies: [],
            materials: [],
            areas: [],
            certifications: [],
            productionVolume: '',
            urgency: 'standard',
            keywords: query,
            explanation: 'Searching by keywords',
            confidence: 0,
            originalQuery: query
          };
          setFilters(fallbackFilters);
          return fallbackFilters;
        }
        throw new Error(data.error);
      }

      const aiFilters: AISearchFilters = {
        technologies: data.technologies || [],
        materials: data.materials || [],
        areas: data.areas || [],
        certifications: data.certifications || [],
        productionVolume: data.productionVolume || '',
        urgency: data.urgency || 'standard',
        keywords: data.keywords || '',
        explanation: data.explanation || '',
        confidence: data.confidence || 0,
        originalQuery: data.originalQuery || query
      };
      
      setFilters(aiFilters);
      
      // Cache the result
      searchCache.set(normalizedQuery, { filters: aiFilters, timestamp: Date.now() });
      
      // Don't show toast - the "AI understood" box in AISearchInput handles this

      return aiFilters;
    } catch (err) {
      // Don't show error if request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        return null;
      }
      const errorMessage = err instanceof Error ? err.message : 'AI search failed';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback((query: string) => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't search for very short queries
    if (query.trim().length < 3) {
      return;
    }

    // Set new timer (800ms debounce for smoother typing)
    debounceTimerRef.current = setTimeout(() => {
      search(query);
    }, 800);
  }, [search]);

  const removeFilter = useCallback((type: 'technologies' | 'materials' | 'areas' | 'certifications', value: string) => {
    if (!filters) return;
    
    setFilters(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        [type]: prev[type].filter(v => v !== value)
      };
    });
  }, [filters]);

  const reset = useCallback(() => {
    setFilters(null);
    setError(null);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    isLoading,
    error,
    filters,
    search,
    debouncedSearch,
    reset,
    removeFilter
  };
}
