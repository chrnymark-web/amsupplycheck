import type { Metadata } from "next";
import ComparePricesLegacyClient from "./ComparePricesLegacyClient";

export const metadata: Metadata = {
  title: "Compare 3D Printing Prices | AMSupplyCheck",
  description:
    "Upload your 3D model and compare live prices from 90+ vendors. Get instant quotes from Craftcloud, Treatstock, and more.",
  alternates: { canonical: "https://amsupplycheck.com/compare-prices-legacy" },
  robots: { index: false, follow: false },
};

export default function ComparePricesLegacyPage() {
  return <ComparePricesLegacyClient />;
}
