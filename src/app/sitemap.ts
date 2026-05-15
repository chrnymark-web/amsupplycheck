import type { MetadataRoute } from "next";
import { getVerifiedSupplierSlugs } from "@/lib/suppliers";

const BASE = "https://www.amsupplycheck.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getVerifiedSupplierSlugs();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/suppliers`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/search`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/keywordsearch`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/compatibility`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/browse`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  const supplierEntries: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${BASE}/suppliers/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticEntries, ...supplierEntries];
}
