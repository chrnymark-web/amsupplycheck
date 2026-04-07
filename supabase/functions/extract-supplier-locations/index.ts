import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LocationExtractionResult {
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  region?: string;
  confidence: number;
  reasoning?: string;
}

interface ScrapedPage {
  url: string;
  content: string;
  type: 'homepage' | 'about' | 'contact' | 'imprint';
}

// Strip HTML tags and extract visible text from raw HTML
function extractVisibleText(html: string): string {
  // Remove script/style/nav/footer/header tags and their content
  let cleaned = html.replace(/<(script|style|nav|footer|header|noscript)[^>]*>[\s\S]*?<\/\1>/gi, '');
  // Remove remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');
  // Decode common HTML entities
  cleaned = cleaned.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
  // Collapse whitespace
  const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  return lines.join('\n');
}

async function fetchPage(url: string): Promise<{ html: string; visibleText: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9,de;q=0.8,da;q=0.7',
      },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const html = await response.text();
    const visibleText = extractVisibleText(html);
    return { html, visibleText };
  } catch (error) {
    console.log(`Fetch failed for ${url}:`, error.message);
    return null;
  }
}

async function scrapeMultiplePages(baseUrl: string, supplierName: string, supabase?: any, supplierId?: string): Promise<ScrapedPage[]> {
  // Define potential pages to scrape (in priority order, grouped by type)
  const pagesToTry = [
    { url: baseUrl, type: 'homepage' as const },
    { url: `${baseUrl}/about`, type: 'about' as const },
    { url: `${baseUrl}/about-us`, type: 'about' as const },
    { url: `${baseUrl}/contact`, type: 'contact' as const },
    { url: `${baseUrl}/kontakt`, type: 'contact' as const },
    { url: `${baseUrl}/imprint`, type: 'imprint' as const },
    { url: `${baseUrl}/impressum`, type: 'imprint' as const },
    { url: `${baseUrl}/company`, type: 'about' as const },
  ];

  // Check scrape_cache first if supabase client is available
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Fetch all pages in parallel, using cache when available
  const fetchResults = await Promise.allSettled(
    pagesToTry.map(async (page) => {
      // Try cache first
      if (supabase && supplierId) {
        const cacheKey = `${supplierId}:${page.url}`;
        const { data: cached } = await supabase
          .from('scrape_cache')
          .select('visible_text')
          .eq('key', cacheKey)
          .gte('created_at', twentyFourHoursAgo)
          .maybeSingle();

        if (cached?.visible_text && cached.visible_text.length > 200) {
          console.log(`[CACHE HIT] ${page.url}`);
          return { ...page, content: cached.visible_text };
        }
      }

      console.log(`Fetching: ${page.url}`);
      const result = await fetchPage(page.url);
      if (result && result.visibleText.length > 200) {
        // Store in cache for future use
        if (supabase && supplierId) {
          const cacheKey = `${supplierId}:${page.url}`;
          await supabase.from('scrape_cache').upsert({
            key: cacheKey,
            html: result.html.substring(0, 50000),
            visible_text: result.visibleText.substring(0, 30000),
            created_at: new Date().toISOString(),
          }, { onConflict: 'key' }).catch(() => {});
        }
        return { ...page, content: result.visibleText };
      }
      return null;
    })
  );

  // Collect successful results, limit to 4 pages, deduplicate by type
  const pages: ScrapedPage[] = [];
  const seenTypes = new Set<string>();

  for (const outcome of fetchResults) {
    if (pages.length >= 4) break;
    if (outcome.status !== 'fulfilled' || !outcome.value) continue;

    const { url, type, content } = outcome.value;
    // Keep max 1 page per type (e.g. don't keep both /about and /about-us)
    if (seenTypes.has(type) && type !== 'homepage') continue;
    seenTypes.add(type);

    pages.push({ url, content, type });
    console.log(`Successfully fetched ${type} page (${content.length} chars)`);
  }

  return pages;
}

