// Master list of all valid materials and technologies for the 3D printing database
// These are the canonical database keys that should be used consistently

// ============ VALID TECHNOLOGIES ============
export const VALID_TECHNOLOGIES = [
  'fdm',
  'sla',
  'sls',
  'mjf',
  'dmls',
  'slm',
  'material-jetting',
  'binder-jetting',
  'dlp',
  'saf',
  'dmp',
  'cdlp',
  'ebm',
  'lpbf',
  'polyjet',
  'clip',
  'micro-laser-sintering',
  'waam',
  'cold-spray',
  'lens',
  'dmd',
] as const;

// ============ VALID MATERIALS ============
export const VALID_MATERIALS = [
  // === METALS ===
  // Titanium
  'titanium',
  'titanium-ti-6al-4v',
  'titanium-grade-2',
  'titanium-grade-5',
  'titanium-ti-6al-4v-eli',
  
  // Aluminum
  'aluminum',
  'aluminum-aisi10mg',
  'aluminum-alsi10mg',
  'aluminum-alsi7mg',
  'aluminum-alsi12',
  'aluminum-6061',
  'aluminum-7075',
  'scalmalloy',
  
  // Stainless Steel
  'stainless-steel',
  'stainless-steel-316l',
  'stainless-steel-17-4ph',
  'stainless-steel-304',
  'stainless-steel-303',
  'stainless-steel-15-5ph',
  
  // Tool Steel
  'tool-steel',
  'tool-steel-h13',
  'tool-steel-m2',
  'tool-steel-d2',
  
  // Maraging Steel
  'maraging-steel',
  'maraging-steel-ms1',
  '1.2709',
  
  // Inconel / Nickel Alloys
  'inconel',
  'inconel-625',
  'inconel-718',
  'ni625',
  'hastelloy-x',
  'haynes-282',
  
  // Cobalt Chrome
  'cobalt-chrome',
  'cocr',
  'cocr-f75',
  'stellite',
  
  // Copper
  'copper',
  'copper-cuw',
  'grcop-84',
  'grcop-42',
  
  // Bronze / Brass
  'bronze',
  'brass',
  'gold-plated-brass',
  '420i-420ss-brz',
  
  // Other Metals
  'steel',
  'tungsten',
  'molybdenum',
  'tantalum',
  'precious-metals',
  'gold',
  'silver',
  'platinum',

  // === POLYMERS / THERMOPLASTICS ===
  // PLA
  'pla',
  'standardpla',
  'pla-plus',
  'wood-pla',
  'woodfilledpla',
  
  // ABS
  'abs',
  'abs-m30-stratasys',
  'abs-white',
  'abs-like-black',
  'absplus-stratasys',
  'abs-m30i',
  'abs-esd7',
  
  // Nylon / Polyamide
  'nylon',
  'nylon-pa-12',
  'nylon-12',
  'pa-12',
  'pa-11',
  'pa11-sls',
  'pa-12-carbon-filled',
  'nylon-12-mineral-filled-hst',
  'nylon-12-glass-bead-filled-gf',
  'nylon-12-glass-filled',
  'nylon-12-flame-retardant-fr',
  'nylon-12-aluminum-filled-af',
  'pa-af',
  'pa-gf',
  'pa-cf',
  'nylon-6',
  'nylon-66',
  'mjf_pa12',
  'sls_pa12_pa2200',
  'pa-12-bluesint',
  'nylon-pa-12-blue-metal',
  'saf_pa11_eco',
  'duraform-pa-nylon-12',
  'duraform-hst',
  'duraform-ex',
  'duraform-gf-glass-filled-nylon',
  'duraform-af',
  'ultrasint-pa6',
  
  // PETG
  'petg',
  
  // Polycarbonate
  'pc',
  'polycarbonate',
  'pc-or-pc-abs',
  'pc-abs',
  'pc-iso',
  
  // TPU / Flexible
  'tpu',
  'tpu-70-a-white',
  'tpu-mjf',
  'sls_flexible_tpu',
  'ultrasint_tpu01_mjf',
  'duraform-tpu',
  'elastomer',
  'flexible',
  
  // Polypropylene
  'polypropylene',
  'polypropylene-mjf',
  'polypropylene-p',
  'pp-natural',
  'pp',
  
  // High Performance Polymers
  'peek',
  'pekk',
  'pei',
  'pei-ultem-1010-stratasys',
  'pei-ultem-9085-stratasys',
  'ultem-9085',
  'ultem-1010',
  'pps',
  'ppsu',
  'psu',
  
  // Other Thermoplastics
  'hips',
  'asa',
  'pom',
  'pbt',
  'acetal',
  
  // Carbon Fiber Reinforced
  'carbon-fiber',
  'carbonfiberreinforcedfilaments',
  'carbon-fiber-nylon',
  'carbon-fiber-petg',
  'carbon-fiber-peek',
  'chopped-carbon-fiber',
  'continuous-carbon-fiber',
  
  // Glass Fiber Reinforced
  'glass-fiber',
  'glass-filled-nylon',
  'gf-nylon',
  
  // Kevlar
  'kevlar',
  'kevlarreinforcedfilaments',
  'aramid',
  
  // === RESINS / PHOTOPOLYMERS ===
  'resin',
  'photopolymer-rigid',
  'standard-resin',
  'formlabs-standard-resin',
  'clear-resin',
  'formlabs-clear-resin',
  'tough-resin',
  'formlabs-tough-resin-2000',
  'durable-resin',
  'formlabs-durable-resin',
  'flexible-resin',
  'formlabs-flexible-resin-80a',
  'high-temp-resin',
  'formlabs-high-temp-resin',
  'dental-resin',
  'castable-resin',
  'ceramic-filled-resin',
  'somos-waterclear-ultra-10122',
  'accura-25',
  'accura-xtreme',
  'accura-clearvue',
  'digital-abs',
  'vero',
  'veroclear',
  'veroflex',
  'verowhite',
  'veroblack',
  'polyjet-resin',
  'biocompatible-resin',
  'medical-resin',
  
  // === CERAMICS ===
  'ceramic',
  'alumina',
  'zirconia',
  'silicon-carbide',
  'silicon-nitride',
  
  // === COMPOSITES ===
  'composite',
  'metal-matrix-composite',
  'ceramic-matrix-composite',
  
  // === OTHER / SPECIALTY ===
  'wax',
  'sand',
  'silicone',
  'foam',
  'food-safe',
  'esd-safe',
  'flame-retardant',
  'uv-resistant',
] as const;

