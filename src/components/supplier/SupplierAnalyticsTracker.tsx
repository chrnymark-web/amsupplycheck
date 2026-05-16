"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

interface Props {
  supplierId: string;
  supplierName: string;
  slug: string;
}

export default function SupplierAnalyticsTracker({ supplierId, supplierName, slug }: Props) {
  useEffect(() => {
    trackEvent("supplier_pageview", {
      supplier_id: supplierId,
      supplier_slug: slug,
      supplier_name: supplierName,
    });
  }, [supplierId, supplierName, slug]);

  return null;
}
