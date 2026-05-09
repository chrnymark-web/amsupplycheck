// crawl-treatstock — competitor directory crawler v1, source = 'treatstock'.
// Walks https://www.treatstock.com/companies, extracts each company's external
// website + tech/material data, dedupes against existing suppliers and queued
// discoveries, and inserts new candidates into discovered_suppliers for admin
// review. Manually triggerable from the admin UI; also invoked weekly via
// pg_cron.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";
import { buildDedupSet } from "../_shared/discovery.ts";
import {
  CandidateSupplier,
  finishRun,
  insertCandidates,
  startRun,
} from "../_shared/discovered_suppliers.ts";
import { FirecrawlClient } from "../_shared/firecrawl.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SOURCE = 'treatstock';
const ROOT = 'https://www.treatstock.com/companies';
const COMPANY_URL_RE = /^https?:\/\/(?:www\.)?treatstock\.com\/company\/[^/?#]+\/?$/i;

const MAX_PAGES_PER_RUN = 50;
const MAX_NEW_DISCOVERED_PER_RUN = 200;
const EXTRACT_BATCH_SIZE = 5;
const BATCH_DELAY_MS = 500;

interface ExtractedCompany {
  name?: string;
  externalWebsite?: string;
  description?: string;
  technologies?: string[];
  materials?: string[];
  locationCountry?: string;
  locationCity?: string;
}

const extractionSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Company name shown on the page.' },
    externalWebsite: {
      type: 'string',
      description:
        'The company\'s own external website URL (NOT a treatstock.com URL). May be in a "Website" link or contact section.',
    },
    description: {
      type: 'string',
      description: 'Short description of what the company offers.',
    },
    technologies: {
      type: 'array',
      items: { type: 'string' },
      description: '3D printing technologies offered (e.g. FDM, SLA, SLS, MJF, DMLS).',
    },
    materials: {
      type: 'array',
      items: { type: 'string' },
      description: 'Materials offered (e.g. PLA, ABS, Nylon, Titanium).',
    },
    locationCountry: { type: 'string' },
    locationCity: { type: 'string' },
  },
  required: ['name'],
};

const extractionPrompt =
  'You are looking at a Treatstock company profile page. Extract the company\'s name, ' +
  'their external website (the link to their own domain — NOT treatstock.com), description, ' +
  '3D printing technologies offered, materials offered, and location. Skip if the page is ' +
  'not a 3D printing service provider.';

