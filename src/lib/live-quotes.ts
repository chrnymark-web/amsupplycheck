// Live quotes aggregator — Craftcloud-only port for Next.js.
// Treatstock from the Vite codebase is skipped (gated by VITE_TREATSTOCK_API_KEY,
// which is unset in prod). If revived later, add a second branch here.

import type { QuoteRequest, QuoteResult, LiveQuote } from '@/lib/quote-types';
import { getCraftcloudQuotes } from '@/lib/craftcloud';
import { runSanityChecks } from '@/lib/quote-sanity';

export async function fetchLiveQuotes(
  request: QuoteRequest,
  onPartial?: (quotes: LiveQuote[]) => void,
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

  try {
    const quotes = await getCraftcloudQuotes(request, partialHandler);
    results.push({ supplier: 'Craftcloud', source: 'craftcloud', quotes });
    const sorted = [...quotes].sort((a, b) => a.unitPrice - b.unitPrice);
    runSanityChecks(sorted, request.geometry);
    return { quotes: sorted, results };
  } catch (err) {
    console.error('[live-quotes] Craftcloud failed:', err);
    results.push({
      supplier: 'Craftcloud',
      source: 'craftcloud',
      quotes: [],
      error: (err as Error)?.message,
    });
    return { quotes: [], results };
  }
}
