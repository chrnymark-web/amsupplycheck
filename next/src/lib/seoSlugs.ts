/**
 * SEO Slug Mapping System
 * Maps URL slugs to database filters for programmatic SEO category pages
 */

export interface CategoryFilter {
  type: 'technology' | 'material' | 'location' | 'region' | 'combination';
  label: string; // Display name for H1/title
  title: string; // SEO title
  description: string; // Meta description
  filters: {
    technologies?: string[];
    materials?: string[];
    location_country?: string[];
    region?: string;
  };
}

// Technology slug mappings - maps URL slug to DB technology keys + display info
const TECHNOLOGY_SLUGS: Record<string, CategoryFilter> = {
  'sla-3d-printing': {
    type: 'technology',
    label: 'SLA 3D Printing',
    title: 'SLA 3D Printing Services',
    description: 'Compare verified SLA (Stereolithography) 3D printing suppliers. Find the best SLA service provider for your project.',
    filters: { technologies: ['sla', 'SLA', 'sla-printing', 'stereolithography'] },
  },
  'sls-3d-printing': {
    type: 'technology',
    label: 'SLS 3D Printing',
    title: 'SLS 3D Printing Services',
    description: 'Compare verified SLS (Selective Laser Sintering) 3D printing suppliers. Industrial-grade powder bed fusion services.',
    filters: { technologies: ['sls', 'SLS', 'sls-printing', 'selective-laser-sintering-(sls)', 'laser-sintering'] },
  },
  'fdm-3d-printing': {
    type: 'technology',
    label: 'FDM 3D Printing',
    title: 'FDM 3D Printing Services',
    description: 'Compare verified FDM (Fused Deposition Modeling) 3D printing suppliers for prototyping and production.',
    filters: { technologies: ['fdm', 'fdm-printing', 'FDM/FFF'] },
  },
  'mjf-3d-printing': {
    type: 'technology',
    label: 'Multi Jet Fusion (MJF)',
    title: 'HP Multi Jet Fusion 3D Printing Services',
    description: 'Find MJF 3D printing suppliers offering HP Multi Jet Fusion technology for high-volume production.',
    filters: { technologies: ['mjf', 'mjf-printing', 'multi-jet-fusion', 'multi-jet-fusion-(mjf)', 'hp-multi-jet-fusion', 'Multi Jet Fusion'] },
  },
  'dmls-3d-printing': {
    type: 'technology',
    label: 'DMLS Metal 3D Printing',
    title: 'DMLS Metal 3D Printing Services',
    description: 'Compare DMLS (Direct Metal Laser Sintering) suppliers for precision metal additive manufacturing.',
    filters: { technologies: ['dmls', 'DMLS', 'dmls-printing', 'direct-metal-laser-sintering'] },
  },
  'dlp-3d-printing': {
    type: 'technology',
    label: 'DLP 3D Printing',
    title: 'DLP 3D Printing Services',
    description: 'Find DLP (Digital Light Processing) 3D printing suppliers for high-detail resin parts.',
    filters: { technologies: ['dlp', 'DLP'] },
  },
  'polyjet-3d-printing': {
    type: 'technology',
    label: 'PolyJet 3D Printing',
    title: 'PolyJet 3D Printing Services',
    description: 'Compare PolyJet 3D printing suppliers for multi-material and full-color prototyping.',
    filters: { technologies: ['polyjet', 'polyjet-printing', 'material-jetting'] },
  },
  'metal-3d-printing': {
    type: 'technology',
    label: 'Metal 3D Printing',
    title: 'Metal 3D Printing Services',
    description: 'Find metal additive manufacturing suppliers including DMLS, SLM, EBM, and binder jetting.',
    filters: { technologies: ['dmls', 'DMLS', 'slm', 'SLM', 'ebm', 'metal-3d-printing', 'metal-additive-manufacturing', 'metal-am', 'lpbf', 'laser-powder-bed-fusion', 'metal-binder-jetting', 'dmp', 'metal-laser-melting', 'selective-laser-melting-(slm)'] },
  },
  'binder-jetting': {
    type: 'technology',
    label: 'Binder Jetting',
    title: 'Binder Jetting 3D Printing Services',
    description: 'Compare binder jetting suppliers for metal and sand 3D printing applications.',
    filters: { technologies: ['binder-jetting', 'metal-binder-jetting', 'sand-3d-printing'] },
  },
  'cnc-machining': {
    type: 'technology',
    label: 'CNC Machining',
    title: 'CNC Machining Services',
    description: 'Find CNC machining service providers for precision milling, turning, and multi-axis manufacturing.',
    filters: { technologies: ['cnc', 'cnc-machining', 'cnc-milling', 'cnc-turning', 'cnc-lathe', 'cnc-cutting', 'multi-axis-cnc', 'precision-machining', 'cnc-fräsen', 'cnc-drehen', '5-axis-milling'] },
  },
  'injection-molding': {
    type: 'technology',
    label: 'Injection Molding',
    title: 'Injection Molding Services',
    description: 'Compare injection molding suppliers for high-volume plastic part production.',
    filters: { technologies: ['injection-molding', 'injection-moulding', 'plastic-injection-molding', 'spritzguss'] },
  },
  'ebm-3d-printing': {
    type: 'technology',
    label: 'Electron Beam Melting (EBM)',
    title: 'EBM 3D Printing Services',
    description: 'Find EBM (Electron Beam Melting) suppliers for high-performance metal additive manufacturing.',
    filters: { technologies: ['ebm', 'electron-beam-melting-(ebm)'] },
  },
  'slm-3d-printing': {
    type: 'technology',
    label: 'SLM 3D Printing',
    title: 'Selective Laser Melting (SLM) Services',
    description: 'Compare SLM suppliers for precision metal 3D printing and laser powder bed fusion.',
    filters: { technologies: ['slm', 'SLM', 'selective-laser-melting-(slm)', 'lpbf', 'laser-powder-bed-fusion'] },
  },
  'large-format-3d-printing': {
    type: 'technology',
    label: 'Large Format 3D Printing',
    title: 'Large Format 3D Printing Services',
    description: 'Find large-scale 3D printing suppliers for oversized parts and industrial applications.',
    filters: { technologies: ['large-scale-3d-printing', 'large-scale-additive-manufacturing', 'robotic-3d-printing', 'robotic-arm-(lfam)'] },
  },
  'laser-cutting': {
    type: 'technology',
    label: 'Laser Cutting',
    title: 'Laser Cutting Services',
    description: 'Find laser cutting service providers for precision metal and material cutting.',
    filters: { technologies: ['laser-cutting', 'laserschneiden', 'flame-cutting', 'plasma-cutting'] },
  },
  'sheet-metal': {
    type: 'technology',
    label: 'Sheet Metal Fabrication',
    title: 'Sheet Metal Fabrication Services',
    description: 'Compare sheet metal fabrication suppliers for bending, forming, and manufacturing.',
    filters: { technologies: ['sheet-metal', 'sheet-metal-fabrication', 'sheet-metal-work', 'sheet-fabrication', 'sheet-metal-bending-&-forming', 'metal-bending', 'metal-stamping', 'metal-punching'] },
  },
  'vacuum-casting': {
    type: 'technology',
    label: 'Vacuum Casting',
    title: 'Vacuum Casting & Urethane Casting Services',
    description: 'Find vacuum casting and urethane casting suppliers for small-batch production.',
    filters: { technologies: ['cast-urethane', 'silicone-casting', 'silicone-&-urethane-casting'] },
  },
  'carbon-dls': {
    type: 'technology',
    label: 'Carbon DLS',
    title: 'Carbon DLS 3D Printing Services',
    description: 'Find Carbon DLS (Digital Light Synthesis) 3D printing suppliers for production-grade parts.',
    filters: { technologies: ['carbon-dls', 'dls', 'dls-(digital-light-synthesis)', 'digital-light-synthesis-(dls)', 'clip'] },
  },
  'saf-3d-printing': {
    type: 'technology',
    label: 'SAF 3D Printing',
    title: 'Selective Absorption Fusion (SAF) Services',
    description: 'Compare SAF 3D printing suppliers using Stratasys H350 technology.',
    filters: { technologies: ['saf'] },
  },
};

// Material slug mappings
const MATERIAL_SLUGS: Record<string, CategoryFilter> = {
  'nylon-3d-printing': {
    type: 'material',
    label: 'Nylon 3D Printing',
    title: 'Nylon 3D Printing Services',
    description: 'Find suppliers offering Nylon (PA12, PA11) 3D printing services for durable functional parts.',
    filters: { materials: ['nylon', 'nylon-pa-12', 'nylon-12', 'pa-12', 'pa-11', 'nylon-6', 'nylon-66', 'pa-12-bluesint', 'mjf_pa12', 'sls_pa12_pa2200'] },
  },
  'titanium-3d-printing': {
    type: 'material',
    label: 'Titanium 3D Printing',
    title: 'Titanium 3D Printing Services',
    description: 'Compare titanium additive manufacturing suppliers for aerospace and medical applications.',
    filters: { materials: ['titanium', 'titanium-ti-6al-4v', 'titanium-grade-2', 'titanium-grade-5', 'titanium-ti-6al-4v-eli'] },
  },
  'aluminum-3d-printing': {
    type: 'material',
    label: 'Aluminum 3D Printing',
    title: 'Aluminum 3D Printing Services',
    description: 'Find aluminum additive manufacturing suppliers for lightweight metal parts.',
    filters: { materials: ['aluminum', 'aluminum-alsi10mg', 'aluminum-alsi7mg', 'aluminum-alsi12', 'aluminum-aisi10mg', 'scalmalloy'] },
  },
  'stainless-steel-3d-printing': {
    type: 'material',
    label: 'Stainless Steel 3D Printing',
    title: 'Stainless Steel 3D Printing Services',
    description: 'Compare stainless steel 3D printing suppliers for corrosion-resistant metal parts.',
    filters: { materials: ['stainless-steel', 'stainless-steel-316l', 'stainless-steel-17-4ph', 'stainless-steel-304', 'stainless-steel-303', 'stainless-steel-15-5ph'] },
  },
  'resin-3d-printing': {
    type: 'material',
    label: 'Resin 3D Printing',
    title: 'Resin 3D Printing Services',
    description: 'Find photopolymer resin 3D printing suppliers for high-detail prototypes and end-use parts.',
    filters: { materials: ['resin', 'standard-resin', 'clear-resin', 'tough-resin', 'durable-resin', 'flexible-resin', 'high-temp-resin', 'photopolymer-rigid'] },
  },
  'peek-3d-printing': {
    type: 'material',
    label: 'PEEK 3D Printing',
    title: 'PEEK 3D Printing Services',
    description: 'Find PEEK 3D printing suppliers for high-temperature, high-performance polymer parts.',
    filters: { materials: ['peek'] },
  },
  'tpu-3d-printing': {
    type: 'material',
    label: 'TPU 3D Printing',
    title: 'TPU Flexible 3D Printing Services',
    description: 'Compare TPU 3D printing suppliers for flexible and elastomeric parts.',
    filters: { materials: ['tpu', 'tpu-70-a-white', 'tpu-mjf', 'sls_flexible_tpu', 'ultrasint_tpu01_mjf', 'duraform-tpu'] },
  },
  'inconel-3d-printing': {
    type: 'material',
    label: 'Inconel 3D Printing',
    title: 'Inconel 3D Printing Services',
    description: 'Find Inconel additive manufacturing suppliers for high-temperature superalloy applications.',
    filters: { materials: ['inconel', 'inconel-625', 'inconel-718', 'ni625'] },
  },
  'carbon-fiber-3d-printing': {
    type: 'material',
    label: 'Carbon Fiber 3D Printing',
    title: 'Carbon Fiber 3D Printing Services',
    description: 'Compare carbon fiber reinforced 3D printing suppliers for lightweight, strong parts.',
    filters: { materials: ['carbon-fiber', 'carbon-fiber-nylon', 'carbon-fiber-petg', 'carbon-fiber-peek', 'pa-cf', 'pa-12-carbon-filled'] },
  },
  'abs-3d-printing': {
    type: 'material',
    label: 'ABS 3D Printing',
    title: 'ABS 3D Printing Services',
    description: 'Find ABS 3D printing suppliers for durable thermoplastic prototypes and parts.',
    filters: { materials: ['abs', 'abs-m30-stratasys', 'abs-white', 'absplus-stratasys', 'abs-m30i', 'abs-esd7'] },
  },
  'polycarbonate-3d-printing': {
    type: 'material',
    label: 'Polycarbonate 3D Printing',
    title: 'Polycarbonate 3D Printing Services',
    description: 'Compare polycarbonate 3D printing suppliers for transparent, impact-resistant parts.',
    filters: { materials: ['pc', 'polycarbonate', 'pc-abs', 'pc-iso', 'pc-or-pc-abs'] },
  },
  'cobalt-chrome-3d-printing': {
    type: 'material',
    label: 'Cobalt Chrome 3D Printing',
    title: 'Cobalt Chrome 3D Printing Services',
    description: 'Find cobalt chrome additive manufacturing suppliers for medical and dental applications.',
    filters: { materials: ['cobalt-chrome', 'cocr', 'cocr-f75', 'stellite'] },
  },
  'copper-3d-printing': {
    type: 'material',
    label: 'Copper 3D Printing',
    title: 'Copper 3D Printing Services',
    description: 'Compare copper additive manufacturing suppliers for thermal and electrical applications.',
    filters: { materials: ['copper', 'copper-cuw', 'grcop-84', 'grcop-42'] },
  },
};

