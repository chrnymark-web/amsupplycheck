import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  Sparkles,
  Loader2,
  X,
  CheckCircle2,
  Box,
  Layers,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LivePriceComparison } from '@/components/ui/live-price-comparison';
import { ConfiguratorPanel, TECH_MATERIALS } from '@/components/stl-viewer/ConfiguratorPanel';
import { ViewerControls } from '@/components/stl-viewer/ViewerControls';
import { SearchProgress } from '@/components/search/SearchProgress';
import { useTriggerSTLMatch } from '@/hooks/use-trigger-stl-match';
import { parseSTL, type STLResult } from '@/lib/stlParser';
import { getEstimatedPrice } from '@/lib/api';
import { cn } from '@/lib/utils';

const STLViewer = lazy(() => import('@/components/stl-viewer/STLViewer'));

interface InstantQuoteProps {
  mode?: 'match' | 'compare';
}

const ACCEPTED_EXTS = ['.stl', '.obj', '.3mf', '.step', '.stp'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export default function InstantQuote({ mode = 'match' }: InstantQuoteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    triggerSTLMatch,
    status,
    isLoading: matchLoading,
    error: matchError,
    result,
    reset: resetMatch,
  } = useTriggerSTLMatch();

  const [file, setFile] = useState<File | null>(null);
  const [metrics, setMetrics] = useState<STLResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configurator state
  const [technology, setTechnology] = useState('SLS');
  const [material, setMaterial] = useState('PA-12');
  const [color, setColor] = useState('natural');
  const [finish, setFinish] = useState('standard');
  const [quantity, setQuantity] = useState(1);

  // Viewer state
  const [wireframe, setWireframe] = useState(false);
  const [showDimensions, setShowDimensions] = useState(true);
  const [resetTrigger, setResetTrigger] = useState(0);

  const handleFile = useCallback(async (f: File) => {
    const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'));
    if (!ACCEPTED_EXTS.includes(ext)) return;
    if (f.size > MAX_FILE_SIZE) return;
    setFile(f);
    // Parse STL geometry for dimension/volume readout (only for .stl; others skip)
    if (ext === '.stl') {
      try {
        const buf = await f.arrayBuffer();
        setMetrics(parseSTL(buf));
      } catch {
        setMetrics(null);
      }
    } else {
      setMetrics(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setMetrics(null);
    resetMatch();
    // Clear any handoff state so navigating back doesn't re-load the file.
    if (location.state && (location.state as any).uploadedFile) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [resetMatch, location, navigate]);

  // Pick up file handed off via router state (e.g. from homepage PriceCalculator)
  useEffect(() => {
    const incoming = (location.state as any)?.uploadedFile as File | undefined;
    if (incoming && !file) {
      handleFile(incoming);
    }
    // Only run once on mount / when location state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const handleFindSuppliers = useCallback(async () => {
    if (!file) return;
    await triggerSTLMatch({ file, technology, material, quantity });
  }, [file, technology, material, quantity, triggerSTLMatch]);

  const pageTitle = mode === 'match' ? 'Find Suppliers — Instant STL Quote' : 'Live Price Comparison — Instant STL Quote';
  const pageDescription = mode === 'match'
    ? 'Upload your STL and see an interactive 3D preview with live prices from 90+ vendors.'
    : 'Compare live prices from 90+ 3D printing vendors. Upload your STL for instant quotes.';

  // If match-mode result is ready, show the result view
  if (mode === 'match' && result) {
    return (
      <MatchResultView
        result={result}
        file={file}
        technology={technology}
        material={material}
        quantity={quantity}
        onNew={handleRemoveFile}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>{pageTitle} | SupplyCheck</title>
        <meta name="description" content={pageDescription} />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        {/* Thin top bar */}
        <header className="border-b border-border/60 bg-card/50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3 px-4 py-2.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-8 w-8 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {file ? (
              <>
                <div className="flex items-center gap-2 min-w-0">
                  <Box className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {(file.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>

                {metrics && (
                  <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground ml-4 border-l border-border/60 pl-4">
                    <span className="font-mono">{(metrics.triangleCount / 1000).toFixed(1)}k triangles</span>
                  </div>
                )}

                <div className="ml-auto flex items-center gap-2">
                  <span className="hidden sm:inline text-[11px] uppercase tracking-wider text-muted-foreground">
                    {mode === 'match' ? 'Supplier Match' : 'Price Compare'}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    className="h-8 w-8"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                <h1 className="text-sm font-semibold">
                  {mode === 'match' ? 'Find Suppliers for Your Part' : 'Live Price Comparison'}
                </h1>
              </div>
            )}
          </div>
        </header>

        {/* Main content */}
        {!file ? (
          <UploadLanding
            onFile={handleFile}
            onDrop={handleDrop}
            dragActive={dragActive}
            setDragActive={setDragActive}
            fileInputRef={fileInputRef}
            mode={mode}
          />
        ) : (
          <main className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-[1fr_420px] lg:gap-4 p-3 lg:p-4">
            {/* Viewer (left / top on mobile) */}
            <div className="relative rounded-xl overflow-hidden border border-border/60 bg-card/30 min-h-[320px] lg:min-h-0 h-[40vh] lg:h-auto">
              <Suspense
                fallback={
                  <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,hsl(87,20%,45%,0.08),transparent_70%)]">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading 3D viewer
                    </div>
                  </div>
                }
              >
                <STLViewer file={file} wireframe={wireframe} resetTrigger={resetTrigger} />
              </Suspense>

              <ViewerControls
                wireframe={wireframe}
                onToggleWireframe={() => setWireframe((v) => !v)}
                onResetView={() => setResetTrigger((v) => v + 1)}
                showDimensions={showDimensions}
                onToggleDimensions={() => setShowDimensions((v) => !v)}
                dimensions={metrics?.boundingBox}
                volumeCm3={metrics?.volumeCm3}
              />
            </div>

            {/* Right panel: configurator + prices + CTA */}
            <aside className="flex flex-col gap-3 mt-3 lg:mt-0 lg:overflow-y-auto lg:h-[calc(100vh-65px)] lg:pr-1">
              <ConfiguratorPanel
                technology={technology}
                material={material}
                color={color}
                finish={finish}
                quantity={quantity}
                onTechnologyChange={setTechnology}
                onMaterialChange={setMaterial}
                onColorChange={setColor}
                onFinishChange={setFinish}
                onQuantityChange={setQuantity}
              />

              <LivePriceComparison
                file={file}
                quantity={quantity}
                hideUpload
                currency="EUR"
                countryCode="DK"
              />

              {matchError && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {matchError}
                </div>
              )}

              {matchLoading && (
                <div className="rounded-xl border border-border/60 bg-card/60 p-3">
                  <SearchProgress status={status as any} />
                </div>
              )}

              {mode === 'match' && (
                <Button
                  onClick={handleFindSuppliers}
                  disabled={matchLoading}
                  size="lg"
                  className={cn(
                    'sticky bottom-0 h-12 text-sm font-semibold',
                    'bg-primary hover:bg-primary/90',
                    'shadow-[0_8px_30px_hsl(87,20%,45%,0.25)]'
                  )}
                >
                  {matchLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Finding suppliers…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Find suppliers for this part
                    </>
                  )}
                </Button>
              )}
            </aside>
          </main>
        )}
      </div>
    </>
  );
}

/* -------------------- Subcomponents -------------------- */

function UploadLanding({
  onFile,
  onDrop,
  dragActive,
  setDragActive,
  fileInputRef,
  mode,
}: {
  onFile: (f: File) => void;
  onDrop: (e: React.DragEvent) => void;
  dragActive: boolean;
  setDragActive: (v: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  mode: 'match' | 'compare';
}) {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Layered radial gradients (Anti-Generic Guardrails) */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 30% 20%, hsl(87, 20%, 45%, 0.08), transparent 60%), radial-gradient(ellipse 60% 40% at 70% 80%, hsl(87, 22%, 50%, 0.05), transparent 50%)',
        }}
      />

      <div className="relative z-10 w-full max-w-2xl">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-primary mb-4">
            <Sparkles className="h-3 w-3" />
            {mode === 'match' ? 'Instant Supplier Match' : 'Live Price Comparison'}
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold text-foreground mb-2 tracking-tight">
            Upload your 3D model
          </h1>
          <p className="text-sm text-muted-foreground">
            Get an interactive preview and{' '}
            {mode === 'match' ? 'match with the best-fit suppliers' : 'live prices from 90+ vendors'} in seconds.
          </p>
        </div>

        <label
          htmlFor="stl-upload"
          onDrop={onDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          className={cn(
            'block rounded-2xl border-2 border-dashed cursor-pointer',
            'p-10 sm:p-14 text-center',
            'transition-[border-color,background-color,transform] duration-200',
            'hover:scale-[1.005] active:scale-[0.998]',
            dragActive
              ? 'border-primary bg-primary/5 shadow-[0_0_0_4px_hsl(87,20%,45%,0.1)]'
              : 'border-border/70 bg-card/40 hover:border-primary/50 hover:bg-card/60'
          )}
        >
          <input
            ref={fileInputRef}
            id="stl-upload"
            type="file"
            accept=".stl,.obj,.3mf,.step,.stp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
          <div
            className={cn(
              'mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl',
              'border border-primary/20 bg-primary/10',
              'transition-transform duration-200',
              dragActive && 'scale-110'
            )}
          >
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <p className="text-base font-medium text-foreground mb-1">
            Drop your file here or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            STL, OBJ, 3MF, STEP · max 100 MB
          </p>
        </label>

        {/* Feature row */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <FeatureChip icon={<Box className="h-3.5 w-3.5" />} label="3D preview" />
          <FeatureChip icon={<Layers className="h-3.5 w-3.5" />} label="Live prices" />
          <FeatureChip icon={<Package className="h-3.5 w-3.5" />} label="90+ vendors" />
        </div>
      </div>
    </main>
  );
}

function FeatureChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-card/30 px-3 py-2 text-xs text-muted-foreground">
      <span className="text-primary">{icon}</span>
      {label}
    </div>
  );
}

function MatchResultView({
  result,
  file,
  technology,
  material,
  quantity,
  onNew,
}: {
  result: any;
  file: File | null;
  technology: string;
  material: string;
  quantity: number;
  onNew: () => void;
}) {
  const estimatedPrices = useMemo(
    () =>
      result.matches.map((m: any) =>
        getEstimatedPrice(
          m.supplier.name,
          m.supplier.supplier_id,
          m.matchDetails.matchedTechnologies || [],
          m.supplier.logo_url || undefined
        )
      ),
    [result]
  );

  return (
    <>
      <Helmet>
        <title>Supplier matches | SupplyCheck</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/60 bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {result.matches.length} suppliers matched
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {technology} · {material} · {quantity} pcs
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onNew}>
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              New upload
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-[1fr_420px] gap-4">
            <div className="space-y-3">
              {result.matches.map((match: any, i: number) => (
                <SupplierResultCard key={match.supplier.supplier_id} match={match} rank={i + 1} />
              ))}
            </div>
            <aside className="lg:sticky lg:top-4 lg:h-fit">
              <LivePriceComparison
                file={file}
                quantity={quantity}
                hideUpload
                estimatedPrices={estimatedPrices}
                currency="EUR"
                countryCode="DK"
              />
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}

function SupplierResultCard({ match, rank }: { match: any; rank: number }) {
  const { supplier, score, matchDetails } = match;
  return (
    <div
      className={cn(
        'rounded-xl border border-border/60 bg-card/50',
        'p-4 flex items-start gap-3',
        'hover:border-primary/40 hover:bg-card/70 transition-colors'
      )}
    >
      <div
        className={cn(
          'shrink-0 flex items-center justify-center h-9 w-9 rounded-lg text-xs font-bold',
          rank === 1 && 'bg-yellow-400/20 text-yellow-300 ring-1 ring-yellow-400/30',
          rank === 2 && 'bg-zinc-300/20 text-zinc-300 ring-1 ring-zinc-400/30',
          rank === 3 && 'bg-orange-400/20 text-orange-300 ring-1 ring-orange-400/30',
          rank > 3 && 'bg-muted text-muted-foreground'
        )}
      >
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{supplier.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {supplier.location_city ? `${supplier.location_city}, ` : ''}
              {supplier.location_country || supplier.region}
            </p>
          </div>
          <Badge
            variant={score >= 70 ? 'default' : score >= 50 ? 'secondary' : 'outline'}
            className="text-[10px] shrink-0"
          >
            {score}% match
          </Badge>
        </div>
        {matchDetails.overallExplanation && (
          <p className="text-xs text-muted-foreground italic mt-1.5 line-clamp-2">
            "{matchDetails.overallExplanation}"
          </p>
        )}
        <div className="flex flex-wrap gap-1 mt-2">
          {matchDetails.matchedTechnologies.slice(0, 3).map((tech: string) => (
            <Badge key={tech} variant="secondary" className="text-[10px] px-1.5 py-0">
              {tech}
            </Badge>
          ))}
          {matchDetails.matchedMaterials.slice(0, 2).map((mat: string) => (
            <Badge key={mat} variant="outline" className="text-[10px] px-1.5 py-0">
              {mat}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
