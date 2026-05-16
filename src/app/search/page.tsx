import type { Metadata } from "next";
import Link from "next/link";
import {
  MapPin,
  Verified,
  Star,
  Search as SearchIcon,
  X,
  Filter,
  Award,
  Zap,
  Factory,
} from "lucide-react";
import Navbar from "@/components/ui/navbar";
import PageVideoBackground from "@/components/layout/PageVideoBackground";
import FloatingNav from "@/components/layout/FloatingNav";
import CookieConsent from "@/components/layout/CookieConsent";
import SupplierLogo from "@/components/ui/supplier-logo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getVerifiedSuppliersList, type SupplierListItem } from "@/lib/suppliers";

export const dynamic = "force-dynamic";

const BASE_URL = "https://www.amsupplycheck.com";

interface SearchParams {
  q?: string;
  technologies?: string;
  materials?: string;
  areas?: string;
  certifications?: string;
  volume?: string;
  urgency?: string;
  query?: string;
}

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

function buildSearchString(params: Record<string, string | string[] | undefined>): string {
  const sp = new URLSearchParams();
  for (const [key, raw] of Object.entries(params)) {
    if (raw === undefined) continue;
    if (Array.isArray(raw)) {
      if (raw.length > 0) sp.set(key, raw.join(","));
    } else if (raw.length > 0) {
      sp.set(key, raw);
    }
  }
  const str = sp.toString();
  return str ? `?${str}` : "";
}

function toggleListUrl(
  current: SearchParams,
  key: "technologies" | "materials" | "areas" | "certifications",
  value: string,
): string {
  const list = parseList(current[key]);
  const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  return `/search${buildSearchString({ ...current, [key]: next })}`;
}

function removeFilterUrl(
  current: SearchParams,
  key: "technologies" | "materials" | "areas" | "certifications",
  value: string,
): string {
  const list = parseList(current[key]).filter((v) => v !== value);
  return `/search${buildSearchString({ ...current, [key]: list })}`;
}

function removeParamUrl(current: SearchParams, key: keyof SearchParams): string {
  const next = { ...current };
  delete next[key];
  return `/search${buildSearchString(next as Record<string, string | undefined>)}`;
}

interface ActiveFilters {
  q: string;
  query: string;
  technologies: string[];
  materials: string[];
  areas: string[];
  certifications: string[];
  volume: string;
  urgency: string;
}

