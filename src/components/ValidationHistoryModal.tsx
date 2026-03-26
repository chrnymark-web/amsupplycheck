import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface ValidationResult {
  id: string;
  scraped_at: string;
  overall_match: boolean | null;
  overall_confidence: number;
  technologies_match: boolean | null;
  materials_match: boolean | null;
  location_match: boolean | null;
  technologies_confidence: number;
  materials_confidence: number;
  location_confidence: number;
  scraping_errors: any;
  notes: string | null;
  puppeteer_success: boolean | null;
  scraping_time_ms: number | null;
  cache_hit: boolean | null;
}

interface ValidationHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string | null;
  supplierName: string;
}

export default function ValidationHistoryModal({
  open,
  onOpenChange,
  supplierId,
  supplierName,
}: ValidationHistoryModalProps) {
  const [history, setHistory] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && supplierId) {
      fetchHistory();
    }
  }, [open, supplierId]);

  const fetchHistory = async () => {
    if (!supplierId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("validation_results")
        .select("*")
        .eq("supplier_id", supplierId)
        .order("scraped_at", { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Error fetching validation history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (match: boolean | null) => {
    if (match === null) return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    return match ? (
      <CheckCircle2 className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-destructive" />
    );
  };

  const getConfidenceBadge = (confidence: number) => {
    const variant = confidence >= 0.8 ? "default" : confidence >= 0.5 ? "secondary" : "destructive";
    return (
      <Badge variant={variant}>
        {Math.round(confidence * 100)}%
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Validation History: {supplierName}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-[60vh]">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No validation history found
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((result) => (
                <div key={result.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.overall_match)}
                      <span className="font-medium">
                        {format(new Date(result.scraped_at), "PPp")}
                      </span>
                    </div>
                    {getConfidenceBadge(result.overall_confidence)}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground mb-1">Technologies</div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.technologies_match)}
                        {getConfidenceBadge(result.technologies_confidence)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Materials</div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.materials_match)}
                        {getConfidenceBadge(result.materials_confidence)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Location</div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.location_match)}
                        {getConfidenceBadge(result.location_confidence)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {result.cache_hit && <Badge variant="outline">Cache Hit</Badge>}
                    {result.puppeteer_success && <Badge variant="outline">Puppeteer</Badge>}
                    {result.scraping_time_ms && (
                      <span>{result.scraping_time_ms}ms</span>
                    )}
                  </div>

                  {result.scraping_errors && Array.isArray(result.scraping_errors) && result.scraping_errors.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-sm font-medium text-destructive mb-2">Errors:</div>
                        <div className="space-y-1">
                          {result.scraping_errors.map((error: any, idx: number) => (
                            <div key={idx} className="text-xs text-muted-foreground bg-destructive/10 p-2 rounded">
                              {typeof error === "string" ? error : error.message || JSON.stringify(error)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {result.notes && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-sm font-medium mb-1">Notes:</div>
                        <div className="text-sm text-muted-foreground">{result.notes}</div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
