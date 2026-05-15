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
