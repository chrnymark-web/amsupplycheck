import type { Metadata } from "next";
import { notFound } from "next/navigation";
import IntentPage from "@/components/intent/IntentPage";
import { getIntentPageBySlug } from "@/lib/intentPages";

const SLUG = "3d-printing-near-me";
const cfg = getIntentPageBySlug(SLUG);
const url = `https://www.amsupplycheck.com/${SLUG}`;

export const metadata: Metadata = cfg
  ? {
      title: { absolute: cfg.metaTitle },
      description: cfg.metaDescription,
      alternates: { canonical: url },
      openGraph: {
        title: cfg.metaTitle,
        description: cfg.metaDescription,
        url,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: cfg.metaTitle,
        description: cfg.metaDescription,
      },
    }
  : { title: "Not found | AMSupplyCheck", robots: { index: false } };

export default function Page() {
  if (!cfg) notFound();
  return <IntentPage cfg={cfg} />;
}
