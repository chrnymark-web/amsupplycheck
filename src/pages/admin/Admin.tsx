import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Globe, CheckCircle, Zap, Star, Search, ArrowRight, BarChart3,
  MapPin, Eye, ExternalLink
} from 'lucide-react';

// Static data derived from CSV analysis
const stats = {
  suppliers: { total: 249, verified: 224, premium: 0, withDesc: 247 },
  technologies: 56,
  materials: 105,
  certifications: 12,
  countries: 28,
  tags: 21,
  searches: 148,
  aiMatches: 13,
  applications: 11,
  newsletterSignups: 2,
  discoveryRuns: 6,
  newFromDiscovery: 16,
};

const topCountries = [
  { name: 'United States', count: 94 },
  { name: 'Germany', count: 24 },
  { name: 'United Kingdom', count: 20 },
  { name: 'Netherlands', count: 17 },
  { name: 'China', count: 11 },
  { name: 'Italy', count: 8 },
  { name: 'Belgium', count: 7 },
  { name: 'France', count: 7 },
  { name: 'Canada', count: 6 },
  { name: 'Denmark', count: 6 },
];

const topTechnologies = [
  { name: 'FDM', count: 112 },
  { name: 'SLA', count: 88 },
  { name: 'SLS', count: 76 },
  { name: 'MJF', count: 60 },
  { name: 'CNC Machining', count: 35 },
  { name: 'DLP', count: 35 },
  { name: 'DMLS', count: 31 },
  { name: 'Injection Molding', count: 28 },
  { name: 'SLM', count: 27 },
  { name: 'PolyJet', count: 27 },
];

const topMaterials = [
  { name: 'Aluminum AlSi10Mg', count: 48 },
  { name: 'Standard Resin', count: 48 },
  { name: 'Stainless Steel 316L', count: 47 },
  { name: 'PA12 Nylon', count: 47 },
  { name: 'ABS', count: 36 },
  { name: 'PETG', count: 34 },
  { name: 'PC (Polycarbonate)', count: 31 },
  { name: 'Titanium', count: 29 },
  { name: 'Ceramic', count: 27 },
  { name: 'Copper', count: 26 },
];

const supplierApplications = [
  { company: 'AM Printservice', name: 'Ulf Qviberg', date: '2026-01-03' },
  { company: 'Emptech', name: 'Kristoffer Nielsen', date: '2026-01-30' },
  { company: 'The Workbench 3D LLC', name: 'Bryan McFarland', date: '2026-02-09' },
  { company: 'AddiThy', name: 'Tobias Ravnholt', date: '2026-02-12' },
  { company: 'Detroit 3D Manufacturing', name: 'David Kistner', date: '2026-02-13' },
  { company: 'I-Fab', name: 'Roscher van Tonder', date: '2026-02-18' },
  { company: 'SelectAM Oy', name: 'Niklas Kretzsschmar', date: '2026-02-18' },
  { company: 'Nova Components', name: 'Thomas Langvad', date: '2026-03-19' },
];

