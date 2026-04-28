// Utility functions for parsing supplier data from CSV

// Import logo assets
import protolabsLogo from '@/assets/supplier-logos/protolabs.png';
import threerpLogo from '@/assets/supplier-logos/3erp.png';
import threeDPrintingAllyLogo from '@/assets/supplier-logos/3d-printing-ally.png';
import murtfeldtLogo from '@/assets/supplier-logos/murtfeldt.png';
import craftcloudLogo from '@/assets/supplier-logos/craftcloud.png';
import stratasysLogo from '@/assets/supplier-logos/stratasys.png';
import inventThreeDLogo from '@/assets/supplier-logos/invent-3d.png';
import quickpartsLogo from '@/assets/supplier-logos/quickparts.png';
import threeDCompareLogo from '@/assets/supplier-logos/3dcompare.png';
import impacSystemsLogo from '@/assets/supplier-logos/impac-systems.png';
import forecast3dLogo from '@/assets/supplier-logos/forecast3d.png';
import norraLogo from '@/assets/supplier-logos/norra.png';
import markforgedLogo from '@/assets/supplier-logos/markforged.png';
import jawstecLogo from '@/assets/supplier-logos/jawstec.png';
import fidLogo from '@/assets/supplier-logos/fid.png';
import rapidDirectLogo from '@/assets/supplier-logos/rapid-direct.png';
import threeDeoLogo from '@/assets/supplier-logos/3deo.png';
import makelabLogo from '@/assets/supplier-logos/makelab.png';
import facfoxLogo from '@/assets/supplier-logos/facfox.png';
import burloakLogo from '@/assets/supplier-logos/burloak.png';
import gknPowderLogo from '@/assets/supplier-logos/gkn-powder.png';
import ziggzaggLogo from '@/assets/supplier-logos/ziggzagg.png';
import materialiseLogo from '@/assets/supplier-logos/materialise.png';
import addmanLogo from '@/assets/supplier-logos/addman.png';
import paragonLogo from '@/assets/supplier-logos/paragon.png';
import beamitLogo from '@/assets/supplier-logos/beamit.png';
import aml3dLogo from '@/assets/supplier-logos/aml3d.png';
import ultimateLogo from '@/assets/supplier-logos/ultimate.png';
import objective3dLogo from '@/assets/supplier-logos/objective3d.png';
import threeDPrintDanmarkLogo from '@/assets/supplier-logos/3d-print-danmark.png';
import goengineerLogo from '@/assets/supplier-logos/goengineer.png';
import teufelPrototypenLogo from '@/assets/supplier-logos/teufel-prototypen.png';
import threeTAdditiveLogo from '@/assets/supplier-logos/3t-additive.avif';
import incodema3dLogo from '@/assets/supplier-logos/incodema3d.avif';
import sintaviaLogo from '@/assets/supplier-logos/sintavia.avif';
import vacosineLogo from '@/assets/supplier-logos/vacosine.avif';
import igusLogo from '@/assets/supplier-logos/igus.avif';
import objective3dDarkLogo from '@/assets/supplier-logos/objective3d-dark.avif';
import delvaLogo from '@/assets/supplier-logos/delva.avif';
import printaworldLogo from '@/assets/supplier-logos/printaworld.avif';
import partsOnDemandLogo from '@/assets/supplier-logos/parts-on-demand.avif';
import partzproLogo from '@/assets/supplier-logos/partzpro.avif';
import danishTechnologicalInstituteLogo from '@/assets/supplier-logos/danish-technological-institute.avif';
import fitLogo from '@/assets/supplier-logos/fit.avif';
import zeal3dLogo from '@/assets/supplier-logos/zeal3d.avif';
import sybridgeLogo from '@/assets/supplier-logos/sybridge.avif';
// New logo imports
import partzproBlackLogo from '@/assets/supplier-logos/partzpro-black.png';
import partsOnDemandBlackLogo from '@/assets/supplier-logos/parts-on-demand-black.png';
import danishTechnologicalInstituteColorLogo from '@/assets/supplier-logos/danish-technological-institute-color.png';
import fitColorLogo from '@/assets/supplier-logos/fit-color.png';
import zeal3dColorLogo from '@/assets/supplier-logos/zeal3d-color.png';
import sybridgeBlackLogo from '@/assets/supplier-logos/sybridge-black.png';
import incodema3dColorLogo from '@/assets/supplier-logos/incodema3d-color.png';
import threeTAdditiveBlackLogo from '@/assets/supplier-logos/3t-additive-black.png';
import vacosineOutlineLogo from '@/assets/supplier-logos/vacosine-outline.png';
// Additional new logos
import igusOrangeLogo from '@/assets/supplier-logos/igus-orange.png';
import delvaOrangeLogo from '@/assets/supplier-logos/delva-orange.png';
import objective3dBlackLogo from '@/assets/supplier-logos/objective3d-black.png';
import printaworldGreyLogo from '@/assets/supplier-logos/printaworld-grey.png';
// New supplier logos
import k3dLogo from '@/assets/supplier-logos/k3d.png';
import protiqLogo from '@/assets/supplier-logos/protiq.png';
import machinifiedLogo from '@/assets/supplier-logos/machinified.png';
import easypartzLogo from '@/assets/supplier-logos/easypartz.png';
import threeDPeopleUkLogo from '@/assets/supplier-logos/3d-people-uk.png';
import prototalLogo from '@/assets/supplier-logos/prototal.png';
import sculpteoLogo from '@/assets/supplier-logos/sculpteo.png';
import weergLogo from '@/assets/supplier-logos/weerg.png';
import fictivLogo from '@/assets/supplier-logos/fictiv.png';
import jlc3dpLogo from '@/assets/supplier-logos/jlc3dp.png';
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
  rating: number;
  reviewCount: number;
  description: string;
  website?: string;
  logoUrl?: string;
  region: string;
}

