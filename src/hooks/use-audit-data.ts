import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AuditSupplier = {
  id: string;
  supplier_id: string;
  name: string;
  website: string | null;
  last_validation_confidence: number | null;
  last_validated_at: string | null;
  validation_failures: number | null;
};

export type ConfidenceBucket = {
  label: string;
  range: [number, number] | null;
  count: number;
};

export type AuditPR = {
  number: number;
  title: string;
  html_url: string;
  draft: boolean;
  created_at: string;
  head_ref: string;
  body_excerpt: string;
};

const SELECT_COLUMNS =
  'id, supplier_id, name, website, last_validation_confidence, last_validated_at, validation_failures';

function pgErr(e: unknown): Error {
  if (e instanceof Error) return e;
  if (e && typeof e === 'object') {
    const o = e as { message?: string; details?: string; hint?: string; code?: string };
    return new Error(o.message || o.details || o.hint || o.code || JSON.stringify(e));
  }
  return new Error(String(e));
}

async function fetchQueue(): Promise<AuditSupplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select(SELECT_COLUMNS)
    .not('website', 'is', null)
    .order('last_validation_confidence', { ascending: true, nullsFirst: true })
    .order('last_validated_at', { ascending: true, nullsFirst: true })
    .limit(20);

  if (error) throw pgErr(error);
  return (data ?? []) as AuditSupplier[];
}

export function useAuditQueue() {
  return useQuery({
    queryKey: ['audit-queue'],
    queryFn: fetchQueue,
    staleTime: 5 * 60 * 1000,
  });
}

const HISTOGRAM_BUCKETS: { label: string; range: [number, number] }[] = [
  { label: '0', range: [0, 0] },
  { label: '1–25', range: [1, 25] },
  { label: '26–50', range: [26, 50] },
  { label: '51–75', range: [51, 75] },
  { label: '76–94', range: [76, 94] },
  { label: '95–99', range: [95, 99] },
  { label: '100', range: [100, 100] },
];

async function fetchHistogram(): Promise<{ buckets: ConfidenceBucket[]; total: number }> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('last_validation_confidence');

  if (error) throw pgErr(error);

  const buckets: ConfidenceBucket[] = HISTOGRAM_BUCKETS.map(b => ({
    label: b.label,
    range: b.range,
    count: 0,
  }));
  let nullCount = 0;

  for (const row of data ?? []) {
    const c = row.last_validation_confidence;
    if (c === null || c === undefined) {
      nullCount++;
      continue;
    }
    const idx = HISTOGRAM_BUCKETS.findIndex(b => c >= b.range[0] && c <= b.range[1]);
    if (idx >= 0) buckets[idx].count++;
  }

  buckets.push({ label: 'Never validated', range: null, count: nullCount });

  return { buckets, total: data?.length ?? 0 };
}

export function useConfidenceHistogram() {
  return useQuery({
    queryKey: ['audit-histogram'],
    queryFn: fetchHistogram,
    staleTime: 5 * 60 * 1000,
  });
}

async function fetchRecentAudits(): Promise<AuditSupplier[]> {
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('suppliers')
    .select(SELECT_COLUMNS)
    .gte('last_validated_at', cutoff)
    .order('last_validated_at', { ascending: false })
    .limit(30);

  if (error) throw pgErr(error);
  return (data ?? []) as AuditSupplier[];
}

export function useRecentAudits() {
  return useQuery({
    queryKey: ['audit-recent'],
    queryFn: fetchRecentAudits,
    staleTime: 5 * 60 * 1000,
  });
}

async function fetchOpenPRs(): Promise<AuditPR[]> {
  const { data, error } = await supabase.functions.invoke('list-audit-prs');
  if (error) throw error;
  if (!data || !Array.isArray(data.prs)) return [];
  return data.prs as AuditPR[];
}

export function useOpenAuditPRs() {
  return useQuery({
    queryKey: ['audit-open-prs'],
    queryFn: fetchOpenPRs,
    staleTime: 60 * 1000,
    retry: false,
  });
}
