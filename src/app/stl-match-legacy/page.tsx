import type { Metadata } from "next";
import { getCompatibilityMatrix } from "@/lib/compatibility";
import StlMatchLegacyClient from "./StlMatchLegacyClient";

export const metadata: Metadata = {
  title: "STL Supplier Match | AMSupplyCheck",
  description: "Upload your STL file and find the best 3D printing suppliers for your part.",
  alternates: { canonical: "https://www.amsupplycheck.com/stl-match-legacy" },
  robots: { index: false, follow: false },
};

export default async function StlMatchLegacyPage() {
  const { technologyToMaterials } = await getCompatibilityMatrix();
  return <StlMatchLegacyClient technologyToMaterials={technologyToMaterials} />;
}
