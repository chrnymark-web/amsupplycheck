import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/ui/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Search, MessageSquare, Target, TrendingUp, Brain, AlertTriangle, Lightbulb, Download, FileText, FileSpreadsheet, CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface SearchAnalytics {
  totalSearches: number;
  avgResultsCount: number;
  topTechnologies: { name: string; count: number }[];
  topMaterials: { name: string; count: number }[];
  topRegions: { name: string; count: number }[];
  searchTypeDistribution: { name: string; value: number }[];
  dailySearches: { date: string; count: number; avgResults: number }[];
  successRate: number;
  zeroResultRate: number;
  avgQueryLength: number;
  topQueries: { query: string; count: number }[];
  queryPatterns: { pattern: string; count: number }[];
}

interface MatchAnalytics {
  totalMatches: number;
  avgMatchScore: number;
  avgMatchDuration: number;
  selectionRate: number;
  dailyMatches: { date: string; count: number; avgScore: number }[];
  topMatchedSuppliers: { name: string; count: number }[];
}

interface ChatAnalytics {
  totalSessions: number;
  avgMessageCount: number;
  topTopics: { name: string; count: number }[];
  topSuppliersDiscussed: { name: string; count: number }[];
  toolUsageDistribution: { name: string; value: number }[];
  dailyChats: { date: string; sessions: number; messages: number }[];
}

interface GapAnalysis {
  missingTechnologies: string[];
  missingMaterials: string[];
  missingRegions: string[];
  lowResultQueries: { query: string; results: number }[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(221, 83%, 53%)',
  'hsl(262, 83%, 58%)',
  'hsl(339, 90%, 51%)',
  'hsl(25, 95%, 53%)',
  'hsl(142, 71%, 45%)'
];

const AIAnalyticsDashboard = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [searchAnalytics, setSearchAnalytics] = useState<SearchAnalytics | null>(null);
  const [matchAnalytics, setMatchAnalytics] = useState<MatchAnalytics | null>(null);
  const [chatAnalytics, setChatAnalytics] = useState<ChatAnalytics | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<GapAnalysis | null>(null);
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const { toast } = useToast();
  const navigate = useNavigate();
  const dashboardRef = useRef<HTMLDivElement>(null);

  const dateRangeLabel = `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;

  const generateCSV = () => {
    const rows: string[] = [];
    const date = new Date().toLocaleDateString();
    
    // Header
    rows.push('AI Analytics Report');
    rows.push(`Generated: ${date}`);
    rows.push('');
    
    // Summary
    rows.push('=== SUMMARY ===');
    rows.push(`Total Searches,${searchAnalytics?.totalSearches || 0}`);
    rows.push(`Average Results,${searchAnalytics?.avgResultsCount || 0}`);
    rows.push(`Search Success Rate,${searchAnalytics?.successRate || 0}%`);
    rows.push(`Zero Result Rate,${searchAnalytics?.zeroResultRate || 0}%`);
    rows.push(`Total AI Matches,${matchAnalytics?.totalMatches || 0}`);
    rows.push(`Average Match Score,${matchAnalytics?.avgMatchScore || 0}`);
    rows.push(`Selection Rate,${matchAnalytics?.selectionRate || 0}%`);
    rows.push(`Chat Sessions,${chatAnalytics?.totalSessions || 0}`);
    rows.push(`Average Messages per Session,${chatAnalytics?.avgMessageCount || 0}`);
    rows.push('');
    
    // Top Technologies
    rows.push('=== TOP TECHNOLOGIES ===');
    rows.push('Technology,Search Count');
    searchAnalytics?.topTechnologies?.forEach(t => {
      rows.push(`${t.name},${t.count}`);
    });
    rows.push('');
    
    // Top Materials
    rows.push('=== TOP MATERIALS ===');
    rows.push('Material,Search Count');
    searchAnalytics?.topMaterials?.forEach(m => {
      rows.push(`${m.name},${m.count}`);
    });
    rows.push('');
    
    // Top Queries
    rows.push('=== POPULAR QUERIES ===');
    rows.push('Query,Count');
    searchAnalytics?.topQueries?.forEach(q => {
      rows.push(`"${q.query}",${q.count}`);
    });
    rows.push('');
    
    // Top Matched Suppliers
    rows.push('=== TOP MATCHED SUPPLIERS ===');
    rows.push('Supplier,Match Count');
    matchAnalytics?.topMatchedSuppliers?.forEach(s => {
      rows.push(`${s.name},${s.count}`);
    });
    rows.push('');
    
    // Chat Topics
    rows.push('=== CHAT TOPICS ===');
    rows.push('Topic,Count');
    chatAnalytics?.topTopics?.forEach(t => {
      rows.push(`${t.name},${t.count}`);
    });
    rows.push('');
    
    // Gap Analysis
    rows.push('=== CONTENT GAPS ===');
    rows.push('Low Result Queries');
    gapAnalysis?.lowResultQueries?.forEach(q => {
      rows.push(`"${q.query}",${q.results} results`);
    });
    rows.push('');
    rows.push('Missing Technologies');
    gapAnalysis?.missingTechnologies?.forEach(t => {
      rows.push(t);
    });
    rows.push('');
    rows.push('Missing Materials');
    gapAnalysis?.missingMaterials?.forEach(m => {
      rows.push(m);
    });
    
    return rows.join('\n');
  };

  const exportToCSV = () => {
    try {
      const csv = generateCSV();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export Complete",
        description: "CSV report downloaded successfully"
      });
    } catch (error) {
      console.error('CSV export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate CSV report",
        variant: "destructive"
      });
    }
  };

  const exportToPDF = async () => {
    if (!dashboardRef.current) return;
    
    setExporting(true);
    try {
      const element = dashboardRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`ai-analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Export Complete",
        description: "PDF report downloaded successfully"
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF report",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

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
      .maybeSingle();

