// Technology glossary with detailed descriptions for non-experts

export interface TechnologyInfo {
  abbreviation: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  bestFor: string[];
  limitations: string[];
  typicalMaterials: string[];
  priceRange: 'low' | 'medium' | 'high' | 'very-high';
  strengthLevel: 1 | 2 | 3 | 4 | 5;
  detailLevel: 1 | 2 | 3 | 4 | 5;
  speedLevel: 1 | 2 | 3 | 4 | 5;
  category: 'polymer' | 'metal' | 'resin' | 'composite';
}

export const TECHNOLOGY_GLOSSARY: Record<string, TechnologyInfo> = {
  // Resin-based technologies
  'SLA': {
    abbreviation: 'SLA',
    name: 'Stereolithography',
    shortDescription: 'UV laser cures liquid resin layer by layer with high precision.',
    longDescription: 'SLA uses a UV laser to cure liquid photopolymer resin point by point. It produces extremely smooth surfaces and fine details, but parts can be brittle and UV-sensitive over time.',
    bestFor: ['Prototypes with fine details', 'Jewelry and dental models', 'Transparent parts', 'Precision parts'],
    limitations: ['UV-sensitive material', 'Lower mechanical strength', 'Requires post-processing'],
    typicalMaterials: ['Standard Resin', 'Tough Resin', 'Flexible Resin', 'Clear Resin', 'Dental Resin'],
    priceRange: 'medium',
    strengthLevel: 2,
    detailLevel: 5,
    speedLevel: 2,
    category: 'resin',
  },
  'DLP': {
    abbreviation: 'DLP',
    name: 'Digital Light Processing',
    shortDescription: 'Projector cures entire layers at once - faster than SLA.',
    longDescription: 'DLP uses a digital projector to cure an entire layer of resin at once, making it faster than SLA. Suitable for small parts with high detail, but limited build size.',
    bestFor: ['Small parts with fine details', 'Dental models', 'Jewelry', 'Rapid prototyping'],
    limitations: ['Limited build size', 'UV-sensitive material', 'Requires post-processing'],
    typicalMaterials: ['Standard Resin', 'Tough Resin', 'Castable Resin', 'Dental Resin'],
    priceRange: 'medium',
    strengthLevel: 2,
    detailLevel: 5,
    speedLevel: 3,
    category: 'resin',
  },
  'Material Jetting': {
    abbreviation: 'MJ',
    name: 'Material Jetting',
    shortDescription: 'Jets photopolymer droplets like an inkjet printer for ultra-fine details.',
    longDescription: 'Material Jetting works like a 3D inkjet printer, jetting fine droplets of photopolymer that are instantly cured with UV. Produces the best surfaces and can print multiple materials/colors simultaneously.',
    bestFor: ['High-detail visual models', 'Multi-material parts', 'Color prototypes', 'Over-molding simulation'],
    limitations: ['Expensive', 'Brittle parts', 'Not for functional prototypes'],
    typicalMaterials: ['Vero', 'Agilus', 'Digital Materials'],
    priceRange: 'high',
    strengthLevel: 1,
    detailLevel: 5,
    speedLevel: 2,
    category: 'resin',
  },
  'PolyJet': {
    abbreviation: 'PJ',
    name: 'PolyJet',
    shortDescription: 'Stratasys\' premium multi-material technology with photorealistic results.',
    longDescription: 'PolyJet is Stratasys\' patented Material Jetting technology. Can blend materials to simulate rubber, transparent parts, and full-color prints with 16+ micron resolution.',
    bestFor: ['Photorealistic prototypes', 'Medical models', 'Multi-color parts', 'Over-molding prototypes'],
    limitations: ['Very expensive', 'Materials age', 'Not for end products'],
    typicalMaterials: ['VeroUltra', 'Agilus30', 'Digital ABS', 'Bio-compatible'],
    priceRange: 'very-high',
    strengthLevel: 2,
    detailLevel: 5,
    speedLevel: 2,
    category: 'resin',
  },

  // Powder-based polymer technologies
  'SLS': {
    abbreviation: 'SLS',
    name: 'Selective Laser Sintering',
    shortDescription: 'Laser sinters nylon powder for strong, functional parts without supports.',
    longDescription: 'SLS uses a powerful laser to fuse nylon powder layer by layer. Parts are supported by the surrounding powder, so complex geometries are possible. Results in strong, functional parts.',
    bestFor: ['Functional prototypes', 'Small production runs', 'Complex geometries', 'Moving parts'],
    limitations: ['Rough surface', 'Porous material', 'Limited color options'],
    typicalMaterials: ['PA-12 Nylon', 'PA-11', 'TPU', 'Glass-filled Nylon', 'Carbon-filled Nylon'],
    priceRange: 'medium',
    strengthLevel: 4,
    detailLevel: 3,
    speedLevel: 3,
    category: 'polymer',
  },
  'Multi Jet Fusion': {
    abbreviation: 'MJF',
    name: 'HP Multi Jet Fusion',
    shortDescription: 'HP\'s powder technology - fast, strong and production-ready.',
    longDescription: 'MJF uses HP\'s unique process with heat-absorbing ink to sinter nylon powder. Produces strong, isotropic parts with good surface finish. Ideal for both prototypes and production.',
    bestFor: ['Production parts', 'Functional prototypes', 'Complex geometries', 'Medium-sized runs'],
    limitations: ['Only gray/black color', 'Rough surface', 'Limited material selection'],
    typicalMaterials: ['PA-12', 'PA-11', 'PA-12 GB', 'TPU', 'PP'],
    priceRange: 'medium',
    strengthLevel: 4,
    detailLevel: 3,
    speedLevel: 4,
    category: 'polymer',
  },
  'SAF': {
    abbreviation: 'SAF',
    name: 'Selective Absorption Fusion',
    shortDescription: 'Stratasys\' answer to MJF - industrial powder printing for production.',
    longDescription: 'SAF uses infrared energy and an absorbing fluid to sinter powder. Designed for high-volume production with consistent quality across the entire build platform.',
    bestFor: ['High-volume production', 'Consistent quality', 'Complex parts', 'End products'],
    limitations: ['Limited material selection', 'Rough surface'],
    typicalMaterials: ['PA-12', 'PA-11'],
    priceRange: 'medium',
    strengthLevel: 4,
    detailLevel: 3,
    speedLevel: 4,
    category: 'polymer',
  },

  // Extrusion-based
  'FDM': {
    abbreviation: 'FDM',
    name: 'Fused Deposition Modeling',
    shortDescription: 'Melts plastic filament layer by layer - cheapest and most accessible.',
    longDescription: 'FDM melts plastic filament through a hot nozzle and deposits it layer by layer. The most widespread and cheapest technology. Visible layers, but many material choices.',
    bestFor: ['Concept models', 'Functional prototypes', 'Large parts', 'Tools and fixtures'],
    limitations: ['Visible layers', 'Anisotropic strength', 'Often requires supports'],
    typicalMaterials: ['PLA', 'ABS', 'PETG', 'Nylon', 'PC', 'TPU', 'ASA', 'ULTEM', 'PEEK'],
    priceRange: 'low',
    strengthLevel: 3,
    detailLevel: 2,
    speedLevel: 3,
    category: 'polymer',
  },
  'FFF': {
    abbreviation: 'FFF',
    name: 'Fused Filament Fabrication',
    shortDescription: 'Generic name for FDM - same technology, open designation.',
    longDescription: 'FFF is the generic name for filament extrusion (FDM is Stratasys\' trademark). The technology is identical: melted plastic filament is deposited layer by layer.',
    bestFor: ['Concept models', 'Functional prototypes', 'Large parts', 'Tools and fixtures'],
    limitations: ['Visible layers', 'Anisotropic strength', 'Often requires supports'],
    typicalMaterials: ['PLA', 'ABS', 'PETG', 'Nylon', 'PC', 'TPU'],
    priceRange: 'low',
    strengthLevel: 3,
    detailLevel: 2,
    speedLevel: 3,
    category: 'polymer',
  },

  // Metal technologies
  'DMLS': {
    abbreviation: 'DMLS',
    name: 'Direct Metal Laser Sintering',
    shortDescription: 'Laser sinters metal powder for complex metal components.',
    longDescription: 'DMLS uses a powerful laser to sinter fine-grained metal powder layer by layer. Produces dense metal components with complex internal structures, used in aerospace and medical.',
    bestFor: ['Aerospace components', 'Medical implants', 'Complex geometries', 'Lightweight parts'],
    limitations: ['Expensive', 'Requires post-processing', 'Limited materials', 'Support structures'],
    typicalMaterials: ['Titanium Ti-6Al-4V', 'Aluminum AlSi10Mg', 'Stainless Steel 316L', 'Inconel 718', 'Maraging Steel'],
    priceRange: 'very-high',
    strengthLevel: 5,
    detailLevel: 3,
    speedLevel: 1,
    category: 'metal',
  },
  'SLM': {
    abbreviation: 'SLM',
    name: 'Selective Laser Melting',
    shortDescription: 'Fully melts metal powder for 100% dense metal components.',
    longDescription: 'SLM is similar to DMLS, but fully melts the powder for 100% density. Provides better mechanical properties and is used for critical components in aerospace and energy.',
    bestFor: ['Critical structural parts', 'Aerospace', 'Energy sector', 'Medical'],
    limitations: ['Very expensive', 'Long process time', 'Requires post-processing'],
    typicalMaterials: ['Titanium', 'Aluminum', 'Stainless Steel', 'Inconel', 'Cobalt Chrome'],
    priceRange: 'very-high',
    strengthLevel: 5,
    detailLevel: 3,
    speedLevel: 1,
    category: 'metal',
  },
  'Direct Metal Printing': {
    abbreviation: 'DMP',
    name: 'Direct Metal Printing',
    shortDescription: '3D Systems\' metal laser technology for precise metal components.',
    longDescription: 'DMP is 3D Systems\' brand for metal laser sintering/melting. Uses high-efficiency lasers to produce dense metal components with high precision.',
    bestFor: ['Precise metal components', 'Dental', 'Jewelry', 'Aerospace'],
    limitations: ['Expensive', 'Requires post-processing', 'Support structures'],
    typicalMaterials: ['Titanium', 'Stainless Steel', 'Aluminum', 'Cobalt Chrome'],
    priceRange: 'very-high',
    strengthLevel: 5,
    detailLevel: 4,
    speedLevel: 1,
    category: 'metal',
  },
  'EBM': {
    abbreviation: 'EBM',
    name: 'Electron Beam Melting',
    shortDescription: 'Electron beam melts metal powder in vacuum - perfect for titanium.',
    longDescription: 'EBM uses an electron beam in a vacuum to melt metal powder. The process reduces internal stresses and is ideal for titanium implants and aerospace components.',
    bestFor: ['Titanium implants', 'Aerospace', 'Orthopedic parts', 'Large metal components'],
    limitations: ['Rough surface', 'Limited to few materials', 'Very expensive'],
    typicalMaterials: ['Titanium Ti-6Al-4V', 'Cobalt Chrome', 'Inconel'],
    priceRange: 'very-high',
    strengthLevel: 5,
    detailLevel: 2,
    speedLevel: 2,
    category: 'metal',
  },
  'Binder Jetting': {
    abbreviation: 'BJ',
    name: 'Binder Jetting',
    shortDescription: 'Binder is jetted onto powder - fast and can print metal, sand or ceramic.',
    longDescription: 'Binder Jetting jets a binder onto powder layers. Can use metal, sand or ceramic. Metal parts require subsequent sintering furnace. Fast and can scale to production.',
    bestFor: ['Casting molds', 'Large metal series', 'Colored models', 'Architectural models'],
    limitations: ['Porous parts before sintering', 'Lower strength', 'Metal requires post-processing'],
    typicalMaterials: ['Stainless Steel', 'Bronze-infiltrated', 'Sand', 'Gypsum', 'Ceramic'],
    priceRange: 'medium',
    strengthLevel: 3,
    detailLevel: 2,
    speedLevel: 5,
    category: 'metal',
  },
  'WAAM': {
    abbreviation: 'WAAM',
    name: 'Wire Arc Additive Manufacturing',
    shortDescription: 'Welds metal wire layer by layer - for very large metal components.',
    longDescription: 'WAAM uses welding technology to melt metal wire and build up large structures. Faster and cheaper than powder-based metal 3D printing, but with lower resolution.',
    bestFor: ['Large metal components', 'Marine/offshore', 'Shipbuilding', 'Construction'],
    limitations: ['Low resolution', 'Requires machining', 'Rough surface'],
    typicalMaterials: ['Steel', 'Aluminum', 'Titanium', 'Bronze'],
    priceRange: 'high',
    strengthLevel: 4,
    detailLevel: 1,
    speedLevel: 4,
    category: 'metal',
  },

  // Composite
  'Carbon Fiber': {
    abbreviation: 'CF',
    name: 'Carbon Fiber Reinforced',
    shortDescription: 'Carbon fiber reinforced polymers for lightweight and high strength.',
    longDescription: 'Carbon Fiber printing uses either chopped or continuous carbon fibers in a polymer matrix. Produces parts that can replace metal at a fraction of the weight.',
    bestFor: ['Lightweight parts', 'Structural components', 'Automotive', 'Drones', 'Tools'],
    limitations: ['Expensive', 'Anisotropic strength', 'Requires special equipment'],
    typicalMaterials: ['Chopped Carbon Fiber Nylon', 'Continuous Carbon Fiber', 'Carbon PEEK'],
    priceRange: 'high',
    strengthLevel: 5,
    detailLevel: 2,
    speedLevel: 3,
    category: 'composite',
  },
};

