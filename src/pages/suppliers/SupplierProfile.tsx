import React, { useEffect, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useSupplierDetail } from '@/hooks/use-suppliers';
import { trackEvent } from '@/lib/analytics';
import Navbar from '@/components/ui/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import SupplierLogo from '@/components/ui/supplier-logo';
import { MapPin, ExternalLink, Verified, ArrowLeft, Globe, Factory, Shield, Tag, Cpu, Building2, Clock, Package, Signal, Star, Camera, Briefcase, Zap } from 'lucide-react';
import type { LiveQuote } from '@/lib/api/types';
import { slugifyVendorName } from '@/lib/utils';

const SupplierProfile: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { data: supplier, isLoading, error } = useSupplierDetail(slug || '');

  // Look for live quote data (both for Craftcloud-only vendors and DB suppliers with Craftcloud links)
  const craftcloudVendor = useMemo((): LiveQuote | null => {
    // Priority 1: Navigation state
    const stateVendor = (location.state as { craftcloudVendor?: LiveQuote })?.craftcloudVendor;
    if (stateVendor) return stateVendor;

    // Priority 2: SessionStorage lookup by slug or craftcloud vendor ID
    try {
      const raw = sessionStorage.getItem('stl-live-quotes');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const storedAt = new Date(parsed.storedAt).getTime();
      if (Date.now() - storedAt > 30 * 60 * 1000) return null;
      const match = parsed.quotes.find((q: Record<string, unknown>) => {
        const qSlug = slugifyVendorName(q.supplierName as string);
        return qSlug === slug;
      });
      if (match) return { ...match, fetchedAt: new Date(match.fetchedAt) } as LiveQuote;

      // Also try matching by craftcloud vendor ID from supplierId field (e.g. "craftcloud-norraam")
      const ccMatch = parsed.quotes.find((q: Record<string, unknown>) => {
        const supplierId = q.supplierId as string;
        if (!supplierId?.startsWith('craftcloud-')) return false;
        const vendorId = supplierId.replace('craftcloud-', '');
        // Match against the slug or known vendor ID patterns
        return vendorId === slug || vendorId === slug?.replace(/-/g, '');
      });
      if (ccMatch) return { ...ccMatch, fetchedAt: new Date(ccMatch.fetchedAt) } as LiveQuote;

      return null;
    } catch {
      return null;
    }
  }, [location.state, slug]);

  useEffect(() => {
    if (!supplier?.id) return;
    trackEvent("supplier_pageview", {
      supplier_id: supplier.id,
      supplier_slug: slug || "",
      supplier_name: supplier.name,
    });
  }, [supplier?.id, supplier?.name, slug]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background pt-20">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-40 w-full rounded-lg" />
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Craftcloud vendor fallback (no DB entry)
  if (!supplier && craftcloudVendor) {
    const formatCurrency = (amount: number, currency: string) => {
      const symbols: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', DKK: 'kr' };
      const sym = symbols[currency] || currency;
      return `${sym}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
      <>
        <Helmet>
          <title>{craftcloudVendor.supplierName} - Craftcloud Vendor | Supplycheck</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>

        <Navbar />

        <main className="min-h-screen bg-background pt-20">
          <div className="max-w-5xl mx-auto px-4 py-8">
            <Link to="/suppliers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to suppliers
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Header card */}
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-5">
                      <SupplierLogo name={craftcloudVendor.supplierName} logoUrl={craftcloudVendor.supplierLogo} size="2xl" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h1 className="text-2xl font-bold text-foreground">{craftcloudVendor.supplierName}</h1>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          <Signal className="h-3 w-3 mr-1" />
                          Craftcloud Marketplace Vendor
                        </Badge>
                        <p className="text-muted-foreground leading-relaxed mt-3">
                          This vendor is available through the Craftcloud 3D printing marketplace. Pricing data shown is from a live quote.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Live quote card */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Package className="h-5 w-5 text-primary" /> Live Quote Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Unit Price</p>
                          <p className="text-lg font-semibold text-foreground">{formatCurrency(craftcloudVendor.unitPrice, craftcloudVendor.currency)}</p>
                        </div>
                        {craftcloudVendor.quantity > 1 && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Total ({craftcloudVendor.quantity} pcs)</p>
                            <p className="text-lg font-semibold text-foreground">{formatCurrency(craftcloudVendor.totalPrice, craftcloudVendor.currency)}</p>
                          </div>
                        )}
                        {craftcloudVendor.estimatedLeadTimeDays != null && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Lead Time</p>
                            <p className="text-lg font-semibold text-foreground flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {craftcloudVendor.estimatedLeadTimeDays} days
                            </p>
                          </div>
                        )}
                        {craftcloudVendor.shippingEstimate != null && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Shipping</p>
                            <p className="text-lg font-semibold text-foreground">{formatCurrency(craftcloudVendor.shippingEstimate, craftcloudVendor.currency)}</p>
                          </div>
                        )}
                      </div>

                      {craftcloudVendor.material && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-1">Material</p>
                          <Badge variant="outline">{craftcloudVendor.material.replace(/[_-]/g, ' ')}</Badge>
                        </div>
                      )}

                      {/* Alternative quotes */}
                      {craftcloudVendor.alternativeQuotes && craftcloudVendor.alternativeQuotes.length > 0 && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-2">Alternative Materials</p>
                          <div className="space-y-2">
                            {craftcloudVendor.alternativeQuotes.map((alt, i) => (
                              <div key={i} className="flex items-center justify-between p-2 rounded-md border border-border">
                                <span className="text-sm text-foreground">{alt.label || alt.material.replace(/[_-]/g, ' ')}</span>
                                <span className="text-sm font-medium text-foreground">{formatCurrency(alt.unitPrice, craftcloudVendor.currency)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <Card className="bg-card border-border sticky top-24">
                  <CardContent className="p-5 space-y-4">
                    <h3 className="font-semibold text-foreground">Get a Quote</h3>
                    <a
                      href="https://craftcloud3d.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full rounded-md bg-primary text-primary-foreground hover:bg-primary-hover h-10 px-4 text-sm font-medium transition-colors"
                    >
                      Visit Craftcloud <ExternalLink className="h-4 w-4" />
                    </a>
                    <p className="text-xs text-muted-foreground">
                      This vendor offers quotes through the Craftcloud marketplace. Upload your 3D model on Craftcloud to get an instant quote.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!supplier || error) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background pt-20 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Supplier not found</h1>
            <p className="text-muted-foreground mb-4">The supplier you're looking for doesn't exist.</p>
            <Link to="/suppliers">
              <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Back to suppliers</Button>
            </Link>
          </div>
        </main>
      </>
    );
  }

  const pageTitle = `${supplier.name} - Manufacturing Supplier | Supplycheck`;
  const pageDescription = supplier.description || `${supplier.name} offers ${supplier.technologies.map(t => t.name).join(', ')} manufacturing services.`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-background">
        {/* Hero banner — only when hero_image_url is populated */}
        {supplier.hero_image_url && (
          <section className="relative isolate overflow-hidden pt-20">
            <img
              src={supplier.hero_image_url}
              alt={`${supplier.name} facility`}
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
            />
            {/* Layered dark gradient — not flat black */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, hsl(220 30% 8% / 0.55) 0%, hsl(220 30% 8% / 0.72) 55%, hsl(220 30% 8% / 0.95) 100%)',
              }}
            />
            {/* Brand-tinted radial for depth */}
            <div
              className="absolute inset-0 opacity-50 mix-blend-screen pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse 60% 50% at 15% 20%, hsl(var(--primary) / 0.30) 0%, transparent 65%)',
              }}
            />

            <div className="relative max-w-5xl mx-auto px-4 pt-10 md:pt-14 pb-10 md:pb-12 min-h-[360px] md:min-h-[440px] flex flex-col justify-end">
              <Link
                to="/suppliers"
                className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white mb-6 w-fit transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back to suppliers
              </Link>

              <div className="flex flex-col md:flex-row items-start gap-5 md:gap-6">
                <div className="rounded-2xl bg-white p-3 ring-1 ring-white/40 shadow-2xl">
                  <SupplierLogo name={supplier.name} logoUrl={supplier.logo_url || undefined} size="2xl" />
                </div>

                <div className="flex-1 min-w-0">
                  {supplier.is_partner && (
                    <Badge className="bg-supplier-partner text-black border-0 mb-3 shadow-lg shadow-yellow-900/20">
                      <Star className="h-3.5 w-3.5 mr-1.5 fill-current" />
                      SupplyCheck Partner
                    </Badge>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight drop-shadow-md">
                      {supplier.name}
                    </h1>
                    {supplier.verified && <Verified className="h-6 w-6 text-primary drop-shadow" />}
                  </div>

                  {(supplier.location_city || supplier.location_country) && (
                    <div className="flex items-center gap-1.5 text-white/85 mb-5">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {[supplier.location_city, supplier.country?.name || supplier.location_country]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    {supplier.is_partner && supplier.instant_quote_url ? (
                      <a
                        href={supplier.instant_quote_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-supplier-partner text-black font-medium hover:scale-105 active:scale-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none transition-transform duration-200 h-10 px-4 rounded-md shadow-lg shadow-yellow-900/30"
                      >
                        <Star className="h-4 w-4 fill-current" />
                        Get instant quote
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : null}
                    {supplier.website && (
                      <a
                        href={supplier.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:scale-105 active:scale-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none transition-transform duration-200 h-10 px-4 rounded-md"
                      >
                        <Globe className="h-4 w-4" />
                        Visit Website
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className={`max-w-5xl mx-auto px-4 py-8 ${supplier.hero_image_url ? '' : 'pt-20'}`}>
          {/* Back link — hidden when hero is present (already shown in hero) */}
          {!supplier.hero_image_url && (
            <Link to="/suppliers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to suppliers
            </Link>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header card — only when no hero banner */}
              {!supplier.hero_image_url && (
                <Card className="bg-card border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-5">
                      <SupplierLogo name={supplier.name} logoUrl={supplier.logo_url || undefined} size="2xl" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h1 className="text-2xl font-bold text-foreground">{supplier.name}</h1>
                          {supplier.verified && <Verified className="h-5 w-5 text-primary" />}
                        </div>
                        {(supplier.location_city || supplier.location_country) && (
                          <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
                            <MapPin className="h-4 w-4" />
                            <span>{[supplier.location_city, supplier.country?.name || supplier.location_country].filter(Boolean).join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* About / description */}
              {(supplier.description || supplier.description_extended?.overview) && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="h-5 w-5 text-primary" /> About {supplier.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">
                      {supplier.description_extended?.overview || supplier.description}
                    </p>
                    {supplier.description_extended?.unique_value && (
                      <div className="bg-accent/40 p-4 rounded-lg border-l-4 border-primary">
                        <h3 className="font-semibold mb-1 text-foreground flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" /> What sets them apart
                        </h3>
                        <p className="text-muted-foreground">{supplier.description_extended.unique_value}</p>
                      </div>
                    )}
                    {supplier.description_extended?.industries_served && supplier.description_extended.industries_served.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2 text-foreground flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-primary" /> Industries served
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {supplier.description_extended.industries_served.map((industry, i) => (
                            <Badge key={i} variant="outline" className="text-sm px-3 py-1">
                              {industry}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {supplier.description_extended?.capacity_notes && (
                      <div className="bg-muted/40 p-4 rounded-lg">
                        <h3 className="font-semibold mb-1 text-foreground">Production capacity</h3>
                        <p className="text-muted-foreground">{supplier.description_extended.capacity_notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Photo gallery */}
              {supplier.gallery_images && supplier.gallery_images.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Camera className="h-5 w-5 text-primary" /> Photos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {supplier.gallery_images.map((photo, i) => (
                        <figure
                          key={i}
                          className="group rounded-xl overflow-hidden bg-muted/40 ring-1 ring-border/60 shadow-[0_10px_30px_-12px_hsl(var(--primary)/0.20),0_4px_8px_-4px_hsl(220_30%_8%/0.18)] hover:shadow-[0_18px_40px_-10px_hsl(var(--primary)/0.32),0_6px_12px_-4px_hsl(220_30%_8%/0.25)] hover:-translate-y-0.5 transition-transform duration-300"
                        >
                          <div className="relative aspect-[4/3] overflow-hidden">
                            <img
                              src={photo.url}
                              alt={photo.alt}
                              loading="lazy"
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                            />
                            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                          </div>
                          {photo.caption && (
                            <figcaption className="px-4 py-3 text-sm text-muted-foreground">
                              {photo.caption}
                            </figcaption>
                          )}
                        </figure>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Technologies */}
              {supplier.technologies.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Cpu className="h-5 w-5 text-primary" /> Technologies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {supplier.technologies.map(tech => (
                        <Link key={tech.id} to={`/suppliers?tech=${tech.slug}`}>
                          <div className="flex items-center gap-2 p-2 rounded-md border border-border hover:border-primary/40 transition-colors cursor-pointer">
                            <span className="text-sm text-foreground">{tech.name}</span>
                            {tech.category && <span className="text-xs text-muted-foreground ml-auto">{tech.category}</span>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Materials */}
              {supplier.materials.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Factory className="h-5 w-5 text-primary" /> Materials
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {supplier.materials.map(mat => (
                        <Link key={mat.id} to={`/suppliers?mat=${mat.slug}`}>
                          <div className="flex items-center gap-2 p-2 rounded-md border border-border hover:border-primary/40 transition-colors cursor-pointer">
                            <span className="text-sm text-foreground">{mat.name}</span>
                            {mat.category && <span className="text-xs text-muted-foreground ml-auto">{mat.category}</span>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Certifications */}
              {supplier.certifications.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="h-5 w-5 text-primary" /> Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {supplier.certifications.map(cert => (
                        <Badge key={cert.id} className="text-sm py-1.5 px-3 bg-primary/10 text-primary border border-primary/20">
                          {cert.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tags / Industries */}
              {supplier.tags.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Tag className="h-5 w-5 text-primary" /> Capabilities & Industries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {supplier.tags.map(tag => (
                        <Badge key={tag.id} variant="outline" className="text-sm py-1.5 px-3">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Live quote data (shown when navigated from price comparison) */}
              {craftcloudVendor && (() => {
                const formatCurrency = (amount: number, currency: string) => {
                  const symbols: Record<string, string> = { EUR: '€', USD: '$', GBP: '£', DKK: 'kr' };
                  const sym = symbols[currency] || currency;
                  return `${sym}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                };
                return (
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Package className="h-5 w-5 text-primary" /> Live Quote Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Unit Price</p>
                            <p className="text-lg font-semibold text-foreground">{formatCurrency(craftcloudVendor.unitPrice, craftcloudVendor.currency)}</p>
                          </div>
                          {craftcloudVendor.quantity > 1 && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Total ({craftcloudVendor.quantity} pcs)</p>
                              <p className="text-lg font-semibold text-foreground">{formatCurrency(craftcloudVendor.totalPrice, craftcloudVendor.currency)}</p>
                            </div>
                          )}
                          {craftcloudVendor.estimatedLeadTimeDays != null && (
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground">Lead Time</p>
                              <p className="text-lg font-semibold text-foreground flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {craftcloudVendor.estimatedLeadTimeDays} days
                              </p>
                            </div>
                          )}
                        </div>
                        {craftcloudVendor.material && (
                          <div className="pt-2 border-t border-border">
                            <p className="text-xs text-muted-foreground mb-1">Quoted Material</p>
                            <Badge variant="outline">{craftcloudVendor.material.replace(/[_-]/g, ' ')}</Badge>
                          </div>
                        )}
                        {craftcloudVendor.alternativeQuotes && craftcloudVendor.alternativeQuotes.length > 0 && (
                          <div className="pt-2 border-t border-border">
                            <p className="text-xs text-muted-foreground mb-2">Alternative Materials</p>
                            <div className="space-y-2">
                              {craftcloudVendor.alternativeQuotes.map((alt, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded-md border border-border">
                                  <span className="text-sm text-foreground">{alt.label || alt.material.replace(/[_-]/g, ' ')}</span>
                                  <span className="text-sm font-medium text-foreground">{formatCurrency(alt.unitPrice, craftcloudVendor.currency)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Contact card */}
              <Card className="bg-card border-border sticky top-24">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-semibold text-foreground">Contact Supplier</h3>

                  {supplier.website && (
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full rounded-md bg-primary text-primary-foreground hover:bg-primary-hover h-10 px-4 text-sm font-medium transition-colors"
                    >
                      Visit Website <ExternalLink className="h-4 w-4" />
                    </a>
                  )}

                  <div className="space-y-3 text-sm">
                    {supplier.website && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="h-4 w-4 flex-shrink-0" />
                        <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors truncate">
                          {supplier.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </a>
                      </div>
                    )}
                    {(supplier.location_city || supplier.location_country) && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-4 w-4 flex-shrink-0" />
                        <span>{[supplier.location_city, supplier.country?.name || supplier.location_country].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    {supplier.verified && (
                      <div className="flex items-center gap-2 text-primary">
                        <Verified className="h-4 w-4 flex-shrink-0" />
                        <span>Verified Supplier</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick facts */}
              <Card className="bg-card border-border">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground mb-3">Quick Facts</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Technologies</span>
                      <span className="text-foreground font-medium">{supplier.technologies.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Materials</span>
                      <span className="text-foreground font-medium">{supplier.materials.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Certifications</span>
                      <span className="text-foreground font-medium">{supplier.certifications.length}</span>
                    </div>
                    {supplier.country?.region && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Region</span>
                        <span className="text-foreground font-medium">{supplier.country.region}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default SupplierProfile;
