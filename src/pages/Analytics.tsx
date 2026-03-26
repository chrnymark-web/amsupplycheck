import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { CalendarIcon, TrendingUp, Users, Filter, Target, Clock, MousePointer, Globe, Percent, X, Search, Map, ArrowRight, AlertCircle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";

export default function Analytics() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [selectedTechnology, setSelectedTechnology] = useState<string>("");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [availableTechnologies, setAvailableTechnologies] = useState<string[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<string[]>([]);

  // Fetch available technologies and materials
  useEffect(() => {
    const fetchFilterOptions = async () => {
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('technologies, materials');

      if (suppliers) {
        const techSet = new Set<string>();
        const matSet = new Set<string>();

        suppliers.forEach((supplier: any) => {
          supplier.technologies?.forEach((tech: string) => techSet.add(tech));
          supplier.materials?.forEach((mat: string) => matSet.add(mat));
        });

        setAvailableTechnologies(Array.from(techSet).sort());
        setAvailableMaterials(Array.from(matSet).sort());
      }
    };

    fetchFilterOptions();
  }, []);

  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['ga4-analytics', dateRange, selectedTechnology, selectedMaterial],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('ga4-analytics', {
        body: {
          dateRange: {
            startDate: format(dateRange.from, 'yyyy-MM-dd'),
            endDate: format(dateRange.to, 'yyyy-MM-dd'),
          },
          filters: {
            technology: selectedTechnology || undefined,
            material: selectedMaterial || undefined,
          },
        },
      });

      if (error) throw error;
      return data;
    },
  });

  // Calculate comparison period (same length as current period, immediately before)
  const comparisonDateRange = {
    from: new Date(dateRange.from.getTime() - (dateRange.to.getTime() - dateRange.from.getTime())),
    to: dateRange.from,
  };

  const { data: comparisonData, isLoading: isLoadingComparison } = useQuery({
    queryKey: ['ga4-analytics-comparison', comparisonDateRange, selectedTechnology, selectedMaterial],
    queryFn: async () => {
      if (!compareEnabled) return null;
      
      const { data, error } = await supabase.functions.invoke('ga4-analytics', {
        body: {
          dateRange: {
            startDate: format(comparisonDateRange.from, 'yyyy-MM-dd'),
            endDate: format(comparisonDateRange.to, 'yyyy-MM-dd'),
          },
          filters: {
            technology: selectedTechnology || undefined,
            material: selectedMaterial || undefined,
          },
        },
      });

      if (error) throw error;
      return data;
    },
    enabled: compareEnabled,
  });

  if (error) {
    toast.error('Failed to load analytics data');
  }

  const totalScrollEvents = analyticsData?.scrollDepth?.reduce(
    (sum: number, item: any) => sum + item.depth25 + item.depth50 + item.depth75 + item.depth90 + item.depth100,
    0
  ) || 0;

  const totalFilterUsage = analyticsData?.filterUsage?.reduce(
    (sum: number, item: any) => sum + item.material + item.technology + item.area + item.search,
    0
  ) || 0;

  const totalSupplierInteractions = analyticsData?.supplierInteractions?.reduce(
    (sum: number, item: any) => sum + item.click + item.view + (item.conversions || 0),
    0
  ) || 0;

  const totalConversions = analyticsData?.conversions?.reduce(
    (sum: number, item: any) => sum + item.conversions,
    0
  ) || 0;

  const totalActiveUsers = analyticsData?.userBehavior?.reduce(
    (sum: number, item: any) => sum + item.totalActiveUsers,
    0
  ) || 0;

  const avgSessionDuration = analyticsData?.userBehavior?.length > 0
    ? (analyticsData.userBehavior.reduce((sum: number, item: any) => sum + item.avgSessionDuration, 0) / analyticsData.userBehavior.length).toFixed(1)
    : '0';

  const avgBounceRate = analyticsData?.userBehavior?.length > 0
    ? (analyticsData.userBehavior.reduce((sum: number, item: any) => sum + item.bounceRate, 0) / analyticsData.userBehavior.length).toFixed(1)
    : '0';

  const avgEngagementRate = analyticsData?.userBehavior?.length > 0
    ? (analyticsData.userBehavior.reduce((sum: number, item: any) => sum + item.engagementRate, 0) / analyticsData.userBehavior.length).toFixed(1)
    : '0';

  // Calculate total supplier views (from supplier interactions)
  const totalSupplierViews = analyticsData?.supplierInteractions?.reduce(
    (sum: number, item: any) => sum + item.view,
    0
  ) || 0;

  // Calculate comparison metrics
  const comparisonTotalConversions = comparisonData?.conversions?.reduce(
    (sum: number, item: any) => sum + item.conversions,
    0
  ) || 0;

  const comparisonTotalSupplierViews = comparisonData?.supplierInteractions?.reduce(
    (sum: number, item: any) => sum + item.view,
    0
  ) || 0;

  // Get conversion rates from funnel data (landing page views to website clicks)
  const conversionRate = analyticsData?.funnelData?.overallConversionRate || 0;
  const comparisonConversionRate = comparisonData?.funnelData?.overallConversionRate || 0;

  const conversionRateChange = compareEnabled && comparisonConversionRate !== 0
    ? ((conversionRate - comparisonConversionRate) / comparisonConversionRate * 100).toFixed(1)
    : null;

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c'];

  // Check if source data is available
  const hasSourceData = useMemo(() => {
    return analyticsData?.funnelData?.bySource && 
           analyticsData.funnelData.bySource.length > 0;
  }, [analyticsData?.funnelData?.bySource]);

  // Auto-reset to "all" if source data is not available
  useEffect(() => {
    if (!hasSourceData && selectedSource !== 'all') {
      setSelectedSource('all');
    }
  }, [hasSourceData, selectedSource]);

  // Compute funnel data based on selected source
  const displayFunnelData = useMemo(() => {
    if (!analyticsData?.funnelData) return null;
    
    if (selectedSource === 'all') {
      return analyticsData.funnelData;
    }
    
    // Find the specific source data
    const sourceData = analyticsData.funnelData.bySource?.find(
      (s: any) => s.source === selectedSource
    );
    
    if (!sourceData) return analyticsData.funnelData; // Fallback to total if source not found
    
    return {
      landingViews: sourceData.landingViews,
      selectItems: sourceData.selectItems,
      searches: sourceData.searches,
      supplierViews: sourceData.supplierViews,
      conversions: sourceData.conversions,
      landingToSelectRate: sourceData.landingToSelectRate,
      selectToSearchRate: sourceData.selectToSearchRate,
      searchToViewRate: sourceData.searchToViewRate,
      viewToConversionRate: sourceData.viewToConversionRate,
      overallConversionRate: sourceData.overallConversionRate,
      dropOff: sourceData.dropOff,
      bySource: analyticsData.funnelData.bySource,
    };
  }, [analyticsData?.funnelData, selectedSource]);


  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Google Analytics 4 data visualization
              </p>
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[300px] justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="p-3 border-b">
                  <div className="text-sm font-medium mb-2">Select Date Range</div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const to = new Date();
                        const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                        setDateRange({ from, to });
                      }}
                    >
                      Last 7 days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const to = new Date();
                        const from = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
                        setDateRange({ from, to });
                      }}
                    >
                      Last 14 days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const to = new Date();
                        const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                        setDateRange({ from, to });
                      }}
                    >
                      Last 30 days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const to = new Date();
                        const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
                        setDateRange({ from, to });
                      }}
                    >
                      Last 90 days
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Or select custom dates below
                  </div>
                </div>
                <Calendar
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from) {
                      setDateRange({ 
                        from: range.from, 
                        to: range.to || range.from 
                      });
                    }
                  }}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Button 
              variant={compareEnabled ? "default" : "outline"}
              onClick={() => setCompareEnabled(!compareEnabled)}
              className="ml-2"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              {compareEnabled ? 'Comparing' : 'Compare Periods'}
            </Button>
          </div>

          {/* Filter Section */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Conversion Rate Filters
              </CardTitle>
              <CardDescription>
                Filter supplier conversion data by technology or material
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">Technology</label>
                  <div className="flex gap-2">
                    <Select value={selectedTechnology} onValueChange={setSelectedTechnology}>
                      <SelectTrigger>
                        <SelectValue placeholder="All technologies" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {availableTechnologies.map((tech) => (
                          <SelectItem key={tech} value={tech}>
                            {tech}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedTechnology && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedTechnology("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">Material</label>
                  <div className="flex gap-2">
                    <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                      <SelectTrigger>
                        <SelectValue placeholder="All materials" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {availableMaterials.map((mat) => (
                          <SelectItem key={mat} value={mat}>
                            {mat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedMaterial && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedMaterial("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {(selectedTechnology || selectedMaterial) && (
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedTechnology("");
                        setSelectedMaterial("");
                      }}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Key Metrics */}
        <TooltipProvider>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="border-2 hover:border-primary/50 transition-colors cursor-help">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Scroll Events</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{isLoading ? '...' : totalScrollEvents.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total scroll depth events</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Total number of scroll depth events tracked across all pages. Measures user engagement by tracking how far users scroll (25%, 50%, 75%, 90%, 100% depths).</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="border-2 hover:border-primary/50 transition-colors cursor-help">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Filter Usage</CardTitle>
                    <Filter className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{isLoading ? '...' : totalFilterUsage.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total search & filter events</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Total number of times users applied filters (technology, material, area) or performed searches to refine supplier results. Indicates active search behavior.</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="border-2 hover:border-primary/50 transition-colors cursor-help">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Supplier Interactions</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{isLoading ? '...' : totalSupplierInteractions.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Clicks, views & conversions</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Combined total of all supplier-related interactions: supplier card clicks, detail page views, and website click conversions.</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="border-2 hover:border-primary/50 transition-colors cursor-help">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{isLoading ? '...' : totalConversions.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Website clicks</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Total number of website clicks (purchase events). This is the primary conversion action where users click through to a supplier's website.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Secondary Metrics */}
        <TooltipProvider>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="border-2 hover:border-primary/50 transition-colors cursor-help">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{isLoading ? '...' : conversionRate.toFixed(1)}%</div>
                    {compareEnabled && conversionRateChange !== null && (
                      <p className={`text-xs font-medium ${parseFloat(conversionRateChange) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {parseFloat(conversionRateChange) >= 0 ? '+' : ''}{conversionRateChange}% vs previous period
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">Landing page view to website clicks</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Percentage of users who viewed the landing page (view_item_list event) and clicked through to a supplier website (purchase event). Key conversion metric showing how effectively the platform drives traffic to suppliers.</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="border-2 hover:border-primary/50 transition-colors cursor-help">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{isLoading ? '...' : totalActiveUsers.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total active users</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Number of unique users who visited the platform during the selected period. Aggregated from GA4 active users data.</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="border-2 hover:border-primary/50 transition-colors cursor-help">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{isLoading ? '...' : avgSessionDuration}s</div>
                    <p className="text-xs text-muted-foreground">Average time per session</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Average time users spend on the platform per session. Calculated from GA4 session engagement data. Higher duration typically indicates better engagement.</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="border-2 hover:border-primary/50 transition-colors cursor-help">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{isLoading ? '...' : avgEngagementRate}%</div>
                    <p className="text-xs text-muted-foreground">User engagement rate</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Percentage of sessions with meaningful user engagement (GA4 engaged sessions). Includes sessions lasting 10+ seconds, having 2+ page views, or conversion events. Higher is better.</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="border-2 hover:border-primary/50 transition-colors cursor-help">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                    <MousePointer className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{isLoading ? '...' : avgBounceRate}%</div>
                    <p className="text-xs text-muted-foreground">Average bounce rate</p>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Percentage of sessions where users left without meaningful interaction. Calculated as (1 - engagement rate). Lower bounce rate indicates better user retention and engagement.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Conversion Funnel Visualization */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Conversion Funnel
          </h2>
          
          {/* Overall Funnel */}
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Journey Funnel</CardTitle>
                  <CardDescription>
                    {selectedSource === 'all' 
                      ? 'Aggregated funnel across all traffic sources' 
                      : `Funnel performance from ${selectedSource} traffic`}
                  </CardDescription>
                </div>
                
                {/* Source Filter Tabs */}
                <TooltipProvider>
                  <Tabs value={selectedSource} onValueChange={setSelectedSource} className="w-auto">
                    <TabsList className="grid grid-cols-4 w-[400px]">
                      <TabsTrigger value="all" className="flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5" />
                        All
                      </TabsTrigger>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <TabsTrigger 
                              value="search" 
                              className="flex items-center gap-1.5"
                              disabled={!hasSourceData}
                            >
                              <Search className="h-3.5 w-3.5" />
                              Search
                            </TabsTrigger>
                          </div>
                        </TooltipTrigger>
                        {!hasSourceData && (
                          <TooltipContent>
                            <p className="max-w-xs">Source segmentation requires custom dimension in GA4</p>
                          </TooltipContent>
                        )}
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <TabsTrigger 
                              value="map" 
                              className="flex items-center gap-1.5"
                              disabled={!hasSourceData}
                            >
                              <Map className="h-3.5 w-3.5" />
                              Map
                            </TabsTrigger>
                          </div>
                        </TooltipTrigger>
                        {!hasSourceData && (
                          <TooltipContent>
                            <p className="max-w-xs">Source segmentation requires custom dimension in GA4</p>
                          </TooltipContent>
                        )}
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <TabsTrigger 
                              value="direct" 
                              className="flex items-center gap-1.5"
                              disabled={!hasSourceData}
                            >
                              <ArrowRight className="h-3.5 w-3.5" />
                              Direct
                            </TabsTrigger>
                          </div>
                        </TooltipTrigger>
                        {!hasSourceData && (
                          <TooltipContent>
                            <p className="max-w-xs">Source segmentation requires custom dimension in GA4</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TabsList>
                  </Tabs>
                </TooltipProvider>
              </div>
              
              {!hasSourceData && (
                <Alert className="mt-4 bg-yellow-500/10 border-yellow-500/50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="ml-2">
                    <p className="font-medium text-sm mb-2">Source segmentation not available</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      To enable source filtering, configure a custom dimension in GA4:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Go to GA4 Admin → Property → Custom definitions</li>
                      <li>Create new dimension: Name "Source", Scope "Event", Parameter name "source"</li>
                      <li>Wait 24-48 hours for data to appear</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">Loading funnel data...</div>
              ) : (
                <div className="space-y-6">
                  {/* Funnel Stages */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Stage 1: Landing Views */}
                    <div className="relative">
                      <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border-2 border-cyan-500 rounded-lg p-6 text-center hover:scale-105 transition-transform">
                        <div className="text-4xl font-bold text-cyan-600">{displayFunnelData?.landingViews || 0}</div>
                        <div className="text-sm font-medium mt-2">Landing Views</div>
                        <div className="text-xs text-muted-foreground mt-1">page_view</div>
                      </div>
                      {/* Arrow */}
                      <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 text-muted-foreground">
                        <div className="flex flex-col items-center">
                          <span className="text-2xl">→</span>
                          <span className="text-xs font-medium text-green-600">
                            {displayFunnelData?.landingToSearchRate || 0}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stage 2: Searches */}
                    <div className="relative">
                      <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-2 border-blue-500 rounded-lg p-6 text-center hover:scale-105 transition-transform">
                        <div className="text-4xl font-bold text-blue-600">{displayFunnelData?.searches || 0}</div>
                        <div className="text-sm font-medium mt-2">Search Views</div>
                        <div className="text-xs text-muted-foreground mt-1">search_page_view</div>
                        <div className="text-xs text-red-500 mt-1">
                          -{displayFunnelData?.dropOff?.landingToSearch || 0} dropped
                        </div>
                      </div>
                      {/* Arrow */}
                      <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 text-muted-foreground">
                        <div className="flex flex-col items-center">
                          <span className="text-2xl">→</span>
                          <span className="text-xs font-medium text-green-600">
                            {displayFunnelData?.searchToViewRate || 0}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stage 4: Supplier Views */}
                    <div className="relative">
                      <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500 rounded-lg p-6 text-center hover:scale-105 transition-transform">
                        <div className="text-4xl font-bold text-green-600">{displayFunnelData?.supplierViews || 0}</div>
                        <div className="text-sm font-medium mt-2">Detail Views</div>
                        <div className="text-xs text-muted-foreground mt-1">supplier_pageview</div>
                        <div className="text-xs text-red-500 mt-1">
                          -{displayFunnelData?.dropOff?.searchToView || 0} dropped
                        </div>
                      </div>
                      {/* Arrow */}
                      <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 text-muted-foreground">
                        <div className="flex flex-col items-center">
                          <span className="text-2xl">→</span>
                          <span className="text-xs font-medium text-green-600">
                            {displayFunnelData?.viewToConversionRate || 0}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stage 5: Conversions */}
                    <div>
                      <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-2 border-yellow-500 rounded-lg p-6 text-center hover:scale-105 transition-transform">
                        <div className="text-4xl font-bold text-yellow-600">{displayFunnelData?.conversions || 0}</div>
                        <div className="text-sm font-medium mt-2">Conversions</div>
                        <div className="text-xs text-muted-foreground mt-1">affiliate_click</div>
                        <div className="text-xs text-red-500 mt-1">
                          -{displayFunnelData?.dropOff?.viewToConversion || 0} dropped
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Overall Conversion Rate */}
                  <div className="flex items-center justify-center gap-4 p-6 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg border-2 border-primary/30">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground mb-1">Overall Conversion Rate</div>
                      <div className="text-4xl font-bold text-primary">
                        {displayFunnelData?.overallConversionRate || 0}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        From landing to conversion
                      </div>
                    </div>
                  </div>

                  {/* Funnel Insights */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-cyan-500/5">
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground mb-1">Landing to Search</div>
                        <div className="text-2xl font-bold text-cyan-600">
                          {displayFunnelData?.landingToSearchRate || 0}%
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          of landing views lead to searches
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-blue-500/5">
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground mb-1">Search to Detail</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {displayFunnelData?.searchToViewRate || 0}%
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          of search views lead to detail views
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-yellow-500/5">
                      <CardContent className="pt-6">
                        <div className="text-sm text-muted-foreground mb-1">View to Conversion</div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {displayFunnelData?.viewToConversionRate || 0}%
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          of views lead to conversions
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Funnel by Source - Volume Comparison */}
          {analyticsData?.funnelData?.bySource && analyticsData.funnelData.bySource.length > 0 && (
            <Card className="border-2 border-purple-500/20">
              <CardHeader>
                <CardTitle>Funnel Volume by Source</CardTitle>
                <CardDescription>
                  Compare absolute numbers across different traffic sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[400px] flex items-center justify-center">Loading source data...</div>
                ) : (
                  <div className="space-y-6">
                    {/* Source comparison chart */}
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.funnelData.bySource}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="source" />
                        <YAxis />
                        <RechartsTooltip 
                          formatter={(value: any, name: string) => {
                            if (name.includes('Rate')) return `${value}%`;
                            return value;
                          }}
                        />
                        <Legend />
                        <Bar dataKey="landingViews" fill="#06b6d4" name="Landing Views" />
                        <Bar dataKey="selectItems" fill="#8b5cf6" name="Select Items" />
                        <Bar dataKey="searches" fill="#3b82f6" name="Searches" />
                        <Bar dataKey="supplierViews" fill="#10b981" name="Supplier Views" />
                        <Bar dataKey="conversions" fill="#f59e0b" name="Conversions" />
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Detailed source breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {analyticsData.funnelData.bySource.map((sourceData: any) => (
                        <Card key={sourceData.source} className="border-2">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg capitalize">{sourceData.source}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Landing Views</span>
                                <span className="font-bold text-cyan-600">{sourceData.landingViews}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Select Items</span>
                                <span className="font-bold text-purple-600">{sourceData.selectItems}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Searches</span>
                                <span className="font-bold text-blue-600">{sourceData.searches}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Supplier Views</span>
                                <span className="font-bold text-green-600">{sourceData.supplierViews}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Conversions</span>
                                <span className="font-bold text-yellow-600">{sourceData.conversions}</span>
                              </div>
                            </div>
                            <div className="pt-3 border-t">
                              <div className="text-center">
                                <div className="text-xs text-muted-foreground mb-1">Overall Rate</div>
                                <div className="text-2xl font-bold text-primary">
                                  {sourceData.overallConversionRate}%
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Landing → Select</span>
                                <span className="font-medium text-cyan-600">{sourceData.landingToSelectRate}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Select → Search</span>
                                <span className="font-medium text-purple-600">{sourceData.selectToSearchRate}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Search → View</span>
                                <span className="font-medium text-blue-600">{sourceData.searchToViewRate}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">View → Conv</span>
                                <span className="font-medium text-green-600">{sourceData.viewToConversionRate}%</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Conversion Rate Comparison by Source */}
          {analyticsData?.funnelData?.bySource && analyticsData.funnelData.bySource.length > 0 && (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle>Conversion Rate Comparison</CardTitle>
                <CardDescription>
                  Side-by-side comparison of conversion efficiency across all sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[400px] flex items-center justify-center">Loading comparison data...</div>
                ) : (
                  <div className="space-y-6">
                    {/* Conversion rates comparison chart */}
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={analyticsData.funnelData.bySource}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="source" />
                        <YAxis 
                          label={{ value: 'Conversion Rate (%)', angle: -90, position: 'insideLeft' }}
                        />
                        <RechartsTooltip 
                          formatter={(value: any) => `${value}%`}
                          contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Legend />
                        <Bar dataKey="landingToSelectRate" fill="#06b6d4" name="Landing → Select" />
                        <Bar dataKey="selectToSearchRate" fill="#8b5cf6" name="Select → Search" />
                        <Bar dataKey="searchToViewRate" fill="#3b82f6" name="Search → View" />
                        <Bar dataKey="viewToConversionRate" fill="#10b981" name="View → Conversion" />
                        <Bar dataKey="overallConversionRate" fill="#f59e0b" name="Overall Rate" />
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Key insights grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {analyticsData.funnelData.bySource.map((sourceData: any) => (
                        <Card key={sourceData.source} className="bg-gradient-to-br from-primary/5 to-purple-500/5 border-2">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg capitalize flex items-center gap-2">
                              {sourceData.source === 'search' && <Search className="h-4 w-4" />}
                              {sourceData.source === 'map' && <Map className="h-4 w-4" />}
                              {sourceData.source === 'direct' && <ArrowRight className="h-4 w-4" />}
                              {sourceData.source}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="text-center p-4 bg-background/50 rounded-lg">
                              <div className="text-xs text-muted-foreground mb-1">Overall Conversion Rate</div>
                              <div className="text-3xl font-bold text-primary">
                                {sourceData.overallConversionRate}%
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between p-2 bg-cyan-500/10 rounded">
                                <span className="text-xs text-muted-foreground">Landing → Select</span>
                                <span className="text-sm font-bold text-cyan-600">{sourceData.landingToSelectRate}%</span>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-purple-500/10 rounded">
                                <span className="text-xs text-muted-foreground">Select → Search</span>
                                <span className="text-sm font-bold text-purple-600">{sourceData.selectToSearchRate}%</span>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-blue-500/10 rounded">
                                <span className="text-xs text-muted-foreground">Search → View</span>
                                <span className="text-sm font-bold text-blue-600">{sourceData.searchToViewRate}%</span>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-green-500/10 rounded">
                                <span className="text-xs text-muted-foreground">View → Conv</span>
                                <span className="text-sm font-bold text-green-600">{sourceData.viewToConversionRate}%</span>
                              </div>
                            </div>

                            <div className="text-xs text-muted-foreground pt-2 border-t">
                              {sourceData.landingViews} landing views → {sourceData.conversions} conversions
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Funnel Trends Over Time */}
          {analyticsData?.funnelData?.dailyTrends && analyticsData.funnelData.dailyTrends.length > 0 && (
            <Card className="border-2 border-green-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Funnel Performance Trends</CardTitle>
                    <CardDescription>
                      {compareEnabled 
                        ? 'Current period vs previous period comparison'
                        : 'Daily conversion rate trends showing how funnel performance changes over time'}
                    </CardDescription>
                  </div>
                  {compareEnabled && comparisonData?.funnelData?.dailyTrends && (
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-primary"></div>
                        <span className="text-muted-foreground">Current Period</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-muted-foreground" style={{ borderTop: '2px dashed' }}></div>
                        <span className="text-muted-foreground">Previous Period</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[400px] flex items-center justify-center">Loading trend data...</div>
                ) : (
                  <div className="space-y-6">
                    {compareEnabled && comparisonData?.funnelData?.dailyTrends ? (
                      /* Comparison View - Overlay both periods */
                      <>
                        <div>
                          <h3 className="text-sm font-semibold mb-4">Conversion Rates Comparison</h3>
                          <ResponsiveContainer width="100%" height={400}>
                            <LineChart>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="dayIndex"
                                label={{ value: 'Days in Period', position: 'insideBottom', offset: -5 }}
                                type="number"
                                domain={[0, Math.max(analyticsData.funnelData.dailyTrends.length, comparisonData.funnelData.dailyTrends.length)]}
                              />
                              <YAxis 
                                label={{ value: 'Conversion Rate (%)', angle: -90, position: 'insideLeft' }}
                              />
                              <RechartsTooltip 
                                formatter={(value: any, name: string) => {
                                  const formattedName = name.replace(' (Previous)', '').replace(' (Current)', '');
                                  return [`${value}%`, formattedName];
                                }}
                                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                              />
                              <Legend />
                              
                              {/* Current Period Lines */}
                              <Line 
                                data={analyticsData.funnelData.dailyTrends.map((d: any, i: number) => ({ ...d, dayIndex: i }))}
                                type="monotone" 
                                dataKey="landingToSelectRate" 
                                stroke="#06b6d4" 
                                strokeWidth={2.5}
                                name="Landing → Select (Current)"
                                dot={false}
                              />
                              <Line 
                                data={analyticsData.funnelData.dailyTrends.map((d: any, i: number) => ({ ...d, dayIndex: i }))}
                                type="monotone" 
                                dataKey="selectToSearchRate" 
                                stroke="#8b5cf6" 
                                strokeWidth={2.5}
                                name="Select → Search (Current)"
                                dot={false}
                              />
                              <Line 
                                data={analyticsData.funnelData.dailyTrends.map((d: any, i: number) => ({ ...d, dayIndex: i }))}
                                type="monotone" 
                                dataKey="searchToViewRate" 
                                stroke="#3b82f6" 
                                strokeWidth={2.5}
                                name="Search → View (Current)"
                                dot={false}
                              />
                              <Line 
                                data={analyticsData.funnelData.dailyTrends.map((d: any, i: number) => ({ ...d, dayIndex: i }))}
                                type="monotone" 
                                dataKey="overallConversionRate" 
                                stroke="#f59e0b" 
                                strokeWidth={3}
                                name="Overall Rate (Current)"
                                dot={false}
                              />
                              
                              {/* Previous Period Lines (Dashed) */}
                              <Line 
                                data={comparisonData.funnelData.dailyTrends.map((d: any, i: number) => ({ ...d, dayIndex: i }))}
                                type="monotone" 
                                dataKey="landingToSelectRate" 
                                stroke="#06b6d4" 
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                name="Landing → Select (Previous)"
                                dot={false}
                                opacity={0.6}
                              />
                              <Line 
                                data={comparisonData.funnelData.dailyTrends.map((d: any, i: number) => ({ ...d, dayIndex: i }))}
                                type="monotone" 
                                dataKey="selectToSearchRate" 
                                stroke="#8b5cf6" 
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                name="Select → Search (Previous)"
                                dot={false}
                                opacity={0.6}
                              />
                              <Line 
                                data={comparisonData.funnelData.dailyTrends.map((d: any, i: number) => ({ ...d, dayIndex: i }))}
                                type="monotone" 
                                dataKey="searchToViewRate" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                name="Search → View (Previous)"
                                dot={false}
                                opacity={0.6}
                              />
                              <Line 
                                data={comparisonData.funnelData.dailyTrends.map((d: any, i: number) => ({ ...d, dayIndex: i }))}
                                type="monotone" 
                                dataKey="overallConversionRate" 
                                stroke="#f59e0b" 
                                strokeWidth={2.5}
                                strokeDasharray="5 5"
                                name="Overall Rate (Previous)"
                                dot={false}
                                opacity={0.6}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Period Comparison Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10">
                            <CardContent className="pt-6">
                              <div className="text-xs text-muted-foreground mb-1">Landing → Select</div>
                              <div className="flex items-baseline gap-2">
                                <div className="text-2xl font-bold text-cyan-600">
                                  {(analyticsData.funnelData.dailyTrends.reduce((sum: number, d: any) => sum + d.landingToSelectRate, 0) / analyticsData.funnelData.dailyTrends.length).toFixed(1)}%
                                </div>
                                {(() => {
                                  const current = analyticsData.funnelData.dailyTrends.reduce((sum: number, d: any) => sum + d.landingToSelectRate, 0) / analyticsData.funnelData.dailyTrends.length;
                                  const previous = comparisonData.funnelData.dailyTrends.reduce((sum: number, d: any) => sum + d.landingToSelectRate, 0) / comparisonData.funnelData.dailyTrends.length;
                                  const change = ((current - previous) / previous * 100).toFixed(1);
                                  return (
                                    <span className={`text-xs font-medium ${parseFloat(change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {parseFloat(change) >= 0 ? '+' : ''}{change}%
                                    </span>
                                  );
                                })()}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                vs {(comparisonData.funnelData.dailyTrends.reduce((sum: number, d: any) => sum + d.landingToSelectRate, 0) / comparisonData.funnelData.dailyTrends.length).toFixed(1)}% prev
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10">
                            <CardContent className="pt-6">
                              <div className="text-xs text-muted-foreground mb-1">Select → Search</div>
                              <div className="flex items-baseline gap-2">
                                <div className="text-2xl font-bold text-purple-600">
                                  {(analyticsData.funnelData.dailyTrends.reduce((sum: number, d: any) => sum + d.selectToSearchRate, 0) / analyticsData.funnelData.dailyTrends.length).toFixed(1)}%
                                </div>
                                {(() => {
                                  const current = analyticsData.funnelData.dailyTrends.reduce((sum: number, d: any) => sum + d.selectToSearchRate, 0) / analyticsData.funnelData.dailyTrends.length;
                                  const previous = comparisonData.funnelData.dailyTrends.reduce((sum: number, d: any) => sum + d.selectToSearchRate, 0) / comparisonData.funnelData.dailyTrends.length;
                                  const change = ((current - previous) / previous * 100).toFixed(1);
                                  return (
                                    <span className={`text-xs font-medium ${parseFloat(change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {parseFloat(change) >= 0 ? '+' : ''}{change}%
                                    </span>
                                  );
                                })()}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                vs {(comparisonData.funnelData.dailyTrends.reduce((sum: number, d: any) => sum + d.selectToSearchRate, 0) / comparisonData.funnelData.dailyTrends.length).toFixed(1)}% prev
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10">
                            <CardContent className="pt-6">
                              <div className="text-xs text-muted-foreground mb-1">Search → View</div>
                              <div className="flex items-baseline gap-2">
                                <div className="text-2xl font-bold text-blue-600">
                                  {(analyticsData.funnelData.dailyTrends.reduce((sum: number, d: any) => sum + d.searchToViewRate, 0) / analyticsData.funnelData.dailyTrends.length).toFixed(1)}%
                                </div>
                                {(() => {
                                  const current = analyticsData.funnelData.dailyTrends.reduce((sum: number, d: any) => sum + d.searchToViewRate, 0) / analyticsData.funnelData.dailyTrends.length;
                                  const previous = comparisonData.funnelData.dailyTrends.reduce((sum: number, d: any) => sum + d.searchToViewRate, 0) / comparisonData.funnelData.dailyTrends.length;
                                  const change = ((current - previous) / previous * 100).toFixed(1);
                                  return (
                                    <span className={`text-xs font-medium ${parseFloat(change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {parseFloat(change) >= 0 ? '+' : ''}{change}%
                                    </span>
                                  );
                                })()}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                vs {(comparisonData.funnelData.dailyTrends.reduce((sum: number, d: any) => sum + d.searchToViewRate, 0) / comparisonData.funnelData.dailyTrends.length).toFixed(1)}% prev
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10">
                            <CardContent className="pt-6">
                              <div className="text-xs text-muted-foreground mb-1">Overall Conversion</div>
                              <div className="flex items-baseline gap-2">
                                <div className="text-2xl font-bold text-yellow-600">
                                  {(analyticsData.funnelData.dailyTrends.reduce((sum: number, d: any) => sum + d.overallConversionRate, 0) / analyticsData.funnelData.dailyTrends.length).toFixed(1)}%
                                </div>
                                {(() => {
                                  const current = analyticsData.funnelData.dailyTrends.reduce((sum: number, d: any) => sum + d.overallConversionRate, 0) / analyticsData.funnelData.dailyTrends.length;
                                  const previous = comparisonData.funnelData.dailyTrends.reduce((sum: number, d: any) => sum + d.overallConversionRate, 0) / comparisonData.funnelData.dailyTrends.length;
                                  const change = ((current - previous) / previous * 100).toFixed(1);
                                  return (
                                    <span className={`text-xs font-medium ${parseFloat(change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {parseFloat(change) >= 0 ? '+' : ''}{change}%
                                    </span>
                                  );
                                })()}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                vs {(comparisonData.funnelData.dailyTrends.reduce((sum: number, d: any) => sum + d.overallConversionRate, 0) / comparisonData.funnelData.dailyTrends.length).toFixed(1)}% prev
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </>
                    ) : (
                      /* Single Period View */
                      <>
                        {/* Conversion Rates Trend Chart */}
                        <div>
                          <h3 className="text-sm font-semibold mb-4">Conversion Rates Over Time</h3>
                          <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={analyticsData.funnelData.dailyTrends}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="date" 
                                tickFormatter={(value) => {
                                  const date = new Date(value.substring(0, 4) + '-' + value.substring(4, 6) + '-' + value.substring(6, 8));
                                  return format(date, 'MMM dd');
                                }}
                              />
                              <YAxis 
                                label={{ value: 'Conversion Rate (%)', angle: -90, position: 'insideLeft' }}
                              />
                              <RechartsTooltip 
                                formatter={(value: any) => `${value}%`}
                                labelFormatter={(value) => {
                                  const date = new Date(value.substring(0, 4) + '-' + value.substring(4, 6) + '-' + value.substring(6, 8));
                                  return format(date, 'MMM dd, yyyy');
                                }}
                                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                              />
                              <Legend />
                              <Line 
                                type="monotone" 
                                dataKey="landingToSelectRate" 
                                stroke="#06b6d4" 
                                strokeWidth={2}
                                name="Landing → Select"
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="selectToSearchRate" 
                                stroke="#8b5cf6" 
                                strokeWidth={2}
                                name="Select → Search"
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="searchToViewRate" 
                                stroke="#3b82f6" 
                                strokeWidth={2}
                                name="Search → View"
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="viewToConversionRate" 
                                stroke="#10b981" 
                                strokeWidth={2}
                                name="View → Conversion"
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="overallConversionRate" 
                                stroke="#f59e0b" 
                                strokeWidth={3}
                                name="Overall Rate"
                                dot={{ r: 4 }}
                                activeDot={{ r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Volume Trends Chart */}
                        <div>
                          <h3 className="text-sm font-semibold mb-4">Funnel Volume Trends</h3>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={analyticsData.funnelData.dailyTrends}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="date" 
                                tickFormatter={(value) => {
                                  const date = new Date(value.substring(0, 4) + '-' + value.substring(4, 6) + '-' + value.substring(6, 8));
                                  return format(date, 'MMM dd');
                                }}
                              />
                              <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
                              <RechartsTooltip 
                                labelFormatter={(value) => {
                                  const date = new Date(value.substring(0, 4) + '-' + value.substring(4, 6) + '-' + value.substring(6, 8));
                                  return format(date, 'MMM dd, yyyy');
                                }}
                                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                              />
                              <Legend />
                              <Line type="monotone" dataKey="landingViews" stroke="#06b6d4" strokeWidth={2} name="Landing Views" />
                              <Line type="monotone" dataKey="selectItems" stroke="#8b5cf6" strokeWidth={2} name="Select Items" />
                              <Line type="monotone" dataKey="searches" stroke="#3b82f6" strokeWidth={2} name="Searches" />
                              <Line type="monotone" dataKey="supplierViews" stroke="#10b981" strokeWidth={2} name="Supplier Views" />
                              <Line type="monotone" dataKey="conversions" stroke="#f59e0b" strokeWidth={2} name="Conversions" />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Trend Insights */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10">
                            <CardContent className="pt-6">
                              <div className="text-xs text-muted-foreground mb-1">Avg Landing → Select</div>
                              <div className="text-2xl font-bold text-cyan-600">
                                {(analyticsData.funnelData.dailyTrends.reduce((sum: number, d: any) => sum + d.landingToSelectRate, 0) / analyticsData.funnelData.dailyTrends.length).toFixed(1)}%
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10">
                            <CardContent className="pt-6">
                              <div className="text-xs text-muted-foreground mb-1">Avg Select → Search</div>
                              <div className="text-2xl font-bold text-purple-600">
                                {(analyticsData.funnelData.dailyTrends.reduce((sum: number, d: any) => sum + d.selectToSearchRate, 0) / analyticsData.funnelData.dailyTrends.length).toFixed(1)}%
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10">
                            <CardContent className="pt-6">
                              <div className="text-xs text-muted-foreground mb-1">Avg Search → View</div>
                              <div className="text-2xl font-bold text-blue-600">
                                {(analyticsData.funnelData.dailyTrends.reduce((sum: number, d: any) => sum + d.searchToViewRate, 0) / analyticsData.funnelData.dailyTrends.length).toFixed(1)}%
                              </div>
                            </CardContent>
                          </Card>
                          
                          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10">
                            <CardContent className="pt-6">
                              <div className="text-xs text-muted-foreground mb-1">Avg View → Conv</div>
                              <div className="text-2xl font-bold text-green-600">
                                {(analyticsData.funnelData.dailyTrends.reduce((sum: number, d: any) => sum + d.viewToConversionRate, 0) / analyticsData.funnelData.dailyTrends.length).toFixed(1)}%
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* User Behavior Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">User Behavior</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sessions & Active Users</CardTitle>
                <CardDescription>Daily user activity trends</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[300px] flex items-center justify-center">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData?.userBehavior}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="totalActiveUsers" stroke="#8884d8" name="Active Users" strokeWidth={2} />
                      <Line type="monotone" dataKey="totalSessions" stroke="#82ca9d" name="Sessions" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>New vs Returning Users</CardTitle>
                <CardDescription>User acquisition and retention</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[300px] flex items-center justify-center">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData?.userBehavior}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="newUsers" fill="#8884d8" name="New Users" />
                      <Bar dataKey="returningUsers" fill="#82ca9d" name="Returning Users" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Conversion Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Conversions (Supplier Website Clicks)</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Website Visits Over Time</CardTitle>
                <CardDescription>Number of clicks to supplier websites (conversions)</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[400px] flex items-center justify-center">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={analyticsData?.conversions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="conversions" 
                        stroke="#10b981" 
                        name="Website Clicks" 
                        strokeWidth={3}
                        dot={{ fill: '#10b981', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Rate Over Time</CardTitle>
                <CardDescription>
                  Percentage of supplier views that lead to website clicks
                  {compareEnabled && (
                    <span className="block mt-1 text-primary">
                      Comparing with {format(comparisonDateRange.from, 'MMM dd')} - {format(comparisonDateRange.to, 'MMM dd, yyyy')}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[400px] flex items-center justify-center">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={analyticsData?.supplierInteractions?.map((item: any, index: number) => {
                      const conversion = analyticsData?.conversions?.[index];
                      const conversionCount = conversion?.conversions || 0;
                      const viewCount = item.view || 0;
                      const rate = viewCount > 0 ? ((conversionCount / viewCount) * 100).toFixed(1) : 0;
                      
                      // Add comparison data if enabled
                      const comparisonItem = compareEnabled && comparisonData?.supplierInteractions?.[index];
                      const comparisonConversion = compareEnabled && comparisonData?.conversions?.[index];
                      const comparisonConversionCount = comparisonConversion?.conversions || 0;
                      const comparisonViewCount = comparisonItem?.view || 0;
                      const comparisonRate = comparisonViewCount > 0 ? ((comparisonConversionCount / comparisonViewCount) * 100).toFixed(1) : 0;
                      
                      return {
                        date: item.date,
                        conversionRate: parseFloat(rate as string),
                        comparisonRate: compareEnabled ? parseFloat(comparisonRate as string) : undefined,
                        views: viewCount,
                        conversions: conversionCount
                      };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip 
                        formatter={(value: any, name: string) => {
                          if (name === 'Conversion Rate' || name === 'Previous Period') return `${value}%`;
                          return value;
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="conversionRate" 
                        stroke="#8b5cf6" 
                        name="Conversion Rate" 
                        strokeWidth={3}
                        dot={{ fill: '#8b5cf6', r: 4 }}
                      />
                      {compareEnabled && (
                        <Line 
                          type="monotone" 
                          dataKey="comparisonRate" 
                          stroke="#94a3b8" 
                          name="Previous Period" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={{ fill: '#94a3b8', r: 3 }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Supplier Performance Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Supplier Performance</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Suppliers by Engagement</CardTitle>
                <CardDescription>Most engaged suppliers by total interactions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[400px] flex items-center justify-center">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={analyticsData?.topSuppliers} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="clicks" fill="#8884d8" name="Clicks" />
                      <Bar dataKey="views" fill="#82ca9d" name="Views" />
                      <Bar dataKey="conversions" fill="#ffc658" name="Conversions" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 10 Suppliers by Conversion Rate</CardTitle>
                <CardDescription>
                  Suppliers with highest view-to-click conversion rates
                  {(selectedTechnology || selectedMaterial) && (
                    <span className="block mt-1 text-primary">
                      Filtered by: {[selectedTechnology, selectedMaterial].filter(Boolean).join(', ')}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[400px] flex items-center justify-center">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={analyticsData?.topConvertingSuppliers} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <RechartsTooltip 
                        formatter={(value: any, name: string) => {
                          if (name === 'Conversion Rate') return `${value}%`;
                          return value;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="views" fill="#82ca9d" name="Views" />
                      <Bar dataKey="conversions" fill="#10b981" name="Conversions" />
                      <Bar dataKey="conversionRate" fill="#8b5cf6" name="Conversion Rate" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Category Performance Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Category Performance</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Technologies by Conversion Rate</CardTitle>
                <CardDescription>
                  Which 3D printing technologies convert best
                  {compareEnabled && (
                    <span className="block mt-1 text-primary">
                      Current vs Previous Period Comparison
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[400px] flex items-center justify-center">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart 
                      data={analyticsData?.technologyConversionStats?.map((tech: any) => {
                        // Find matching comparison data
                        const comparisonTech = compareEnabled 
                          ? comparisonData?.technologyConversionStats?.find((t: any) => t.technology === tech.technology)
                          : null;
                        
                        return {
                          ...tech,
                          previousRate: comparisonTech?.conversionRate || 0
                        };
                      })} 
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="technology" type="category" width={120} />
                      <RechartsTooltip 
                        formatter={(value: any, name: string) => {
                          if (name === 'Conversion Rate' || name === 'Previous Rate') return `${value}%`;
                          return value;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="conversionRate" fill="#8b5cf6" name="Conversion Rate" />
                      {compareEnabled && (
                        <Bar dataKey="previousRate" fill="#94a3b8" name="Previous Rate" />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Materials by Conversion Rate</CardTitle>
                <CardDescription>
                  Which materials convert best
                  {compareEnabled && (
                    <span className="block mt-1 text-primary">
                      Current vs Previous Period Comparison
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[400px] flex items-center justify-center">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart 
                      data={analyticsData?.materialConversionStats?.map((mat: any) => {
                        // Find matching comparison data
                        const comparisonMat = compareEnabled 
                          ? comparisonData?.materialConversionStats?.find((m: any) => m.material === mat.material)
                          : null;
                        
                        return {
                          ...mat,
                          previousRate: comparisonMat?.conversionRate || 0
                        };
                      })} 
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="material" type="category" width={120} />
                      <RechartsTooltip 
                        formatter={(value: any, name: string) => {
                          if (name === 'Conversion Rate' || name === 'Previous Rate') return `${value}%`;
                          return value;
                        }}
                      />
                      <Legend />
                      <Bar dataKey="conversionRate" fill="#8b5cf6" name="Conversion Rate" />
                      {compareEnabled && (
                        <Bar dataKey="previousRate" fill="#94a3b8" name="Previous Rate" />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Supplier Interaction Trends */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Supplier Interactions Over Time</CardTitle>
              <CardDescription>Daily interaction trends</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">Loading...</div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analyticsData?.supplierInteractions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="selectItems" stroke="#8884d8" name="Select Items" strokeWidth={2} />
                    <Line type="monotone" dataKey="supplierViews" stroke="#82ca9d" name="Supplier Views" strokeWidth={2} />
                    <Line type="monotone" dataKey="conversions" stroke="#ffc658" name="Conversions" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Geographic Insights Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Geographic Insights
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Countries</CardTitle>
                <CardDescription>Users by country</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[400px] flex items-center justify-center">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={analyticsData?.geographic?.countries} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="users" fill="#8884d8" name="Active Users" />
                      <Bar dataKey="sessions" fill="#82ca9d" name="Sessions" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 10 Cities</CardTitle>
                <CardDescription>Users by city</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[400px] flex items-center justify-center">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={analyticsData?.geographic?.cities} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="users" fill="#8884d8" name="Active Users" />
                      <Bar dataKey="sessions" fill="#82ca9d" name="Sessions" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Metrics Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Additional Metrics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Scroll Depth Over Time</CardTitle>
                <CardDescription>User scroll behavior patterns</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[300px] flex items-center justify-center">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData?.scrollDepth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="depth25" stroke="#8884d8" name="25%" />
                      <Line type="monotone" dataKey="depth50" stroke="#82ca9d" name="50%" />
                      <Line type="monotone" dataKey="depth75" stroke="#ffc658" name="75%" />
                      <Line type="monotone" dataKey="depth90" stroke="#ff8042" name="90%" />
                      <Line type="monotone" dataKey="depth100" stroke="#a4de6c" name="100%" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Filter Usage Statistics</CardTitle>
                <CardDescription>Search and filter interactions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[300px] flex items-center justify-center">Loading...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData?.filterUsage}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="material" fill="#8884d8" name="Material" />
                      <Bar dataKey="technology" fill="#82ca9d" name="Technology" />
                      <Bar dataKey="area" fill="#ffc658" name="Area" />
                      <Bar dataKey="search" fill="#ff8042" name="Search" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
