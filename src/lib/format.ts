import type { Currency } from '@/lib/api/types';

export function formatPrice(amount: number, currency: Currency): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}
