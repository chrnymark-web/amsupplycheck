import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Material and Technology mappings for converting display names to database keys
const materialMap: Record<string, string> = {
  'PLA': 'standardpla',
  'ABS M30': 'abs-m30-stratasys',
  'ABS (White)': 'abs-white',
  'ABS-like (Black)': 'abs-like-black',
  'ABS+ (Stratasys)': 'absplus-stratasys',
  'ABS M30i': 'abs-m30i',
  'PETG': 'petg',
  'Polycarbonate': 'pc',
  'PC/PC-ABS': 'pc-or-pc-abs',
  'PEI ULTEM 1010': 'pei-ultem-1010-stratasys',
  'PEI ULTEM 9085': 'pei-ultem-9085-stratasys',
  'HIPS': 'hips',
  'Nylon PA-12': 'nylon-pa-12',
  'Nylon 12': 'nylon-12',
  'PA-12': 'pa-12',
  'PA-11 (SLS)': 'pa11-sls',
  'PA-12 Carbon Filled': 'pa-12-carbon-filled',
  'Nylon 12 Mineral Filled': 'nylon-12-mineral-filled-hst',
  'Nylon 12 Glass Filled': 'nylon-12-glass-bead-filled-gf',
  'Nylon 12 Flame Retardant': 'nylon-12-flame-retardant-fr',
  'Nylon 12 Aluminum Filled': 'nylon-12-aluminum-filled-af',
  'PA Aluminum Filled': 'pa-af',
  'PA Glass Filled': 'pa-gf',
  'DuraForm PA Nylon 12': 'duraform-pa-nylon-12',
  'MJF PA12': 'mjf_pa12',
  'SLS PA12 PA2200': 'sls_pa12_pa2200',
  'PA-12 BlueSint': 'pa-12-bluesint',
  'Nylon PA-12 Blue Metal': 'nylon-pa-12-blue-metal',
  'SAF PA11 Eco': 'saf_pa11_eco',
  'TPU (Flexible)': 'tpu-70-a-white',
  'TPU MJF': 'tpu-mjf',
  'SLS Flexible TPU': 'sls_flexible_tpu',
  'Ultrasint TPU01 MJF': 'ultrasint_tpu01_mjf',
  'Polypropylene (MJF)': 'polypropylene-mjf',
  'Polypropylene-P': 'polypropylene-p',
  'Polypropylene Natural': 'pp-natural',
  'Photopolymer Rigid': 'photopolymer-rigid',
  'Accura 25': 'accura-25',
  'Carbon Fiber Reinforced': 'carbonfiberreinforcedfilaments',
  'Kevlar Reinforced': 'kevlarreinforcedfilaments',
  'Wood Filled PLA': 'woodfilledpla',
  'Stainless Steel 316L': 'stainless-steel-316l',
  'Titanium Ti-6Al-4V': 'titanium-ti-6al-4v',
  'Aluminum AlSi10Mg': 'aluminum-aisi10mg',
  'Inconel 718': 'inconel-718',
  'Inconel 625': 'inconel-625',
  'Nickel 625': 'ni625',
  'Maraging Steel': 'maraging-steel',
  'Steel': 'steel',
  'Stainless Steel 17-4PH': 'stainless-steel-17-4ph',
  'Gold Plated Brass': 'gold-plated-brass',
  'Bronze': 'bronze',
  '420i 420SS Bronze': '420i-420ss-brz',
  'Clear Resin': 'formlabs-clear-resin',
  'Tough Resin 2000': 'formlabs-tough-resin-2000',
  'Standard Resin': 'formlabs-standard-resin',
  'High Temp Resin': 'formlabs-high-temp-resin',
  'Durable Resin': 'formlabs-durable-resin',
  'Flexible Resin 80A': 'formlabs-flexible-resin-80a',
  'Somos WaterClear Ultra': 'somos-waterclear-ultra-10122',
  'ULTEM 9085': 'ultem-9085',
  'DuraForm HST': 'duraform-hst',
  'DuraForm TPU': 'duraform-tpu',
  'DuraForm EX': 'duraform-ex',
  'DuraForm GF Glass Filled Nylon': 'duraform-gf-glass-filled-nylon'
};

const technologyMap: Record<string, string> = {
  'FDM/FFF': 'fdm',
  'FDM': 'fdm',
  'FFF': 'fdm',
  'SLA': 'sla',
  'SLS': 'sls',
  'Multi Jet Fusion': 'mjf',
  'MJF': 'mjf',
  'DMLS': 'dmls',
  'SLM': 'slm',
  'Material Jetting': 'material-jetting',
  'Binder Jetting': 'binder-jetting',
  'DLP': 'dlp',
  'SAF': 'saf',
  'Direct Metal Printing': 'dmp',
  'CDLP (Continuous Digital Light Processing)': 'cdlp',
  'CDLP': 'cdlp'
};

// Helper functions to convert between display names and database keys
function getMaterialKeyFromDisplayName(displayName: string): string {
  if (materialMap[displayName]) {
    return materialMap[displayName];
  }
  return displayName.toLowerCase().replace(/\s+/g, '-');
}

function getTechnologyKeyFromDisplayName(displayName: string): string {
  if (technologyMap[displayName]) {
    return technologyMap[displayName];
  }
  return displayName.toLowerCase().replace(/\s+/g, '-');
}

// Country name normalization map (native language -> English)
const countryNormalizationMap: Record<string, string> = {
  // Germanic languages
  'deutschland': 'Germany', 'allemagne': 'Germany', 'alemania': 'Germany', 'tyskland': 'Germany',
  'österreich': 'Austria', 'autriche': 'Austria', 'oostenrijk': 'Austria',
  'schweiz': 'Switzerland', 'suisse': 'Switzerland', 'svizzera': 'Switzerland',
  'niederlande': 'Netherlands', 'pays-bas': 'Netherlands', 'holland': 'Netherlands', 'the netherlands': 'Netherlands',
  'belgien': 'Belgium', 'belgique': 'Belgium', 'belgië': 'Belgium',
  'luxemburg': 'Luxembourg',
  
  // Nordic
  'danmark': 'Denmark', 'danemark': 'Denmark',
  'sverige': 'Sweden', 'schweden': 'Sweden', 'suède': 'Sweden',
  'norge': 'Norway', 'norwegen': 'Norway', 'norvège': 'Norway',
  'suomi': 'Finland', 'finnland': 'Finland', 'finlande': 'Finland',
  'island': 'Iceland', 'islande': 'Iceland',
  
  // Southern Europe
  'italia': 'Italy', 'italien': 'Italy', 'italie': 'Italy',
  'españa': 'Spain', 'spanien': 'Spain', 'espagne': 'Spain',
  'portugal': 'Portugal',
  'griechenland': 'Greece', 'grèce': 'Greece', 'grecia': 'Greece', 'hellas': 'Greece',
  
  // Eastern Europe
  'polska': 'Poland', 'polen': 'Poland', 'pologne': 'Poland',
  'česko': 'Czech Republic', 'tschechien': 'Czech Republic', 'czechia': 'Czech Republic',
  'magyarország': 'Hungary', 'ungarn': 'Hungary', 'hongrie': 'Hungary',
  'slovensko': 'Slovakia', 'slowakei': 'Slovakia',
  'slovenija': 'Slovenia', 'slowenien': 'Slovenia',
  'hrvatska': 'Croatia', 'kroatien': 'Croatia',
  'rumänien': 'Romania', 'roumanie': 'Romania', 'românia': 'Romania',
  'bulgarien': 'Bulgaria', 'bulgarie': 'Bulgaria',
  
  // UK/Ireland
  'vereinigtes königreich': 'United Kingdom', 'royaume-uni': 'United Kingdom',
  'england': 'United Kingdom', 'great britain': 'United Kingdom', 'uk': 'United Kingdom',
  'irland': 'Ireland', 'irlande': 'Ireland', 'éire': 'Ireland',
  
  // Asia
  '中国': 'China', '中國': 'China', 'chine': 'China', 'zhongguo': 'China',
  '日本': 'Japan', 'japon': 'Japan', 'japón': 'Japan', 'nippon': 'Japan',
  '대한민국': 'South Korea', '한국': 'South Korea', 'korea': 'South Korea', 'südkorea': 'South Korea',
  'indien': 'India', 'inde': 'India',
  '台湾': 'Taiwan', 'taiwan': 'Taiwan',
  'singapur': 'Singapore', 'singapour': 'Singapore',
  'malaysien': 'Malaysia', 'malaisie': 'Malaysia',
  'indonesien': 'Indonesia', 'indonésie': 'Indonesia',
  'thailand': 'Thailand', 'thaïlande': 'Thailand',
  'vietnam': 'Vietnam', 'viêt nam': 'Vietnam',
  
  // Middle East
  'türkei': 'Turkey', 'turquie': 'Turkey', 'türkiye': 'Turkey',
  'israel': 'Israel', 'israël': 'Israel',
  'vereinigte arabische emirate': 'United Arab Emirates', 'uae': 'United Arab Emirates', 'émirats arabes unis': 'United Arab Emirates',
  
  // Americas
  'vereinigte staaten': 'United States', 'états-unis': 'United States', 'estados unidos': 'United States',
  'usa': 'United States', 'us': 'United States', 'u.s.': 'United States', 'u.s.a.': 'United States',
  'kanada': 'Canada', 'canadá': 'Canada',
  'mexiko': 'Mexico', 'mexique': 'Mexico', 'méxico': 'Mexico',
  'brasilien': 'Brazil', 'brésil': 'Brazil', 'brasil': 'Brazil',
  'argentinien': 'Argentina', 'argentine': 'Argentina',
  'chile': 'Chile', 'chili': 'Chile',
  'kolumbien': 'Colombia', 'colombie': 'Colombia',
  
  // Oceania
  'australien': 'Australia', 'australie': 'Australia',
  'neuseeland': 'New Zealand', 'nouvelle-zélande': 'New Zealand', 'new zealand': 'New Zealand',
  
  // Africa
  'südafrika': 'South Africa', 'afrique du sud': 'South Africa',
  'ägypten': 'Egypt', 'égypte': 'Egypt',
  'marokko': 'Morocco', 'maroc': 'Morocco',
};

