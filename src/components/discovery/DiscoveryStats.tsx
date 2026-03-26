import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { TrendingUp, Globe, Target, Zap } from 'lucide-react';

interface DiscoveryRun {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  search_queries: string[] | null;
  suppliers_found: number | null;
  suppliers_new: number | null;
  suppliers_duplicate: number | null;
}

interface DiscoveredSupplier {
  id: string;
  status: string;
  location_country: string | null;
  search_query: string | null;
  created_at: string;
  discovery_confidence: number | null;
}

interface DiscoveryStatsProps {
  runs: DiscoveryRun[];
  suppliers: DiscoveredSupplier[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))', 'hsl(142, 76%, 36%)', 'hsl(0, 84%, 60%)'];

export function DiscoveryStats({ runs, suppliers }: DiscoveryStatsProps) {
  // Calculate trend data - suppliers found per day
  const trendData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });

    return last30Days.map(date => {
      const daySuppliers = suppliers.filter(s => 
        s.created_at.split('T')[0] === date
      );
      return {
        date: new Date(date).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' }),
        found: daySuppliers.length,
        approved: daySuppliers.filter(s => s.status === 'approved').length,
      };
    });
  }, [suppliers]);

  // Status distribution
  const statusData = useMemo(() => {
    const counts = {
      pending: suppliers.filter(s => s.status === 'pending').length,
      auto_approved: suppliers.filter(s => s.status === 'auto_approved').length,
      approved: suppliers.filter(s => s.status === 'approved').length,
      rejected: suppliers.filter(s => s.status === 'rejected').length,
      duplicate: suppliers.filter(s => s.status === 'duplicate').length,
    };
    return [
      { name: 'Pending', value: counts.pending, color: 'hsl(38, 92%, 50%)' },
      { name: 'Auto-Approved', value: counts.auto_approved, color: 'hsl(280, 76%, 50%)' },
      { name: 'Approved', value: counts.approved, color: 'hsl(142, 76%, 36%)' },
      { name: 'Rejected', value: counts.rejected, color: 'hsl(0, 84%, 60%)' },
      { name: 'Duplicate', value: counts.duplicate, color: 'hsl(var(--muted-foreground))' },
    ].filter(d => d.value > 0);
  }, [suppliers]);

  // Auto-approved count for metric card
  const autoApprovedCount = useMemo(() => 
    suppliers.filter(s => s.status === 'auto_approved').length
  , [suppliers]);

  // Country distribution
  const countryData = useMemo(() => {
    const counts: Record<string, number> = {};
    suppliers.forEach(s => {
      const country = s.location_country || 'Unknown';
      counts[country] = (counts[country] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [suppliers]);

  // Top search queries
  const queryData = useMemo(() => {
    const counts: Record<string, number> = {};
    suppliers.forEach(s => {
      if (s.search_query) {
        counts[s.search_query] = (counts[s.search_query] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([query, count]) => ({ query: query.substring(0, 30) + '...', count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [suppliers]);

  // Success rate
  const successRate = useMemo(() => {
    const completed = runs.filter(r => r.status === 'completed').length;
    const total = runs.length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [runs]);

  // Average confidence
  const avgConfidence = useMemo(() => {
    const withConfidence = suppliers.filter(s => s.discovery_confidence !== null);
    if (withConfidence.length === 0) return 0;
    const sum = withConfidence.reduce((acc, s) => acc + (s.discovery_confidence || 0), 0);
    return Math.round((sum / withConfidence.length) * 100);
  }, [suppliers]);

  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{suppliers.length}</p>
                <p className="text-sm text-muted-foreground">Total Discovered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{autoApprovedCount}</p>
                <p className="text-sm text-muted-foreground">Auto-Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{successRate}%</p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{avgConfidence}%</p>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{countryData.length}</p>
                <p className="text-sm text-muted-foreground">Countries</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Discovery Trend (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                    className="text-muted-foreground"
                  />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="found" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary) / 0.2)"
                    name="Found"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="approved" 
                    stroke="hsl(142, 76%, 36%)" 
                    fill="hsl(142, 76%, 36%, 0.2)"
                    name="Approved"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Country distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">By Country</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={{ fontSize: 11 }} 
                    width={80}
                  />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top queries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Search Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {queryData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet</p>
              ) : (
                queryData.map((q, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm truncate flex-1 mr-4">{q.query}</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-2 bg-primary rounded-full" 
                        style={{ width: `${(q.count / queryData[0].count) * 100}px` }}
                      />
                      <span className="text-sm font-medium w-8 text-right">{q.count}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
