// Quote Sanity Check — detects suspiciously inaccurate prices
// Uses two independent methods: peer comparison + estimate envelope

import type { LiveQuote, QuoteSanityResult, QuoteGeometry } from './types';

// Ported from supabase/functions/estimate-price/index.ts
const BASE_PRICES: Record<string, { low: number; high: number }> = {
  'FDM/FFF':          { low: 0.04, high: 0.15 },
  'SLS':              { low: 0.12, high: 0.40 },
  'SLA':              { low: 0.08, high: 0.30 },
  'MJF':              { low: 0.10, high: 0.30 },
  'DMLS':             { low: 1.00, high: 4.00 },
  'SLM':              { low: 1.00, high: 4.00 },
  'DLP':              { low: 0.08, high: 0.30 },
  'Material Jetting': { low: 0.15, high: 0.50 },
  'Binder Jetting':   { low: 0.20, high: 0.80 },
};

const MATERIAL_MULTIPLIERS: Record<string, number> = {
  'PLA': 1.0, 'ABS': 1.1, 'PETG': 1.15, 'ASA': 1.2,
  'Nylon': 1.4, 'TPU': 1.3, 'Polycarbonate': 1.6,
  'PEEK': 5.0, 'PEI/Ultem': 4.0,
  'PA-12': 1.0, 'PA-11': 1.1,
  'PA-12 Glass Filled': 1.3, 'PA-12 Carbon Filled': 1.8,
  'Polypropylene': 1.1,
  'Standard Resin': 1.0, 'Tough Resin': 1.2, 'Flexible Resin': 1.3,
  'Clear Resin': 1.2, 'High Temp Resin': 1.5,
  'Castable Resin': 1.4, 'Dental Resin': 2.0, 'Biocompatible Resin': 2.5,
  'Titanium': 1.8, 'Titanium Ti-6Al-4V': 2.0,
  'Aluminum AlSi10Mg': 1.0, 'Aluminum': 1.0,
  'Stainless Steel 316L': 1.0, 'Stainless Steel': 1.0,
  'Stainless Steel 17-4PH': 1.2,
  'Inconel 718': 2.5, 'Inconel 625': 2.3,
  'Cobalt Chrome': 2.0, 'Maraging Steel': 1.5,
  'Ceramic': 1.5, 'Copper': 2.0, 'Bronze': 1.5,
};

const METAL_TECHNOLOGIES = new Set(['DMLS', 'SLM', 'Binder Jetting']);

// --- Peer Comparison Check ---

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

type PeerResult = { flag: 'ok' | 'suspect-low' | 'suspect-high'; reason: string } | null;

function checkPeerOutlier(unitPrice: number, allPrices: number[]): PeerResult {
  if (allPrices.length < 3) return null; // insufficient data

  // Exclude the current quote's price to avoid self-influence on the median
  const peerPrices = allPrices.filter((_, i) => {
    // Remove the first occurrence that matches unitPrice
    const idx = allPrices.indexOf(unitPrice);
    return i !== idx;
  });
  // If removing left us with too few peers, use all
  const prices = peerPrices.length >= 2 ? peerPrices : allPrices;
  const med = median(prices);
  if (med <= 0) return null;

  if (unitPrice < med * 0.25) {
    return {
      flag: 'suspect-low',
      reason: `Price is ${Math.round((unitPrice / med) * 100)}% of median (${med.toFixed(2)})`,
    };
  }
  if (unitPrice > med * 4.0) {
    return {
      flag: 'suspect-high',
      reason: `Price is ${Math.round((unitPrice / med) * 100)}% of median (${med.toFixed(2)})`,
    };
  }
  return { flag: 'ok', reason: '' };
}

// --- Estimate Envelope Check ---

interface PriceRange {
  low: number;
  high: number;
}

function getExpectedRange(
  geometry: QuoteGeometry,
  technology: string,
  material: string
): PriceRange | null {
  // Try to match technology (fuzzy — Craftcloud uses varied names)
  const techKey = Object.keys(BASE_PRICES).find(
    (k) => k.toLowerCase() === technology.toLowerCase()
      || technology.toLowerCase().includes(k.toLowerCase().split('/')[0])
  );
  const basePrice = techKey ? BASE_PRICES[techKey] : null;
  if (!basePrice) return null;

  const materialMult = MATERIAL_MULTIPLIERS[material] || 1.0;
  const { volumeCm3, boundingBox, triangleCount } = geometry;

  let low = volumeCm3 * basePrice.low * materialMult;
  let high = volumeCm3 * basePrice.high * materialMult;

  // Min price floor
  const isMetal = techKey ? METAL_TECHNOLOGIES.has(techKey) : false;
  const minPrice = isMetal ? 25 : 3;
  low = Math.max(low, minPrice);
  high = Math.max(high, minPrice * 1.5);

  // Complexity surcharge
  const complexityFactor = triangleCount > 500000 ? 1.15 : triangleCount > 100000 ? 1.05 : 1.0;
  low *= complexityFactor;
  high *= complexityFactor;

  // Size surcharge
  const maxDim = Math.max(boundingBox.x, boundingBox.y, boundingBox.z);
  const sizeFactor = maxDim > 300 ? 1.3 : maxDim > 200 ? 1.15 : maxDim > 100 ? 1.05 : 1.0;
  low *= sizeFactor;
  high *= sizeFactor;

  return { low, high };
}

