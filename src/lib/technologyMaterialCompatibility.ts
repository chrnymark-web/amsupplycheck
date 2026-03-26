// Technology-Material compatibility matrix for 3D printing
// Based on industry standards and manufacturing capabilities

export interface CompatibilityMatrix {
  [technology: string]: string[];
}

// Materials compatible with each technology
export const technologyToMaterials: CompatibilityMatrix = {
  'FDM/FFF': [
    'PLA',
    'ABS (White)',
    'ABS-like (Black)',
    'ABS M30',
    'ABS+ (Stratasys)',
    'ABS M30i',
    'PETG',
    'Polycarbonate',
    'PC/PC-ABS',
    'PEI ULTEM 1010',
    'PEI ULTEM 9085',
    'ULTEM 9085',
    'HIPS',
    'Nylon PA-12',
    'Nylon 12',
    'PA-12',
    'TPU (Flexible)',
    'Carbon Fiber Reinforced',
    'Kevlar Reinforced',
    'Wood Filled PLA',
    'Polypropylene Natural'
  ],
  
  'SLA': [
    'Clear Resin',
    'Standard Resin',
    'Tough Resin 2000',
    'High Temp Resin',
    'Durable Resin',
    'Flexible Resin 80A',
    'Somos WaterClear Ultra',
    'Photopolymer Rigid',
    'Accura 25'
  ],
  
  'DLP': [
    'Clear Resin',
    'Standard Resin',
    'Tough Resin 2000',
    'High Temp Resin',
    'Durable Resin',
    'Flexible Resin 80A',
    'Photopolymer Rigid',
    'Accura 25'
  ],
  
  'CDLP (Continuous Digital Light Processing)': [
    'Clear Resin',
    'Standard Resin',
    'Tough Resin 2000',
    'High Temp Resin',
    'Durable Resin',
    'Flexible Resin 80A',
    'Photopolymer Rigid'
  ],
  
  'SLS': [
    'Nylon PA-12',
    'Nylon 12',
    'PA-12',
    'PA-11 (SLS)',
    'PA-12 Carbon Filled',
    'Nylon 12 Mineral Filled',
    'Nylon 12 Glass Filled',
    'Nylon 12 Flame Retardant',
    'Nylon 12 Aluminum Filled',
    'PA Aluminum Filled',
    'PA Glass Filled',
    'DuraForm PA Nylon 12',
    'SLS PA12 PA2200',
    'PA-12 BlueSint',
    'Nylon PA-12 Blue Metal',
    'TPU (Flexible)',
    'SLS Flexible TPU',
    'Polycarbonate',
    'DuraForm HST',
    'DuraForm TPU',
    'DuraForm EX',
    'DuraForm GF Glass Filled Nylon'
  ],
  
  'Multi Jet Fusion': [
    'Nylon PA-12',
    'Nylon 12',
    'PA-12',
    'MJF PA12',
    'PA-11 (SLS)',
    'TPU (Flexible)',
    'TPU MJF',
    'Ultrasint TPU01 MJF',
    'Polypropylene (MJF)',
    'Polypropylene-P',
    'PA-12 Carbon Filled',
    'Nylon 12 Glass Filled'
  ],
  
  'SAF': [
    'Nylon PA-12',
    'PA-12',
    'PA-11 (SLS)',
    'SAF PA11 Eco',
    'TPU (Flexible)',
    'Polypropylene (MJF)'
  ],
  
  'DMLS': [
    'Stainless Steel 316L',
    'Stainless Steel 17-4PH',
    'Titanium Ti-6Al-4V',
    'Aluminum AlSi10Mg',
    'Inconel 718',
    'Inconel 625',
    'Nickel 625',
    'Maraging Steel',
    'Steel',
    'Bronze',
    '420i 420SS Bronze'
  ],
  
  'SLM': [
    'Stainless Steel 316L',
    'Stainless Steel 17-4PH',
    'Titanium Ti-6Al-4V',
    'Aluminum AlSi10Mg',
    'Inconel 718',
    'Inconel 625',
    'Nickel 625',
    'Maraging Steel',
    'Steel'
  ],
  
  'Direct Metal Printing': [
    'Stainless Steel 316L',
    'Stainless Steel 17-4PH',
    'Titanium Ti-6Al-4V',
    'Aluminum AlSi10Mg',
    'Inconel 718',
    'Inconel 625',
    'Nickel 625',
    'Maraging Steel',
    'Steel',
    'Bronze'
  ],
  
  'Material Jetting': [
    'Photopolymer Rigid',
    'Clear Resin',
    'Tough Resin 2000',
    'Flexible Resin 80A',
    'ABS-like (Black)',
    'Polypropylene-P'
  ],
  
  'Binder Jetting': [
    'Stainless Steel 316L',
    'Stainless Steel 17-4PH',
    'Bronze',
    'Steel',
    'Gold Plated Brass',
    '420i 420SS Bronze'
  ]
};

