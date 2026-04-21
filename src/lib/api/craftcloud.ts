// Craftcloud API client
// Docs: https://swagger.craftcloud3d.com/ | OpenAPI: https://api.craftcloud3d.com/api-docs.json
// Tested live 2026-04-07: 97 vendors, 8874 quotes for a 20mm cube

import type { LiveQuote, QuoteOption, QuoteRequest, Currency } from './types';
import { getLocalLogoForSupplier } from '@/lib/supplierLogos';
import { supabase } from '@/integrations/supabase/client';

const CRAFTCLOUD_BASE_URL = 'https://api.craftcloud3d.com';
const CRAFTCLOUD_MARKETPLACE_URL = 'https://craftcloud3d.com';

// Lazy-cached lookup of vendorId → supplier website, populated once per session.
// Placeholder websites (craftcloud3d.com) are skipped so the marketplace URL
// fallback kicks in for vendors whose real site we haven't researched yet.
let vendorWebsitesCache: Promise<Map<string, string>> | null = null;

function loadCraftcloudVendorWebsites(): Promise<Map<string, string>> {
  if (vendorWebsitesCache) return vendorWebsitesCache;
  vendorWebsitesCache = (async () => {
    const map = new Map<string, string>();
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('website, metadata')
        .not('metadata->>craftcloud_vendor_id', 'is', null);
      if (error) throw error;
      for (const row of data ?? []) {
        const website = (row as { website: string | null }).website;
        if (!website || website === CRAFTCLOUD_MARKETPLACE_URL) continue;
        const meta = ((row as { metadata: Record<string, unknown> | null }).metadata ?? {}) as Record<string, unknown>;
        const vid = typeof meta.craftcloud_vendor_id === 'string' ? meta.craftcloud_vendor_id : null;
        const vidAlt = typeof meta.craftcloud_vendor_id_alt === 'string' ? meta.craftcloud_vendor_id_alt : null;
        if (vid) map.set(vid, website);
        if (vidAlt) map.set(vidAlt, website);
      }
    } catch (err) {
      console.warn('[craftcloud] vendor website lookup failed, falling back to marketplace URL:', err);
    }
    return map;
  })();
  return vendorWebsitesCache;
}

// Dedupe console.info spam — partials re-run toQuotes many times.
const loggedUnknownVendors = new Set<string>();

interface CraftcloudModelResponse {
  modelId: string;
  fileName: string;
  fileUnit: string;
  area: number | null;
  volume: number | null;
  dimensions: { x: number; y: number; z: number };
  thumbnailUrl: string;
}

interface CraftcloudQuote {
  quoteId: string;
  vendorId: string;
  modelId: string;
  materialConfigId: string;
  price: number;
  priceInclVat: number;
  currency: string;
  productionTimeFast: number;
  productionTimeSlow: number;
  scale: number;
}

interface CraftcloudShipping {
  vendorId: string;
  shippingOptions: {
    name: string;
    price: number;
    currency: string;
    estimatedDeliveryDays: number;
  }[];
}

interface CraftcloudPriceResponse {
  expiresAt: number;
  allComplete: boolean;
  quotes: CraftcloudQuote[];
  shippings: CraftcloudShipping[];
}

