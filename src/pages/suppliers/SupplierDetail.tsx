import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import SupplierLogo from '@/components/ui/supplier-logo';
import { MapPin, ExternalLink, Verified, Crown, ArrowLeft, Mail, Globe, Building2, Factory, HelpCircle, Clock, Zap, Calculator, ThumbsUp, ThumbsDown, DollarSign, Users, ArrowRight, Compass, BookOpen, Award, Tag } from 'lucide-react';
import { getDisplayNameFromMaterialKey, getDisplayNameFromTechnologyKey } from '@/lib/supplierData';
import { TECHNOLOGY_GLOSSARY } from '@/lib/technologyGlossary';
import { getSupplierPriceTier } from '@/lib/supplierPricing';
import { getSupplierRelatedCategories, getContextualLinks, type ContextualLink } from '@/lib/seoSlugs';
import { trackSupplierInteraction, trackOutboundLink, trackViewItem, trackAddToCart, trackPurchase, supplierToGA4Item } from '@/lib/analytics';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LeadTimeBadge } from '@/components/pricing/LeadTimeBadge';
import { StickyQuoteCTA } from '@/components/layout/StickyQuoteCTA';
import { UploadSTLCTA } from '@/components/upload/UploadSTLCTA';
import { PriceComparisonWidget } from '@/components/pricing/PriceComparisonWidget';
import { getRelatedAlternativePages } from '@/lib/alternativePages';

interface DescriptionExtended {
  overview?: string;
  unique_value?: string;
  industries_served?: string[];
  certifications?: string[];
  capacity_notes?: string;
  pros?: string[];
  cons?: string[];
  price_range?: string;
}

interface SupplierTag {
  id: string;
  name: string;
  slug: string;
  category: string | null;
}

interface Supplier {
  id: string;
  supplier_id: string;
  name: string;
  description: string | null;
  description_extended: DescriptionExtended | null;
  website: string | null;
  location_city: string | null;
  location_country: string | null;
  location_address: string | null;
  location_lat: number | null;
  location_lng: number | null;
  technologies: string[] | null;
  materials: string[] | null;
  certifications: string[] | null;
  verified: boolean | null;
  premium: boolean | null;
  rating: number | null;
  review_count: number | null;
  logo_url: string | null;
  region: string | null;
  lead_time_indicator: string | null;
  has_rush_service: boolean | null;
  has_instant_quote: boolean | null;
}

// Common FAQ questions for 3D printing suppliers
const generateFAQ = (supplier: Supplier) => {
  const faqs = [
    {
      question: `What 3D printing services does ${supplier.name} offer?`,
      answer: `${supplier.name} offers ${supplier.technologies?.length ? supplier.technologies.map(t => getDisplayNameFromTechnologyKey(t)).join(', ') : 'various 3D printing'} services${supplier.materials?.length ? ` with materials including ${supplier.materials.slice(0, 5).map(m => getDisplayNameFromMaterialKey(m)).join(', ')}` : ''}.`,
    },
    {
      question: `Where is ${supplier.name} located?`,
      answer: `${supplier.name} is located in ${supplier.location_city ? supplier.location_city + ', ' : ''}${supplier.location_country || 'multiple locations'}.`,
    },
    {
      question: `How can I contact ${supplier.name}?`,
      answer: `You can contact ${supplier.name} through their website${supplier.website ? ` at ${supplier.website}` : ''} or use the contact button on this page to get in touch directly.`,
    },
  ];

  // Add technology-specific FAQ if available
  if (supplier.technologies && supplier.technologies.length > 0) {
    faqs.push({
      question: `What technologies does ${supplier.name} specialize in?`,
      answer: `${supplier.name} specializes in ${supplier.technologies.map(t => getDisplayNameFromTechnologyKey(t)).join(', ')} for additive manufacturing and 3D printing projects.`,
    });
  }

  // Add materials FAQ if available
  if (supplier.materials && supplier.materials.length > 0) {
    faqs.push({
      question: `What materials can ${supplier.name} work with?`,
      answer: `${supplier.name} can work with ${supplier.materials.map(m => getDisplayNameFromMaterialKey(m)).join(', ')} and other materials for your 3D printing needs.`,
    });
  }

  return faqs;
};

