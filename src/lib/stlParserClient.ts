import StlParserWorker from '@/workers/stlParser.worker?worker';
import { parseSTL, type STLResult } from './stlParser';

type ParseResponse =
  | { ok: true; result: STLResult }
  | { ok: false; error: string };

// Parse an STL file off the main thread. The worker is one-shot — spawned
// per file, terminated after responding — so a runaway parse on a malformed
// buffer can't keep a pool worker hot. Falls back to a synchronous parse if
// Worker isn't available (very old browsers, SSR).
export function parseSTLInWorker(file: File): Promise<STLResult> {
  if (typeof Worker === 'undefined') {
    return file.arrayBuffer().then((buf) => parseSTL(buf));
  }

  return new Promise<STLResult>((resolve, reject) => {
    let worker: Worker | null = null;
    let settled = false;

    const cleanup = () => {
      if (worker) {
        worker.terminate();
        worker = null;
      }
    };

    file
      .arrayBuffer()
      .then((buf) => {
        if (settled) return;
        try {
          worker = new StlParserWorker();
        } catch {
          settled = true;
          try {
            resolve(parseSTL(buf));
          } catch (err) {
            reject(err);
          }
          return;
        }

        worker.onmessage = (e: MessageEvent<ParseResponse>) => {
          if (settled) return;
          settled = true;
          const data = e.data;
          cleanup();
          if (data.ok) resolve(data.result);
          else reject(new Error(data.error));
        };

        worker.onerror = (e) => {
          if (settled) return;
          settled = true;
          cleanup();
          reject(new Error(e.message || 'STL worker error'));
        };

        // Transfer ownership of the buffer so the main thread releases its
        // copy — zero-copy handoff.
        worker.postMessage(buf, [buf]);
      })
      .catch((err) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(err);
      });
  });
}
