import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import Navbar from '@/components/ui/navbar';
import SupplierCard from '@/components/ui/supplier-card';
import Map from '@/components/ui/map';
import RelatedSearches from '@/components/search/RelatedSearches';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search as SearchIcon, MapIcon, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loadSuppliers, getAreaForCountry, type ParsedSupplier } from '@/lib/supplierData';
import AISearchInput from '@/components/search/AISearchInput';
import SearchResultsSkeleton from '@/components/search/SearchResultsSkeleton';
import type { AISearchFilters } from '@/hooks/use-ai-search';

const KeywordSearch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Initialize search query from URL parameters
  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [showMap, setShowMap] = useState(true);
  const [suppliers, setSuppliers] = useState<ParsedSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  
  // AI search state
  const [aiFilters, setAIFilters] = useState<AISearchFilters | null>(null);
  const [isAISearching, setIsAISearching] = useState(false);

  // Auto-trigger AI search if there's an initial query
  useEffect(() => {
    if (initialQuery && suppliers.length > 0 && !aiFilters) {
      // Trigger AI search automatically for the initial query
      handleAISearch(initialQuery);
    }
  }, [initialQuery, suppliers.length]);

  // Load suppliers on component mount
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data, error } = await supabase
          .from('suppliers')
          .select('*')
          .eq('verified', true);

        if (error) throw error;

        // Transform database suppliers to match ParsedSupplier interface
        const loadedSuppliers: ParsedSupplier[] = (data || []).map(supplier => ({
          id: supplier.supplier_id,
          name: supplier.name,
          location: {
            lat: Number(supplier.location_lat) || 0,
            lng: Number(supplier.location_lng) || 0,
            city: supplier.location_city || '',
            country: supplier.location_country || '',
            fullAddress: supplier.location_address || ''
          },
          technologies: supplier.technologies || [],
          materials: supplier.materials || [],
          verified: supplier.verified || false,
          premium: supplier.premium || false,
          rating: Number(supplier.rating) || 0,
          reviewCount: supplier.review_count || 0,
          description: supplier.description || '',
          website: supplier.website || '',
          logoUrl: supplier.logo_url || undefined,
          region: supplier.region || 'global'
        }));
        
        setSuppliers(loadedSuppliers);
      } catch (error) {
        console.error('Error loading suppliers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuppliers();
  }, []);

  // Handle AI search results
  const handleAISearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsAISearching(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('ai-search', {
        body: { query }
      });
      
      if (error) throw error;
      
      if (data && !data.error) {
        setAIFilters(data as AISearchFilters);
      }
    } catch (error) {
      console.error('AI search error:', error);
    } finally {
      setIsAISearching(false);
    }
  };

  const handleAIFiltersExtracted = (filters: AISearchFilters) => {
    setAIFilters(filters);
    setSearchQuery(filters.originalQuery);
    navigate(`/keywordsearch?q=${encodeURIComponent(filters.originalQuery)}`);
  };

  const handleClearAI = () => {
    setAIFilters(null);
    setSearchQuery('');
    navigate('/keywordsearch');
  };

  // Filter suppliers based on AI filters or simple text search
  const filteredSuppliers = useMemo(() => {
    const queryLower = searchQuery.toLowerCase().trim();
    const originalQuery = aiFilters?.originalQuery?.toLowerCase().trim() || queryLower;
    
    // If we have AI filters, use them for intelligent filtering
    if (aiFilters) {
      return suppliers.filter(supplier => {
        // PRIORITY 1: Direct name match - always include suppliers whose name matches
        if (originalQuery.length >= 2 && supplier.name.toLowerCase().includes(originalQuery)) {
          return true; // Direct name match takes priority
        }
        
        let matches = true;
        
        // Filter by technologies if specified
        if (aiFilters.technologies.length > 0) {
          const hasTech = aiFilters.technologies.some(tech => 
            supplier.technologies.some(st => 
              st.toLowerCase().includes(tech.toLowerCase()) || 
              tech.toLowerCase().includes(st.toLowerCase())
            )
          );
          if (!hasTech) matches = false;
        }
        
        // Filter by materials if specified
        if (aiFilters.materials.length > 0) {
          const hasMaterial = aiFilters.materials.some(mat => 
            supplier.materials.some(sm => 
              sm.toLowerCase().includes(mat.toLowerCase()) || 
              mat.toLowerCase().includes(sm.toLowerCase())
            )
          );
          if (!hasMaterial) matches = false;
        }
        
        // Filter by areas if specified
        if (aiFilters.areas.length > 0) {
          const supplierArea = getAreaForCountry(supplier.location.country);
          const inArea = aiFilters.areas.some(area => 
            supplierArea?.toLowerCase().includes(area.toLowerCase()) ||
            area.toLowerCase().includes(supplierArea?.toLowerCase() || '') ||
            supplier.location.country.toLowerCase().includes(area.toLowerCase())
          );
          if (!inArea) matches = false;
        }
        
        // Check keywords if specified (name match handled above, now check description)
        if (aiFilters.keywords && matches) {
          const keywords = aiFilters.keywords.toLowerCase();
          const matchesKeywords = 
            supplier.name.toLowerCase().includes(keywords) ||
            supplier.description.toLowerCase().includes(keywords);
          if (!matchesKeywords) matches = false;
        }
        
        return matches;
      });
    }
    
    // Fallback to simple text search if no AI filters
    if (!queryLower) {
      return suppliers;
    }

    return suppliers.filter(supplier => {
      // PRIORITY 1: Direct name match
      if (supplier.name.toLowerCase().includes(queryLower)) {
        return true;
      }
      
      // PRIORITY 2: Other fields
      return (
        supplier.description.toLowerCase().includes(queryLower) ||
        supplier.technologies.some(tech => tech.toLowerCase().includes(queryLower)) ||
        supplier.materials.some(material => material.toLowerCase().includes(queryLower)) ||
        supplier.location.city.toLowerCase().includes(queryLower) ||
        supplier.location.country.toLowerCase().includes(queryLower)
      );
    });
  }, [searchQuery, suppliers, aiFilters]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading suppliers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Smart Search | AMSupplyCheck</title>
        <meta name="description" content="Search for 3D printing suppliers using natural language. We understand your intent and find the best matches." />
        <link rel="canonical" href="https://amsupplycheck.com/keywordsearch" />
      </Helmet>
      {(loading || isAISearching) && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted overflow-hidden">
          <div className="h-full bg-primary animate-[progress_1.5s_ease-in-out_infinite] w-1/3" />
        </div>
      )}
      
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-8">
        {/* Search Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col gap-4 mb-4 lg:mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
            
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                <Sparkles className={`h-6 w-6 lg:h-8 lg:w-8 text-primary ${isAISearching ? 'animate-sparkle-pulse' : ''}`} />
                Smart Search
              </h1>
              <p className="text-sm lg:text-base text-muted-foreground">
                Search using natural language - we understand your intent
              </p>
            </div>
            
            {/* Desktop Action Buttons */}
            <div className="hidden lg:flex items-center justify-end space-x-2">
              <Button
                variant={showMap ? "outline" : "default"}
                size="sm"
                onClick={() => setShowMap(!showMap)}
                className="bg-gradient-primary"
              >
                <MapIcon className="h-4 w-4 mr-2" />
                {showMap ? 'Hide Map' : 'Show Map'}
              </Button>
            </div>
          </div>

          {/* AI Search Input */}
          <div className="mb-6">
            <AISearchInput
              onFiltersExtracted={handleAIFiltersExtracted}
              onClear={handleClearAI}
              placeholder="Try: 'metal parts for aerospace in Europe' or 'flexible prototypes in Scandinavia'"
            />
          </div>

          {/* AI Search Loading State */}
          {isAISearching && (
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Analyzing your query...</span>
            </div>
          )}

          {/* AI Interpretation Display */}
          {aiFilters && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-foreground mb-2">{aiFilters.explanation}</p>
                  <div className="flex flex-wrap gap-2">
                    {aiFilters.technologies.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Technologies:</span>
                        {aiFilters.technologies.map(tech => (
                          <Badge key={tech} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {aiFilters.materials.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Materials:</span>
                        {aiFilters.materials.map(mat => (
                          <Badge key={mat} variant="secondary" className="text-xs">
                            {mat}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {aiFilters.areas.length > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Areas:</span>
                        {aiFilters.areas.map(area => (
                          <Badge key={area} variant="secondary" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  {aiFilters.confidence >= 0.8 && (
                    <Badge variant="outline" className="mt-2 text-xs bg-green-500/10 text-green-600 border-green-500/30">
                      High confidence match
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 lg:mb-6">
            <p className="text-sm text-muted-foreground">
              {filteredSuppliers.length} suppliers found
              {(searchQuery.trim() || aiFilters) && (
                <span className="ml-1">
                  {aiFilters ? 'matching your criteria' : `for "${searchQuery}"`}
                </span>
              )}
            </p>
            
            {/* Mobile Map Toggle */}
            <div className="lg:hidden">
              <Button
                variant={showMap ? "default" : "outline"}
                size="sm"
                onClick={() => setShowMap(!showMap)}
              >
                <MapIcon className="h-4 w-4 mr-2" />
                {showMap ? 'Hide Map' : 'Show Map'}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col gap-6">
          {/* Map for Mobile (Above suppliers list) */}
          {showMap && (
            <div className="lg:hidden">
              <Card className="overflow-hidden">
                <Map 
                  suppliers={filteredSuppliers} 
                  height="300px"
                  className="w-full"
                />
              </Card>
            </div>
          )}

          {/* Desktop Layout: Suppliers + Map Side by Side */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Suppliers List */}
            <div className="flex-1 min-w-0">
              {/* Related Searches */}
              <RelatedSearches
                currentTechnologies={aiFilters?.technologies || []}
                currentMaterials={aiFilters?.materials || []}
                currentAreas={aiFilters?.areas || []}
                currentKeywords={searchQuery}
              />
              
              {loading || isAISearching ? (
                <SearchResultsSkeleton count={6} />
              ) : filteredSuppliers.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  {filteredSuppliers.map((supplier, index) => (
                    <div 
                      key={supplier.id} 
                      className="opacity-0 animate-bounce-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <SupplierCard
                        supplier={supplier}
                        searchedMaterials={aiFilters?.materials || []}
                        searchedTechnologies={aiFilters?.technologies || []}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="p-8 lg:p-12 text-center">
                  <div className="text-muted-foreground mb-4">
                    <SearchIcon className="h-8 lg:h-12 w-8 lg:w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-base lg:text-lg font-medium mb-2">
                      {searchQuery.trim() ? 'No suppliers found' : 'Enter a search term'}
                    </h3>
                    <p className="text-sm lg:text-base">
                      {searchQuery.trim() 
                        ? `No suppliers match your search for "${searchQuery}". Try different keywords.`
                        : 'Enter keywords to search for suppliers by name, technology, material, or location.'
                      }
                    </p>
                  </div>
                  {searchQuery.trim() && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSearchQuery('');
                        navigate('/keywordsearch');
                      }}
                    >
                      Clear search
                    </Button>
                  )}
                </Card>
              )}
            </div>

            {/* Map for Desktop (Side by side) */}
            {showMap && (
              <div className="hidden lg:block lg:w-1/2 flex-shrink-0">
                <div className="sticky top-24">
                  <Map 
                    suppliers={filteredSuppliers} 
                    height="600px"
                    className="rounded-lg overflow-hidden"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeywordSearch;