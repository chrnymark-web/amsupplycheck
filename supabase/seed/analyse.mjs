/**
 * Analyse AMSupplyCheck data from CSV exports.
 * Run: node supabase/seed/analyse.mjs
 */
import { readFileSync } from 'fs';

const DOWNLOADS = process.env.HOME + '/Downloads';

function parseCSV(filePath, separator = ';') {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(separator);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const row = {};
    let fields = [];
    let current = '';
    let inQuotes = false;
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        if (inQuotes && lines[i][j + 1] === '"') { current += '"'; j++; }
        else inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) { fields.push(current); current = ''; }
      else current += char;
    }
    fields.push(current);
    headers.forEach((h, idx) => { row[h.trim()] = (fields[idx] || '').trim(); });
    rows.push(row);
  }
  return rows;
}

console.log('='.repeat(60));
console.log('  AMSupplyCheck - Data Analysis Report');
console.log('  Generated:', new Date().toISOString().split('T')[0]);
console.log('='.repeat(60));

// Suppliers
const suppliers = parseCSV(`${DOWNLOADS}/suppliers-export-2026-03-26_00-10-50.csv`);
const verified = suppliers.filter(s => s.verified === 'true');
const premium = suppliers.filter(s => s.premium === 'true');
const withLogo = suppliers.filter(s => s.logo_url && s.logo_url !== '');
const withDescription = suppliers.filter(s => s.description && s.description.length > 10);

console.log('\n📦 SUPPLIERS');
console.log('-'.repeat(40));
console.log(`  Total:      ${suppliers.length}`);
console.log(`  Verified:   ${verified.length} (${(verified.length/suppliers.length*100).toFixed(0)}%)`);
console.log(`  Premium:    ${premium.length}`);
console.log(`  With logo:  ${withLogo.length} (${(withLogo.length/suppliers.length*100).toFixed(0)}%)`);
console.log(`  With desc:  ${withDescription.length} (${(withDescription.length/suppliers.length*100).toFixed(0)}%)`);

// Countries distribution
const countryDist = {};
suppliers.forEach(s => {
  const c = s.location_country || 'Unknown';
  countryDist[c] = (countryDist[c] || 0) + 1;
});
const topCountries = Object.entries(countryDist).sort((a, b) => b[1] - a[1]).slice(0, 15);
console.log('\n🌍 TOP COUNTRIES');
console.log('-'.repeat(40));
topCountries.forEach(([c, n]) => console.log(`  ${c.padEnd(25)} ${n} suppliers`));

// Region distribution
const regionDist = {};
suppliers.forEach(s => {
  const r = s.region || 'unknown';
  regionDist[r] = (regionDist[r] || 0) + 1;
});
console.log('\n🗺️  REGIONS');
console.log('-'.repeat(40));
Object.entries(regionDist).sort((a, b) => b[1] - a[1]).forEach(([r, n]) =>
  console.log(`  ${r.padEnd(25)} ${n} suppliers`));

// Technologies
const technologies = parseCSV(`${DOWNLOADS}/technologies-export-2026-03-26_00-11-17.csv`);
const techCategories = {};
technologies.forEach(t => {
  const c = t.category || 'Other';
  techCategories[c] = (techCategories[c] || 0) + 1;
});
console.log('\n⚡ TECHNOLOGIES: ' + technologies.length + ' total');
console.log('-'.repeat(40));
Object.entries(techCategories).sort((a, b) => b[1] - a[1]).forEach(([c, n]) =>
  console.log(`  ${c.padEnd(25)} ${n}`));

// Most used technologies
const supplierTechs = parseCSV(`${DOWNLOADS}/supplier_technologies-export-2026-03-26_00-10-07.csv`);
const techUsage = {};
supplierTechs.forEach(st => { techUsage[st.technology_id] = (techUsage[st.technology_id] || 0) + 1; });
const techLookup = Object.fromEntries(technologies.map(t => [t.id, t.name]));
const topTechs = Object.entries(techUsage).sort((a, b) => b[1] - a[1]).slice(0, 15);
console.log('\n🔥 MOST POPULAR TECHNOLOGIES');
console.log('-'.repeat(40));
topTechs.forEach(([id, n]) => console.log(`  ${(techLookup[id] || id).padEnd(25)} ${n} suppliers`));

