export const APPLICATION_TYPES = [
  { value: "functional-prototype", label: "Functional prototype" },
  { value: "visual-prototype", label: "Visual/cosmetic prototype" },
  { value: "end-use-production", label: "End-use production part" },
  { value: "tooling-fixtures", label: "Tooling & fixtures" },
  { value: "replacement-part", label: "Replacement/spare part" },
  { value: "medical-device", label: "Medical device/implant" },
] as const;

export const INDUSTRIES = [
  { value: "automotive", label: "Automotive" },
  { value: "aerospace", label: "Aerospace & Defense" },
  { value: "medical", label: "Medical & Pharma" },
  { value: "food", label: "Food & Beverage" },
  { value: "consumer-electronics", label: "Consumer Electronics" },
  { value: "industrial", label: "Industrial / Manufacturing" },
  { value: "architecture", label: "Architecture & Construction" },
  { value: "consumer-goods", label: "Consumer Goods" },
  { value: "other", label: "Other" },
] as const;

export const MECHANICAL_REQUIREMENTS = [
  { value: "high-strength", label: "High strength" },
  { value: "heat-resistant", label: "High temperature resistance" },
  { value: "chemical-resistant", label: "Chemical resistance" },
  { value: "wear-resistant", label: "Wear resistance" },
  { value: "flexibility", label: "Flexibility / Elasticity" },
  { value: "lightweight", label: "Lightweight" },
  { value: "watertight", label: "Watertight / Airtight" },
  { value: "none", label: "None (visual only)" },
] as const;

export const SURFACE_REQUIREMENTS = [
  { value: "standard", label: "Standard (as-printed)" },
  { value: "smooth", label: "Smooth (post-processed)" },
  { value: "cosmetic", label: "High-quality cosmetic" },
  { value: "sterilizable", label: "Sterilizable / Cleanable" },
  { value: "painted", label: "Painted / Colored" },
] as const;

export const PART_SIZES = [
  { value: "small", label: "Small (<10 cm)" },
  { value: "medium", label: "Medium (10-30 cm)" },
  { value: "large", label: "Large (30-100 cm)" },
  { value: "very-large", label: "Very large (>100 cm)" },
] as const;

export const CERTIFICATIONS = [
  { value: "iso-13485", label: "ISO 13485 (Medical)" },
  { value: "as9100", label: "AS9100 (Aerospace)" },
  { value: "iso-9001", label: "ISO 9001" },
  { value: "iatf-16949", label: "IATF 16949 (Automotive)" },
  { value: "food-grade", label: "Food-grade / FDA" },
  { value: "ul-certified", label: "UL Certified" },
  { value: "nadcap", label: "NADCAP" },
  { value: "none", label: "None required" },
] as const;