function applyFilters(suppliers: SupplierListItem[], f: ActiveFilters): SupplierListItem[] {
  const needle = f.q.toLowerCase().trim();
  return suppliers.filter((s) => {
    if (needle) {
      const haystack = [
        s.name,
        s.description,
        s.location_city,
        s.location_country,
        s.country?.name,
        ...s.technologies.map((t) => t.name),
        ...s.materials.map((m) => m.name),
        ...s.tags.map((t) => t.name),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (f.technologies.length > 0) {
      const has = f.technologies.some((slug) =>
        s.technologies.some((t) => t.slug === slug || t.name.toLowerCase() === slug.toLowerCase()),
      );
      if (!has) return false;
    }
    if (f.materials.length > 0) {
      const has = f.materials.some((slug) =>
        s.materials.some((m) => m.slug === slug || m.name.toLowerCase() === slug.toLowerCase()),
      );
      if (!has) return false;
    }
    if (f.areas.length > 0) {
      const country = (s.country?.name ?? s.location_country ?? "").toLowerCase();
      const region = (s.country?.region ?? "").toLowerCase();
      const has = f.areas.some((area) => {
        const a = area.toLowerCase();
        return country.includes(a) || region.includes(a);
      });
      if (!has) return false;
    }
    if (f.certifications.length > 0) {
      const has = f.certifications.some((slug) =>
        s.certifications.some((c) => c.slug === slug || c.name.toLowerCase() === slug.toLowerCase()),
      );
      if (!has) return false;
    }
    return true;
  });
}

function rankSuppliers(suppliers: SupplierListItem[], q: string): SupplierListItem[] {
  const needle = q.toLowerCase();
  return [...suppliers].sort((a, b) => {
    if (a.is_partner !== b.is_partner) return a.is_partner ? -1 : 1;
    const aName = needle && a.name.toLowerCase().includes(needle) ? 100 : 0;
    const bName = needle && b.name.toLowerCase().includes(needle) ? 100 : 0;
    const aScore = aName + (a.premium ? 20 : 0) + (a.verified ? 10 : 0);
    const bScore = bName + (b.premium ? 20 : 0) + (b.verified ? 10 : 0);
    if (aScore !== bScore) return bScore - aScore;
    return a.name.localeCompare(b.name);
  });
}

interface FacetCount {
  slug: string;
  name: string;
  count: number;
}

function topFacets(
  suppliers: SupplierListItem[],
  picker: (s: SupplierListItem) => { slug: string; name: string }[],
  limit = 12,
): FacetCount[] {
  const counts = new Map<string, FacetCount>();
  for (const s of suppliers) {
    for (const item of picker(s)) {
      const existing = counts.get(item.slug);
      if (existing) existing.count += 1;
      else counts.set(item.slug, { slug: item.slug, name: item.name, count: 1 });
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

function topCountries(suppliers: SupplierListItem[], limit = 12): FacetCount[] {
  const counts = new Map<string, FacetCount>();
  for (const s of suppliers) {
    const name = s.country?.name ?? s.location_country;
    if (!name) continue;
    const slug = name.toLowerCase();
    const existing = counts.get(slug);
    if (existing) existing.count += 1;
    else counts.set(slug, { slug, name, count: 1 });
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export const metadata: Metadata = {
  title: "Search 3D Printing Suppliers | AMSupplyCheck",
  description:
    "Search and compare 3D printing suppliers worldwide. Filter by materials, technologies, location, and certifications to find the perfect manufacturing partner.",
  alternates: { canonical: "https://www.amsupplycheck.com/search" },
  openGraph: {
    title: "Search 3D Printing Suppliers | AMSupplyCheck",
    description:
      "Search and compare 3D printing suppliers worldwide. Filter by materials, technologies, location, and certifications.",
    url: "https://www.amsupplycheck.com/search",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Search 3D Printing Suppliers | AMSupplyCheck",
    description:
      "Search and compare 3D printing suppliers worldwide. Filter by materials, technologies, location, and certifications.",
  },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const f: ActiveFilters = {
    q: sp.q ?? sp.query ?? "",
    query: sp.query ?? "",
    technologies: parseList(sp.technologies),
    materials: parseList(sp.materials),
    areas: parseList(sp.areas),
    certifications: parseList(sp.certifications),
    volume: sp.volume ?? "",
    urgency: sp.urgency ?? "",
  };

  const all = await getVerifiedSuppliersList();
  const filtered = applyFilters(all, f);
  const ranked = rankSuppliers(filtered, f.q);

  const techFacets = topFacets(filtered, (s) =>
    s.technologies.map((t) => ({ slug: t.slug, name: t.name })),
  );
  const matFacets = topFacets(filtered, (s) =>
    s.materials.map((m) => ({ slug: m.slug, name: m.name })),
  );
  const certFacets = topFacets(filtered, (s) =>
    s.certifications.map((c) => ({ slug: c.slug, name: c.name })),
  );
  const countryFacets = topCountries(filtered);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Search Suppliers", item: `${BASE_URL}/search` },
    ],
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Search Results - 3D Printing Suppliers",
    description: `Found ${ranked.length} 3D printing suppliers matching the current filters`,
    numberOfItems: ranked.length,
    itemListElement: ranked.slice(0, 50).map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LocalBusiness",
        "@id": `${BASE_URL}/suppliers/${s.supplier_id}`,
        name: s.name,
        url: `${BASE_URL}/suppliers/${s.supplier_id}`,
        description:
          s.description ?? `${s.name} offers professional 3D printing services`,
        ...(s.logo_url ? { image: s.logo_url } : {}),
        address: {
          "@type": "PostalAddress",
          addressLocality: s.location_city ?? undefined,
          addressCountry: s.country?.name ?? s.location_country ?? undefined,
        },
      },
    })),
  };

  const hasAnyFilter =
    f.q ||
    f.query ||
    f.technologies.length > 0 ||
    f.materials.length > 0 ||
    f.areas.length > 0 ||
    f.certifications.length > 0 ||
    f.volume ||
    f.urgency;

  return (
    <div className="min-h-screen bg-transparent relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <PageVideoBackground />
      <Navbar />

      <main className="relative z-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Search 3D Printing Suppliers
          </h1>
          <p className="text-muted-foreground">
            {ranked.length} verified supplier{ranked.length !== 1 ? "s" : ""}
            {hasAnyFilter && all.length !== ranked.length && ` of ${all.length}`}
            {f.q && (
              <>
                {" "}for &ldquo;<span className="font-medium text-foreground">{f.q}</span>&rdquo;
              </>
            )}
          </p>
        </div>

        {/* Search form */}
        <form action="/search" method="get" className="mb-6 max-w-2xl">
          {/* Preserve other filters as hidden fields */}
          {f.technologies.length > 0 && (
            <input type="hidden" name="technologies" value={f.technologies.join(",")} />
          )}
          {f.materials.length > 0 && (
            <input type="hidden" name="materials" value={f.materials.join(",")} />
          )}
          {f.areas.length > 0 && <input type="hidden" name="areas" value={f.areas.join(",")} />}
          {f.certifications.length > 0 && (
            <input type="hidden" name="certifications" value={f.certifications.join(",")} />
          )}
          <div className="flex items-center gap-2 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg shadow-black/20 p-2 border border-border/20">
            <SearchIcon className="h-5 w-5 text-muted-foreground ml-2 flex-shrink-0" />
            <input
              name="q"
              type="text"
              defaultValue={f.q}
              placeholder="Search by technology, material, location, or supplier name…"
              className="flex-1 bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground py-2 px-2"
              aria-label="Search suppliers"
            />
            <button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-5 py-2 font-medium transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Active filters */}
        {hasAnyFilter ? (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Filter className="h-3 w-3" /> Filters:
            </span>
            {f.q && (
              <Link href={removeParamUrl(sp, "q")}>
                <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-destructive/10">
                  &ldquo;{f.q}&rdquo; <X className="h-3 w-3 ml-1" />
                </Badge>
              </Link>
            )}
            {f.technologies.map((t) => (
              <Link key={`t-${t}`} href={removeFilterUrl(sp, "technologies", t)}>
                <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-destructive/10">
                  {t} <X className="h-3 w-3 ml-1" />
                </Badge>
              </Link>
            ))}
            {f.materials.map((m) => (
              <Link key={`m-${m}`} href={removeFilterUrl(sp, "materials", m)}>
                <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-destructive/10">
                  {m} <X className="h-3 w-3 ml-1" />
                </Badge>
              </Link>
            ))}
            {f.areas.map((a) => (
              <Link key={`a-${a}`} href={removeFilterUrl(sp, "areas", a)}>
                <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-destructive/10">
                  <MapPin className="h-3 w-3 mr-1" /> {a} <X className="h-3 w-3 ml-1" />
                </Badge>
              </Link>
            ))}
            {f.certifications.map((c) => (
              <Link key={`c-${c}`} href={removeFilterUrl(sp, "certifications", c)}>
                <Badge variant="outline" className="text-xs cursor-pointer hover:bg-destructive/10">
                  <Award className="h-3 w-3 mr-1" /> {c} <X className="h-3 w-3 ml-1" />
                </Badge>
              </Link>
            ))}
            {f.urgency === "urgent" && (
              <Badge className="bg-red-500/10 text-red-600 border-red-200 text-xs">
                <Zap className="h-3 w-3 mr-1" /> Urgent
              </Badge>
            )}
            {f.volume && (
              <Badge variant="outline" className="text-xs">
                <Factory className="h-3 w-3 mr-1" /> {f.volume}
              </Badge>
            )}
            <Link
              href="/search"
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 ml-1"
            >
              <X className="h-3 w-3" /> Clear all
            </Link>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
          {/* Filter sidebar */}
          <aside className="lg:sticky lg:top-24 self-start space-y-3">
            <FacetSection
              title="Technologies"
              facets={techFacets}
              selected={f.technologies}
              hrefFor={(slug) => toggleListUrl(sp, "technologies", slug)}
            />
            <FacetSection
              title="Materials"
              facets={matFacets}
              selected={f.materials}
              hrefFor={(slug) => toggleListUrl(sp, "materials", slug)}
            />
            <FacetSection
              title="Country"
              facets={countryFacets}
              selected={f.areas}
              hrefFor={(name) => toggleListUrl(sp, "areas", name)}
            />
            {certFacets.length > 0 && (
              <FacetSection
                title="Certifications"
                facets={certFacets}
                selected={f.certifications}
                hrefFor={(slug) => toggleListUrl(sp, "certifications", slug)}
              />
            )}
          </aside>

          {/* Results */}
          <section>
            {ranked.length === 0 ? (
              <Card className="bg-card/60 backdrop-blur-sm">
                <CardContent className="p-10 text-center">
                  <SearchIcon className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h2 className="text-lg font-medium mb-2">No suppliers found</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Try adjusting your filters or search query to find more results.
                  </p>
                  <Link
                    href="/search"
                    className="text-primary hover:underline text-sm font-medium"
                  >
                    Clear all filters
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ranked.map((s) => (
                  <Link key={s.id} href={`/suppliers/${s.supplier_id}`} className="group block">
                    <Card className="h-full bg-card border-border hover:border-primary/40 hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <SupplierLogo
                            name={s.name}
                            logoUrl={s.logo_url ?? undefined}
                            size="lg"
                            className="flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                {s.name}
                              </h2>
                              {s.is_partner && (
                                <Star
                                  className="h-4 w-4 text-supplier-partner fill-current flex-shrink-0"
                                  aria-label="Paying SupplyCheck partner"
                                />
                              )}
                              {s.verified && (
                                <Verified className="h-4 w-4 text-primary flex-shrink-0" />
                              )}
                            </div>
                            {(s.location_city || s.location_country) && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                <MapPin className="h-3.5 w-3.5" />
                                <span>
                                  {[s.location_city, s.country?.name ?? s.location_country]
                                    .filter(Boolean)
                                    .join(", ")}
                                </span>
                              </div>
                            )}
                            {s.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {s.description}
                              </p>
                            )}
                            {s.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {s.technologies.slice(0, 4).map((t) => (
                                  <Badge
                                    key={t.id}
                                    variant="secondary"
                                    className="text-xs font-normal"
                                  >
                                    {t.name}
                                  </Badge>
                                ))}
                                {s.technologies.length > 4 && (
                                  <Badge variant="secondary" className="text-xs font-normal">
                                    +{s.technologies.length - 4}
                                  </Badge>
                                )}
                              </div>
                            )}
                            {s.materials.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {s.materials.slice(0, 3).map((m) => (
                                  <Badge
                                    key={m.id}
                                    variant="outline"
                                    className="text-xs font-normal"
                                  >
                                    {m.name}
                                  </Badge>
                                ))}
                                {s.materials.length > 3 && (
                                  <Badge variant="outline" className="text-xs font-normal">
                                    +{s.materials.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <FloatingNav />
      <CookieConsent />
    </div>
  );
}

function FacetSection({
  title,
  facets,
  selected,
  hrefFor,
}: {
  title: string;
  facets: FacetCount[];
  selected: string[];
  hrefFor: (slug: string) => string;
}) {
  if (facets.length === 0) return null;
  const open = selected.length > 0;
  return (
    <details open={open || undefined} className="bg-card/60 backdrop-blur-sm rounded-lg border border-border">
      <summary className="cursor-pointer list-none p-3 flex items-center justify-between font-medium text-sm text-foreground hover:bg-muted/40 rounded-lg">
        <span>{title}</span>
        <span className="text-xs text-muted-foreground">{facets.length}</span>
      </summary>
      <ul className="px-2 pb-2 space-y-0.5">
        {facets.map((f) => {
          const isSelected = selected.includes(f.slug);
          return (
            <li key={f.slug}>
              <Link
                href={hrefFor(f.slug)}
                className={`flex items-center justify-between text-sm rounded px-2 py-1.5 transition-colors ${
                  isSelected
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`inline-block w-3 h-3 border rounded-sm ${
                      isSelected ? "bg-primary border-primary" : "border-border"
                    }`}
                  />
                  <span className="truncate">{f.name}</span>
                </span>
                <span className="text-xs opacity-70 flex-shrink-0 ml-2">{f.count}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
