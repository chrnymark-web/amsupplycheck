import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
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
  Globe,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FilterPanel, { type FilterState } from '@/components/ui/filter-panel';
import { LivePriceComparison } from '@/components/ui/live-price-comparison';
import SupplierMap from '@/components/ui/map';
import { ConfiguratorPanel } from '@/components/stl-viewer/ConfiguratorPanel';
import { ViewerControls } from '@/components/stl-viewer/ViewerControls';
import { SearchProgress } from '@/components/search/SearchProgress';
import { useTriggerSTLMatch } from '@/hooks/use-trigger-stl-match';
import { useLiveQuotes } from '@/hooks/use-live-quotes';
import { type STLResult } from '@/lib/stlParser';
import { parseSTLInWorker } from '@/lib/stlParserClient';
import { getEstimatedPrice } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/format';
import {
  resolvePriceInfo,
  sortMatchesByPrice,
  type SupplierPriceInfo,
  type PriceInfoCache,
} from '@/lib/supplier-price-matcher';
import { supabase } from '@/integrations/supabase/client';
import ErrorBoundary from '@/components/ErrorBoundary';
import logo from '@/assets/amsupplycheck-logo-white.png';
import { trace, endTrace, timed, readLastDiagnostics, PERF_STORAGE_KEY } from '@/lib/perf-trace';
import { isHidden, onVisible } from '@/lib/visibility';

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

  // Configurator state — empty string = "Any" (no filter)
  const [technology, setTechnology] = useState('');
  const [material, setMaterial] = useState('');
  const [color, setColor] = useState('natural');
  const [finish, setFinish] = useState('standard');
  const [area, setArea] = useState('');
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
    // Parse STL geometry for dimension/volume readout (only for .stl; others skip).
    // Runs in a Web Worker — a 500k-triangle file would otherwise freeze the
    // main thread for several seconds while the user is staring at the upload UI.
    if (ext === '.stl') {
      try {
        setMetrics(await parseSTLInWorker(f));
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
    await triggerSTLMatch({ file, technology, material, quantity, area });
  }, [file, technology, material, quantity, area, triggerSTLMatch]);

  const pageTitle = mode === 'match' ? 'Find Suppliers — Instant STL Quote' : 'Live Price Comparison — Instant STL Quote';
  const pageDescription = mode === 'match'
    ? 'Upload your STL and see an interactive 3D preview with live prices from 90+ vendors.'
    : 'Compare live prices from 90+ 3D printing vendors. Upload your STL for instant quotes.';

  // If match-mode result is ready (even during "ranking" when explanations
  // are still streaming), show the result view.
  if (mode === 'match' && result) {
    return (
      <>
        {/* Render the diagnostic button BEFORE MatchResultView so React
            reconciles the lightweight button first. If MatchResultView's
            heavy first render were to block the main thread, the button's
            element is at least at the head of the tree React is committing. */}
        <DiagnosticsButton />
        <MatchResultView
          result={result}
          file={file}
          technology={technology}
          material={material}
          quantity={quantity}
          area={area}
          isRanking={isRanking}
          onNew={handleRemoveFile}
          parsedMetrics={metrics}
        />
      </>
    );
  }

  return (
    <>
      {/* Mounted on every InstantQuote render path when ?debug=perf is in URL.
          Lives outside MatchResultView so it survives the upload→match
          transition and is in DOM from the very first paint. */}
      <DiagnosticsButton />
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
            {/* Viewer (left / top on mobile). The r3f Canvas holds GPU buffers,
                shadows and an `observe`-mode bounds tick; for big STLs that's
                hot enough to compete with the matching pipeline. We unmount
                it the moment the search starts, then bring it back when the
                results render — the user is staring at the search progress
                anyway. */}
            <div className="relative rounded-xl overflow-hidden border border-border/60 bg-card/30 min-h-[320px] lg:min-h-0 h-[40vh] lg:h-auto">
              {matchLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(ellipse_at_center,hsl(87,20%,45%,0.1),hsl(0,0%,6%)_70%)]">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">3D preview paused while we search</p>
                </div>
              ) : (
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
              )}

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
                area={area}
                quantity={quantity}
                onTechnologyChange={setTechnology}
                onMaterialChange={setMaterial}
                onColorChange={setColor}
                onFinishChange={setFinish}
                onAreaChange={setArea}
                onQuantityChange={setQuantity}
              />

              {mode === 'compare' && (
                <LivePriceComparison
                  file={file}
                  quantity={quantity}
                  area={area}
                  technology={technology}
                  material={material}
                  hideUpload
                  currency="EUR"
                  countryCode="DK"
                />
              )}

              {matchError && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {matchError}
                </div>
              )}

              {matchLoading && <SearchProgress status={status as any} />}

              {mode === 'match' && !matchLoading && (
                <>
                  {file && file.size > 50_000_000 && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-200/90 leading-relaxed">
                      This file is {(file.size / 1024 / 1024).toFixed(0)} MB. Large files can slow your browser
                      while we search — consider exporting at lower mesh resolution if your tab freezes.
                    </div>
                  )}
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
                </>
              )}
            </aside>
          </main>
        )}
      </div>
    </>
  );
}

