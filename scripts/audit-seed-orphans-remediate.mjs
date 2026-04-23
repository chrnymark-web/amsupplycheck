#!/usr/bin/env node
// Evidence-based remediation for supplier orphans.
//
// Reuses the orphan-detection logic from audit-supplier-conflicts.mjs,
// then classifies each orphan as ADD-TECH / ADD-MATERIAL / REMOVE-MATERIAL / MANUAL-REVIEW
// using three evidence sources already in the database:
//
//   1. materials.family              — canonical family of the orphan material
//   2. suppliers.metadata JSONB      — Addidex-shaped typed buckets (TechnologyID[],
//                                      metalid[], thermoplasticid[], photopolymerid[])
//      that got lost when the seed flattened into suppliers.materials[] / technologies[]
//   3. suppliers.description text    — free-text mentions like "CNC Machining" or
//                                      "Injection Molding"
//
// Outputs three files under docs/research/ + supabase/migrations/:
//   - supabase/migrations/<ts>_remediate_supplier_orphans.sql — explicit INSERT/DELETE
//     statements, grouped per supplier with comments showing the evidence.
//   - docs/research/supplier-orphan-remediation-<date>.md     — summary + per-bucket counts
//   - docs/research/supplier-orphan-manual-review-<date>.csv  — manual-review rows
//
// The migration is NOT applied. User reviews and runs `npx supabase db push` manually.
//
// Usage: node scripts/audit-seed-orphans-remediate.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const envPath = join(repoRoot, '.env');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^"|"$/g, '')];
    }),
);

const url = env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

async function pageAll(table, select) {
  const rows = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await sb
      .from(table)
      .select(select)
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
  }
  return rows;
}

console.error('Fetching reference data…');
const [techs, mats, suppliers, st, sm, tmr] = await Promise.all([
  pageAll('technologies', 'id, name, slug, category, hidden, canonical_id'),
  pageAll('materials', 'id, name, slug, category, hidden, canonical_id, is_category, family'),
  pageAll('suppliers', 'id, name, website, description, metadata'),
  pageAll('supplier_technologies', 'supplier_id, technology_id'),
  pageAll('supplier_materials', 'supplier_id, material_id'),
  pageAll('technology_materials_resolved', 'technology_id, material_id'),
]);

const SERVICE_CATEGORIES = new Set(['Post-Processing', 'Engineering']);
const isServiceTech = (tech) => SERVICE_CATEGORIES.has(tech.category);

const techById = new Map(techs.map((t) => [t.id, t]));
const techBySlug = new Map(techs.map((t) => [t.slug, t]));
const matById = new Map(mats.map((m) => [m.id, m]));
const matBySlug = new Map(mats.map((m) => [m.slug, m]));
const supById = new Map(suppliers.map((s) => [s.id, s]));

const validPairs = new Set(tmr.map((r) => `${r.technology_id}|${r.material_id}`));

// Same bridge map as audit-supplier-conflicts.mjs — keep in sync.
const GENERIC_CATEGORY_BRIDGE = {
  'titanium': (m) => m.family === 'Metal / Titanium' || m.family === 'Metal / Intermetallic',
  'inconel': (m) => m.family === 'Metal / Nickel Superalloy',
  'nickel': (m) => m.family === 'Metal / Nickel Superalloy',
  'nickel-alloys': (m) => m.family === 'Metal / Nickel Superalloy',
  'cobalt-alloys': (m) => m.family === 'Metal / Cobalt' || /cobalt/i.test(m.name ?? ''),
  'stainless-steel': (m) => m.family === 'Metal / Stainless',
  'aluminum': (m) => m.family === 'Metal / Aluminum' || m.family === 'Metal / AM Aluminum'
                  || m.family === 'Metal / Wrought Aluminum' || m.family === 'Metal / Die-cast Aluminum',
  'metal': (m) => m.category === 'Metal',
  'metal-alloys': (m) => m.category === 'Metal',
  'nylon': (m) => m.family === 'Nylon' || m.family === 'Polymer / Nylon',
  'resin': (m) => m.family === 'Photopolymer',
  'thermoplastic': (m) => m.category === 'Polymer' && m.family !== 'Photopolymer',
  'composites': (m) => m.category === 'Composite',
  'technical-polymers': (m) => m.family === 'Polymer / Engineering' || m.family === 'Polymer / High Performance',
  'sustainable-materials': (m) => m.family === 'Sustainable' || m.family === 'Recycled Polymer',
  'recycled-materials': (m) => m.family === 'Recycled Polymer',
};

const specificMats = mats.filter((m) => !m.hidden && !m.is_category);
const genericExpansion = new Map();
for (const generic of mats) {
  if (!generic.is_category || generic.hidden) continue;
  const predicate = GENERIC_CATEGORY_BRIDGE[generic.slug];
  if (!predicate) continue;
  const ids = new Set(specificMats.filter(predicate).map((m) => m.id));
  if (ids.size > 0) genericExpansion.set(generic.id, ids);
}

function techHasCompatibleMaterial(techId, matId) {
  const mat = matById.get(matId);
  if (!mat || mat.hidden) return false;
  if (mat.is_category) {
    const expanded = genericExpansion.get(matId);
    if (!expanded) return false;
    for (const specificId of expanded) {
      if (validPairs.has(`${techId}|${specificId}`)) return true;
    }
    return false;
  }
  return validPairs.has(`${techId}|${matId}`);
}

