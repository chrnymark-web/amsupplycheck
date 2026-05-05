import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DateRange } from '@/components/admin/date-range-picker';

export type FunnelData = {
  visits: number;
  filesUploaded: number;
  supplierViews: number;
  affiliateClicks: number;
  rates: {
    visitToUpload: number;
    uploadToView: number;
    viewToClick: number;
    overall: number;
  };
  dropOff: {
    visitToUpload: number;
    uploadToView: number;
    viewToClick: number;
  };
  hasTrafficData: boolean;
};

function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

async function fetchFunnel(range: DateRange): Promise<FunnelData> {
  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();
  const countHead = { count: 'exact' as const, head: true };

  const eventCount = (eventName: string) =>
    supabase
      .from('analytics_events')
      .select('*', countHead)
      .eq('event_name', eventName)
      .gte('created_at', fromIso)
      .lte('created_at', toIso);

  const [
    uploadRes,
    pageViewRes,
    supplierViewRes,
    outboundRes,
  ] = await Promise.all([
    supabase
      .from('upload_events')
      .select('*', countHead)
      .neq('source_page', 'backfill')
      .gte('created_at', fromIso)
      .lte('created_at', toIso),
    eventCount('page_view'),
    eventCount('supplier_pageview'),
    eventCount('outbound_click'),
  ]);

  const visits = pageViewRes.count ?? 0;
  const filesUploaded = uploadRes.count ?? 0;
  const supplierViews = supplierViewRes.count ?? 0;
  const affiliateClicks = outboundRes.count ?? 0;
  const hasTrafficData = visits > 0 || supplierViews > 0;

  return {
    visits,
    filesUploaded,
    supplierViews,
    affiliateClicks,
    rates: {
      visitToUpload: pct(filesUploaded, visits),
      uploadToView: pct(supplierViews, filesUploaded),
      viewToClick: pct(affiliateClicks, supplierViews),
      overall: pct(affiliateClicks, visits),
    },
    dropOff: {
      visitToUpload: Math.max(visits - filesUploaded, 0),
      uploadToView: Math.max(filesUploaded - supplierViews, 0),
      viewToClick: Math.max(supplierViews - affiliateClicks, 0),
    },
    hasTrafficData,
  };
}

export function useFunnelData(range: DateRange) {
  return useQuery({
    queryKey: ['funnel-data', range.from.toISOString(), range.to.toISOString()],
    queryFn: () => fetchFunnel(range),
    staleTime: 5 * 60 * 1000,
  });
}
