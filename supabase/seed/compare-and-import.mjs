/**
 * Compare all supplier sources, find overlaps, identify new suppliers,
 * generate import SQL and sitemap.xml
 *
 * Run: node supabase/seed/compare-and-import.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DL = process.env.HOME + '/Downloads';

// ── Helpers ──────────────────────────────────────────────────
function parseCSV(path, sep = ',') {
  const content = readFileSync(path, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(sep).map(h => h.replace(/^"|"$/g, '').trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const row = {};
    let fields = [], current = '', inQ = false;
    for (let j = 0; j < lines[i].length; j++) {
      const c = lines[i][j];
      if (c === '"') { if (inQ && lines[i][j+1] === '"') { current += '"'; j++; } else inQ = !inQ; }
      else if (c === sep && !inQ) { fields.push(current); current = ''; }
      else current += c;
    }
    fields.push(current);
    headers.forEach((h, idx) => { row[h] = (fields[idx] || '').trim(); });
    rows.push(row);
  }
  return rows;
}

function normDomain(url) {
  if (!url) return '';
  try {
    return new URL(url.startsWith('http') ? url : 'https://' + url).hostname.replace(/^www\./, '').toLowerCase();
  } catch { return url.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').split('/')[0]; }
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 60);
}

function esc(v) {
  if (!v || v === '') return 'NULL';
  return "'" + v.replace(/'/g, "''") + "'";
}

// ── Load all sources ─────────────────────────────────────────

// 1. Current DB (from main export)
const dbSuppliers = parseCSV(join(DL, 'suppliers-export-2026-03-26_00-10-50.csv'), ';');
const dbDomains = new Map();
dbSuppliers.forEach(s => {
  const d = normDomain(s.website);
  if (d) dbDomains.set(d, s);
});

// 2. Addidex suppliers
const addidex = parseCSV(join(DL, 'addidex_suppliers.csv'));

// 3. Treatstock suppliers
const treatstock = parseCSV(join(DL, 'treatstock.csv'));

// 4. Suppliers.csv (Sharetribe format)
const sharetribe = parseCSV(join(DL, 'suppliers.csv'));

// 5. all-suppliers-export.csv
const allExport = parseCSV(join(DL, 'all-suppliers-export.csv'));

console.log('='.repeat(60));
console.log('  AMSupplyCheck - Supplier Source Comparison');
console.log('='.repeat(60));
console.log(`\n📊 SOURCE SIZES:`);
console.log(`  Database (main):     ${dbSuppliers.length} suppliers (${dbDomains.size} unique domains)`);
console.log(`  Addidex:             ${addidex.length} suppliers`);
console.log(`  Treatstock:          ${treatstock.length} suppliers`);
console.log(`  Sharetribe export:   ${sharetribe.length} suppliers`);
console.log(`  All-suppliers CSV:   ${allExport.length} suppliers`);

// ── Compare each source against DB ──────────────────────────

function compareSource(name, entries, getUrl, getName) {
  const overlap = [];
  const newOnes = [];
  const seen = new Set();

  for (const e of entries) {
    const url = getUrl(e);
    const domain = normDomain(url);
    if (!domain || seen.has(domain)) continue;
    seen.add(domain);

    if (dbDomains.has(domain)) {
      overlap.push({ name: getName(e), domain, dbName: dbDomains.get(domain).name });
    } else {
      newOnes.push({ name: getName(e), url, domain });
    }
  }

  console.log(`\n── ${name} ──`);
  console.log(`  Unique domains: ${seen.size}`);
  console.log(`  Already in DB:  ${overlap.length}`);
  console.log(`  NEW suppliers:  ${newOnes.length}`);

  if (newOnes.length > 0 && newOnes.length <= 60) {
    console.log(`  New entries:`);
    newOnes.forEach(n => console.log(`    + ${n.name.padEnd(40)} ${n.domain}`));
  }

  return { overlap, newOnes };
}

const addidexResult = compareSource(
  'Addidex', addidex,
  e => e.Website, e => e.Brand
);

const treatstockResult = compareSource(
  'Treatstock', treatstock,
  e => e['designer-card__avatar href']?.replace('https://www.treatstock.com/c/', 'https://treatstock.com/'),
  e => e['designer-card__username']
);

const sharetribeResult = compareSource(
  'Sharetribe', sharetribe,
  e => { try { const pd = JSON.parse(e.PublicData || '{}'); return pd.affiliatelinkid; } catch { return ''; } },
  e => e.Title
);

const allExportResult = compareSource(
  'All-suppliers Export', allExport,
  e => e.website, e => e.name
);

// ── Deduplicated list of ALL new suppliers ──────────────────

const allNew = new Map();
function addNew(source, entries) {
  for (const e of entries) {
    if (!allNew.has(e.domain)) {
      allNew.set(e.domain, { ...e, source });
    }
  }
}
addNew('addidex', addidexResult.newOnes);
addNew('treatstock', treatstockResult.newOnes);
addNew('sharetribe', sharetribeResult.newOnes);
addNew('all-export', allExportResult.newOnes);

console.log(`\n${'='.repeat(60)}`);
console.log(`  TOTAL NEW UNIQUE SUPPLIERS: ${allNew.size}`);
console.log('='.repeat(60));

// ── Generate import SQL ─────────────────────────────────────

let importSql = '-- New suppliers to import (not yet in DB)\n-- Generated from addidex, treatstock, sharetribe, all-suppliers-export\n\n';

let count = 0;
for (const [domain, s] of allNew) {
  const sid = slugify(s.name);
  const url = s.url || `https://${domain}`;
  importSql += `INSERT INTO suppliers (supplier_id, name, website, verified, premium, rating, review_count, description) VALUES (${esc(sid)}, ${esc(s.name)}, ${esc(url)}, false, false, 0, 0, ${esc(`Imported from ${s.source}`)}) ON CONFLICT (supplier_id) DO NOTHING;\n`;
  count++;
}

const importPath = join(__dirname, 'import-new-suppliers.sql');
writeFileSync(importPath, importSql, 'utf-8');
console.log(`\n✅ Import SQL: ${importPath} (${count} suppliers)`);

// ── Generate sitemap.xml ────────────────────────────────────

const BASE = 'https://amsupplycheck.com';
const today = new Date().toISOString().split('T')[0];

let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static pages -->
  <url><loc>${BASE}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${BASE}/search</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${BASE}/suppliers</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${BASE}/knowledge</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>${BASE}/browse</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>
  <url><loc>${BASE}/about</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>${BASE}/instant-3d-printing-quotes</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>
`;

// Supplier pages
const allSupplierIds = new Set();
for (const s of dbSuppliers) {
  const sid = s.supplier_id;
  if (sid && !allSupplierIds.has(sid)) {
    allSupplierIds.add(sid);
    sitemap += `  <url><loc>${BASE}/suppliers/${encodeURIComponent(sid)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
  }
}

// Technology pages
const technologies = parseCSV(join(DL, 'technologies-export-2026-03-26_00-11-17.csv'), ';');
for (const t of technologies) {
  if (t.slug) sitemap += `  <url><loc>${BASE}/knowledge/technology/${t.slug}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>\n`;
}

// Material pages
const materials = parseCSV(join(DL, 'materials-export-2026-03-26_00-06-39.csv'), ';');
for (const m of materials) {
  if (m.slug) sitemap += `  <url><loc>${BASE}/knowledge/material/${m.slug}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>\n`;
}

// Guide pages
const guides = [
  'best-xometry-alternatives', 'best-protolabs-alternatives', 'best-hubs-alternatives',
  'best-sculpteo-alternatives', 'xometry-vs-protolabs', 'hubs-vs-shapeways',
  'best-3d-printing-services', 'best-3d-printing-services-europe', 'best-3d-printing-services-usa',
  'best-metal-3d-printing-services',
];
for (const g of guides) {
  sitemap += `  <url><loc>${BASE}/guides/${g}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>\n`;
}

sitemap += `</urlset>\n`;

const sitemapPath = join(__dirname, '..', '..', 'public', 'sitemap.xml');
const sitemapFallback = join(__dirname, 'sitemap.xml');
try {
  writeFileSync(sitemapPath, sitemap, 'utf-8');
  console.log(`✅ Sitemap: ${sitemapPath}`);
} catch {
  writeFileSync(sitemapFallback, sitemap, 'utf-8');
  console.log(`✅ Sitemap: ${sitemapFallback}`);
}

const urlCount = (sitemap.match(/<url>/g) || []).length;
console.log(`   ${urlCount} URLs (${allSupplierIds.size} suppliers + ${technologies.length} techs + ${materials.length} materials + ${guides.length} guides + 7 static)`);

console.log('\n' + '='.repeat(60));
console.log('  Done!');
console.log('='.repeat(60));