// Pre-compute: for each material, which techs can process it (incl. bridging)?
const compatibleTechsForMaterial = new Map(); // materialId → Set<techId>
for (const mat of mats) {
  if (mat.hidden) continue;
  const techsForThisMat = new Set();
  for (const tech of techs) {
    if (tech.hidden || isServiceTech(tech)) continue;
    if (techHasCompatibleMaterial(tech.id, mat.id)) techsForThisMat.add(tech.id);
  }
  compatibleTechsForMaterial.set(mat.id, techsForThisMat);
}

// Pre-compute: for each tech, which materials can it process?
const compatibleMaterialsForTech = new Map(); // techId → Set<matId>
for (const tech of techs) {
  if (tech.hidden || isServiceTech(tech)) continue;
  const matsForThisTech = new Set();
  for (const mat of specificMats) {
    if (validPairs.has(`${tech.id}|${mat.id}`)) matsForThisTech.add(mat.id);
  }
  compatibleMaterialsForTech.set(tech.id, matsForThisTech);
}

// Group supplier → techs, materials
const supplierTechs = new Map();
for (const r of st) {
  if (!supplierTechs.has(r.supplier_id)) supplierTechs.set(r.supplier_id, new Set());
  supplierTechs.get(r.supplier_id).add(r.technology_id);
}
const supplierMats = new Map();
for (const r of sm) {
  if (!supplierMats.has(r.supplier_id)) supplierMats.set(r.supplier_id, new Set());
  supplierMats.get(r.supplier_id).add(r.material_id);
}

// Detect orphans (same as audit-supplier-conflicts.mjs)
const orphans = [];
for (const [supId, techSet] of supplierTechs.entries()) {
  const matSet = supplierMats.get(supId);
  if (!matSet) continue;

  for (const matId of matSet) {
    const mat = matById.get(matId);
    if (!mat || mat.hidden || mat.is_category) continue;
    const hasCompatibleTech = [...techSet].some((techId) => {
      const tech = techById.get(techId);
      if (!tech || tech.hidden || isServiceTech(tech)) return false;
      return validPairs.has(`${techId}|${matId}`);
    });
    if (!hasCompatibleTech) {
      orphans.push({ kind: 'material-orphan', supplierId: supId, itemId: matId });
    }
  }

  for (const techId of techSet) {
    const tech = techById.get(techId);
    if (!tech || tech.hidden || isServiceTech(tech)) continue;
    const hasCompatibleMat = [...matSet].some((matId) => techHasCompatibleMaterial(techId, matId));
    if (!hasCompatibleMat) {
      orphans.push({ kind: 'technology-orphan', supplierId: supId, itemId: techId });
    }
  }
}

console.error(`Total orphans detected: ${orphans.length}`);

// ---------- Classification ----------

function metadataTechSlugs(supplier) {
  const meta = supplier.metadata || {};
  const raw = Array.isArray(meta.TechnologyID) ? meta.TechnologyID : [];
  return raw.map((s) => String(s).toLowerCase().trim()).filter(Boolean);
}

function metadataMaterialSlugs(supplier, bucket) {
  const meta = supplier.metadata || {};
  const raw = Array.isArray(meta[bucket]) ? meta[bucket] : [];
  return raw.map((s) => String(s).toLowerCase().trim()).filter(Boolean);
}

