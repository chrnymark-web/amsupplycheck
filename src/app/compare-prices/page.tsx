import type { Metadata } from "next";
import { getCompatibilityMatrix } from "@/lib/compatibility";
import ComparePricesClient from "./ComparePricesClient";

export const metadata: Metadata = {
  title: "Compare 3D Printing Quotes | AMSupplyCheck",
  description:
    "Upload your STL and compare live quotes from 3D printing suppliers in seconds — sorted by price, lead time, and material.",
  alternates: { canonical: "https://www.amsupplycheck.com/compare-prices" },
  robots: { index: false, follow: false },
};

export default async function ComparePricesPage() {
  const { technologyToMaterials } = await getCompatibilityMatrix();
  return <ComparePricesClient technologyToMaterials={technologyToMaterials} />;
}