// Favorite button component

const SupplierDetail = () => {
  const { id, slug } = useParams<{ id?: string; slug?: string }>();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [alternatives, setAlternatives] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [pageLoadTime] = useState(Date.now());
  const [supplierTags, setSupplierTags] = useState<SupplierTag[]>([]);
  const [contextualLinks, setContextualLinks] = useState<(ContextualLink & { count: number })[]>([]);
  const lookupValue = slug || id;
  const lookupField = slug ? 'supplier_id' : 'id';

  useEffect(() => {
    const fetchSupplier = async () => {
      if (!lookupValue) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('suppliers')
          .select('*')
          .eq(lookupField, lookupValue)
          .maybeSingle();

        if (error) {
          console.error('Error fetching supplier:', error);
          setNotFound(true);
        } else if (!data) {
          setNotFound(true);
        } else {
          setSupplier({
            ...data,
            description_extended: data.description_extended as DescriptionExtended | null
          });
          
          // Track GA4 view_item event
          const ga4Item = supplierToGA4Item({
            id: data.id,
            name: data.name,
            technologies: data.technologies || [],
            materials: data.materials || [],
            region: data.region || 'global',
            premium: data.premium || false,
          });
          trackViewItem(ga4Item, 'direct');

          // Track supplier view
          trackSupplierInteraction('view', data.id, data.name, 'detail', {
            verified: data.verified,
            premium: data.premium,
          });

          // Fetch alternatives (suppliers with overlapping technologies)
          if (data.technologies && data.technologies.length > 0) {
            const { data: altData } = await supabase
              .from('suppliers')
              .select('*')
              .neq('id', data.id)
              .overlaps('technologies', data.technologies)
              .limit(5);
            if (altData) {
              setAlternatives(altData.map(s => ({
                ...s,
                description_extended: s.description_extended as DescriptionExtended | null
              })));
            }
          }

          // Fetch supplier tags
          const { data: tagData } = await supabase
            .from('supplier_tags')
            .select('tag_id, tags!inner(id, name, slug, category)')
            .eq('supplier_id', data.id);
          
          if (tagData) {
            setSupplierTags(tagData.map((t: any) => t.tags));
          }
        }
      } catch (error) {
        console.error('Error:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplier();
  }, [lookupValue, lookupField]);

  // Fetch counts for contextual internal links
  useEffect(() => {
    if (!supplier) return;
    const links = getContextualLinks(
      supplier.technologies || [],
      supplier.materials || [],
      supplier.location_country
    );
    if (links.length === 0) return;

    const fetchCounts = async () => {
      const results = await Promise.all(
        links.map(async (link) => {
          let query = supabase.from('suppliers').select('id', { count: 'exact', head: true });

          if (link.filters.technologies && link.filters.technologies.length > 0) {
            query = query.overlaps('technologies', link.filters.technologies);
          }
          if (link.filters.materials && link.filters.materials.length > 0) {
            query = query.overlaps('materials', link.filters.materials);
          }
          if (link.filters.location_country && link.filters.location_country.length > 0) {
            query = query.in('location_country', link.filters.location_country);
          }

          const { count } = await query;
          return { ...link, count: count || 0 };
        })
      );
      // Only show links with count >= 2
      setContextualLinks(results.filter(l => l.count >= 2));
    };

    fetchCounts();
  }, [supplier]);

  const handleContactClick = () => {
    if (supplier?.website) {
      // Track GA4 add_to_cart (contact intent)
      const ga4Item = supplierToGA4Item({
        id: supplier.id,
        name: supplier.name,
        technologies: supplier.technologies || [],
        materials: supplier.materials || [],
        region: supplier.region || 'global',
        premium: supplier.premium || false,
      });
      trackAddToCart(ga4Item, 'detail');

      // Track GA4 purchase (actual conversion)
      const transactionId = `txn_${Date.now()}_${supplier.id}`;
      trackPurchase(ga4Item, transactionId);

      // Calculate engagement time
      const engagementTime = Math.floor((Date.now() - pageLoadTime) / 1000);

      trackOutboundLink(supplier.website, supplier.name, supplier.id);
      trackSupplierInteraction('contact', supplier.id, supplier.name, 'detail', {
        verified: supplier.verified,
        premium: supplier.premium,
        engagement_time_seconds: engagementTime,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-24 max-w-6xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader className="pb-6">
              <div className="flex items-start gap-6">
                <Skeleton className="w-24 h-24 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-8 w-64 mb-2" />
                  <Skeleton className="h-4 w-48 mb-4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (notFound || !supplier) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-24 max-w-6xl">
          <Link to="/search">
            <Button variant="outline" className="mb-8">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Button>
          </Link>
          <Card className="bg-gradient-card border-border shadow-card p-12 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Supplier Not Found</h1>
            <p className="text-muted-foreground mb-6">The supplier you're looking for doesn't exist or has been removed.</p>
            <Link to="/search">
              <Button className="bg-gradient-primary">Browse All Suppliers</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Helmet>
        <title>{`${supplier.name} Alternatives & Pricing ${new Date().getFullYear()} | Supplycheck`}</title>
        <meta name="description" content={`${supplier.name} review: technologies, pricing, lead times & top alternatives. Compare ${supplier.name} with other 3D printing suppliers on Supplycheck.`} />
        <meta name="keywords" content={[supplier.name, `${supplier.name} alternatives`, `${supplier.name} pricing`, '3D printing', 'additive manufacturing', ...(supplier.technologies || []).map(t => getDisplayNameFromTechnologyKey(t)), ...(supplier.materials || []).map(m => getDisplayNameFromMaterialKey(m)), supplier.location_country, supplier.location_city].filter(Boolean).join(', ')} />
        <link rel="canonical" href={`https://amsupplycheck.com/suppliers/${supplier.supplier_id}`} />
        <link rel="alternate" hrefLang="en" href={`https://amsupplycheck.com/suppliers/${supplier.supplier_id}`} />
        <link rel="alternate" hrefLang="da" href={`https://amsupplycheck.com/suppliers/${supplier.supplier_id}`} />
        <link rel="alternate" hrefLang="x-default" href={`https://amsupplycheck.com/suppliers/${supplier.supplier_id}`} />
        <meta property="og:title" content={`${supplier.name} Alternatives & Pricing ${new Date().getFullYear()} | Supplycheck`} />
        <meta property="og:description" content={`${supplier.name} review: technologies, pricing, lead times & top alternatives.`} />
        <meta property="og:url" content={`https://amsupplycheck.com/suppliers/${supplier.supplier_id}`} />
        <meta property="og:type" content="business.business" />
        {supplier.logo_url && <meta property="og:image" content={supplier.logo_url} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${supplier.name} Alternatives & Pricing ${new Date().getFullYear()} | Supplycheck`} />
        <meta name="twitter:description" content={`${supplier.name} review: technologies, pricing, lead times & top alternatives.`} />
        {supplier.logo_url && <meta name="twitter:image" content={supplier.logo_url} />}
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://amsupplycheck.com' },
            { '@type': 'ListItem', position: 2, name: 'Search Suppliers', item: 'https://amsupplycheck.com/search' },
            { '@type': 'ListItem', position: 3, name: supplier.name, item: `https://amsupplycheck.com/suppliers/${supplier.supplier_id}` },
          ],
        })}</script>
        <script type="application/ld+json">{JSON.stringify((() => {
          const baseUrl = 'https://amsupplycheck.com';
          const supplierUrl = `${baseUrl}/suppliers/${supplier.supplier_id}`;
          
          // Price range mapping
          const priceRangeMap: Record<string, string> = { '€': '$', '€€': '$$', '€€€': '$$$', '€€€€': '$$$$' };
          const priceTier = getSupplierPriceTier(supplier.technologies || []);
          const priceRange = (supplier.description_extended as DescriptionExtended)?.price_range || priceRangeMap[priceTier.symbol] || '$$';
          
          // Area served mapping
          const regionMap: Record<string, { '@type': string; name: string }> = {
            'Europe': { '@type': 'Place', name: 'Europe' },
            'North America': { '@type': 'Place', name: 'North America' },
            'Asia': { '@type': 'Place', name: 'Asia' },
            'Global': { '@type': 'Place', name: 'Worldwide' },
          };
          const areaServed = regionMap[supplier.region || ''] || { '@type': 'Place', name: 'Worldwide' };

          // Build rich Service entities
          const serviceEntities = (supplier.technologies || []).map(tech => {
            const glossaryKey = Object.keys(TECHNOLOGY_GLOSSARY).find(k => 
              k.toLowerCase() === tech.toLowerCase() || 
              TECHNOLOGY_GLOSSARY[k].abbreviation.toLowerCase() === tech.toLowerCase()
            );
            const info = glossaryKey ? TECHNOLOGY_GLOSSARY[glossaryKey] : null;
            const displayName = getDisplayNameFromTechnologyKey(tech);
            const serviceType = info?.category === 'metal' ? 'Metal 3D Printing' : 
                               info?.category === 'resin' ? 'Resin 3D Printing' : 
                               info?.category === 'composite' ? 'Composite 3D Printing' : '3D Printing';
            return {
              '@type': 'Service',
              name: displayName,
              ...(info && { description: info.longDescription }),
              serviceType,
              provider: { '@type': 'LocalBusiness', name: supplier.name, '@id': supplierUrl },
              areaServed,
            };
          });

          // OfferCatalog grouping services
          const offerCatalog = serviceEntities.length > 0 ? {
            '@type': 'OfferCatalog',
            name: `${supplier.name} Services`,
            itemListElement: serviceEntities.map((svc, i) => ({
              '@type': 'OfferCatalog',
              name: svc.serviceType,
              itemListElement: [{
                '@type': 'Offer',
                itemOffered: svc,
              }],
            })),
          } : undefined;

          // Review entity
          const reviewEntity = supplier.rating ? {
            '@type': 'Review',
            author: { '@type': 'Organization', name: 'AMSupplyCheck Editorial' },
            reviewRating: { '@type': 'Rating', ratingValue: supplier.rating, bestRating: 5 },
            reviewBody: `${supplier.name} is ${supplier.verified ? 'a verified' : 'an'} supplier offering ${supplier.technologies?.length || 0} technologies${supplier.materials?.length ? ` and ${supplier.materials.length} materials` : ''}. ${supplier.lead_time_indicator ? `Lead time: ${supplier.lead_time_indicator}.` : ''} ${supplier.has_instant_quote ? 'Instant quoting available.' : ''}`.trim(),
          } : undefined;

          return {
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            '@id': supplierUrl,
            name: supplier.name,
            description: supplier.description || `${supplier.name} offers professional 3D printing and additive manufacturing services.`,
            url: supplier.website || supplierUrl,
            priceRange,
            areaServed,
            ...(supplier.logo_url && { image: supplier.logo_url }),
            ...(supplier.location_address && {
              address: {
                '@type': 'PostalAddress',
                streetAddress: supplier.location_address,
                addressLocality: supplier.location_city,
                addressCountry: supplier.location_country,
              },
            }),
            ...(supplier.location_lat && supplier.location_lng && {
              geo: { '@type': 'GeoCoordinates', latitude: supplier.location_lat, longitude: supplier.location_lng },
            }),
            ...(supplier.rating && {
              aggregateRating: { '@type': 'AggregateRating', ratingValue: supplier.rating, reviewCount: supplier.review_count || 0, bestRating: 5 },
            }),
            ...(reviewEntity && { review: reviewEntity }),
            ...(offerCatalog && { hasOfferCatalog: offerCatalog }),
            ...(supplier.technologies && supplier.technologies.length > 0 && {
              makesOffer: serviceEntities.map(svc => ({
                '@type': 'Offer',
                itemOffered: svc,
              })),
            }),
            ...(supplier.materials && supplier.materials.length > 0 && {
              knowsAbout: supplier.materials.map(m => getDisplayNameFromMaterialKey(m)),
            }),
          };
        })())}</script>
        {/* Product schema for materials */}
        {supplier.materials && supplier.materials.length > 0 && (
          <script type="application/ld+json">{JSON.stringify(
            supplier.materials.slice(0, 10).map(mat => ({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: `${getDisplayNameFromMaterialKey(mat)} 3D Printing`,
              category: '3D Printing Materials',
              description: `${getDisplayNameFromMaterialKey(mat)} 3D printing service by ${supplier.name}.`,
              manufacturer: {
                '@type': 'Organization',
                name: supplier.name,
                url: supplier.website || `https://amsupplycheck.com/suppliers/${supplier.supplier_id}`,
              },
              offers: {
                '@type': 'Offer',
                availability: 'https://schema.org/InStock',
                priceCurrency: 'USD',
                seller: { '@type': 'Organization', name: supplier.name },
              },
            }))
          )}</script>
        )}
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: generateFAQ(supplier).map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: { '@type': 'Answer', text: faq.answer },
          })),
        })}</script>
      </Helmet>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-24 max-w-6xl">
          {/* Breadcrumb Navigation */}
          <nav className="mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-primary transition-colors duration-300">
                  Home
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <span>/</span>
                <Link to="/search" className="hover:text-primary transition-colors duration-300">
                  Search
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <span>/</span>
                <span className="text-foreground font-medium">{supplier.name}</span>
              </li>
            </ol>
          </nav>

          <Link to="/search">
            <Button variant="outline" className="mb-8 hover:scale-105 transition-transform duration-300">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Button>
          </Link>

        <Card className="bg-gradient-card border-border shadow-card hover:shadow-hover transition-all duration-300">
          <CardHeader className="pb-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="group">
                <SupplierLogo 
                  name={supplier.name} 
                  logoUrl={supplier.logo_url}
                  size="2xl"
                  className="group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">{supplier.name} Review & Instant Quote Comparison</h1>
                  {supplier.verified && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Verified className="h-6 w-6 text-supplier-verified cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Verified Supplier</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {supplier.premium && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Crown className="h-6 w-6 text-supplier-premium cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Premium Supplier</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                
                {(supplier.location_city || supplier.location_country) && (
                  <div className="flex items-center gap-2 text-muted-foreground mb-4">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {supplier.location_city && `${supplier.location_city}, `}
                      {supplier.location_country}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  {supplier.website ? (
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleContactClick}
                      className="inline-flex items-center justify-center bg-gradient-primary text-primary-foreground hover:shadow-hover hover:scale-105 transition-all duration-300 h-10 px-4 rounded-md"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Supplier
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center justify-center bg-muted text-muted-foreground h-10 px-4 rounded-md cursor-not-allowed">
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Supplier
                    </span>
                  )}
                  
                  {supplier.website && (
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={handleContactClick}
                      className="inline-flex items-center justify-center border border-input bg-background hover:bg-accent hover:scale-105 transition-all duration-300 h-10 px-4 rounded-md"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Visit Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Lead Time Section */}
            {(supplier.lead_time_indicator || supplier.has_rush_service || supplier.has_instant_quote) && (
            <div className="grid grid-cols-1 gap-4">

              <Card className="bg-gradient-card border-border">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Delivery & Services</h3>
                  </div>
                  {(supplier.lead_time_indicator || supplier.has_rush_service || supplier.has_instant_quote) ? (
                    <div className="space-y-2">
                      <LeadTimeBadge 
                        leadTime={supplier.lead_time_indicator} 
                        hasRushService={supplier.has_rush_service || false}
                        hasInstantQuote={supplier.has_instant_quote || false}
                        size="md"
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        {supplier.has_rush_service && (
                          <Badge variant="secondary" className="text-xs">
                            <Zap className="h-3 w-3 mr-1 text-yellow-500" />
                            Rush Service
                          </Badge>
                        )}
                        {supplier.has_instant_quote && (
                          <Badge variant="secondary" className="text-xs">
                            <Calculator className="h-3 w-3 mr-1 text-blue-500" />
                            Instant Quote
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Lead time information not available. Contact supplier for details.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
            )}

            {supplier.description && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  About {supplier.name}
                </h2>
                
                {/* Main description */}
                <p className="text-muted-foreground leading-relaxed">
                  {supplier.description_extended?.overview || supplier.description}
                </p>
                
                {/* Unique Value Proposition */}
                {supplier.description_extended?.unique_value && (
                  <div className="bg-accent/50 p-4 rounded-lg border-l-4 border-primary">
                    <h3 className="font-semibold mb-2 text-foreground">What Sets Them Apart</h3>
                    <p className="text-muted-foreground">
                      {supplier.description_extended.unique_value}
                    </p>
                  </div>
                )}
                
                {/* Industries Served */}
                {supplier.description_extended?.industries_served && supplier.description_extended.industries_served.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 text-foreground">Industries Served</h3>
                    <div className="flex flex-wrap gap-2">
                      {supplier.description_extended.industries_served.map((industry, index) => (
                        <Badge key={index} variant="outline" className="text-sm px-3 py-1">
                          {industry}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Supplier Tags */}
                {supplierTags.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" />
                      Specializations
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {supplierTags.map((tag) => (
                        <Link
                          key={tag.id}
                          to={`/suppliers?tag=${tag.slug}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Badge 
                            variant="outline" 
                            className="text-sm px-3 py-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer"
                          >
                            {tag.name}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Certifications - from dedicated column or description_extended */}
                {(() => {
                  const certs = supplier.certifications?.length 
                    ? supplier.certifications 
                    : supplier.description_extended?.certifications;
                  return certs && certs.length > 0 ? (
                    <div>
                      <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                        <Award className="h-4 w-4 text-primary" />
                        Certifications & Quality
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {certs.map((cert, index) => (
                          <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
                
                {/* Capacity Notes */}
                {supplier.description_extended?.capacity_notes && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 text-foreground">Production Capacity</h3>
                    <p className="text-muted-foreground">
                      {supplier.description_extended.capacity_notes}
                    </p>
                  </div>
                )}
              </div>
            )}

            {supplier.technologies && supplier.technologies.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Factory className="h-5 w-5 text-primary" />
                  Technologies
                </h2>
                <div className="flex flex-wrap gap-2">
                  {supplier.technologies.map((tech, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-sm px-3 py-1 hover:scale-105 transition-transform duration-300"
                    >
                      {getDisplayNameFromTechnologyKey(tech)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {supplier.materials && supplier.materials.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Factory className="h-5 w-5 text-primary" />
                  Materials
                </h2>
                <div className="flex flex-wrap gap-2">
                  {supplier.materials.map((material, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="text-sm px-3 py-1 hover:scale-105 transition-transform duration-300"
                    >
                      {getDisplayNameFromMaterialKey(material)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {supplier.location_address && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Location
                </h2>
                <p className="text-muted-foreground">{supplier.location_address}</p>
              </div>
            )}

            {supplier.website && (
              <div className="pt-6 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <a 
                    href={supplier.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-primary transition-colors duration-300 hover:underline"
                    onClick={() => trackOutboundLink(supplier.website!, supplier.name, supplier.id)}
                  >
                    {supplier.website}
                  </a>
                </div>
              </div>
            )}

            {/* Pricing Section */}
            {supplier.description_extended?.price_range && (
              <div className="pt-6 border-t border-border">
                <h2 className="text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Pricing Example
                </h2>
                <div className="bg-accent/50 p-4 rounded-lg">
                  <p className="text-muted-foreground">{supplier.description_extended.price_range}</p>
                </div>
              </div>
            )}

            {/* Pros & Cons Section */}
            {(supplier.description_extended?.pros?.length || supplier.description_extended?.cons?.length) ? (
              <div className="pt-6 border-t border-border">
                <h2 className="text-xl font-semibold text-foreground mb-4">Pros & Cons</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {supplier.description_extended?.pros && supplier.description_extended.pros.length > 0 && (
                    <Card className="bg-gradient-card border-border">
                      <CardContent className="pt-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                          <ThumbsUp className="h-4 w-4 text-primary" />
                          Pros
                        </h3>
                        <ul className="space-y-2">
                          {supplier.description_extended.pros.map((pro, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="text-primary mt-0.5">✓</span>
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                  {supplier.description_extended?.cons && supplier.description_extended.cons.length > 0 && (
                    <Card className="bg-gradient-card border-border">
                      <CardContent className="pt-4">
                        <h3 className="font-semibold mb-3 flex items-center gap-2 text-foreground">
                          <ThumbsDown className="h-4 w-4 text-destructive" />
                          Cons
                        </h3>
                        <ul className="space-y-2">
                          {supplier.description_extended.cons.map((con, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <span className="text-destructive mt-0.5">✗</span>
                              {con}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            ) : null}

            {/* Alternatives Section */}
            {alternatives.length > 0 && (
              <div className="pt-6 border-t border-border">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Alternatives to {supplier.name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {alternatives.map((alt) => (
                    <Link key={alt.id} to={`/suppliers/${alt.supplier_id}`}>
                      <Card className="bg-gradient-card border-border hover:shadow-hover hover:scale-[1.02] transition-all duration-300 cursor-pointer h-full">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-3 mb-2">
                            <SupplierLogo name={alt.name} logoUrl={alt.logo_url} size="sm" />
                            <div>
                              <h3 className="font-semibold text-foreground text-sm">{alt.name}</h3>
                              {(alt.location_city || alt.location_country) && (
                                <p className="text-xs text-muted-foreground">
                                  {alt.location_city && `${alt.location_city}, `}{alt.location_country}
                                </p>
                              )}
                            </div>
                          </div>
                          {alt.technologies && alt.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {alt.technologies.slice(0, 3).map((tech, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {getDisplayNameFromTechnologyKey(tech)}
                                </Badge>
                              ))}
                              {alt.technologies.length > 3 && (
                                <Badge variant="outline" className="text-xs">+{alt.technologies.length - 3}</Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Comparisons & Guides */}
            {(() => {
              const relatedGuides = getRelatedAlternativePages(supplier.supplier_id);
              if (relatedGuides.length === 0) return null;
              return (
                <div className="pt-6 border-t border-border">
                  <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Comparisons & Guides
                  </h2>
                  <div className="space-y-2">
                    {relatedGuides.map((guide) => (
                      <Link
                        key={guide.slug}
                        to={`/guides/${guide.slug}`}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 hover:border-primary/30 transition-all duration-300 group"
                      >
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          {guide.label}
                        </span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 ml-3" />
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* FAQ Section */}
            <div className="pt-8 border-t border-border">
              <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Frequently Asked Questions
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {generateFAQ(supplier).map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left hover:text-primary transition-colors duration-300">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Explore More Suppliers - Contextual Internal Links */}
            {contextualLinks.length > 0 && (
              <div className="pt-8 border-t border-border">
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Compass className="h-5 w-5 text-primary" />
                  Explore More Suppliers
                </h2>
                <div className="space-y-2">
                  {contextualLinks.map((link) => (
                    <Link
                      key={link.slug}
                      to={`/suppliers/${link.slug}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 hover:border-primary/30 transition-all duration-300 group"
                    >
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        {link.text}{' '}
                        <span className="font-medium text-foreground">
                          {link.countText(link.count)}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 ml-3" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {(() => {
              const relatedCategories = getSupplierRelatedCategories(
                supplier.technologies || [],
                supplier.materials || [],
                supplier.location_country
              );
              if (relatedCategories.length === 0) return null;
              return (
                <div className="pt-8 border-t border-border">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Related Categories
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {relatedCategories.map((cat) => (
                      <Link key={cat.slug} to={`/suppliers/${cat.slug}`}>
                        <Badge
                          variant={cat.type === 'technology' ? 'secondary' : cat.type === 'material' ? 'outline' : 'default'}
                          className="text-sm px-3 py-1.5 hover:scale-105 transition-transform duration-300 cursor-pointer"
                        >
                          {cat.label}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
        </div>
      </div>
      {/* Sticky Quote CTA */}
      <StickyQuoteCTA 
        supplierName={supplier.name} 
        technologyPreset={supplier.technologies?.[0]} 
      />
    </TooltipProvider>
  );
};

export default SupplierDetail;
