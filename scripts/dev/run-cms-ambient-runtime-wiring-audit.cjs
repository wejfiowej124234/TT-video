#!/usr/bin/env node
/**
 * Destination Ambient Runtime wiring audit · 10 国
 * PASS = Runtime URL equals Catalog publish URL · Unsplash/TS = 0
 *
 *   node scripts/dev/run-cms-ambient-runtime-wiring-audit.cjs
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('../../frontend/node_modules/playwright');
const {
  WEB_DEFAULT,
  API_DEFAULT,
  COUNTRY_ZH_TO_ISO,
  headImage,
} = require('./lib/cms-l5-runtime-audit.cjs');

const ROOT = path.join(__dirname, '../..');
const OUT_JSON = path.join(ROOT, 'evidence/GO_cms_operation/CMS-AMBIENT-RUNTIME-WIRING-LATEST.json');

const WEB = (process.env.WEB || WEB_DEFAULT).replace(/\/$/, '');
const API = (process.env.API || API_DEFAULT).replace(/\/$/, '');

const COUNTRY_BUTTONS = ['中国', '日本', '韩国', '新加坡', '泰国', '阿联酋', '美国', '澳大利亚', '法国', '西班牙'];

function fetchJson(url) {
  const http = url.startsWith('https') ? require('https') : require('http');
  return new Promise((resolve) => {
    const u = new URL(url);
    http
      .get(
        { hostname: u.hostname, path: u.pathname + u.search, headers: { Accept: 'application/json' } },
        (res) => {
          let d = '';
          res.on('data', (c) => (d += c));
          res.on('end', () => {
            try {
              resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode, json: JSON.parse(d) });
            } catch {
              resolve({ ok: false, status: res.statusCode, json: null });
            }
          });
        },
      )
      .on('error', () => resolve({ ok: false, status: 0, json: null }));
  });
}

function normUrl(u) {
  if (!u) return '';
  return u.split('?')[0].replace(/\/$/, '');
}

async function catalogAmbientUrl(iso) {
  const r = await fetchJson(`${API}/api/v1/catalog/media?asset_kind=landing_ambient&country_iso=${encodeURIComponent(iso)}`);
  const item = r.json?.items?.[0];
  const url = item?.url || null;
  return { url, count: r.json?.count || 0, http: r.status, published: Boolean(url) };
}

async function main() {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const browser = await chromium.launch({ headless: true, args: ['--disable-http2'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const rows = [];
  const heroForm = page.locator('#landing-hero-form');
  await page.goto(`${WEB}/`, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await heroForm.waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForSelector('[data-tt-home-ambient-country="default"]', { timeout: 30000 });
  await page.waitForTimeout(5000);

  // staging Playwright：首击 pill 可能 noop；warmup + scrollIntoView 后再逐国审计
  const warmupBtn = heroForm.getByRole('button', { name: '日本', exact: true });
  await warmupBtn.scrollIntoViewIfNeeded();
  await warmupBtn.click();
  await page.waitForTimeout(4000);

  for (const zh of COUNTRY_BUTTONS) {
    const iso = COUNTRY_ZH_TO_ISO[zh];
    const cat = await catalogAmbientUrl(iso);
    const btn = heroForm.getByRole('button', { name: zh, exact: true });
    if (await btn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
    }
    try {
      await page.waitForFunction(
        (expected) =>
          document.querySelector('[data-tt-home-ambient-country]')?.getAttribute('data-tt-home-ambient-country') ===
          expected,
        zh,
        { timeout: 10000 },
      );
    } catch {
      /* fall through */
    }
    await page.waitForTimeout(1200);
    // Wait for catalog URL to appear (client fetch after opt-in)
    if (cat.url) {
      const tail = cat.url.split('/').pop();
      try {
        await page.waitForFunction(
          (suffix) => {
            const el = document.querySelector('[data-tt-home-ambient-phase="A"]');
            const src = el?.getAttribute('data-tt-home-ambient-src') || '';
            return src.includes(suffix) && !/unsplash/i.test(src);
          },
          tail,
          { timeout: 20000 },
        );
      } catch {
        /* fall through to read current src */
      }
    }
    await page.waitForTimeout(800);

    const runtime = await page.evaluate(() => {
      const host = document.querySelector('[data-tt-home-ambient-phase="A"]');
      const dataAttr = host?.getAttribute('data-tt-home-ambient-src') || '';
      const imgEl = host?.querySelector('img');
      return {
        dataAttr,
        imgSrc: imgEl?.currentSrc || imgEl?.src || '',
      };
    });

    const runtimeUrl = runtime.dataAttr || runtime.imgSrc;
    const isUnsplash = /unsplash|pexels/i.test(runtimeUrl);
    const wiringOk = cat.published && runtimeUrl && normUrl(runtimeUrl) === normUrl(cat.url);
    const head = runtimeUrl ? await headImage(runtimeUrl) : { ok: false, content_length: 0 };

    rows.push({
      country_zh: zh,
      country_iso: iso,
      page_path: `/?country=${zh}`,
      cms_jurisdiction: true,
      catalog_has_data: cat.published,
      catalog_published: cat.published,
      catalog_url: cat.url,
      runtime_url: runtimeUrl || null,
      runtime_reads_cms_catalog: wiringOk,
      runtime_cms_mismatch: cat.published && runtimeUrl && !wiringOk,
      still_unsplash: isUnsplash,
      still_ts_fallback: isUnsplash,
      l5_compliant: wiringOk && !isUnsplash && head.ok && (head.content_length || 0) >= 16384,
      cms_ownership_ok: wiringOk,
      l5_issues: [
        !cat.published ? 'Catalog 未 Publish' : null,
        !runtimeUrl ? 'Runtime 未渲染' : null,
        isUnsplash ? '仍为 Unsplash/TS fallback' : null,
        cat.published && runtimeUrl && !wiringOk ? 'Runtime URL ≠ Catalog publish URL' : null,
        head.ok && (head.content_length || 0) < 16384 ? '文件过小' : null,
      ].filter(Boolean),
      priority: 'P0',
    });
  }

  await browser.close();

  const pass = rows.filter((r) => r.runtime_reads_cms_catalog && r.l5_compliant && r.cms_ownership_ok);
  const report = {
    schema: 'traveltrust.cms_ambient_runtime_wiring.v1',
    stamp_utc: stamp,
    web_base: WEB,
    api_base: API,
    destination_ambient_runtime: `${pass.length}/10`,
    unsplash_count: rows.filter((r) => r.still_unsplash).length,
    catalog_publish_count: rows.filter((r) => r.catalog_published).length,
    rows,
    TT_CMS_AMBIENT_RUNTIME_WIRING: pass.length === 10 ? 'PASS' : 'GAPS_OPEN',
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2) + '\n');

  console.log(`TT_CMS_AMBIENT_RUNTIME_WIRING: ${report.TT_CMS_AMBIENT_RUNTIME_WIRING}`);
  console.log(`TT_CMS_AMBIENT_RUNTIME: ${report.destination_ambient_runtime}`);
  console.log(`TT_CMS_AMBIENT_UNSplash: ${report.unsplash_count}`);
  console.log(`TT_CMS_AMBIENT_CATALOG_PUBLISH: ${report.catalog_publish_count}/10`);
  for (const r of rows) {
    console.log(`  ${r.country_iso} catalog=${r.catalog_published ? 'Y' : 'N'} runtime=${r.runtime_reads_cms_catalog ? 'CMS' : r.still_unsplash ? 'unsplash' : 'other'} l5=${r.l5_compliant ? 'PASS' : 'FAIL'}`);
  }
  console.log(`Evidence: evidence/GO_cms_operation/CMS-AMBIENT-RUNTIME-WIRING-LATEST.json`);
  process.exit(pass.length === 10 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
