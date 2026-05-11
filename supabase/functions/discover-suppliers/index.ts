import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";
import { extractDomain, normalizeUrl, buildDedupSet } from "../_shared/discovery.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Search queries for finding 3D printing suppliers.
// Curated for high yield against the existing catalog: niche tech + specialty
// applications + emerging-market geos. Generic North America / Western Europe
// queries dropped — already heavily mined.
const SEARCH_QUERIES = [
  // Niche technologies (5)
  "bioprinting service tissue engineering",
  "ceramic 3D printing service industrial",
  "sand casting 3D printing foundry mold",
  "WAAM wire arc additive manufacturing service",
  "micro 3D printing precision manufacturing",

  // Specialty applications (4)
  "concrete 3D printing construction service",
  "jewelry 3D printing casting service",
  "eyewear 3D printing glasses frames",
  "footwear 3D printing shoe manufacturing",

  // Advanced materials (3)
  "PEEK 3D printing service high performance",
  "carbon fiber 3D printing continuous fiber",
  "titanium 3D printing medical aerospace",

  // Emerging-market geos (8)
  "3D printing service Japan additive manufacturing",
  "3D printing service Korea manufacturing",
  "3D printing service Singapore industrial",
  "3D printing service Bangalore additive manufacturing",
  "3D printing service Mumbai industrial manufacturing",
  "3D printing service São Paulo Brazil manufatura aditiva",
  "3D printing service Ciudad de México prototipado",
  "3D printing service UAE Dubai manufacturing",
];

// Results per query (balanced for credit efficiency)
const RESULTS_PER_QUERY = 5;

// Maximum new suppliers to discover per run
const MAX_NEW_SUPPLIERS = 10;

