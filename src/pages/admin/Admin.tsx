import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Globe, CheckCircle, Zap, Star, Search, ArrowRight, BarChart3, Eye,
  Target, Mail, ShieldCheck, ExternalLink, GitPullRequest,
} from 'lucide-react';
import { useAdminStats, type TopItem } from '@/hooks/use-admin-stats';
import { useSupplierInventory } from '@/hooks/use-supplier-inventory';
import { useFunnelData, type FunnelData } from '@/hooks/use-funnel-data';
import { useGA4Funnel } from '@/hooks/use-ga4-funnel';
import { useEventBreakdown } from '@/hooks/use-event-breakdown';
import {
  useAuditQueue, useConfidenceHistogram, useRecentAudits, useOpenAuditPRs,
  type AuditSupplier, type ConfidenceBucket, type AuditPR,
} from '@/hooks/use-audit-data';
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

        {!error && funnel && !funnel.hasTrafficData && !loading && (
          <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400 mb-4">
            No traffic events recorded in the selected period — visits and supplier views will show 0. Tracking captures new events going forward only.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] gap-3 items-stretch">
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
          <FunnelArrow rate={funnel?.rates.viewToClick} loading={loading} />

          <FunnelStageCard
            label="Conversions"
            value={funnel?.affiliateClicks ?? 0}
            eventName="outbound_click"
            dropOff={funnel?.dropOff.viewToClick}
            gradient="from-yellow-500/20 to-amber-500/20"
            borderColor="border-yellow-500"
            textColor="text-yellow-600"
            loading={loading}
          />
        </div>
      </CardContent>
    </Card>
  );
}

type Tab = 'overview' | 'suppliers' | 'analytics' | 'compare' | 'applications' | 'audit';

