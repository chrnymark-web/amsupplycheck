// Mapping between user requirements and suitable AM technologies/materials/certifications
// This file makes it easy to update mappings as new materials/technologies become available

export const APPLICATION_TYPES = [
  { value: 'functional-prototype', label: 'Functional prototype' },
  { value: 'visual-prototype', label: 'Visual/cosmetic prototype' },
  { value: 'end-use-production', label: 'End-use production part' },
  { value: 'tooling-fixtures', label: 'Tooling & fixtures' },
  { value: 'replacement-part', label: 'Replacement/spare part' },
  { value: 'medical-device', label: 'Medical device/implant' },
] as const;

export const INDUSTRIES = [
  { value: 'automotive', label: 'Automotive' },
  { value: 'aerospace', label: 'Aerospace & Defense' },
  { value: 'medical', label: 'Medical & Pharma' },
  { value: 'food', label: 'Food & Beverage' },
  { value: 'consumer-electronics', label: 'Consumer Electronics' },
  { value: 'industrial', label: 'Industrial / Manufacturing' },
  { value: 'architecture', label: 'Architecture & Construction' },
  { value: 'consumer-goods', label: 'Consumer Goods' },
  { value: 'other', label: 'Other' },
] as const;

export const MECHANICAL_REQUIREMENTS = [
  { value: 'high-strength', label: 'High strength' },
  { value: 'heat-resistant', label: 'High temperature resistance' },
  { value: 'chemical-resistant', label: 'Chemical resistance' },
  { value: 'wear-resistant', label: 'Wear resistance' },
  { value: 'flexibility', label: 'Flexibility / Elasticity' },
  { value: 'lightweight', label: 'Lightweight' },
  { value: 'watertight', label: 'Watertight / Airtight' },
  { value: 'none', label: 'None (visual only)' },
] as const;

export const SURFACE_REQUIREMENTS = [
  { value: 'standard', label: 'Standard (as-printed)' },
  { value: 'smooth', label: 'Smooth (post-processed)' },
  { value: 'cosmetic', label: 'High-quality cosmetic' },
  { value: 'sterilizable', label: 'Sterilizable / Cleanable' },
  { value: 'painted', label: 'Painted / Colored' },
] as const;

export const PART_SIZES = [
  { value: 'small', label: 'Small (<10 cm)' },
  { value: 'medium', label: 'Medium (10-30 cm)' },
  { value: 'large', label: 'Large (30-100 cm)' },
  { value: 'very-large', label: 'Very large (>100 cm)' },
] as const;

export const CERTIFICATIONS = [
  { value: 'iso-13485', label: 'ISO 13485 (Medical)' },
  { value: 'as9100', label: 'AS9100 (Aerospace)' },
  { value: 'iso-9001', label: 'ISO 9001' },
  { value: 'iatf-16949', label: 'IATF 16949 (Automotive)' },
  { value: 'food-grade', label: 'Food-grade / FDA' },
  { value: 'ul-certified', label: 'UL Certified' },
  { value: 'nadcap', label: 'NADCAP' },
  { value: 'none', label: 'None required' },
] as const;

// Industry to recommended technologies/materials mapping
export const industryToTechnologies: Record<string, string[]> = {
  'automotive': ['SLS', 'Multi Jet Fusion', 'DMLS', 'SLM', 'Carbon Fiber'],
  'aerospace': ['DMLS', 'SLM', 'SLS', 'Titanium', 'Inconel', 'Aluminum'],
  'medical': ['SLA', 'SLS', 'DMLS', 'Biocompatible Resin', 'Titanium', 'Surgical Steel'],
  'food': ['SLS', 'Multi Jet Fusion', 'PA-11', 'PP', 'FDA-approved materials'],
  'consumer-electronics': ['SLS', 'Multi Jet Fusion', 'SLA', 'Material Jetting'],
  'industrial': ['SLS', 'FDM', 'Multi Jet Fusion', 'DMLS'],
  'architecture': ['SLA', 'Material Jetting', 'Binder Jetting', 'FDM'],
  'consumer-goods': ['SLS', 'Multi Jet Fusion', 'SLA', 'Material Jetting'],
};

