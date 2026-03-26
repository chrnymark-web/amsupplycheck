import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Tag {
  id: string;
  name: string;
  slug: string;
  category: string | null;
}

export interface SupplierWithTags {
  id: string;
  supplier_id: string;
  name: string;
  location_country: string | null;
  verified: boolean;
  tags: Tag[];
}

export interface TechnologyWithSuppliers {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  supplierCount: number;
  suppliers: SupplierWithTags[];
}

export interface MaterialWithSuppliers {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
  supplierCount: number;
  suppliers: SupplierWithTags[];
}

async function fetchKnowledgeData() {
  const [techRes, matRes, suppRes, stRes, smRes, tagsRes, supplierTagsRes] = await Promise.all([
    supabase.from('technologies').select('id, name, slug, category, description').order('name'),
    supabase.from('materials').select('id, name, slug, category, description').order('name'),
    supabase.from('suppliers').select('id, supplier_id, name, location_country, verified').order('name'),
    supabase.from('supplier_technologies').select('supplier_id, technology_id'),
    supabase.from('supplier_materials').select('supplier_id, material_id'),
    supabase.from('tags').select('id, name, slug, category'),
    supabase.from('supplier_tags').select('supplier_id, tag_id'),
  ]);

  if (techRes.error) throw techRes.error;
  if (matRes.error) throw matRes.error;
  if (suppRes.error) throw suppRes.error;
  if (stRes.error) throw stRes.error;
  if (smRes.error) throw smRes.error;
  if (tagsRes.error) throw tagsRes.error;
  if (supplierTagsRes.error) throw supplierTagsRes.error;

  // Build tag map
  const tagMap = new Map(tagsRes.data.map(t => [t.id, t]));

  // Build supplier -> tags map
  const supplierTagsMap = new Map<string, Tag[]>();
  for (const st of supplierTagsRes.data) {
    const arr = supplierTagsMap.get(st.supplier_id) || [];
    const tag = tagMap.get(st.tag_id);
    if (tag) arr.push(tag);
    supplierTagsMap.set(st.supplier_id, arr);
  }

  // Build supplier map with tags
  const supplierMap = new Map(suppRes.data.map(s => [s.id, {
    ...s,
    tags: supplierTagsMap.get(s.id) || [],
  }]));

  // Build tech -> suppliers map
  const techSuppMap = new Map<string, string[]>();
  for (const st of stRes.data) {
    const arr = techSuppMap.get(st.technology_id) || [];
    arr.push(st.supplier_id);
    techSuppMap.set(st.technology_id, arr);
  }

  const technologies: TechnologyWithSuppliers[] = techRes.data.map(t => {
    const suppIds = techSuppMap.get(t.id) || [];
    return {
      ...t,
      supplierCount: suppIds.length,
      suppliers: suppIds.map(id => supplierMap.get(id)).filter(Boolean) as SupplierWithTags[],
    };
  });

  // Build mat -> suppliers map
  const matSuppMap = new Map<string, string[]>();
  for (const sm of smRes.data) {
    const arr = matSuppMap.get(sm.material_id) || [];
    arr.push(sm.supplier_id);
    matSuppMap.set(sm.material_id, arr);
  }

  const materials: MaterialWithSuppliers[] = matRes.data.map(m => {
    const suppIds = matSuppMap.get(m.id) || [];
    return {
      ...m,
      supplierCount: suppIds.length,
      suppliers: suppIds.map(id => supplierMap.get(id)).filter(Boolean) as SupplierWithTags[],
    };
  });

  return { technologies, materials };
}

export function useKnowledgeData() {
  return useQuery({
    queryKey: ['knowledge-data'],
    queryFn: fetchKnowledgeData,
    staleTime: 10 * 60 * 1000,
  });
}
