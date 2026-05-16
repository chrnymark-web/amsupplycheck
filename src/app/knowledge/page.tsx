import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/ui/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Cpu, FlaskConical, Layers } from "lucide-react";
import {
  TECH_ENTRIES,
  MATERIAL_ENTRIES,
  groupTechByCategory,
  groupMaterialByCategory,
} from "@/lib/knowledgeEntries";

export const revalidate = 86400;

const CANONICAL_URL = "https://www.amsupplycheck.com/knowledge";
const TITLE = "3D Printing Technology & Material Knowledge Hub | AMSupplyCheck";
const DESCRIPTION =
  "Explore every additive manufacturing technology and material used by suppliers on AMSupplyCheck. Detailed descriptions, best-fit applications, and supplier discovery.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL_URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: CANONICAL_URL,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const techGroups = groupTechByCategory();
const materialGroups = groupMaterialByCategory();

const collectionJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "3D Printing Technology & Material Knowledge Hub",
  description: DESCRIPTION,
  url: CANONICAL_URL,
  mainEntity: {
    "@type": "ItemList",
    itemListElement: [
      ...TECH_ENTRIES.map((entry, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://www.amsupplycheck.com/knowledge/technology/${entry.slug}`,
        name: entry.data.name,
      })),
      ...MATERIAL_ENTRIES.map((entry, index) => ({
        "@type": "ListItem",
        position: TECH_ENTRIES.length + index + 1,
        url: `https://www.amsupplycheck.com/knowledge/material/${entry.slug}`,
        name: entry.data.name,
      })),
    ],
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
      item: CANONICAL_URL,
    },
  ],
};

export default function KnowledgePage() {
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

      <header className="max-w-5xl mx-auto px-4 pt-16 pb-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Layers className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Technology &amp; Material Knowledge Hub
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Browse {TECH_ENTRIES.length} additive manufacturing technologies and{" "}
          {MATERIAL_ENTRIES.length} materials. Each page summarises capabilities,
          ideal applications, limitations, and links to verified suppliers.
        </p>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-24 space-y-16">
        <section aria-labelledby="technologies-heading">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="h-5 w-5 text-primary" />
            <h2
              id="technologies-heading"
              className="text-xl font-bold text-foreground"
            >
              Technologies
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Additive manufacturing processes grouped by material family.
          </p>
          <div className="space-y-10">
            {techGroups.map((group) => (
              <div key={group.category}>
                <h3 className="text-base font-semibold text-foreground mb-3">
                  {group.label}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.entries.map((entry) => (
                    <Link
                      key={entry.slug}
                      href={`/knowledge/technology/${entry.slug}`}
                      className="block group"
                    >
                      <Card className="h-full border-border hover:border-primary/40 hover:shadow-lg transition-colors">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                              {entry.data.name}
                            </h4>
                            <Badge variant="secondary" className="text-xs ml-2 shrink-0">
                              {entry.data.abbreviation}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {entry.data.shortDescription}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground capitalize">
                              {entry.data.priceRange.replace("-", " ")} price
                            </span>
                            <span className="text-primary flex items-center gap-1">
                              Explore <ArrowRight className="h-3 w-3" />
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="materials-heading">
          <div className="flex items-center gap-2 mb-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            <h2
              id="materials-heading"
              className="text-xl font-bold text-foreground"
            >
              Materials
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Build materials supported across additive manufacturing technologies.
          </p>
          <div className="space-y-10">
            {materialGroups.map((group) => (
              <div key={group.category}>
                <h3 className="text-base font-semibold text-foreground mb-3">
                  {group.category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.entries.map((entry) => (
                    <Link
                      key={entry.slug}
                      href={`/knowledge/material/${entry.slug}`}
                      className="block group"
                    >
                      <Card className="h-full border-border hover:border-primary/40 hover:shadow-lg transition-colors">
                        <CardContent className="p-5">
                          <h4 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                            {entry.data.name}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {entry.data.shortDescription}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground capitalize">
                              {entry.data.priceRange.replace("-", " ")} price
                            </span>
                            <span className="text-primary flex items-center gap-1">
                              Explore <ArrowRight className="h-3 w-3" />
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
