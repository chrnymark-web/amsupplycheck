import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Navbar from '@/components/ui/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SupplierLogo from '@/components/ui/supplier-logo';
import { supabase } from '@/integrations/supabase/client';
import { getIntentPageBySlug, type IntentPageConfig } from '@/lib/intentPages';
import { getSupplierPriceTier } from '@/lib/supplierPricing';
import { ArrowRight, MapPin, Zap, Clock, ChevronDown, ChevronUp, ExternalLink, Globe, DollarSign, Star } from 'lucide-react';

interface SupplierRow {
  supplier_id: string;
  name: string;
  website: string | null;
  location_country: string | null;
  location_city: string | null;
  technologies: string[] | null;
  materials: string[] | null;
  has_instant_quote: boolean | null;
  has_rush_service: boolean | null;
  lead_time_indicator: string | null;
  verified: boolean | null;
  logo_url: string | null;
  description: string | null;
}

interface CountryCount {
  country: string;
  count: number;
  slug: string | null;
}

const COUNTRY_SLUG_MAP: Record<string, string> = {
  'Germany': 'germany', 'United States': 'united-states', 'United Kingdom': 'united-kingdom',
  'Denmark': 'denmark', 'Netherlands': 'netherlands', 'France': 'france',
  'Italy': 'italy', 'Sweden': 'sweden', 'Switzerland': 'switzerland',
  'Canada': 'canada', 'Australia': 'australia', 'China': 'china',
  'India': 'india', 'Japan': 'japan', 'Spain': 'spain', 'Belgium': 'belgium',
};

const CNC_TECHNOLOGIES = ['cnc', 'cnc-machining', 'cnc-milling', 'cnc-turning', 'cnc-lathe', 'cnc-cutting', 'multi-axis-cnc', 'precision-machining', '5-axis-milling'];