// Location slug mappings - country names normalized to slugs
const LOCATION_SLUGS: Record<string, CategoryFilter> = {
  'germany': {
    type: 'location',
    label: 'Germany',
    title: '3D Printing Services in Germany',
    description: 'Find verified 3D printing and additive manufacturing suppliers in Germany.',
    filters: { location_country: ['Germany', 'Deutschland'] },
  },
  'denmark': {
    type: 'location',
    label: 'Denmark',
    title: '3D Printing Services in Denmark',
    description: 'Find verified 3D printing and additive manufacturing suppliers in Denmark.',
    filters: { location_country: ['Denmark', 'Danmark'] },
  },
  'united-states': {
    type: 'location',
    label: 'United States',
    title: '3D Printing Services in the United States',
    description: 'Find verified 3D printing and additive manufacturing suppliers in the US.',
    filters: { location_country: ['United States', 'US', 'North America'] },
  },
  'united-kingdom': {
    type: 'location',
    label: 'United Kingdom',
    title: '3D Printing Services in the United Kingdom',
    description: 'Find verified 3D printing and additive manufacturing suppliers in the UK.',
    filters: { location_country: ['United Kingdom', 'GB'] },
  },
  'netherlands': {
    type: 'location',
    label: 'Netherlands',
    title: '3D Printing Services in the Netherlands',
    description: 'Find verified 3D printing and additive manufacturing suppliers in the Netherlands.',
    filters: { location_country: ['Netherlands', 'Nederland'] },
  },
  'france': {
    type: 'location',
    label: 'France',
    title: '3D Printing Services in France',
    description: 'Find verified 3D printing and additive manufacturing suppliers in France.',
    filters: { location_country: ['France'] },
  },
  'italy': {
    type: 'location',
    label: 'Italy',
    title: '3D Printing Services in Italy',
    description: 'Find verified 3D printing and additive manufacturing suppliers in Italy.',
    filters: { location_country: ['Italy', 'Italia'] },
  },
  'sweden': {
    type: 'location',
    label: 'Sweden',
    title: '3D Printing Services in Sweden',
    description: 'Find verified 3D printing and additive manufacturing suppliers in Sweden.',
    filters: { location_country: ['Sweden', 'Sverige'] },
  },
  'switzerland': {
    type: 'location',
    label: 'Switzerland',
    title: '3D Printing Services in Switzerland',
    description: 'Find verified 3D printing and additive manufacturing suppliers in Switzerland.',
    filters: { location_country: ['Switzerland'] },
  },
  'canada': {
    type: 'location',
    label: 'Canada',
    title: '3D Printing Services in Canada',
    description: 'Find verified 3D printing and additive manufacturing suppliers in Canada.',
    filters: { location_country: ['Canada'] },
  },
  'australia': {
    type: 'location',
    label: 'Australia',
    title: '3D Printing Services in Australia',
    description: 'Find verified 3D printing and additive manufacturing suppliers in Australia.',
    filters: { location_country: ['Australia'] },
  },
  'china': {
    type: 'location',
    label: 'China',
    title: '3D Printing Services in China',
    description: 'Find verified 3D printing and additive manufacturing suppliers in China.',
    filters: { location_country: ['China', '中国'] },
  },
  'india': {
    type: 'location',
    label: 'India',
    title: '3D Printing Services in India',
    description: 'Find verified 3D printing and additive manufacturing suppliers in India.',
    filters: { location_country: ['India'] },
  },
  'japan': {
    type: 'location',
    label: 'Japan',
    title: '3D Printing Services in Japan',
    description: 'Find verified 3D printing and additive manufacturing suppliers in Japan.',
    filters: { location_country: ['Japan', '日本'] },
  },
  'spain': {
    type: 'location',
    label: 'Spain',
    title: '3D Printing Services in Spain',
    description: 'Find verified 3D printing and additive manufacturing suppliers in Spain.',
    filters: { location_country: ['Spain', 'España'] },
  },
  'belgium': {
    type: 'location',
    label: 'Belgium',
    title: '3D Printing Services in Belgium',
    description: 'Find verified 3D printing and additive manufacturing suppliers in Belgium.',
    filters: { location_country: ['Belgium'] },
  },
  'europe': {
    type: 'region',
    label: 'Europe',
    title: '3D Printing Services in Europe',
    description: 'Find verified 3D printing and additive manufacturing suppliers across Europe.',
    filters: { region: 'europe' },
  },
  'north-america': {
    type: 'region',
    label: 'North America',
    title: '3D Printing Services in North America',
    description: 'Find verified 3D printing and additive manufacturing suppliers in North America.',
    filters: { region: 'northamerica' },
  },
  'asia': {
    type: 'region',
    label: 'Asia',
    title: '3D Printing Services in Asia',
    description: 'Find verified 3D printing and additive manufacturing suppliers in Asia.',
    filters: { region: 'asia' },
  },
};