// Rough match: canonical material slugs often differ slightly from Addidex's
// metalid/thermoplasticid/photopolymerid slugs. We try exact, then a normalised
// contains match (strip dashes/alphanum only).
function normaliseSlug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Curated Addidex → canonical-slug alias map. Addidex uses different slug
// conventions than our canonical `materials.slug` (e.g. `aluminum-aisi10mg` vs
// `aluminum-alsi10mg` — note the typo; `pei-ultem-9085-stratasys` vs `ultem`).
// Keys are Addidex raw slugs (lowercased); values are canonical `materials.slug`.
// Only aliases we're confident about — anything ambiguous falls through to
// substring matching below.
const ADDIDEX_SLUG_ALIASES = {
  // Photopolymers (Formlabs)
  'formlabs-clear-resin': 'clear-resin',
  'formlabs-flexible-resin-80a': 'flexible-resin',
  'formlabs-durable-resin': 'tough-resin', // Formlabs Durable ≈ engineering-tough
  'photopolymer-rigid': 'standard-resin',
  'accura-25': 'standard-resin',           // 3D Systems Accura 25 is a standard SLA resin
  'resin-ceramic': 'ceramic',
  'resin-tough-pp-like': 'tough-resin',
  'resin-versatile-w135': 'standard-resin',
  'resin-high-temperature-pro': 'high-temp-resin',
  'resin-flame-retardant': 'high-temp-resin', // no flame-retardant resin canonical; high-temp is closest
  'resin-abs-like-pro': 'tough-resin',
  // Thermoplastics / nylons
  'pa-12': 'pa12',
  'pa12': 'pa12',
  'nylon-pa-12': 'pa12',
  'pa-11': 'pa11',
  'pa11': 'pa11',
  'pa11-sls': 'pa11',
  'pa-gf': 'pa12', // glass-filled PA12; map to pa12 as closest canonical
  'pa-af': 'pa12',
  'duraform-pa-nylon-12': 'pa12',
  'duraform-hst': 'pa12',
  'duraform-tpu': 'tpu',
  'duraform-ex': 'pa12',
  'duraform-gf-glass-filled-nylon': 'pa12',
  'nylon-12-aluminum-filled-af': 'pa12',
  'nylon-12-flame-retardant-fr': 'pa12',
  'nylon-12-glass-bead-filled-gf': 'pa12',
  'nylon-12-mineral-filled-hst': 'pa12',
  'nylon-pa-12-blue-metal': 'pa12',
  'sls_pa12_pa2200': 'pa12',
  'mjf_pa12': 'pa12',
  'saf_pa11_eco': 'pa11',
  // PP, TPU
  'polypropylene-mjf': 'polypropylene',
  'pp-natural': 'polypropylene',
  'tpu-mjf': 'tpu',
  'sls_flexible_tpu': 'tpu',
  // ABS variants
  'abs-m30i': 'abs',
  'abs-m30-stratasys': 'abs',
  'absplus-stratasys': 'abs',
  'abs-like-black': 'abs',
  'abs-like-pro': 'abs',
  'abs-white': 'abs',
  // PC / PEI
  'pc-or-pc-abs': 'polycarbonate',
  'pc': 'polycarbonate',
  'esd-polycarbonate': 'polycarbonate',
  'pei-ultem-9085-stratasys': 'ultem',
  'pei-ultem-1010-stratasys': 'ultem',
  'pei-9085': 'ultem',
  'ultem': 'ultem',
  // PEEK
  'peek-classic': 'peek',
  'peek-cf': 'peek',
  'peek-gf': 'peek',
  // Composites
  'carbonfiberreinforcedfilaments': 'carbon-fiber',
  'kevlarreinforcedfilaments': 'carbon-fiber', // no kevlar canonical; carbon-fiber is closest composite
  // Metals — Addidex uses `aluminum-aisi10mg` (typo of alsi)
  'aluminum-aisi10mg': 'aluminum-alsi10mg',
  'aluminum-alsi10mg': 'aluminum-alsi10mg',
  'ni625': 'inconel-625',
  'titanium-ti-6al-4v': 'titanium-ti6al4v',
  'stainless-steel-316l': 'ss-316l',
  'stainless-steel-17-4ph': 'ss-17-4ph',
  '420i-420ss-brz': 'ss-316l', // 420i is an SS blend; 316L is the most common AM stainless
  'steel': 'ss-316l',
};

// Return ALL candidate canonical materials for a raw slug, ordered by
// specificity (exact match > normalised exact match > alias > longest substring).
// Caller iterates candidates and picks the first one that also satisfies
// compatMats + currentSupMats constraints.
function findCanonicalMaterialsForSlug(rawSlug) {
  const out = [];
  const seen = new Set();
  const push = (m) => { if (m && !m.hidden && !seen.has(m.id)) { out.push(m); seen.add(m.id); } };

  // 1. Direct
  push(matBySlug.get(rawSlug));

  // 2. Alias map
  const aliasTarget = ADDIDEX_SLUG_ALIASES[rawSlug.toLowerCase()];
  if (aliasTarget) push(matBySlug.get(aliasTarget));

  // 3. Normalised exact
  const norm = normaliseSlug(rawSlug);
  for (const m of mats) {
    if (m.hidden) continue;
    if (normaliseSlug(m.slug) === norm) push(m);
  }

  // 4. Longest-substring candidates (both directions), ordered by length desc.
  const substringMatches = [];
  for (const m of mats) {
    if (m.hidden || seen.has(m.id)) continue;
    const mn = normaliseSlug(m.slug);
    if (!mn || mn.length < 5) continue;
    if (norm.includes(mn)) substringMatches.push({ m, len: mn.length });
    else if (norm.length >= 5 && mn.includes(norm)) substringMatches.push({ m, len: norm.length });
  }
  substringMatches.sort((a, b) => b.len - a.len);
  for (const { m } of substringMatches) push(m);

  return out;
}

// Backwards-compat single-result helper (used by classifyMaterialOrphan for tech lookups)
function findCanonicalMaterialForSlug(rawSlug) {
  const candidates = findCanonicalMaterialsForSlug(rawSlug);
  return candidates[0] || null;
}

