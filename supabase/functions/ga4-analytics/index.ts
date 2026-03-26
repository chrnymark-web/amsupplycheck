import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DateRange {
  startDate: string;
  endDate: string;
}

interface GA4Request {
  dateRange?: DateRange;
  metrics?: string[];
  action?: string; // 'seo' for SEO-specific data
  filters?: {
    technology?: string;
    material?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dateRange, metrics = ['all'], action, filters } = await req.json() as GA4Request;
    
    const propertyId = Deno.env.get('GA4_PROPERTY_ID');
    const serviceAccountJson = Deno.env.get('GA4_SERVICE_ACCOUNT_JSON');
    
    if (!propertyId || !serviceAccountJson) {
      throw new Error('GA4 credentials not configured');
    }

    const serviceAccount = JSON.parse(serviceAccountJson);
    const accessToken = await getAccessToken(serviceAccount);

    // Default to last 30 days
    const startDate = dateRange?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = dateRange?.endDate || new Date().toISOString().split('T')[0];

    console.log(`Fetching GA4 data for property ${propertyId} from ${startDate} to ${endDate}, action: ${action || 'default'}`);

    // Create Supabase client for supplier lookups
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // SEO-specific data request
    if (action === 'seo') {
      const seoData = {
        organicTraffic: await fetchOrganicTrafficData(propertyId, accessToken, startDate, endDate),
        topLandingPages: await fetchOrganicLandingPages(propertyId, accessToken, startDate, endDate),
        organicOverview: await fetchOrganicOverview(propertyId, accessToken, startDate, endDate),
      };

      return new Response(JSON.stringify(seoData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const analyticsData = {
      scrollDepth: await fetchScrollDepthData(propertyId, accessToken, startDate, endDate),
      filterUsage: await fetchFilterUsageData(propertyId, accessToken, startDate, endDate),
      supplierInteractions: await fetchSupplierInteractionData(propertyId, accessToken, startDate, endDate),
      conversions: await fetchConversionData(propertyId, accessToken, startDate, endDate),
      userBehavior: await fetchUserBehaviorData(propertyId, accessToken, startDate, endDate),
      topSuppliers: await fetchTopSuppliersData(propertyId, accessToken, startDate, endDate, supabase),
      geographic: await fetchGeographicData(propertyId, accessToken, startDate, endDate),
      topConvertingSuppliers: await fetchTopConvertingSuppliersData(propertyId, accessToken, startDate, endDate, supabase, filters),
      technologyConversionStats: await fetchTechnologyConversionStats(propertyId, accessToken, startDate, endDate, supabase),
      materialConversionStats: await fetchMaterialConversionStats(propertyId, accessToken, startDate, endDate, supabase),
      funnelData: await fetchFunnelData(propertyId, accessToken, startDate, endDate),
    };

    return new Response(JSON.stringify(analyticsData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching GA4 data:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getAccessToken(serviceAccount: any): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedClaim = btoa(JSON.stringify(claim)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  // Sign with private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(serviceAccount.private_key),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${signatureInput}.${encodedSignature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function runReport(propertyId: string, accessToken: string, dimensions: string[], metrics: string[], startDate: string, endDate: string) {
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      dateRanges: [{ startDate, endDate }],
      dimensions: dimensions.map(d => ({ name: d })),
      metrics: metrics.map(m => ({ name: m })),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('GA4 API error:', error);
    throw new Error(`GA4 API error: ${response.status}`);
  }

  return await response.json();
}

async function fetchScrollDepthData(propertyId: string, accessToken: string, startDate: string, endDate: string) {
  const data = await runReport(
    propertyId,
    accessToken,
    ['date', 'customEvent:scroll_depth'],
    ['eventCount'],
    startDate,
    endDate
  );

  const scrollData: { date: string; depth25: number; depth50: number; depth75: number; depth90: number; depth100: number }[] = [];
  const dateMap = new Map<string, any>();

  data.rows?.forEach((row: any) => {
    const date = row.dimensionValues[0].value;
    const depth = row.dimensionValues[1].value;
    const count = parseInt(row.metricValues[0].value);

    if (!dateMap.has(date)) {
      dateMap.set(date, { date, depth25: 0, depth50: 0, depth75: 0, depth90: 0, depth100: 0 });
    }

    const entry = dateMap.get(date);
    entry[`depth${depth}`] = count;
  });

  return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchFilterUsageData(propertyId: string, accessToken: string, startDate: string, endDate: string) {
  try {
    const data = await runReport(
      propertyId,
      accessToken,
      ['date', 'customEvent:search_type'],
      ['eventCount'],
      startDate,
      endDate
    );

    const filterData: { date: string; material: number; technology: number; area: number; search: number }[] = [];
    const dateMap = new Map<string, any>();

    data.rows?.forEach((row: any) => {
      const date = row.dimensionValues[0].value;
      const filterType = row.dimensionValues[1].value;
      const count = parseInt(row.metricValues[0].value);

      if (!dateMap.has(date)) {
        dateMap.set(date, { date, material: 0, technology: 0, area: 0, search: 0 });
      }

      const entry = dateMap.get(date);
      if (entry[filterType] !== undefined) {
        entry[filterType] = count;
      }
    });

    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.log('⚠️ Custom dimension "search_type" not configured in GA4, returning empty data');
    return [];
  }
}

async function fetchSupplierInteractionData(propertyId: string, accessToken: string, startDate: string, endDate: string) {
  try {
    // Fetch select_item events (when users select suppliers from list)
    const selectItemData = await runReport(
      propertyId,
      accessToken,
      ['date', 'eventName'],
      ['eventCount'],
      startDate,
      endDate
    );

    // Fetch supplier_pageview events (detail page views)
    const supplierViewData = await runReport(
      propertyId,
      accessToken,
      ['date', 'eventName'],
      ['eventCount'],
      startDate,
      endDate
    );

    // Fetch affiliate_click events (conversions)
    const conversionData = await runReport(
      propertyId,
      accessToken,
      ['date', 'eventName'],
      ['eventCount'],
      startDate,
      endDate
    );

    const dateMap = new Map<string, any>();

    // Process select_item events
    selectItemData.rows?.forEach((row: any) => {
      const date = row.dimensionValues[0].value;
      const eventName = row.dimensionValues[1].value;
      const count = parseInt(row.metricValues[0].value);

      if (eventName === 'select_item') {
        if (!dateMap.has(date)) {
          dateMap.set(date, { date, selectItems: 0, supplierViews: 0, conversions: 0 });
        }
        const entry = dateMap.get(date);
        entry.selectItems += count;
      }
    });

    // Process supplier_pageview events
    supplierViewData.rows?.forEach((row: any) => {
      const date = row.dimensionValues[0].value;
      const eventName = row.dimensionValues[1].value;
      const count = parseInt(row.metricValues[0].value);

      if (eventName === 'supplier_pageview') {
        if (!dateMap.has(date)) {
          dateMap.set(date, { date, selectItems: 0, supplierViews: 0, conversions: 0 });
        }
        const entry = dateMap.get(date);
        entry.supplierViews += count;
      }
    });

    // Process affiliate_click events (conversions)
    conversionData.rows?.forEach((row: any) => {
      const date = row.dimensionValues[0].value;
      const eventName = row.dimensionValues[1].value;
      const count = parseInt(row.metricValues[0].value);

      if (eventName === 'affiliate_click') {
        if (!dateMap.has(date)) {
          dateMap.set(date, { date, selectItems: 0, supplierViews: 0, conversions: 0 });
        }
        const entry = dateMap.get(date);
        entry.conversions += count;
      }
    });

    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.log('⚠️ Error fetching supplier interaction data, returning empty data:', error);
    return [];
  }
}

async function fetchConversionData(propertyId: string, accessToken: string, startDate: string, endDate: string) {
  // Fetch conversion events (supplier website clicks)
  const data = await runReport(
    propertyId,
    accessToken,
    ['date', 'eventName'],
    ['eventCount'],
    startDate,
    endDate
  );

  const conversionData: { date: string; conversions: number }[] = [];
  const dateMap = new Map<string, number>();

  data.rows?.forEach((row: any) => {
    const date = row.dimensionValues[0].value;
    const eventName = row.dimensionValues[1].value;
    const count = parseInt(row.metricValues[0].value);

    // Only count affiliate click conversions
    if (eventName === 'affiliate_click') {
      if (!dateMap.has(date)) {
        dateMap.set(date, 0);
      }
      dateMap.set(date, dateMap.get(date)! + count);
    }
  });

  // Convert map to array and sort by date
  dateMap.forEach((conversions, date) => {
    conversionData.push({ date, conversions });
  });

  return conversionData.sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchUserBehaviorData(propertyId: string, accessToken: string, startDate: string, endDate: string) {
  const data = await runReport(
    propertyId,
    accessToken,
    ['date', 'newVsReturning'],
    ['activeUsers', 'sessions', 'bounceRate', 'averageSessionDuration', 'screenPageViewsPerSession', 'engagementRate'],
    startDate,
    endDate
  );

  const behaviorData: any[] = [];
  const dateMap = new Map<string, any>();

  data.rows?.forEach((row: any) => {
    const date = row.dimensionValues[0].value;
    const userType = row.dimensionValues[1].value;
    const activeUsers = parseInt(row.metricValues[0].value);
    const sessions = parseInt(row.metricValues[1].value);
    const bounceRate = parseFloat(row.metricValues[2].value);
    const avgSessionDuration = parseFloat(row.metricValues[3].value);
    const pagesPerSession = parseFloat(row.metricValues[4].value);
    const engagementRate = parseFloat(row.metricValues[5].value);

    if (!dateMap.has(date)) {
      dateMap.set(date, { 
        date, 
        totalActiveUsers: 0, 
        totalSessions: 0,
        newUsers: 0,
        returningUsers: 0,
        bounceRate: 0,
        avgSessionDuration: 0,
        pagesPerSession: 0,
        engagementRate: 0,
      });
    }

    const entry = dateMap.get(date);
    entry.totalActiveUsers += activeUsers;
    entry.totalSessions += sessions;
    entry[userType === 'new' ? 'newUsers' : 'returningUsers'] += activeUsers;
    entry.bounceRate = bounceRate;
    entry.avgSessionDuration = avgSessionDuration;
    entry.pagesPerSession = pagesPerSession;
    entry.engagementRate = engagementRate;
  });

  return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchTopSuppliersData(propertyId: string, accessToken: string, startDate: string, endDate: string, supabase: any) {
  console.log('🔍 fetchTopSuppliersData called');
  
  try {
    // Try to fetch supplier interactions using supplier_name dimension
    console.log('📊 Attempting to fetch with supplier_name dimension...');
    const interactionData = await runReport(
      propertyId,
      accessToken,
      ['customEvent:supplier_name', 'customEvent:interaction_action'],
      ['eventCount'],
      startDate,
      endDate
    );

    console.log('📊 Raw interaction data:', JSON.stringify(interactionData, null, 2));

    // Fetch supplier conversions (website clicks) using supplier_name
    const conversionData = await runReport(
      propertyId,
      accessToken,
      ['customEvent:supplier_name', 'eventName'],
      ['eventCount'],
      startDate,
      endDate
    );

    console.log('📊 Raw conversion data:', JSON.stringify(conversionData, null, 2));

    const supplierMap = new Map<string, any>();

    // Process interaction data (clicks and views)
    interactionData.rows?.forEach((row: any) => {
      const supplierName = row.dimensionValues[0].value;
      const action = row.dimensionValues[1].value;
      const count = parseInt(row.metricValues[0].value);

      // Skip "(not set)" entries
      if (supplierName === '(not set)' || !supplierName) {
        return;
      }

      if (!supplierMap.has(supplierName)) {
        supplierMap.set(supplierName, { 
          name: supplierName,
          clicks: 0, 
          views: 0, 
          conversions: 0,
          total: 0,
        });
      }

      const entry = supplierMap.get(supplierName);
      if (action === 'click') entry.clicks += count;
      else if (action === 'view') entry.views += count;
      entry.total += count;
    });

    // Process conversion data
    conversionData.rows?.forEach((row: any) => {
      const supplierName = row.dimensionValues[0].value;
      const eventName = row.dimensionValues[1].value;
      const count = parseInt(row.metricValues[0].value);

      // Skip "(not set)" entries
      if (supplierName === '(not set)' || !supplierName) {
        return;
      }

      // Only count supplier website click conversions
      if (eventName === 'supplier_website_click_submit') {
        if (!supplierMap.has(supplierName)) {
          supplierMap.set(supplierName, { 
            name: supplierName,
            clicks: 0, 
            views: 0, 
            conversions: 0,
            total: 0,
          });
        }

        const entry = supplierMap.get(supplierName);
        entry.conversions += count;
        entry.total += count;
      }
    });

    // Get top 10 suppliers by total interactions
    const topSuppliers = Array.from(supplierMap.values())
      .filter(s => s.total > 0) // Only include suppliers with interactions
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    console.log('✅ Top suppliers processed with supplier_name:', topSuppliers);

    return topSuppliers;
  } catch (error) {
    console.error('❌ Error fetching with supplier_name:', error);
    
    // If supplier_name dimension isn't configured, fall back to supplier_id
    if (error.message?.includes('supplier_name is not a valid dimension')) {
      console.log('⚠️ supplier_name not configured, falling back to supplier_id...');
      
      try {
        // Fetch interactions using supplier_id instead
        const interactionData = await runReport(
          propertyId,
          accessToken,
          ['customEvent:supplier_id', 'customEvent:interaction_action'],
          ['eventCount'],
          startDate,
          endDate
        );

        // Fetch conversions using supplier_id
        const conversionData = await runReport(
          propertyId,
          accessToken,
          ['customEvent:supplier_id', 'eventName'],
          ['eventCount'],
          startDate,
          endDate
        );

        const supplierMap = new Map<string, any>();

        // Process interaction data (clicks and views)
        interactionData.rows?.forEach((row: any) => {
          const supplierId = row.dimensionValues[0].value;
          const action = row.dimensionValues[1].value;
          const count = parseInt(row.metricValues[0].value);

          // Skip "(not set)" entries
          if (supplierId === '(not set)' || !supplierId) {
            return;
          }

          if (!supplierMap.has(supplierId)) {
            supplierMap.set(supplierId, { 
              id: supplierId,
              clicks: 0, 
              views: 0, 
              conversions: 0,
              total: 0,
            });
          }

          const entry = supplierMap.get(supplierId);
          if (action === 'click') entry.clicks += count;
          else if (action === 'view') entry.views += count;
          entry.total += count;
        });

        // Process conversion data
        conversionData.rows?.forEach((row: any) => {
          const supplierId = row.dimensionValues[0].value;
          const eventName = row.dimensionValues[1].value;
          const count = parseInt(row.metricValues[0].value);

          // Skip "(not set)" entries
          if (supplierId === '(not set)' || !supplierId) {
            return;
          }

          // Only count supplier website click conversions
          if (eventName === 'supplier_website_click_submit') {
            if (!supplierMap.has(supplierId)) {
              supplierMap.set(supplierId, { 
                id: supplierId,
                clicks: 0, 
                views: 0, 
                conversions: 0,
                total: 0,
              });
            }

            const entry = supplierMap.get(supplierId);
            entry.conversions += count;
            entry.total += count;
          }
        });

        // Get supplier IDs
        const supplierIds = Array.from(supplierMap.keys());
        
        if (supplierIds.length === 0) {
          console.log('⚠️ No supplier interactions found');
          return [];
        }

        // Fetch supplier names from database
        console.log(`📊 Fetching names for ${supplierIds.length} suppliers from database...`);
        const { data: suppliers, error: dbError } = await supabase
          .from('suppliers')
          .select('supplier_id, name')
          .in('supplier_id', supplierIds);

        if (dbError) {
          console.error('❌ Error fetching supplier names:', dbError);
          // Continue without names
        } else {
          // Map supplier IDs to names
          const nameMap = new Map<string, string>();
          suppliers?.forEach((s: any) => nameMap.set(s.supplier_id, s.name));

          // Add names to supplier data
          supplierMap.forEach((value, key) => {
            value.name = nameMap.get(key) || `Supplier ${key.substring(0, 8)}`;
          });
        }

        // Get top 10 suppliers by total interactions
        const topSuppliers = Array.from(supplierMap.values())
          .filter(s => s.total > 0)
          .sort((a, b) => b.total - a.total)
          .slice(0, 10);

        console.log('✅ Top suppliers processed with supplier_id fallback:', topSuppliers);

        return topSuppliers;
      } catch (fallbackError) {
        console.error('❌ Error in supplier_id fallback:', fallbackError);
        return [];
      }
    }
    
    throw error;
  }
}

async function fetchGeographicData(propertyId: string, accessToken: string, startDate: string, endDate: string) {
  const data = await runReport(
    propertyId,
    accessToken,
    ['country', 'city'],
    ['activeUsers', 'sessions'],
    startDate,
    endDate
  );

  const countryMap = new Map<string, any>();
  const cityMap = new Map<string, any>();

  data.rows?.forEach((row: any) => {
    const country = row.dimensionValues[0].value;
    const city = row.dimensionValues[1].value;
    const activeUsers = parseInt(row.metricValues[0].value);
    const sessions = parseInt(row.metricValues[1].value);

    // Aggregate by country
    if (!countryMap.has(country)) {
      countryMap.set(country, { name: country, users: 0, sessions: 0 });
    }
    const countryEntry = countryMap.get(country);
    countryEntry.users += activeUsers;
    countryEntry.sessions += sessions;

    // Aggregate by city
    const cityKey = `${city}, ${country}`;
    if (!cityMap.has(cityKey)) {
      cityMap.set(cityKey, { name: cityKey, users: 0, sessions: 0 });
    }
    const cityEntry = cityMap.get(cityKey);
    cityEntry.users += activeUsers;
    cityEntry.sessions += sessions;
  });

  return {
    countries: Array.from(countryMap.values()).sort((a, b) => b.users - a.users).slice(0, 10),
    cities: Array.from(cityMap.values()).sort((a, b) => b.users - a.users).slice(0, 10),
  };
}

async function fetchTopConvertingSuppliersData(propertyId: string, accessToken: string, startDate: string, endDate: string, supabase: any, filters?: { technology?: string; material?: string }) {
  try {
    // Fetch supplier views
    const viewsData = await runReport(
      propertyId,
      accessToken,
      ['customEvent:supplier_id'],
      ['eventCount'],
      startDate,
      endDate
    );

    // Fetch supplier conversions (website clicks)
    const conversionsData = await runReport(
      propertyId,
      accessToken,
      ['customEvent:supplier_id', 'eventName'],
      ['eventCount'],
      startDate,
      endDate
    );

  const supplierStats = new Map<string, any>();

  // Aggregate views per supplier
  viewsData.rows?.forEach((row: any) => {
    const supplierId = row.dimensionValues[0].value;
    const views = parseInt(row.metricValues[0].value);

    if (!supplierStats.has(supplierId)) {
      supplierStats.set(supplierId, { 
        supplierId,
        name: supplierId,
        views: 0, 
        conversions: 0,
        conversionRate: 0,
      });
    }

    const entry = supplierStats.get(supplierId);
    entry.views += views;
  });

  // Aggregate conversions per supplier
  conversionsData.rows?.forEach((row: any) => {
    const supplierId = row.dimensionValues[0].value;
    const eventName = row.dimensionValues[1].value;
    const count = parseInt(row.metricValues[0].value);

    // Only count conversion events (website clicks)
    if (eventName === 'supplier_website_click_submit') {
      if (!supplierStats.has(supplierId)) {
        supplierStats.set(supplierId, { 
          supplierId,
          name: supplierId,
          views: 0, 
          conversions: 0,
          conversionRate: 0,
        });
      }

      const entry = supplierStats.get(supplierId);
      entry.conversions += count;
    }
  });

  // Calculate conversion rates and sort
  const suppliersWithStats = Array.from(supplierStats.values())
    .filter(s => s.views > 0) // Only include suppliers with views
    .map(supplier => ({
      ...supplier,
      conversionRate: ((supplier.conversions / supplier.views) * 100).toFixed(1)
    }))
    .sort((a, b) => parseFloat(b.conversionRate) - parseFloat(a.conversionRate))
    .slice(0, 10);

  // Fetch supplier names from database and apply filters
  const supplierIds = suppliersWithStats.map(s => s.supplierId);
  
  if (supplierIds.length > 0) {
    let query = supabase
      .from('suppliers')
      .select('id, name, technologies, materials')
      .in('id', supplierIds);

    // Apply technology filter if specified
    if (filters?.technology) {
      query = query.contains('technologies', [filters.technology]);
    }

    // Apply material filter if specified
    if (filters?.material) {
      query = query.contains('materials', [filters.material]);
    }

    const { data: suppliers, error } = await query;

    if (!error && suppliers) {
      const nameMap = new Map(suppliers.map((s: any) => [s.id, s.name]));
      
      // Filter stats to only include suppliers that match the filters
      const filteredStats = suppliersWithStats.filter(supplier => 
        nameMap.has(supplier.supplierId)
      );

      filteredStats.forEach(supplier => {
        const actualName = nameMap.get(supplier.supplierId);
        if (actualName) {
          supplier.name = actualName;
        }
      });

      return filteredStats;
    }
  }

  return suppliersWithStats;
  } catch (error) {
    console.log('⚠️ Custom dimension "supplier_id" not configured in GA4, returning empty data for top converting suppliers');
    return [];
  }
}

async function fetchTechnologyConversionStats(propertyId: string, accessToken: string, startDate: string, endDate: string, supabase: any) {
  try {
    // Fetch all suppliers with their technologies
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('id, technologies');

    if (error || !suppliers) {
      console.error('Error fetching suppliers for technology stats:', error);
      return [];
    }

    // Fetch supplier views
    const viewsData = await runReport(
      propertyId,
      accessToken,
      ['customEvent:supplier_id'],
      ['eventCount'],
      startDate,
      endDate
    );

    // Fetch supplier conversions (website clicks)
    const conversionsData = await runReport(
      propertyId,
      accessToken,
      ['customEvent:supplier_id', 'eventName'],
      ['eventCount'],
      startDate,
      endDate
    );

  // Create maps for views and conversions per supplier
  const viewsMap = new Map<string, number>();
  const conversionsMap = new Map<string, number>();

  viewsData.rows?.forEach((row: any) => {
    const supplierId = row.dimensionValues[0].value;
    const views = parseInt(row.metricValues[0].value);
    viewsMap.set(supplierId, (viewsMap.get(supplierId) || 0) + views);
  });

  conversionsData.rows?.forEach((row: any) => {
    const supplierId = row.dimensionValues[0].value;
    const eventName = row.dimensionValues[1].value;
    const count = parseInt(row.metricValues[0].value);

    if (eventName === 'supplier_website_click_submit') {
      conversionsMap.set(supplierId, (conversionsMap.get(supplierId) || 0) + count);
    }
  });

  // Aggregate by technology
  const techStats = new Map<string, { views: number; conversions: number }>();

  suppliers.forEach((supplier: any) => {
    const views = viewsMap.get(supplier.id) || 0;
    const conversions = conversionsMap.get(supplier.id) || 0;

    supplier.technologies?.forEach((tech: string) => {
      if (!techStats.has(tech)) {
        techStats.set(tech, { views: 0, conversions: 0 });
      }
      const stats = techStats.get(tech)!;
      stats.views += views;
      stats.conversions += conversions;
    });
  });

  // Calculate conversion rates and format
  return Array.from(techStats.entries())
    .map(([technology, stats]) => ({
      technology,
      views: stats.views,
      conversions: stats.conversions,
      conversionRate: stats.views > 0 ? parseFloat(((stats.conversions / stats.views) * 100).toFixed(1)) : 0
    }))
    .filter(stat => stat.views > 0) // Only include technologies with views
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, 15); // Top 15 technologies
  } catch (error) {
    console.log('⚠️ Custom dimension "supplier_id" not configured in GA4, returning empty data for technology stats');
    return [];
  }
}

async function fetchMaterialConversionStats(propertyId: string, accessToken: string, startDate: string, endDate: string, supabase: any) {
  try {
    // Fetch all suppliers with their materials
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('id, materials');

    if (error || !suppliers) {
      console.error('Error fetching suppliers for material stats:', error);
      return [];
    }

    // Fetch supplier views
    const viewsData = await runReport(
      propertyId,
      accessToken,
      ['customEvent:supplier_id'],
      ['eventCount'],
      startDate,
      endDate
    );

    // Fetch supplier conversions (website clicks)
    const conversionsData = await runReport(
      propertyId,
      accessToken,
      ['customEvent:supplier_id', 'eventName'],
      ['eventCount'],
      startDate,
      endDate
    );

  // Create maps for views and conversions per supplier
  const viewsMap = new Map<string, number>();
  const conversionsMap = new Map<string, number>();

  viewsData.rows?.forEach((row: any) => {
    const supplierId = row.dimensionValues[0].value;
    const views = parseInt(row.metricValues[0].value);
    viewsMap.set(supplierId, (viewsMap.get(supplierId) || 0) + views);
  });

  conversionsData.rows?.forEach((row: any) => {
    const supplierId = row.dimensionValues[0].value;
    const eventName = row.dimensionValues[1].value;
    const count = parseInt(row.metricValues[0].value);

    if (eventName === 'supplier_website_click_submit') {
      conversionsMap.set(supplierId, (conversionsMap.get(supplierId) || 0) + count);
    }
  });

  // Aggregate by material
  const materialStats = new Map<string, { views: number; conversions: number }>();

  suppliers.forEach((supplier: any) => {
    const views = viewsMap.get(supplier.id) || 0;
    const conversions = conversionsMap.get(supplier.id) || 0;

    supplier.materials?.forEach((material: string) => {
      if (!materialStats.has(material)) {
        materialStats.set(material, { views: 0, conversions: 0 });
      }
      const stats = materialStats.get(material)!;
      stats.views += views;
      stats.conversions += conversions;
    });
  });

  // Calculate conversion rates and format
  return Array.from(materialStats.entries())
    .map(([material, stats]) => ({
      material,
      views: stats.views,
      conversions: stats.conversions,
      conversionRate: stats.views > 0 ? parseFloat(((stats.conversions / stats.views) * 100).toFixed(1)) : 0
    }))
    .filter(stat => stat.views > 0) // Only include materials with views
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, 15); // Top 15 materials
  } catch (error) {
    console.log('⚠️ Custom dimension "supplier_id" not configured in GA4, returning empty data for material stats');
    return [];
  }
}

async function fetchFunnelData(propertyId: string, accessToken: string, startDate: string, endDate: string) {
  console.log('🔍 fetchFunnelData called with:', { propertyId, startDate, endDate });
  
  // Fetch daily trend data (events by date)
  let dailyTrendData;
  try {
    dailyTrendData = await runReport(
      propertyId,
      accessToken,
      ['date', 'eventName'],
      ['eventCount'],
      startDate,
      endDate
    );
    console.log('✅ Successfully fetched daily trend data');
  } catch (error) {
    console.log('⚠️ Error fetching daily trend data:', error);
    dailyTrendData = null;
  }
  
  // First, try to fetch events with source dimension (if custom dimension is configured in GA4)
  let eventsDataWithSource;
  try {
    eventsDataWithSource = await runReport(
      propertyId,
      accessToken,
      ['eventName', 'customEvent:source'],
      ['eventCount'],
      startDate,
      endDate
    );
    console.log('✅ Successfully fetched events with source dimension');
  } catch (error) {
    console.log('⚠️ Custom dimension "source" not yet configured in GA4, falling back to total counts only');
    eventsDataWithSource = null;
  }

  // If source dimension is available, use it for segmentation
  if (eventsDataWithSource && eventsDataWithSource.rows && eventsDataWithSource.rows.length > 0) {
    console.log('📊 GA4 Events Data with source:', JSON.stringify(eventsDataWithSource, null, 2));
    
    // Initialize counters for each source
    const sourceData: Record<string, { landingViews: number; selectItems: number; searches: number; supplierViews: number; conversions: number }> = {
      search: { landingViews: 0, selectItems: 0, searches: 0, supplierViews: 0, conversions: 0 },
      map: { landingViews: 0, selectItems: 0, searches: 0, supplierViews: 0, conversions: 0 },
      direct: { landingViews: 0, selectItems: 0, searches: 0, supplierViews: 0, conversions: 0 },
    };

    let totalLandingViews = 0;
    let totalSelectItems = 0;
    let totalSearches = 0;
    let totalSupplierViews = 0;
    let totalConversions = 0;

    // Count events by type and source
    eventsDataWithSource.rows.forEach((row: any) => {
      const eventName = row.dimensionValues[0].value;
      const source = row.dimensionValues[1]?.value || 'direct';
      const count = parseInt(row.metricValues[0].value);
      
      console.log(`Event: ${eventName}, Source: ${source} = ${count}`);
      
      // Ensure we have a data structure for this source
      if (!sourceData[source]) {
        sourceData[source] = { landingViews: 0, selectItems: 0, searches: 0, supplierViews: 0, conversions: 0 };
      }
      
      if (eventName === 'page_view' || eventName === 'session_start') {
        sourceData[source].landingViews += count;
        totalLandingViews += count;
      } else if (eventName === 'select_item') {
        sourceData[source].selectItems += count;
        totalSelectItems += count;
      } else if (eventName === 'search_page_view') {
        sourceData[source].searches += count;
        totalSearches += count;
      } else if (eventName === 'supplier_pageview') {
        sourceData[source].supplierViews += count;
        totalSupplierViews += count;
      } else if (eventName === 'affiliate_click') {
        sourceData[source].conversions += count;
        totalConversions += count;
      }
    });

    console.log('📊 Total funnel counts:', { totalLandingViews, totalSelectItems, totalSearches, totalSupplierViews, totalConversions });
    console.log('📊 Funnel by source:', sourceData);

    // Calculate overall conversion rates
    const landingToSelectRate = totalLandingViews > 0 ? ((totalSelectItems / totalLandingViews) * 100).toFixed(1) : '0';
    const selectToSearchRate = totalSelectItems > 0 ? ((totalSearches / totalSelectItems) * 100).toFixed(1) : '0';
    const searchToViewRate = totalSearches > 0 ? ((totalSupplierViews / totalSearches) * 100).toFixed(1) : '0';
    const viewToConversionRate = totalSupplierViews > 0 ? ((totalConversions / totalSupplierViews) * 100).toFixed(1) : '0';
    const overallConversionRate = totalLandingViews > 0 ? ((totalConversions / totalLandingViews) * 100).toFixed(1) : '0';

    // Calculate rates for each source
    const sourceStats = Object.entries(sourceData)
      .filter(([_, data]) => data.landingViews > 0 || data.selectItems > 0 || data.searches > 0 || data.supplierViews > 0 || data.conversions > 0)
      .map(([source, data]) => {
        const landingToSelectRate = data.landingViews > 0 ? parseFloat(((data.selectItems / data.landingViews) * 100).toFixed(1)) : 0;
        const selectToSearchRate = data.selectItems > 0 ? parseFloat(((data.searches / data.selectItems) * 100).toFixed(1)) : 0;
        const searchToViewRate = data.searches > 0 ? parseFloat(((data.supplierViews / data.searches) * 100).toFixed(1)) : 0;
        const viewToConversionRate = data.supplierViews > 0 ? parseFloat(((data.conversions / data.supplierViews) * 100).toFixed(1)) : 0;
        const overallConversionRate = data.landingViews > 0 ? parseFloat(((data.conversions / data.landingViews) * 100).toFixed(1)) : 0;

        return {
          source,
          landingViews: data.landingViews,
          selectItems: data.selectItems,
          searches: data.searches,
          supplierViews: data.supplierViews,
          conversions: data.conversions,
          landingToSelectRate,
          selectToSearchRate,
          searchToViewRate,
          viewToConversionRate,
          overallConversionRate,
          dropOff: {
            landingToSelect: data.landingViews > 0 ? data.landingViews - data.selectItems : 0,
            selectToSearch: data.selectItems > 0 ? data.selectItems - data.searches : 0,
            searchToView: data.searches > 0 ? data.searches - data.supplierViews : 0,
            viewToConversion: data.supplierViews > 0 ? data.supplierViews - data.conversions : 0,
          },
        };
      });

    // Process daily trend data
    const dailyTrends = processDailyTrends(dailyTrendData);

    return {
      landingViews: totalLandingViews,
      selectItems: totalSelectItems,
      searches: totalSearches,
      supplierViews: totalSupplierViews,
      conversions: totalConversions,
      landingToSelectRate: parseFloat(landingToSelectRate),
      selectToSearchRate: parseFloat(selectToSearchRate),
      searchToViewRate: parseFloat(searchToViewRate),
      viewToConversionRate: parseFloat(viewToConversionRate),
      overallConversionRate: parseFloat(overallConversionRate),
      dropOff: {
        landingToSelect: totalLandingViews > 0 ? totalLandingViews - totalSelectItems : 0,
        selectToSearch: totalSelectItems > 0 ? totalSelectItems - totalSearches : 0,
        searchToView: totalSearches > 0 ? totalSearches - totalSupplierViews : 0,
        viewToConversion: totalSupplierViews > 0 ? totalSupplierViews - totalConversions : 0,
      },
      bySource: sourceStats,
      dailyTrends,
    };
  }
  
  // Fallback: Fetch events without source dimension (total counts only)
  const eventsData = await runReport(
    propertyId,
    accessToken,
    ['eventName'],
    ['eventCount'],
    startDate,
    endDate
  );

  console.log('📊 GA4 Events Data (without source):', JSON.stringify(eventsData, null, 2));
  console.log('📈 Total rows returned:', eventsData.rows?.length || 0);

  let totalLandingViews = 0;
  let totalSelectItems = 0;
  let totalSearches = 0;
  let totalSupplierViews = 0;
  let totalConversions = 0;

  // Count events by type
  eventsData.rows?.forEach((row: any) => {
    const eventName = row.dimensionValues[0].value;
    const count = parseInt(row.metricValues[0].value);
    
    console.log(`Event: ${eventName} = ${count}`);
    
    if (eventName === 'page_view' || eventName === 'session_start') {
      totalLandingViews += count;
    } else if (eventName === 'select_item') {
      totalSelectItems += count;
    } else if (eventName === 'search_page_view') {
      totalSearches += count;
    } else if (eventName === 'supplier_pageview') {
      totalSupplierViews += count;
    } else if (eventName === 'affiliate_click') {
      totalConversions += count;
    }
  });

  console.log('📊 Total funnel counts:', { totalLandingViews, totalSelectItems, totalSearches, totalSupplierViews, totalConversions });

  // Calculate overall conversion rates
  const landingToSelectRate = totalLandingViews > 0 ? ((totalSelectItems / totalLandingViews) * 100).toFixed(1) : '0';
  const selectToSearchRate = totalSelectItems > 0 ? ((totalSearches / totalSelectItems) * 100).toFixed(1) : '0';
  const searchToViewRate = totalSearches > 0 ? ((totalSupplierViews / totalSearches) * 100).toFixed(1) : '0';
  const viewToConversionRate = totalSupplierViews > 0 ? ((totalConversions / totalSupplierViews) * 100).toFixed(1) : '0';
  const overallConversionRate = totalLandingViews > 0 ? ((totalConversions / totalLandingViews) * 100).toFixed(1) : '0';

  // Process daily trend data
  const dailyTrends = processDailyTrends(dailyTrendData);

  return {
    landingViews: totalLandingViews,
    selectItems: totalSelectItems,
    searches: totalSearches,
    supplierViews: totalSupplierViews,
    conversions: totalConversions,
    landingToSelectRate: parseFloat(landingToSelectRate),
    selectToSearchRate: parseFloat(selectToSearchRate),
    searchToViewRate: parseFloat(searchToViewRate),
    viewToConversionRate: parseFloat(viewToConversionRate),
    overallConversionRate: parseFloat(overallConversionRate),
    dropOff: {
      landingToSelect: totalLandingViews > 0 ? totalLandingViews - totalSelectItems : 0,
      selectToSearch: totalSelectItems > 0 ? totalSelectItems - totalSearches : 0,
      searchToView: totalSearches > 0 ? totalSearches - totalSupplierViews : 0,
      viewToConversion: totalSupplierViews > 0 ? totalSupplierViews - totalConversions : 0,
    },
    bySource: [], // Source segmentation not available without custom dimension
    dailyTrends,
  };
}

function processDailyTrends(dailyTrendData: any) {
  if (!dailyTrendData?.rows || dailyTrendData.rows.length === 0) {
    return [];
  }

  const dateMap = new Map<string, any>();

  // Process all events by date
  dailyTrendData.rows.forEach((row: any) => {
    const date = row.dimensionValues[0].value;
    const eventName = row.dimensionValues[1].value;
    const count = parseInt(row.metricValues[0].value);

    if (!dateMap.has(date)) {
      dateMap.set(date, {
        date,
        landingViews: 0,
        selectItems: 0,
        searches: 0,
        supplierViews: 0,
        conversions: 0,
      });
    }

    const entry = dateMap.get(date);
    
    if (eventName === 'page_view' || eventName === 'session_start') {
      entry.landingViews += count;
    } else if (eventName === 'select_item') {
      entry.selectItems += count;
    } else if (eventName === 'search_page_view') {
      entry.searches += count;
    } else if (eventName === 'supplier_pageview') {
      entry.supplierViews += count;
    } else if (eventName === 'affiliate_click') {
      entry.conversions += count;
    }
  });

  // Calculate conversion rates for each day
  return Array.from(dateMap.values())
    .map(day => ({
      date: day.date,
      landingViews: day.landingViews,
      selectItems: day.selectItems,
      searches: day.searches,
      supplierViews: day.supplierViews,
      conversions: day.conversions,
      landingToSelectRate: day.landingViews > 0 ? parseFloat(((day.selectItems / day.landingViews) * 100).toFixed(1)) : 0,
      selectToSearchRate: day.selectItems > 0 ? parseFloat(((day.searches / day.selectItems) * 100).toFixed(1)) : 0,
      searchToViewRate: day.searches > 0 ? parseFloat(((day.supplierViews / day.searches) * 100).toFixed(1)) : 0,
      viewToConversionRate: day.supplierViews > 0 ? parseFloat(((day.conversions / day.supplierViews) * 100).toFixed(1)) : 0,
      overallConversionRate: day.landingViews > 0 ? parseFloat(((day.conversions / day.landingViews) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ===================== SEO-specific functions =====================
async function runReportWithFilter(propertyId: string, accessToken: string, dimensions: string[], metrics: string[], startDate: string, endDate: string, dimensionFilter: any) {
  const body: any = {
    dateRanges: [{ startDate, endDate }],
    dimensions: dimensions.map(d => ({ name: d })),
    metrics: metrics.map(m => ({ name: m })),
  };
  if (dimensionFilter) {
    body.dimensionFilter = dimensionFilter;
  }

  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('GA4 API error:', error);
    throw new Error(`GA4 API error: ${response.status}`);
  }

  return await response.json();
}

async function fetchOrganicTrafficData(propertyId: string, accessToken: string, startDate: string, endDate: string) {
  try {
    const data = await runReportWithFilter(
      propertyId, accessToken,
      ['date'],
      ['sessions', 'activeUsers', 'bounceRate', 'engagementRate', 'averageSessionDuration', 'screenPageViewsPerSession'],
      startDate, endDate,
      {
        filter: {
          fieldName: 'sessionDefaultChannelGroup',
          stringFilter: { matchType: 'EXACT', value: 'Organic Search' }
        }
      }
    );

    return (data.rows || []).map((row: any) => ({
      date: row.dimensionValues[0].value,
      sessions: parseInt(row.metricValues[0].value),
      activeUsers: parseInt(row.metricValues[1].value),
      bounceRate: parseFloat(row.metricValues[2].value),
      engagementRate: parseFloat(row.metricValues[3].value),
      avgSessionDuration: parseFloat(row.metricValues[4].value),
      pagesPerSession: parseFloat(row.metricValues[5].value),
    })).sort((a: any, b: any) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('Error fetching organic traffic:', error);
    return [];
  }
}

async function fetchOrganicLandingPages(propertyId: string, accessToken: string, startDate: string, endDate: string) {
  try {
    const data = await runReportWithFilter(
      propertyId, accessToken,
      ['landingPagePlusQueryString'],
      ['sessions', 'activeUsers', 'bounceRate', 'engagementRate', 'conversions'],
      startDate, endDate,
      {
        filter: {
          fieldName: 'sessionDefaultChannelGroup',
          stringFilter: { matchType: 'EXACT', value: 'Organic Search' }
        }
      }
    );

    return (data.rows || []).map((row: any) => ({
      page: row.dimensionValues[0].value,
      sessions: parseInt(row.metricValues[0].value),
      users: parseInt(row.metricValues[1].value),
      bounceRate: parseFloat(row.metricValues[2].value),
      engagementRate: parseFloat(row.metricValues[3].value),
      conversions: parseInt(row.metricValues[4].value),
    }))
    .filter((p: any) => p.page !== '(not set)')
    .sort((a: any, b: any) => b.sessions - a.sessions)
    .slice(0, 20);
  } catch (error) {
    console.error('Error fetching organic landing pages:', error);
    return [];
  }
}

async function fetchOrganicOverview(propertyId: string, accessToken: string, startDate: string, endDate: string) {
  try {
    // Fetch total traffic for comparison
    const totalData = await runReport(
      propertyId, accessToken,
      [],
      ['sessions', 'activeUsers'],
      startDate, endDate
    );

    const organicData = await runReportWithFilter(
      propertyId, accessToken,
      [],
      ['sessions', 'activeUsers'],
      startDate, endDate,
      {
        filter: {
          fieldName: 'sessionDefaultChannelGroup',
          stringFilter: { matchType: 'EXACT', value: 'Organic Search' }
        }
      }
    );

    const totalSessions = parseInt(totalData.rows?.[0]?.metricValues?.[0]?.value || '0');
    const organicSessions = parseInt(organicData.rows?.[0]?.metricValues?.[0]?.value || '0');
    const organicUsers = parseInt(organicData.rows?.[0]?.metricValues?.[1]?.value || '0');

    return {
      totalSessions,
      organicSessions,
      organicUsers,
      organicShare: totalSessions > 0 ? parseFloat(((organicSessions / totalSessions) * 100).toFixed(1)) : 0,
    };
  } catch (error) {
    console.error('Error fetching organic overview:', error);
    return { totalSessions: 0, organicSessions: 0, organicUsers: 0, organicShare: 0 };
  }
}
