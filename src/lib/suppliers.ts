import { cache } from "react";
import { createStaticClient } from "@/lib/supabase/static";

export interface GalleryImage {
  url: string;
  alt: string;
  caption?: string;
}

export interface NotableProject {
  title: string;
  description: string;
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
  notable_projects?: NotableProject[];
  equipment?: string[];
  build_envelopes?: string;
}

export interface SupplierTaxonomy {
  id: string;
  name: string;
  slug: string;
  category?: string | null;
}

export interface SupplierCountry {
  id: string;
  name: string;
  code: string | null;
  region: string | null;
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
  technologies: SupplierTaxonomy[];
  materials: SupplierTaxonomy[];
  certifications: { id: string; name: string; slug: string }[];
  tags: SupplierTaxonomy[];
  country: SupplierCountry | null;
}

interface SupplierRow {
  id: string;
  supplier_id: string;
  name: string;
  website: string | null;
  description: string | null;
  location_city: string | null;
  location_country: string | null;
  location_lat: number | string | null;
  location_lng: number | string | null;
  verified: boolean | null;
  premium: boolean | null;
  is_partner: boolean | null;
  logo_url: string | null;
  country_id: string | null;
  metadata: Record<string, unknown> | null;
  hero_image_url?: string | null;
  gallery_images?: GalleryImage[] | null;
  description_extended?: DescriptionExtended | null;
}