function StatCard({ icon: Icon, label, value, sub, color = 'text-primary' }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <Icon className={`h-5 w-5 ${color}`} />
          <span className="text-2xl font-bold text-foreground">{value}</span>
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function BarChart({ data, maxValue }: { data: { name: string; count: number }[]; maxValue?: number }) {
  const max = maxValue || Math.max(...data.map(d => d.count));
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.name} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-32 text-right truncate">{d.name}</span>
          <div className="flex-1 h-6 bg-muted/30 rounded overflow-hidden">
            <div
              className="h-full bg-primary/80 rounded transition-all duration-500"
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-8">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

type Tab = 'overview' | 'suppliers' | 'analytics' | 'applications';

export default function Admin() {
  const [tab, setTab] = useState<Tab>('overview');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="text-xl font-bold text-foreground hover:text-primary transition-colors">
              AMSupplyCheck
            </button>
            <Badge variant="outline" className="text-xs">Admin</Badge>
          </div>
          <nav className="flex gap-1">
            {(['overview', 'suppliers', 'analytics', 'applications'] as Tab[]).map(t => (
              <Button
                key={t}
                variant={tab === t ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTab(t)}
                className="capitalize text-xs"
              >
                {t}
              </Button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {tab === 'overview' && (
          <div className="space-y-8">
            <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={CheckCircle} label="Verified Suppliers" value={stats.suppliers.verified} sub={`of ${stats.suppliers.total} total (90%)`} color="text-green-500" />
              <StatCard icon={Globe} label="Countries" value={stats.countries} />
              <StatCard icon={Zap} label="Technologies" value={stats.technologies} />
              <StatCard icon={Star} label="Materials" value={stats.materials} />
              <StatCard icon={Search} label="Total Searches" value={stats.searches} sub="134 via smart search" />
              <StatCard icon={BarChart3} label="Project Matches" value={stats.aiMatches} sub="Avg score: 26.5" />
              <StatCard icon={ArrowRight} label="Applications" value={stats.applications} sub="Real applicants" />
              <StatCard icon={Eye} label="Discovery Runs" value={stats.discoveryRuns} sub={`${stats.newFromDiscovery} new found`} />
            </div>

            {/* Charts side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Top Technologies</h3>
                  <BarChart data={topTechnologies} />
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Top Materials</h3>
                  <BarChart data={topMaterials} />
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Suppliers by Country</h3>
                <BarChart data={topCountries} />
              </CardContent>
            </Card>
          </div>
        )}

        {tab === 'suppliers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-foreground">Suppliers ({stats.suppliers.total})</h1>
              <Badge variant="outline">{stats.suppliers.verified} verified</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-green-500">{stats.suppliers.verified}</p>
                  <p className="text-sm text-muted-foreground mt-1">Verified</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-yellow-500">{stats.suppliers.total - stats.suppliers.verified}</p>
                  <p className="text-sm text-muted-foreground mt-1">Unverified</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-muted-foreground">0%</p>
                  <p className="text-sm text-muted-foreground mt-1">Have Logos</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Data Quality Issues</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-yellow-400">
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    {stats.suppliers.total - withLogoCount()} suppliers missing logos (100%)
                  </li>
                  <li className="flex items-center gap-2 text-yellow-400">
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    177 suppliers have no region set
                  </li>
                  <li className="flex items-center gap-2 text-yellow-400">
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    12 suppliers have no country
                  </li>
                  <li className="flex items-center gap-2 text-green-400">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    99% have descriptions
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === 'analytics' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Search Overview</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total searches</span>
                      <span className="font-semibold text-foreground">148</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Smart searches</span>
                      <span className="font-semibold text-foreground">134 (91%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg search time</span>
                      <span className="font-semibold text-foreground">2,019ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg results returned</span>
                      <span className="font-semibold text-foreground">varies</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Project Matching</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Projects matched</span>
                      <span className="font-semibold text-foreground">13</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg match score</span>
                      <span className="font-semibold text-foreground">26.5 / 100</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg match time</span>
                      <span className="font-semibold text-foreground">3,256ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Best match score</span>
                      <span className="font-semibold text-green-500">93 (SLS PA12 Europe)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Chat Sessions</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total sessions</span>
                      <span className="font-semibold text-foreground">2</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Queries</span>
                      <span className="font-semibold text-foreground">"prototype" + "titanium supplier"</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Outcome</span>
                      <span className="font-semibold text-yellow-400">No matches found</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Supplier Discovery</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Runs completed</span>
                      <span className="font-semibold text-foreground">4 of 6</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">New suppliers found</span>
                      <span className="font-semibold text-green-500">16</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duplicates skipped</span>
                      <span className="font-semibold text-foreground">~177</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-semibold text-yellow-400">2 stuck "running"</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {tab === 'applications' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-foreground">Supplier Applications</h1>
            <p className="text-muted-foreground">Companies that want to join AMSupplyCheck</p>

            <div className="space-y-3">
              {supplierApplications.map((app, i) => (
                <Card key={i} className="bg-card border-border">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{app.company}</h4>
                      <p className="text-sm text-muted-foreground">{app.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{app.date}</p>
                      <Badge variant="outline" className="text-xs mt-1">Pending</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function withLogoCount() { return 0; }
