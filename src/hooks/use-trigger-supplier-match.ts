import { useState, useCallback } from "react";
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
      setError(run.error?.message || "Task failed");
    },
  });

  // Poll search_results status for step-by-step updates
  // (Trigger.dev realtime gives run-level status, but our task updates the DB with granular steps)
  const pollStatus = useCallback(
    async (id: string) => {
      const poll = async () => {
        const { data } = await supabase
          .from("search_results")
          .select("status, matches, extracted_requirements, technology_rationale, total_suppliers_analyzed, error_message")
          .eq("id", id)
          .single();

        if (!data) return;

        const dbStatus = data.status as SearchStatus;

        if (dbStatus === "completed" && data.matches) {
          setStatus("completed");
          setResult({
            requirements: data.extracted_requirements as any,
            matches: data.matches as any,
            totalSuppliersAnalyzed: data.total_suppliers_analyzed || 0,
            technologyRationale: data.technology_rationale as any,
          });
          return; // Stop polling
        }

        if (dbStatus === "failed") {
          setStatus("failed");
          setError(data.error_message || "Search failed");
          return; // Stop polling
        }

        // Update status for progress indicator
        if (["analyzing", "matching", "ranking"].includes(dbStatus)) {
          setStatus(dbStatus);
        }

        // Continue polling
        setTimeout(() => poll(), 1500);
      };

      // Start polling after a short delay
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
