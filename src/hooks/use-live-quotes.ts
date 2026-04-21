import { useCallback, useRef, useState } from 'react';
import { fetchLiveQuotes } from '@/lib/api';
import type { QuoteRequest, LiveQuote, QuoteResult, Currency, QuoteGeometry } from '@/lib/api/types';

interface UseLiveQuotesOptions {
  currency?: Currency;
  countryCode?: string;
}

interface CachedEntry {
  quotes: LiveQuote[];
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

function cacheKey(hash: string, currency: string, countryCode: string, quantity: number) {
  return `${hash}|${currency}|${countryCode}|${quantity}`;
}

function trimCache() {
  if (QUOTE_CACHE.size <= CACHE_MAX_ENTRIES) return;
  // Drop oldest entry (insertion order is preserved by Map)
  const firstKey = QUOTE_CACHE.keys().next().value;
  if (firstKey) QUOTE_CACHE.delete(firstKey);
}

export function useLiveQuotes(options: UseLiveQuotesOptions = {}) {
  const currency = options.currency || 'EUR';
  const countryCode = options.countryCode || 'DK';

  const [quotes, setQuotes] = useState<LiveQuote[]>([]);
  const [results, setResults] = useState<QuoteResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Guard against out-of-order completions from overlapping getQuotes() calls.
  const requestSeqRef = useRef(0);

  const getQuotes = useCallback(
    async (file: File, quantity: number = 1, geometry?: QuoteGeometry) => {
      const seq = ++requestSeqRef.current;
      setError(null);

      try {
        const hash = await hashFile(file);
        const key = cacheKey(hash, currency, countryCode, quantity);
        const cached = QUOTE_CACHE.get(key);
        if (cached && cached.expiresAt > Date.now()) {
          if (seq !== requestSeqRef.current) return;
          setQuotes(cached.quotes);
          setResults(cached.results);
          setIsLoading(false);
          return;
        }

        // Reset previous quotes so partials from the new request render cleanly
        setQuotes([]);
        setResults([]);
        setIsLoading(true);
        const request: QuoteRequest = { file, quantity, currency, countryCode, geometry };
        const data = await fetchLiveQuotes(request, (partial) => {
          if (seq !== requestSeqRef.current) return;
          setQuotes(partial);
        });

        QUOTE_CACHE.set(key, {
          quotes: data.quotes,
          results: data.results,
          expiresAt: Date.now() + TTL_MS,
        });
        trimCache();

        if (seq !== requestSeqRef.current) return;
        setQuotes(data.quotes);
        setResults(data.results);
      } catch (err) {
        if (seq !== requestSeqRef.current) return;
        setError(err as Error);
      } finally {
        if (seq === requestSeqRef.current) setIsLoading(false);
      }
    },
    [currency, countryCode]
  );

  return {
    getQuotes,
    liveQuotes: quotes,
    results,
    hasErrors: results.some((r) => r.error),
    isLoading,
    error,
  };
}