// Technologies compatible with each material (reverse mapping)
export const materialToTechnologies: CompatibilityMatrix = {};

// Build reverse mapping
Object.entries(technologyToMaterials).forEach(([technology, materials]) => {
  materials.forEach(material => {
    if (!materialToTechnologies[material]) {
      materialToTechnologies[material] = [];
    }
    materialToTechnologies[material].push(technology);
  });
});

/**
 * Get materials compatible with selected technologies
 * If no technologies selected, returns all materials
 */
export function getCompatibleMaterials(selectedTechnologies: string[]): string[] {
  if (selectedTechnologies.length === 0) {
    return [];
  }
  
  // Get union of all compatible materials for selected technologies
  const compatibleMaterials = new Set<string>();
  selectedTechnologies.forEach(tech => {
    const materials = technologyToMaterials[tech] || [];
    materials.forEach(material => compatibleMaterials.add(material));
  });
  
  return Array.from(compatibleMaterials).sort();
}

/**
 * Get technologies compatible with selected materials
 * If no materials selected, returns all technologies
 */
export function getCompatibleTechnologies(selectedMaterials: string[]): string[] {
  if (selectedMaterials.length === 0) {
    return [];
  }
  
  // Get union of all compatible technologies for selected materials
  const compatibleTechs = new Set<string>();
  selectedMaterials.forEach(material => {
    const techs = materialToTechnologies[material] || [];
    techs.forEach(tech => compatibleTechs.add(tech));
  });
  
  return Array.from(compatibleTechs).sort();
}

/**
 * Check if a material is compatible with any of the selected technologies
 */
export function isMaterialCompatible(material: string, selectedTechnologies: string[]): boolean {
  if (selectedTechnologies.length === 0) return true;
  
  const compatibleTechs = materialToTechnologies[material] || [];
  return selectedTechnologies.some(tech => compatibleTechs.includes(tech));
}

/**
 * Check if a technology is compatible with any of the selected materials
 */
export function isTechnologyCompatible(technology: string, selectedMaterials: string[]): boolean {
  if (selectedMaterials.length === 0) return true;
  
  const compatibleMaterials = technologyToMaterials[technology] || [];
  return selectedMaterials.some(material => compatibleMaterials.includes(material));
}

// ============================================
// CATEGORIZATION: Technology & Material Groups
// ============================================

export interface CategoryGroup {
  name: string;
  items: string[];
}

// Technology categories for grouped display
export const technologyCategories: CategoryGroup[] = [
  {
    name: 'Filament (FFF)',
    items: ['FDM/FFF']
  },
  {
    name: 'Resin (SLA/DLP)',
    items: ['SLA', 'DLP', 'CDLP (Continuous Digital Light Processing)', 'Material Jetting']
  },
  {
    name: 'Powder - Polymer',
    items: ['SLS', 'Multi Jet Fusion', 'SAF']
  },
  {
    name: 'Powder - Metal',
    items: ['DMLS', 'SLM', 'Direct Metal Printing', 'Binder Jetting']
  },
  {
    name: 'Extrusion (Large Scale)',
    items: ['FGF', 'LSAM']
  }
];