/* -------------------- Subcomponents -------------------- */

// Visible only when the URL has `?debug=perf`. Copies the persisted perf-trace
// payload (rolling snapshot written by trace() and the freeze watchdog) to the
// clipboard so the user can paste it back without opening DevTools. Survives
// "Page unresponsive" freezes because the snapshot is flushed to localStorage
// continuously, including on visibilitychange→hidden and pagehide.
function DiagnosticsButton() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  if (params.get('debug') !== 'perf') return null;

  const onCopy = async () => {
    const payload = readLastDiagnostics() ?? '(no diagnostics yet — start a search to populate)';
    try {
      await navigator.clipboard.writeText(payload);
      // eslint-disable-next-line no-alert
      alert(`Copied ${payload.length.toLocaleString()} chars to clipboard.\n\nKey: localStorage['${PERF_STORAGE_KEY}']`);
    } catch (err) {
      // Fall back to a console dump if clipboard is blocked (e.g. http://).
      // eslint-disable-next-line no-console
      console.log('[stl-match perf] copy failed, payload below:\n', payload);
      // eslint-disable-next-line no-alert
      alert(`Clipboard blocked — payload logged to console.\n\nKey: localStorage['${PERF_STORAGE_KEY}']\nError: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className="fixed bottom-4 right-4 z-50 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs font-mono text-amber-200 shadow-lg backdrop-blur-sm hover:bg-amber-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
      aria-label="Copy diagnostics payload to clipboard"
    >
      Copy diagnostics
    </button>
  );
}

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
  area,
  isRanking = false,
  onNew,
  parsedMetrics,
}: {
  result: any;
  file: File | null;
  technology: string;
  material: string;
  quantity: number;
  area: string;
  isRanking?: boolean;
  onNew: () => void;
  parsedMetrics: STLResult | null;
}) {
  const navigate = useNavigate();
  const { getQuotes, liveQuotes: liveQuotesNow, isLoading: liveLoading, hasErrors: liveHasErrors, results: liveResults } = useLiveQuotes({
    currency: 'EUR',
    countryCode: 'DK',
    technology,
    material,
  });
  // Deferred value lets React schedule the heavy priceInfo recompute in a
  // low-priority transition lane, so user input (scroll/click/hover) yields
  // ahead of the cascade. Combined with the differential resolvePriceInfo
  // below, each Craftcloud partial becomes a small, interruptible update.
  const liveQuotes = useDeferredValue(liveQuotesNow);

  // Parsed geometry is retained so estimates can size to the actual part, not
  // fall back to a tier-table baseline.
  const [geometry, setGeometry] = useState<
    { volumeCm3: number; boundingBox: { x: number; y: number; z: number }; triangleCount: number } | undefined
  >(undefined);

  // Two staged gates so the heavy work doesn't all land on one frame:
  //   1) `quotesEnabled` — first idle tick after MatchResultView mounts. Lets
  //      the Craftcloud/Treatstock fan-out start in the background while the
  //      card list is still staggering in (network-bound, doesn't block paint).
  //   2) `mapEnabled` — fires LAST, only after the card stagger has reached
  //      its final size (visibleCount === 20) AND another idle tick passes.
  //      Mapbox init + WebGL texture allocation + marker batches are the
  //      single biggest CPU spike on this page, so we hold them back until
  //      the supplier list is fully painted.
  //
  // Both gates honor a tab-hidden guard: on hidden tabs Chrome's memory-saver
  // can kill the page if Mapbox allocates WebGL contexts in the background.
  const [quotesEnabled, setQuotesEnabled] = useState(false);
  const [mapEnabled, setMapEnabled] = useState(false);

  useEffect(() => {
    trace('trigger:result-mounted');
    let visUnsub: (() => void) | null = null;
    let ricHandle: number | null = null;
    let toHandle: number | null = null;

    const commit = () => {
      if (isHidden()) {
        trace('trigger:quotes-blocked-hidden');
        visUnsub = onVisible(() => {
          trace('trigger:quotes-resumed');
          setQuotesEnabled(true);
        });
        return;
      }
      trace('trigger:quotes-enabled');
      setQuotesEnabled(true);
    };

    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
    const cic = (window as unknown as { cancelIdleCallback?: (handle: number) => void }).cancelIdleCallback;
    if (typeof ric === 'function') {
      ricHandle = ric(commit, { timeout: 600 });
    } else {
      toHandle = window.setTimeout(commit, 80);
    }

    return () => {
      if (ricHandle != null) cic?.(ricHandle);
      if (toHandle != null) window.clearTimeout(toHandle);
      visUnsub?.();
    };
  }, []);

  // Auto-fetch live quotes when the file/quantity changes. Reuses the
  // STL parse from the upload step (parsedMetrics) so we don't block the
  // main thread re-parsing the same file when MatchResultView mounts. Gated
  // on `quotesEnabled` so the 90+ vendor fan-out doesn't compete with the
  // first card paint.
  useEffect(() => {
    if (!file || !quotesEnabled) return;
    const g = parsedMetrics
      ? {
          volumeCm3: parsedMetrics.volumeCm3,
          boundingBox: parsedMetrics.boundingBox,
          triangleCount: parsedMetrics.triangleCount,
        }
      : undefined;
    setGeometry(g);
    getQuotes(file, quantity, g);
  }, [file, quantity, getQuotes, parsedMetrics, quotesEnabled]);

  // Rows lacking a supplier or matchDetails block would crash the unguarded
  // property access below. Partial-ranking polls can briefly produce these.
  const safeMatches = useMemo(
    () =>
      timed('safeMatches', () =>
        Array.isArray(result?.matches)
          ? result.matches.filter((m: any) => m?.supplier && m?.matchDetails)
          : []
      ),
    [result]
  );

  // Backend writes matches with overallExplanation:"" first, then fills them in
  // on a second DB update. Hiding the explanations loader the moment all
  // matches have text avoids blindly waiting for the 30s watchdog.
  //
  // Only the top N are ever explained (EXPLANATION_CAP in trigger/stl-supplier-match.ts).
  // Checking all matches here meant the spinner could never clear naturally on
  // large result sets — only the watchdog hid it after 30s.
  const EXPLAINED_TOP_N = 20;
  const hasPendingExplanations = useMemo(
    () =>
      safeMatches
        .slice(0, EXPLAINED_TOP_N)
        .some((m: any) => !m?.matchDetails?.overallExplanation?.trim()),
    [safeMatches]
  );

  // Cap the heavy pricing/sorting work to the top-N matches by backend score.
  // resolvePriceInfo runs an O(matches × liveQuotes) name-matcher with token
  // splitting and stop-word filtering — running it across all 326 matches on
  // every live-quote partial pinned the main thread in foreground tabs. The
  // backend already returns matches in score order, so the first PRICED_TOP_N
  // are exactly the ones the user is most likely to scroll to via "Vis flere".
  // Matches beyond the cap render unpriced, which is a fair UX trade for
  // unfreezing the page.
  const PRICED_TOP_N = 100;
  const pricedSubset = useMemo(
    () => timed('pricedSubset', () => safeMatches.slice(0, PRICED_TOP_N)),
    [safeMatches]
  );
  const unpricedTail = useMemo(
    () => timed('unpricedTail', () => safeMatches.slice(PRICED_TOP_N)),
    [safeMatches]
  );

  const estimatedPrices = useMemo(
    () =>
      timed('estimatedPrices', () =>
        pricedSubset.map((m: any) =>
          getEstimatedPrice({
            supplierName: m.supplier.name ?? 'Unknown supplier',
            supplierId: m.supplier.supplier_id,
            supplierTechnologies: m.matchDetails.matchedTechnologies ?? [],
            selectedTechnology: technology,
            selectedMaterial: material,
            geometry,
            quantity,
            logoUrl: m.supplier.logo_url || undefined,
          })
        )
      ),
    [pricedSubset, technology, material, quantity, geometry]
  );

  // Cache the prior priceInfo result + the liveQuotes it was computed against,
  // so the next call can diff vendor-by-vendor and skip name-matching for
  // matches whose outcome cannot have changed. Worst case (first call, or
  // pricedSubset reset) falls back to the slow path, so this is purely a
  // speedup.
  const priceInfoCacheRef = useRef<PriceInfoCache | null>(null);
  const priceInfo = useMemo(
    () =>
      timed('priceInfo', () => {
        const result = resolvePriceInfo(
          pricedSubset,
          liveQuotes,
          estimatedPrices,
          priceInfoCacheRef.current
        );
        priceInfoCacheRef.current = { result, liveQuotes };
        return result;
      }),
    [pricedSubset, liveQuotes, estimatedPrices]
  );

  const sortedMatches = useMemo(
    () => timed('sortedMatches', () => [...sortMatchesByPrice(pricedSubset, priceInfo), ...unpricedTail]),
    [pricedSubset, priceInfo, unpricedTail]
  );

  // In-page filtering: seeded from the configurator's single-value selections,
  // then narrowed further by the FilterPanel below the header.
  const [filters, setFilters] = useState<FilterState>(() => ({
    technologies: technology ? [technology] : [],
    materials: material ? [material] : [],
    areas: area ? [area] : [],
    requirements: [],
  }));

  // Debounced copy used by the heavy filter memo so rapid checkbox clicks
  // don't trigger O(n×m) re-filter on every keystroke.
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilters(filters), 150);
    return () => clearTimeout(t);
  }, [filters]);

  // Pagination: render a window of matches, grow on "Vis flere". Resets
  // whenever the filter set changes so users always start at the top.
  //
  // Initial value 3 (not 20) so the first paint commits a tiny tree — 3 cards
  // + map skeleton + header. The next four idle frames bump to 6, 10, 15, 20,
  // so the user sees results within the first frame after navigation while
  // the heavier card renders stagger in over five tiny commits instead of
  // landing in one big chunk. Like Momondo: top results first, the rest stream in.
  const [visibleCount, setVisibleCount] = useState(3);
  useEffect(() => setVisibleCount(20), [debouncedFilters]);
  // First-mount stagger: only runs once. Filter changes reset to 20 above,
  // not 3, so users who scroll-then-filter don't lose context.
  useEffect(() => {
    type RIC = (cb: () => void) => number;
    type CIC = (handle: number) => void;
    const ric: RIC =
      (window as unknown as { requestIdleCallback?: RIC }).requestIdleCallback ??
      ((cb) => window.setTimeout(cb, 50) as unknown as number);
    const cic: CIC =
      (window as unknown as { cancelIdleCallback?: CIC }).cancelIdleCallback ??
      ((h) => window.clearTimeout(h));
    const t1 = ric(() => setVisibleCount((c) => Math.max(c, 6)));
    const t2 = ric(() => setVisibleCount((c) => Math.max(c, 10)));
    const t3 = ric(() => setVisibleCount((c) => Math.max(c, 15)));
    const t4 = ric(() => setVisibleCount((c) => Math.max(c, 20)));
    return () => {
      cic(t1);
      cic(t2);
      cic(t3);
      cic(t4);
    };
  }, []);

  // Map gate: opt-in by default. Mapbox WebGL init + marker creation is the
  // single biggest CPU spike on this page (Page-Unresponsive on large STLs).
  // We only mount the map when the user explicitly clicks "Show map", OR if
  // sessionStorage shows they've already opted in this session (so they don't
  // have to click again on every fresh quote within the same tab).
  const MAP_OPT_IN_KEY = 'supplycheck:map-opted-in';
  useEffect(() => {
    if (mapEnabled) return;
    if (visibleCount < 20) return;
    let optedIn = false;
    try {
      optedIn = window.sessionStorage.getItem(MAP_OPT_IN_KEY) === 'true';
    } catch {
      // sessionStorage can throw in private/locked-down browsers; just stay opt-in.
    }
    if (!optedIn) return;

    let visUnsub: (() => void) | null = null;
    let ricHandle: number | null = null;
    let toHandle: number | null = null;
    let fallbackHandle: number | null = null;

    const commit = () => {
      if (isHidden()) {
        trace('trigger:map-blocked-hidden');
        visUnsub = onVisible(() => {
          trace('trigger:map-resumed');
          setMapEnabled(true);
        });
        return;
      }
      trace('trigger:map-enabled');
      setMapEnabled(true);
    };

    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
    const cic = (window as unknown as { cancelIdleCallback?: (handle: number) => void }).cancelIdleCallback;
    if (typeof ric === 'function') {
      ricHandle = ric(commit, { timeout: 1500 });
    } else {
      toHandle = window.setTimeout(commit, 200);
    }
    fallbackHandle = window.setTimeout(() => {
      if (!mapEnabled) commit();
    }, 1500);

    return () => {
      if (ricHandle != null) cic?.(ricHandle);
      if (toHandle != null) window.clearTimeout(toHandle);
      if (fallbackHandle != null) window.clearTimeout(fallbackHandle);
      visUnsub?.();
    };
  }, [visibleCount, mapEnabled]);

  const handleShowMap = useCallback(() => {
    try {
      window.sessionStorage.setItem(MAP_OPT_IN_KEY, 'true');
    } catch {
      // ignore — flag-set is a nicety, not load-bearing
    }
    if (isHidden()) {
      trace('trigger:map-blocked-hidden');
      onVisible(() => {
        trace('trigger:map-resumed');
        setMapEnabled(true);
      });
      return;
    }
    trace('trigger:map-enabled');
    setMapEnabled(true);
  }, []);

  const visibleMatches = useMemo(() => {
    return timed('visibleMatches', () => {
      const techFilter = debouncedFilters.technologies.map((t) => t.toLowerCase());
      const matFilter = debouncedFilters.materials.map((m) => m.toLowerCase());
      const areaFilter = debouncedFilters.areas
        .filter((a) => !['global', 'worldwide'].includes(a.toLowerCase()))
        .map((a) => a.toLowerCase());

      if (techFilter.length === 0 && matFilter.length === 0 && areaFilter.length === 0) {
        return sortedMatches;
      }

      return sortedMatches.filter((m: any) => {
        const supplier = m.supplier ?? {};
        const sTechs: string[] = (supplier.technologies ?? []).map((t: string) => t.toLowerCase());
        const sMats: string[] = (supplier.materials ?? []).map((x: string) => x.toLowerCase());
        const sRegion = (supplier.region ?? '').toLowerCase();
        const sCountry = (supplier.location_country ?? '').toLowerCase();
        const sCity = (supplier.location_city ?? '').toLowerCase();

        if (techFilter.length > 0) {
          const hit = techFilter.some((t) =>
            sTechs.some((st) => st === t || st.includes(t) || t.includes(st))
          );
          if (!hit) return false;
        }
        if (matFilter.length > 0) {
          const hit = matFilter.some((mt) =>
            sMats.some((sm) => sm === mt || sm.includes(mt) || mt.includes(sm))
          );
          if (!hit) return false;
        }
        if (areaFilter.length > 0) {
          const hit = areaFilter.some(
            (a) => sRegion.includes(a) || sCountry.includes(a) || sCity.includes(a) || a.includes(sRegion) || a.includes(sCountry)
          );
          if (!hit) return false;
        }
        return true;
      });
    });
  }, [sortedMatches, debouncedFilters]);

  // Geo for map pins: prefer lat/lng baked into the match (Trigger.dev now
  // includes them). Fall back to a batched lookup for any stragglers — e.g.
  // older search_results rows written before the backend shipped lat/lng.
  const [geoById, setGeoById] = useState<Map<string, { lat: number; lng: number }>>(new Map());
  useEffect(() => {
    const missingIds = safeMatches
      .filter((m: any) => m.supplier.location_lat == null || m.supplier.location_lng == null)
      .map((m: any) => m.supplier.supplier_id)
      .filter(Boolean);
    if (missingIds.length === 0) {
      // Skip the setState when already empty — every poll re-runs this effect
      // with a fresh `safeMatches` reference, and unconditionally writing
      // `new Map()` would thrash the geo state and re-render the map every 700ms.
      setGeoById((prev) => (prev.size === 0 ? prev : new Map()));
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('suppliers')
          .select('supplier_id, location_lat, location_lng')
          .in('supplier_id', missingIds);
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

  // Markers track the cards the user can actually see, not the full filtered
  // set. With visibleCount staggering 3→6→10→15→20, marker creation grows in
  // lockstep with cards instead of dumping 100+ markers at once when the map
  // mounts. This is the single biggest reduction in main-thread work for the
  // page-unresponsive freeze.
  const mapSuppliers = useMemo(
    () =>
      timed(
        'mapSuppliers',
        () =>
          visibleMatches
            .slice(0, visibleCount)
            .map((m: any) => {
              const lat = m.supplier.location_lat ?? geoById.get(m.supplier.supplier_id)?.lat;
              const lng = m.supplier.location_lng ?? geoById.get(m.supplier.supplier_id)?.lng;
              if (lat == null || lng == null) return null;
              const city = m.supplier.location_city || '';
              const country = m.supplier.location_country || m.supplier.region || '';
              return {
                id: m.supplier.supplier_id,
                name: m.supplier.name ?? 'Unknown supplier',
                location: {
                  lat,
                  lng,
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
            .filter(Boolean) as Array<any>
      ),
    [visibleMatches, visibleCount, geoById]
  );

  // Group the paginated slice by pricing tier so the list can render with
  // section headers (Live → Estimated → Other). Sort order within each bucket
  // is preserved from sortMatchesByPrice; we only re-bucket for rendering.
  const groupedVisible = useMemo(() => {
    const slice = visibleMatches.slice(0, visibleCount);
    const live: any[] = [];
    const estimate: any[] = [];
    const other: any[] = [];
    for (const m of slice) {
      const kind = priceInfo.get(m.supplier.supplier_id)?.kind ?? 'none';
      if (kind === 'live') live.push(m);
      else if (kind === 'estimate') estimate.push(m);
      else other.push(m);
    }
    return { live, estimate, other };
  }, [visibleMatches, visibleCount, priceInfo]);

  return (
    <>
      <Helmet>
        <title>Supplier matches | SupplyCheck</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/60 bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3 flex items-center gap-4">
            <div className="flex-1 flex items-center min-w-0">
              <a
                href="/"
                onClick={(e) => { e.preventDefault(); navigate('/'); }}
                className="flex items-center cursor-pointer flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                aria-label="Go to home page"
              >
                <img src={logo} alt="AMSupplyCheck" className="h-32 w-auto" />
              </a>
            </div>
            <div className="flex items-center gap-3 min-w-0 shrink-0">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {visibleMatches.length} suppliers matched
                  {visibleMatches.length !== safeMatches.length && (
                    <span className="text-muted-foreground font-normal"> of {safeMatches.length}</span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {[
                    filters.technologies.length ? filters.technologies.join(', ') : 'Any technology',
                    filters.materials.length ? filters.materials.join(', ') : 'Any material',
                    filters.areas.length ? filters.areas.join(', ') : 'Any area',
                    `${quantity} pcs`,
                  ].join(' · ')}
                </p>
              </div>
            </div>
            <div className="flex-1 flex justify-end">
              <Button variant="outline" size="sm" onClick={onNew}>
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                New upload
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-[1fr_480px] gap-4">
            <div className="space-y-3">
              <FilterPanel filters={filters} onFilterChange={setFilters} />
              {isRanking && hasPendingExplanations && (
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
              {!liveLoading && liveQuotes.length === 0 && liveHasErrors && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <div>
                    Live pricing is temporarily unavailable. Showing estimated prices only.
                    {liveResults.filter((r) => r.error).map((r) => (
                      <div key={r.supplier} className="mt-0.5 opacity-70">{r.supplier}: {r.error}</div>
                    ))}
                  </div>
                </div>
              )}
              <ErrorBoundary
                fallback={
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-200/90">
                    Couldn't render some suppliers — try refreshing the page.
                  </div>
                }
              >
                {groupedVisible.live.length > 0 && (
                  <>
                    <SectionHeader
                      label="Live prices"
                      count={groupedVisible.live.length}
                      description="Real-time quotes from suppliers via Craftcloud"
                    />
                    {groupedVisible.live.map((match: any, i: number) => (
                      <SupplierResultCard
                        key={match.supplier.supplier_id}
                        match={match}
                        rank={i + 1}
                        price={priceInfo.get(match.supplier.supplier_id) ?? { kind: 'none' }}
                        isRanking={isRanking}
                      />
                    ))}
                  </>
                )}
                {groupedVisible.estimate.length > 0 && (
                  <>
                    <SectionHeader
                      label="Estimated prices"
                      count={groupedVisible.estimate.length}
                      description="Based on supplier averages — confirm directly"
                    />
                    {groupedVisible.estimate.map((match: any, i: number) => (
                      <SupplierResultCard
                        key={match.supplier.supplier_id}
                        match={match}
                        rank={groupedVisible.live.length + i + 1}
                        price={priceInfo.get(match.supplier.supplier_id) ?? { kind: 'none' }}
                        isRanking={isRanking}
                      />
                    ))}
                  </>
                )}
                {groupedVisible.other.length > 0 && (
                  <>
                    <SectionHeader
                      label="Other suppliers"
                      count={groupedVisible.other.length}
                      description="Contact directly for a quote"
                    />
                    {groupedVisible.other.map((match: any, i: number) => (
                      <SupplierResultCard
                        key={match.supplier.supplier_id}
                        match={match}
                        rank={groupedVisible.live.length + groupedVisible.estimate.length + i + 1}
                        price={priceInfo.get(match.supplier.supplier_id) ?? { kind: 'none' }}
                        isRanking={isRanking}
                      />
                    ))}
                  </>
                )}
                {visibleCount < visibleMatches.length && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setVisibleCount((c) => c + 10)}
                    >
                      Show more suppliers ({visibleMatches.length - visibleCount} remaining)
                    </Button>
                  </div>
                )}
                <CardsPaintedMark count={visibleMatches.length} />
              </ErrorBoundary>
            </div>
            <aside className="lg:sticky lg:top-4 lg:h-[calc(100vh-6rem)] min-h-[400px]">
              <ErrorBoundary
                fallback={
                  <div className="h-full min-h-[400px] rounded-xl border border-border/60 bg-card/30 flex items-center justify-center p-6 text-sm text-muted-foreground text-center">
                    Map unavailable
                  </div>
                }
              >
                {mapEnabled ? (
                  <SupplierMap
                    suppliers={mapSuppliers}
                    height="100%"
                    className="rounded-xl overflow-hidden"
                    showControls
                  />
                ) : (
                  <div className="h-full min-h-[400px] rounded-xl border border-border/60 bg-card/30 flex flex-col items-center justify-center gap-4 p-6 text-center">
                    <Globe className="h-10 w-10 text-muted-foreground/60" strokeWidth={1.5} />
                    <div className="space-y-1.5">
                      <p className="text-sm font-medium">View suppliers on world map</p>
                      <p className="text-xs text-muted-foreground">
                        Loads {mapSuppliers.length} location{mapSuppliers.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleShowMap}>
                      <Globe className="h-3.5 w-3.5 mr-1.5" />
                      Show map
                    </Button>
                  </div>
                )}
              </ErrorBoundary>
            </aside>
          </div>
        </main>
      </div>
    </>
  );
}

// Fires once when cards first commit. Waits for the next animation frame so
// the perf mark lands AFTER paint, not just after React's commit phase. Ends
// the trace and triggers the console.table dump on the user's machine.
function CardsPaintedMark({ count }: { count: number }) {
  const firedRef = useRef(false);
  useEffect(() => {
    if (firedRef.current || count === 0) return;
    firedRef.current = true;
    const raf = requestAnimationFrame(() => {
      trace('trigger:cards-painted');
      endTrace();
    });
    return () => cancelAnimationFrame(raf);
  }, [count]);
  return null;
}

const SupplierResultCard = memo(function SupplierResultCard({
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
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{supplier.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {supplier.location_city ? `${supplier.location_city}, ` : ''}
              {supplier.location_country || supplier.region}
            </p>
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
        <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-end gap-2">
          <span
            className={cn(
              'inline-flex items-center justify-center gap-1',
              'h-8 px-3 text-xs font-medium',
              'rounded-md border border-border bg-transparent',
              'text-foreground hover:bg-accent hover:text-accent-foreground',
              'transition-colors'
            )}
          >
            Visit Supplier Page
            <ArrowRight className="h-3 w-3" />
          </span>
          {supplier.website && (
            <Button
              variant="default"
              size="sm"
              className="h-8 text-xs"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(supplier.website, '_blank', 'noopener,noreferrer');
              }}
            >
              Contact Directly
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
}, (prev, next) => {
  // Skip re-render when nothing visible on the card changed. Polls rebuild
  // the matches tree every 700ms with new references but usually same data.
  if (prev.rank !== next.rank) return false;
  if (prev.isRanking !== next.isRanking) return false;
  if (prev.price !== next.price) return false;
  if (prev.match.supplier.supplier_id !== next.match.supplier.supplier_id) return false;
  if (prev.match.score !== next.match.score) return false;
  if (prev.match.matchDetails.overallExplanation !== next.match.matchDetails.overallExplanation) return false;
  if ((prev.match.matchDetails.matchedTechnologies?.length ?? 0) !== (next.match.matchDetails.matchedTechnologies?.length ?? 0)) return false;
  if ((prev.match.matchDetails.matchedMaterials?.length ?? 0) !== (next.match.matchDetails.matchedMaterials?.length ?? 0)) return false;
  return true;
});

function SectionHeader({
  label,
  count,
  description,
}: {
  label: string;
  count: number;
  description: string;
}) {
  return (
    <div className="pt-3 pb-1 first:pt-0">
      <div className="flex items-baseline gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </h3>
        <span className="text-xs text-muted-foreground/60">·</span>
        <span className="text-xs font-medium text-muted-foreground">{count}</span>
      </div>
      <p className="text-[11px] text-muted-foreground/70 mt-0.5">{description}</p>
    </div>
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
