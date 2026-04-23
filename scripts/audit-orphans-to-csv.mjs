#!/usr/bin/env node
// Converts the orphan audit JSON into a spreadsheet-friendly CSV.
// Usage: node scripts/audit-orphans-to-csv.mjs > docs/research/supplier-orphans.csv

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const input = join(__dirname, '..', 'docs', 'research', 'supplier-orphan-audit-2026-04-23.json');
const data = JSON.parse(readFileSync(input, 'utf8'));

const esc = (v) => {
  if (v == null) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

console.log('kind,supplier_name,supplier_website,orphaned_item,context_other_items');
for (const o of data.orphans) {
  const context = o.kind === 'material-orphan'
    ? (o.supplierTechs ?? []).join('; ')
    : (o.supplierMats ?? []).join('; ');
  console.log([
    esc(o.kind),
    esc(o.supplierName),
    esc(o.supplierWebsite),
    esc(o.orphanedItem),
    esc(context),
  ].join(','));
}
