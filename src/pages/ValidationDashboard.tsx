import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, CheckCircle, XCircle, Activity, RefreshCw, Filter, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

const ValidationDashboard = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [validationData, setValidationData] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [stats, setStats] = useState({
    totalValidations: 0,
    successRate: 0,
    creditsUsed: 0,
    creditsRemaining: 0
  });
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [supplierResults, setSupplierResults] = useState<any[]>([]);
  
  // Filter and sort state
  const [filterMatchStatus, setFilterMatchStatus] = useState<'all' | 'passed' | 'failed'>('all');
  const [filterConfidenceMin, setFilterConfidenceMin] = useState(0);
  const [sortBy, setSortBy] = useState<'name' | 'confidence' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        navigate("/auth");
      } else if (event === "SIGNED_IN") {
        checkAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAdmin) return;

    const interval = setInterval(() => {
      console.log('Auto-refreshing dashboard data...');
      fetchData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isAdmin]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin");

      if (error || !roles || roles.length === 0) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      await fetchData();
    } catch (error) {
      console.error("Auth check error:", error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (showToast = false) => {
    if (showToast) setIsRefreshing(true);
    
    try {
      // Fetch validation results
      const { data: results, error: resultsError } = await supabase
        .from("validation_results")
        .select("*")
        .order("scraped_at", { ascending: false })
        .limit(100);

      if (resultsError) throw resultsError;

      // Fetch validation config
      const { data: configData, error: configError } = await supabase
        .from("validation_config")
        .select("*")
        .maybeSingle();

      if (configError) throw configError;

      setConfig(configData);

      // Process data for charts
      if (results) {
        processValidationData(results, configData);
        setSupplierResults(results);
      }

      setLastRefresh(new Date());
      if (showToast) {
        toast.success('Dashboard refreshed successfully');
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      if (showToast) {
        toast.error('Failed to refresh dashboard');
      }
    } finally {
      if (showToast) setIsRefreshing(false);
    }
  };

  const processValidationData = (results: any[], configData: any) => {
    // Group by day using UTC date (YYYY-MM-DD) for consistent grouping
    const dailyData = results.reduce((acc, result) => {
      const date = new Date(result.scraped_at).toISOString().split('T')[0]; // Use UTC date for consistent grouping
      if (!acc[date]) {
        acc[date] = { date, total: 0, successful: 0, failed: 0 };
      }
      acc[date].total += 1;
      if (result.overall_match) {
        acc[date].successful += 1;
      } else {
        acc[date].failed += 1;
      }
      return acc;
    }, {} as Record<string, any>);

    const chartData = Object.values(dailyData).reverse().slice(-14); // Last 14 days
    setValidationData(chartData);

    // Calculate stats
    const totalValidations = results.length;
    const successful = results.filter(r => r.overall_match).length;
    const successRate = totalValidations > 0 ? (successful / totalValidations) * 100 : 0;
    
    setStats({
      totalValidations,
      successRate: Math.round(successRate),
      creditsUsed: configData?.validations_this_month || 0,
      creditsRemaining: (configData?.monthly_validation_limit || 0) - (configData?.validations_this_month || 0)
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              You need admin privileges to access this page.
            </p>
            <Button onClick={handleSignOut}>Sign Out</Button>
          </div>
        </main>
      </div>
    );
  }

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))'];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Validation Dashboard</h1>
                <p className="text-muted-foreground">
                  Monitor validation activity, success rates, and credit usage
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => fetchData(true)} 
                  variant="outline"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button onClick={() => navigate('/admin/validation')} variant="outline">
                  Go to Validation
                </Button>
                <Button onClick={handleSignOut} variant="outline">
                  Sign Out
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Last updated: {lastRefresh.toLocaleTimeString()} • Auto-refreshes every 30 seconds
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Validations</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalValidations}</p>
                </div>
                <Activity className="h-8 w-8 text-primary" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
                  <p className="text-3xl font-bold text-foreground">{stats.successRate}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Credits Used</p>
                  <p className="text-3xl font-bold text-foreground">{stats.creditsUsed}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Credits Remaining</p>
                  <p className="text-3xl font-bold text-foreground">{stats.creditsRemaining}</p>
                </div>
                <XCircle className={`h-8 w-8 ${stats.creditsRemaining < 10 ? 'text-destructive' : 'text-primary'}`} />
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Daily Validation Counts */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Daily Validation Counts</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={validationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="total" fill="hsl(var(--primary))" name="Total Validations" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Success vs Failed */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Success vs Failed Validations</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={validationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="successful" 
                    stroke="hsl(var(--primary))" 
                    name="Successful"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="failed" 
                    stroke="hsl(var(--destructive))" 
                    name="Failed"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Credit Usage Over Time */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Credit Usage Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={validationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="hsl(var(--primary))" 
                    name="Credits Used"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Overall Success Rate Pie */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Overall Success Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Successful', value: stats.successRate },
                      { name: 'Failed', value: 100 - stats.successRate }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {[0, 1].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Supplier-by-Supplier Breakdown */}
          <Card className="p-6 mt-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Supplier Validation Breakdown</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Detailed validation results for each supplier showing which fields matched or failed
                </p>
              </div>
              <Badge variant="secondary" className="text-sm">
                {supplierResults.filter(r => {
                  if (filterMatchStatus === 'passed') return r.overall_match;
                  if (filterMatchStatus === 'failed') return !r.overall_match;
                  return true;
                }).filter(r => (r.overall_confidence || 0) >= filterConfidenceMin).length} results
              </Badge>
            </div>

            {/* Filters and Sorting */}
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Filters:</span>
              </div>
              
              {/* Match Status Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted-foreground">Status:</label>
                <Select value={filterMatchStatus} onValueChange={(value: any) => setFilterMatchStatus(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="passed">✓ Passed</SelectItem>
                    <SelectItem value="failed">✗ Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Confidence Filter */}
              <div className="flex items-center gap-3 flex-1 min-w-[200px] max-w-xs">
                <label className="text-sm text-muted-foreground whitespace-nowrap">Min Confidence:</label>
                <Slider
                  value={[filterConfidenceMin]}
                  onValueChange={(value) => setFilterConfidenceMin(value[0])}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-foreground min-w-[3rem] text-right">
                  {filterConfidenceMin}%
                </span>
              </div>

              <div className="h-6 w-px bg-border" />

              {/* Sort Controls */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Sort:</span>
              </div>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="confidence">Confidence</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="gap-1"
              >
                {sortOrder === 'asc' ? (
                  <>
                    <ArrowUp className="h-3 w-3" />
                    Asc
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-3 w-3" />
                    Desc
                  </>
                )}
              </Button>

              {/* Reset Filters */}
              {(filterMatchStatus !== 'all' || filterConfidenceMin > 0 || sortBy !== 'date' || sortOrder !== 'desc') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilterMatchStatus('all');
                    setFilterConfidenceMin(0);
                    setSortBy('date');
                    setSortOrder('desc');
                  }}
                  className="ml-auto"
                >
                  Reset
                </Button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Supplier</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Logo</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Technologies</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Materials</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Location</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Overall Score</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Overall Match</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Last Validated</th>
                  </tr>
                </thead>
                <tbody>
                  {supplierResults
                    .filter(result => {
                      // Filter by match status
                      if (filterMatchStatus === 'passed' && !result.overall_match) return false;
                      if (filterMatchStatus === 'failed' && result.overall_match) return false;
                      
                      // Filter by confidence
                      if ((result.overall_confidence || 0) < filterConfidenceMin) return false;
                      
                      return true;
                    })
                    .sort((a, b) => {
                      let comparison = 0;
                      
                      if (sortBy === 'name') {
                        comparison = a.supplier_name.localeCompare(b.supplier_name);
                      } else if (sortBy === 'confidence') {
                        comparison = (a.overall_confidence || 0) - (b.overall_confidence || 0);
                      } else if (sortBy === 'date') {
                        comparison = new Date(a.scraped_at).getTime() - new Date(b.scraped_at).getTime();
                      }
                      
                      return sortOrder === 'asc' ? comparison : -comparison;
                    })
                    .map((result) => (
                    <tr key={result.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground">{result.supplier_name}</div>
                        {result.supplier_website && (
                          <a 
                            href={result.supplier_website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary"
                          >
                            {result.supplier_website}
                          </a>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {result.scraped_content?.logo_url ? (
                          <img 
                            src={result.scraped_content.logo_url} 
                            alt={`${result.supplier_name} logo`}
                            className="h-12 w-auto mx-auto object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={result.scraped_content?.logo_url ? 'hidden' : 'text-muted-foreground text-xs'}>
                          No logo
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2">
                            {result.technologies_match ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <span className={`text-sm font-semibold ${
                              result.technologies_confidence >= 75 ? 'text-green-600' :
                              result.technologies_confidence >= 50 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {result.technologies_confidence || 0}%
                            </span>
                          </div>
                          {!result.technologies_match && (
                            <details className="text-xs text-left w-full">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                View mismatch
                              </summary>
                              <div className="mt-2 p-2 bg-muted rounded text-xs space-y-1">
                                <div>
                                  <span className="font-semibold">Current:</span>
                                  <div className="text-muted-foreground">
                                    {result.technologies_current?.join(', ') || 'None'}
                                  </div>
                                </div>
                                <div>
                                  <span className="font-semibold">Scraped:</span>
                                  <div className="text-muted-foreground">
                                    {result.technologies_scraped?.join(', ') || 'None'}
                                  </div>
                                </div>
                              </div>
                            </details>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2">
                            {result.materials_match ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <span className={`text-sm font-semibold ${
                              result.materials_confidence >= 75 ? 'text-green-600' :
                              result.materials_confidence >= 50 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {result.materials_confidence || 0}%
                            </span>
                          </div>
                          {!result.materials_match && (
                            <details className="text-xs text-left w-full">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                View mismatch
                              </summary>
                              <div className="mt-2 p-2 bg-muted rounded text-xs space-y-1">
                                <div>
                                  <span className="font-semibold">Current:</span>
                                  <div className="text-muted-foreground">
                                    {result.materials_current?.join(', ') || 'None'}
                                  </div>
                                </div>
                                <div>
                                  <span className="font-semibold">Scraped:</span>
                                  <div className="text-muted-foreground">
                                    {result.materials_scraped?.join(', ') || 'None'}
                                  </div>
                                </div>
                              </div>
                            </details>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2">
                            {result.location_match ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <span className={`text-sm font-semibold ${
                              result.location_confidence >= 75 ? 'text-green-600' :
                              result.location_confidence >= 50 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {result.location_confidence || 0}%
                            </span>
                          </div>
                          {!result.location_match && (
                            <details className="text-xs text-left w-full">
                              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                View mismatch
                              </summary>
                              <div className="mt-2 p-2 bg-muted rounded text-xs space-y-1">
                                <div>
                                  <span className="font-semibold">Current:</span>
                                  <div className="text-muted-foreground">
                                    {result.location_current || 'None'}
                                  </div>
                                </div>
                                <div>
                                  <span className="font-semibold">Scraped:</span>
                                  <div className="text-muted-foreground">
                                    {result.location_scraped || 'None'}
                                  </div>
                                </div>
                              </div>
                            </details>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className={`text-2xl font-bold ${
                            result.overall_confidence >= 75 ? 'text-green-600' :
                            result.overall_confidence >= 50 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {result.overall_confidence || 0}%
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {result.overall_match ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {new Date(result.scraped_at).toLocaleDateString()} {new Date(result.scraped_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {supplierResults.filter(r => {
                if (filterMatchStatus === 'passed') return r.overall_match;
                if (filterMatchStatus === 'failed') return !r.overall_match;
                return true;
              }).filter(r => (r.overall_confidence || 0) >= filterConfidenceMin).length === 0 && supplierResults.length > 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No suppliers match the current filters
                </div>
              )}
              {supplierResults.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No validation results yet
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ValidationDashboard;
