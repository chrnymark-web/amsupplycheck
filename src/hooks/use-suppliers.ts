import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GalleryImage {
  url: string;
  alt: string;
  caption?: string;
}

export interface DescriptionExtended {
  overview?: string;
  unique_value?: string;
  industries_served?: string[];
  certifications?: string[];
  capacity_notes?: string;
  pros?: string[];
  cons?: string[];
  price_range?: string;
  partnerships?: string[];
}

export interface SupplierListItem {
  id: string;
  supplier_id: string;
  name: string;
  website: string | null;
  description: string | null;
  description_extended?: DescriptionExtended | null;
  location_city: string | null;
  location_country: string | null;
  location_lat: number | null;
  location_lng: number | null;
  verified: boolean;
  premium: boolean;
  is_partner: boolean;
  instant_quote_url: string | null;
  logo_url: string | null;
  hero_image_url?: string | null;
  gallery_images?: GalleryImage[] | null;
  technologies: { id: string; name: string; slug: string; category: string | null }[];
  materials: { id: string; name: string; slug: string; category: string | null }[];
  certifications: { id: string; name: string; slug: string }[];
  tags: { id: string; name: string; slug: string; category: string | null }[];
  country: { id: string; name: string; code: string | null; region: string | null } | null;
}

export interface FilterOptions {
  technologies: { id: string; name: string; slug: string; category: string | null; count: number }[];
  materials: { id: string; name: string; slug: string; category: string | null; count: number }[];
  certifications: { id: string; name: string; slug: string; count: number }[];
  tags: { id: string; name: string; slug: string; category: string | null; count: number }[];
  countries: { id: string; name: string; code: string | null; region: string | null; count: number }[];
}

export interface SupplierFilters {
  technologies?: string[];
  materials?: string[];
  certifications?: string[];
  tags?: string[];
  countries?: string[];
  search?: string;
}

// Fetch all suppliers with their relational data
async function fetchSuppliers(): Promise<SupplierListItem[]> {
  // Fetch suppliers
  const { data: suppliers, error: supError } = await supabase
    .from('suppliers')
    .select('id, supplier_id, name, website, description, location_city, location_country, location_lat, location_lng, verified, premium, is_partner, logo_url, country_id, metadata')
    .eq('verified', true)
    .order('is_partner', { ascending: false })
    .order('name');

  if (supError) throw supError;

  // Fetch all join data in parallel
  const [techRes, matRes, certRes, tagRes, techList, matList, certList, tagList, countryList] = await Promise.all([
    supabase.from('supplier_technologies').select('supplier_id, technology_id'),
    supabase.from('supplier_materials').select('supplier_id, material_id'),
    supabase.from('supplier_certifications').select('supplier_id, certification_id'),
    supabase.from('supplier_tags').select('supplier_id, tag_id'),
    supabase.from('technologies').select('id, name, slug, category'),
    supabase.from('materials').select('id, name, slug, category'),
    supabase.from('certifications').select('id, name, slug'),
    supabase.from('tags').select('id, name, slug, category'),
    supabase.from('countries').select('id, name, code, region'),
  ]);

  // Build lookup maps
  const techMap = new Map((techList.data || []).map(t => [t.id, t]));
  const matMap = new Map((matList.data || []).map(m => [m.id, m]));
  const certMap = new Map((certList.data || []).map(c => [c.id, c]));
  const tagMap = new Map((tagList.data || []).map(t => [t.id, t]));
  const countryMap = new Map((countryList.data || []).map(c => [c.id, c]));

  // Build supplier-to-relation maps
  const supTechs = new Map<string, typeof techList.data>();
  (techRes.data || []).forEach(st => {
    const tech = techMap.get(st.technology_id);
    if (tech) {
      if (!supTechs.has(st.supplier_id)) supTechs.set(st.supplier_id, []);
      supTechs.get(st.supplier_id)!.push(tech);
    }
  });

  const supMats = new Map<string, typeof matList.data>();
  (matRes.data || []).forEach(sm => {
    const mat = matMap.get(sm.material_id);
    if (mat) {
      if (!supMats.has(sm.supplier_id)) supMats.set(sm.supplier_id, []);
      supMats.get(sm.supplier_id)!.push(mat);
    }
  });

  const supCerts = new Map<string, typeof certList.data>();
  (certRes.data || []).forEach(sc => {
    const cert = certMap.get(sc.certification_id);
    if (cert) {
      if (!supCerts.has(sc.supplier_id)) supCerts.set(sc.supplier_id, []);
      supCerts.get(sc.supplier_id)!.push(cert);
    }
  });

  const supTags = new Map<string, typeof tagList.data>();
  (tagRes.data || []).forEach(st => {
    const tag = tagMap.get(st.tag_id);
    if (tag) {
      if (!supTags.has(st.supplier_id)) supTags.set(st.supplier_id, []);
      supTags.get(st.supplier_id)!.push(tag);
    }
  });

  return (suppliers || []).map(s => ({
    id: s.id,
    supplier_id: s.supplier_id,
    name: s.name,
    website: s.website,
    description: s.description,
    location_city: s.location_city,
    location_country: s.location_country,
    location_lat: s.location_lat,
    location_lng: s.location_lng,
    verified: s.verified ?? false,
    premium: s.premium ?? false,
    is_partner: s.is_partner ?? false,
    instant_quote_url: ((s as { metadata?: Record<string, unknown> | null }).metadata as Record<string, unknown> | null)?.instant_quote_url as string ?? null,
    logo_url: s.logo_url,
    technologies: supTechs.get(s.id) || [],
    materials: supMats.get(s.id) || [],
    certifications: supCerts.get(s.id) || [],
    tags: supTags.get(s.id) || [],
    country: s.country_id ? countryMap.get(s.country_id) || null : null,
  }));
}