// Type definitions
export type ValidTechnology = typeof VALID_TECHNOLOGIES[number];
export type ValidMaterial = typeof VALID_MATERIALS[number];

// ============ SYNONYMS / ALIASES ============
// Maps common variations, brand names, and abbreviations to the canonical database key
export const MATERIAL_SYNONYMS: Record<string, string[]> = {
  // Titanium synonyms
  'titanium': ['ti', 'ti6al4v', 'ti-6al-4v', 'ti64', 'grade 5 titanium', 'titanium alloy', 'titanium metal'],
  'titanium-ti-6al-4v': ['ti6al4v', 'ti-6al-4v', 'ti64', 'grade 5 titanium', 'titanium grade 5', 'tc4'],
  
  // Aluminum synonyms
  'aluminum': ['aluminium', 'alu', 'al', 'aluminum alloy'],
  'aluminum-alsi10mg': ['alsi10mg', 'al-si10mg', 'a360', 'aluminum silicon'],
  
  // Stainless Steel synonyms
  'stainless-steel': ['ss', 'inox', 'stainless'],
  'stainless-steel-316l': ['ss316l', '316l', '1.4404', 'aisi 316l'],
  'stainless-steel-17-4ph': ['17-4ph', '17-4 ph', '1.4542', 'ph 17-4'],
  
  // Inconel synonyms
  'inconel-718': ['in718', 'alloy 718', 'uns n07718', 'nickel 718'],
  'inconel-625': ['in625', 'alloy 625', 'uns n06625', 'nickel 625'],
  
  // Cobalt Chrome synonyms
  'cobalt-chrome': ['cocr', 'cobalt chromium', 'stellite', 'mp1', 'f75'],
  
  // Nylon synonyms
  'nylon-pa-12': ['pa12', 'pa 12', 'polyamide 12', 'nylon 12', 'pa2200', 'pa 2200'],
  'pa-11': ['pa11', 'pa 11', 'polyamide 11', 'nylon 11', 'rilsan'],
  
  // High-performance polymers
  'peek': ['polyetheretherketone', 'victrex'],
  'pei': ['ultem', 'polyetherimide'],
  'ultem-9085': ['pei 9085', 'ultem9085', '9085'],
  
  // Carbon fiber synonyms
  'carbon-fiber': ['cf', 'cfrp', 'carbon fibre', 'carbon reinforced'],
  
  // TPU synonyms
  'tpu': ['thermoplastic polyurethane', 'flexible tpu', 'tpu flexible'],
  
  // Resin synonyms
  'resin': ['photopolymer', 'uv resin', 'photo resin'],
};

