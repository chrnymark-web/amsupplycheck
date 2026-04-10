import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Navbar from '@/components/ui/navbar';
import FilterPanel, { FilterState } from '@/components/ui/filter-panel';
import SupplierCard from '@/components/ui/supplier-card';
import SupplierMap from '@/components/ui/map';
import RelatedSearches from '@/components/search/RelatedSearches';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon, SlidersHorizontal, MapPin, Zap, Factory, Award, X, Star, Clock, ArrowUpDown, Filter, Signal } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { loadSuppliers, getAreaForCountry, getMaterialKeyFromDisplayName, getTechnologyKeyFromDisplayName, type ParsedSupplier } from '@/lib/supplierData';
import { getRelatedMaterials, findMaterialKey, MATERIAL_CATEGORIES } from '@/lib/validMaterials';
import { requirementToTechnologies, requirementToMaterials, type SearchRequirement } from '@/lib/technologyMaterialCompatibility';
import { trackViewItemList, supplierToGA4Item } from '@/lib/analytics';
import type { LiveQuote } from '@/lib/api/types';
import { useSearchHistory } from '@/hooks/use-search-history';
import { useSavedSearches } from '@/hooks/use-saved-searches';
import SearchHistoryPanel from '@/components/search/SearchHistoryPanel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

