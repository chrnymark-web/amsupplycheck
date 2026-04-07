// Craftcloud API client
// Docs: https://swagger.craftcloud3d.com/ | OpenAPI: https://api.craftcloud3d.com/api-docs.json
// Tested live 2026-04-07: 97 vendors, 8874 quotes for a 20mm cube

import type { LiveQuote, QuoteOption, QuoteRequest, Currency } from './types';
import { getLocalLogoForSupplier } from '@/lib/supplierLogos';

const CRAFTCLOUD_BASE_URL = 'https://api.craftcloud3d.com';

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

// Poll for price results — Craftcloud calculates async across 97+ vendors
async function getPriceResults(
  priceId: string,
  maxAttempts: number = 6,
  delayMs: number = 3000
): Promise<CraftcloudPriceResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`${CRAFTCLOUD_BASE_URL}/v5/price/${priceId}`);

    if (!response.ok) {
      throw new Error(`Craftcloud price poll failed: ${response.status}`);
    }

    const data: CraftcloudPriceResponse = await response.json();

    if (data.allComplete) {
      return data;
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
        picked.push({ ...mid, label: 'Alternative material' });
      }
    }

    // If we still need options, grab distinct price tiers
    if (picked.length < 3) {
      for (const q of sorted) {
        if (picked.length >= 3) break;
        if (!picked.some(p => p.quoteId === q.quoteId) && !picked.some(p => Math.abs(p.price - q.price) < 0.5)) {
          picked.push({ ...q, label: 'Alternative material' });
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
  quantity: number
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
        material: alt.materialConfigId,
        label: alt.label,
        unitPrice: alt.price,
        totalPrice: alt.price * quantity,
        estimatedLeadTimeDays: alt.productionTimeFast,
        shippingEstimate: shippingByVendor.get(q.vendorId) ?? null,
      }));

    return {
      type: 'live' as const,
      supplierId: `craftcloud-${q.vendorId}`,
      supplierName: name,
      supplierLogo: getLocalLogoForSupplier(name),
      material: q.materialConfigId,
      technology: '',
      unitPrice: q.price,
      totalPrice: q.price * quantity,
      currency: (q.currency as Currency) || 'EUR',
      quantity,
      estimatedLeadTimeDays: q.productionTimeFast,
      shippingEstimate: shippingByVendor.get(q.vendorId) ?? null,
      quoteUrl: `https://craftcloud3d.com`,
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

// Main: upload file → request price → poll → return normalized quotes
export async function getCraftcloudQuotes(
  request: QuoteRequest
): Promise<LiveQuote[]> {
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

  const priceResponse = await getPriceResults(priceId);

  return toQuotes(priceResponse, request.quantity);
}
