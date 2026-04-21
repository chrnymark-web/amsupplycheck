import { useState, useCallback } from "react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
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
  technology: string;
  material: string;
  quantity?: number;
  preferredRegion?: string;
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

export function useTriggerSTLMatch(): TriggerSTLMatchReturn {
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchingResult | null>(null);
  const [stlMetrics, setStlMetrics] = useState<STLResult | null>(null);
  const [runId, setRunId] = useState<string | undefined>(undefined);
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);

  useRealtimeRun(runId, {
    accessToken,
    enabled: !!runId && !!accessToken,
    onComplete: (run) => {
      const output = run.output as any;
      if (output) {
        setResult({
          requirements: output.requirements,
          matches: output.matches,
          totalSuppliersAnalyzed: output.totalSuppliersAnalyzed,
          technologyRationale: output.technologyRationale,
        });
        if (output.stlMetrics) setStlMetrics(output.stlMetrics);
      }
      setStatus("completed");
    },
    onError: (run) => {
      setStatus("failed");
      setError(run.error?.message || "Task failed");
    },
  });

  const pollStatus = useCallback(async (id: string) => {
    const poll = async () => {
      const { data } = await supabase
        .from("search_results")
        .select("status, matches, extracted_requirements, technology_rationale, total_suppliers_analyzed, stl_metrics, error_message")
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
        if (data.stl_metrics) setStlMetrics(data.stl_metrics as any);
        return;
      }

      if (dbStatus === "failed") {
        setStatus("failed");
        setError(data.error_message || "Search failed");
        return;
      }

      if (["analyzing", "matching", "ranking"].includes(dbStatus)) {
        setStatus(dbStatus);
        if (data.stl_metrics) setStlMetrics(data.stl_metrics as any);

        // Progressive: matches are written at the start of "ranking" before
        // Claude finishes explanations. Surface them immediately so the UI can
        // render cards while explanations fill in on the next poll.
        if (dbStatus === "ranking" && data.matches) {
          setResult({
            requirements: data.extracted_requirements as any,
            matches: data.matches as any,
            totalSuppliersAnalyzed: data.total_suppliers_analyzed || 0,
            technologyRationale: data.technology_rationale as any,
          });
        }
      }

      setTimeout(() => poll(), 700);
    };

    setTimeout(() => poll(), 1000);
  }, []);

  const triggerSTLMatch = useCallback(async (input: STLMatchInput) => {
    setStatus("uploading");
    setError(null);
    setResult(null);
    setStlMetrics(null);

    try {
      // Upload STL to Supabase Storage
      const fileName = `${crypto.randomUUID()}_${input.file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("stl-uploads")
        .upload(fileName, input.file);

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      setStatus("pending");

      // Trigger the edge function
      const { data, error: invokeError } = await supabase.functions.invoke(
        "trigger-stl-match",
        {
          body: {
            stlFilePath: fileName,
            technology: input.technology,
            material: input.material,
            quantity: input.quantity,
            preferredRegion: input.preferredRegion,
          },
        }
      );

      if (invokeError) throw new Error(invokeError.message);
      if (data?.error) throw new Error(data.error);

      const { searchResultId, runId: rid, publicAccessToken: pat } = data;
      setRunId(rid);
      setAccessToken(pat);

      pollStatus(searchResultId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start STL search";
      setError(msg);
      setStatus("failed");
    }
  }, [pollStatus]);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setResult(null);
    setStlMetrics(null);
    setRunId(undefined);
    setAccessToken(undefined);
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