function normalizeVendorId(id: string): string {
  return id.replace(/^craftcloud-/, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

const Search = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Initialize state from URL parameters
  const [filters, setFilters] = useState<FilterState>({
    materials: searchParams.get('materials')?.split(',').filter(Boolean) || [],
    technologies: searchParams.get('technologies')?.split(',').filter(Boolean) || [],
    areas: searchParams.get('areas')?.split(',').filter(Boolean) || [],
    requirements: searchParams.get('requirements')?.split(',').filter(Boolean) || []
  });
  const [searchQuery, setSearchQuery] = useState(searchParams.get('keywords') || searchParams.get('q') || '');
  const [certifications, setCertifications] = useState<string[]>(searchParams.get('certifications')?.split(',').filter(Boolean) || []);
  const [productionVolume, setProductionVolume] = useState(searchParams.get('volume') || '');
  const [urgency, setUrgency] = useState(searchParams.get('urgency') || 'standard');
  const [originalQuery, setOriginalQuery] = useState(searchParams.get('query') || '');
  const [showFilters, setShowFilters] = useState(true);
  const [suppliers, setSuppliers] = useState<ParsedSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [filterPanelHeight, setFilterPanelHeight] = useState(0);
  const filterPanelRef = React.useRef<HTMLDivElement>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('map');
  const { addToHistory } = useSearchHistory();
  const { isAuthenticated, saveSearch } = useSavedSearches();
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'name' | 'location' | 'price'>('relevance');
  const [quoteData, setQuoteData] = useState<LiveQuote[] | null>(null);
  // Measure filter panel height
  useEffect(() => {
    const updateHeight = () => {
      if (filterPanelRef.current) {
        setFilterPanelHeight(filterPanelRef.current.offsetHeight);
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    
    // Use ResizeObserver to detect filter panel height changes
    const resizeObserver = new ResizeObserver(updateHeight);
    if (filterPanelRef.current) {
      resizeObserver.observe(filterPanelRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', updateHeight);
      resizeObserver.disconnect();
    };
  }, [filters, searchQuery]); // Recalculate when filters change

  // Handle navbar hide/show on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
          id: supplier.supplier_id, // Use slug for SEO-friendly routing
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
          certifications: supplier.certifications || [],
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

  // Load live quote data from sessionStorage when arriving from PriceCalculator
  useEffect(() => {
    if (searchParams.get('source') !== 'stl-quotes') return;
    try {
      const raw = sessionStorage.getItem('stl-live-quotes');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      // Check staleness (30 min)
      const storedAt = new Date(parsed.storedAt).getTime();
      if (Date.now() - storedAt > 30 * 60 * 1000) {
        sessionStorage.removeItem('stl-live-quotes');
        return;
      }
      const quotes: LiveQuote[] = parsed.quotes.map((q: Record<string, unknown>) => ({
        ...q,
        fetchedAt: new Date(q.fetchedAt as string),
      }));
      setQuoteData(quotes);
      setSortBy('price');
    } catch {
      console.error('Failed to parse STL quote data');
    }
  }, [searchParams]);

  // Build quote lookup map: normalized supplier ID → LiveQuote
  const quoteMap = useMemo(() => {
    if (!quoteData) return new Map<string, LiveQuote>();
    const map = new Map<string, LiveQuote>();
    for (const q of quoteData) {
      map.set(normalizeVendorId(q.supplierId), q);
    }
    return map;
  }, [quoteData]);

  // Sync filters and search query with URL parameters
  useEffect(() => {
    setFilters({
      materials: searchParams.get('materials')?.split(',').filter(Boolean) || [],
      technologies: searchParams.get('technologies')?.split(',').filter(Boolean) || [],
      areas: searchParams.get('areas')?.split(',').filter(Boolean) || [],
      requirements: searchParams.get('requirements')?.split(',').filter(Boolean) || []
    });
    setSearchQuery(searchParams.get('keywords') || searchParams.get('q') || '');
    setCertifications(searchParams.get('certifications')?.split(',').filter(Boolean) || []);
    setProductionVolume(searchParams.get('volume') || '');
    setUrgency(searchParams.get('urgency') || 'standard');
    setOriginalQuery(searchParams.get('query') || '');

    // Add hreflang tags for international SEO
    const addHreflangTag = (lang: string, url: string) => {
      let link = document.querySelector(`link[rel="alternate"][hreflang="${lang}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'alternate');
        link.setAttribute('hreflang', lang);
        document.head.appendChild(link);
      }
      link.setAttribute('href', url);
    };

    const pageUrl = `${window.location.origin}/search${window.location.search}`;
    addHreflangTag('en', pageUrl);
    addHreflangTag('da', pageUrl);
    addHreflangTag('x-default', pageUrl);

    // Cleanup hreflang tags when component unmounts
    return () => {
      document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link => link.remove());
    };
  }, [searchParams]);

  // Filter suppliers based on active filters and search query
  // Uses fuzzy matching for materials - e.g., "titanium" also matches "metal"
  // PRIORITY: Name matches are checked first for direct supplier lookups
  const filteredSuppliers = useMemo(() => {
    console.log('Filtering suppliers. Total suppliers:', suppliers.length);
    console.log('Current filters:', filters);
    console.log('Current search query:', searchQuery);
    
    const filtered = suppliers.filter(supplier => {
      // Apply search query filter with fuzzy material matching
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        // Split into individual words for multi-word queries (match ANY word)
        const queryWords = query.split(/\s+/).filter(w => w.length >= 3);

        // PRIORITY 1: Check direct name match first - always include name matches
        if (supplier.name.toLowerCase().includes(query)) {
          // Name matches - check if filters still apply (or pass if no other filters)
          const hasOtherFilters = filters.materials.length > 0 ||
                                   filters.technologies.length > 0 ||
                                   filters.areas.length > 0;
          if (!hasOtherFilters) {
            return true; // Direct name match with no other filters - include
          }
          // If there are other filters, continue to check them but don't exclude based on search
        } else {
          // No name match - check other fields (try full query first, then individual words)
          const searchableText = [
            supplier.name, supplier.description,
            ...supplier.technologies, ...supplier.materials,
            supplier.location.city, supplier.location.country
          ].filter(Boolean).join(' ').toLowerCase();

          let matchesSearch = searchableText.includes(query);

          // If full query doesn't match, try matching ANY individual word
          if (!matchesSearch && queryWords.length > 1) {
            matchesSearch = queryWords.some(word => searchableText.includes(word));
          }
          
          // Fuzzy material matching - if query is a material, also check related materials
          if (!matchesSearch) {
            const materialKey = findMaterialKey(query);
            if (materialKey) {
              const relatedMaterials = getRelatedMaterials(materialKey);
              matchesSearch = supplier.materials.some(supplierMat => {
                const lowerMat = supplierMat.toLowerCase();
                return relatedMaterials.some(related => 
                  lowerMat === related || lowerMat.includes(related) || related.includes(lowerMat)
                );
              });
              
              // Also check if supplier has the parent category
              // e.g., if searching "titanium", match suppliers with "metal"
              if (!matchesSearch) {
                for (const [category, categoryMaterials] of Object.entries(MATERIAL_CATEGORIES)) {
                  if (categoryMaterials.includes(materialKey)) {
                    // The searched material belongs to this category
                    // Check if supplier has the category or any material in the category
                    matchesSearch = supplier.materials.some(supplierMat => {
                      const lowerMat = supplierMat.toLowerCase();
                      return lowerMat === category || 
                             categoryMaterials.some(catMat => lowerMat === catMat || lowerMat.includes(catMat));
                    });
                    if (matchesSearch) break;
                  }
                }
              }
            }
          }
          
          if (!matchesSearch) return false;
        }
      }

      // Apply material filters with fuzzy matching
      if (filters.materials.length > 0) {
        const hasMatchingMaterial = filters.materials.some(material => {
          const materialKey = getMaterialKeyFromDisplayName(material) || findMaterialKey(material);
          
          // Get related materials for fuzzy matching
          const relatedMaterials = materialKey ? getRelatedMaterials(materialKey) : [material.toLowerCase()];
          
          // Normalize display name to slug form: "Titanium Ti-6Al-4V" -> "titanium-ti-6al-4v" / "titanium-ti6al4v"
          const materialSlug = material.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          const materialSlugCompact = materialSlug.replace(/-/g, '');

          return supplier.materials.some(supplierMat => {
            const lowerMat = supplierMat.toLowerCase();
            const lowerMatCompact = lowerMat.replace(/-/g, '');

            // Direct match
            if (lowerMat === materialKey?.toLowerCase() || lowerMat === material.toLowerCase()) {
              return true;
            }

            // Slug-normalized match (handles "Titanium Ti-6Al-4V" vs "titanium-ti6al4v")
            if (lowerMatCompact === materialSlugCompact || lowerMat === materialSlug) {
              return true;
            }

            // Fuzzy match - check if supplier material is related
            if (relatedMaterials.some(related =>
              lowerMat === related || lowerMat.includes(related) || related.includes(lowerMat)
            )) {
              return true;
            }
            
            // Check category match (e.g., "titanium" matches supplier with "metal")
            if (materialKey) {
              for (const [category, categoryMaterials] of Object.entries(MATERIAL_CATEGORIES)) {
                if (categoryMaterials.includes(materialKey)) {
                  if (lowerMat === category || categoryMaterials.some(catMat => lowerMat === catMat)) {
                    return true;
                  }
                }
              }
            }
            
            return false;
          });
        });
        if (!hasMatchingMaterial) return false;
      }

      // Apply technology filters
      if (filters.technologies.length > 0) {
        const hasMatchingTech = filters.technologies.some(tech => {
          const techKey = getTechnologyKeyFromDisplayName(tech);
          return supplier.technologies.some(supplierTech => {
            const lowerTech = supplierTech.toLowerCase();
            // Match both database key AND display name (case-insensitive)
            return lowerTech === techKey?.toLowerCase() || 
                   lowerTech === tech.toLowerCase();
          });
        });
        if (!hasMatchingTech) return false;
      }

      // Apply area filters (with sub-region to region mapping for AI search)
      // Skip area filter if "Global" or "Worldwide" is selected (means all regions)
      const effectiveAreas = filters.areas.filter(a => !['Global', 'Worldwide', 'global', 'worldwide'].includes(a));
      if (effectiveAreas.length > 0) {
        const supplierRegion = (supplier as any).region?.toLowerCase() || '';
        const supplierCountry = supplier.location.country?.toLowerCase() || '';
        const supplierCity = supplier.location.city?.toLowerCase() || '';
        const supplierArea = getAreaForCountry(supplier.location.country);

        // Map AI sub-regions to database region values
        const regionMapping: Record<string, string[]> = {
          'europe': ['europe', 'western europe', 'central europe', 'eastern europe', 'scandinavia', 'uk & ireland', 'nordic', 'southern europe', 'northern europe'],
          'northamerica': ['north america', 'usa', 'united states', 'canada', 'north america & canada'],
          'asia': ['asia', 'asia-pacific', 'east asia', 'southeast asia', 'south asia'],
          'middleeast': ['middle east', 'gulf'],
          'southamerica': ['south america', 'latin america'],
          'africa': ['africa'],
          'global': ['global', 'worldwide'],
        };

        const hasMatchingArea = effectiveAreas.some(area => {
          const areaLower = area.toLowerCase();
          // Direct area match (from getAreaForCountry)
          if (supplierArea && supplierArea.toLowerCase() === areaLower) return true;
          // Direct region match
          if (supplierRegion.includes(areaLower)) return true;
          // Country/city match
          if (supplierCountry.includes(areaLower) || supplierCity.includes(areaLower)) return true;
          // Sub-region to region mapping (AI returns "Western Europe", DB has "europe")
          for (const [dbRegion, aiAreas] of Object.entries(regionMapping)) {
            if (aiAreas.some(a => areaLower.includes(a) || a.includes(areaLower)) && supplierRegion === dbRegion) {
              return true;
            }
          }
          return false;
        });
        if (!hasMatchingArea) return false;
      }

      // Apply certification filters (soft filter - only exclude if supplier has certs that don't match)
      // Most suppliers don't have certifications yet, so we don't exclude them
      // Certifications are used for boosting in sort order instead
      // Only apply as hard filter when explicitly toggled by user (not from AI)


      // Apply requirement filters (High strength, Heat resistant, etc.)
      if (filters.requirements && filters.requirements.length > 0) {
        const hasMatchingRequirement = filters.requirements.every(req => {
          const reqTechs = requirementToTechnologies[req as SearchRequirement] || [];
          const reqMats = requirementToMaterials[req as SearchRequirement] || [];
          
          // Check if supplier has at least one matching technology OR material
          const techMatch = reqTechs.some(rt => 
            supplier.technologies.some(st => {
              const lower = st.toLowerCase();
              const rtLower = rt.toLowerCase().replace(/[\/()]/g, '');
              return lower.includes(rtLower) || rtLower.includes(lower) || lower === rtLower;
            })
          );
          
          const matMatch = reqMats.some(rm =>
            supplier.materials.some(sm => {
              const lower = sm.toLowerCase().replace(/-/g, ' ');
              const rmLower = rm.toLowerCase().replace(/-/g, ' ');
              return lower.includes(rmLower) || rmLower.includes(lower);
            })
          );
          
          return techMatch || matMatch;
        });
        if (!hasMatchingRequirement) return false;
      }

      return true;
    });
    
    console.log('Filtered suppliers count:', filtered.length);

    // When we have quote data, merge in synthetic suppliers for unmatched vendors
    let withQuoteVendors = filtered;
    if (quoteData && quoteData.length > 0) {
      const matchedIds = new Set<string>();
      for (const s of filtered) {
        const normId = normalizeVendorId(s.id);
        const normName = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (quoteMap.has(normId) || quoteMap.has(normName)) {
          matchedIds.add(normId);
          matchedIds.add(normName);
        }
      }
      // Create synthetic suppliers for unmatched quote vendors
      const synthetics: ParsedSupplier[] = quoteData
        .filter(q => {
          const normId = normalizeVendorId(q.supplierId);
          const normName = q.supplierName.toLowerCase().replace(/[^a-z0-9]/g, '');
          return !matchedIds.has(normId) && !matchedIds.has(normName);
        })
        .map(q => ({
          id: q.supplierId,
          name: q.supplierName,
          location: { lat: 0, lng: 0, city: '', country: '', fullAddress: '' },
          technologies: [q.technology].filter(Boolean),
          materials: [q.material].filter(Boolean),
          verified: false,
          premium: false,
          rating: 0,
          reviewCount: 0,
          description: `Live quote available via Craftcloud`,
          website: q.quoteUrl || '',
          logoUrl: q.supplierLogo,
          region: 'global',
        }));
      withQuoteVendors = [...filtered, ...synthetics];
    }

    // Apply sorting
    const sorted = [...withQuoteVendors].sort((a, b) => {
      if (sortBy === 'price') {
        const aId = normalizeVendorId(a.id);
        const aName = a.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const bId = normalizeVendorId(b.id);
        const bName = b.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const aPrice = (quoteMap.get(aId) || quoteMap.get(aName))?.unitPrice ?? Infinity;
        const bPrice = (quoteMap.get(bId) || quoteMap.get(bName))?.unitPrice ?? Infinity;
        return aPrice - bPrice;
      }
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'location') return (a.location.country || '').localeCompare(b.location.country || '');
      // Relevance: name match > premium > verified > filter overlap
      const queryLower = (searchQuery || '').toLowerCase();
      const aNameMatch = queryLower && a.name.toLowerCase().includes(queryLower) ? 100 : 0;
      const bNameMatch = queryLower && b.name.toLowerCase().includes(queryLower) ? 100 : 0;
      const aScore = aNameMatch + (a.premium ? 20 : 0) + (a.verified ? 10 : 0) +
        (filters.materials.length > 0 ? filters.materials.filter(m => a.materials.some(am => am.toLowerCase().includes(m.toLowerCase()))).length * 5 : 0) +
        (filters.technologies.length > 0 ? filters.technologies.filter(t => a.technologies.some(at => at.toLowerCase().includes(t.toLowerCase()))).length * 5 : 0);
      const bScore = bNameMatch + (b.premium ? 20 : 0) + (b.verified ? 10 : 0) +
        (filters.materials.length > 0 ? filters.materials.filter(m => b.materials.some(bm => bm.toLowerCase().includes(m.toLowerCase()))).length * 5 : 0) +
        (filters.technologies.length > 0 ? filters.technologies.filter(t => b.technologies.some(bt => bt.toLowerCase().includes(t.toLowerCase()))).length * 5 : 0);
      return bScore - aScore;
    });

    return sorted;
  }, [filters, searchQuery, suppliers, sortBy, certifications, quoteData, quoteMap]);

  // Filter suppliers for map display - only include those with valid coordinates
  const suppliersForMap = useMemo(() => {
    return filteredSuppliers.filter(supplier => {
      const lat = supplier.location.lat;
      const lng = supplier.location.lng;
      
      // Filter out invalid coordinates
      if (!lat || !lng || lat === 0 || lng === 0) return false;
      
      // Filter out Berlin default coordinates (52.52, 13.40)
      if (Math.abs(lat - 52.52) < 0.01 && Math.abs(lng - 13.40) < 0.01) return false;
      
      return true;
    });
  }, [filteredSuppliers]);

  // Track view_item_list for GA4 Enhanced Ecommerce
  useEffect(() => {
    if (filteredSuppliers.length === 0 || loading) return;

    // Track view_item_list event
    const ga4Items = filteredSuppliers.slice(0, 50).map((supplier, index) => 
      supplierToGA4Item(supplier, index)
    );
    
    trackViewItemList(ga4Items, 'Search Results', {
      materials: filters.materials,
      technologies: filters.technologies,
      areas: filters.areas,
      searchQuery: searchQuery || undefined,
    });
  }, [filteredSuppliers, filters, searchQuery, loading]);

  // Track search in history when filters/query change
  useEffect(() => {
    if (loading) return;
    const hasFilters = filters.materials.length > 0 || filters.technologies.length > 0 || 
                       filters.areas.length > 0 || searchQuery.trim();
    if (!hasFilters) return;

    const timer = setTimeout(() => {
      addToHistory({
        query: searchQuery || originalQuery || '',
        materials: filters.materials,
        technologies: filters.technologies,
        areas: filters.areas,
        certifications,
        volume: productionVolume || undefined,
        urgency: urgency !== 'standard' ? urgency : undefined,
        resultsCount: filteredSuppliers.length,
      });
    }, 2000); // Delay to avoid saving while still filtering

    return () => clearTimeout(timer);
  }, [filters, searchQuery, loading]);

  // Add BreadcrumbList structured data for search page
  useEffect(() => {
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://amsupplycheck.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Search Suppliers",
          "item": "https://amsupplycheck.com/search"
        }
      ]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'breadcrumb-jsonld';
    script.textContent = JSON.stringify(breadcrumbSchema);
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById('breadcrumb-jsonld');
      if (el) el.remove();
    };
  }, []);

  // Add ItemList structured data for search results
  useEffect(() => {
    if (filteredSuppliers.length === 0) return;

    // ItemList structured data for search results
    const itemListData = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Search Results - 3D Printing Suppliers',
      description: `Found ${filteredSuppliers.length} 3D printing suppliers matching your criteria`,
      numberOfItems: filteredSuppliers.length,
      itemListElement: filteredSuppliers.slice(0, 50).map((supplier, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'LocalBusiness',
          '@id': `${window.location.origin}/suppliers/${supplier.id}`,
          name: supplier.name,
          url: `${window.location.origin}/suppliers/${supplier.id}`,
          description: supplier.description || `${supplier.name} offers professional 3D printing services`,
          ...(supplier.logoUrl && { image: supplier.logoUrl }),
          address: {
            '@type': 'PostalAddress',
            addressLocality: supplier.location.city,
            addressCountry: supplier.location.country,
          },
          ...(supplier.rating && {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: supplier.rating,
              reviewCount: supplier.reviewCount || 0,
            },
          }),
        },
      })),
    };

    // Add or update ItemList structured data script
    let itemListScript = document.querySelector('script[type="application/ld+json"][data-itemlist-schema]');
    if (!itemListScript) {
      itemListScript = document.createElement('script');
      itemListScript.setAttribute('type', 'application/ld+json');
      itemListScript.setAttribute('data-itemlist-schema', 'true');
      document.head.appendChild(itemListScript);
    }
    itemListScript.textContent = JSON.stringify(itemListData);

    // Update page title
    document.title = `Search Results (${filteredSuppliers.length}) - SupplyCheck`;

    // Cleanup function
    return () => {
      const script = document.querySelector('script[type="application/ld+json"][data-itemlist-schema]');
      if (script) {
        script.remove();
      }
      document.title = 'SupplyCheck - Find 3D Printing Suppliers';
    };
  }, [filteredSuppliers]);

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
        <title>Search 3D Printing Suppliers | AMSupplyCheck</title>
        <meta name="description" content="Search and compare 3D printing suppliers worldwide. Filter by materials, technologies, location, and certifications to find the perfect manufacturing partner." />
        <link rel="canonical" href="https://amsupplycheck.com/search" />
        <meta property="og:title" content="Search 3D Printing Suppliers | AMSupplyCheck" />
        <meta property="og:description" content="Search and compare 3D printing suppliers worldwide. Filter by materials, technologies, location, and certifications." />
        <meta property="og:url" content="https://amsupplycheck.com/search" />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content="Search 3D Printing Suppliers | AMSupplyCheck" />
        <meta name="twitter:description" content="Search and compare 3D printing suppliers worldwide. Filter by materials, technologies, location, and certifications." />
      </Helmet>
      <div className={`fixed top-0 left-0 right-0 z-50 bg-background transition-transform duration-300 ${showNavbar ? 'translate-y-0' : '-translate-y-full'}`}>
        <Navbar />
      </div>
      
      <div className={`transition-all duration-300 ${showNavbar ? 'pt-28' : 'pt-0'}`}>
        {/* Results Summary Bar */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Results count */}
            <span className="text-sm font-medium text-foreground">
              {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? 's' : ''}
            </span>
            
            {/* Active filter summary */}
            {originalQuery && (
              <span className="text-sm text-muted-foreground">
                for "<span className="font-medium text-foreground">{originalQuery}</span>"
              </span>
            )}
            
            {/* Active filter badges */}
            {filters.technologies.map(t => (
              <Badge key={`t-${t}`} variant="secondary" className="text-xs cursor-pointer hover:bg-destructive/10 group" onClick={() => {
                const newFilters = { ...filters, technologies: filters.technologies.filter(x => x !== t) };
                setFilters(newFilters);
                const params = new URLSearchParams(searchParams);
                if (newFilters.technologies.length > 0) params.set('technologies', newFilters.technologies.join(','));
                else params.delete('technologies');
                navigate(`/search?${params.toString()}`);
              }}>
                {t} <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100" />
              </Badge>
            ))}
            {filters.materials.map(m => (
              <Badge key={`m-${m}`} variant="secondary" className="text-xs cursor-pointer hover:bg-destructive/10 group" onClick={() => {
                const newFilters = { ...filters, materials: filters.materials.filter(x => x !== m) };
                setFilters(newFilters);
                const params = new URLSearchParams(searchParams);
                if (newFilters.materials.length > 0) params.set('materials', newFilters.materials.join(','));
                else params.delete('materials');
                navigate(`/search?${params.toString()}`);
              }}>
                {m} <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100" />
              </Badge>
            ))}
            {filters.areas.map(a => (
              <Badge key={`a-${a}`} variant="secondary" className="text-xs cursor-pointer hover:bg-destructive/10 group" onClick={() => {
                const newFilters = { ...filters, areas: filters.areas.filter(x => x !== a) };
                setFilters(newFilters);
                const params = new URLSearchParams(searchParams);
                if (newFilters.areas.length > 0) params.set('areas', newFilters.areas.join(','));
                else params.delete('areas');
                navigate(`/search?${params.toString()}`);
              }}>
                {a} <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100" />
              </Badge>
            ))}
            {urgency === 'urgent' && (
              <Badge className="bg-red-500/10 text-red-600 border-red-200 text-xs">
                <Zap className="h-3 w-3 mr-1" /> Urgent
              </Badge>
            )}
            {urgency === 'rush' && (
              <Badge className="bg-orange-500/10 text-orange-600 border-orange-200 text-xs">
                <Zap className="h-3 w-3 mr-1" /> Rush
              </Badge>
            )}
            {productionVolume && (
              <Badge variant="outline" className="text-xs">
                <Factory className="h-3 w-3 mr-1" />
                {productionVolume === 'prototype' ? 'Prototype' : 
                 productionVolume === 'low' ? 'Low Volume' :
                 productionVolume === 'medium' ? 'Medium Volume' :
                 productionVolume === 'high' ? 'High Volume' : 'Mass Production'}
              </Badge>
            )}
            {certifications.map(cert => (
              <Badge key={cert} variant="outline" className="text-xs cursor-pointer hover:bg-destructive/10 group"
                onClick={() => {
                  const newCerts = certifications.filter(c => c !== cert);
                  setCertifications(newCerts);
                  const params = new URLSearchParams(searchParams);
                  if (newCerts.length > 0) params.set('certifications', newCerts.join(','));
                  else params.delete('certifications');
                  navigate(`/search?${params.toString()}`);
                }}
              >
                <Award className="h-3 w-3 mr-1" /> {cert}
                <X className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100" />
              </Badge>
            ))}
            
            {/* Clear All button */}
            {(filters.materials.length > 0 || filters.technologies.length > 0 || filters.areas.length > 0 || certifications.length > 0 || searchQuery || originalQuery) && (
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-destructive"
                onClick={() => {
                  setFilters({ materials: [], technologies: [], areas: [], requirements: [] });
                  setSearchQuery('');
                  setCertifications([]);
                  setProductionVolume('');
                  setUrgency('standard');
                  setOriginalQuery('');
                  navigate('/search');
                }}
              >
                <X className="h-3 w-3 mr-1" /> Clear all
              </Button>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Sort dropdown */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="h-7 w-[140px] text-xs">
                <ArrowUpDown className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                {quoteData && <SelectItem value="price">Price</SelectItem>}
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="location">Location</SelectItem>
              </SelectContent>
            </Select>

            {/* Save Search */}
            <Button variant="outline" size="sm" className="h-7 text-xs"
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
                  return;
                }
                setSaveName(originalQuery || searchQuery || 'My Search');
                setShowSaveDialog(true);
              }}
            >
              <Star className="h-3 w-3 mr-1" />
              {isAuthenticated ? 'Save' : 'Sign in to save'}
            </Button>
          </div>
        </div>

        <div 
          ref={filterPanelRef}
          className={`${showFilters ? 'block' : 'hidden'} ${mobileView === 'map' ? 'hidden' : 'block'} lg:block sticky ${showNavbar ? 'top-16 md:top-20' : 'top-0'} z-40 bg-background py-4 mb-6 border-b border-border transition-all duration-300`}
        >
          <FilterPanel 
            onFilterChange={setFilters} 
            onSearchChange={setSearchQuery}
            onSearch={() => {
              const searchParams = new URLSearchParams();
              if (filters.technologies.length > 0) searchParams.set('technologies', filters.technologies.join(','));
              if (filters.materials.length > 0) searchParams.set('materials', filters.materials.join(','));
              if (filters.areas.length > 0) searchParams.set('areas', filters.areas.join(','));
              if (filters.requirements && filters.requirements.length > 0) searchParams.set('requirements', filters.requirements.join(','));
              if (searchQuery.trim()) searchParams.set('keywords', searchQuery.trim());
              navigate(`/search?${searchParams.toString()}`);
            }}
            searchQuery={searchQuery}
            filters={filters}
          />
        </div>

        {/* Mobile View Toggle - Fixed position, independent of filter panel */}
        <div 
          className="lg:hidden fixed left-0 right-0 z-40 bg-background border-b border-border transition-all duration-300"
          style={{ 
            top: `${showNavbar ? 64 : 0}px` 
          }}
        >
          <div className="mx-auto px-4">
            <div className="flex gap-2 py-1.5">
              <Button
                variant={mobileView === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMobileView('list')}
                className="flex-1 h-9"
              >
                <SearchIcon className="h-4 w-4 mr-2" />
                List
              </Button>
              <Button
                variant={mobileView === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMobileView('map')}
                className="flex-1 h-9"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Map
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Layout - Suppliers List + Map */}
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.8fr] gap-6 lg:mt-6 lg:min-h-screen">
          {/* Left Column: Suppliers List (single column) */}
          <div 
            className={`min-w-0 ${mobileView === 'map' ? 'hidden lg:block' : 'block'}`}
            style={{
              height: typeof window !== 'undefined' && window.innerWidth < 1024 && mobileView === 'list'
                ? `calc(100vh - ${(showNavbar ? 64 : 0) + filterPanelHeight + 45}px)`
                : 'auto'
            }}
          >
            {filteredSuppliers.length > 0 ? (
              <div 
                className="flex flex-col gap-3 mt-3 lg:mt-0 overflow-y-auto lg:overflow-y-visible"
                style={{
                  height: typeof window !== 'undefined' && window.innerWidth < 1024 && mobileView === 'list'
                    ? `calc(100vh - ${(showNavbar ? 64 : 0) + filterPanelHeight + 45 + 12}px)`
                    : 'auto'
                }}
              >
                {/* Related Searches */}
                <RelatedSearches
                  currentTechnologies={filters.technologies}
                  currentMaterials={filters.materials}
                  currentAreas={filters.areas}
                  currentKeywords={searchQuery}
                />
                
                {filteredSuppliers.map((supplier, index) => {
                  // Compute which active requirements this supplier matches
                  const matched = (filters.requirements || []).filter(req => {
                    const reqTechs = requirementToTechnologies[req as SearchRequirement] || [];
                    const reqMats = requirementToMaterials[req as SearchRequirement] || [];
                    const techMatch = reqTechs.some(rt =>
                      supplier.technologies.some(st => {
                        const lower = st.toLowerCase();
                        const rtLower = rt.toLowerCase().replace(/[\/()]/g, '');
                        return lower.includes(rtLower) || rtLower.includes(lower);
                      })
                    );
                    const matMatch = reqMats.some(rm =>
                      supplier.materials.some(sm => {
                        const lower = sm.toLowerCase().replace(/-/g, ' ');
                        const rmLower = rm.toLowerCase().replace(/-/g, ' ');
                        return lower.includes(rmLower) || rmLower.includes(lower);
                      })
                    );
                    return techMatch || matMatch;
                  });
                  // Look up live quote for this supplier
                  const normId = normalizeVendorId(supplier.id);
                  const normName = supplier.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                  const matchedQuote = quoteMap.get(normId) || quoteMap.get(normName);
                  const liveQuoteProp = matchedQuote ? {
                    unitPrice: matchedQuote.unitPrice,
                    currency: matchedQuote.currency,
                    estimatedLeadTimeDays: matchedQuote.estimatedLeadTimeDays,
                    material: matchedQuote.material,
                  } : undefined;
                  return (
                    <SupplierCard
                      key={supplier.id}
                      supplier={supplier}
                      index={index}
                      listName={quoteData ? 'STL Quote Results' : 'Search Results'}
                      matchedRequirements={matched}
                      liveQuote={liveQuoteProp}
                      searchedMaterials={filters.materials}
                      searchedTechnologies={filters.technologies}
                    />
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 lg:p-12 text-center mt-3 lg:mt-0">
                <div className="text-muted-foreground mb-4">
                  <SearchIcon className="h-8 lg:h-12 w-8 lg:w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-base lg:text-lg font-medium mb-2">No suppliers found</h3>
                  <p className="text-sm lg:text-base">Try adjusting your filters or search query to find more results.</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilters({ materials: [], technologies: [], areas: [], requirements: [] });
                    setSearchQuery('');
                  }}
                >
                  Clear all filters
                </Button>
              </Card>
            )}
          </div>

          {/* Right Column: Map */}
          <div className={`${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
            <div 
              className="lg:sticky transition-all duration-300"
              style={{ 
                top: typeof window !== 'undefined' && window.innerWidth < 1024 && mobileView === 'map'
                  ? `${(showNavbar ? 64 : 0) + 45}px`
                  : `${(showNavbar ? 80 : 0) + filterPanelHeight}px` 
              }}
            >
              <SupplierMap
                suppliers={suppliersForMap}
                height={
                  typeof window !== 'undefined' && window.innerWidth < 1024 && mobileView === 'map'
                    ? `calc(100vh - ${(showNavbar ? 64 : 0) + 45}px)`
                    : `calc(100vh - ${(showNavbar ? 80 : 0) + filterPanelHeight + 24}px)`
                }
                className="w-full rounded-lg"
              />
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Save Search Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save this search</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder="Give your search a name..."
              autoFocus
            />
            <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
              {filters.technologies.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
              {filters.materials.map(m => <Badge key={m} variant="outline" className="text-xs">{m}</Badge>)}
              {filters.areas.map(a => <Badge key={a} variant="outline" className="text-xs">{a}</Badge>)}
              {certifications.map(c => <Badge key={c} variant="outline" className="text-xs">{c}</Badge>)}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                const success = await saveSearch({
                  name: saveName || 'My Search',
                  query: searchQuery || originalQuery || undefined,
                  materials: filters.materials,
                  technologies: filters.technologies,
                  areas: filters.areas,
                  certifications,
                  volume: productionVolume || undefined,
                  urgency: urgency !== 'standard' ? urgency : undefined,
                });
                if (success) setShowSaveDialog(false);
              }}
              disabled={!saveName.trim()}
            >
              <Star className="h-4 w-4 mr-1.5" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Search;