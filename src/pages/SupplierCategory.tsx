import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';
import { getCategoryBySlug, getRelatedCategories, type CategoryFilter } from '@/lib/seoSlugs';
import SupplierCard from '@/components/ui/supplier-card';
import CategoryLinks from '@/components/CategoryLinks';
import Navbar from '@/components/ui/navbar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface SupplierRow {
  id: string;
  supplier_id: string;
  name: string;
  description: string | null;
  website: string | null;
  location_city: string | null;
  location_country: string | null;
  technologies: string[] | null;
  materials: string[] | null;
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

const SupplierCategory = () => {
  const { slug } = useParams<{ slug: string }>();
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const category = slug ? getCategoryBySlug(slug) : undefined;

  useEffect(() => {
    if (!category || !slug) return;

    const fetchSuppliers = async () => {
      setLoading(true);
      let query = supabase
        .from('suppliers')
        .select('id, supplier_id, name, description, website, location_city, location_country, technologies, materials, verified, premium, rating, review_count, logo_url, region, lead_time_indicator, has_rush_service, has_instant_quote')
        .eq('verified', true);

      // Apply technology filter using overlaps (ANY match)
      if (category.filters.technologies?.length) {
        query = query.overlaps('technologies', category.filters.technologies);
      }

      // Apply material filter using overlaps
      if (category.filters.materials?.length) {
        query = query.overlaps('materials', category.filters.materials);
      }

      // Apply location filter
      if (category.filters.location_country?.length) {
        query = query.in('location_country', category.filters.location_country);
      }

      // Apply region filter
      if (category.filters.region) {
        query = query.eq('region', category.filters.region);
      }

      query = query.order('premium', { ascending: false }).order('rating', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching category suppliers:', error);
      } else {
        setSuppliers(data || []);
      }
      setLoading(false);
    };

    fetchSuppliers();
  }, [slug, category]);

  if (!category) return null;

  const baseUrl = 'https://amsupplycheck.com';
  const canonicalUrl = `${baseUrl}/suppliers/${slug}`;
  const relatedCategories = slug ? getRelatedCategories(slug) : [];
  const supplierCount = suppliers.length;

  // JSON-LD ItemList wrapped in OfferCatalog
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: category.title,
    description: category.description,
    url: canonicalUrl,
    numberOfItems: supplierCount,
    itemListElement: suppliers.slice(0, 20).map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.name,
      url: `${baseUrl}/suppliers/${s.supplier_id}`,
      item: {
        '@type': 'Service',
        name: s.name,
        provider: { '@type': 'LocalBusiness', name: s.name, url: `${baseUrl}/suppliers/${s.supplier_id}` },
      },
    })),
  };

  // Breadcrumb schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Suppliers', item: `${baseUrl}/search` },
      { '@type': 'ListItem', position: 3, name: category.label, item: canonicalUrl },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Helmet>
        <title>{category.title} | AMSupplyCheck</title>
        <meta name="description" content={`${category.description} Compare ${supplierCount} verified suppliers.`} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={`${category.title} | AMSupplyCheck`} />
        <meta property="og:description" content={category.description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${category.title} | AMSupplyCheck`} />
        <meta name="twitter:description" content={category.description} />
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <main className="container mx-auto px-4 py-24 max-w-7xl">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <ol className="flex items-center gap-1.5">
            <li><Link to="/" className="hover:text-foreground transition-colors">Home</Link></li>
            <li>/</li>
            <li><Link to="/search" className="hover:text-foreground transition-colors">Suppliers</Link></li>
            <li>/</li>
            <li className="text-foreground font-medium">{category.label}</li>
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            {category.title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            {category.description}
            {!loading && ` Compare ${supplierCount} verified supplier${supplierCount !== 1 ? 's' : ''}.`}
          </p>
        </header>

        {/* Supplier Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-lg" />
            ))}
          </div>
        ) : suppliers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {suppliers.map((s, i) => (
              <SupplierCard
                key={s.id}
                index={i}
                listName={category.title}
                supplier={{
                  id: s.supplier_id,
                  name: s.name,
                  description: s.description || '',
                  location: {
                    city: s.location_city || '',
                    country: s.location_country || '',
                  },
                  technologies: s.technologies || [],
                  materials: s.materials || [],
                  verified: s.verified || false,
                  premium: s.premium || false,
                  rating: s.rating || 0,
                  reviewCount: s.review_count || 0,
                  website: s.website || undefined,
                  logoUrl: s.logo_url || undefined,
                  leadTime: s.lead_time_indicator,
                  hasRushService: s.has_rush_service || false,
                  hasInstantQuote: s.has_instant_quote || false,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">No suppliers found for this category yet.</p>
            <Link to="/search">
              <Button>Browse All Suppliers</Button>
            </Link>
          </div>
        )}

        {/* Related Categories */}
        {relatedCategories.length > 0 && (
          <CategoryLinks
            links={relatedCategories}
            title="Explore Related Categories"
            className="mt-12 border-t border-border pt-8"
          />
        )}
      </main>
    </div>
  );
};

export default SupplierCategory;
