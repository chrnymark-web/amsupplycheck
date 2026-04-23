// Craftcloud API client
// Docs: https://swagger.craftcloud3d.com/ | OpenAPI: https://api.craftcloud3d.com/api-docs.json
// Tested live 2026-04-07: 97 vendors, 8874 quotes for a 20mm cube

import type { LiveQuote, QuoteRequest, Currency } from './types';
import { getLocalLogoForSupplier } from '@/lib/supplierLogos';
import { supabase } from '@/integrations/supabase/client';
import { classifyMaterialConfigId } from '@/lib/materialTechClassifier';

const CRAFTCLOUD_BASE_URL = 'https://api.craftcloud3d.com';
const CRAFTCLOUD_MARKETPLACE_URL = 'https://craftcloud3d.com';

// Lazy-cached lookup of vendorId → supplier info (website + continent),
// populated once per session. Website placeholders (craftcloud3d.com itself)
// are skipped so the marketplace URL fallback kicks in for vendors whose real
// site we haven't researched yet.
interface VendorInfo {
  website?: string;
  area?: string;
}

let vendorInfoCache: Promise<Map<string, VendorInfo>> | null = null;

function loadCraftcloudVendorInfo(): Promise<Map<string, VendorInfo>> {
  if (vendorInfoCache) return vendorInfoCache;
  vendorInfoCache = (async () => {
    const map = new Map<string, VendorInfo>();
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('website, metadata')
        .not('metadata->>craftcloud_vendor_id', 'is', null);
      if (error) throw error;
      for (const row of data ?? []) {
        const rawWebsite = (row as { website: string | null }).website;
        const website = rawWebsite && rawWebsite !== CRAFTCLOUD_MARKETPLACE_URL ? rawWebsite : undefined;
        const meta = ((row as { metadata: Record<string, unknown> | null }).metadata ?? {}) as Record<string, unknown>;
        const vid = typeof meta.craftcloud_vendor_id === 'string' ? meta.craftcloud_vendor_id : null;
        const vidAlt = typeof meta.craftcloud_vendor_id_alt === 'string' ? meta.craftcloud_vendor_id_alt : null;
        const area = typeof meta.area === 'string' ? meta.area : undefined;
        const info: VendorInfo = { website, area };
        if (vid) map.set(vid, info);
        if (vidAlt) map.set(vidAlt, info);
      }
    } catch (err) {
      console.warn('[craftcloud] vendor info lookup failed, falling back to defaults:', err);
    }
    return map;
  })();
  return vendorInfoCache;
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

// Convert every Craftcloud quote to a normalized LiveQuote (one per vendor × material).
// Per-vendor cheapest + alternativeQuotes reconstruction happens downstream in
// the hook, after tech/material filtering. This keeps the raw data available so
// switching tech in the UI becomes an instant re-filter instead of a re-fetch.
function toQuotes(
  priceResponse: CraftcloudPriceResponse,
  quantity: number,
  vendorInfo: Map<string, VendorInfo>
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

  return priceResponse.quotes.map((q) => {
    const classified = classifyMaterialConfigId(q.materialConfigId);
    const name = formatVendorName(q.vendorId);
    const info = vendorInfo.get(q.vendorId);
    if (!info && !loggedUnknownVendors.has(q.vendorId)) {
      loggedUnknownVendors.add(q.vendorId);
      console.info('[craftcloud] unknown vendorId (no supplier record):', q.vendorId);
    }

    return {
      type: 'live' as const,
      supplierId: `craftcloud-${q.vendorId}`,
      supplierName: name,
      supplierLogo: getLocalLogoForSupplier(name),
      material: classified.material,
      materialConfigId: q.materialConfigId,
      technology: classified.technology,
      technologyConfidence: classified.confidence,
      unitPrice: q.price,
      totalPrice: q.price * quantity,
      currency: (q.currency as Currency) || 'EUR',
      quantity,
      estimatedLeadTimeDays: q.productionTimeFast,
      shippingEstimate: shippingByVendor.get(q.vendorId) ?? null,
      quoteUrl: info?.website ?? CRAFTCLOUD_MARKETPLACE_URL,
      fetchedAt: new Date(),
      source: 'craftcloud' as const,
      supplierArea: info?.area,
    };
  });
}

// Prettify vendor IDs like "bone3dgroup" → "Bone 3D Group", "3dcreative" → "3D Creative"
function formatVendorName(vendorId: string): string {
  return vendorId
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/(\d+[dD])([a-z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (/^\d+[dD]$/.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

// Main: upload file → request price → poll → return normalized quotes.
// Optional onPartial callback fires on each poll that yields new quotes.
export async function getCraftcloudQuotes(
  request: QuoteRequest,
  onPartial?: (quotes: LiveQuote[]) => void
): Promise<LiveQuote[]> {
  // Kick off vendor info lookup in parallel with the upload/price flow.
  const vendorInfoPromise = loadCraftcloudVendorInfo();

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
  const vendorInfo = await vendorInfoPromise;

  const partialBridge = onPartial
    ? (raw: CraftcloudPriceResponse) => onPartial(toQuotes(raw, request.quantity, vendorInfo))
    : undefined;

  const priceResponse = await getPriceResults(priceId, partialBridge);

  return toQuotes(priceResponse, request.quantity, vendorInfo);
}
