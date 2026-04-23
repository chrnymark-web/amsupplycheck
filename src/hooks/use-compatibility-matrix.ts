import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Tier = 'core' | 'common' | 'niche';

export interface CompatibilityRow {
  technologyId: string;
  technologyName: string;
  technologySlug: string;
  materialId: string;
  materialName: string;
  materialSlug: string;
  tier: Tier;
  modality: string | null;
  inheritedFromChild: boolean;
}

export type CompatibilityMap = Record<string, string[]>;

const QUERY_KEY = ['technology-material-compatibility'];

async function fetchCompatibilityRows(): Promise<CompatibilityRow[]> {
  const [techRes, matRes, compatRes] = await Promise.all([
    supabase
      .from('technologies')
      .select('id, name, slug, hidden, canonical_id')
      .eq('hidden', false),
    supabase
      .from('materials')
      .select('id, name, slug, hidden, canonical_id, is_category')
      .eq('hidden', false),
    supabase
      .from('technology_materials_resolved')
      .select('technology_id, material_id, tier, modality, inherited_from_child'),
  ]);

  if (techRes.error) throw techRes.error;
  if (matRes.error) throw matRes.error;
  if (compatRes.error) throw compatRes.error;

  const techById = new Map(techRes.data.map((t) => [t.id, t]));
  const matById = new Map(matRes.data.map((m) => [m.id, m]));

  return (compatRes.data ?? [])
    .map((row): CompatibilityRow | null => {
      const tech = techById.get(row.technology_id);
      const mat = matById.get(row.material_id);
      if (!tech || !mat) return null;
      return {
        technologyId: tech.id,
        technologyName: tech.name,
        technologySlug: tech.slug,
        materialId: mat.id,
        materialName: mat.name,
        materialSlug: mat.slug,
        tier: row.tier as Tier,
        modality: row.modality,
        inheritedFromChild: row.inherited_from_child,
      };
    })
    .filter((row): row is CompatibilityRow => row !== null);
}

export function useCompatibilityRows() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchCompatibilityRows,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
  });
}

export function useTechnologyToMaterials(): {
  data: CompatibilityMap;
  isLoading: boolean;
  error: unknown;
} {
  const { data: rows, isLoading, error } = useCompatibilityRows();
  const data = useMemo(() => {
    const map: CompatibilityMap = {};
    for (const row of rows ?? []) {
      if (!map[row.technologyName]) map[row.technologyName] = [];
      if (!map[row.technologyName].includes(row.materialName)) {
        map[row.technologyName].push(row.materialName);
      }
    }
    for (const key of Object.keys(map)) map[key].sort();
    return map;
  }, [rows]);
  return { data, isLoading, error };
}

export function useMaterialToTechnologies(): {
  data: CompatibilityMap;
  isLoading: boolean;
  error: unknown;
} {
  const { data: rows, isLoading, error } = useCompatibilityRows();
  const data = useMemo(() => {
    const map: CompatibilityMap = {};
    for (const row of rows ?? []) {
      if (!map[row.materialName]) map[row.materialName] = [];
      if (!map[row.materialName].includes(row.technologyName)) {
        map[row.materialName].push(row.technologyName);
      }
    }
    for (const key of Object.keys(map)) map[key].sort();
    return map;
  }, [rows]);
  return { data, isLoading, error };
}

export function useCompatibleMaterials(selectedTechnologies: string[]): string[] {
  const { data } = useTechnologyToMaterials();
  return useMemo(() => {
    if (selectedTechnologies.length === 0) return [];
    const set = new Set<string>();
    for (const tech of selectedTechnologies) {
      for (const mat of data[tech] ?? []) set.add(mat);
    }
    return Array.from(set).sort();
  }, [data, selectedTechnologies]);
}

export function useCompatibleTechnologies(selectedMaterials: string[]): string[] {
  const { data } = useMaterialToTechnologies();
  return useMemo(() => {
    if (selectedMaterials.length === 0) return [];
    const set = new Set<string>();
    for (const mat of selectedMaterials) {
      for (const tech of data[mat] ?? []) set.add(tech);
    }
    return Array.from(set).sort();
  }, [data, selectedMaterials]);
}

export function useIsMaterialCompatible(material: string, selectedTechnologies: string[]): boolean {
  const { data } = useMaterialToTechnologies();
  return useMemo(() => {
    if (selectedTechnologies.length === 0) return true;
    const techs = data[material] ?? [];
    return selectedTechnologies.some((t) => techs.includes(t));
  }, [data, material, selectedTechnologies]);
}

export function useIsTechnologyCompatible(technology: string, selectedMaterials: string[]): boolean {
  const { data } = useTechnologyToMaterials();
  return useMemo(() => {
    if (selectedMaterials.length === 0) return true;
    const materials = data[technology] ?? [];
    return selectedMaterials.some((m) => materials.includes(m));
  }, [data, technology, selectedMaterials]);
}

export function getCompatibleMaterialsFromMap(
  map: CompatibilityMap,
  selectedTechnologies: string[],
): string[] {
  if (selectedTechnologies.length === 0) return [];
  const set = new Set<string>();
  for (const tech of selectedTechnologies) {
    for (const mat of map[tech] ?? []) set.add(mat);
  }
  return Array.from(set).sort();
}

export function getCompatibleTechnologiesFromMap(
  map: CompatibilityMap,
  selectedMaterials: string[],
): string[] {
  if (selectedMaterials.length === 0) return [];
  const set = new Set<string>();
  for (const mat of selectedMaterials) {
    for (const tech of map[mat] ?? []) set.add(tech);
  }
  return Array.from(set).sort();
}
