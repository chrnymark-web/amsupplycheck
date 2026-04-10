import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import ShapewaysPrintabilityDialog from '@/components/upload/ShapewaysPrintabilityDialog';
import { PriceCalculator } from '@/components/pricing/PriceCalculator';
import { supabase as supabaseClient } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import Map from '@/components/ui/map';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Navbar from '@/components/ui/navbar';
import CookieConsent from '@/components/layout/CookieConsent';
import NewsletterSignup from '@/components/forms/NewsletterSignup';
import FloatingNav from '@/components/layout/FloatingNav';
import { UploadSTLCTA } from '@/components/upload/UploadSTLCTA';
import SupplierCardSkeleton from '@/components/supplier/SupplierCardSkeleton';
import { SearchSuggestions, getPopularQueries } from '@/components/search/SearchSuggestions';
import AISearchInput from '@/components/search/AISearchInput';
import { type AISearchFilters } from '@/hooks/use-ai-search';
import TrendingSearches from '@/components/search/TrendingSearches';
import { Button } from '@/components/ui/button';
import { RippleButton } from '@/components/ui/ripple-button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useCounterAnimation, useAnimatedCount } from '@/hooks/use-counter-animation';
import { useInView } from '@/hooks/use-in-view';
import { useScrollDepth } from '@/hooks/use-scroll-depth';
import SupplierLogo from '@/components/ui/supplier-logo';
import { Search, Users, Globe, Shield, ArrowRight, CheckCircle, Star, Zap, Eye, BarChart3, Hand, MapPin, ExternalLink, ArrowUp, Sparkles, ChevronDown, Loader2, Upload, Cpu, FlaskConical } from 'lucide-react';
import { getAllMaterials, getAllTechnologies, getAllAreas, getMaterialKeyFromDisplayName, getTechnologyKeyFromDisplayName, type ParsedSupplier } from '@/lib/supplierData';
import { countTechnologyCategories, countMaterialCategories } from '@/lib/categoryMappings';
import { useKnowledgeData } from '@/hooks/use-knowledge-data';
import { supabase } from '@/integrations/supabase/client';
import { trackSearch, trackCTAClick } from '@/lib/analytics';
import heroImageUrl from '@/assets/hero-background.avif';

// Map is now directly imported above to avoid WebGL rendering issues with lazy loading

