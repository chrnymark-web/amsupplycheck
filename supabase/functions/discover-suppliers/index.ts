import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Search queries for finding 3D printing suppliers
// Organized by category for better tracking
const SEARCH_QUERIES = [
  // === GENERAL (10 original queries) ===
  "3D printing service bureau manufacturing",
  "additive manufacturing service provider",
  "metal 3D printing service company",
  "SLS printing service industrial",
  "SLA printing service professional",
  "FDM printing service large format",
  "MJF multi jet fusion service",
  "DMLS metal printing service",
  "rapid prototyping service bureau",
  "on-demand manufacturing 3D printing",
  
  // === NICHE TECHNOLOGIES (6 new) ===
  "bioprinting service tissue engineering",
  "ceramic 3D printing service industrial",
  "sand casting 3D printing foundry mold",
  "WAAM wire arc additive manufacturing service",
  "micro 3D printing precision manufacturing",
  "full color 3D printing service sandstone",
  
  // === INDUSTRY-SPECIFIC (5 new) ===
  "dental 3D printing laboratory service",
  "medical device 3D printing manufacturer FDA",
  "aerospace additive manufacturing AS9100 certified",
  "automotive 3D printing production parts",
  "architectural 3D printing large scale models",
  
  // === GEOGRAPHIC EXPANSION (5 new) ===
  "3D printing service Japan additive manufacturing",
  "3D printing service Korea manufacturing",
  "3D printing service Singapore industrial",
  "3D printing service Israel prototyping",
  "3D printing service Australia manufacturing",
  
  // === ADVANCED MATERIALS (3) ===
  "PEEK 3D printing service high performance",
  "titanium 3D printing medical aerospace",
  "carbon fiber 3D printing continuous fiber",
  
  // === SPECIALTY APPLICATIONS (9) ===
  "concrete 3D printing construction service",
  "food 3D printing culinary chocolate",
  "jewelry 3D printing casting service",
  "electronics 3D printing printed circuit",
  "eyewear 3D printing glasses frames",
  "footwear 3D printing shoe manufacturing",
  "glass 3D printing fused silica optical",
  "silicone 3D printing flexible elastomer",
  "recycled materials 3D printing sustainable filament",
  
  // === ADDITIONAL GEOGRAPHIC (4 new) ===
  "3D printing service India manufacturing",
  "3D printing service Brazil additive",
  "3D printing service Mexico industrial",
  "3D printing service UAE Dubai manufacturing",
];

// Results per query (balanced for credit efficiency)
const RESULTS_PER_QUERY = 5;

// Maximum new suppliers to discover per run (increased for expanded queries)
const MAX_NEW_SUPPLIERS = 100;

