import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface RelatedSearchesProps {
  currentTechnologies: string[];
  currentMaterials: string[];
  currentAreas: string[];
  currentKeywords?: string;
}

const RelatedSearches: React.FC<RelatedSearchesProps> = ({
  currentTechnologies,
  currentMaterials,
  currentAreas,
  currentKeywords
}) => {
  const navigate = useNavigate();

  const { data: relatedSearches, isLoading } = useQuery({
    queryKey: ['related-searches', currentTechnologies, currentMaterials, currentAreas],
    queryFn: async () => {
      // Fetch recent searches that share at least one filter with current search
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 14);

      const { data, error } = await supabase
        .from('search_analytics')
        .select('query, extracted_technologies, extracted_materials, extracted_regions')
        .gte('created_at', sevenDaysAgo.toISOString())
        .gt('results_count', 0)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error || !data || data.length === 0) {
        return [];
      }

      // Score each search by similarity to current search
      const scoredSearches = new Map<string, { score: number; query: string }>();

      data.forEach(row => {
        if (!row.query || row.query.trim().length < 5) return;
        
        // Skip if it's the same as current keywords
        if (currentKeywords && row.query.toLowerCase() === currentKeywords.toLowerCase()) return;

        const normalizedQuery = row.query.trim();
        
        // Skip if already processed
        if (scoredSearches.has(normalizedQuery.toLowerCase())) {
          const existing = scoredSearches.get(normalizedQuery.toLowerCase())!;
          existing.score += 1; // Boost for frequency
          return;
        }

        let score = 0;
        const rowTechs = (row.extracted_technologies || []) as string[];
        const rowMats = (row.extracted_materials || []) as string[];
        const rowRegions = (row.extracted_regions || []) as string[];

        // Score based on shared technologies
        const sharedTechs = rowTechs.filter(t => 
          currentTechnologies.some(ct => ct.toLowerCase() === t.toLowerCase())
        ).length;
        score += sharedTechs * 3;

        // Score based on shared materials
        const sharedMats = rowMats.filter(m => 
          currentMaterials.some(cm => cm.toLowerCase() === m.toLowerCase())
        ).length;
        score += sharedMats * 2;

        // Score based on shared regions
        const sharedRegions = rowRegions.filter(r => 
          currentAreas.some(ca => ca.toLowerCase() === r.toLowerCase())
        ).length;
        score += sharedRegions * 1.5;

        // Require at least some relation but not exact match
        const totalShared = sharedTechs + sharedMats + sharedRegions;
        const totalCurrent = currentTechnologies.length + currentMaterials.length + currentAreas.length;
        
        // Skip if identical to current search
        if (totalCurrent > 0 && totalShared === totalCurrent && 
            rowTechs.length === currentTechnologies.length &&
            rowMats.length === currentMaterials.length &&
            rowRegions.length === currentAreas.length) {
          return;
        }

        // Skip if no relation at all
        if (score === 0 && totalCurrent > 0) return;

        // Boost for having additional filters (diversity)
        const additionalFilters = (rowTechs.length + rowMats.length + rowRegions.length) - totalShared;
        if (additionalFilters > 0 && additionalFilters <= 3) {
          score += additionalFilters * 0.5;
        }

        if (score > 0 || totalCurrent === 0) {
          scoredSearches.set(normalizedQuery.toLowerCase(), { score, query: normalizedQuery });
        }
      });

      // Sort by score and get top 6
      const sortedSearches = Array.from(scoredSearches.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map(s => s.query);

      return sortedSearches;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const handleSearchClick = (query: string) => {
    navigate(`/keywordsearch?q=${encodeURIComponent(query)}`);
  };

  if (isLoading || !relatedSearches || relatedSearches.length === 0) {
    return null;
  }

  return (
    <div className="bg-muted/30 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">
          Users also searched for
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {relatedSearches.map((query, index) => (
          <Badge
            key={index}
            variant="outline"
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors px-3 py-1.5 text-sm max-w-[200px] truncate"
            onClick={() => handleSearchClick(query)}
            title={query}
          >
            <Search className="h-3 w-3 mr-1.5 flex-shrink-0" />
            <span className="truncate">{query}</span>
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default RelatedSearches;