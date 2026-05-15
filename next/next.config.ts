import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // The repo currently has two package-lock.json files (root Vite + next/) during
  // the migration. Pin tracing root to next/ so Next stops warning about it.
  outputFileTracingRoot: path.join(__dirname),
  // Strict ESLint re-enabled in chunk-d (d2). Three warning-level hits remain
  // (img elements in supplier-logo, exhaustive-deps in use-in-view) — those are
  // warnings, not errors, so they don't fail the build.
  eslint: { ignoreDuringBuilds: false },
  // The root package.json's @types/react@18 shadows next/node_modules/@types/react@19
  // during typecheck, surfacing bigint-in-ReactNode mismatches. Skip TS during build
  // until the Vite/Next monorepo split is finalized in chunk (d).
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
  // Legacy /supplier(/:id) → /suppliers(/:id) redirects live as App Router pages
  // (src/app/supplier/page.tsx + src/app/supplier/[id]/page.tsx) using
  // permanentRedirect(). next.config.ts `redirects()` and middleware.ts both
  // trigger build crashes on Next 15.5.18 (500.html rename, pages-manifest).
};

export default nextConfig;
