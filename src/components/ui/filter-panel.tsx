import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getAllMaterials, getAllTechnologies, getAllAreas } from '@/lib/supplierData';
import { 
  getCompatibleMaterials, 
  getCompatibleTechnologies,
  technologyCategories,
  materialCategories,
  technologyPriceIndex,
  materialPriceIndex,
  getPriceTier,
  SEARCH_REQUIREMENTS,
  requirementToTechnologies,
  requirementToMaterials,
  type SearchRequirement
} from '@/lib/technologyMaterialCompatibility';
import { X, Zap, TrendingUp } from 'lucide-react';
import MultiSelect from '@/components/ui/multi-select';
import GroupedMultiSelect from '@/components/ui/grouped-multi-select';

const POPULAR_SEARCHES = [
  { label: 'SLS Nylon in Germany', query: 'SLS nylon parts in Germany' },
  { label: 'Metal 3D printing USA', query: 'metal 3D printing services in USA' },
  { label: 'Medical-grade prototypes', query: 'biocompatible prototypes for medical devices' },
  { label: 'Aerospace titanium parts', query: 'titanium parts for aerospace with AS9100' },
  { label: 'Fast turnaround Europe', query: 'quick prototyping services in Europe' },
];
import { trackFilterApplied } from '@/lib/analytics';
import AISearchInput from '@/components/AISearchInput';
import type { AISearchFilters } from '@/hooks/use-ai-search';

interface FilterPanelProps {
  onFilterChange: (filters: FilterState) => void;
  onSearchChange?: (searchQuery: string) => void;
  onSearch?: () => void;
  searchQuery?: string;
  filters: FilterState;
  className?: string;
}

export interface FilterState {
  materials: string[];
  technologies: string[];
  areas: string[];
  requirements?: string[];
}

