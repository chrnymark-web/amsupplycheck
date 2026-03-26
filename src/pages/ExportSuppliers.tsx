import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ExportSuppliers = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('export-suppliers-csv');

      if (error) {
        throw error;
      }

      // Create blob from the CSV data
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `suppliers-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Complete",
        description: "All suppliers have been exported to CSV.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export suppliers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Export Suppliers</h1>
        
        <div className="bg-card p-6 rounded-lg border">
          <p className="text-muted-foreground mb-6">
            Export all suppliers from the database to a CSV file. This will include all supplier information including technologies, materials, locations, and metadata.
          </p>
          
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            size="lg"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export All Suppliers to CSV
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportSuppliers;