async function extractLocationWithAI(pages: ScrapedPage[], supplierName: string, attempt: number = 1): Promise<LocationExtractionResult> {
  // Combine content from all pages with context
  const combinedContent = pages.map(page => 
    `=== ${page.type.toUpperCase()} PAGE (${page.url}) ===\n${page.content.substring(0, 6000)}`
  ).join('\n\n');

  const systemPrompt = `You are an expert at extracting precise company location information from website content.

Your task is to analyze the provided website content and extract the EXACT physical headquarters or main office location.

CRITICAL RULES:
1. Look for explicit address information in contact pages, footers, about pages, and imprint/impressum sections
2. Prioritize structured address formats (e.g., "Street 123, City, Country")
3. For European companies, check "Impressum" sections which legally must contain accurate addresses
4. DO NOT guess or infer - only extract information that is explicitly stated
5. If multiple addresses exist, choose the headquarters/main office
6. Validate that city and country are consistent with the address
7. Be extra careful with country detection - use full country names

QUALITY INDICATORS:
- Street addresses with numbers are highly reliable
- Contact page addresses are very reliable
- Footer addresses are reliable
- "Visit us" or "Our office" sections are reliable
- Social media links or email domains are NOT location indicators

${attempt > 1 ? 'IMPORTANT: This is retry attempt #' + attempt + '. Be MORE thorough and look for subtle location indicators.' : ''}`;

  const userPrompt = `Company: "${supplierName}"

Website Content (from ${pages.length} pages):
${combinedContent.substring(0, 20000)}

Extract the company's physical location with maximum precision.`;

  try {
    const response = await fetch('https://ai.lovable.app/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro', // Upgraded to Pro for better accuracy
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_location',
              description: 'Extract precise location information from website content',
              parameters: {
                type: 'object',
                properties: {
                  address: {
                    type: 'string',
                    description: 'Full street address including street name and number'
                  },
                  postalCode: {
                    type: 'string',
                    description: 'Postal/ZIP code'
                  },
                  city: {
                    type: 'string',
                    description: 'City name'
                  },
                  region: {
                    type: 'string',
                    description: 'State/Province/Region if available'
                  },
                  country: {
                    type: 'string',
                    description: 'Full country name (not abbreviation)'
                  },
                  confidence: {
                    type: 'number',
                    description: 'Confidence level 0-100 based on how explicit and structured the information is',
                    minimum: 0,
                    maximum: 100
                  },
                  reasoning: {
                    type: 'string',
                    description: 'Brief explanation of where the information was found and why you are confident'
                  }
                },
                required: ['confidence', 'reasoning']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_location' } },
        temperature: 0.1, // Very low temperature for maximum precision
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI request failed (${response.status}):`, errorText);
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      console.error('No tool call in response:', JSON.stringify(data));
      return { confidence: 0 };
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log(`AI extraction result (attempt ${attempt}):`, JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error('AI extraction failed:', error);
    return { confidence: 0 };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request to get session ID
    const { sessionId } = await req.json().catch(() => ({ sessionId: crypto.randomUUID() }));
    
    // Create a channel for progress updates
    const channel = supabase.channel(`location-extraction-${sessionId}`);

    const sendProgress = async (progress: any) => {
      await channel.send({
        type: 'broadcast',
        event: 'progress',
        payload: progress
      });
    };

    // Subscribe to channel
    await channel.subscribe();

    // Get suppliers without location data
    const { data: suppliers, error: fetchError } = await supabase
      .from('suppliers')
      .select('id, supplier_id, name, website')
      .or('location_address.is.null,location_city.is.null,location_country.is.null')
      .not('website', 'is', null)
      .limit(31);

    if (fetchError) throw fetchError;

    console.log(`Found ${suppliers?.length || 0} suppliers to process`);
    const totalSuppliers = suppliers?.length || 0;

    await sendProgress({
      total: totalSuppliers,
      current: 0,
      currentSupplier: null,
      status: 'started'
    });

    const results = [];

    for (let i = 0; i < (suppliers || []).length; i++) {
      const supplier = suppliers![i];
      console.log(`\nProcessing ${supplier.name}...`);
      
      await sendProgress({
        total: totalSuppliers,
        current: i + 1,
        currentSupplier: supplier.name,
        status: 'processing'
      });

      if (!supplier.website) {
        results.push({ supplier: supplier.name, status: 'skipped', reason: 'no website' });
        await sendProgress({
          total: totalSuppliers,
          current: i + 1,
          currentSupplier: supplier.name,
          status: 'skipped',
          reason: 'no website'
        });
        continue;
      }

      // Multi-page scraping for better context
      await sendProgress({
        total: totalSuppliers,
        current: i + 1,
        currentSupplier: supplier.name,
        status: 'scraping'
      });

      const scrapedPages = await scrapeMultiplePages(supplier.website, supplier.name, supabase, supplier.supplier_id);

      if (scrapedPages.length === 0) {
        results.push({ supplier: supplier.name, status: 'failed', reason: 'scraping failed' });
        await sendProgress({
          total: totalSuppliers,
          current: i + 1,
          currentSupplier: supplier.name,
          status: 'failed',
          reason: 'scraping failed'
        });
        continue;
      }

      console.log(`✓ Scraped ${scrapedPages.length} pages for ${supplier.name}`);

      // Extract location with AI (first attempt)
      await sendProgress({
        total: totalSuppliers,
        current: i + 1,
        currentSupplier: supplier.name,
        status: 'extracting'
      });

      let locationData = await extractLocationWithAI(scrapedPages, supplier.name, 1);
      
      // If confidence is low, retry with enhanced prompt
      if (locationData.confidence < 70 && locationData.confidence > 0) {
        console.log(`Low confidence (${locationData.confidence}%), retrying with enhanced prompt...`);
        locationData = await extractLocationWithAI(scrapedPages, supplier.name, 2);
      }

      if (locationData.confidence < 70) {
        results.push({ 
          supplier: supplier.name, 
          status: 'low-confidence',
          confidence: locationData.confidence,
          reasoning: locationData.reasoning
        });
        await sendProgress({
          total: totalSuppliers,
          current: i + 1,
          currentSupplier: supplier.name,
          status: 'low-confidence',
          confidence: locationData.confidence
        });
        continue;
      }

      // Update supplier with location data
      const updateData: any = {};
      if (locationData.address) updateData.location_address = locationData.address;
      if (locationData.city) updateData.location_city = locationData.city;
      if (locationData.country) updateData.location_country = locationData.country;

      console.log(`✓ High confidence extraction (${locationData.confidence}%):`, updateData);
      console.log(`Reasoning: ${locationData.reasoning}`);

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('suppliers')
          .update(updateData)
          .eq('id', supplier.id);

        if (updateError) {
          results.push({ 
            supplier: supplier.name, 
            status: 'update-failed', 
            error: updateError.message 
          });
          await sendProgress({
            total: totalSuppliers,
            current: i + 1,
            currentSupplier: supplier.name,
            status: 'update-failed',
            error: updateError.message
          });
        } else {
          results.push({ 
            supplier: supplier.name, 
            status: 'success',
            pagesScraped: scrapedPages.length,
            confidence: locationData.confidence,
            reasoning: locationData.reasoning,
            extracted: updateData
          });
          await sendProgress({
            total: totalSuppliers,
            current: i + 1,
            currentSupplier: supplier.name,
            status: 'success',
            extracted: updateData
          });
        }
      }

      // Short delay to respect AI rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await sendProgress({
      total: totalSuppliers,
      current: totalSuppliers,
      currentSupplier: null,
      status: 'completed'
    });

    // Unsubscribe from channel
    await supabase.removeChannel(channel);

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: suppliers?.length || 0,
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
