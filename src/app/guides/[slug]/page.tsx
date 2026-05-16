import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/ui/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BookOpen,
  ExternalLink,
  Lightbulb,
} from "lucide-react";
import {
  GUIDE_ARTICLES,
  getGuideBySlug,
  type GuideSection,
} from "@/lib/guideArticles";
import { TECHNOLOGY_GLOSSARY } from "@/lib/technologyGlossary";

export const revalidate = 86400;
export const dynamicParams = false;

// Map supplier-CTA pSEO slugs to working /suppliers?q= queries.
// The pSEO landing routes (/categories/technology/[slug]) are currently
// 308 stubs in this codebase, and /suppliers does not consume ?tech=.
// Linking to ?q=keyword gets users to a filtered supplier list today.
const SUPPLIER_CTA_QUERY: Record<string, string> = {
  "sla-3d-printing": "SLA",
  "sls-3d-printing": "SLS",
  "fdm-3d-printing": "FDM",
  "mjf-3d-printing": "Multi Jet Fusion",
  "dmls-3d-printing": "DMLS",
  "slm-3d-printing": "SLM",
  "binder-jetting": "Binder Jetting",
  "metal-3d-printing": "metal",
  "nylon-3d-printing": "Nylon",
  "cnc-machining": "CNC",
  "cnc-machining-germany": "CNC Germany",
  "cnc-machining-united-kingdom": "CNC United Kingdom",
  "cnc-machining-europe": "CNC",
};

function supplierCtaHref(slug: string): string {
  const q = SUPPLIER_CTA_QUERY[slug] ?? slug;
  return `/suppliers?q=${encodeURIComponent(q)}`;
}

export async function generateStaticParams() {
  return GUIDE_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) {
    return {
      title: "Guide not found | AMSupplyCheck",
      robots: { index: false, follow: false },
    };
  }
  const url = `https://www.amsupplycheck.com/guides/${guide.slug}`;
  return {
    title: { absolute: guide.metaTitle },
    description: guide.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: guide.metaTitle,
      description: guide.metaDescription,
      url,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: guide.metaTitle,
      description: guide.metaDescription,
    },
  };
}

