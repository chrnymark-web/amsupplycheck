#!/usr/bin/env node
// One-shot audit script: pulls supplier tech+material claims and the compatibility
// matrix, computes conflicts, and prints a report.
//
// Usage: node scripts/audit-supplier-conflicts.mjs [--json]
//
// Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env (prefers service role
// so RLS doesn't hide anything). Read-only.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');
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
  pageAll('materials', 'id, name, slug, hidden, canonical_id, is_category, family'),
  pageAll('suppliers', 'id, name, website'),
  pageAll('supplier_technologies', 'supplier_id, technology_id'),
  pageAll('supplier_materials', 'supplier_id, material_id'),
  pageAll('technology_materials_resolved', 'technology_id, material_id'),
]);

// Pure services — don't map to materials by design; skip in orphan analysis
const SERVICE_CATEGORIES = new Set(['Post-Processing', 'Engineering']);
const isServiceTech = (tech) => SERVICE_CATEGORIES.has(tech.category);

const techById = new Map(techs.map((t) => [t.id, t]));
const matById = new Map(mats.map((m) => [m.id, m]));
const supById = new Map(suppliers.map((s) => [s.id, s]));

// Set of valid (tech, material) pairs per the new compatibility matrix
const validPairs = new Set(tmr.map((r) => `${r.technology_id}|${r.material_id}`));

// Generic-category bridging: when a supplier lists a generic category material
// (is_category=true, e.g. "Titanium", "Resin", "Nylon"), treat them as also having
// every specific material in that category for the technology-orphan check.
// Without this, a supplier with SLM + generic "Titanium" gets flagged as a
// technology-orphan even though SLM↔titanium-ti6al4v is in the matrix.
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
const genericExpansion = new Map(); // generic_material_id → Set<specific_material_id>
for (const generic of mats) {
  if (!generic.is_category || generic.hidden) continue;
  const predicate = GENERIC_CATEGORY_BRIDGE[generic.slug];
  if (!predicate) continue;
  const ids = new Set(specificMats.filter(predicate).map((m) => m.id));
  if (ids.size > 0) genericExpansion.set(generic.id, ids);
}

// Returns true if (techId, matId-or-any-of-its-bridged-specifics) has a valid pair
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

// Material orphans: supplier lists material M, but NONE of their techs can process M
// Technology orphans: supplier lists tech T, but NONE of their materials is compatible with T
// These are the real hygiene issues — a supplier with no valid (tech, material) pair for
// one of their items almost certainly has a scraping error.
const orphans = [];
for (const [supId, techSet] of supplierTechs.entries()) {
  const matSet = supplierMats.get(supId);
  if (!matSet) continue;
  const sup = supById.get(supId);
  const supName = sup?.name ?? '(unknown)';
  const supSite = sup?.website ?? '';

  // Material orphans
  for (const matId of matSet) {
    const mat = matById.get(matId);
    if (!mat || mat.hidden || mat.is_category) continue;
    const hasCompatibleTech = [...techSet].some((techId) => {
      const tech = techById.get(techId);
      if (!tech || tech.hidden || isServiceTech(tech)) return false;
      return validPairs.has(`${techId}|${matId}`);
    });
    if (!hasCompatibleTech) {
      orphans.push({
        kind: 'material-orphan',
        supplierId: supId,
        supplierName: supName,
        supplierWebsite: supSite,
        orphanedItem: mat.name,
        orphanedItemId: matId,
        family: mat.family,
        supplierTechs: [...techSet].map((id) => techById.get(id)?.name).filter(Boolean).sort(),
      });
    }
  }

  // Technology orphans
  for (const techId of techSet) {
    const tech = techById.get(techId);
    if (!tech || tech.hidden) continue;
    if (isServiceTech(tech)) continue; // services have no material mapping by design
    const hasCompatibleMat = [...matSet].some((matId) => techHasCompatibleMaterial(techId, matId));
    if (!hasCompatibleMat) {
      orphans.push({
        kind: 'technology-orphan',
        supplierId: supId,
        supplierName: supName,
        supplierWebsite: supSite,
        orphanedItem: tech.name,
        orphanedItemId: techId,
        supplierMats: [...matSet].map((id) => matById.get(id)?.name).filter(Boolean).sort(),
      });
    }
  }
}
const conflicts = orphans;

// Bucket by (kind, orphaned item)
const bucketMap = new Map();
for (const o of orphans) {
  const key = `${o.kind}|${o.orphanedItem}`;
  if (!bucketMap.has(key)) {
    bucketMap.set(key, { kind: o.kind, item: o.orphanedItem, suppliers: new Set() });
  }
  bucketMap.get(key).suppliers.add(o.supplierId);
}
const buckets = [...bucketMap.values()]
  .map((b) => ({ kind: b.kind, item: b.item, count: b.suppliers.size }))
  .sort((a, b) => b.count - a.count);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ total: orphans.length, buckets, orphans }, null, 2));
} else {
  const matOrphans = orphans.filter((o) => o.kind === 'material-orphan');
  const techOrphans = orphans.filter((o) => o.kind === 'technology-orphan');
  console.error(`\nTotal orphans: ${orphans.length}`);
  console.error(`  material-orphans (supplier has material M but no tech can process it): ${matOrphans.length}`);
  console.error(`  technology-orphans (supplier has tech T but no material it can process): ${techOrphans.length}\n`);

  const matBuckets = buckets.filter((b) => b.kind === 'material-orphan');
  const techBuckets = buckets.filter((b) => b.kind === 'technology-orphan');

  console.log('TOP MATERIAL-ORPHANS (material M listed by N suppliers whose techs cannot make M):\n');
  console.log('Count  Material');
  console.log('-----  --------------------------------------');
  for (const b of matBuckets.slice(0, 25)) {
    console.log(`${String(b.count).padStart(5)}  ${b.item}`);
  }

  console.log('\nTOP TECHNOLOGY-ORPHANS (tech T listed by N suppliers whose materials are incompatible):\n');
  console.log('Count  Technology');
  console.log('-----  --------------------------------------');
  for (const b of techBuckets.slice(0, 25)) {
    console.log(`${String(b.count).padStart(5)}  ${b.item}`);
  }
}
