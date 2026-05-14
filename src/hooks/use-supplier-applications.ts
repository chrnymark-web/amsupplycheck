import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ApplicationStatus } from '@/components/admin/applications-kanban/stages';
import type { Database } from '@/integrations/supabase/types';

export type Temperature = Database['public']['Enums']['supplier_application_temperature'];

export type SupplierApplication = {
  id: string;
  company: string;
  name: string;
  email: string;
  created_at: string;
  status: ApplicationStatus;
  status_updated_at: string;
  notes: string | null;
  estimated_value_usd: number | null;
  temperature: Temperature | null;
};

export type ApplicationEditableFields = {
  notes?: string | null;
  estimated_value_usd?: number | null;
  temperature?: Temperature | null;
};

export const SUPPLIER_APPLICATIONS_QUERY_KEY = ['supplier-applications'] as const;

const SELECT_COLUMNS =
  'id, company, name, email, created_at, status, status_updated_at, notes, estimated_value_usd, temperature';

async function fetchSupplierApplications(): Promise<SupplierApplication[]> {
  const { data, error } = await supabase
    .from('supplier_applications')
    .select(SELECT_COLUMNS)
    .order('status_updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as SupplierApplication[];
}

export function useSupplierApplications() {
  return useQuery({
    queryKey: SUPPLIER_APPLICATIONS_QUERY_KEY,
    queryFn: fetchSupplierApplications,
    staleTime: 30_000,
  });
}

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useCallback(
    async (ids: string[], nextStatus: ApplicationStatus): Promise<void> => {
      if (ids.length === 0) return;

      const previous = queryClient.getQueryData<SupplierApplication[]>(
        SUPPLIER_APPLICATIONS_QUERY_KEY,
      );
      const nowIso = new Date().toISOString();
      const idSet = new Set(ids);

      if (previous) {
        queryClient.setQueryData<SupplierApplication[]>(
          SUPPLIER_APPLICATIONS_QUERY_KEY,
          previous.map(app =>
            idSet.has(app.id) ? { ...app, status: nextStatus, status_updated_at: nowIso } : app,
          ),
        );
      }

      const { error } = await supabase
        .from('supplier_applications')
        .update({ status: nextStatus, status_updated_at: nowIso })
        .in('id', ids);

      if (error) {
        if (previous) {
          queryClient.setQueryData(SUPPLIER_APPLICATIONS_QUERY_KEY, previous);
        }
        throw error;
      }

      queryClient.invalidateQueries({ queryKey: SUPPLIER_APPLICATIONS_QUERY_KEY });
    },
    [queryClient],
  );
}

export function useUpdateApplicationFields() {
  const queryClient = useQueryClient();

  return useCallback(
    async (ids: string[], fields: ApplicationEditableFields): Promise<void> => {
      if (ids.length === 0) return;

      const previous = queryClient.getQueryData<SupplierApplication[]>(
        SUPPLIER_APPLICATIONS_QUERY_KEY,
      );
      const idSet = new Set(ids);

      if (previous) {
        queryClient.setQueryData<SupplierApplication[]>(
          SUPPLIER_APPLICATIONS_QUERY_KEY,
          previous.map(app => (idSet.has(app.id) ? { ...app, ...fields } : app)),
        );
      }

      const { error } = await supabase
        .from('supplier_applications')
        .update(fields)
        .in('id', ids);

      if (error) {
        if (previous) {
          queryClient.setQueryData(SUPPLIER_APPLICATIONS_QUERY_KEY, previous);
        }
        throw error;
      }

      queryClient.invalidateQueries({ queryKey: SUPPLIER_APPLICATIONS_QUERY_KEY });
    },
    [queryClient],
  );
}

export function useDeleteApplications() {
  const queryClient = useQueryClient();

  return useCallback(
    async (ids: string[]): Promise<void> => {
      if (ids.length === 0) return;

      const previous = queryClient.getQueryData<SupplierApplication[]>(
        SUPPLIER_APPLICATIONS_QUERY_KEY,
      );
      const idSet = new Set(ids);

      if (previous) {
        queryClient.setQueryData<SupplierApplication[]>(
          SUPPLIER_APPLICATIONS_QUERY_KEY,
          previous.filter(app => !idSet.has(app.id)),
        );
      }

      const { error } = await supabase
        .from('supplier_applications')
        .delete()
        .in('id', ids);

      if (error) {
        if (previous) {
          queryClient.setQueryData(SUPPLIER_APPLICATIONS_QUERY_KEY, previous);
        }
        throw error;
      }

      queryClient.invalidateQueries({ queryKey: SUPPLIER_APPLICATIONS_QUERY_KEY });
    },
    [queryClient],
  );
}
