import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type SupplierInventory = {
  total: number;
  verified: number;
  withDesc: number;
  withLogo: number;
  missingCountry: number;
  missingRegion: number;
};

async function fetchSupplierInventory(): Promise<SupplierInventory> {
  const countHead = { count: 'exact' as const, head: true };
  const [total, verified, withDesc, withLogo, missingCountry, missingRegion] = await Promise.all([
    supabase.from('suppliers').select('*', countHead),
    supabase.from('suppliers').select('*', countHead).eq('verified', true),
    supabase.from('suppliers').select('*', countHead).not('description', 'is', null),
    supabase.from('suppliers').select('*', countHead).not('logo_url', 'is', null),
    supabase.from('suppliers').select('*', countHead).is('location_country', null),
    supabase.from('suppliers').select('*', countHead).is('region', null),
  ]);
  return {
    total: total.count ?? 0,
    verified: verified.count ?? 0,
    withDesc: withDesc.count ?? 0,
    withLogo: withLogo.count ?? 0,
    missingCountry: missingCountry.count ?? 0,
    missingRegion: missingRegion.count ?? 0,
  };
}

export function useSupplierInventory() {
  return useQuery({
    queryKey: ['supplier-inventory'],
    queryFn: fetchSupplierInventory,
    staleTime: 10 * 60 * 1000,
  });
}
