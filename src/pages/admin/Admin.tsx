import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Globe, CheckCircle, Zap, Star, Search, ArrowRight, BarChart3, Eye,
} from 'lucide-react';
import { useAdminStats, type TopItem } from '@/hooks/use-admin-stats';

function StatCard({ icon: Icon, label, value, sub, color = 'text-primary', loading }: {
  icon: React.ElementType; label: string; value: React.ReactNode; sub?: string; color?: string; loading?: boolean;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <Icon className={`h-5 w-5 ${color}`} />
          {loading
            ? <Skeleton className="h-7 w-16" />
            : <span className="text-2xl font-bold text-foreground">{value}</span>}
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/70 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function BarChart({ data, maxValue, loading }: { data: TopItem[]; maxValue?: number; loading?: boolean }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 flex-1" />
            <Skeleton className="h-4 w-8" />
          </div>
        ))}
      </div>
    );
  }
  if (!data.length) {
    return <p className="text-sm text-muted-foreground">No data yet.</p>;
  }
  const max = maxValue || Math.max(...data.map(d => d.count));
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.name} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-32 text-right truncate">{d.name}</span>
          <div className="flex-1 h-6 bg-muted/30 rounded overflow-hidden">
            <div
              className="h-full bg-primary/80 rounded transition-[width] duration-500"
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
  const { data: stats, isLoading, isError, error } = useAdminStats();

  const total = stats?.suppliers.total ?? 0;
  const verified = stats?.suppliers.verified ?? 0;
  const verifiedPct = total > 0 ? Math.round((verified / total) * 100) : 0;
  const withDescPct = total > 0 ? Math.round(((stats?.suppliers.withDesc ?? 0) / total) * 100) : 0;
  const withLogoPct = total > 0 ? Math.round(((stats?.suppliers.withLogo ?? 0) / total) * 100) : 0;
  const missingLogos = total - (stats?.suppliers.withLogo ?? 0);

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
        {isError && (
          <Card className="bg-destructive/10 border-destructive/50 mb-6">
            <CardContent className="p-4">
              <p className="text-sm text-destructive">
                Failed to load stats: {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </CardContent>
          </Card>
        )}

        {tab === 'overview' && (
          <div className="space-y-8">
            <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={CheckCircle}
                label="Verified Suppliers"
                value={verified}
                sub={total > 0 ? `of ${total} total (${verifiedPct}%)` : undefined}
                color="text-green-500"
                loading={isLoading}
              />
              <StatCard icon={Globe} label="Countries" value={stats?.countries ?? 0} loading={isLoading} />
              <StatCard icon={Zap} label="Technologies" value={stats?.technologies ?? 0} loading={isLoading} />
              <StatCard icon={Star} label="Materials" value={stats?.materials ?? 0} loading={isLoading} />
              <StatCard icon={Search} label="Total Searches" value={stats?.searches ?? 0} loading={isLoading} />
              <StatCard icon={BarChart3} label="Project Matches" value={stats?.aiMatches ?? 0} loading={isLoading} />
              <StatCard icon={ArrowRight} label="Applications" value={stats?.applications ?? 0} loading={isLoading} />
              <StatCard
                icon={Eye}
                label="Discovery Runs"
                value={stats?.discoveryRuns ?? 0}
                sub={stats ? `${stats.newFromDiscovery} new found` : undefined}
                loading={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Top Technologies</h3>
                  <BarChart data={stats?.topTechnologies ?? []} loading={isLoading} />
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Top Materials</h3>
                  <BarChart data={stats?.topMaterials ?? []} loading={isLoading} />
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Suppliers by Country</h3>
                <BarChart data={stats?.topCountries ?? []} loading={isLoading} />
              </CardContent>
            </Card>
          </div>
        )}

        {tab === 'suppliers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-foreground">
                Suppliers {isLoading ? '' : `(${total})`}
              </h1>
              <Badge variant="outline">{verified} verified</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-6 text-center">
                  {isLoading
                    ? <Skeleton className="h-9 w-16 mx-auto" />
                    : <p className="text-3xl font-bold text-green-500">{verified}</p>}
                  <p className="text-sm text-muted-foreground mt-1">Verified</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-6 text-center">
                  {isLoading
                    ? <Skeleton className="h-9 w-16 mx-auto" />
                    : <p className="text-3xl font-bold text-yellow-500">{total - verified}</p>}
                  <p className="text-sm text-muted-foreground mt-1">Unverified</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-6 text-center">
                  {isLoading
                    ? <Skeleton className="h-9 w-16 mx-auto" />
                    : <p className="text-3xl font-bold text-muted-foreground">{withLogoPct}%</p>}
                  <p className="text-sm text-muted-foreground mt-1">Have Logos</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Data Quality</h3>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : (
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-yellow-400">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      {missingLogos} suppliers missing logos ({total > 0 ? Math.round((missingLogos / total) * 100) : 0}%)
                    </li>
                    <li className="flex items-center gap-2 text-yellow-400">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      {stats?.suppliers.missingRegion ?? 0} suppliers have no region set
                    </li>
                    <li className="flex items-center gap-2 text-yellow-400">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      {stats?.suppliers.missingCountry ?? 0} suppliers have no country
                    </li>
                    <li className="flex items-center gap-2 text-green-400">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      {withDescPct}% have descriptions
                    </li>
                  </ul>
                )}
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
                      {isLoading
                        ? <Skeleton className="h-5 w-12" />
                        : <span className="font-semibold text-foreground">{stats?.searches ?? 0}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground/70">
                      For deeper search timing & smart-search breakdown, see{' '}
                      <button
                        type="button"
                        className="underline hover:text-foreground"
                        onClick={() => navigate('/admin/ai-analytics')}
                      >
                        AI Analytics
                      </button>.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Project Matching</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Projects matched</span>
                      {isLoading
                        ? <Skeleton className="h-5 w-12" />
                        : <span className="font-semibold text-foreground">{stats?.aiMatches ?? 0}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground/70">
                      Match score and timing details:{' '}
                      <button
                        type="button"
                        className="underline hover:text-foreground"
                        onClick={() => navigate('/admin/ai-analytics')}
                      >
                        AI Analytics
                      </button>.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Newsletter</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total signups</span>
                      {isLoading
                        ? <Skeleton className="h-5 w-12" />
                        : <span className="font-semibold text-foreground">{stats?.newsletterSignups ?? 0}</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Supplier Discovery</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Runs total</span>
                      {isLoading
                        ? <Skeleton className="h-5 w-12" />
                        : <span className="font-semibold text-foreground">
                            {stats?.discoveryRunsCompleted ?? 0} of {stats?.discoveryRuns ?? 0}
                          </span>}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">New suppliers found</span>
                      {isLoading
                        ? <Skeleton className="h-5 w-12" />
                        : <span className="font-semibold text-green-500">{stats?.newFromDiscovery ?? 0}</span>}
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

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="bg-card border-border">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : stats && stats.recentApplications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No applications yet.</p>
            ) : (
              <div className="space-y-3">
                {stats?.recentApplications.map((app, i) => (
                  <Card key={`${app.company}-${i}`} className="bg-card border-border">
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
            )}
          </div>
        )}
      </main>
    </div>
  );
}