const FilterPanel: React.FC<FilterPanelProps> = ({ 
  onFilterChange, 
  onSearchChange,
  onSearch, 
  searchQuery = '', 
  filters,
  className = "" 
}) => {
  // Track previous filter counts for analytics
  const [previousFilterCounts, setPreviousFilterCounts] = React.useState<Record<string, number>>({});
  const [aiSearchQuery, setAiSearchQuery] = React.useState('');

  const handlePopularSearch = (query: string) => {
    setAiSearchQuery(query);
  };

  // Get dynamic data arrays from supplier data
  const allMaterials = getAllMaterials();
  const allTechnologies = getAllTechnologies();
  const areas = getAllAreas();

  // Filter materials based on selected technologies AND requirements
  const availableMaterials = useMemo(() => {
    let result = allMaterials;
    
    // Filter by technologies
    if (filters.technologies.length > 0) {
      const compatible = getCompatibleMaterials(filters.technologies);
      result = result.filter(material => compatible.includes(material));
    }
    
    // Additionally filter by requirements if selected
    if (filters.requirements && filters.requirements.length > 0) {
      const reqMaterials = new Set<string>();
      filters.requirements.forEach(req => {
        const materials = requirementToMaterials[req as SearchRequirement] || [];
        materials.forEach(m => reqMaterials.add(m));
      });
      result = result.filter(m => reqMaterials.has(m));
    }
    
    return result;
  }, [filters.technologies, filters.requirements, allMaterials]);

  // Filter technologies based on selected materials AND requirements
  const availableTechnologies = useMemo(() => {
    let result = allTechnologies;
    
    // Filter by materials
    if (filters.materials.length > 0) {
      const compatible = getCompatibleTechnologies(filters.materials);
      result = result.filter(tech => compatible.includes(tech));
    }
    
    // Additionally filter by requirements if selected
    if (filters.requirements && filters.requirements.length > 0) {
      const reqTechs = new Set<string>();
      filters.requirements.forEach(req => {
        const techs = requirementToTechnologies[req as SearchRequirement] || [];
        techs.forEach(t => reqTechs.add(t));
      });
      result = result.filter(t => reqTechs.has(t));
    }
    
    return result;
  }, [filters.materials, filters.requirements, allTechnologies]);

  // Generate filter info messages
  const materialsFilterInfo = useMemo(() => {
    const parts: string[] = [];
    if (filters.technologies.length > 0) {
      parts.push(`compatible with ${filters.technologies.join(', ')}`);
    }
    if (filters.requirements && filters.requirements.length > 0) {
      parts.push(`matching ${filters.requirements.join(', ')}`);
    }
    if (parts.length === 0) return undefined;
    return `Showing ${availableMaterials.length} of ${allMaterials.length} materials ${parts.join(' and ')}`;
  }, [filters.technologies, filters.requirements, availableMaterials.length, allMaterials.length]);

  const technologiesFilterInfo = useMemo(() => {
    const parts: string[] = [];
    if (filters.materials.length > 0) {
      parts.push(`compatible with ${filters.materials.join(', ')}`);
    }
    if (filters.requirements && filters.requirements.length > 0) {
      parts.push(`matching ${filters.requirements.join(', ')}`);
    }
    if (parts.length === 0) return undefined;
    return `Showing ${availableTechnologies.length} of ${allTechnologies.length} technologies ${parts.join(' and ')}`;
  }, [filters.materials, filters.requirements, availableTechnologies.length, allTechnologies.length]);

  const handleValuesChange = (category: keyof FilterState, values: string[]) => {
    const previousCount = previousFilterCounts[category] || 0;
    
    onFilterChange({
      ...filters,
      [category]: values
    });

    // Track filter change (will be called after results update)
    setTimeout(() => {
      trackFilterApplied(
        category as 'material' | 'technology' | 'area',
        values,
        previousCount,
        values.length
      );
      setPreviousFilterCounts(prev => ({ ...prev, [category]: values.length }));
    }, 100);
  };

  const clearAllFilters = () => {
    const totalPrevious = filters.materials.length + filters.technologies.length + filters.areas.length + (filters.requirements?.length || 0);
    
    onFilterChange({ materials: [], technologies: [], areas: [], requirements: [] });
    onSearchChange?.('');
    
    trackFilterApplied('all', [], totalPrevious, 0);
    setPreviousFilterCounts({});
  };

  const totalActiveFilters = filters.materials.length + filters.technologies.length + filters.areas.length + (filters.requirements?.length || 0);

  // Handle AI search filters
  const handleAIFiltersExtracted = (aiFilters: AISearchFilters) => {
    // Map AI-extracted filters to our filter format
    const newFilters: FilterState = {
      technologies: aiFilters.technologies.filter(t => 
        allTechnologies.some(at => at.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(at.toLowerCase()))
      ).map(t => allTechnologies.find(at => at.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(at.toLowerCase())) || t),
      materials: aiFilters.materials.filter(m => 
        allMaterials.some(am => am.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(am.toLowerCase()))
      ).map(m => allMaterials.find(am => am.toLowerCase().includes(m.toLowerCase()) || m.toLowerCase().includes(am.toLowerCase())) || m),
      areas: aiFilters.areas.filter(a => 
        areas.some(aa => aa.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(aa.toLowerCase()))
      ).map(a => areas.find(aa => aa.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(aa.toLowerCase())) || a),
      requirements: filters.requirements || []
    };
    
    onFilterChange(newFilters);
    
    // Set keywords if any
    if (aiFilters.keywords) {
      onSearchChange?.(aiFilters.keywords);
    }
    
    // Trigger search after applying filters
    setTimeout(() => onSearch?.(), 100);
  };

  const handleAIClear = () => {
    onFilterChange({ materials: [], technologies: [], areas: [], requirements: [] });
    onSearchChange?.('');
  };

  return (
    <Card className={`bg-gradient-card border-border shadow-filter ${className}`}>
      <CardContent className="p-3 lg:p-4">
        <div className="flex flex-col gap-3">
          {/* AI-Powered Search - Primary */}
          <AISearchInput
            onFiltersExtracted={handleAIFiltersExtracted}
            onClear={handleAIClear}
            placeholder="Try: 'metal parts for aerospace in Europe' or 'flexible prototypes in Scandinavia'"
            externalQuery={aiSearchQuery}
          />

          {/* Popular Searches */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Popular:
            </span>
            {POPULAR_SEARCHES.map((item) => (
              <button
                key={item.label}
                onClick={() => handlePopularSearch(item.query)}
                className="text-xs text-primary/80 hover:text-primary hover:underline underline-offset-2 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Separator */}
          <div className="border-t border-border/50" />

          {/* Quick Requirements Badges */}
          <div className="flex flex-wrap gap-1.5">
            {SEARCH_REQUIREMENTS.map((req) => {
              const isSelected = filters.requirements?.includes(req);
              return (
                <Badge
                  key={req}
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer transition-all duration-200 text-xs px-2 py-0.5 hover:scale-105 active:scale-95 ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90' 
                      : 'hover:bg-accent hover:border-primary/30 border-border'
                  }`}
                  onClick={() => {
                    const current = filters.requirements || [];
                    if (isSelected) {
                      handleValuesChange('requirements', current.filter(r => r !== req));
                    } else {
                      handleValuesChange('requirements', [...current, req]);
                    }
                  }}
                >
                  <Zap className="h-3 w-3 mr-1" />
                  {req}
                </Badge>
              );
            })}
          </div>

          {/* Filter Dropdowns - Single Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Technologies Filter */}
            <GroupedMultiSelect
              options={availableTechnologies}
              categories={technologyCategories}
              selectedValues={filters.technologies}
              onValuesChange={(values) => handleValuesChange('technologies', values)}
              placeholder="Technologies"
              searchPlaceholder="Search technologies..."
              filterInfo={technologiesFilterInfo}
              totalCount={allTechnologies.length}
              priceIndex={technologyPriceIndex}
              getPriceTier={getPriceTier}
            />

            {/* Materials Filter */}
            <GroupedMultiSelect
              options={availableMaterials}
              categories={materialCategories}
              selectedValues={filters.materials}
              onValuesChange={(values) => handleValuesChange('materials', values)}
              placeholder="Materials"
              searchPlaceholder="Search materials..."
              filterInfo={materialsFilterInfo}
              totalCount={allMaterials.length}
              priceIndex={materialPriceIndex}
              getPriceTier={getPriceTier}
            />

            {/* Areas Filter */}
            <MultiSelect
              options={areas}
              selectedValues={filters.areas}
              onValuesChange={(values) => handleValuesChange('areas', values)}
              placeholder="Areas"
              searchPlaceholder="Search areas..."
            />
          </div>

          {/* Active Filters Display */}
          {totalActiveFilters > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center pt-1 border-t border-border/50">
              <span className="text-xs text-muted-foreground mr-1">Active:</span>
              {/* Requirements badges */}
              {filters.requirements?.map(req => (
                <Badge
                  key={`req-${req}`}
                  variant="default"
                  className="text-xs cursor-pointer group bg-primary/80 px-2 py-0.5"
                  onClick={() => handleValuesChange('requirements', (filters.requirements || []).filter(r => r !== req))}
                >
                  {req}
                  <X className="ml-1 h-3 w-3 group-hover:text-destructive" />
                </Badge>
              ))}
              {filters.technologies.map(tech => (
                <Badge
                  key={tech}
                  variant="secondary"
                  className="text-xs cursor-pointer group px-2 py-0.5"
                  onClick={() => handleValuesChange('technologies', filters.technologies.filter(t => t !== tech))}
                >
                  {tech}
                  {technologyPriceIndex[tech] && (
                    <span className="ml-1 opacity-60">{getPriceTier(technologyPriceIndex[tech]).symbol}</span>
                  )}
                  <X className="ml-1 h-3 w-3 group-hover:text-destructive" />
                </Badge>
              ))}
              {filters.materials.map(material => (
                <Badge
                  key={material}
                  variant="secondary"
                  className="text-xs cursor-pointer group px-2 py-0.5"
                  onClick={() => handleValuesChange('materials', filters.materials.filter(m => m !== material))}
                >
                  {material}
                  {materialPriceIndex[material] && (
                    <span className="ml-1 opacity-60">{getPriceTier(materialPriceIndex[material]).symbol}</span>
                  )}
                  <X className="ml-1 h-3 w-3 group-hover:text-destructive" />
                </Badge>
              ))}
              {filters.areas.map(area => (
                <Badge
                  key={area}
                  variant="secondary"
                  className="text-xs cursor-pointer group px-2 py-0.5"
                  onClick={() => handleValuesChange('areas', filters.areas.filter(a => a !== area))}
                >
                  {area}
                  <X className="ml-1 h-3 w-3 group-hover:text-destructive" />
                </Badge>
              ))}
              {totalActiveFilters > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-5 px-2 text-xs text-muted-foreground hover:text-foreground ml-auto"
                >
                  Clear all
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterPanel;
