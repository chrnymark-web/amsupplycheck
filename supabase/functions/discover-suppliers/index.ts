import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";
import { extractDomain, normalizeUrl, buildDedupSet } from "../_shared/discovery.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Search queries for finding 3D printing suppliers.
//
// QUERY_POOL: typed entries with explicit category + subregion. Used for LRU
// rotation when discovery_config.rotation_enabled = true. First STATIC_QUERY_COUNT
// entries are the historically-stable list — order preserved from the pre-rotation
// SEARCH_QUERIES constant, so flag-off behavior is identical.
type PoolEntry = { query: string; category: string; subregion?: string };

const QUERY_POOL: PoolEntry[] = [
  // ── Stable 20 (used as static fallback when rotation off) ──
  // Niche technologies (5)
  { query: "bioprinting service tissue engineering", category: "Niche Tech" },
  { query: "ceramic 3D printing service industrial", category: "Niche Tech" },
  { query: "sand casting 3D printing foundry mold", category: "Niche Tech" },
  { query: "WAAM wire arc additive manufacturing service", category: "Niche Tech" },
  { query: "micro 3D printing precision manufacturing", category: "Niche Tech" },
  // Specialty applications (4)
  { query: "concrete 3D printing construction service", category: "Specialty" },
  { query: "jewelry 3D printing casting service", category: "Specialty" },
  { query: "eyewear 3D printing glasses frames", category: "Specialty" },
  { query: "footwear 3D printing shoe manufacturing", category: "Specialty" },
  // Advanced materials (3)
  { query: "PEEK 3D printing service high performance", category: "Materials" },
  { query: "carbon fiber 3D printing continuous fiber", category: "Materials" },
  { query: "titanium 3D printing medical aerospace", category: "Materials" },
  // Geographic — emerging markets (8)
  { query: "3D printing service Japan additive manufacturing", category: "Geographic", subregion: "Asia-East" },
  { query: "3D printing service Korea manufacturing", category: "Geographic", subregion: "Asia-East" },
  { query: "3D printing service Singapore industrial", category: "Geographic", subregion: "Asia-SE" },
  { query: "3D printing service Bangalore additive manufacturing", category: "Geographic", subregion: "Asia-South" },
  { query: "3D printing service Mumbai industrial manufacturing", category: "Geographic", subregion: "Asia-South" },
  { query: "3D printing service São Paulo Brazil manufatura aditiva", category: "Geographic", subregion: "LatAm" },
  { query: "3D printing service Ciudad de México prototipado", category: "Geographic", subregion: "LatAm" },
  { query: "3D printing service UAE Dubai manufacturing", category: "Geographic", subregion: "MEA" },

  // ── Rotation-only extension (30) ──
  // Africa (5)
  { query: "3D printing service Egypt Cairo additive manufacturing", category: "Geographic", subregion: "Africa" },
  { query: "3D printing service Nigeria Lagos manufacturing", category: "Geographic", subregion: "Africa" },
  { query: "3D printing service South Africa Johannesburg additive", category: "Geographic", subregion: "Africa" },
  { query: "3D printing service Morocco Casablanca prototypage", category: "Geographic", subregion: "Africa" },
  { query: "3D printing service Kenya Nairobi industrial", category: "Geographic", subregion: "Africa" },
  // Eastern Europe (5)
  { query: "3D printing service Poland Warsaw druk 3D", category: "Geographic", subregion: "Europe-East" },
  { query: "3D printing service Czech Republic Prague tisk 3D", category: "Geographic", subregion: "Europe-East" },
  { query: "3D printing service Romania Bucharest imprimare 3D", category: "Geographic", subregion: "Europe-East" },
  { query: "3D printing service Estonia Tallinn additive manufacturing", category: "Geographic", subregion: "Europe-East" },
  { query: "3D printing service Hungary Budapest gyártás", category: "Geographic", subregion: "Europe-East" },
  // Southeast Asia (5)
  { query: "3D printing service Vietnam Ho Chi Minh manufacturing", category: "Geographic", subregion: "Asia-SE" },
  { query: "3D printing service Indonesia Jakarta percetakan 3D", category: "Geographic", subregion: "Asia-SE" },
  { query: "3D printing service Thailand Bangkok additive manufacturing", category: "Geographic", subregion: "Asia-SE" },
  { query: "3D printing service Philippines Manila prototyping", category: "Geographic", subregion: "Asia-SE" },
  { query: "3D printing service Malaysia Kuala Lumpur industrial", category: "Geographic", subregion: "Asia-SE" },
  // Iberian / LatAm local-language (3)
  { query: "servicio impresión 3D Madrid Barcelona fabricación aditiva", category: "Geographic", subregion: "Europe" },
  { query: "serviço impressão 3D Portugal Lisboa Porto manufatura aditiva", category: "Geographic", subregion: "Europe" },
  { query: "servicio impresión 3D Argentina Buenos Aires prototipado", category: "Geographic", subregion: "LatAm" },
  // Niche tech extension (5)
  { query: "DLP 3D printing dental laboratory crowns aligners", category: "Niche Tech" },
  { query: "MJF Multi Jet Fusion nylon PA12 service", category: "Niche Tech" },
  { query: "EBM electron beam melting titanium implant service", category: "Niche Tech" },
  { query: "hybrid additive subtractive manufacturing 5-axis", category: "Niche Tech" },
  { query: "binder jetting metal 3D printing service production", category: "Niche Tech" },
  // Underexplored applications (5)
  { query: "3D printing sports equipment custom helmets cycling", category: "Application" },
  { query: "3D printing prosthetics orthotics custom limbs", category: "Application" },
  { query: "3D printing archaeology museum replicas heritage", category: "Application" },
  { query: "3D printing marine industry boat parts custom", category: "Application" },
  { query: "3D printing oil gas downhole tooling service", category: "Application" },
];

