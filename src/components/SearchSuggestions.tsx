import { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, Clock, X, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const RECENT_SEARCHES_KEY = 'supplycheck_recent_searches';
const MAX_RECENT_SEARCHES = 5;

interface SearchSuggestionsProps {
  query: string;
  isOpen: boolean;
  onSelect: (suggestion: string) => void;
  onClose: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
}

// Fallback static queries (used when no analytics data)
const staticPopularQueries = [
  "Metal 3D printing services in Germany",
  "SLS nylon parts for aerospace",
  "Rapid prototyping titanium medical devices",
  "Large format FDM printing USA",
  "Carbon fiber reinforced parts Europe",
  "High temperature resistant polymers",
  "Aluminum powder bed fusion",
  "Low volume production stainless steel",
  "Certified aerospace suppliers",
  "MJF HP parts UK",
];

// Helper functions for localStorage
const getRecentSearches = (): string[] => {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRecentSearch = (search: string): string[] => {
  try {
    const existing = getRecentSearches();
    const filtered = existing.filter(s => s.toLowerCase() !== search.toLowerCase());
    const updated = [search, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
};

const removeRecentSearch = (search: string): string[] => {
  try {
    const existing = getRecentSearches();
    const updated = existing.filter(s => s !== search);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
};

const clearAllRecentSearches = (): void => {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore errors
  }
};

// Hook to fetch popular queries from analytics
const usePopularQueries = () => {
  return useQuery({
    queryKey: ['popular-search-queries'],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('search_analytics')
        .select('query')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(200);

      if (error || !data || data.length === 0) {
        return staticPopularQueries;
      }

      // Count query occurrences
      const queryCounts = new Map<string, number>();
      data.forEach(row => {
        if (row.query && row.query.trim().length > 5) {
          const normalizedQuery = row.query.trim();
          queryCounts.set(normalizedQuery, (queryCounts.get(normalizedQuery) || 0) + 1);
        }
      });

      // Get top queries by frequency
      const topQueries = Array.from(queryCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([query]) => query);

      // If we have less than 5 analytics queries, fill with static ones
      if (topQueries.length < 5) {
        const remaining = staticPopularQueries.filter(
          sq => !topQueries.some(tq => tq.toLowerCase() === sq.toLowerCase())
        );
        return [...topQueries, ...remaining.slice(0, 10 - topQueries.length)];
      }

      return topQueries;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

// Export for use in parent components
export const getPopularQueries = () => staticPopularQueries;

export function SearchSuggestions({ query, isOpen, onSelect, onClose, selectedIndex, onSelectedIndexChange }: SearchSuggestionsProps) {
  const { toast } = useToast();
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
  // Fetch popular queries from analytics
  const { data: popularQueries = staticPopularQueries } = usePopularQueries();

  // Handle open/close animation
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to trigger CSS transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, [isOpen]);

  useEffect(() => {
    if (query.trim().length > 0) {
      const lowerQuery = query.toLowerCase();
      const filtered = popularQueries.filter(s => 
        s.toLowerCase().includes(lowerQuery)
      ).slice(0, 5);
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
    onSelectedIndexChange(-1);
  }, [query, popularQueries]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSelect = (suggestion: string) => {
    const updated = saveRecentSearch(suggestion);
    setRecentSearches(updated);
    onSelect(suggestion);
  };

  const handleRemoveRecent = (e: React.MouseEvent, search: string) => {
    e.stopPropagation();
    const updated = removeRecentSearch(search);
    setRecentSearches(updated);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearAllRecentSearches();
    setRecentSearches([]);
    toast({
      title: "Search history cleared",
      description: "Your recent searches have been removed.",
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const suggestions = query.trim() ? filteredSuggestions : popularQueries.slice(0, 5);
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      onSelectedIndexChange(selectedIndex < suggestions.length - 1 ? selectedIndex + 1 : selectedIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      onSelectedIndexChange(selectedIndex > 0 ? selectedIndex - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!shouldRender) return null;

  const showPopular = query.trim().length === 0;
  const suggestions = showPopular ? popularQueries.slice(0, 3) : filteredSuggestions.slice(0, 4);

  if (!showPopular && suggestions.length === 0 && !isVisible) return null;

  return (
    <div 
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl overflow-hidden transition-all duration-200 ease-out"
      style={{ 
        backgroundColor: '#ffffff', 
        zIndex: 9999,
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        transformOrigin: 'top center',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-8px)',
      }}
      onKeyDown={handleKeyDown}
    >
      {showPopular && (
        <div 
          className="px-4 py-2.5 text-xs font-semibold text-gray-500 flex items-center gap-2"
          style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Popular searches
        </div>
      )}
      
      <ul className="py-1" style={{ backgroundColor: '#ffffff' }}>
        {suggestions.map((suggestion, index) => (
          <li key={suggestion}>
            <button
              ref={(el) => { itemRefs.current[index] = el; }}
              type="button"
              className={`w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-all duration-150 ${
                index === selectedIndex 
                  ? 'bg-primary/10 text-primary scale-[1.01] shadow-sm' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => handleSelect(suggestion)}
              onMouseEnter={() => onSelectedIndexChange(index)}
            >
              <Search className={`h-4 w-4 flex-shrink-0 transition-colors ${index === selectedIndex ? 'text-primary' : 'text-gray-400'}`} />
              <span className="truncate">{suggestion}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Bottom padding when no recent searches */}
      {showPopular && recentSearches.length === 0 && (
        <div className="pb-2" style={{ backgroundColor: '#ffffff' }} />
      )}
      
      {showPopular && recentSearches.length > 0 && (
        <>
          <div 
            className="px-4 py-2.5 text-xs font-semibold text-gray-500 flex items-center justify-between"
            style={{ backgroundColor: '#f9fafb', borderTop: '1px solid #f3f4f6' }}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" />
              Recent searches
            </div>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={handleClearAll}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-0.5 rounded hover:bg-gray-200"
            >
              Clear all
            </button>
          </div>
          <ul className="py-1" style={{ backgroundColor: '#ffffff' }}>
            {recentSearches.map((search, index) => (
              <li key={search} className="relative">
                <button
                  type="button"
                  className={`w-full px-4 py-3 pr-10 text-left text-sm flex items-center gap-3 transition-colors ${
                    index + suggestions.length === selectedIndex 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelect(search)}
                >
                  <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate flex-1">{search}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleRemoveRecent(e, search)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-md transition-opacity opacity-50 hover:opacity-100"
                  aria-label="Remove search"
                >
                  <X className="h-3.5 w-3.5 text-gray-500" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