// Material categories for grouped display
export const materialCategories: CategoryGroup[] = [
  {
    name: 'Polymers (Plast)',
    items: [
      'PLA', 'ABS (White)', 'ABS-like (Black)', 'ABS M30', 'ABS+ (Stratasys)', 'ABS M30i',
      'PETG', 'Polycarbonate', 'PC/PC-ABS', 'HIPS',
      'Nylon PA-12', 'Nylon 12', 'PA-12', 'PA-11 (SLS)', 'PA-12 Carbon Filled',
      'Nylon 12 Mineral Filled', 'Nylon 12 Glass Filled', 'Nylon 12 Flame Retardant',
      'Nylon 12 Aluminum Filled', 'PA Aluminum Filled', 'PA Glass Filled',
      'DuraForm PA Nylon 12', 'MJF PA12', 'SLS PA12 PA2200', 'PA-12 BlueSint',
      'Nylon PA-12 Blue Metal', 'SAF PA11 Eco', 'DuraForm HST', 'DuraForm EX', 'DuraForm GF Glass Filled Nylon',
      'Polypropylene (MJF)', 'Polypropylene-P', 'Polypropylene Natural'
    ]
  },
  {
    name: 'High-Performance Polymers',
    items: [
      'PEI ULTEM 1010', 'PEI ULTEM 9085', 'ULTEM 9085'
    ]
  },
  {
    name: 'Flexible Materials',
    items: [
      'TPU (Flexible)', 'TPU MJF', 'SLS Flexible TPU', 'Ultrasint TPU01 MJF',
      'Flexible Resin 80A', 'DuraForm TPU'
    ]
  },
  {
    name: 'Resins (Photopolymers)',
    items: [
      'Clear Resin', 'Standard Resin', 'Tough Resin 2000', 'High Temp Resin',
      'Durable Resin', 'Somos WaterClear Ultra', 'Photopolymer Rigid', 'Accura 25'
    ]
  },
  {
    name: 'Composites',
    items: [
      'Carbon Fiber Reinforced', 'Kevlar Reinforced', 'Wood Filled PLA'
    ]
  },
  {
    name: 'Metals',
    items: [
      'Stainless Steel 316L', 'Stainless Steel 17-4PH', 'Titanium Ti-6Al-4V',
      'Aluminum AlSi10Mg', 'Inconel 718', 'Inconel 625', 'Nickel 625',
      'Maraging Steel', 'Steel', 'Bronze', '420i 420SS Bronze', 'Gold Plated Brass'
    ]
  }
];

// ============================================
// PRICE INDEX: Relative pricing for technologies and materials
// ============================================

// Relative price index (FDM/PLA = 1.0 as baseline)
export const technologyPriceIndex: Record<string, number> = {
  'FDM/FFF': 1.0,
  'SLA': 1.8,
  'DLP': 1.6,
  'CDLP (Continuous Digital Light Processing)': 2.0,
  'SLS': 2.5,
  'Multi Jet Fusion': 2.8,
  'SAF': 2.6,
  'DMLS': 8.0,
  'SLM': 9.0,
  'Direct Metal Printing': 8.5,
  'Material Jetting': 4.0,
  'Binder Jetting': 5.0
};

