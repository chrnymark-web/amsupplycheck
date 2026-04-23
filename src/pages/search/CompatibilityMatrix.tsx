import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import Navbar from '@/components/ui/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Info } from 'lucide-react';
import { getAllMaterials, getAllTechnologies } from '@/lib/supplierData';
import { useTechnologyToMaterials } from '@/hooks/use-compatibility-matrix';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const CompatibilityMatrix = () => {
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);

  const technologies = getAllTechnologies();
  const materials = getAllMaterials();
  const { data: techToMatMap } = useTechnologyToMaterials();

  // Check if a combination is compatible
  const isCompatible = (technology: string, material: string): boolean => {
    const compatibleMaterials = techToMatMap[technology] || [];
    return compatibleMaterials.includes(material);
  };

  useEffect(() => {
    // SEO: Add structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "3D Printing Technology-Material Compatibility Matrix",
      "description": "Comprehensive compatibility matrix showing which materials work with which 3D printing technologies including FDM, SLA, SLS, MJF, DMLS, and more.",
      "url": window.location.href,
      "about": {
        "@type": "Thing",
        "name": "3D Printing Compatibility"
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>3D Printing Technology-Material Compatibility Matrix | AMSupplyCheck</title>
        <meta 
          name="description" 
          content="Discover which 3D printing materials work with which technologies. Interactive compatibility matrix for FDM, SLA, SLS, MJF, DMLS, and other additive manufacturing processes."
        />
        <link rel="canonical" href="https://amsupplycheck.com/compatibility" />
        <meta property="og:title" content="3D Printing Compatibility Matrix | AMSupplyCheck" />
        <meta property="og:description" content="Interactive matrix showing technology-material compatibility for 3D printing and additive manufacturing." />
        <meta property="og:url" content="https://amsupplycheck.com/compatibility" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="3D Printing Compatibility Matrix | AMSupplyCheck" />
        <meta name="twitter:description" content="Interactive matrix showing technology-material compatibility for 3D printing and additive manufacturing." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Technology-Material Compatibility Matrix
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Explore which 3D printing materials are compatible with different manufacturing technologies. 
              Click on any cell to see detailed information about the combination.
            </p>
          </div>

          {/* Info Card */}
          <Card className="mb-8 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                How to Use This Matrix
              </CardTitle>
              <CardDescription>
                Each row represents a material, and each column represents a 3D printing technology. 
                A green checkmark (✓) indicates the material is compatible with that technology, 
                while a red cross (✗) indicates incompatibility.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Legend */}
          <div className="flex gap-4 mb-6 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-success/20 flex items-center justify-center">
                <Check className="h-4 w-4 text-success" />
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

          {/* Matrix Container - Scrollable */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-muted/50 sticky top-0 z-10">
                    <tr>
                      <th className="p-3 text-left font-semibold text-sm border-b border-r border-border bg-muted/50 sticky left-0 z-20 min-w-[200px]">
                        Material / Technology
                      </th>
                      {technologies.map(tech => (
                        <th 
                          key={tech} 
                          className="p-3 text-center font-semibold text-xs border-b border-border min-w-[100px] cursor-pointer hover:bg-muted/80 transition-colors"
                          onClick={() => setSelectedTech(selectedTech === tech ? null : tech)}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={`${selectedTech === tech ? 'text-primary' : ''}`}>
                                  {tech}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">Click to highlight {tech} compatibility</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((material, idx) => (
                      <tr 
                        key={material}
                        className={`hover:bg-muted/30 transition-colors ${
                          idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                        } ${selectedMaterial === material ? 'ring-2 ring-primary/50' : ''}`}
                        onClick={() => setSelectedMaterial(selectedMaterial === material ? null : material)}
                      >
                        <td className="p-3 font-medium text-sm border-r border-border sticky left-0 bg-background z-10 cursor-pointer">
                          <Badge 
                            variant="outline" 
                            className={`${selectedMaterial === material ? 'bg-primary/10 border-primary' : ''}`}
                          >
                            {material}
                          </Badge>
                        </td>
                        {technologies.map(tech => {
                          const compatible = isCompatible(tech, material);
                          const isHighlighted = selectedTech === tech || selectedMaterial === material;
                          
                          return (
                            <td 
                              key={`${material}-${tech}`}
                              className={`p-3 text-center border-b border-border transition-all ${
                                isHighlighted ? 'bg-muted/50' : ''
                              }`}
                            >
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div 
                                      className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition-all cursor-pointer ${
                                        compatible 
                                          ? 'bg-success/20 hover:bg-success/30' 
                                          : 'bg-destructive/10 hover:bg-destructive/20'
                                      }`}
                                    >
                                      {compatible ? (
                                        <Check className="h-5 w-5 text-success" />
                                      ) : (
                                        <X className="h-4 w-4 text-destructive/50" />
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">
                                      {compatible 
                                        ? `${material} is compatible with ${tech}` 
                                        : `${material} is not compatible with ${tech}`
                                      }
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Technology Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <h4 className="font-semibold text-sm mb-1">Polymer Technologies</h4>
                  <p className="text-xs text-muted-foreground">FDM/FFF, SLA, DLP, SLS, MJF, SAF - for plastics, resins, and flexible materials</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Metal Technologies</h4>
                  <p className="text-xs text-muted-foreground">DMLS, SLM, Direct Metal Printing, Binder Jetting - for metal alloys and composites</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Hybrid Technologies</h4>
                  <p className="text-xs text-muted-foreground">Material Jetting - for multi-material and high-detail parts</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Material Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <h4 className="font-semibold text-sm mb-1">Thermoplastics</h4>
                  <p className="text-xs text-muted-foreground">PLA, ABS, PETG, Nylon, Polycarbonate - durable and versatile</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Photopolymer Resins</h4>
                  <p className="text-xs text-muted-foreground">Standard, Tough, Clear, Flexible - high detail and smooth finish</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Metal Alloys</h4>
                  <p className="text-xs text-muted-foreground">Stainless Steel, Titanium, Aluminum, Inconel - aerospace-grade strength</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
};

export default CompatibilityMatrix;
