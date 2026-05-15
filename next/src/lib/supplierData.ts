export interface ParsedSupplier {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    city: string;
    country: string;
    fullAddress: string;
  };
  technologies: string[];
  materials: string[];
  certifications?: string[];
  verified: boolean;
  premium: boolean;
  isPartner?: boolean;
  instantQuoteUrl?: string;
  rating: number;
  reviewCount: number;
  description: string;
  website?: string;
  logoUrl?: string;
  region: string;
}

const technologyMap: Record<string, string> = {
  'fdm': 'FDM/FFF',
  'sla': 'SLA',
  'sls': 'SLS',
  'mjf': 'Multi Jet Fusion',
  'dmls': 'DMLS',
  'slm': 'SLM',
  'material-jetting': 'Material Jetting',
  'binder-jetting': 'Binder Jetting',
  'dlp': 'DLP',
  'saf': 'SAF',
  'dmp': 'Direct Metal Printing',
  'cdlp': 'CDLP (Continuous Digital Light Processing)',
  'fgf': 'FGF',
  'lsam': 'LSAM',
};

const materialMap: Record<string, string> = {
  'standardpla': 'PLA',
  'abs-m30-stratasys': 'ABS M30',
  'abs-white': 'ABS (White)',
  'abs-like-black': 'ABS-like (Black)',
  'absplus-stratasys': 'ABS+ (Stratasys)',
  'abs-m30i': 'ABS M30i',
  'petg': 'PETG',
  'pc': 'Polycarbonate',
  'pc-or-pc-abs': 'PC/PC-ABS',
  'pei-ultem-1010-stratasys': 'PEI ULTEM 1010',
  'pei-ultem-9085-stratasys': 'PEI ULTEM 9085',
  'hips': 'HIPS',
  'nylon-pa-12': 'Nylon PA-12',
  'nylon-12': 'Nylon 12',
  'pa-12': 'PA-12',
  'pa11-sls': 'PA-11 (SLS)',
  'PA-11 (SLS)': 'PA-11 (SLS)',
  'pa-12-carbon-filled': 'PA-12 Carbon Filled',
  'nylon-12-mineral-filled-hst': 'Nylon 12 Mineral Filled',
  'nylon-12-glass-bead-filled-gf': 'Nylon 12 Glass Filled',
  'nylon-12-flame-retardant-fr': 'Nylon 12 Flame Retardant',
  'nylon-12-aluminum-filled-af': 'Nylon 12 Aluminum Filled',
  'pa-af': 'PA Aluminum Filled',
  'pa-gf': 'PA Glass Filled',
  'duraform-pa-nylon-12': 'DuraForm PA Nylon 12',
  'mjf_pa12': 'MJF PA12',
  'sls_pa12_pa2200': 'SLS PA12 PA2200',
  'pa-12-bluesint': 'PA-12 BlueSint',
  'nylon-pa-12-blue-metal': 'Nylon PA-12 Blue Metal',
  'saf_pa11_eco': 'SAF PA11 Eco',
  'tpu-70-a-white': 'TPU (Flexible)',
  'tpu-mjf': 'TPU MJF',
  'sls_flexible_tpu': 'SLS Flexible TPU',
  'ultrasint_tpu01_mjf': 'Ultrasint TPU01 MJF',
  'polypropylene-mjf': 'Polypropylene (MJF)',
  'polypropylene-p': 'Polypropylene-P',
  'pp-natural': 'Polypropylene Natural',
  'photopolymer-rigid': 'Photopolymer Rigid',
  'accura-25': 'Accura 25',
  'carbonfiberreinforcedfilaments': 'Carbon Fiber Reinforced',
  'kevlarreinforcedfilaments': 'Kevlar Reinforced',
  'woodfilledpla': 'Wood Filled PLA',
  'stainless-steel-316l': 'Stainless Steel 316L',
  'titanium-ti-6al-4v': 'Titanium Ti-6Al-4V',
  'aluminum-aisi10mg': 'Aluminum AlSi10Mg',
  'inconel-718': 'Inconel 718',
  'inconel-625': 'Inconel 625',
  'ni625': 'Nickel 625',
  'maraging-steel': 'Maraging Steel',
  'steel': 'Steel',
  'stainless-steel-17-4ph': 'Stainless Steel 17-4PH',
  'gold-plated-brass': 'Gold Plated Brass',
  'bronze': 'Bronze',
  '420i-420ss-brz': '420i 420SS Bronze',
  'formlabs-clear-resin': 'Clear Resin',
  'formlabs-tough-resin-2000': 'Tough Resin 2000',
  'formlabs-standard-resin': 'Standard Resin',
  'formlabs-high-temp-resin': 'High Temp Resin',
  'formlabs-durable-resin': 'Durable Resin',
  'formlabs-flexible-resin-80a': 'Flexible Resin 80A',
  'somos-waterclear-ultra-10122': 'Somos WaterClear Ultra',
  'ultem-9085': 'ULTEM 9085',
  'duraform-hst': 'DuraForm HST',
  'duraform-tpu': 'DuraForm TPU',
  'duraform-ex': 'DuraForm EX',
  'duraform-gf-glass-filled-nylon': 'DuraForm GF Glass Filled Nylon',
};