// Logo mapping based on supplier names and companies
const logoMapping: Record<string, string> = {
  // New supplier logos
  'k3d': k3dLogo,
  'protiq': protiqLogo,
  'machinified': machinifiedLogo,
  'easypartz': easypartzLogo,
  '3d people': threeDPeopleUkLogo,
  '3dpeople': threeDPeopleUkLogo,
  'prototal': prototalLogo, // Now using correct Prototal logo instead of Protolabs
  'prototal denmark': prototalLogo, // Match Prototal Denmark specifically
  'sculpteo': sculpteoLogo,
  'weerg': weergLogo,
  'fictiv': fictivLogo,
  'jlc3dp': jlc3dpLogo,
  'jlc': jlc3dpLogo,
  // Match by company name keywords
  'protolabs': protolabsLogo,
  '3erp': threerpLogo,
  '3d printing ally': threeDPrintingAllyLogo,
  'murtfeldt': murtfeldtLogo,
  'craftcloud': craftcloudLogo,
  'stratasys': stratasysLogo,
  'invent': inventThreeDLogo,
  'quickparts': quickpartsLogo,
  '3dcompare': threeDCompareLogo,
  'impac': impacSystemsLogo,
  'materialise': materialiseLogo,
  'forecast': forecast3dLogo,
  'norra': norraLogo,
  'markforged': markforgedLogo,
  'jawstec': jawstecLogo,
  'fid': fidLogo,
  'rapid': rapidDirectLogo,
  'direct': rapidDirectLogo,
  '3deo': threeDeoLogo,
  'makelab': makelabLogo,
  'facfox': facfoxLogo,
  'burloak': burloakLogo,
  'samuel': burloakLogo, // Burloak is a division of Samuel
  'gkn': gknPowderLogo,
  'powder': gknPowderLogo,
  'ziggzagg': ziggzaggLogo,
  'addman': addmanLogo,
  'paragon': paragonLogo,
  'beamit': beamitLogo,
  'aml3d': aml3dLogo,
  'ultimate': ultimateLogo,
  'objective3d': objective3dBlackLogo,
  'objective': objective3dBlackLogo,
  '3d print danmark': threeDPrintDanmarkLogo,
  'danmark': threeDPrintDanmarkLogo,
  'goengineer': goengineerLogo,
  'teufel': teufelPrototypenLogo,
  'prototypen': teufelPrototypenLogo,
  '3t': threeTAdditiveBlackLogo,
  'additive manufacturing': threeTAdditiveBlackLogo,
  'incodema3d': incodema3dColorLogo,
  'incodema': incodema3dColorLogo,
  'sintavia': sintaviaLogo,
  'cosine additive': vacosineOutlineLogo,
  'cosine': vacosineOutlineLogo,
  'igus': igusOrangeLogo,
  'delva': delvaOrangeLogo,
  'printaworld': printaworldGreyLogo,
  'bigtech': printaworldGreyLogo,
  'parts on demand': partsOnDemandBlackLogo,
  'partzpro': partzproBlackLogo,
  'fit additive manufacturing group': fitColorLogo,
  'fit additive': fitColorLogo,
  'fit': fitColorLogo,
  'danish technological institute': danishTechnologicalInstituteColorLogo,
  'technological institute': danishTechnologicalInstituteColorLogo,
  'dti': danishTechnologicalInstituteColorLogo,
  'zeal 3d': zeal3dColorLogo,
  'zeal3d': zeal3dColorLogo,
  'sybridge on-demand': sybridgeBlackLogo,
  'sybridge': sybridgeBlackLogo,
};

