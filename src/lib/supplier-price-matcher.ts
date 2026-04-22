import type { MatchResult } from '@/hooks/use-supplier-matching';
import type { LiveQuote, EstimatedPrice } from '@/lib/api/types';

export type SupplierPriceInfo =
  | { kind: 'live'; quote: LiveQuote }
  | { kind: 'estimate'; estimate: EstimatedPrice }
  | { kind: 'none' };

const STOP_WORDS = new Set([
  '3d',
  'printing',
  'service',
  'services',
  'online',
  'ltd',
  'inc',
  'co',
  'the',
  'on',
  'demand',
  'digital',
  'manufacturing',
]);

function tokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[–—\-()|:,.&/]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t));
}

function nameMatches(a: string, b: string): boolean {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.length === 0 || tb.length === 0) return false;
  if (ta.join(' ') === tb.join(' ')) return true;
  const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  return short.every((t) => long.includes(t));
}

export function resolvePriceInfo(
  matches: MatchResult[],
  liveQuotes: LiveQuote[],
  estimates: EstimatedPrice[]
): Map<string, SupplierPriceInfo> {
  const result = new Map<string, SupplierPriceInfo>();
  for (const m of matches) {
    const name = m.supplier.name;
    const id = m.supplier.supplier_id;

    // Prefer the cheapest live quote when multiple vendors match (edge case)
    const liveCandidates = liveQuotes.filter(
      (q) => q.supplierId === id || nameMatches(q.supplierName, name)
    );
    if (liveCandidates.length > 0) {
      const cheapest = liveCandidates.reduce((best, q) =>
        q.unitPrice < best.unitPrice ? q : best
      );
      result.set(id, { kind: 'live', quote: cheapest });
      continue;
    }

    const est = estimates.find((e) => e.supplierId === id);
    if (est) {
      result.set(id, { kind: 'estimate', estimate: est });
      continue;
    }

    result.set(id, { kind: 'none' });
  }
  return result;
}

export function sortMatchesByPrice(
  matches: MatchResult[],
  priceInfo: Map<string, SupplierPriceInfo>
): MatchResult[] {
  const tier = (id: string) => {
    const p = priceInfo.get(id);
    if (p?.kind === 'live') return 0;
    if (p?.kind === 'estimate') return 1;
    return 2;
  };
  const priceValue = (id: string) => {
    const p = priceInfo.get(id);
    if (p?.kind === 'live') return p.quote.unitPrice;
    if (p?.kind === 'estimate') return p.estimate.priceRangeLow;
    return Infinity;
  };
  return [...matches].sort((a, b) => {
    const ta = tier(a.supplier.supplier_id);
    const tb = tier(b.supplier.supplier_id);
    if (ta !== tb) return ta - tb;
    const pa = priceValue(a.supplier.supplier_id);
    const pb = priceValue(b.supplier.supplier_id);
    if (pa !== pb) return pa - pb;
    return b.score - a.score;
  });
}
