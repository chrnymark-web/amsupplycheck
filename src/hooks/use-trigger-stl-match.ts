"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import type { MatchingResult } from "@/lib/supplier-matching-types";
import type { StlResult } from "@/lib/stl-types";
import type { StlMatchInput, StlSearchStatus } from "@/lib/stl-match-types";

const STATUS_MESSAGES: Record<StlSearchStatus, string> = {
  idle: "",
  uploading: "Uploading STL file...",
  pending: "Starting analysis...",
  analyzing: "Parsing STL file and analyzing geometry...",
  matching: "Searching through suppliers...",
  ranking: "Ranking and generating explanations...",
  completed: "Done!",
  failed: "Something went wrong",
};

interface TriggerStlMatchReturn {
  triggerStlMatch: (input: StlMatchInput) => Promise<void>;
  status: StlSearchStatus;
  statusMessage: string;
  result: MatchingResult | null;
  stlMetrics: StlResult | null;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export function useTriggerStlMatch(): TriggerStlMatchReturn {
  const [status, setStatus] = useState<StlSearchStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MatchingResult | null>(null);
  const [stlMetrics, setStlMetrics] = useState<StlResult | null>(null);

  const cancelled = useRef(false);
  const pollHandle = useRef<number | null>(null);

  useEffect(
    () => () => {
      cancelled.current = true;
      if (pollHandle.current != null) {
        clearTimeout(pollHandle.current);
        pollHandle.current = null;
      }
    },
    [],
  );

  const hasResult = !!result;
  useEffect(() => {
    if (status === "idle" || status === "completed" || status === "failed") return;

    if (status === "ranking" && hasResult) {
      const t = setTimeout(() => {
        cancelled.current = true;
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

  const pollStatus = useCallback((id: string) => {
    const schedule = (delay: number) => {
      if (cancelled.current) return;
      if (pollHandle.current != null) clearTimeout(pollHandle.current);
      pollHandle.current = window.setTimeout(() => {
        pollHandle.current = null;
        void poll();
      }, delay);
    };

    const poll = async () => {
      if (cancelled.current) return;
      try {
        const { data, error: queryError } = await supabase
          .from("search_results")
          .select(
            "status, matches, extracted_requirements, technology_rationale, total_suppliers_analyzed, stl_metrics, error_message",
          )
          .eq("id", id)
          .single();

        if (cancelled.current) return;

        if (queryError || !data) {
          schedule(1500);
          return;
        }

        const dbStatus = data.status as StlSearchStatus;

        if (dbStatus === "completed" && data.matches) {
          cancelled.current = true;
          setStatus("completed");
          setResult({
            requirements: data.extracted_requirements as unknown as MatchingResult["requirements"],
            matches: data.matches as unknown as MatchingResult["matches"],
            totalSuppliersAnalyzed: data.total_suppliers_analyzed || 0,
            technologyRationale: data.technology_rationale as unknown as MatchingResult["technologyRationale"],
          });
          if (data.stl_metrics) setStlMetrics(data.stl_metrics as unknown as StlResult);
          return;
        }

        if (dbStatus === "failed") {
          cancelled.current = true;
          setStatus("failed");
          const raw = data.error_message || "";
          const looksLikeApiJson = /^\d{3}\s*\{/.test(raw);
          setError(looksLikeApiJson ? "Search failed. Please try again." : raw || "Search failed");
          return;
        }

        if (["analyzing", "matching", "ranking"].includes(dbStatus)) {
          setStatus(dbStatus);
          if (data.stl_metrics) setStlMetrics(data.stl_metrics as unknown as StlResult);
          if (dbStatus === "ranking" && data.matches) {
            setResult({
              requirements: data.extracted_requirements as unknown as MatchingResult["requirements"],
              matches: data.matches as unknown as MatchingResult["matches"],
              totalSuppliersAnalyzed: data.total_suppliers_analyzed || 0,
              technologyRationale: data.technology_rationale as unknown as MatchingResult["technologyRationale"],
            });
          }
        }

        const nextDelay = dbStatus === "ranking" ? 2000 : 700;
        schedule(nextDelay);
      } catch (err) {
        if (cancelled.current) return;
        console.warn("[pollStatus] transient error, retrying:", err);
        schedule(1500);
      }
    };

    schedule(0);
  }, []);

  const triggerStlMatch = useCallback(
    async (input: StlMatchInput) => {
      cancelled.current = false;
      setStatus("uploading");
      setError(null);
      setResult(null);
      setStlMetrics(null);

      try {
        const fileName = `${crypto.randomUUID()}_${input.file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("stl-uploads")
          .upload(fileName, input.file);

        if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

        setStatus("pending");

        const { data, error: invokeError } = await supabase.functions.invoke("trigger-stl-match", {
          body: {
            stlFilePath: fileName,
            technology: input.technology ?? "",
            material: input.material ?? "",
            quantity: input.quantity,
            preferredRegion: input.preferredRegion,
            area: input.area,
          },
        });

        if (invokeError) throw new Error(invokeError.message);
        if (data?.error) throw new Error(data.error);

        const { searchResultId } = data as { searchResultId: string };
        pollStatus(searchResultId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to start STL search";
        setError(msg);
        setStatus("failed");
      }
    },
    [pollStatus],
  );

  const reset = useCallback(() => {
    cancelled.current = true;
    if (pollHandle.current != null) {
      clearTimeout(pollHandle.current);
      pollHandle.current = null;
    }
    setStatus("idle");
    setError(null);
    setResult(null);
    setStlMetrics(null);
  }, []);

  return {
    triggerStlMatch,
    status,
    statusMessage: STATUS_MESSAGES[status],
    result,
    stlMetrics,
    isLoading: !["idle", "completed", "failed"].includes(status),
    error,
    reset,
  };
}
