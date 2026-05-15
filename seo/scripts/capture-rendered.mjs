#!/usr/bin/env node
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const URLS = readFileSync("seo/baseline/sample-urls.txt", "utf8")
  .split("\n").map(s => s.trim()).filter(Boolean);

const OUT = "seo/baseline/render";
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const slugify = (u) => u.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "") || "root";

const browser = await chromium.launch({ headless: true });
const summary = { captured_at: new Date().toISOString(), by_url: {} };

for (const url of URLS) {
  const slug = slugify(url);
  const ctx = await browser.newContext({ userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);
    const html = await page.content();
    writeFileSync(`${OUT}/js-${slug}.html`, html);
    const title = await page.title();
    const h1 = await page.$$eval("h1", els => els.map(e => e.textContent?.trim()).filter(Boolean).join(" || "));
    const meta = (sel) => page.$eval(sel, el => el.getAttribute("content")).catch(() => null);
    const desc = await meta('meta[name="description"]');
    const robots = await meta('meta[name="robots"]');
    const canonical = await page.$eval('link[rel="canonical"]', el => el.getAttribute("href")).catch(() => null);
    const hreflang = await page.$$eval('link[rel="alternate"][hreflang]', els => els.map(e => ({ hreflang: e.getAttribute("hreflang"), href: e.getAttribute("href") })));
    const jsonldBlocks = await page.$$eval('script[type="application/ld+json"]', els => els.map(e => e.textContent || ""));
    const parsedSchemas = jsonldBlocks.map(t => { try { return JSON.parse(t); } catch (e) { return { __invalid_json: t.slice(0, 100), error: e.message }; } });
    const og = await page.$$eval('meta[property^="og:"]', els => Object.fromEntries(els.map(e => [e.getAttribute("property"), e.getAttribute("content")])));
    summary.by_url[url] = { title, h1, desc, robots, canonical, hreflang, jsonld: parsedSchemas, og };
    console.log(`[render] OK ${url} title="${title?.slice(0,60)}" jsonld=${parsedSchemas.length} canonical=${canonical || "MISSING"}`);
  } catch (e) {
    console.error(`[render] FAIL ${url}: ${e.message}`);
    summary.by_url[url] = { error: e.message };
  } finally {
    await ctx.close();
  }
}

await browser.close();
writeFileSync(`${OUT}/rendered-summary.json`, JSON.stringify(summary, null, 2));
console.log("[render] DONE");
