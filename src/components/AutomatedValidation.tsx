import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, PlayCircle, CheckCircle2, XCircle, AlertCircle, Save } from 'lucide-react';
import { loadSuppliers } from '@/lib/supplierData';

interface ValidationResult {
  supplierId: string;
  supplierName: string;
  technologiesMatch: boolean;
  materialsMatch: boolean;
  locationMatch: boolean;
  overallMatch: boolean;
  scrapedTechnologies: string[];
  scrapedMaterials: string[];
  scrapedLocation: string;
  currentTechnologies: string[];
  currentMaterials: string[];
  currentLocation: string;
}

export const AutomatedValidation = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [currentSupplier, setCurrentSupplier] = useState<string>('');
  const [selectedUpdates, setSelectedUpdates] = useState<Set<string>>(new Set());
  const [isApplying, setIsApplying] = useState(false);
  const { toast } = useToast();

  const runScheduledValidation = async (validateAll: boolean = false, validateUnverified: boolean = false, batchSize?: number) => {
    setIsRunning(true);
    
    try {
      toast({
        title: 'Starting Validation',
        description: validateUnverified
          ? `Validating ${batchSize || 10} unverified suppliers...`
          : validateAll 
          ? 'Validating next supplier (1 at a time for best quality)...'
          : 'Running scheduled validation for suppliers needing updates...',
      });

      const { data, error } = await supabase.functions.invoke('scheduled-validation', {
        body: { validateAll, validateUnverified, batchSize }
      });

      if (error) throw error;

      const validated = data?.validated || 0;
      const updated = data?.updated || 0;

      if (updated > 0) {
        toast({
          title: 'Validation Complete ✅',
          description: `Validated ${validated} suppliers and auto-updated ${updated} suppliers with new data`,
        });
      } else if (validated > 0) {
        toast({
          title: 'Validation Complete ⚠️',
          description: `Validated ${validated} suppliers but made no updates. Enable auto-approval settings to apply changes automatically.`,
        });
      } else {
        toast({
          title: 'No Suppliers to Validate',
          description: 'All suppliers are up to date!',
        });
      }

      // Trigger a page reload to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Scheduled validation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to run scheduled validation',
        variant: 'destructive'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runAutomatedValidation = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);

    try {
      // Load suppliers from database instead of CSV
      const { data: dbSuppliers, error: dbError } = await supabase
        .from('suppliers')
        .select('*');

      if (dbError) throw dbError;

      // Transform to match the ParsedSupplier interface
      const suppliers = (dbSuppliers || []).map(supplier => ({
        id: supplier.supplier_id,
        name: supplier.name,
        location: {
          lat: Number(supplier.location_lat) || 52.52,
          lng: Number(supplier.location_lng) || 13.40,
          city: supplier.location_city || '',
          country: supplier.location_country || '',
          fullAddress: supplier.location_address || ''
        },
        technologies: supplier.technologies || [],
        materials: supplier.materials || [],
        verified: supplier.verified || false,
        premium: supplier.premium || false,
        rating: Number(supplier.rating) || 0,
        reviewCount: supplier.review_count || 0,
        description: supplier.description || '',
        website: supplier.website || '',
        logoUrl: supplier.logo_url || undefined,
        region: supplier.region || 'global'
      }));
      
      if (suppliers.length === 0) {
        toast({
          title: 'No Suppliers',
          description: 'No supplier data found to validate',
          variant: 'destructive'
        });
        setIsRunning(false);
        return;
      }
      
      const totalSuppliers = suppliers.length;
      const validationResults: ValidationResult[] = [];

      for (let i = 0; i < suppliers.length; i++) {
        const supplier = suppliers[i];
        setCurrentSupplier(supplier.name);
        setProgress(((i + 1) / totalSuppliers) * 100);

        try {
          const { data, error } = await supabase.functions.invoke('validate-supplier', {
            body: {
              supplierId: supplier.id,
              supplierName: supplier.name,
              supplierWebsite: supplier.website,
              currentTechnologies: supplier.technologies,
              currentMaterials: supplier.materials,
              currentLocation: typeof supplier.location === 'string' 
                ? supplier.location 
                : supplier.location?.fullAddress || supplier.location?.city || ''
            }
          });

          if (error) throw error;

          if (data?.success) {
            validationResults.push({
              ...data.data,
              currentTechnologies: supplier.technologies,
              currentMaterials: supplier.materials,
              currentLocation: typeof supplier.location === 'string' 
                ? supplier.location 
                : supplier.location?.fullAddress || supplier.location?.city || ''
            });
          }

          await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
          console.error(`Failed to validate ${supplier.name}:`, error);
          toast({
            title: 'Validation Error',
            description: `Failed to validate ${supplier.name}`,
            variant: 'destructive'
          });
        }
      }

      setResults(validationResults);
      setCurrentSupplier('');

      toast({
        title: 'Validation Complete',
        description: `Validated ${validationResults.length} suppliers successfully`,
      });

    } catch (error) {
      console.error('Automated validation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to run automated validation',
        variant: 'destructive'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const toggleUpdate = (supplierId: string) => {
    const newSelected = new Set(selectedUpdates);
    if (newSelected.has(supplierId)) {
      newSelected.delete(supplierId);
    } else {
      newSelected.add(supplierId);
    }
    setSelectedUpdates(newSelected);
  };

  const applySelectedUpdates = async () => {
    setIsApplying(true);
    const selected = results.filter(r => selectedUpdates.has(r.supplierId));
    
    try {
      toast({
        title: 'Applying Updates',
        description: `Updating ${selected.length} suppliers...`,
      });

      for (const result of selected) {
        const { error } = await supabase.functions.invoke('update-supplier-csv', {
          body: {
            supplierId: result.supplierId,
            updates: {
              technologies: result.scrapedTechnologies.length > 0 ? result.scrapedTechnologies : undefined,
              materials: result.scrapedMaterials.length > 0 ? result.scrapedMaterials : undefined,
              location: result.scrapedLocation || undefined
            }
          }
        });

        if (error) {
          console.error(`Failed to update ${result.supplierName}:`, error);
        }
      }

      toast({
        title: 'Updates Complete',
        description: `Successfully processed ${selected.length} supplier updates`,
      });

      setSelectedUpdates(new Set());
    } catch (error) {
      console.error('Error applying updates:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply updates',
        variant: 'destructive'
      });
    } finally {
      setIsApplying(false);
    }
  };

  const getMatchIcon = (match: boolean) => {
    return match ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5" />
          Automated Validation
        </CardTitle>
        <CardDescription>
          Automatically scrape and validate all supplier data from their websites
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button 
            onClick={() => runScheduledValidation(false, true, 10)}
            disabled={isRunning}
            className="w-full"
            variant="default"
            size="lg"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Validate 10 Unverified Suppliers
              </>
            )}
          </Button>

          <Button 
            onClick={() => runScheduledValidation(true)}
            disabled={isRunning}
            className="w-full"
            variant="outline"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Validate Next Supplier
              </>
            )}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button 
            onClick={() => runScheduledValidation(false)}
            disabled={isRunning}
            className="w-full"
            variant="outline"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Validate Outdated Only
              </>
            )}
          </Button>

          <Button 
            onClick={runAutomatedValidation}
            disabled={isRunning}
            className="w-full"
            variant="outline"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Manual Validation (with results)
              </>
            )}
          </Button>
        </div>

        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
            {currentSupplier && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Currently validating: {currentSupplier}</span>
              </div>
            )}
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Validation Results</h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {results.filter(r => r.overallMatch).length} / {results.length} passed
                </Badge>
                {selectedUpdates.size > 0 && (
                  <Button 
                    onClick={applySelectedUpdates} 
                    disabled={isApplying}
                    size="sm"
                  >
                    {isApplying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Apply {selectedUpdates.size} Updates
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <Card 
                  key={index} 
                  className={`${result.overallMatch ? 'border-border' : 'border-destructive/50'} ${
                    selectedUpdates.has(result.supplierId) ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {result.overallMatch ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        )}
                        <span className="font-medium">{result.supplierName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={result.overallMatch ? 'default' : 'destructive'}>
                          {result.overallMatch ? 'Match' : 'Mismatch'}
                        </Badge>
                        {!result.overallMatch && (
                          <Button
                            variant={selectedUpdates.has(result.supplierId) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleUpdate(result.supplierId)}
                          >
                            {selectedUpdates.has(result.supplierId) ? 'Selected' : 'Select'}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {!result.technologiesMatch && (
                        <div className="p-2 bg-muted/50 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            {getMatchIcon(result.technologiesMatch)}
                            <span className="font-medium text-muted-foreground">Technologies:</span>
                          </div>
                          <div className="pl-6 space-y-1">
                            <div className="text-xs">
                              <span className="text-muted-foreground">Current:</span> {result.currentTechnologies?.join(', ') || 'None'}
                            </div>
                            <div className="text-xs">
                              <span className="text-green-600 font-medium">Scraped:</span> {result.scrapedTechnologies?.join(', ') || 'None found'}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {!result.materialsMatch && (
                        <div className="p-2 bg-muted/50 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            {getMatchIcon(result.materialsMatch)}
                            <span className="font-medium text-muted-foreground">Materials:</span>
                          </div>
                          <div className="pl-6 space-y-1">
                            <div className="text-xs">
                              <span className="text-muted-foreground">Current:</span> {result.currentMaterials?.join(', ') || 'None'}
                            </div>
                            <div className="text-xs">
                              <span className="text-green-600 font-medium">Scraped:</span> {result.scrapedMaterials?.join(', ') || 'None found'}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {!result.locationMatch && (
                        <div className="p-2 bg-muted/50 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            {getMatchIcon(result.locationMatch)}
                            <span className="font-medium text-muted-foreground">Location:</span>
                          </div>
                          <div className="pl-6 space-y-1">
                            <div className="text-xs">
                              <span className="text-muted-foreground">Current:</span> {result.currentLocation || 'None'}
                            </div>
                            <div className="text-xs">
                              <span className="text-green-600 font-medium">Scraped:</span> {result.scrapedLocation || 'Not found'}
                            </div>
                          </div>
                        </div>
                      )}

                      {result.overallMatch && (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-xs">All data matches - no updates needed</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
