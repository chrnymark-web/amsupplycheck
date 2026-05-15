"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ConfiguratorPanel } from "@/components/stl-viewer/ConfiguratorPanel";
import { ViewerControls } from "@/components/stl-viewer/ViewerControls";
import { UploadLanding } from "@/components/stl-match/UploadLanding";
import { MatchResultView } from "@/components/stl-match/MatchResultView";
import { parseStlInWorker } from "@/lib/stl-parser-client";
import { useTriggerStlMatch } from "@/hooks/use-trigger-stl-match";
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

const STATUS_STEP: Record<string, number> = {
  idle: 0,
  uploading: 15,
  pending: 30,
  analyzing: 50,
  matching: 70,
  ranking: 90,
  completed: 100,
  failed: 0,
};

interface StlMatchClientProps {
  technologyToMaterials: Record<string, string[]>;
}

export default function StlMatchClient({ technologyToMaterials }: StlMatchClientProps) {
  const {
    triggerStlMatch,
    status,
    statusMessage,
    isLoading,
    error,
    result,
    stlMetrics: serverStlMetrics,
    reset,
  } = useTriggerStlMatch();

  const [file, setFile] = useState<File | null>(null);
  const [localMetrics, setLocalMetrics] = useState<StlResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

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
    parseStlInWorker(file)
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

  const dimensions = (serverStlMetrics ?? localMetrics)?.boundingBox;
  const volumeCm3 = (serverStlMetrics ?? localMetrics)?.volumeCm3;

  const handleFile = useCallback((f: File) => {
    setFile(f);
  }, []);

  const handleClear = useCallback(() => {
    setFile(null);
  }, []);

  const handleSubmit = async () => {
    if (!file) return;
    await triggerStlMatch({
      file,
      technology: technology || undefined,
      material: material || undefined,
      quantity,
      area: area || undefined,
    });
  };

  const handleReset = () => {
    reset();
    setFile(null);
    setLocalMetrics(null);
  };

  if (result) {
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
                STL Supplier Match
              </h1>
              <p className="text-sm text-muted-foreground">
                Suppliers matched to your uploaded part
              </p>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <MatchResultView
            result={result}
            technology={technology}
            material={material}
            quantity={quantity}
            preferredRegion={area}
            onReset={handleReset}
          />
        </main>
      </div>
    );
  }

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
              STL Supplier Match
            </h1>
            <p className="text-sm text-muted-foreground">
              Upload your STL file and we&apos;ll find the best suppliers
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
            </div>

            <div className="space-y-4">
              <UploadLanding
                file={file}
                onFileSelected={handleFile}
                onClear={handleClear}
                stlMetrics={localMetrics}
                title="Your part"
                description="Tap the dropzone to choose a different STL"
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
                  Couldn&apos;t read STL geometry: {parseError}. You can still
                  submit — the server will parse it.
                </div>
              )}

              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                  {error}
                </div>
              )}

              {isLoading && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{statusMessage}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={STATUS_STEP[status] ?? 0} className="h-2" />
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleSubmit}
                className="w-full"
                size="lg"
                disabled={!file || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Find suppliers for this part
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