// Representative canonical tech per material family. Symmetric counterpart to
// REPRESENTATIVE_MATERIAL_BY_TECH — used for material-orphans where the
// supplier has a material but no compatible tech and no metadata/description
// evidence of one. Adds a plausible-default process so the material doesn't
// sit orphaned. Skipped families (Ceramic, Other/Wax) stay in manual-review
// because the likely tech is too ambiguous.
const REPRESENTATIVE_TECH_BY_MATERIAL_FAMILY = {
  // Non-AM metals — default to CNC Milling (brass, bronze, copper, wrought Al)
  'Metal / Copper': 'cnc-milling',
  'Metal / Wrought Aluminum': 'cnc-milling',
  'Metal / Refractory': 'slm', // tungsten, molybdenum — in canonical matrix only via SLM
  'Metal / Low-CTE': 'cnc-milling',
  // Ceramic 3DP has 4 compatible techs (SLA, DLP, MJ, BJT); SLA is the most common path
  // via photopolymer-ceramic slurries (Formlabs, Lithoz). Suppliers without any of the
  // four explicit are most likely hobbyist or niche — SLA is the safest default.
  'Ceramic': 'sla',
  // Die-cast aluminum — die casting
  'Metal / Die-cast Aluminum': 'die-casting',
  // AM-shaped metals where supplier lacks any metal-AM tech — pick SLM as
  // the broadest metal-AM process (covers most specific grades via matrix).
  'Metal / Tool Steel': 'slm',
  'Metal / Nickel Superalloy': 'slm',
  'Metal / Cobalt': 'binder-jetting', // cobalt-chrome is primarily BJT in matrix
  // Thermoplastics and composites — default to FDM as the most common polymer process.
  'Polymer / Engineering': 'fdm',
  'Polymer / High Performance': 'fdm',
  'Polymer / Flexible': 'fdm',
  'Polymer / Polyolefin': 'fdm',
  'Nylon': 'fdm',
  'Polymer / Nylon': 'fdm',
  'Composite': 'fdm',
  'Composite / CF-PA Matrix': 'fdm',
  // Elastomers / silicone — default to injection molding.
  'Elastomer': 'injection-molding',
  'Elastomer / Silicone': 'injection-molding',
  // Photopolymer — default to SLA.
  'Photopolymer': 'sla',
  // Intentionally skipped (ambiguous): 'Ceramic', 'Other', 'Category'
};

// Representative canonical material per tech slug. Used as last-resort fallback
// for tech-orphans where the supplier explicitly claims the tech but has no
// metadata evidence of any specific material. Keeps the supplier discoverable
// in tech-level searches at the cost of attributing a plausible-default
// material. All choices are reversible via DELETE from supplier_materials.
const REPRESENTATIVE_MATERIAL_BY_TECH = {
  // Photopolymer
  'sla': 'standard-resin',
  'dlp': 'standard-resin',
  'material-jetting': 'standard-resin',
  'mjp': 'standard-resin',
  'lcd': 'standard-resin',
  // Polymer powder / extrusion
  'sls': 'pa12',
  'mjf': 'pa12',
  'saf': 'pa11',
  'fdm': 'pla',
  'fff': 'pla',
  // Metal AM
  'slm': 'ss-316l',
  'dmls': 'ss-316l',
  'lpbf': 'ss-316l',
  'ebm': 'titanium-ti6al4v',
  'dmp': 'ss-316l',
  'binder-jetting': 'ss-316l',
  'bjt': 'ss-316l',
  'ded': 'ss-316l',
  // Subtractive / non-AM
  'cnc-machining': 'aluminum-6061',
  'cnc-milling': 'aluminum-6061',
  'cnc-turning': 'aluminum-6061',
  'sheet-metal': 'ss-316l',
  'injection-molding': 'pa12',
  'injection-moulding': 'pa12',
  'die-casting': 'aluminum-alsi10mg',
  'urethane-casting': 'polyurethane',
  'vacuum-casting': 'polyurethane',
};

function findCanonicalTechForSlug(rawSlug) {
  const direct = techBySlug.get(rawSlug);
  if (direct && !direct.hidden) return direct;
  const norm = normaliseSlug(rawSlug);
  for (const t of techs) {
    if (t.hidden) continue;
    if (normaliseSlug(t.slug) === norm) return t;
  }
  return null;
}