const STATIC_QUERY_COUNT = 20;

// Lookup map: query string → PoolEntry. Used by getQueryCategory so the
// category lives with the entry instead of being inferred from substring matches.
const POOL_BY_QUERY = new Map<string, PoolEntry>(QUERY_POOL.map(e => [e.query, e]));

// Results per query (balanced for credit efficiency)
const RESULTS_PER_QUERY = 5;

// Maximum new suppliers to discover per run
const MAX_NEW_SUPPLIERS = 10;

// Helper to categorize queries for logging. Consults POOL_BY_QUERY first (where
// category is authoritatively defined per entry); falls back to substring
// matching for any query that arrives from outside the pool (defensive only —
// shouldn't happen in practice).
function getQueryCategory(query: string): string {
  const entry = POOL_BY_QUERY.get(query);
  if (entry) return entry.category;
  if (query.includes('Japan') || query.includes('Korea') ||
      query.includes('Singapore') || query.includes('India') ||
      query.includes('Brazil') || query.includes('Mexico') ||
      query.includes('UAE') || query.includes('Dubai') ||
      query.includes('impressão') || query.includes('impresión')) return 'Geographic';
  if (query.includes('bio') || query.includes('ceramic') ||
      query.includes('WAAM') || query.includes('micro')) return 'Niche Tech';
  if (query.includes('PEEK') || query.includes('titanium') ||
      query.includes('carbon fiber')) return 'Materials';
  if (query.includes('concrete') || query.includes('jewelry') ||
      query.includes('eyewear') || query.includes('footwear')) return 'Specialty';
  return 'General';
}

