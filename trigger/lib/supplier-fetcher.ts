// Server-side supplier fetcher for Trigger.dev tasks
// Mirrors the pattern from src/hooks/use-suppliers.ts but uses service role key

import { createClient } from "@supabase/supabase-js";
import type { EnrichedSupplier } from "./types.js";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  }
  return createClient(url, key);
}

export async function fetchSuppliers(): Promise<EnrichedSupplier[]> {
  const supabase = getSupabaseClient();

  // Fetch all suppliers (verified & unverified). The `verified`/`premium`
  // flags are still used downstream for a small ranking bonus in
  // scoreSuppliers, so unverified suppliers appear but don't outrank verified
  // ones at equal prices.
  const { data: suppliers, error: supError } = await supabase
    .from("suppliers")
    .select("id, supplier_id, name, website, description, location_city, location_country, region, verified, premium, logo_url, country_id")
    .order("name");

  if (supError) throw new Error(`Failed to fetch suppliers: ${supError.message}`);

  // Fetch all join data + entity tables in parallel
  const [techRes, matRes, certRes, tagRes, techList, matList, certList, tagList, countryList] = await Promise.all([
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

  // Build lookup maps
  const techMap = new Map((techList.data || []).map((t: any) => [t.id, t]));
  const matMap = new Map((matList.data || []).map((m: any) => [m.id, m]));
  const certMap = new Map((certList.data || []).map((c: any) => [c.id, c]));
  const tagMap = new Map((tagList.data || []).map((t: any) => [t.id, t]));
  const countryMap = new Map((countryList.data || []).map((c: any) => [c.id, c]));

  // Build supplier-to-relation maps
  const supTechs = new Map<string, any[]>();
  for (const st of techRes.data || []) {
    const tech = techMap.get(st.technology_id);
    if (tech) {
      if (!supTechs.has(st.supplier_id)) supTechs.set(st.supplier_id, []);
      supTechs.get(st.supplier_id)!.push(tech);
    }
  }

  const supMats = new Map<string, any[]>();
  for (const sm of matRes.data || []) {
    const mat = matMap.get(sm.material_id);
    if (mat) {
      if (!supMats.has(sm.supplier_id)) supMats.set(sm.supplier_id, []);
      supMats.get(sm.supplier_id)!.push(mat);
    }
  }

  const supCerts = new Map<string, any[]>();
  for (const sc of certRes.data || []) {
    const cert = certMap.get(sc.certification_id);
    if (cert) {
      if (!supCerts.has(sc.supplier_id)) supCerts.set(sc.supplier_id, []);
      supCerts.get(sc.supplier_id)!.push(cert);
    }
  }

  const supTags = new Map<string, any[]>();
  for (const st of tagRes.data || []) {
    const tag = tagMap.get(st.tag_id);
    if (tag) {
      if (!supTags.has(st.supplier_id)) supTags.set(st.supplier_id, []);
      supTags.get(st.supplier_id)!.push(tag);
    }
  }

  return (suppliers || []).map((s: any) => ({
    id: s.id,
    supplier_id: s.supplier_id,
    name: s.name,
    website: s.website,
    description: s.description,
    location_city: s.location_city,
    location_country: s.location_country,
    region: s.region,
    verified: s.verified ?? false,
    premium: s.premium ?? false,
    logo_url: s.logo_url,
    technologies: supTechs.get(s.id) || [],
    materials: supMats.get(s.id) || [],
    certifications: supCerts.get(s.id) || [],
    tags: supTags.get(s.id) || [],
    country: s.country_id ? countryMap.get(s.country_id) || null : null,
  }));
}

/** Update a search_results row status */
export async function updateSearchStatus(
  searchResultId: string,
  status: string,
  extra?: Record<string, any>
) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("search_results")
    .update({ status, ...extra })
    .eq("id", searchResultId);
  if (error) console.error(`Failed to update search status: ${error.message}`);
}

/** Save completed search results */
export async function saveSearchResults(
  searchResultId: string,
  data: {
    extracted_requirements?: any;
    matches?: any;
    technology_rationale?: any;
    total_suppliers_analyzed?: number;
    duration_ms?: number;
    error_message?: string;
  }
) {
  const supabase = getSupabaseClient();
  const status = data.error_message ? "failed" : "completed";
  const { error } = await supabase
    .from("search_results")
    .update({
      status,
      ...data,
      completed_at: new Date().toISOString(),
    })
    .eq("id", searchResultId);
  if (error) console.error(`Failed to save search results: ${error.message}`);
}
