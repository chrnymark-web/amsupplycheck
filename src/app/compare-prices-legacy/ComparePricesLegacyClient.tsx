"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { LivePriceComparison } from "@/components/compare-prices/LivePriceComparison";
import { getEstimatedPrice } from "@/lib/estimated-price";
import { useSuppliers } from "@/hooks/use-suppliers";
import { normalizeTechKey } from "@/lib/materialTechClassifier";
import type { EstimatedPrice } from "@/lib/quote-types";

const ANY = "any";

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

export default function ComparePricesLegacyClient() {
  const router = useRouter();
  const { suppliers } = useSuppliers();

  const [technology, setTechnology] = useState("");
  const [quantity, setQuantity] = useState(1);

  const estimatedPrices: EstimatedPrice[] = useMemo(() => {
    const normSelected = normalizeTechKey(technology);
    const eligible = suppliers
      .filter((s) => {
        if (!normSelected) return true;
        return s.technologies.some((t) => normalizeTechKey(t.name) === normSelected);
      })
      .sort((a, b) => {
        if (!!a.is_partner !== !!b.is_partner) return a.is_partner ? -1 : 1;
        return 0;
      })
      .slice(0, 20);
    return eligible
      .map((s) =>
        getEstimatedPrice({
          supplierName: s.name,
          supplierId: s.supplier_id,
          supplierTechnologies: s.technologies.map((t) => t.name),
          selectedTechnology: technology || undefined,
          quantity,
          logoUrl: s.logo_url || undefined,
          isPartner: s.is_partner,
        })
      )
      .sort((a, b) => {
        if (!!a.isPartner !== !!b.isPartner) return a.isPartner ? -1 : 1;
        return a.priceRangeLow - b.priceRangeLow;
      });
  }, [suppliers, technology, quantity]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
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
  );
}