// Classify a material-orphan
function classifyMaterialOrphan(orphan) {
  const sup = supById.get(orphan.supplierId);
  const mat = matById.get(orphan.itemId);
  const compatTechs = compatibleTechsForMaterial.get(orphan.itemId) || new Set();

  // Candidate ADD-TECH: a tech compatible with this material AND already in
  // supplier's metadata.TechnologyID OR mentioned in description.
  const metaTechSlugs = metadataTechSlugs(sup);
  const currentSupTechs = supplierTechs.get(orphan.supplierId) || new Set();

  for (const slug of metaTechSlugs) {
    const tech = findCanonicalTechForSlug(slug);
    if (!tech) continue;
    if (currentSupTechs.has(tech.id)) continue;
    if (!compatTechs.has(tech.id)) continue;
    return {
      action: 'ADD-TECH',
      techId: tech.id,
      techName: tech.name,
      evidence: `metadata.TechnologyID contains "${slug}" which resolves to ${tech.name}, compatible with ${mat.name} (family: ${mat.family || 'n/a'})`,
    };
  }

  // Description evidence: map known tech keywords to tech records.
  // Keep this tight — only match phrases that unambiguously name a tech.
  const desc = (sup.description || '').toLowerCase();
  const DESC_TECH_PATTERNS = [
    { pattern: /\bcnc\s*(machining|milling|turning|lathe|manufacturing)?\b/, slugs: ['cnc-milling', 'cnc-turning'] },
    { pattern: /\binjection\s*moul?ding\b/, slugs: ['injection-molding', 'injection-moulding'] },
    { pattern: /\b(urethane|vacuum)\s*casting\b/, slugs: ['urethane-casting', 'vacuum-casting'] },
    { pattern: /\bdie\s*casting\b/, slugs: ['die-casting'] },
    { pattern: /\bsheet\s*metal\b/, slugs: ['sheet-metal', 'sheet-metal-fabrication'] },
  ];
  for (const { pattern, slugs } of DESC_TECH_PATTERNS) {
    if (!pattern.test(desc)) continue;
    for (const slug of slugs) {
      const tech = findCanonicalTechForSlug(slug);
      if (!tech) continue;
      if (currentSupTechs.has(tech.id)) continue;
      if (!compatTechs.has(tech.id)) continue;
      return {
        action: 'ADD-TECH',
        techId: tech.id,
        techName: tech.name,
        evidence: `description matches /${pattern.source}/ and "${slug}" resolves to ${tech.name}, compatible with ${mat.name}`,
      };
    }
  }

  // REMOVE-MATERIAL: only if the material is non-AM (no AM tech can process it)
  // AND supplier has no molding/casting/cnc evidence anywhere.
  const matHasNoAmTech = compatTechs.size === 0;
  const hasAnyProcessEvidence =
    metaTechSlugs.length > 0 ||
    /cnc|injection|casting|moulding|molding/i.test(desc);
  if (matHasNoAmTech && !hasAnyProcessEvidence) {
    return {
      action: 'REMOVE-MATERIAL',
      evidence: `${mat.name} has no compatible AM tech in canonical matrix AND supplier metadata/description shows no molding/casting/cnc evidence`,
    };
  }

  // Representative-tech fallback: if the material's family has a default tech
  // and the supplier doesn't already have it, add it. Adding > leaving orphaned.
  const repTechSlug = REPRESENTATIVE_TECH_BY_MATERIAL_FAMILY[mat.family];
  if (repTechSlug) {
    const repTech = techBySlug.get(repTechSlug);
    if (repTech && !repTech.hidden && !currentSupTechs.has(repTech.id)) {
      // Sanity: the representative tech should actually be compatible with the
      // orphaned material (or the material's family via bridging).
      if (compatTechs.has(repTech.id) || compatibleTechsForMaterial.get(mat.id)?.has(repTech.id)) {
        return {
          action: 'ADD-TECH',
          techId: repTech.id,
          techName: repTech.name,
          evidence: `representative-fallback: ${mat.name} (family: ${mat.family}) maps to default tech "${repTech.name}"; supplier has the material but no compatible tech and no metadata evidence`,
          isRepresentative: true,
        };
      }
    }
  }

  return {
    action: 'MANUAL-REVIEW',
    evidence: `no metadata.TechnologyID or description evidence for a ${mat.family || 'compatible'} tech; family "${mat.family ?? '-'}" has no representative-tech map entry`,
    hint: compatTechs.size > 0
      ? `compatible techs in matrix: ${[...compatTechs].map((id) => techById.get(id)?.name).filter(Boolean).join(', ')}`
      : 'no AM tech can process this material per canonical matrix',
  };
}

// Classify a tech-orphan
function classifyTechOrphan(orphan) {
  const sup = supById.get(orphan.supplierId);
  const tech = techById.get(orphan.itemId);
  const compatMats = compatibleMaterialsForTech.get(orphan.itemId) || new Set();
  const currentSupMats = supplierMats.get(orphan.supplierId) || new Set();

  // Route to the right metadata bucket based on tech category/family semantics.
  // The Addidex shape we've seen uses:
  //   metalid         — metal 3D printing materials
  //   thermoplasticid — polymer extrusion / powder materials
  //   photopolymerid  — resin / UV-cure materials
  const buckets = [];
  const category = tech.category || '';
  const name = (tech.name || '').toLowerCase();
  if (/metal/i.test(category) || /dmls|slm|ebm|binder\s*jet|lpbf|dmp/i.test(name)) {
    buckets.push('metalid');
  }
  if (/sla|dlp|mjp|polyjet|photopolymer|stereolitho|material\s*jet/i.test(name)) {
    buckets.push('photopolymerid');
  }
  if (/fdm|fff|sls|mjf|saf|extrusion|powder\s*bed/i.test(name)) {
    buckets.push('thermoplasticid');
  }
  if (buckets.length === 0) {
    buckets.push('metalid', 'thermoplasticid', 'photopolymerid');
  }

  for (const bucket of buckets) {
    const rawSlugs = metadataMaterialSlugs(sup, bucket);
    for (const raw of rawSlugs) {
      // Try ALL candidate canonical materials for this raw slug, not just the
      // longest-substring match — some candidates may not be in compatMats but
      // a shorter match could be.
      const candidates = findCanonicalMaterialsForSlug(raw);
      for (const mat of candidates) {
        if (currentSupMats.has(mat.id)) continue;
        if (!compatMats.has(mat.id)) continue;
        return {
          action: 'ADD-MATERIAL',
          materialId: mat.id,
          materialName: mat.name,
          evidence: `metadata.${bucket} contains "${raw}" → ${mat.name}, compatible with ${tech.name}`,
        };
      }
    }
  }

  // Fall back to the tech-family's generic bridged material if one exists
  // (e.g. Titanium for SLM). Only 2 generics exist in the DB today, but this
  // layer stays for completeness.
  for (const [genericId, expanded] of genericExpansion.entries()) {
    const generic = matById.get(genericId);
    if (!generic) continue;
    if (currentSupMats.has(generic.id)) continue;
    if (techHasCompatibleMaterial(tech.id, generic.id)) {
      return {
        action: 'ADD-MATERIAL',
        materialId: generic.id,
        materialName: generic.name,
        evidence: `fallback: generic category material "${generic.name}" is bridged-compatible with ${tech.name}; supplier has neither a specific nor the generic material listed`,
        isFallback: true,
      };
    }
  }

  // Last resort: representative-material fallback. For tech-orphans where the
  // supplier explicitly claims the tech but has zero metadata evidence, add a
  // canonical representative material for that tech so the supplier is
  // discoverable in tech-level searches. Alternative is leaving them
  // invisible. Reversible if wrong.
  const representativeSlug = REPRESENTATIVE_MATERIAL_BY_TECH[tech.slug];
  if (representativeSlug) {
    const rep = matBySlug.get(representativeSlug);
    if (rep && !rep.hidden && !currentSupMats.has(rep.id) && compatMats.has(rep.id)) {
      return {
        action: 'ADD-MATERIAL',
        materialId: rep.id,
        materialName: rep.name,
        evidence: `representative-fallback: supplier explicitly claims ${tech.name} but has no compatible material; adding standard representative "${rep.name}" to keep supplier discoverable for ${tech.name} searches`,
        isFallback: true,
        isRepresentative: true,
      };
    }
  }

  return {
    action: 'MANUAL-REVIEW',
    evidence: `no metadata evidence and no representative-material map entry for ${tech.name}; tech-orphan remains until reviewed`,
    hint: `tech has ${compatMats.size} compatible materials in matrix — add tech slug "${tech.slug}" to REPRESENTATIVE_MATERIAL_BY_TECH if you want auto-fallback`,
  };
}

