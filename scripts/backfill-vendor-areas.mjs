#!/usr/bin/env node
/**
 * One-off seeder: fills suppliers.metadata.area for every Craftcloud-linked
 * supplier, so the STL-viewer Area filter can exclude non-matching vendors.
 *
 * Run:
 *   node --env-file=.env scripts/backfill-vendor-areas.mjs
 *
 * Optional flags:
 *   --dry-run     Print what would change, don't write to Supabase.
 *   --only=<id>   Only process the given craftcloud_vendor_id.
 *   --force       Re-resolve even when metadata.area is already set.
 *
 * The script is idempotent. Re-running it picks up new vendors and leaves
 * already-resolved ones alone unless --force is passed.
 *
 * Required env:
 *   VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FIRECRAWL_API_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Run with --env-file=.env.");
  process.exit(1);
}
if (!FIRECRAWL_API_KEY) {
  console.error("Missing FIRECRAWL_API_KEY.");
  process.exit(1);
}

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has("--dry-run");
const FORCE = args.has("--force");
const ONLY = (process.argv.find((a) => a.startsWith("--only=")) ?? "").split("=")[1] ?? null;

// ---------- country → continent (mirrors src/lib/supplierData.ts + trigger/lib/area.ts) ----------
const COUNTRY_TO_AREA = {
  Germany: "Europe", Denmark: "Europe", Netherlands: "Europe", Sweden: "Europe",
  Belgium: "Europe", "United Kingdom": "Europe", France: "Europe", Italy: "Europe",
  Spain: "Europe", Poland: "Europe", "Czech Republic": "Europe", Austria: "Europe",
  Switzerland: "Europe", Finland: "Europe", Norway: "Europe", Ireland: "Europe",
  Malta: "Europe", Portugal: "Europe", Greece: "Europe", Hungary: "Europe",
  Romania: "Europe", Slovakia: "Europe", Slovenia: "Europe", Estonia: "Europe",
  Latvia: "Europe", Lithuania: "Europe", Bulgaria: "Europe", Croatia: "Europe",
  Luxembourg: "Europe", Iceland: "Europe",

  "United States": "North America", USA: "North America", US: "North America",
  Canada: "North America", Mexico: "North America",

  China: "Asia", Japan: "Asia", "South Korea": "Asia", India: "Asia",
  Singapore: "Asia", Taiwan: "Asia", "Hong Kong": "Asia", Thailand: "Asia",
  Malaysia: "Asia", Philippines: "Asia", Indonesia: "Asia", Vietnam: "Asia",
  Israel: "Asia", Turkey: "Asia", Pakistan: "Asia",

  Australia: "Oceania", "New Zealand": "Oceania",

  Brazil: "South America", Argentina: "South America", Chile: "South America",
  Colombia: "South America", Peru: "South America",

  "South Africa": "Africa", Egypt: "Africa", Nigeria: "Africa", Kenya: "Africa",
  Morocco: "Africa", Tunisia: "Africa",
};

function normalizeCountry(raw) {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  const aliases = {
    "The Netherlands": "Netherlands",
    "United States of America": "United States",
    "UK": "United Kingdom",
    "Great Britain": "United Kingdom",
    "England": "United Kingdom",
    "Scotland": "United Kingdom",
    "Wales": "United Kingdom",
    "Czechia": "Czech Republic",
    "Korea": "South Korea",
    "Republic of Korea": "South Korea",
    "Türkiye": "Turkey",
  };
  return aliases[s] ?? s;
}

function areaForCountry(country) {
  const c = normalizeCountry(country);
  return c ? COUNTRY_TO_AREA[c] : undefined;
}

// ---------- Firecrawl ----------
async function firecrawlScrape(url) {
  const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
      timeout: 30000,
    }),
  });
  if (!resp.ok) {
    throw new Error(`firecrawl ${resp.status}: ${await resp.text().catch(() => "")}`);
  }
  const json = await resp.json();
  return json?.data?.markdown ?? "";
}

// Extract a country name from scraped markdown. Tries several heuristics;
// returns the first known country (per COUNTRY_TO_AREA / aliases) found.
function extractCountry(text) {
  if (!text) return null;
  const normalized = text.replace(/\s+/g, " ");
  const candidates = [
    ...Object.keys(COUNTRY_TO_AREA),
    "UK", "USA", "Czechia", "Türkiye", "The Netherlands",
  ];
  // Sort longer names first so "United States" wins before "States" fragment.
  candidates.sort((a, b) => b.length - a.length);
  for (const c of candidates) {
    const re = new RegExp(`\\b${c.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\b`, "i");
    if (re.test(normalized)) return normalizeCountry(c);
  }
  return null;
}

async function resolveVendor(row) {
  const meta = row.metadata ?? {};
  const vendorId = meta.craftcloud_vendor_id;

  // Source 1: existing country on the row (location_country or metadata.hq_country)
  const existingCountry = meta.hq_country ?? row.location_country ?? null;
  const existingArea = areaForCountry(existingCountry);
  if (existingArea) {
    return { country: normalizeCountry(existingCountry), area: existingArea, source: "supabase" };
  }

  // Source 2: Craftcloud vendor profile
  try {
    const md = await firecrawlScrape(`https://craftcloud3d.com/vendors/${vendorId}`);
    const country = extractCountry(md);
    const area = areaForCountry(country);
    if (area) return { country, area, source: "craftcloud-profile" };
  } catch (err) {
    console.warn(`  [${vendorId}] craftcloud profile scrape failed: ${err.message}`);
  }

  // Source 3: vendor website about/contact
  if (row.website && !/craftcloud3d\.com$/i.test(row.website)) {
    for (const path of ["/about", "/contact", "/about-us", "/contact-us", ""]) {
      const url = row.website.replace(/\/$/, "") + path;
      try {
        const md = await firecrawlScrape(url);
        const country = extractCountry(md);
        const area = areaForCountry(country);
        if (area) return { country, area, source: `website${path}` };
      } catch (err) {
        // Try next path; log only final failure outside the loop.
      }
    }
  }

  return { country: null, area: null, source: "unresolved" };
}

// ---------- main ----------
async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  console.log(`[backfill] dry-run=${DRY_RUN} force=${FORCE} only=${ONLY ?? "-"}`);

  let query = supabase
    .from("suppliers")
    .select("id, supplier_id, website, location_country, metadata")
    .not("metadata->>craftcloud_vendor_id", "is", null);

  if (ONLY) query = query.eq("metadata->>craftcloud_vendor_id", ONLY);

  const { data: rows, error } = await query;
  if (error) {
    console.error("Supabase query failed:", error);
    process.exit(1);
  }
  console.log(`[backfill] ${rows.length} craftcloud-linked suppliers in Supabase`);

  const unresolved = [];
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const meta = row.metadata ?? {};
    const vendorId = meta.craftcloud_vendor_id;

    if (!FORCE && typeof meta.area === "string" && meta.area.length > 0) {
      skipped++;
      continue;
    }

    const { country, area, source } = await resolveVendor(row);
    if (!area) {
      console.log(`  [${vendorId}] unresolved`);
      unresolved.push({ vendorId, website: row.website ?? "", name: row.supplier_id });
      continue;
    }

    console.log(`  [${vendorId}] ${country} → ${area} (via ${source})`);
    if (!DRY_RUN) {
      const newMeta = { ...meta, area, hq_country: country };
      const { error: upErr } = await supabase
        .from("suppliers")
        .update({ metadata: newMeta })
        .eq("id", row.id);
      if (upErr) {
        console.error(`  [${vendorId}] UPDATE FAILED:`, upErr.message);
        continue;
      }
    }
    updated++;
  }

  console.log(`\n[backfill] done — updated=${updated} skipped=${skipped} unresolved=${unresolved.length}`);

  if (unresolved.length > 0) {
    const csvPath = resolve("scripts/unresolved-vendor-areas.csv");
    const csv = [
      "vendorId,website,supplierId",
      ...unresolved.map((r) => `${r.vendorId},"${r.website}",${r.name}`),
    ].join("\n");
    writeFileSync(csvPath, csv);
    console.log(`[backfill] unresolved written to ${csvPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
