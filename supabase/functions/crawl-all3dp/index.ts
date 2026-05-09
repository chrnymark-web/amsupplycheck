// crawl-all3dp — competitor directory crawler v1, source = 'all3dp'.
// Crawls a small hand-picked set of All3DP "best 3D printing service" articles
// (single editorial pages each listing many providers), extracts the listed
// suppliers, dedupes, and inserts into discovered_suppliers for admin review.
// Manually triggerable from the admin UI; also invoked weekly via pg_cron.

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

const SOURCE = 'all3dp';

// Curated list of All3DP best-of articles. Each is a single page that lists
// many 3D printing services with their websites. Update this list when All3DP
// publishes new editorial pieces.
const ARTICLE_URLS = [
  'https://all3dp.com/1/3d-printing-services-online-3d-printing-service/',
  'https://all3dp.com/2/best-online-3d-printing-services-3d-print-anywhere/',
  'https://all3dp.com/2/best-large-3d-printing-service-online/',
  'https://all3dp.com/2/best-metal-3d-printing-service/',
  'https://all3dp.com/2/best-resin-3d-printing-service-online/',
];

const MAX_NEW_DISCOVERED_PER_RUN = 200;

interface ExtractedSupplierList {
  suppliers: Array<{
    name?: string;
    website?: string;
    description?: string;
    technologies?: string[];
    materials?: string[];
    locationCountry?: string;
    locationCity?: string;
  }>;
}

const extractionSchema = {
  type: 'object',
  properties: {
    suppliers: {
      type: 'array',
      description: 'List of every 3D printing service provider mentioned in the article.',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Company name.' },
          website: {
            type: 'string',
            description: 'Company website URL — their own domain, NOT all3dp.com.',
          },
          description: { type: 'string' },
          technologies: { type: 'array', items: { type: 'string' } },
          materials: { type: 'array', items: { type: 'string' } },
          locationCountry: { type: 'string' },
          locationCity: { type: 'string' },
        },
        required: ['name', 'website'],
      },
    },
  },
  required: ['suppliers'],
};

const extractionPrompt =
  'You are looking at an All3DP editorial article that reviews multiple 3D printing service ' +
  'providers. Extract every distinct provider mentioned: name, their own website (NOT all3dp.com), ' +
  'description, technologies offered, materials offered, and location if mentioned. Skip the article ' +
  'author and All3DP itself. Skip equipment manufacturers — only services that print on demand for customers.';

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

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const firecrawl = new FirecrawlClient(firecrawlApiKey);
  const logs: string[] = [];
  const log = (m: string) => { console.log(m); logs.push(`[${new Date().toISOString()}] ${m}`); };

  const runId = await startRun(supabase, SOURCE, { search_queries: ARTICLE_URLS });
  let suppliers_found = 0;
  let suppliers_new = 0;
  let suppliers_duplicate = 0;

  try {
    const knownDomains = await buildDedupSet(supabase);
    log(`Dedup set size: ${knownDomains.size} known domains`);
    log(`Extracting from ${ARTICLE_URLS.length} All3DP articles`);

    for (const articleUrl of ARTICLE_URLS) {
      if (suppliers_new >= MAX_NEW_DISCOVERED_PER_RUN) {
        log(`Hit MAX_NEW_DISCOVERED_PER_RUN=${MAX_NEW_DISCOVERED_PER_RUN}, stopping`);
        break;
      }
      log(`Extract: ${articleUrl}`);

      let extracted: ExtractedSupplierList | null = null;
      try {
        extracted = await firecrawl.extract<ExtractedSupplierList>(
          [articleUrl], extractionSchema, extractionPrompt,
        );
      } catch (e) {
        log(`Extract failed for ${articleUrl}: ${e instanceof Error ? e.message : e}`);
        continue;
      }

      const list = extracted?.suppliers ?? [];
      log(`  → got ${list.length} suppliers`);
      suppliers_found += list.length;

      const candidates: CandidateSupplier[] = [];
      for (const s of list) {
        if (!s.name || !s.website) continue;
        candidates.push({
          name: s.name,
          website: s.website,
          description: s.description ?? null,
          technologies: s.technologies ?? null,
          materials: s.materials ?? null,
          location_country: s.locationCountry ?? null,
          location_city: s.locationCity ?? null,
          source_url: articleUrl,
          discovery_confidence: 0.75,
          raw_data: { extracted: s },
        });
      }

      if (candidates.length > 0) {
        const ins = await insertCandidates(supabase, candidates, SOURCE, knownDomains);
        suppliers_new += ins.inserted;
        suppliers_duplicate += ins.skipped_duplicate;
        log(`  → +${ins.inserted} new, ${ins.skipped_duplicate} dup, ${ins.skipped_invalid} invalid`);
      }
    }

    log(`Done: ${suppliers_new} new, ${suppliers_duplicate} dup, ${suppliers_found} suppliers seen`);
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