// Material glossary for tooltips
export interface MaterialInfo {
  name: string;
  category: string;
  shortDescription: string;
  properties: string[];
  applications: string[];
  priceRange: 'low' | 'medium' | 'high' | 'very-high';
}

export const MATERIAL_GLOSSARY: Record<string, MaterialInfo> = {
  'PLA': {
    name: 'Polylactic Acid (PLA)',
    category: 'Polymer',
    shortDescription: 'Bio-based plastic - easy to print, eco-friendly, but brittle.',
    properties: ['Bio-based', 'Easy to print', 'Rigid', 'Low heat resistance'],
    applications: ['Concept models', 'Visual prototypes', 'Architecture'],
    priceRange: 'low',
  },
  'ABS': {
    name: 'Acrylonitrile Butadiene Styrene (ABS)',
    category: 'Polymer',
    shortDescription: 'Strong and impact resistant - used in LEGO and car interiors.',
    properties: ['Impact resistant', 'Heat resistant', 'Can be post-processed', 'Odor when printing'],
    applications: ['Functional prototypes', 'Tools', 'Automotive'],
    priceRange: 'low',
  },
  'PETG': {
    name: 'Polyethylene Terephthalate Glycol (PETG)',
    category: 'Polymer',
    shortDescription: 'Balance between strength and ease - chemical resistant.',
    properties: ['Chemical resistant', 'Food safe', 'Good layer adhesion', 'Flexible'],
    applications: ['Functional parts', 'Food contact', 'Outdoor'],
    priceRange: 'low',
  },
  'Nylon': {
    name: 'Polyamide (Nylon)',
    category: 'Polymer',
    shortDescription: 'Strong, flexible and wear-resistant - industry standard.',
    properties: ['High strength', 'Wear resistant', 'Flexible', 'Absorbs moisture'],
    applications: ['Functional parts', 'Gears', 'Hinges', 'Production'],
    priceRange: 'medium',
  },
  'PA-12': {
    name: 'Polyamide 12 (PA-12)',
    category: 'Polymer',
    shortDescription: 'Standard SLS nylon - versatile and reliable.',
    properties: ['Good strength', 'Chemical resistant', 'Stable', 'Wear resistant'],
    applications: ['SLS parts', 'Functional prototypes', 'Small series production'],
    priceRange: 'medium',
  },
  'PA-11': {
    name: 'Polyamide 11 (PA-11)',
    category: 'Polymer',
    shortDescription: 'Bio-based nylon from castor oil - more flexible than PA-12.',
    properties: ['Bio-based', 'Flexible', 'Impact resistant', 'Good chemical resistance'],
    applications: ['Flexible parts', 'Snap locks', 'Living hinges'],
    priceRange: 'medium',
  },
  'TPU': {
    name: 'Thermoplastic Polyurethane (TPU)',
    category: 'Elastomer',
    shortDescription: 'Flexible rubber-like material - grippy parts.',
    properties: ['Rubber-like', 'Shock absorbing', 'Wear resistant', 'Flexible'],
    applications: ['Grips', 'Seals', 'Shock absorption', 'Wearables'],
    priceRange: 'medium',
  },
  'Polycarbonate': {
    name: 'Polycarbonate (PC)',
    category: 'Polymer',
    shortDescription: 'Extremely impact resistant and transparent - used in safety glasses.',
    properties: ['Extreme impact resistance', 'High heat resistance', 'Transparent', 'Strong'],
    applications: ['Automotive', 'Safety equipment', 'Electrical enclosures'],
    priceRange: 'medium',
  },
  'PEEK': {
    name: 'Polyether Ether Ketone (PEEK)',
    category: 'High-Performance Polymer',
    shortDescription: 'Premium engineering plastic - can replace metal in critical applications.',
    properties: ['Extreme strength', 'High heat resistance', 'Chemical resistant', 'Biocompatible'],
    applications: ['Aerospace', 'Medical implants', 'Oil & gas', 'Automotive'],
    priceRange: 'very-high',
  },
  'ULTEM': {
    name: 'Polyetherimide (ULTEM/PEI)',
    category: 'High-Performance Polymer',
    shortDescription: 'Flame retardant high-performance plastic for aerospace.',
    properties: ['Flame retardant', 'High heat resistance', 'FST certified', 'Chemical resistant'],
    applications: ['Aircraft interiors', 'Aerospace', 'Electronics', 'Automotive'],
    priceRange: 'very-high',
  },
  'Titanium': {
    name: 'Titanium Ti-6Al-4V',
    category: 'Metal',
    shortDescription: 'Lightweight superalloy - aerospace and medical implants.',
    properties: ['Very strong', 'Light for metal', 'Biocompatible', 'Corrosion resistant'],
    applications: ['Aerospace', 'Medical implants', 'Motorsport', 'Defense'],
    priceRange: 'very-high',
  },
  'Aluminum': {
    name: 'Aluminum AlSi10Mg',
    category: 'Metal',
    shortDescription: 'Light metal with good strength - automotive and aerospace industry.',
    properties: ['Light', 'Good strength', 'Thermally conductive', 'Corrosion resistant'],
    applications: ['Automotive', 'Aerospace', 'Heat exchangers', 'Structural parts'],
    priceRange: 'high',
  },
  'Stainless Steel': {
    name: 'Stainless Steel 316L',
    category: 'Metal',
    shortDescription: 'Stainless steel - corrosion resistant and strong.',
    properties: ['Corrosion resistant', 'Strong', 'Biocompatible', 'Wear resistant'],
    applications: ['Medical', 'Food', 'Marine', 'Tools'],
    priceRange: 'high',
  },
  'Inconel': {
    name: 'Inconel 718',
    category: 'Superalloy',
    shortDescription: 'Nickel superalloy for extreme temperatures.',
    properties: ['Extreme heat resistance', 'Corrosion resistant', 'High strength', 'Oxidation resistant'],
    applications: ['Jet engines', 'Turbines', 'Oil & gas', 'Chemical industry'],
    priceRange: 'very-high',
  },
  'Cobalt Chrome': {
    name: 'Cobalt Chrome (CoCr)',
    category: 'Metal',
    shortDescription: 'Biocompatible alloy for dental and medical implants.',
    properties: ['Biocompatible', 'Wear resistant', 'Corrosion resistant', 'High strength'],
    applications: ['Dental crowns', 'Hip implants', 'Knee prostheses', 'Jewelry'],
    priceRange: 'very-high',
  },
  'Maraging Steel': {
    name: 'Maraging Steel (MS1)',
    category: 'Metal',
    shortDescription: 'Ultra-high strength steel for tools and motorsport.',
    properties: ['Extreme strength', 'Good hardness', 'Dimensionally stable', 'Can be heat treated'],
    applications: ['Injection molds', 'Motorsport', 'Aerospace', 'Tools'],
    priceRange: 'very-high',
  },
  'Digital ABS': {
    name: 'Digital ABS (PolyJet)',
    category: 'Photopolymer',
    shortDescription: 'Simulates ABS properties with PolyJet precision.',
    properties: ['Impact resistant', 'High resolution', 'Good heat resistance', 'Smooth surface'],
    applications: ['Snap-fit prototypes', 'Functional testing', 'Automotive interiors'],
    priceRange: 'high',
  },
  'Vero': {
    name: 'VeroUltra (PolyJet)',
    category: 'Photopolymer',
    shortDescription: 'Standard rigid PolyJet material in many colors.',
    properties: ['Rigid', 'Many colors', 'High detail', 'Smooth surface'],
    applications: ['Visual prototypes', 'Presentation models', 'Color prototypes'],
    priceRange: 'high',
  },
  'Agilus': {
    name: 'Agilus30 (PolyJet)',
    category: 'Photopolymer',
    shortDescription: 'Flexible rubber-like PolyJet material.',
    properties: ['Rubber-like', 'Wear resistant', 'Tear resistant', 'Flexible'],
    applications: ['Over-molding prototypes', 'Grips', 'Gaskets', 'Wearables'],
    priceRange: 'high',
  },
  'Standard Resin': {
    name: 'Standard Resin (SLA/DLP)',
    category: 'Photopolymer',
    shortDescription: 'Basic resin for visual prototypes.',
    properties: ['High detail', 'Smooth surface', 'Easy to print', 'Brittle'],
    applications: ['Concept models', 'Visual prototypes', 'Figurines'],
    priceRange: 'medium',
  },
  'Tough Resin': {
    name: 'Tough Resin (SLA/DLP)',
    category: 'Photopolymer',
    shortDescription: 'More robust resin for functional prototypes.',
    properties: ['Impact resistant', 'ABS-like', 'Good detail', 'Moderate strength'],
    applications: ['Functional prototypes', 'Snap-fits', 'Mechanical parts'],
    priceRange: 'medium',
  },
  'Flexible Resin': {
    name: 'Flexible Resin (SLA/DLP)',
    category: 'Photopolymer',
    shortDescription: 'Bendable resin for rubber-like parts.',
    properties: ['Flexible', 'Bendable', 'Good detail', 'Shore 80A'],
    applications: ['Gaskets', 'Grips', 'Bellows', 'Rubber simulation'],
    priceRange: 'medium',
  },
  'Clear Resin': {
    name: 'Clear Resin (SLA/DLP)',
    category: 'Photopolymer',
    shortDescription: 'Transparent resin for optical parts and lighting.',
    properties: ['Transparent', 'High detail', 'Can be polished', 'Optically clear'],
    applications: ['Lenses', 'Light guides', 'Bottle prototypes', 'Lighting'],
    priceRange: 'medium',
  },
  'Dental Resin': {
    name: 'Dental Resin (SLA/DLP)',
    category: 'Photopolymer',
    shortDescription: 'Biocompatible resin for dental applications.',
    properties: ['Biocompatible', 'FDA approved', 'High precision', 'Autoclavable'],
    applications: ['Surgical guides', 'Dentures', 'Aligner models', 'Crowns'],
    priceRange: 'high',
  },
  'Glass-filled Nylon': {
    name: 'Glass-filled Nylon (PA-GF)',
    category: 'Composite',
    shortDescription: 'Glass-reinforced nylon for increased stiffness.',
    properties: ['High stiffness', 'Dimensionally stable', 'Heat resistant', 'Wear resistant'],
    applications: ['Structural parts', 'Automotive', 'Electronic enclosures'],
    priceRange: 'medium',
  },
  'Carbon-filled Nylon': {
    name: 'Carbon-filled Nylon (PA-CF)',
    category: 'Composite',
    shortDescription: 'Carbon-reinforced nylon - lightweight and strong.',
    properties: ['Lightweight', 'High stiffness', 'Dimensionally stable', 'Slight surface patina'],
    applications: ['Drones', 'Automotive', 'Tools', 'Robot parts'],
    priceRange: 'high',
  },
  'PP': {
    name: 'Polypropylene (PP)',
    category: 'Polymer',
    shortDescription: 'Chemical resistant and flexible - living hinges.',
    properties: ['Chemical resistant', 'Food safe', 'Flexible', 'Light'],
    applications: ['Living hinges', 'Packaging', 'Food contact', 'Chemical tanks'],
    priceRange: 'medium',
  },
  'ASA': {
    name: 'Acrylonitrile Styrene Acrylate (ASA)',
    category: 'Polymer',
    shortDescription: 'UV-resistant ABS alternative for outdoor use.',
    properties: ['UV resistant', 'Weather resistant', 'Impact resistant', 'Good surface'],
    applications: ['Outdoor parts', 'Automotive exteriors', 'Signs', 'Electronic enclosures'],
    priceRange: 'low',
  },
  'Bronze-infiltrated': {
    name: 'Bronze-infiltrated Steel',
    category: 'Metal',
    shortDescription: 'Steel infiltrated with bronze - decorative metal parts.',
    properties: ['Metal appearance', 'Relatively affordable', 'Heavy', 'Can be post-processed'],
    applications: ['Sculptures', 'Decorative parts', 'Trophies', 'Art objects'],
    priceRange: 'medium',
  },
};

