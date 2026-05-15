"use client";

import type { StlResult } from "./stl-types";
import { parseStl } from "./stl-parser";

interface WorkerSuccess { ok: true; result: StlResult }
interface WorkerFailure { ok: false; error: string }
type WorkerResponse = WorkerSuccess | WorkerFailure;

function canUseWorker(): boolean {
  return typeof window !== "undefined" && typeof Worker !== "undefined";
}

export async function parseStlInWorker(file: File): Promise<StlResult> {
  const buf = await file.arrayBuffer();

  if (!canUseWorker()) {
    return parseStl(buf);
  }

  return new Promise<StlResult>((resolve, reject) => {
    const worker = new Worker(
      new URL("./stl-parser.worker.ts", import.meta.url),
      { type: "module" },
    );

    const cleanup = () => worker.terminate();

    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      cleanup();
      if (e.data.ok) resolve(e.data.result);
      else reject(new Error(e.data.error));
    };

    worker.onerror = (err) => {
      cleanup();
      reject(new Error(err.message || "STL worker failed"));
    };

    worker.postMessage(buf, [buf]);
  });
}
