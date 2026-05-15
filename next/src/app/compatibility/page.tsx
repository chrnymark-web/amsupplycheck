import type { Metadata } from "next";
import { Check, X, Info } from "lucide-react";
import Navbar from "@/components/ui/navbar";
import PageVideoBackground from "@/components/layout/PageVideoBackground";
import FloatingNav from "@/components/layout/FloatingNav";
import CookieConsent from "@/components/layout/CookieConsent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCompatibilityMatrix } from "@/lib/compatibility";
import CompatibilityMatrixTable from "@/components/compatibility/CompatibilityMatrixTable";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "3D Printing Technology-Material Compatibility Matrix | AMSupplyCheck",
  description:
    "Discover which 3D printing materials work with which technologies. Interactive compatibility matrix for FDM, SLA, SLS, MJF, DMLS, and other additive manufacturing processes.",
  alternates: { canonical: "https://www.amsupplycheck.com/compatibility" },
  openGraph: {
    title: "3D Printing Compatibility Matrix | AMSupplyCheck",
    description:
      "Interactive matrix showing technology-material compatibility for 3D printing and additive manufacturing.",
    url: "https://www.amsupplycheck.com/compatibility",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "3D Printing Compatibility Matrix | AMSupplyCheck",
    description:
      "Interactive matrix showing technology-material compatibility for 3D printing and additive manufacturing.",
  },
};

export default async function CompatibilityPage() {
  const { technologies, materials, technologyToMaterials } = await getCompatibilityMatrix();
  const techNames = technologies.map((t) => t.name);
  const matNames = materials.map((m) => m.name);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "3D Printing Technology-Material Compatibility Matrix",
    description:
      "Comprehensive compatibility matrix showing which materials work with which 3D printing technologies including FDM, SLA, SLS, MJF, DMLS, and more.",
    url: "https://www.amsupplycheck.com/compatibility",
    about: { "@type": "Thing", name: "3D Printing Compatibility" },
  };

  return (
    <div className="min-h-screen bg-transparent relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageVideoBackground />
      <Navbar />

      <main className="relative z-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Technology-Material Compatibility Matrix
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Explore which 3D printing materials are compatible with different manufacturing
            technologies. Click any row or column header to highlight the corresponding compatibility.
          </p>
        </div>

        <Card className="mb-8 border-primary/20 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              How to Use This Matrix
            </CardTitle>
            <CardDescription>
              Each row represents a material, and each column represents a 3D printing technology.
              A green checkmark indicates the material is compatible with that technology, while a
              red cross indicates incompatibility.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center">
              <Check className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-sm text-muted-foreground">Compatible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-destructive/20 flex items-center justify-center">
              <X className="h-4 w-4 text-destructive" />
            </div>
            <span className="text-sm text-muted-foreground">Not Compatible</span>
          </div>
        </div>

        <Card className="bg-card/60 backdrop-blur-sm">
          <CardContent className="p-0">
            <CompatibilityMatrixTable
              technologies={techNames}
              materials={matNames}
              technologyToMaterials={technologyToMaterials}
            />
          </CardContent>
        </Card>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <Card className="bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Technology Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <h2 className="font-semibold text-sm mb-1">Polymer Technologies</h2>
                <p className="text-xs text-muted-foreground">
                  FDM/FFF, SLA, DLP, SLS, MJF, SAF — for plastics, resins, and flexible materials.
                </p>
              </div>
              <div>
                <h2 className="font-semibold text-sm mb-1">Metal Technologies</h2>
                <p className="text-xs text-muted-foreground">
                  DMLS, SLM, Direct Metal Printing, Binder Jetting — for metal alloys and composites.
                </p>
              </div>
              <div>
                <h2 className="font-semibold text-sm mb-1">Hybrid Technologies</h2>
                <p className="text-xs text-muted-foreground">
                  Material Jetting — for multi-material and high-detail parts.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Material Categories</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <h2 className="font-semibold text-sm mb-1">Thermoplastics</h2>
                <p className="text-xs text-muted-foreground">
                  PLA, ABS, PETG, Nylon, Polycarbonate — durable and versatile.
                </p>
              </div>
              <div>
                <h2 className="font-semibold text-sm mb-1">Photopolymer Resins</h2>
                <p className="text-xs text-muted-foreground">
                  Standard, Tough, Clear, Flexible — high detail and smooth finish.
                </p>
              </div>
              <div>
                <h2 className="font-semibold text-sm mb-1">Metal Alloys</h2>
                <p className="text-xs text-muted-foreground">
                  Stainless Steel, Titanium, Aluminum, Inconel — aerospace-grade strength.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <FloatingNav />
      <CookieConsent />
    </div>
  );
}
