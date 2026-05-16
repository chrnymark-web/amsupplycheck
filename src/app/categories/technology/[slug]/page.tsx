import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/ui/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, ExternalLink } from "lucide-react";
import {
  TECHNOLOGY_CATEGORY_SLUGS,
  TECHNOLOGY_CATEGORY_ENTRIES,
  getTechnologyCategoryBySlug,
} from "@/lib/categoryLanding";
import { getCategoryBySlug, getRelatedCategories } from "@/lib/seoSlugs";
import { TECH_ENTRIES } from "@/lib/knowledgeEntries";

export const revalidate = 86400;
export const dynamicParams = false;

type Params = { slug: string };

export async function generateStaticParams() {
  return TECHNOLOGY_CATEGORY_ENTRIES.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = getTechnologyCategoryBySlug(slug);
  if (!entry) {
    return {
      title: "Category not found | AMSupplyCheck",
      robots: { index: false, follow: false },
    };
  }
  const url = `https://www.amsupplycheck.com/categories/technology/${slug}`;
  return {
    title: { absolute: `${entry.filter.title} | AMSupplyCheck` },
    description: entry.filter.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${entry.filter.title} | AMSupplyCheck`,
      description: entry.filter.description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${entry.filter.title} | AMSupplyCheck`,
      description: entry.filter.description,
    },
  };
}

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

const KNOWLEDGE_TECH_SLUGS = new Set(TECH_ENTRIES.map((e) => e.slug));

function knowledgeLinkForLabel(label: string): string | null {
  const slug = label
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (KNOWLEDGE_TECH_SLUGS.has(slug)) return `/knowledge/technology/${slug}`;
  const trimmedSlug = slug.replace(/-3d-printing$/, "");
  if (KNOWLEDGE_TECH_SLUGS.has(trimmedSlug))
    return `/knowledge/technology/${trimmedSlug}`;
  return null;
}

export default async function CategoryTechnologyPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const entry = getTechnologyCategoryBySlug(slug);
  if (!entry) notFound();

  const { filter: cat } = entry;
  const url = `https://www.amsupplycheck.com/categories/technology/${slug}`;
  const supplierHref = `/suppliers?q=${encodeURIComponent(cat.label)}`;
  const techKeys = cat.filters.technologies ?? [];
  const knowledgeHref = knowledgeLinkForLabel(cat.label);

  const relatedLinks: RelatedLink[] = getRelatedCategories(slug)
    .map((r) => resolveRelatedLink(r.slug))
    .filter((l): l is RelatedLink => l !== null);

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: cat.title,
    description: cat.description,
    url,
    isPartOf: {
      "@type": "WebSite",
      name: "AMSupplyCheck",
      url: "https://www.amsupplycheck.com",
    },
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
        name: "Technologies",
        item: "https://www.amsupplycheck.com/technology-guide",
      },
      { "@type": "ListItem", position: 3, name: cat.label, item: url },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
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
            href="/technology-guide"
            className="hover:text-foreground transition-colors"
          >
            Technologies
          </Link>
          <span>/</span>
          <span className="text-foreground">{cat.label}</span>
        </nav>
      </div>

      <header className="max-w-4xl mx-auto px-4 pt-8 pb-10">
        <Badge variant="secondary" className="mb-4">
          Technology
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
          {cat.label}
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mb-8">
          {cat.description}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href={supplierHref}>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Browse {cat.label} Suppliers{" "}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/match">
            <Button variant="outline">
              Get Matched
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {techKeys.length > 0 && (
        <section className="py-10 px-4 border-t border-border bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-foreground mb-4">
              What we cover
            </h2>
            <p className="text-muted-foreground mb-4">
              This category includes suppliers offering any of the following
              technology variants:
            </p>
            <div className="flex flex-wrap gap-2">
              {techKeys.map((key) => (
                <Badge key={key} variant="outline" className="py-1.5 px-3">
                  {key}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-10 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Learn more
          </h2>
          <div className="flex flex-wrap gap-3">
            {knowledgeHref && (
              <Link href={knowledgeHref}>
                <Button variant="outline">
                  Technology Overview
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
            <Link href="/compatibility">
              <Button variant="outline">
                Compatibility Matrix
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/technology-guide">
              <Button variant="outline">
                All Technologies
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
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
                <Link key={link.href + link.label} href={link.href}>
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
            Find a {cat.label} supplier
          </h2>
          <p className="text-muted-foreground mb-6">
            Browse our directory of verified manufacturing partners and request
            quotes from multiple suppliers at once.
          </p>
          <Link href={supplierHref}>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Browse Suppliers <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
