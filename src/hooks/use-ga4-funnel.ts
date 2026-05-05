import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { DateRange } from '@/components/admin/date-range-picker';

export type GA4UnavailableReason = 'credentials_missing' | 'edge_function_error' | 'no_funnel_data';

export type GA4Funnel = {
  visits: number;
  filesUploaded: number;
  supplierViews: number;
  conversions: number;
  available: boolean;
  reason?: GA4UnavailableReason;
  errorMessage?: string;
};

async function fetchGA4Funnel(range: DateRange): Promise<GA4Funnel> {
  const startDate = format(range.from, 'yyyy-MM-dd');
  const endDate = format(range.to, 'yyyy-MM-dd');

  const { data, error } = await supabase.functions.invoke('ga4-analytics', {
    body: { dateRange: { startDate, endDate } },
  });

  const empty = { visits: 0, filesUploaded: 0, supplierViews: 0, conversions: 0 };

  if (error) {
    return { ...empty, available: false, reason: 'edge_function_error', errorMessage: error.message };
  }

  if (data?.error) {
    const isCreds = typeof data.error === 'string' && /credentials/i.test(data.error);
    return {
      ...empty,
      available: false,
      reason: isCreds ? 'credentials_missing' : 'edge_function_error',
      errorMessage: data.error,
    };
  }

  const funnel = data?.funnelData;
  if (!funnel) {
    return { ...empty, available: false, reason: 'no_funnel_data' };
  }

  return {
    visits: funnel.landingViews ?? 0,
    filesUploaded: funnel.filesUploaded ?? 0,
    supplierViews: funnel.supplierViews ?? 0,
    conversions: funnel.conversions ?? 0,
    available: true,
  };
}

export function useGA4Funnel(range: DateRange, enabled = true) {
  return useQuery({
    queryKey: ['ga4-funnel', range.from.toISOString(), range.to.toISOString()],
    queryFn: () => fetchGA4Funnel(range),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}
