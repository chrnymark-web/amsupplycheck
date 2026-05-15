import type { Metadata } from "next";
import Link from "next/link";
import { getSupplier, getVerifiedSupplierSlugs } from "@/lib/suppliers";
import Navbar from "@/components/ui/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SupplierLogo from "@/components/ui/supplier-logo";
import SupplierAnalyticsTracker from "@/components/supplier/SupplierAnalyticsTracker";
import SupplierMissingFallback from "@/components/supplier/SupplierMissingFallback";
import {
  MapPin,
  ExternalLink,
  Verified,
  ArrowLeft,
  Globe,
  Factory,
  Shield,
  Tag,
  Cpu,
  Building2,
  Camera,
  Star,
  Briefcase,
  Zap,
  Package,
} from "lucide-react";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getVerifiedSupplierSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supplier = await getSupplier(slug);
  if (!supplier) {
    return { title: "Supplier not found | Supplycheck", robots: { index: false, follow: false } };
  }
  const description =
    supplier.description ??
    `${supplier.name} offers ${supplier.technologies.map((t) => t.name).join(", ")} manufacturing services.`;
  return {
    title: `${supplier.name} - Manufacturing Supplier | Supplycheck`,
    description,
    alternates: { canonical: `https://amsupplycheck.com/suppliers/${slug}` },
    openGraph: {
      title: `${supplier.name} - Manufacturing Supplier`,
      description,
      url: `https://amsupplycheck.com/suppliers/${slug}`,
      type: "website",
      images: supplier.logo_url ? [{ url: supplier.logo_url }] : undefined,
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function SupplierDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supplier = await getSupplier(slug);

  if (!supplier) {
    return <SupplierMissingFallback slug={slug} />;
  }

  const locationText = [supplier.location_city, supplier.country?.name ?? supplier.location_country]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <SupplierAnalyticsTracker supplierId={supplier.id} supplierName={supplier.name} slug={slug} />

      <Navbar />

      <main className="min-h-screen bg-background">
        {supplier.hero_image_url && (
          <section className="relative isolate overflow-hidden pt-20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={supplier.hero_image_url}
              alt={`${supplier.name} facility`}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, hsl(220 30% 8% / 0.55) 0%, hsl(220 30% 8% / 0.72) 55%, hsl(220 30% 8% / 0.95) 100%)",
              }}
            />
            <div
              className="absolute inset-0 opacity-50 mix-blend-screen pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 60% 50% at 15% 20%, hsl(var(--primary) / 0.30) 0%, transparent 65%)",
              }}
            />

            <div className="relative max-w-5xl mx-auto px-4 pt-10 md:pt-14 pb-10 md:pb-12 min-h-[360px] md:min-h-[440px] flex flex-col justify-end">
              <Link
                href="/suppliers"
                className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white mb-6 w-fit transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back to suppliers
              </Link>

              <div className="flex flex-col md:flex-row items-start gap-5 md:gap-6">
                <div className="rounded-2xl bg-white p-3 ring-1 ring-white/40 shadow-2xl">
                  <SupplierLogo name={supplier.name} logoUrl={supplier.logo_url ?? undefined} size="2xl" />
                </div>

                <div className="flex-1 min-w-0">
                  {supplier.is_partner && (
                    <Badge className="bg-supplier-partner text-black border-0 mb-3 shadow-lg shadow-yellow-900/20">
                      <Star className="h-3.5 w-3.5 mr-1.5 fill-current" />
                      SupplyCheck Partner
                    </Badge>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight drop-shadow-md">
                      {supplier.name}
                    </h1>
                    {supplier.verified && <Verified className="h-6 w-6 text-primary drop-shadow" />}
                  </div>

                  {locationText && (
                    <div className="flex items-center gap-1.5 text-white/85 mb-5">
                      <MapPin className="h-4 w-4" />
                      <span>{locationText}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {supplier.is_partner && supplier.instant_quote_url && (
                      <a
                        href={supplier.instant_quote_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-supplier-partner text-black font-medium hover:scale-105 active:scale-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none transition-transform duration-200 h-10 px-4 rounded-md shadow-lg shadow-yellow-900/30"
                      >
                        <Star className="h-4 w-4 fill-current" />
                        Get instant quote
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    {supplier.website && (
                      <a
                        href={supplier.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:scale-105 active:scale-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none transition-transform duration-200 h-10 px-4 rounded-md"
                      >
                        <Globe className="h-4 w-4" />
                        Visit Website
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className={`max-w-5xl mx-auto px-4 py-8 ${supplier.hero_image_url ? "" : "pt-20"}`}>
          {!supplier.hero_image_url && (
            <Link
              href="/suppliers"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to suppliers
            </Link>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {!supplier.hero_image_url && (
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-5">
                      <SupplierLogo name={supplier.name} logoUrl={supplier.logo_url ?? undefined} size="2xl" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h1 className="text-2xl font-bold text-foreground">{supplier.name}</h1>
                          {supplier.verified && <Verified className="h-5 w-5 text-primary" />}
                        </div>
                        {locationText && (
                          <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
                            <MapPin className="h-4 w-4" />
                            <span>{locationText}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {(supplier.description || supplier.description_extended?.overview) && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="h-5 w-5 text-primary" /> About {supplier.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 text-muted-foreground leading-relaxed">
                      {(supplier.description_extended?.overview || supplier.description || "")
                        .split(/\n\n+/)
                        .filter((para) => para.trim().length > 0)
                        .map((para, i) => (
                          <p key={i}>{para}</p>
                        ))}
                    </div>
                    {supplier.description_extended?.unique_value && (
                      <div className="bg-accent/40 p-4 rounded-lg border-l-4 border-primary">
                        <h3 className="font-semibold mb-1 text-foreground flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" /> What sets them apart
                        </h3>
                        <p className="text-muted-foreground">{supplier.description_extended.unique_value}</p>
                      </div>
                    )}
                    {supplier.description_extended?.industries_served && supplier.description_extended.industries_served.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-primary" /> Industries served
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {supplier.description_extended.industries_served.map((industry, i) => (
                            <Badge key={i} variant="outline" className="text-sm px-3 py-1">
                              {industry}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {(supplier.description_extended?.capacity_notes || supplier.description_extended?.build_envelopes) && (
                      <div className="bg-muted/40 p-4 rounded-lg space-y-2">
                        <h3 className="font-semibold mb-1 text-foreground flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" /> Production capacity
                        </h3>
                        {supplier.description_extended?.capacity_notes && (
                          <p className="text-muted-foreground">{supplier.description_extended.capacity_notes}</p>
                        )}
                        {supplier.description_extended?.build_envelopes && (
                          <p className="text-sm text-muted-foreground/90">
                            <span className="font-medium text-foreground/80">Build envelopes:</span>{" "}
                            {supplier.description_extended.build_envelopes}
                          </p>
                        )}
                      </div>
                    )}
                    {supplier.description_extended?.equipment && supplier.description_extended.equipment.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-primary" /> Equipment
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {supplier.description_extended.equipment.map((machine, i) => (
                            <Badge key={i} variant="outline" className="text-sm px-3 py-1">
                              {machine}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {supplier.description_extended?.notable_projects && supplier.description_extended.notable_projects.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                          <Star className="h-4 w-4 text-primary" /> Notable projects
                        </h3>
                        <ul className="space-y-2">
                          {supplier.description_extended.notable_projects.map((project, i) => (
                            <li key={i} className="border-l-2 border-primary/40 pl-3 py-1">
                              <p className="font-medium text-foreground">{project.title}</p>
                              <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {supplier.gallery_images && supplier.gallery_images.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Camera className="h-5 w-5 text-primary" /> Photos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {supplier.gallery_images.map((photo, i) => (
                        <figure
                          key={i}
                          className="group rounded-xl overflow-hidden bg-muted/40 ring-1 ring-border/60 shadow-[0_10px_30px_-12px_hsl(var(--primary)/0.20),0_4px_8px_-4px_hsl(220_30%_8%/0.18)] hover:shadow-[0_18px_40px_-10px_hsl(var(--primary)/0.32),0_6px_12px_-4px_hsl(220_30%_8%/0.25)] hover:-translate-y-0.5 transition-transform duration-300"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photo.url}
                              alt={photo.alt}
                              loading="lazy"
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                            />
                            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                          </div>
                          {photo.caption && (
                            <figcaption className="px-4 py-3 text-sm text-muted-foreground">{photo.caption}</figcaption>
                          )}
                        </figure>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {supplier.technologies.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Cpu className="h-5 w-5 text-primary" /> Technologies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {supplier.technologies.map((tech) => (
                        <Link key={tech.id} href={`/suppliers?tech=${tech.slug}`}>
                          <div className="flex items-center gap-2 p-2 rounded-md border border-border hover:border-primary/40 transition-colors cursor-pointer">
                            <span className="text-sm text-foreground">{tech.name}</span>
                            {tech.category && <span className="text-xs text-muted-foreground ml-auto">{tech.category}</span>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {supplier.materials.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Factory className="h-5 w-5 text-primary" /> Materials
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {supplier.materials.map((mat) => (
                        <Link key={mat.id} href={`/suppliers?mat=${mat.slug}`}>
                          <div className="flex items-center gap-2 p-2 rounded-md border border-border hover:border-primary/40 transition-colors cursor-pointer">
                            <span className="text-sm text-foreground">{mat.name}</span>
                            {mat.category && <span className="text-xs text-muted-foreground ml-auto">{mat.category}</span>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {supplier.certifications.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="h-5 w-5 text-primary" /> Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {supplier.certifications.map((cert) => (
                        <Badge key={cert.id} className="text-sm py-1.5 px-3 bg-primary/10 text-primary border border-primary/20">
                          {cert.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {supplier.tags.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Tag className="h-5 w-5 text-primary" /> Capabilities & Industries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {supplier.tags.map((tag) => (
                        <Badge key={tag.id} variant="outline" className="text-sm py-1.5 px-3">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <Card className="bg-card border-border sticky top-24">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-semibold text-foreground">Contact Supplier</h3>

                  {supplier.website && (
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full rounded-md bg-primary text-primary-foreground hover:bg-primary-hover h-10 px-4 text-sm font-medium transition-colors"
                    >
                      Visit Website <ExternalLink className="h-4 w-4" />
                    </a>
                  )}

                  <div className="space-y-3 text-sm">
                    {supplier.website && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="h-4 w-4 flex-shrink-0" />
                        <a
                          href={supplier.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-foreground transition-colors truncate"
                        >
                          {supplier.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </a>
                      </div>
                    )}
                    {locationText && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4 flex-shrink-0" />
                        <span>{locationText}</span>
                      </div>
                    )}
                    {supplier.verified && (
                      <div className="flex items-center gap-2 text-primary">
                        <Verified className="h-4 w-4 flex-shrink-0" />
                        <span>Verified Supplier</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-3">Quick Facts</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Technologies</span>
                      <span className="text-foreground font-medium">{supplier.technologies.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Materials</span>
                      <span className="text-foreground font-medium">{supplier.materials.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Certifications</span>
                      <span className="text-foreground font-medium">{supplier.certifications.length}</span>
                    </div>
                    {supplier.country?.region && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Region</span>
                        <span className="text-foreground font-medium">{supplier.country.region}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
