import { useParams, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import Navbar from '@/components/ui/navbar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { getAlternativePageBySlug, type AlternativePage as AlternativePageType } from '@/lib/alternativePages';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, ArrowRight, ExternalLink, Search, Trophy, Minus } from 'lucide-react';
import { QuoteRequestForm } from '@/components/forms/QuoteRequestForm';
import { UploadSTLCTA } from '@/components/upload/UploadSTLCTA';

export default function AlternativePage() {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const location = useLocation();
  const slug = paramSlug || location.pathname.split('/guides/')[1];
  const page = slug ? getAlternativePageBySlug(slug) : undefined;

  // Fetch alternative suppliers (for alternatives/roundup/regional/category pages)
  const { data: suppliers } = useQuery({
    queryKey: ['alternative-suppliers', page?.alternativeSupplierIds],
    queryFn: async () => {
      if (!page || page.alternativeSupplierIds.length === 0) return [];
      const { data } = await supabase
        .from('suppliers')
        .select('*')
        .in('supplier_id', page.alternativeSupplierIds);
      return data || [];
    },
    enabled: !!page && page.alternativeSupplierIds.length > 0,
  });

  // Fetch versus supplier A & B
  const { data: supplierA } = useQuery({
    queryKey: ['versus-supplier-a', page?.supplierAId],
    queryFn: async () => {
      if (!page?.supplierAId) return null;
      const { data } = await supabase
        .from('suppliers')
        .select('*')
        .eq('supplier_id', page.supplierAId)
        .maybeSingle();
      return data;
    },
    enabled: !!page?.supplierAId && page.category === 'versus',
  });

  const { data: supplierB } = useQuery({
    queryKey: ['versus-supplier-b', page?.supplierBId],
    queryFn: async () => {
      if (!page?.supplierBId) return null;
      const { data } = await supabase
        .from('suppliers')
        .select('*')
        .eq('supplier_id', page.supplierBId)
        .maybeSingle();
      return data;
    },
    enabled: !!page?.supplierBId && page.category === 'versus',
  });

  if (!page) return null;

  const isVersus = page.category === 'versus';
  const isRoundup = page.category === 'roundup' || page.category === 'regional-roundup' || page.category === 'category-roundup';
  const isAlternatives = page.category === 'alternatives';
  const baseUrl = 'https://amsupplycheck.com';

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: `${baseUrl}/guides` },
      { '@type': 'ListItem', position: 3, name: page.h1, item: `${baseUrl}/guides/${page.slug}` },
    ],
  };

  const breadcrumbLabel = isVersus
    ? `${page.supplierAName} vs ${page.supplierBName}`
    : isAlternatives
    ? `${page.competitorName} Alternatives`
    : page.h1.split('(')[0].trim();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{page.metaTitle}</title>
        <meta name="description" content={page.metaDescription} />
        <link rel="canonical" href={`${baseUrl}/guides/${page.slug}`} />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <Navbar />

      <article className="max-w-4xl mx-auto px-4 pt-16 pb-24">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link to="/guides" className="hover:text-foreground transition-colors">Guides</Link>
          <span>/</span>
          <span className="text-foreground">{breadcrumbLabel}</span>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <Badge variant="secondary" className="mb-4">
            {isVersus ? 'Head-to-Head Comparison' : isAlternatives ? `${page.competitorName} Alternatives` : '2026 Roundup'}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{page.h1}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">{page.intro}</p>
        </header>

        {/* === VERSUS LAYOUT === */}
        {isVersus && page.versusComparison && (
          <>
            {/* Side-by-side comparison table */}
            <section className="mb-12">
              <h2 className="text-xl font-bold text-foreground mb-4">
                {page.supplierAName} vs {page.supplierBName}: Feature Comparison
              </h2>
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30%]">Feature</TableHead>
                      <TableHead className="text-center">{page.supplierAName}</TableHead>
                      <TableHead className="text-center">{page.supplierBName}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {page.versusComparison.map((row) => (
                      <TableRow key={row.feature}>
                        <TableCell className="font-medium">{row.feature}</TableCell>
                        <TableCell className={`text-center ${row.winner === 'a' ? 'bg-primary/5 font-semibold text-foreground' : ''}`}>
                          {row.supplierAValue}
                          {row.winner === 'a' && <Trophy className="h-3 w-3 text-primary inline ml-1" />}
                        </TableCell>
                        <TableCell className={`text-center ${row.winner === 'b' ? 'bg-primary/5 font-semibold text-foreground' : ''}`}>
                          {row.supplierBValue}
                          {row.winner === 'b' && <Trophy className="h-3 w-3 text-primary inline ml-1" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>

            {/* Supplier cards side by side */}
            {(supplierA || supplierB) && (
              <section className="mb-12">
                <h2 className="text-xl font-bold text-foreground mb-4">Supplier Profiles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[supplierA, supplierB].map((supplier, idx) => supplier && (
                    <Card key={supplier.supplier_id} className="border-border hover:border-primary/30 transition-colors">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="text-lg font-semibold text-foreground">{supplier.name}</h3>
                          {supplier.verified && <Badge variant="secondary" className="text-xs">Verified</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{supplier.description}</p>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {(supplier.technologies || []).slice(0, 4).map(tech => (
                            <Badge key={tech} variant="outline" className="text-xs">{tech}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                          {supplier.location_country && <span>📍 {supplier.location_country}</span>}
                          {supplier.has_instant_quote && <span>⚡ Instant Quote</span>}
                        </div>
                        <Link to={`/suppliers/${supplier.supplier_id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            View Profile <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Verdict */}
            {page.verdict && page.verdict.length > 0 && (
              <section className="mb-12">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Verdict: Which Should You Choose?
                </h2>
                <div className="space-y-3">
                  {page.verdict.map((v) => (
                    <div key={v.label} className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
                      <Trophy className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground">{v.label}:</span>
                          <Badge variant={v.winner === 'tie' ? 'outline' : 'secondary'} className="text-xs">
                            {v.winner === 'a' ? page.supplierAName : v.winner === 'b' ? page.supplierBName : 'Tie'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{v.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* === ALTERNATIVES LAYOUT (existing) === */}
        {isAlternatives && page.competitorDescription && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-foreground mb-3">What is {page.competitorName}?</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">{page.competitorDescription}</p>
            <a href={page.competitorUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              Visit {page.competitorName} <ExternalLink className="h-3 w-3" />
            </a>
          </section>
        )}

        {isAlternatives && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-foreground mb-4">Feature Comparison</h2>
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    <TableHead className="text-center">{page.competitorName}</TableHead>
                    <TableHead className="text-center">Alternatives Available</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {page.comparisonFeatures.map((feat) => (
                    <TableRow key={feat.feature}>
                      <TableCell className="font-medium">{feat.feature}</TableCell>
                      <TableCell className="text-center">
                        {feat.competitorHas ? <Check className="h-5 w-5 text-primary mx-auto" /> : <X className="h-5 w-5 text-muted-foreground mx-auto" />}
                      </TableCell>
                      <TableCell className="text-center">
                        <Check className="h-5 w-5 text-primary mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        )}

        {/* === SUPPLIER CARDS (alternatives + roundups) === */}
        {(isAlternatives || isRoundup) && suppliers && suppliers.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {isAlternatives ? `Best ${page.competitorName} Alternatives` : 'Top Platforms Compared'}
            </h2>
            <div className="space-y-4">
              {suppliers.map((supplier, i) => (
                <Card key={supplier.supplier_id} className="border-border hover:border-primary/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-bold text-primary">#{i + 1}</span>
                          <h3 className="text-lg font-semibold text-foreground">{supplier.name}</h3>
                          {supplier.verified && <Badge variant="secondary" className="text-xs">Verified</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{supplier.description}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {(supplier.technologies || []).slice(0, 5).map(tech => (
                            <Badge key={tech} variant="outline" className="text-xs">{tech}</Badge>
                          ))}
                          {(supplier.technologies || []).length > 5 && (
                            <Badge variant="outline" className="text-xs">+{(supplier.technologies || []).length - 5} more</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {supplier.location_country && <span>📍 {supplier.location_country}</span>}
                          {supplier.has_instant_quote && <span>⚡ Instant Quote</span>}
                          {supplier.has_rush_service && <span>🚀 Rush Service</span>}
                        </div>
                      </div>
                      <Link to={`/suppliers/${supplier.supplier_id}`}>
                        <Button variant="outline" size="sm" className="shrink-0">
                          View Profile <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Upload STL CTA */}
        <UploadSTLCTA className="mb-12" />

        {/* Quote Request Form */}
        <section className="mb-12">
          <QuoteRequestForm
            variant="inline"
            supplierContext={isVersus ? `${page.supplierAName} vs ${page.supplierBName}` : page.competitorName || page.h1}
          />
        </section>

        {/* CTA */}
        <section className="mb-12 text-center py-8 px-6 bg-card rounded-lg border border-border">
          <h2 className="text-xl font-bold text-foreground mb-2">
            Compare All Suppliers on AMSupplyCheck
          </h2>
          <p className="text-muted-foreground mb-4">
            Filter by technology, material, location, and more to find the perfect manufacturing partner.
          </p>
          <Link to="/suppliers">
            <Button className="gap-2">
              <Search className="h-4 w-4" /> Search All Suppliers
            </Button>
          </Link>
        </section>

        {/* FAQs */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-4">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {page.faqs.map((faq, i) => (
              <div key={i}>
                <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related guides */}
        {page.relatedGuides.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">Related Guides</h2>
            <div className="flex flex-wrap gap-2">
              {page.relatedGuides.map(guideSlug => (
                <Link key={guideSlug} to={`/guides/${guideSlug}`}>
                  <Badge variant="secondary" className="hover:bg-primary/20 cursor-pointer transition-colors">
                    {guideSlug.replace(/-/g, ' ')}
                  </Badge>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
}