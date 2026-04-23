import { useMemo, useState } from "react";
import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LivePriceComparison } from "@/components/ui/live-price-comparison";
import { getEstimatedPrice } from "@/lib/api";
import { useSuppliers } from "@/hooks/use-suppliers";
import { normalizeTechKey } from "@/lib/materialTechClassifier";
import type { EstimatedPrice } from "@/lib/api/types";

const ANY = "any";

// Technologies the pricing estimator understands (keys of technologyPriceIndex).
const TECH_CHOICES = [
  "FDM/FFF",
  "SLA",
  "DLP",
  "SLS",
  "Multi Jet Fusion",
  "SAF",
  "DMLS",
  "SLM",
  "Material Jetting",
  "Binder Jetting",
];

export default function ComparePrices() {
  const navigate = useNavigate();
  const { suppliers } = useSuppliers();

  const [technology, setTechnology] = useState("");
  const [quantity, setQuantity] = useState(1);

  // Filter suppliers to those capable of the selected technology, then price each
  // one using the selected tech so ranges reflect the chosen process (SLS ≈ 2.5×
  // FDM, etc.). No file is uploaded on this page, so estimates use the geometry-
  // free baseline; tech still drives visible ratios.
  const estimatedPrices: EstimatedPrice[] = useMemo(() => {
    const normSelected = normalizeTechKey(technology);
    return suppliers
      .filter((s) => {
        if (!normSelected) return true;
        return s.technologies.some((t) => normalizeTechKey(t.name) === normSelected);
      })
      .slice(0, 20)
      .map((s) =>
        getEstimatedPrice({
          supplierName: s.name,
          supplierId: s.supplier_id,
          supplierTechnologies: s.technologies.map((t) => t.name),
          selectedTechnology: technology || undefined,
          quantity,
          logoUrl: s.logo_url || undefined,
        })
      )
      .sort((a, b) => a.priceRangeLow - b.priceRangeLow);
  }, [suppliers, technology, quantity]);

  return (
    <>
      <Helmet>
        <title>Compare 3D Printing Prices | Supply Check</title>
        <meta
          name="description"
          content="Upload your 3D model and compare live prices from 90+ vendors. Get instant quotes from Craftcloud, Treatstock, and more."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">Compare 3D Printing Prices</h1>
                <p className="text-sm text-muted-foreground">
                  Upload your model for live quotes, or browse estimated prices
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground/80 mb-3">
                Pick a technology to scope estimates and live quotes — ratios reflect real process costs.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Technology</Label>
                  <Select
                    value={technology || ANY}
                    onValueChange={(v) => setTechnology(v === ANY ? "" : v)}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ANY} className="text-sm text-muted-foreground">
                        Any technology
                      </SelectItem>
                      {TECH_CHOICES.map((t) => (
                        <SelectItem key={t} value={t} className="text-sm">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Quantity</Label>
                  <input
                    type="number"
                    min={1}
                    max={9999}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </div>

            <LivePriceComparison
              estimatedPrices={estimatedPrices}
              currency="EUR"
              countryCode="DK"
              technology={technology}
              quantity={quantity}
            />
          </div>
        </main>
      </div>
    </>
  );
}
