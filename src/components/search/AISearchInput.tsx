import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Search, Loader2, X, Zap, Clock, Award, Factory, ArrowRight, Users, History } from 'lucide-react';
import { useAISearch, type AISearchFilters } from '@/hooks/use-ai-search';
import { cn } from '@/lib/utils';
import SupplierPreviewCard from '../supplier/SupplierPreviewCard';
import SupplierAutocomplete from '../supplier/SupplierAutocomplete';
import { useNavigate } from 'react-router-dom';
import { getTechnologyKeyFromDisplayName, getMaterialKeyFromDisplayName } from '@/lib/supplierData';
import { useSearchHistory } from '@/hooks/use-search-history';

interface SupplierForPreview {
  id: string;
  name: string;
  location: {
    city: string;
    country: string;
  };
  technologies: string[];
  materials: string[];
  verified: boolean;
  premium: boolean;
  logoUrl?: string;
  region?: string;
}

interface AISearchInputProps {
  onFiltersExtracted: (filters: AISearchFilters) => void;
  onClear: () => void;
  suppliers?: SupplierForPreview[];
  className?: string;
  placeholder?: string;
  enableLivePreview?: boolean;
  onQueryChange?: (query: string) => void;
  externalQuery?: string;
}

const AISearchInput: React.FC<AISearchInputProps> = ({
  onFiltersExtracted,
  onClear,
  suppliers = [],
  className,
  placeholder = "Try: 'titanium aerospace parts urgent' or 'medical grade prototypes in Europe'",
  enableLivePreview = true,
  onQueryChange,
  externalQuery
}) => {
  const [query, setQuery] = useState(externalQuery || '');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const { isLoading, search, debouncedSearch, filters, removeFilter, reset } = useAISearch();
  const { history } = useSearchHistory();
  const navigate = useNavigate();
  
  // Refs to track active typing and prevent state overwrites
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        // Check if click is inside the autocomplete dropdown
        const autocompleteEl = inputRef.current.closest('.relative')?.querySelector('[data-autocomplete]');
        if (autocompleteEl && autocompleteEl.contains(e.target as Node)) {
          return;
        }
        setShowAutocomplete(false);
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autocomplete suggestions based on query
  const autocompleteSuggestions = useMemo(() => {
    if (!query.trim() || query.length < 2 || suppliers.length === 0) return [];
    
    const queryLower = query.toLowerCase().trim();
    
    // Filter suppliers whose name starts with or contains the query
    const matches = suppliers
      .filter(s => s.name.toLowerCase().includes(queryLower))
      .sort((a, b) => {
        // Prioritize exact start matches
        const aStarts = a.name.toLowerCase().startsWith(queryLower);
        const bStarts = b.name.toLowerCase().startsWith(queryLower);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        
        // Then prioritize premium
        if (a.premium && !b.premium) return -1;
        if (!a.premium && b.premium) return 1;
        
        // Then verified
        if (a.verified && !b.verified) return -1;
        if (!a.verified && b.verified) return 1;
        
        // Then alphabetically
        return a.name.localeCompare(b.name);
      })
      .slice(0, 6);
    
    return matches;
  }, [query, suppliers]);

  // Handle input change with typing protection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setShowAutocomplete(newValue.length >= 2);
    setShowHistory(false);
    setHighlightedIndex(-1);
    isTypingRef.current = true;
    
    // Reset typing flag after 1 second without input
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
    }, 1000);
  };

  // Sync with external query when it changes (but not while user is typing)
  useEffect(() => {
    if (externalQuery !== undefined && externalQuery !== query && !isTypingRef.current) {
      setQuery(externalQuery);
      if (externalQuery.trim().length >= 4) {
        search(externalQuery).then(result => {
          if (result) onFiltersExtracted(result);
        });
      }
    }
  }, [externalQuery]);

  // Live preview on typing (if enabled and we have suppliers)
  useEffect(() => {
    if (enableLivePreview && query.trim().length >= 4 && suppliers.length > 0) {
      debouncedSearch(query);
    }
  }, [query, enableLivePreview, debouncedSearch, suppliers.length]);

  // Filter suppliers based on AI filters for preview
  const previewSuppliers = useMemo(() => {
    if (!filters || suppliers.length === 0) return [];
    
    // Get original query for direct name matching
    const originalQuery = filters.originalQuery?.toLowerCase().trim() || '';

    return suppliers.filter(supplier => {
      // PRIORITY 1: Direct name match - always include suppliers whose name matches the query
      if (originalQuery.length >= 2) {
        const nameMatch = supplier.name.toLowerCase().includes(originalQuery);
        if (nameMatch) return true; // Direct name match - always include
      }
      
      // PRIORITY 2: Check technologies filter (fuzzy matching)
      if (filters.technologies.length > 0) {
        const hasMatchingTech = filters.technologies.some(tech => {
          const techKey = getTechnologyKeyFromDisplayName(tech);
          const techLower = tech.toLowerCase();
          return supplier.technologies.some(supplierTech => {
            const lowerTech = supplierTech.toLowerCase();
            return lowerTech === techKey?.toLowerCase() ||
                   lowerTech === techLower ||
                   lowerTech.includes(techLower) ||
                   techLower.includes(lowerTech);
          });
        });
        if (!hasMatchingTech) return false;
      }

      // PRIORITY 3: Check materials filter (fuzzy matching)
      if (filters.materials.length > 0) {
        const hasMatchingMaterial = filters.materials.some(material => {
          const materialKey = getMaterialKeyFromDisplayName(material);
          const matLower = material.toLowerCase().replace(/[^a-z0-9]/g, '');
          return supplier.materials.some(supplierMat => {
            const lowerMat = supplierMat.toLowerCase();
            const lowerMatNorm = lowerMat.replace(/[^a-z0-9]/g, '');
            return lowerMat === materialKey?.toLowerCase() ||
                   lowerMat === material.toLowerCase() ||
                   lowerMatNorm.includes(matLower) ||
                   matLower.includes(lowerMatNorm);
          });
        });
        if (!hasMatchingMaterial) return false;
      }

      // PRIORITY 4: Check areas filter (with sub-region to region mapping)
      if (filters.areas.length > 0) {
        const supplierRegion = supplier.region?.toLowerCase() || '';
        const supplierCountry = supplier.location.country?.toLowerCase() || '';
        const supplierCity = supplier.location.city?.toLowerCase() || '';

        // Map AI sub-regions to database region values
        const regionMapping: Record<string, string[]> = {
          'europe': ['europe', 'western europe', 'central europe', 'eastern europe', 'scandinavia', 'uk & ireland', 'nordic', 'southern europe', 'northern europe'],
          'northamerica': ['north america', 'usa', 'united states', 'canada'],
          'asia': ['asia', 'asia-pacific', 'east asia', 'southeast asia', 'south asia'],
          'middleeast': ['middle east', 'gulf'],
          'southamerica': ['south america', 'latin america'],
          'africa': ['africa'],
          'global': ['global', 'worldwide'],
        };

        const hasMatchingArea = filters.areas.some(area => {
          const areaLower = area.toLowerCase();
          // Direct region match
          if (supplierRegion.includes(areaLower)) return true;
          // Country/city match
          if (supplierCountry.includes(areaLower) || supplierCity.includes(areaLower)) return true;
          // Sub-region to region mapping: check if the AI area maps to the supplier's region
          for (const [dbRegion, aiAreas] of Object.entries(regionMapping)) {
            if (aiAreas.some(a => areaLower.includes(a) || a.includes(areaLower)) && supplierRegion === dbRegion) {
              return true;
            }
          }
          return false;
        });
        if (!hasMatchingArea) return false;
      }

      // PRIORITY 5: Keyword search in name/technologies/materials
      if (filters.keywords?.trim()) {
        const keywords = filters.keywords.toLowerCase().trim();
        const searchableText = [
          supplier.name,
          ...supplier.technologies,
          ...supplier.materials,
          supplier.location.city,
          supplier.location.country
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(keywords)) {
          return false;
        }
      }

      return true;
    });
  }, [filters, suppliers]);

  // Get total matches count and top 3 for preview
  const matchCount = previewSuppliers.length;
  const topMatches = useMemo(() => {
    // Prioritize premium and verified suppliers
    return [...previewSuppliers]
      .sort((a, b) => {
        if (a.premium && !b.premium) return -1;
        if (!a.premium && b.premium) return 1;
        if (a.verified && !b.verified) return -1;
        if (!a.verified && b.verified) return 1;
        return 0;
      })
      .slice(0, 3);
  }, [previewSuppliers]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setShowAutocomplete(false);
    setShowHistory(false);
    
    const result = await search(query);
    if (result) {
      onFiltersExtracted(result);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle autocomplete navigation
    if (showAutocomplete && autocompleteSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < autocompleteSuggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : autocompleteSuggestions.length - 1
        );
        return;
      }
      if (e.key === 'Enter' && highlightedIndex >= 0) {
        e.preventDefault();
        handleAutocompleteSelect(autocompleteSuggestions[highlightedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowAutocomplete(false);
        setHighlightedIndex(-1);
        return;
      }
    }
    
    if (e.key === 'Enter' && !isLoading) {
      handleSearch();
    }
  };

  const handleAutocompleteSelect = (supplier: SupplierForPreview) => {
    setShowAutocomplete(false);
    setHighlightedIndex(-1);
    navigate(`/suppliers/${supplier.id}`);
  };

  const handleClear = () => {
    setQuery('');
    setShowAutocomplete(false);
    setShowHistory(false);
    setHighlightedIndex(-1);
    reset();
    onClear();
  };

  const handleRemoveFilter = (type: 'technologies' | 'materials' | 'areas' | 'certifications', value: string) => {
    removeFilter(type, value);
    // Also trigger update to parent with modified filters
    if (filters) {
      const updatedFilters = {
        ...filters,
        [type]: filters[type].filter(v => v !== value)
      };
      onFiltersExtracted(updatedFilters);
    }
  };

  const handleApplyFilters = useCallback(() => {
    if (filters) {
      onFiltersExtracted(filters);
    }
  }, [filters, onFiltersExtracted]);

  const handleSupplierClick = (supplierId: string) => {
    navigate(`/suppliers/${supplierId}`);
  };

  const handleViewAllClick = () => {
    if (filters) {
      onFiltersExtracted(filters);
    }
  };

  // Helper to get urgency display info
  const getUrgencyInfo = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return { label: 'Urgent', className: 'bg-red-500/10 text-red-600 border-red-200' };
      case 'rush':
        return { label: 'Rush', className: 'bg-orange-500/10 text-orange-600 border-orange-200' };
      default:
        return null;
    }
  };

  // Helper to get production volume display info
  const getVolumeInfo = (volume: string) => {
    switch (volume) {
      case 'prototype':
        return { label: 'Prototype', icon: Factory };
      case 'low':
        return { label: 'Low Volume', icon: Factory };
      case 'medium':
        return { label: 'Medium Volume', icon: Factory };
      case 'high':
        return { label: 'High Volume', icon: Factory };
      case 'mass':
        return { label: 'Mass Production', icon: Factory };
      default:
        return null;
    }
  };

  const urgencyInfo = filters?.urgency ? getUrgencyInfo(filters.urgency) : null;
  const volumeInfo = filters?.productionVolume ? getVolumeInfo(filters.productionVolume) : null;

  const hasFilters = filters && (
    filters.technologies.length > 0 || 
    filters.materials.length > 0 || 
    filters.areas.length > 0 ||
    filters.certifications.length > 0
  );

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            <Sparkles className={cn(
              "h-4 w-4 transition-colors",
              isLoading ? "text-primary animate-pulse" : "text-primary"
            )} />
          </div>
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.length >= 2) setShowAutocomplete(true);
              else if (query.length === 0 && history.length > 0) setShowHistory(true);
            }}
            placeholder={placeholder}
            className="pl-10 pr-10 h-12 text-base"
            autoComplete="off"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          
          {/* Autocomplete dropdown */}
          <SupplierAutocomplete
            suggestions={autocompleteSuggestions}
            isVisible={showAutocomplete && !filters}
            onSelect={handleAutocompleteSelect}
            highlightedIndex={highlightedIndex}
            onMouseEnter={setHighlightedIndex}
          />
          
          {/* Search history dropdown */}
          {showHistory && !showAutocomplete && !filters && history.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background/95 backdrop-blur-xl border border-border/50 rounded-lg shadow-xl shadow-black/10 z-[60] overflow-hidden bg-gradient-to-b from-background to-muted/30" data-autocomplete>
              <div className="px-3 py-2 border-b border-border flex items-center gap-2">
                <History className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Recent searches</span>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {history.slice(0, 5).map(entry => (
                  <button
                    key={entry.id}
                    className="w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center gap-2"
                    onClick={() => {
                      setShowHistory(false);
                      const q = entry.query || '';
                      setQuery(q);
                      if (q) {
                        search(q).then(result => {
                          if (result) onFiltersExtracted(result);
                        });
                      }
                    }}
                  >
                    <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm truncate block">{entry.query || 'Filter search'}</span>
                      {(entry.materials.length > 0 || entry.technologies.length > 0) && (
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {entry.technologies.slice(0, 2).map(t => (
                            <span key={t} className="text-[10px] text-muted-foreground bg-muted px-1.5 rounded">{t}</span>
                          ))}
                          {entry.materials.slice(0, 2).map(m => (
                            <span key={m} className="text-[10px] text-muted-foreground bg-muted px-1.5 rounded">{m}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {entry.resultsCount !== undefined && (
                      <span className="text-[10px] text-muted-foreground">{entry.resultsCount} results</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <Button
          type="button"
          size="lg"
          className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          onClick={handleSearch}
          disabled={isLoading || !query.trim()}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Search
            </>
          )}
        </Button>
      </div>

      {/* AI interpretation feedback with clickable badges */}
      {filters && hasFilters && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">AI understood:</span>
              <span className="text-muted-foreground">{filters.explanation}</span>
            </div>
            <div className="flex items-center gap-2">
              {filters.confidence >= 0.8 && (
                <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 border-green-200">
                  High confidence
                </Badge>
              )}
              {filters.confidence >= 0.5 && filters.confidence < 0.8 && (
                <Badge variant="secondary" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-200">
                  Medium confidence
                </Badge>
              )}
            </div>
          </div>
          
          {/* Special indicators row */}
          {(urgencyInfo || volumeInfo || filters.certifications.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-primary/10">
              {urgencyInfo && (
                <Badge className={cn("text-xs", urgencyInfo.className)}>
                  <Zap className="h-3 w-3 mr-1" />
                  {urgencyInfo.label}
                </Badge>
              )}
              {volumeInfo && (
                <Badge variant="outline" className="text-xs">
                  <volumeInfo.icon className="h-3 w-3 mr-1" />
                  {volumeInfo.label}
                </Badge>
              )}
              {filters.certifications.map(cert => (
                <Badge 
                  key={cert} 
                  variant="outline" 
                  className="text-xs cursor-pointer hover:bg-destructive/10 hover:border-destructive/50 transition-colors group"
                  onClick={() => handleRemoveFilter('certifications', cert)}
                >
                  <Award className="h-3 w-3 mr-1" />
                  {cert}
                  <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Badge>
              ))}
            </div>
          )}
          
          {/* Filter badges row - clickable to remove */}
          <div className="flex flex-wrap gap-2">
            {filters.technologies.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs text-muted-foreground">Tech:</span>
                {filters.technologies.map(tech => (
                  <Badge 
                    key={tech} 
                    variant="outline" 
                    className="text-xs cursor-pointer hover:bg-destructive/10 hover:border-destructive/50 transition-colors group"
                    onClick={() => handleRemoveFilter('technologies', tech)}
                  >
                    {tech}
                    <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Badge>
                ))}
              </div>
            )}
            {filters.materials.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs text-muted-foreground">Materials:</span>
                {filters.materials.map(mat => (
                  <Badge 
                    key={mat} 
                    variant="outline" 
                    className="text-xs cursor-pointer hover:bg-destructive/10 hover:border-destructive/50 transition-colors group"
                    onClick={() => handleRemoveFilter('materials', mat)}
                  >
                    {mat}
                    <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Badge>
                ))}
              </div>
            )}
            {filters.areas.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-xs text-muted-foreground">Areas:</span>
                {filters.areas.map(area => (
                  <Badge 
                    key={area} 
                    variant="outline" 
                    className="text-xs cursor-pointer hover:bg-destructive/10 hover:border-destructive/50 transition-colors group"
                    onClick={() => handleRemoveFilter('areas', area)}
                  >
                    {area}
                    <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Live Preview Cards */}
          {enableLivePreview && topMatches.length > 0 && (
            <div className="pt-2 border-t border-primary/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">{matchCount} suppliers match</span>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleViewAllClick}
                >
                  View all {matchCount} matches
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              
              <div className="grid gap-2 sm:grid-cols-3">
                {topMatches.map((supplier) => (
                  <SupplierPreviewCard
                    key={supplier.id}
                    supplier={supplier}
                    onClick={() => handleSupplierClick(supplier.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No matches message */}
          {enableLivePreview && hasFilters && matchCount === 0 && suppliers.length > 0 && (
            <div className="pt-2 border-t border-primary/10">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>No suppliers match these filters. Try removing some filters.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading shimmer while AI is processing */}
      {isLoading && enableLivePreview && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>AI is analyzing your query...</span>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
              <div className="h-6 w-24 bg-muted rounded-full animate-pulse" />
              <div className="h-6 w-16 bg-muted rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISearchInput;
