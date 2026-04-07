import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, XCircle, Loader2, FileText, Box, Ruler, ChevronDown, ExternalLink, AlertTriangle } from 'lucide-react';

interface MaterialInfo {
  materialId: number;
  title?: string;
  printable?: string;
  isPrintable?: boolean;
}

interface PrintabilityResult {
  result: string;
  modelId?: number;
  modelVersion?: number;
  title?: string;
  fileName?: string;
  contentLength?: number;
  fileSizeBytes?: number;
  printable?: string;
  materials?: Record<string, MaterialInfo>;
  boundingBox?: {
    x: number;
    y: number;
    z: number;
  };
  [key: string]: unknown;
}

interface ShapewaysPrintabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  error: string | null;
  result: PrintabilityResult | null;
  fileName: string;
}

function getMaterialLabel(m: MaterialInfo): string {
  return m.title || `Material #${m.materialId}`;
}

function isMaterialPrintable(m: MaterialInfo): boolean {
  // Handle both string "yes"/"1" and boolean true
  if (typeof m.printable === 'string') {
    return m.printable.toLowerCase() === 'yes' || m.printable === '1';
  }
  return !!m.isPrintable;
}

export const ShapewaysPrintabilityDialog: React.FC<ShapewaysPrintabilityDialogProps> = ({
  open,
  onOpenChange,
  loading,
  error,
  result,
  fileName,
}) => {
  const [showUnprintable, setShowUnprintable] = useState(false);

  const allMaterials = result?.materials ? Object.values(result.materials) : [];
  const printableMaterials = allMaterials.filter(isMaterialPrintable);
  const unprintableMaterials = allMaterials.filter((m) => !isMaterialPrintable(m));
  const totalCount = allMaterials.length;
  const printableCount = printableMaterials.length;
  const printablePercent = totalCount > 0 ? Math.round((printableCount / totalCount) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Box className="h-5 w-5 text-primary" />
            Shapeways Printability Check
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {fileName}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing your file with Shapeways...</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-center gap-2 text-destructive font-medium mb-1">
              <XCircle className="h-4 w-4" />
              Error
            </div>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-4">
            {/* Upload status */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              {result.result === 'success' ? (
                <CheckCircle className="h-6 w-6 text-green-500 shrink-0" />
              ) : (
                <XCircle className="h-6 w-6 text-destructive shrink-0" />
              )}
              <div>
                <p className="font-semibold text-foreground">
                  {result.result === 'success' ? 'Model uploaded successfully' : 'Upload issue'}
                </p>
                {result.modelId && (
                  <p className="text-xs text-muted-foreground">Model ID: {result.modelId}</p>
                )}
              </div>
            </div>

            {/* Bounding box */}
            {result.boundingBox && (
              <div className="p-3 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Ruler className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Dimensions (mm)</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {(['x', 'y', 'z'] as const).map((axis) => (
                    <div key={axis} className="bg-muted/50 rounded p-2">
                      <div className="text-xs text-muted-foreground uppercase">{axis}</div>
                      <div className="font-mono font-medium">{result.boundingBox![axis].toFixed(1)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Printability summary */}
            {totalCount > 0 && (
              <div className="p-3 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Printable in {printableCount} of {totalCount} materials
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">{printablePercent}%</span>
                </div>
                <Progress value={printablePercent} className="h-2" />

                {printableCount === 0 && (
                  <div className="flex items-start gap-2 p-2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <p className="text-xs">
                      This model cannot be printed in any available material. Consider adjusting wall thickness or dimensions.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Printable materials */}
            {printableCount > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Printable Materials ({printableCount})
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {printableMaterials.slice(0, 15).map((m) => (
                    <Badge key={m.materialId} variant="secondary" className="text-xs">
                      {getMaterialLabel(m)}
                    </Badge>
                  ))}
                  {printableCount > 15 && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      +{printableCount - 15} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Non-printable materials (collapsible) */}
            {unprintableMaterials.length > 0 && (
              <Collapsible open={showUnprintable} onOpenChange={setShowUnprintable}>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
                    <XCircle className="h-4 w-4" />
                    <span>Not Printable ({unprintableMaterials.length})</span>
                    <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${showUnprintable ? 'rotate-180' : ''}`} />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="flex flex-wrap gap-1.5">
                    {unprintableMaterials.map((m) => (
                      <Badge key={m.materialId} variant="outline" className="text-xs text-muted-foreground">
                        {getMaterialLabel(m)}
                      </Badge>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* CTA */}
            <Button asChild className="w-full mt-2">
              <a
                href="https://www.shapeways.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Instant Quote on Shapeways
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShapewaysPrintabilityDialog;
