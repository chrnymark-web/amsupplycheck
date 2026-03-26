import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Supplier {
  supplier_id: string;
  updated_at: string;
}

// All programmatic SEO category slugs
const CATEGORY_SLUGS = {
  // Technology pages (priority 0.8)
  technology: [
    'sla-3d-printing', 'sls-3d-printing', 'fdm-3d-printing', 'mjf-3d-printing',
    'dmls-3d-printing', 'dlp-3d-printing', 'polyjet-3d-printing', 'metal-3d-printing',
    'binder-jetting', 'cnc-machining', 'injection-molding', 'ebm-3d-printing',
    'slm-3d-printing', 'large-format-3d-printing', 'laser-cutting', 'sheet-metal',
    'vacuum-casting', 'carbon-dls', 'saf-3d-printing',
  ],
  // Material pages (priority 0.7)
  material: [
    'nylon-3d-printing', 'titanium-3d-printing', 'aluminum-3d-printing',
    'stainless-steel-3d-printing', 'resin-3d-printing', 'peek-3d-printing',
    'tpu-3d-printing', 'inconel-3d-printing', 'carbon-fiber-3d-printing',
    'abs-3d-printing', 'polycarbonate-3d-printing', 'cobalt-chrome-3d-printing',
    'copper-3d-printing',
  ],
  // Location pages (priority 0.7)
  location: [
    'germany', 'denmark', 'united-states', 'united-kingdom', 'netherlands',
    'france', 'italy', 'sweden', 'switzerland', 'canada', 'australia',
    'china', 'india', 'japan', 'spain', 'belgium', 'europe', 'north-america', 'asia',
  ],
};

// Generate combination slugs
function getCombinationSlugs(): string[] {
  const keyTechs = ['sla-3d-printing', 'sls-3d-printing', 'fdm-3d-printing', 'mjf-3d-printing', 'dmls-3d-printing', 'metal-3d-printing', 'cnc-machining'];
  const keyLocations = ['germany', 'denmark', 'united-states', 'united-kingdom', 'netherlands', 'europe', 'north-america'];
  const combos: string[] = [];
  for (const tech of keyTechs) {
    for (const loc of keyLocations) {
      combos.push(`${tech}-${loc}`);
    }
  }
  return combos;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('supplier_id, updated_at')
      .eq('verified', true)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const baseUrl = 'https://amsupplycheck.com';
    const sitemap = generateSitemap(baseUrl, suppliers || []);

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateSitemap(baseUrl: string, suppliers: Supplier[]): string {
  const now = new Date().toISOString().split('T')[0];

  const staticPages = [
    { url: '', changefreq: 'daily', priority: '1.0', lastmod: now },
    { url: '/search', changefreq: 'daily', priority: '0.9', lastmod: now },
    { url: '/keywordsearch', changefreq: 'weekly', priority: '0.7', lastmod: now },
    { url: '/about', changefreq: 'monthly', priority: '0.6', lastmod: now },
    { url: '/instant-3d-printing-quotes', changefreq: 'weekly', priority: '0.8', lastmod: now },
    { url: '/upload-stl-for-quote', changefreq: 'weekly', priority: '0.8', lastmod: now },
    { url: '/3d-printing-near-me', changefreq: 'weekly', priority: '0.8', lastmod: now },
    { url: '/compare-3d-printing-prices', changefreq: 'weekly', priority: '0.8', lastmod: now },
    { url: '/cnc-machining-near-me', changefreq: 'weekly', priority: '0.8', lastmod: now },
    { url: '/guides', changefreq: 'weekly', priority: '0.7', lastmod: now },
    { url: '/guides/sla-vs-sls-comparison', changefreq: 'monthly', priority: '0.7', lastmod: now },
    { url: '/guides/nylon-sls-cost-per-part', changefreq: 'monthly', priority: '0.7', lastmod: now },
    { url: '/guides/cnc-lead-times-europe', changefreq: 'monthly', priority: '0.7', lastmod: now },
    { url: '/guides/3d-printing-tolerances', changefreq: 'monthly', priority: '0.7', lastmod: now },
    { url: '/guides/metal-3d-printing-comparison', changefreq: 'monthly', priority: '0.7', lastmod: now },
    { url: '/guides/fdm-vs-mjf-production', changefreq: 'monthly', priority: '0.7', lastmod: now },
    // Alternatives pages (high link value)
    { url: '/guides/best-xometry-alternatives', changefreq: 'monthly', priority: '0.8', lastmod: now },
    { url: '/guides/best-protolabs-alternatives', changefreq: 'monthly', priority: '0.8', lastmod: now },
    { url: '/guides/best-hubs-alternatives', changefreq: 'monthly', priority: '0.8', lastmod: now },
    { url: '/guides/best-sculpteo-alternatives', changefreq: 'monthly', priority: '0.8', lastmod: now },
    { url: '/guides/top-manufacturing-platforms', changefreq: 'monthly', priority: '0.8', lastmod: now },
    // Versus pages
    { url: '/guides/xometry-vs-protolabs', changefreq: 'monthly', priority: '0.8', lastmod: now },
    { url: '/guides/hubs-vs-shapeways', changefreq: 'monthly', priority: '0.8', lastmod: now },
    { url: '/guides/materialise-vs-sculpteo', changefreq: 'monthly', priority: '0.8', lastmod: now },
    { url: '/guides/protolabs-vs-fictiv', changefreq: 'monthly', priority: '0.8', lastmod: now },
    // Regional & category roundups
    { url: '/guides/best-3d-printing-services-europe', changefreq: 'monthly', priority: '0.8', lastmod: now },
    { url: '/guides/best-3d-printing-services-usa', changefreq: 'monthly', priority: '0.8', lastmod: now },
    { url: '/guides/top-cnc-machining-platforms', changefreq: 'monthly', priority: '0.8', lastmod: now },
    { url: '/guides/best-metal-3d-printing-services', changefreq: 'monthly', priority: '0.8', lastmod: now },
    // Stats page
    { url: '/stats', changefreq: 'weekly', priority: '0.6', lastmod: now },
  ];

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Static pages
  for (const page of staticPages) {
    xml += `  <url>\n    <loc>${baseUrl}${page.url}</loc>\n    <lastmod>${page.lastmod}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
  }

  // Individual supplier pages
  for (const supplier of suppliers) {
    const lastmod = supplier.updated_at
      ? new Date(supplier.updated_at).toISOString().split('T')[0]
      : now;
    xml += `  <url>\n    <loc>${baseUrl}/suppliers/${supplier.supplier_id}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }

  // Technology category pages
  for (const slug of CATEGORY_SLUGS.technology) {
    xml += `  <url>\n    <loc>${baseUrl}/suppliers/${slug}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }

  // Material category pages
  for (const slug of CATEGORY_SLUGS.material) {
    xml += `  <url>\n    <loc>${baseUrl}/suppliers/${slug}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  }

  // Location category pages
  for (const slug of CATEGORY_SLUGS.location) {
    xml += `  <url>\n    <loc>${baseUrl}/suppliers/${slug}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  }

  // Combination pages
  for (const slug of getCombinationSlugs()) {
    xml += `  <url>\n    <loc>${baseUrl}/suppliers/${slug}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
  }

  xml += '</urlset>';
  return xml;
}