// LRU + category-balanced query selection for rotation mode.
// Reads last 30 days of discovery_runs.search_queries to compute per-query
// last-used-at, sorts pool ascending by that timestamp (alphabetical tie-break
// so chained call sees the same order), then round-robins by category. Within
// Geographic, interleaves by subregion so the first N geo queries span N
// different subregions even if the category-skip fires early.
async function selectQueriesForRun(
  pool: PoolEntry[],
  offset: number,
  count: number,
  // deno-lint-ignore no-explicit-any
  supabase: any,
  log: (m: string) => void,
): Promise<PoolEntry[]> {
  const lastUsedByQuery = new Map<string, number>();
  try {
    const sinceIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentRuns } = await supabase
      .from('discovery_runs')
      .select('search_queries, started_at')
      .eq('source', 'search')
      .gte('started_at', sinceIso)
      .order('started_at', { ascending: false })
      .limit(200);
    for (const row of recentRuns || []) {
      const ts = new Date(row.started_at).getTime();
      for (const q of row.search_queries || []) {
        const prev = lastUsedByQuery.get(q) ?? 0;
        if (ts > prev) lastUsedByQuery.set(q, ts);
      }
    }
  } catch (err) {
    log(`selectQueriesForRun: failed to load history (${(err as Error).message}); falling back to pool order`);
    return pool.slice(offset, offset + count);
  }

  // Sort ascending by last_used_at (never-seen = epoch 0 = stalest), alphabetical tie-break
  const ranked = [...pool].sort((a, b) => {
    const aTs = lastUsedByQuery.get(a.query) ?? 0;
    const bTs = lastUsedByQuery.get(b.query) ?? 0;
    if (aTs !== bTs) return aTs - bTs;
    return a.query.localeCompare(b.query);
  });

  // Group by category, preserving ranked order
  const byCategory = new Map<string, PoolEntry[]>();
  for (const entry of ranked) {
    if (!byCategory.has(entry.category)) byCategory.set(entry.category, []);
    byCategory.get(entry.category)!.push(entry);
  }

  // Within Geographic, interleave by subregion
  const geo = byCategory.get('Geographic') || [];
  if (geo.length > 0) {
    const bySubregion = new Map<string, PoolEntry[]>();
    for (const e of geo) {
      const sr = e.subregion || 'Other';
      if (!bySubregion.has(sr)) bySubregion.set(sr, []);
      bySubregion.get(sr)!.push(e);
    }
    const interleaved: PoolEntry[] = [];
    let progress = true;
    while (progress) {
      progress = false;
      for (const entries of bySubregion.values()) {
        const next = entries.shift();
        if (next) { interleaved.push(next); progress = true; }
      }
    }
    byCategory.set('Geographic', interleaved);
  }

  // Round-robin across all categories until we have offset+count picks
  const orderedCategories = Array.from(byCategory.keys()).sort();
  const selected: PoolEntry[] = [];
  const totalNeeded = offset + count;
  let progress = true;
  while (progress && selected.length < totalNeeded) {
    progress = false;
    for (const cat of orderedCategories) {
      if (selected.length >= totalNeeded) break;
      const list = byCategory.get(cat);
      if (list && list.length > 0) {
        selected.push(list.shift()!);
        progress = true;
      }
    }
  }

  const picked = selected.slice(offset, offset + count);
  const preview = picked.map(e => `[${e.category}${e.subregion ? '/' + e.subregion : ''}]`).join(' ');
  log(`Rotation selected ${picked.length} queries (offset=${offset}, pool=${pool.length}): ${preview}`);
  return picked;
}

