import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Globe, CheckCircle, Zap, Star, Search, ArrowRight, BarChart3, Eye,
  Target, MousePointerClick, Mail, FileText,
} from 'lucide-react';
import { useAdminStats, type TopItem } from '@/hooks/use-admin-stats';
import { useFunnelData, type FunnelData } from '@/hooks/use-funnel-data';
import { DateRangePicker, rangeForDays, type DateRange } from '@/components/admin/date-range-picker';

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
    return <p className="text-sm text-muted-foreground">No data in this period.</p>;
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

function FunnelStageCard({
  label, value, eventName, dropOff, gradient, borderColor, textColor, loading,
}: {
  label: string;
  value: number;
  eventName?: string;
  dropOff?: number;
  gradient: string;
  borderColor: string;
  textColor: string;
  loading?: boolean;
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} border-2 ${borderColor} rounded-lg p-4 text-center`}>
      {loading
        ? <Skeleton className="h-9 w-20 mx-auto" />
        : <div className={`text-3xl font-bold ${textColor}`}>{value.toLocaleString()}</div>}
      <div className="text-sm font-medium mt-2">{label}</div>
      {eventName && <div className="text-xs text-muted-foreground mt-0.5">{eventName}</div>}
      {dropOff !== undefined && dropOff > 0 && !loading && (
        <div className="text-xs text-red-500 mt-1">−{dropOff.toLocaleString()} dropped</div>
      )}
    </div>
  );
}

function FunnelArrow({ rate, loading }: { rate?: number; loading?: boolean }) {
  return (
    <div className="hidden lg:flex items-center justify-center">
      <div className="flex flex-col items-center text-muted-foreground">
        <span className="text-2xl">→</span>
        {loading
          ? <Skeleton className="h-3 w-10 mt-1" />
          : <span className="text-xs font-medium text-green-600">{rate ?? 0}%</span>}
      </div>
    </div>
  );
}

function FunnelSection({ funnel, loading, error }: {
  funnel: FunnelData | undefined;
  loading: boolean;
  error: unknown;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Target className="h-5 w-5" />
            Conversion Funnel
          </h2>
          {funnel && !loading && (
            <div className="text-sm text-muted-foreground">
              Overall: <span className="font-semibold text-primary">{funnel.rates.overall}%</span>
            </div>
          )}
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            Failed to load funnel data: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        ) : null}

        {!error && funnel && !funnel.ga4Available && !loading && (
          <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400 mb-4">
            GA4 traffic data unavailable — visits / search / supplier-views will show 0. Quote and newsletter counts come from Supabase and are accurate.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1.4fr] gap-3 items-stretch">
          <FunnelStageCard
            label="Visits"
            value={funnel?.visits ?? 0}
            eventName="page_view"
            gradient="from-cyan-500/20 to-cyan-600/20"
            borderColor="border-cyan-500"
            textColor="text-cyan-600"
            loading={loading}
          />
          <FunnelArrow rate={funnel?.rates.visitToUpload} loading={loading} />

          <FunnelStageCard
            label="Files uploaded"
            value={funnel?.filesUploaded ?? 0}
            eventName="file_uploaded"
            dropOff={funnel?.dropOff.visitToUpload}
            gradient="from-blue-500/20 to-blue-600/20"
            borderColor="border-blue-500"
            textColor="text-blue-600"
            loading={loading}
          />
          <FunnelArrow rate={funnel?.rates.uploadToView} loading={loading} />

          <FunnelStageCard
            label="Supplier Views"
            value={funnel?.supplierViews ?? 0}
            eventName="supplier_pageview"
            dropOff={funnel?.dropOff.uploadToView}
            gradient="from-green-500/20 to-green-600/20"
            borderColor="border-green-500"
            textColor="text-green-600"
            loading={loading}
          />
          <FunnelArrow rate={funnel?.rates.viewToAnyConversion} loading={loading} />

          <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-2 border-yellow-500 rounded-lg p-4">
            <div className="text-xs font-medium text-center text-muted-foreground mb-2">Conversions</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                {loading
                  ? <Skeleton className="h-7 w-10 mx-auto" />
                  : <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-500">{funnel?.affiliateClicks ?? 0}</div>}
                <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                  <MousePointerClick className="h-3 w-3" /> Click
                </div>
              </div>
              <div className="text-center">
                {loading
                  ? <Skeleton className="h-7 w-10 mx-auto" />
                  : <div className="text-2xl font-bold text-amber-600">{funnel?.quoteRequests ?? 0}</div>}
                <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                  <FileText className="h-3 w-3" /> Quote
                </div>
              </div>
              <div className="text-center">
                {loading
                  ? <Skeleton className="h-7 w-10 mx-auto" />
                  : <div className="text-2xl font-bold text-orange-600">{funnel?.newsletterSignups ?? 0}</div>}
                <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                  <Mail className="h-3 w-3" /> Signup
                </div>
              </div>
            </div>
            {!loading && funnel && (
              <div className="mt-3 pt-3 border-t border-yellow-500/30 text-center text-xs text-muted-foreground">
                Total: <span className="font-semibold text-foreground">{funnel.totalConversions.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

type Tab = 'overview' | 'suppliers' | 'analytics' | 'applications';

export default function Admin() {
  const [tab, setTab] = useState<Tab>('overview');
  const [range, setRange] = useState<DateRange>(() => rangeForDays(30));
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading, isError: statsError, error: statsErr } = useAdminStats(range);
  const { data: funnel, isLoading: funnelLoading, error: funnelError } = useFunnelData(range);

  const total = stats?.suppliers.total ?? 0;
  const verified = stats?.suppliers.verified ?? 0;
  const verifiedPct = total > 0 ? Math.round((verified / total) * 100) : 0;
  const withDescPct = total > 0 ? Math.round(((stats?.suppliers.withDesc ?? 0) / total) * 100) : 0;
  const withLogoPct = total > 0 ? Math.round(((stats?.suppliers.withLogo ?? 0) / total) * 100) : 0;
  const missingLogos = total - (stats?.suppliers.withLogo ?? 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/')} className="text-xl font-bold text-foreground hover:text-primary transition-colors">
                AMSupplyCheck
              </button>
              <Badge variant="outline" className="text-xs">Admin</Badge>
            </div>
            <div className="flex items-center gap-2">
              <DateRangePicker value={range} onChange={setRange} />
            </div>
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
        {statsError && (
          <Card className="bg-destructive/10 border-destructive/50 mb-6">
            <CardContent className="p-4">
              <p className="text-sm text-destructive">
                Failed to load stats: {statsErr instanceof Error ? statsErr.message : 'Unknown error'}
              </p>
            </CardContent>
          </Card>
        )}

        {tab === 'overview' && (
          <div className="space-y-8">
            <div className="flex items-baseline justify-between">
              <h1 className="text-2xl font-bold text-foreground">Dashboard Overview</h1>
              <p className="text-xs text-muted-foreground">All metrics scoped to selected period</p>
            </div>

            <FunnelSection funnel={funnel} loading={funnelLoading} error={funnelError} />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={CheckCircle}
                label="Verified suppliers added"
                value={verified}
                sub={total > 0 ? `of ${total} new (${verifiedPct}%)` : undefined}
                color="text-green-500"
                loading={statsLoading}
              />
              <StatCard icon={Globe} label="Countries represented" value={stats?.countries ?? 0} loading={statsLoading} />
              <StatCard icon={Zap} label="Technologies (catalog)" value={stats?.technologies ?? 0} loading={statsLoading} />
              <StatCard icon={Star} label="Materials (catalog)" value={stats?.materials ?? 0} loading={statsLoading} />
              <StatCard icon={Search} label="Searches" value={stats?.searches ?? 0} loading={statsLoading} />
              <StatCard icon={BarChart3} label="Project matches" value={stats?.aiMatches ?? 0} loading={statsLoading} />
              <StatCard icon={ArrowRight} label="Applications" value={stats?.applications ?? 0} loading={statsLoading} />
              <StatCard
                icon={Eye}
                label="Discovery runs"
                value={stats?.discoveryRuns ?? 0}
                sub={stats ? `${stats.newFromDiscovery} new found` : undefined}
                loading={statsLoading}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Top Technologies (new suppliers in period)</h3>
                  <BarChart data={stats?.topTechnologies ?? []} loading={statsLoading} />
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Top Materials (new suppliers in period)</h3>
                  <BarChart data={stats?.topMaterials ?? []} loading={statsLoading} />
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Suppliers by Country (new in period)</h3>
                <BarChart data={stats?.topCountries ?? []} loading={statsLoading} />
              </CardContent>
            </Card>
          </div>
        )}

        {tab === 'suppliers' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-foreground">
                Suppliers added {statsLoading ? '' : `(${total})`}
              </h1>
              <Badge variant="outline">{verified} verified</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-6 text-center">
                  {statsLoading
                    ? <Skeleton className="h-9 w-16 mx-auto" />
                    : <p className="text-3xl font-bold text-green-500">{verified}</p>}
                  <p className="text-sm text-muted-foreground mt-1">Verified</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-6 text-center">
                  {statsLoading
                    ? <Skeleton className="h-9 w-16 mx-auto" />
                    : <p className="text-3xl font-bold text-yellow-500">{total - verified}</p>}
                  <p className="text-sm text-muted-foreground mt-1">Unverified</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-6 text-center">
                  {statsLoading
                    ? <Skeleton className="h-9 w-16 mx-auto" />
                    : <p className="text-3xl font-bold text-muted-foreground">{withLogoPct}%</p>}
                  <p className="text-sm text-muted-foreground mt-1">Have Logos</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Data Quality (new suppliers in period)</h3>
                {statsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : total === 0 ? (
                  <p className="text-sm text-muted-foreground">No new suppliers added in this period.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-yellow-400">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      {missingLogos} missing logos ({Math.round((missingLogos / total) * 100)}%)
                    </li>
                    <li className="flex items-center gap-2 text-yellow-400">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      {stats?.suppliers.missingRegion ?? 0} have no region set
                    </li>
                    <li className="flex items-center gap-2 text-yellow-400">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      {stats?.suppliers.missingCountry ?? 0} have no country
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
                      <span className="text-muted-foreground">Searches in period</span>
                      {statsLoading
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
                      {statsLoading
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
                      <span className="text-muted-foreground">Signups in period</span>
                      {statsLoading
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
                      {statsLoading
                        ? <Skeleton className="h-5 w-12" />
                        : <span className="font-semibold text-foreground">
                            {stats?.discoveryRunsCompleted ?? 0} of {stats?.discoveryRuns ?? 0}
                          </span>}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">New suppliers found</span>
                      {statsLoading
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
            <p className="text-muted-foreground">Companies that applied in the selected period</p>

            {statsLoading ? (
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
              <p className="text-sm text-muted-foreground">No applications in this period.</p>
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