type EnvelopeResult = { flag: 'ok' | 'suspect-low' | 'suspect-high'; reason: string } | null;

function checkAgainstEstimate(
  unitPrice: number,
  technology: string,
  material: string,
  geometry: QuoteGeometry
): EnvelopeResult {
  const range = getExpectedRange(geometry, technology, material);
  if (!range) return null; // can't compute — unknown technology

  // Wide safety margin: 0.5x low to 2x high
  if (unitPrice < range.low * 0.5) {
    return {
      flag: 'suspect-low',
      reason: `Price (${unitPrice.toFixed(2)}) is below expected range (${range.low.toFixed(2)}–${range.high.toFixed(2)})`,
    };
  }
  if (unitPrice > range.high * 2.0) {
    return {
      flag: 'suspect-high',
      reason: `Price (${unitPrice.toFixed(2)}) is above expected range (${range.low.toFixed(2)}–${range.high.toFixed(2)})`,
    };
  }
  return { flag: 'ok', reason: '' };
}

// --- Absolute Minimums ---

function checkAbsoluteMinimum(unitPrice: number, technology: string): EnvelopeResult {
  const techKey = Object.keys(BASE_PRICES).find(
    (k) => k.toLowerCase() === technology.toLowerCase()
      || technology.toLowerCase().includes(k.toLowerCase().split('/')[0])
  );
  const isMetal = techKey ? METAL_TECHNOLOGIES.has(techKey) : false;
  const floor = isMetal ? 10 : 1;

  if (unitPrice < floor) {
    return {
      flag: 'suspect-low',
      reason: `Price (${unitPrice.toFixed(2)}) is below absolute minimum ($${floor})`,
    };
  }
  return null;
}

// --- Combined Runner ---

function combineSignals(
  peer: PeerResult,
  estimate: EnvelopeResult,
  absolute: EnvelopeResult
): QuoteSanityResult {
  // Absolute minimum always wins
  if (absolute && absolute.flag !== 'ok') {
    return {
      flag: absolute.flag,
      confidence: 'high',
      reasons: [absolute.reason],
      userMessage: 'This price is unusually low — verify directly with the supplier before ordering.',
    };
  }

  const peerFlag = peer?.flag;
  const estFlag = estimate?.flag;
  const peerSuspect = peerFlag === 'suspect-low' || peerFlag === 'suspect-high';
  const estSuspect = estFlag === 'suspect-low' || estFlag === 'suspect-high';

  if (peerSuspect && estSuspect) {
    const flag = peer!.flag as 'suspect-low' | 'suspect-high';
    return {
      flag,
      confidence: 'high',
      reasons: [peer!.reason, estimate!.reason],
      userMessage: flag === 'suspect-low'
        ? 'This price is unusually low — verify directly with the supplier before ordering.'
        : 'This price is unusually high compared to similar quotes.',
    };
  }

  if (peerSuspect) {
    return {
      flag: peer!.flag as 'suspect-low' | 'suspect-high',
      confidence: 'medium',
      reasons: [peer!.reason],
    };
  }

  if (estSuspect) {
    return {
      flag: estimate!.flag as 'suspect-low' | 'suspect-high',
      confidence: 'medium',
      reasons: [estimate!.reason],
    };
  }

  return { flag: 'ok', confidence: 'low', reasons: [] };
}

export function runSanityChecks(
  quotes: LiveQuote[],
  geometry?: QuoteGeometry
): void {
  if (quotes.length === 0) return;

  const allPrices = quotes.map((q) => q.unitPrice);

  for (const quote of quotes) {
    const peer = checkPeerOutlier(quote.unitPrice, allPrices);
    const estimate = geometry
      ? checkAgainstEstimate(quote.unitPrice, quote.technology, quote.material, geometry)
      : null;
    const absolute = checkAbsoluteMinimum(quote.unitPrice, quote.technology);

    quote.sanityResult = combineSignals(peer, estimate, absolute);
  }
}