// Helper function to find logo for a supplier
export const findLogoForSupplier = (title: string, website?: string): string | undefined => {
  const searchText = `${title} ${website || ''}`.toLowerCase();
  
  for (const [key, logo] of Object.entries(logoMapping)) {
    if (searchText.includes(key)) {
      return logo;
    }
  }
  
  return undefined;
};

// Technology mapping to human-readable names
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
  'lsam': 'LSAM'
};

// Material mapping to human-readable names
const materialMap: Record<string, string> = {
  // Thermoplastics
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
  
  // Nylon variants
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
  
  // Flexible materials
  'tpu-70-a-white': 'TPU (Flexible)',
  'tpu-mjf': 'TPU MJF',
  'sls_flexible_tpu': 'SLS Flexible TPU',
  'ultrasint_tpu01_mjf': 'Ultrasint TPU01 MJF',
  
  // Specialty plastics
  'polypropylene-mjf': 'Polypropylene (MJF)',
  'polypropylene-p': 'Polypropylene-P',
  'pp-natural': 'Polypropylene Natural',
  'photopolymer-rigid': 'Photopolymer Rigid',
  'accura-25': 'Accura 25',
  
  // Carbon fiber and composites
  'carbonfiberreinforcedfilaments': 'Carbon Fiber Reinforced',
  'kevlarreinforcedfilaments': 'Kevlar Reinforced',
  'woodfilledpla': 'Wood Filled PLA',
  
  // Metals
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
  
  // Resins and photopolymers
  'formlabs-clear-resin': 'Clear Resin',
  'formlabs-tough-resin-2000': 'Tough Resin 2000',
  'formlabs-standard-resin': 'Standard Resin',
  'formlabs-high-temp-resin': 'High Temp Resin',
  'formlabs-durable-resin': 'Durable Resin',
  'formlabs-flexible-resin-80a': 'Flexible Resin 80A',
  'somos-waterclear-ultra-10122': 'Somos WaterClear Ultra',
  'ultem-9085': 'ULTEM 9085',
  
  // DuraForm series
  'duraform-hst': 'DuraForm HST',
  'duraform-tpu': 'DuraForm TPU',
  'duraform-ex': 'DuraForm EX',
  'duraform-gf-glass-filled-nylon': 'DuraForm GF Glass Filled Nylon'
};

// Reverse mappings to convert display names back to database keys
const reverseMaterialMap: Record<string, string> = Object.entries(materialMap).reduce((acc, [key, value]) => {
  acc[value] = key;
  return acc;
}, {} as Record<string, string>);

const reverseTechnologyMap: Record<string, string> = Object.entries(technologyMap).reduce((acc, [key, value]) => {
  acc[value] = key;
  return acc;
}, {} as Record<string, string>);

// Get database key from display name
export function getMaterialKeyFromDisplayName(displayName: string): string | undefined {
  return reverseMaterialMap[displayName] || displayName.toLowerCase().replace(/\s+/g, '-');
}

export function getTechnologyKeyFromDisplayName(displayName: string): string | undefined {
  return reverseTechnologyMap[displayName] || displayName.toLowerCase().replace(/\s+/g, '-');
}