async function isAuthorized(req: Request, supabaseUrl: string, supabaseAnonKey: string, supabaseServiceKey: string): Promise<boolean> {
  const userAgent = req.headers.get('user-agent') || '';
  if (userAgent.includes('pg_net')) return true;

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return false;

  const token = authHeader.replace('Bearer ', '');
  if (token === supabaseServiceKey) return true;

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  try {
    const { data: claimsData, error } = await authClient.auth.getClaims(token);
    if (error || !claimsData?.claims) return false;
    const userId = claimsData.claims.sub;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

  if (!await isAuthorized(req, supabaseUrl, supabaseAnonKey, supabaseServiceKey)) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (!firecrawlApiKey) {
    return new Response(JSON.stringify({ success: false, error: 'Firecrawl not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Allow per-call override of MAX_PAGES_PER_RUN for smoke tests.
  let maxPages = MAX_PAGES_PER_RUN;
  try {
    const body = await req.json().catch(() => null);
    if (body && typeof body.maxPages === 'number' && body.maxPages > 0 && body.maxPages <= MAX_PAGES_PER_RUN) {
      maxPages = body.maxPages;
    }
  } catch { /* no body, use default */ }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const firecrawl = new FirecrawlClient(firecrawlApiKey);
  const logs: string[] = [];
  const log = (m: string) => { console.log(m); logs.push(`[${new Date().toISOString()}] ${m}`); };

  const runId = await startRun(supabase, SOURCE, { search_queries: [`${SOURCE}:${ROOT}`] });
  let suppliers_found = 0;
  let suppliers_new = 0;
  let suppliers_duplicate = 0;

  try {
    log(`Mapping ${ROOT}`);
    const allLinks = await firecrawl.map(ROOT, { limit: 1000 });
    log(`Map returned ${allLinks.length} links`);

    const companyUrls = Array.from(new Set(
      allLinks.filter(u => COMPANY_URL_RE.test(u))
    )).slice(0, maxPages);
    log(`Filtered to ${companyUrls.length} treatstock company URLs (cap ${maxPages})`);

    if (companyUrls.length === 0) {
      await finishRun(supabase, runId, {
        status: 'completed', source: SOURCE,
        suppliers_found: 0, suppliers_new: 0, suppliers_duplicate: 0,
        logs: [...logs, 'No company URLs found — Treatstock layout may have changed.'],
      });
      return new Response(JSON.stringify({
        success: true, runId, source: SOURCE,
        suppliers_found: 0, suppliers_new: 0, suppliers_duplicate: 0,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const knownDomains = await buildDedupSet(supabase);
    log(`Dedup set size: ${knownDomains.size} known domains`);

    for (let i = 0; i < companyUrls.length; i += EXTRACT_BATCH_SIZE) {
      if (suppliers_new >= MAX_NEW_DISCOVERED_PER_RUN) {
        log(`Hit MAX_NEW_DISCOVERED_PER_RUN=${MAX_NEW_DISCOVERED_PER_RUN}, stopping`);
        break;
      }
      const batch = companyUrls.slice(i, i + EXTRACT_BATCH_SIZE);
      log(`Extract batch ${Math.floor(i / EXTRACT_BATCH_SIZE) + 1} (${batch.length} urls)`);

      const candidates: CandidateSupplier[] = [];
      // Per-URL extract (Firecrawl /extract handles arrays but per-URL is more
      // robust to per-page failures and lets us tag source_url accurately).
      const results = await Promise.allSettled(batch.map(async (url) => {
        const data = await firecrawl.extract<ExtractedCompany>(
          [url], extractionSchema, extractionPrompt,
        );
        return { url, data };
      }));

      for (const r of results) {
        if (r.status !== 'fulfilled' || !r.value.data) continue;
        const { url, data } = r.value;
        suppliers_found++;
        if (!data.externalWebsite || !data.name) continue;
        candidates.push({
          name: data.name,
          website: data.externalWebsite,
          description: data.description ?? null,
          technologies: data.technologies ?? null,
          materials: data.materials ?? null,
          location_country: data.locationCountry ?? null,
          location_city: data.locationCity ?? null,
          source_url: url,
          discovery_confidence: 0.7,
          raw_data: { extracted: data },
        });
      }

      if (candidates.length > 0) {
        const ins = await insertCandidates(supabase, candidates, SOURCE, knownDomains);
        suppliers_new += ins.inserted;
        suppliers_duplicate += ins.skipped_duplicate;
        log(`Batch insert: +${ins.inserted} new, ${ins.skipped_duplicate} dup, ${ins.skipped_invalid} invalid`);
      }

      if (i + EXTRACT_BATCH_SIZE < companyUrls.length) {
        await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
      }
    }

    log(`Done: ${suppliers_new} new, ${suppliers_duplicate} dup, ${suppliers_found} pages processed`);
    await finishRun(supabase, runId, {
      status: 'completed', source: SOURCE,
      suppliers_found, suppliers_new, suppliers_duplicate, logs,
    });
    return new Response(JSON.stringify({
      success: true, runId, source: SOURCE,
      suppliers_found, suppliers_new, suppliers_duplicate,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    log(`Crawl failed: ${msg}`);
    await finishRun(supabase, runId, {
      status: 'failed', source: SOURCE,
      suppliers_found, suppliers_new, suppliers_duplicate,
      logs, error_message: msg,
    });
    return new Response(JSON.stringify({ success: false, error: msg, runId }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
