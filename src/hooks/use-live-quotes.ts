import { useMutation } from '@tanstack/react-query';
import { fetchLiveQuotes } from '@/lib/api';
import type { QuoteRequest, LiveQuote, QuoteResult, Currency, QuoteGeometry } from '@/lib/api/types';

interface UseLiveQuotesOptions {
  currency?: Currency;
  countryCode?: string;
}

export function useLiveQuotes(options: UseLiveQuotesOptions = {}) {
  const mutation = useMutation({
    mutationFn: async ({ file, quantity, geometry }: { file: File; quantity: number; geometry?: QuoteGeometry }) => {
      const request: QuoteRequest = {
        file,
        quantity,
        currency: options.currency || 'EUR',
        countryCode: options.countryCode || 'DK',
        geometry,
      };
      return fetchLiveQuotes(request);
    },
  });

  return {
    getQuotes: (file: File, quantity: number = 1, geometry?: QuoteGeometry) =>
      mutation.mutate({ file, quantity, geometry }),
    liveQuotes: mutation.data?.quotes || [] as LiveQuote[],
    results: mutation.data?.results || [] as QuoteResult[],
    hasErrors: mutation.data?.results.some((r) => r.error) || false,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
