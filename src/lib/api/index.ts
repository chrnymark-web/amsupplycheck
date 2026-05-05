// API Aggregator — live quotes from API suppliers + estimated prices for the rest

import type { QuoteRequest, QuoteResult, QuoteGeometry, LiveQuote, EstimatedPrice, SupplierPrice, Currency } from './types';
import { getCraftcloudQuotes } from './craftcloud';
import { getTreatstockQuotes } from './treatstock';
import { runSanityChecks } from './quote-sanity';
import {
  getPriceTier,
  materialPriceIndex,
  technologyPriceIndex,
} from '../technologyMaterialCompatibility';
import { normalizeTechKey } from '../materialTechClassifier';

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
    console.error('[live-pricing] Craftcloud failed:', settled[0].reason);
    results.push({ supplier: 'Craftcloud', source: 'craftcloud', quotes: [], error: settled[0].reason?.message });
  }

  // Process Treatstock (if enabled)
  if (TREATSTOCK_API_KEY && settled[1]) {
    if (settled[1].status === 'fulfilled') {
      results.push({ supplier: 'Treatstock', source: 'treatstock', quotes: settled[1].value });
    } else {
      console.error('[live-pricing] Treatstock failed:', settled[1].reason);
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

// Calibration constants — tune against real Craftcloud medians as data accrues.
const BASE_EUR_PER_CM3 = 0.35;           // FDM/PLA baseline
const FIXED_SETUP_EUR = 6.0;
const BBOX_SURCHARGE_PER_CM = 0.15;      // discourages very large prints
const MIN_UNIT_EUR = 3.5;
const MAX_UNIT_EUR = 3000;
const RANGE_SPREAD = 0.35;               // ±35% around central estimate

export interface EstimatePriceInput {
  supplierName: string;
  supplierId: string;
  /** Capability list from DB. Used when selectedTechnology is empty (takes mean). */
  supplierTechnologies: string[];
  /** User-selected technology — when set, the estimate uses only this index. */
  selectedTechnology?: string;
  /** User-selected material — scales the estimate by materialPriceIndex if known. */
  selectedMaterial?: string;
  /** STL-parsed geometry — primary driver of the estimate when available. */
  geometry?: QuoteGeometry;
  /** Part quantity. Defaults to 1. */
  quantity?: number;
  logoUrl?: string;
  /** Mark estimate as belonging to a paying SupplyCheck partner — pinned to top of rankings. */
  isPartner?: boolean;
}

// Generate an estimated price for a supplier without a live API. Now geometry-
// and tech-aware: volume + bounding box × technology price index × material
// multiplier + fixed setup. Falls back to a tech-indexed baseline when no
// geometry is available.
export function getEstimatedPrice(input: EstimatePriceInput): EstimatedPrice {
  const {
    supplierName,
    supplierId,
    supplierTechnologies,
    selectedTechnology,
    selectedMaterial,
    geometry,
    quantity = 1,
    logoUrl,
    isPartner,
  } = input;

  const techKeys = selectedTechnology
    ? [normalizeTechKey(selectedTechnology)].filter(Boolean)
    : supplierTechnologies.map(normalizeTechKey).filter(Boolean);

  // When the user picks "Any technology", quote the supplier's CHEAPEST tech —
  // that's the "best offer" a generalist shop would actually make for a basic
  // part. Averaging across techs inflates prices for any shop that also
  // happens to offer expensive metal processes.
  const techIndex = techKeys.length > 0
    ? Math.min(...techKeys.map((k) => technologyPriceIndex[k] ?? 2.0))
    : 2.0;
  const cheapestTechKey = !selectedTechnology && techKeys.length > 0
    ? techKeys.reduce((best, k) =>
        (technologyPriceIndex[k] ?? 2.0) < (technologyPriceIndex[best] ?? 2.0) ? k : best
      )
    : null;

  const matIndex = selectedMaterial && materialPriceIndex[selectedMaterial]
    ? materialPriceIndex[selectedMaterial]
    : 1.0;

  let central: number;
  if (geometry && geometry.volumeCm3 > 0) {
    const { volumeCm3, boundingBox } = geometry;
    // boundingBox is in millimetres; convert to cm for the large-part surcharge.
    const maxDimCm = Math.max(boundingBox.x, boundingBox.y, boundingBox.z) / 10;
    central =
      FIXED_SETUP_EUR +
      volumeCm3 * BASE_EUR_PER_CM3 * techIndex * matIndex +
      Math.max(0, maxDimCm - 10) * BBOX_SURCHARGE_PER_CM;
  } else {
    // No geometry — tech still drives the baseline.
    central = FIXED_SETUP_EUR + 12 * techIndex * matIndex;
  }
  central = Math.max(MIN_UNIT_EUR, Math.min(MAX_UNIT_EUR, central));

  const tier = getPriceTier(techIndex * matIndex);

  const basedOn = selectedTechnology
    ? `${selectedTechnology}${selectedMaterial ? ' · ' + selectedMaterial : ''}${geometry ? ' · geometry' : ''}`
    : cheapestTechKey
      ? `${cheapestTechKey} (cheapest of ${techKeys.length} tech${techKeys.length === 1 ? '' : 's'})${geometry ? ' · geometry' : ''}`
      : 'Market data';

  return {
    type: 'estimated',
    supplierId,
    supplierName,
    supplierLogo: logoUrl,
    isPartner: isPartner || false,
    priceTier: tier.symbol,
    priceTierLabel: tier.label,
    priceRangeLow: Math.round(central * (1 - RANGE_SPREAD)) * quantity,
    priceRangeHigh: Math.round(central * (1 + RANGE_SPREAD)) * quantity,
    currency: 'EUR',
    basedOn,
  };
}

export type { QuoteRequest, LiveQuote, EstimatedPrice, SupplierPrice, QuoteResult, Currency };