// Get display name from database key
export function getDisplayNameFromMaterialKey(key: string): string {
  return materialMap[key.toLowerCase()] || key;
}

export function getDisplayNameFromTechnologyKey(key: string): string {
  return technologyMap[key.toLowerCase()] || key;
}

// Country extraction from addresses
const extractCountryFromAddress = (address: string): string => {
  const countryPatterns = [
    { pattern: /denmark|danmark/i, country: 'Denmark' },
    { pattern: /germany|deutschland/i, country: 'Germany' },
    { pattern: /usa|united states/i, country: 'United States' },
    { pattern: /uk|united kingdom|britain/i, country: 'United Kingdom' },
    { pattern: /finland|suomi/i, country: 'Finland' },
    { pattern: /italy|italia/i, country: 'Italy' },
    { pattern: /australia/i, country: 'Australia' },
    { pattern: /belgium|belgique/i, country: 'Belgium' },
    { pattern: /canada/i, country: 'Canada' },
    { pattern: /china/i, country: 'China' },
    { pattern: /netherlands|holland/i, country: 'Netherlands' },
    { pattern: /japan|nippon/i, country: 'Japan' },
    { pattern: /switzerland|schweiz/i, country: 'Switzerland' },
    { pattern: /france|française/i, country: 'France' },
    { pattern: /sweden|sverige/i, country: 'Sweden' }
  ];

  for (const { pattern, country } of countryPatterns) {
    if (pattern.test(address)) {
      return country;
    }
  }
  
  return 'Unknown';
};

// Supplier descriptions based on research and company specialties
const supplierDescriptions: Record<string, string> = {
  'prototal': "Leading Scandinavian 3D printing service provider with over 25 years of experience in additive manufacturing. Specializing in industrial-grade components for demanding applications across aerospace, automotive, and medical sectors.",
  'beamit': "Global leader in metal additive manufacturing with advanced LPBF technology. One-stop shop offering fully integrated value chain from design to finished components, certified for aerospace and automotive industries.",
  'materialise': "Pioneer in 3D printing software and services with extensive manufacturing capabilities. HP-qualified Multi Jet Fusion provider offering high-precision prototyping and end-use production for medical, automotive, and consumer goods.",
  'ultimate': "Professional additive manufacturing service provider in Florida offering comprehensive 3D printing solutions from rapid prototyping to end-use production across multiple technologies and materials.",
  'sintavia': "Aerospace-focused metal additive manufacturing specialist providing mission-critical components for defense and commercial aviation. Advanced DMLS and SLM capabilities with full certification compliance.",
  'danish technological institute': "Leading research and technology organization providing industrial 3D printing services and development. Expert in advanced materials research and pilot production for innovative manufacturing solutions.",
  'dti': "Leading research and technology organization providing industrial 3D printing services and development. Expert in advanced materials research and pilot production for innovative manufacturing solutions.",
  '3t': "Advanced metal additive manufacturing company focused on sustainable production. Industrialized complete value chain with DMLS expertise, targeting net-zero manufacturing by 2032.",
  'addman': "Full-service additive manufacturing provider specializing in metal and polymer production. Comprehensive capabilities from prototyping to end-use parts with extensive material options and post-processing services.",
  'incodema3d': "Precision metal 3D printing specialist serving aerospace, medical, and defense industries. Expert in complex geometries and high-performance alloys with rigorous quality control standards.",
  'paragon': "UK-based rapid prototyping and additive manufacturing service provider. Comprehensive technology portfolio including SLS, MJF, and FDM for diverse industrial applications.",
  'burloak': "Canadian aerospace and defense additive manufacturing specialist. Advanced metal printing capabilities with AS9100 certification for mission-critical components.",
  'ziggzagg': "European 3D printing service provider offering Multi Jet Fusion and SLA technologies. Focus on high-quality prototyping and small-series production for industrial applications.",
  'aml3d': "Australian metal additive manufacturer (ASX:AL3) headquartered in Adelaide with a US hub in Stow, Ohio. Inventor of the patented WAM® (Wire Additive Manufacturing) DED-arc process, sold productised as ARCEMY® printers. Certified to AS9100D, ISO 9001, DNV (maritime), Lloyd's Register, and AWS D20.1 — serving aerospace, defence, maritime, oil & gas, manufacturing and education.",
  'gkn': "Global engineering company with advanced metal additive manufacturing capabilities. Expertise in powder metallurgy and binder jetting for automotive and aerospace applications.",
  'facfox': "Asian manufacturing service provider offering comprehensive 3D printing solutions. Multi-technology platform supporting rapid prototyping and low-volume production across various industries.",
  'zeal 3d': "Australian additive manufacturing service provider specializing in engineering-grade thermoplastics and resins. Focus on functional prototypes and end-use parts for automotive and industrial applications.",
  'sybridge': "On-demand digital manufacturing platform offering comprehensive additive manufacturing services. Advanced production capabilities with focus on scalable, high-quality part production.",
  'cosine': "Large-scale additive manufacturing specialist providing industrial FDM printing services. Expert in oversized components and advanced thermoplastics for aerospace and automotive applications.",
  'igus': "Leading manufacturer of motion plastics offering specialized 3D printing services for wear-resistant components. Expert in tribologically optimized materials for mechanical engineering applications.",
  'delva': "Finnish metal additive manufacturing company specializing in DMLS technology. Focus on high-precision components for aerospace, medical, and industrial applications with advanced post-processing capabilities.",
  'printaworld': "North American 3D printing service provider offering SLA and metal printing technologies. Specializing in high-precision prototypes and functional components for various industries.",
  'teufel': "German precision 3D printing specialist focusing on SLA and SLS technologies. Expert in high-detail prototypes and small-series production for automotive and consumer goods industries.",
  'goengineer': "Comprehensive additive manufacturing and engineering services provider. Stratasys partner offering industrial-grade FDM and PolyJet technologies with extensive material selection.",
  '3d print danmark': "Danish 3D printing service provider specializing in custom prototyping and small-series production. Multi-technology platform supporting various thermoplastics and composite materials.",
  'objective3d': "Comprehensive additive manufacturing service provider offering design-to-production solutions. Multi-technology capabilities including FDM, SLS, and metal printing for diverse applications.",
  'quickparts': "On-demand manufacturing service offering rapid prototyping and production parts. Comprehensive technology portfolio with focus on speed and quality for product development cycles.",
  'craftcloud': "Global 3D printing network platform connecting customers with verified manufacturing partners. Comprehensive technology access with automated quoting and quality assurance.",
  'stratasys': "Global leader in additive manufacturing solutions providing industrial-grade 3D printing services. Pioneer in FDM and PolyJet technologies with extensive material portfolio for professional applications."
};

