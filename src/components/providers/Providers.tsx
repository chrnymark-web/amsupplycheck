"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureUTMParams, trackEvent } from "@/lib/analytics";

function AnalyticsListener() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    captureUTMParams();
  }, []);

  useEffect(() => {
    trackEvent("page_view", {
      page_path: pathname,
      page_search: searchParams?.toString() || "",
    });
  }, [pathname, searchParams]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AnalyticsListener />
      {children}
    </QueryClientProvider>
  );
}
