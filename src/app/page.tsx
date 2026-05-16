import type { Metadata } from "next";
import Link from "next/link";
import { getVerifiedSuppliers } from "@/lib/suppliers";
import { getAllMaterials, getAllTechnologies } from "@/lib/supplierData";
import { getPopularCategories } from "@/lib/seoSlugs";
import Navbar from "@/components/ui/navbar";
import CinematicHero from "@/components/hero/CinematicHero";
import { HeroUploadTabs } from "@/components/hero/HeroUploadTabs";
import PageVideoBackground from "@/components/layout/PageVideoBackground";
import CookieConsent from "@/components/layout/CookieConsent";
import FloatingNav from "@/components/layout/FloatingNav";
import NewsletterSignup from "@/components/forms/NewsletterSignup";
import SupplierLogo from "@/components/ui/supplier-logo";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  Globe,
  Zap,
  Star,
  Search,
  ArrowRight,
  Shield,
  Users,
  MapPin,
  Upload,
  BarChart3,
  Sparkles,
} from "lucide-react";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "AMSupplyCheck — Find 3D Printing Suppliers Worldwide",
  description:
    "Connect with verified 3D printing suppliers worldwide. Filter by materials, technologies, and location to find the perfect match for your project.",
  alternates: { canonical: "https://www.amsupplycheck.com/" },
  openGraph: {
    title: "AMSupplyCheck — Find 3D Printing Suppliers Worldwide",
    description:
      "Connect with verified 3D printing suppliers worldwide. Filter by materials, technologies, and location to find the perfect match for your project.",
    url: "https://www.amsupplycheck.com/",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function HomePage() {
  const suppliers = await getVerifiedSuppliers();
  const supplierCount = suppliers.length;
  const countryCount = new Set(
    suppliers.map((s) => s.location_country).filter((c): c is string => Boolean(c))
  ).size;
  const technologyCount = getAllTechnologies().length;
  const materialCount = getAllMaterials().length;
  const popularCategories = getPopularCategories();
  const featuredSuppliers = suppliers.slice(0, 12);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.amsupplycheck.com/#organization",
        name: "AMSupplyCheck",
        url: "https://www.amsupplycheck.com/",
        logo: "https://www.amsupplycheck.com/amsupplycheck-logo-white.png",
        description:
          "Verified directory of additive manufacturing suppliers worldwide. Compare 3D printing services by technology, material, certification, and location.",
      },
      {
        "@type": "WebSite",
        "@id": "https://www.amsupplycheck.com/#website",
        url: "https://www.amsupplycheck.com/",
        name: "AMSupplyCheck",
        publisher: { "@id": "https://www.amsupplycheck.com/#organization" },
        potentialAction: {
          "@type": "SearchAction",
          target: "https://www.amsupplycheck.com/search?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-transparent relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageVideoBackground />

      <Navbar />

      <CinematicHero>
        <div className="flex min-h-[68svh] w-full flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="max-w-7xl mx-auto text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-4 md:mb-5">
                Find AM suppliers by capability, not by name
              </h1>
              <p className="text-lg md:text-2xl font-semibold bg-gradient-primary bg-clip-text text-transparent mb-8 md:mb-10">
                Search 3D printing technologies, materials &amp; expertise
              </p>

              <form
                action="/suppliers"
                method="get"
                className="max-w-2xl mx-auto mb-8 md:mb-10 relative"
              >
                <div className="bg-background/60 backdrop-blur-sm rounded-xl shadow-lg shadow-black/20 p-2 sm:p-2.5 border border-border/20 flex items-center gap-2">
                  <Search className="h-5 w-5 text-muted-foreground ml-2 flex-shrink-0" />
                  <input
                    name="q"
                    type="text"
                    placeholder="Search by technology, material, or capability…"
                    className="flex-1 bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground py-3 px-2"
                    aria-label="Search suppliers"
                  />
                  <button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-5 py-2.5 font-medium transition-colors"
                  >
                    Search
                  </button>
                </div>
              </form>

              <HeroUploadTabs />

              <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-supplier-verified mr-2" />
                  {supplierCount} Verified Suppliers
                </div>
                <div className="flex items-center">
                  <Globe className="h-4 w-4 text-primary mr-2" />
                  {countryCount} Countries
                </div>
                <div className="flex items-center">
                  <Zap className="h-4 w-4 text-primary mr-2" />
                  {technologyCount} Technologies
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-primary mr-2" />
                  {materialCount} Materials
                </div>
              </div>
            </div>
          </div>
        </div>
      </CinematicHero>

      {/* Quick Tools — direct entry points to the matching, STL, pricing, and directory tools */}
      <section id="tools" className="py-12 md:py-16 relative z-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Get started in seconds
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Four tools to find the right supplier for your project — pick the one that fits how you start.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/match" className="group">
              <Card className="h-full bg-card border-border hover:border-primary/40 transition-colors">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                    Smart Match
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Describe what you need in plain English and get matched to suppliers with the right capabilities.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    Start matching <ArrowRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/stl-match" className="group">
              <Card className="h-full bg-card border-border hover:border-primary/40 transition-colors">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                    Upload STL
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Drop in a 3D file. We analyze the geometry and match it to suppliers that can print it.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    Upload file <ArrowRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/compare-prices" className="group">
              <Card className="h-full bg-card border-border hover:border-primary/40 transition-colors">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                    Compare Prices
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Get live quotes across multiple 3D printing services in seconds, side-by-side.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    Get quotes <ArrowRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/suppliers" className="group">
              <Card className="h-full bg-card border-border hover:border-primary/40 transition-colors">
                <CardContent className="p-5">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                    Browse Directory
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Explore all {supplierCount} verified suppliers — filter by technology, material, and location.
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    Browse suppliers <ArrowRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Suppliers — server-rendered list for SEO */}
      <section id="suppliers" className="py-16 relative z-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Featured 3D Printing Suppliers
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Browse {supplierCount} verified additive manufacturing suppliers across {countryCount} countries.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {featuredSuppliers.map((s) => (
              <Link key={s.id} href={`/suppliers/${s.supplier_id}`} className="group">
                <Card className="h-full bg-card border-border transition-shadow hover:shadow-lg">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <SupplierLogo name={s.name} logoUrl={s.logo_url ?? undefined} size="lg" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {s.name}
                        </h3>
                        {(s.location_city || s.location_country) && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {[s.location_city, s.location_country].filter(Boolean).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    {s.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{s.description}</p>
                    )}
                    {s.is_partner && (
                      <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-supplier-partner">
                        <Star className="h-3 w-3 fill-current" /> SupplyCheck Partner
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/suppliers"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-3 font-medium transition-colors"
            >
              View all {supplierCount} suppliers <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why choose us — static SEO content */}
      <section id="why-choose" className="py-16 bg-background/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-12 text-center">
            Why choose AMSupplyCheck
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Shield className="h-8 w-8 text-primary" />,
                title: "Verified suppliers",
                body: "Every supplier is verified for technology, certifications, and active production capability.",
              },
              {
                icon: <Search className="h-8 w-8 text-primary" />,
                title: "Capability-first search",
                body: "Find suppliers by what they print — not by name. Filter by technology, material, and location.",
              },
              {
                icon: <Globe className="h-8 w-8 text-primary" />,
                title: "Global coverage",
                body: `${countryCount} countries, every continent. Sourcing locally or globally, you'll find a match.`,
              },
              {
                icon: <Users className="h-8 w-8 text-primary" />,
                title: "Independent directory",
                body: "We don't compete with the suppliers we list. Recommendations are unbiased.",
              },
            ].map((card, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="mb-4">{card.icon}</div>
                  <h3 className="font-semibold text-foreground mb-2">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter signup */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Stay updated on additive manufacturing
          </h2>
          <p className="text-muted-foreground mb-6">
            Get monthly reports on new suppliers, materials, and 3D printing capabilities.
          </p>
          <NewsletterSignup />
        </div>
      </section>

      {/* Browse by category — SEO internal linking */}
      <section className="py-16 bg-background/30 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
            Browse 3D Printing Suppliers by Category
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {popularCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categories/technology/${cat.slug}`}
                className="block px-4 py-3 rounded-lg bg-card border border-border hover:border-primary/40 hover:bg-card/80 transition-colors text-sm font-medium text-foreground"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-background/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} AMSupplyCheck. Find verified 3D printing &amp; additive manufacturing suppliers worldwide.
          </p>
        </div>
      </footer>

      <FloatingNav />
      <CookieConsent />
    </div>
  );
}
