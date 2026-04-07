import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Settings, Play, Database, Pause, RotateCcw, BarChart3 } from "lucide-react";

interface ValidationConfigData {
  enabled: boolean;
  auto_approve_missing_data: boolean;
  auto_approve_technology_updates: boolean;
  auto_approve_material_updates: boolean;
  auto_approve_location_updates: boolean;
  validation_schedule_cron: string;
  validation_paused: boolean;
  validations_this_month: number;
  monthly_validation_limit: number;
}

export const ValidationConfig = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<ValidationConfigData>({
    enabled: false,
    auto_approve_missing_data: false,
    auto_approve_technology_updates: false,
    auto_approve_material_updates: false,
    auto_approve_location_updates: false,
    validation_schedule_cron: '0 2 * * 0',
    validation_paused: false,
    validations_this_month: 0,
    monthly_validation_limit: 76
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isRunningValidation, setIsRunningValidation] = useState(false);
  const [isTestingAI, setIsTestingAI] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('validation_config')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single();

      if (error) throw error;
      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Failed to load configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('validation_config')
        .update(config)
        .eq('id', '00000000-0000-0000-0000-000000000001');

      if (error) throw error;
      toast.success('Configuration saved successfully');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const importCsvData = async () => {
    setIsImporting(true);
    try {
      // Fetch CSV content from public folder
      const csvResponse = await fetch('/suppliers.csv');
      if (!csvResponse.ok) {
        throw new Error('Failed to fetch CSV file');
      }
      const csvContent = await csvResponse.text();
      
      // Send CSV content to edge function
      const { data, error } = await supabase.functions.invoke('import-suppliers-csv', {
        body: { csvContent }
      });
      
      if (error) throw error;
      
      toast.success(`Successfully imported ${data.imported} suppliers`);
      console.log('Import results:', data);
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast.error('Failed to import CSV data');
    } finally {
      setIsImporting(false);
    }
  };

  const runManualValidation = async () => {
    setIsRunningValidation(true);
    try {
      console.log('🚀 Starting manual validation...');
      
      // Get the current session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('❌ No session found');
        throw new Error('Not authenticated. Please sign in again.');
      }

      console.log('✅ Session found, invoking edge function...');

      const { data, error } = await supabase.functions.invoke('scheduled-validation', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        body: {}
      });
      
      console.log('Edge function response:', { data, error });
      
      if (error) {
        console.error('❌ Edge function error:', error);
        throw new Error(`Edge function error: ${error.message || JSON.stringify(error)}`);
      }

      // Handle edge function returning error in data
      if (data && !data.success && data.error) {
        console.error('❌ Validation failed:', data.error);
        throw new Error(data.error);
      }
      
      console.log('✅ Validation completed successfully');
      toast.success(`Validated ${data?.validated || 0} suppliers, auto-updated ${data?.updated || 0}`);
      console.log('Validation results:', data);
      await loadConfig(); // Reload to get updated counter
    } catch (error) {
      console.error('❌ Error running validation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed: ${errorMessage}`);
    } finally {
      setIsRunningValidation(false);
    }
  };

  const togglePause = async () => {
    const newPausedState = !config.validation_paused;
    setConfig({ ...config, validation_paused: newPausedState });
    
    try {
      const { error } = await supabase
        .from('validation_config')
        .update({ validation_paused: newPausedState })
        .eq('id', '00000000-0000-0000-0000-000000000001');

      if (error) throw error;
      toast.success(newPausedState ? 'Validation paused' : 'Validation resumed');
    } catch (error) {
      console.error('Error toggling pause:', error);
      toast.error('Failed to toggle pause');
      setConfig({ ...config, validation_paused: !newPausedState });
    }
  };

  const resetCounter = async () => {
    try {
      const { error } = await supabase
        .from('validation_config')
        .update({ validations_this_month: 0 })
        .eq('id', '00000000-0000-0000-0000-000000000001');

      if (error) throw error;
      setConfig({ ...config, validations_this_month: 0 });
      toast.success('Counter reset successfully');
    } catch (error) {
      console.error('Error resetting counter:', error);
      toast.error('Failed to reset counter');
    }
  };

  const testLovableAI = async () => {
    setIsTestingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-lovable-ai', {
        body: {}
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`✅ Lovable AI connection working! Response: "${data.ai_response}" (${data.duration_ms}ms)`);
      } else {
        toast.error(`❌ Lovable AI test failed: ${data.error} (Status: ${data.status})`);
        console.error('Test failed:', data);
      }
    } catch (error) {
      console.error('Error testing Lovable AI:', error);
      toast.error('Failed to test Lovable AI connection');
    } finally {
      setIsTestingAI(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Automation Configuration</h2>
          </div>
          <Button 
            onClick={() => navigate('/admin/dashboard')} 
            variant="outline"
            size="sm"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            View Dashboard
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <Label htmlFor="enabled" className="font-medium">Enable Automated Validation</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Runs 8 times daily (every 3 hours) using 100% Firecrawl. Max 8 suppliers/day = ~240/month, ~80 Firecrawl credits/day (~2,400/month).
              </p>
            </div>
            <Switch
              id="enabled"
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
            />
          </div>

          <div className="space-y-3 pl-4 border-l-2 border-primary/20">
            <p className="text-xs text-muted-foreground mb-2">
              ⚠️ Enable these to automatically apply validated data to suppliers
            </p>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-missing" className="text-sm font-medium">Auto-approve missing data (logos)</Label>
                <p className="text-xs text-muted-foreground">Add logos when they're found but missing</p>
              </div>
              <Switch
                id="auto-missing"
                checked={config.auto_approve_missing_data}
                onCheckedChange={(checked) => setConfig({ ...config, auto_approve_missing_data: checked })}
                disabled={!config.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-tech" className="text-sm font-medium">Auto-approve technology updates</Label>
                <p className="text-xs text-muted-foreground">Update technologies when they differ</p>
              </div>
              <Switch
                id="auto-tech"
                checked={config.auto_approve_technology_updates}
                onCheckedChange={(checked) => setConfig({ ...config, auto_approve_technology_updates: checked })}
                disabled={!config.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-material" className="text-sm font-medium">Auto-approve material updates</Label>
                <p className="text-xs text-muted-foreground">Update materials when they differ</p>
              </div>
              <Switch
                id="auto-material"
                checked={config.auto_approve_material_updates}
                onCheckedChange={(checked) => setConfig({ ...config, auto_approve_material_updates: checked })}
                disabled={!config.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-location" className="text-sm font-medium">Auto-approve location updates</Label>
                <p className="text-xs text-muted-foreground">Update location when it differs</p>
              </div>
              <Switch
                id="auto-location"
                checked={config.auto_approve_location_updates}
                onCheckedChange={(checked) => setConfig({ ...config, auto_approve_location_updates: checked })}
                disabled={!config.enabled}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            onClick={saveConfig} 
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Configuration
          </Button>
        </div>

        <div className="border-t pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Monthly Usage & Budget</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{config.validations_this_month}</span>
              <span className="text-sm text-muted-foreground">/ {config.monthly_validation_limit} validations</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Estimated cost this month:</span>
            <span className="font-medium">${(config.validations_this_month * 0.02).toFixed(2)} / ${(config.monthly_validation_limit * 0.02).toFixed(2)}</span>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Validates 1 supplier per run using 100% Firecrawl. Runs 8 times daily (every 3 hours = ~240/month). ~10 Firecrawl credits per validation. Auto-pauses when limit reached.
          </p>
          
          <div className="flex gap-2">
            <Button 
              onClick={togglePause} 
              variant={config.validation_paused ? "default" : "outline"}
              className="flex-1"
            >
              {config.validation_paused ? (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Resume Validation
                </>
              ) : (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause Validation
                </>
              )}
            </Button>
            
            <Button 
              onClick={resetCounter} 
              variant="outline"
              size="icon"
              title="Reset monthly counter"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {config.validation_paused && (
            <p className="text-sm text-amber-600 dark:text-amber-500">
              ⚠️ Automatic validation is currently paused
            </p>
          )}
        </div>

        <div className="border-t pt-6 space-y-3">
          <h3 className="font-medium">Manual Actions</h3>
          
          <Button 
            onClick={importCsvData} 
            disabled={isImporting}
            variant="outline"
            className="w-full"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing CSV...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Import Main CSV to Database
              </>
            )}
          </Button>

          <Button 
            onClick={async () => {
              setIsImporting(true);
              try {
                const csvResponse = await fetch('/addidex_suppliers.csv');
                if (!csvResponse.ok) throw new Error('Failed to fetch Addidex CSV');
                const csvContent = await csvResponse.text();
                
                const { data, error } = await supabase.functions.invoke('import-addidex-suppliers', {
                  body: { csvContent }
                });
                
                if (error) throw error;
                toast.success(`Imported ${data.imported} new Addidex suppliers (skipped ${data.skipped})`);
              } catch (error) {
                console.error('Error importing Addidex CSV:', error);
                toast.error('Failed to import Addidex suppliers');
              } finally {
                setIsImporting(false);
              }
            }}
            disabled={isImporting}
            variant="outline"
            className="w-full"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing Addidex...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Import Addidex Suppliers
              </>
            )}
          </Button>

          <Button 
            onClick={runManualValidation} 
            disabled={isRunningValidation}
            variant="outline"
            className="w-full"
          >
            {isRunningValidation ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Validation...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run Validation Now
              </>
            )}
          </Button>

          <Button 
            onClick={testLovableAI} 
            disabled={isTestingAI}
            variant="secondary"
            className="w-full"
          >
            {isTestingAI ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                <Settings className="mr-2 h-4 w-4" />
                Test Lovable AI Connection
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            Manual validation processes 1 supplier at a time. Uses 100% Firecrawl (~10 credits) + Lovable AI for analysis.
          </p>
          
          {config.validations_this_month >= config.monthly_validation_limit && (
            <p className="text-sm text-amber-600 dark:text-amber-500 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
              ⚠️ Monthly budget limit reached ({config.validations_this_month}/{config.monthly_validation_limit} = ${(config.validations_this_month * 0.13).toFixed(2)}). Automatic validation paused until next month.
            </p>
          )}
        </div>
      </div>
    </Card>
  );
};
