#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const URLS = readFileSync("seo/baseline/sample-urls.txt", "utf8")
  .split("\n").map(s => s.trim()).filter(Boolean);

const CHROME_PATH =
  "/Users/christiannymarkgroth/Library/Caches/ms-playwright/chromium-1217/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing";

const OUT_DIR = "seo/baseline";
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const summary = { captured_at: new Date().toISOString(), by_url: {}, averages: {}, core_web_vitals: {} };

const slugify = (u) => u.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "root";

for (const url of URLS) {
  const slug = slugify(url);
  const outPath = `${OUT_DIR}/lighthouse-${slug}.json`;
  console.log(`[lh] ${url} -> ${outPath}`);
  try {
    execSync(
      `npx --yes lighthouse "${url}" --only-categories=performance,seo,accessibility,best-practices --chrome-flags="--headless=new --no-sandbox" --output=json --output-path=${outPath} --quiet --max-wait-for-load=60000`,
      { stdio: ["ignore", "ignore", "pipe"], env: { ...process.env, CHROME_PATH }, timeout: 180_000 }
    );
    const lh = JSON.parse(readFileSync(outPath, "utf8"));
    const cats = lh.categories || {};
    const seoRefs = new Set((cats.seo?.auditRefs || []).map(r => r.id));
    summary.by_url[url] = {
      perf: cats.performance?.score ?? null,
      seo:  cats.seo?.score ?? null,
      a11y: cats.accessibility?.score ?? null,
      bp:   cats["best-practices"]?.score ?? null,
      lcp_ms: lh.audits?.["largest-contentful-paint"]?.numericValue ?? null,
      tbt_ms: lh.audits?.["total-blocking-time"]?.numericValue ?? null,
      cls:    lh.audits?.["cumulative-layout-shift"]?.numericValue ?? null,
      fcp_ms: lh.audits?.["first-contentful-paint"]?.numericValue ?? null,
      seo_failed: Object.values(lh.audits || {})
        .filter(a => seoRefs.has(a.id) && a.score !== null && a.score < 1)
        .map(a => ({ id: a.id, title: a.title, score: a.score })),
    };
    const v = summary.by_url[url];
    console.log(`[lh] OK ${url} seo=${v.seo} perf=${v.perf} lcp=${Math.round(v.lcp_ms || 0)}ms`);
  } catch (e) {
    console.error(`[lh] FAIL ${url}: ${String(e.message).slice(0, 200)}`);
    summary.by_url[url] = { error: String(e.message).slice(0, 500) };
  }
}

const ok = Object.values(summary.by_url).filter(v => !v.error);
const avg = (k) => ok.length ? ok.reduce((s, v) => s + (v[k] || 0), 0) / ok.length : null;
summary.averages = { perf: avg("perf"), seo: avg("seo"), a11y: avg("a11y"), bp: avg("bp") };
summary.core_web_vitals = {
  lcp_p75_ms: ok.length ? Math.round(percentile(ok.map(v => v.lcp_ms).filter(Number.isFinite), 75)) : null,
  tbt_p75_ms: ok.length ? Math.round(percentile(ok.map(v => v.tbt_ms).filter(Number.isFinite), 75)) : null,
  cls_p75:    ok.length ? round3(percentile(ok.map(v => v.cls).filter(Number.isFinite), 75)) : null,
};

writeFileSync(`${OUT_DIR}/lighthouse-summary.json`, JSON.stringify(summary, null, 2));
console.log(`[lh] DONE. avg seo=${(summary.averages.seo ?? 0).toFixed(2)}, perf=${(summary.averages.perf ?? 0).toFixed(2)}`);

function percentile(arr, p) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const idx = (p / 100) * (s.length - 1);
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  return lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (idx - lo);
}
function round3(n) { return Math.round(n * 1000) / 1000; }
