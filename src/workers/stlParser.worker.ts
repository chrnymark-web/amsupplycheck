import { parseSTL, type STLResult } from '@/lib/stlParser';

type ParseResponse =
  | { ok: true; result: STLResult }
  | { ok: false; error: string };

self.onmessage = (e: MessageEvent<ArrayBuffer>) => {
  try {
    const result = parseSTL(e.data);
    const response: ParseResponse = { ok: true, result };
    (self as unknown as Worker).postMessage(response);
  } catch (err) {
    const response: ParseResponse = {
      ok: false,
      error: err instanceof Error ? err.message : 'STL parse failed',
    };
    (self as unknown as Worker).postMessage(response);
  }
};
