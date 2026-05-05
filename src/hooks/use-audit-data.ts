import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AuditSupplier = {
  id: string;
  supplier_id: string;
  name: string;
  slug: string | null;
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
  'id, supplier_id, name, slug, website, last_validation_confidence, last_validated_at, validation_failures';

async function fetchQueue(): Promise<AuditSupplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select(SELECT_COLUMNS)
    .not('website', 'is', null)
    .order('last_validation_confidence', { ascending: true, nullsFirst: true })
    .order('last_validated_at', { ascending: true, nullsFirst: true })
    .limit(20);

  if (error) throw error;
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
  { label: '0–20', range: [0, 20] },
  { label: '20–40', range: [20, 40] },
  { label: '40–60', range: [40, 60] },
  { label: '60–80', range: [60, 80] },
  { label: '80–100', range: [80, 100.0001] },
];

async function fetchHistogram(): Promise<{ buckets: ConfidenceBucket[]; total: number }> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('last_validation_confidence');

  if (error) throw error;

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
    const idx = HISTOGRAM_BUCKETS.findIndex(b => c >= b.range[0] && c < b.range[1]);
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

  if (error) throw error;
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