// Helper function to get technology info
export function getTechnologyInfo(techName: string): TechnologyInfo | null {
  // Direct match
  if (TECHNOLOGY_GLOSSARY[techName]) {
    return TECHNOLOGY_GLOSSARY[techName];
  }
  
  // Try to find by name or abbreviation
  const techLower = techName.toLowerCase();
  for (const [key, info] of Object.entries(TECHNOLOGY_GLOSSARY)) {
    if (
      key.toLowerCase() === techLower ||
      info.abbreviation.toLowerCase() === techLower ||
      info.name.toLowerCase().includes(techLower) ||
      techLower.includes(key.toLowerCase())
    ) {
      return info;
    }
  }
  
  return null;
}

// Helper function to get material info
export function getMaterialInfo(materialName: string): MaterialInfo | null {
  // Direct match
  if (MATERIAL_GLOSSARY[materialName]) {
    return MATERIAL_GLOSSARY[materialName];
  }
  
  // Try to find by name
  const matLower = materialName.toLowerCase();
  for (const [key, info] of Object.entries(MATERIAL_GLOSSARY)) {
    if (
      key.toLowerCase() === matLower ||
      info.name.toLowerCase().includes(matLower) ||
      matLower.includes(key.toLowerCase())
    ) {
      return info;
    }
  }
  
  return null;
}

// Price range display helper
export function getPriceDisplay(priceRange: 'low' | 'medium' | 'high' | 'very-high'): string {
  switch (priceRange) {
    case 'low': return '€';
    case 'medium': return '€€';
    case 'high': return '€€€';
    case 'very-high': return '€€€€';
  }
}

// Level display helper (1-5 as dots)
export function getLevelDisplay(level: number, maxLevel: number = 5): string {
  return '●'.repeat(level) + '○'.repeat(maxLevel - level);
}