export const materialPriceIndex: Record<string, number> = {
  // Low cost
  'PLA': 1.0,
  'ABS (White)': 1.2,
  'ABS-like (Black)': 1.3,
  'ABS M30': 1.5,
  'ABS+ (Stratasys)': 1.6,
  'ABS M30i': 1.7,
  'PETG': 1.3,
  'HIPS': 1.1,
  'Wood Filled PLA': 1.4,
  
  // Medium cost - Standard polymers
  'Polycarbonate': 2.5,
  'PC/PC-ABS': 2.8,
  'Nylon PA-12': 3.0,
  'Nylon 12': 3.0,
  'PA-12': 3.0,
  'PA-11 (SLS)': 3.2,
  'MJF PA12': 3.2,
  'SLS PA12 PA2200': 3.0,
  'PA-12 BlueSint': 3.1,
  'Nylon PA-12 Blue Metal': 3.3,
  'SAF PA11 Eco': 2.8,
  'DuraForm PA Nylon 12': 3.0,
  'DuraForm HST': 3.5,
  'DuraForm EX': 3.2,
  'Polypropylene (MJF)': 2.8,
  'Polypropylene-P': 2.6,
  'Polypropylene Natural': 2.4,
  
  // Medium-high cost - Reinforced polymers
  'PA-12 Carbon Filled': 4.0,
  'Nylon 12 Mineral Filled': 3.5,
  'Nylon 12 Glass Filled': 3.8,
  'Nylon 12 Flame Retardant': 4.0,
  'Nylon 12 Aluminum Filled': 4.2,
  'PA Aluminum Filled': 4.2,
  'PA Glass Filled': 3.8,
  'DuraForm GF Glass Filled Nylon': 4.0,
  'Carbon Fiber Reinforced': 5.0,
  'Kevlar Reinforced': 5.5,
  
  // Medium-high cost - Flexible
  'TPU (Flexible)': 2.5,
  'TPU MJF': 3.0,
  'SLS Flexible TPU': 3.2,
  'Ultrasint TPU01 MJF': 3.5,
  'DuraForm TPU': 3.2,
  'Flexible Resin 80A': 2.8,
  
  // Medium cost - Resins
  'Standard Resin': 1.8,
  'Clear Resin': 2.0,
  'Tough Resin 2000': 2.5,
  'High Temp Resin': 3.0,
  'Durable Resin': 2.5,
  'Somos WaterClear Ultra': 3.0,
  'Photopolymer Rigid': 2.2,
  'Accura 25': 2.8,
  
  // High cost - High-performance polymers
  'PEI ULTEM 1010': 6.0,
  'PEI ULTEM 9085': 5.5,
  'ULTEM 9085': 5.5,
  
  // Very high cost - Metals
  'Stainless Steel 316L': 8.0,
  'Stainless Steel 17-4PH': 9.0,
  'Steel': 7.0,
  'Maraging Steel': 10.0,
  'Aluminum AlSi10Mg': 8.5,
  'Bronze': 7.5,
  '420i 420SS Bronze': 7.5,
  'Gold Plated Brass': 12.0,
  
  // Premium metals
  'Titanium Ti-6Al-4V': 15.0,
  'Inconel 718': 18.0,
  'Inconel 625': 17.0,
  'Nickel 625': 16.0
};

// Get price tier label from index
export function getPriceTier(priceIndex: number): { label: string; symbol: string } {
  if (priceIndex <= 1.5) return { label: 'Low cost', symbol: '€' };
  if (priceIndex <= 3.5) return { label: 'Medium cost', symbol: '€€' };
  if (priceIndex <= 7.0) return { label: 'High cost', symbol: '€€€' };
  return { label: 'Premium', symbol: '€€€€' };
}

// ============================================
// REQUIREMENTS: Property-based filtering
// ============================================

export const SEARCH_REQUIREMENTS = [
  'High strength',
  'High precision',
  'Heat resistant',
  'Chemical resistant',
  'Flexible/Elastic',
  'Biocompatible',
  'Food-grade',
  'Cosmetic finish',
  'Outdoor/UV resistant',
  'Low cost'
] as const;

export type SearchRequirement = typeof SEARCH_REQUIREMENTS[number];

