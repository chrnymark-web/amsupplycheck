import type { MatchResult } from '@/hooks/use-supplier-matching';
import type { LiveQuote, EstimatedPrice } from '@/lib/api/types';

export type SupplierPriceInfo =
  | { kind: 'live'; quote: LiveQuote }
  | { kind: 'estimate'; estimate: EstimatedPrice }
  | { kind: 'none' };

// Envelope returned alongside the result map so callers can pass it back as
// `prev` on the next call to skip per-match name-matching for matches whose
// outcome cannot have changed since the last run. See `resolvePriceInfo`.
export type PriceInfoCache = {
  result: Map<string, SupplierPriceInfo>;
  liveQuotes: LiveQuote[];
};

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

function nameMatchesTokens(ta: string[], tb: string[]): boolean {
  if (ta.length === 0 || tb.length === 0) return false;
  const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  for (const t of short) {
    if (!long.includes(t)) return false;
  }
  return true;
}

// Build a cheapest-per-vendor-name index. Multiple LiveQuotes may share a
// vendor name (different colors/finishes); we collapse to the cheapest so
// the diff vs prev only flags vendors whose best price actually changed.
function indexByVendor(quotes: LiveQuote[]): Map<string, number> {
  const idx = new Map<string, number>();
  for (const q of quotes) {
    const cur = idx.get(q.supplierName);
    if (cur === undefined || q.unitPrice < cur) idx.set(q.supplierName, q.unitPrice);
  }
  return idx;
}

export function resolvePriceInfo(
  matches: MatchResult[],
  liveQuotes: LiveQuote[],
  estimates: EstimatedPrice[],
  prev?: PriceInfoCache | null
): Map<string, SupplierPriceInfo> {
  // Per-call token caches. Without these, nameMatches re-tokenises both sides
  // on every (match, quote) pair — that's the dominant cost of the O(N×M)
  // cross-product. Tokenising each name at most once turns the inner loop
  // into pure `Array.includes` checks.
  const matchTokenCache = new Map<string, string[]>();
  const quoteTokenCache = new Map<string, string[]>();
  const matchToks = (id: string, name: string) => {
    let t = matchTokenCache.get(id);
    if (t === undefined) {
      t = tokens(name);
      matchTokenCache.set(id, t);
    }
    return t;
  };
  const quoteToks = (name: string) => {
    let t = quoteTokenCache.get(name);
    if (t === undefined) {
      t = tokens(name);
      quoteTokenCache.set(name, t);
    }
    return t;
  };

  // Diff against prev: which vendor names appeared, disappeared, or changed
  // their cheapest unitPrice since last call? Only those vendors can flip a
  // match's outcome — every other match can reuse its prior result.
  const changedVendors = new Set<string>();
  if (prev) {
    const prevIdx = indexByVendor(prev.liveQuotes);
    const currIdx = indexByVendor(liveQuotes);
    for (const [name, price] of currIdx) {
      if (prevIdx.get(name) !== price) changedVendors.add(name);
    }
    for (const name of prevIdx.keys()) {
      if (!currIdx.has(name)) changedVendors.add(name);
    }
  }

  const result = new Map<string, SupplierPriceInfo>();

  for (const m of matches) {
    const id = m.supplier.supplier_id;
    const name = m.supplier.name;
    const priorEntry = prev?.result.get(id);

    // Fast reuse path. Two cases:
    // (a) prior was 'live' — reuse if its quote is still present unchanged AND
    //     no changed vendor could now beat it for this match.
    // (b) prior was 'estimate' or 'none' — reuse if no changed vendor could
    //     now match this supplier (i.e. introduce a new live quote).
    if (priorEntry && prev) {
      let canReuse = true;

      if (priorEntry.kind === 'live') {
        const stillThere = liveQuotes.some(
          (q) =>
            q.supplierId === priorEntry.quote.supplierId &&
            q.supplierName === priorEntry.quote.supplierName &&
            q.unitPrice === priorEntry.quote.unitPrice
        );
        if (!stillThere) {
          canReuse = false;
        }
      }

      if (canReuse) {
        // Check whether any changed vendor could affect this match.
        for (const v of changedVendors) {
          // Only a quote priced lower than the prior live (or any quote at all,
          // if prior wasn't live) can flip the outcome.
          for (const q of liveQuotes) {
            if (q.supplierName !== v) continue;
            if (priorEntry.kind === 'live' && q.unitPrice >= priorEntry.quote.unitPrice) {
              continue;
            }
            // Could this vendor's quote match this supplier?
            if (q.supplierId === id || nameMatchesTokens(matchToks(id, name), quoteToks(q.supplierName))) {
              canReuse = false;
              break;
            }
          }
          if (!canReuse) break;
        }
      }

      if (canReuse) {
        result.set(id, priorEntry);
        continue;
      }
    }

    // Slow path: full recompute for this match. Still uses the per-call token
    // caches above so we never tokenise the same name twice within one call.
    const mt = matchToks(id, name);
    let cheapest: LiveQuote | null = null;
    for (const q of liveQuotes) {
      if (q.supplierId === id || nameMatchesTokens(mt, quoteToks(q.supplierName))) {
        if (!cheapest || q.unitPrice < cheapest.unitPrice) cheapest = q;
      }
    }
    if (cheapest) {
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
