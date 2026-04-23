// Treatstock API client
// Docs: https://www.treatstock.com/help/article/83-api-documentation

import type { LiveQuote, QuoteRequest, Currency } from './types';
import { classifyMaterialConfigId } from '@/lib/materialTechClassifier';

const TREATSTOCK_BASE_URL = 'https://www.treatstock.com/api/v2';

interface TreatstockUploadResponse {
  success: boolean;
  id: number;
  redir: string;
  parts: Record<string, {
    name: string;
    weight: number;
    dimensions: { x: number; y: number; z: number };
  }>;
}

interface TreatstockCostOption {
  providerId: number;
  providerName: string;
  providerLogo: string;
  materialGroup: string;
  color: string;
  price: number;
  currency: string;
  leadTimeDays: number;
}

// Step 1: Upload a model file
async function uploadModel(
  file: File,
  apiKey: string,
  countryCode?: string
): Promise<number> {
  const formData = new FormData();
  formData.append('files[]', file);
  if (countryCode) {
    formData.append('location[country]', countryCode);
  }

  const response = await fetch(
    `${TREATSTOCK_BASE_URL}/printable-packs/?private-key=${apiKey}`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Treatstock upload failed: ${response.status}`);
  }

  const data: TreatstockUploadResponse = await response.json();
  if (!data.success) {
    throw new Error('Treatstock upload failed');
  }

  return data.id;
}

// Step 2: Get pricing for all materials
async function getCosts(
  packId: number,
  apiKey: string,
  countryCode?: string
): Promise<TreatstockCostOption[]> {
  const params = new URLSearchParams({
    printablePackId: String(packId),
    'private-key': apiKey,
  });
  if (countryCode) {
    params.set('location[country]', countryCode);
  }

  const response = await fetch(
    `${TREATSTOCK_BASE_URL}/printable-pack-costs/?${params}`
  );

  if (!response.ok) {
    throw new Error(`Treatstock costs failed: ${response.status}`);
  }

  return response.json();
}

// Convert to normalized format. One LiveQuote per cost option (vendor × materialGroup);
// per-vendor cheapest + alternativeQuotes reconstruction happens in the hook after
// tech/material filtering. `materialGroup` doubles as hint for the classifier since
// Treatstock only gives us coarse groups like "Nylon" / "Resin".
function toQuotes(costs: TreatstockCostOption[], quantity: number): LiveQuote[] {
  return costs.map((c) => {
    const classified = classifyMaterialConfigId(c.materialGroup, c.materialGroup);
    return {
      type: 'live' as const,
      supplierId: `treatstock-${c.providerId}`,
      supplierName: c.providerName,
      supplierLogo: c.providerLogo,
      material: classified.material || c.materialGroup,
      materialConfigId: c.materialGroup,
      technology: classified.technology,
      technologyConfidence: classified.confidence,
      unitPrice: c.price,
      totalPrice: c.price * quantity,
      currency: (c.currency as Currency) || 'USD',
      quantity,
      estimatedLeadTimeDays: c.leadTimeDays ?? null,
      shippingEstimate: null,
      quoteUrl: `https://www.treatstock.com`,
      fetchedAt: new Date(),
      source: 'treatstock' as const,
    };
  });
}

// Main function: get quotes from Treatstock
export async function getTreatstockQuotes(
  request: QuoteRequest,
  apiKey: string
): Promise<LiveQuote[]> {
  const packId = await uploadModel(request.file, apiKey, request.countryCode);

  // Wait briefly for processing
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const costs = await getCosts(packId, apiKey, request.countryCode);

  return toQuotes(costs, request.quantity);
}
