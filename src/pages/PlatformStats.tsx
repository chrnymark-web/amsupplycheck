import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/ui/navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Globe, Cpu, Layers, MapPin, BarChart3 } from 'lucide-react';
import { categorizeTechnology } from '@/lib/categoryMappings';

export default function PlatformStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('technologies, materials, location_country, verified')
        .eq('verified', true);

      if (!suppliers) return null;

      const totalSuppliers = suppliers.length;
      const countries = new Set(suppliers.map(s => s.location_country).filter(Boolean));
      
      const allTechs = new Set<string>();
      const allMaterials = new Set<string>();
      const countryCount: Record<string, number> = {};
      const techCount: Record<string, number> = {};

      for (const s of suppliers) {
        for (const t of (s.technologies || [])) {
          allTechs.add(t);
          const core = categorizeTechnology(t);
          if (core !== 'Other') {
            techCount[core] = (techCount[core] || 0) + 1;
          }
        }
        for (const m of (s.materials || [])) allMaterials.add(m);
        if (s.location_country) {
          countryCount[s.location_country] = (countryCount[s.location_country] || 0) + 1;
        }
      }

      const topCountries = Object.entries(countryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

      const topTechs = Object.entries(techCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);

      return {
        totalSuppliers,
        totalCountries: countries.size,
        totalTechnologies: allTechs.size,
        totalMaterials: allMaterials.size,
        topCountries,
        topTechs,
      };
    },
    staleTime: 60 * 60 * 1000,
  });

  const baseUrl = 'https://amsupplycheck.com';

  const datasetSchema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'AMSupplyCheck Additive Manufacturing Supplier Database',
    description: `A curated database of ${stats?.totalSuppliers || '200+'} verified additive manufacturing and CNC machining suppliers worldwide.`,
    url: `${baseUrl}/stats`,
    creator: { '@type': 'Organization', name: 'AMSupplyCheck' },
    dateModified: new Date().toISOString().split('T')[0],
    keywords: ['3D printing', 'additive manufacturing', 'CNC machining', 'supplier database', 'manufacturing services'],
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Platform Statistics | AMSupplyCheck</title>
        <meta name="description" content={`AMSupplyCheck tracks ${stats?.totalSuppliers || '200+'} verified manufacturing suppliers across ${stats?.totalCountries || '30+'} countries. Live statistics and industry data.`} />
        <link rel="canonical" href={`${baseUrl}/stats`} />
        <script type="application/ld+json">{JSON.stringify(datasetSchema)}</script>
      </Helmet>

      <Navbar />

      <header className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <BarChart3 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          AMSupplyCheck Platform Statistics
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Live data from our curated database of verified additive manufacturing and CNC machining suppliers worldwide.
        </p>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-24">
        {/* Headline stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <StatCard icon={<Globe className="h-5 w-5" />} value={stats?.totalSuppliers} label="Verified Suppliers" loading={isLoading} />
          <StatCard icon={<MapPin className="h-5 w-5" />} value={stats?.totalCountries} label="Countries" loading={isLoading} />
          <StatCard icon={<Cpu className="h-5 w-5" />} value={stats?.totalTechnologies} label="Technologies Tracked" loading={isLoading} />
          <StatCard icon={<Layers className="h-5 w-5" />} value={stats?.totalMaterials} label="Materials Listed" loading={isLoading} />
        </div>

        {/* Breakdowns */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Suppliers by Technology</h2>
            <div className="space-y-2">
              {(stats?.topTechs || []).map(([name, count]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(100, (count / (stats?.totalSuppliers || 1)) * 100 * 2)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Suppliers by Country</h2>
            <div className="space-y-2">
              {(stats?.topCountries || []).map(([name, count]) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(100, (count / (stats?.totalSuppliers || 1)) * 100 * 2)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Cite section */}
        <section className="bg-card border border-border rounded-lg p-6 text-center">
          <h2 className="text-lg font-bold text-foreground mb-2">Cite This Data</h2>
          <p className="text-sm text-muted-foreground mb-4">
            You're welcome to reference these statistics in articles, reports, or presentations.
          </p>
          <div className="bg-muted/50 rounded p-3 text-xs text-muted-foreground font-mono text-left max-w-xl mx-auto">
            AMSupplyCheck. "Additive Manufacturing Supplier Database Statistics."
            <br />
            Retrieved {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.
            <br />
            {baseUrl}/stats
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon, value, label, loading }: { icon: React.ReactNode; value?: number; label: string; loading: boolean }) {
  return (
    <Card className="border-border">
      <CardContent className="p-4 text-center">
        <div className="flex justify-center mb-2 text-primary">{icon}</div>
        <div className="text-2xl font-bold text-foreground mb-1">
          {loading ? <span className="animate-pulse">—</span> : value?.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
