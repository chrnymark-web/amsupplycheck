import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Navbar from '@/components/ui/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getGuideBySlug, type GuideSection, type GuideArticle } from '@/lib/guideArticles';
import { TECHNOLOGY_GLOSSARY } from '@/lib/technologyGlossary';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, ChevronDown, ChevronUp, BookOpen, ExternalLink, Lightbulb } from 'lucide-react';
import { QuoteRequestForm } from '@/components/forms/QuoteRequestForm';

// Map pSEO slug to DB technology filter values for count queries
const SLUG_TECH_MAP: Record<string, string[]> = {
  'sla-3d-printing': ['sla', 'SLA', 'stereolithography'],
  'sls-3d-printing': ['sls', 'SLS', 'selective-laser-sintering-(sls)'],
  'fdm-3d-printing': ['fdm', 'fdm-printing', 'FDM/FFF'],
  'mjf-3d-printing': ['mjf', 'multi-jet-fusion', 'Multi Jet Fusion'],
  'dmls-3d-printing': ['dmls', 'DMLS', 'direct-metal-laser-sintering'],
  'slm-3d-printing': ['slm', 'SLM', 'selective-laser-melting-(slm)'],
  'binder-jetting': ['binder-jetting', 'metal-binder-jetting'],
  'metal-3d-printing': ['dmls', 'DMLS', 'slm', 'SLM', 'ebm', 'metal-3d-printing'],
  'cnc-machining': ['cnc', 'cnc-machining', 'cnc-milling'],
  'nylon-3d-printing': ['nylon'],
};

const SLUG_MATERIAL_MAP: Record<string, string[]> = {
  'nylon-3d-printing': ['nylon', 'nylon-pa-12', 'pa-12', 'pa-11'],
};

