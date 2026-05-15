import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // The repo currently has two package-lock.json files (root Vite + next/) during
  // the migration. Pin tracing root to next/ so Next stops warning about it.
  outputFileTracingRoot: path.join(__dirname),
  // Bulk-ported feature components retain warning-level ESLint hits (img elements,
  // unused vars). Real errors are fixed. Re-enable strict lint in chunk (c).
  eslint: { ignoreDuringBuilds: true },
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
};

export default nextConfig;