// Materials
const materials = parseCSV(`${DOWNLOADS}/materials-export-2026-03-26_00-06-39.csv`);
const matCategories = {};
materials.forEach(m => {
  const c = m.category || 'Other';
  matCategories[c] = (matCategories[c] || 0) + 1;
});
console.log('\n🧪 MATERIALS: ' + materials.length + ' total');
console.log('-'.repeat(40));
Object.entries(matCategories).sort((a, b) => b[1] - a[1]).forEach(([c, n]) =>
  console.log(`  ${c.padEnd(25)} ${n}`));

// Most used materials
const supplierMats = parseCSV(`${DOWNLOADS}/supplier_materials-export-2026-03-26_00-09-14.csv`);
const matUsage = {};
supplierMats.forEach(sm => { matUsage[sm.material_id] = (matUsage[sm.material_id] || 0) + 1; });
const matLookup = Object.fromEntries(materials.map(m => [m.id, m.name]));
const topMats = Object.entries(matUsage).sort((a, b) => b[1] - a[1]).slice(0, 15);
console.log('\n🔥 MOST POPULAR MATERIALS');
console.log('-'.repeat(40));
topMats.forEach(([id, n]) => console.log(`  ${(matLookup[id] || id).padEnd(25)} ${n} suppliers`));

// Search Analytics
const searches = parseCSV(`${DOWNLOADS}/search_analytics-export-2026-03-26_00-08-21.csv`);
console.log('\n🔍 SEARCH ANALYTICS');
console.log('-'.repeat(40));
console.log(`  Total searches:    ${searches.length}`);
const aiSearches = searches.filter(s => s.search_type === 'ai');
console.log(`  AI searches:       ${aiSearches.length}`);
const avgDuration = searches.filter(s => s.search_duration_ms).reduce((acc, s) => acc + parseInt(s.search_duration_ms), 0) / (searches.length || 1);
console.log(`  Avg duration:      ${avgDuration.toFixed(0)}ms`);

// AI Match Analytics
const matches = parseCSV(`${DOWNLOADS}/ai_match_analytics-export-2026-03-26_00-04-40.csv`);
console.log('\n🤖 AI PROJECT MATCHING');
console.log('-'.repeat(40));
console.log(`  Total matches:     ${matches.length}`);
const avgScore = matches.reduce((acc, m) => acc + parseFloat(m.match_score_avg || 0), 0) / (matches.length || 1);
console.log(`  Avg match score:   ${avgScore.toFixed(1)}`);
const avgMatchDur = matches.reduce((acc, m) => acc + parseInt(m.match_duration_ms || 0), 0) / (matches.length || 1);
console.log(`  Avg match time:    ${avgMatchDur.toFixed(0)}ms`);

// Supplier Applications
const apps = parseCSV(`${DOWNLOADS}/supplier_applications-export-2026-03-26_00-08-46.csv`);
console.log('\n📬 SUPPLIER APPLICATIONS');
console.log('-'.repeat(40));
console.log(`  Total:             ${apps.length}`);
const realApps = apps.filter(a => !a.email.includes('example.com'));
console.log(`  Real (non-test):   ${realApps.length}`);
realApps.forEach(a => console.log(`  - ${a.company} (${a.name}, ${a.email})`));

// Discovery
const runs = parseCSV(`${DOWNLOADS}/discovery_runs-export-2026-03-26_00-06-26.csv`);
const completed = runs.filter(r => r.status === 'completed');
const totalNew = completed.reduce((acc, r) => acc + parseInt(r.suppliers_new || 0), 0);
console.log('\n🔭 SUPPLIER DISCOVERY');
console.log('-'.repeat(40));
console.log(`  Discovery runs:    ${runs.length}`);
console.log(`  Completed:         ${completed.length}`);
console.log(`  New suppliers found: ${totalNew}`);

// Newsletter
const newsletter = parseCSV(`${DOWNLOADS}/newsletter_signups-export-2026-03-26_00-06-48.csv`);
console.log('\n📧 NEWSLETTER');
console.log('-'.repeat(40));
console.log(`  Signups:           ${newsletter.length}`);

console.log('\n' + '='.repeat(60));
console.log('  End of Report');
console.log('='.repeat(60));
