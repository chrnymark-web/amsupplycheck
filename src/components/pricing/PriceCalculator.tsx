import { useState, useCallback, useRef } from 'react';
import { Upload, Calculator, ChevronDown, ChevronUp, Package, Loader2, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseSTL, type STLResult } from '@/lib/stlParser';
import { supabase } from '@/integrations/supabase/client';

const TECH_MATERIALS: Record<string, string[]> = {
  'FDM/FFF': ['PLA', 'ABS', 'PETG', 'Nylon', 'TPU', 'ASA', 'Polycarbonate', 'PEEK', 'PEI/Ultem'],
  'SLS': ['PA-12', 'PA-11', 'PA-12 Glass Filled', 'PA-12 Carbon Filled', 'TPU', 'Polypropylene'],
  'SLA': ['Standard Resin', 'Tough Resin', 'Flexible Resin', 'Clear Resin', 'High Temp Resin', 'Castable Resin', 'Dental Resin'],
  'MJF': ['PA-12', 'PA-12 Glass Filled', 'PA-11', 'TPU', 'Polypropylene'],
  'DMLS': ['Titanium', 'Aluminum AlSi10Mg', 'Stainless Steel 316L', 'Inconel 718', 'Cobalt Chrome', 'Maraging Steel'],
  'SLM': ['Titanium', 'Aluminum AlSi10Mg', 'Stainless Steel 316L', 'Inconel 718', 'Cobalt Chrome', 'Maraging Steel'],
  'DLP': ['Standard Resin', 'Tough Resin', 'Flexible Resin', 'Castable Resin', 'Dental Resin', 'Biocompatible Resin'],
  'Material Jetting': ['Standard Resin', 'Flexible Resin', 'Clear Resin', 'Biocompatible Resin'],
  'Binder Jetting': ['Stainless Steel', 'Aluminum', 'Ceramic'],
};

interface PriceEstimate {
  lowEstimate: number;
  highEstimate: number;
  currency: string;
  factors: { name: string; detail: string }[];
  matchingSuppliers: { id: string; name: string; website: string; region: string }[];
}

