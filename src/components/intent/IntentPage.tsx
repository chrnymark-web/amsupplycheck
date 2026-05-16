import Link from "next/link";
import Navbar from "@/components/ui/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, ExternalLink } from "lucide-react";
import type { IntentPageConfig } from "@/lib/intentPages";
import { getCategoryBySlug } from "@/lib/seoSlugs";
import { TECHNOLOGY_CATEGORY_SLUGS } from "@/lib/categoryLanding";

type RelatedLink = { href: string; label: string };

function resolveRelatedLink(slug: string): RelatedLink | null {
  const cat = getCategoryBySlug(slug);
  if (!cat) return null;

  if (cat.type === "technology" && TECHNOLOGY_CATEGORY_SLUGS.includes(slug)) {
    return { href: `/categories/technology/${slug}`, label: cat.label };
  }

  return {
    href: `/suppliers?q=${encodeURIComponent(cat.label)}`,
    label: cat.label,
  };
}

export default function IntentPage({ cfg }: { cfg: IntentPageConfig }) {
  const url = `https://www.amsupplycheck.com/${cfg.slug}`;

  const relatedLinks = cfg.relatedSlugs
    .map(resolveRelatedLink)
    .filter((l): l is RelatedLink => l !== null);

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: cfg.metaTitle,
    description: cfg.metaDescription,
    url,
    isPartOf: {
      "@type": "WebSite",
      name: "AMSupplyCheck",
      url: "https://www.amsupplycheck.com",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: cfg.faqs.map((faq) => ({
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
      { "@type": "ListItem", position: 2, name: cfg.h1, item: url },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
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
          <span className="text-foreground">{cfg.h1}</span>
        </nav>
      </div>

      <header className="max-w-4xl mx-auto px-4 pt-8 pb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
          {cfg.h1}
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mb-8">
          {cfg.heroSubtitle}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href={cfg.ctaLink}>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {cfg.ctaText} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          {cfg.secondaryCta && (
            <Link href={cfg.secondaryCta.link}>
              <Button variant="outline">
                {cfg.secondaryCta.text}
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </header>

      <section className="py-12 px-4 border-t border-border bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {cfg.faqs.map((faq, i) => (
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

      {relatedLinks.length > 0 && (
        <section className="py-12 px-4 border-t border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Related Categories
            </h2>
            <div className="flex flex-wrap gap-2">
              {relatedLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Badge
                    variant="secondary"
                    className="hover:bg-primary/20 transition-colors cursor-pointer py-1.5 px-3"
                  >
                    {link.label}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 px-4 bg-primary/5 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Compare verified suppliers
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
