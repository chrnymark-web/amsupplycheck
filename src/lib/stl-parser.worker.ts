import { parseStl } from "./stl-parser";

self.onmessage = (e: MessageEvent<ArrayBuffer>) => {
  try {
    const result = parseStl(e.data);
    (self as unknown as Worker).postMessage({ ok: true, result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    (self as unknown as Worker).postMessage({ ok: false, error: message });
  }
};

export {};