// Build combination slugs from technology + location
function buildCombinationSlugs(): Record<string, CategoryFilter> {
  const combos: Record<string, CategoryFilter> = {};
  const keyTechs = ['sla-3d-printing', 'sls-3d-printing', 'fdm-3d-printing', 'mjf-3d-printing', 'dmls-3d-printing', 'metal-3d-printing', 'cnc-machining'];
  const keyLocations = ['germany', 'denmark', 'united-states', 'united-kingdom', 'netherlands', 'europe', 'north-america'];

  for (const techSlug of keyTechs) {
    const tech = TECHNOLOGY_SLUGS[techSlug];
    if (!tech) continue;
    for (const locSlug of keyLocations) {
      const loc = LOCATION_SLUGS[locSlug];
      if (!loc) continue;
      const comboSlug = `${techSlug}-${locSlug}`;
      combos[comboSlug] = {
        type: 'combination',
        label: `${tech.label} in ${loc.label}`,
        title: `${tech.label} Services in ${loc.label}`,
        description: `Compare verified ${tech.label.toLowerCase()} suppliers in ${loc.label}. Find the best service provider for your project.`,
        filters: {
          ...tech.filters,
          ...loc.filters,
        },
      };
    }
  }
  return combos;
}

const COMBINATION_SLUGS = buildCombinationSlugs();

