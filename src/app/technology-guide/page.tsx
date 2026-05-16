import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/ui/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BookOpen,
  Cpu,
  GitCompareArrows,
  Layers,
} from "lucide-react";
import {
  groupTechByCategory,
  TECH_ENTRIES,
  MATERIAL_ENTRIES,
} from "@/lib/knowledgeEntries";

export const revalidate = 86400;

const CANONICAL_URL = "https://www.amsupplycheck.com/technology-guide";
const TITLE = "3D Printing Technology Guide — Compare AM Processes | AMSupplyCheck";
const DESCRIPTION =
  "Compare 3D printing technologies side by side. Browse polymer, metal, resin, and composite processes with capabilities, materials, and supplier discovery.";

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

const groups = groupTechByCategory();

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "3D Printing Technology Guide",
  description: DESCRIPTION,
  url: CANONICAL_URL,
  about: {
    "@type": "Thing",
    name: "Additive Manufacturing Technologies",
  },
  mainEntity: {
    "@type": "ItemList",
    itemListElement: TECH_ENTRIES.map((entry, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://www.amsupplycheck.com/knowledge/technology/${entry.slug}`,
      name: entry.data.name,
    })),
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
      name: "Technology Guide",
      item: CANONICAL_URL,
    },
  ],
};

export default function TechnologyGuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Navbar />

      <header className="max-w-5xl mx-auto px-4 pt-16 pb-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          3D Printing Technology Guide
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Browse {TECH_ENTRIES.length} additive manufacturing technologies grouped
          by material family. Each card links to a detailed page with capabilities,
          ideal applications, limitations, and supplier discovery.
        </p>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-24 space-y-12">
        <Card className="border-border bg-card/50">
          <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <GitCompareArrows className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="font-semibold text-foreground mb-1">
                  Looking for a side-by-side compatibility view?
                </h2>
                <p className="text-sm text-muted-foreground">
                  See which materials work with which technologies in our
                  interactive matrix.
                </p>
              </div>
            </div>
            <Link href="/compatibility" className="self-start md:self-auto">
              <Button variant="outline">
                Open compatibility matrix
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {groups.map((group) => (
          <section key={group.category} aria-labelledby={`tg-${group.category}`}>
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="h-5 w-5 text-primary" />
              <h2
                id={`tg-${group.category}`}
                className="text-xl font-bold text-foreground"
              >
                {group.label} technologies
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.entries.map((entry) => (
                <Link
                  key={entry.slug}
                  href={`/knowledge/technology/${entry.slug}`}
                  className="block group"
                >
                  <Card className="h-full border-border hover:border-primary/40 hover:shadow-lg transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {entry.data.name}
                        </h3>
                        <Badge variant="secondary" className="text-xs ml-2 shrink-0">
                          {entry.data.abbreviation}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {entry.data.shortDescription}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {entry.data.typicalMaterials.slice(0, 3).map((mat) => (
                          <Badge
                            key={mat}
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {mat}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <Card className="border-border bg-card/50">
          <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Layers className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="font-semibold text-foreground mb-1">
                  Explore materials too
                </h2>
                <p className="text-sm text-muted-foreground">
                  Browse {MATERIAL_ENTRIES.length} build materials with
                  properties, applications, and price ranges.
                </p>
              </div>
            </div>
            <Link href="/knowledge#materials-heading" className="self-start md:self-auto">
              <Button variant="outline">
                View materials
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
