import { useMutation } from '@tanstack/react-query';
import { fetchLiveQuotes } from '@/lib/api';
import type { QuoteRequest, LiveQuote, QuoteResult, Currency } from '@/lib/api/types';

interface UseLiveQuotesOptions {
  currency?: Currency;
  countryCode?: string;
}

export function useLiveQuotes(options: UseLiveQuotesOptions = {}) {
  const mutation = useMutation({
    mutationFn: async ({ file, quantity }: { file: File; quantity: number }) => {
      const request: QuoteRequest = {
        file,
        quantity,
        currency: options.currency || 'EUR',
        countryCode: options.countryCode || 'DK',
      };
      return fetchLiveQuotes(request);
    },
  });

  return {
    getQuotes: (file: File, quantity: number = 1) =>
      mutation.mutate({ file, quantity }),
    liveQuotes: mutation.data?.quotes || [] as LiveQuote[],
    results: mutation.data?.results || [] as QuoteResult[],
    hasErrors: mutation.data?.results.some((r) => r.error) || false,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
