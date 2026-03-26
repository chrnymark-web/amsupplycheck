import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Navbar from '@/components/ui/navbar';
import { useKnowledgeData } from '@/hooks/use-knowledge-data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Cpu, FlaskConical, Globe, ChevronRight, Factory, ArrowRight } from 'lucide-react';

const Browse: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useKnowledgeData();

  // Get top technologies by supplier count
  const topTechnologies = useMemo(() => {
    if (!data) return [];
    return [...data.technologies]
      .sort((a, b) => b.supplierCount - a.supplierCount)
      .slice(0, 12);
  }, [data]);

  // Get top materials by supplier count
  const topMaterials = useMemo(() => {
    if (!data) return [];
    return [...data.materials]
      .sort((a, b) => b.supplierCount - a.supplierCount)
      .slice(0, 12);
  }, [data]);

  // Static list of regions/countries with rough estimates
  const regions = [
    { name: 'United States', code: 'us', region: 'North America' },
    { name: 'Germany', code: 'de', region: 'Europe' },
    { name: 'United Kingdom', code: 'uk', region: 'Europe' },
    { name: 'Netherlands', code: 'nl', region: 'Europe' },
    { name: 'France', code: 'fr', region: 'Europe' },
    { name: 'China', code: 'cn', region: 'Asia' },
    { name: 'Denmark', code: 'dk', region: 'Europe' },
    { name: 'Belgium', code: 'be', region: 'Europe' },
    { name: 'Australia', code: 'au', region: 'Oceania' },
    { name: 'Canada', code: 'ca', region: 'North America' },
    { name: 'Italy', code: 'it', region: 'Europe' },
    { name: 'Spain', code: 'es', region: 'Europe' },
  ];

  return (
    <>
      <Helmet>
        <title>Browse Manufacturing Capabilities | Supplycheck</title>
        <meta name="description" content="Browse manufacturing technologies, materials, and supplier locations. Find the right additive manufacturing capabilities for your project." />
        <link rel="canonical" href="https://supplycheck.lovable.app/browse" />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-gradient-to-b from-primary/5 to-background border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Browse Capabilities
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Explore manufacturing technologies, materials, and supplier locations. 
              Find suppliers based on their specific capabilities.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Technologies Column */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Technologies</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Browse by manufacturing process
              </p>

              {isLoading ? (
                <LoadingSkeleton />
              ) : (
                <div className="space-y-2">
                  {topTechnologies.map(tech => (
                    <Card
                      key={tech.id}
                      className="bg-card border-border hover:border-primary/40 transition-all cursor-pointer group"
                      onClick={() => navigate(`/knowledge/technology/${tech.slug}`)}
                    >
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {tech.name}
                          </span>
                          {tech.category && (
                            <Badge variant="outline" className="text-[10px] px-1.5">{tech.category}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Factory className="h-3.5 w-3.5" />
                          <span>{tech.supplierCount}</span>
                          <ChevronRight className="h-4 w-4 group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Button
                variant="ghost"
                className="w-full mt-4 text-muted-foreground hover:text-primary"
                onClick={() => navigate('/knowledge?tab=technologies')}
              >
                View all technologies <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Materials Column */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FlaskConical className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Materials</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Browse by build material
              </p>

              {isLoading ? (
                <LoadingSkeleton />
              ) : (
                <div className="space-y-2">
                  {topMaterials.map(mat => (
                    <Card
                      key={mat.id}
                      className="bg-card border-border hover:border-primary/40 transition-all cursor-pointer group"
                      onClick={() => navigate(`/knowledge/material/${mat.slug}`)}
                    >
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {mat.name}
                          </span>
                          {mat.category && (
                            <Badge variant="outline" className="text-[10px] px-1.5">{mat.category}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Factory className="h-3.5 w-3.5" />
                          <span>{mat.supplierCount}</span>
                          <ChevronRight className="h-4 w-4 group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Button
                variant="ghost"
                className="w-full mt-4 text-muted-foreground hover:text-primary"
                onClick={() => navigate('/knowledge?tab=materials')}
              >
                View all materials <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Countries Column */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Globe className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Countries</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Browse by supplier location
              </p>

              <div className="space-y-2">
                {regions.map(country => (
                  <Card
                    key={country.code}
                    className="bg-card border-border hover:border-primary/40 transition-all cursor-pointer group"
                    onClick={() => navigate(`/suppliers?areas=${country.name}`)}
                  >
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {country.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5">{country.region}</Badge>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                variant="ghost"
                className="w-full mt-4 text-muted-foreground hover:text-primary"
                onClick={() => navigate('/suppliers')}
              >
                View all suppliers <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Quick search CTA */}
          <div className="mt-16 text-center">
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Know what you're looking for?
            </h3>
            <p className="text-muted-foreground mb-6">
              Use our AI-powered search to find suppliers matching your exact requirements.
            </p>
            <Button size="lg" onClick={() => navigate('/search')}>
              Advanced Search <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>
    </>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-2">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
    ))}
  </div>
);

export default Browse;