// Helper to categorize queries for logging
function getQueryCategory(query: string): string {
  if (query.includes('Japan') || query.includes('Korea') ||
      query.includes('Singapore') || query.includes('Israel') ||
      query.includes('Australia') || query.includes('India') ||
      query.includes('Brazil') || query.includes('Mexico') ||
      query.includes('UAE') || query.includes('Dubai') ||
      query.includes('Bangalore') || query.includes('Mumbai') ||
      query.includes('Pune') || query.includes('Chennai') ||
      query.includes('Hyderabad') || query.includes('Delhi') ||
      query.includes('São Paulo') || query.includes('Rio de Janeiro') ||
      query.includes('Minas Gerais') || query.includes('Querétaro') ||
      query.includes('Monterrey') || query.includes('Ciudad de México') ||
      query.includes('Saudi Arabia') || query.includes('Riyadh') ||
      query.includes('Turkey') || query.includes('Istanbul') ||
      query.includes('Egypt') || query.includes('Cairo') ||
      query.includes('Qatar') || query.includes('Doha') ||
      query.includes('Jordan') || query.includes('Amman') ||
      query.includes('Kuwait') || query.includes('impressão') ||
      query.includes('impresión')) return 'Geographic';
  if (query.includes('bio') || query.includes('ceramic') || 
      query.includes('sand casting') || query.includes('WAAM') || 
      query.includes('micro') || query.includes('full color')) return 'Niche Tech';
  if (query.includes('dental') || query.includes('medical') || 
      query.includes('aerospace') || query.includes('automotive') || 
      query.includes('architectural')) return 'Industry';
  if (query.includes('PEEK') || query.includes('titanium') || 
      query.includes('carbon fiber')) return 'Materials';
  if (query.includes('concrete') || query.includes('food') || 
      query.includes('jewelry') || query.includes('electronics') ||
      query.includes('eyewear') || query.includes('footwear') ||
      query.includes('glass') || query.includes('silicone') ||
      query.includes('recycled')) return 'Specialty';
  return 'General';
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

  // Fetch auto-approval threshold from config
  const { data: configData } = await supabase
    .from('discovery_config')
    .select('auto_approve_threshold')
    .limit(1)
    .single();

  const autoApproveThreshold = configData?.auto_approve_threshold ?? 85;
  console.log(`Auto-approve threshold: ${autoApproveThreshold}%`);

  // Create a discovery run record
  const { data: runData, error: runError } = await supabase
    .from('discovery_runs')
    .insert({
      search_queries: SEARCH_QUERIES,
      status: 'running',
      source: 'search',
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
  const logs: string[] = [];
  let suppliersFound = 0;
  let suppliersNew = 0;
  let suppliersDuplicate = 0;
  let suppliersAutoApproved = 0;
  let creditsUsed = 0;
  let creditsSkipped = 0;

  const log = (message: string) => {
    console.log(message);
    logs.push(`[${new Date().toISOString()}] ${message}`);
  };

  try {
    // Get ALL existing supplier domains to avoid scraping
    const existingDomains = await buildDedupSet(supabase);

    log(`Starting optimized discovery with ${existingDomains.size} known domains`);
    log(`Using ${SEARCH_QUERIES.length} search queries (optimized from 10)`);

    // Track duplicate rates per query category to skip low-yield categories
    const categoryStats: Record<string, { total: number; dupes: number }> = {};
    const skippedCategories = new Set<string>();

    // Process a single search query and its results
    async function processQuery(query: string) {
      if (suppliersNew >= MAX_NEW_SUPPLIERS) return;

      const category = getQueryCategory(query);

      // Skip entire category if >70% duplicates after enough samples
      if (skippedCategories.has(category)) return;
      const stats = categoryStats[category] || { total: 0, dupes: 0 };
      if (stats.total >= 10 && stats.dupes / stats.total > 0.7) {
        log(`[${category}] Skipping remaining queries (>70% duplicate rate: ${stats.dupes}/${stats.total})`);
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
      const newResults = results.filter((result: { url?: string }) => {
        const domain = extractDomain(result.url);
        if (!domain) return false;

        if (existingDomains.has(domain)) {
          suppliersDuplicate++;
          creditsSkipped++;
          queryDupes++;
          return false;
        }
        return true;
      });

      // Update category stats for smart skipping
      if (!categoryStats[category]) categoryStats[category] = { total: 0, dupes: 0 };
      categoryStats[category].total += results.length;
      categoryStats[category].dupes += queryDupes;

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
        geminiApiKey
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
    // concurrent requests and returns a misleading "Insufficient credits" error
    // when saturated, so keep this low.
    const BATCH_SIZE = 2;
    for (let i = 0; i < SEARCH_QUERIES.length; i += BATCH_SIZE) {
      if (suppliersNew >= MAX_NEW_SUPPLIERS) {
        log(`Reached max suppliers limit (${MAX_NEW_SUPPLIERS}). Stopping discovery.`);
        break;
      }

      const batch = SEARCH_QUERIES.slice(i, i + BATCH_SIZE);
      log(`Processing query batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(SEARCH_QUERIES.length / BATCH_SIZE)} (${batch.length} queries)`);

      const batchResults = await Promise.allSettled(batch.map(q => processQuery(q)));

      // Log any batch-level errors
      for (let j = 0; j < batchResults.length; j++) {
        if (batchResults[j].status === 'rejected') {
          log(`Error processing query "${batch[j]}": ${(batchResults[j] as PromiseRejectedResult).reason}`);
        }
      }

      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < SEARCH_QUERIES.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
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
          `Auto-approved: ${suppliersAutoApproved} suppliers (threshold: ${autoApproveThreshold}%)`
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
  apiKey: string
): Promise<(SupplierData | null)[]> {
  if (results.length === 0) return [];

  // For a single result, use a simpler prompt
  const entries = results.map((r, i) => {
    const content = (r.markdown || r.description || '').substring(0, 2000);
    return `--- ENTRY ${i + 1} ---\nTitle: ${r.title || 'Unknown'}\nURL: ${r.url || 'Unknown'}\nContent: ${content}`;
  }).join('\n\n');

  const prompt = `Analyze ${results.length} webpage(s) and extract 3D printing/additive manufacturing supplier information from each.

${entries}

For EACH entry, determine if it is a legitimate 3D printing service provider (not a marketplace, directory, or news site).

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
        messages: [
          { role: 'system', content: 'You are an expert at identifying 3D printing and additive manufacturing service providers. Respond only with a valid JSON array.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error('Gemini batch error:', await response.text());
      return results.map(() => null);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';

    // Extract JSON array from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return results.map(() => null);

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return results.map(() => null);

    return results.map((r, i) => {
      const entry = parsed[i] || parsed.find((p: any) => p.entry === i + 1);
      if (!entry || !entry.is_supplier || entry.confidence < 0.5) return null;

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
  } catch (error) {
    console.error('Error in batch extraction:', error);
    return results.map(() => null);
  }
}