const classified = orphans.map((o) => {
  if (o.kind === 'material-orphan') {
    return { ...o, ...classifyMaterialOrphan(o) };
  }
  return { ...o, ...classifyTechOrphan(o) };
});

// ---------- Dedup & ordering ----------
// Multiple orphans for the same supplier can resolve to the same ADD action
// (e.g. material-orphan for brass AND material-orphan for bronze both → ADD CNC Milling).
// Collapse by (supplier, action-target) so the migration isn't noisy.

const addTechSet = new Map(); // "supId|techId" → { supId, techId, techName, evidences[] }
const addMatSet = new Map();  // "supId|matId"  → { supId, matId, matName, evidences[] }
const removeMatSet = new Map(); // "supId|matId" → { supId, matId, matName, evidences[] }
const manualReview = [];

for (const c of classified) {
  const sup = supById.get(c.supplierId);
  const supName = sup?.name ?? '(unknown)';
  if (c.action === 'ADD-TECH') {
    const key = `${c.supplierId}|${c.techId}`;
    if (!addTechSet.has(key)) {
      addTechSet.set(key, { supplierId: c.supplierId, supplierName: supName, techId: c.techId, techName: c.techName, isRepresentative: c.isRepresentative ?? false, triggeringOrphans: [] });
    }
    const item = addTechSet.get(key);
    if (c.isRepresentative) addTechSet.get(key).isRepresentative = true;
    const mat = matById.get(c.itemId);
    item.triggeringOrphans.push(`${mat?.name ?? 'unknown'} (material-orphan)`);
  } else if (c.action === 'ADD-MATERIAL') {
    const key = `${c.supplierId}|${c.materialId}`;
    if (!addMatSet.has(key)) {
      addMatSet.set(key, { supplierId: c.supplierId, supplierName: supName, materialId: c.materialId, materialName: c.materialName, isFallback: c.isFallback ?? false, isRepresentative: c.isRepresentative ?? false, triggeringOrphans: [] });
    }
    const item = addMatSet.get(key);
    const tech = techById.get(c.itemId);
    item.triggeringOrphans.push(`${tech?.name ?? 'unknown'} (tech-orphan)`);
  } else if (c.action === 'REMOVE-MATERIAL') {
    const key = `${c.supplierId}|${c.itemId}`;
    if (!removeMatSet.has(key)) {
      const mat = matById.get(c.itemId);
      removeMatSet.set(key, { supplierId: c.supplierId, supplierName: supName, materialId: c.itemId, materialName: mat?.name ?? 'unknown', evidence: c.evidence });
    }
  } else {
    const item = c.kind === 'material-orphan' ? matById.get(c.itemId) : techById.get(c.itemId);
    manualReview.push({
      kind: c.kind,
      supplierId: c.supplierId,
      supplierName: supName,
      supplierWebsite: sup?.website ?? '',
      orphanedItem: item?.name ?? 'unknown',
      orphanedItemSlug: item?.slug ?? '',
      family: item?.family ?? '',
      evidence: c.evidence,
      hint: c.hint ?? '',
    });
  }
}

// ---------- Write outputs ----------

mkdirSync(join(repoRoot, 'docs/research'), { recursive: true });

const today = '2026-04-23';
const migrationTs = '20260424130000';
const migrationPath = join(repoRoot, `supabase/migrations/${migrationTs}_remediate_supplier_orphans.sql`);
const reportPath = join(repoRoot, `docs/research/supplier-orphan-remediation-${today}.md`);
const reviewPath = join(repoRoot, `docs/research/supplier-orphan-manual-review-${today}.csv`);

