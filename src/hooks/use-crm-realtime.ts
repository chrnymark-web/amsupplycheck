import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCrmRealtime(activeDealId?: string | null) {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("crm-realtime")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "crm_deals" },
        () => {
          qc.invalidateQueries({ queryKey: ["crm-deals"] });
        }
      )
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "crm_deal_labels" },
        () => {
          qc.invalidateQueries({ queryKey: ["crm-deals"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  // Subscribe to comments/activity for the active deal
  useEffect(() => {
    if (!activeDealId) return;

    const channel = supabase
      .channel(`crm-deal-${activeDealId}`)
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "crm_comments", filter: `deal_id=eq.${activeDealId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["crm-comments", activeDealId] });
        }
      )
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "crm_activity_log", filter: `deal_id=eq.${activeDealId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["crm-activity", activeDealId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeDealId, qc]);
}