const reverseMaterialMap: Record<string, string> = Object.entries(materialMap).reduce((acc, [key, value]) => {
  acc[value] = key;
  return acc;
}, {} as Record<string, string>);

const reverseTechnologyMap: Record<string, string> = Object.entries(technologyMap).reduce((acc, [key, value]) => {
  acc[value] = key;
  return acc;
}, {} as Record<string, string>);

export function getMaterialKeyFromDisplayName(displayName: string): string | undefined {
  return reverseMaterialMap[displayName] || displayName.toLowerCase().replace(/\s+/g, '-');
}

export function getTechnologyKeyFromDisplayName(displayName: string): string | undefined {
  return reverseTechnologyMap[displayName] || displayName.toLowerCase().replace(/\s+/g, '-');
}

export function getDisplayNameFromMaterialKey(key: string): string {
  return materialMap[key.toLowerCase()] || key;
}

export function getDisplayNameFromTechnologyKey(key: string): string {
  return technologyMap[key.toLowerCase()] || key;
}

export const getAllMaterials = (): string[] => {
  return Object.values(materialMap).sort();
};

export const getAllTechnologies = (): string[] => {
  return Object.values(technologyMap).sort();
};

export const countryToAreaMap: Record<string, string> = {
  'Germany': 'Europe', 'Denmark': 'Europe', 'Netherlands': 'Europe', 'Sweden': 'Europe',
  'Belgium': 'Europe', 'United Kingdom': 'Europe', 'France': 'Europe', 'Italy': 'Europe',
  'Spain': 'Europe', 'Poland': 'Europe', 'Czech Republic': 'Europe', 'Austria': 'Europe',
  'Switzerland': 'Europe', 'Finland': 'Europe', 'Norway': 'Europe', 'Ireland': 'Europe',
  'Malta': 'Europe',
  'United States': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
  'China': 'Asia', 'Japan': 'Asia', 'South Korea': 'Asia', 'India': 'Asia',
  'Singapore': 'Asia', 'Taiwan': 'Asia', 'Hong Kong': 'Asia', 'Thailand': 'Asia',
  'Malaysia': 'Asia', 'Philippines': 'Asia', 'Indonesia': 'Asia', 'Vietnam': 'Asia',
  'Pakistan': 'Asia',
  'Australia': 'Oceania', 'New Zealand': 'Oceania',
  'Brazil': 'South America', 'Argentina': 'South America', 'Chile': 'South America',
  'Colombia': 'South America', 'Peru': 'South America',
  'South Africa': 'Africa', 'Egypt': 'Africa', 'Nigeria': 'Africa', 'Kenya': 'Africa',
  'Morocco': 'Africa', 'Tunisia': 'Africa',
};

export const getAreaForCountry = (country: string): string | undefined => {
  return countryToAreaMap[country];
};

export const getAllAreas = (): string[] => {
  return ['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania'];
};