// Maps requirements to compatible technologies
export const requirementToTechnologies: Record<SearchRequirement, string[]> = {
  'High strength': ['SLS', 'Multi Jet Fusion', 'DMLS', 'SLM', 'Direct Metal Printing', 'FDM/FFF'],
  'High precision': ['SLA', 'DLP', 'Material Jetting', 'CDLP (Continuous Digital Light Processing)'],
  'Heat resistant': ['DMLS', 'SLM', 'Direct Metal Printing', 'FDM/FFF', 'SLS'],
  'Chemical resistant': ['SLS', 'Multi Jet Fusion', 'DMLS', 'SLM'],
  'Flexible/Elastic': ['FDM/FFF', 'SLS', 'Multi Jet Fusion', 'SAF', 'SLA', 'DLP'],
  'Biocompatible': ['SLA', 'DLP', 'SLS', 'DMLS'],
  'Food-grade': ['SLS', 'Multi Jet Fusion', 'FDM/FFF'],
  'Cosmetic finish': ['SLA', 'DLP', 'Material Jetting', 'CDLP (Continuous Digital Light Processing)'],
  'Outdoor/UV resistant': ['SLS', 'Multi Jet Fusion', 'FDM/FFF', 'DMLS', 'SLM'],
  'Low cost': ['FDM/FFF', 'SLA', 'DLP']
};

// Maps requirements to compatible materials
export const requirementToMaterials: Record<SearchRequirement, string[]> = {
  'High strength': [
    'Nylon PA-12', 'PA-12 Carbon Filled', 'Carbon Fiber Reinforced', 'Kevlar Reinforced',
    'Stainless Steel 316L', 'Titanium Ti-6Al-4V', 'Maraging Steel', 'Inconel 718',
    'PC/PC-ABS', 'Polycarbonate', 'DuraForm GF Glass Filled Nylon', 'Nylon 12 Glass Filled'
  ],
  'High precision': [
    'Clear Resin', 'Standard Resin', 'Tough Resin 2000', 'Photopolymer Rigid',
    'Somos WaterClear Ultra', 'Accura 25'
  ],
  'Heat resistant': [
    'PEI ULTEM 1010', 'PEI ULTEM 9085', 'ULTEM 9085', 'High Temp Resin',
    'Titanium Ti-6Al-4V', 'Inconel 718', 'Inconel 625', 'Stainless Steel 316L'
  ],
  'Chemical resistant': [
    'PA-11 (SLS)', 'Polypropylene (MJF)', 'Polypropylene-P', 'PETG',
    'Stainless Steel 316L', 'Titanium Ti-6Al-4V', 'Inconel 625'
  ],
  'Flexible/Elastic': [
    'TPU (Flexible)', 'TPU MJF', 'SLS Flexible TPU', 'Ultrasint TPU01 MJF',
    'Flexible Resin 80A', 'DuraForm TPU'
  ],
  'Biocompatible': [
    'Clear Resin', 'PA-11 (SLS)', 'Titanium Ti-6Al-4V', 'Stainless Steel 316L'
  ],
  'Food-grade': [
    'PA-11 (SLS)', 'Polypropylene (MJF)', 'Stainless Steel 316L'
  ],
  'Cosmetic finish': [
    'Clear Resin', 'Standard Resin', 'Somos WaterClear Ultra', 'Photopolymer Rigid', 'Accura 25'
  ],
  'Outdoor/UV resistant': [
    'PA-12', 'Nylon PA-12', 'PA-11 (SLS)', 'Stainless Steel 316L', 'Titanium Ti-6Al-4V', 'ASA'
  ],
  'Low cost': [
    'PLA', 'ABS (White)', 'PETG', 'Standard Resin', 'HIPS'
  ]
};

// Get technologies matching requirements
export function getTechnologiesForRequirements(requirements: SearchRequirement[]): string[] {
  if (requirements.length === 0) return [];
  
  const techSets = requirements.map(req => new Set(requirementToTechnologies[req]));
  // Return intersection of all requirement sets
  const intersection = techSets.reduce((acc, set) => 
    new Set([...acc].filter(x => set.has(x)))
  );
  
  return Array.from(intersection).sort();
}

// Get materials matching requirements
export function getMaterialsForRequirements(requirements: SearchRequirement[]): string[] {
  if (requirements.length === 0) return [];
  
  const matSets = requirements.map(req => new Set(requirementToMaterials[req]));
  // Return intersection of all requirement sets
  const intersection = matSets.reduce((acc, set) => 
    new Set([...acc].filter(x => set.has(x)))
  );
  
  return Array.from(intersection).sort();
}
