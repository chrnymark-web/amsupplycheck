import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { DateRange } from '@/components/admin/date-range-picker';

export type GA4Funnel = {
  visits: number;
  filesUploaded: number;
  supplierViews: number;
  conversions: number;
  available: boolean;
};

async function fetchGA4Funnel(range: DateRange): Promise<GA4Funnel> {
  const startDate = format(range.from, 'yyyy-MM-dd');
  const endDate = format(range.to, 'yyyy-MM-dd');

  const { data, error } = await supabase.functions.invoke('ga4-analytics', {
    body: { dateRange: { startDate, endDate } },
  });

  const funnel = data?.funnelData;
  if (error || !funnel) {
    return { visits: 0, filesUploaded: 0, supplierViews: 0, conversions: 0, available: false };
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