// Helper function to generate description for suppliers
const generateSupplierDescription = (title: string, technologies: string[], materials: string[]): string => {
  const supplierKey = title.toLowerCase();
  
  // Check for specific supplier descriptions
  for (const [key, description] of Object.entries(supplierDescriptions)) {
    if (supplierKey.includes(key)) {
      return description;
    }
  }
  
  // Generate generic description if no specific match found
  const techList = technologies.length > 0 ? technologies.slice(0, 2).join(' and ') : 'advanced';
  const materialList = materials.length > 0 ? materials.slice(0, 3).join(', ') : 'various';
  
  return `Professional additive manufacturing service provider specializing in ${techList} technologies. Offering high-quality 3D printing solutions with ${materialList} materials for prototyping and production applications.`;
};

// City extraction from addresses
const extractCityFromAddress = (address: string): string => {
  // Common patterns for city extraction
  const cityPatterns = [
    /([^,]+),?\s*\d{4,5}\s+([^,]+)/,  // "Street, 12345 City"
    /([^,]+),?\s*([A-Z]{2})\s+\d{4,5}/,  // "City, ST 12345"
    /,\s*([^,\d]+)\s*\d{4,5}/,  // ", City 12345"
    /,\s*([^,]+),?\s*[A-Z]{2,}/  // ", City, Country"
  ];

  for (const pattern of cityPatterns) {
    const match = address.match(pattern);
    if (match) {
      const city = match[1] || match[2];
      if (city && city.trim().length > 2) {
        return city.trim();
      }
    }
  }

  // Fallback: take the first part before comma
  const parts = address.split(',');
  if (parts.length > 1) {
    return parts[parts.length - 2].trim();
  }

  return 'Unknown';
};