interface SupplierData {
  name: string;
  website: string;
  description?: string;
  technologies?: string[];
  materials?: string[];
  location_country?: string;
  location_city?: string;
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Chained-call parameters. offset > 0 = this is the second leg of a chained run
  // (don't re-chain, use serial Firecrawl, link via parent_run_id).
  const url = new URL(req.url);
  const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10) || 0);
  const parentRunId = url.searchParams.get('parent_run_id');
  const isChainedCall = offset > 0;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

  // Authentication check - only allow admin users, service role, or pg_net cron
  const authHeader = req.headers.get('Authorization');
  const userAgent = req.headers.get('user-agent') || '';
  
  let isAuthorized = false;
  
  // Method 1: Internal cron (pg_net)
  if (userAgent.includes('pg_net')) {
    console.log('Authorized via pg_net (cron job)');
    isAuthorized = true;
  }
  // Method 2: Service role key
  else if (authHeader?.replace('Bearer ', '') === supabaseServiceKey) {
    console.log('Authorized via service role key');
    isAuthorized = true;
  }
  // Method 3: Admin JWT
  else if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    try {
      const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
      
      if (!claimsError && claimsData?.claims) {
        const userId = claimsData.claims.sub;
        
        // Check if user has admin role
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);
        const { data: roleData, error: roleError } = await adminClient
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();
        
        if (!roleError && roleData) {
          console.log('Authorized via admin JWT');
          isAuthorized = true;
        }
      }
    } catch (e) {
      console.error('JWT validation error:', e);
    }
  }
  
  if (!isAuthorized) {
    console.error('Unauthorized access attempt to discover-suppliers');
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!firecrawlApiKey) {
    console.error('FIRECRAWL_API_KEY not configured');
    return new Response(
      JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!geminiApiKey) {
    console.error('GEMINI_API_KEY not configured');
    return new Response(
      JSON.stringify({ success: false, error: 'Gemini API not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch auto-approval threshold + rotation/chain feature flags
  const { data: configData } = await supabase
    .from('discovery_config')
    .select('auto_approve_threshold, rotation_enabled, chained_call_enabled')
    .limit(1)
    .single();

  const autoApproveThreshold = configData?.auto_approve_threshold ?? 85;
  const rotationEnabled = configData?.rotation_enabled === true;
  const chainedCallEnabled = configData?.chained_call_enabled === true;
  console.log(`Auto-approve threshold: ${autoApproveThreshold}%, rotation=${rotationEnabled}, chained=${chainedCallEnabled}, offset=${offset}`);

  const logs: string[] = [];
  const log = (message: string) => {
    console.log(message);
    logs.push(`[${new Date().toISOString()}] ${message}`);
  };

  // Pick the 20 queries to run this invocation.
  // Rotation on → LRU + category round-robin from QUERY_POOL.
  // Rotation off → first STATIC_QUERY_COUNT entries (== pre-rotation behavior).
  let selectedEntries: PoolEntry[];
  if (rotationEnabled) {
    selectedEntries = await selectQueriesForRun(QUERY_POOL, offset, STATIC_QUERY_COUNT, supabase, log);
  } else {
    selectedEntries = QUERY_POOL.slice(0, STATIC_QUERY_COUNT);
  }
  const selectedQueries: string[] = selectedEntries.map(e => e.query);

  // Create a discovery run record
  const { data: runData, error: runError } = await supabase
    .from('discovery_runs')
    .insert({
      search_queries: selectedQueries,
      status: 'running',
      source: 'search',
      parent_run_id: parentRunId,
    })
    .select()
    .single();

  if (runError) {
    console.error('Failed to create discovery run:', runError);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to start discovery run' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const runId = runData.id;

  // Fire-and-forget chained call. Doubles effective time budget by running
  // queries 20-39 in parallel with this run. Dual auth (service-role bearer +
  // pg_net user-agent) covers both auth paths at line ~239 / line ~244.
  if (chainedCallEnabled && !isChainedCall) {
    const chainedUrl = `${supabaseUrl}/functions/v1/discover-suppliers?offset=${STATIC_QUERY_COUNT}&parent_run_id=${runId}`;
    fetch(chainedUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'User-Agent': 'pg_net/0.8.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    }).then(r => log(`Chained call kicked off (offset=${STATIC_QUERY_COUNT}, status=${r.status})`))
      .catch(err => log(`Chained call failed to start: ${err?.message ?? err}`));
  }

  let suppliersFound = 0;
  let suppliersNew = 0;
  let suppliersDuplicate = 0;
  let suppliersAutoApproved = 0;
  let creditsUsed = 0;
  let creditsSkipped = 0;

  try {
    // Get ALL existing supplier domains to avoid scraping
    const existingDomains = await buildDedupSet(supabase);

    log(`Starting discovery (run=${runId}, offset=${offset}, chained=${isChainedCall}, parent=${parentRunId ?? 'none'}) with ${existingDomains.size} known domains`);
    log(`Using ${selectedQueries.length} search queries (rotation=${rotationEnabled})`);

    // Track duplicate rates per query category to skip low-yield categories.
    // Tracking `queries` (count of queries actually run in this category) lets us
    // enforce a floor: never skip until at least MIN_QUERIES_PER_CATEGORY have run,
    // so two unlucky early queries can't kill the rest of the category.
    const categoryStats: Record<string, { total: number; dupes: number; queries: number }> = {};
    const skippedCategories = new Set<string>();
    const MIN_QUERIES_PER_CATEGORY = 3;

    // Process a single search query and its results
    async function processQuery(query: string) {
      if (suppliersNew >= MAX_NEW_SUPPLIERS) return;

      const category = getQueryCategory(query);

      // Skip entire category only after the floor is met AND >80% duplicates accumulate
      if (skippedCategories.has(category)) return;
      const stats = categoryStats[category] || { total: 0, dupes: 0, queries: 0 };
      if (stats.queries >= MIN_QUERIES_PER_CATEGORY &&
          stats.total >= 20 &&
          stats.dupes / stats.total > 0.80) {
        log(`[${category}] Skipping remaining queries (>80% dupes after ${stats.queries} queries: ${stats.dupes}/${stats.total})`);
        skippedCategories.add(category);
        return;
      }

      log(`[${category}] Searching: "${query}"`);

      // Check scrape_cache for recent results (24h TTL)
      const cacheKey = `discovery:search:${query}`;
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: cached } = await supabase
        .from('scrape_cache')
        .select('html')
        .eq('key', cacheKey)
        .gte('created_at', twentyFourHoursAgo)
        .maybeSingle();

      let results;

      if (cached) {
        // Use cached search results
        try {
          results = JSON.parse(cached.html);
          log(`[CACHE HIT] Using cached results for "${query}"`);
        } catch {
          results = null;
        }
      }

      if (!results) {
        // Fetch from Firecrawl
        const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            limit: RESULTS_PER_QUERY,
            scrapeOptions: {
              formats: ['markdown'],
              onlyMainContent: true,
            },
          }),
        });

        if (!searchResponse.ok) {
          const errorText = await searchResponse.text();
          log(`Firecrawl search failed for "${query}": ${errorText}`);
          return;
        }

        const searchData = await searchResponse.json();
        results = searchData.data || [];
        creditsUsed += 1;

        // Cache the results for future runs. Best-effort — never fail the
        // query if the cache write blows up (e.g. column drift, RLS).
        try {
          await supabase.from('scrape_cache').upsert({
            key: cacheKey,
            html: JSON.stringify(results),
            visible_text: null,
            created_at: new Date().toISOString(),
          }, { onConflict: 'key' });
        } catch (_) {
          // swallow
        }
      }

      log(`Found ${results.length} results for "${query}"`);

      // Filter out already known domains BEFORE processing
      let queryDupes = 0;
      let queryUrlsDropped = 0;
      const newResults = results.filter((result: { url?: string }) => {
        const domain = extractDomain(result.url);
        if (!domain) {
          queryUrlsDropped++;
          return false;
        }

        if (existingDomains.has(domain)) {
          suppliersDuplicate++;
          creditsSkipped++;
          queryDupes++;
          return false;
        }
        return true;
      });

      if (queryUrlsDropped > 0) {
        log(`[${category}] Dropped ${queryUrlsDropped} results for "${query}" — extractDomain returned null`);
      }

      // Update category stats for smart skipping
      if (!categoryStats[category]) categoryStats[category] = { total: 0, dupes: 0, queries: 0 };
      categoryStats[category].total += results.length;
      categoryStats[category].dupes += queryDupes;
      categoryStats[category].queries += 1;

      log(`After domain filter: ${newResults.length} new domains (skipped ${results.length - newResults.length} known)`);

      // Prepare valid results for batch AI extraction
      const validResults: { result: SearchResult; url: string; domain: string }[] = [];
      for (const result of newResults) {
        const url = result.url;
        if (!url) continue;
        const domain = extractDomain(url);
        if (!domain || existingDomains.has(domain)) continue;
        validResults.push({ result, url, domain });
      }

      if (validResults.length === 0) return;

      // Batch AI extraction — one call for all results in this query
      const batchSupplierData = await extractSupplierDataBatch(
        validResults.map(v => v.result),
        geminiApiKey,
        log
      );

      // Process extraction results sequentially (DB writes need ordering)
      for (let idx = 0; idx < validResults.length; idx++) {
        if (suppliersNew >= MAX_NEW_SUPPLIERS) break;
        const { result, url, domain } = validResults[idx];
        const supplierData = batchSupplierData[idx];
        if (!supplierData || supplierData.confidence < 0.5) continue;
        if (existingDomains.has(domain)) { suppliersDuplicate++; continue; }

        suppliersFound++;
        const normalizedUrl = normalizeUrl(url);
        const confidencePercent = Math.round(supplierData.confidence * 100);

        if (confidencePercent >= autoApproveThreshold) {
          // AUTO-APPROVE: Insert directly into suppliers table
          const supplierId = `discovered-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

          const { data: insertedSupplier, error: supplierInsertError } = await supabase
            .from('suppliers')
            .insert({
              supplier_id: supplierId,
              name: supplierData.name,
              website: normalizedUrl,
              description: supplierData.description,
              technologies: supplierData.technologies || [],
              materials: supplierData.materials || [],
              location_country: supplierData.location_country,
              location_city: supplierData.location_city,
              verified: false,
              premium: false,
            })
            .select('id')
            .single();

          if (supplierInsertError) {
            log(`Auto-approve insert error for ${supplierData.name}: ${supplierInsertError.message}`);
          } else {
            // Audit trail in discovered_suppliers
            await supabase
              .from('discovered_suppliers')
              .insert({
                name: supplierData.name,
                website: normalizedUrl,
                description: supplierData.description,
                technologies: supplierData.technologies,
                materials: supplierData.materials,
                location_country: supplierData.location_country,
                location_city: supplierData.location_city,
                source_url: url,
                search_query: query,
                discovery_confidence: supplierData.confidence,
                status: 'auto_approved',
                source: 'search',
                reviewed_at: new Date().toISOString(),
                raw_data: {
                  title: result.title,
                  markdown: result.markdown?.substring(0, 5000),
                  auto_approved: true,
                  auto_approve_threshold: autoApproveThreshold,
                },
              });

            suppliersAutoApproved++;
            suppliersNew++;
            existingDomains.add(domain);
            log(`AUTO-APPROVED: ${supplierData.name} (${confidencePercent}% >= ${autoApproveThreshold}%) [${suppliersNew}/${MAX_NEW_SUPPLIERS}]`);

            // Queue validation + notification (fire-and-forget). Pass the
            // service-role bearer explicitly — supabase-js v2's auto-attached
            // Authorization header has been unreliable for function-to-function
            // calls; without this, validate-supplier rejects with 401 and the
            // new suppliers never get validated. Errors are surfaced into
            // discovery_runs.logs (not just the function console) so a future
            // silent failure is visible from the admin UI.
            const location = [supplierData.location_city, supplierData.location_country].filter(Boolean).join(', ');
            const internalAuthHeader = `Bearer ${supabaseServiceKey}`;

            supabase.functions.invoke('validate-supplier', {
              headers: { Authorization: internalAuthHeader },
              body: {
                supplierId,
                supplierName: supplierData.name,
                supplierWebsite: normalizedUrl,
                currentTechnologies: supplierData.technologies || [],
                currentMaterials: supplierData.materials || [],
                currentLocation: location,
              }
            }).then(({ error }) => {
              if (error) log(`Validation trigger failed for ${supplierData.name}: ${error.message ?? JSON.stringify(error)}`);
            }).catch(err => log(`Validation trigger threw for ${supplierData.name}: ${err?.message ?? err}`));

            supabase.functions.invoke('send-signup-notification', {
              headers: { Authorization: internalAuthHeader },
              body: {
                type: 'auto_approval',
                supplierName: supplierData.name,
                website: normalizedUrl,
                confidence: confidencePercent,
                technologies: supplierData.technologies || [],
                materials: supplierData.materials || [],
                location: location,
                description: supplierData.description,
                supplierRowId: insertedSupplier?.id,
                autoApproveThreshold: autoApproveThreshold,
                totalAutoApproved: suppliersAutoApproved,
              }
            }).then(({ error }) => {
              if (error) log(`Auto-approval notification failed for ${supplierData.name}: ${error.message ?? JSON.stringify(error)}`);
            }).catch(err => log(`Auto-approval notification threw for ${supplierData.name}: ${err?.message ?? err}`));
          }
        } else {
          // Insert into discovered_suppliers for manual review
          const { error: insertError } = await supabase
            .from('discovered_suppliers')
            .insert({
              name: supplierData.name,
              website: normalizedUrl,
              description: supplierData.description,
              technologies: supplierData.technologies,
              materials: supplierData.materials,
              location_country: supplierData.location_country,
              location_city: supplierData.location_city,
              source_url: url,
              search_query: query,
              discovery_confidence: supplierData.confidence,
              source: 'search',
              raw_data: {
                title: result.title,
                markdown: result.markdown?.substring(0, 5000),
              },
            });

          if (insertError) {
            if (insertError.code === '23505') {
              suppliersDuplicate++;
            } else {
              log(`Insert error for ${url}: ${insertError.message}`);
            }
          } else {
            suppliersNew++;
            existingDomains.add(domain);
            log(`Added new supplier: ${supplierData.name} (${domain}) - ${confidencePercent}% < ${autoApproveThreshold}% threshold [${suppliersNew}/${MAX_NEW_SUPPLIERS}]`);
          }
        }
      }
    }

    // Process queries in small parallel batches. Firecrawl Hobby plan throttles
    // concurrent requests, so keep parallelism low. In chained calls (offset>0)
    // we run serial because the primary call's parallel batches are using the
    // same throttle window.
    const BATCH_SIZE = isChainedCall ? 1 : 2;
    for (let i = 0; i < selectedQueries.length; i += BATCH_SIZE) {
      if (suppliersNew >= MAX_NEW_SUPPLIERS) {
        log(`Reached max suppliers limit (${MAX_NEW_SUPPLIERS}). Stopping discovery.`);
        break;
      }

      const batch = selectedQueries.slice(i, i + BATCH_SIZE);
      log(`Processing query batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(selectedQueries.length / BATCH_SIZE)} (${batch.length} queries)`);

      const batchResults = await Promise.allSettled(batch.map(q => processQuery(q)));

      // Log any batch-level errors
      for (let j = 0; j < batchResults.length; j++) {
        if (batchResults[j].status === 'rejected') {
          log(`Error processing query "${batch[j]}": ${(batchResults[j] as PromiseRejectedResult).reason}`);
        }
      }

      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < selectedQueries.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Root-cause hint when nothing was found — makes silent failures visible
    // in the Admin UI without having to dig through per-query logs.
    const completionHints: string[] = [];
    if (suppliersFound === 0 && suppliersNew === 0) {
      if (suppliersDuplicate > 0 && !logs.some(l => l.includes('Gemini'))) {
        completionHints.push(`HINT: 0 new suppliers — all ${suppliersDuplicate} candidates matched known domains. Search space may be saturated; consider widening QUERY_POOL or rotating.`);
      } else if (logs.some(l => l.includes('Gemini'))) {
        completionHints.push(`HINT: 0 new suppliers — Gemini extraction failed for every batch (see Gemini log lines above).`);
      } else {
        completionHints.push(`HINT: 0 new suppliers — candidates passed domain filter but none scored ≥0.5 confidence from Gemini.`);
      }
    }

    // Update the discovery run as completed
    await supabase
      .from('discovery_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        suppliers_found: suppliersFound,
        suppliers_new: suppliersNew,
        suppliers_duplicate: suppliersDuplicate,
        logs: [
          ...logs,
          `Credits used: ~${creditsUsed}, Credits saved by skipping known domains: ~${creditsSkipped}`,
          `Auto-approved: ${suppliersAutoApproved} suppliers (threshold: ${autoApproveThreshold}%)`,
          ...completionHints,
        ],
      })
      .eq('id', runId);

    log(`Discovery completed: ${suppliersNew} new (${suppliersAutoApproved} auto-approved), ${suppliersDuplicate} duplicates out of ${suppliersFound} found`);
    log(`Credits used: ~${creditsUsed}, Saved by skipping: ~${creditsSkipped}`);

    return new Response(
      JSON.stringify({
        success: true,
        runId,
        suppliersFound,
        suppliersNew,
        suppliersAutoApproved,
        suppliersDuplicate,
        creditsUsed,
        creditsSkipped,
        autoApproveThreshold,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`Discovery failed: ${errorMessage}`);

    await supabase
      .from('discovery_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: errorMessage,
        logs: logs,
      })
      .eq('id', runId);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

interface SearchResult {
  url?: string;
  title?: string;
  markdown?: string;
  description?: string;
}

// Extract supplier data from multiple search results in a single AI call
async function extractSupplierDataBatch(
  results: SearchResult[],
  apiKey: string,
  log: (message: string) => void = (m) => console.log(m)
): Promise<(SupplierData | null)[]> {
  if (results.length === 0) return [];

  // For a single result, use a simpler prompt
  const entries = results.map((r, i) => {
    const content = (r.markdown || r.description || '').substring(0, 2000);
    return `--- ENTRY ${i + 1} ---\nTitle: ${r.title || 'Unknown'}\nURL: ${r.url || 'Unknown'}\nContent: ${content}`;
  }).join('\n\n');

  const prompt = `Analyze ${results.length} webpage(s) and extract 3D printing/additive manufacturing supplier information from each.

${entries}

For EACH entry, determine if it is a 3D printing / additive manufacturing service provider.

A page IS a supplier (is_supplier=true) if:
- The company itself manufactures parts on 3D printers for paying customers (B2B or B2C)
- They offer at least one of: FDM, SLA, SLS, MJF, SLM/DMLS, MJP, DLP, EBM, binder jetting, WAAM, bioprinting, ceramic/concrete printing, etc.
- It does not matter if they also offer CNC, injection moulding, post-processing, or an instant-quote calculator
- Branded manufacturer sites that take orders directly are still suppliers

A page is NOT a supplier (is_supplier=false) only if:
- It is a pure aggregator/marketplace listing many other suppliers (e.g. Hubs, Treatstock, Craftcloud, Xometry's marketplace listing page, 3D Hubs directory page)
- It is a news article, blog post, listicle ("Top 10..."), Wikipedia, university press release, or LinkedIn profile
- It is a hardware vendor selling 3D printers (e.g. Bambu Lab, Prusa, Formlabs storefront) with no service offering
- It is a software/CAD vendor

Confidence should reflect how clearly the page identifies the company as a service provider:
- 0.85-1.0: dedicated "3D printing service" / "additive manufacturing service" landing page with clear offering
- 0.6-0.84: company homepage where service is one of several offerings
- 0.5-0.59: unclear but signals point to a service provider
- below 0.5: do not extract

Respond ONLY with a JSON array of ${results.length} object(s), one per entry, in this exact format:
[
  {
    "entry": 1,
    "is_supplier": true/false,
    "name": "Company Name",
    "description": "Brief description",
    "technologies": ["FDM", "SLA"],
    "materials": ["PLA", "ABS"],
    "location_country": "Country",
    "location_city": "City",
    "confidence": 0.8
  }
]

Set is_supplier to false and confidence to 0 for non-suppliers.`;

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        temperature: 0,
        messages: [
          { role: 'system', content: 'You are an expert at identifying 3D printing and additive manufacturing service providers. Respond only with a valid JSON array.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      log(`Gemini API error ${response.status}: ${errorText.slice(0, 400)}`);
      return results.map(() => null);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';

    // Extract JSON array from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      log(`Gemini returned no JSON array — raw response (first 400 chars): ${responseText.slice(0, 400)}`);
      return results.map(() => null);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) {
      log(`Gemini response was not a JSON array — raw (first 400 chars): ${responseText.slice(0, 400)}`);
      return results.map(() => null);
    }

    let nonSupplier = 0;
    let lowConfidence = 0;
    let missing = 0;
    let extracted = 0;
    const out = results.map((r, i) => {
      const entry = parsed[i] || parsed.find((p: any) => p.entry === i + 1);
      if (!entry) { missing++; return null; }
      if (!entry.is_supplier) { nonSupplier++; return null; }
      if (entry.confidence < 0.5) { lowConfidence++; return null; }
      extracted++;
      return {
        name: entry.name || r.title || '',
        website: r.url || '',
        description: entry.description,
        technologies: entry.technologies || [],
        materials: entry.materials || [],
        location_country: entry.location_country,
        location_city: entry.location_city,
        confidence: entry.confidence,
      };
    });

    log(`Gemini batch (${results.length} candidates): ${extracted} extracted, ${nonSupplier} not-a-supplier, ${lowConfidence} low-confidence, ${missing} missing-entry`);

    return out;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log(`Gemini batch extraction threw: ${msg}`);
    return results.map(() => null);
  }
}
