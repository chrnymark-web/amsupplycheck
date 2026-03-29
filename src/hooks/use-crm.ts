import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CrmPipelineStage, CrmDeal, CrmLabel, CrmComment, CrmActivityLog, CrmFilters } from "@/types/crm";

// ─── Query Hooks ──────────────────────────────────────────

export function useCrmStages() {
  return useQuery<CrmPipelineStage[]>({
    queryKey: ["crm-stages"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("crm_pipeline_stages")
        .select("*")
        .order("position", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCrmDeals(filters?: CrmFilters) {
  return useQuery<CrmDeal[]>({
    queryKey: ["crm-deals", filters],
    queryFn: async () => {
      // Fetch deals
      let query = (supabase as any)
        .from("crm_deals")
        .select("*")
        .eq("archived", false)
        .order("position", { ascending: true });

      if (filters?.assignedTo) {
        query = query.eq("assigned_to", filters.assignedTo);
      }
      if (filters?.technology) {
        query = query.eq("technology", filters.technology);
      }
      if (filters?.material) {
        query = query.eq("material", filters.material);
      }
      if (filters?.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte("created_at", filters.dateTo);
      }

      const { data: deals, error } = await query;
      if (error) throw error;

      // Fetch all deal-label relations
      const { data: dealLabels } = await (supabase as any)
        .from("crm_deal_labels")
        .select("deal_id, label_id");

      // Fetch all labels
      const { data: labels } = await (supabase as any)
        .from("crm_labels")
        .select("*");

      const labelMap = new Map((labels || []).map((l: CrmLabel) => [l.id, l]));

      // Attach labels to deals
      const dealsWithLabels = (deals || []).map((deal: CrmDeal) => {
        const dealLabelIds = (dealLabels || [])
          .filter((dl: any) => dl.deal_id === deal.id)
          .map((dl: any) => dl.label_id);
        return {
          ...deal,
          labels: dealLabelIds.map((id: string) => labelMap.get(id)).filter(Boolean),
        };
      });

      // Client-side filters
      let result = dealsWithLabels;
      if (filters?.search) {
        const s = filters.search.toLowerCase();
        result = result.filter(
          (d: CrmDeal) =>
            d.title.toLowerCase().includes(s) ||
            d.contact_name.toLowerCase().includes(s) ||
            d.contact_email.toLowerCase().includes(s) ||
            (d.project_description || "").toLowerCase().includes(s)
        );
      }
      if (filters?.labelIds && filters.labelIds.length > 0) {
        result = result.filter((d: CrmDeal) =>
          d.labels?.some((l) => filters.labelIds!.includes(l.id))
        );
      }

      return result;
    },
  });
}

export function useCrmLabels() {
  return useQuery<CrmLabel[]>({
    queryKey: ["crm-labels"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("crm_labels")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCrmComments(dealId: string | null) {
  return useQuery<CrmComment[]>({
    queryKey: ["crm-comments", dealId],
    enabled: !!dealId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("crm_comments")
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCrmActivity(dealId: string | null) {
  return useQuery<CrmActivityLog[]>({
    queryKey: ["crm-activity", dealId],
    enabled: !!dealId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("crm_activity_log")
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCrmAdminUsers() {
  return useQuery<{ id: string; email: string }[]>({
    queryKey: ["crm-admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      if (error) throw error;
      // We can't join auth.users directly, so just return user_ids
      return (data || []).map((r) => ({ id: r.user_id, email: r.user_id }));
    },
  });
}

// ─── Mutation Hooks ──────────────────────────────────────

export function useMoveDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      dealId,
      newStageId,
      newPosition,
      fromStageName,
      toStageName,
    }: {
      dealId: string;
      newStageId: string;
      newPosition: number;
      fromStageName: string;
      toStageName: string;
    }) => {
      const { error } = await (supabase as any)
        .from("crm_deals")
        .update({ stage_id: newStageId, position: newPosition })
        .eq("id", dealId);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      await (supabase as any).from("crm_activity_log").insert({
        deal_id: dealId,
        user_id: user?.id,
        action: "stage_changed",
        details: { from: fromStageName, to: toStageName },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-deals"] });
    },
  });
}

export function useReorderDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      dealId,
      newPosition,
    }: {
      dealId: string;
      newPosition: number;
    }) => {
      const { error } = await (supabase as any)
        .from("crm_deals")
        .update({ position: newPosition })
        .eq("id", dealId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-deals"] });
    },
  });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      deal: Omit<CrmDeal, "id" | "created_at" | "updated_at" | "archived" | "labels" | "stage">
    ) => {
      const { data, error } = await (supabase as any)
        .from("crm_deals")
        .insert(deal)
        .select()
        .single();
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      await (supabase as any).from("crm_activity_log").insert({
        deal_id: data.id,
        user_id: user?.id,
        action: "created",
        details: { source: "manual" },
      });

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-deals"] });
    },
  });
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      dealId,
      updates,
      field,
      oldValue,
      newValue,
    }: {
      dealId: string;
      updates: Partial<CrmDeal>;
      field?: string;
      oldValue?: unknown;
      newValue?: unknown;
    }) => {
      const { error } = await (supabase as any)
        .from("crm_deals")
        .update(updates)
        .eq("id", dealId);
      if (error) throw error;

      if (field) {
        const { data: { user } } = await supabase.auth.getUser();
        await (supabase as any).from("crm_activity_log").insert({
          deal_id: dealId,
          user_id: user?.id,
          action: "field_updated",
          details: { field, from: oldValue, to: newValue },
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-deals"] });
    },
  });
}

export function useArchiveDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (dealId: string) => {
      const { error } = await (supabase as any)
        .from("crm_deals")
        .update({ archived: true })
        .eq("id", dealId);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      await (supabase as any).from("crm_activity_log").insert({
        deal_id: dealId,
        user_id: user?.id,
        action: "archived",
        details: {},
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-deals"] });
    },
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ dealId, body }: { dealId: string; body: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await (supabase as any)
        .from("crm_comments")
        .insert({ deal_id: dealId, user_id: user.id, body });
      if (error) throw error;

      await (supabase as any).from("crm_activity_log").insert({
        deal_id: dealId,
        user_id: user.id,
        action: "comment_added",
        details: { preview: body.slice(0, 50) },
      });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["crm-comments", vars.dealId] });
      qc.invalidateQueries({ queryKey: ["crm-activity", vars.dealId] });
    },
  });
}

export function useToggleDealLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      dealId,
      labelId,
      labelName,
      add,
    }: {
      dealId: string;
      labelId: string;
      labelName: string;
      add: boolean;
    }) => {
      if (add) {
        const { error } = await (supabase as any)
          .from("crm_deal_labels")
          .insert({ deal_id: dealId, label_id: labelId });
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("crm_deal_labels")
          .delete()
          .eq("deal_id", dealId)
          .eq("label_id", labelId);
        if (error) throw error;
      }

      const { data: { user } } = await supabase.auth.getUser();
      await (supabase as any).from("crm_activity_log").insert({
        deal_id: dealId,
        user_id: user?.id,
        action: add ? "label_added" : "label_removed",
        details: { label: labelName },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-deals"] });
    },
  });
}

export function useCreateLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { data, error } = await (supabase as any)
        .from("crm_labels")
        .insert({ name, color })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-labels"] });
    },
  });
}

export function useDeleteLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (labelId: string) => {
      const { error } = await (supabase as any)
        .from("crm_labels")
        .delete()
        .eq("id", labelId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-labels"] });
      qc.invalidateQueries({ queryKey: ["crm-deals"] });
    },
  });
}