// Comprehensive coordinates mapping for specific addresses and cities
const locationCoordinates: Record<string, { lat: number; lng: number }> = {
  // Specific addresses from CSV data
  'Kuldyssen 6 B, 2630 Taastrup, Denmark': { lat: 55.6503, lng: 12.3009 },
  '74-12 88th St, Flushing, NY 11385, USA': { lat: 40.7302, lng: -73.8370 },
  '739 East Fort Union Blvd, Midvale, UT 84047, USA': { lat: 40.6119, lng: -111.8910 },
  'H. C. Ørsteds Vej 4, 6100 Haderslev, Denmark': { lat: 55.2537, lng: 9.4898 },
  'Laajamäentie 2, 13430 Hämeenlinna, Finland': { lat: 60.9959, lng: 24.4641 },
  'Veilchenweg 1, 89278 Nersingen, Germany': { lat: 48.4151, lng: 10.0769 },
  '33 Yazaki Way, Carrum Downs VIC 3201, Australia': { lat: -38.1034, lng: 145.1727 },
  '257 Ferris Ave, Rumford, RI 02916, USA': { lat: 41.8482, lng: -71.3503 },
  '1851 Gunn Hwy, Odessa, FL 33556, USA': { lat: 28.1836, lng: -82.5707 },
  '8181 W Hardy Rd, Houston, TX 77022, USA': { lat: 29.8117, lng: -95.4402 },
  'Str. Prinzera, 17, 43045 Fornovo di Taro PR, Italy': { lat: 44.6883, lng: 10.0986 },
  'Darlington DL2 1NA, UK': { lat: 54.5253, lng: -1.5581 },
  '16340 Innovation Ln, Fort Myers, FL 33913, USA': { lat: 26.5628, lng: -81.8723 },
  'Technologielaan 15, 3001 Leuven, Belgium': { lat: 50.8647, lng: 4.6787 },
  '101 Warehouse Rd, Thatcham RG19 6HN, UK': { lat: 51.4007, lng: -1.2621 },
  '265 Spring Lake Dr, Itasca, IL 60143, USA': { lat: 41.9750, lng: -88.0089 },
  '304/566 St Kilda Rd, Melbourne VIC 3004, Australia': { lat: -37.8473, lng: 144.9892 },
  'Zhi Cheng Da Sha, 龙井 Bin Jiang Qu, Hang Zhou Shi, Zhe Jiang Sheng, China, 310053': { lat: 30.2741, lng: 120.1551 },
  'Kongsvang Alle 29, 8000 Aarhus, Denmark': { lat: 56.1572, lng: 10.2107 },

  // Major cities for fallback
  'Taastrup': { lat: 55.6503, lng: 12.3009 },
  'Flushing': { lat: 40.7302, lng: -73.8370 },
  'Midvale': { lat: 40.6119, lng: -111.8910 },
  'Haderslev': { lat: 55.2537, lng: 9.4898 },
  'Hämeenlinna': { lat: 60.9959, lng: 24.4641 },
  'Nersingen': { lat: 48.4151, lng: 10.0769 },
  'Carrum Downs': { lat: -38.1034, lng: 145.1727 },
  'Rumford': { lat: 41.8482, lng: -71.3503 },
  'Odessa': { lat: 28.1836, lng: -82.5707 },
  'Houston': { lat: 29.8117, lng: -95.4402 },
  'Fornovo di Taro': { lat: 44.6883, lng: 10.0986 },
  'Darlington': { lat: 54.5253, lng: -1.5581 },
  'Fort Myers': { lat: 26.5628, lng: -81.8723 },
  'Leuven': { lat: 50.8647, lng: 4.6787 },
  'Thatcham': { lat: 51.4007, lng: -1.2621 },
  'Itasca': { lat: 41.9750, lng: -88.0089 },
  'Melbourne': { lat: -37.8473, lng: 144.9892 },
  'Hangzhou': { lat: 30.2741, lng: 120.1551 },
  'Adelaide': { lat: -34.9285, lng: 138.6007 },
  'Bonn': { lat: 50.7374, lng: 7.0982 },
  'Hollywood': { lat: 26.0112, lng: -80.1495 },
  'Ithaca': { lat: 42.4440, lng: -76.5019 },
  'Oakville': { lat: 43.4675, lng: -79.6877 },
  'Aarhus': { lat: 56.1572, lng: 10.2107 },

  // Country-level fallbacks (approximate centers)
  'Denmark': { lat: 55.6761, lng: 12.5683 },
  'Germany': { lat: 52.5200, lng: 13.4050 },
  'United States': { lat: 39.8283, lng: -98.5795 },
  'United Kingdom': { lat: 55.3781, lng: -3.4360 },
  'Finland': { lat: 61.9241, lng: 25.7482 },
  'Italy': { lat: 41.8719, lng: 12.5674 },
  'Australia': { lat: -25.2744, lng: 133.7751 },
  'Belgium': { lat: 50.5039, lng: 4.4699 },
  'Canada': { lat: 56.1304, lng: -106.3468 },
  'China': { lat: 35.8617, lng: 104.1954 },
  'Netherlands': { lat: 52.1326, lng: 5.2913 },
  'Japan': { lat: 36.2048, lng: 138.2529 },
  'Switzerland': { lat: 46.8182, lng: 8.2275 },
  'France': { lat: 46.6034, lng: 1.8883 },
  'Sweden': { lat: 60.1282, lng: 18.6435 },
  'Malta': { lat: 35.9375, lng: 14.3754 },
  'Qormi': { lat: 35.8756, lng: 14.4703 }
};

