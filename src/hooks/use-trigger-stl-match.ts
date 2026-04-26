import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { MatchingResult } from "./use-supplier-matching";
import type { STLResult } from "@/lib/stlParser";

type SearchStatus = "idle" | "uploading" | "pending" | "analyzing" | "matching" | "ranking" | "completed" | "failed";

const STATUS_MESSAGES: Record<SearchStatus, string> = {
  idle: "",
  uploading: "Uploading STL file...",
  pending: "Starting analysis...",
  analyzing: "Parsing STL file and analyzing geometry...",
  matching: "Searching through suppliers...",
  ranking: "Ranking and generating explanations...",
  completed: "Done!",
  failed: "Something went wrong",
};

interface STLMatchInput {
  file: File;
  technology?: string;
  material?: string;
  quantity?: number;
  preferredRegion?: string;
  /** Continent filter, e.g. 'Europe'. Empty = no filter. */
  area?: string;
}

interface TriggerSTLMatchReturn {
  triggerSTLMatch: (input: STLMatchInput) => Promise<void>;
  status: SearchStatus;
  statusMessage: string;
  result: MatchingResult | null;
  stlMetrics: STLResult | null;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

// Signature compresses match data so polls that bring back identical content
// (matches haven't changed, no new explanations filled in) skip the setResult
// call entirely — avoiding the cascading re-render through every memo and
// child component every 700ms.
function matchesSignature(matches: any[] | null | undefined): string {
  if (!Array.isArray(matches)) return '';
  let sig = '';
  for (const m of matches) {
    const id = m?.supplier?.supplier_id ?? '';
    const exp = (m?.matchDetails?.overallExplanation ?? '').length;
    sig += `${id}:${exp}|`;
  }
  return sig;
}

export function useTriggerSTLMatch(): TriggerSTLMatchReturn {
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchingResult | null>(null);
  const [stlMetrics, setStlMetrics] = useState<STLResult | null>(null);

  // Ref-based kill switch for the recursive setTimeout polling chain. Flipped
  // true on terminal status (completed/failed), reset to false on each new
  // search, and forced true on unmount so chains can't outlive the component
  // or pile up across multiple searches.
  const cancelPollingRef = useRef(false);

  // Tracks the last-applied match-content signature so identical poll results
  // skip the setResult/re-render churn during the explanations-fill-in phase.
  const lastSignatureRef = useRef<string>('');

  useEffect(() => {
    return () => {
      cancelPollingRef.current = true;
    };
  }, []);

  // Watchdog: surface a user-visible error instead of spinning forever when
  // the backend or network hangs silently. Cleared on every status transition,
  // so a healthy run renews the deadline as it progresses.
  //
  // Ranking-with-matches gets a softer path: we already have 300+ usable
  // results rendered, so a stuck explanations phase shouldn't wipe them out
  // with a hard failure. Silent-complete after 30s instead.
  const hasResult = !!result;
  useEffect(() => {
    if (status === "idle" || status === "completed" || status === "failed") return;

    if (status === "ranking" && hasResult) {
      const t = setTimeout(() => {
        cancelPollingRef.current = true;
        setStatus("completed");
      }, 30_000);
      return () => clearTimeout(t);
    }

    const startPhase = status === "uploading" || status === "pending";
    const timeoutMs = startPhase ? 45_000 : 180_000;
    const message = startPhase
      ? "Couldn't start the search — please try again"
      : "Search is taking longer than expected — please try again";
    const timer = setTimeout(() => {
      setStatus("failed");
      setError(message);
    }, timeoutMs);
    return () => clearTimeout(timer);
  }, [status, hasResult]);

  const pollStatus = useCallback(async (id: string) => {
    // Only "completed" and "failed" are terminal. For any other result
    // (including transient errors, missing row, unknown status) we keep
    // polling — the watchdog effect above guarantees we don't spin forever.
    const pollStart = performance.now();
    let lastLoggedStatus: SearchStatus | null = null;
    const poll = async () => {
      if (cancelPollingRef.current) return;
      try {
        const { data, error } = await supabase
          .from("search_results")
          .select("status, matches, extracted_requirements, technology_rationale, total_suppliers_analyzed, stl_metrics, error_message")
          .eq("id", id)
          .single();

        if (cancelPollingRef.current) return;

        if (error || !data) {
          setTimeout(() => poll(), 1500);
          return;
        }

        const dbStatus = data.status as SearchStatus;

        // Log only on status transitions so the console shows a clean
        // timeline instead of flooding during stuck states.
        if (dbStatus !== lastLoggedStatus) {
          const elapsed = Math.round(performance.now() - pollStart);
          console.log(`[stl-match] status: ${lastLoggedStatus ?? "(initial)"} → ${dbStatus} @ ${elapsed}ms`);
          lastLoggedStatus = dbStatus;
        }

        if (dbStatus === "completed" && data.matches) {
          cancelPollingRef.current = true;
          setStatus("completed");
          const sig = matchesSignature(data.matches as any[]);
          if (sig !== lastSignatureRef.current) {
            lastSignatureRef.current = sig;
            setResult({
              requirements: data.extracted_requirements as any,
              matches: data.matches as any,
              totalSuppliersAnalyzed: data.total_suppliers_analyzed || 0,
              technologyRationale: data.technology_rationale as any,
            });
          }
          if (data.stl_metrics) setStlMetrics(data.stl_metrics as any);
          return;
        }

        if (dbStatus === "failed") {
          cancelPollingRef.current = true;
          setStatus("failed");
          setError(data.error_message || "Search failed");
          return;
        }

        if (["analyzing", "matching", "ranking"].includes(dbStatus)) {
          setStatus(dbStatus);
          if (data.stl_metrics) setStlMetrics(data.stl_metrics as any);

          // Progressive: matches are written at the start of "ranking" before
          // Claude finishes explanations. Surface them immediately so the UI
          // renders cards while explanations fill in on the next poll.
          // Signature dedup skips identical-content reruns to avoid a memo
          // cascade re-render every 1.5s during the fill-in phase.
          if (dbStatus === "ranking" && data.matches) {
            const sig = matchesSignature(data.matches as any[]);
            if (sig !== lastSignatureRef.current) {
              lastSignatureRef.current = sig;
              setResult({
                requirements: data.extracted_requirements as any,
                matches: data.matches as any,
                totalSuppliersAnalyzed: data.total_suppliers_analyzed || 0,
                technologyRationale: data.technology_rationale as any,
              });
            }
          }
        }

        // Slower cadence once we have data on screen — the user is just
        // waiting for explanations to fill in, no need to poll aggressively.
        const nextDelay = dbStatus === "ranking" ? 2000 : 700;
        setTimeout(() => poll(), nextDelay);
      } catch (err) {
        if (cancelPollingRef.current) return;
        console.warn("[pollStatus] transient error, retrying:", err);
        setTimeout(() => poll(), 1500);
      }
    };

    setTimeout(() => poll(), 250);
  }, []);

  const triggerSTLMatch = useCallback(async (input: STLMatchInput) => {
    cancelPollingRef.current = false;
    lastSignatureRef.current = '';
    setStatus("uploading");
    setError(null);
    setResult(null);
    setStlMetrics(null);

    try {
      // Upload STL to Supabase Storage
      const fileName = `${crypto.randomUUID()}_${input.file.name}`;
      const uploadStart = performance.now();
      const { error: uploadError } = await supabase.storage
        .from("stl-uploads")
        .upload(fileName, input.file);
      console.log(`[stl-match] upload: ${Math.round(performance.now() - uploadStart)}ms (${(input.file.size / 1024 / 1024).toFixed(2)}MB)`);

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      setStatus("pending");

      // Trigger the edge function
      const invokeStart = performance.now();
      const { data, error: invokeError } = await supabase.functions.invoke(
        "trigger-stl-match",
        {
          body: {
            stlFilePath: fileName,
            technology: input.technology ?? '',
            material: input.material ?? '',
            quantity: input.quantity,
            preferredRegion: input.preferredRegion,
            area: input.area,
          },
        }
      );
      console.log(`[stl-match] invoke: ${Math.round(performance.now() - invokeStart)}ms`);

      if (invokeError) throw new Error(invokeError.message);
      if (data?.error) throw new Error(data.error);

      const { searchResultId } = data;
      pollStatus(searchResultId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start STL search";
      setError(msg);
      setStatus("failed");
    }
  }, [pollStatus]);

  const reset = useCallback(() => {
    cancelPollingRef.current = true;
    lastSignatureRef.current = '';
    setStatus("idle");
    setError(null);
    setResult(null);
    setStlMetrics(null);
  }, []);

  return {
    triggerSTLMatch,
    status,
    statusMessage: STATUS_MESSAGES[status],
    result,
    stlMetrics,
    isLoading: !["idle", "completed", "failed"].includes(status),
    error,
    reset,
  };
}
