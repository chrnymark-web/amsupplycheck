/**
 * Generates seed.sql from Supabase CSV exports.
 * Run: node supabase/seed/generate-seed.mjs
 * Output: supabase/seed/seed.sql
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOWNLOADS = process.env.HOME + '/Downloads';

function parseCSV(filePath, separator = ';') {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(separator);
  const rows = [];

  // Simple CSV parsing (handles quoted fields with semicolons)
  for (let i = 1; i < lines.length; i++) {
    const row = {};
    let fields = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        if (inQuotes && lines[i][j + 1] === '"') {
          current += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === separator && !inQuotes) {
        fields.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current);

    headers.forEach((h, idx) => {
      row[h.trim()] = (fields[idx] || '').trim();
    });
    rows.push(row);
  }
  return rows;
}

function esc(val) {
  if (!val || val === '') return 'NULL';
  return "'" + val.replace(/'/g, "''") + "'";
}

function escBool(val) {
  if (val === 'true') return 'true';
  if (val === 'false') return 'false';
  return 'NULL';
}

function escNum(val) {
  if (!val || val === '' || isNaN(val)) return 'NULL';
  return val;
}

function escJsonb(val) {
  if (!val || val === '' || val === '{}' || val === '[]') return "'" + (val || '{}') + "'::jsonb";
  return "'" + val.replace(/'/g, "''").replace(/\\""/g, '"') + "'::jsonb";
}

function escArray(val) {
  if (!val || val === '' || val === '[]' || val === '{}') return "'{}'";
  // Convert JSON array to Postgres array
  try {
    const parsed = JSON.parse(val.replace(/""/g, '"'));
    if (Array.isArray(parsed)) {
      return "ARRAY[" + parsed.map(v => esc(v)).join(',') + "]";
    }
  } catch (e) {}
  return "'{}'";
}

let sql = '-- AMSupplyCheck Seed Data\n-- Generated from Supabase exports\n\n';

// Countries
const countries = parseCSV(join(DOWNLOADS, 'countries-export-2026-03-26_00-05-25.csv'));
sql += '-- Countries (' + countries.length + ' rows)\n';
for (const r of countries) {
  sql += `INSERT INTO countries (id, name, code, region, created_at) VALUES (${esc(r.id)}, ${esc(r.name)}, ${esc(r.code)}, ${esc(r.region)}, ${esc(r.created_at)}) ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

// Technologies
const technologies = parseCSV(join(DOWNLOADS, 'technologies-export-2026-03-26_00-11-17.csv'));
sql += '-- Technologies (' + technologies.length + ' rows)\n';
for (const r of technologies) {
  sql += `INSERT INTO technologies (id, name, slug, category, description, created_at) VALUES (${esc(r.id)}, ${esc(r.name)}, ${esc(r.slug)}, ${esc(r.category)}, ${esc(r.description)}, ${esc(r.created_at)}) ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

// Materials
const materials = parseCSV(join(DOWNLOADS, 'materials-export-2026-03-26_00-06-39.csv'));
sql += '-- Materials (' + materials.length + ' rows)\n';
for (const r of materials) {
  sql += `INSERT INTO materials (id, name, slug, category, description, created_at) VALUES (${esc(r.id)}, ${esc(r.name)}, ${esc(r.slug)}, ${esc(r.category)}, ${esc(r.description)}, ${esc(r.created_at)}) ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

// Certifications
const certs = parseCSV(join(DOWNLOADS, 'certifications-export-2026-03-26_00-04-49.csv'));
sql += '-- Certifications (' + certs.length + ' rows)\n';
for (const r of certs) {
  sql += `INSERT INTO certifications (id, name, slug, description, created_at) VALUES (${esc(r.id)}, ${esc(r.name)}, ${esc(r.slug)}, ${esc(r.description)}, ${esc(r.created_at)}) ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

// Tags
const tags = parseCSV(join(DOWNLOADS, 'tags-export-2026-03-26_00-11-04.csv'));
sql += '-- Tags (' + tags.length + ' rows)\n';
for (const r of tags) {
  sql += `INSERT INTO tags (id, name, slug, category, created_at) VALUES (${esc(r.id)}, ${esc(r.name)}, ${esc(r.slug)}, ${esc(r.category)}, ${esc(r.created_at)}) ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

// Suppliers (big table)
const suppliers = parseCSV(join(DOWNLOADS, 'suppliers-export-2026-03-26_00-10-50.csv'));
sql += '-- Suppliers (' + suppliers.length + ' rows)\n';
for (const r of suppliers) {
  sql += `INSERT INTO suppliers (id, supplier_id, name, website, location_address, location_city, location_country, location_lat, location_lng, technologies, materials, card_style, listing_type, region, verified, premium, rating, review_count, description, description_extended, metadata, logo_url, lead_time_indicator, has_rush_service, has_instant_quote, certifications, country_id, last_validated_at, last_validation_confidence, validation_failures, created_at, updated_at) VALUES (${esc(r.id)}, ${esc(r.supplier_id)}, ${esc(r.name)}, ${esc(r.website)}, ${esc(r.location_address)}, ${esc(r.location_city)}, ${esc(r.location_country)}, ${escNum(r.location_lat)}, ${escNum(r.location_lng)}, ${escArray(r.technologies)}, ${escArray(r.materials)}, ${esc(r.card_style)}, ${esc(r.listing_type)}, ${esc(r.region)}, ${escBool(r.verified)}, ${escBool(r.premium)}, ${escNum(r.rating)}, ${escNum(r.review_count)}, ${esc(r.description)}, ${esc(r.description_extended)}, ${esc(r.metadata)}::jsonb, ${esc(r.logo_url)}, ${esc(r.lead_time_indicator)}, ${escBool(r.has_rush_service)}, ${escBool(r.has_instant_quote)}, ${escArray(r.certifications)}, ${r.country_id ? esc(r.country_id) : 'NULL'}, ${r.last_validated_at ? esc(r.last_validated_at) : 'NULL'}, ${escNum(r.last_validation_confidence)}, ${escNum(r.validation_failures)}, ${esc(r.created_at)}, ${esc(r.updated_at)}) ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

// Supplier join tables
const supplierTechs = parseCSV(join(DOWNLOADS, 'supplier_technologies-export-2026-03-26_00-10-07.csv'));
sql += '-- Supplier Technologies (' + supplierTechs.length + ' rows)\n';
for (const r of supplierTechs) {
  sql += `INSERT INTO supplier_technologies (id, supplier_id, technology_id, created_at) VALUES (${esc(r.id)}, ${esc(r.supplier_id)}, ${esc(r.technology_id)}, ${esc(r.created_at)}) ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

const supplierMats = parseCSV(join(DOWNLOADS, 'supplier_materials-export-2026-03-26_00-09-14.csv'));
sql += '-- Supplier Materials (' + supplierMats.length + ' rows)\n';
for (const r of supplierMats) {
  sql += `INSERT INTO supplier_materials (id, supplier_id, material_id, created_at) VALUES (${esc(r.id)}, ${esc(r.supplier_id)}, ${esc(r.material_id)}, ${esc(r.created_at)}) ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

const supplierCerts = parseCSV(join(DOWNLOADS, 'supplier_certifications-export-2026-03-26_00-08-58.csv'));
sql += '-- Supplier Certifications (' + supplierCerts.length + ' rows)\n';
for (const r of supplierCerts) {
  sql += `INSERT INTO supplier_certifications (id, supplier_id, certification_id, created_at) VALUES (${esc(r.id)}, ${esc(r.supplier_id)}, ${esc(r.certification_id)}, ${esc(r.created_at)}) ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

const supplierTags = parseCSV(join(DOWNLOADS, 'supplier_tags-export-2026-03-26_00-09-48.csv'));
sql += '-- Supplier Tags (' + supplierTags.length + ' rows)\n';
for (const r of supplierTags) {
  sql += `INSERT INTO supplier_tags (id, supplier_id, tag_id, created_at) VALUES (${esc(r.id)}, ${esc(r.supplier_id)}, ${esc(r.tag_id)}, ${esc(r.created_at)}) ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

// Supplier Applications
const apps = parseCSV(join(DOWNLOADS, 'supplier_applications-export-2026-03-26_00-08-46.csv'));
sql += '-- Supplier Applications (' + apps.length + ' rows)\n';
for (const r of apps) {
  sql += `INSERT INTO supplier_applications (id, name, email, company, created_at) VALUES (${esc(r.id)}, ${esc(r.name)}, ${esc(r.email)}, ${esc(r.company)}, ${esc(r.created_at)}) ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

// Newsletter
const newsletter = parseCSV(join(DOWNLOADS, 'newsletter_signups-export-2026-03-26_00-06-48.csv'));
sql += '-- Newsletter Signups (' + newsletter.length + ' rows)\n';
for (const r of newsletter) {
  sql += `INSERT INTO newsletter_signups (id, email, created_at) VALUES (${esc(r.id)}, ${esc(r.email)}, ${esc(r.created_at)}) ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

// Discovery Config
const discoConfig = parseCSV(join(DOWNLOADS, 'discovery_config-export-2026-03-26_00-05-56.csv'));
sql += '-- Discovery Config (' + discoConfig.length + ' rows)\n';
for (const r of discoConfig) {
  sql += `INSERT INTO discovery_config (id, schedule_cron, search_queries, regions_enabled, notifications_enabled, email_recipients, daily_digest_enabled, alert_on_failure, auto_approve_threshold, created_at, updated_at) VALUES (${esc(r.id)}, ${esc(r.schedule_cron)}, ${esc(r.search_queries)}::jsonb, ${esc(r.regions_enabled)}::jsonb, ${escBool(r.notifications_enabled)}, ${esc(r.email_recipients)}::jsonb, ${escBool(r.daily_digest_enabled)}, ${escBool(r.alert_on_failure)}, ${escNum(r.auto_approve_threshold)}, ${esc(r.created_at)}, ${esc(r.updated_at)}) ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

// Validation Config
const valConfig = parseCSV(join(DOWNLOADS, 'validation_config-export-2026-03-26_00-11-51.csv'));
sql += '-- Validation Config (' + valConfig.length + ' rows)\n';
for (const r of valConfig) {
  sql += `INSERT INTO validation_config (id, auto_approve_missing_data, auto_approve_technology_updates, auto_approve_material_updates, auto_approve_location_updates, validation_schedule_cron, enabled, validation_paused, validations_this_month, monthly_validation_limit, created_at, updated_at) VALUES (${esc(r.id)}, ${escBool(r.auto_approve_missing_data)}, ${escBool(r.auto_approve_technology_updates)}, ${escBool(r.auto_approve_material_updates)}, ${escBool(r.auto_approve_location_updates)}, ${esc(r.validation_schedule_cron)}, ${escBool(r.enabled)}, ${escBool(r.validation_paused)}, ${escNum(r.validations_this_month)}, ${escNum(r.monthly_validation_limit)}, ${esc(r.created_at)}, ${esc(r.updated_at)}) ON CONFLICT (id) DO NOTHING;\n`;
}
sql += '\n';

// User Roles
const roles = parseCSV(join(DOWNLOADS, 'user_roles-export-2026-03-26_00-11-41.csv'));
sql += '-- User Roles (' + roles.length + ' rows)\n';
for (const r of roles) {
  sql += `INSERT INTO user_roles (id, user_id, role, created_at) VALUES (${esc(r.id)}, ${esc(r.user_id)}, ${esc(r.role)}, ${esc(r.created_at)}) ON CONFLICT (id) DO NOTHING;\n`;
}

// Print summary
const summary = {
  countries: countries.length,
  technologies: technologies.length,
  materials: materials.length,
  certifications: certs.length,
  tags: tags.length,
  suppliers: suppliers.length,
  supplier_technologies: supplierTechs.length,
  supplier_materials: supplierMats.length,
  supplier_certifications: supplierCerts.length,
  supplier_tags: supplierTags.length,
  supplier_applications: apps.length,
  newsletter_signups: newsletter.length,
};

console.log('\n📊 Seed Data Summary:');
console.log('='.repeat(40));
for (const [table, count] of Object.entries(summary)) {
  console.log(`  ${table.padEnd(25)} ${count} rows`);
}
console.log('='.repeat(40));
console.log(`  TOTAL                   ${Object.values(summary).reduce((a, b) => a + b, 0)} rows`);

const outPath = join(__dirname, 'seed.sql');
writeFileSync(outPath, sql, 'utf-8');
console.log(`\n✅ Written to ${outPath} (${(sql.length / 1024).toFixed(0)} KB)`);
