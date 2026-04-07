import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Navbar from '@/components/ui/navbar';
import { useKnowledgeData } from '@/hooks/use-knowledge-data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Factory, Layers, ChevronRight, Cpu, FlaskConical } from 'lucide-react';
import { TECHNOLOGY_GLOSSARY } from '@/lib/technologyGlossary';

const CATEGORY_ORDER_TECH: Record<string, number> = {
  'Polymer AM': 1, 'Metal AM': 2, 'Traditional': 3, 'Post-Processing': 4, 'Engineering': 5,
};
const CATEGORY_ORDER_MAT: Record<string, number> = {
  'Nylon': 1, 'Engineering Polymer': 2, 'High Performance Polymer': 3, 'Flexible Polymer': 4,
  'Resin': 5, 'Metal': 6, 'Composite': 7, 'Ceramic': 8, 'Elastomer': 9, 'Other': 10,
};

const Knowledge: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useKnowledgeData();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('technologies');

  const filteredTechnologies = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    return data.technologies
      .filter(t => !q || t.name.toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q))
      .sort((a, b) => {
        const ca = CATEGORY_ORDER_TECH[a.category || ''] || 99;
        const cb = CATEGORY_ORDER_TECH[b.category || ''] || 99;
        if (ca !== cb) return ca - cb;
        return b.supplierCount - a.supplierCount;
      });
  }, [data, search]);

  const filteredMaterials = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    return data.materials
      .filter(m => !q || m.name.toLowerCase().includes(q) || (m.category || '').toLowerCase().includes(q))
      .sort((a, b) => {
        const ca = CATEGORY_ORDER_MAT[a.category || ''] || 99;
        const cb = CATEGORY_ORDER_MAT[b.category || ''] || 99;
        if (ca !== cb) return ca - cb;
        return b.supplierCount - a.supplierCount;
      });
  }, [data, search]);

  // Group by category
  const techByCategory = useMemo(() => {
    const map = new Map<string, typeof filteredTechnologies>();
    filteredTechnologies.forEach(t => {
      const cat = t.category || 'Other';
      const arr = map.get(cat) || [];
      arr.push(t);
      map.set(cat, arr);
    });
    return Array.from(map.entries()).sort(([a], [b]) => (CATEGORY_ORDER_TECH[a] || 99) - (CATEGORY_ORDER_TECH[b] || 99));
  }, [filteredTechnologies]);

  const matByCategory = useMemo(() => {
    const map = new Map<string, typeof filteredMaterials>();
    filteredMaterials.forEach(m => {
      const cat = m.category || 'Other';
      const arr = map.get(cat) || [];
      arr.push(m);
      map.set(cat, arr);
    });
    return Array.from(map.entries()).sort(([a], [b]) => (CATEGORY_ORDER_MAT[a] || 99) - (CATEGORY_ORDER_MAT[b] || 99));
  }, [filteredMaterials]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Polymer AM': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'Metal AM': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      'Traditional': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      'Post-Processing': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'Engineering': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      'Nylon': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'Engineering Polymer': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      'High Performance Polymer': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      'Flexible Polymer': 'bg-green-500/10 text-green-400 border-green-500/20',
      'Resin': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
      'Metal': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      'Composite': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
      'Ceramic': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      'Elastomer': 'bg-lime-500/10 text-lime-400 border-lime-500/20',
    };
    return colors[category] || 'bg-muted text-muted-foreground border-border';
  };

  const getGlossaryInfo = (name: string) => {
    return TECHNOLOGY_GLOSSARY[name] || TECHNOLOGY_GLOSSARY[name.toUpperCase()] || null;
  };

  return (
    <>
      <Helmet>
        <title>Manufacturing Knowledge Base — Technologies & Materials | Supplycheck</title>
        <meta name="description" content="Explore all manufacturing technologies and materials available on Supplycheck. Find detailed information and discover suppliers for each capability." />
        <link rel="canonical" href="https://supplycheck.lovable.app/knowledge" />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-gradient-to-b from-primary/5 to-background border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                  Manufacturing Knowledge Base
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  Explore {data?.technologies.length || 0} technologies and {data?.materials.length || 0} materials. 
                  Understand capabilities and find the right suppliers.
                </p>
              </div>
              <Button 
                size="lg" 
                className="shrink-0"
                onClick={() => navigate('/suppliers')}
              >
                <Factory className="h-4 w-4 mr-2" />
                Find Suppliers
              </Button>
            </div>

            <div className="relative max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search technologies or materials..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-8">
              <TabsTrigger value="technologies" className="gap-2">
                <Cpu className="h-4 w-4" />
                Technologies ({data?.technologies.length || 0})
              </TabsTrigger>
              <TabsTrigger value="materials" className="gap-2">
                <FlaskConical className="h-4 w-4" />
                Materials ({data?.materials.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="technologies">
              {isLoading ? (
                <LoadingSkeleton />
              ) : techByCategory.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">No technologies found</p>
              ) : (
                techByCategory.map(([category, techs]) => (
                  <div key={category} className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                      <Badge variant="outline" className={getCategoryColor(category)}>{category}</Badge>
                      <span className="text-sm text-muted-foreground">{techs.length} technologies</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {techs.map(tech => {
                        const glossary = getGlossaryInfo(tech.name);
                        return (
                          <Card
                            key={tech.id}
                            className="bg-card border-border hover:border-primary/40 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                            onClick={() => navigate(`/knowledge/technology/${tech.slug}`)}
                          >
                            <CardContent className="p-5">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {tech.name}
                                </h3>
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                              </div>
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {glossary?.shortDescription || tech.description || `${tech.name} manufacturing technology`}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <Factory className="h-3.5 w-3.5" />
                                  <span>{tech.supplierCount} suppliers</span>
                                </div>
                                {glossary && (
                                  <div className="flex gap-1">
                                    <MiniStat label="Detail" value={glossary.detailLevel} />
                                    <MiniStat label="Strength" value={glossary.strengthLevel} />
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="materials">
              {isLoading ? (
                <LoadingSkeleton />
              ) : matByCategory.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">No materials found</p>
              ) : (
                matByCategory.map(([category, mats]) => (
                  <div key={category} className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                      <Badge variant="outline" className={getCategoryColor(category)}>{category}</Badge>
                      <span className="text-sm text-muted-foreground">{mats.length} materials</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mats.map(mat => (
                        <Card
                          key={mat.id}
                          className="bg-card border-border hover:border-primary/40 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                          onClick={() => navigate(`/knowledge/material/${mat.slug}`)}
                        >
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                {mat.name}
                              </h3>
                              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                            </div>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {mat.description || `${mat.name} — ${mat.category || 'manufacturing'} material`}
                            </p>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Factory className="h-3.5 w-3.5" />
                              <span>{mat.supplierCount} suppliers</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
};

const MiniStat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="flex items-center gap-1 text-xs text-muted-foreground" title={`${label}: ${value}/5`}>
    <span className="opacity-60">{label}</span>
    <div className="flex gap-px">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= value ? 'bg-primary' : 'bg-muted'}`} />
      ))}
    </div>
  </div>
);

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(9)].map((_, i) => (
      <Card key={i} className="bg-card border-border">
        <CardContent className="p-5">
          <div className="h-5 bg-muted rounded w-2/3 mb-3 animate-pulse" />
          <div className="h-4 bg-muted rounded w-full mb-2 animate-pulse" />
          <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export default Knowledge;
