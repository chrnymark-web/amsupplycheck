// One-shot performance tracer for the STL match loading phase.
//
// Call startTrace() when the user clicks "Find suppliers", trace() at each
// waypoint (upload-done, status transitions, matches-arrived, cards-painted),
// and endTrace() when the loading phase is over. On end, dumps a console.table
// of the timeline plus any longtasks (>50ms) the main thread couldn't service.
//
// We keep this in one module so future fixes don't need to grep through pages
// for performance marks. The user will paste this output back to confirm where
// their tab freezes — without it, every fix is a guess.

type Mark = { name: string; time: number };

type Session = {
  observer?: PerformanceObserver;
  longtasks: PerformanceEntry[];
  marks: Mark[];
  startTime: number;
};

let session: Session | null = null;

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

  session = { observer, longtasks, marks: [{ name: label, time: 0 }], startTime };
  logHeap(label, 0);
}

export function trace(name: string) {
  if (!session) return;
  try { performance.mark(name); } catch { /* ignore */ }
  const dt = performance.now() - session.startTime;
  session.marks.push({ name, time: dt });
  logHeap(name, dt);
}

export function endTrace(finalMark?: string) {
  if (!session) return;
  if (finalMark) trace(finalMark);

  const { observer, longtasks, marks, startTime } = session;
  session = null;
  observer?.disconnect();

  const dump = () => {
    // eslint-disable-next-line no-console
    console.log('[stl-match perf] timeline:');
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

function logHeap(label: string, dt: number) {
  const mem = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
  if (!mem) return;
  const mb = (n: number) => (n / 1024 / 1024).toFixed(1);
  // eslint-disable-next-line no-console
  console.log(`[stl-match perf] +${Math.round(dt)}ms ${label} heap=${mb(mem.usedJSHeapSize)}MB / ${mb(mem.totalJSHeapSize)}MB`);
}
