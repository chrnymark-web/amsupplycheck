import { Suspense, lazy, ReactNode } from "react";
import { Helmet } from "react-helmet";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { SupplierChatbot } from "./components/SupplierChatbot";

// Lazy load ALL pages including Index for better code splitting
const Index = lazy(() => import("./pages/Index"));

// Lazy load pages for better code splitting
const Search = lazy(() => import("./pages/Search"));
const KeywordSearch = lazy(() => import("./pages/KeywordSearch"));
const About = lazy(() => import("./pages/About"));
const CompatibilityMatrix = lazy(() => import("./pages/CompatibilityMatrix"));
const SupplierDetail = lazy(() => import("./pages/SupplierDetail"));
const SupplierRoute = lazy(() => import("./components/SupplierRoute"));
const SitemapRedirect = lazy(() => import("./pages/SitemapRedirect"));
const DataValidation = lazy(() => import("./pages/DataValidation"));
const ValidationDashboard = lazy(() => import("./pages/ValidationDashboard"));
const MonitoringDashboard = lazy(() => import("./pages/MonitoringDashboard"));
const AIAnalyticsDashboard = lazy(() => import("./pages/AIAnalyticsDashboard"));
const AdminSuppliers = lazy(() => import("./pages/AdminSuppliers"));
const AdminSupplierEditor = lazy(() => import("./pages/AdminSupplierEditor"));
const ExportSuppliers = lazy(() => import("./pages/ExportSuppliers"));
const Auth = lazy(() => import("./pages/Auth"));
const NormalizeData = lazy(() => import("./pages/NormalizeData"));
const Signups = lazy(() => import("./pages/Signups"));
const Analytics = lazy(() => import("./pages/Analytics"));
const ProjectMatch = lazy(() => import("./pages/ProjectMatch"));

const DiscoveredSuppliers = lazy(() => import("./pages/DiscoveredSuppliers"));
const TechnologyGuide = lazy(() => import("./pages/TechnologyGuide"));
const NotFound = lazy(() => import("./pages/NotFound"));
const IntentPage = lazy(() => import("./pages/IntentPage"));
const GuidePage = lazy(() => import("./pages/GuidePage"));
const GuidesIndex = lazy(() => import("./pages/GuidesIndex"));
const Favorites = lazy(() => import("./pages/Favorites"));
const AlternativePage = lazy(() => import("./pages/AlternativePage"));
const EmbedCompare = lazy(() => import("./pages/EmbedCompare"));
const PlatformStats = lazy(() => import("./pages/PlatformStats"));
const SEOPresentation = lazy(() => import("./pages/SEOPresentation"));
const SEODashboard = lazy(() => import("./pages/SEODashboard"));
const DataOverview = lazy(() => import("./pages/Admin"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const SupplierProfile = lazy(() => import("./pages/SupplierProfile"));
const Knowledge = lazy(() => import("./pages/Knowledge"));
const KnowledgeDetail = lazy(() => import("./pages/KnowledgeDetail"));
const Browse = lazy(() => import("./pages/Browse"));

// Redirect component for old /supplier/:id URLs
const SupplierRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/suppliers/${id}`} replace />;
};

// Wrapper that adds noindex to admin pages
const AdminPage = ({ children }: { children: ReactNode }) => (
  <>
    <Helmet><meta name="robots" content="noindex, nofollow" /></Helmet>
    {children}
  </>
);

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
        </Suspense>
        
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