// Apply filters client-side for instant responsiveness
function applyFilters(suppliers: SupplierListItem[], filters: SupplierFilters): SupplierListItem[] {
  return suppliers.filter(s => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const match = s.name.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.location_city?.toLowerCase().includes(q) ||
        s.location_country?.toLowerCase().includes(q) ||
        s.technologies.some(t => t.name.toLowerCase().includes(q)) ||
        s.materials.some(m => m.name.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (filters.technologies?.length) {
      const hasTech = filters.technologies.some(slug =>
        s.technologies.some(t => t.slug === slug)
      );
      if (!hasTech) return false;
    }

    if (filters.materials?.length) {
      const hasMat = filters.materials.some(slug =>
        s.materials.some(m => m.slug === slug)
      );
      if (!hasMat) return false;
    }

    if (filters.certifications?.length) {
      const hasCert = filters.certifications.some(slug =>
        s.certifications.some(c => c.slug === slug)
      );
      if (!hasCert) return false;
    }

    if (filters.tags?.length) {
      const hasTag = filters.tags.some(slug =>
        s.tags.some(t => t.slug === slug)
      );
      if (!hasTag) return false;
    }

    if (filters.countries?.length) {
      const hasCountry = filters.countries.some(slug =>
        s.country?.name === slug || s.location_country === slug
      );
      if (!hasCountry) return false;
    }

    return true;
  });
}

// Compute dynamic filter options with counts from filtered data
function computeFilterOptions(suppliers: SupplierListItem[]): FilterOptions {
  const techCounts = new Map<string, { item: FilterOptions['technologies'][0]; count: number }>();
  const matCounts = new Map<string, { item: FilterOptions['materials'][0]; count: number }>();
  const certCounts = new Map<string, { item: FilterOptions['certifications'][0]; count: number }>();
  const tagCounts = new Map<string, { item: FilterOptions['tags'][0]; count: number }>();
  const countryCounts = new Map<string, { item: FilterOptions['countries'][0]; count: number }>();

  suppliers.forEach(s => {
    s.technologies.forEach(t => {
      const existing = techCounts.get(t.slug);
      if (existing) existing.count++;
      else techCounts.set(t.slug, { item: { ...t, count: 1 }, count: 1 });
    });
    s.materials.forEach(m => {
      const existing = matCounts.get(m.slug);
      if (existing) existing.count++;
      else matCounts.set(m.slug, { item: { ...m, count: 1 }, count: 1 });
    });
    s.certifications.forEach(c => {
      const existing = certCounts.get(c.slug);
      if (existing) existing.count++;
      else certCounts.set(c.slug, { item: { ...c, count: 1 }, count: 1 });
    });
    s.tags.forEach(t => {
      const existing = tagCounts.get(t.slug);
      if (existing) existing.count++;
      else tagCounts.set(t.slug, { item: { ...t, count: 1 }, count: 1 });
    });
    const countryName = s.country?.name || s.location_country;
    if (countryName) {
      const existing = countryCounts.get(countryName);
      if (existing) existing.count++;
      else countryCounts.set(countryName, {
        item: {
          id: s.country?.id || countryName,
          name: countryName,
          code: s.country?.code || null,
          region: s.country?.region || null,
          count: 1
        },
        count: 1
      });
    }
  });

  return {
    technologies: [...techCounts.values()].map(v => ({ ...v.item, count: v.count })).sort((a, b) => b.count - a.count),
    materials: [...matCounts.values()].map(v => ({ ...v.item, count: v.count })).sort((a, b) => b.count - a.count),
    certifications: [...certCounts.values()].map(v => ({ ...v.item, count: v.count })).sort((a, b) => b.count - a.count),
    tags: [...tagCounts.values()].map(v => ({ ...v.item, count: v.count })).sort((a, b) => b.count - a.count),
    countries: [...countryCounts.values()].map(v => ({ ...v.item, count: v.count })).sort((a, b) => b.count - a.count),
  };
}

