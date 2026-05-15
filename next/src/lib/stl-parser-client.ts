"use client";

import type { StlResult } from "./stl-types";
import { parseStl } from "./stl-parser";
import { parseStep } from "./step-parser";

interface WorkerSuccess { ok: true; result: StlResult }
interface WorkerFailure { ok: false; error: string }
type WorkerResponse = WorkerSuccess | WorkerFailure;

function canUseWorker(): boolean {
  return typeof window !== "undefined" && typeof Worker !== "undefined";
}

function extOf(name: string): string {
  return name.toLowerCase().slice(name.lastIndexOf("."));
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

export async function parseModelInWorker(file: File): Promise<StlResult> {
  const ext = extOf(file.name);
  if (ext === ".stl") return parseStlInWorker(file);
  if (ext === ".step" || ext === ".stp") {
    const buf = await file.arrayBuffer();
    return parseStep(buf);
  }
  throw new Error(`Unsupported file format: ${ext || file.name}. Use STL or STEP.`);
}