export default async function GuideArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const url = `https://www.amsupplycheck.com/guides/${guide.slug}`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.h1,
    description: guide.metaDescription,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: {
      "@type": "Organization",
      name: "AMSupplyCheck",
      url: "https://www.amsupplycheck.com",
    },
    publisher: {
      "@type": "Organization",
      name: "AMSupplyCheck",
      logo: {
        "@type": "ImageObject",
        url: "https://www.amsupplycheck.com/amsupplycheck-logo-white.png",
      },
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://www.amsupplycheck.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Guides",
        item: "https://www.amsupplycheck.com/guides",
      },
      { "@type": "ListItem", position: 3, name: guide.title, item: url },
    ],
  };

  const categoryLabel = guide.category
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Navbar />

      <div className="max-w-4xl mx-auto px-4 pt-6">
        <nav className="text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link
            href="/guides"
            className="hover:text-foreground transition-colors"
          >
            Guides
          </Link>
          <span>/</span>
          <span className="text-foreground">{guide.title}</span>
        </nav>
      </div>

      <header className="max-w-4xl mx-auto px-4 pt-8 pb-12">
        <Badge variant="secondary" className="mb-4">
          {categoryLabel}
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
          {guide.h1}
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
          {guide.intro}
        </p>
      </header>

      <article className="max-w-4xl mx-auto px-4 pb-16 space-y-12">
        {guide.sections.map((section, i) => (
          <SectionRenderer key={i} section={section} />
        ))}
      </article>

      <section className="py-16 px-4 border-t border-border bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {guide.faqs.map((faq, i) => (
              <details
                key={i}
                className="group border border-border rounded-lg overflow-hidden bg-card"
                open={i === 0}
              >
                <summary className="cursor-pointer list-none p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <span className="font-medium text-foreground pr-4">
                    {faq.question}
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-muted-foreground text-xl leading-none transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <div className="p-4 border-t border-border">
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {guide.relatedGuides.length > 0 && (
        <section className="py-12 px-4 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Related Guides
            </h2>
            <div className="flex flex-wrap gap-2">
              {guide.relatedGuides.map((relatedSlug) => {
                const related = getGuideBySlug(relatedSlug);
                if (!related) return null;
                return (
                  <Link key={relatedSlug} href={`/guides/${relatedSlug}`}>
                    <Badge
                      variant="secondary"
                      className="hover:bg-primary/20 transition-colors cursor-pointer py-1.5 px-3"
                    >
                      {related.title}
                    </Badge>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 px-4 bg-primary/5 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Find a supplier for your project
          </h2>
          <p className="text-muted-foreground mb-6">
            Browse our directory of verified manufacturing partners and request
            quotes from multiple suppliers at once.
          </p>
          <Link href="/suppliers">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Browse Suppliers <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function SectionRenderer({ section }: { section: GuideSection }) {
  if (section.type === "text") {
    return (
      <div>
        {section.heading && (
          <h2 className="text-2xl font-bold text-foreground mb-3">
            {section.heading}
          </h2>
        )}
        {section.content && (
          <p className="text-muted-foreground leading-relaxed">
            {section.content}
          </p>
        )}
      </div>
    );
  }

  if (section.type === "key_takeaway") {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6 flex gap-4">
          <Lightbulb className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
          <div>
            {section.heading && (
              <h3 className="font-bold text-foreground mb-2">
                {section.heading}
              </h3>
            )}
            {section.content && (
              <p className="text-muted-foreground leading-relaxed">
                {section.content}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (section.type === "comparison_table" && section.technologies) {
    return <ComparisonTable technologies={section.technologies} />;
  }

  if (section.type === "supplier_cta" && section.supplierSlugs) {
    return <SupplierCTASection slugs={section.supplierSlugs} />;
  }

  return null;
}

function ComparisonTable({ technologies }: { technologies: string[] }) {
  const techData = technologies
    .map((key) => ({ key, info: TECHNOLOGY_GLOSSARY[key] }))
    .filter((t) => t.info);

  if (techData.length === 0) return null;

  const priceLabels: Record<string, string> = {
    low: "€",
    medium: "€€",
    high: "€€€",
    "very-high": "€€€€",
  };
  const renderStars = (level: number) =>
    "★".repeat(level) + "☆".repeat(5 - level);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-border rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left p-3 text-sm font-semibold text-foreground border-b border-border">
              Property
            </th>
            {techData.map((t) => (
              <th
                key={t.key}
                className="text-center p-3 text-sm font-semibold text-foreground border-b border-border"
              >
                {t.info.abbreviation}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-3 text-sm text-muted-foreground border-b border-border">
              Full Name
            </td>
            {techData.map((t) => (
              <td
                key={t.key}
                className="text-center p-3 text-sm text-foreground border-b border-border"
              >
                {t.info.name}
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-3 text-sm text-muted-foreground border-b border-border">
              Price Range
            </td>
            {techData.map((t) => (
              <td
                key={t.key}
                className="text-center p-3 text-sm font-medium border-b border-border"
              >
                {priceLabels[t.info.priceRange] || "?"}
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-3 text-sm text-muted-foreground border-b border-border">
              Strength
            </td>
            {techData.map((t) => (
              <td
                key={t.key}
                className="text-center p-3 text-sm border-b border-border"
              >
                {renderStars(t.info.strengthLevel)}
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-3 text-sm text-muted-foreground border-b border-border">
              Detail
            </td>
            {techData.map((t) => (
              <td
                key={t.key}
                className="text-center p-3 text-sm border-b border-border"
              >
                {renderStars(t.info.detailLevel)}
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-3 text-sm text-muted-foreground border-b border-border">
              Speed
            </td>
            {techData.map((t) => (
              <td
                key={t.key}
                className="text-center p-3 text-sm border-b border-border"
              >
                {renderStars(t.info.speedLevel)}
              </td>
            ))}
          </tr>
          <tr>
            <td className="p-3 text-sm text-muted-foreground">Best For</td>
            {techData.map((t) => (
              <td
                key={t.key}
                className="text-center p-3 text-sm text-muted-foreground"
              >
                {t.info.bestFor.slice(0, 2).join(", ")}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SupplierCTASection({
  slugs,
}: {
  slugs: { slug: string; label: string }[];
}) {
  return (
    <div className="bg-muted/30 rounded-lg p-6 border border-border">
      <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
        <ExternalLink className="h-5 w-5 text-primary" />
        Find Verified Suppliers
      </h3>
      <div className="flex flex-wrap gap-3">
        {slugs.map(({ slug, label }) => (
          <Link key={slug} href={supplierCtaHref(slug)}>
            <Button variant="outline" className="hover:border-primary/50">
              {label}
            </Button>
          </Link>
        ))}
        <Link href="/match">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Get Matched <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
