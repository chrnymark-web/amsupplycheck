import type { Metadata } from "next";
import Link from "next/link";
import { getKnowledgeData } from "@/lib/suppliers";
import Navbar from "@/components/ui/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu, FlaskConical, Globe, ChevronRight, Factory, ArrowRight } from "lucide-react";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Browse Manufacturing Capabilities | AMSupplyCheck",
  description:
    "Browse manufacturing technologies, materials, and supplier locations. Find the right additive manufacturing capabilities for your project.",
  alternates: { canonical: "https://amsupplycheck.com/browse" },
  openGraph: {
    title: "Browse Manufacturing Capabilities | AMSupplyCheck",
    description:
      "Browse manufacturing technologies, materials, and supplier locations.",
    url: "https://amsupplycheck.com/browse",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

const regions = [
  { name: "United States", code: "us", region: "North America" },
  { name: "Germany", code: "de", region: "Europe" },
  { name: "United Kingdom", code: "uk", region: "Europe" },
  { name: "Netherlands", code: "nl", region: "Europe" },
  { name: "France", code: "fr", region: "Europe" },
  { name: "China", code: "cn", region: "Asia" },
  { name: "Denmark", code: "dk", region: "Europe" },
  { name: "Belgium", code: "be", region: "Europe" },
  { name: "Australia", code: "au", region: "Oceania" },
  { name: "Canada", code: "ca", region: "North America" },
  { name: "Italy", code: "it", region: "Europe" },
  { name: "Spain", code: "es", region: "Europe" },
];

export default async function BrowsePage() {
  const { technologies, materials } = await getKnowledgeData();
  const topTechnologies = [...technologies]
    .sort((a, b) => b.supplierCount - a.supplierCount)
    .slice(0, 12);
  const topMaterials = [...materials]
    .sort((a, b) => b.supplierCount - a.supplierCount)
    .slice(0, 12);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-background">
        <div className="bg-gradient-to-b from-primary/5 to-background border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Browse Capabilities
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Explore manufacturing technologies, materials, and supplier locations. Find suppliers based on their specific capabilities.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Technologies */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Technologies</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Browse by manufacturing process</p>

              <div className="space-y-2">
                {topTechnologies.map((tech) => (
                  <Link
                    key={tech.id}
                    href={`/suppliers?q=${encodeURIComponent(tech.name)}`}
                    className="block group"
                  >
                    <Card className="bg-card border-border hover:border-primary/40 transition-all">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {tech.name}
                          </span>
                          {tech.category && (
                            <Badge variant="outline" className="text-[10px] px-1.5">
                              {tech.category}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Factory className="h-3.5 w-3.5" />
                          <span>{tech.supplierCount}</span>
                          <ChevronRight className="h-4 w-4 group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              <Link
                href="/suppliers"
                className="mt-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors w-full justify-center py-2"
              >
                View all technologies <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Materials */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FlaskConical className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Materials</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Browse by build material</p>

              <div className="space-y-2">
                {topMaterials.map((mat) => (
                  <Link
                    key={mat.id}
                    href={`/suppliers?q=${encodeURIComponent(mat.name)}`}
                    className="block group"
                  >
                    <Card className="bg-card border-border hover:border-primary/40 transition-all">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {mat.name}
                          </span>
                          {mat.category && (
                            <Badge variant="outline" className="text-[10px] px-1.5">
                              {mat.category}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Factory className="h-3.5 w-3.5" />
                          <span>{mat.supplierCount}</span>
                          <ChevronRight className="h-4 w-4 group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              <Link
                href="/suppliers"
                className="mt-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors w-full justify-center py-2"
              >
                View all materials <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Countries */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Globe className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">Countries</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Browse by supplier location</p>

              <div className="space-y-2">
                {regions.map((country) => (
                  <Link
                    key={country.code}
                    href={`/suppliers?q=${encodeURIComponent(country.name)}`}
                    className="block group"
                  >
                    <Card className="bg-card border-border hover:border-primary/40 transition-all">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {country.name}
                          </span>
                          <Badge variant="outline" className="text-[10px] px-1.5">
                            {country.region}
                          </Badge>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              <Link
                href="/suppliers"
                className="mt-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors w-full justify-center py-2"
              >
                View all suppliers <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-16 text-center">
            <h3 className="text-xl font-semibold text-foreground mb-3">
              Know what you&apos;re looking for?
            </h3>
            <p className="text-muted-foreground mb-6">
              Use our smart search to find suppliers matching your exact requirements.
            </p>
            <Link
              href="/suppliers"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-3 font-medium transition-colors"
            >
              Browse all suppliers <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
