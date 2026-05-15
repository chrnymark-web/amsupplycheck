"use client";

import { useMemo } from "react";
import Link from "next/link";
import { slugifyVendorName } from "@/lib/utils";
import Navbar from "@/components/ui/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SupplierLogo from "@/components/ui/supplier-logo";
import { ArrowLeft, ExternalLink, Signal, Package, Clock } from "lucide-react";

interface CraftcloudVendor {
  supplierId: string;
  supplierName: string;
  supplierLogo?: string;
  material: string;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  quantity: number;
  estimatedLeadTimeDays: number | null;
  shippingEstimate: number | null;
  fetchedAt: Date;
  alternativeQuotes?: { material: string; label?: string; unitPrice: number }[];
}

function readCraftcloudVendor(slug: string): CraftcloudVendor | null {
  try {
    const raw = sessionStorage.getItem("stl-live-quotes");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const storedAt = new Date(parsed.storedAt).getTime();
    if (Date.now() - storedAt > 30 * 60 * 1000) return null;
    const match = parsed.quotes.find((q: Record<string, unknown>) => {
      const qSlug = slugifyVendorName(q.supplierName as string);
      return qSlug === slug;
    });
    if (match) return { ...match, fetchedAt: new Date(match.fetchedAt) } as CraftcloudVendor;

    const ccMatch = parsed.quotes.find((q: Record<string, unknown>) => {
      const supplierId = q.supplierId as string;
      if (!supplierId?.startsWith("craftcloud-")) return false;
      const vendorId = supplierId.replace("craftcloud-", "");
      return vendorId === slug || vendorId === slug.replace(/-/g, "");
    });
    if (ccMatch) return { ...ccMatch, fetchedAt: new Date(ccMatch.fetchedAt) } as CraftcloudVendor;

    return null;
  } catch {
    return null;
  }
}

const formatCurrency = (amount: number, currency: string) => {
  const symbols: Record<string, string> = { EUR: "€", USD: "$", GBP: "£", DKK: "kr" };
  const sym = symbols[currency] || currency;
  return `${sym}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function SupplierMissingFallback({ slug }: { slug: string }) {
  const vendor = useMemo(() => {
    if (typeof window === "undefined") return null;
    return readCraftcloudVendor(slug);
  }, [slug]);

  if (vendor) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background pt-20">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <Link
              href="/suppliers"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to suppliers
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-5">
                      <SupplierLogo name={vendor.supplierName} logoUrl={vendor.supplierLogo} size="2xl" />
                      <div className="flex-1">
                        <h1 className="text-2xl font-bold text-foreground mb-2">{vendor.supplierName}</h1>
                        <Badge variant="secondary" className="text-xs">
                          <Signal className="h-3 w-3 mr-1" />
                          Craftcloud Marketplace Vendor
                        </Badge>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                          This vendor is available through the Craftcloud 3D printing marketplace. Pricing data shown is from a live quote.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Package className="h-5 w-5 text-primary" /> Live Quote Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Unit Price</p>
                          <p className="text-lg font-semibold text-foreground">{formatCurrency(vendor.unitPrice, vendor.currency)}</p>
                        </div>
                        {vendor.quantity > 1 && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Total ({vendor.quantity} pcs)</p>
                            <p className="text-lg font-semibold text-foreground">{formatCurrency(vendor.totalPrice, vendor.currency)}</p>
                          </div>
                        )}
                        {vendor.estimatedLeadTimeDays != null && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Lead Time</p>
                            <p className="text-lg font-semibold text-foreground flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {vendor.estimatedLeadTimeDays} days
                            </p>
                          </div>
                        )}
                        {vendor.shippingEstimate != null && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Shipping</p>
                            <p className="text-lg font-semibold text-foreground">{formatCurrency(vendor.shippingEstimate, vendor.currency)}</p>
                          </div>
                        )}
                      </div>

                      {vendor.material && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-1">Material</p>
                          <Badge variant="outline">{vendor.material.replace(/[_-]/g, " ")}</Badge>
                        </div>
                      )}

                      {vendor.alternativeQuotes && vendor.alternativeQuotes.length > 0 && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-2">Alternative Materials</p>
                          <div className="space-y-2">
                            {vendor.alternativeQuotes.map((alt, i) => (
                              <div key={i} className="flex items-center justify-between p-2 rounded-md border border-border">
                                <span className="text-sm text-foreground">{alt.label || alt.material.replace(/[_-]/g, " ")}</span>
                                <span className="text-sm font-medium text-foreground">{formatCurrency(alt.unitPrice, vendor.currency)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="bg-card border-border sticky top-24">
                  <CardContent className="p-5 space-y-4">
                    <h3 className="font-semibold text-foreground">Get a Quote</h3>
                    <a
                      href="https://craftcloud3d.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full rounded-md bg-primary text-primary-foreground hover:bg-primary-hover h-10 px-4 text-sm font-medium transition-colors"
                    >
                      Visit Craftcloud <ExternalLink className="h-4 w-4" />
                    </a>
                    <p className="text-xs text-muted-foreground">
                      This vendor offers quotes through the Craftcloud marketplace. Upload your 3D model on Craftcloud to get an instant quote.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Supplier not found</h1>
          <p className="text-muted-foreground mb-4">The supplier you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/suppliers">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to suppliers
            </Button>
          </Link>
        </div>
      </main>
    </>
  );
}