export const parseSupplierCSV = async (csvContent: string): Promise<ParsedSupplier[]> => {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',');
  const suppliers: ParsedSupplier[] = [];

  console.log(`Starting to parse ${lines.length - 1} lines from CSV`);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      // Parse CSV line (handling quoted JSON)
      const values = [];
      let current = '';
      let inQuotes = false;
      let quoteCount = 0;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          quoteCount++;
          inQuotes = !inQuotes;
        }
        if (char === ',' && !inQuotes) {
          values.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current);

      if (values.length < 11) {
        console.warn(`Line ${i}: Not enough values (${values.length}), skipping`);
        continue;
      }

      const [id, createdAt, title, priceAmount, priceCurrency, authorId, state, imageCount, stockQuantity, publicDataStr] = values;
      
      if (state !== 'published') {
        console.warn(`Line ${i}: State is '${state}', not published, skipping`);
        continue;
      }

      // Parse the PublicData JSON
      let publicData;
      try {
        // Remove quotes around the JSON string
        const cleanJsonStr = publicDataStr.replace(/^"|"$/g, '').replace(/""/g, '"');
        publicData = JSON.parse(cleanJsonStr);
      } catch (e) {
        console.warn(`Failed to parse public data for supplier ${title}:`, e);
        continue;
      }

      // Extract location information
      const address = publicData.location?.address || '';
      const country = extractCountryFromAddress(address);
      const city = extractCityFromAddress(address);
      
      // Priority lookup: exact address -> city -> country -> default
      let coordinates = locationCoordinates[address] || 
                       locationCoordinates[city] || 
                       locationCoordinates[country];
      
      // If no coordinates found, use default
      if (!coordinates) {
        coordinates = { lat: 52.5200, lng: 13.4050 }; // Default to central Europe
        console.warn(`No coordinates found for address: ${address}, city: ${city}, country: ${country}`);
      }
      
      // Use precise coordinates
      const lat = coordinates.lat;
      const lng = coordinates.lng;

      // Extract and map technologies
      const technologies = (publicData.TechnologyID || [])
        .map((tech: string) => technologyMap[tech] || tech)
        .filter((tech: string) => tech);

      // Extract and map materials
      const allMaterialIds = [
        ...(publicData.thermoplasticid || []),
        ...(publicData.metalid || []),
        ...(publicData.photopolymerid || [])
      ];
      const materials = allMaterialIds
        .map((material: string) => materialMap[material] || material)
        .filter((material: string) => material);

      // Generate mock data for missing fields
      const rating = 4.0 + Math.random() * 1.0; // 4.0-5.0

      // Clean the supplier name to extract only the brand name (remove descriptions)
      // More intelligent cleaning: remove text after em-dash/en-dash or parentheses, but preserve hyphens in company names
      let cleanedName = title
        .replace(/[\s]*[–—]\s*.+$/, '') // Remove text after em-dash or en-dash
        .replace(/[\s]*\(.+?\).*$/, '') // Remove text in parentheses and everything after
        .replace(/[\s]*[,;:].+$/, '') // Remove text after common separators
        .trim();
      
      // If no cleaning happened with the above patterns, try removing after long descriptive phrases
      if (cleanedName === title) {
        cleanedName = title.replace(/[\s]*[-]\s*(Online|Industrial|Digital|Professional|Rapid|Advanced|Manufacturing|3D Printing|Service|Services|Platform|Solutions|Group).+$/i, '').trim();
      }

      const supplier: ParsedSupplier = {
        id,
        name: cleanedName,
        location: {
          lat,
          lng,
          city,
          country,
          fullAddress: address
        },
        technologies,
        materials: materials.slice(0, 8), // Limit to first 8 materials
        verified: Math.random() > 0.3, // 70% verified
        premium: Math.random() > 0.7, // 30% premium
        rating: Math.round(rating * 10) / 10,
        reviewCount: Math.floor(Math.random() * 50) + 5, // 5-55 reviews
        description: generateSupplierDescription(cleanedName, technologies, materials),
        website: publicData.affiliatelinkid,
        logoUrl: findLogoForSupplier(cleanedName, publicData.affiliatelinkid),
        region: publicData.categoryLevel1 || 'global'
      };

      suppliers.push(supplier);
    } catch (error) {
      console.warn(`Failed to parse supplier at line ${i}:`, error);
    }
  }

  console.log(`Successfully parsed ${suppliers.length} suppliers`);
  return suppliers;
};

