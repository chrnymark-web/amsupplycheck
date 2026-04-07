import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/ui/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RefreshCw, TrendingUp, TrendingDown, Globe, Search, Users, FileText, CalendarIcon, ArrowUpRight, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, startOfDay, endOfDay, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(221, 83%, 53%)',
  'hsl(262, 83%, 58%)',
  'hsl(339, 90%, 51%)',
  'hsl(25, 95%, 53%)',
  'hsl(142, 71%, 45%)'
];

interface OrganicTrafficDay {
  date: string;
  sessions: number;
  activeUsers: number;
  bounceRate: number;
  engagementRate: number;
  avgSessionDuration: number;
  pagesPerSession: number;
}

interface LandingPage {
  page: string;
  sessions: number;
  users: number;
  bounceRate: number;
  engagementRate: number;
  conversions: number;
}

interface OrganicOverview {
  totalSessions: number;
  organicSessions: number;
  organicUsers: number;
  organicShare: number;
}

interface SupplierCoverage {
  total: number;
  verified: number;
  withWebsite: number;
  technologies: { name: string; count: number }[];
  materials: { name: string; count: number }[];
}

interface InternalSearchData {
  totalSearches: number;
  zeroResultRate: number;
  topQueries: { query: string; count: number }[];
  zeroResultQueries: { query: string; count: number }[];
}