export const TECHNOLOGY_SYNONYMS: Record<string, string[]> = {
  'fdm': ['fff', 'fused deposition modeling', 'fused filament fabrication', 'extrusion', 'material extrusion'],
  'sla': ['stereolithography', 'laser stereolithography', 'vat photopolymerization'],
  'sls': ['selective laser sintering', 'laser sintering', 'powder bed fusion polymer'],
  'mjf': ['multi jet fusion', 'hp mjf', 'hp multi jet fusion', 'multijet fusion'],
  'dmls': ['direct metal laser sintering', 'metal laser sintering'],
  'slm': ['selective laser melting', 'laser powder bed fusion', 'lpbf metal'],
  'ebm': ['electron beam melting', 'electron beam additive'],
  'lpbf': ['laser powder bed fusion', 'l-pbf', 'powder bed fusion metal'],
  'binder-jetting': ['binder jet', 'inkjet', 'metal binder jetting', 'sand binder jetting'],
  'material-jetting': ['polyjet', 'multijet', 'inkjet 3d printing'],
  'dlp': ['digital light processing', 'digital light projection', 'masked stereolithography'],
  'polyjet': ['multi-material jetting', 'stratasys polyjet', 'j series'],
  'waam': ['wire arc additive', 'wire arc additive manufacturing', 'wire + arc'],
  'dmp': ['direct metal printing', '3d systems metal'],
  'saf': ['selective absorption fusion', 'h350', 'stratasys saf'],
};

// ============ MATERIAL CATEGORIES ============
// Groups materials into logical categories for UI and fuzzy matching
export const MATERIAL_CATEGORIES: Record<string, string[]> = {
  'metal': [
    'titanium', 'titanium-ti-6al-4v', 'titanium-grade-2', 'titanium-grade-5',
    'aluminum', 'aluminum-aisi10mg', 'aluminum-alsi10mg', 'aluminum-alsi7mg',
    'stainless-steel', 'stainless-steel-316l', 'stainless-steel-17-4ph',
    'inconel', 'inconel-625', 'inconel-718', 'ni625',
    'cobalt-chrome', 'cocr', 'maraging-steel', 'tool-steel',
    'copper', 'bronze', 'brass', 'steel', 'tungsten'
  ],
  'plastic': [
    'pla', 'abs', 'petg', 'nylon', 'pc', 'polycarbonate', 'tpu', 'pp', 'polypropylene',
    'nylon-pa-12', 'pa-12', 'pa-11', 'hips', 'asa', 'pom'
  ],
  'high-performance-polymer': [
    'peek', 'pekk', 'pei', 'ultem-9085', 'ultem-1010', 'pps', 'ppsu'
  ],
  'resin': [
    'resin', 'standard-resin', 'clear-resin', 'tough-resin', 'durable-resin',
    'flexible-resin', 'high-temp-resin', 'dental-resin', 'castable-resin'
  ],
  'composite': [
    'carbon-fiber', 'carbonfiberreinforcedfilaments', 'glass-fiber', 'kevlar',
    'carbon-fiber-nylon', 'glass-filled-nylon', 'pa-cf', 'pa-gf'
  ],
  'ceramic': [
    'ceramic', 'alumina', 'zirconia', 'silicon-carbide', 'silicon-nitride'
  ]
};

// ============ HELPER FUNCTIONS ============

/**
 * Find the canonical material key from a search term or synonym
 */
export function findMaterialKey(searchTerm: string): string | undefined {
  const normalized = searchTerm.toLowerCase().trim();
  
  // Direct match
  if (VALID_MATERIALS.includes(normalized as ValidMaterial)) {
    return normalized;
  }
  
  // Check synonyms
  for (const [key, synonyms] of Object.entries(MATERIAL_SYNONYMS)) {
    if (synonyms.some(s => s.toLowerCase() === normalized)) {
      return key;
    }
  }
  
  // Partial match
  const partialMatch = VALID_MATERIALS.find(m => 
    m.includes(normalized) || normalized.includes(m)
  );
  
  return partialMatch;
}

/**
 * Find the canonical technology key from a search term or synonym
 */
