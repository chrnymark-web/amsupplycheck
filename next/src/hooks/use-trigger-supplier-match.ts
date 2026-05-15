"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import type {
  MatchingResult,
  ProjectRequirements,
  SearchStatus,
} from "@/lib/supplier-matching-types";

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
  const cancelled = useRef(false);

  useEffect(() => () => { cancelled.current = true; }, []);

  // Watchdog
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

  const pollStatus = useCallback(async (id: string) => {
    const poll = async () => {
      if (cancelled.current) return;
      try {
        const { data, error } = await supabase
          .from("search_results")
          .select(
            "status, matches, extracted_requirements, technology_rationale, total_suppliers_analyzed, error_message",
          )
          .eq("id", id)
          .single();

        if (error || !data) {
          setTimeout(poll, 1500);
          return;
        }

        const dbStatus = data.status as SearchStatus;

        if (dbStatus === "completed" && data.matches) {
          setStatus("completed");
          setResult({
            requirements: data.extracted_requirements as MatchingResult["requirements"],
            matches: data.matches as MatchingResult["matches"],
            totalSuppliersAnalyzed: data.total_suppliers_analyzed || 0,
            technologyRationale: data.technology_rationale as
              | MatchingResult["technologyRationale"]
              | undefined,
          });
          return;
        }

        if (dbStatus === "failed") {
          setStatus("failed");
          const raw = data.error_message || "";
          const looksLikeApiJson = /^\d{3}\s*\{/.test(raw);
          setError(looksLikeApiJson ? "Search failed. Please try again." : raw || "Search failed");
          return;
        }

        if (["analyzing", "matching", "ranking"].includes(dbStatus)) {
          setStatus(dbStatus);
        }

        setTimeout(poll, 1500);
      } catch (err) {
        console.warn("[pollStatus] transient error, retrying:", err);
        setTimeout(poll, 1500);
      }
    };

    setTimeout(poll, 1000);
  }, []);

  const triggerMatch = useCallback(
    async (project: ProjectRequirements) => {
      setStatus("pending");
      setError(null);
      setResult(null);

      try {
        const { data, error: invokeError } = await supabase.functions.invoke(
          "trigger-supplier-match",
          { body: { project } },
        );

        if (invokeError) throw new Error(invokeError.message);
        if (data?.error) throw new Error(data.error);

        const { searchResultId: id } = data as { searchResultId: string };
        setSearchResultId(id);
        pollStatus(id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to start search";
        setError(msg);
        setStatus("failed");
      }
    },
    [pollStatus],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setResult(null);
    setSearchResultId(null);
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