    if (roleData?.role === "admin") {
      setIsAdmin(true);
      await fetchAllAnalytics();
    }
    setLoading(false);
  };

  const fetchAllAnalytics = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchSearchAnalytics(),
        fetchMatchAnalytics(),
        fetchChatAnalytics(),
        fetchGapAnalysis()
      ]);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const fetchSearchAnalytics = async () => {
    const startISO = startOfDay(startDate).toISOString();
    const endISO = endOfDay(endDate).toISOString();
    
    const { data, error } = await supabase
      .from('search_analytics')
      .select('*')
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Error fetching search analytics:', error);
      return;
    }

    if (!data || data.length === 0) {
      setSearchAnalytics({
        totalSearches: 0,
        avgResultsCount: 0,
        topTechnologies: [],
        topMaterials: [],
        topRegions: [],
        searchTypeDistribution: [],
        dailySearches: [],
        successRate: 0,
        zeroResultRate: 0,
        avgQueryLength: 0,
        topQueries: [],
        queryPatterns: []
      });
      return;
    }

    // Calculate metrics
    const total = data.length;
    const avgResults = data.reduce((sum, s) => sum + (s.results_count || 0), 0) / total;

    // Count technologies
    const techCounts = new Map<string, number>();
    data.forEach(s => {
      (s.extracted_technologies || []).forEach((t: string) => {
        techCounts.set(t, (techCounts.get(t) || 0) + 1);
      });
    });
    const topTechnologies = Array.from(techCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Count materials
    const matCounts = new Map<string, number>();
    data.forEach(s => {
      (s.extracted_materials || []).forEach((m: string) => {
        matCounts.set(m, (matCounts.get(m) || 0) + 1);
      });
    });
    const topMaterials = Array.from(matCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Count regions
    const regionCounts = new Map<string, number>();
    data.forEach(s => {
      (s.extracted_regions || []).forEach((r: string) => {
        regionCounts.set(r, (regionCounts.get(r) || 0) + 1);
      });
    });
    const topRegions = Array.from(regionCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Search type distribution
    const typeCounts = new Map<string, number>();
    data.forEach(s => {
      const type = s.search_type || 'keyword';
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    });
    const searchTypeDistribution = Array.from(typeCounts.entries())
      .map(([name, value]) => ({ name, value }));

    // Daily searches
    const dailyMap = new Map<string, { count: number; totalResults: number }>();
    data.forEach(s => {
      const date = new Date(s.created_at).toLocaleDateString();
      const existing = dailyMap.get(date) || { count: 0, totalResults: 0 };
      dailyMap.set(date, {
        count: existing.count + 1,
        totalResults: existing.totalResults + (s.results_count || 0)
      });
    });
    const dailySearches = Array.from(dailyMap.entries())
      .map(([date, d]) => ({
        date,
        count: d.count,
        avgResults: Math.round(d.totalResults / d.count)
      }))
      .slice(0, 14)
      .reverse();

    // Calculate search success rates
    const successfulSearches = data.filter(s => (s.results_count || 0) >= 1).length;
    const successRate = total > 0 ? Math.round((successfulSearches / total) * 100) : 0;
    const zeroResultSearches = data.filter(s => (s.results_count || 0) === 0).length;
    const zeroResultRate = total > 0 ? Math.round((zeroResultSearches / total) * 100) : 0;

    // Average query length
    const avgQueryLength = total > 0 
      ? Math.round(data.reduce((sum, s) => sum + (s.query?.length || 0), 0) / total)
      : 0;

    // Top queries (normalized and deduplicated)
    const queryCounts = new Map<string, number>();
    data.forEach(s => {
      const normalizedQuery = s.query?.toLowerCase().trim() || '';
      if (normalizedQuery.length > 2) {
        queryCounts.set(normalizedQuery, (queryCounts.get(normalizedQuery) || 0) + 1);
      }
    });
    const topQueries = Array.from(queryCounts.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([query, count]) => ({ query, count }));

    // Query patterns (common terms/phrases)
    const patternCounts = new Map<string, number>();
    data.forEach(s => {
      const words = s.query?.toLowerCase().split(/\s+/) || [];
      words.forEach(word => {
        if (word.length > 3) {
          patternCounts.set(word, (patternCounts.get(word) || 0) + 1);
        }
      });
    });
    const queryPatterns = Array.from(patternCounts.entries())
      .filter(([_, count]) => count >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pattern, count]) => ({ pattern, count }));

    setSearchAnalytics({
      totalSearches: total,
      avgResultsCount: Math.round(avgResults * 10) / 10,
      topTechnologies,
      topMaterials,
      topRegions,
      searchTypeDistribution,
      dailySearches,
      successRate,
      zeroResultRate,
      avgQueryLength,
      topQueries,
      queryPatterns
    });
  };

  const fetchMatchAnalytics = async () => {
    const startISO = startOfDay(startDate).toISOString();
    const endISO = endOfDay(endDate).toISOString();
    
    const { data, error } = await supabase
      .from('ai_match_analytics')
      .select('*')
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Error fetching match analytics:', error);
      return;
    }

    if (!data || data.length === 0) {
      setMatchAnalytics({
        totalMatches: 0,
        avgMatchScore: 0,
        avgMatchDuration: 0,
        selectionRate: 0,
        dailyMatches: [],
        topMatchedSuppliers: []
      });
      return;
    }

    const total = data.length;
    const avgScore = data.reduce((sum, m) => sum + (m.match_score_avg || 0), 0) / total;
    const avgDuration = data.reduce((sum, m) => sum + (m.match_duration_ms || 0), 0) / total;
    const selections = data.filter(m => m.selected_supplier_id).length;

    // Count matched suppliers
    const supplierCounts = new Map<string, number>();
    data.forEach(m => {
      const suppliers = m.matched_suppliers as any[] || [];
      suppliers.forEach((s: any) => {
        const name = s.supplier_name || s.name || 'Unknown';
        supplierCounts.set(name, (supplierCounts.get(name) || 0) + 1);
      });
    });
    const topMatchedSuppliers = Array.from(supplierCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Daily matches
    const dailyMap = new Map<string, { count: number; totalScore: number }>();
    data.forEach(m => {
      const date = new Date(m.created_at).toLocaleDateString();
      const existing = dailyMap.get(date) || { count: 0, totalScore: 0 };
      dailyMap.set(date, {
        count: existing.count + 1,
        totalScore: existing.totalScore + (m.match_score_avg || 0)
      });
    });
    const dailyMatches = Array.from(dailyMap.entries())
      .map(([date, d]) => ({
        date,
        count: d.count,
        avgScore: Math.round((d.totalScore / d.count) * 100) / 100
      }))
      .slice(0, 14)
      .reverse();

    setMatchAnalytics({
      totalMatches: total,
      avgMatchScore: Math.round(avgScore * 100) / 100,
      avgMatchDuration: Math.round(avgDuration),
      selectionRate: Math.round((selections / total) * 100),
      dailyMatches,
      topMatchedSuppliers
    });
  };

  const fetchChatAnalytics = async () => {
    const startISO = startOfDay(startDate).toISOString();
    const endISO = endOfDay(endDate).toISOString();
    
    const { data, error } = await supabase
      .from('chat_analytics')
      .select('*')
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Error fetching chat analytics:', error);
      return;
    }

    if (!data || data.length === 0) {
      setChatAnalytics({
        totalSessions: 0,
        avgMessageCount: 0,
        topTopics: [],
        topSuppliersDiscussed: [],
        toolUsageDistribution: [],
        dailyChats: []
      });
      return;
    }

    const total = data.length;
    const avgMessages = data.reduce((sum, c) => sum + (c.message_count || 0), 0) / total;

    // Count topics
    const topicCounts = new Map<string, number>();
    data.forEach(c => {
      (c.topics_discussed || []).forEach((t: string) => {
        topicCounts.set(t, (topicCounts.get(t) || 0) + 1);
      });
    });
    const topTopics = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Count suppliers discussed
    const supplierCounts = new Map<string, number>();
    data.forEach(c => {
      (c.suppliers_mentioned || []).forEach((s: string) => {
        supplierCounts.set(s, (supplierCounts.get(s) || 0) + 1);
      });
    });
    const topSuppliersDiscussed = Array.from(supplierCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Tool usage
    const toolCounts = new Map<string, number>();
    data.forEach(c => {
      (c.tools_used || []).forEach((t: string) => {
        toolCounts.set(t, (toolCounts.get(t) || 0) + 1);
      });
    });
    const toolUsageDistribution = Array.from(toolCounts.entries())
      .map(([name, value]) => ({ name, value }));

    // Daily chats
    const dailyMap = new Map<string, { sessions: number; messages: number }>();
    data.forEach(c => {
      const date = new Date(c.created_at).toLocaleDateString();
      const existing = dailyMap.get(date) || { sessions: 0, messages: 0 };
      dailyMap.set(date, {
        sessions: existing.sessions + 1,
        messages: existing.messages + (c.message_count || 0)
      });
    });
    const dailyChats = Array.from(dailyMap.entries())
      .map(([date, d]) => ({
        date,
        sessions: d.sessions,
        messages: d.messages
      }))
      .slice(0, 14)
      .reverse();

    setChatAnalytics({
      totalSessions: total,
      avgMessageCount: Math.round(avgMessages * 10) / 10,
      topTopics,
      topSuppliersDiscussed,
      toolUsageDistribution,
      dailyChats
    });
  };

  const fetchGapAnalysis = async () => {
    const startISO = startOfDay(startDate).toISOString();
    const endISO = endOfDay(endDate).toISOString();
    
    // Fetch low-result searches
    const { data: searchData } = await supabase
      .from('search_analytics')
      .select('query, results_count, extracted_technologies, extracted_materials, extracted_regions')
      .gte('created_at', startISO)
      .lte('created_at', endISO)
      .lt('results_count', 3)
      .order('created_at', { ascending: false })
      .limit(100);

    // Get existing supplier technologies and materials
    const { data: supplierData } = await supabase
      .from('suppliers')
      .select('technologies, materials, location_country');

    const existingTech = new Set<string>();
    const existingMat = new Set<string>();
    const existingRegions = new Set<string>();

    supplierData?.forEach(s => {
      (s.technologies || []).forEach((t: string) => existingTech.add(t.toLowerCase()));
      (s.materials || []).forEach((m: string) => existingMat.add(m.toLowerCase()));
      if (s.location_country) existingRegions.add(s.location_country.toLowerCase());
    });

    // Find missing items from searches
    const missingTechSet = new Set<string>();
    const missingMatSet = new Set<string>();
    const missingRegionSet = new Set<string>();

    searchData?.forEach(s => {
      (s.extracted_technologies || []).forEach((t: string) => {
        if (!existingTech.has(t.toLowerCase())) missingTechSet.add(t);
      });
      (s.extracted_materials || []).forEach((m: string) => {
        if (!existingMat.has(m.toLowerCase())) missingMatSet.add(m);
      });
      (s.extracted_regions || []).forEach((r: string) => {
        if (!existingRegions.has(r.toLowerCase())) missingRegionSet.add(r);
      });
    });

    const lowResultQueries = (searchData || [])
      .filter(s => s.results_count !== null && s.results_count < 3)
      .slice(0, 10)
      .map(s => ({ query: s.query, results: s.results_count || 0 }));

    setGapAnalysis({
      missingTechnologies: Array.from(missingTechSet).slice(0, 10),
      missingMaterials: Array.from(missingMatSet).slice(0, 10),
      missingRegions: Array.from(missingRegionSet).slice(0, 10),
      lowResultQueries
    });
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-6 space-y-6" ref={dashboardRef}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              AI Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Insights from AI-powered search, matching, and chat interactions
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date Range Pickers */}
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setStartDate(date)}
                    disabled={(date) => date > endDate || date > new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground text-sm">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, 'MMM d, yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => date && setEndDate(date)}
                    disabled={(date) => date < startDate || date > new Date()}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Quick Date Range Buttons */}
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => { setStartDate(subDays(new Date(), 7)); setEndDate(new Date()); }}
              >
                7d
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => { setStartDate(subDays(new Date(), 30)); setEndDate(new Date()); }}
              >
                30d
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => { setStartDate(subDays(new Date(), 90)); setEndDate(new Date()); }}
              >
                90d
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={exporting}>
                  <Download className={`mr-2 h-4 w-4 ${exporting ? 'animate-pulse' : ''}`} />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToCSV}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={fetchAllAnalytics} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                Total Searches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{searchAnalytics?.totalSearches || 0}</div>
              <p className="text-xs text-muted-foreground">
                Avg {searchAnalytics?.avgResultsCount || 0} results
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Search Success
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{searchAnalytics?.successRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                {searchAnalytics?.zeroResultRate || 0}% zero results
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                AI Matches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{matchAnalytics?.totalMatches || 0}</div>
              <p className="text-xs text-muted-foreground">
                {matchAnalytics?.selectionRate || 0}% selection rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                Chat Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{chatAnalytics?.totalSessions || 0}</div>
              <p className="text-xs text-muted-foreground">
                Avg {chatAnalytics?.avgMessageCount || 0} messages
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Content Gaps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{gapAnalysis?.lowResultQueries?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Low-result searches
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search Insights Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Search Insights
            </CardTitle>
            <CardDescription>Query patterns and search success analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Success Metrics */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Success Metrics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Success Rate</span>
                    <span className="font-bold text-green-600">{searchAnalytics?.successRate || 0}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${searchAnalytics?.successRate || 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Zero Results</span>
                    <span className="font-bold text-orange-500">{searchAnalytics?.zeroResultRate || 0}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: `${searchAnalytics?.zeroResultRate || 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm">Avg Query Length</span>
                    <span className="font-medium">{searchAnalytics?.avgQueryLength || 0} chars</span>
                  </div>
                </div>
              </div>

              {/* Top Queries */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Popular Queries</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {searchAnalytics?.topQueries?.length ? (
                    searchAnalytics.topQueries.map((q, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="truncate max-w-[180px]" title={q.query}>"{q.query}"</span>
                        <span className="text-muted-foreground shrink-0 ml-2">×{q.count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No repeat queries yet</p>
                  )}
                </div>
              </div>

              {/* Query Patterns */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-muted-foreground">Common Terms</h4>
                <div className="flex flex-wrap gap-2">
                  {searchAnalytics?.queryPatterns?.length ? (
                    searchAnalytics.queryPatterns.map((p, i) => (
                      <span 
                        key={i} 
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                      >
                        {p.pattern}
                        <span className="ml-1 text-muted-foreground">({p.count})</span>
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Not enough data for patterns</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Tabs defaultValue="search" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search Analytics
            </TabsTrigger>
            <TabsTrigger value="match" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Match Analytics
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat Analytics
            </TabsTrigger>
            <TabsTrigger value="gaps" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Gap Analysis
            </TabsTrigger>
          </TabsList>

          {/* Search Analytics Tab */}
          <TabsContent value="search" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Search Volume</CardTitle>
                  <CardDescription>Number of searches per day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={searchAnalytics?.dailySearches || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                        name="Searches"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Search Type Distribution</CardTitle>
                  <CardDescription>Keyword vs AI vs Project Match</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={searchAnalytics?.searchTypeDistribution || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {searchAnalytics?.searchTypeDistribution?.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Searched Technologies</CardTitle>
                  <CardDescription>Most frequently searched technologies</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={searchAnalytics?.topTechnologies || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Searched Materials</CardTitle>
                  <CardDescription>Most frequently searched materials</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={searchAnalytics?.topMaterials || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(221, 83%, 53%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Match Analytics Tab */}
          <TabsContent value="match" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Match Activity</CardTitle>
                  <CardDescription>AI project matches per day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={matchAnalytics?.dailyMatches || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="hsl(142, 71%, 45%)" 
                        fill="hsl(142, 71%, 45%)"
                        fillOpacity={0.3}
                        name="Matches"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Average Match Score Trend</CardTitle>
                  <CardDescription>AI match quality over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={matchAnalytics?.dailyMatches || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="avgScore" 
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        name="Avg Score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Top Matched Suppliers</CardTitle>
                  <CardDescription>Suppliers most frequently matched to projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={matchAnalytics?.topMatchedSuppliers || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(262, 83%, 58%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Chat Analytics Tab */}
          <TabsContent value="chat" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Chat Activity</CardTitle>
                  <CardDescription>Chat sessions and messages per day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chatAnalytics?.dailyChats || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="sessions" 
                        stroke="hsl(221, 83%, 53%)" 
                        fill="hsl(221, 83%, 53%)"
                        fillOpacity={0.3}
                        name="Sessions"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="messages" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))"
                        fillOpacity={0.2}
                        name="Messages"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Tool Usage</CardTitle>
                  <CardDescription>Which AI capabilities are used most</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chatAnalytics?.toolUsageDistribution || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => entry.name}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chatAnalytics?.toolUsageDistribution?.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Discussed Topics</CardTitle>
                  <CardDescription>Most common conversation topics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chatAnalytics?.topTopics || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(339, 90%, 51%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Suppliers Discussed</CardTitle>
                  <CardDescription>Most mentioned suppliers in chat</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chatAnalytics?.topSuppliersDiscussed || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(25, 95%, 53%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Gap Analysis Tab */}
          <TabsContent value="gaps" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Low-Result Searches
                  </CardTitle>
                  <CardDescription>Searches with fewer than 3 results</CardDescription>
                </CardHeader>
                <CardContent>
                  {gapAnalysis?.lowResultQueries?.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No low-result searches found</p>
                  ) : (
                    <div className="space-y-2">
                      {gapAnalysis?.lowResultQueries?.map((q, i) => (
                        <div key={i} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                          <span className="text-sm truncate">{q.query}</span>
                          <span className="text-xs text-muted-foreground">{q.results} results</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Missing Technologies</CardTitle>
                  <CardDescription>Technologies users search for but we don't have</CardDescription>
                </CardHeader>
                <CardContent>
                  {gapAnalysis?.missingTechnologies?.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No missing technologies identified</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {gapAnalysis?.missingTechnologies?.map((t, i) => (
                        <span key={i} className="px-2 py-1 bg-red-500/10 text-red-600 rounded text-sm">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Missing Materials</CardTitle>
                  <CardDescription>Materials users search for but we don't have</CardDescription>
                </CardHeader>
                <CardContent>
                  {gapAnalysis?.missingMaterials?.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No missing materials identified</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {gapAnalysis?.missingMaterials?.map((m, i) => (
                        <span key={i} className="px-2 py-1 bg-orange-500/10 text-orange-600 rounded text-sm">
                          {m}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Missing Regions</CardTitle>
                  <CardDescription>Regions users search for but we don't cover</CardDescription>
                </CardHeader>
                <CardContent>
                  {gapAnalysis?.missingRegions?.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No missing regions identified</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {gapAnalysis?.missingRegions?.map((r, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-500/10 text-blue-600 rounded text-sm">
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIAnalyticsDashboard;