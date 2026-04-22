import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LivePriceComparison } from '@/components/ui/live-price-comparison';
import SupplierMap from '@/components/ui/map';
import { ConfiguratorPanel, TECH_MATERIALS } from '@/components/stl-viewer/ConfiguratorPanel';
import { ViewerControls } from '@/components/stl-viewer/ViewerControls';
import { SearchProgress } from '@/components/search/SearchProgress';
import { useTriggerSTLMatch } from '@/hooks/use-trigger-stl-match';
import { useLiveQuotes } from '@/hooks/use-live-quotes';
import { parseSTL, type STLResult } from '@/lib/stlParser';
import { getEstimatedPrice } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/format';
import {
  resolvePriceInfo,
  sortMatchesByPrice,
  type SupplierPriceInfo,
} from '@/lib/supplier-price-matcher';
import { supabase } from '@/integrations/supabase/client';
import ErrorBoundary from '@/components/ErrorBoundary';

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

  // "ranking" is the intermediate state where matches are visible but
  // Claude explanations are still streaming in on subsequent polls.
  const isRanking = status === 'ranking';

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

  // If match-mode result is ready (even during "ranking" when explanations
  // are still streaming), show the result view.
  if (mode === 'match' && result) {
    return (
      <MatchResultView
        result={result}
        file={file}
        technology={technology}
        material={material}
        quantity={quantity}
        isRanking={isRanking}
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

              {matchLoading && <SearchProgress status={status as any} />}

              {mode === 'match' && !matchLoading && (
                <Button
                  onClick={handleFindSuppliers}
                  size="lg"
                  className={cn(
                    'sticky bottom-0 h-12 text-sm font-semibold',
                    'bg-primary hover:bg-primary/90',
                    'shadow-[0_8px_30px_hsl(87,20%,45%,0.25)]'
                  )}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Find suppliers for this part
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
  isRanking = false,
  onNew,
}: {
  result: any;
  file: File | null;
  technology: string;
  material: string;
  quantity: number;
  isRanking?: boolean;
  onNew: () => void;
}) {
  const { getQuotes, liveQuotes, isLoading: liveLoading } = useLiveQuotes({
    currency: 'EUR',
    countryCode: 'DK',
  });

  // Auto-fetch live quotes when the file/quantity changes (mirrors
  // LivePriceComparison's internal effect so quotes are available here for
  // per-supplier pairing — the response is cached inside the hook).
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    (async () => {
      let geometry;
      if (file.name.toLowerCase().endsWith('.stl')) {
        try {
          const buf = await file.arrayBuffer();
          const g = parseSTL(buf);
          geometry = {
            volumeCm3: g.volumeCm3,
            boundingBox: g.boundingBox,
            triangleCount: g.triangleCount,
          };
        } catch {
          // fall through without geometry
        }
      }
      if (!cancelled) getQuotes(file, quantity, geometry);
    })();
    return () => {
      cancelled = true;
    };
  }, [file, quantity, getQuotes]);

  // Rows lacking a supplier or matchDetails block would crash the unguarded
  // property access below. Partial-ranking polls can briefly produce these.
  const safeMatches = useMemo(
    () =>
      Array.isArray(result?.matches)
        ? result.matches.filter((m: any) => m?.supplier && m?.matchDetails)
        : [],
    [result]
  );

  const estimatedPrices = useMemo(
    () =>
      safeMatches.map((m: any) =>
        getEstimatedPrice(
          m.supplier.name ?? 'Unknown supplier',
          m.supplier.supplier_id,
          m.matchDetails.matchedTechnologies ?? [],
          m.supplier.logo_url || undefined
        )
      ),
    [safeMatches]
  );

  const priceInfo = useMemo(
    () => resolvePriceInfo(safeMatches, liveQuotes, estimatedPrices),
    [safeMatches, liveQuotes, estimatedPrices]
  );

  const sortedMatches = useMemo(
    () => sortMatchesByPrice(safeMatches, priceInfo),
    [safeMatches, priceInfo]
  );

  // Client-side geo lookup: MatchedSupplier doesn't carry lat/lng, so fetch
  // them by supplier_id after matches arrive. Avoids touching edge functions
  // or the Trigger.dev task.
  const [geoById, setGeoById] = useState<Map<string, { lat: number; lng: number }>>(new Map());
  useEffect(() => {
    const ids = safeMatches.map((m: any) => m.supplier.supplier_id).filter(Boolean);
    if (ids.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('suppliers')
          .select('supplier_id, location_lat, location_lng')
          .in('supplier_id', ids);
        if (cancelled || error || !data) return;
        const m = new Map<string, { lat: number; lng: number }>();
        for (const row of data) {
          if (row.location_lat != null && row.location_lng != null) {
            m.set(row.supplier_id, { lat: row.location_lat, lng: row.location_lng });
          }
        }
        setGeoById(m);
      } catch (err) {
        if (!cancelled) console.error('geo lookup failed', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [safeMatches]);

  const mapSuppliers = useMemo(
    () =>
      safeMatches
        .map((m: any) => {
          const geo = geoById.get(m.supplier.supplier_id);
          if (!geo) return null;
          const city = m.supplier.location_city || '';
          const country = m.supplier.location_country || m.supplier.region || '';
          return {
            id: m.supplier.supplier_id,
            name: m.supplier.name ?? 'Unknown supplier',
            location: {
              lat: geo.lat,
              lng: geo.lng,
              city,
              country,
              fullAddress: [city, country].filter(Boolean).join(', '),
            },
            technologies: m.supplier.technologies ?? [],
            materials: m.supplier.materials ?? [],
            verified: !!m.supplier.verified,
            rating: 0,
            website: m.supplier.website || undefined,
            logoUrl: m.supplier.logo_url || undefined,
          };
        })
        .filter(Boolean) as Array<any>,
    [safeMatches, geoById]
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
                  {safeMatches.length} suppliers matched
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
          <div className="grid lg:grid-cols-[1fr_480px] gap-4">
            <div className="space-y-3">
              {isRanking && (
                <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-primary">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Generating match explanations…
                </div>
              )}
              {liveLoading && liveQuotes.length === 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/30 px-3 py-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Fetching live prices from 90+ vendors…
                </div>
              )}
              {sortedMatches.map((match: any, i: number) => (
                <SupplierResultCard
                  key={match.supplier.supplier_id}
                  match={match}
                  rank={i + 1}
                  price={priceInfo.get(match.supplier.supplier_id) ?? { kind: 'none' }}
                  isRanking={isRanking}
                />
              ))}
            </div>
            <aside className="lg:sticky lg:top-4 lg:h-[calc(100vh-6rem)] min-h-[400px]">
              <ErrorBoundary
                fallback={
                  <div className="h-full min-h-[400px] rounded-xl border border-border/60 bg-card/30 flex items-center justify-center p-6 text-sm text-muted-foreground text-center">
                    Map unavailable
                  </div>
                }
              >
                <SupplierMap
                  suppliers={mapSuppliers}
                  height="100%"
                  className="rounded-xl overflow-hidden"
                  showControls
                />
              </ErrorBoundary>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}

function SupplierResultCard({
  match,
  rank,
  price,
  isRanking = false,
}: {
  match: any;
  rank: number;
  price: SupplierPriceInfo;
  isRanking?: boolean;
}) {
  const { supplier, score, matchDetails } = match;
  const hasExplanation = !!matchDetails.overallExplanation;
  return (
    <Link
      to={`/suppliers/${supplier.supplier_id}`}
      className={cn(
        'block rounded-xl border border-border/60 bg-card/50',
        'p-4 flex items-start gap-3',
        'hover:border-primary/40 hover:bg-card/70 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary/60'
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
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex items-center gap-1.5">
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{supplier.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {supplier.location_city ? `${supplier.location_city}, ` : ''}
                {supplier.location_country || supplier.region}
              </p>
            </div>
            {supplier.website && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  window.open(supplier.website, '_blank', 'noopener,noreferrer');
                }}
                aria-label={`Visit ${supplier.name} website`}
                className={cn(
                  'shrink-0 p-1 rounded-md text-muted-foreground',
                  'hover:text-primary hover:bg-primary/10',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                )}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <PriceBlock price={price} />
            <Badge variant="outline" className="text-[10px]">
              {score}% match
            </Badge>
          </div>
        </div>
        {hasExplanation ? (
          <p className="text-xs text-muted-foreground italic mt-1.5 line-clamp-2">
            "{matchDetails.overallExplanation}"
          </p>
        ) : isRanking ? (
          <div className="mt-1.5 space-y-1">
            <div className="h-2 w-11/12 rounded bg-muted-foreground/15 animate-pulse" />
            <div className="h-2 w-7/12 rounded bg-muted-foreground/15 animate-pulse" />
          </div>
        ) : null}
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
    </Link>
  );
}

function PriceBlock({ price }: { price: SupplierPriceInfo }) {
  if (price.kind === 'live') {
    const q = price.quote;
    return (
      <div className="text-right">
        <div className="flex items-center gap-1.5 justify-end">
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0 hover:bg-primary/15">
            Live
          </Badge>
          <span className="text-sm font-semibold text-primary whitespace-nowrap">
            {formatPrice(q.unitPrice, q.currency)}
          </span>
        </div>
        <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end mt-0.5 whitespace-nowrap">
          <Clock className="h-2.5 w-2.5" />
          {q.estimatedLeadTimeDays ? `${q.estimatedLeadTimeDays}d` : '—'} · via{' '}
          {q.source === 'craftcloud' ? 'Craftcloud' : 'Treatstock'}
        </div>
      </div>
    );
  }
  if (price.kind === 'estimate') {
    const e = price.estimate;
    return (
      <div className="text-right">
        <div className="flex items-center gap-1.5 justify-end">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground">
            Estimate
          </Badge>
          <span className="text-sm font-semibold whitespace-nowrap">{e.priceTier}</span>
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">
          ~{formatPrice(e.priceRangeLow, e.currency)} – {formatPrice(e.priceRangeHigh, e.currency)}
        </div>
      </div>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
      Request quote
    </Badge>
  );
}
