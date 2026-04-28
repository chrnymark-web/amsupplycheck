// One-shot performance tracer for the STL match loading phase.
//
// Call startTrace() when the user clicks "Find suppliers", trace() at each
// waypoint (upload-done, status transitions, matches-arrived, cards-painted),
// and endTrace() when the loading phase is over. On end, dumps a console.table
// of the timeline plus any longtasks (>50ms) the main thread couldn't service.
//
// Critically, the tracer also persists a rolling snapshot to localStorage on
// every trace() call so the diagnostic survives a "Page unresponsive" freeze
// where endTrace() never runs. The user can read the payload back from
// localStorage['stl-match-perf-last'] (or copy it via the ?debug=perf button)
// to share with the team for offline analysis.
//
// We keep this in one module so future fixes don't need to grep through pages
// for performance marks.

type Mark = { name: string; time: number };
type ErrorEntry = { time: number; kind: string; message: string; stack?: string };
type FreezeEntry = { time: number; blockedMs: number };
type HeapSample = { time: number; usedMb: number; totalMb: number };

type Session = {
  observer?: PerformanceObserver;
  longtasks: PerformanceEntry[];
  marks: Mark[];
  errors: ErrorEntry[];
  freezes: FreezeEntry[];
  heapSamples: HeapSample[];
  startTime: number;
  visUnsub?: () => void;
  errUnsub?: () => void;
  rejUnsub?: () => void;
  pageHideUnsub?: () => void;
  watchdogId?: ReturnType<typeof setInterval>;
};

let session: Session | null = null;

const STORAGE_KEY = 'stl-match-perf-last';
const FREEZE_THRESHOLD_MS = 1500; // a single tick blocked >1.5s = a freeze
const WATCHDOG_INTERVAL_MS = 250;

export function startTrace(label: string) {
  endTrace(); // ensure no stale session leaks
  const startTime = performance.now();
  try { performance.mark(label); } catch { /* hardened browsers */ }

  let observer: PerformanceObserver | undefined;
  const longtasks: PerformanceEntry[] = [];
  try {
    observer = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) longtasks.push(e);
    });
    observer.observe({ entryTypes: ['longtask'] });
  } catch {
    // Safari / older browsers don't support longtask entries — that's fine.
  }

  session = {
    observer,
    longtasks,
    marks: [{ name: label, time: 0 }],
    errors: [],
    freezes: [],
    heapSamples: [],
    startTime,
  };

  sampleHeap(label, 0);

  // Tag the perf timeline with every tab-visibility flip so the user's
  // pasted log proves whether polling/mount actually paused while hidden.
  // Also flush the snapshot when going hidden — if the user kills the
  // unresponsive tab, the last in-memory state survives in localStorage.
  if (typeof document !== 'undefined') {
    const onVis = () => {
      const hidden = document.visibilityState === 'hidden';
      trace(hidden ? 'visibility:hidden' : 'visibility:visible');
      if (hidden) flushSnapshot();
    };
    document.addEventListener('visibilitychange', onVis);
    session.visUnsub = () => document.removeEventListener('visibilitychange', onVis);
  }

  // Capture uncaught errors and unhandled rejections — these are the most
  // common signal that something silently blew up inside Mapbox / Supabase /
  // a render path the ErrorBoundary doesn't cover.
  if (typeof window !== 'undefined') {
    const onError = (e: ErrorEvent) => {
      pushError('error', e.message || String(e.error), e.error?.stack);
    };
    window.addEventListener('error', onError);
    session.errUnsub = () => window.removeEventListener('error', onError);

    const onRej = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === 'string'
            ? reason
            : (() => { try { return JSON.stringify(reason); } catch { return String(reason); } })();
      pushError('unhandledrejection', message, reason instanceof Error ? reason.stack : undefined);
    };
    window.addEventListener('unhandledrejection', onRej);
    session.rejUnsub = () => window.removeEventListener('unhandledrejection', onRej);

    // pagehide is the most reliable "user is navigating away or killing the
    // tab" signal cross-browser — even when 'beforeunload' is unreliable.
    const onPageHide = () => flushSnapshot();
    window.addEventListener('pagehide', onPageHide);
    session.pageHideUnsub = () => window.removeEventListener('pagehide', onPageHide);
  }

  // Freeze watchdog. setInterval(_, 250) firing 1500ms+ late means the main
  // thread was blocked for at least 1.5s between two ticks. That's the actual
  // shape of "Page unresponsive" — record it with a relative timestamp so the
  // user's pasted log shows precisely when the tab pinned and for how long.
  let lastTick = performance.now();
  session.watchdogId = setInterval(() => {
    if (!session) return;
    const now = performance.now();
    const drift = now - lastTick - WATCHDOG_INTERVAL_MS;
    if (drift > FREEZE_THRESHOLD_MS) {
      const entry: FreezeEntry = {
        time: now - session.startTime,
        blockedMs: Math.round(drift),
      };
      session.freezes.push(entry);
      // Persist immediately — the user's tab may not survive long enough for
      // the next trace() call to flush.
      flushSnapshot();
      // eslint-disable-next-line no-console
      console.warn(`[stl-match perf] FREEZE detected: blocked ${entry.blockedMs}ms at +${Math.round(entry.time)}ms`);
    }
    lastTick = now;
  }, WATCHDOG_INTERVAL_MS);

  flushSnapshot();
}

