import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Building, Trash2, User, Download, TrendingUp, Calendar, Users, Send } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, subDays, startOfDay, isWithinInterval, parseISO } from "date-fns";

interface SupplierApplication {
  id: string;
  name: string;
  email: string;
  company: string;
  created_at: string;
}

interface NewsletterSignup {
  id: string;
  email: string;
  created_at: string;
}

interface QuoteRequest {
  id: string;
  name: string;
  email: string;
  project_description: string | null;
  technology_preference: string | null;
  material_preference: string | null;
  volume: string | null;
  supplier_context: string | null;
  source_page: string | null;
  status: string;
  created_at: string;
}

interface ChartDataPoint {
  date: string;
  newsletter: number;
  applications: number;
}

const Signups = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [supplierApplications, setSupplierApplications] = useState<SupplierApplication[]>([]);
  const [newsletterSignups, setNewsletterSignups] = useState<NewsletterSignup[]>([]);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    checkAuth();
    fetchSignups();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/");
    }
  };

  const fetchSignups = async () => {
    setLoading(true);
    
    try {
      const [applicationsResult, signupsResult, quotesResult] = await Promise.all([
        supabase
          .from("supplier_applications")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("newsletter_signups")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("quote_requests" as any)
          .select("*")
          .order("created_at", { ascending: false })
      ]);

      if (applicationsResult.error) throw applicationsResult.error;
      if (signupsResult.error) throw signupsResult.error;

      setSupplierApplications(applicationsResult.data || []);
      setNewsletterSignups(signupsResult.data || []);
      setQuoteRequests((quotesResult.data as any[]) || []);
    } catch (error) {
      console.error("Error fetching signups:", error);
      toast({
        title: "Error",
        description: "Failed to load signups. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = subDays(now, 7);
    const monthAgo = subDays(now, 30);

    const newsletterThisWeek = newsletterSignups.filter(s => 
      isWithinInterval(parseISO(s.created_at), { start: weekAgo, end: now })
    ).length;

    const newsletterThisMonth = newsletterSignups.filter(s => 
      isWithinInterval(parseISO(s.created_at), { start: monthAgo, end: now })
    ).length;

    const applicationsThisWeek = supplierApplications.filter(a => 
      isWithinInterval(parseISO(a.created_at), { start: weekAgo, end: now })
    ).length;

    const applicationsThisMonth = supplierApplications.filter(a => 
      isWithinInterval(parseISO(a.created_at), { start: monthAgo, end: now })
    ).length;

    const latestSignup = newsletterSignups[0]?.created_at;
    const latestApplication = supplierApplications[0]?.created_at;

    return {
      totalNewsletter: newsletterSignups.length,
      totalApplications: supplierApplications.length,
      newsletterThisWeek,
      newsletterThisMonth,
      applicationsThisWeek,
      applicationsThisMonth,
      latestSignup,
      latestApplication,
    };
  }, [newsletterSignups, supplierApplications]);

  // Generate chart data for last 30 days
  const chartData = useMemo(() => {
    const data: ChartDataPoint[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = startOfDay(subDays(now, i));
      const nextDate = startOfDay(subDays(now, i - 1));
      
      const newsletterCount = newsletterSignups.filter(s => {
        const signupDate = parseISO(s.created_at);
        return signupDate >= date && signupDate < nextDate;
      }).length;

      const applicationCount = supplierApplications.filter(a => {
        const appDate = parseISO(a.created_at);
        return appDate >= date && appDate < nextDate;
      }).length;

      data.push({
        date: format(date, "MMM d"),
        newsletter: newsletterCount,
        applications: applicationCount,
      });
    }

    return data;
  }, [newsletterSignups, supplierApplications]);

  // Filter data based on search
  const filteredNewsletterSignups = useMemo(() => {
    if (!searchTerm) return newsletterSignups;
    return newsletterSignups.filter(s => 
      s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [newsletterSignups, searchTerm]);

  const filteredApplications = useMemo(() => {
    if (!searchTerm) return supplierApplications;
    return supplierApplications.filter(a => 
      a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.company.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [supplierApplications, searchTerm]);

  const filteredQuotes = useMemo(() => {
    if (!searchTerm) return quoteRequests;
    const s = searchTerm.toLowerCase();
    return quoteRequests.filter(q =>
      q.email.toLowerCase().includes(s) ||
      q.name.toLowerCase().includes(s) ||
      (q.supplier_context || '').toLowerCase().includes(s)
    );
  }, [quoteRequests, searchTerm]);

  // Export functions
  const exportNewsletterCSV = () => {
    const headers = ["Email", "Subscribed Date"];
    const rows = newsletterSignups.map(s => [
      s.email,
      formatDate(s.created_at)
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    downloadCSV(csv, "newsletter-subscribers.csv");
    
    toast({
      title: "Exported",
      description: `${newsletterSignups.length} newsletter subscribers exported.`,
    });
  };

  const exportApplicationsCSV = () => {
    const headers = ["Name", "Email", "Company", "Applied Date"];
    const rows = supplierApplications.map(a => [
      `"${a.name}"`,
      a.email,
      `"${a.company}"`,
      formatDate(a.created_at)
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    downloadCSV(csv, "supplier-applications.csv");
    
    toast({
      title: "Exported",
      description: `${supplierApplications.length} supplier applications exported.`,
    });
  };

  const exportQuotesCSV = () => {
    const headers = ["Name", "Email", "Technology", "Material", "Volume", "Supplier Context", "Source Page", "Status", "Date"];
    const rows = quoteRequests.map(q => [
      `"${q.name}"`, q.email, q.technology_preference || '', q.material_preference || '',
      q.volume || '', `"${q.supplier_context || ''}"`, q.source_page || '', q.status, formatDate(q.created_at)
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    downloadCSV(csv, "quote-requests.csv");
    toast({ title: "Exported", description: `${quoteRequests.length} quote requests exported.` });
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteApplication = async (id: string) => {
    try {
      const { error } = await supabase
        .from("supplier_applications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Application deleted successfully.",
      });
      
      fetchSignups();
    } catch (error) {
      console.error("Error deleting application:", error);
      toast({
        title: "Error",
        description: "Failed to delete application.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSignup = async (id: string) => {
    try {
      const { error } = await supabase
        .from("newsletter_signups")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Signup deleted successfully.",
      });
      
      fetchSignups();
    } catch (error) {
      console.error("Error deleting signup:", error);
      toast({
        title: "Error",
        description: "Failed to delete signup.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">Signups Dashboard</h1>
          <p className="text-muted-foreground">
            Analytics and management for signups and applications
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Newsletter Subscribers</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalNewsletter}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{stats.newsletterThisWeek}</span> this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Supplier Applications</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApplications}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{stats.applicationsThisWeek}</span> this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.newsletterThisMonth + stats.applicationsThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                {stats.newsletterThisMonth} newsletter, {stats.applicationsThisMonth} applications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Latest Signup</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.latestSignup ? formatRelativeDate(stats.latestSignup) : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                Newsletter subscriber
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Trend Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Signup Trends (Last 30 Days)
            </CardTitle>
            <CardDescription>
              Daily signups for newsletter and supplier applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar 
                    dataKey="newsletter" 
                    name="Newsletter" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="applications" 
                    name="Applications" 
                    fill="hsl(var(--secondary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Search and Export */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by email, name, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={exportNewsletterCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export Newsletter
            </Button>
            <Button variant="outline" onClick={exportApplicationsCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export Applications
            </Button>
            <Button variant="outline" onClick={exportQuotesCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export Quotes
            </Button>
          </div>
        </div>

        <Tabs defaultValue="newsletter" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="newsletter" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Newsletter
              <Badge variant="secondary">{filteredNewsletterSignups.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Applications
              <Badge variant="secondary">{filteredApplications.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="quotes" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Quotes
              <Badge variant="secondary">{filteredQuotes.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="newsletter">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Newsletter Subscribers
                </CardTitle>
                <CardDescription>
                  Users subscribed to your newsletter
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading...</p>
                ) : filteredNewsletterSignups.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No matching subscribers found." : "No newsletter subscribers yet."}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Subscribed</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredNewsletterSignups.map((signup) => (
                          <TableRow key={signup.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                {signup.email}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              <div className="flex flex-col">
                                <span>{formatRelativeDate(signup.created_at)}</span>
                                <span className="text-xs">{formatDate(signup.created_at)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSignup(signup.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Supplier Applications
                </CardTitle>
                <CardDescription>
                  Companies that have applied to become suppliers
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading...</p>
                ) : filteredApplications.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No matching applications found." : "No supplier applications yet."}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Applied</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredApplications.map((app) => (
                          <TableRow key={app.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {app.name}
                              </div>
                            </TableCell>
                            <TableCell>{app.email}</TableCell>
                            <TableCell>{app.company}</TableCell>
                            <TableCell className="text-muted-foreground">
                              <div className="flex flex-col">
                                <span>{formatRelativeDate(app.created_at)}</span>
                                <span className="text-xs">{formatDate(app.created_at)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteApplication(app.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Quote Requests
                </CardTitle>
                <CardDescription>
                  Leads from quote request forms across the site
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-muted-foreground">Loading...</p>
                ) : filteredQuotes.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No matching quote requests found." : "No quote requests yet."}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Technology</TableHead>
                          <TableHead>Volume</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredQuotes.map((q) => (
                          <TableRow key={q.id}>
                            <TableCell className="font-medium">{q.name}</TableCell>
                            <TableCell>{q.email}</TableCell>
                            <TableCell>
                              {q.technology_preference && <Badge variant="outline" className="text-xs">{q.technology_preference}</Badge>}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{q.volume || '-'}</TableCell>
                            <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]">{q.supplier_context || q.source_page || '-'}</TableCell>
                            <TableCell className="text-muted-foreground">
                              <div className="flex flex-col">
                                <span>{formatRelativeDate(q.created_at)}</span>
                                <span className="text-xs">{formatDate(q.created_at)}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Signups;