// All slugs combined
const ALL_SLUGS: Record<string, CategoryFilter> = {
  ...TECHNOLOGY_SLUGS,
  ...MATERIAL_SLUGS,
  ...LOCATION_SLUGS,
  ...COMBINATION_SLUGS,
};

/**
 * Look up a category filter by slug. Returns undefined if it's not a category slug.
 */
export function getCategoryBySlug(slug: string): CategoryFilter | undefined {
  return ALL_SLUGS[slug];
}

/**
 * Check if a slug is a known category slug (not an individual supplier).
 */
export function isCategorySlug(slug: string): boolean {
  return slug in ALL_SLUGS;
}

/**
 * Get all category slugs for sitemap generation.
 */
export function getAllCategorySlugs(): { slug: string; filter: CategoryFilter }[] {
  return Object.entries(ALL_SLUGS).map(([slug, filter]) => ({ slug, filter }));
}

/**
 * Get popular category links for internal linking on the homepage.
 */
export function getPopularCategories(): { slug: string; label: string; type: string }[] {
  return [
    { slug: 'sls-3d-printing', label: 'SLS 3D Printing', type: 'technology' },
    { slug: 'sla-3d-printing', label: 'SLA 3D Printing', type: 'technology' },
    { slug: 'metal-3d-printing', label: 'Metal 3D Printing', type: 'technology' },
    { slug: 'fdm-3d-printing', label: 'FDM 3D Printing', type: 'technology' },
    { slug: 'mjf-3d-printing', label: 'Multi Jet Fusion', type: 'technology' },
    { slug: 'cnc-machining', label: 'CNC Machining', type: 'technology' },
    { slug: 'nylon-3d-printing', label: 'Nylon 3D Printing', type: 'material' },
    { slug: 'titanium-3d-printing', label: 'Titanium 3D Printing', type: 'material' },
    { slug: 'aluminum-3d-printing', label: 'Aluminum 3D Printing', type: 'material' },
    { slug: 'stainless-steel-3d-printing', label: 'Stainless Steel 3D Printing', type: 'material' },
    { slug: 'germany', label: 'Germany', type: 'location' },
    { slug: 'united-states', label: 'United States', type: 'location' },
    { slug: 'united-kingdom', label: 'United Kingdom', type: 'location' },
    { slug: 'europe', label: 'Europe', type: 'location' },
  ];
}