// Upload a model file → returns model metadata
async function uploadModel(file: File, unit: string = 'mm'): Promise<CraftcloudModelResponse[]> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('unit', unit);

  const response = await fetch(`${CRAFTCLOUD_BASE_URL}/v5/model`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Craftcloud upload failed: ${response.status}`);
  }

  return response.json();
}

// Request pricing for a model → returns priceId for polling
async function requestPrice(
  modelId: string,
  quantity: number,
  currency: Currency = 'EUR',
  countryCode: string = 'DK'
): Promise<string> {
  const response = await fetch(`${CRAFTCLOUD_BASE_URL}/v5/price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      currency,
      countryCode,
      models: [{ modelId, quantity, scale: 1 }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Craftcloud price request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.priceId;
}

// Poll for price results — Craftcloud calculates async across 97+ vendors.
// Emits partial results via onPartial whenever the quote set grows so callers
// can render incrementally instead of waiting for allComplete.
async function getPriceResults(
  priceId: string,
  onPartial?: (data: CraftcloudPriceResponse) => void,
  maxAttempts: number = 10,
  delayMs: number = 1500
): Promise<CraftcloudPriceResponse> {
  let lastQuoteCount = 0;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`${CRAFTCLOUD_BASE_URL}/v5/price/${priceId}`);

    if (!response.ok) {
      throw new Error(`Craftcloud price poll failed: ${response.status}`);
    }

    const data: CraftcloudPriceResponse = await response.json();

    if (data.allComplete) {
      return data;
    }

    // Stream partials as vendors report in
    if (onPartial && data.quotes.length > lastQuoteCount) {
      lastQuoteCount = data.quotes.length;
      try {
        onPartial(data);
      } catch {
        // Partial-handler errors must not abort polling
      }
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  // Return partial results after timeout
  const response = await fetch(`${CRAFTCLOUD_BASE_URL}/v5/price/${priceId}`);
  return response.json();
}

// Group quotes by vendor and pick cheapest per vendor for cleaner display
function getBestQuotePerVendor(quotes: CraftcloudQuote[]): CraftcloudQuote[] {
  const best = new Map<string, CraftcloudQuote>();
  for (const q of quotes) {
    const existing = best.get(q.vendorId);
    if (!existing || q.price < existing.price) {
      best.set(q.vendorId, q);
    }
  }
  return [...best.values()];
}

// Format materialConfigId into a readable name, e.g. "PA_12_GF" → "PA 12 GF"
// Returns empty string for UUIDs (Craftcloud sometimes returns UUIDs instead of names)
function formatMaterialId(id: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return '';
  }
  return id
    .replace(/([a-z])([A-Z])/g, '$1 $2')  // camelCase → spaced
    .replace(/[_-]/g, ' ')                  // underscores/hyphens → spaces
    .replace(/\s+/g, ' ')
    .trim();
}

// Get top 3 distinct quotes per vendor: cheapest, fastest, and a mid-range option
// Returns quotes with labels explaining why each was picked
type LabeledQuote = CraftcloudQuote & { label: string };
function getTopQuotesPerVendor(quotes: CraftcloudQuote[]): Map<string, LabeledQuote[]> {
  const byVendor = new Map<string, CraftcloudQuote[]>();
  for (const q of quotes) {
    if (!byVendor.has(q.vendorId)) byVendor.set(q.vendorId, []);
    byVendor.get(q.vendorId)!.push(q);
  }

  const result = new Map<string, LabeledQuote[]>();
  for (const [vendorId, vendorQuotes] of byVendor) {
    // Sort by price to find distinct price tiers
    const sorted = [...vendorQuotes].sort((a, b) => a.price - b.price);
    const picked: LabeledQuote[] = [{ ...sorted[0], label: 'Cheapest material' }];

    // Find fastest option (different from cheapest)
    const fastest = [...vendorQuotes].sort((a, b) => a.productionTimeFast - b.productionTimeFast)[0];
    if (fastest.quoteId !== picked[0].quoteId && fastest.price !== picked[0].price) {
      picked.push({ ...fastest, label: 'Fastest delivery' });
    }

    // Find a mid-range option if we have enough variety
    if (sorted.length > 2) {
      const midIdx = Math.floor(sorted.length / 2);
      const mid = sorted[midIdx];
      if (!picked.some(p => p.quoteId === mid.quoteId) && mid.price !== picked[0].price) {
        picked.push({ ...mid, label: formatMaterialId(mid.materialConfigId) });
      }
    }

    // If we still need options, grab distinct price tiers
    if (picked.length < 3) {
      for (const q of sorted) {
        if (picked.length >= 3) break;
        if (!picked.some(p => p.quoteId === q.quoteId) && !picked.some(p => Math.abs(p.price - q.price) < 0.5)) {
          picked.push({ ...q, label: formatMaterialId(q.materialConfigId) });
        }
      }
    }

    result.set(vendorId, picked.slice(0, 3));
  }
  return result;
}

