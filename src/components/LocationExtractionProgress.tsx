import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";

interface ProgressUpdate {
  total: number;
  current: number;
  currentSupplier: string | null;
  status: 'started' | 'processing' | 'scraping' | 'extracting' | 'success' | 'failed' | 'skipped' | 'low-confidence' | 'update-failed' | 'completed';
  reason?: string;
  error?: string;
  confidence?: number;
  extracted?: any;
}

interface LocationExtractionProgressProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
}

export default function LocationExtractionProgress({ 
  open, 
  onOpenChange, 
  sessionId 
}: LocationExtractionProgressProps) {
  const [progress, setProgress] = useState<ProgressUpdate | null>(null);
  const [statusHistory, setStatusHistory] = useState<Array<{ supplier: string; status: string; message: string }>>([]);

  useEffect(() => {
    if (!open || !sessionId) return;

    // Reset state when dialog opens
    setProgress(null);
    setStatusHistory([]);

    // Import supabase client dynamically to avoid issues
    import("@/integrations/supabase/client").then(({ supabase }) => {
      const channel = supabase.channel(`location-extraction-${sessionId}`);

      channel
        .on('broadcast', { event: 'progress' }, ({ payload }: { payload: ProgressUpdate }) => {
          console.log('Progress update:', payload);
          setProgress(payload);

          // Add to history
          if (payload.currentSupplier) {
            const message = getStatusMessage(payload);
            setStatusHistory(prev => [...prev, {
              supplier: payload.currentSupplier!,
              status: payload.status,
              message
            }].slice(-10)); // Keep last 10 entries
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    });
  }, [open, sessionId]);

  const getStatusMessage = (update: ProgressUpdate): string => {
    switch (update.status) {
      case 'started':
        return 'Starting extraction process...';
      case 'processing':
        return 'Processing...';
      case 'scraping':
        return 'Scraping website...';
      case 'extracting':
        return 'Extracting location data with AI...';
      case 'success':
        return `✓ Successfully extracted: ${update.extracted?.city || ''}, ${update.extracted?.country || ''}`;
      case 'failed':
        return `✗ Failed: ${update.reason || 'Unknown error'}`;
      case 'skipped':
        return `⊘ Skipped: ${update.reason || 'No reason'}`;
      case 'low-confidence':
        return `⚠ Low confidence (${update.confidence}%)`;
      case 'update-failed':
        return `✗ Update failed: ${update.error || 'Unknown error'}`;
      case 'completed':
        return 'Extraction completed!';
      default:
        return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
      case 'update-failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'skipped':
      case 'low-confidence':
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    }
  };

  const progressPercentage = progress ? Math.round((progress.current / progress.total) * 100) : 0;
  const isCompleted = progress?.status === 'completed';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Location Data Extraction</DialogTitle>
          <DialogDescription>
            Extracting location data from supplier websites using AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-auto">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {progress ? `${progress.current} of ${progress.total}` : 'Initializing...'}
              </span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Current Status */}
          {progress?.currentSupplier && !isCompleted && (
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
              <div>
                <div className="font-medium">{progress.currentSupplier}</div>
                <div className="text-sm text-muted-foreground">
                  {getStatusMessage(progress)}
                </div>
              </div>
            </div>
          )}

          {/* Status Badge */}
          {isCompleted && (
            <div className="flex items-center justify-center gap-2 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-600">Extraction Completed!</span>
            </div>
          )}

          {/* Status History */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Activity</h4>
            <div className="space-y-2 max-h-[300px] overflow-auto">
              {statusHistory.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No activity yet...
                </div>
              ) : (
                statusHistory.slice().reverse().map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg text-sm"
                  >
                    {getStatusIcon(item.status)}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.supplier}</div>
                      <div className="text-muted-foreground text-xs">{item.message}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