function normalizeCountryName(country: string): string {
  if (!country) return '';
  const normalized = country.toLowerCase().trim();
  return countryNormalizationMap[normalized] || country;
}

// Input validation schema
const ValidationRequestSchema = z.object({
  supplierId: z.string().min(1).max(100),
  supplierName: z.string().min(1).max(200),
  supplierWebsite: z.string().url().max(500),
  currentTechnologies: z.array(z.string().max(100)).max(50).default([]),
  currentMaterials: z.array(z.string().max(100)).max(50).default([]),
  currentLocation: z.string().max(500).default('')
});

interface SupplierValidationRequest {
  supplierId: string;
  supplierName: string;
  supplierWebsite: string;
  currentTechnologies: string[];
  currentMaterials: string[];
  currentLocation: string;
}

// ROBUST VALIDATION CONSTANTS - Optimized for reliability
const FETCH_TIMEOUT_MS = 10000; // 10 seconds for basic fetch (increased from 8)
const FIRECRAWL_TIMEOUT_MS = 20000; // 20 seconds for Firecrawl (increased from 15)
const MAX_PAGES_TO_SCRAPE = 6; // Increased to 6 for better contact/imprint coverage
const MAX_TOTAL_SCRAPE_TIME_MS = 90000; // 90 seconds total max (increased for retries)
const MAX_RETRIES = 2; // Retry failed requests up to 2 times
const RETRY_DELAY_MS = 1000; // Wait 1 second between retries

// Enhanced fetch with anti-bot techniques - rotating user agents
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
];

// Track Firecrawl credit status - skip if credits exhausted
let firecrawlCreditsExhausted = false;

// Helper: delay function for retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper: check if error is retryable
function isRetryableError(error: string): boolean {
  const retryablePatterns = [
    'timeout', 'abort', 'econnreset', 'enotfound', 'econnrefused',
    'socket hang up', 'network', 'etimedout', 'epipe', 'rate limit',
    '429', '503', '502', '504', 'gateway', 'temporary'
  ];
  const lowerError = error.toLowerCase();
  return retryablePatterns.some(pattern => lowerError.includes(pattern));
}

// Helper: validate that logo URL comes from the supplier's own domain (or allowed CDNs)
function validateLogoUrl(logoUrl: string, websiteUrl: string): boolean {
  if (!logoUrl || !websiteUrl) return false;
  
  try {
    const logoDomain = new URL(logoUrl).hostname.replace(/^www\./, '').toLowerCase();
    const websiteDomain = new URL(websiteUrl).hostname.replace(/^www\./, '').toLowerCase();
    
    // Exact domain match or subdomain of supplier
    if (logoDomain === websiteDomain || logoDomain.endsWith('.' + websiteDomain)) {
      return true;
    }
    
    // IMPROVED: Extract base domain name (without TLD) for flexible matching
    // This allows additive-tectonics.com to match additive-tectonics.de
    const extractBaseDomain = (domain: string): string => {
      const parts = domain.split('.');
      // Handle subdomains: manufacturing.materialise.com -> materialise
      // Handle simple: additive-tectonics.de -> additive-tectonics
      if (parts.length >= 2) {
        // Get the second-to-last part (main domain name)
        return parts[parts.length - 2];
      }
      return parts[0];
    };
    
    const logoBase = extractBaseDomain(logoDomain);
    const websiteBase = extractBaseDomain(websiteDomain);
    
    // Allow if base domain names match (covers different TLDs: .com, .de, .nl, etc.)
    if (logoBase === websiteBase && logoBase.length >= 3) {
      console.log(`✅ Logo domain match via base name: ${logoBase}`);
      return true;
    }
    
    // Also allow if logo domain contains the website base name (subdomain variations)
    // e.g., logo from 'cdn.materialise.com' for website 'manufacturing.materialise.com'
    if (logoDomain.includes(websiteBase) && websiteBase.length >= 4) {
      console.log(`✅ Logo domain match via base inclusion: ${websiteBase} in ${logoDomain}`);
      return true;
    }
    
    // Allow common CDNs that companies legitimately use for hosting (expanded list for SPA & subdomain CDNs)
    const allowedCdns = [
      // Cloud storage & CDNs (major providers)
      'cloudfront.net', 'amazonaws.com', 's3.amazonaws.com', 's3-eu-west-1.amazonaws.com',
      's3-us-west-2.amazonaws.com', 's3-ap-northeast-1.amazonaws.com',
      'storage.googleapis.com', 'storage.cloud.google.com', 'lh3.googleusercontent.com',
      'cdn.jsdelivr.net', 'cdnjs.cloudflare.com', 'cdn.cloudflare.com',
      'cdn.shopify.com', 'shopify.com', 'shopifycdn.com',
      
      // Website builders & SPA platforms
      'squarespace-cdn.com', 'squarespace.com', 'static1.squarespace.com',
      'wixstatic.com', 'wix.com', 'static.wixstatic.com', 'media.wix.com',
      'webflow.com', 'webflow-prod.com', 'assets-global.website-files.com', 
      'uploads-ssl.webflow.com', 'assets.website-files.com',
      'framerusercontent.com', 'framer.website', // Framer sites
      'cargo.site', 'cargocollective.com', // Cargo sites
      
      // CMS platforms
      'wp.com', 'wordpress.com', 'i0.wp.com', 'i1.wp.com', 'i2.wp.com', 'i3.wp.com',
      's.w.org', 'ps.w.org', // WordPress plugin/theme assets
      'sanity.io', 'cdn.sanity.io', 
      'ctfassets.net', 'contentful.com', 'images.ctfassets.net',
      'prismic.io', 'images.prismic.io',
      'storyblok.com', 'a.storyblok.com', 'img2.storyblok.com',
      'imgix.net', 'cloudinary.com', 'res.cloudinary.com',
      'datocms-assets.com', 'dato-cms.imgix.net', // DatoCMS
      'media.graphassets.com', 'media.graphcms.com', // GraphCMS/Hygraph
      'cdn.buttercms.com', // ButterCMS
      'images.unsplash.com', // Unsplash hosted brand images (if logo in name)
      
      // Marketing & CRM platforms
      'hubspot.com', 'hubspotusercontent.com', 'hubspot.net', 'hs-sites.com',
      'f.hubspotusercontent00.net', 'f.hubspotusercontent10.net', 'f.hubspotusercontent20.net',
      'f.hubspotusercontent30.net', 'f.hubspotusercontent40.net',
      'pardot.com', 'pi.pardot.com',
      'mailchimp.com', 'mcusercontent.com', 'cdn-images.mailchimp.com',
      'klaviyo.com', 'klaviyocdn.com',
      'intercomcdn.com', 'static.intercomassets.com', // Intercom
      
      // Hosting & deployment platforms
      'netlify.app', 'netlify.com', 'd33wubrfki0l68.cloudfront.net', // Netlify CDN
      'vercel.app', 'vercel.com', 'vercel-storage.com',
      'github.io', 'githubusercontent.com', 'raw.githubusercontent.com',
      'githubassets.com', 'avatars.githubusercontent.com',
      'godaddy.com', 'secureserver.net', 'x.godaddy.com',
      'pages.dev', // Cloudflare Pages
      'railway.app', 'render.com', // Railway & Render
      'fly.dev', 'fly.io', // Fly.io
      'deno.land', 'deno.com', // Deno
      
      // Adobe & Enterprise CDNs
      'adobecqms.net', 'scene7.com', 'aem.live', 'aem.page', 'hlx.live', 'hlx.page',
      'akamaized.net', 'akamai.net', 'akstat.io',
      'licdn.com', 'media.licdn.com', // LinkedIn CDN
      'fbcdn.net', 'facebook.com', // Facebook/Meta CDN
      
      // E-commerce platforms
      'bigcommerce.com', 'cdn.bigcommerce.com',
      'vtexassets.com', 'vteximg.com.br', // VTEX
      'commercetools.com', // Commercetools
      'salsify.com', 'images.salsify.com', // Salsify PIM
      
      // Industrial/B2B specific
      'thomasnet.com', // ThomasNet
      'directindustry.com', // DirectIndustry
      'europages.com', // Europages
      
      // Image optimization services
      'imgix.net', 'images.imgix.net',
      'imagekit.io', 'ik.imagekit.io',
      'sirv.com', 
      'uploadcare.com', 'ucarecdn.com',
      'twicpics.com',
      'cloudimage.io',
      
      // Other common CDNs
      'gravatar.com', 'secure.gravatar.com',
      'googleapis.com', 'gstatic.com', 'ggpht.com',
      'twimg.com', 'pbs.twimg.com', // Twitter
      'fastly.net', 'fastlylb.net',
      'b-cdn.net', 'bunny.net', 'bunnycdn.com',
      'keycdn.com', 'kxcdn.com',
      'stackpathcdn.com', 'stackpathdns.com',
      'azureedge.net', 'azure.com', 'blob.core.windows.net', // Azure
      'digitaloceanspaces.com', // DigitalOcean Spaces
      'linode.com', 'linodeobjects.com', // Linode
      'backblazeb2.com', 'f000.backblazeb2.com', // Backblaze B2
      
      // Font & icon CDNs (sometimes have logos)
      'use.typekit.net', 'use.fontawesome.com',
      'fonts.gstatic.com', 'fonts.googleapis.com',
    ];
    
    if (allowedCdns.some(cdn => logoDomain.includes(cdn))) {
      return true;
    }
    
    // Reject logos from completely different domains
    console.log(`⚠️ Logo rejected: domain ${logoDomain} doesn't match supplier ${websiteDomain}`);
    return false;
  } catch (e) {
    console.log(`⚠️ Logo URL validation failed: ${e}`);
    return false;
  }
}

