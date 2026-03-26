import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Clock, 
  AlertCircle,
  ArrowLeft,
  Play,
  History,
  BarChart3,
  Settings,
  Users
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { DiscoveryStats } from '@/components/discovery/DiscoveryStats';
import { DiscoveryConfig } from '@/components/discovery/DiscoveryConfig';
import { SupplierReviewList } from '@/components/discovery/SupplierReviewList';

interface DiscoveredSupplier {
  id: string;
  name: string;
  website: string;
  description: string | null;
  technologies: string[] | null;
  materials: string[] | null;
  location_country: string | null;
  location_city: string | null;
  source_url: string | null;
  search_query: string | null;
  discovery_confidence: number | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

interface DiscoveryRun {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  search_queries: string[] | null;
  suppliers_found: number | null;
  suppliers_new: number | null;
  suppliers_duplicate: number | null;
  error_message: string | null;
}

export default function DiscoveredSuppliers() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<DiscoveredSupplier[]>([]);
  const [runs, setRuns] = useState<DiscoveryRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [runningDiscovery, setRunningDiscovery] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  async function checkAdminAndLoad() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }

    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const hasAdmin = roles?.some(r => r.role === 'admin');
    if (!hasAdmin) {
      toast.error('Admin access required');
      navigate('/');
      return;
    }

    setIsAdmin(true);
    await loadData();
  }

  async function loadData() {
    setLoading(true);
    
    const [suppliersRes, runsRes] = await Promise.all([
      supabase
        .from('discovered_suppliers')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('discovery_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(50),
    ]);

    if (suppliersRes.data) {
      setSuppliers(suppliersRes.data);
    }
    if (runsRes.data) {
      setRuns(runsRes.data);
    }
    
    setLoading(false);
  }

  async function runDiscoveryNow() {
    setRunningDiscovery(true);
    toast.info('Starting supplier discovery...');

    try {
      const response = await supabase.functions.invoke('discover-suppliers');
      
      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      toast.success(`Discovery complete: ${result.suppliersNew} new suppliers found`);
      await loadData();
    } catch (error) {
      console.error('Discovery error:', error);
      toast.error('Discovery failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setRunningDiscovery(false);
    }
  }

  const pendingCount = suppliers.filter(s => s.status === 'pending').length;
  const approvedCount = suppliers.filter(s => s.status === 'approved').length;
  const rejectedCount = suppliers.filter(s => s.status === 'rejected').length;

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Supplier Discovery Dashboard</h1>
              <p className="text-muted-foreground">
                AI-powered discovery and management of 3D printing suppliers
              </p>
            </div>
          </div>
          <Button 
            onClick={runDiscoveryNow} 
            disabled={runningDiscovery}
          >
            {runningDiscovery ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run Discovery Now
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{approvedCount}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{rejectedCount}</p>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{runs.length}</p>
                  <p className="text-sm text-muted-foreground">Discovery Runs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Review Suppliers
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="runs" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Run History
            </TabsTrigger>
          </TabsList>

          {/* Statistics Tab */}
          <TabsContent value="overview">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <DiscoveryStats runs={runs} suppliers={suppliers} />
            )}
          </TabsContent>

          {/* Review Tab */}
          <TabsContent value="review">
            <SupplierReviewList 
              suppliers={suppliers} 
              loading={loading}
              onRefresh={loadData}
            />
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config">
            <DiscoveryConfig />
          </TabsContent>

          {/* Run History Tab */}
          <TabsContent value="runs">
            <Card>
              <CardHeader>
                <CardTitle>Discovery Run History</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))}
                  </div>
                ) : runs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No discovery runs yet. Click "Run Discovery Now" to start.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {runs.map(run => (
                      <div 
                        key={run.id} 
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {run.status === 'running' && (
                            <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                          )}
                          {run.status === 'completed' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {run.status === 'failed' && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          <div>
                            <p className="font-medium">
                              {new Date(run.started_at).toLocaleString('da-DK')}
                            </p>
                            {run.error_message && (
                              <p className="text-sm text-red-500">{run.error_message}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          {run.suppliers_found !== null && (
                            <span className="text-muted-foreground">
                              {run.suppliers_found} found
                            </span>
                          )}
                          {run.suppliers_new !== null && (
                            <Badge variant="outline" className="text-green-600">
                              {run.suppliers_new} new
                            </Badge>
                          )}
                          {run.suppliers_duplicate !== null && run.suppliers_duplicate > 0 && (
                            <span className="text-muted-foreground">
                              {run.suppliers_duplicate} duplicates
                            </span>
                          )}
                          <Badge variant={
                            run.status === 'completed' ? 'default' :
                            run.status === 'failed' ? 'destructive' : 'secondary'
                          }>
                            {run.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
