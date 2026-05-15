import { cache } from "react";
import { createStaticClient } from "@/lib/supabase/static";

export interface MatrixTaxonomy {
  id: string;
  name: string;
  slug: string;
}

export interface CompatibilityMatrix {
  technologies: MatrixTaxonomy[];
  materials: MatrixTaxonomy[];
  technologyToMaterials: Record<string, string[]>;
}

export const getCompatibilityMatrix = cache(async (): Promise<CompatibilityMatrix> => {
  const supabase = createStaticClient();

  const [techRes, matRes, compatRes] = await Promise.all([
    supabase
      .from("technologies")
      .select("id, name, slug, hidden")
      .eq("hidden", false)
      .order("name"),
    supabase
      .from("materials")
      .select("id, name, slug, hidden")
      .eq("hidden", false)
      .order("name"),
    supabase
      .from("technology_materials_resolved")
      .select("technology_id, material_id"),
  ]);

  const technologies: MatrixTaxonomy[] = ((techRes.data as MatrixTaxonomy[] | null) ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
  }));
  const materials: MatrixTaxonomy[] = ((matRes.data as MatrixTaxonomy[] | null) ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    slug: m.slug,
  }));

  const techById = new Map(technologies.map((t) => [t.id, t]));
  const matById = new Map(materials.map((m) => [m.id, m]));

  const technologyToMaterials: Record<string, string[]> = {};
  for (const row of (compatRes.data as { technology_id: string; material_id: string }[] | null) ?? []) {
    const tech = techById.get(row.technology_id);
    const mat = matById.get(row.material_id);
    if (!tech || !mat) continue;
    const list = technologyToMaterials[tech.name] ?? [];
    if (!list.includes(mat.name)) list.push(mat.name);
    technologyToMaterials[tech.name] = list;
  }

  return { technologies, materials, technologyToMaterials };
});