// Industry to typically required certifications
export const industryToCertifications: Record<string, string[]> = {
  'automotive': ['iatf-16949', 'iso-9001'],
  'aerospace': ['as9100', 'nadcap', 'iso-9001'],
  'medical': ['iso-13485', 'fda', 'iso-9001'],
  'food': ['food-grade', 'iso-9001'],
  'consumer-electronics': ['ul-certified', 'iso-9001'],
  'industrial': ['iso-9001'],
};

// Mechanical requirements to technologies/materials mapping
export const mechanicalToTechnologies: Record<string, string[]> = {
  'high-strength': ['SLS', 'Multi Jet Fusion', 'DMLS', 'SLM', 'Carbon Fiber', 'Nylon PA-12'],
  'heat-resistant': ['ULTEM', 'PEEK', 'DMLS', 'SLM', 'Inconel', 'Titanium', 'High-Temp Resin'],
  'chemical-resistant': ['PETG', 'PP', 'PA-11', 'PEEK', 'Stainless Steel'],
  'wear-resistant': ['Nylon', 'PEEK', 'Carbon Fiber', 'Metal printing'],
  'flexibility': ['TPU', 'Flexible Resin', 'Rubber-like'],
  'lightweight': ['SLS', 'Multi Jet Fusion', 'Aluminum', 'Carbon Fiber'],
  'watertight': ['SLA', 'SLS', 'Multi Jet Fusion', 'Metal printing'],
};

// Surface requirements to technologies mapping
export const surfaceToTechnologies: Record<string, string[]> = {
  'standard': ['FDM', 'SLS', 'Multi Jet Fusion'],
  'smooth': ['SLA', 'Material Jetting', 'DLP', 'SLS with polishing'],
  'cosmetic': ['SLA', 'Material Jetting', 'PolyJet', 'SLS with dyeing'],
  'sterilizable': ['SLA Medical', 'DMLS', 'SLM', 'Autoclavable materials'],
  'painted': ['SLS', 'Multi Jet Fusion', 'SLA', 'FDM'],
};

// Part size to suitable technologies
export const sizeToTechnologies: Record<string, string[]> = {
  'small': ['SLA', 'DLP', 'Material Jetting', 'DMLS', 'SLS'],
  'medium': ['SLS', 'Multi Jet Fusion', 'SLA', 'FDM', 'DMLS'],
  'large': ['FDM', 'SLS', 'Binder Jetting', 'WAAM'],
  'very-large': ['Large-format FDM', 'WAAM', 'BAAM', 'Robotic DED'],
};

// Application type to technologies mapping
export const applicationToTechnologies: Record<string, string[]> = {
  'functional-prototype': ['SLS', 'Multi Jet Fusion', 'FDM', 'SLA'],
  'visual-prototype': ['SLA', 'Material Jetting', 'PolyJet', 'DLP'],
  'end-use-production': ['SLS', 'Multi Jet Fusion', 'DMLS', 'SLM', 'SAF'],
  'tooling-fixtures': ['FDM', 'SLS', 'Multi Jet Fusion', 'DMLS'],
  'replacement-part': ['SLS', 'FDM', 'DMLS', 'Multi Jet Fusion'],
  'medical-device': ['SLA', 'DMLS', 'SLM', 'Biocompatible materials'],
};

export type ApplicationType = typeof APPLICATION_TYPES[number]['value'];
export type Industry = typeof INDUSTRIES[number]['value'];
export type MechanicalRequirement = typeof MECHANICAL_REQUIREMENTS[number]['value'];
export type SurfaceRequirement = typeof SURFACE_REQUIREMENTS[number]['value'];
export type PartSize = typeof PART_SIZES[number]['value'];
export type Certification = typeof CERTIFICATIONS[number]['value'];
