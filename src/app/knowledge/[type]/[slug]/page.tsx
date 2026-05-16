import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/ui/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  Cpu,
  Factory,
  FlaskConical,
  Layers,
  Target,
  Zap,
} from "lucide-react";
import {
  TECH_ENTRIES,
  MATERIAL_ENTRIES,
  getTechBySlug,
  getMaterialBySlug,
  TECH_CATEGORY_LABEL,
  type TechEntry,
  type MaterialEntry,
} from "@/lib/knowledgeEntries";

export const revalidate = 86400;
export const dynamicParams = false;

const PRICE_LABEL: Record<"low" | "medium" | "high" | "very-high", string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  "very-high": "Very high",
};

export async function generateStaticParams() {
  return [
    ...TECH_ENTRIES.map((entry) => ({ type: "technology", slug: entry.slug })),
    ...MATERIAL_ENTRIES.map((entry) => ({ type: "material", slug: entry.slug })),
  ];
}

function pageTitleFor(entry: TechEntry | MaterialEntry, type: "technology" | "material") {
  return type === "technology"
    ? `${entry.data.name} (${(entry as TechEntry).data.abbreviation}) — 3D Printing Technology | AMSupplyCheck`
    : `${entry.data.name} — 3D Printing Material | AMSupplyCheck`;
}

function descriptionFor(entry: TechEntry | MaterialEntry) {
  return entry.data.shortDescription;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string; slug: string }>;
}): Promise<Metadata> {
  const { type, slug } = await params;
  if (type !== "technology" && type !== "material") {
    return {
      title: "Knowledge entry not found | AMSupplyCheck",
      robots: { index: false, follow: false },
    };
  }
  const entry =
    type === "technology" ? getTechBySlug(slug) : getMaterialBySlug(slug);
  if (!entry) {
    return {
      title: "Knowledge entry not found | AMSupplyCheck",
      robots: { index: false, follow: false },
    };
  }
  const url = `https://www.amsupplycheck.com/knowledge/${type}/${slug}`;
  const title = pageTitleFor(entry, type);
  const description = descriptionFor(entry);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground">{value}/5</span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              i <= value ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function relatedEntries<T extends TechEntry | MaterialEntry>(
  all: T[],
  current: T,
  limit: number,
): T[] {
  const sameCategory = all.filter(
    (e) => e.slug !== current.slug && e.data.category === current.data.category,
  );
  if (sameCategory.length >= limit) return sameCategory.slice(0, limit);
  const others = all.filter(
    (e) => e.slug !== current.slug && e.data.category !== current.data.category,
  );
  return [...sameCategory, ...others].slice(0, limit);
}