function confidenceTone(c: number | null | undefined): { color: string; label: string } {
  if (c === null || c === undefined) return { color: 'bg-muted text-muted-foreground', label: '—' };
  if (c < 40) return { color: 'bg-red-500/15 text-red-600 border-red-500/30', label: c.toFixed(0) };
  if (c < 70) return { color: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-500 border-yellow-500/30', label: c.toFixed(0) };
  return { color: 'bg-green-500/15 text-green-600 border-green-500/30', label: c.toFixed(0) };
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return 'Never';
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

function AuditQueueSection() {
  const { data, isLoading, error } = useAuditQueue();
  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardContent className="p-0">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Next in audit queue
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Top 20 suppliers by lowest confidence — same order the daily cron picks from.
          </p>
        </div>
        {error ? (
          <div className="m-6 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            Failed to load queue: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        ) : (
          <div className="grid grid-cols-[40px_1fr_90px_110px_70px_40px] gap-0 text-sm">
            <div className="bg-muted/40 px-4 py-3 font-semibold text-foreground border-b border-border">#</div>
            <div className="bg-muted/40 px-4 py-3 font-semibold text-foreground border-b border-border">Supplier</div>
            <div className="bg-muted/40 px-4 py-3 font-semibold text-foreground border-b border-border text-right">Confidence</div>
            <div className="bg-muted/40 px-4 py-3 font-semibold text-foreground border-b border-border">Last validated</div>
            <div className="bg-muted/40 px-4 py-3 font-semibold text-foreground border-b border-border text-right">Fails</div>
            <div className="bg-muted/40 px-4 py-3 border-b border-border" />
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <React.Fragment key={i}>
                  <div className="px-4 py-3 border-b border-border last:border-b-0"><Skeleton className="h-4 w-6" /></div>
                  <div className="px-4 py-3 border-b border-border last:border-b-0"><Skeleton className="h-4 w-40" /></div>
                  <div className="px-4 py-3 border-b border-border last:border-b-0 text-right"><Skeleton className="h-5 w-12 ml-auto" /></div>
                  <div className="px-4 py-3 border-b border-border last:border-b-0"><Skeleton className="h-4 w-20" /></div>
                  <div className="px-4 py-3 border-b border-border last:border-b-0 text-right"><Skeleton className="h-4 w-6 ml-auto" /></div>
                  <div className="px-4 py-3 border-b border-border last:border-b-0" />
                </React.Fragment>
              ))
            ) : data && data.length > 0 ? (
              data.map((s: AuditSupplier, idx: number) => {
                const tone = confidenceTone(s.last_validation_confidence);
                return (
                  <React.Fragment key={s.id}>
                    <div className="px-4 py-3 border-b border-border last:border-b-0 text-muted-foreground">{idx + 1}</div>
                    <div className="px-4 py-3 border-b border-border last:border-b-0">
                      <div className="font-medium text-foreground truncate">{s.name}</div>
                      <code className="font-mono text-xs text-muted-foreground/70">{s.supplier_id}</code>
                    </div>
                    <div className="px-4 py-3 border-b border-border last:border-b-0 text-right">
                      <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded border text-xs font-semibold ${tone.color}`}>
                        {tone.label}
                      </span>
                    </div>
                    <div className="px-4 py-3 border-b border-border last:border-b-0 text-muted-foreground text-xs">
                      {formatRelative(s.last_validated_at)}
                    </div>
                    <div className="px-4 py-3 border-b border-border last:border-b-0 text-right">
                      <span className={s.validation_failures && s.validation_failures > 0 ? 'text-red-500 font-semibold' : 'text-muted-foreground/60'}>
                        {s.validation_failures ?? 0}
                      </span>
                    </div>
                    <div className="px-4 py-3 border-b border-border last:border-b-0">
                      {s.website && (
                        <a
                          href={s.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground hover:text-foreground inline-flex"
                          title={s.website}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </React.Fragment>
                );
              })
            ) : (
              <div className="col-span-6 px-6 py-8 text-center text-sm text-muted-foreground">
                No suppliers in queue.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ConfidenceHistogramSection() {
  const { data, isLoading, error } = useConfidenceHistogram();
  const max = data ? Math.max(...data.buckets.map((b: ConfidenceBucket) => b.count), 1) : 1;
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Confidence distribution
          </h3>
          {data && !isLoading && (
            <p className="text-xs text-muted-foreground">
              {data.total.toLocaleString()} suppliers total
            </p>
          )}
        </div>
        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            Failed to load histogram: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 flex-1" />
                <Skeleton className="h-4 w-10" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {data?.buckets.map((b: ConfidenceBucket) => {
              const tone = b.range === null
                ? 'bg-muted-foreground/40'
                : b.range[1] < 26
                  ? 'bg-red-500/70'
                  : b.range[1] < 76
                    ? 'bg-yellow-500/70'
                    : 'bg-green-500/70';
              return (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-28 text-right">{b.label}</span>
                  <div className="flex-1 h-6 bg-muted/30 rounded overflow-hidden">
                    <div
                      className={`h-full ${tone} rounded`}
                      style={{ width: `${(b.count / max) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">{b.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentAuditsSection() {
  const { data, isLoading, error } = useRecentAudits();
  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardContent className="p-0">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Audited in last 14 days
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Suppliers whose <code className="font-mono">last_validated_at</code> was bumped recently. Up to 30 rows.
          </p>
        </div>
        {error ? (
          <div className="m-6 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            Failed to load recent audits: {error instanceof Error ? error.message : 'Unknown error'}
          </div>
        ) : (
          <div className="grid grid-cols-[120px_1fr_100px_80px] gap-0 text-sm">
            <div className="bg-muted/40 px-4 py-3 font-semibold text-foreground border-b border-border">When</div>
            <div className="bg-muted/40 px-4 py-3 font-semibold text-foreground border-b border-border">Supplier</div>
            <div className="bg-muted/40 px-4 py-3 font-semibold text-foreground border-b border-border text-right">Confidence</div>
            <div className="bg-muted/40 px-4 py-3 font-semibold text-foreground border-b border-border text-right">Fails</div>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <React.Fragment key={i}>
                  <div className="px-4 py-3 border-b border-border last:border-b-0"><Skeleton className="h-4 w-20" /></div>
                  <div className="px-4 py-3 border-b border-border last:border-b-0"><Skeleton className="h-4 w-40" /></div>
                  <div className="px-4 py-3 border-b border-border last:border-b-0 text-right"><Skeleton className="h-5 w-12 ml-auto" /></div>
                  <div className="px-4 py-3 border-b border-border last:border-b-0 text-right"><Skeleton className="h-4 w-6 ml-auto" /></div>
                </React.Fragment>
              ))
            ) : data && data.length > 0 ? (
              data.map((s: AuditSupplier) => {
                const tone = confidenceTone(s.last_validation_confidence);
                return (
                  <React.Fragment key={s.id}>
                    <div className="px-4 py-3 border-b border-border last:border-b-0 text-muted-foreground text-xs">
                      {formatRelative(s.last_validated_at)}
                    </div>
                    <div className="px-4 py-3 border-b border-border last:border-b-0">
                      <div className="font-medium text-foreground truncate">{s.name}</div>
                    </div>
                    <div className="px-4 py-3 border-b border-border last:border-b-0 text-right">
                      <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-0.5 rounded border text-xs font-semibold ${tone.color}`}>
                        {tone.label}
                      </span>
                    </div>
                    <div className="px-4 py-3 border-b border-border last:border-b-0 text-right">
                      <span className={s.validation_failures && s.validation_failures > 0 ? 'text-red-500 font-semibold' : 'text-muted-foreground/60'}>
                        {s.validation_failures ?? 0}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })
            ) : (
              <div className="col-span-4 px-6 py-8 text-center text-sm text-muted-foreground">
                No audits in the last 14 days.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OpenAuditPRsSection() {
  const { data, isLoading, error } = useOpenAuditPRs();
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <GitPullRequest className="h-5 w-5" />
            Open audit PRs
          </h3>
          {data && !isLoading && (
            <p className="text-xs text-muted-foreground">{data.length} open</p>
          )}
        </div>
        {error ? (
          <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
            <div className="font-semibold">Couldn't reach GitHub.</div>
            <div className="text-xs">
              Set <code className="font-mono">GITHUB_AUDIT_PAT</code> via <code className="font-mono">npx supabase secrets set</code> and deploy <code className="font-mono">list-audit-prs</code>.
            </div>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="space-y-2">
            {data.map((pr: AuditPR) => (
              <a
                key={pr.number}
                href={pr.html_url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-md border border-border bg-card hover:border-primary/50 hover:bg-muted/30 px-4 py-3 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground truncate">{pr.title}</span>
                      {pr.draft && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">draft</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>#{pr.number}</span>
                      <span>·</span>
                      <span>{formatRelative(pr.created_at)}</span>
                      <span>·</span>
                      <code className="font-mono">{pr.head_ref}</code>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
            No open audit PRs. The cron will open one tomorrow if a supplier needs review.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  const [tab, setTab] = useState<Tab>('overview');
  const [range, setRange] = useState<DateRange>(() => rangeForDays(30));
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading, isError: statsError, error: statsErr } = useAdminStats(range);
  const { data: inventory, isLoading: inventoryLoading } = useSupplierInventory();
  const { data: funnel, isLoading: funnelLoading, error: funnelError } = useFunnelData(range);
  const { data: ga4, isLoading: ga4Loading, error: ga4Error } = useGA4Funnel(range, tab === 'compare');
  const { data: events, isLoading: eventsLoading, error: eventsError } = useEventBreakdown(range);

  const total = stats?.suppliers.total ?? 0;
  const verified = stats?.suppliers.verified ?? 0;
  const verifiedPct = total > 0 ? Math.round((verified / total) * 100) : 0;
  const withDescPct = total > 0 ? Math.round(((stats?.suppliers.withDesc ?? 0) / total) * 100) : 0;
  const withLogoPct = total > 0 ? Math.round(((stats?.suppliers.withLogo ?? 0) / total) * 100) : 0;
  const missingLogos = total - (stats?.suppliers.withLogo ?? 0);

  const invTotal = inventory?.total ?? 0;
  const invVerified = inventory?.verified ?? 0;
  const invWithLogoPct = invTotal > 0 ? Math.round(((inventory?.withLogo ?? 0) / invTotal) * 100) : 0;
  const invWithDescPct = invTotal > 0 ? Math.round(((inventory?.withDesc ?? 0) / invTotal) * 100) : 0;
  const invMissingLogos = invTotal - (inventory?.withLogo ?? 0);

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
            {(['overview', 'suppliers', 'analytics', 'compare', 'applications', 'audit'] as Tab[]).map(t => (
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
                Suppliers {inventoryLoading ? '' : `(${invTotal})`}
              </h1>
              <Badge variant="outline">{invVerified} approved</Badge>
            </div>

            <p className="text-xs text-muted-foreground -mt-2">
              "Approved" is the manual catalog flag (<code className="font-mono">suppliers.verified</code>). For automated data-quality checks, see the <button onClick={() => setTab('audit')} className="underline hover:text-foreground">Audit tab</button>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-6 text-center">
                  {inventoryLoading
                    ? <Skeleton className="h-9 w-16 mx-auto" />
                    : <p className="text-3xl font-bold text-green-500">{invVerified}</p>}
                  <p className="text-sm text-muted-foreground mt-1">Approved</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-6 text-center">
                  {inventoryLoading
                    ? <Skeleton className="h-9 w-16 mx-auto" />
                    : <p className="text-3xl font-bold text-yellow-500">{invTotal - invVerified}</p>}
                  <p className="text-sm text-muted-foreground mt-1">Not approved</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-6 text-center">
                  {inventoryLoading
                    ? <Skeleton className="h-9 w-16 mx-auto" />
                    : <p className="text-3xl font-bold text-muted-foreground">{invWithLogoPct}%</p>}
                  <p className="text-sm text-muted-foreground mt-1">Have Logos</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">Data Quality</h3>
                {inventoryLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : invTotal === 0 ? (
                  <p className="text-sm text-muted-foreground">No suppliers yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2 text-yellow-400">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      {invMissingLogos} missing logos ({Math.round((invMissingLogos / invTotal) * 100)}%)
                    </li>
                    <li className="flex items-center gap-2 text-yellow-400">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      {inventory?.missingRegion ?? 0} have no region set
                    </li>
                    <li className="flex items-center gap-2 text-yellow-400">
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      {inventory?.missingCountry ?? 0} have no country
                    </li>
                    <li className="flex items-center gap-2 text-green-400">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      {invWithDescPct}% have descriptions
                    </li>
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {tab === 'analytics' && (
          <div className="space-y-8">
            <div className="flex items-baseline justify-between">
              <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
              <p className="text-xs text-muted-foreground">All counts from Supabase platform tracking</p>
            </div>

            <FunnelSection funnel={funnel} loading={funnelLoading} error={funnelError} />

            <Card className="bg-card border-border overflow-hidden">
              <CardContent className="p-0">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Event tracking detail</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Every high-signal event recorded in <code className="font-mono">analytics_events</code> for the selected period.
                    </p>
                  </div>
                  {events && !eventsLoading && (
                    <div className="text-sm text-muted-foreground">
                      Total: <span className="font-semibold text-foreground">{events.totalEvents.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {eventsError ? (
                  <div className="m-6 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    Failed to load event breakdown: {eventsError instanceof Error ? eventsError.message : 'Unknown error'}
                  </div>
                ) : (
                  <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-0 text-sm">
                    <div className="bg-muted/40 px-6 py-3 font-semibold text-foreground border-b border-border">Event</div>
                    <div className="bg-muted/40 px-4 py-3 font-semibold text-foreground border-b border-border">event_name</div>
                    <div className="bg-muted/40 px-6 py-3 font-semibold text-foreground text-right border-b border-border">Count</div>

                    {eventsLoading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <React.Fragment key={i}>
                          <div className="px-6 py-3 border-b border-border last:border-b-0"><Skeleton className="h-5 w-32" /></div>
                          <div className="px-4 py-3 border-b border-border last:border-b-0"><Skeleton className="h-4 w-24" /></div>
                          <div className="px-6 py-3 text-right border-b border-border last:border-b-0"><Skeleton className="h-5 w-16 ml-auto" /></div>
                        </React.Fragment>
                      ))
                    ) : events && events.rows.length > 0 ? (
                      <>
                        {events.rows.map(row => (
                          <React.Fragment key={row.eventName}>
                            <div className="px-6 py-3 border-b border-border last:border-b-0">
                              <div className="font-medium text-foreground">{row.label}</div>
                            </div>
                            <div className="px-4 py-3 border-b border-border last:border-b-0">
                              <code className="font-mono text-xs text-muted-foreground">{row.eventName}</code>
                            </div>
                            <div className="px-6 py-3 text-right border-b border-border last:border-b-0">
                              <span className={`font-semibold ${row.count === 0 ? 'text-muted-foreground/60' : 'text-foreground'}`}>
                                {row.count.toLocaleString()}
                              </span>
                            </div>
                          </React.Fragment>
                        ))}
                        <div className="px-6 py-3 bg-muted/20 border-t border-border">
                          <div className="font-semibold text-foreground">File uploads</div>
                        </div>
                        <div className="px-4 py-3 bg-muted/20 border-t border-border">
                          <code className="font-mono text-xs text-muted-foreground">upload_events table</code>
                        </div>
                        <div className="px-6 py-3 text-right bg-muted/20 border-t border-border">
                          <span className={`font-semibold ${events.uploadEvents === 0 ? 'text-muted-foreground/60' : 'text-foreground'}`}>
                            {events.uploadEvents.toLocaleString()}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="col-span-3 px-6 py-8 text-center text-sm text-muted-foreground">
                        No events recorded in this period.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Database aggregates</h2>
              <p className="text-xs text-muted-foreground mb-4">
                These come from dedicated tables (search_analytics, ai_match_analytics, newsletter_signups, discovery_runs) — not event tracking.
              </p>
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
          </div>
        )}

        {tab === 'compare' && (
          <div className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Platform vs GA4</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Side-by-side check of internal Supabase events against Google Analytics. Gaps usually mean adblock, consent banner, or GA4's 24–48h reporting delay.
                </p>
              </div>
            </div>

            {ga4Error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                Failed to load GA4 data: {ga4Error instanceof Error ? ga4Error.message : 'Unknown error'}
              </div>
            )}

            {ga4 && !ga4.available && !ga4Loading && !ga4Error && (
              <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                {ga4.reason === 'credentials_missing' ? (
                  <>
                    <div className="font-semibold">GA4 credentials not configured in Supabase.</div>
                    <div>Set <code className="font-mono text-xs">GA4_PROPERTY_ID</code> and <code className="font-mono text-xs">GA4_SERVICE_ACCOUNT_JSON</code> under Settings → Edge Functions → Secrets, then redeploy the <code className="font-mono text-xs">ga4-analytics</code> function.</div>
                  </>
                ) : ga4.reason === 'edge_function_error' ? (
                  <>
                    <div className="font-semibold">GA4 edge function returned an error.</div>
                    <div>{ga4.errorMessage ?? 'Unknown error from ga4-analytics function.'}</div>
                  </>
                ) : (
                  <div>GA4 returned no funnel data for this period. The function ran but produced no rows — either GA4 has no matching events, or the date range is empty.</div>
                )}
              </div>
            )}

            {ga4 && ga4.available && !ga4Loading && ga4.visits === 0 && ga4.supplierViews === 0 && ga4.conversions === 0 && ga4.filesUploaded === 0 && (
              <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-700 dark:text-yellow-400">
                GA4 has no events for this period. This usually means adblock/consent blocked all measurement, or GA4's 24–48h reporting delay hasn't caught up.
              </div>
            )}

            <Card className="bg-card border-border overflow-hidden">
              <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] gap-0 text-sm">
                <div className="bg-muted/40 px-4 py-3 font-semibold text-foreground border-b border-border">Funnel stage</div>
                <div className="bg-muted/40 px-4 py-3 font-semibold text-foreground text-right border-b border-border">Platform (Supabase)</div>
                <div className="bg-muted/40 px-4 py-3 font-semibold text-foreground text-right border-b border-border">GA4</div>
                <div className="bg-muted/40 px-4 py-3 font-semibold text-foreground text-right border-b border-border">Delta</div>

                {[
                  { label: 'Visits', event: 'page_view', platform: funnel?.visits ?? 0, ga4: ga4?.visits ?? 0 },
                  { label: 'Files uploaded', event: 'file_uploaded', platform: funnel?.filesUploaded ?? 0, ga4: ga4?.filesUploaded ?? 0 },
                  { label: 'Supplier views', event: 'supplier_pageview', platform: funnel?.supplierViews ?? 0, ga4: ga4?.supplierViews ?? 0 },
                  { label: 'Affiliate clicks', event: 'outbound_click', platform: funnel?.affiliateClicks ?? 0, ga4: ga4?.conversions ?? 0 },
                ].map(row => {
                  const delta = row.platform - row.ga4;
                  const pct = row.ga4 > 0 ? Math.round((delta / row.ga4) * 100) : null;
                  const deltaColor = delta > 0 ? 'text-green-500' : delta < 0 ? 'text-red-500' : 'text-muted-foreground';
                  const deltaSign = delta > 0 ? '+' : '';
                  const isLoading = funnelLoading || ga4Loading;
                  return (
                    <React.Fragment key={row.label}>
                      <div className="px-4 py-3 border-b border-border last:border-b-0">
                        <div className="font-medium text-foreground">{row.label}</div>
                        <div className="text-xs text-muted-foreground">{row.event}</div>
                      </div>
                      <div className="px-4 py-3 text-right border-b border-border last:border-b-0">
                        {isLoading ? <Skeleton className="h-5 w-16 ml-auto" /> : <span className="font-semibold text-foreground">{row.platform.toLocaleString()}</span>}
                      </div>
                      <div className="px-4 py-3 text-right border-b border-border last:border-b-0">
                        {isLoading ? <Skeleton className="h-5 w-16 ml-auto" /> : <span className="font-semibold text-foreground">{row.ga4.toLocaleString()}</span>}
                      </div>
                      <div className="px-4 py-3 text-right border-b border-border last:border-b-0">
                        {isLoading ? <Skeleton className="h-5 w-20 ml-auto" /> : (
                          <span className={`font-semibold ${deltaColor}`}>
                            {deltaSign}{delta.toLocaleString()}
                            {pct !== null && <span className="ml-1 text-xs opacity-70">({deltaSign}{pct}%)</span>}
                          </span>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </Card>

            <p className="text-xs text-muted-foreground/70">
              Positive delta = platform sees more events than GA4 (typical: GA4 loses traffic to adblock and consent rejections).
              Negative delta = GA4 reports more than platform (possible: tracker not fired, GA4 has older data than current deploy, or GTM auto-events that aren't mirrored to Supabase).
            </p>
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

        {tab === 'audit' && (
          <div className="space-y-6">
            <div className="flex items-baseline justify-between">
              <h1 className="text-2xl font-bold text-foreground">Supplier audit</h1>
              <p className="text-xs text-muted-foreground">Daily cron picks the lowest-confidence supplier and opens a draft PR</p>
            </div>
            <AuditQueueSection />
            <ConfidenceHistogramSection />
            <RecentAuditsSection />
            <OpenAuditPRsSection />
          </div>
        )}
      </main>
    </div>
  );
}
