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

function nameMatchesTokens(ta: string[], tb: string[]): boolean {
  if (ta.length === 0 || tb.length === 0) return false;
  const [short, long] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  for (const t of short) {
    if (!long.includes(t)) return false;
  }
  return true;
}

export function resolvePriceInfo(
  matches: MatchResult[],
  liveQuotes: LiveQuote[],
  estimates: EstimatedPrice[]
): Map<string, SupplierPriceInfo> {
  // Two-pass approach. The Craftcloud → SupplyCheck UUID mapping (commit
  // 42d9aa8) means most quotes already carry the canonical supplier_id, so the
  // O(matches × liveQuotes) name-matching cross-product the prior cache tried
  // to skip can be replaced by O(matches) direct lookups. Only quotes that
  // lack a real UUID fall through to the fuzzy token matcher, and there are
  // typically ~12 of those vs ~87 mapped.
  const byId = new Map<string, LiveQuote>();
  const fuzzyQuotes: LiveQuote[] = [];
  for (const q of liveQuotes) {
    // Synthetic IDs from craftcloud.ts have the shape `craftcloud-<slug>` and
    // can never collide with a SupplyCheck UUID, so we route them through the
    // fuzzy path. A real UUID is authoritative — we no longer also name-match
    // it against other suppliers, which closes a latent false-positive vector.
    if (q.supplierId && !q.supplierId.startsWith('craftcloud-')) {
      const cur = byId.get(q.supplierId);
      if (cur === undefined || q.unitPrice < cur.unitPrice) byId.set(q.supplierId, q);
    } else {
      fuzzyQuotes.push(q);
    }
  }

  // Pre-tokenise the fuzzy quotes once, not once per match.
  const fuzzyToks = fuzzyQuotes.map((q) => ({ q, toks: tokens(q.supplierName) }));

  const estimateById = new Map<string, EstimatedPrice>();
  for (const e of estimates) estimateById.set(e.supplierId, e);

  const result = new Map<string, SupplierPriceInfo>();

  for (const m of matches) {
    const id = m.supplier.supplier_id;

    // Paying partners route conversions through their own quote portal, so we
    // never show a Craftcloud-mediated price on their card. Skip the live
    // lookup and resolve them directly to estimate-or-none.
    if (m.supplier.is_partner) {
      const est = estimateById.get(id);
      result.set(id, est ? { kind: 'estimate', estimate: est } : { kind: 'none' });
      continue;
    }

    let cheapest: LiveQuote | null = byId.get(id) ?? null;

    if (fuzzyToks.length > 0) {
      const mt = tokens(m.supplier.name);
      for (const f of fuzzyToks) {
        if (nameMatchesTokens(mt, f.toks)) {
          if (cheapest === null || f.q.unitPrice < cheapest.unitPrice) cheapest = f.q;
        }
      }
    }

    if (cheapest !== null) {
      result.set(id, { kind: 'live', quote: cheapest });
      continue;
    }

    const est = estimateById.get(id);
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
    // Paying partners pinned to top, ahead of every other tier.
    const ap = a.supplier.is_partner ? 0 : 1;
    const bp = b.supplier.is_partner ? 0 : 1;
    if (ap !== bp) return ap - bp;
    const ta = tier(a.supplier.supplier_id);
    const tb = tier(b.supplier.supplier_id);
    if (ta !== tb) return ta - tb;
    const pa = priceValue(a.supplier.supplier_id);
    const pb = priceValue(b.supplier.supplier_id);
    if (pa !== pb) return pa - pb;
    return b.score - a.score;
  });
}
