"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfiguratorPanel } from "@/components/stl-viewer/ConfiguratorPanel";
import { ViewerControls } from "@/components/stl-viewer/ViewerControls";
import { UploadLanding } from "@/components/stl-match/UploadLanding";
import { LivePriceComparison } from "@/components/compare-prices/LivePriceComparison";
import { parseModelInWorker } from "@/lib/stl-parser-client";
import { consumePendingHeroUpload } from "@/lib/pendingHeroUpload";
import type { StlResult } from "@/lib/stl-types";

const StlViewer = dynamic(
  () => import("@/components/stl-viewer/StlViewer").then((m) => m.StlViewer),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-square w-full animate-pulse rounded-xl bg-zinc-900/40" />
    ),
  },
);

interface ComparePricesClientProps {
  technologyToMaterials: Record<string, string[]>;
}

export default function ComparePricesClient({ technologyToMaterials }: ComparePricesClientProps) {
  const [file, setFile] = useState<File | null>(null);
  const [localMetrics, setLocalMetrics] = useState<StlResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    const pending = consumePendingHeroUpload();
    if (pending) setFile(pending);
  }, []);

  const [technology, setTechnology] = useState("");
  const [material, setMaterial] = useState("");
  const [color, setColor] = useState("natural");
  const [finish, setFinish] = useState("standard");
  const [area, setArea] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [wireframe, setWireframe] = useState(false);
  const [showDimensions, setShowDimensions] = useState(true);
  const [resetTrigger, setResetTrigger] = useState(0);

  useEffect(() => {
    if (!file) {
      setLocalMetrics(null);
      setParseError(null);
      return;
    }
    let cancelled = false;
    setParseError(null);
    parseModelInWorker(file)
      .then((metrics) => {
        if (!cancelled) setLocalMetrics(metrics);
      })
      .catch((err: Error) => {
        if (!cancelled) setParseError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  const dimensions = localMetrics?.boundingBox;
  const volumeCm3 = localMetrics?.volumeCm3;

  const handleFile = useCallback((f: File) => {
    setFile(f);
  }, []);

  const handleClear = useCallback(() => {
    setFile(null);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/" aria-label="Back to home">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Compare 3D Printing Quotes
            </h1>
            <p className="text-sm text-muted-foreground">
              Upload your STL or STEP file — we&apos;ll fetch live quotes from Craftcloud&apos;s vendor network
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!file ? (
          <div className="max-w-2xl mx-auto">
            <UploadLanding
              file={file}
              onFileSelected={handleFile}
              onClear={handleClear}
              stlMetrics={localMetrics}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
            <div className="relative aspect-square lg:aspect-auto lg:min-h-[480px]">
              {file.name.toLowerCase().endsWith(".stl") ? (
                <>
                  <StlViewer
                    file={file}
                    wireframe={wireframe}
                    resetTrigger={resetTrigger}
                  />
                  <ViewerControls
                    wireframe={wireframe}
                    onToggleWireframe={() => setWireframe((w) => !w)}
                    onResetView={() => setResetTrigger((k) => k + 1)}
                    showDimensions={showDimensions}
                    onToggleDimensions={() => setShowDimensions((s) => !s)}
                    dimensions={dimensions}
                    volumeCm3={volumeCm3}
                  />
                </>
              ) : (
                <div className="aspect-square lg:aspect-auto lg:min-h-[480px] rounded-xl bg-zinc-900/40 flex items-center justify-center text-sm text-muted-foreground">
                  3D preview not available for STEP — geometry metrics extracted below
                </div>
              )}
            </div>

            <div className="space-y-4">
              <UploadLanding
                file={file}
                onFileSelected={handleFile}
                onClear={handleClear}
                stlMetrics={localMetrics}
                title="Your part"
                description="Tap the dropzone to choose a different STL or STEP file"
              />

              <ConfiguratorPanel
                technology={technology}
                material={material}
                color={color}
                finish={finish}
                area={area}
                quantity={quantity}
                onTechnologyChange={setTechnology}
                onMaterialChange={setMaterial}
                onColorChange={setColor}
                onFinishChange={setFinish}
                onAreaChange={setArea}
                onQuantityChange={setQuantity}
                technologyToMaterials={technologyToMaterials}
              />

              {parseError && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                  Couldn&apos;t read geometry: {parseError}. Live quotes will
                  still work, but the suspect-price checker will use peer
                  comparison only.
                </div>
              )}

              <LivePriceComparison
                file={file}
                quantity={quantity}
                area={area}
                technology={technology}
                material={material}
                hideUpload
                currency="EUR"
                countryCode="DK"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
