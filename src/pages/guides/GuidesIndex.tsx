import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Navbar from '@/components/ui/navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GUIDE_ARTICLES, GUIDE_CATEGORIES } from '@/lib/guideArticles';
import { ALTERNATIVE_PAGES } from '@/lib/alternativePages';
import { ArrowRight, BookOpen } from 'lucide-react';

export default function GuidesIndex() {
  // Build alternatives as pseudo-articles for the grid
  const alternativeArticles = ALTERNATIVE_PAGES.map(p => ({
    slug: p.slug,
    title: p.h1,
    metaDescription: p.metaDescription,
    comparisonTechnologies: [] as string[],
    category: 'alternatives' as const,
  }));

  const allArticles = [...alternativeArticles, ...GUIDE_ARTICLES];

  const grouped = Object.entries(GUIDE_CATEGORIES).map(([key, cat]) => ({
    ...cat,
    key,
    articles: allArticles.filter(a => a.category === key),
  })).filter(g => g.articles.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>3D Printing & Manufacturing Guides | AMSupplyCheck</title>
        <meta name="description" content="Data-driven guides comparing 3D printing technologies, costs, and lead times. Make informed decisions and find the right supplier." />
        <link rel="canonical" href="https://amsupplycheck.com/guides" />
      </Helmet>

      <Navbar />

      <header className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Manufacturing Decision Guides
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Data-driven comparisons to help you choose the right technology, material, and supplier. Every guide links directly to verified suppliers.
        </p>
      </header>

      <main className="max-w-4xl mx-auto px-4 pb-24 space-y-12">
        {grouped.map(group => (
          <section key={group.key}>
            <h2 className="text-xl font-bold text-foreground mb-1">{group.label}</h2>
            <p className="text-sm text-muted-foreground mb-4">{group.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.articles.map(article => (
                <Link key={article.slug} to={`/guides/${article.slug}`} className="block group">
                  <Card className="h-full border-border hover:border-primary/40 hover:shadow-lg transition-all">
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {article.metaDescription}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {article.comparisonTechnologies.slice(0, 3).map(tech => (
                          <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                        ))}
                        <span className="text-xs text-primary flex items-center gap-1 ml-auto">
                          Read guide <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
