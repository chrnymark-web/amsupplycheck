// Classify a raw materialConfigId (from Craftcloud/Treatstock) to a canonical
// technology + human-readable material name. Canonical tech keys match
// `technologyPriceIndex` in technologyMaterialCompatibility.ts.

import { materialPriceIndex, technologyPriceIndex } from './technologyMaterialCompatibility';

export type Confidence = 'exact' | 'heuristic' | 'unknown';

export interface ClassifyResult {
  technology: string;   // canonical key, '' if unknown
  material: string;     // normalized human-readable name
  confidence: Confidence;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Mirror craftcloud.ts formatMaterialId so downstream naming stays consistent.
function normalizeMaterialName(raw: string): string {
  if (!raw) return '';
  if (UUID_RE.test(raw)) return '';
  return raw
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Build once: lowercased material name → canonical technology key.
// Pulls every material that has a definite tech via materialCategories/materialPriceIndex
// keys that uniquely suggest a process.
const EXACT_MATERIAL_TO_TECH: Map<string, string> = (() => {
  const map = new Map<string, string>();
  // Every material in materialPriceIndex — categorize by heuristic regex once so
  // the runtime path is a pure Map lookup.
  const categorize = (mat: string): string => {
    if (/titanium|inconel|maraging|aluminum\s*alsi|stainless|nickel|steel|bronze|brass/i.test(mat)) return 'DMLS';
    if (/ultem|pei/i.test(mat)) return 'FDM/FFF';
    if (/mjf|multi\s*jet\s*fusion|ultrasint|saf|pa11\s*eco|polypropylene\s*\(mjf\)/i.test(mat)) return 'Multi Jet Fusion';
    if (/sls\b|pa[-\s]?12|pa[-\s]?11|duraform|nylon|polypropylene|tpu\s*mjf|sls\s*flexible|ultrasint/i.test(mat)) return 'SLS';
    if (/resin|accura|somos|photopolymer/i.test(mat)) return 'SLA';
    if (/tpu\s*\(flexible\)/i.test(mat)) return 'FDM/FFF';
    if (/pla\b|abs\b|petg|hips|polycarbonate|pc\/pc-abs|wood\s*filled|carbon\s*fiber|kevlar/i.test(mat)) return 'FDM/FFF';
    return '';
  };
  for (const matName of Object.keys(materialPriceIndex)) {
    const tech = categorize(matName);
    if (tech) map.set(matName.toLowerCase(), tech);
  }
  return map;
})();

// Regex fallbacks — ordered most-specific first. Hits on raw ID OR hint.
const PATTERNS: Array<[RegExp, string]> = [
  // Metal powder beds (very specific material names)
  [/titanium|ti[-_]?6al|inconel|maraging|aluminum\s*alsi|stainless.*17[-_]?4|stainless.*316|dmls|\bslm\b/i, 'DMLS'],
  // Binder jetting / full-color sandstone
  [/binder[-_\s]?jet|sandstone|full[-_\s]?color/i, 'Binder Jetting'],
  // Material jetting / polyjet / Vero / J-series
  [/polyjet|material[-_\s]?jet|j750|vero\b/i, 'Material Jetting'],
  // MJF / SAF — HP/Stratasys powder fusion
  [/\bmjf\b|multi[-_\s]?jet[-_\s]?fusion|ultrasint|\bsaf\b|pa11[-_\s]?eco|polypropylene\s*\(mjf\)/i, 'Multi Jet Fusion'],
  // SLS — powder-bed nylon/TPU. Order after MJF so MJF-specific hits there first.
  [/\bsls\b|\bpa[-_\s]?12\b|\bpa12\b|\bpa[-_\s]?11\b|\bpa11\b|nylon|duraform|tpu(?!\s*\(flexible\))/i, 'SLS'],
  // Resin family (SLA/DLP all treated as SLA for pricing)
  [/\bresin\b|\bsla\b|\bdlp\b|cdlp|somos|accura|photopolymer|high[-_\s]?temp\s*resin|clear\s*resin|standard[-_\s]?resin|tough\s*resin/i, 'SLA'],
  // Filament / FDM
  [/\bpla\b|\babs\b|petg|tpu\s*\(flexible\)|hips|polycarbonate|pc\/pc[-_]?abs|asa\b|\bfdm\b|\bfff\b|ultem|pei\b/i, 'FDM/FFF'],
];

const loggedUnknown = new Set<string>();

export function classifyMaterialConfigId(
  materialConfigId: string,
  hint?: string
): ClassifyResult {
  if (!materialConfigId) {
    return { technology: '', material: '', confidence: 'unknown' };
  }

  if (UUID_RE.test(materialConfigId)) {
    if (!loggedUnknown.has(materialConfigId)) {
      loggedUnknown.add(materialConfigId);
      console.info('[classifier] opaque UUID materialConfigId, skipping classification:', materialConfigId);
    }
    return { technology: '', material: '', confidence: 'unknown' };
  }

  const material = normalizeMaterialName(materialConfigId);

  // Exact match against known material list
  const exact = EXACT_MATERIAL_TO_TECH.get(material.toLowerCase());
  if (exact) {
    return { technology: exact, material, confidence: 'exact' };
  }

  // Regex fallback over raw ID + hint (Treatstock passes materialGroup as hint)
  const haystack = `${materialConfigId} ${hint ?? ''}`;
  for (const [rx, tech] of PATTERNS) {
    if (rx.test(haystack)) {
      return { technology: tech, material, confidence: 'heuristic' };
    }
  }

  // Couldn't classify — quote stays but will be excluded by any active tech filter.
  const key = `${materialConfigId}::${hint ?? ''}`;
  if (!loggedUnknown.has(key)) {
    loggedUnknown.add(key);
    console.info('[classifier] unclassified material:', materialConfigId, hint ? `(hint: ${hint})` : '');
  }
  return { technology: '', material, confidence: 'unknown' };
}

// Legacy/database keys that don't match `technologyPriceIndex` exactly.
// Re-used from supplierPricing.ts logic so all tech normalization goes through
// one place.
const TECH_ALIASES: Record<string, string> = {
  fdm: 'FDM/FFF',
  fff: 'FDM/FFF',
  'fdm/fff': 'FDM/FFF',
  sla: 'SLA',
  dlp: 'DLP',
  cdlp: 'CDLP (Continuous Digital Light Processing)',
  sls: 'SLS',
  mjf: 'Multi Jet Fusion',
  'multi jet fusion': 'Multi Jet Fusion',
  saf: 'SAF',
  dmls: 'DMLS',
  slm: 'SLM',
  dmp: 'Direct Metal Printing',
  'direct metal printing': 'Direct Metal Printing',
  'material jetting': 'Material Jetting',
  'material-jetting': 'Material Jetting',
  'binder jetting': 'Binder Jetting',
  'binder-jetting': 'Binder Jetting',
};

// Map any tech string (from DB, ConfiguratorPanel, Supabase view) to a
// canonical key matching technologyPriceIndex. Returns '' if unknown.
export function normalizeTechKey(raw: string): string {
  if (!raw) return '';
  if (technologyPriceIndex[raw]) return raw;       // already canonical
  const alias = TECH_ALIASES[raw.toLowerCase()];
  if (alias && technologyPriceIndex[alias]) return alias;
  return '';
}

// Filter an array of LiveQuote-like objects by user-selected tech/material.
// Empty string for either filter means "Any".
export function filterQuotesByTech<T extends { technology: string; material: string }>(
  quotes: T[],
  selectedTech: string,
  selectedMaterial: string
): T[] {
  const normTech = normalizeTechKey(selectedTech);
  if (!normTech && !selectedMaterial) return quotes;
  const matNeedle = selectedMaterial.toLowerCase();
  return quotes.filter((q) => {
    if (normTech && q.technology !== normTech) return false;
    if (matNeedle && !q.material.toLowerCase().includes(matNeedle)) return false;
    return true;
  });
}