// Load suppliers from CSV file
export const loadSuppliers = async (): Promise<ParsedSupplier[]> => {
  try {
    const response = await fetch('/suppliers.csv');
    const csvContent = await response.text();
    return await parseSupplierCSV(csvContent);
  } catch (error) {
    console.error('Failed to load suppliers:', error);
    return [];
  }
};

// Extract all unique materials from the material map
export const getAllMaterials = (): string[] => {
  return Object.values(materialMap).sort();
};

// Extract all unique technologies from the technology map
export const getAllTechnologies = (): string[] => {
  return Object.values(technologyMap).sort();
};

// Extract all unique areas/regions (continents)
// Country to area mapping
export const countryToAreaMap: Record<string, string> = {
  // Europe
  'Germany': 'Europe', 'Denmark': 'Europe', 'Netherlands': 'Europe', 'Sweden': 'Europe',
  'Belgium': 'Europe', 'United Kingdom': 'Europe', 'France': 'Europe', 'Italy': 'Europe',
  'Spain': 'Europe', 'Poland': 'Europe', 'Czech Republic': 'Europe', 'Austria': 'Europe',
  'Switzerland': 'Europe', 'Finland': 'Europe', 'Norway': 'Europe', 'Ireland': 'Europe',
  'Malta': 'Europe',
  
  // North America
  'United States': 'North America', 'Canada': 'North America', 'Mexico': 'North America',
  
  // Asia
  'China': 'Asia', 'Japan': 'Asia', 'South Korea': 'Asia', 'India': 'Asia',
  'Singapore': 'Asia', 'Taiwan': 'Asia', 'Hong Kong': 'Asia', 'Thailand': 'Asia',
  'Malaysia': 'Asia', 'Philippines': 'Asia', 'Indonesia': 'Asia', 'Vietnam': 'Asia',
  'Pakistan': 'Asia',
  
  // Oceania
  'Australia': 'Oceania', 'New Zealand': 'Oceania',
  
  // South America
  'Brazil': 'South America', 'Argentina': 'South America', 'Chile': 'South America',
  'Colombia': 'South America', 'Peru': 'South America',
  
  // Africa
  'South Africa': 'Africa', 'Egypt': 'Africa', 'Nigeria': 'Africa', 'Kenya': 'Africa',
  'Morocco': 'Africa', 'Tunisia': 'Africa'
};

export const getAreaForCountry = (country: string): string | undefined => {
  return countryToAreaMap[country];
};

export const getAllAreas = (): string[] => {
  return ['North America', 'Europe', 'Asia', 'South America', 'Africa', 'Oceania'];
};