export default function IntentPage() {
  const location = useLocation();
  const slug = location.pathname.replace(/^\//, '');
  const config = getIntentPageBySlug(slug);

  if (!config) {
    return null;
  }

  return <IntentPageContent config={config} />;
}

function IntentPageContent({ config }: { config: IntentPageConfig }) {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [countryCounts, setCountryCounts] = useState<CountryCount[]>([]);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch suppliers based on filter type
  useEffect(() => {
    async function fetchSuppliers() {
      setLoading(true);
      let query = supabase
        .from('suppliers')
        .select('supplier_id, name, website, location_country, location_city, technologies, materials, has_instant_quote, has_rush_service, lead_time_indicator, verified, logo_url, description')
        .eq('verified', true);

      if (config.supplierFilter === 'instant_quote') {
        query = query.eq('has_instant_quote', true);
      } else if (config.supplierFilter === 'stl_upload') {
        // STL upload = suppliers with instant quote (proxy for online ordering)
        query = query.eq('has_instant_quote', true);
      } else if (config.supplierFilter === 'near_me_cnc') {
        query = query.overlaps('technologies', CNC_TECHNOLOGIES);
      }
      // near_me_3d and price_compare: fetch all verified suppliers

      const { data, error } = await query.order('name');
      if (!error && data) {
        setSuppliers(data);

        // Build country counts for "near me" pages
        if (config.showNearMe) {
          const counts: Record<string, number> = {};
          data.forEach(s => {
            if (s.location_country) {
              counts[s.location_country] = (counts[s.location_country] || 0) + 1;
            }
          });
          const sorted = Object.entries(counts)
            .map(([country, count]) => ({
              country,
              count,
              slug: COUNTRY_SLUG_MAP[country] || null,
            }))
            .sort((a, b) => b.count - a.count);
          setCountryCounts(sorted);
        }
      }
      setLoading(false);
    }
    fetchSuppliers();
  }, [config.supplierFilter, config.showNearMe]);

  // Detect user country for "near me" pages
  useEffect(() => {
    if (!config.showNearMe) return;
    // Use timezone-based country detection (no API needed)
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const tzCountryMap: Record<string, string> = {
        'Europe/Berlin': 'Germany', 'Europe/Copenhagen': 'Denmark', 'Europe/London': 'United Kingdom',
        'America/New_York': 'United States', 'America/Chicago': 'United States', 'America/Los_Angeles': 'United States',
        'America/Denver': 'United States', 'Europe/Amsterdam': 'Netherlands', 'Europe/Paris': 'France',
        'Europe/Rome': 'Italy', 'Europe/Stockholm': 'Sweden', 'Europe/Zurich': 'Switzerland',
        'America/Toronto': 'Canada', 'Australia/Sydney': 'Australia', 'Asia/Tokyo': 'Japan',
        'Asia/Shanghai': 'China', 'Asia/Kolkata': 'India', 'Europe/Madrid': 'Spain',
        'Europe/Brussels': 'Belgium',
      };
      setUserCountry(tzCountryMap[tz] || null);
    } catch {
      // ignore
    }
  }, [config.showNearMe]);

  // Group suppliers by price tier for comparison page
  const priceTiers = useMemo(() => {
    if (!config.showPriceComparison) return null;
    const tiers: Record<string, SupplierRow[]> = { '€': [], '€€': [], '€€€': [], '€€€€': [] };
    suppliers.forEach(s => {
      const tier = getSupplierPriceTier(s.technologies || []);
      if (tiers[tier.symbol]) {
        tiers[tier.symbol].push(s);
      }
    });
    return tiers;
  }, [suppliers, config.showPriceComparison]);

  // Sort suppliers: user's country first for near-me pages
  const sortedSuppliers = useMemo(() => {
    if (!config.showNearMe || !userCountry) return suppliers;
    return [...suppliers].sort((a, b) => {
      const aLocal = a.location_country === userCountry ? 0 : 1;
      const bLocal = b.location_country === userCountry ? 0 : 1;
      return aLocal - bLocal;
    });
  }, [suppliers, userCountry, config.showNearMe]);

  const displaySuppliers = config.showNearMe ? sortedSuppliers : suppliers;

  // JSON-LD FAQPage schema
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: config.faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{config.metaTitle}</title>
        <meta name="description" content={config.metaDescription} />
        <link rel="canonical" href={`https://amsupplycheck.com/${config.slug}`} />
        <meta property="og:title" content={config.metaTitle} />
        <meta property="og:description" content={config.metaDescription} />
        <meta property="og:url" content={`https://amsupplycheck.com/${config.slug}`} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {config.h1}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            {config.heroSubtitle}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate(config.ctaLink)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
            >
              {config.ctaText}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            {config.secondaryCta && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate(config.secondaryCta!.link)}
              >
                {config.secondaryCta.text}
              </Button>
            )}
          </div>
          {!loading && (
            <p className="mt-6 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{displaySuppliers.length}</span> verified suppliers available
            </p>
          )}
        </div>
      </section>

      {/* Near Me: Country breakdown */}
      {config.showNearMe && countryCounts.length > 0 && (
        <section className="py-12 px-4 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary" />
              {config.cncOnly ? 'CNC Suppliers' : '3D Printing Suppliers'} by Country
            </h2>
            {userCountry && (
              <p className="text-muted-foreground mb-6">
                Based on your location, showing <span className="text-foreground font-medium">{userCountry}</span> suppliers first.
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {countryCounts.map(({ country, count, slug }) => (
                <Link
                  key={country}
                  to={slug ? `/suppliers/${slug}` : '/search'}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">{country}</span>
                  </div>
                  <Badge variant="secondary" className="ml-2 flex-shrink-0">{count}</Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Price Comparison Table */}
      {config.showPriceComparison && priceTiers && (
        <section className="py-12 px-4 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <DollarSign className="h-6 w-6 text-primary" />
              Pricing Tiers Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(['€', '€€', '€€€', '€€€€'] as const).map(tier => {
                const tierSuppliers = priceTiers[tier] || [];
                const tierLabels: Record<string, { name: string; desc: string; color: string }> = {
                  '€': { name: 'Budget', desc: 'Great for prototyping', color: 'text-green-500' },
                  '€€': { name: 'Mid-Range', desc: 'Functional parts', color: 'text-yellow-500' },
                  '€€€': { name: 'Professional', desc: 'Engineering-grade', color: 'text-orange-500' },
                  '€€€€': { name: 'Premium', desc: 'Aerospace & medical', color: 'text-red-500' },
                };
                const info = tierLabels[tier];
                return (
                  <Card key={tier} className="bg-card border-border">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-foreground">{info.name}</h3>
                        <span className={`text-xl font-bold ${info.color}`}>{tier}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{info.desc}</p>
                      <p className="text-2xl font-bold text-foreground mb-1">{tierSuppliers.length}</p>
                      <p className="text-xs text-muted-foreground">suppliers</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Supplier Grid */}
      <section className="py-12 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {loading ? 'Loading suppliers...' : `${displaySuppliers.length} Verified Suppliers`}
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="bg-card border-border animate-pulse">
                  <CardContent className="p-5 space-y-3">
                    <div className="h-5 w-2/3 bg-muted rounded" />
                    <div className="h-4 w-1/2 bg-muted rounded" />
                    <div className="h-4 w-full bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displaySuppliers.slice(0, 30).map(supplier => (
                <SupplierCard key={supplier.supplier_id} supplier={supplier} />
              ))}
            </div>
          )}
          {displaySuppliers.length > 30 && (
            <div className="text-center mt-8">
              <Button variant="outline" onClick={() => navigate('/suppliers')}>
                View All {displaySuppliers.length} Suppliers
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 border-t border-border bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {config.faqs.map((faq, i) => (
              <div key={i} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full text-left p-4 flex items-center justify-between bg-card hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium text-foreground pr-4">{faq.question}</span>
                  {expandedFaq === i ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === i && (
                  <div className="p-4 bg-card border-t border-border">
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Categories */}
      <section className="py-12 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-4">Related Categories</h2>
          <div className="flex flex-wrap gap-2">
            {config.relatedSlugs.map(s => (
              <Link key={s} to={`/suppliers/${s}`}>
                <Badge variant="secondary" className="hover:bg-primary/20 transition-colors cursor-pointer py-1.5 px-3">
                  {s.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-4 bg-primary/5 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground mb-6">
            Describe your project and we'll match you with the best suppliers for your specific requirements.
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/match')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
          >
            Start Project Match
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}

function SupplierCard({ supplier }: { supplier: SupplierRow }) {
  const priceTier = getSupplierPriceTier(supplier.technologies || []);

  return (
    <Link
      to={`/supplier/${supplier.supplier_id}`}
      className="block"
    >
      <Card className="bg-card border-border hover:border-primary/40 hover:shadow-lg transition-all h-full">
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 flex-shrink-0">
              <SupplierLogo name={supplier.name} logoUrl={supplier.logo_url || undefined} size="sm" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground truncate">{supplier.name}</h3>
              {supplier.location_country && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {supplier.location_city ? `${supplier.location_city}, ` : ''}{supplier.location_country}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {supplier.has_instant_quote && (
              <Badge variant="secondary" className="text-xs">
                <Zap className="h-3 w-3 mr-1" /> Instant Quote
              </Badge>
            )}
            {supplier.has_rush_service && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" /> Rush
              </Badge>
            )}
            {priceTier.symbol !== '?' && (
              <Badge variant="secondary" className="text-xs">
                {priceTier.symbol} {priceTier.label}
              </Badge>
            )}
          </div>

          {supplier.technologies && supplier.technologies.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {supplier.technologies.slice(0, 3).map(t => (
                <span key={t} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {t.replace(/-/g, ' ')}
                </span>
              ))}
              {supplier.technologies.length > 3 && (
                <span className="text-xs text-muted-foreground">+{supplier.technologies.length - 3}</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