export const getSupplier = cache(async (slug: string): Promise<SupplierListItem | null> => {
  const supabase = createStaticClient();

  const { data: supplier, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("supplier_id", slug)
    .eq("verified", true)
    .maybeSingle();

  if (error) throw error;

  let resolved: SupplierRow | null = supplier as SupplierRow | null;
  if (!resolved) {
    const cleanSlug = slug.replace(/^craftcloud-/, "");
    const { data: cc } = await supabase
      .from("suppliers")
      .select("*")
      .eq("verified", true)
      .or(`metadata->>craftcloud_vendor_id.eq.${cleanSlug},metadata->>craftcloud_url_slug.eq.${slug}`)
      .maybeSingle();
    resolved = cc as SupplierRow | null;
  }
  if (!resolved) return null;

  const [techRes, matRes, certRes, tagRes] = await Promise.all([
    supabase.from("supplier_technologies").select("technology_id").eq("supplier_id", resolved.id),
    supabase.from("supplier_materials").select("material_id").eq("supplier_id", resolved.id),
    supabase.from("supplier_certifications").select("certification_id").eq("supplier_id", resolved.id),
    supabase.from("supplier_tags").select("tag_id").eq("supplier_id", resolved.id),
  ]);

  const techIds = ((techRes.data as { technology_id: string }[] | null) ?? []).map((t) => t.technology_id);
  const matIds = ((matRes.data as { material_id: string }[] | null) ?? []).map((m) => m.material_id);
  const certIds = ((certRes.data as { certification_id: string }[] | null) ?? []).map((c) => c.certification_id);
  const tagIds = ((tagRes.data as { tag_id: string }[] | null) ?? []).map((t) => t.tag_id);

  const [techs, mats, certs, tags, country] = await Promise.all([
    techIds.length ? supabase.from("technologies").select("*").in("id", techIds) : Promise.resolve({ data: [] as SupplierTaxonomy[] }),
    matIds.length ? supabase.from("materials").select("*").in("id", matIds) : Promise.resolve({ data: [] as SupplierTaxonomy[] }),
    certIds.length ? supabase.from("certifications").select("*").in("id", certIds) : Promise.resolve({ data: [] as { id: string; name: string; slug: string }[] }),
    tagIds.length ? supabase.from("tags").select("*").in("id", tagIds) : Promise.resolve({ data: [] as SupplierTaxonomy[] }),
    resolved.country_id
      ? supabase.from("countries").select("*").eq("id", resolved.country_id).maybeSingle()
      : Promise.resolve({ data: null as SupplierCountry | null }),
  ]);

  const meta = resolved.metadata ?? null;

  return {
    id: resolved.id,
    supplier_id: resolved.supplier_id,
    name: resolved.name,
    website: resolved.website,
    description: resolved.description,
    description_extended: resolved.description_extended ?? null,
    location_city: resolved.location_city,
    location_country: resolved.location_country,
    location_lat: resolved.location_lat ? Number(resolved.location_lat) : null,
    location_lng: resolved.location_lng ? Number(resolved.location_lng) : null,
    verified: resolved.verified ?? false,
    premium: resolved.premium ?? false,
    is_partner: resolved.is_partner ?? false,
    instant_quote_url: (meta?.instant_quote_url as string | undefined) ?? null,
    logo_url: resolved.logo_url,
    hero_image_url: resolved.hero_image_url ?? null,
    gallery_images: resolved.gallery_images ?? null,
    technologies: (techs.data ?? []) as SupplierTaxonomy[],
    materials: (mats.data ?? []) as SupplierTaxonomy[],
    certifications: (certs.data ?? []) as { id: string; name: string; slug: string }[],
    tags: (tags.data ?? []) as SupplierTaxonomy[],
    country: (country.data ?? null) as SupplierCountry | null,
  };
});

export interface SupplierListCard {
  id: string;
  supplier_id: string;
  name: string;
  description: string | null;
  location_city: string | null;
  location_country: string | null;
  verified: boolean;
  is_partner: boolean;
  logo_url: string | null;
  website: string | null;
}

export const getVerifiedSuppliers = cache(async (): Promise<SupplierListCard[]> => {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from("suppliers")
    .select("id, supplier_id, name, description, location_city, location_country, verified, is_partner, logo_url, website")
    .eq("verified", true)
    .order("is_partner", { ascending: false })
    .order("name");
  return ((data as SupplierListCard[] | null) ?? []).map((s) => ({
    id: s.id,
    supplier_id: s.supplier_id,
    name: s.name,
    description: s.description,
    location_city: s.location_city,
    location_country: s.location_country,
    verified: s.verified ?? false,
    is_partner: s.is_partner ?? false,
    logo_url: s.logo_url,
    website: s.website,
  }));
});

export const getVerifiedSupplierSlugs = cache(async (): Promise<string[]> => {
  const supabase = createStaticClient();
  const { data } = await supabase
    .from("suppliers")
    .select("supplier_id")
    .eq("verified", true);
  return ((data as { supplier_id: string }[] | null) ?? [])
    .map((s) => s.supplier_id)
    .filter(Boolean);
});

interface SupplierRowLite {
  id: string;
  supplier_id: string;
  name: string;
  website: string | null;
  description: string | null;
  location_city: string | null;
  location_country: string | null;
  location_lat: number | string | null;
  location_lng: number | string | null;
  verified: boolean | null;
  premium: boolean | null;
  is_partner: boolean | null;
  logo_url: string | null;
  country_id: string | null;
  metadata: Record<string, unknown> | null;
}

export const getVerifiedSuppliersList = cache(async (): Promise<SupplierListItem[]> => {
  const supabase = createStaticClient();

  const { data: suppliers } = await supabase
    .from("suppliers")
    .select(
      "id, supplier_id, name, website, description, location_city, location_country, location_lat, location_lng, verified, premium, is_partner, logo_url, country_id, metadata"
    )
    .eq("verified", true)
    .order("is_partner", { ascending: false })
    .order("name");

  const rows = (suppliers as SupplierRowLite[] | null) ?? [];
  if (rows.length === 0) return [];

  const [techJoin, matJoin, certJoin, tagJoin, techList, matList, certList, tagList, countryList] =
    await Promise.all([
      supabase.from("supplier_technologies").select("supplier_id, technology_id"),
      supabase.from("supplier_materials").select("supplier_id, material_id"),
      supabase.from("supplier_certifications").select("supplier_id, certification_id"),
      supabase.from("supplier_tags").select("supplier_id, tag_id"),
      supabase.from("technologies").select("id, name, slug, category"),
      supabase.from("materials").select("id, name, slug, category"),
      supabase.from("certifications").select("id, name, slug"),
      supabase.from("tags").select("id, name, slug, category"),
      supabase.from("countries").select("id, name, code, region"),
    ]);

  const techMap = new Map(
    ((techList.data as SupplierTaxonomy[] | null) ?? []).map((t) => [t.id, t])
  );
  const matMap = new Map(
    ((matList.data as SupplierTaxonomy[] | null) ?? []).map((m) => [m.id, m])
  );
  const certMap = new Map(
    ((certList.data as { id: string; name: string; slug: string }[] | null) ?? []).map((c) => [c.id, c])
  );
  const tagMap = new Map(
    ((tagList.data as SupplierTaxonomy[] | null) ?? []).map((t) => [t.id, t])
  );
  const countryMap = new Map(
    ((countryList.data as SupplierCountry[] | null) ?? []).map((c) => [c.id, c])
  );

  const supTechs = new Map<string, SupplierTaxonomy[]>();
  for (const j of (techJoin.data as { supplier_id: string; technology_id: string }[] | null) ?? []) {
    const t = techMap.get(j.technology_id);
    if (!t) continue;
    const arr = supTechs.get(j.supplier_id) ?? [];
    arr.push(t);
    supTechs.set(j.supplier_id, arr);
  }

  const supMats = new Map<string, SupplierTaxonomy[]>();
  for (const j of (matJoin.data as { supplier_id: string; material_id: string }[] | null) ?? []) {
    const m = matMap.get(j.material_id);
    if (!m) continue;
    const arr = supMats.get(j.supplier_id) ?? [];
    arr.push(m);
    supMats.set(j.supplier_id, arr);
  }

  const supCerts = new Map<string, { id: string; name: string; slug: string }[]>();
  for (const j of (certJoin.data as { supplier_id: string; certification_id: string }[] | null) ?? []) {
    const c = certMap.get(j.certification_id);
    if (!c) continue;
    const arr = supCerts.get(j.supplier_id) ?? [];
    arr.push(c);
    supCerts.set(j.supplier_id, arr);
  }

  const supTags = new Map<string, SupplierTaxonomy[]>();
  for (const j of (tagJoin.data as { supplier_id: string; tag_id: string }[] | null) ?? []) {
    const t = tagMap.get(j.tag_id);
    if (!t) continue;
    const arr = supTags.get(j.supplier_id) ?? [];
    arr.push(t);
    supTags.set(j.supplier_id, arr);
  }

  return rows.map((s) => {
    const meta = s.metadata ?? null;
    return {
      id: s.id,
      supplier_id: s.supplier_id,
      name: s.name,
      website: s.website,
      description: s.description,
      location_city: s.location_city,
      location_country: s.location_country,
      location_lat: s.location_lat ? Number(s.location_lat) : null,
      location_lng: s.location_lng ? Number(s.location_lng) : null,
      verified: s.verified ?? false,
      premium: s.premium ?? false,
      is_partner: s.is_partner ?? false,
      instant_quote_url: (meta?.instant_quote_url as string | undefined) ?? null,
      logo_url: s.logo_url,
      technologies: supTechs.get(s.id) ?? [],
      materials: supMats.get(s.id) ?? [],
      certifications: supCerts.get(s.id) ?? [],
      tags: supTags.get(s.id) ?? [],
      country: s.country_id ? countryMap.get(s.country_id) ?? null : null,
    };
  });
});

export interface KnowledgeTaxonomy {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  supplierCount: number;
}

export interface KnowledgeData {
  technologies: KnowledgeTaxonomy[];
  materials: KnowledgeTaxonomy[];
}

export const getKnowledgeData = cache(async (): Promise<KnowledgeData> => {
  const supabase = createStaticClient();

  const [techRes, matRes, stRes, smRes] = await Promise.all([
    supabase.from("technologies").select("id, name, slug, category, description").order("name"),
    supabase.from("materials").select("id, name, slug, category, description").order("name"),
    supabase.from("supplier_technologies").select("technology_id"),
    supabase.from("supplier_materials").select("material_id"),
  ]);

  const techCount = new Map<string, number>();
  for (const r of (stRes.data as { technology_id: string }[] | null) ?? []) {
    techCount.set(r.technology_id, (techCount.get(r.technology_id) ?? 0) + 1);
  }

  const matCount = new Map<string, number>();
  for (const r of (smRes.data as { material_id: string }[] | null) ?? []) {
    matCount.set(r.material_id, (matCount.get(r.material_id) ?? 0) + 1);
  }

  type TaxonomyRow = {
    id: string;
    name: string;
    slug: string;
    category: string | null;
    description: string | null;
  };

  const technologies = ((techRes.data as TaxonomyRow[] | null) ?? []).map((t) => ({
    ...t,
    supplierCount: techCount.get(t.id) ?? 0,
  }));

  const materials = ((matRes.data as TaxonomyRow[] | null) ?? []).map((m) => ({
    ...m,
    supplierCount: matCount.get(m.id) ?? 0,
  }));

  return { technologies, materials };
});
