import { Helmet } from "react-helmet";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LivePriceComparison } from "@/components/ui/live-price-comparison";
import { getEstimatedPrice } from "@/lib/api";
import { useSuppliers } from "@/hooks/use-suppliers";
import type { EstimatedPrice } from "@/lib/api/types";

export default function ComparePrices() {
  const navigate = useNavigate();
  const { suppliers } = useSuppliers();

  // Generate estimated prices for all suppliers in the database, sorted by lowest price first
  const estimatedPrices: EstimatedPrice[] = suppliers.slice(0, 20).map((s) =>
    getEstimatedPrice(
      s.name,
      s.supplier_id,
      s.technologies.map((t) => t.name),
      s.logo_url || undefined
    )
  ).sort((a, b) => a.priceRangeLow - b.priceRangeLow);

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
          <div className="max-w-3xl mx-auto">
            <LivePriceComparison
              estimatedPrices={estimatedPrices}
              currency="EUR"
              countryCode="DK"
            />
          </div>
        </main>
      </div>
    </>
  );
}
