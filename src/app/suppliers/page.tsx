import type { Metadata } from "next";
import Link from "next/link";
import { getVerifiedSuppliersList, type SupplierListItem } from "@/lib/suppliers";
import Navbar from "@/components/ui/navbar";
import PageVideoBackground from "@/components/layout/PageVideoBackground";
import FloatingNav from "@/components/layout/FloatingNav";
import CookieConsent from "@/components/layout/CookieConsent";
import SupplierLogo from "@/components/ui/supplier-logo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Verified, Star } from "lucide-react";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "3D Printing Suppliers Directory | AMSupplyCheck",
  description:
    "Browse verified 3D printing and additive manufacturing suppliers worldwide. Filter by technology, material, certification, and location.",
  alternates: { canonical: "https://www.amsupplycheck.com/suppliers" },
  openGraph: {
    title: "3D Printing Suppliers Directory | AMSupplyCheck",
    description:
      "Browse verified 3D printing and additive manufacturing suppliers worldwide. Filter by technology, material, certification, and location.",
    url: "https://www.amsupplycheck.com/suppliers",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

function matchesQuery(s: SupplierListItem, q: string): boolean {
  const needle = q.toLowerCase();
  if (s.name.toLowerCase().includes(needle)) return true;
  if (s.description?.toLowerCase().includes(needle)) return true;
  if (s.location_city?.toLowerCase().includes(needle)) return true;
  if (s.location_country?.toLowerCase().includes(needle)) return true;
  if (s.country?.name.toLowerCase().includes(needle)) return true;
  if (s.technologies.some((t) => t.name.toLowerCase().includes(needle))) return true;
  if (s.materials.some((m) => m.name.toLowerCase().includes(needle))) return true;
  return false;
}

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const all = await getVerifiedSuppliersList();
  const suppliers = q ? all.filter((s) => matchesQuery(s, q)) : all;

  const supplierCount = all.length;
  const countryCount = new Set(
    all.map((s) => s.country?.name ?? s.location_country).filter((c): c is string => Boolean(c))
  ).size;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "AMSupplyCheck Supplier Directory",
    description: "Verified directory of 3D printing and additive manufacturing suppliers worldwide.",
    numberOfItems: suppliers.length,
    itemListElement: suppliers.slice(0, 100).map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://www.amsupplycheck.com/suppliers/${s.supplier_id}`,
      name: s.name,
    })),
  };

  return (
    <div className="min-h-screen bg-transparent relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageVideoBackground />
      <Navbar />

      <main className="relative z-0">
        {/* Hero */}
        <section className="pt-24 pb-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              3D Printing Suppliers Directory
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              Browse {supplierCount} verified additive manufacturing suppliers across {countryCount} countries.
            </p>
            <form action="/suppliers" method="get" className="max-w-xl mx-auto">
              <div className="flex items-center gap-2 bg-background/60 backdrop-blur-sm rounded-xl shadow-lg shadow-black/20 p-2 border border-border/20">
                <input
                  name="q"
                  type="text"
                  defaultValue={q ?? ""}
                  placeholder="Search by technology, material, location…"
                  className="flex-1 bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground py-2 px-3"
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
            {q && (
              <p className="mt-4 text-sm text-muted-foreground">
                Showing {suppliers.length} of {supplierCount} suppliers matching &ldquo;{q}&rdquo; ·{" "}
                <Link href="/suppliers" className="text-primary hover:underline">
                  Clear filter
                </Link>
              </p>
            )}
          </div>
        </section>

        {/* Supplier grid */}
        <section className="pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            {suppliers.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                No suppliers match this search.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map((supplier) => (
                  <Link
                    key={supplier.id}
                    href={`/suppliers/${supplier.supplier_id}`}
                    className="group block"
                  >
                    <Card className="h-full bg-card border-border hover:border-primary/40 hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <SupplierLogo
                            name={supplier.name}
                            logoUrl={supplier.logo_url ?? undefined}
                            size="lg"
                            className="flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                {supplier.name}
                              </h2>
                              {supplier.is_partner && (
                                <Star
                                  className="h-4 w-4 text-supplier-partner fill-current flex-shrink-0"
                                  aria-label="Paying SupplyCheck partner"
                                />
                              )}
                              {supplier.verified && (
                                <Verified className="h-4 w-4 text-primary flex-shrink-0" />
                              )}
                            </div>

                            {(supplier.location_city || supplier.location_country) && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                                <MapPin className="h-3.5 w-3.5" />
                                <span>
                                  {[
                                    supplier.location_city,
                                    supplier.country?.name ?? supplier.location_country,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}
                                </span>
                              </div>
                            )}

                            {supplier.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {supplier.description}
                              </p>
                            )}

                            {supplier.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {supplier.technologies.slice(0, 4).map((tech) => (
                                  <Badge
                                    key={tech.id}
                                    variant="secondary"
                                    className="text-xs font-normal"
                                  >
                                    {tech.name}
                                  </Badge>
                                ))}
                                {supplier.technologies.length > 4 && (
                                  <Badge variant="secondary" className="text-xs font-normal">
                                    +{supplier.technologies.length - 4}
                                  </Badge>
                                )}
                              </div>
                            )}

                            {supplier.materials.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mb-2">
                                {supplier.materials.slice(0, 3).map((mat) => (
                                  <Badge
                                    key={mat.id}
                                    variant="outline"
                                    className="text-xs font-normal"
                                  >
                                    {mat.name}
                                  </Badge>
                                ))}
                                {supplier.materials.length > 3 && (
                                  <Badge variant="outline" className="text-xs font-normal">
                                    +{supplier.materials.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}

                            {supplier.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {supplier.tags.slice(0, 3).map((tag) => (
                                  <Badge
                                    key={tag.id}
                                    className="text-xs font-normal bg-primary/10 text-primary border-primary/20"
                                  >
                                    {tag.name}
                                  </Badge>
                                ))}
                                {supplier.tags.length > 3 && (
                                  <Badge className="text-xs font-normal bg-primary/10 text-primary border-primary/20">
                                    +{supplier.tags.length - 3}
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
          </div>
        </section>
      </main>

      <FloatingNav />
      <CookieConsent />
    </div>
  );
}
