// Tab visibility helpers used by the STL matching flow to gate polling and
// deferred work while the tab is backgrounded. Background tabs hit Chrome's
// memory-saver kill threshold quickly when timers and fetches keep firing —
// these helpers let callers cheaply pause until the tab is visible again.
//
// Non-React on purpose: the call sites (a polling loop, a one-shot deferred
// mount) gate side effects, not view state. A useTabVisibility hook would
// force re-renders on every visibility flip for nothing.

export const isHidden = (): boolean =>
  typeof document !== 'undefined' && document.visibilityState === 'hidden';

export function onVisibilityChange(cb: (hidden: boolean) => void): () => void {
  if (typeof document === 'undefined') return () => {};
  const handler = () => cb(document.visibilityState === 'hidden');
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
}

// Fires `cb` once, the next time the tab is visible. If already visible,
// fires synchronously. Returns an unsubscribe function for cleanup paths.
export function onVisible(cb: () => void): () => void {
  if (typeof document === 'undefined') return () => {};
  if (document.visibilityState === 'visible') {
    cb();
    return () => {};
  }
  const handler = () => {
    if (document.visibilityState === 'visible') {
      document.removeEventListener('visibilitychange', handler);
      cb();
    }
  };
  document.addEventListener('visibilitychange', handler);
  return () => document.removeEventListener('visibilitychange', handler);
}