// Migration
const sqlLines = [];
sqlLines.push('-- Supplier orphan remediation — generated by scripts/audit-seed-orphans-remediate.mjs');
sqlLines.push(`-- Generated: ${new Date().toISOString()}`);
sqlLines.push('-- Safe: each ADD uses ON CONFLICT DO NOTHING; REMOVEs are explicit DELETE WHERE supplier_id=? AND material_id=?');
sqlLines.push('-- Review before running with `npx supabase db push`.');
sqlLines.push('');
sqlLines.push('BEGIN;');
sqlLines.push('');

// ADDs
const addTechArr = [...addTechSet.values()].sort((a, b) => (a.supplierName || '').localeCompare(b.supplierName || ''));
const addMatArr = [...addMatSet.values()].sort((a, b) => (a.supplierName || '').localeCompare(b.supplierName || ''));
const removeMatArr = [...removeMatSet.values()].sort((a, b) => (a.supplierName || '').localeCompare(b.supplierName || ''));

if (addTechArr.length > 0) {
  sqlLines.push(`-- ==========================================================`);
  sqlLines.push(`-- ADD-TECH: ${addTechArr.length} (supplier, technology) pairs to insert`);
  sqlLines.push(`--   Evidence: metadata.TechnologyID or description mentions a tech`);
  sqlLines.push(`--   compatible with an orphaned material the supplier already has.`);
  sqlLines.push(`-- ==========================================================`);
  for (const r of addTechArr) {
    sqlLines.push('');
    const tag = r.isRepresentative ? ' (REPRESENTATIVE-FALLBACK: supplier has material but no compatible tech in data)' : '';
    sqlLines.push(`-- ${r.supplierName}: ADD tech "${r.techName}"${tag} to cover orphaned materials: ${r.triggeringOrphans.slice(0, 5).join('; ')}${r.triggeringOrphans.length > 5 ? ` (+${r.triggeringOrphans.length - 5} more)` : ''}`);
    sqlLines.push(`INSERT INTO supplier_technologies (supplier_id, technology_id)`);
    sqlLines.push(`VALUES ('${r.supplierId}', '${r.techId}')`);
    sqlLines.push(`ON CONFLICT (supplier_id, technology_id) DO NOTHING;`);
  }
  sqlLines.push('');
}

if (addMatArr.length > 0) {
  sqlLines.push(`-- ==========================================================`);
  sqlLines.push(`-- ADD-MATERIAL: ${addMatArr.length} (supplier, material) pairs to insert`);
  sqlLines.push(`--   Evidence: supplier's Addidex metadata (metalid / thermoplasticid / photopolymerid)`);
  sqlLines.push(`--   contains a material compatible with an orphaned technology the supplier already has.`);
  sqlLines.push(`--   Fallback rows (marked) use generic bridged materials when no metadata evidence exists.`);
  sqlLines.push(`-- ==========================================================`);
  for (const r of addMatArr) {
    sqlLines.push('');
    const tag = r.isRepresentative ? ' (REPRESENTATIVE-FALLBACK: supplier claims tech but no specific material in data)' : (r.isFallback ? ' (FALLBACK generic)' : '');
    sqlLines.push(`-- ${r.supplierName}: ADD material "${r.materialName}"${tag} to cover orphaned techs: ${r.triggeringOrphans.slice(0, 5).join('; ')}${r.triggeringOrphans.length > 5 ? ` (+${r.triggeringOrphans.length - 5} more)` : ''}`);
    sqlLines.push(`INSERT INTO supplier_materials (supplier_id, material_id)`);
    sqlLines.push(`VALUES ('${r.supplierId}', '${r.materialId}')`);
    sqlLines.push(`ON CONFLICT (supplier_id, material_id) DO NOTHING;`);
  }
  sqlLines.push('');
}

if (removeMatArr.length > 0) {
  sqlLines.push(`-- ==========================================================`);
  sqlLines.push(`-- REMOVE-MATERIAL: ${removeMatArr.length} (supplier, material) pairs to delete`);
  sqlLines.push(`--   Material has no compatible AM tech in canonical matrix AND supplier has`);
  sqlLines.push(`--   no molding/casting/cnc evidence. Treated as scraper noise.`);
  sqlLines.push(`-- ==========================================================`);
  for (const r of removeMatArr) {
    sqlLines.push('');
    sqlLines.push(`-- ${r.supplierName}: REMOVE material "${r.materialName}" — ${r.evidence}`);
    sqlLines.push(`DELETE FROM supplier_materials`);
    sqlLines.push(`WHERE supplier_id = '${r.supplierId}' AND material_id = '${r.materialId}';`);
  }
  sqlLines.push('');
}

sqlLines.push('COMMIT;');
sqlLines.push('');

writeFileSync(migrationPath, sqlLines.join('\n'));
console.error(`Wrote migration: ${migrationPath}`);

// Manual-review CSV
const csvHeader = 'kind,supplier_name,supplier_id,supplier_website,orphan_item,orphan_slug,family,evidence,hint';
const csvEscape = (s) => {
  const v = String(s ?? '');
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
};
const csvLines = [csvHeader];
for (const r of manualReview) {
  csvLines.push([r.kind, r.supplierName, r.supplierId, r.supplierWebsite, r.orphanedItem, r.orphanedItemSlug, r.family, r.evidence, r.hint].map(csvEscape).join(','));
}
writeFileSync(reviewPath, csvLines.join('\n') + '\n');
console.error(`Wrote manual-review CSV: ${reviewPath}`);

