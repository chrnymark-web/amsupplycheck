import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { DateRange } from '@/components/admin/date-range-picker';

export type FunnelData = {
  visits: number;
  filesUploaded: number;
  supplierViews: number;
  affiliateClicks: number;
  quoteRequests: number;
  newsletterSignups: number;
  totalConversions: number;
  rates: {
    visitToUpload: number;
    uploadToView: number;
    viewToAnyConversion: number;
    overall: number;
  };
  dropOff: {
    visitToUpload: number;
    uploadToView: number;
    viewToConversion: number;
  };
  hasTrafficData: boolean;
};

function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

async function fetchFunnel(range: DateRange): Promise<FunnelData> {
  const startDate = format(range.from, 'yyyy-MM-dd');
  const endDate = format(range.to, 'yyyy-MM-dd');
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
    quoteRes,
    newsletterRes,
    uploadRes,
    pageViewRes,
    supplierViewRes,
    outboundRes,
  ] = await Promise.all([
    supabase
      .from('quote_requests')
      .select('*', countHead)
      .gte('created_at', fromIso)
      .lte('created_at', toIso),
    supabase
      .from('newsletter_signups')
      .select('*', countHead)
      .gte('created_at', fromIso)
      .lte('created_at', toIso),
    supabase
      .from('upload_events')
      .select('*', countHead)
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
  const quoteRequests = quoteRes.count ?? 0;
  const newsletterSignups = newsletterRes.count ?? 0;
  const hasTrafficData = visits > 0 || supplierViews > 0;
  const totalConversions = affiliateClicks + quoteRequests + newsletterSignups;

  return {
    visits,
    filesUploaded,
    supplierViews,
    affiliateClicks,
    quoteRequests,
    newsletterSignups,
    totalConversions,
    rates: {
      visitToUpload: pct(filesUploaded, visits),
      uploadToView: pct(supplierViews, filesUploaded),
      viewToAnyConversion: pct(totalConversions, supplierViews),
      overall: pct(totalConversions, visits),
    },
    dropOff: {
      visitToUpload: Math.max(visits - filesUploaded, 0),
      uploadToView: Math.max(filesUploaded - supplierViews, 0),
      viewToConversion: Math.max(supplierViews - totalConversions, 0),
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
