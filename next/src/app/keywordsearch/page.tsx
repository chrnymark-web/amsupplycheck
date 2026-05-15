import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Search as SearchIcon, ArrowRight } from "lucide-react";
import Navbar from "@/components/ui/navbar";
import PageVideoBackground from "@/components/layout/PageVideoBackground";
import FloatingNav from "@/components/layout/FloatingNav";
import CookieConsent from "@/components/layout/CookieConsent";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPopularCategories } from "@/lib/seoSlugs";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Smart Search — Find 3D Printing Suppliers by Description | AMSupplyCheck",
  description:
    "Search for 3D printing and additive manufacturing suppliers using natural language. Describe your project — materials, technologies, region — and find verified suppliers that match.",
  alternates: { canonical: "https://amsupplycheck.com/keywordsearch" },
  openGraph: {
    title: "Smart Search — Find 3D Printing Suppliers by Description",
    description:
      "Search for 3D printing and additive manufacturing suppliers using natural language. Describe your project and find verified suppliers that match.",
    url: "https://amsupplycheck.com/keywordsearch",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Search — Find 3D Printing Suppliers by Description",
    description:
      "Describe your project — materials, technologies, region — and find verified 3D printing suppliers that match.",
  },
};

const EXAMPLE_QUERIES: { label: string; q: string }[] = [
  { label: "Metal parts for aerospace in Europe", q: "metal aerospace europe" },
  { label: "Flexible TPU prototypes in Scandinavia", q: "flexible TPU scandinavia" },
  { label: "PEEK medical components", q: "peek medical" },
  { label: "Large-format FDM enclosures in the UK", q: "large format FDM uk" },
  { label: "Titanium DMLS service in Germany", q: "titanium dmls germany" },
  { label: "ISO 9001 certified suppliers in the US", q: "iso 9001 united states" },
];

export default function KeywordSearchPage() {
  const popularCategories = getPopularCategories();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Smart Search — 3D Printing Suppliers",
    description:
      "Search for 3D printing and additive manufacturing suppliers using natural language. Describe materials, technologies, and region to find verified matches.",
    url: "https://amsupplycheck.com/keywordsearch",
    isPartOf: {
      "@type": "WebSite",
      name: "AMSupplyCheck",
      url: "https://amsupplycheck.com/",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: "https://amsupplycheck.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="min-h-screen bg-transparent relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageVideoBackground />
      <Navbar />

      <main className="relative z-0 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-5">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary">Smart Search</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            Describe your project, find suppliers
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Search for 3D printing and additive manufacturing suppliers using natural language.
            Mention the materials, technologies, certifications, or region you need — we&rsquo;ll
            match you with verified providers.
          </p>
        </div>

        {/* Search form */}
        <form action="/search" method="get" className="max-w-2xl mx-auto mb-10">
          <div className="bg-background/60 backdrop-blur-sm rounded-xl shadow-lg shadow-black/20 p-2 border border-border/20 flex items-center gap-2">
            <SearchIcon className="h-5 w-5 text-muted-foreground ml-2 flex-shrink-0" />
            <input
              name="q"
              type="text"
              placeholder="Try: metal parts for aerospace in Europe"
              className="flex-1 bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground py-2.5 px-2"
              aria-label="Describe what you're looking for"
              autoFocus
            />
            <button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-5 py-2 font-medium transition-colors flex items-center gap-1"
            >
              Search <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* Example queries */}
        <section className="mb-12">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4 text-center">
            Try one of these
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_QUERIES.map((ex) => (
              <Link
                key={ex.q}
                href={`/search?q=${encodeURIComponent(ex.q)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 backdrop-blur-sm border border-border hover:border-primary/40 hover:bg-card text-sm text-foreground transition-colors"
              >
                {ex.label}
              </Link>
            ))}
          </div>
        </section>

        {/* Popular categories */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-foreground mb-4 text-center">
            Browse popular categories
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Jump straight to a curated supplier directory for any of the most-searched 3D printing
            categories.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {popularCategories.map((c) => (
              <Link
                key={c.slug}
                href={`/search?q=${encodeURIComponent(c.label.replace(/ 3D Printing$/i, ""))}`}
                className="group block"
              >
                <Card className="h-full bg-card/60 backdrop-blur-sm border-border hover:border-primary/40 hover:shadow-lg transition-all">
                  <CardContent className="p-4 flex flex-col gap-2">
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {c.label}
                    </span>
                    <Badge
                      variant="outline"
                      className="self-start text-xs font-normal capitalize"
                    >
                      {c.type}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* SEO copy */}
        <section className="prose prose-sm max-w-3xl mx-auto text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground mb-3">
            How smart search works
          </h2>
          <p>
            AMSupplyCheck&rsquo;s smart search lets you describe what you need in plain English.
            Combine multiple criteria in a single query — for example, a material like
            &ldquo;titanium&rdquo; or &ldquo;carbon fiber&rdquo;, a technology like
            &ldquo;DMLS&rdquo; or &ldquo;MJF&rdquo;, a region like &ldquo;Scandinavia&rdquo; or
            &ldquo;the UK&rdquo;, or a certification like &ldquo;ISO 9001&rdquo;. The search runs
            against our verified directory of additive manufacturing suppliers worldwide.
          </p>
          <p>
            For more granular control, switch to{" "}
            <Link href="/search" className="text-primary hover:underline">
              the structured filter view
            </Link>{" "}
            or browse by{" "}
            <Link href="/browse" className="text-primary hover:underline">
              technology and material category
            </Link>
            .
          </p>
        </section>
      </main>

      <FloatingNav />
      <CookieConsent />
    </div>
  );
}
