// Craftcloud API client
// Docs: https://swagger.craftcloud3d.com/ | OpenAPI: https://api.craftcloud3d.com/api-docs.json
// Tested live 2026-04-07: 97 vendors, 8874 quotes for a 20mm cube

import type { LiveQuote, QuoteRequest, Currency } from './types';
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

  // Show best quote per vendor (not all 8000+ combos)
  const bestPerVendor = getBestQuotePerVendor(priceResponse.quotes);

  return bestPerVendor.map((q) => {
    const name = formatVendorName(q.vendorId);
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