// Helper to categorize queries for logging
function getQueryCategory(query: string): string {
  if (query.includes('Japan') || query.includes('Korea') || 
      query.includes('Singapore') || query.includes('Israel') || 
      query.includes('Australia') || query.includes('India') ||
      query.includes('Brazil') || query.includes('Mexico') ||
      query.includes('UAE') || query.includes('Dubai')) return 'Geographic';
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
  const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

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

  if (!lovableApiKey) {
    console.error('LOVABLE_API_KEY not configured');
    return new Response(
      JSON.stringify({ success: false, error: 'Lovable AI not configured' }),
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
      status: 'running'
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
    const { data: existingSuppliers } = await supabase
      .from('suppliers')
      .select('website');
    
    const { data: existingDiscovered } = await supabase
      .from('discovered_suppliers')
      .select('website');

    // Create a set of normalized domains we already know
    const existingDomains = new Set<string>();
    
    for (const s of existingSuppliers || []) {
      const domain = extractDomain(s.website);
      if (domain) existingDomains.add(domain);
    }
    
    for (const s of existingDiscovered || []) {
      const domain = extractDomain(s.website);
      if (domain) existingDomains.add(domain);
    }

    log(`Starting optimized discovery with ${existingDomains.size} known domains`);
    log(`Using ${SEARCH_QUERIES.length} search queries (optimized from 10)`);

    // Process each search query
    queryLoop: for (const query of SEARCH_QUERIES) {
      // Check if we've reached the max suppliers limit
      if (suppliersNew >= MAX_NEW_SUPPLIERS) {
        log(`Reached max suppliers limit (${MAX_NEW_SUPPLIERS}). Stopping discovery.`);
        break queryLoop;
      }

      const category = getQueryCategory(query);
      log(`[${category}] Searching: "${query}"`);

      try {
        // Use Firecrawl search API - but DON'T scrape yet, just get URLs
        // This saves credits by not scraping pages we already know
        const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            limit: RESULTS_PER_QUERY, // Use configured limit instead of hardcoded 10
            // Get scrape data in one call - more efficient than separate calls
            scrapeOptions: {
              formats: ['markdown'],
              onlyMainContent: true,
            },
          }),
        });

        if (!searchResponse.ok) {
          const errorText = await searchResponse.text();
          log(`Firecrawl search failed for "${query}": ${errorText}`);
          continue;
        }

        const searchData = await searchResponse.json();
        const results = searchData.data || [];
        
        log(`Found ${results.length} results for "${query}"`);
        creditsUsed += 1; // Search costs 1 credit

        // Filter out already known domains BEFORE processing
        const newResults = results.filter((result: { url?: string }) => {
          const domain = extractDomain(result.url);
          if (!domain) return false;
          
          if (existingDomains.has(domain)) {
            suppliersDuplicate++;
            creditsSkipped++;
            return false;
          }
          return true;
        });

        log(`After domain filter: ${newResults.length} new domains (skipped ${results.length - newResults.length} known)`);

        for (const result of newResults) {
          const url = result.url;
          if (!url) continue;

          const domain = extractDomain(url);
          if (!domain) continue;

          // Double-check we haven't added this domain in this run
          if (existingDomains.has(domain)) {
            suppliersDuplicate++;
            continue;
          }

          suppliersFound++;

          // Use Lovable AI to extract supplier information
          // This doesn't cost Firecrawl credits
          const supplierData = await extractSupplierData(
            result.title || '',
            result.markdown || result.description || '',
            url,
            lovableApiKey
          );

          if (supplierData && supplierData.confidence >= 0.5) {
            const normalizedUrl = normalizeUrl(url);
            const confidencePercent = Math.round(supplierData.confidence * 100);
            
            // Check if supplier should be auto-approved
            if (confidencePercent >= autoApproveThreshold) {
              // AUTO-APPROVE: Insert directly into suppliers table
              const supplierId = `discovered-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
              
              // Step 1: Insert into suppliers table
              const { error: supplierInsertError } = await supabase
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
                  verified: false, // Will be verified by validation
                  premium: false,
                });
              
              if (supplierInsertError) {
                log(`Auto-approve insert error for ${supplierData.name}: ${supplierInsertError.message}`);
              } else {
                // Step 2: Mark as auto-approved in discovered_suppliers for audit trail
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
                log(`🚀 AUTO-APPROVED: ${supplierData.name} (${confidencePercent}% >= ${autoApproveThreshold}%) [${suppliersNew}/${MAX_NEW_SUPPLIERS}]`);
                
                // Step 3: Queue for validation (async, don't wait)
                const location = [supplierData.location_city, supplierData.location_country].filter(Boolean).join(', ');
                supabase.functions.invoke('validate-supplier', {
                  body: {
                    supplierId,
                    supplierName: supplierData.name,
                    supplierWebsite: normalizedUrl,
                    currentTechnologies: supplierData.technologies || [],
                    currentMaterials: supplierData.materials || [],
                    currentLocation: location,
                  }
                }).catch(err => {
                  console.error(`Validation trigger failed for ${supplierData.name}:`, err);
                });
                
                // Step 4: Send email notification (async, don't wait)
                supabase.functions.invoke('send-signup-notification', {
                  body: {
                    type: 'auto_approval',
                    supplierName: supplierData.name,
                    website: normalizedUrl,
                    confidence: confidencePercent,
                    technologies: supplierData.technologies || [],
                    materials: supplierData.materials || [],
                    location: location,
                    autoApproveThreshold: autoApproveThreshold,
                    totalAutoApproved: suppliersAutoApproved,
                  }
                }).catch(err => {
                  console.error(`Auto-approval notification failed for ${supplierData.name}:`, err);
                });
              }
            } else {
              // NORMAL FLOW: Insert into discovered_suppliers for manual review
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
                  raw_data: {
                    title: result.title,
                    markdown: result.markdown?.substring(0, 5000),
                  },
                });

              if (insertError) {
                if (insertError.code === '23505') {
                  // Duplicate key - already exists
                  suppliersDuplicate++;
                } else {
                  log(`Insert error for ${url}: ${insertError.message}`);
                }
              } else {
                suppliersNew++;
                existingDomains.add(domain); // Track for this run
                log(`Added new supplier: ${supplierData.name} (${domain}) - ${confidencePercent}% < ${autoApproveThreshold}% threshold [${suppliersNew}/${MAX_NEW_SUPPLIERS}]`);
              }
            }

            // Check if we've reached max suppliers limit
            if (suppliersNew >= MAX_NEW_SUPPLIERS) {
              log(`Reached max suppliers limit (${MAX_NEW_SUPPLIERS}). Stopping discovery.`);
              break queryLoop;
            }
          }
        }

        // Small delay between queries to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (queryError) {
        log(`Error processing query "${query}": ${queryError}`);
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

// Extract just the domain from a URL for comparison
function extractDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    // Remove www. prefix for consistent matching
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

function normalizeUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    // Remove www. prefix and trailing slashes
    let domain = parsed.hostname.replace(/^www\./, '');
    return `https://${domain}`;
  } catch {
    return null;
  }
}

async function extractSupplierData(
  title: string,
  content: string,
  url: string,
  apiKey: string
): Promise<SupplierData | null> {
  try {
    const prompt = `Analyze this webpage and extract 3D printing/additive manufacturing supplier information.

Title: ${title}
URL: ${url}
Content (truncated): ${content.substring(0, 3000)}

Extract the following if this is a legitimate 3D printing service provider (not a marketplace, directory, or news site):

1. Company name
2. Brief description (1-2 sentences about their services)
3. 3D printing technologies they offer (e.g., FDM, SLA, SLS, MJF, DMLS, EBM, etc.)
4. Materials they work with (e.g., PLA, ABS, Nylon, Titanium, Aluminum, etc.)
5. Location (country and city if available)
6. Confidence score (0-1) that this is a real 3D printing service provider

Respond ONLY with a JSON object in this exact format:
{
  "is_supplier": true/false,
  "name": "Company Name",
  "description": "Brief description",
  "technologies": ["FDM", "SLA"],
  "materials": ["PLA", "ABS"],
  "location_country": "Country",
  "location_city": "City",
  "confidence": 0.8
}

If this is not a 3D printing service supplier (e.g., it's a marketplace, directory, news article, or unrelated business), set is_supplier to false and confidence to 0.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert at identifying and extracting information about 3D printing and additive manufacturing service providers. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error('Lovable AI error:', await response.text());
      return null;
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';
    
    // Extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    
    if (!parsed.is_supplier || parsed.confidence < 0.5) {
      return null;
    }

    return {
      name: parsed.name || title,
      website: url,
      description: parsed.description,
      technologies: parsed.technologies || [],
      materials: parsed.materials || [],
      location_country: parsed.location_country,
      location_city: parsed.location_city,
      confidence: parsed.confidence,
    };
  } catch (error) {
    console.error('Error extracting supplier data:', error);
    return null;
  }
}