const MapFallback = () => (
  <div className="w-full h-full bg-muted/50 rounded-xl flex items-center justify-center">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
      <p className="text-muted-foreground text-sm">Loading map...</p>
    </div>
  </div>
);
const AdditionalFeaturesContent = ({ 
  isLoading, 
  supplierCount, 
  countryCount, 
  technologyCount, 
  materialCount 
}: { 
  isLoading: boolean; 
  supplierCount: number; 
  countryCount: number; 
  technologyCount: number; 
  materialCount: number;
}) => {
  const { ref: headingRef, isInView: headingInView } = useInView({ threshold: 0.2 });
  const { ref: benefit1Ref, isInView: benefit1InView } = useInView({ threshold: 0.2 });
  const { ref: benefit2Ref, isInView: benefit2InView } = useInView({ threshold: 0.2 });
  const { ref: benefit3Ref, isInView: benefit3InView } = useInView({ threshold: 0.2 });
  const { ref: statsCardRef, isInView: statsCardInView } = useInView({ threshold: 0.2 });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      <div>
        <h2 
          ref={headingRef}
          className={`text-3xl md:text-4xl font-bold text-foreground mb-6 transition-all duration-700 ${
            headingInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          Additional Benefits
        </h2>
        <div className="space-y-6">
          <div 
            ref={benefit1Ref}
            className={`flex items-start space-x-4 transition-all duration-700 p-4 rounded-lg hover:bg-muted/50 hover:scale-105 cursor-pointer ${
              benefit1InView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}
          >
            <div className="w-8 h-8 bg-supplier-verified rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Verified Suppliers Only
              </h3>
              <p className="text-muted-foreground">
                All suppliers are thoroughly vetted and verified to ensure quality and reliability.
              </p>
            </div>
          </div>
          
          <div 
            ref={benefit2Ref}
            className={`flex items-start space-x-4 transition-all duration-700 delay-100 p-4 rounded-lg hover:bg-muted/50 hover:scale-105 cursor-pointer ${
              benefit2InView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}
          >
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Secure & Transparent
              </h3>
              <p className="text-muted-foreground">
                We maintain transparency and security in all connections, protecting your IP and data.
              </p>
            </div>
          </div>
          
          <div 
            ref={benefit3Ref}
            className={`flex items-start space-x-4 transition-all duration-700 delay-200 p-4 rounded-lg hover:bg-muted/50 hover:scale-105 cursor-pointer ${
              benefit3InView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}
          >
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Global Reach
              </h3>
              <p className="text-muted-foreground">
                Access suppliers from around the world to find the best fit for your specific requirements.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div 
        ref={statsCardRef}
        className={`lg:pl-8 transition-all duration-700 ${
          statsCardInView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
        }`}
      >
        <Card className="bg-gradient-card border-border shadow-card p-8">
          <div className="space-y-6">
            {isLoading ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-6 w-12 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-4 w-36 bg-muted rounded animate-pulse" />
                  <div className="h-6 w-12 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                  <div className="h-6 w-12 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-4 w-36 bg-muted rounded animate-pulse" />
                  <div className="h-6 w-12 bg-muted rounded animate-pulse" />
                </div>
              </>
            ) : (
              <>
                <div className={`flex items-center justify-between transition-all duration-700 ${
                  statsCardInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                } delay-100`}>
                  <span className="text-muted-foreground">Active Suppliers</span>
                  <Badge 
                    variant="secondary" 
                    className={`text-lg px-3 py-1 transition-all ${
                      statsCardInView ? 'animate-pulse' : ''
                    }`}
                    style={{ animationDuration: '2s', animationIterationCount: '3' }}
                  >
                    {supplierCount}+
                  </Badge>
                </div>
                <div className={`flex items-center justify-between transition-all duration-700 ${
                  statsCardInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                } delay-200`}>
                  <span className="text-muted-foreground">Countries Covered</span>
                  <Badge 
                    variant="secondary" 
                    className={`text-lg px-3 py-1 transition-all ${
                      statsCardInView ? 'animate-pulse' : ''
                    }`}
                    style={{ animationDuration: '2s', animationIterationCount: '3' }}
                  >
                    {countryCount}+
                  </Badge>
                </div>
                <div className={`flex items-center justify-between transition-all duration-700 ${
                  statsCardInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                } delay-300`}>
                  <span className="text-muted-foreground">Technologies Supported</span>
                  <Badge 
                    variant="secondary" 
                    className={`text-lg px-3 py-1 transition-all ${
                      statsCardInView ? 'animate-pulse' : ''
                    }`}
                    style={{ animationDuration: '2s', animationIterationCount: '3' }}
                  >
                    {technologyCount}+
                  </Badge>
                </div>
                <div className={`flex items-center justify-between transition-all duration-700 ${
                  statsCardInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                } delay-[400ms]`}>
                  <span className="text-muted-foreground">Materials Available</span>
                  <Badge 
                    variant="secondary" 
                    className={`text-lg px-3 py-1 transition-all ${
                      statsCardInView ? 'animate-pulse' : ''
                    }`}
                    style={{ animationDuration: '2s', animationIterationCount: '3' }}
                  >
                    {materialCount}+
                  </Badge>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

const WhyChooseSectionContent = () => {
  const { ref: headingRef, isInView: headingInView } = useInView({ threshold: 0.2 });
  const { ref: card1Ref, isInView: card1InView } = useInView({ threshold: 0.2 });
  const { ref: card2Ref, isInView: card2InView } = useInView({ threshold: 0.2 });
  const { ref: card3Ref, isInView: card3InView } = useInView({ threshold: 0.2 });
  const { ref: card4Ref, isInView: card4InView } = useInView({ threshold: 0.2 });

  return (
    <>
      <div 
        ref={headingRef}
        className={`text-center mb-16 transition-all duration-700 ${
          headingInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Why Choose SupplyCheck?
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div 
          ref={card1Ref}
          className={`text-center transition-all duration-700 delay-100 ${
            card1InView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <BarChart3 className="h-16 w-16 text-white" strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-6">
            Data-Driven Supplier Evaluation
          </h3>
          <p className="text-white/90 text-lg leading-relaxed">
            We continuously monitor and collect data from online 3D printing 
            service providers to stay updated on the latest trends in the market, 
            relieving you of this task. Our team analyzes and categorizes the 
            data, presenting it to you in a simple and easy-to-understand 
            manner. This allows you to effortlessly compare suppliers' 
            technologies and materials, helping you quickly find the supplier that 
            best suits your needs.
          </p>
        </div>

        <div 
          ref={card2Ref}
          className={`text-center transition-all duration-700 delay-200 ${
            card2InView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Eye className="h-16 w-16 text-white" strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-6">
            Unbiased and Transparent
          </h3>
          <p className="text-white/90 text-lg leading-relaxed">
            SupplyCheck is your transparent 3D printing supplier guide. We are 
            impartial and aim to be your preferred, unbiased wayfinder when 
            looking for a 3D printing supplier. We strive to include and compare 
            all online 3D printing suppliers without favoritism, so you can make 
            informed manufacturing decisions. Our platform is entirely free to 
            use. We may receive referral fees from suppliers when you contact 
            them, but this never influences our rankings or recommendations — 
            all suppliers are presented equally based on your search criteria.
          </p>
        </div>

        <div 
          ref={card3Ref}
          className={`text-center transition-all duration-700 delay-300 ${
            card3InView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Shield className="h-16 w-16 text-white" strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-6">
            Secure by Design (IP Protection)
          </h3>
          <p className="text-white/90 text-lg leading-relaxed">
            We understand the importance of security and confidentiality in your 
            designs. Trusting new online suppliers and negotiating NDAs with 
            potential 3D printing partners can be challenging and time-consuming. 
            That's why we offer a 100% anonymous indication without sharing your 
            contact information or confidential designs (you don't even have to 
            login). Simply specify your 3D printing requirements by selecting your 
            preferred materials, technologies, and geographical areas, compare 
            suppliers, and, once you've found the right fit, efficiently sign the 
            confidentiality agreement with that specific service provider.
          </p>
        </div>

        <div 
          ref={card4Ref}
          className={`text-center transition-all duration-700 delay-[400ms] ${
            card4InView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Hand className="h-16 w-16 text-white" strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-6">
            Instant, Comparable Quotes
          </h3>
          <p className="text-white/90 text-lg leading-relaxed">
            Time is money, and we understand that you often don't have the 
            luxury of going back and forth with multiple suppliers, waiting for 
            days or even weeks to receive and compare quotes. That's why we 
            are committed to providing you with instant access to the suppliers' 
            technologies and materials, eliminating the need for you to make 
            countless calls or send lengthy emails. Therefore, we enable you to 
            compare resources and capabilities from multiple sources instantly, 
            allowing you to make more informed decisions faster and focus on 
            what matters most: your project.
          </p>
        </div>
      </div>
    </>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [suppliers, setSuppliers] = useState<ParsedSupplier[]>([]);
  const [visibleSuppliers, setVisibleSuppliers] = useState<ParsedSupplier[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [searchKeywords, setSearchKeywords] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [supplierCount, setSupplierCount] = useState<number>(200);
  const [countryCount, setCountryCount] = useState<number>(50);
  const [technologyCount, setTechnologyCount] = useState<number>(0);
  const [materialCount, setMaterialCount] = useState<number>(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  const [isMapPanelMinimized, setIsMapPanelMinimized] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Shapeways printability state
  const [shapewaysDialogOpen, setShapewaysDialogOpen] = useState(false);
  const [shapewaysLoading, setShapewaysLoading] = useState(false);
  const [shapewaysError, setShapewaysError] = useState<string | null>(null);
  const [shapewaysResult, setShapewaysResult] = useState<any>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');

  const handleSTLUpload = async (file: File) => {
    setUploadedFileName(file.name);
    setShapewaysDialogOpen(true);
    setShapewaysLoading(true);
    setShapewaysError(null);
    setShapewaysResult(null);

    try {
      const reader = new FileReader();
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabaseClient.functions.invoke('shapeways-printability', {
        body: { fileName: file.name, fileBase64 },
      });

      if (error) throw new Error(error.message);
      setShapewaysResult(data);
    } catch (err: any) {
      setShapewaysError(err.message || 'Failed to check printability');
    } finally {
      setShapewaysLoading(false);
    }
  };

  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      company: ''
    }
  });

  // Get dynamic data arrays from supplier data
  const allMaterials = getAllMaterials();
  const allTechnologies = getAllTechnologies();
  const allAreas = getAllAreas();

  // Set map panel minimized state based on screen size
  useEffect(() => {
    const handleResize = () => {
      // On mobile (< 1024px), start minimized. On desktop, expand by default
      setIsMapPanelMinimized(window.innerWidth < 1024);
    };
    
    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset search loading state when component mounts (e.g., navigating back)
  useEffect(() => {
    setIsSearching(false);
  }, []);

  // Inject Organization JSON-LD structured data for brand visibility
  useEffect(() => {
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "AMSupplyCheck",
      "url": "https://amsupplycheck.com",
      "logo": "https://amsupplycheck.com/favicon.ico",
      "description": "Connect with verified 3D printing suppliers worldwide. Filter by materials, technologies, and location to find the perfect match for your project.",
      "sameAs": [],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "url": "https://amsupplycheck.com/about"
      },
      "foundingDate": "2025",
      "knowsAbout": [
        "3D Printing",
        "Additive Manufacturing",
        "FDM", "SLA", "SLS", "MJF", "DMLS", "EBM",
        "Prototyping",
        "Manufacturing Suppliers"
      ]
    };

    const websiteSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "AMSupplyCheck",
      "url": "https://amsupplycheck.com",
      "description": "Find and compare 3D printing suppliers worldwide",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://amsupplycheck.com/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'org-jsonld';
    script.textContent = JSON.stringify([organizationSchema, websiteSchema]);
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('org-jsonld');
      if (existing) existing.remove();
    };
  }, []);


  // Show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
      
      // Calculate scroll progress
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (window.scrollY / windowHeight) * 100;
      setScrollProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  // Add WebSite structured data for SEO
  useEffect(() => {
    // Update page title
    document.title = 'SupplyCheck - Find 3D Printing Suppliers Worldwide';

    // Add hreflang tags for international SEO
    const addHreflangTag = (lang: string, url: string) => {
      let link = document.querySelector(`link[rel="alternate"][hreflang="${lang}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'alternate');
        link.setAttribute('hreflang', lang);
        document.head.appendChild(link);
      }
      link.setAttribute('href', url);
    };

    const baseUrl = window.location.origin;
    // English (default/global)
    addHreflangTag('en', baseUrl);
    // Danish (for Denmark)
    addHreflangTag('da', baseUrl);
    // Default fallback
    addHreflangTag('x-default', baseUrl);

    // WebSite structured data with site search capability
    const websiteData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'SupplyCheck',
      url: window.location.origin,
      description: 'Connect with verified 3D printing suppliers worldwide. Filter by materials, technologies, and location to find the perfect match for your project.',
      inLanguage: ['en', 'da'],
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${window.location.origin}/search?keywords={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
      publisher: {
        '@type': 'Organization',
        name: 'AMSupplyCheck',
        logo: {
          '@type': 'ImageObject',
          url: `${window.location.origin}/logo.png`,
        },
      },
    };

    // ContactPage structured data
    const contactPageData = {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Become a Supplier - AMSupplyCheck',
      description: 'Join our network of verified 3D printing suppliers and connect with customers worldwide.',
      url: `${window.location.origin}/#contact`,
      inLanguage: ['en', 'da'],
      mainEntity: {
        '@type': 'Organization',
        name: 'AMSupplyCheck',
        url: window.location.origin,
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: 'Supplier Relations',
            availableLanguage: ['English', 'Danish'],
            contactOption: 'TollFree',
          },
          {
            '@type': 'ContactPoint',
            contactType: 'Customer Support',
            availableLanguage: ['English', 'Danish'],
          },
        ],
      },
    };

    // Add or update WebSite structured data script
    let websiteScript = document.querySelector('script[type="application/ld+json"][data-website-schema]');
    if (!websiteScript) {
      websiteScript = document.createElement('script');
      websiteScript.setAttribute('type', 'application/ld+json');
      websiteScript.setAttribute('data-website-schema', 'true');
      document.head.appendChild(websiteScript);
    }
    websiteScript.textContent = JSON.stringify(websiteData);

    // Add or update ContactPage structured data script
    let contactScript = document.querySelector('script[type="application/ld+json"][data-contact-schema]');
    if (!contactScript) {
      contactScript = document.createElement('script');
      contactScript.setAttribute('type', 'application/ld+json');
      contactScript.setAttribute('data-contact-schema', 'true');
      document.head.appendChild(contactScript);
    }
    contactScript.textContent = JSON.stringify(contactPageData);

    // Cleanup function
    return () => {
      // Remove hreflang tags
      document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(link => link.remove());
      
      const websiteScriptCleanup = document.querySelector('script[type="application/ld+json"][data-website-schema]');
      if (websiteScriptCleanup) {
        websiteScriptCleanup.remove();
      }
      const contactScriptCleanup = document.querySelector('script[type="application/ld+json"][data-contact-schema]');
      if (contactScriptCleanup) {
        contactScriptCleanup.remove();
      }
    };
  }, []);

  // Track scroll depth
  useScrollDepth();

  // Animated counters
  const animatedSupplierCount = useCounterAnimation({ end: supplierCount, duration: 2000 });
  const animatedCountryCount = useCounterAnimation({ end: countryCount, duration: 2000 });
  const animatedTechnologyCount = useCounterAnimation({ end: technologyCount, duration: 2000 });
  const animatedMaterialCount = useCounterAnimation({ end: materialCount, duration: 2000 });

  // Viewport detection for animations
  const { ref: statsRef, isInView: statsInView } = useInView({ threshold: 0.3 });
  const { ref: contactRef, isInView: contactInView } = useInView({ threshold: 0.2 });
  const { ref: heroRef, isInView: heroInView } = useInView({ threshold: 0.1, triggerOnce: true });
  const { ref: mapRef, isInView: mapInView } = useInView({ threshold: 0.1, triggerOnce: true });

  // Fetch suppliers from database with React Query for caching
  const { data: loadedSuppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('verified', true);

      if (error) throw error;

      // Transform database suppliers to match ParsedSupplier interface
      return (data || []).map(supplier => ({
        id: supplier.supplier_id, // Use slug for SEO-friendly routing
        name: supplier.name,
        location: {
          lat: Number(supplier.location_lat) || 0,
          lng: Number(supplier.location_lng) || 0,
          city: supplier.location_city || '',
          country: supplier.location_country || '',
          fullAddress: supplier.location_address || ''
        },
        technologies: supplier.technologies || [],
        materials: supplier.materials || [],
        verified: supplier.verified || false,
        premium: supplier.premium || false,
        rating: Number(supplier.rating) || 0,
        reviewCount: supplier.review_count || 0,
        description: supplier.description || '',
        website: supplier.website || '',
        logoUrl: supplier.logo_url || undefined,
        region: supplier.region || 'global'
      })) as ParsedSupplier[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Update state when suppliers are loaded
  useEffect(() => {
    if (loadedSuppliers.length > 0) {
      setSuppliers(loadedSuppliers);
      setVisibleSuppliers(loadedSuppliers.slice(0, 12));
      
      const suppliersWithLocation = loadedSuppliers.filter(s => 
        s.location.lat !== null && 
        s.location.lng !== null &&
        !(s.location.lat === 52.52 && s.location.lng === 13.40)
      );
      setSupplierCount(suppliersWithLocation.length);
      
      const uniqueCountries = new Set(
        loadedSuppliers
          .map(s => s.location.country)
          .filter(country => country && country.trim() !== '')
      );
      setCountryCount(uniqueCountries.size);
    }
  }, [loadedSuppliers]);

  // Fetch relational stats from knowledge data
  const { data: knowledgeData } = useKnowledgeData();
  useEffect(() => {
    if (knowledgeData) {
      setTechnologyCount(knowledgeData.technologies.length);
      setMaterialCount(knowledgeData.materials.length);
    }
  }, [knowledgeData]);

  // Set up real-time subscription for supplier updates
  useEffect(() => {
    const channel = supabase
      .channel('suppliers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'suppliers'
        },
        (payload) => {
          console.log('Suppliers updated, invalidating cache');
          // Invalidate React Query cache to refetch data
          queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);

  const onSubmit = async (data: { name: string; email: string; company: string }) => {
    setIsSubmittingApplication(true);
    try {
      const { error } = await supabase
        .from('supplier_applications')
        .insert({
          name: data.name.trim(),
          email: data.email.trim(),
          company: data.company.trim(),
        });

      if (error) throw error;

      toast({
        title: "Thank you for your interest!",
        description: "We'll get back to you within 24 hours to discuss becoming a supplier partner.",
      });
      form.reset();
    } catch (err) {
      console.error('Supplier application error:', err);
      toast({
        title: "Something went wrong",
        description: "Could not submit your application. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  // Smooth scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Account for navbar height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Filter suppliers based on selected criteria
  const filteredSuppliers = React.useMemo(() => {
    return suppliers.filter(supplier => {
      // First check if supplier has valid location coordinates (not null and not default Berlin coordinates)
      const hasValidLocation = supplier.location.lat !== null && 
                               supplier.location.lng !== null &&
                               !(supplier.location.lat === 52.52 && supplier.location.lng === 13.40);
      
      if (!hasValidLocation) return false;

      // Check technologies filter
      if (selectedTechnologies.length > 0) {
        const hasMatchingTech = selectedTechnologies.some(tech => {
          const techKey = getTechnologyKeyFromDisplayName(tech);
          return supplier.technologies.some(supplierTech => {
            const lowerTech = supplierTech.toLowerCase();
            // Match both database key AND display name (case-insensitive)
            return lowerTech === techKey?.toLowerCase() || 
                   lowerTech === tech.toLowerCase();
          });
        });
        if (!hasMatchingTech) return false;
      }

      // Check materials filter
      if (selectedMaterials.length > 0) {
        const hasMatchingMaterial = selectedMaterials.some(material => {
          const materialKey = getMaterialKeyFromDisplayName(material);
          return supplier.materials.some(supplierMat => {
            const lowerMat = supplierMat.toLowerCase();
            // Match both database key AND display name (case-insensitive)
            return lowerMat === materialKey?.toLowerCase() || 
                   lowerMat === material.toLowerCase();
          });
        });
        if (!hasMatchingMaterial) return false;
      }

      // Check areas filter
      if (selectedAreas.length > 0) {
        const supplierRegion = supplier.region?.toLowerCase() || '';
        const hasMatchingArea = selectedAreas.some(area => {
          const areaLower = area.toLowerCase();
          return supplierRegion.includes(areaLower) || 
                 supplier.location.country?.toLowerCase().includes(areaLower) ||
                 supplier.location.city?.toLowerCase().includes(areaLower);
        });
        if (!hasMatchingArea) return false;
      }

      // Check keyword search
      if (searchKeywords.trim()) {
        const keywords = searchKeywords.toLowerCase().trim();
        const searchableText = [
          supplier.name,
          supplier.description,
          ...supplier.technologies,
          ...supplier.materials,
          supplier.location.city,
          supplier.location.country,
          supplier.region
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(keywords)) {
          return false;
        }
      }

      return true;
    });
  }, [suppliers, selectedTechnologies, selectedMaterials, selectedAreas, searchKeywords]);

  // Animated count for filtered suppliers
  const animatedFilteredCount = useAnimatedCount(filteredSuppliers.length, 300);

  // Track filter changes after filteredSuppliers is available
  useEffect(() => {
    if (selectedTechnologies.length > 0 || selectedMaterials.length > 0 || selectedAreas.length > 0) {
      const activeFiltersCount = selectedTechnologies.length + selectedMaterials.length + selectedAreas.length;
      
      if (selectedTechnologies.length > 0) {
        trackSearch('technology', selectedTechnologies.join(', '), filteredSuppliers.length, activeFiltersCount);
      }
      if (selectedMaterials.length > 0) {
        trackSearch('material', selectedMaterials.join(', '), filteredSuppliers.length, activeFiltersCount);
      }
      if (selectedAreas.length > 0) {
        trackSearch('area', selectedAreas.join(', '), filteredSuppliers.length, activeFiltersCount);
      }
    }
  }, [selectedTechnologies, selectedMaterials, selectedAreas, filteredSuppliers.length]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>AMSupplyCheck - Find 3D Printing Suppliers Worldwide</title>
        <meta name="description" content="Connect with verified 3D printing suppliers worldwide. Filter by materials, technologies, and location to find the perfect match for your project." />
        <link rel="canonical" href="https://amsupplycheck.com/" />
        <meta property="og:title" content="AMSupplyCheck - Find 3D Printing Suppliers Worldwide" />
        <meta property="og:description" content="Connect with verified 3D printing suppliers worldwide. Filter by materials, technologies, and location to find the perfect match for your project." />
        <meta property="og:url" content="https://amsupplycheck.com/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content="AMSupplyCheck - Find 3D Printing Suppliers Worldwide" />
        <meta name="twitter:description" content="Connect with verified 3D printing suppliers worldwide. Filter by materials, technologies, and location to find the perfect match for your project." />
      </Helmet>
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted/30 z-[60]">
        <div 
          className="h-full bg-gradient-primary transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <Navbar onScrollToSection={scrollToSection} />
      
      {/* Hero Section */}
      <section id="hero" className="relative py-6 lg:py-8 overflow-visible bg-black z-20">
        <div className="absolute inset-0 bg-black" />
        
        <div 
          ref={heroRef}
          className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-1000 ${
            heroInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-1">
              Find suppliers by capability, not by name
            </h1>
            <p className="text-lg md:text-2xl font-semibold bg-gradient-primary bg-clip-text text-transparent mb-4">
              Search technologies, materials &amp; expertise
            </p>

            {/* Price Calculator */}
            <PriceCalculator />

            {/* Search Interface with AI and Live Preview */}
            <div className="max-w-4xl mx-auto mb-4 overflow-visible relative z-[70]">
              <div 
                className="bg-background/80 backdrop-blur-sm rounded-2xl shadow-2xl p-3 sm:p-4 border border-border/20 overflow-visible"
              >
                <AISearchInput
                  onFiltersExtracted={(filters: AISearchFilters) => {
                    // Build search params from AI filters and navigate
                    const searchParams = new URLSearchParams();
                    if (filters.technologies.length > 0) searchParams.set('technologies', filters.technologies.join(','));
                    if (filters.materials.length > 0) searchParams.set('materials', filters.materials.join(','));
                    if (filters.areas.length > 0) searchParams.set('areas', filters.areas.join(','));
                    if (filters.certifications?.length > 0) searchParams.set('certifications', filters.certifications.join(','));
                    if (filters.productionVolume) searchParams.set('volume', filters.productionVolume);
                    if (filters.urgency && filters.urgency !== 'standard') searchParams.set('urgency', filters.urgency);
                    if (filters.keywords) searchParams.set('q', filters.keywords);
                    if (filters.originalQuery) searchParams.set('query', filters.originalQuery);
                    navigate(`/search?${searchParams.toString()}`);
                  }}
                  onClear={() => {
                    setSelectedTechnologies([]);
                    setSelectedMaterials([]);
                    setSelectedAreas([]);
                    setSearchKeywords('');
                  }}
                  suppliers={suppliers.map(s => ({
                    id: s.id,
                    name: s.name,
                    location: {
                      city: s.location.city,
                      country: s.location.country
                    },
                    technologies: s.technologies,
                    materials: s.materials,
                    verified: s.verified,
                    premium: s.premium,
                    logoUrl: s.logoUrl,
                    region: s.region
                  }))}
                  enableLivePreview={true}
                  placeholder="Try: 'titanium aerospace parts urgent' or 'medical grade prototypes in Europe'"
                />
              </div>
            </div>

            <TooltipProvider>
              <div 
                ref={statsRef}
                className={`flex flex-wrap justify-center gap-2 sm:gap-4 text-sm text-muted-foreground ${
                  statsInView && !showSuggestions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                } ${showSuggestions ? 'transition-none' : 'transition-all duration-700'}`}
              >
                {isLoading ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 bg-muted rounded-full animate-pulse" />
                      <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 bg-muted rounded-full animate-pulse" />
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 bg-muted rounded-full animate-pulse" />
                      <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 bg-muted rounded-full animate-pulse" />
                      <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                    </div>
                  </>
                ) : (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center transition-transform duration-300 hover:scale-110 cursor-default">
                          <CheckCircle className="h-4 w-4 text-supplier-verified mr-2" />
                          {animatedSupplierCount} Verified Suppliers
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Active and verified 3D printing suppliers in our database</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center transition-transform duration-300 hover:scale-110 cursor-default">
                          <Globe className="h-4 w-4 text-primary mr-2" />
                          {animatedCountryCount} Countries
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Global reach spanning multiple countries worldwide</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center transition-transform duration-300 hover:scale-110 cursor-default">
                          <Zap className="h-4 w-4 text-primary mr-2" />
                          {animatedTechnologyCount} Technologies
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Different 3D printing technologies available</p>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center transition-transform duration-300 hover:scale-110 cursor-default">
                          <Star className="h-4 w-4 text-primary mr-2" />
                          {animatedMaterialCount} Materials
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Wide variety of materials offered by our suppliers</p>
                      </TooltipContent>
                    </Tooltip>
                  </>
                )}
              </div>
            </TooltipProvider>

            {/* AI Project Matching CTA */}
          </div>
        </div>
      </section>


      {/* Supplier Map Section */}
      <section id="supplier-map" className="py-8 bg-black relative z-0">
        <div 
          ref={mapRef}
          className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8"
        >
          {/* Map Container with Overlay */}
          <div className="relative bg-gradient-card rounded-xl overflow-hidden shadow-card h-[600px] lg:h-[700px]">
            {/* Title overlay inside map */}
            <div className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm rounded-lg px-4 py-3 max-w-xs text-left">
              <h2 className="text-lg font-bold text-foreground mb-1">Global Supplier Map</h2>
              <p className="text-xs text-muted-foreground">
                Explore our worldwide network of 3D printing suppliers.
              </p>
            </div>
            {mapInView ? (
              <Map 
                suppliers={filteredSuppliers} 
                height="100%"
                showControls={true}
                onVisibleSuppliersChange={(visible) => {
                  console.log('onVisibleSuppliersChange called with', visible.length, 'suppliers');
                  setVisibleSuppliers(visible as ParsedSupplier[]);
                }}
              />
            ) : (
              <MapFallback />
            )}
            
            {/* Featured Suppliers Overlay Panel */}
            <div className={`absolute top-4 left-2 right-2 sm:left-4 sm:right-4 lg:right-auto w-auto lg:max-w-sm z-10 transition-all duration-300 ${isMapPanelMinimized ? 'lg:max-w-sm' : ''}`}>
              <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-sm rounded-xl p-3 sm:p-4 lg:p-6 shadow-2xl border border-white/10">
                <div className="flex items-center justify-between mb-3 lg:mb-4">
                  <h3 className="text-white text-lg lg:text-xl font-bold">
                    Suppliers in This Area
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setIsMapPanelMinimized(!isMapPanelMinimized)}
                    className={`h-8 w-8 text-white hover:bg-white/10 lg:hidden relative ${isMapPanelMinimized ? 'animate-pulse' : ''}`}
                  >
                    <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isMapPanelMinimized ? 'rotate-180' : ''}`} />
                    {isMapPanelMinimized && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full animate-ping" />
                    )}
                  </Button>
                </div>
                {!isMapPanelMinimized && (
                  <>
                    {isLoading ? (
                      <div className="space-y-3 max-h-[300px] lg:max-h-[440px] overflow-y-auto pr-1 animate-fade-in">
                        {[...Array(3)].map((_, index) => (
                          <SupplierCardSkeleton key={index} />
                        ))}
                      </div>
                    ) : visibleSuppliers.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] lg:max-h-[440px] overflow-y-auto pr-1 custom-scrollbar">
                    {visibleSuppliers.map((supplier, index) => (
                      <div 
                        key={supplier.id}
                        className="bg-gray-800/60 backdrop-blur-sm rounded-lg p-3 hover:bg-gray-700/60 transition-all cursor-pointer group animate-fade-in"
                        style={{
                          animationDelay: `${index * 50}ms`,
                          animationFillMode: 'both'
                        }}
                      >
                        <div className="flex gap-3 mb-3">
                          <div className="w-12 h-12 lg:w-16 lg:h-16 flex-shrink-0 rounded-lg overflow-hidden bg-white p-1.5">
                            <SupplierLogo 
                              name={supplier.name}
                              logoUrl={supplier.logoUrl}
                              size="sm"
                              className="w-full h-full"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-semibold text-sm mb-1 group-hover:text-primary transition-colors truncate">
                              {supplier.name}
                            </h4>
                            <p className="text-gray-400 text-xs flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {[supplier.location.city, supplier.location.country].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-3">
                          <RippleButton
                            className="flex-1 bg-gradient-primary hover:shadow-hover hover:scale-105 transition-all duration-300 h-8 text-xs group"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (supplier.website) {
                                const w = window.open(supplier.website, '_blank');
                                if (!w) window.location.href = supplier.website;
                              }
                            }}
                          >
                            Go to website
                            {supplier.website && <ExternalLink className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform duration-300" />}
                          </RippleButton>
                          <RippleButton
                            variant="outline"
                            className="flex-1 bg-black text-white border-white/20 hover:bg-black/90 hover:text-white hover:scale-105 hover:border-white/40 transition-all duration-300 h-8 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/suppliers/${supplier.id}`);
                            }}
                          >
                            Details
                          </RippleButton>
                        </div>
                      </div>
                    ))}
                  </div>
                    ) : (
                      <div className="text-center py-6 lg:py-8 text-gray-400 animate-fade-in">
                        <p className="text-sm">No suppliers in this area</p>
                        <p className="text-xs mt-2">Zoom out or pan to discover suppliers</p>
                      </div>
                    )}
                    <Button
                      className="w-full mt-3 lg:mt-4 bg-primary hover:bg-primary/90 text-sm"
                      onClick={() => navigate('/suppliers')}
                    >
                      View All Suppliers
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose SupplyCheck Section */}
      <section id="why-choose" className="py-20 bg-gradient-to-br from-primary to-primary-hover">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <WhyChooseSectionContent />
        </div>
      </section>

      {/* Additional Features Section */}
      <section id="benefits" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdditionalFeaturesContent 
            isLoading={isLoading}
            supplierCount={supplierCount}
            countryCount={countryCount}
            technologyCount={technologyCount}
            materialCount={materialCount}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to Find Your Perfect Supplier?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join dozens of engineers and designers who trust SupplyCheck 
            to connect them with the best 3D printing suppliers worldwide.
          </p>
          <RippleButton
            size="lg"
            className="bg-gradient-primary hover:shadow-hover transition-all duration-300 text-lg px-8 py-3"
            onClick={() => navigate('/suppliers')}
          >
            <Search className="h-5 w-5 mr-2" />
            Browse Suppliers
            <ArrowRight className="h-5 w-5 ml-2" />
          </RippleButton>
          <RippleButton
            size="lg"
            variant="outline"
            className="ml-4 text-lg px-8 py-3"
            onClick={() => navigate('/knowledge')}
          >
            <Zap className="h-5 w-5 mr-2" />
            Explore Technologies
          </RippleButton>
        </div>
      </section>

      {/* Supplier Contact Section */}
      <section id="contact" className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div 
            ref={contactRef}
            className={`transition-all duration-700 ${
              contactInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Want to become a supplier?
              </h2>
              <p className="text-xl text-muted-foreground">
                Join our network of verified 3D printing suppliers and connect with customers worldwide.
              </p>
            </div>
            
            <Card className="bg-background border-border shadow-card p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    rules={{ required: "Name is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    rules={{ 
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address"
                      }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="company"
                  rules={{ required: "Company name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input placeholder="Your company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="text-center">
                  <RippleButton
                    type="submit"
                    size="lg"
                    disabled={isSubmittingApplication}
                    className="bg-gradient-primary hover:shadow-hover transition-all duration-300 px-8"
                  >
                    {isSubmittingApplication ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>
                    ) : "Submit Application"}
                  </RippleButton>
                </div>
              </form>
            </Form>
          </Card>
          </div>
        </div>
      </section>

      {/* Upload STL CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <UploadSTLCTA />
      </section>

      {/* Newsletter Signup */}
      <NewsletterSignup />

      {/* Popular Categories for SEO - moved to bottom for better UX */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
            Browse by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">By Technology</h3>
              <ul className="space-y-2">
                {[
                  { slug: 'sls', label: 'SLS 3D Printing' },
                  { slug: 'sla', label: 'SLA 3D Printing' },
                  { slug: 'fdm', label: 'FDM 3D Printing' },
                  { slug: 'dmls', label: 'Metal 3D Printing (DMLS)' },
                  { slug: 'mjf', label: 'Multi Jet Fusion (MJF)' },
                  { slug: 'cnc-machining', label: 'CNC Machining' },
                  { slug: 'injection-molding', label: 'Injection Molding' },
                ].map(c => (
                  <li key={c.slug}>
                    <a href={`/knowledge/technology/${c.slug}`} className="text-muted-foreground hover:text-primary transition-colors">
                      {c.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">By Material</h3>
              <ul className="space-y-2">
                {[
                  { slug: 'pa12', label: 'PA12 Nylon' },
                  { slug: 'titanium', label: 'Titanium' },
                  { slug: 'aluminum-alsi10mg', label: 'Aluminum AlSi10Mg' },
                  { slug: 'ss-316l', label: 'Stainless Steel 316L' },
                  { slug: 'standard-resin', label: 'Standard Resin' },
                  { slug: 'peek', label: 'PEEK' },
                  { slug: 'carbon-fiber', label: 'Carbon Fiber' },
                ].map(c => (
                  <li key={c.slug}>
                    <a href={`/knowledge/material/${c.slug}`} className="text-muted-foreground hover:text-primary transition-colors">
                      {c.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">By Location</h3>
              <ul className="space-y-2">
                {[
                  { slug: 'Germany', label: 'Germany' },
                  { slug: 'United States', label: 'United States' },
                  { slug: 'United Kingdom', label: 'United Kingdom' },
                  { slug: 'Denmark', label: 'Denmark' },
                  { slug: 'Netherlands', label: 'Netherlands' },
                  { slug: 'France', label: 'France' },
                  { slug: 'Australia', label: 'Australia' },
                ].map(c => (
                  <li key={c.slug}>
                    <a href={`/suppliers?country=${encodeURIComponent(c.slug)}`} className="text-muted-foreground hover:text-primary transition-colors">
                      {c.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Comparisons & Guides</h3>
              <ul className="space-y-2">
                {[
                  { slug: 'best-xometry-alternatives', label: 'Xometry Alternatives' },
                  { slug: 'best-protolabs-alternatives', label: 'Protolabs Alternatives' },
                  { slug: 'best-hubs-alternatives', label: 'Hubs Alternatives' },
                  { slug: 'best-sculpteo-alternatives', label: 'Sculpteo Alternatives' },
                  { slug: 'xometry-vs-protolabs', label: 'Xometry vs Protolabs' },
                  { slug: 'hubs-vs-shapeways', label: 'Hubs vs Shapeways' },
                  { slug: 'best-3d-printing-services', label: 'Best 3D Printing Services' },
                  { slug: 'best-3d-printing-services-europe', label: 'Best in Europe' },
                  { slug: 'best-3d-printing-services-usa', label: 'Best in USA' },
                  { slug: 'best-metal-3d-printing-services', label: 'Best Metal 3D Printing' },
                ].map(c => (
                  <li key={c.slug}>
                    <a href={`/guides/${c.slug}`} className="text-muted-foreground hover:text-primary transition-colors">
                      {c.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center space-y-6">
            {/* Social Media Links */}
            
            {/* Copyright */}
            <div className="text-muted-foreground text-center">
              <p>&copy; {new Date().getFullYear()} AMSupplyCheck. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Navigation */}
      <FloatingNav 
        onNavigate={scrollToSection}
        showScrollTop={showScrollTop}
        onScrollTop={scrollToTop}
      />

      {/* Cookie Consent Banner */}
      <CookieConsent />

      {/* Shapeways Printability Dialog */}
      <ShapewaysPrintabilityDialog
        open={shapewaysDialogOpen}
        onOpenChange={setShapewaysDialogOpen}
        loading={shapewaysLoading}
        error={shapewaysError}
        result={shapewaysResult}
        fileName={uploadedFileName}
      />
    </div>
  );
};

export default Index;