export function findTechnologyKey(searchTerm: string): string | undefined {
  const normalized = searchTerm.toLowerCase().trim();
  
  // Direct match
  if (VALID_TECHNOLOGIES.includes(normalized as ValidTechnology)) {
    return normalized;
  }
  
  // Check synonyms
  for (const [key, synonyms] of Object.entries(TECHNOLOGY_SYNONYMS)) {
    if (synonyms.some(s => s.toLowerCase() === normalized)) {
      return key;
    }
  }
  
  // Partial match
  const partialMatch = VALID_TECHNOLOGIES.find(t => 
    t.includes(normalized) || normalized.includes(t)
  );
  
  return partialMatch;
}

/**
 * Get related materials that should also match when searching for a specific material
 * For fuzzy/expanded search functionality
 */
export function getRelatedMaterials(material: string): string[] {
  const normalized = material.toLowerCase().trim();
  const related: string[] = [normalized];
  
  // Find category
  for (const [category, materials] of Object.entries(MATERIAL_CATEGORIES)) {
    if (materials.includes(normalized)) {
      // If searching for a specific metal, also include parent category
      if (category === 'metal') {
        related.push('metal');
      }
      break;
    }
  }
  
  // If searching for parent category (e.g., "titanium"), include all variants
  const categoryMaterials = MATERIAL_CATEGORIES[normalized];
  if (categoryMaterials) {
    related.push(...categoryMaterials);
  }
  
  // Add materials that contain the search term
  VALID_MATERIALS.forEach(m => {
    if (m.includes(normalized) && !related.includes(m)) {
      related.push(m);
    }
  });
  
  return [...new Set(related)];
}

/**
 * Get all materials in a category
 */
export function getMaterialsInCategory(category: string): string[] {
  return MATERIAL_CATEGORIES[category.toLowerCase()] || [];
}

/**
 * Check if a material belongs to a category
 */
export function isMaterialInCategory(material: string, category: string): boolean {
  const categoryMaterials = MATERIAL_CATEGORIES[category.toLowerCase()];
  return categoryMaterials ? categoryMaterials.includes(material.toLowerCase()) : false;
}

// ============ DISPLAY NAME MAPPINGS ============
export const MATERIAL_DISPLAY_NAMES: Record<string, string> = {
  // Metals
  'titanium': 'Titanium',
  'titanium-ti-6al-4v': 'Titanium Ti-6Al-4V',
  'aluminum': 'Aluminum',
  'aluminum-alsi10mg': 'Aluminum AlSi10Mg',
  'stainless-steel': 'Stainless Steel',
  'stainless-steel-316l': 'Stainless Steel 316L',
  'stainless-steel-17-4ph': 'Stainless Steel 17-4PH',
  'inconel-625': 'Inconel 625',
  'inconel-718': 'Inconel 718',
  'cobalt-chrome': 'Cobalt Chrome',
  'maraging-steel': 'Maraging Steel',
  'copper': 'Copper',
  'bronze': 'Bronze',
  'steel': 'Steel',
  // Polymers
  'pla': 'PLA',
  'abs': 'ABS',
  'petg': 'PETG',
  'nylon': 'Nylon',
  'nylon-pa-12': 'Nylon PA-12',
  'pa-12': 'PA-12',
  'pa-11': 'PA-11',
  'pc': 'Polycarbonate',
  'tpu': 'TPU',
  'peek': 'PEEK',
  'pei': 'PEI/ULTEM',
  'ultem-9085': 'ULTEM 9085',
  // Resins
  'resin': 'Resin',
  'standard-resin': 'Standard Resin',
  'clear-resin': 'Clear Resin',
  'tough-resin': 'Tough Resin',
  // Composites
  'carbon-fiber': 'Carbon Fiber',
  'glass-fiber': 'Glass Fiber',
};

export const TECHNOLOGY_DISPLAY_NAMES: Record<string, string> = {
  'fdm': 'FDM/FFF',
  'sla': 'SLA',
  'sls': 'SLS',
  'mjf': 'Multi Jet Fusion (MJF)',
  'dmls': 'DMLS',
  'slm': 'SLM',
  'ebm': 'EBM',
  'lpbf': 'LPBF',
  'binder-jetting': 'Binder Jetting',
  'material-jetting': 'Material Jetting',
  'dlp': 'DLP',
  'polyjet': 'PolyJet',
  'dmp': 'Direct Metal Printing',
  'saf': 'SAF',
  'waam': 'WAAM',
};
