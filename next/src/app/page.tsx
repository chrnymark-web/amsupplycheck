// Placeholder home page — chunk (b) of the Phase 2 migration ports the real
// homepage from src/pages/core/Index.tsx. This stub exists so the scaffold
// can build green during chunks (a)/(b).
export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="max-w-xl text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          SupplyCheck — Next.js migration in progress
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          This route is part of the SEO Phase 2 migration. The real homepage ports
          from <code className="rounded bg-muted px-1.5 py-0.5 text-sm">src/pages/core/Index.tsx</code> in chunk (b).
        </p>
        <p className="text-xs text-muted-foreground/80">
          If you can read this on the Vercel preview, Tailwind tokens + the Server Component pipeline are working.
        </p>
      </div>
    </main>
  );
}