/**
 * Get related category slugs for a given category (for internal linking).
 */
export function getRelatedCategories(slug: string): { slug: string; label: string }[] {
  const category = ALL_SLUGS[slug];
  if (!category) return [];

  const related: { slug: string; label: string }[] = [];

  if (category.type === 'technology') {
    // Link to combinations with top locations
    const topLocations = ['germany', 'united-states', 'united-kingdom', 'europe'];
    for (const loc of topLocations) {
      const comboSlug = `${slug}-${loc}`;
      if (ALL_SLUGS[comboSlug]) {
        related.push({ slug: comboSlug, label: ALL_SLUGS[comboSlug].label });
      }
    }
    // Link to related materials
    const materialLinks = ['nylon-3d-printing', 'titanium-3d-printing', 'aluminum-3d-printing', 'resin-3d-printing'];
    for (const mat of materialLinks.slice(0, 3)) {
      if (ALL_SLUGS[mat]) {
        related.push({ slug: mat, label: ALL_SLUGS[mat].label });
      }
    }
  } else if (category.type === 'material') {
    // Link to technologies
    const techLinks = ['sls-3d-printing', 'sla-3d-printing', 'metal-3d-printing', 'fdm-3d-printing'];
    for (const tech of techLinks.slice(0, 3)) {
      if (ALL_SLUGS[tech]) {
        related.push({ slug: tech, label: ALL_SLUGS[tech].label });
      }
    }
  } else if (category.type === 'location' || category.type === 'region') {
    // Link to technology combos for this location
    const techLinks = ['sls-3d-printing', 'metal-3d-printing', 'fdm-3d-printing', 'cnc-machining'];
    for (const tech of techLinks) {
      const comboSlug = `${tech}-${slug}`;
      if (ALL_SLUGS[comboSlug]) {
        related.push({ slug: comboSlug, label: ALL_SLUGS[comboSlug].label });
      }
    }
    // Other locations
    const otherLocations = ['germany', 'united-states', 'united-kingdom', 'europe', 'denmark', 'netherlands'];
    for (const loc of otherLocations) {
      if (loc !== slug && ALL_SLUGS[loc]) {
        related.push({ slug: loc, label: ALL_SLUGS[loc].label });
      }
    }
  } else if (category.type === 'combination') {
    // Link to parent tech and location
    for (const [s, f] of Object.entries(TECHNOLOGY_SLUGS)) {
      if (slug.startsWith(s)) {
        related.push({ slug: s, label: f.label });
        break;
      }
    }
    for (const [s, f] of Object.entries(LOCATION_SLUGS)) {
      if (slug.endsWith(s)) {
        related.push({ slug: s, label: f.label });
        break;
      }
    }
  }

  return related.slice(0, 8);
}

/**
 * Get related category links for an individual supplier based on their technologies, materials, and location.
 * Used on SupplierDetail pages for internal linking to category pages.
 */
export function getSupplierRelatedCategories(
  technologies: string[],
  materials: string[],
  locationCountry: string | null
): { slug: string; label: string; type: string }[] {
  const related: { slug: string; label: string; type: string }[] = [];
  const added = new Set<string>();

  // Match technology categories
  for (const [slug, cat] of Object.entries(TECHNOLOGY_SLUGS)) {
    if (!cat.filters.technologies) continue;
    const match = technologies.some(t =>
      cat.filters.technologies!.some(ft => ft.toLowerCase() === t.toLowerCase())
    );
    if (match && !added.has(slug)) {
      related.push({ slug, label: cat.label, type: 'technology' });
      added.add(slug);
    }
  }

  // Match material categories
  for (const [slug, cat] of Object.entries(MATERIAL_SLUGS)) {
    if (!cat.filters.materials) continue;
    const match = materials.some(m =>
      cat.filters.materials!.some(fm => fm.toLowerCase() === m.toLowerCase())
    );
    if (match && !added.has(slug)) {
      related.push({ slug, label: cat.label, type: 'material' });
      added.add(slug);
    }
  }

  // Match location category
  if (locationCountry) {
    for (const [slug, cat] of Object.entries(LOCATION_SLUGS)) {
      if (!cat.filters.location_country) continue;
      const match = cat.filters.location_country.some(
        lc => lc.toLowerCase() === locationCountry.toLowerCase()
      );
      if (match && !added.has(slug)) {
        related.push({ slug, label: cat.label, type: 'location' });
        added.add(slug);
      }
    }
  }

  return related.slice(0, 12);
}