// Convert to normalized LiveQuote format
function toQuotes(
  priceResponse: CraftcloudPriceResponse,
  quantity: number,
  vendorWebsites: Map<string, string>
): LiveQuote[] {
  const shippingByVendor = new Map<string, number>();
  for (const s of priceResponse.shippings) {
    if (s.shippingOptions?.length > 0) {
      const cheapest = s.shippingOptions.reduce((a, b) =>
        a.price < b.price ? a : b
      );
      shippingByVendor.set(s.vendorId, cheapest.price);
    }
  }

  // Show best quote per vendor with alternative options
  const bestPerVendor = getBestQuotePerVendor(priceResponse.quotes);
  const topQuotes = getTopQuotesPerVendor(priceResponse.quotes);

  return bestPerVendor.map((q) => {
    const name = formatVendorName(q.vendorId);
    const vendorAlts = topQuotes.get(q.vendorId) || [];
    const alternativeQuotes: QuoteOption[] = vendorAlts
      .filter(alt => alt.quoteId !== q.quoteId)
      .map(alt => ({
        material: formatMaterialId(alt.materialConfigId),
        label: alt.label,
        unitPrice: alt.price,
        totalPrice: alt.price * quantity,
        estimatedLeadTimeDays: alt.productionTimeFast,
        shippingEstimate: shippingByVendor.get(q.vendorId) ?? null,
      }));

    const supplierWebsite = vendorWebsites.get(q.vendorId);
    if (!supplierWebsite && !loggedUnknownVendors.has(q.vendorId)) {
      loggedUnknownVendors.add(q.vendorId);
      console.info('[craftcloud] unknown vendorId (no supplier website):', q.vendorId);
    }

    return {
      type: 'live' as const,
      supplierId: `craftcloud-${q.vendorId}`,
      supplierName: name,
      supplierLogo: getLocalLogoForSupplier(name),
      material: formatMaterialId(q.materialConfigId),
      technology: '',
      unitPrice: q.price,
      totalPrice: q.price * quantity,
      currency: (q.currency as Currency) || 'EUR',
      quantity,
      estimatedLeadTimeDays: q.productionTimeFast,
      shippingEstimate: shippingByVendor.get(q.vendorId) ?? null,
      quoteUrl: supplierWebsite ?? CRAFTCLOUD_MARKETPLACE_URL,
      fetchedAt: new Date(),
      source: 'craftcloud' as const,
      alternativeQuotes: alternativeQuotes.length > 0 ? alternativeQuotes : undefined,
    };
  });
}

// Prettify vendor IDs like "bone3dgroup" → "Bone 3D Group"
function formatVendorName(vendorId: string): string {
  return vendorId
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/(\d+)/g, ' $1 ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Main: upload file → request price → poll → return normalized quotes.
// Optional onPartial callback fires on each poll that yields new quotes.
export async function getCraftcloudQuotes(
  request: QuoteRequest,
  onPartial?: (quotes: LiveQuote[]) => void
): Promise<LiveQuote[]> {
  // Kick off vendor website lookup in parallel with the upload/price flow.
  const vendorWebsitesPromise = loadCraftcloudVendorWebsites();

  const models = await uploadModel(request.file);
  if (models.length === 0) {
    throw new Error('Craftcloud: No models returned from upload');
  }

  const priceId = await requestPrice(
    models[0].modelId,
    request.quantity,
    request.currency,
    request.countryCode
  );

  // Ensure the map is resolved before any toQuotes call runs (partial or final).
  const vendorWebsites = await vendorWebsitesPromise;

  const partialBridge = onPartial
    ? (raw: CraftcloudPriceResponse) => onPartial(toQuotes(raw, request.quantity, vendorWebsites))
    : undefined;

  const priceResponse = await getPriceResults(priceId, partialBridge);

  return toQuotes(priceResponse, request.quantity, vendorWebsites);
}
