import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/ui/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity, Zap, Database, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface PerformanceMetrics {
  totalValidations: number;
  puppeteerSuccessRate: number;
  avgScrapingTime: number;
  cacheHitRate: number;
  avgPagesScraped: number;
  dailyMetrics: {
    date: string;
    validations: number;
    puppeteerSuccess: number;
    avgTime: number;
    cacheHits: number;
  }[];
  methodDistribution: {
    name: string;
    value: number;
  }[];
}

const MonitoringDashboard = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .single();

    if (roleData?.role === "admin") {
      setIsAdmin(true);
      await fetchMetrics();
    }
    setLoading(false);
  };

  const fetchMetrics = async () => {
    setRefreshing(true);
    try {
      // Fetch all validation results with performance data
      const { data: validations, error } = await supabase
        .from('validation_results')
        .select('*')
        .order('scraped_at', { ascending: false });

      if (error) throw error;

      if (!validations || validations.length === 0) {
        setMetrics({
          totalValidations: 0,
          puppeteerSuccessRate: 0,
          avgScrapingTime: 0,
          cacheHitRate: 0,
          avgPagesScraped: 0,
          dailyMetrics: [],
          methodDistribution: []
        });
        return;
      }

      // Calculate metrics
      const total = validations.length;
      const puppeteerSuccesses = validations.filter(v => v.puppeteer_success).length;
      const cacheHits = validations.filter(v => v.cache_hit).length;
      const avgTime = validations.reduce((sum, v) => sum + (v.scraping_time_ms || 0), 0) / total;
      const avgPages = validations.reduce((sum, v) => sum + (v.pages_scraped || 0), 0) / total;

      // Group by date for daily metrics
      const dailyMap = new Map<string, {
        validations: number;
        puppeteerSuccess: number;
        totalTime: number;
        cacheHits: number;
      }>();

      validations.forEach(v => {
        const date = new Date(v.scraped_at).toLocaleDateString();
        const existing = dailyMap.get(date) || {
          validations: 0,
          puppeteerSuccess: 0,
          totalTime: 0,
          cacheHits: 0
        };

        dailyMap.set(date, {
          validations: existing.validations + 1,
          puppeteerSuccess: existing.puppeteerSuccess + (v.puppeteer_success ? 1 : 0),
          totalTime: existing.totalTime + (v.scraping_time_ms || 0),
          cacheHits: existing.cacheHits + (v.cache_hit ? 1 : 0)
        });
      });

      const dailyMetrics = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          validations: data.validations,
          puppeteerSuccess: Math.round((data.puppeteerSuccess / data.validations) * 100),
          avgTime: Math.round(data.totalTime / data.validations),
          cacheHits: Math.round((data.cacheHits / data.validations) * 100)
        }))
        .slice(0, 14) // Last 14 days
        .reverse();

      // Method distribution
      const puppeteerCount = validations.filter(v => v.puppeteer_success).length;
      const fallbackCount = total - puppeteerCount;

      setMetrics({
        totalValidations: total,
        puppeteerSuccessRate: Math.round((puppeteerSuccesses / total) * 100),
        avgScrapingTime: Math.round(avgTime),
        cacheHitRate: Math.round((cacheHits / total) * 100),
        avgPagesScraped: Math.round(avgPages * 10) / 10,
        dailyMetrics,
        methodDistribution: [
          { name: 'Puppeteer', value: puppeteerCount },
          { name: 'Fallback', value: fallbackCount }
        ]
      });
    } catch (error: any) {
      console.error('Error fetching metrics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch monitoring metrics",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        navigate('/auth');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>You need admin privileges to view this page.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Monitoring Dashboard</h1>
            <p className="text-muted-foreground mt-1">Puppeteer performance metrics and scraping analytics</p>
          </div>
          <Button onClick={fetchMetrics} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Total Validations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalValidations || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                Puppeteer Success
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.puppeteerSuccessRate || 0}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Avg Scraping Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.avgScrapingTime || 0}ms</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4 text-purple-500" />
                Cache Hit Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.cacheHitRate || 0}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-500" />
                Avg Pages/Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.avgPagesScraped || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Validations Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Validation Trend</CardTitle>
              <CardDescription>Number of validations per day (last 14 days)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics?.dailyMetrics || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="validations" fill="hsl(var(--primary))" name="Validations" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Puppeteer Success Rate */}
          <Card>
            <CardHeader>
              <CardTitle>Puppeteer Success Rate Over Time</CardTitle>
              <CardDescription>Daily Puppeteer success percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics?.dailyMetrics || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="puppeteerSuccess" 
                    stroke="hsl(var(--primary))" 
                    name="Success Rate (%)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Average Scraping Time */}
          <Card>
            <CardHeader>
              <CardTitle>Average Scraping Time</CardTitle>
              <CardDescription>Daily average scraping performance (ms)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics?.dailyMetrics || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="avgTime" 
                    stroke="#3b82f6" 
                    name="Avg Time (ms)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Scraping Method Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Scraping Method Distribution</CardTitle>
              <CardDescription>Puppeteer vs Fallback usage</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={metrics?.methodDistribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {metrics?.methodDistribution?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cache Hit Rate Over Time */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Cache Hit Rate Trend</CardTitle>
              <CardDescription>Percentage of validations using cached data (last 14 days)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics?.dailyMetrics || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="cacheHits" 
                    stroke="#a855f7" 
                    name="Cache Hit Rate (%)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboard;
