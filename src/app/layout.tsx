import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { Providers } from "@/components/providers/Providers";
import { BASE_URL } from "@/lib/constants";
import "./globals.css";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-M8LFXBKR";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "SupplyCheck — Find verified 3D printing suppliers worldwide",
    template: "%s | SupplyCheck",
  },
  description:
    "Connect with verified 3D printing suppliers worldwide. Filter by materials, technologies, and location to find the right match for your project.",
  applicationName: "SupplyCheck",
  authors: [{ name: "AMSupplyCheck" }],
  keywords: ["3D printing", "additive manufacturing", "suppliers", "FDM", "SLA", "SLS", "MJF", "DMLS"],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: "SupplyCheck",
    title: "SupplyCheck — Find verified 3D printing suppliers worldwide",
    description:
      "Connect with verified 3D printing suppliers worldwide. Filter by materials, technologies, and location.",
    images: [{ url: "/social.png", width: 1200, height: 630, alt: "SupplyCheck" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SupplyCheck — Find verified 3D printing suppliers worldwide",
    description: "Connect with verified 3D printing suppliers worldwide.",
    images: ["/social.png"],
  },
  verification: {
    google: "G8rpbuI_CQDCTz1LmVh8df8UqZFFe6Rd2imACTZaOm8",
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#161616",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Tag Manager (loads after interactive to keep main thread free) */}
        <Script
          id="gtm"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
          }}
        />
      </head>
      <body className="antialiased">
        {/* GTM noscript fallback */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Suspense fallback={null}>
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
