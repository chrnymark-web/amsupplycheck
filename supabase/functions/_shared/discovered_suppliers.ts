// Helpers for writing into discovered_suppliers and discovery_runs.
// Used by competitor directory crawlers.

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";
import { extractDomain, normalizeUrl } from "./discovery.ts";

export interface CandidateSupplier {
  name: string;
  website: string;
  description?: string | null;
  technologies?: string[] | null;
  materials?: string[] | null;
  location_country?: string | null;
  location_city?: string | null;
  source_url?: string | null;
  discovery_confidence?: number | null;
  raw_data?: Record<string, unknown> | null;
}

export interface InsertResult {
  inserted: number;
  skipped_invalid: number;
  skipped_duplicate: number;
}

// Insert candidates into discovered_suppliers, dedup'd against an in-memory
// set of known bare domains. Bulk INSERT with ON CONFLICT skips race-condition
// duplicates (UNIQUE constraint on website). The returned counts feed
// discovery_runs.
export async function insertCandidates(
  supabase: SupabaseClient,
  candidates: CandidateSupplier[],
  source: string,
  knownDomains: Set<string>,
): Promise<InsertResult> {
  let skipped_invalid = 0;
  let skipped_duplicate = 0;

  const rows: Record<string, unknown>[] = [];
  for (const c of candidates) {
    const domain = extractDomain(c.website);
    if (!domain || !c.name) {
      skipped_invalid++;
      continue;
    }
    if (knownDomains.has(domain)) {
      skipped_duplicate++;
      continue;
    }
    knownDomains.add(domain);
    rows.push({
      name: c.name,
      website: normalizeUrl(c.website),
      description: c.description ?? null,
      technologies: c.technologies ?? null,
      materials: c.materials ?? null,
      location_country: c.location_country ?? null,
      location_city: c.location_city ?? null,
      source_url: c.source_url ?? null,
      discovery_confidence: c.discovery_confidence ?? null,
      source,
      status: 'pending',
      raw_data: c.raw_data ?? null,
    });
  }

  if (rows.length === 0) {
    return { inserted: 0, skipped_invalid, skipped_duplicate };
  }

  // Upsert with ignoreDuplicates so concurrent runs don't blow up on the
  // website UNIQUE constraint.
  const { data, error } = await supabase
    .from('discovered_suppliers')
    .upsert(rows, { onConflict: 'website', ignoreDuplicates: true })
    .select('id');

  if (error) {
    throw new Error(`Insert into discovered_suppliers failed: ${error.message}`);
  }

  const inserted = data?.length ?? 0;
  // Anything we tried to insert but the DB-level dedup caught:
  skipped_duplicate += rows.length - inserted;
  return { inserted, skipped_invalid, skipped_duplicate };
}

export interface RunSummary {
  status: 'completed' | 'failed';
  source: string;
  suppliers_found: number;
  suppliers_new: number;
  suppliers_duplicate: number;
  credits_used?: number;
  logs: string[];
  error_message?: string;
}

// Create a run row at start; caller updates it via updateRun() at end.
export async function startRun(
  supabase: SupabaseClient,
  source: string,
  meta: { search_queries?: string[] } = {},
): Promise<string> {
  const { data, error } = await supabase
    .from('discovery_runs')
    .insert({
      source,
      search_queries: meta.search_queries ?? [source],
      status: 'running',
    })
    .select('id')
    .single();
  if (error || !data) {
    throw new Error(`Failed to create discovery run: ${error?.message}`);
  }
  return data.id;
}

export async function finishRun(
  supabase: SupabaseClient,
  runId: string,
  summary: RunSummary,
): Promise<void> {
  const { error } = await supabase
    .from('discovery_runs')
    .update({
      status: summary.status,
      completed_at: new Date().toISOString(),
      suppliers_found: summary.suppliers_found,
      suppliers_new: summary.suppliers_new,
      suppliers_duplicate: summary.suppliers_duplicate,
      logs: summary.logs,
      error_message: summary.error_message ?? null,
    })
    .eq('id', runId);
  if (error) {
    console.error(`Failed to finish run ${runId}:`, error);
  }
}
