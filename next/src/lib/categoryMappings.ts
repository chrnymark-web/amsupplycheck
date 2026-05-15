/**
 * Aggressive categorization for technologies and materials
 * Maps all variations, product names, and generic terms to stable categories
 * Uses catch-all to ensure stable counts (~35 tech, ~47 materials)
 */

export const categorizeTechnology = (tech: string): string => {
  const t = tech.toLowerCase().trim().replace(/-/g, ' ').replace(/_/g, ' ');
  
  // Metal AM Technologies
  if (t.includes('dmls') || t.includes('slm') || t.includes('dmp') || t.includes('direct metal') || t.includes('laser melting') || t.includes('metal laser')) return 'DMLS/SLM';
  if (t.includes('ebm') || t.includes('electron beam')) return 'EBM';
  if (t.includes('lens') || t.includes('ded') || t.includes('directed energy') || t.includes('laser cladding') || t.includes('wire arc') || t.includes('waam') || t.includes('dmd')) return 'DED/LENS';
  if (t.includes('metal binder') || t.includes('metal bjt') || t.includes('cold metal fusion') || t.includes('cmf')) return 'Metal Binder Jetting';
  if (t.includes('cold spray')) return 'Cold Spray';
  
  // Polymer powder bed
  if (t.includes('sls') || t.includes('selective laser sintering') || t.includes('laser sintering')) return 'SLS';
  if (t.includes('mjf') || t.includes('multi jet fusion') || t.includes('multijet fusion') || t.includes('hp jet') || t.includes('hp fusion')) return 'MJF';
  if (t.includes('saf') || t.includes('selective absorption')) return 'SAF';
  if (t.includes('hss') || t.includes('high speed sintering')) return 'HSS';
  
  // Vat photopolymerization
  if (t.includes('sla') || t.includes('stereolithography') || t.includes('vat poly')) return 'SLA';
  if (t.includes('dlp') || t.includes('digital light processing') || t.includes('digital light projection')) return 'DLP';
  if (t.includes('clip') || t.includes('dls') || t.includes('digital light synthesis') || t.includes('continuous liquid') || t.includes('carbon3d')) return 'DLS/CLIP';
  if (t.includes('lcd') || t.includes('msla')) return 'LCD/MSLA';
  
  // Extrusion
  if (t.includes('fdm') || t.includes('fff') || t.includes('fused deposition') || t.includes('fused filament') || t.includes('filament extrusion')) return 'FDM/FFF';
  if (t.includes('fgf') || t.includes('fused granul') || t.includes('pellet')) return 'FGF/Pellet';
  if (t.includes('large format') || t.includes('large scale') || t.includes('baam') || t.includes('big area') || t.includes('builder extreme') || t.includes('cfam')) return 'Large Format AM';
  if (t.includes('robot') && (t.includes('print') || t.includes('deposition') || t.includes('am'))) return 'Robotic AM';
  
  // Material jetting
  if (t.includes('polyjet') || t.includes('poly jet')) return 'PolyJet';
  if (t.includes('multijet') || t.includes('mjp') || t.includes('material jetting')) return 'Material Jetting';
  if (t.includes('cjp') || t.includes('colorjet') || t.includes('full color')) return 'Full Color 3D Printing';
  if (t.includes('nanoparticle') || t.includes('npj')) return 'NanoParticle Jetting';
  if (t.includes('dod') || t.includes('drop on demand')) return 'DOD';
  
  // Binder jetting
  if (t.includes('binder jet') || t.includes('bjt') || t.includes('3dp')) return 'Binder Jetting';
  if (t.includes('sand') && (t.includes('print') || t.includes('casting') || t.includes('mold'))) return 'Sand Casting/Printing';
  
  // Special AM
  if (t.includes('bioprint') || t.includes('bio print')) return 'Bioprinting';
  if (t.includes('concrete') || t.includes('construction') && t.includes('print')) return 'Construction AM';
  if (t.includes('ceramic') && (t.includes('print') || t.includes('am') || t.includes('additive'))) return 'Ceramic AM';
  if (t.includes('gel dispensing') || t.includes('gdp')) return 'Gel Dispensing';
  
  // Generic 3D printing (catch remaining AM terms)
  if (t.includes('3d print') || t.includes('3d druck') || t.includes('additive manufactur') || t.includes('rapid prototype') || t.includes('am ') || t === 'am') return '3D Printing (General)';
  if (t.includes('metal 3d') || t.includes('metal am') || t.includes('metal additive') || t.includes('metal print')) return 'Metal AM (General)';
  
  // CNC/Subtractive
  if (t.includes('cnc mill') || t.includes('cnc fräs') || t.includes('milling') || t.includes('mill ')) return 'CNC Milling';
  if (t.includes('cnc turn') || t.includes('cnc dreh') || t.includes('lathe') || t.includes('turning')) return 'CNC Turning';
  if (t.includes('5 axis') || t.includes('5axis') || t.includes('five axis') || t.includes('3d machin')) return '5-Axis Machining';
  if (t.includes('cnc') || t.includes('machining') || t.includes('numerical') || t.includes('subtractive')) return 'CNC Machining';
  if (t.includes('edm') || t.includes('electrical discharge') || t.includes('wire cut')) return 'EDM';
  if (t.includes('grind') || t.includes('polish')) return 'Grinding/Polishing';
  
  // Molding/Casting
  if (t.includes('injection') && (t.includes('mold') || t.includes('mould'))) return 'Injection Molding';
  if (t.includes('vacuum cast') || t.includes('urethane cast') || t.includes('silicone mold') || t.includes('rtv') || t.includes('pu cast')) return 'Vacuum/Urethane Casting';
  if (t.includes('compression mold')) return 'Compression Molding';
  if (t.includes('die cast')) return 'Die Casting';
  if (t.includes('investment cast') || t.includes('lost wax')) return 'Investment Casting';
  if (t.includes('cast') || t.includes('foundry')) return 'Casting';
  
  // Cutting & Sheet Metal
  if (t.includes('laser cut') || t.includes('laser engrav') || t.includes('flame cut') || t.includes('laser mark')) return 'Laser Cutting/Engraving';
  if (t.includes('water') && t.includes('cut')) return 'Waterjet Cutting';
  if (t.includes('sheet metal') || t.includes('metal forming') || t.includes('stamping') || t.includes('punching')) return 'Sheet Metal';
  if (t.includes('bending') || t.includes('biegen') || t.includes('folding')) return 'Bending/Forming';
  if (t.includes('cutting') && !t.includes('laser') && !t.includes('water')) return 'Cutting';
  
  // Finishing & Post-Processing
  if (t.includes('finishing') || t.includes('post process') || t.includes('vapor smooth') || t.includes('surface treat') || t.includes('coating') || t.includes('plating') || t.includes('anodiz') || t.includes('painting') || t.includes('powder coat')) return 'Post-Processing';
  if (t.includes('heat treat') || t.includes('hip') || t.includes('hot isostatic') || t.includes('stress relief') || t.includes('annealing')) return 'Heat Treatment';
  if (t.includes('deburr') || t.includes('entgrat')) return 'Deburring';
  
  // Other manufacturing
  if (t.includes('extrusion') && !t.includes('fused')) return 'Extrusion';
  if (t.includes('welding') || t.includes('weld') || t.includes('friction stir')) return 'Welding';
  if (t.includes('engrav')) return 'Engraving';
  if (t.includes('thermoform') || t.includes('vacuum form')) return 'Thermoforming';
  if (t.includes('composite') || t.includes('layup') || t.includes('fiber glass') || t.includes('carbon layup')) return 'Composite Manufacturing';
  if (t.includes('foam') || t.includes('eps') || t.includes('polyurethane foam')) return 'Foam Fabrication';
  if (t.includes('wood') || t.includes('carpentry') || t.includes('cnc router')) return 'Woodworking';
  if (t.includes('fabrication') || t.includes('metal fab')) return 'Fabrication';
  
  // Tooling
  if (t.includes('tool') && (t.includes('rapid') || t.includes('mold') || t.includes('making'))) return 'Tooling';
  if (t.includes('prototype') || t.includes('prototyp')) return 'Prototyping';
  
  // Design/Engineering services
  if (t.includes('cad') || t.includes('design') || t.includes('dfm') || t.includes('dfa') || t.includes('modeling')) return 'Design Services';
  if (t.includes('scan') || t.includes('reverse engineer') || t.includes('metrology')) return '3D Scanning';
  if (t.includes('inspection') || t.includes('quality') || t.includes('testing') || t.includes('certification')) return 'Quality/Inspection';
  if (t.includes('assembly') || t.includes('integration')) return 'Assembly';
  if (t.includes('consulting') || t.includes('advisory') || t.includes('training')) return 'Consulting';
  
  // Generic manufacturing catch
  if (t.includes('manufact') || t.includes('production') || t.includes('fabricat') || t.includes('service')) return 'Manufacturing (General)';
  
  // CATCH-ALL - nothing falls through
  return 'Other Manufacturing';
};