/**
 * Contextual link for internal linking on supplier detail pages.
 * Each link maps to a pSEO category page with a human-readable sentence and a filter for count queries.
 */
export interface ContextualLink {
  slug: string;
  text: string;
  countText: (count: number) => string;
  type: 'combination' | 'technology' | 'location' | 'material';
  filters: CategoryFilter['filters'];
}

/**
 * Generate contextual internal links for a supplier based on their attributes.
 * Returns links to pSEO pages with sentence templates for count-driven copy.
 */
export function getContextualLinks(
  technologies: string[],
  materials: string[],
  locationCountry: string | null
): ContextualLink[] {
  const links: ContextualLink[] = [];
  const added = new Set<string>();

  // Find matching location slug
  let locationSlug: string | null = null;
  let locationLabel: string | null = null;
  if (locationCountry) {
    for (const [slug, cat] of Object.entries(LOCATION_SLUGS)) {
      if (cat.type === 'region') continue;
      if (cat.filters.location_country?.some(lc => lc.toLowerCase() === locationCountry.toLowerCase())) {
        locationSlug = slug;
        locationLabel = cat.label;
        break;
      }
    }
  }

  // 1. Same Technology + Same Country (highest value)
  if (locationSlug && locationLabel) {
    for (const [techSlug, techCat] of Object.entries(TECHNOLOGY_SLUGS)) {
      if (!techCat.filters.technologies) continue;
      const match = technologies.some(t =>
        techCat.filters.technologies!.some(ft => ft.toLowerCase() === t.toLowerCase())
      );
      if (!match) continue;
      const comboSlug = `${techSlug}-${locationSlug}`;
      if (ALL_SLUGS[comboSlug] && !added.has(comboSlug)) {
        links.push({
          slug: comboSlug,
          text: `Looking for ${techCat.label} suppliers in ${locationLabel}?`,
          countText: (count) => `See ${count} verified options.`,
          type: 'combination',
          filters: ALL_SLUGS[comboSlug].filters,
        });
        added.add(comboSlug);
        if (links.length >= 2) break; // max 2 combo links
      }
    }
  }

  // 2. Same Technology (all countries)
  for (const [techSlug, techCat] of Object.entries(TECHNOLOGY_SLUGS)) {
    if (added.has(techSlug) || !techCat.filters.technologies) continue;
    const match = technologies.some(t =>
      techCat.filters.technologies!.some(ft => ft.toLowerCase() === t.toLowerCase())
    );
    if (match) {
      links.push({
        slug: techSlug,
        text: `Browse all ${techCat.label} suppliers worldwide.`,
        countText: (count) => `${count} suppliers listed.`,
        type: 'technology',
        filters: techCat.filters,
      });
      added.add(techSlug);
      if (links.filter(l => l.type === 'technology').length >= 2) break;
    }
  }

  // 3. Same Country (all technologies)
  if (locationSlug && locationLabel && !added.has(locationSlug)) {
    const locCat = LOCATION_SLUGS[locationSlug];
    links.push({
      slug: locationSlug,
      text: `See all 3D printing suppliers in ${locationLabel}.`,
      countText: (count) => `${count} suppliers available.`,
      type: 'location',
      filters: locCat.filters,
    });
    added.add(locationSlug);
  }

  // 4. Same Material
  for (const [matSlug, matCat] of Object.entries(MATERIAL_SLUGS)) {
    if (added.has(matSlug) || !matCat.filters.materials) continue;
    const match = materials.some(m =>
      matCat.filters.materials!.some(fm => fm.toLowerCase() === m.toLowerCase())
    );
    if (match) {
      links.push({
        slug: matSlug,
        text: `Need ${matCat.label.replace(' 3D Printing', '')}?`,
        countText: (count) => `Compare ${count} suppliers offering this material.`,
        type: 'material',
        filters: matCat.filters,
      });
      added.add(matSlug);
      if (links.filter(l => l.type === 'material').length >= 2) break;
    }
  }

  return links.slice(0, 8);
}
