import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Sparkles, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface TrendingItem {
  name: string;
  count: number;
  type: 'technology' | 'material' | 'region';
}

const TrendingSearches: React.FC = () => {
  const navigate = useNavigate();

  const { data: trendingData, isLoading } = useQuery({
    queryKey: ['trending-searches'],
    queryFn: async () => {
      // Fetch recent search analytics (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('search_analytics')
        .select('extracted_technologies, extracted_materials, extracted_regions')
        .gte('created_at', sevenDaysAgo.toISOString())
        .limit(500);

      if (error) {
        console.error('Error fetching trending searches:', error);
        return { technologies: [], materials: [], regions: [] };
      }

      // Count technologies
      const techCounts = new Map<string, number>();
      const matCounts = new Map<string, number>();
      const regionCounts = new Map<string, number>();

      data?.forEach(row => {
        (row.extracted_technologies || []).forEach((t: string) => {
          techCounts.set(t, (techCounts.get(t) || 0) + 1);
        });
        (row.extracted_materials || []).forEach((m: string) => {
          matCounts.set(m, (matCounts.get(m) || 0) + 1);
        });
        (row.extracted_regions || []).forEach((r: string) => {
          regionCounts.set(r, (regionCounts.get(r) || 0) + 1);
        });
      });

      // Get top items
      const topTech = Array.from(techCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count, type: 'technology' as const }));

      const topMat = Array.from(matCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count, type: 'material' as const }));

      const topRegions = Array.from(regionCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([name, count]) => ({ name, count, type: 'region' as const }));

      return { 
        technologies: topTech, 
        materials: topMat, 
        regions: topRegions,
        totalSearches: data?.length || 0
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const handleItemClick = (item: TrendingItem) => {
    const searchParams = new URLSearchParams();
    if (item.type === 'technology') {
      searchParams.set('technologies', item.name);
    } else if (item.type === 'material') {
      searchParams.set('materials', item.name);
    } else if (item.type === 'region') {
      searchParams.set('areas', item.name);
    }
    navigate(`/search?${searchParams.toString()}`);
  };

  // Don't render if no data or still loading
  if (isLoading) {
    return null;
  }

  const hasData = 
    (trendingData?.technologies?.length || 0) > 0 || 
    (trendingData?.materials?.length || 0) > 0 ||
    (trendingData?.regions?.length || 0) > 0;

  if (!hasData) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 animate-fade-in">
      <div className="flex items-center justify-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">Trending This Week</span>
        <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
      </div>
      
      <div className="flex flex-wrap justify-center gap-2">
        {trendingData?.technologies?.map((item) => (
          <Badge
            key={`tech-${item.name}`}
            variant="secondary"
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-3 py-1.5 text-sm group"
            onClick={() => handleItemClick(item)}
          >
            <Sparkles className="h-3 w-3 mr-1.5 text-primary group-hover:text-primary-foreground" />
            {item.name}
            <span className="ml-1.5 text-xs opacity-60">({item.count})</span>
          </Badge>
        ))}
        
        {trendingData?.materials?.map((item) => (
          <Badge
            key={`mat-${item.name}`}
            variant="outline"
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors px-3 py-1.5 text-sm"
            onClick={() => handleItemClick(item)}
          >
            {item.name}
            <span className="ml-1.5 text-xs opacity-60">({item.count})</span>
          </Badge>
        ))}
        
        {trendingData?.regions?.map((item) => (
          <Badge
            key={`region-${item.name}`}
            variant="outline"
            className="cursor-pointer hover:bg-accent hover:text-accent-foreground hover:border-accent transition-colors px-3 py-1.5 text-sm border-dashed"
            onClick={() => handleItemClick(item)}
          >
            🌍 {item.name}
            <span className="ml-1.5 text-xs opacity-60">({item.count})</span>
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default TrendingSearches;