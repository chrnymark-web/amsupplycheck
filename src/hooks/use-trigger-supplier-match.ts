import { useState, useCallback, useEffect } from "react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { supabase } from "@/integrations/supabase/client";
import type { MatchingResult, ProjectRequirements } from "./use-supplier-matching";

type SearchStatus = "idle" | "pending" | "analyzing" | "matching" | "ranking" | "completed" | "failed";

const STATUS_MESSAGES: Record<SearchStatus, string> = {
  idle: "",
  pending: "Starting search...",
  analyzing: "Analyzing your requirements...",
  matching: "Searching through suppliers...",
  ranking: "Ranking and generating explanations...",
  completed: "Done!",
  failed: "Something went wrong",
};

interface TriggerSupplierMatchReturn {
  triggerMatch: (project: ProjectRequirements) => Promise<void>;
  status: SearchStatus;
  statusMessage: string;
  result: MatchingResult | null;
  isLoading: boolean;
  error: string | null;
  searchResultId: string | null;
  reset: () => void;
}

export function useTriggerSupplierMatch(): TriggerSupplierMatchReturn {
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchingResult | null>(null);
  const [searchResultId, setSearchResultId] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | undefined>(undefined);
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);

  // Subscribe to realtime updates when we have a run ID
  const { run } = useRealtimeRun(runId, {
    accessToken,
    enabled: !!runId && !!accessToken,
    onComplete: (run) => {
      // Task completed — extract result from the output
      const output = run.output as MatchingResult | undefined;
      if (output) {
        setResult(output);
      }
      setStatus("completed");
    },
    onError: (run) => {
      setStatus("failed");
      const raw = run.error?.message || "";
      const looksLikeApiJson = /^\d{3}\s*\{/.test(raw);
      setError(looksLikeApiJson ? "Search failed. Please try again." : (raw || "Task failed"));
    },
  });

  // Watchdog: surface a user-visible error instead of spinning forever when
  // the backend or network hangs silently. Cleared on every status transition,
  // so a healthy run renews the deadline as it progresses.
  useEffect(() => {
    if (status === "idle" || status === "completed" || status === "failed") return;
    const startPhase = status === "pending";
    const timeoutMs = startPhase ? 45_000 : 180_000;
    const message = startPhase
      ? "Couldn't start the search — please try again"
      : "Search is taking longer than expected — please try again";
    const timer = setTimeout(() => {
      setStatus("failed");
      setError(message);
    }, timeoutMs);
    return () => clearTimeout(timer);
  }, [status]);

  // Poll search_results status for step-by-step updates
  // (Trigger.dev realtime gives run-level status, but our task updates the DB with granular steps).
  // Only "completed" and "failed" are terminal. For any other result
  // (including transient errors, missing row, unknown status) we keep
  // polling — the watchdog effect above guarantees we don't spin forever.
  const pollStatus = useCallback(
    async (id: string) => {
      const poll = async () => {
        try {
          const { data, error } = await supabase
            .from("search_results")
            .select("status, matches, extracted_requirements, technology_rationale, total_suppliers_analyzed, error_message")
            .eq("id", id)
            .single();

          if (error || !data) {
            setTimeout(() => poll(), 1500);
            return;
          }

          const dbStatus = data.status as SearchStatus;

          if (dbStatus === "completed" && data.matches) {
            setStatus("completed");
            setResult({
              requirements: data.extracted_requirements as any,
              matches: data.matches as any,
              totalSuppliersAnalyzed: data.total_suppliers_analyzed || 0,
              technologyRationale: data.technology_rationale as any,
            });
            return;
          }

          if (dbStatus === "failed") {
            setStatus("failed");
            const raw = data.error_message || "";
            const looksLikeApiJson = /^\d{3}\s*\{/.test(raw);
            setError(looksLikeApiJson ? "Search failed. Please try again." : (raw || "Search failed"));
            return;
          }

          if (["analyzing", "matching", "ranking"].includes(dbStatus)) {
            setStatus(dbStatus);
          }

          setTimeout(() => poll(), 1500);
        } catch (err) {
          console.warn("[pollStatus] transient error, retrying:", err);
          setTimeout(() => poll(), 1500);
        }
      };

      setTimeout(() => poll(), 1000);
    },
    []
  );

  const triggerMatch = useCallback(
    async (project: ProjectRequirements) => {
      setStatus("pending");
      setError(null);
      setResult(null);

      try {
        const { data, error: invokeError } = await supabase.functions.invoke(
          "trigger-supplier-match",
          { body: { project } }
        );

        if (invokeError) throw new Error(invokeError.message);
        if (data?.error) throw new Error(data.error);

        const { searchResultId: id, runId: rid, publicAccessToken: pat } = data;
        setSearchResultId(id);
        setRunId(rid);
        setAccessToken(pat);

        // Start polling DB for granular status updates
        pollStatus(id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to start search";
        setError(msg);
        setStatus("failed");
      }
    },
    [pollStatus]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setResult(null);
    setSearchResultId(null);
    setRunId(undefined);
    setAccessToken(undefined);
  }, []);

  return {
    triggerMatch,
    status,
    statusMessage: STATUS_MESSAGES[status],
    result,
    isLoading: !["idle", "completed", "failed"].includes(status),
    error,
    searchResultId,
    reset,
  };
}