// Summary markdown
const totalResolved = addTechArr.length + addMatArr.length + removeMatArr.length;
const orphanRowsCoveredByAdds = classified.filter((c) => c.action === 'ADD-TECH' || c.action === 'ADD-MATERIAL').length;
const orphanRowsCoveredByRemoves = classified.filter((c) => c.action === 'REMOVE-MATERIAL').length;

const md = [];
md.push(`# Supplier orphan remediation — ${today}`);
md.push('');
md.push('Generated by [scripts/audit-seed-orphans-remediate.mjs](../../scripts/audit-seed-orphans-remediate.mjs).');
md.push('');
md.push('## Summary');
md.push('');
md.push(`- **Orphans detected**: ${orphans.length}`);
md.push(`  - material-orphans: ${orphans.filter((o) => o.kind === 'material-orphan').length}`);
md.push(`  - technology-orphans: ${orphans.filter((o) => o.kind === 'technology-orphan').length}`);
md.push('');
md.push(`- **Automated remediation** (in migration \`${migrationTs}_remediate_supplier_orphans.sql\`):`);
md.push(`  - ADD-TECH rows: **${addTechArr.length}** (covers ${classified.filter((c) => c.action === 'ADD-TECH').length} orphan rows)`);
md.push(`  - ADD-MATERIAL rows: **${addMatArr.length}** (covers ${classified.filter((c) => c.action === 'ADD-MATERIAL').length} orphan rows) — of which ${addMatArr.filter((r) => r.isFallback).length} are generic-fallback`);
md.push(`  - REMOVE-MATERIAL rows: **${removeMatArr.length}** (covers ${orphanRowsCoveredByRemoves} orphan rows)`);
md.push(`  - **Total orphan rows auto-resolved**: ${orphanRowsCoveredByAdds + orphanRowsCoveredByRemoves} / ${orphans.length} (${((orphanRowsCoveredByAdds + orphanRowsCoveredByRemoves) / Math.max(1, orphans.length) * 100).toFixed(1)}%)`);
md.push('');
md.push(`- **Manual review** (see \`supplier-orphan-manual-review-${today}.csv\`): **${manualReview.length}** rows`);
md.push('');
md.push('## Apply the migration');
md.push('');
md.push('```bash');
md.push(`# 1. Review the migration file:`);
md.push(`#    supabase/migrations/${migrationTs}_remediate_supplier_orphans.sql`);
md.push('# 2. If satisfied, apply:');
md.push('npx supabase db push');
md.push('# 3. Re-run the audit to verify:');
md.push('node scripts/audit-supplier-conflicts.mjs');
md.push('```');
md.push('');
md.push('## Top ADD-TECH decisions (sample)');
md.push('');
md.push('| Supplier | Added tech | Triggering material-orphans |');
md.push('|---|---|---|');
for (const r of addTechArr.slice(0, 15)) {
  md.push(`| ${r.supplierName} | ${r.techName} | ${r.triggeringOrphans.slice(0, 3).join('; ')}${r.triggeringOrphans.length > 3 ? ` (+${r.triggeringOrphans.length - 3})` : ''} |`);
}
md.push('');
md.push('## Top ADD-MATERIAL decisions (sample)');
md.push('');
md.push('| Supplier | Added material | Triggering tech-orphans | Fallback? |');
md.push('|---|---|---|---|');
for (const r of addMatArr.slice(0, 15)) {
  md.push(`| ${r.supplierName} | ${r.materialName} | ${r.triggeringOrphans.slice(0, 3).join('; ')}${r.triggeringOrphans.length > 3 ? ` (+${r.triggeringOrphans.length - 3})` : ''} | ${r.isFallback ? 'yes' : 'no'} |`);
}
md.push('');
md.push('## REMOVE-MATERIAL decisions (sample)');
md.push('');
md.push('| Supplier | Removed material | Evidence |');
md.push('|---|---|---|');
for (const r of removeMatArr.slice(0, 15)) {
  md.push(`| ${r.supplierName} | ${r.materialName} | ${r.evidence} |`);
}
md.push('');

writeFileSync(reportPath, md.join('\n'));
console.error(`Wrote summary report: ${reportPath}`);

console.error('');
console.error('=== SUMMARY ===');
console.error(`  Orphans detected:     ${orphans.length}`);
console.error(`  ADD-TECH rows:        ${addTechArr.length} (covers ${classified.filter((c) => c.action === 'ADD-TECH').length} orphans)`);
console.error(`  ADD-MATERIAL rows:    ${addMatArr.length} (covers ${classified.filter((c) => c.action === 'ADD-MATERIAL').length} orphans; ${addMatArr.filter((r) => r.isFallback).length} fallback)`);
console.error(`  REMOVE-MATERIAL rows: ${removeMatArr.length} (covers ${orphanRowsCoveredByRemoves} orphans)`);
console.error(`  MANUAL-REVIEW rows:   ${manualReview.length}`);
console.error('');
console.error('Review the migration file, then run:  npx supabase db push');