// Basic fetch with anti-bot techniques and retry logic
async function basicFetch(url: string, retryCount = 0): Promise<{ html: string; visibleText: string; success: boolean; error?: string; method: 'basicFetch'; retries: number }> {
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  
  // Rotate referer for each attempt
  const referers = [
    'https://www.google.com/',
    'https://www.bing.com/',
    'https://duckduckgo.com/',
    '',
  ];
  const referer = referers[retryCount % referers.length];
  
  const headers: HeadersInit = {
    'User-Agent': userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,da;q=0.8,de;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': referer ? 'cross-site' : 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  };
  
  if (referer) {
    headers['Referer'] = referer;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, {
      method: 'GET',
      headers,
      redirect: 'follow',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorMsg = `HTTP ${response.status}`;
      
      // Retry on specific HTTP errors
      if (isRetryableError(errorMsg) && retryCount < MAX_RETRIES) {
        console.log(`🔄 BasicFetch retry ${retryCount + 1}/${MAX_RETRIES} for ${url} (${errorMsg})`);
        await delay(RETRY_DELAY_MS * (retryCount + 1)); // Exponential backoff
        return basicFetch(url, retryCount + 1);
      }
      
      return { html: '', visibleText: '', success: false, error: errorMsg, method: 'basicFetch', retries: retryCount };
    }

    const html = await response.text();
    
    // Check for JavaScript-heavy page indicators (minimal content)
    const isJsHeavy = html.length < 5000 && (
      html.includes('__NEXT_DATA__') ||
      html.includes('window.__INITIAL_STATE__') ||
      html.includes('id="app"') && !html.includes('<main') ||
      html.includes('Loading...') ||
      html.includes('Please enable JavaScript')
    );
    
    if (isJsHeavy && retryCount < MAX_RETRIES) {
      console.log(`⚠️ JS-heavy page detected for ${url}, retrying...`);
      await delay(RETRY_DELAY_MS * 2); // Extra delay for JS pages
      return basicFetch(url, retryCount + 1);
    }
    
    // Extract visible text from HTML
    let visibleText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#\d+;/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    console.log(`✅ BasicFetch success for ${url}: ${html.length} chars HTML, ${visibleText.length} chars text${retryCount > 0 ? ` (after ${retryCount} retries)` : ''}`);
    return { html, visibleText, success: true, method: 'basicFetch', retries: retryCount };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // Retry on network errors
    if (isRetryableError(errorMsg) && retryCount < MAX_RETRIES) {
      console.log(`🔄 BasicFetch retry ${retryCount + 1}/${MAX_RETRIES} for ${url} (${errorMsg})`);
      await delay(RETRY_DELAY_MS * (retryCount + 1));
      return basicFetch(url, retryCount + 1);
    }
    
    if (errorMsg.includes('abort')) {
      return { html: '', visibleText: '', success: false, error: `Timeout (${FETCH_TIMEOUT_MS/1000}s)`, method: 'basicFetch', retries: retryCount };
    }
    return { html: '', visibleText: '', success: false, error: errorMsg, method: 'basicFetch', retries: retryCount };
  }
}

// Firecrawl scraping with timeout and retry logic - for JavaScript-heavy sites
async function firecrawlScrape(url: string, retryCount = 0): Promise<{ html: string; visibleText: string; success: boolean; error?: string; method: 'firecrawl'; retries: number }> {
  const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
  if (!FIRECRAWL_API_KEY) {
    return { html: '', visibleText: '', success: false, error: 'Firecrawl API key not configured', method: 'firecrawl', retries: 0 };
  }

  try {
    console.log(`🔥 Using Firecrawl for ${url} (${FIRECRAWL_TIMEOUT_MS/1000}s timeout)${retryCount > 0 ? ` [retry ${retryCount}]` : ''}...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FIRECRAWL_TIMEOUT_MS);
    
    // Adjust waitFor based on retry count (longer wait for retries)
    const waitFor = 2000 + (retryCount * 1000);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor,
        timeout: FIRECRAWL_TIMEOUT_MS,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      const errorMsg = data.error || `HTTP ${response.status}`;
      console.error(`❌ Firecrawl error:`, errorMsg);
      
      // Check for credit exhaustion
      if (errorMsg.toLowerCase().includes('insufficient credits') || errorMsg.toLowerCase().includes('credit')) {
        console.warn(`⚠️ Firecrawl credits exhausted - switching to basicFetch only`);
        firecrawlCreditsExhausted = true;
        return { html: '', visibleText: '', success: false, error: errorMsg, method: 'firecrawl', retries: retryCount };
      }
      
      // Retry on rate limits or temporary errors
      if (isRetryableError(errorMsg) && retryCount < MAX_RETRIES) {
        console.log(`🔄 Firecrawl retry ${retryCount + 1}/${MAX_RETRIES} for ${url}`);
        await delay(RETRY_DELAY_MS * (retryCount + 1) * 2); // Longer backoff for API
        return firecrawlScrape(url, retryCount + 1);
      }
      
      return { html: '', visibleText: '', success: false, error: errorMsg, method: 'firecrawl', retries: retryCount };
    }

    const html = data.data?.html || '';
    const markdown = data.data?.markdown || '';
    
    // Check if content is too minimal (JS-heavy page that didn't render)
    if (html.length < 500 && markdown.length < 200 && retryCount < MAX_RETRIES) {
      console.log(`⚠️ Firecrawl returned minimal content for ${url}, retrying with longer wait...`);
      await delay(RETRY_DELAY_MS * 2);
      return firecrawlScrape(url, retryCount + 1);
    }
    
    console.log(`✅ Firecrawl success: ${html.length} chars HTML, ${markdown.length} chars markdown${retryCount > 0 ? ` (after ${retryCount} retries)` : ''}`);
    
    return { 
      html, 
      visibleText: markdown, 
      success: true,
      method: 'firecrawl',
      retries: retryCount
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // Retry on network errors
    if (isRetryableError(errorMsg) && retryCount < MAX_RETRIES) {
      console.log(`🔄 Firecrawl retry ${retryCount + 1}/${MAX_RETRIES} for ${url} (${errorMsg})`);
      await delay(RETRY_DELAY_MS * (retryCount + 1));
      return firecrawlScrape(url, retryCount + 1);
    }
    
    if (errorMsg.includes('abort')) {
      console.error(`⏱️ Firecrawl timeout (${FIRECRAWL_TIMEOUT_MS/1000}s) for ${url}`);
      return { html: '', visibleText: '', success: false, error: `Timeout (${FIRECRAWL_TIMEOUT_MS/1000}s)`, method: 'firecrawl', retries: retryCount };
    }
    
    console.error(`❌ Firecrawl exception:`, errorMsg);
    return { html: '', visibleText: '', success: false, error: errorMsg, method: 'firecrawl', retries: retryCount };
  }
}

// HYBRID SCRAPING: Try Firecrawl first (with retries), fallback to basicFetch (with retries)
async function scrapePage(url: string): Promise<{ html: string; visibleText: string; success: boolean; error?: string; method: 'firecrawl' | 'basicFetch' | 'none'; retries: number }> {
  let totalRetries = 0;
  
  // Skip Firecrawl if credits are exhausted
  if (!firecrawlCreditsExhausted) {
    const firecrawlResult = await firecrawlScrape(url);
    totalRetries += firecrawlResult.retries;
    
    if (firecrawlResult.success && firecrawlResult.html.length > 100) {
      return { ...firecrawlResult, retries: totalRetries };
    }
    
    console.log(`↪️ Firecrawl failed for ${url}, trying basicFetch fallback...`);
  } else {
    console.log(`⏭️ Skipping Firecrawl (credits exhausted), using basicFetch for ${url}`);
  }
  
  // Fallback to basicFetch with retries
  const basicResult = await basicFetch(url);
  totalRetries += basicResult.retries;
  
  if (basicResult.success && basicResult.html.length > 100) {
    return { ...basicResult, retries: totalRetries };
  }
  
  // Both methods failed
  return { 
    html: '', 
    visibleText: '', 
    success: false, 
    error: `Both methods failed: ${basicResult.error}`,
    method: 'none',
    retries: totalRetries
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const validationStartTime = Date.now();
  let supplierId = '';
  let supplierName = '';
  let supplierWebsite = '';
  let currentTechnologies: string[] = [];
  let currentMaterials: string[] = [];
  let currentLocation = '';

  try {
    // Admin authorization check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized', code: 'AUTH_REQUIRED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const isServiceRole = token === serviceRoleKey;
    
    if (!isServiceRole) {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid token format', code: 'INVALID_TOKEN' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let userId: string;
      try {
        const payload = JSON.parse(atob(parts[1]));
        userId = payload.sub;
        if (!userId) {
          throw new Error('No user ID in token');
        }
      } catch (error) {
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid token', code: 'INVALID_TOKEN' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        serviceRoleKey
      );

      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin');

      if (!roles || roles.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Forbidden: Admin access required', code: 'INSUFFICIENT_PERMISSIONS' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validate and parse input
    const rawData = await req.json();
    const validationResult = ValidationRequestSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid input data', 
          code: 'VALIDATION_ERROR',
          details: validationResult.error.issues
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    supplierId = validationResult.data.supplierId;
    supplierName = validationResult.data.supplierName;
    supplierWebsite = validationResult.data.supplierWebsite;
    currentTechnologies = validationResult.data.currentTechnologies;
    currentMaterials = validationResult.data.currentMaterials;
    currentLocation = validationResult.data.currentLocation;

    console.log(`🔍 Starting validation for ${supplierName} (${supplierWebsite})`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const baseUrl = new URL(supplierWebsite);
    
    console.log(`🌐 Starting smart page discovery for ${supplierName}...`);
    
    const scrapedPagesData: { url: string; label: string; html: string; visibleText: string; cacheHit: boolean; success: boolean }[] = [];
    const scrapingErrors: { page: string; error: string }[] = [];
    const scrapeStartTime = Date.now();
    
    // Track scraping stats - HYBRID approach
    let pagesScraped = 0;
    let homepageSuccess = false;
    let firecrawlPagesCount = 0;
    let basicFetchPagesCount = 0;
    let cacheHitPagesCount = 0;
    
    // Reset credit exhaustion flag at start of each validation
    firecrawlCreditsExhausted = false;
    
    // STEP 1: Scrape homepage first (required for smart discovery)
    const homepageCacheKey = `${supplierId}:${supplierWebsite}`;
    let homepageHtml = '';
    let homepageVisibleText = '';
    
    const { data: homepageCached } = await supabase
      .from('scrape_cache')
      .select('html, visible_text, created_at')
      .eq('key', homepageCacheKey)
      .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString())
      .single();
    
    if (homepageCached && homepageCached.html) {
      console.log(`💾 Cache hit for homepage`);
      homepageHtml = homepageCached.html;
      homepageVisibleText = homepageCached.visible_text || '';
      scrapedPagesData.push({
        url: supplierWebsite,
        label: 'homepage',
        html: homepageHtml,
        visibleText: homepageVisibleText,
        cacheHit: true,
        success: true
      });
      pagesScraped++;
      cacheHitPagesCount++;
      homepageSuccess = true;
    } else {
      const homepageResult = await scrapePage(supplierWebsite);
      if (homepageResult.success && homepageResult.html.length > 100) {
        homepageHtml = homepageResult.html;
        homepageVisibleText = homepageResult.visibleText;
        
        if (homepageResult.method === 'firecrawl') {
          firecrawlPagesCount++;
          console.log(`🔥 homepage scraped via Firecrawl`);
        } else {
          basicFetchPagesCount++;
          console.log(`📥 homepage scraped via basicFetch`);
        }
        
        await supabase.from('scrape_cache').upsert({
          key: homepageCacheKey,
          html: homepageHtml,
          visible_text: homepageVisibleText
        });
        
        scrapedPagesData.push({
          url: supplierWebsite,
          label: 'homepage',
          html: homepageHtml,
          visibleText: homepageVisibleText,
          cacheHit: false,
          success: true
        });
        pagesScraped++;
        homepageSuccess = true;
      } else {
        console.error(`🛑 Homepage failed - aborting validation`);
        scrapingErrors.push({ page: 'homepage', error: homepageResult.error || 'Unknown error' });
      }
    }
    
    // STEP 2: Smart page discovery - parse links from homepage
    let pagesToScrape: { url: string; label: string; priority: number }[] = [];
    
    if (homepageSuccess && homepageHtml) {
      // Keywords that indicate relevant pages for 3D printing suppliers (multi-language)
      // OPTIMIZED: Contact and Imprint pages prioritized higher for address extraction
      const relevantKeywords = [
        // HIGHEST PRIORITY for address extraction
        { keywords: ['contact', 'kontakt', 'contacto', 'kontakta', 'location', 'standort', 'find-us', 'reach-us', 'locations'], label: 'contact', priority: 2 },
        { keywords: ['imprint', 'impressum', 'legal-notice', 'mentions-legales', 'aviso-legal', 'rechtliche', 'datenschutz'], label: 'imprint', priority: 3 },
        
        // About/Company info
        { keywords: ['about', 'über', 'om-os', 'chi-siamo', 'qui-sommes', 'acerca', 'company', 'unternehmen', 'team', 'history'], label: 'about', priority: 4 },
        
        // Services & Capabilities
        { keywords: ['service', 'dienst', 'leistung', 'capability', 'capabilities', 'what-we-do', 'our-work', 'angebot'], label: 'services', priority: 5 },
        
        // Materials (important for data extraction)
        { keywords: ['material', 'werkstoffe', 'materiaux', 'filament', 'powder', 'resin', 'metal', 'polymer', 'plastic'], label: 'materials', priority: 6 },
        
        // Technology & Processes
        { keywords: ['technolog', 'process', 'verfahren', 'printing', '3d-print', 'additive', 'manufacturing', 'fertigung', 'method'], label: 'technology', priority: 7 },
        
        // Applications & Industries
        { keywords: ['application', 'anwendung', 'use-case', 'case-stud', 'projekt', 'portfolio', 'gallery', 'showcase'], label: 'applications', priority: 8 },
        { keywords: ['industr', 'branche', 'sector', 'aerospace', 'automotive', 'medical', 'dental', 'healthcare'], label: 'industries', priority: 9 },
        
        // Products & Solutions
        { keywords: ['product', 'produkt', 'solution', 'lösung', 'offering'], label: 'products', priority: 10 },
        
        // Equipment & Machines
        { keywords: ['equipment', 'machine', 'printer', 'system', 'hardware', 'fleet', 'capacity'], label: 'equipment', priority: 11 },
        
        // Certifications & Quality
        { keywords: ['certif', 'quality', 'qualität', 'iso', 'as9100', 'nadcap', 'standard'], label: 'certifications', priority: 12 },
      ];
      
      // Extract all internal links from homepage HTML
      const linkRegex = /<a[^>]+href=["']([^"'#]+)["'][^>]*>([^<]*)</gi;
      const foundLinks: { url: string; text: string }[] = [];
      let match;
      
      while ((match = linkRegex.exec(homepageHtml)) !== null) {
        let href = match[1];
        const linkText = match[2].toLowerCase().trim();
        
        // Skip external links, anchors, and common non-content pages
        if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
        if (href.includes('login') || href.includes('cart') || href.includes('checkout')) continue;
        if (href.includes('privacy') || href.includes('terms') || href.includes('cookie')) continue;
        
        // Convert relative URLs to absolute
        try {
          if (href.startsWith('/')) {
            href = `${baseUrl.origin}${href}`;
          } else if (!href.startsWith('http')) {
            href = new URL(href, baseUrl.origin).href;
          }
          
          // Only include links from the same domain
          const linkUrl = new URL(href);
          if (linkUrl.origin === baseUrl.origin) {
            foundLinks.push({ url: href, text: linkText });
          }
        } catch {
          // Invalid URL, skip
        }
      }
      
      console.log(`🔗 Found ${foundLinks.length} internal links on homepage`);
      
      // Match links to relevant categories
      const seenUrls = new Set<string>([supplierWebsite]);
      
      for (const category of relevantKeywords) {
        for (const link of foundLinks) {
          if (seenUrls.has(link.url)) continue;
          
          const urlLower = link.url.toLowerCase();
          const textLower = link.text.toLowerCase();
          
          const isMatch = category.keywords.some(keyword => 
            urlLower.includes(keyword) || textLower.includes(keyword)
          );
          
          if (isMatch) {
            pagesToScrape.push({
              url: link.url,
              label: category.label,
              priority: category.priority
            });
            seenUrls.add(link.url);
            break; // Only one link per category
          }
        }
      }
      
      // Sort by priority
      pagesToScrape.sort((a, b) => a.priority - b.priority);
      
      console.log(`🎯 Smart discovery found ${pagesToScrape.length} relevant pages: ${pagesToScrape.map(p => p.label).join(', ')}`);
    }
    
    // Fallback: if smart discovery found no pages, use static list
    if (pagesToScrape.length === 0) {
      console.log(`⚠️ Smart discovery found no links, using fallback static paths`);
      pagesToScrape = [
        { url: `${baseUrl.origin}/about`, label: 'about', priority: 2 },
        { url: `${baseUrl.origin}/services`, label: 'services', priority: 3 },
        { url: `${baseUrl.origin}/contact`, label: 'contact', priority: 4 },
      ];
    }
    
    // STEP 3: Scrape discovered pages (limit to MAX_PAGES_TO_SCRAPE - 1 since homepage already scraped)
    
    for (const page of pagesToScrape) {
      // Check total time limit
      if (Date.now() - scrapeStartTime > MAX_TOTAL_SCRAPE_TIME_MS) {
        console.warn(`⏱️ Total scrape time limit reached (${MAX_TOTAL_SCRAPE_TIME_MS/1000}s), stopping`);
        break;
      }
      
      if (pagesScraped >= MAX_PAGES_TO_SCRAPE) break;
      
      // Check cache first (saves Firecrawl credits)
      const cacheKey = `${supplierId}:${page.url}`;
      const { data: cached } = await supabase
        .from('scrape_cache')
        .select('html, visible_text, created_at')
        .eq('key', cacheKey)
        .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString())
        .single();

      if (cached && cached.html) {
        console.log(`💾 Cache hit for ${page.label} (saves Firecrawl credits)`);
        scrapedPagesData.push({
          url: page.url,
          label: page.label,
          html: cached.html,
          visibleText: cached.visible_text || '',
          cacheHit: true,
          success: true
        });
        pagesScraped++;
        cacheHitPagesCount++;
        if (page.label === 'homepage') homepageSuccess = true;
        continue;
      }

      // Use HYBRID scraping: Firecrawl first, then basicFetch fallback
      const result = await scrapePage(page.url);

      if (result.success && result.html.length > 100) {
        // Track which method succeeded
        if (result.method === 'firecrawl') {
          firecrawlPagesCount++;
          console.log(`🔥 ${page.label} scraped via Firecrawl`);
        } else if (result.method === 'basicFetch') {
          basicFetchPagesCount++;
          console.log(`📥 ${page.label} scraped via basicFetch (fallback)`);
        }
        
        // Cache the result to save credits on future validations
        await supabase.from('scrape_cache').upsert({
          key: cacheKey,
          html: result.html,
          visible_text: result.visibleText
        });

        scrapedPagesData.push({
          url: page.url,
          label: page.label,
          html: result.html,
          visibleText: result.visibleText,
          cacheHit: false,
          success: true
        });
        pagesScraped++;
        if (page.label === 'homepage') homepageSuccess = true;
      } else {
        console.error(`❌ All scraping methods failed for ${page.label}: ${result.error || 'Unknown error'}`);
        scrapingErrors.push({ page: page.label, error: result.error || 'Unknown error' });
        
        // EARLY EXIT: If homepage fails with BOTH methods, stop trying other pages
        if (page.label === 'homepage') {
          console.error(`🛑 Homepage failed to load (both Firecrawl + basicFetch) - aborting validation early`);
          break;
        }
      }
      
      // Small delay between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log(`📊 Scraping complete: ${pagesScraped} pages (${firecrawlPagesCount} Firecrawl, ${basicFetchPagesCount} basicFetch, ${cacheHitPagesCount} cache)`);
    const scrapingMethod = cacheHitPagesCount === pagesScraped ? 'cache' : 
                          firecrawlPagesCount > basicFetchPagesCount ? 'hybrid-firecrawl' : 'hybrid-basicfetch';

    console.log(`📊 Scraped ${scrapedPagesData.length} pages in ${(Date.now() - scrapeStartTime)/1000}s, ${scrapingErrors.length} errors`);

    if (scrapedPagesData.length === 0) {
      console.error('❌ WARNING: Failed to scrape ANY pages from the website');
      
      // Store failed validation result
      await supabase.from('validation_results').insert({
        supplier_id: supplierId,
        supplier_name: supplierName,
        supplier_website: supplierWebsite,
        technologies_current: currentTechnologies,
        technologies_scraped: [],
        technologies_match: false,
        technologies_confidence: 0,
        materials_current: currentMaterials,
        materials_scraped: [],
        materials_match: false,
        materials_confidence: 0,
        location_current: currentLocation,
        location_scraped: 'Unknown',
        location_match: false,
        location_confidence: 0,
        overall_confidence: 0,
        puppeteer_success: false,
        scraping_time_ms: Date.now() - validationStartTime,
        cache_hit: false,
        pages_scraped: 0,
        scraping_errors: scrapingErrors,
        scraped_content: {
          error: 'Failed to scrape any pages',
          errors: scrapingErrors,
          homepage_failed: !homepageSuccess
        }
      });
      
      // Return ERROR response when scraping fails - this ensures validation_failures is incremented
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to scrape website',
        code: 'SCRAPING_FAILED',
        errors: scrapingErrors.map(e => `${e.page}: ${e.error}`),
        supplier: supplierName,
        timing: {
          scrapingMs: Date.now() - validationStartTime,
          aiAnalysisMs: 0,
          totalMs: Date.now() - validationStartTime
        }
      }), {
        status: 422, // Unprocessable Entity - validation could not be performed
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Prepare combined content for AI (prioritize visible text)
    let combinedVisibleText = '';
    let combinedHtml = '';
    
    for (const page of scrapedPagesData) {
      combinedVisibleText += `\n\n=== ${page.label.toUpperCase()} ===\n${page.visibleText}`;
      combinedHtml += `\n\n=== ${page.label.toUpperCase()} HTML ===\n${page.html}`;
    }

    // Limit content size
    const visibleTextContent = combinedVisibleText.substring(0, 50000);
    const htmlContent = combinedHtml.substring(0, 100000);
    
    console.log(`✅ Content ready: ${visibleTextContent.length} chars text, ${htmlContent.length} chars HTML`);

    // AI Analysis - Enhanced prompt with strict material/technology lists + lead time extraction
    const systemPrompt = `You are an expert data extraction assistant specializing in analyzing 3D printing and additive manufacturing supplier websites.

Extract comprehensive, accurate information and return ONLY valid JSON (no markdown):

{
  "technologies": ["technology1", "technology2"],
  "materials": ["material1", "material2"],
  "certifications": ["ISO 9001", "AS9100D"],
  "location": {
    "city": "City Name",
    "state": "State/Region (if applicable)",
    "country": "Country Name"
  },
  "description": "Comprehensive 3-4 sentence company description (~300 chars) covering history, mission, and core manufacturing strengths",
  "description_extended": {
    "overview": "Same as description - comprehensive 3-4 sentence overview",
    "unique_value": "What makes this supplier DIFFERENT - proprietary tech, patents, specific niche specialties",
    "industries_served": ["Aerospace", "Medical Devices", "Automotive", "Consumer Electronics"],
    "certifications": ["ISO 9001", "AS9100D", "NADCAP", "ISO 13485"],
    "capacity_notes": "Production scale - machine count, facility size, annual output"
  },
  "logo_url": "full URL to company logo",
  "lead_time": {
    "typical": "3-5 business days",
    "rush_service": true,
    "instant_quote": true
  },
  "confidence": {
    "technologies": 85,
    "materials": 90,
    "location": 95,
    "description": 85,
    "logo": 80,
    "lead_time": 75
  }
}

=== VALID TECHNOLOGIES (use ONLY these exact values) ===
fdm, sla, sls, mjf, dmls, slm, material-jetting, binder-jetting, dlp, saf, dmp, cdlp, ebm, lpbf, polyjet, clip, waam, cold-spray, lens, dmd

Technology Synonyms (map these to the valid keys above):
- "FFF" or "Fused Filament Fabrication" or "Fused Deposition Modeling" -> fdm
- "Stereolithography" -> sla
- "Selective Laser Sintering" or "Laser Sintering" -> sls
- "Multi Jet Fusion" or "HP MJF" -> mjf
- "Direct Metal Laser Sintering" -> dmls
- "Selective Laser Melting" or "Laser Powder Bed Fusion" -> slm
- "Electron Beam Melting" -> ebm
- "Digital Light Processing" -> dlp
- "PolyJet" or "Multi-material jetting" -> polyjet
- "Wire Arc Additive Manufacturing" -> waam

=== VALID MATERIALS (use ONLY these exact values) ===

METALS:
- titanium, titanium-ti-6al-4v, titanium-grade-2, titanium-grade-5
- aluminum, aluminum-alsi10mg, aluminum-alsi7mg, aluminum-6061, aluminum-7075, scalmalloy
- stainless-steel, stainless-steel-316l, stainless-steel-17-4ph, stainless-steel-304, stainless-steel-15-5ph
- tool-steel, tool-steel-h13, tool-steel-m2
- maraging-steel, maraging-steel-ms1
- inconel, inconel-625, inconel-718, ni625, hastelloy-x
- cobalt-chrome, cocr, cobalt-chrome-f75
- copper, bronze, brass, gold-plated-brass
- steel, tungsten, molybdenum, tantalum

POLYMERS:
- pla, abs, petg, hips, asa
- nylon, nylon-pa-12, pa-12, pa-11, nylon-6, nylon-66
- nylon-12-glass-filled, nylon-12-carbon-filled, pa-cf, pa-gf
- pc, polycarbonate, pc-abs
- tpu, elastomer, flexible
- pp, polypropylene
- peek, pekk, pei, ultem-9085, ultem-1010, pps, ppsu

RESINS:
- resin, standard-resin, clear-resin, tough-resin, durable-resin
- flexible-resin, high-temp-resin, dental-resin, castable-resin
- biocompatible-resin, medical-resin

COMPOSITES:
- carbon-fiber, carbon-fiber-nylon, continuous-carbon-fiber
- glass-fiber, glass-filled-nylon
- kevlar, aramid

CERAMICS:
- ceramic, alumina, zirconia, silicon-carbide

Material Synonyms (map these to valid keys):
- "Ti-6Al-4V" or "Ti64" or "Grade 5 Titanium" -> titanium-ti-6al-4v
- "AlSi10Mg" -> aluminum-alsi10mg
- "316L" or "SS316L" -> stainless-steel-316l
- "17-4PH" or "17-4 PH" -> stainless-steel-17-4ph
- "IN718" or "Alloy 718" -> inconel-718
- "IN625" or "Alloy 625" -> inconel-625
- "PA12" or "PA 12" or "Polyamide 12" -> pa-12
- "PA11" or "PA 11" -> pa-11
- "Nylon 12" -> nylon-pa-12
- "CoCr" or "Cobalt Chromium" -> cobalt-chrome
- "ULTEM" or "PEI" -> pei
- "Carbon Fiber Reinforced" or "CFRP" -> carbon-fiber

CRITICAL INSTRUCTIONS:
1. PRIORITIZE visible text content - it's cleaner and more accurate
2. Use HTML only for verification and structured data
3. Focus on ACTUAL capabilities, not marketing fluff
4. BE SPECIFIC: If they mention "titanium printing", use "titanium" (or specific alloy if mentioned)
5. BE COMPREHENSIVE: Extract ALL materials and technologies mentioned, not just the main ones
6. Map synonyms and variations to the canonical keys listed above
7. Logo: CRITICAL REQUIREMENTS FOR ACCURATE LOGO DETECTION:
   - MUST be the actual company logo, NOT article/blog/product images
   - MUST be from the header, navbar, or footer section of the page
   - MUST NOT be og:image unless the URL explicitly contains "logo" in the path
   - MUST NOT be certification badges (ISO, AS9100, NADCAP), partner logos, or awards
   - MUST NOT be product photos, hero images, or banners
   - PREFER SVG or PNG format over JPG (logos are usually vector/transparent)
   - Look for: site-logo, header-logo, brand, company-logo, navbar-brand classes
   - If the logo URL contains words like 'article', 'blog', 'post', 'news', 'og-image', 'social' - REJECT it
   - If unsure, return empty string - it's better to have no logo than a wrong one
   - Confidence for logo should be 80+ only if you're certain it's the actual company logo
8. Confidence: 90-100 = explicit mention, 75-89 = clearly implied, 60-74 = possibly implied, <60 = uncertain
9. Location: Search CONTACT, ABOUT, IMPRINT/IMPRESSUM, and FOOTER sections for physical address
   - Look for street address, city, postal code, state/region, and country
   - Common German patterns: "Impressum", "Kontakt", street addresses ending in "straße/strasse"
   - Return country in ENGLISH (e.g., "Germany" not "Deutschland", "Denmark" not "Danmark")
   - Include full structured address when available
10. Description & Extended Description - GENERATE COMPREHENSIVE, SPECIFIC CONTENT:
    - "description": Main overview, 3-4 detailed sentences about company history, founding, and core strengths (~300 chars)
    - "description_extended.overview": Same as description, for structured access
    - "description_extended.unique_value": What makes this supplier DIFFERENT - proprietary tech, patents, specific niche (e.g., "Only provider in Europe with 1-meter build volume DMLS", "Pioneered automated quoting for metal AM")
    - "description_extended.industries_served": List SPECIFIC industries found (NOT generic "various industries") - e.g., ["Aerospace & Defense", "Medical Implants", "Automotive Motorsport", "Oil & Gas"]
    - "description_extended.certifications": Quality certs found - ISO 9001, AS9100D, NADCAP, ISO 13485 (medical), IATF 16949 (automotive), ITAR, FDA registered
    - "description_extended.capacity_notes": Production scale if mentioned - machine count, facility size, annual parts produced
    - BE CONCRETE: Avoid generic phrases like "high-quality" or "industry-leading" - use specific facts and numbers
11. CERTIFICATIONS - Extract as TOP-LEVEL "certifications" array:
    - Look for ISO certifications (ISO 9001, ISO 13485, ISO 14001, ISO 45001, ISO 27001)
    - Aerospace: AS9100, AS9100D, NADCAP
    - Automotive: IATF 16949
    - Defense/Military: ITAR
    - Medical: FDA Registered, CE Marking
    - Also check footer, about pages, and quality pages for certification logos/badges
    - Multi-language: "Zertifizierung", "certificering", "certification"
    - Include the confidence score for certifications
12. Lead Time & Service Extraction - LOOK FOR:
    - Delivery time indicators: "3-5 business days", "1-2 weeks", "24h express", "same day"
    - Rush/express service mentions: "rush service", "express", "expedited", "urgent", "priority"
    - Instant quoting: "instant quote", "online quote", "get quote", "quote tool", "pricing calculator"
    - Multi-language patterns: German (Lieferzeit, Express, Eilauftrag), Danish (leveringstid, ekspres)
    - Return lead_time.typical as a short string like "3-5 days" or "1-2 weeks"
    - Set rush_service: true if any express/rush option is mentioned
    - Set instant_quote: true if they offer online quoting tools`;

    console.log(`🤖 Calling Lovable AI for analysis...`);
    
    const requestBody = {
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Analyze ${supplierName} (${supplierWebsite})

VISIBLE TEXT (PRIORITIZE THIS):
${visibleTextContent}

HTML (for verification):
${htmlContent.substring(0, 50000)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 3000,
    };
    
    const aiStartTime = Date.now();
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const aiEndTime = Date.now();
    console.log(`📥 AI Response: ${aiResponse.status} (${aiEndTime - aiStartTime}ms)`);

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('❌ Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`Lovable AI error: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';
    
    console.log(`✅ AI response received (${aiContent.length} chars)`);

    // Parse AI response
    let extractedData: {
      technologies: string[];
      materials: string[];
      certifications?: string[];
      location: string | { city: string; state?: string; country: string };
      description?: string;
      description_extended?: any;
      logo_url: string;
      lead_time?: {
        typical?: string;
        rush_service?: boolean;
        instant_quote?: boolean;
      };
      confidence?: {
        technologies: number;
        materials: number;
        location: number;
        description?: number;
        logo: number;
        lead_time?: number;
        certifications?: number;
      };
    };

    try {
      let cleanContent = aiContent.trim();
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/```(?:json)?\n?/g, '').replace(/```$/g, '').trim();
      }
      
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      extractedData = JSON.parse(jsonMatch[0]);
      console.log(`✅ Extracted: ${extractedData.technologies?.length || 0} techs, ${extractedData.materials?.length || 0} materials`);
      
    } catch (parseError) {
      console.error('❌ Parse error:', parseError.message);
      extractedData = {
        technologies: [],
        materials: [],
        location: '',
        description: '',
        logo_url: '',
        lead_time: { typical: undefined, rush_service: false, instant_quote: false },
        confidence: { technologies: 0, materials: 0, location: 0, description: 0, logo: 0, lead_time: 0 }
      };
    }

    const scrapedTechnologies = extractedData.technologies || [];
    const scrapedMaterials = extractedData.materials || [];
    const scrapedDescription = extractedData.description || '';
    
    // Handle location with country normalization to English
    let scrapedCity = '';
    let scrapedState = '';
    let scrapedCountry = '';
    let scrapedLocationFull = '';
    
    if (typeof extractedData.location === 'object' && extractedData.location !== null) {
      scrapedCity = extractedData.location.city || '';
      scrapedState = extractedData.location.state || '';
      // Normalize country name to English
      scrapedCountry = normalizeCountryName(extractedData.location.country || '');
      const parts = [scrapedCity, scrapedState, scrapedCountry].filter(p => p);
      scrapedLocationFull = parts.join(', ');
    } else {
      scrapedLocationFull = String(extractedData.location || '');
      const parts = scrapedLocationFull.split(',').map(s => s.trim()).filter(p => p);
      // Normalize country name to English
      scrapedCountry = normalizeCountryName(parts[parts.length - 1] || '');
      scrapedCity = parts.length > 1 ? parts[0] : '';
      scrapedState = parts.length > 2 ? parts[1] : '';
    }
    
    console.log(`📍 Location parsed: ${scrapedCity}, ${scrapedCountry} (normalized)`);
    
    let scrapedLogoUrl = extractedData.logo_url || '';

    // Logo detection fallback - STRICT patterns to avoid wrong logos (EXPANDED)
    if (!scrapedLogoUrl && htmlContent) {
      // Patterns that are likely to find actual logos (in priority order)
      const logoPatterns = [
        // === TIER 1: Highest confidence patterns ===
        
        // 1. Explicit logo links/images in header (highest priority)
        /<header[^>]*>[\s\S]*?<a[^>]*>[\s\S]*?<img[^>]*class=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
        /<header[^>]*>[\s\S]*?<img[^>]*class=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
        
        // 2. Images with "logo" in BOTH class/id AND filename
        /<img[^>]*(?:class|id)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']*logo[^"']*)["']/i,
        /<img[^>]*src=["']([^"']*logo[^"']*)["'][^>]*(?:class|id)=["'][^"']*logo[^"']*["']/i,
        
        // 3. SVG logos with logo class (SVGs are usually actual logos, not photos)
        /<img[^>]*class=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+\.svg)["']/i,
        /<img[^>]*src=["']([^"']+\.svg)["'][^>]*class=["'][^"']*logo[^"']*["']/i,
        
        // 4. Inline SVG with logo class (common in modern SPA sites)
        /<svg[^>]*class=["'][^"']*logo[^"']*["'][^>]*>[\s\S]*?<image[^>]*href=["']([^"']+)["']/i,
        
        // === TIER 2: Navbar/navigation patterns ===
        
        // 5. Navbar brand logo (Bootstrap, Tailwind, etc.)
        /<[^>]*class=["'][^"']*navbar-brand[^"']*["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i,
        /<nav[^>]*>[\s\S]*?<a[^>]*href=["']\/["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i,
        
        // 6. React/Vue/Next.js common patterns (Link wrapping Image)
        /<a[^>]*href=["']\/["'][^>]*>[\s\S]*?<img[^>]*alt=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
        /<a[^>]*href=["']\/["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["'][^>]*alt=["'][^"']*logo[^"']*["']/i,
        
        // 7. Next.js Image component patterns
        /<img[^>]*alt=["'][^"']*logo[^"']*["'][^>]*srcset=["']([^"'\s]+)/i,
        /<img[^>]*data-src=["']([^"']*logo[^"']*)["']/i,
        
        // === TIER 3: Standard meta/link patterns ===
        
        // 8. Apple touch icon (always a company icon/logo)
        /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
        /<link[^>]*href=["']([^"']+)["'][^>]*rel=["']apple-touch-icon["']/i,
        /<link[^>]*rel=["']apple-touch-icon[^"']*["'][^>]*sizes=["']180x180["'][^>]*href=["']([^"']+)["']/i,
        
        // 9. High-quality favicon (PNG/SVG only, not ICO)
        /<link[^>]*rel=["']icon["'][^>]*type=["']image\/(?:png|svg\+xml)["'][^>]*href=["']([^"']+)["']/i,
        /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+\.(?:png|svg))["']/i,
        
        // 10. Mask icon (Safari pinned tab - usually clean logo)
        /<link[^>]*rel=["']mask-icon["'][^>]*href=["']([^"']+\.svg)["']/i,
        
        // === TIER 4: CMS-specific patterns ===
        
        // 11. Site logo class patterns (common CMS patterns)
        /<img[^>]*class=["'][^"']*(?:site-logo|brand-logo|header-logo|company-logo|custom-logo|main-logo|logo-img|logo-image)[^"']*["'][^>]*src=["']([^"']+)["']/i,
        
        // 12. WordPress customizer logo
        /<[^>]*class=["'][^"']*custom-logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
        /<[^>]*class=["'][^"']*wp-image[^"']*["'][^>]*src=["']([^"']*logo[^"']*)["']/i,
        
        // 13. Drupal patterns
        /<[^>]*class=["'][^"']*site-branding__logo[^"']*["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i,
        
        // 14. Shopify patterns
        /<[^>]*class=["'][^"']*header__logo[^"']*["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i,
        
        // 15. Webflow patterns (data attributes)
        /<img[^>]*data-wf-image=["'][^"']*["'][^>]*src=["']([^"']*logo[^"']*)["']/i,
        
        // === TIER 5: Structured data patterns ===
        
        // 16. Schema.org JSON-LD logo markup
        /"logo"\s*:\s*["']([^"']+)["']/i,
        /"logo"\s*:\s*\{\s*["']url["']\s*:\s*["']([^"']+)["']/i,
        /"logo"\s*:\s*\{\s*"@type"\s*:\s*"ImageObject"[\s\S]*?"url"\s*:\s*["']([^"']+)["']/i,
        
        // 17. OpenGraph image ONLY if "logo" is explicitly in the URL
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*logo[^"']*)["']/i,
        /<meta[^>]*content=["']([^"']*logo[^"']*)["'][^>]*property=["']og:image["']/i,
        
        // 18. Twitter card image ONLY if "logo" is explicitly in the URL
        /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']*logo[^"']*)["']/i,
        
        // === TIER 6: Footer & secondary patterns ===
        
        // 19. Footer logo (often more reliable on SPA sites with fixed headers)
        /<footer[^>]*>[\s\S]*?<img[^>]*class=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
        /<footer[^>]*>[\s\S]*?<img[^>]*src=["']([^"']*logo[^"']*)["']/i,
        /<footer[^>]*>[\s\S]*?<a[^>]*href=["']\/["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i,
        
        // === TIER 7: Fallback patterns ===
        
        // 20. Any image with "logo" in src that's PNG/SVG (last resort)
        /<img[^>]*src=["']([^"']*\/logo[^"']*\.(?:png|svg|webp))["']/i,
        /<img[^>]*src=["']([^"']*-logo[^"']*\.(?:png|svg|webp))["']/i,
        /<img[^>]*src=["']([^"']*logo-[^"']*\.(?:png|svg|webp))["']/i,
        
        // 21. Background image with logo (CSS-in-JS patterns)
        /background-image:\s*url\(['"]?([^'")\s]*logo[^'")\s]*)['"]?\)/i,
        
        // 22. Picture element with logo
        /<picture[^>]*>[\s\S]*?<source[^>]*srcset=["']([^"']*logo[^"']*)["']/i,
        /<picture[^>]*>[\s\S]*?<img[^>]*src=["']([^"']*logo[^"']*)["']/i,
      ];
      
      // Patterns to REJECT (these are usually wrong)
      const rejectPatterns = [
        /article/i, /blog/i, /post/i, /news/i,
        /og-image/i, /social/i, /share/i, /thumbnail/i,
        /banner/i, /hero/i, /feature/i, /product/i,
        /certification/i, /badge/i, /award/i, /iso-/i, /as9100/i,
        /partner/i, /client/i, /customer/i, /testimonial/i,
        /unsplash/i, /pexels/i, /stock/i, /getty/i, /shutterstock/i,
        // Cookie consent & plugin logos
        /cookie/i, /consent/i, /gdpr/i, /privacy/i, /plugin/i,
        /cookieyes/i, /cookiebot/i, /onetrust/i, /trustarc/i, /iubenda/i,
        /widget/i, /addon/i, /extension/i, /third-party/i,
        // Payment/social icons (not company logos)
        /payment/i, /paypal/i, /stripe/i, /visa/i, /mastercard/i,
        /facebook/i, /twitter/i, /linkedin/i, /instagram/i, /youtube/i,
        // Generic icons
        /icon-/i, /-icon\./i, /icons\//i, /favicon-\d/i,
        /placeholder/i, /default/i, /blank/i, /empty/i
      ];

      for (const pattern of logoPatterns) {
        const match = htmlContent.match(pattern);
        if (match && match[1] && !match[1].startsWith('data:') && match[1].length < 500) {
          const urlLower = match[1].toLowerCase();
          
          // Check if URL contains rejection patterns
          const isRejected = rejectPatterns.some(rp => rp.test(urlLower));
          if (isRejected) {
            console.log(`⚠️ Logo rejected (bad pattern): ${match[1].substring(0, 100)}`);
            continue;
          }
          
          try {
            const candidateUrl = match[1].startsWith('http') ? match[1] : new URL(match[1], baseUrl.origin).href;
            
            // Validate domain before accepting
            if (validateLogoUrl(candidateUrl, supplierWebsite)) {
              scrapedLogoUrl = candidateUrl;
              console.log(`✅ Logo found via fallback: ${scrapedLogoUrl}`);
              break;
            }
          } catch (e) {
            console.log(`⚠️ Invalid logo URL: ${match[1]}`);
          }
        }
      }
    }

    // Use AI confidence scores
    const techConfidence = extractedData.confidence?.technologies || 0;
    const materialsConfidence = extractedData.confidence?.materials || 0;
    const locationConfidence = extractedData.confidence?.location || 0;
    const descriptionConfidence = extractedData.confidence?.description || 0;
    const logoConfidence = extractedData.confidence?.logo || 0;

    const overallConfidence = Math.round(
      (techConfidence + materialsConfidence + locationConfidence) / 3
    );

    console.log(`📊 Confidence: Tech ${techConfidence}%, Materials ${materialsConfidence}%, Location ${locationConfidence}%, Overall ${overallConfidence}%`);

    // Track performance metrics
    const validationEndTime = Date.now();
    const totalScrapingTime = validationEndTime - validationStartTime;
    const cacheHitCount = scrapedPagesData.filter(d => d.cacheHit).length;
    const totalPagesScraped = scrapedPagesData.length;

    // Store validation results
    const { error: insertError } = await supabase
      .from('validation_results')
      .insert({
        supplier_id: supplierId,
        supplier_name: supplierName,
        supplier_website: supplierWebsite,
        technologies_current: currentTechnologies,
        technologies_scraped: scrapedTechnologies,
        technologies_match: techConfidence >= 70,
        technologies_confidence: techConfidence,
        materials_current: currentMaterials,
        materials_scraped: scrapedMaterials,
        materials_match: materialsConfidence >= 70,
        materials_confidence: materialsConfidence,
        location_current: currentLocation,
        location_scraped: scrapedLocationFull,
        location_match: locationConfidence >= 70,
        location_confidence: locationConfidence,
        overall_confidence: overallConfidence,
        puppeteer_success: false, // No longer using Puppeteer
        scraping_time_ms: totalScrapingTime,
        cache_hit: cacheHitCount > 0,
        pages_scraped: totalPagesScraped,
        scraping_errors: scrapingErrors.length > 0 ? scrapingErrors : null,
        scraped_content: {
          logo_url: scrapedLogoUrl,
          description: scrapedDescription,
          location: {
            city: scrapedCity,
            state: scrapedState,
            country: scrapedCountry,
            full_address: scrapedLocationFull
          },
          pages_scraped: totalPagesScraped,
          scraping_method: 'enhanced_fetch_v2'
        }
      });

    if (insertError) {
      console.error('❌ Failed to insert validation results:', insertError);
    }

    // Convert scraped data to database format
    const dbTechnologies = scrapedTechnologies.map(tech => getTechnologyKeyFromDisplayName(tech));
    const dbMaterials = scrapedMaterials.map(mat => getMaterialKeyFromDisplayName(mat));
    
    // Extract certifications from AI response
    const scrapedCertifications = extractedData.certifications || 
      extractedData.description_extended?.certifications || [];
    const certConfidence = extractedData.confidence?.certifications || descriptionConfidence || 0;
    
    // Determine which fields to update based on AI confidence (>= 70%)
    const shouldUpdateTechnologies = techConfidence >= 70;
    const shouldUpdateMaterials = materialsConfidence >= 70;
    const shouldUpdateLocation = locationConfidence >= 70;
    const shouldUpdateDescription = descriptionConfidence >= 70 && scrapedDescription;
    // Logo must have 50%+ confidence AND pass domain validation (lowered from 70%)
    const shouldUpdateLogo = logoConfidence >= 50 && scrapedLogoUrl && validateLogoUrl(scrapedLogoUrl, supplierWebsite);
    const shouldUpdateCertifications = certConfidence >= 60 && scrapedCertifications.length > 0;
    
    const shouldVerify = shouldUpdateTechnologies && shouldUpdateMaterials;
    
    // Update supplier record
    const supplierUpdate: any = {
      last_validation_confidence: overallConfidence,
      last_validated_at: new Date().toISOString()
    };
    
    if (shouldUpdateTechnologies) {
      supplierUpdate.technologies = dbTechnologies;
      console.log(`✅ Updating technologies (${techConfidence}%): ${dbTechnologies.length} items`);
    }
    
    if (shouldUpdateMaterials) {
      supplierUpdate.materials = dbMaterials;
      console.log(`✅ Updating materials (${materialsConfidence}%): ${dbMaterials.length} items`);
    }
    
    if (shouldUpdateLocation && scrapedCountry) {
      supplierUpdate.location_country = scrapedCountry;
      supplierUpdate.location_city = scrapedCity;
      supplierUpdate.location_address = scrapedLocationFull;
      console.log(`✅ Updating location (${locationConfidence}%): ${scrapedLocationFull}`);
    }
    
    if (shouldUpdateDescription) {
      supplierUpdate.description = scrapedDescription;
      // Also update description_extended if available
      if (extractedData.description_extended) {
        supplierUpdate.description_extended = extractedData.description_extended;
        console.log(`✅ Updating description with extended data (industries: ${extractedData.description_extended.industries_served?.length || 0}, certs: ${extractedData.description_extended.certifications?.length || 0})`);
      } else {
        console.log(`✅ Updating description`);
      }
    }
    
    if (shouldUpdateLogo) {
      supplierUpdate.logo_url = scrapedLogoUrl;
      console.log(`✅ Updating logo`);
    }
    
    if (shouldUpdateCertifications) {
      supplierUpdate.certifications = scrapedCertifications;
      console.log(`✅ Updating certifications (${certConfidence}%): ${scrapedCertifications.join(', ')}`);
    }
    
    // Lead time extraction
    const leadTimeData = extractedData.lead_time;
    const leadTimeConfidence = extractedData.confidence?.lead_time || 0;
    const shouldUpdateLeadTime = leadTimeConfidence >= 60; // Lower threshold for lead time
    
    if (shouldUpdateLeadTime && leadTimeData) {
      if (leadTimeData.typical) {
        supplierUpdate.lead_time_indicator = leadTimeData.typical;
        console.log(`✅ Updating lead time: ${leadTimeData.typical}`);
      }
      if (leadTimeData.rush_service !== undefined) {
        supplierUpdate.has_rush_service = leadTimeData.rush_service;
        if (leadTimeData.rush_service) console.log(`✅ Rush service available`);
      }
      if (leadTimeData.instant_quote !== undefined) {
        supplierUpdate.has_instant_quote = leadTimeData.instant_quote;
        if (leadTimeData.instant_quote) console.log(`✅ Instant quote available`);
      }
    }
    
    if (shouldVerify) {
      supplierUpdate.verified = true;
      console.log(`✅ Supplier verified`);
    }

    const { error: updateError } = await supabase
      .from('suppliers')
      .update(supplierUpdate)
      .eq('supplier_id', supplierId);

    if (updateError) {
      console.error('❌ Failed to update supplier:', updateError);
    }

    // Return success response
    const response = {
      success: true,
      supplier: supplierName,
      match: overallConfidence >= 70,
      currentData: {
        technologies: currentTechnologies,
        materials: currentMaterials,
        location: currentLocation
      },
      scrapedData: {
        technologies: scrapedTechnologies,
        materials: scrapedMaterials,
        location: scrapedLocationFull,
        description: scrapedDescription,
        logoUrl: scrapedLogoUrl,
        certifications: scrapedCertifications,
        leadTime: extractedData.lead_time?.typical || null,
        rushService: extractedData.lead_time?.rush_service || false,
        instantQuote: extractedData.lead_time?.instant_quote || false
      },
      confidence: {
        overall: overallConfidence,
        technologies: techConfidence,
        materials: materialsConfidence,
        location: locationConfidence,
        leadTime: extractedData.confidence?.lead_time || 0
      },
      updated: {
        technologies: shouldUpdateTechnologies,
        materials: shouldUpdateMaterials,
        location: shouldUpdateLocation,
        description: shouldUpdateDescription,
        logo: shouldUpdateLogo,
        certifications: shouldUpdateCertifications,
        leadTime: shouldUpdateLeadTime,
        verified: shouldVerify
      },
      timing: {
        scrapingMs: totalScrapingTime - (aiEndTime - aiStartTime),
        aiAnalysisMs: aiEndTime - aiStartTime,
        totalMs: totalScrapingTime
      },
      stats: {
        pagesScraped: totalPagesScraped,
        cacheHits: cacheHitCount,
        firecrawlPages: firecrawlPagesCount,
        basicFetchPages: basicFetchPagesCount,
        scrapingMethod: scrapingMethod,
        errors: scrapingErrors.length
      }
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Validation error:', error);
    
    // Always store a validation result, even on error
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      await supabase.from('validation_results').insert({
        supplier_id: supplierId || 'unknown',
        supplier_name: supplierName || 'Unknown',
        supplier_website: supplierWebsite || '',
        technologies_current: currentTechnologies,
        technologies_scraped: [],
        technologies_match: false,
        technologies_confidence: 0,
        materials_current: currentMaterials,
        materials_scraped: [],
        materials_match: false,
        materials_confidence: 0,
        location_current: currentLocation,
        location_scraped: 'Unknown',
        location_match: false,
        location_confidence: 0,
        overall_confidence: 0,
        puppeteer_success: false,
        scraping_time_ms: Date.now() - validationStartTime,
        cache_hit: false,
        pages_scraped: 0,
        notes: `Fatal error: ${error.message}`,
        scraped_content: {
          error: error.message,
          stack: error.stack
        }
      });
    } catch (insertError) {
      console.error('❌ Failed to store error validation result:', insertError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        supplier: supplierName,
        timing: {
          totalMs: Date.now() - validationStartTime
        }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