export function useSuppliers(filters: SupplierFilters = {}) {
  const allSuppliersQuery = useQuery({
    queryKey: ['suppliers-relational'],
    queryFn: fetchSuppliers,
    staleTime: 5 * 60 * 1000,
  });

  const allSuppliers = allSuppliersQuery.data || [];
  const filtered = applyFilters(allSuppliers, filters);
  const filterOptions = computeFilterOptions(allSuppliers);

  return {
    suppliers: filtered,
    allSuppliers,
    filterOptions,
    isLoading: allSuppliersQuery.isLoading,
    error: allSuppliersQuery.error,
  };
}

// Fetch a single supplier with full detail
export function useSupplierDetail(supplierSlug: string) {
  return useQuery({
    queryKey: ['supplier-detail', supplierSlug],
    queryFn: async (): Promise<SupplierListItem | null> => {
      // Try to find by supplier_id first
      const { data: supplier, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('supplier_id', supplierSlug)
        .eq('verified', true)
        .maybeSingle();

      if (error) throw error;

      // Fallback: try matching Craftcloud vendor ID or URL slug in metadata
      let resolvedSupplier = supplier;
      if (!resolvedSupplier) {
        const cleanSlug = supplierSlug.replace(/^craftcloud-/, '');
        const { data: ccSupplier } = await supabase
          .from('suppliers')
          .select('*')
          .eq('verified', true)
          .or(`metadata->>craftcloud_vendor_id.eq.${cleanSlug},metadata->>craftcloud_url_slug.eq.${supplierSlug}`)
          .maybeSingle();
        resolvedSupplier = ccSupplier;
      }
      if (!resolvedSupplier) return null;

      // Fetch relations in parallel
      const [techRes, matRes, certRes, tagRes] = await Promise.all([
        supabase.from('supplier_technologies').select('technology_id').eq('supplier_id', resolvedSupplier.id),
        supabase.from('supplier_materials').select('material_id').eq('supplier_id', resolvedSupplier.id),
        supabase.from('supplier_certifications').select('certification_id').eq('supplier_id', resolvedSupplier.id),
        supabase.from('supplier_tags').select('tag_id').eq('supplier_id', resolvedSupplier.id),
      ]);

      // Fetch entity details
      const techIds = (techRes.data || []).map(t => t.technology_id);
      const matIds = (matRes.data || []).map(m => m.material_id);
      const certIds = (certRes.data || []).map(c => c.certification_id);
      const tagIds = (tagRes.data || []).map(t => t.tag_id);

      const [techs, mats, certs, tags, country] = await Promise.all([
        techIds.length ? supabase.from('technologies').select('*').in('id', techIds) : { data: [] },
        matIds.length ? supabase.from('materials').select('*').in('id', matIds) : { data: [] },
        certIds.length ? supabase.from('certifications').select('*').in('id', certIds) : { data: [] },
        tagIds.length ? supabase.from('tags').select('*').in('id', tagIds) : { data: [] },
        resolvedSupplier.country_id ? supabase.from('countries').select('*').eq('id', resolvedSupplier.country_id).maybeSingle() : { data: null },
      ]);

      return {
        id: resolvedSupplier.id,
        supplier_id: resolvedSupplier.supplier_id,
        name: resolvedSupplier.name,
        website: resolvedSupplier.website,
        description: resolvedSupplier.description,
        description_extended: (resolvedSupplier as Record<string, unknown>).description_extended as DescriptionExtended | null ?? null,
        location_city: resolvedSupplier.location_city,
        location_country: resolvedSupplier.location_country,
        location_lat: resolvedSupplier.location_lat ? Number(resolvedSupplier.location_lat) : null,
        location_lng: resolvedSupplier.location_lng ? Number(resolvedSupplier.location_lng) : null,
        verified: resolvedSupplier.verified ?? false,
        premium: resolvedSupplier.premium ?? false,
        is_partner: resolvedSupplier.is_partner ?? false,
        instant_quote_url: (resolvedSupplier.metadata as Record<string, unknown> | null)?.instant_quote_url as string ?? null,
        logo_url: resolvedSupplier.logo_url,
        hero_image_url: ((resolvedSupplier as Record<string, unknown>).hero_image_url as string | null) ?? null,
        gallery_images: ((resolvedSupplier as Record<string, unknown>).gallery_images as GalleryImage[] | null) ?? null,
        technologies: (techs.data || []) as any[],
        materials: (mats.data || []) as any[],
        certifications: (certs.data || []) as any[],
        tags: (tags.data || []) as any[],
        country: country.data as any,
      };
    },
    enabled: !!supplierSlug,
  });
}
