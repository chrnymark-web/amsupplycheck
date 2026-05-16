import { getAllCategorySlugs, type CategoryFilter } from "@/lib/seoSlugs";

const TECH_ENTRIES = getAllCategorySlugs().filter(
  (e) => e.filter.type === "technology"
);

export const TECHNOLOGY_CATEGORY_SLUGS: string[] = TECH_ENTRIES.map(
  (e) => e.slug
);

export type TechnologyCategoryEntry = {
  slug: string;
  filter: CategoryFilter;
};

export const TECHNOLOGY_CATEGORY_ENTRIES: TechnologyCategoryEntry[] =
  TECH_ENTRIES;

export function getTechnologyCategoryBySlug(
  slug: string
): TechnologyCategoryEntry | undefined {
  return TECH_ENTRIES.find((e) => e.slug === slug);
}