const SEODashboard = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  
  // Previous period data for comparison
  const [prevOrganicTraffic, setPrevOrganicTraffic] = useState<OrganicTrafficDay[]>([]);
  const [prevOrganicOverview, setPrevOrganicOverview] = useState<OrganicOverview | null>(null);
  const [prevConversions, setPrevConversions] = useState<{ newsletters: number; quotes: number }>({ newsletters: 0, quotes: 0 });
  const [prevInternalSearch, setPrevInternalSearch] = useState<InternalSearchData | null>(null);

  const [organicTraffic, setOrganicTraffic] = useState<OrganicTrafficDay[]>([]);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [organicOverview, setOrganicOverview] = useState<OrganicOverview | null>(null);
  const [supplierCoverage, setSupplierCoverage] = useState<SupplierCoverage | null>(null);
  const [internalSearch, setInternalSearch] = useState<InternalSearchData | null>(null);
  const [conversions, setConversions] = useState<{ newsletters: number; quotes: number }>({ newsletters: 0, quotes: 0 });

  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAdmin) fetchAllData();
  }, [startDate, endDate]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (roleData?.role === "admin") {
      setIsAdmin(true);
      await fetchAllData();
    }
    setLoading(false);
  };

  // Calculate previous period dates
  const periodDays = differenceInDays(endDate, startDate) + 1;
  const prevEndDate = subDays(startDate, 1);
  const prevStartDate = subDays(prevEndDate, periodDays - 1);

  const fetchAllData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchGA4SEOData(),
        fetchGA4SEOData(true),
        fetchSupplierCoverage(),
        fetchInternalSearchData(),
        fetchInternalSearchData(true),
        fetchConversionData(),
        fetchConversionData(true),
      ]);
    } catch (error) {
      console.error('Error fetching SEO data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchGA4SEOData = async (isPrev = false) => {
    const sd = isPrev ? prevStartDate : startDate;
    const ed = isPrev ? prevEndDate : endDate;
    try {
      const { data, error } = await supabase.functions.invoke('ga4-analytics', {
        body: {
          action: 'seo',
          dateRange: {
            startDate: format(sd, 'yyyy-MM-dd'),
            endDate: format(ed, 'yyyy-MM-dd'),
          }
        }
      });

      if (error) throw error;
      if (isPrev) {
        setPrevOrganicTraffic(data?.organicTraffic || []);
        setPrevOrganicOverview(data?.organicOverview || null);
      } else {
        setOrganicTraffic(data?.organicTraffic || []);
        setLandingPages(data?.topLandingPages || []);
        setOrganicOverview(data?.organicOverview || null);
      }
    } catch (error) {
      console.error('GA4 SEO fetch error:', error);
      if (!isPrev) toast({ title: "GA4-fejl", description: "Kunne ikke hente organisk trafik-data", variant: "destructive" });
    }
  };

  const fetchSupplierCoverage = async () => {
    const { data: suppliers } = await supabase.from('suppliers').select('verified, website, technologies, materials');
    if (!suppliers) return;

    const techCounts = new Map<string, number>();
    const matCounts = new Map<string, number>();
    suppliers.forEach(s => {
      (s.technologies || []).forEach((t: string) => techCounts.set(t, (techCounts.get(t) || 0) + 1));
      (s.materials || []).forEach((m: string) => matCounts.set(m, (matCounts.get(m) || 0) + 1));
    });

    setSupplierCoverage({
      total: suppliers.length,
      verified: suppliers.filter(s => s.verified).length,
      withWebsite: suppliers.filter(s => s.website).length,
      technologies: Array.from(techCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count })),
      materials: Array.from(matCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count })),
    });
  };

  const fetchInternalSearchData = async (isPrev = false) => {
    const sd = isPrev ? prevStartDate : startDate;
    const ed = isPrev ? prevEndDate : endDate;
    const startISO = startOfDay(sd).toISOString();
    const endISO = endOfDay(ed).toISOString();

    const { data } = await supabase
      .from('search_analytics')
      .select('query, results_count')
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .limit(1000);

    if (!data) return;

    const total = data.length;
    const zeroResults = data.filter(s => (s.results_count || 0) === 0);
    const zeroResultRate = total > 0 ? Math.round((zeroResults.length / total) * 100) : 0;

    const queryCounts = new Map<string, number>();
    data.forEach(s => {
      const q = s.query?.toLowerCase().trim();
      if (q && q.length > 2) queryCounts.set(q, (queryCounts.get(q) || 0) + 1);
    });

    const zeroQueryCounts = new Map<string, number>();
    zeroResults.forEach(s => {
      const q = s.query?.toLowerCase().trim();
      if (q && q.length > 2) zeroQueryCounts.set(q, (zeroQueryCounts.get(q) || 0) + 1);
    });

    const result = {
      totalSearches: total,
      zeroResultRate,
      topQueries: Array.from(queryCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([query, count]) => ({ query, count })),
      zeroResultQueries: Array.from(zeroQueryCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([query, count]) => ({ query, count })),
    };

    if (isPrev) setPrevInternalSearch(result);
    else setInternalSearch(result);
  };

  const fetchConversionData = async (isPrev = false) => {
    const sd = isPrev ? prevStartDate : startDate;
    const ed = isPrev ? prevEndDate : endDate;
    const startISO = startOfDay(sd).toISOString();
    const endISO = endOfDay(ed).toISOString();

    const [{ count: newsletters }, { count: quotes }] = await Promise.all([
      supabase.from('newsletter_signups').select('*', { count: 'exact', head: true }).gte('created_at', startISO).lte('created_at', endISO),
      supabase.from('quote_requests').select('*', { count: 'exact', head: true }).gte('created_at', startISO).lte('created_at', endISO),
    ]);

    const result = { newsletters: newsletters || 0, quotes: quotes || 0 };
    if (isPrev) setPrevConversions(result);
    else setConversions(result);
  };

  const totalOrganicSessions = organicTraffic.reduce((sum, d) => sum + d.sessions, 0);
  const prevTotalOrganicSessions = prevOrganicTraffic.reduce((sum, d) => sum + d.sessions, 0);
  const avgBounceRate = organicTraffic.length > 0
    ? (organicTraffic.reduce((sum, d) => sum + d.bounceRate, 0) / organicTraffic.length * 100).toFixed(1)
    : '0';
  const prevAvgBounceRate = prevOrganicTraffic.length > 0
    ? (prevOrganicTraffic.reduce((sum, d) => sum + d.bounceRate, 0) / prevOrganicTraffic.length * 100).toFixed(1)
    : '0';

  const calcDelta = (current: number, previous: number): { value: string; positive: boolean } | null => {
    if (previous === 0 && current === 0) return null;
    if (previous === 0) return { value: '+∞', positive: true };
    const pct = ((current - previous) / previous * 100).toFixed(0);
    return { value: `${Number(pct) >= 0 ? '+' : ''}${pct}%`, positive: Number(pct) >= 0 };
  };

  const prevTotalConversions = prevConversions.newsletters + prevConversions.quotes;
  const totalConversions = conversions.newsletters + conversions.quotes;

  const prevPeriodLabel = `${format(prevStartDate, 'MMM d')} – ${format(prevEndDate, 'MMM d')}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Adgang nægtet — admin-rolle kræves.</p>
      </div>
    );
  }

  const dateRangeLabel = `${format(startDate, 'MMM d, yyyy')} – ${format(endDate, 'MMM d, yyyy')}`;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 pt-24 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">SEO Performance Dashboard</h1>
            <p className="text-muted-foreground mt-1">Mål effekten af jeres SEO-indsats over tid</p>
            <p className="text-xs text-muted-foreground mt-0.5">Sammenlignet med: {prevPeriodLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Start date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  {format(startDate, 'MMM d')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">–</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  {format(endDate, 'MMM d')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar mode="single" selected={endDate} onSelect={(d) => d && setEndDate(d)} className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Button size="sm" variant="outline" onClick={fetchAllData} disabled={refreshing}>
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <KPICard title="Organiske sessioner" value={totalOrganicSessions.toLocaleString()} icon={<Globe className="h-4 w-4" />} delta={calcDelta(totalOrganicSessions, prevTotalOrganicSessions)} />
          <KPICard title="Organisk andel" value={`${organicOverview?.organicShare || 0}%`} icon={<TrendingUp className="h-4 w-4" />} delta={calcDelta(organicOverview?.organicShare || 0, prevOrganicOverview?.organicShare || 0)} />
          <KPICard title="Bounce rate" value={`${avgBounceRate}%`} icon={<TrendingDown className="h-4 w-4" />} delta={calcDelta(Number(avgBounceRate), Number(prevAvgBounceRate))} invertColor />
          <KPICard title="Leverandører" value={`${supplierCoverage?.total || 0}`} subtitle={`${supplierCoverage?.verified || 0} verificerede`} icon={<CheckCircle className="h-4 w-4" />} />
          <KPICard title="Konverteringer" value={`${totalConversions}`} subtitle={`${conversions.newsletters} nyhedsbrev · ${conversions.quotes} forespørgsler`} icon={<ArrowUpRight className="h-4 w-4" />} delta={calcDelta(totalConversions, prevTotalConversions)} />
        </div>

        {/* Row 1: Organic Traffic + Conversions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Organisk trafik</CardTitle>
              <CardDescription>Daglige sessioner fra organisk søgning</CardDescription>
            </CardHeader>
            <CardContent>
              {organicTraffic.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={organicTraffic}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(v) => v.substring(4)} fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip labelFormatter={(v) => `Dato: ${v}`} />
                    <Area type="monotone" dataKey="sessions" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} name="Sessioner" />
                    <Area type="monotone" dataKey="activeUsers" stroke="hsl(221, 83%, 53%)" fill="hsl(221, 83%, 53%)" fillOpacity={0.1} name="Brugere" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  {refreshing ? 'Henter data...' : 'Ingen organisk trafik-data for denne periode'}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /> Engagement</CardTitle>
              <CardDescription>Engagement rate og bounce rate over tid</CardDescription>
            </CardHeader>
            <CardContent>
              {organicTraffic.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={organicTraffic}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(v) => v.substring(4)} fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Tooltip formatter={(v: number) => `${(v * 100).toFixed(1)}%`} labelFormatter={(v) => `Dato: ${v}`} />
                    <Legend />
                    <Line type="monotone" dataKey="engagementRate" stroke="hsl(142, 71%, 45%)" name="Engagement" dot={false} />
                    <Line type="monotone" dataKey="bounceRate" stroke="hsl(339, 90%, 51%)" name="Bounce" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  {refreshing ? 'Henter data...' : 'Ingen data'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 2: Top Landing Pages + Top Søgeord */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Top landing pages (organisk)</CardTitle>
              <CardDescription>Hvilke sider Google sender mest trafik til</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-[360px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Side</TableHead>
                      <TableHead className="text-right">Sessioner</TableHead>
                      <TableHead className="text-right">Bounce</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {landingPages.length > 0 ? landingPages.map((page, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs max-w-[200px] truncate" title={page.page}>{page.page}</TableCell>
                        <TableCell className="text-right">{page.sessions}</TableCell>
                        <TableCell className="text-right">{(page.bounceRate * 100).toFixed(0)}%</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Ingen data</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" /> Interne søgninger</CardTitle>
              <CardDescription>{internalSearch?.totalSearches || 0} søgninger · {internalSearch?.zeroResultRate || 0}% uden resultater</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-[360px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Søgeterm</TableHead>
                      <TableHead className="text-right">Antal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(internalSearch?.topQueries || []).map((q, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{q.query}</TableCell>
                        <TableCell className="text-right">{q.count}</TableCell>
                      </TableRow>
                    ))}
                    {(!internalSearch?.topQueries?.length) && (
                      <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Ingen data</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Supplier Coverage + Content Gaps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Leverandør-dækning</CardTitle>
              <CardDescription>Teknologi- og materialefordeling</CardDescription>
            </CardHeader>
            <CardContent>
              {supplierCoverage ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-2xl font-bold">{supplierCoverage.total}</div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-2xl font-bold">{supplierCoverage.verified}</div>
                      <div className="text-xs text-muted-foreground">Verificerede</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="text-2xl font-bold">{supplierCoverage.withWebsite}</div>
                      <div className="text-xs text-muted-foreground">Med website</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Top teknologier</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {supplierCoverage.technologies.map(t => (
                        <Badge key={t.name} variant="secondary" className="text-xs">{t.name} ({t.count})</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Top materialer</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {supplierCoverage.materials.map(m => (
                        <Badge key={m.name} variant="outline" className="text-xs">{m.name} ({m.count})</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[240px] flex items-center justify-center text-muted-foreground">Henter...</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Content gaps</CardTitle>
              <CardDescription>Søgninger uden resultater — potentielle indholdsmuligheder</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-[360px]">
                {(internalSearch?.zeroResultQueries || []).length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Søgning uden resultat</TableHead>
                        <TableHead className="text-right">Antal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {internalSearch!.zeroResultQueries.map((q, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-mono text-xs">{q.query}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="destructive" className="text-xs">{q.count}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="h-[240px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p>Ingen content gaps fundet!</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

const KPICard = ({ title, value, subtitle, icon, delta, invertColor }: { 
  title: string; value: string; subtitle?: string; icon: React.ReactNode;
  delta?: { value: string; positive: boolean } | null;
  invertColor?: boolean;
}) => (
  <Card>
    <CardContent className="pt-4 pb-3 px-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{title}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold">{value}</span>
        {delta && (
          <span className={cn(
            "text-xs font-medium",
            (invertColor ? !delta.positive : delta.positive) ? "text-green-500" : "text-red-500"
          )}>
            {delta.value}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
    </CardContent>
  </Card>
);

export default SEODashboard;
