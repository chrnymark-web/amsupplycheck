import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchLiveQuotes } from '@/lib/api';
import type { QuoteRequest, LiveQuote, QuoteOption, QuoteResult, Currency, QuoteGeometry } from '@/lib/api/types';
import { filterQuotesByTech } from '@/lib/materialTechClassifier';

interface UseLiveQuotesOptions {
  currency?: Currency;
  countryCode?: string;
  /** Canonical tech key (e.g. "SLS"). Empty string = Any. */
  technology?: string;
  /** Material name substring (case-insensitive). Empty string = Any. */
  material?: string;
}

interface CachedEntry {
  // All raw quotes (one per vendor × material). The displayed list is
  // recomputed by selectBestPerVendor() whenever tech/material changes.
  rawQuotes: LiveQuote[];
  results: QuoteResult[];
  expiresAt: number;
}

// Module-scoped caches survive component remounts (e.g. switching between
// InstantQuote upload view and MatchResultView) so repeat fetches are instant.
const QUOTE_CACHE = new Map<string, CachedEntry>();
const HASH_CACHE = new WeakMap<File, Promise<string>>();
const TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 40;

async function hashFile(file: File): Promise<string> {
  let pending = HASH_CACHE.get(file);
  if (!pending) {
    pending = (async () => {
      const buf = await file.arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    })();
    HASH_CACHE.set(file, pending);
  }
  return pending;
}

// Cache key is geometry-only; tech/material are applied client-side over the
// raw set so switching filters never triggers a re-fetch.
function cacheKey(hash: string, currency: string, countryCode: string, quantity: number) {
  return `${hash}|${currency}|${countryCode}|${quantity}`;
}

function trimCache() {
  if (QUOTE_CACHE.size <= CACHE_MAX_ENTRIES) return;
  const firstKey = QUOTE_CACHE.keys().next().value;
  if (firstKey) QUOTE_CACHE.delete(firstKey);
}

// Given the full raw set, apply filters and reduce to one LiveQuote per
// supplier (cheapest matching quote). alternativeQuotes is rebuilt from the
// same raw set so the expanded row shows other materials within the chosen
// technology for that supplier.
function selectBestPerVendor(
  raw: LiveQuote[],
  tech: string,
  material: string
): LiveQuote[] {
  const filtered = filterQuotesByTech(raw, tech, material);
  const best = new Map<string, LiveQuote>();
  for (const q of filtered) {
    const cur = best.get(q.supplierId);
    if (!cur || q.unitPrice < cur.unitPrice) best.set(q.supplierId, q);
  }
  return [...best.values()].map((b) => {
    const alts: QuoteOption[] = raw
      .filter(
        (q) =>
          q.supplierId === b.supplierId &&
          q.technology === b.technology &&
          q.materialConfigId !== b.materialConfigId
      )
      .sort((x, y) => x.unitPrice - y.unitPrice)
      .slice(0, 3)
      .map((q) => ({
        material: q.material,
        materialConfigId: q.materialConfigId,
        technology: q.technology,
        unitPrice: q.unitPrice,
        totalPrice: q.totalPrice,
        estimatedLeadTimeDays: q.estimatedLeadTimeDays,
        shippingEstimate: q.shippingEstimate,
      }));
    return { ...b, alternativeQuotes: alts.length > 0 ? alts : undefined };
  });
}

export function useLiveQuotes(options: UseLiveQuotesOptions = {}) {
  const currency = options.currency || 'EUR';
  const countryCode = options.countryCode || 'DK';
  const technology = options.technology ?? '';
  const material = options.material ?? '';

  const [quotes, setQuotes] = useState<LiveQuote[]>([]);
  const [results, setResults] = useState<QuoteResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Guard against out-of-order completions from overlapping getQuotes() calls.
  const requestSeqRef = useRef(0);
  // Remember the most recent (hash, qty) so prop-triggered re-filters can hit cache.
  const lastHashRef = useRef<string | null>(null);
  const lastQtyRef = useRef<number>(1);

  const getQuotes = useCallback(
    async (file: File, quantity: number = 1, geometry?: QuoteGeometry) => {
      const seq = ++requestSeqRef.current;
      setError(null);

      try {
        const hash = await hashFile(file);
        lastHashRef.current = hash;
        lastQtyRef.current = quantity;
        const key = cacheKey(hash, currency, countryCode, quantity);
        const cached = QUOTE_CACHE.get(key);
        if (cached && cached.expiresAt > Date.now()) {
          if (seq !== requestSeqRef.current) return;
          setQuotes(selectBestPerVendor(cached.rawQuotes, technology, material));
          setResults(cached.results);
          setIsLoading(false);
          return;
        }

        // Reset previous quotes so partials from the new request render cleanly
        setQuotes([]);
        setResults([]);
        setIsLoading(true);
        const request: QuoteRequest = {
          file,
          quantity,
          currency,
          countryCode,
          geometry,
          technology: technology || undefined,
          material: material || undefined,
        };
        const data = await fetchLiveQuotes(request, (partial) => {
          if (seq !== requestSeqRef.current) return;
          // Partial handler receives the growing raw set; filter+select before render.
          setQuotes(selectBestPerVendor(partial, technology, material));
        });

        QUOTE_CACHE.set(key, {
          rawQuotes: data.quotes,
          results: data.results,
          expiresAt: Date.now() + TTL_MS,
        });
        trimCache();

        if (seq !== requestSeqRef.current) return;
        setQuotes(selectBestPerVendor(data.quotes, technology, material));
        setResults(data.results);
      } catch (err) {
        if (seq !== requestSeqRef.current) return;
        // AbortError fires when the wall-clock timeout cap trips. The partial
        // quotes already rendered via onPartial stay visible; we just stop the
        // spinner silently instead of showing a scary red error banner.
        const isAbort = err instanceof DOMException && err.name === 'AbortError';
        if (isAbort) {
          console.warn('[useLiveQuotes] live price fetch aborted by timeout');
        } else {
          setError(err as Error);
        }
      } finally {
        if (seq === requestSeqRef.current) setIsLoading(false);
      }
    },
    [currency, countryCode, technology, material]
  );

  // Re-derive the displayed set when the user changes tech/material — no re-fetch,
  // just re-filter the cached raw set.
  useEffect(() => {
    if (!lastHashRef.current) return;
    const entry = QUOTE_CACHE.get(
      cacheKey(lastHashRef.current, currency, countryCode, lastQtyRef.current)
    );
    if (!entry || entry.expiresAt < Date.now()) return;
    setQuotes(selectBestPerVendor(entry.rawQuotes, technology, material));
  }, [technology, material, currency, countryCode]);

  return {
    getQuotes,
    liveQuotes: quotes,
    results,
    hasErrors: results.some((r) => r.error),
    isLoading,
    error,
  };
}
