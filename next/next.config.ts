import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // The repo currently has two package-lock.json files (root Vite + next/) during
  // the migration. Pin tracing root to next/ so Next stops warning about it.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
};

export default nextConfig;
