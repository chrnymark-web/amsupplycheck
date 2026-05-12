import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DateRange } from '@/components/admin/date-range-picker';

export const LEAD_PRICE_USD = 50;
export const SUBSCRIPTION_PRICE_USD = 600;
export const SUBSCRIPTION_MONTHLY_USD = SUBSCRIPTION_PRICE_USD / 12;
export const GOAL_MRR_USD = 4400;
export const DKK_PER_USD = 6.85;

export type WeeklyKPIs = {
  // Buyer-funnel (scoped to range)
  visitors: number;
  stl_uploads: number;
  supplier_views: number;
  outbound_clicks: number;
  quote_submits: number;
  conversion_rate_pct: number;

  // Supplier-funnel
  active_suppliers: number;
  partner_count: number;
  leads_in_range: number;
  new_partners_in_range: number;

  // Revenue (always shown, not range-scoped except where noted)
  revenue_booked_ytd_usd: number;
  lead_revenue_in_range_usd: number;
  leads_30d: number;
  current_mrr_equivalent_usd: number;
  goal_gap_usd: number;
  goal_progress_pct: number;
};

function pct(num: number, den: number): number {
  if (!den) return 0;
  return Number(((num / den) * 100).toFixed(2));
}

async function fetchWeeklyKPIs(range: DateRange): Promise<WeeklyKPIs> {
  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();
  const yearStartIso = new Date(new Date().getFullYear(), 0, 1).toISOString();
  const thirtyDaysAgoIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const headExact = { count: 'exact' as const, head: true };

  const eventCount = (eventName: string) =>
    supabase
      .from('analytics_events')
      .select('*', headExact)
      .eq('event_name', eventName)
      .gte('created_at', fromIso)
      .lte('created_at', toIso);

  const [
    visitorsRes,
    supplierViewsRes,
    outboundClicksRes,
    quoteSubmitsRes,
    uploadsRes,
    leadsInRangeRes,
    leads30dRes,
    suppliersRes,
    partnersRes,
    newPartnersRes,
    revenueYtdRes,
  ] = await Promise.all([
    eventCount('page_view'),
    eventCount('supplier_pageview'),
    eventCount('outbound_click'),
    eventCount('quote_request_submit'),
    supabase
      .from('upload_events')
      .select('*', headExact)
      .neq('source_page', 'backfill')
      .gte('created_at', fromIso)
      .lte('created_at', toIso),
    // Leads with supplier_id attached (the $50 revenue events)
    supabase
      .from('quote_requests')
      .select('*', headExact)
      .not('supplier_id', 'is', null)
      .gte('created_at', fromIso)
      .lte('created_at', toIso),
    supabase
      .from('quote_requests')
      .select('*', headExact)
      .not('supplier_id', 'is', null)
      .gte('created_at', thirtyDaysAgoIso),
    supabase.from('suppliers').select('*', headExact),
    supabase
      .from('suppliers')
      .select('*', headExact)
      .eq('is_partner', true),
    supabase
      .from('suppliers')
      .select('*', headExact)
      .eq('is_partner', true)
      .gte('subscription_paid_at', fromIso)
      .lte('subscription_paid_at', toIso),
    supabase
      .from('suppliers')
      .select('subscription_paid_usd')
      .eq('is_partner', true)
      .gte('subscription_paid_at', yearStartIso),
  ]);

  const visitors = visitorsRes.count ?? 0;
  const supplier_views = supplierViewsRes.count ?? 0;
  const outbound_clicks = outboundClicksRes.count ?? 0;
  const quote_submits = quoteSubmitsRes.count ?? 0;
  const stl_uploads = uploadsRes.count ?? 0;
  const leads_in_range = leadsInRangeRes.count ?? 0;
  const leads_30d = leads30dRes.count ?? 0;
  const active_suppliers = suppliersRes.count ?? 0;
  const partner_count = partnersRes.count ?? 0;
  const new_partners_in_range = newPartnersRes.count ?? 0;

  const revenue_booked_ytd_usd = (revenueYtdRes.data ?? []).reduce(
    (sum, row) => sum + Number(row.subscription_paid_usd ?? 0),
    0,
  );

  const lead_revenue_in_range_usd = leads_in_range * LEAD_PRICE_USD;
  const subscription_mrr = partner_count * SUBSCRIPTION_MONTHLY_USD;
  const lead_revenue_30d = leads_30d * LEAD_PRICE_USD;
  const current_mrr_equivalent_usd = subscription_mrr + lead_revenue_30d;
  const goal_gap_usd = Math.max(GOAL_MRR_USD - current_mrr_equivalent_usd, 0);
  const goal_progress_pct = pct(current_mrr_equivalent_usd, GOAL_MRR_USD);

  return {
    visitors,
    stl_uploads,
    supplier_views,
    outbound_clicks,
    quote_submits,
    conversion_rate_pct: pct(quote_submits, visitors),

    active_suppliers,
    partner_count,
    leads_in_range,
    new_partners_in_range,

    revenue_booked_ytd_usd,
    lead_revenue_in_range_usd,
    leads_30d,
    current_mrr_equivalent_usd: Math.round(current_mrr_equivalent_usd),
    goal_gap_usd: Math.round(goal_gap_usd),
    goal_progress_pct,
  };
}

export function useWeeklyKPIs(range: DateRange) {
  return useQuery({
    queryKey: ['weekly-kpis', range.from.toISOString(), range.to.toISOString()],
    queryFn: () => fetchWeeklyKPIs(range),
    staleTime: 5 * 60 * 1000,
  });
}

export type PartnerRevenueRow = {
  supplier_id: string;
  name: string;
  subscription_paid_usd: number | null;
  subscription_paid_at: string | null;
  subscription_expires_at: string | null;
  subscription_status: string | null;
  leads_30d: number;
  leads_7d: number;
};

async function fetchPartnerRevenue(): Promise<PartnerRevenueRow[]> {
  const { data, error } = await supabase
    .from('partner_revenue_summary')
    .select('*')
    .order('subscription_paid_at', { ascending: false, nullsFirst: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    supplier_id: row.supplier_id ?? '',
    name: row.name ?? '(unknown)',
    subscription_paid_usd: row.subscription_paid_usd ?? null,
    subscription_paid_at: row.subscription_paid_at ?? null,
    subscription_expires_at: row.subscription_expires_at ?? null,
    subscription_status: row.subscription_status ?? null,
    leads_30d: Number(row.leads_30d ?? 0),
    leads_7d: Number(row.leads_7d ?? 0),
  }));
}

export function usePartnerRevenue() {
  return useQuery({
    queryKey: ['partner-revenue'],
    queryFn: fetchPartnerRevenue,
    staleTime: 5 * 60 * 1000,
  });
}