export default async function KnowledgeDetailPage({
  params,
}: {
  params: Promise<{ type: string; slug: string }>;
}) {
  const { type, slug } = await params;
  const isTech = type === "technology";
  const entry = isTech ? getTechBySlug(slug) : getMaterialBySlug(slug);
  if (!entry) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Knowledge entry not found
          </h1>
          <p className="text-muted-foreground mb-6">
            This {type} is not available in our knowledge hub.
          </p>
          <Link href="/knowledge">
            <Button>Back to Knowledge Hub</Button>
          </Link>
        </main>
      </div>
    );
  }

  const url = `https://www.amsupplycheck.com/knowledge/${type}/${slug}`;
  const supplierHref = `/suppliers?q=${encodeURIComponent(entry.data.name)}`;

  const definedTermJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: entry.data.name,
    description: entry.data.shortDescription,
    url,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: isTech
        ? "3D Printing Technologies"
        : "3D Printing Materials",
      url: "https://www.amsupplycheck.com/knowledge",
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
        item: "https://www.amsupplycheck.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Knowledge",
        item: "https://www.amsupplycheck.com/knowledge",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: isTech ? "Technologies" : "Materials",
        item: "https://www.amsupplycheck.com/knowledge",
      },
      {
        "@type": "ListItem",
        position: 4,
        name: entry.data.name,
        item: url,
      },
    ],
  };

  const related = isTech
    ? relatedEntries(TECH_ENTRIES, entry as TechEntry, 4)
    : relatedEntries(MATERIAL_ENTRIES, entry as MaterialEntry, 4);

  const categoryLabel = isTech
    ? TECH_CATEGORY_LABEL[(entry as TechEntry).data.category]
    : (entry as MaterialEntry).data.category;

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(definedTermJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Navbar />

      <main className="max-w-5xl mx-auto px-4 pt-12 pb-24">
        <div className="mb-6">
          <Link
            href="/knowledge"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Knowledge Hub
          </Link>
        </div>

        <header className="mb-10">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              {isTech ? (
                <Cpu className="h-6 w-6 text-primary" />
              ) : (
                <FlaskConical className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h1 className="text-3xl font-bold text-foreground">
                  {entry.data.name}
                </h1>
                {isTech && (
                  <Badge variant="secondary" className="text-xs">
                    {(entry as TechEntry).data.abbreviation}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs capitalize">
                  {categoryLabel}
                </Badge>
              </div>
              <p className="text-lg text-muted-foreground">
                {isTech
                  ? (entry as TechEntry).data.longDescription
                  : (entry as MaterialEntry).data.shortDescription}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <Link href={supplierHref}>
              <Button>
                <Factory className="h-4 w-4 mr-2" />
                Find suppliers offering {entry.data.name}
              </Button>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {isTech ? (
              <>
                <Card className="border-border">
                  <CardContent className="p-6">
                    <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" /> Best for
                    </h2>
                    <ul className="space-y-2">
                      {(entry as TechEntry).data.bestFor.map((item, i) => (
                        <li
                          key={i}
                          className="text-sm text-muted-foreground flex items-start gap-2"
                        >
                          <Zap className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardContent className="p-6">
                    <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />{" "}
                      Limitations
                    </h2>
                    <ul className="space-y-2">
                      {(entry as TechEntry).data.limitations.map((item, i) => (
                        <li
                          key={i}
                          className="text-sm text-muted-foreground flex items-start gap-2"
                        >
                          <span className="text-amber-500 mt-0.5 flex-shrink-0">
                            •
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardContent className="p-6">
                    <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" /> Typical
                      materials
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {(entry as TechEntry).data.typicalMaterials.map((mat) => (
                        <Badge key={mat} variant="secondary" className="text-xs">
                          {mat}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <>
                <Card className="border-border">
                  <CardContent className="p-6">
                    <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" /> Key properties
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {(entry as MaterialEntry).data.properties.map((prop) => (
                        <Badge key={prop} variant="secondary" className="text-xs">
                          {prop}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border">
                  <CardContent className="p-6">
                    <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" /> Typical
                      applications
                    </h2>
                    <ul className="space-y-2">
                      {(entry as MaterialEntry).data.applications.map(
                        (item, i) => (
                          <li
                            key={i}
                            className="text-sm text-muted-foreground flex items-start gap-2"
                          >
                            <Zap className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                            {item}
                          </li>
                        ),
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <aside className="lg:col-span-1 space-y-6">
            <Card className="border-border">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-semibold text-foreground">Quick facts</h2>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Category</span>
                  <span className="text-foreground capitalize">
                    {categoryLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Price range</span>
                  <Badge variant="outline" className="text-xs">
                    {PRICE_LABEL[entry.data.priceRange]}
                  </Badge>
                </div>
                {isTech && (
                  <div className="pt-2 space-y-3">
                    <StatBar
                      label="Detail level"
                      value={(entry as TechEntry).data.detailLevel}
                    />
                    <StatBar
                      label="Strength"
                      value={(entry as TechEntry).data.strengthLevel}
                    />
                    <StatBar
                      label="Speed"
                      value={(entry as TechEntry).data.speedLevel}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {related.length > 0 && (
              <Card className="border-border">
                <CardContent className="p-6">
                  <h2 className="font-semibold text-foreground mb-3">
                    Related {isTech ? "technologies" : "materials"}
                  </h2>
                  <ul className="space-y-2">
                    {related.map((r) => (
                      <li key={r.slug}>
                        <Link
                          href={`/knowledge/${type}/${r.slug}`}
                          className="flex items-center justify-between text-sm text-muted-foreground hover:text-primary transition-colors group"
                        >
                          <span>{r.data.name}</span>
                          <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
