import type { Metadata } from "next";
import { getCompatibilityMatrix } from "@/lib/compatibility";
import StlMatchClient from "./StlMatchClient";

export const metadata: Metadata = {
  title: "STL Supplier Match | AMSupplyCheck",
  description:
    "Upload your STL file and get matched with 3D printing suppliers that can produce your part — filtered by technology, material, and production volume.",
  alternates: { canonical: "https://amsupplycheck.com/stl-match" },
  robots: { index: false, follow: false },
};

export default async function StlMatchPage() {
  const { technologyToMaterials } = await getCompatibilityMatrix();
  return <StlMatchClient technologyToMaterials={technologyToMaterials} />;
}