export default function GuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const guide = slug ? getGuideBySlug(slug) : undefined;

  if (!guide) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Guide Not Found</h1>
          <Button onClick={() => navigate('/guides')}>Browse All Guides</Button>
        </div>
      </div>
    );
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://amsupplycheck.com/' },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://amsupplycheck.com/guides' },
      { '@type': 'ListItem', position: 3, name: guide.title },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{guide.metaTitle}</title>
        <meta name="description" content={guide.metaDescription} />
        <link rel="canonical" href={`https://amsupplycheck.com/guides/${guide.slug}`} />
        <meta property="og:title" content={guide.metaTitle} />
        <meta property="og:description" content={guide.metaDescription} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <Navbar />

      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <nav className="text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link to="/guides" className="hover:text-foreground transition-colors">Guides</Link>
          <span>/</span>
          <span className="text-foreground">{guide.title}</span>
        </nav>
      </div>

      {/* Hero */}
      <header className="max-w-4xl mx-auto px-4 pt-8 pb-12">
        <Badge variant="secondary" className="mb-4">
          {guide.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </Badge>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
          {guide.h1}
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
          {guide.intro}
        </p>
      </header>

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 pb-16 space-y-12">
        {guide.sections.map((section, i) => (
          <SectionRenderer key={i} section={section} />
        ))}
      </article>

      {/* FAQ */}
      <section className="py-16 px-4 border-t border-border bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-8">Frequently Asked Questions</h2>
          <FAQAccordion faqs={guide.faqs} />
        </div>
      </section>

      {/* Related Guides */}
      <section className="py-12 px-4 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Related Guides
          </h2>
          <div className="flex flex-wrap gap-2">
            {guide.relatedGuides.map(slug => (
              <Link key={slug} to={`/guides/${slug}`}>
                <Badge variant="secondary" className="hover:bg-primary/20 transition-colors cursor-pointer py-1.5 px-3">
                  {slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA - Quote Request */}
      <section className="py-16 px-4 bg-primary/5 border-t border-border">
        <div className="max-w-2xl mx-auto">
          <QuoteRequestForm
            variant="inline"
            supplierContext={guide.title}
          />
        </div>
      </section>
    </div>
  );
}

function SectionRenderer({ section }: { section: GuideSection }) {
  if (section.type === 'text') {
    return (
      <div>
        {section.heading && <h2 className="text-2xl font-bold text-foreground mb-3">{section.heading}</h2>}
        <p className="text-muted-foreground leading-relaxed">{section.content}</p>
      </div>
    );
  }

  if (section.type === 'key_takeaway') {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6 flex gap-4">
          <Lightbulb className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
          <div>
            {section.heading && <h3 className="font-bold text-foreground mb-2">{section.heading}</h3>}
            <p className="text-muted-foreground leading-relaxed">{section.content}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (section.type === 'comparison_table' && section.technologies) {
    return <ComparisonTable technologies={section.technologies} />;
  }

  if (section.type === 'supplier_cta' && section.supplierSlugs) {
    return <SupplierCTASection slugs={section.supplierSlugs} />;
  }

  return null;
}

function ComparisonTable({ technologies }: { technologies: string[] }) {
  const techData = technologies.map(key => ({ key, info: TECHNOLOGY_GLOSSARY[key] })).filter(t => t.info);

  if (techData.length === 0) return null;

  const priceLabels: Record<string, string> = { 'low': '€', 'medium': '€€', 'high': '€€€', 'very-high': '€€€€' };
  const renderStars = (level: number) => '★'.repeat(level) + '☆'.repeat(5 - level);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-border rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-muted/50">
            <th className="text-left p-3 text-sm font-semibold text-foreground border-b border-border">Property</th>
            {techData.map(t => (
              <th key={t.key} className="text-center p-3 text-sm font-semibold text-foreground border-b border-border">{t.info.abbreviation}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-3 text-sm text-muted-foreground border-b border-border">Full Name</td>
            {techData.map(t => <td key={t.key} className="text-center p-3 text-sm text-foreground border-b border-border">{t.info.name}</td>)}
          </tr>
          <tr>
            <td className="p-3 text-sm text-muted-foreground border-b border-border">Price Range</td>
            {techData.map(t => <td key={t.key} className="text-center p-3 text-sm font-medium border-b border-border">{priceLabels[t.info.priceRange] || '?'}</td>)}
          </tr>
          <tr>
            <td className="p-3 text-sm text-muted-foreground border-b border-border">Strength</td>
            {techData.map(t => <td key={t.key} className="text-center p-3 text-sm border-b border-border">{renderStars(t.info.strengthLevel)}</td>)}
          </tr>
          <tr>
            <td className="p-3 text-sm text-muted-foreground border-b border-border">Detail</td>
            {techData.map(t => <td key={t.key} className="text-center p-3 text-sm border-b border-border">{renderStars(t.info.detailLevel)}</td>)}
          </tr>
          <tr>
            <td className="p-3 text-sm text-muted-foreground border-b border-border">Speed</td>
            {techData.map(t => <td key={t.key} className="text-center p-3 text-sm border-b border-border">{renderStars(t.info.speedLevel)}</td>)}
          </tr>
          <tr>
            <td className="p-3 text-sm text-muted-foreground">Best For</td>
            {techData.map(t => <td key={t.key} className="text-center p-3 text-sm text-muted-foreground">{t.info.bestFor.slice(0, 2).join(', ')}</td>)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SupplierCTASection({ slugs }: { slugs: { slug: string; label: string }[] }) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    async function fetchCounts() {
      const results: Record<string, number> = {};
      await Promise.all(slugs.map(async ({ slug }) => {
        const techFilters = SLUG_TECH_MAP[slug];
        const matFilters = SLUG_MATERIAL_MAP[slug];
        let query = supabase.from('suppliers').select('*', { count: 'exact', head: true }).eq('verified', true);
        if (techFilters) query = query.overlaps('technologies', techFilters);
        else if (matFilters) query = query.overlaps('materials', matFilters);
        const { count } = await query;
        results[slug] = count || 0;
      }));
      setCounts(results);
    }
    fetchCounts();
  }, [slugs]);

  return (
    <div className="bg-muted/30 rounded-lg p-6 border border-border">
      <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
        <ExternalLink className="h-5 w-5 text-primary" />
        Find Verified Suppliers
      </h3>
      <div className="flex flex-wrap gap-3">
        {slugs.map(({ slug, label }) => (
          <Link key={slug} to={`/suppliers/${slug}`}>
            <Button variant="outline" className="hover:border-primary/50">
              {label}
              {counts[slug] !== undefined && (
                <Badge variant="secondary" className="ml-2">{counts[slug]}</Badge>
              )}
            </Button>
          </Link>
        ))}
        <Link to="/instant-3d-printing-quotes">
          <Button variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Get Instant Quotes <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

function FAQAccordion({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <div key={i} className="border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === i ? null : i)}
            className="w-full text-left p-4 flex items-center justify-between bg-card hover:bg-muted/50 transition-colors"
          >
            <span className="font-medium text-foreground pr-4">{faq.question}</span>
            {expanded === i ? <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />}
          </button>
          {expanded === i && (
            <div className="p-4 bg-card border-t border-border">
              <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
