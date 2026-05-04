import { Suspense, lazy, ReactNode, useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from "react-router-dom";
import { SupplierChatbot } from "./components/chat/SupplierChatbot";
import ErrorBoundary from "./components/ErrorBoundary";
import { supabase } from "@/integrations/supabase/client";

// Lazy load pages - core
const Index = lazy(() => import("./pages/core/Index"));
const About = lazy(() => import("./pages/core/About"));
const NotFound = lazy(() => import("./pages/core/NotFound"));

// Lazy load pages - suppliers
const Suppliers = lazy(() => import("./pages/suppliers/Suppliers"));
const SupplierDetail = lazy(() => import("./pages/suppliers/SupplierDetail"));
const SupplierProfile = lazy(() => import("./pages/suppliers/SupplierProfile"));
const SupplierRoute = lazy(() => import("./components/supplier/SupplierRoute"));
const Browse = lazy(() => import("./pages/suppliers/Browse"));
const Favorites = lazy(() => import("./pages/suppliers/Favorites"));

// Lazy load pages - search
const Search = lazy(() => import("./pages/search/Search"));
const KeywordSearch = lazy(() => import("./pages/search/KeywordSearch"));
const ProjectMatch = lazy(() => import("./pages/search/ProjectMatch"));
const STLMatch = lazy(() => import("./pages/search/STLMatch"));
const CompatibilityMatrix = lazy(() => import("./pages/search/CompatibilityMatrix"));
const ComparePrices = lazy(() => import("./pages/search/ComparePrices"));
const InstantQuote = lazy(() => import("./pages/search/InstantQuote"));

// Lazy load pages - guides
const GuidesIndex = lazy(() => import("./pages/guides/GuidesIndex"));
const GuidePage = lazy(() => import("./pages/guides/GuidePage"));
const AlternativePage = lazy(() => import("./pages/guides/AlternativePage"));
const IntentPage = lazy(() => import("./pages/guides/IntentPage"));
const Knowledge = lazy(() => import("./pages/guides/Knowledge"));
const KnowledgeDetail = lazy(() => import("./pages/guides/KnowledgeDetail"));
const TechnologyGuide = lazy(() => import("./pages/guides/TechnologyGuide"));

// Lazy load pages - admin
const DataOverview = lazy(() => import("./pages/admin/Admin"));
const AdminSuppliers = lazy(() => import("./pages/admin/AdminSuppliers"));
const AdminSupplierEditor = lazy(() => import("./pages/admin/AdminSupplierEditor"));
const DataValidation = lazy(() => import("./pages/admin/DataValidation"));
const ValidationDashboard = lazy(() => import("./pages/admin/ValidationDashboard"));
const MonitoringDashboard = lazy(() => import("./pages/admin/MonitoringDashboard"));
const AIAnalyticsDashboard = lazy(() => import("./pages/admin/AIAnalyticsDashboard"));
const SEODashboard = lazy(() => import("./pages/admin/SEODashboard"));
const DiscoveredSuppliers = lazy(() => import("./pages/admin/DiscoveredSuppliers"));
const Signups = lazy(() => import("./pages/admin/Signups"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const NormalizeData = lazy(() => import("./pages/admin/NormalizeData"));
const ExportSuppliers = lazy(() => import("./pages/admin/ExportSuppliers"));

// Lazy load pages - auth & embed
const Auth = lazy(() => import("./pages/auth/Auth"));
const EmbedCompare = lazy(() => import("./pages/embed/EmbedCompare"));
const PlatformStats = lazy(() => import("./pages/embed/PlatformStats"));
const SEOPresentation = lazy(() => import("./pages/embed/SEOPresentation"));
const SitemapRedirect = lazy(() => import("./pages/embed/SitemapRedirect"));

// Redirect component for old /supplier/:id URLs
const SupplierRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/suppliers/${id}`} replace />;
};

// Wrapper that gates admin pages: requires a Supabase session AND user_roles.role === 'admin'.
// Also adds noindex meta. Non-admins see an access-denied screen; unauthed users redirect to /auth.
type AdminAuthState = "checking" | "unauthed" | "non-admin" | "admin";

const AdminPage = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const [state, setState] = useState<AdminAuthState>("checking");

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!session) {
        setState("unauthed");
        return;
      }
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (cancelled) return;
      setState(roleRow?.role === "admin" ? "admin" : "non-admin");
    };

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setState("unauthed");
      } else {
        setState("checking");
        check();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const head = <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>;

  if (state === "checking") {
    return (
      <>
        {head}
        <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
          Checking access…
        </div>
      </>
    );
  }

  if (state === "unauthed") {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirect=${redirect}`} replace />;
  }

  if (state === "non-admin") {
    return (
      <>
        {head}
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center">
          <h1 className="text-xl font-semibold">Access denied</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            Your account does not have admin access. Contact the site owner if you think this is a mistake.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {head}
      {children}
    </>
  );
};

// Configure React Query for optimal caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppRoutes = () => {
  const location = useLocation();
  return (
    <ErrorBoundary key={location.pathname}>
      <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/suppliers/:slug" element={<SupplierProfile />} />
            <Route path="/search" element={<Search />} />
            <Route path="/keywordsearch" element={<KeywordSearch />} />
            <Route path="/about" element={<About />} />
            <Route path="/compatibility" element={<CompatibilityMatrix />} />
            <Route path="/supplier" element={<Navigate to="/suppliers" replace />} />
            <Route path="/supplier/:id" element={<SupplierRedirect />} />
            <Route path="/suppliers/:slug" element={<SupplierRoute />} />
            {/* sitemap.xml is now served as a static file from public/ */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin/dashboard" element={<AdminPage><ValidationDashboard /></AdminPage>} />
            <Route path="/admin/monitoring" element={<AdminPage><MonitoringDashboard /></AdminPage>} />
            <Route path="/admin/ai-analytics" element={<AdminPage><AIAnalyticsDashboard /></AdminPage>} />
            <Route path="/admin/suppliers" element={<AdminPage><AdminSuppliers /></AdminPage>} />
            <Route path="/admin/supplier/:id/edit" element={<AdminPage><AdminSupplierEditor /></AdminPage>} />
            <Route path="/admin/validation" element={<AdminPage><DataValidation /></AdminPage>} />
            <Route path="/admin/export" element={<AdminPage><ExportSuppliers /></AdminPage>} />
            <Route path="/admin/normalize" element={<AdminPage><NormalizeData /></AdminPage>} />
            <Route path="/admin/signups" element={<AdminPage><Signups /></AdminPage>} />
            <Route path="/admin/discovered" element={<AdminPage><DiscoveredSuppliers /></AdminPage>} />
            <Route path="/analytics" element={<AdminPage><Analytics /></AdminPage>} />
            <Route path="/match" element={<ProjectMatch />} />
            <Route path="/stl-match" element={<InstantQuote mode="match" />} />
            <Route path="/stl-match-legacy" element={<STLMatch />} />
            <Route path="/compare-prices" element={<InstantQuote mode="compare" />} />
            <Route path="/compare-prices-legacy" element={<ComparePrices />} />
            
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/knowledge/:type/:slug" element={<KnowledgeDetail />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/technology-guide" element={<TechnologyGuide />} />
            <Route path="/instant-3d-printing-quotes" element={<IntentPage />} />
            <Route path="/upload-stl-for-quote" element={<IntentPage />} />
            <Route path="/3d-printing-near-me" element={<IntentPage />} />
            <Route path="/compare-3d-printing-prices" element={<IntentPage />} />
            <Route path="/cnc-machining-near-me" element={<IntentPage />} />
            <Route path="/guides" element={<GuidesIndex />} />
            <Route path="/guides/best-xometry-alternatives" element={<AlternativePage />} />
            <Route path="/guides/best-protolabs-alternatives" element={<AlternativePage />} />
            <Route path="/guides/best-hubs-alternatives" element={<AlternativePage />} />
            <Route path="/guides/best-sculpteo-alternatives" element={<AlternativePage />} />
            <Route path="/guides/top-manufacturing-platforms" element={<AlternativePage />} />
            {/* Versus pages */}
            <Route path="/guides/xometry-vs-protolabs" element={<AlternativePage />} />
            <Route path="/guides/hubs-vs-shapeways" element={<AlternativePage />} />
            <Route path="/guides/materialise-vs-sculpteo" element={<AlternativePage />} />
            <Route path="/guides/protolabs-vs-fictiv" element={<AlternativePage />} />
            {/* Regional & category roundups */}
            <Route path="/guides/best-3d-printing-services-europe" element={<AlternativePage />} />
            <Route path="/guides/best-3d-printing-services-usa" element={<AlternativePage />} />
            <Route path="/guides/top-cnc-machining-platforms" element={<AlternativePage />} />
            <Route path="/guides/best-metal-3d-printing-services" element={<AlternativePage />} />
            <Route path="/guides/best-3d-printing-services" element={<AlternativePage />} />
            <Route path="/guides/:slug" element={<GuidePage />} />
            <Route path="/embed/compare" element={<EmbedCompare />} />
            <Route path="/stats" element={<PlatformStats />} />
            <Route path="/seo-presentation" element={<SEOPresentation />} />
            <Route path="/admin/seo-dashboard" element={<AdminPage><SEODashboard /></AdminPage>} />
            <Route path="/admin/data-overview" element={<AdminPage><DataOverview /></AdminPage>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
    </ErrorBoundary>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        }>
          <AppRoutes />
        </Suspense>
        
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
