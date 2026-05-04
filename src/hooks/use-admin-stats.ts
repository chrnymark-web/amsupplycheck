import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

const QUERY_KEY = ['admin-stats'];

async function fetchAdminStats(): Promise<AdminStats> {
  const countHead = { count: 'exact' as const, head: true };

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
    supplierTechRows,
    supplierMatRows,
    techNameRows,
    matNameRows,
    recentAppsRes,
  ] = await Promise.all([
    supabase.from('suppliers').select('*', countHead),
    supabase.from('suppliers').select('*', countHead).eq('verified', true),
    supabase.from('suppliers').select('*', countHead).eq('premium', true),
    supabase.from('suppliers').select('*', countHead).not('description', 'is', null),
    supabase.from('suppliers').select('*', countHead).not('logo_url', 'is', null),
    supabase.from('suppliers').select('*', countHead).is('location_country', null),
    supabase.from('suppliers').select('*', countHead).is('region', null),
    supabase.from('technologies').select('*', countHead).eq('hidden', false),
    supabase.from('materials').select('*', countHead).eq('hidden', false),
    supabase.from('certifications').select('*', countHead),
    supabase.from('tags').select('*', countHead),
    supabase.from('search_analytics').select('*', countHead),
    supabase.from('ai_match_analytics').select('*', countHead),
    supabase.from('supplier_applications').select('*', countHead),
    supabase.from('newsletter_signups').select('*', countHead),
    supabase.from('discovery_runs').select('*', countHead),
    supabase.from('discovery_runs').select('*', countHead).eq('status', 'completed'),
    supabase.from('discovery_runs').select('suppliers_new'),
    supabase.from('suppliers').select('location_country').not('location_country', 'is', null),
    supabase.from('supplier_technologies').select('technology_id'),
    supabase.from('supplier_materials').select('material_id'),
    supabase.from('technologies').select('id, name').eq('hidden', false),
    supabase.from('materials').select('id, name').eq('hidden', false),
    supabase
      .from('supplier_applications')
      .select('company, name, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
  ]);

  const total = suppliersTotal.count ?? 0;
  const verified = suppliersVerified.count ?? 0;

  const countriesArr = (supplierCountries.data ?? []) as { location_country: string | null }[];
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

  const techIdToName = new Map<string, string>(
    ((techNameRows.data ?? []) as { id: string; name: string }[]).map(r => [r.id, r.name]),
  );
  const matIdToName = new Map<string, string>(
    ((matNameRows.data ?? []) as { id: string; name: string }[]).map(r => [r.id, r.name]),
  );

  const techCounts = new Map<string, number>();
  for (const row of (supplierTechRows.data ?? []) as { technology_id: string }[]) {
    techCounts.set(row.technology_id, (techCounts.get(row.technology_id) ?? 0) + 1);
  }
  const topTechnologies: TopItem[] = Array.from(techCounts.entries())
    .map(([id, count]) => ({ name: techIdToName.get(id) ?? '—', count }))
    .filter(t => t.name !== '—')
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const matCounts = new Map<string, number>();
  for (const row of (supplierMatRows.data ?? []) as { material_id: string }[]) {
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

export function useAdminStats() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchAdminStats,
    staleTime: 5 * 60 * 1000,
  });
}
