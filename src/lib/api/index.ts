// API Aggregator — live quotes from API suppliers + estimated prices for the rest

import type { QuoteRequest, QuoteResult, LiveQuote, EstimatedPrice, SupplierPrice, Currency } from './types';
import { getCraftcloudQuotes } from './craftcloud';
import { getTreatstockQuotes } from './treatstock';
import { getSupplierPriceTier } from '../supplierPricing';
import { runSanityChecks } from './quote-sanity';

const TREATSTOCK_API_KEY = import.meta.env.VITE_TREATSTOCK_API_KEY || '';

export interface AggregatedPricing {
  liveQuotes: LiveQuote[];
  estimatedPrices: EstimatedPrice[];
  all: SupplierPrice[];
  results: QuoteResult[];
  hasErrors: boolean;
  liveCount: number;
  estimatedCount: number;
}

// Fetch live quotes from all enabled API suppliers.
// Optional onPartial callback fires as vendors report in (currently Craftcloud only),
// letting the UI render quotes progressively rather than waiting for all polls to finish.
export async function fetchLiveQuotes(
  request: QuoteRequest,
  onPartial?: (quotes: LiveQuote[]) => void
): Promise<{ quotes: LiveQuote[]; results: QuoteResult[] }> {
  const results: QuoteResult[] = [];

  const partialHandler = onPartial
    ? (partial: LiveQuote[]) => {
        // Run sanity checks on the partial set before emitting so the UI can
        // dim suspect rows in-flight, matching the final-result behavior.
        runSanityChecks(partial, request.geometry);
        onPartial([...partial].sort((a, b) => a.unitPrice - b.unitPrice));
      }
    : undefined;

  const promises: Promise<LiveQuote[]>[] = [getCraftcloudQuotes(request, partialHandler)];

  if (TREATSTOCK_API_KEY) {
    promises.push(getTreatstockQuotes(request, TREATSTOCK_API_KEY));
  }

  const settled = await Promise.allSettled(promises);

  // Process Craftcloud
  if (settled[0].status === 'fulfilled') {
    results.push({ supplier: 'Craftcloud', source: 'craftcloud', quotes: settled[0].value });
  } else {
    results.push({ supplier: 'Craftcloud', source: 'craftcloud', quotes: [], error: settled[0].reason?.message });
  }

  // Process Treatstock (if enabled)
  if (TREATSTOCK_API_KEY && settled[1]) {
    if (settled[1].status === 'fulfilled') {
      results.push({ supplier: 'Treatstock', source: 'treatstock', quotes: settled[1].value });
    } else {
      results.push({ supplier: 'Treatstock', source: 'treatstock', quotes: [], error: settled[1].reason?.message });
    }
  }

  const quotes = results
    .flatMap((r) => r.quotes)
    .sort((a, b) => a.unitPrice - b.unitPrice);

  // Run sanity checks on all collected quotes
  runSanityChecks(quotes, request.geometry);

  return { quotes, results };
}

// Generate estimated prices for suppliers without APIs
export function getEstimatedPrice(
  supplierName: string,
  supplierId: string,
  technologies: string[],
  logoUrl?: string
): EstimatedPrice {
  const tier = getSupplierPriceTier(technologies);

  // Rough EUR ranges based on price tier for a typical small part
  const ranges: Record<string, [number, number]> = {
    '€': [3, 20],
    '€€': [15, 60],
    '€€€': [40, 150],
    '€€€€': [100, 500],
  };

  const [low, high] = ranges[tier.symbol] || [10, 100];

  return {
    type: 'estimated',
    supplierId,
    supplierName,
    supplierLogo: logoUrl,
    priceTier: tier.symbol,
    priceTierLabel: tier.label,
    priceRangeLow: low,
    priceRangeHigh: high,
    currency: 'EUR',
    basedOn: technologies.length > 0
      ? `${technologies.slice(0, 3).join(', ')} technologies`
      : 'Market data',
  };
}

export type { QuoteRequest, LiveQuote, EstimatedPrice, SupplierPrice, QuoteResult, Currency };
