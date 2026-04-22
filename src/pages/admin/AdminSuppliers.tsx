import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Navbar from "@/components/ui/navbar";
import ValidationHistoryModal from "@/components/validation/ValidationHistoryModal";
import LocationExtractionProgress from "@/components/validation/LocationExtractionProgress";
import SupplierLogo from "@/components/ui/supplier-logo";
import { LogOut, RefreshCw, MoreVertical, ExternalLink, History, Eye, MapPin, Check, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Supplier {
  id: string;
  supplier_id: string;
  name: string;
  website: string | null;
  verified: boolean;
  logo_url: string | null;
  last_validated_at: string | null;
  last_validation_confidence: number | null;
  created_at: string;
  technologies: string[];
  materials: string[];
  location_city: string | null;
  location_country: string | null;
  description: string | null;
  description_extended: unknown;
}

interface SupplierWithStats extends Supplier {
  validation_count: number;
  latest_result: boolean | null;
  location_lat: number | null;
  location_lng: number | null;
}

type VerificationFilter = "all" | "verified" | "unverified" | "pending";
type SortBy = "name" | "status" | "lastValidated" | "created";

export default function AdminSuppliers() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [suppliers, setSuppliers] = useState<SupplierWithStats[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<SupplierWithStats[]>([]);
  
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("created");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const [selectedSupplier, setSelectedSupplier] = useState<{ id: string; name: string } | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [extractingLocations, setExtractingLocations] = useState(false);
  const [extractionSessionId, setExtractionSessionId] = useState<string | null>(null);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [validatingMissingData, setValidatingMissingData] = useState(false);
  const [generatingAIData, setGeneratingAIData] = useState(false);
  
  // Bulk operations state
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(new Set());
  const [bulkOperating, setBulkOperating] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchSuppliers();
    }
  }, [isAdmin]);

  useEffect(() => {
    applyFiltersAndSort();
    // Clear selection if filters change
    setSelectedSuppliers(new Set());
  }, [suppliers, verificationFilter, searchQuery, sortBy, sortOrder]);

  const checkAuth = async () => {
    try {
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

      if (roleData?.role !== "admin") {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Auth check error:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data: suppliersData, error: suppliersError } = await supabase
        .from("suppliers")
        .select("*")
        .order("created_at", { ascending: false });

      if (suppliersError) throw suppliersError;

      const { data: validationCounts, error: countsError } = await supabase
        .from("validation_results")
        .select("supplier_id, overall_match");

      if (countsError) throw countsError;

      const countMap = new Map<string, { count: number; latestResult: boolean | null }>();
      
      validationCounts?.forEach((vr) => {
        const existing = countMap.get(vr.supplier_id) || { count: 0, latestResult: null };
        existing.count++;
        countMap.set(vr.supplier_id, existing);
      });

      const enrichedSuppliers: SupplierWithStats[] = (suppliersData || []).map((supplier) => {
        const stats = countMap.get(supplier.supplier_id) || { count: 0, latestResult: null };
        return {
          ...supplier,
          validation_count: stats.count,
          latest_result: supplier.last_validated_at ? supplier.verified : null,
        };
      });

      setSuppliers(enrichedSuppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Failed to fetch suppliers");
    }
  };

  const applyFiltersAndSort = () => {
    let result = [...suppliers];

    // Apply verification filter
    if (verificationFilter === "verified") {
      result = result.filter((s) => s.verified);
    } else if (verificationFilter === "unverified") {
      result = result.filter((s) => !s.verified);
    } else if (verificationFilter === "pending") {
      result = result.filter((s) => s.validation_count === 0);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(query));
    }

    // Apply sort
    result.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case "name":
          compareValue = a.name.localeCompare(b.name);
          break;
        case "status":
          compareValue = Number(b.verified) - Number(a.verified);
          break;
        case "lastValidated":
          const aDate = a.last_validated_at ? new Date(a.last_validated_at).getTime() : 0;
          const bDate = b.last_validated_at ? new Date(b.last_validated_at).getTime() : 0;
          compareValue = bDate - aDate;
          break;
        case "created":
          compareValue = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          break;
      }

      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    setFilteredSuppliers(result);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setSelectedSuppliers(new Set());
    await fetchSuppliers();
    setRefreshing(false);
    toast.success("Suppliers refreshed");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleViewHistory = (supplier: SupplierWithStats) => {
    setSelectedSupplier({ id: supplier.supplier_id, name: supplier.name });
    setHistoryModalOpen(true);
  };

  const handleSelectAll = () => {
    if (selectedSuppliers.size === filteredSuppliers.length) {
      setSelectedSuppliers(new Set());
    } else {
      setSelectedSuppliers(new Set(filteredSuppliers.map(s => s.id)));
    }
  };

  const handleSelectSupplier = (id: string) => {
    const newSelected = new Set(selectedSuppliers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSuppliers(newSelected);
  };

  const handleBulkVerify = async () => {
    if (selectedSuppliers.size === 0) return;
    
    setBulkOperating(true);
    toast.info(`Updating ${selectedSuppliers.size} suppliers...`);

    try {
      const { error } = await supabase
        .from("suppliers")
        .update({ verified: true })
        .in("id", Array.from(selectedSuppliers));

      if (error) throw error;

      toast.success(`Successfully verified ${selectedSuppliers.size} suppliers`);
      setSelectedSuppliers(new Set());
      await fetchSuppliers();
    } catch (error) {
      console.error("Bulk verify error:", error);
      toast.error("Failed to verify suppliers", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    } finally {
      setBulkOperating(false);
    }
  };

  const handleBulkUnverify = async () => {
    if (selectedSuppliers.size === 0) return;
    
    setBulkOperating(true);
    toast.info(`Updating ${selectedSuppliers.size} suppliers...`);

    try {
      const { error } = await supabase
        .from("suppliers")
        .update({ verified: false })
        .in("id", Array.from(selectedSuppliers));

      if (error) throw error;

      toast.success(`Successfully unverified ${selectedSuppliers.size} suppliers`);
      setSelectedSuppliers(new Set());
      await fetchSuppliers();
    } catch (error) {
      console.error("Bulk unverify error:", error);
      toast.error("Failed to unverify suppliers", {
        description: error instanceof Error ? error.message : "Unknown error occurred"
      });
    } finally {
      setBulkOperating(false);
    }
  };

  const handleGeocodeSuppliers = async () => {
    setGeocoding(true);
    toast.info("Starting geocoding process...", {
      description: "This may take a few minutes depending on the number of suppliers.",
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke('geocode-suppliers', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Geocoding error:", error);
        throw error;
      }

      const results = data.results;
      
      toast.success("Geocoding complete!", {
        description: `Successfully geocoded ${results.successful} suppliers. ${results.failed} failed, ${results.skipped} skipped.`,
      });

      if (results.errors && results.errors.length > 0) {
        console.log("Geocoding errors:", results.errors);
      }

      // Refresh suppliers list
      await fetchSuppliers();

    } catch (error) {
      console.error("Error geocoding suppliers:", error);
      toast.error("Failed to geocode suppliers", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setGeocoding(false);
    }
  };

  const handleValidateMissingData = async () => {
    setValidatingMissingData(true);
    
    // Count suppliers with missing data
    const suppliersWithMissingData = suppliers.filter(s => hasMissingData(s));
    const batchSize = Math.min(suppliersWithMissingData.length, 10); // Max 10 at a time
    
    toast.info(`Starting validation for ${suppliersWithMissingData.length} suppliers with missing data...`, {
      description: `Processing ${batchSize} suppliers at a time. This may take several minutes.`,
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke('scheduled-validation', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { 
          validateAll: true,  // Validate all that meet criteria
          batchSize: batchSize
        }
      });

      if (error) {
        console.error("Validation error:", error);
        throw error;
      }

      toast.success("Validation started!", {
        description: `Processing suppliers with missing data. Check validation dashboard for results.`,
      });

      // Refresh suppliers list after a short delay
      setTimeout(() => {
        fetchSuppliers();
      }, 2000);

    } catch (error) {
      console.error("Error validating suppliers:", error);
      toast.error("Failed to start validation", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setValidatingMissingData(false);
    }
  };

  const handleExtractLocations = async () => {
    // Generate session ID for progress tracking
    const sessionId = crypto.randomUUID();
    setExtractionSessionId(sessionId);
    setExtractingLocations(true);
    setProgressDialogOpen(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke('extract-supplier-locations', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { sessionId }
      });

      if (error) {
        console.error("Location extraction error:", error);
        throw error;
      }

      const results = data.results;
      const successful = results.filter((r: any) => r.status === 'success').length;
      const failed = results.filter((r: any) => r.status === 'failed').length;
      const lowConfidence = results.filter((r: any) => r.status === 'low-confidence').length;
      
      toast.success("Location extraction complete!", {
        description: `Successfully extracted ${successful} locations. ${failed} failed, ${lowConfidence} had low confidence.`,
      });

      console.log("Extraction results:", results);

      // Refresh suppliers list
      await fetchSuppliers();

    } catch (error) {
      console.error("Error extracting locations:", error);
      toast.error("Failed to extract locations", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setExtractingLocations(false);
    }
  };

  const hasValidCoordinates = (supplier: SupplierWithStats) => {
    const lat = supplier.location_lat;
    const lng = supplier.location_lng;
    
    if (!lat || !lng || lat === 0 || lng === 0) return false;
    
    // Check if Berlin default coordinates
    if (Math.abs(lat - 52.52) < 0.01 && Math.abs(lng - 13.40) < 0.01) return false;
    
    return true;
  };

  const hasMissingData = (supplier: SupplierWithStats) => {
    return !supplier.description || 
           supplier.description.trim() === '' ||
           !supplier.technologies || 
           supplier.technologies.length === 0 ||
           !supplier.materials || 
           supplier.materials.length === 0;
  };

  const hasMissingAIData = (supplier: SupplierWithStats) => {
    const ext = supplier.description_extended as Record<string, unknown> | null;
    return !ext?.pros || !ext?.cons || !ext?.price_range;
  };

  const handleGenerateComparisons = async () => {
    setGeneratingAIData(true);
    const missing = suppliers.filter(s => hasMissingAIData(s));
    
    toast.info(`Generating supplier data for ${missing.length} suppliers...`, {
      description: "This may take several minutes. Suppliers with existing data will be skipped.",
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke('generate-supplier-comparison', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { supplier_ids: missing.map(s => s.id), batch_size: missing.length },
      });

      if (error) throw error;

      const results = data?.results || [];
      const successful = results.filter((r: any) => r.status === 'success').length;
      const skipped = results.filter((r: any) => r.status === 'skipped').length;
      const failed = results.filter((r: any) => !['success', 'skipped'].includes(r.status)).length;

      toast.success("Supplier data generation complete!", {
        description: `${successful} generated, ${skipped} skipped, ${failed} failed.`,
      });

      await fetchSuppliers();
    } catch (error) {
      console.error("Error generating AI data:", error);
      toast.error("Failed to generate supplier data", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setGeneratingAIData(false);
    }
  };

  const stats = {
    total: suppliers.length,
    verified: suppliers.filter((s) => s.verified).length,
    unverified: suppliers.filter((s) => !s.verified).length,
    pending: suppliers.filter((s) => s.validation_count === 0).length,
    needsGeocoding: suppliers.filter((s) => !hasValidCoordinates(s)).length,
    missingData: suppliers.filter((s) => hasMissingData(s)).length,
    missingAIData: suppliers.filter((s) => hasMissingAIData(s)).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>You need admin privileges to access this page</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleSignOut} variant="outline">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Supplier Management</h1>
            <p className="text-muted-foreground">Manage and monitor all suppliers</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleGenerateComparisons} variant="outline" disabled={generatingAIData || stats.missingAIData === 0}>
              <Sparkles className={`mr-2 h-4 w-4 ${generatingAIData ? "animate-pulse" : ""}`} />
              {generatingAIData ? "Generating..." : `Generate Supplier Data (${stats.missingAIData})`}
            </Button>
            <Button onClick={handleValidateMissingData} variant="outline" disabled={validatingMissingData || stats.missingData === 0}>
              <RefreshCw className={`mr-2 h-4 w-4 ${validatingMissingData ? "animate-spin" : ""}`} />
              {validatingMissingData ? "Validating..." : `Validate Missing Data (${stats.missingData})`}
            </Button>
            <Button onClick={handleExtractLocations} variant="outline" disabled={extractingLocations}>
              <MapPin className={`mr-2 h-4 w-4 ${extractingLocations ? "animate-pulse" : ""}`} />
              {extractingLocations ? "Extracting..." : "Extract Location Data"}
            </Button>
            <Button onClick={handleGeocodeSuppliers} variant="outline" disabled={geocoding}>
              <MapPin className={`mr-2 h-4 w-4 ${geocoding ? "animate-pulse" : ""}`} />
              {geocoding ? "Geocoding..." : "Geocode to Coordinates"}
            </Button>
            <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={handleSignOut} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Unverified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.unverified}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Needs Geocoding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.needsGeocoding}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <RefreshCw className="h-4 w-4" />
                Missing Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.missingData}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <Tabs value={verificationFilter} onValueChange={(v) => setVerificationFilter(v as VerificationFilter)} className="w-full md:w-auto">
                <TabsList>
                  <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
                  <TabsTrigger value="verified">Verified ({stats.verified})</TabsTrigger>
                  <TabsTrigger value="unverified">Unverified ({stats.unverified})</TabsTrigger>
                  <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex gap-2 flex-1">
                <Input
                  placeholder="Search suppliers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs"
                />
                
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="lastValidated">Last Validated</SelectItem>
                    <SelectItem value="created">Created Date</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedSuppliers.size === filteredSuppliers.length && filteredSuppliers.length > 0}
                      onCheckedChange={handleSelectAll}
                      disabled={bulkOperating || filteredSuppliers.length === 0}
                    />
                  </TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Validated</TableHead>
                  <TableHead>Validations</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No suppliers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => {
                    const needsGeocoding = !hasValidCoordinates(supplier);
                    
                    return (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedSuppliers.has(supplier.id)}
                          onCheckedChange={() => handleSelectSupplier(supplier.id)}
                          disabled={bulkOperating}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <SupplierLogo name={supplier.name} logoUrl={supplier.logo_url || undefined} size="sm" />
                          <span className="font-medium">{supplier.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier.website ? (
                          <a
                            href={supplier.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {new URL(supplier.website).hostname}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {needsGeocoding ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            <MapPin className="h-3 w-3 mr-1" />
                            Needs Geocoding
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            <MapPin className="h-3 w-3 mr-1" />
                            Has Coordinates
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={supplier.verified ? "default" : "secondary"}>
                          {supplier.verified ? "Verified" : "Unverified"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {supplier.last_validated_at
                          ? format(new Date(supplier.last_validated_at), "PPp")
                          : "Never"}
                      </TableCell>
                      <TableCell>{supplier.validation_count}</TableCell>
                      <TableCell>
                        {supplier.latest_result === null ? (
                          <span className="text-muted-foreground">N/A</span>
                        ) : supplier.latest_result ? (
                          <Badge variant="default">Success</Badge>
                        ) : (
                          <Badge variant="destructive">Failed</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/suppliers/${supplier.supplier_id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewHistory(supplier)}>
                              <History className="mr-2 h-4 w-4" />
                              View History
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <ValidationHistoryModal
        open={historyModalOpen}
        onOpenChange={setHistoryModalOpen}
        supplierId={selectedSupplier?.id || null}
        supplierName={selectedSupplier?.name || ""}
      />

      <LocationExtractionProgress
        open={progressDialogOpen}
        onOpenChange={setProgressDialogOpen}
        sessionId={extractionSessionId}
      />

      {/* Bulk Action Bar */}
      {selectedSuppliers.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
          <Card className="shadow-lg border-primary/20">
            <CardContent className="flex items-center gap-4 p-4">
              <span className="text-sm font-medium">
                {selectedSuppliers.size} supplier{selectedSuppliers.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                {suppliers.some(s => selectedSuppliers.has(s.id) && !s.verified) && (
                  <Button
                    onClick={handleBulkVerify}
                    disabled={bulkOperating}
                    size="sm"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Mark as Verified
                  </Button>
                )}
                {suppliers.some(s => selectedSuppliers.has(s.id) && s.verified) && (
                  <Button
                    onClick={handleBulkUnverify}
                    disabled={bulkOperating}
                    variant="secondary"
                    size="sm"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Mark as Unverified
                  </Button>
                )}
                <Button
                  onClick={() => setSelectedSuppliers(new Set())}
                  disabled={bulkOperating}
                  variant="outline"
                  size="sm"
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