export function PriceCalculator() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [stlData, setStlData] = useState<STLResult | null>(null);
  const [technology, setTechnology] = useState('FDM/FFF');
  const [material, setMaterial] = useState('PLA');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<PriceEstimate | null>(null);
  const [error, setError] = useState('');
  const [parseError, setParseError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setEstimate(null);
    setError('');
    setParseError('');

    if (!f.name.toLowerCase().endsWith('.stl')) {
      setParseError('Only STL files are supported for instant analysis. Upload an STL file to get volume and dimensions.');
      return;
    }

    if (f.size > 100 * 1024 * 1024) {
      setParseError('File too large. Maximum 100MB.');
      return;
    }

    try {
      const buffer = await f.arrayBuffer();
      const result = parseSTL(buffer);
      if (result.triangleCount === 0 || result.volumeCm3 === 0) {
        setParseError('Could not parse STL file. The file may be corrupted.');
        return;
      }
      setStlData(result);
    } catch {
      setParseError('Failed to parse STL file.');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleEstimate = async () => {
    if (!stlData) return;
    setLoading(true);
    setError('');
    setEstimate(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('estimate-price', {
        body: {
          volumeCm3: stlData.volumeCm3,
          surfaceAreaCm2: stlData.surfaceAreaCm2,
          boundingBox: stlData.boundingBox,
          triangleCount: stlData.triangleCount,
          technology,
          material,
          quantity,
        },
      });

      if (fnError) throw new Error(fnError.message);
      setEstimate(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to estimate price';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setStlData(null);
    setEstimate(null);
    setError('');
    setParseError('');
  };

  const materials = TECH_MATERIALS[technology] || [];

  return (
    <div className="max-w-4xl mx-auto mb-3">
      {/* Toggle button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all text-sm text-primary/90 hover:text-primary"
        >
          <Calculator className="h-4 w-4" />
          <span>Get Instant Price Estimate</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Expanded panel */}
      {isExpanded && (
        <div className="rounded-2xl border border-border/30 bg-background/80 backdrop-blur-sm p-4 sm:p-5 shadow-xl animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calculator className="h-4 w-4 text-primary" />
              Instant Price Estimate
            </div>
            <button onClick={() => { setIsExpanded(false); reset(); }} className="text-muted-foreground hover:text-foreground">
              <ChevronUp className="h-4 w-4" />
            </button>
          </div>

          {/* File upload */}
          {!file ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-primary/20 hover:border-primary/40 rounded-xl p-6 text-center cursor-pointer transition-colors"
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drop your <strong>STL file</strong> here or click to browse
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">Max 100MB. Analysis runs locally in your browser.</p>
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
            </div>
          ) : (
            <div>
              {/* File info */}
              <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-card/50 border border-border/20">
                <Package className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  {stlData && (
                    <p className="text-xs text-muted-foreground">
                      {stlData.volumeCm3.toFixed(1)} cm3 &middot; {stlData.boundingBox.x.toFixed(0)} x {stlData.boundingBox.y.toFixed(0)} x {stlData.boundingBox.z.toFixed(0)} mm &middot; {stlData.triangleCount.toLocaleString()} triangles
                    </p>
                  )}
                  {parseError && <p className="text-xs text-destructive">{parseError}</p>}
                </div>
                <button onClick={reset} className="text-muted-foreground hover:text-foreground shrink-0">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Config row */}
              {stlData && !estimate && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Technology</label>
                    <select
                      value={technology}
                      onChange={(e) => {
                        setTechnology(e.target.value);
                        const mats = TECH_MATERIALS[e.target.value] || [];
                        setMaterial(mats[0] || '');
                      }}
                      className="w-full text-sm rounded-md border border-border/30 bg-background px-2 py-1.5"
                    >
                      {Object.keys(TECH_MATERIALS).map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Material</label>
                    <select
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      className="w-full text-sm rounded-md border border-border/30 bg-background px-2 py-1.5"
                    >
                      {materials.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-sm rounded-md border border-border/30 bg-background px-2 py-1.5"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleEstimate}
                      disabled={loading}
                      className="w-full"
                      size="sm"
                    >
                      {loading ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Estimating...</>
                      ) : (
                        <><Calculator className="h-3.5 w-3.5 mr-1" /> Estimate</>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="text-sm text-destructive mb-3">{error}</p>
              )}

              {/* Results */}
              {estimate && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Price range */}
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Estimated price per part ({quantity > 1 ? `qty ${quantity}` : 'single'})</p>
                    <p className="text-2xl font-bold text-primary">
                      ${estimate.lowEstimate.toFixed(2)} &ndash; ${estimate.highEstimate.toFixed(2)}
                    </p>
                    {quantity > 1 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Total: ${(estimate.lowEstimate * quantity).toFixed(2)} &ndash; ${(estimate.highEstimate * quantity).toFixed(2)}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/50 mt-2">
                      Market average estimate. Actual prices vary by supplier, finish and lead time. Contact suppliers for exact quotes.
                    </p>
                  </div>

                  {/* Factors */}
                  {estimate.factors.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {estimate.factors.map((f, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-md bg-card/50 border border-border/20 text-muted-foreground">
                          {f.name}: {f.detail}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Matching suppliers */}
                  {estimate.matchingSuppliers.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Suppliers offering {technology} — contact for exact pricing:</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                        {estimate.matchingSuppliers.map((s) => (
                          <a
                            key={s.id}
                            href={s.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2.5 rounded-lg bg-card/50 border border-border/20 hover:border-primary/30 transition-colors text-sm"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-xs">{s.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{s.region}</p>
                            </div>
                            <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Try again */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEstimate(null)}>
                      Change options
                    </Button>
                    <Button variant="outline" size="sm" onClick={reset}>
                      Upload new file
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
