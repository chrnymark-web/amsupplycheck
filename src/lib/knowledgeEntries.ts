import {
  TECHNOLOGY_GLOSSARY,
  MATERIAL_GLOSSARY,
  type TechnologyInfo,
  type MaterialInfo,
} from "@/lib/technologyGlossary";

export type KnowledgeType = "technology" | "material";

export interface TechEntry {
  key: string;
  slug: string;
  data: TechnologyInfo;
}

export interface MaterialEntry {
  key: string;
  slug: string;
  data: MaterialInfo;
}

function toSlug(key: string): string {
  return key
    .toLowerCase()
    .replace(/[\s_/]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export const TECH_ENTRIES: TechEntry[] = Object.entries(TECHNOLOGY_GLOSSARY)
  .map(([key, data]) => ({ key, slug: toSlug(key), data }))
  .sort((a, b) => a.data.name.localeCompare(b.data.name));

export const MATERIAL_ENTRIES: MaterialEntry[] = Object.entries(MATERIAL_GLOSSARY)
  .map(([key, data]) => ({ key, slug: toSlug(key), data }))
  .sort((a, b) => a.data.name.localeCompare(b.data.name));

export function getTechBySlug(slug: string): TechEntry | undefined {
  return TECH_ENTRIES.find((e) => e.slug === slug);
}

export function getMaterialBySlug(slug: string): MaterialEntry | undefined {
  return MATERIAL_ENTRIES.find((e) => e.slug === slug);
}

export const TECH_CATEGORY_LABEL: Record<TechnologyInfo["category"], string> = {
  polymer: "Polymer",
  metal: "Metal",
  resin: "Resin",
  composite: "Composite",
};

export const TECH_CATEGORY_ORDER: TechnologyInfo["category"][] = [
  "polymer",
  "metal",
  "resin",
  "composite",
];

export function groupTechByCategory(): Array<{
  category: TechnologyInfo["category"];
  label: string;
  entries: TechEntry[];
}> {
  return TECH_CATEGORY_ORDER.map((category) => ({
    category,
    label: TECH_CATEGORY_LABEL[category],
    entries: TECH_ENTRIES.filter((e) => e.data.category === category),
  })).filter((g) => g.entries.length > 0);
}

const MATERIAL_CATEGORY_ORDER = [
  "Polymer",
  "High-Performance Polymer",
  "Composite",
  "Elastomer",
  "Photopolymer",
  "Metal",
  "Superalloy",
];

export function groupMaterialByCategory(): Array<{
  category: string;
  entries: MaterialEntry[];
}> {
  const seen = new Set<string>();
  const groups: Array<{ category: string; entries: MaterialEntry[] }> = [];
  for (const cat of MATERIAL_CATEGORY_ORDER) {
    const entries = MATERIAL_ENTRIES.filter((e) => e.data.category === cat);
    if (entries.length > 0) {
      groups.push({ category: cat, entries });
      seen.add(cat);
    }
  }
  const extras: Record<string, MaterialEntry[]> = {};
  for (const entry of MATERIAL_ENTRIES) {
    if (!seen.has(entry.data.category)) {
      (extras[entry.data.category] ||= []).push(entry);
    }
  }
  for (const [category, entries] of Object.entries(extras)) {
    groups.push({ category, entries });
  }
  return groups;
}
