import type { Metadata } from "next";
import MatchClient from "./MatchClient";

export const metadata: Metadata = {
  title: "Project Matching | AMSupplyCheck",
  description:
    "Describe your 3D printing project and get supplier recommendations tailored to your specific requirements — technologies, materials, certifications, and region.",
  alternates: { canonical: "https://www.amsupplycheck.com/match" },
  robots: { index: false, follow: false },
};

export default function MatchPage() {
  return <MatchClient />;
}