export const categorizeMaterial = (mat: string): string => {
  const m = mat.toLowerCase().trim().replace(/-/g, ' ').replace(/_/g, ' ');
  
  // Branded photopolymers → Photopolymer Resin
  if (m.includes('somos') || m.includes('accura') || m.includes('veroclear') || m.includes('verodent') || m.includes('verowhite') || m.includes('veroblack') || m.includes('verogray') || m.includes('vero') || m.includes('objet') || m.includes('keymodel') || m.includes('watershed') || m.includes('accucast') || m.includes('nextdent')) return 'Photopolymer Resin';
  if (m.includes('tango') || m.includes('agilus') || m.includes('flexible resin') || m.includes('elastic resin') || m.includes('flexibel')) return 'Flexible Resin';
  if (m.includes('castable') || m.includes('waxcast') || m.includes('burnout')) return 'Castable Resin';
  if (m.includes('dental') && (m.includes('resin') || m.includes('material'))) return 'Dental Resin';
  if (m.includes('tough') && m.includes('resin')) return 'Tough Resin';
  if (m.includes('clear') && m.includes('resin')) return 'Clear Resin';
  if (m.includes('ceramic') && (m.includes('resin') || m.includes('filled'))) return 'Ceramic-filled Resin';
  if (m.includes('resin') || m.includes('photopolymer') || m.includes('sla material') || m.includes('dlp material') || m.includes('uv cur')) return 'Photopolymer Resin';
  
  // Nylons / Polyamides - branded first
  if (m.includes('ultrasint') && m.includes('pa12')) return 'PA12 (Nylon 12)';
  if (m.includes('ultrasint') && m.includes('tpu')) return 'TPU';
  if (m.includes('ultrasint') || m.includes('duraform') || m.includes('lasersint')) return 'Nylon (General)';
  if (m.includes('pa12') || m.includes('pa 12') || m.includes('nylon 12')) return 'PA12 (Nylon 12)';
  if (m.includes('pa11') || m.includes('pa 11') || m.includes('nylon 11') || m.includes('rilsan')) return 'PA11 (Nylon 11)';
  if (m.includes('pa6') || m.includes('pa 6') || m.includes('nylon 6') || m.includes('pa66')) return 'PA6 (Nylon 6)';
  if (m.includes('glass filled') && (m.includes('nylon') || m.includes('pa'))) return 'Glass-Filled Nylon';
  if (m.includes('carbon filled') && (m.includes('nylon') || m.includes('pa'))) return 'Carbon-Filled Nylon';
  if (m.includes('mineral filled') && (m.includes('nylon') || m.includes('pa'))) return 'Mineral-Filled Nylon';
  if (m.includes('cfpa') || (m.includes('carbon') && m.includes('pa'))) return 'Carbon-Filled Nylon';
  if (m.includes('nylon') || m.includes('polyamide') || m === 'pa' || m.startsWith('pa ')) return 'Nylon (General)';
  
  // Common thermoplastics
  if (m.includes('abs') && !m.includes('abstract')) return 'ABS';
  if ((m.includes('pla') || m === 'pla') && !m.includes('plat') && !m.includes('display') && !m.includes('plasma')) return 'PLA';
  if (m.includes('petg') || m.includes('pet g') || (m.includes('pet') && !m.includes('carpet'))) return 'PETG';
  if (m.includes('asa')) return 'ASA';
  if (m.includes('hips')) return 'HIPS';
  if (m.includes('pc abs') || m.includes('pc/abs') || m.includes('pc + abs')) return 'PC-ABS';
  if (m.includes('polycarbonate') || m === 'pc' || m.startsWith('pc ') || m.includes('lexan') || m.includes('makrolon')) return 'Polycarbonate';
  if (m.includes('ultem') || m.includes('pei') || m.includes('polyetherimide')) return 'PEI/ULTEM';
  if (m.includes('peek') || m.includes('polyether ether ketone')) return 'PEEK';
  if (m.includes('pekk') || m.includes('antero')) return 'PEKK';
  if (m.includes('ppsu') || m.includes('psu') || m.includes('polysulfone')) return 'Polysulfone';
  if (m.includes('pps')) return 'PPS';
  if (m.includes('acetal') || m.includes('pom') || m.includes('delrin')) return 'POM/Acetal';
  if (m.includes('polypropylene') || m === 'pp' || m.startsWith('pp ')) return 'Polypropylene';
  if (m.includes('polyethylene') || m === 'pe' || m.includes('hdpe') || m.includes('ldpe') || m.includes('uhmw')) return 'Polyethylene';
  if (m.includes('acrylic') || m.includes('pmma') || m.includes('plexiglass')) return 'Acrylic/PMMA';
  if (m.includes('pvc')) return 'PVC';
  
  // Flexible/Elastomers
  if (m.includes('tpu') || m.includes('thermoplastic polyurethane')) return 'TPU';
  if (m.includes('tpe') || m.includes('thermoplastic elastomer')) return 'TPE';
  if (m.includes('silicone')) return 'Silicone';
  if (m.includes('rubber') || m.includes('buna') || m.includes('epdm') || m.includes('nbr')) return 'Rubber';
  if (m.includes('elastomer') || m.includes('flexible') || m.includes('dimengel') || m.includes('shore')) return 'Elastomers';
  
  // Metals - Titanium
  if (m.includes('ti64') || m.includes('ti 64') || m.includes('ti6al4v') || m.includes('grade 5 titanium') || m.includes('ti 6al 4v')) return 'Titanium Ti64';
  if (m.includes('titanium') || m.includes(' ti ') || m === 'ti' || m.startsWith('ti ')) return 'Titanium';
  
  // Metals - Aluminum
  if (m.includes('alsi10mg') || m.includes('alsi 10mg') || m.includes('a10')) return 'Aluminum AlSi10Mg';
  if (m.includes('alumide')) return 'Alumide';
  if (m.includes('aluminum') || m.includes('aluminium') || m.includes(' al ') || m === 'al' || m.includes('6061') || m.includes('7075') || m.includes('2024')) return 'Aluminum';
  
  // Metals - Steel
  if (m.includes('316l') || m.includes('304l') || m.includes('stainless') || m.includes('ss ') || m.includes('inox')) return 'Stainless Steel';
  if (m.includes('17 4') || m.includes('17 4ph') || m.includes('ph') && m.includes('steel')) return '17-4PH Steel';
  if (m.includes('maraging') || m.includes('ms1') || m.includes('1.2709')) return 'Maraging Steel';
  if (m.includes('tool steel') || m.includes('h13') || m.includes('d2') || m.includes('m2') || m.includes('skd')) return 'Tool Steel';
  if (m.includes('steel') || m.includes('stahl') || m.includes('1018') || m.includes('4140') || m.includes('mild steel')) return 'Steel';
  
  // Metals - Super alloys
  if (m.includes('inconel') || m.includes('in625') || m.includes('in718') || m.includes('625') || m.includes('718')) return 'Inconel';
  if (m.includes('cobalt') || m.includes('cocr') || m.includes('co cr') || m.includes('stellite')) return 'Cobalt Chrome';
  if (m.includes('hastelloy')) return 'Hastelloy';
  if (m.includes('nickel') && !m.includes('inconel')) return 'Nickel Alloys';
  
  // Metals - Other
  if (m.includes('copper') || m === 'cu' || m.startsWith('cu ') || m.includes('cuw')) return 'Copper';
  if (m.includes('bronze')) return 'Bronze';
  if (m.includes('brass')) return 'Brass';
  if (m.includes('tungsten') || m.includes('wolfram') || m.includes(' w ')) return 'Tungsten';
  if (m.includes('gold') || m.includes(' au ') || m === 'au') return 'Gold';
  if (m.includes('silver') || m.includes(' ag ') || m === 'ag') return 'Silver';
  if (m.includes('platinum') || m.includes(' pt ') || m === 'pt' || m.includes('precious')) return 'Precious Metals';
  if (m.includes('magnesium') || m.includes(' mg ') || m === 'mg') return 'Magnesium';
  if (m.includes('zinc') || m.includes(' zn ') || m === 'zn' || m.includes('zamak')) return 'Zinc';
  
  // Composites & Fiber-Reinforced
  if (m.includes('onyx') || m.includes('markforged') || m.includes('continuous fiber') || m.includes('cfr') || m.includes('fiber reinforced')) return 'Continuous Fiber Composite';
  if (m.includes('carbon fiber') || m.includes('cfrp') || m.includes('cf ') || m.includes(' cf') || m.includes('carbonx')) return 'Carbon Fiber';
  if (m.includes('fiberglass') || m.includes('glass fiber') || m.includes('gfrp') || m.includes('gf ') || m.includes(' gf')) return 'Fiberglass';
  if (m.includes('kevlar') || m.includes('aramid')) return 'Kevlar/Aramid';
  if (m.includes('composite')) return 'Composites (General)';
  
  // Ceramics
  if (m.includes('zirconia') || m.includes('zro2')) return 'Zirconia';
  if (m.includes('alumina') || m.includes('al2o3')) return 'Alumina';
  if (m.includes('boron') || m.includes('nitride') || m.includes('carbide')) return 'Technical Ceramics';
  if (m.includes('ceramic')) return 'Ceramics';
  
  // Specialty / Properties based → group together
  if (m.includes('flame retardant') || m.includes('fire resistant') || m.includes('fr ') || m.includes('v0') || m.includes('ul94')) return 'Flame Retardant';
  if (m.includes('esd') || m.includes('anti static') || m.includes('antistatic') || m.includes('conductive') || m.includes('static dissipative')) return 'ESD/Conductive';
  if (m.includes('food safe') || m.includes('food grade') || m.includes('fda') || m.includes('food contact')) return 'Food Safe';
  if (m.includes('medical grade') || m.includes('biocompatible') || m.includes('iso 10993') || m.includes('usp class') || m.includes('implant')) return 'Medical Grade';
  if (m.includes('uv resistant') || m.includes('weatherable') || m.includes('outdoor') || m.includes('uv stable')) return 'UV Resistant';
  if (m.includes('high temp') || m.includes('heat resistant') || m.includes('high temperature') || m.includes('temperature resistant')) return 'High Temperature';
  
  // Bio materials
  if (m.includes('bioplastic') || m.includes('biopolymer') || m.includes('pha') || m.includes('bio sourced')) return 'Bioplastics';
  if (m.includes('biodegradable') || m.includes('compostable')) return 'Biodegradable';
  if (m.includes('recyclable') || m.includes('recycled') || m.includes('circular') || m.includes('regrind')) return 'Recycled Materials';
  
  // Generic/Catch categories
  if (m.includes('thermoplastic') || m.includes('polymer') || m.includes('plastic') || m.includes('engineering plastic') || m.includes('technical plastic')) return 'Polymers (General)';
  if (m.includes('metal') || m.includes('alloy') || m.includes('powder metal') || m.includes('metal powder')) return 'Metals (General)';
  if (m.includes('filament') || m.includes('fdm material') || m.includes('fff material') || m.includes('spool')) return 'FDM Filament';
  if (m.includes('powder') || m.includes('sls material') || m.includes('mjf material') || m.includes('sintering')) return 'Sintering Powder';
  if (m.includes('wax')) return 'Wax';
  if (m.includes('wood') || m.includes('mdf') || m.includes('plywood') || m.includes('bamboo')) return 'Wood';
  if (m.includes('foam') || m.includes('eps') || m.includes('pu foam') || m.includes('xps')) return 'Foam';
  if (m.includes('sand') || m.includes('foundry')) return 'Foundry Sand';
  if (m.includes('concrete') || m.includes('cement') || m.includes('clay') || m.includes('adobe')) return 'Concrete/Clay';
  if (m.includes('glass') && !m.includes('fiber') && !m.includes('filled')) return 'Glass';
  if (m.includes('paper') || m.includes('cardboard')) return 'Paper/Cardboard';
  
  // CATCH-ALL - nothing falls through
  return 'Other Materials';
};

// Helper functions to count unique categories
export const countTechnologyCategories = (technologies: string[]): number => {
  const categories = new Set(
    technologies
      .filter(tech => tech && tech.trim() !== '')
      .map(categorizeTechnology)
  );
  return categories.size;
};

export const countMaterialCategories = (materials: string[]): number => {
  const categories = new Set(
    materials
      .filter(mat => mat && mat.trim() !== '')
      .map(categorizeMaterial)
  );
  return categories.size;
};
