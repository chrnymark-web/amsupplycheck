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
  // Strict TS re-enabled in chunk-d (d3). Root @types/react bumped to ^19 to match
  // next/, @supabase/ssr upgraded to ^0.10.3 to fix Schema=never inference, and
  // FloatingNav.onNavigate made optional with a default scrollIntoView.
  typescript: { ignoreBuildErrors: false },
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
