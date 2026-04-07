import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useSuppliers, type SupplierFilters, type SupplierListItem } from '@/hooks/use-suppliers';
import Navbar from '@/components/ui/navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SupplierLogo from '@/components/ui/supplier-logo';
import { Search, MapPin, Verified, ExternalLink, X, SlidersHorizontal, GitCompare, ChevronDown, ChevronUp, Factory, Shield, Tag, Globe } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

// ─── Supplier Card ─────────────────────────────
const SupplierCard: React.FC<{ supplier: SupplierListItem; onCompareToggle?: (id: string) => void; isComparing?: boolean }> = ({ supplier, onCompareToggle, isComparing }) => {
  const navigate = useNavigate();
  
  return (
    <Card
      className="bg-card border-border hover:border-primary/40 hover:shadow-hover transition-all duration-300 cursor-pointer group"
      onClick={() => navigate(`/suppliers/${supplier.supplier_id}`)}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <SupplierLogo name={supplier.name} logoUrl={supplier.logo_url || undefined} size="lg" className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {supplier.name}
              </h3>
              {supplier.verified && <Verified className="h-4 w-4 text-primary flex-shrink-0" />}
            </div>
            
            {(supplier.location_city || supplier.location_country) && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                <MapPin className="h-3.5 w-3.5" />
                <span>{[supplier.location_city, supplier.country?.name || supplier.location_country].filter(Boolean).join(', ')}</span>
              </div>
            )}

            {supplier.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{supplier.description}</p>
            )}

            {/* Technologies */}
            {supplier.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {supplier.technologies.slice(0, 4).map(tech => (
                  <Badge key={tech.id} variant="secondary" className="text-xs font-normal">
                    {tech.name}
                  </Badge>
                ))}
                {supplier.technologies.length > 4 && (
                  <Badge variant="secondary" className="text-xs font-normal">
                    +{supplier.technologies.length - 4}
                  </Badge>
                )}
              </div>
            )}

            {/* Materials */}
            {supplier.materials.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {supplier.materials.slice(0, 3).map(mat => (
                  <Badge key={mat.id} variant="outline" className="text-xs font-normal">
                    {mat.name}
                  </Badge>
                ))}
                {supplier.materials.length > 3 && (
                  <Badge variant="outline" className="text-xs font-normal">
                    +{supplier.materials.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Tags */}
            {supplier.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {supplier.tags.slice(0, 3).map(tag => (
                  <Badge key={tag.id} className="text-xs font-normal bg-primary/10 text-primary border-primary/20">
                    {tag.name}
                  </Badge>
                ))}
                {supplier.tags.length > 3 && (
                  <Badge className="text-xs font-normal bg-primary/10 text-primary border-primary/20">
                    +{supplier.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {supplier.website && (
              <a
                href={supplier.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => {
                  e.stopPropagation();
                  e.preventDefault();
                  const opened = window.open(supplier.website, '_blank');
                  if (!opened) window.location.href = supplier.website;
                }}
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary-hover h-9 px-4 text-sm transition-colors"
              >
                Visit <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </a>
            )}
            <Button
              variant={isComparing ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={e => { e.stopPropagation(); onCompareToggle?.(supplier.id); }}
            >
              <GitCompare className="h-3.5 w-3.5 mr-1" />
              {isComparing ? 'Selected' : 'Compare'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Filter Section ─────────────────────────────
interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  items: { slug?: string; name: string; count: number; category?: string | null }[];
  selected: string[];
  onToggle: (slug: string) => void;
  maxVisible?: number;
}

const FilterSection: React.FC<FilterSectionProps> = ({ title, icon, items, selected, onToggle, maxVisible = 8 }) => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, maxVisible);
  
  if (items.length === 0) return null;
  
  return (
    <Collapsible defaultOpen className="mb-4">
      <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-foreground hover:text-primary transition-colors py-2">
        <span className="flex items-center gap-2">{icon} {title}</span>
        <ChevronDown className="h-4 w-4" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1 mt-1">
          {visible.map(item => (
            <label key={item.slug || item.name} className="flex items-center gap-2 py-1 px-1 rounded hover:bg-muted/50 cursor-pointer text-sm">
              <Checkbox
                checked={selected.includes(item.slug || item.name)}
                onCheckedChange={() => onToggle(item.slug || item.name)}
              />
              <span className="flex-1 text-muted-foreground">{item.name}</span>
              <span className="text-xs text-muted-foreground/60">{item.count}</span>
            </label>
          ))}
          {items.length > maxVisible && (
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Show less' : `Show all ${items.length}`}
              {expanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// ─── Comparison Table ─────────────────────────────
const ComparisonTable: React.FC<{ suppliers: SupplierListItem[]; onRemove: (id: string) => void; onClose: () => void }> = ({ suppliers, onRemove, onClose }) => {
  if (suppliers.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Compare Suppliers</h2>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-48">Attribute</TableHead>
                {suppliers.map(s => (
                  <TableHead key={s.id} className="min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <SupplierLogo name={s.name} logoUrl={s.logo_url || undefined} size="sm" />
                      <span className="font-semibold">{s.name}</span>
                      <Button variant="ghost" size="sm" onClick={() => onRemove(s.id)} className="ml-auto h-6 w-6 p-0">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-foreground">Country</TableCell>
                {suppliers.map(s => (
                  <TableCell key={s.id}>{s.country?.name || s.location_country || '—'}</TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">Technologies</TableCell>
                {suppliers.map(s => (
                  <TableCell key={s.id}>
                    <div className="flex flex-wrap gap-1">
                      {s.technologies.map(t => <Badge key={t.id} variant="secondary" className="text-xs">{t.name}</Badge>)}
                      {s.technologies.length === 0 && <span className="text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">Materials</TableCell>
                {suppliers.map(s => (
                  <TableCell key={s.id}>
                    <div className="flex flex-wrap gap-1">
                      {s.materials.map(m => <Badge key={m.id} variant="outline" className="text-xs">{m.name}</Badge>)}
                      {s.materials.length === 0 && <span className="text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">Certifications</TableCell>
                {suppliers.map(s => (
                  <TableCell key={s.id}>
                    <div className="flex flex-wrap gap-1">
                      {s.certifications.map(c => <Badge key={c.id} className="text-xs bg-primary/10 text-primary border-primary/20">{c.name}</Badge>)}
                      {s.certifications.length === 0 && <span className="text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">Tags</TableCell>
                {suppliers.map(s => (
                  <TableCell key={s.id}>
                    <div className="flex flex-wrap gap-1">
                      {s.tags.map(t => <Badge key={t.id} variant="secondary" className="text-xs">{t.name}</Badge>)}
                      {s.tags.length === 0 && <span className="text-muted-foreground">—</span>}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">Verified</TableCell>
                {suppliers.map(s => (
                  <TableCell key={s.id}>
                    {s.verified ? <Verified className="h-4 w-4 text-primary" /> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">Location</TableCell>
                {suppliers.map(s => (
                  <TableCell key={s.id}>
                    {[s.location_city, s.country?.name || s.location_country].filter(Boolean).join(', ') || '—'}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground">Website</TableCell>
                {suppliers.map(s => (
                  <TableCell key={s.id}>
                    {s.website ? (
                      <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        Visit <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : '—'}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ─────────────────────────────
const Suppliers: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [showFilters, setShowFilters] = useState(true);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Parse filters from URL
  const filters: SupplierFilters = useMemo(() => ({
    search: searchQuery || undefined,
    technologies: searchParams.get('tech')?.split(',').filter(Boolean) || undefined,
    materials: searchParams.get('mat')?.split(',').filter(Boolean) || undefined,
    certifications: searchParams.get('cert')?.split(',').filter(Boolean) || undefined,
    tags: searchParams.get('tag')?.split(',').filter(Boolean) || undefined,
    countries: searchParams.get('country')?.split(',').filter(Boolean) || undefined,
  }), [searchQuery, searchParams]);

  const { suppliers, allSuppliers, filterOptions, isLoading } = useSuppliers(filters);

  const updateFilter = (key: string, values: string[]) => {
    const params = new URLSearchParams(searchParams);
    if (values.length > 0) {
      params.set(key, values.join(','));
    } else {
      params.delete(key);
    }
    setSearchParams(params, { replace: true });
  };

  const toggleFilter = (key: string, slug: string) => {
    const paramKey = key === 'technologies' ? 'tech' : key === 'materials' ? 'mat' : key === 'certifications' ? 'cert' : key === 'tags' ? 'tag' : 'country';
    const current = searchParams.get(paramKey)?.split(',').filter(Boolean) || [];
    const next = current.includes(slug) ? current.filter(v => v !== slug) : [...current, slug];
    updateFilter(paramKey, next);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSearchParams({}, { replace: true });
  };

  const activeFilterCount = [
    filters.technologies?.length || 0,
    filters.materials?.length || 0,
    filters.certifications?.length || 0,
    filters.tags?.length || 0,
    filters.countries?.length || 0,
  ].reduce((a, b) => a + b, 0);

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 4) return prev; // max 4
      return [...prev, id];
    });
  };

  const compareSuppliers = allSuppliers.filter(s => compareIds.includes(s.id));

  return (
    <>
      <Helmet>
        <title>Find Manufacturing Suppliers | Supplycheck</title>
        <meta name="description" content="Search and compare manufacturing suppliers by technology, material, certification and location. Find the right supplier for your project." />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-background pt-20">
        {/* Search Header */}
        <div className="border-b border-border bg-card/50">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Find Manufacturing Suppliers</h1>
            <div className="flex gap-3">
              <div className="relative flex-1 max-w-2xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search suppliers, technologies, materials..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-1 h-5 px-1.5 text-xs">{activeFilterCount}</Badge>
                )}
              </Button>
            </div>

            {/* Active filters */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {filters.technologies?.map(slug => {
                  const tech = filterOptions.technologies.find(t => t.slug === slug);
                  return tech ? (
                    <Badge key={slug} variant="secondary" className="gap-1 pr-1">
                      {tech.name}
                      <button onClick={() => toggleFilter('technologies', slug)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                    </Badge>
                  ) : null;
                })}
                {filters.materials?.map(slug => {
                  const mat = filterOptions.materials.find(m => m.slug === slug);
                  return mat ? (
                    <Badge key={slug} variant="outline" className="gap-1 pr-1">
                      {mat.name}
                      <button onClick={() => toggleFilter('materials', slug)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                    </Badge>
                  ) : null;
                })}
                {filters.countries?.map(name => (
                  <Badge key={name} variant="outline" className="gap-1 pr-1">
                    {name}
                    <button onClick={() => toggleFilter('countries', name)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={clearAllFilters}>
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex gap-6">
            {/* Sidebar filters */}
            {showFilters && (
              <aside className="w-64 flex-shrink-0 hidden lg:block">
                <div className="sticky top-24 space-y-1">
                  <FilterSection
                    title="Technology"
                    icon={<Factory className="h-4 w-4" />}
                    items={filterOptions.technologies}
                    selected={filters.technologies || []}
                    onToggle={slug => toggleFilter('technologies', slug)}
                  />
                  <FilterSection
                    title="Material"
                    icon={<Tag className="h-4 w-4" />}
                    items={filterOptions.materials}
                    selected={filters.materials || []}
                    onToggle={slug => toggleFilter('materials', slug)}
                  />
                  <FilterSection
                    title="Country"
                    icon={<Globe className="h-4 w-4" />}
                    items={filterOptions.countries}
                    selected={filters.countries || []}
                    onToggle={name => toggleFilter('countries', name)}
                  />
                  <FilterSection
                    title="Certification"
                    icon={<Shield className="h-4 w-4" />}
                    items={filterOptions.certifications}
                    selected={filters.certifications || []}
                    onToggle={slug => toggleFilter('certifications', slug)}
                  />
                  <FilterSection
                    title="Tags"
                    icon={<Tag className="h-4 w-4" />}
                    items={filterOptions.tags}
                    selected={filters.tags || []}
                    onToggle={slug => toggleFilter('tags', slug)}
                  />
                </div>
              </aside>
            )}

            {/* Results */}
            <div className="flex-1 min-w-0">
              {/* Results header */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {isLoading ? 'Loading...' : `${suppliers.length} supplier${suppliers.length !== 1 ? 's' : ''} found`}
                </p>
                {compareIds.length > 0 && (
                  <Button onClick={() => setShowComparison(true)} className="gap-2">
                    <GitCompare className="h-4 w-4" />
                    Compare ({compareIds.length})
                  </Button>
                )}
              </div>

              {/* Loading skeleton */}
              {isLoading && (
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="bg-card border-border animate-pulse">
                      <CardContent className="p-5">
                        <div className="flex gap-4">
                          <div className="w-16 h-16 bg-muted rounded-lg" />
                          <div className="flex-1 space-y-3">
                            <div className="h-4 bg-muted rounded w-1/3" />
                            <div className="h-3 bg-muted rounded w-1/4" />
                            <div className="h-3 bg-muted rounded w-2/3" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Supplier list */}
              {!isLoading && (
                <div className="space-y-3">
                  {suppliers.map(supplier => (
                    <SupplierCard
                      key={supplier.id}
                      supplier={supplier}
                      onCompareToggle={toggleCompare}
                      isComparing={compareIds.includes(supplier.id)}
                    />
                  ))}
                  {suppliers.length === 0 && (
                    <div className="text-center py-16">
                      <Factory className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No suppliers found</h3>
                      <p className="text-muted-foreground mb-4">Try adjusting your filters or search query</p>
                      <Button variant="outline" onClick={clearAllFilters}>Clear all filters</Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Comparison overlay */}
      {showComparison && (
        <ComparisonTable
          suppliers={compareSuppliers}
          onRemove={id => setCompareIds(prev => prev.filter(x => x !== id))}
          onClose={() => setShowComparison(false)}
        />
      )}

      {/* Comparison bar (sticky bottom) */}
      {compareIds.length > 0 && !showComparison && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{compareIds.length} of 4 selected</span>
              <div className="flex gap-2">
                {compareSuppliers.map(s => (
                  <Badge key={s.id} variant="secondary" className="gap-1 pr-1">
                    {s.name}
                    <button onClick={() => toggleCompare(s.id)}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCompareIds([])}>Clear</Button>
              <Button size="sm" onClick={() => setShowComparison(true)} disabled={compareIds.length < 2}>
                Compare
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Suppliers;
