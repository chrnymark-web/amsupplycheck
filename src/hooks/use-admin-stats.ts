import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DateRange } from '@/components/admin/date-range-picker';

export type TopItem = { name: string; count: number };

export type RecentApplication = {
  company: string;
  name: string;
  date: string;
};

export type AdminStats = {
  suppliers: {
    total: number;
    verified: number;
    premium: number;
    withDesc: number;
    withLogo: number;
    missingCountry: number;
    missingRegion: number;
  };
  technologies: number;
  materials: number;
  certifications: number;
  countries: number;
  tags: number;
  searches: number;
  aiMatches: number;
  applications: number;
  newsletterSignups: number;
  discoveryRuns: number;
  discoveryRunsCompleted: number;
  newFromDiscovery: number;
  topCountries: TopItem[];
  topTechnologies: TopItem[];
  topMaterials: TopItem[];
  recentApplications: RecentApplication[];
};

async function fetchAdminStats(range: DateRange): Promise<AdminStats> {
  const countHead = { count: 'exact' as const, head: true };
  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();

  const inRange = <T extends { gte: any; lte: any }>(q: T, column = 'created_at'): T => {
    return q.gte(column, fromIso).lte(column, toIso) as T;
  };

  const [
    suppliersTotal,
    suppliersVerified,
    suppliersPremium,
    suppliersWithDesc,
    suppliersWithLogo,
    suppliersMissingCountry,
    suppliersMissingRegion,
    technologiesCount,
    materialsCount,
    certificationsCount,
    tagsCount,
    searchesCount,
    aiMatchesCount,
    applicationsCount,
    newsletterCount,
    discoveryRunsTotal,
    discoveryRunsCompleted,
    discoveryNewSum,
    supplierCountries,
    supplierIdsInRange,
    techNameRows,
    matNameRows,
    recentAppsRes,
  ] = await Promise.all([
    inRange(supabase.from('suppliers').select('*', countHead)),
    inRange(supabase.from('suppliers').select('*', countHead)).eq('verified', true),
    inRange(supabase.from('suppliers').select('*', countHead)).eq('premium', true),
    inRange(supabase.from('suppliers').select('*', countHead)).not('description', 'is', null),
    inRange(supabase.from('suppliers').select('*', countHead)).not('logo_url', 'is', null),
    inRange(supabase.from('suppliers').select('*', countHead)).is('location_country', null),
    inRange(supabase.from('suppliers').select('*', countHead)).is('region', null),
    supabase.from('technologies').select('*', countHead).eq('hidden', false),
    supabase.from('materials').select('*', countHead).eq('hidden', false),
    supabase.from('certifications').select('*', countHead),
    supabase.from('tags').select('*', countHead),
    inRange(supabase.from('search_analytics').select('*', countHead)),
    inRange(supabase.from('ai_match_analytics').select('*', countHead)),
    inRange(supabase.from('supplier_applications').select('*', countHead)),
    inRange(supabase.from('newsletter_signups').select('*', countHead)),
    inRange(supabase.from('discovery_runs').select('*', countHead), 'started_at'),
    inRange(supabase.from('discovery_runs').select('*', countHead), 'started_at').eq('status', 'completed'),
    inRange(supabase.from('discovery_runs').select('suppliers_new'), 'started_at'),
    inRange(supabase.from('suppliers').select('id, location_country').not('location_country', 'is', null)),
    inRange(supabase.from('suppliers').select('id')),
    supabase.from('technologies').select('id, name').eq('hidden', false),
    supabase.from('materials').select('id, name').eq('hidden', false),
    inRange(
      supabase
        .from('supplier_applications')
        .select('company, name, created_at')
        .order('created_at', { ascending: false })
        .limit(8),
    ),
  ]);

  const total = suppliersTotal.count ?? 0;
  const verified = suppliersVerified.count ?? 0;

  const countriesArr = (supplierCountries.data ?? []) as { id: string; location_country: string | null }[];
  const countryCounts = new Map<string, number>();
  for (const row of countriesArr) {
    const name = row.location_country?.trim();
    if (!name) continue;
    countryCounts.set(name, (countryCounts.get(name) ?? 0) + 1);
  }
  const topCountries: TopItem[] = Array.from(countryCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const supplierIds = new Set(((supplierIdsInRange.data ?? []) as { id: string }[]).map(s => s.id));

  const [techJoinRes, matJoinRes] = supplierIds.size > 0
    ? await Promise.all([
        supabase
          .from('supplier_technologies')
          .select('technology_id, supplier_id')
          .in('supplier_id', Array.from(supplierIds)),
        supabase
          .from('supplier_materials')
          .select('material_id, supplier_id')
          .in('supplier_id', Array.from(supplierIds)),
      ])
    : [{ data: [] as { technology_id: string; supplier_id: string }[] }, { data: [] as { material_id: string; supplier_id: string }[] }];

  const techIdToName = new Map<string, string>(
    ((techNameRows.data ?? []) as { id: string; name: string }[]).map(r => [r.id, r.name]),
  );
  const matIdToName = new Map<string, string>(
    ((matNameRows.data ?? []) as { id: string; name: string }[]).map(r => [r.id, r.name]),
  );

  const techCounts = new Map<string, number>();
  for (const row of (techJoinRes.data ?? []) as { technology_id: string }[]) {
    techCounts.set(row.technology_id, (techCounts.get(row.technology_id) ?? 0) + 1);
  }
  const topTechnologies: TopItem[] = Array.from(techCounts.entries())
    .map(([id, count]) => ({ name: techIdToName.get(id) ?? '—', count }))
    .filter(t => t.name !== '—')
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const matCounts = new Map<string, number>();
  for (const row of (matJoinRes.data ?? []) as { material_id: string }[]) {
    matCounts.set(row.material_id, (matCounts.get(row.material_id) ?? 0) + 1);
  }
  const topMaterials: TopItem[] = Array.from(matCounts.entries())
    .map(([id, count]) => ({ name: matIdToName.get(id) ?? '—', count }))
    .filter(m => m.name !== '—')
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const newFromDiscovery = ((discoveryNewSum.data ?? []) as { suppliers_new: number | null }[])
    .reduce((sum, r) => sum + (r.suppliers_new ?? 0), 0);

  const recentApplications: RecentApplication[] = (
    (recentAppsRes.data ?? []) as { company: string; name: string; created_at: string }[]
  ).map(a => ({
    company: a.company,
    name: a.name,
    date: a.created_at?.slice(0, 10) ?? '',
  }));

  return {
    suppliers: {
      total,
      verified,
      premium: suppliersPremium.count ?? 0,
      withDesc: suppliersWithDesc.count ?? 0,
      withLogo: suppliersWithLogo.count ?? 0,
      missingCountry: suppliersMissingCountry.count ?? 0,
      missingRegion: suppliersMissingRegion.count ?? 0,
    },
    technologies: technologiesCount.count ?? 0,
    materials: materialsCount.count ?? 0,
    certifications: certificationsCount.count ?? 0,
    countries: countryCounts.size,
    tags: tagsCount.count ?? 0,
    searches: searchesCount.count ?? 0,
    aiMatches: aiMatchesCount.count ?? 0,
    applications: applicationsCount.count ?? 0,
    newsletterSignups: newsletterCount.count ?? 0,
    discoveryRuns: discoveryRunsTotal.count ?? 0,
    discoveryRunsCompleted: discoveryRunsCompleted.count ?? 0,
    newFromDiscovery,
    topCountries,
    topTechnologies,
    topMaterials,
    recentApplications,
  };
}

export function useAdminStats(range: DateRange) {
  return useQuery({
    queryKey: ['admin-stats', range.from.toISOString(), range.to.toISOString()],
    queryFn: () => fetchAdminStats(range),
    staleTime: 5 * 60 * 1000,
  });
}