export function trace(name: string) {
  if (!session) return;
  try { performance.mark(name); } catch { /* ignore */ }
  const dt = performance.now() - session.startTime;
  session.marks.push({ name, time: dt });
  sampleHeap(name, dt);
  flushSnapshot();
}

// Lightweight per-call timer for memo bodies. Logs a `memo:<label>:<ms>ms`
// mark only when the body exceeds one frame, so the trace stays clean.
export function timed<T>(label: string, fn: () => T): T {
  if (!session) return fn();
  const start = performance.now();
  const r = fn();
  const dt = performance.now() - start;
  if (dt > 16) trace(`memo:${label}:${Math.round(dt)}ms`);
  return r;
}

export function endTrace(finalMark?: string) {
  if (!session) return;
  if (finalMark) trace(finalMark);

  const { observer, longtasks, marks, startTime, visUnsub, errUnsub, rejUnsub, pageHideUnsub, watchdogId } = session;

  // Final snapshot before tearing down — keeps the payload retrievable from
  // localStorage even after cleanup runs.
  flushSnapshot('endTrace');

  session = null;
  observer?.disconnect();
  visUnsub?.();
  errUnsub?.();
  rejUnsub?.();
  pageHideUnsub?.();
  if (watchdogId != null) clearInterval(watchdogId);

  const dump = () => {
    // eslint-disable-next-line no-console
    console.log('[stl-match perf] timeline (payload also saved to localStorage[\'' + STORAGE_KEY + '\']):');
    // eslint-disable-next-line no-console
    console.table(
      marks.map((m, i) => ({
        mark: m.name,
        't (ms)': Math.round(m.time),
        'Δ (ms)': i > 0 ? Math.round(m.time - marks[i - 1].time) : 0,
      }))
    );

    const slow = longtasks.filter((t) => t.duration > 50);
    if (slow.length) {
      // eslint-disable-next-line no-console
      console.warn(`[stl-match perf] ${slow.length} longtasks (>50ms) — main thread blocked:`);
      // eslint-disable-next-line no-console
      console.table(
        slow.map((t) => ({
          't (ms)': Math.round(t.startTime - startTime),
          'duration (ms)': Math.round(t.duration),
          name: t.name,
        }))
      );
    } else {
      // eslint-disable-next-line no-console
      console.log('[stl-match perf] no longtasks recorded (browser may not support longtask entries)');
    }
  };

  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => dump(), { timeout: 1000 });
  } else {
    setTimeout(dump, 0);
  }
}

// --- internals --------------------------------------------------------------

function sampleHeap(label: string, dt: number) {
  if (!session) return;
  const mem = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
  if (!mem) return;
  const used = mem.usedJSHeapSize / 1024 / 1024;
  const total = mem.totalJSHeapSize / 1024 / 1024;
  session.heapSamples.push({ time: dt, usedMb: +used.toFixed(1), totalMb: +total.toFixed(1) });
  // eslint-disable-next-line no-console
  console.log(`[stl-match perf] +${Math.round(dt)}ms ${label} heap=${used.toFixed(1)}MB / ${total.toFixed(1)}MB`);
}

function pushError(kind: string, message: string, stack?: string) {
  if (!session) return;
  const entry: ErrorEntry = {
    time: performance.now() - session.startTime,
    kind,
    message: message.slice(0, 500),
    stack: stack ? stack.slice(0, 2000) : undefined,
  };
  session.errors.push(entry);
  // Mirror into the marks timeline so it shows up in the console.table dump.
  session.marks.push({ name: `error:${kind}`, time: entry.time });
  flushSnapshot();
}

function flushSnapshot(reason?: string) {
  if (!session) return;
  if (typeof localStorage === 'undefined') return;
  try {
    const snapshot = {
      ua: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      viewportPx:
        typeof window !== 'undefined' ? { w: window.innerWidth, h: window.innerHeight } : { w: 0, h: 0 },
      startedAt: new Date(Date.now() - (performance.now() - session.startTime)).toISOString(),
      flushedAt: new Date().toISOString(),
      flushReason: reason,
      marks: session.marks,
      // PerformanceEntry isn't directly JSON-serialisable across all engines —
      // pluck the fields we need by hand.
      longtasks: session.longtasks.map((t) => ({
        startTime: Math.round(t.startTime - session.startTime),
        duration: Math.round(t.duration),
        name: t.name,
      })),
      errors: session.errors,
      freezes: session.freezes,
      heapSamples: session.heapSamples,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // QuotaExceeded or serialisation error — drop silently rather than throw
    // from a diagnostic path. The console output still tells the developer
    // what's happening.
  }
}

export function readLastDiagnostics(): string | null {
  if (typeof localStorage === 'undefined') return null;
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

export const PERF_STORAGE_KEY = STORAGE_KEY;
