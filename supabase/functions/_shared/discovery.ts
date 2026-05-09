// Shared discovery helpers used by discover-suppliers and the
// per-source competitor directory crawlers.

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

export function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

export function normalizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace(/^www\./, '');
    return `https://${domain}`;
  } catch {
    return null;
  }
}

// Fetch every domain we already know about (live + previously discovered).
// Returned as a Set of bare lowercase domains for O(1) dedup checks.
export async function buildDedupSet(supabase: SupabaseClient): Promise<Set<string>> {
  const [{ data: suppliers }, { data: discovered }] = await Promise.all([
    supabase.from('suppliers').select('website'),
    supabase.from('discovered_suppliers').select('website'),
  ]);

  const set = new Set<string>();
  for (const row of suppliers ?? []) {
    const d = extractDomain(row.website);
    if (d) set.add(d);
  }
  for (const row of discovered ?? []) {
    const d = extractDomain(row.website);
    if (d) set.add(d);
  }
  return set;
}
