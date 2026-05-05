import { useState, useCallback, useRef, useMemo } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Sparkles, Loader2, MapPin, Package, ExternalLink, CheckCircle2, Award, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { SearchProgress } from "@/components/search/SearchProgress";
import { useTriggerSTLMatch } from "@/hooks/use-trigger-stl-match";
import SupplierLogo from "@/components/ui/supplier-logo";
import type { MatchResult } from "@/hooks/use-supplier-matching";
import { useTechnologyToMaterials } from "@/hooks/use-compatibility-matrix";
import { trackEvent } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";

const REGIONS = [
  { value: "", label: "No preference" },
  { value: "Scandinavia", label: "Scandinavia" },
  { value: "Western Europe", label: "Western Europe" },
  { value: "Central Europe", label: "Central Europe" },
  { value: "UK & Ireland", label: "UK & Ireland" },
  { value: "North America", label: "North America" },
  { value: "Asia Pacific", label: "Asia Pacific" },
];

function STLMatchCard({ match, rank }: { match: MatchResult; rank: number }) {
  const { supplier, score, matchDetails } = match;
  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
      <div className="absolute top-3 left-3 z-10">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          rank === 1 ? "bg-yellow-400 text-yellow-900" :
          rank === 2 ? "bg-gray-300 text-gray-700" :
          rank === 3 ? "bg-orange-400 text-orange-900" :
          "bg-muted text-muted-foreground"
        }`}>{rank}</div>
      </div>
      <div className="absolute top-3 right-3 z-10">
        <Badge variant={score >= 70 ? "default" : score >= 50 ? "secondary" : "outline"} className="text-sm font-semibold">
          {score}% match
        </Badge>
      </div>
      <CardHeader className="pt-12">
        <div className="flex items-start gap-4">
          <SupplierLogo logoUrl={supplier.logo_url} name={supplier.name} size="md" />
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{supplier.name}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {supplier.location_city && `${supplier.location_city}, `}
              {supplier.location_country || supplier.region}
            </CardDescription>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          {supplier.is_partner && (
            <Badge variant="outline" className="text-xs bg-amber-50 border-amber-300 text-amber-800"><Star className="h-3 w-3 mr-1 fill-current" />Partner</Badge>
          )}
          {supplier.verified && (
            <Badge variant="outline" className="text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Verified</Badge>
          )}
          {supplier.premium && (
            <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-200 text-yellow-700"><Award className="h-3 w-3 mr-1" />Premium</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {matchDetails.overallExplanation && (
          <p className="text-sm text-muted-foreground italic">"{matchDetails.overallExplanation}"</p>
        )}
        <div className="space-y-2">
          {matchDetails.matchedTechnologies.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {matchDetails.matchedTechnologies.slice(0, 3).map((tech) => (
                <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
              ))}
            </div>
          )}
          {matchDetails.matchedMaterials.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {matchDetails.matchedMaterials.slice(0, 3).map((mat) => (
                <Badge key={mat} variant="outline" className="text-xs">{mat}</Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <a href={`/suppliers/${supplier.supplier_id}`}>View profile</a>
          </Button>
          {supplier.is_partner && supplier.instant_quote_url ? (
            <Button size="sm" className="flex-1 bg-supplier-partner text-black hover:bg-supplier-partner/90" asChild>
              <a href={supplier.instant_quote_url} target="_blank" rel="noopener noreferrer">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Get instant quote
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          ) : supplier.website ? (
            <Button size="sm" className="flex-1" asChild>
              <a href={supplier.website} target="_blank" rel="noopener noreferrer">Visit <ExternalLink className="h-3 w-3 ml-1" /></a>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default function STLMatch() {
  const navigate = useNavigate();
  const { triggerSTLMatch, status, isLoading, error, result, stlMetrics, reset } = useTriggerSTLMatch();

  const { data: techToMatMap } = useTechnologyToMaterials();
  const [file, setFile] = useState<File | null>(null);
  const [technology, setTechnology] = useState("SLS");
  const [material, setMaterial] = useState("PA12 Nylon");
  const [quantity, setQuantity] = useState(1);
  const [preferredRegion, setPreferredRegion] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.name.toLowerCase().endsWith(".stl")) return;
    if (f.size > 100 * 1024 * 1024) return;
    trackEvent("file_uploaded", {
      file_size_bytes: f.size,
      file_extension: "stl",
      page: "stl_match",
    });
    void supabase.from("upload_events").insert({
      file_name: f.name,
      file_size_bytes: f.size,
      file_extension: "stl",
      source_page: "stl_match",
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
    setFile(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleSubmit = async () => {
    if (!file) return;
    await triggerSTLMatch({ file, technology, material, quantity, preferredRegion: preferredRegion || undefined });
  };

  const handleReset = () => {
    reset();
    setFile(null);
  };

  const materials = techToMatMap[technology] || [];
  const technologyOptions = Object.keys(techToMatMap).sort();

  return (
    <>
      <Helmet>
        <title>STL Supplier Match | AMSupplyCheck</title>
        <meta name="description" content="Upload your STL file and find the best 3D printing suppliers for your part." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  STL Supplier Match
                </h1>
                <p className="text-sm text-muted-foreground">Upload your STL file and we'll find the best suppliers</p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {!result ? (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* File upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload STL file</CardTitle>
                  <CardDescription>Drag and drop or click to upload your 3D model (max 100MB)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      file ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".stl"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                      }}
                    />
                    {file ? (
                      <div className="flex items-center justify-center gap-3">
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                        <div className="text-left">
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">Drop your STL file here or click to browse</p>
                      </>
                    )}
                  </div>

                  {stlMetrics && (
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-muted-foreground">Volume</p>
                        <p className="font-medium">{stlMetrics.volumeCm3.toFixed(2)} cm³</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-muted-foreground">Bounding box</p>
                        <p className="font-medium">{stlMetrics.boundingBox.x} x {stlMetrics.boundingBox.y} x {stlMetrics.boundingBox.z} mm</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Print settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Technology</Label>
                      <Select value={technology} onValueChange={(v) => { setTechnology(v); setMaterial(techToMatMap[v]?.[0] || ""); }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {technologyOptions.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Material</Label>
                      <Select value={material} onValueChange={setMaterial}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {materials.map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Select value={String(quantity)} onValueChange={(v) => setQuantity(Number(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1, 5, 10, 25, 50, 100, 250, 500, 1000].map((q) => (
                            <SelectItem key={q} value={String(q)}>{q} pcs</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Preferred region</Label>
                      <Select value={preferredRegion} onValueChange={setPreferredRegion}>
                        <SelectTrigger><SelectValue placeholder="No preference" /></SelectTrigger>
                        <SelectContent>
                          {REGIONS.map((r) => (
                            <SelectItem key={r.value} value={r.value || "none"}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">{error}</div>
              )}

              {isLoading && <SearchProgress status={status as any} />}

              <Button onClick={handleSubmit} className="w-full" size="lg" disabled={!file || isLoading}>
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Searching...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" />Find suppliers for this part</>
                )}
              </Button>
            </div>
          ) : (
            /* Results */
            <div className="space-y-8">
              <div className="bg-card border rounded-xl p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="text-2xl font-semibold mb-2">
                      {result.matches.length} suppliers match your part
                    </h2>
                    <p className="text-muted-foreground">{result.requirements?.projectSummary}</p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Badge variant="secondary">{technology}</Badge>
                      <Badge variant="outline">{material}</Badge>
                      <Badge variant="outline"><Package className="h-3 w-3 mr-1" />{quantity} pcs</Badge>
                      {preferredRegion && (
                        <Badge variant="outline" className="bg-primary/5"><MapPin className="h-3 w-3 mr-1" />{preferredRegion}</Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleReset}>New search</Button>
                </div>
              </div>

              {result.matches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {result.matches.map((match, index) => (
                    <STLMatchCard key={match.supplier.supplier_id} match={match} rank={index + 1} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-card border rounded-xl">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No matches found</h3>
                  <p className="text-muted-foreground mb-4">Try a different technology or material</p>
                  <Button variant="outline" onClick={handleReset}>Try again</Button>
                </div>
              )}

              <div className="text-center text-sm text-muted-foreground">
                Analyzed {result.totalSuppliersAnalyzed} suppliers
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
