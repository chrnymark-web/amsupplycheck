import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  Globe,
  Cpu,
  Box,
  MapPin,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

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

interface SupplierReviewListProps {
  suppliers: DiscoveredSupplier[];
  loading: boolean;
  onRefresh: () => void;
}

export function SupplierReviewList({ suppliers, loading, onRefresh }: SupplierReviewListProps) {
  const [selectedTab, setSelectedTab] = useState('pending');
  
  // Edit dialog state
  const [editSupplier, setEditSupplier] = useState<DiscoveredSupplier | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTechnologies, setEditTechnologies] = useState('');
  const [editMaterials, setEditMaterials] = useState('');
  
  // Reject dialog state
  const [rejectSupplier, setRejectSupplier] = useState<DiscoveredSupplier | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Validation state
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [validationStatus, setValidationStatus] = useState('');
  const [scrapingMethod, setScrapingMethod] = useState<string | null>(null);
  const [validationStats, setValidationStats] = useState<{
    pagesScraped?: number;
    firecrawlPages?: number;
    basicFetchPages?: number;
    cacheHits?: number;
  } | null>(null);

  function approveSupplier(supplier: DiscoveredSupplier) {
    setEditSupplier(supplier);
    setEditName(supplier.name);
    setEditDescription(supplier.description || '');
    setEditTechnologies((supplier.technologies || []).join(', '));
    setEditMaterials((supplier.materials || []).join(', '));
  }

  async function confirmApproval() {
    if (!editSupplier) return;

    const supplierId = `discovered-${editSupplier.id.substring(0, 8)}`;
    const technologies = editTechnologies.split(',').map(t => t.trim()).filter(Boolean);
    const materials = editMaterials.split(',').map(m => m.trim()).filter(Boolean);
    const location = [editSupplier.location_city, editSupplier.location_country].filter(Boolean).join(', ');

    try {
      setIsValidating(true);
      setValidationProgress(10);
      setValidationStatus('Adding supplier to database...');

      // Step 1: Insert supplier with verified: false
      const { error: insertError } = await supabase
        .from('suppliers')
        .insert({
          supplier_id: supplierId,
          name: editName,
          website: editSupplier.website,
          description: editDescription,
          technologies,
          materials,
          location_country: editSupplier.location_country,
          location_city: editSupplier.location_city,
          verified: false,
          premium: false,
        });

      if (insertError) throw insertError;

      setValidationProgress(25);
      setValidationStatus('Updating discovered status...');

      // Step 2: Update discovered_suppliers status
      const { error: updateError } = await supabase
        .from('discovered_suppliers')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', editSupplier.id);

      if (updateError) throw updateError;

      setValidationProgress(40);
      setValidationStatus('Starting automatic validation...');

      // Step 3: Trigger automatic validation
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        toast.warning(`${editName} added, but validation requires login`);
        setEditSupplier(null);
        setIsValidating(false);
        onRefresh();
        return;
      }

      setValidationProgress(50);
      setValidationStatus('Scraping website and analyzing data...');

      const validationResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-supplier`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            supplierId,
            supplierName: editName,
            supplierWebsite: editSupplier.website,
            currentTechnologies: technologies,
            currentMaterials: materials,
            currentLocation: location,
          }),
        }
      );

      setValidationProgress(85);
      setValidationStatus('Processing validation result...');

      const validationResult = await validationResponse.json();

      // Store scraping stats
      if (validationResult.stats) {
        setScrapingMethod(validationResult.stats.scrapingMethod || null);
        setValidationStats({
          pagesScraped: validationResult.stats.pagesScraped,
          firecrawlPages: validationResult.stats.firecrawlPages,
          basicFetchPages: validationResult.stats.basicFetchPages,
          cacheHits: validationResult.stats.cacheHits,
        });
      }

      if (validationResponse.ok && validationResult.success) {
        // Validation succeeded - check if we should auto-verify
        const overallConfidence = validationResult.confidence?.overall || 0;
        
        setValidationProgress(95);
        
        if (overallConfidence >= 70) {
          // Auto-verify if confidence is high enough
          await supabase
            .from('suppliers')
            .update({ 
              verified: true,
              last_validated_at: new Date().toISOString(),
              last_validation_confidence: overallConfidence
            })
            .eq('supplier_id', supplierId);
          
          setValidationProgress(100);
          setValidationStatus('Validation complete - supplier is live!');
          toast.success(`${editName} approved and verified (${overallConfidence}% confidence)`);
        } else {
          setValidationProgress(100);
          setValidationStatus('Validation complete - requires manual review');
          toast.info(`${editName} added with low confidence (${overallConfidence}%) - requires manual verification`);
        }
      } else {
        // Validation failed but supplier was added
        setValidationProgress(100);
        setValidationStatus('Validation failed - supplier awaits manual verification');
        toast.warning(`${editName} added, but validation failed: ${validationResult.error || 'Unknown error'}`);
      }

      setTimeout(() => {
        setEditSupplier(null);
        setIsValidating(false);
        setValidationProgress(0);
        setValidationStatus('');
        setScrapingMethod(null);
        setValidationStats(null);
        onRefresh();
      }, 2000);

    } catch (error) {
      console.error('Approval error:', error);
      toast.error('Could not approve supplier');
      setIsValidating(false);
      setValidationProgress(0);
      setValidationStatus('');
    }
  }

  async function confirmRejection() {
    if (!rejectSupplier) return;

    try {
      const { error } = await supabase
        .from('discovered_suppliers')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq('id', rejectSupplier.id);

      if (error) throw error;

      toast.success('Supplier rejected');
      setRejectSupplier(null);
      setRejectionReason('');
      onRefresh();
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('Failed to reject supplier');
    }
  }

  async function markAsDuplicate(supplier: DiscoveredSupplier) {
    try {
      const { error } = await supabase
        .from('discovered_suppliers')
        .update({
          status: 'duplicate',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', supplier.id);

      if (error) throw error;

      toast.success('Marked as duplicate');
      onRefresh();
    } catch (error) {
      toast.error('Failed to update status');
    }
  }

  const filteredSuppliers = suppliers.filter(s => s.status === selectedTab);
  const pendingCount = suppliers.filter(s => s.status === 'pending').length;
  const autoApprovedCount = suppliers.filter(s => s.status === 'auto_approved').length;

  return (
    <>
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="pending">
            Pending {pendingCount > 0 && `(${pendingCount})`}
          </TabsTrigger>
          <TabsTrigger value="auto_approved" className="text-purple-600">
            Auto-Approved {autoApprovedCount > 0 && `(${autoApprovedCount})`}
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="duplicate">Duplicates</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="mt-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No suppliers in this category
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSuppliers.map((supplier) => (
                <Card key={supplier.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg truncate">{supplier.name}</h3>
                          {supplier.discovery_confidence && (
                            <Badge variant={supplier.discovery_confidence >= 70 ? 'default' : 'secondary'}>
                              {supplier.discovery_confidence}%
                            </Badge>
                          )}
                        </div>

                        {supplier.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {supplier.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-3 text-sm">
                          <a 
                            href={supplier.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <Globe className="h-4 w-4" />
                            {new URL(supplier.website).hostname}
                            <ExternalLink className="h-3 w-3" />
                          </a>

                          {(supplier.location_city || supplier.location_country) && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {[supplier.location_city, supplier.location_country].filter(Boolean).join(', ')}
                            </span>
                          )}
                        </div>

                        {supplier.technologies && supplier.technologies.length > 0 && (
                          <div className="flex items-center gap-2 mt-3">
                            <Cpu className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-wrap gap-1">
                              {supplier.technologies.map((tech) => (
                                <Badge key={tech} variant="outline" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {supplier.materials && supplier.materials.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <Box className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-wrap gap-1">
                              {supplier.materials.map((mat) => (
                                <Badge key={mat} variant="secondary" className="text-xs">
                                  {mat}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {supplier.rejection_reason && (
                          <p className="text-sm text-destructive mt-2">
                            Rejection reason: {supplier.rejection_reason}
                          </p>
                        )}
                      </div>

                      {selectedTab === 'pending' && (
                        <div className="flex flex-col gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => markAsDuplicate(supplier)}
                          >
                            Duplicate
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => setRejectSupplier(supplier)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => approveSupplier(supplier)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit/Approve Dialog */}
      <Dialog open={!!editSupplier} onOpenChange={(open) => !isValidating && !open && setEditSupplier(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isValidating ? 'Validating Supplier...' : 'Review & Approve Supplier'}
            </DialogTitle>
            <DialogDescription>
              {isValidating 
                ? 'Supplier is being added and validated automatically. This can take up to 1 minute.'
                : 'Review and edit the supplier information before adding to the database.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {isValidating ? (
          <div className="py-6 space-y-4">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <Progress value={validationProgress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                {validationStatus}
              </p>
              <p className="text-xs text-center text-muted-foreground">
                {validationProgress}% complete
              </p>
              
              {/* Show scraping method when available */}
              {validationStats && validationProgress >= 85 && (
                <div className="mt-4 p-3 bg-muted rounded-lg space-y-2">
                  <p className="text-xs font-medium text-center">Scraping Stats</p>
                  <div className="flex justify-center gap-4 text-xs text-muted-foreground">
                    <span>📄 {validationStats.pagesScraped} pages</span>
                    {validationStats.firecrawlPages !== undefined && validationStats.firecrawlPages > 0 && (
                      <span className="text-orange-500">🔥 {validationStats.firecrawlPages} Firecrawl</span>
                    )}
                    {validationStats.basicFetchPages !== undefined && validationStats.basicFetchPages > 0 && (
                      <span className="text-blue-500">🌐 {validationStats.basicFetchPages} Basic</span>
                    )}
                    {validationStats.cacheHits !== undefined && validationStats.cacheHits > 0 && (
                      <span className="text-green-500">💾 {validationStats.cacheHits} Cache</span>
                    )}
                  </div>
                  {scrapingMethod && (
                    <p className="text-xs text-center">
                      Method: <Badge variant="outline" className="ml-1">
                        {scrapingMethod === 'firecrawl' ? '🔥 Firecrawl' : 
                         scrapingMethod === 'basic_fetch' ? '🌐 Basic Fetch' :
                         scrapingMethod === 'cache' ? '💾 Cache' :
                         scrapingMethod === 'mixed' ? '🔄 Mixed' : scrapingMethod}
                      </Badge>
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Name</Label>
                  <Input 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)} 
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea 
                    value={editDescription} 
                    onChange={e => setEditDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Technologies (comma-separated)</Label>
                  <Input 
                    value={editTechnologies} 
                    onChange={e => setEditTechnologies(e.target.value)}
                    placeholder="FDM, SLA, SLS"
                  />
                </div>
                <div>
                  <Label>Materials (comma-separated)</Label>
                  <Input 
                    value={editMaterials} 
                    onChange={e => setEditMaterials(e.target.value)}
                    placeholder="PLA, ABS, Nylon"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditSupplier(null)}>
                  Cancel
                </Button>
                <Button onClick={confirmApproval}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve & Validate
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectSupplier} onOpenChange={() => setRejectSupplier(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Supplier</DialogTitle>
            <DialogDescription>
              Optionally provide a reason for rejecting this supplier.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Rejection Reason (optional)</Label>
            <Textarea 
              value={rejectionReason} 
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="e.g., Not a 3D printing service, marketplace, duplicate..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectSupplier(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRejection}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
