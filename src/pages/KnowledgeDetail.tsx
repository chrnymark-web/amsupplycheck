import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Navbar from '@/components/ui/navbar';
import { useKnowledgeData } from '@/hooks/use-knowledge-data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SupplierLogo from '@/components/ui/supplier-logo';
import { TECHNOLOGY_GLOSSARY, type TechnologyInfo } from '@/lib/technologyGlossary';
import { technologyToMaterials, materialToTechnologies } from '@/lib/technologyMaterialCompatibility';
import { ArrowLeft, ExternalLink, Factory, MapPin, Verified, ChevronRight, Cpu, FlaskConical, Zap, Target, AlertTriangle, Layers, Link2 } from 'lucide-react';

type DetailType = 'technology' | 'material';

const KnowledgeDetail: React.FC = () => {
  const { type, slug } = useParams<{ type: DetailType; slug: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useKnowledgeData();

  const isTech = type === 'technology';
  
  const item = useMemo(() => {
    if (!data) return null;
    return isTech
      ? data.technologies.find(t => t.slug === slug)
      : data.materials.find(m => m.slug === slug);
  }, [data, isTech, slug]);

  const glossary: TechnologyInfo | null = useMemo(() => {
    if (!item || !isTech) return null;
    return TECHNOLOGY_GLOSSARY[item.name] || TECHNOLOGY_GLOSSARY[item.name.toUpperCase()] || null;
  }, [item, isTech]);

  // Helper to normalize name for comparison (remove hyphens, spaces, make lowercase)
  const normalizeForMatch = (name: string) => {
    return name.toLowerCase().replace(/[-\s]/g, '').replace(/\(.*\)/g, '');
  };

  // Check if two names are similar enough to be considered a match
  const namesMatch = (a: string, b: string): boolean => {
    const normA = normalizeForMatch(a);
    const normB = normalizeForMatch(b);
    // Check if one contains the other, or if they share significant parts
    if (normA.includes(normB) || normB.includes(normA)) return true;
    // Check for common base words (e.g., "nylon", "pa12", "titanium")
    const wordsA = a.toLowerCase().split(/[\s\-\/]+/);
    const wordsB = b.toLowerCase().split(/[\s\-\/]+/);
    return wordsA.some(wa => wordsB.some(wb => 
      (wa.length > 2 && wb.length > 2) && (wa.includes(wb) || wb.includes(wa))
    ));
  };

  // Find compatible materials/technologies from the compatibility matrix
  const compatibleItems = useMemo(() => {
    if (!data || !item) return [];
    
    if (isTech) {
      // For technology pages, find compatible materials
      const techKeys = [item.name, item.name.toUpperCase(), `${item.name}/FFF`, 'FDM/FFF'];
      let compatMaterialNames: string[] = [];
      
      for (const key of techKeys) {
        if (technologyToMaterials[key]) {
          compatMaterialNames = technologyToMaterials[key];
          break;
        }
      }
      
      // Match with actual materials in the database using flexible matching
      return data.materials
        .filter(mat => compatMaterialNames.some(name => namesMatch(mat.name, name)))
        .sort((a, b) => b.supplierCount - a.supplierCount)
        .slice(0, 12);
    } else {
      // For material pages, find compatible technologies
      // Try to find a match in the materialToTechnologies lookup
      const allMatKeys = Object.keys(materialToTechnologies);
      const matchingKey = allMatKeys.find(key => namesMatch(item.name, key));
      const compatTechNames = matchingKey ? materialToTechnologies[matchingKey] : [];
      
      // Match with actual technologies in the database using flexible matching
      return data.technologies
        .filter(tech => compatTechNames.some(name => namesMatch(tech.name, name)))
        .sort((a, b) => b.supplierCount - a.supplierCount)
        .slice(0, 8);
    }
  }, [isTech, item, data]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background">
          <div className="max-w-5xl mx-auto px-4 py-16 text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
      </>
    );
  }

  if (!item) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Not Found</h1>
            <p className="text-muted-foreground mb-4">This {type} could not be found.</p>
            <Button onClick={() => navigate('/knowledge')}>Back to Knowledge Base</Button>
          </div>
        </main>
      </>
    );
  }

  const pageTitle = isTech
    ? `${item.name} — Technology Overview | Supplycheck`
    : `${item.name} — Material Overview | Supplycheck`;

  const pageDesc = isTech
    ? `Find ${item.supplierCount} suppliers offering ${item.name}. ${glossary?.shortDescription || ''}`
    : `Find ${item.supplierCount} suppliers working with ${item.name}. Explore capabilities and compare.`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={`https://supplycheck.lovable.app/knowledge/${type}/${slug}`} />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-background">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-card/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/knowledge" className="hover:text-foreground transition-colors">Knowledge Base</Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link to={`/knowledge?tab=${isTech ? 'technologies' : 'materials'}`} className="hover:text-foreground transition-colors">
                {isTech ? 'Technologies' : 'Materials'}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground">{item.name}</span>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-b from-primary/5 to-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/knowledge')} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Knowledge Base
              </Button>
              {/* Primary CTA */}
              <Button onClick={() => navigate(`/suppliers?${isTech ? 'tech' : 'mat'}=${item.slug}`)}>
                <Factory className="h-4 w-4 mr-2" />
                Find {item.supplierCount} {item.name} Suppliers
              </Button>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                {isTech ? <Cpu className="h-6 w-6 text-primary" /> : <FlaskConical className="h-6 w-6 text-primary" />}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">{item.name}</h1>
                  {item.category && (
                    <Badge variant="outline" className="text-xs">{item.category}</Badge>
                  )}
                </div>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  {glossary?.longDescription || item.description || (isTech
                    ? `${item.name} is a manufacturing technology used by ${item.supplierCount} suppliers on the platform.`
                    : `${item.name} is available from ${item.supplierCount} suppliers on the platform.`)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Details */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick stats */}
              <Card className="bg-card border-border">
                <CardContent className="p-5 space-y-4">
                  <h2 className="font-semibold text-foreground">Quick Facts</h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Suppliers</span>
                      <span className="text-sm font-medium text-foreground">{item.supplierCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Category</span>
                      <span className="text-sm font-medium text-foreground">{item.category || '—'}</span>
                    </div>
                    {glossary && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Price Range</span>
                          <Badge variant="outline" className="text-xs capitalize">{glossary.priceRange}</Badge>
                        </div>
                        <div className="pt-2 space-y-2">
                          <StatBar label="Detail Level" value={glossary.detailLevel} />
                          <StatBar label="Strength" value={glossary.strengthLevel} />
                          <StatBar label="Speed" value={glossary.speedLevel} />
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Best for */}
              {glossary?.bestFor && (
                <Card className="bg-card border-border">
                  <CardContent className="p-5">
                    <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" /> Best For
                    </h2>
                    <ul className="space-y-2">
                      {glossary.bestFor.map((item, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <Zap className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Limitations */}
              {glossary?.limitations && (
                <Card className="bg-card border-border">
                  <CardContent className="p-5">
                    <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400" /> Limitations
                    </h2>
                    <ul className="space-y-2">
                      {glossary.limitations.map((item, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Compatible Materials/Technologies - Cross-linking */}
              {compatibleItems.length > 0 && (
                <Card className="bg-card border-border">
                  <CardContent className="p-5">
                    <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-primary" />
                      {isTech ? 'Compatible Materials' : 'Compatible Technologies'}
                    </h2>
                    <p className="text-xs text-muted-foreground mb-3">
                      {isTech 
                        ? `Materials commonly used with ${item.name} printing technology`
                        : `Technologies that support ${item.name} as a build material`
                      }
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {compatibleItems.map((compatItem) => (
                        <Link
                          key={compatItem.slug}
                          to={`/knowledge/${isTech ? 'material' : 'technology'}/${compatItem.slug}`}
                          className="group/badge"
                        >
                          <Badge 
                            variant="outline" 
                            className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                          >
                            {isTech ? <FlaskConical className="h-3 w-3 mr-1" /> : <Cpu className="h-3 w-3 mr-1" />}
                            {compatItem.name}
                            <span className="ml-1 text-muted-foreground group-hover/badge:text-primary-foreground">
                              ({compatItem.supplierCount})
                            </span>
                          </Badge>
                        </Link>
                      ))}
                    </div>
                    {compatibleItems.length >= 8 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-3 text-xs text-muted-foreground"
                        onClick={() => navigate(`/knowledge?tab=${isTech ? 'materials' : 'technologies'}`)}
                      >
                        View all {isTech ? 'materials' : 'technologies'} →
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Typical materials from glossary (fallback if no cross-links) */}
              {glossary?.typicalMaterials && compatibleItems.length === 0 && (
                <Card className="bg-card border-border">
                  <CardContent className="p-5">
                    <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" /> Typical Materials
                    </h2>
                    <div className="flex flex-wrap gap-1.5">
                      {glossary.typicalMaterials.map((mat, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{mat}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Find suppliers CTA */}
              <Button
                className="w-full"
                onClick={() => navigate(`/suppliers?${isTech ? 'tech' : 'mat'}=${item.slug}`)}
              >
                <Factory className="h-4 w-4 mr-2" />
                Find {item.name} Suppliers
              </Button>
            </div>

            {/* Right: Supplier list */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Suppliers offering {item.name}
                </h2>
                <span className="text-sm text-muted-foreground">{item.supplierCount} total</span>
              </div>

              {item.suppliers.length === 0 ? (
                <Card className="bg-card border-border">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No suppliers found for this {type} yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {item.suppliers.map(supplier => (
                    <Card
                      key={supplier.id}
                      className="bg-card border-border hover:border-primary/40 transition-all cursor-pointer group"
                      onClick={() => navigate(`/suppliers/${supplier.supplier_id}`)}
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                        <SupplierLogo name={supplier.name} size="sm" className="flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                              {supplier.name}
                            </span>
                            {supplier.verified && <Verified className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
                          </div>
                          {supplier.location_country && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                              <MapPin className="h-3 w-3" />
                              {supplier.location_country}
                            </div>
                          )}
                          {supplier.tags && supplier.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {supplier.tags.slice(0, 3).map(tag => (
                                <Badge key={tag.id} variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/5 text-primary border-primary/20">
                                  {tag.name}
                                </Badge>
                              ))}
                              {supplier.tags.length > 3 && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  +{supplier.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

const StatBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div>
    <div className="flex items-center justify-between text-xs mb-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}/5</span>
    </div>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= value ? 'bg-primary' : 'bg-muted'}`} />
      ))}
    </div>
  </div>
);

export default KnowledgeDetail;
