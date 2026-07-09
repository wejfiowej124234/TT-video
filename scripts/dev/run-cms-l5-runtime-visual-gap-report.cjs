#!/usr/bin/env node
/**
 * CMS L5 Visual Gap Report · Staging runtime-only audit (consumer pages)
 *
 *   node scripts/dev/run-cms-l5-runtime-visual-gap-report.cjs
 *   WEB=https://tt-web-staging.fly.dev API=https://tt-api-staging.fly.dev node ...
 *
 * SSOT = final rendered DOM · not Matrix/Inventory/Registry/Evidence
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('../../frontend/node_modules/playwright');

const ROOT = path.join(__dirname, '../..');
const OUT_JSON = path.join(ROOT, 'evidence/GO_cms_operation/CMS-L5-VISUAL-GAP-REPORT-LATEST.json');
const OUT_MD = path.join(ROOT, 'evidence/GO_cms_operation/CMS-L5-VISUAL-GAP-REPORT-LATEST.md');

const {
  WEB_DEFAULT,
  API_DEFAULT,
  auditExtractedImages,
  summarizeGapReport,
  formatGapReportMarkdown,
} = require('./lib/cms-l5-runtime-audit.cjs');
const { applyAmbientSsotToRuntimeAssetRows, loadAmbientRuntimeWiringSsot } = require('./lib/cms-l5-audit-ssot.cjs');

const WEB = (process.env.WEB || process.env.WEB_BASE || WEB_DEFAULT).replace(/\/$/, '');
const API = (process.env.API || process.env.API_BASE || API_DEFAULT).replace(/\/$/, '');

const COUNTRY_BUTTONS = ['中国', '日本', '韩国', '新加坡', '泰国', '阿联酋', '美国', '澳大利亚', '法国', '西班牙'];

const PAGES = [
  { path: '/', waitMs: 3500, setup: null },
  ...COUNTRY_BUTTONS.map((country) => ({
    path: '/',
    page_label: `/?country=${country}`,
    country_button: country,
    waitMs: 2500,
    setup: 'select_country',
  })),
  { path: '/market', waitMs: 3000, setup: 'market_modal' },
  { path: '/market/provider', waitMs: 5000, setup: 'scroll_listings' },
  { path: '/market/acquisition', waitMs: 5000, setup: 'scroll_listings' },
  { path: '/traveltrust', waitMs: 4000, setup: null },
  { path: '/community', waitMs: 5000, setup: 'scroll_listings' },
];

async function extractRuntimeImages(page) {
  return page.evaluate(() => {
    const results = [];
    const push = (entry) => {
      if (!entry.src || entry.src.startsWith('data:')) return;
      results.push(entry);
    };

    for (const img of document.querySelectorAll('img')) {
      const rect = img.getBoundingClientRect();
      if (rect.width < 48 || rect.height < 48) continue;
      const ctx =
        img.closest('[data-testid], section, article, [class*="modal"], [class*="Modal"], [class*="ambient"], [class*="Ambient"]')
          ?.textContent?.slice(0, 120) || '';
      const cls = img.className?.toString?.() || '';
      let role = 'content';
      if (/ambient|ken|backdrop|landing/i.test(cls + ctx)) role = 'ambient_backdrop';
      push({
        kind: 'img',
        src: img.currentSrc || img.src,
        alt: img.alt || '',
        selector: cls.slice(0, 100) || img.id || 'img',
        context: ctx.replace(/\s+/g, ' ').trim(),
        role,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
    }

    for (const v of document.querySelectorAll('video[poster]')) {
      const poster = v.getAttribute('poster');
      if (!poster) continue;
      const rect = v.getBoundingClientRect();
      push({
        kind: 'video_poster',
        src: poster,
        alt: 'video poster',
        selector: 'video[poster]',
        context: v.closest('section')?.textContent?.slice(0, 80) || '',
        role: 'video_poster',
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        naturalWidth: 0,
        naturalHeight: 0,
      });
    }

    return results;
  });
}

async function setupPage(page, setup, countryButton) {
  if (setup === 'select_country' && countryButton) {
    const btn = page.getByRole('button', { name: countryButton }).first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(1800);
    }
  }
  if (setup === 'scroll_listings') {
    await page.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight / 2);
      await new Promise((r) => setTimeout(r, 800));
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise((r) => setTimeout(r, 800));
    });
  }
  if (setup === 'market_modal') {
    const btn = page.getByRole('button', { name: /定制|行程|Custom/i }).first();
    if (await btn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(2500);
    }
  }
}

async function main() {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent: 'TravelTrust-CMS-L5-Runtime-Audit/1.0',
  });
  const page = await context.newPage();

  const allRows = [];
  const pageRuns = [];

  for (const spec of PAGES) {
    const pagePath = spec.page_label || spec.path;
    const url = `${WEB}${spec.path}`;
    let status = 'ok';
    let images = [];
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
      status = resp?.status?.() || 0;
      await page.waitForTimeout(spec.waitMs);
      if (spec.setup) await setupPage(page, spec.setup, spec.country_button);
      images = await extractRuntimeImages(page);
      const rows = await auditExtractedImages({
        page_path: pagePath,
        images,
        webBase: WEB,
        apiBase: API,
      });
      allRows.push(...rows);
    } catch (e) {
      status = `error:${e.message}`;
    }
    pageRuns.push({ page_path: pagePath, url, http: status, runtime_images: images.length });
  }

  await browser.close();

  const ambientSsot = loadAmbientRuntimeWiringSsot();
  const alignedRows = applyAmbientSsotToRuntimeAssetRows(allRows, ambientSsot);
  const summary = summarizeGapReport(allRows);
  const l5Gaps = alignedRows.filter((r) => !r.l5_compliant);
  const cmsGaps = alignedRows.filter((r) => !r.cms_ownership_ok);

  const report = {
    schema: 'traveltrust.cms_runtime_visual_gap_report.v2',
    stamp_utc: stamp,
    layer: 'CMS_OPERATION',
    phase: '② staging',
    title: 'CMS Runtime Visual Gap Report',
    ssot: 'runtime_dom_only',
    ambient_runtime_wiring_ssot: 'evidence/GO_cms_operation/CMS-AMBIENT-RUNTIME-WIRING-LATEST.json',
    destination_ambient_ssot_closed: Boolean(ambientSsot.is_closed),
    audit_ssot: summary.audit_ssot,
    acceptance_standard: summary.acceptance_standard,
    excluded_from_judgement: ['matrix', 'inventory', 'registry', 'runbook', 'evidence_json'],
    web_base: WEB,
    api_base: API,
    pages_audited: pageRuns,
    summary,
    assets: alignedRows,
    l5_gaps: l5Gaps,
    cms_ownership_gaps: cmsGaps,
    completion_gate: {
      all_families_l5_closed: summary.l5_gap_families.length === 0,
      all_families_cms_ownership_closed: summary.cms_gap_families.length === 0,
      catalog_wiring_closed: !summary.catalog_wiring_gaps_open,
    },
    TT_CMS_RUNTIME_L5: summary.audit_incomplete ? 'INCOMPLETE' : summary.l5_gaps_open ? 'GAPS_OPEN' : 'CLOSED',
    TT_CMS_RUNTIME_OWNERSHIP: summary.audit_incomplete ? 'INCOMPLETE' : summary.cms_ownership_gaps_open ? 'GAPS_OPEN' : 'CLOSED',
    TT_CMS_CATALOG_WIRING: summary.audit_incomplete ? 'INCOMPLETE' : summary.catalog_wiring_gaps_open ? 'BROKEN' : 'OK',
  };

  const outDir = path.join(ROOT, 'evidence/GO_cms_operation/l5-visual-gap', stamp);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'CMS-L5-VISUAL-GAP-REPORT.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(OUT_MD, formatGapReportMarkdown(report) + '\n');
  fs.writeFileSync(path.join(outDir, 'CMS-L5-VISUAL-GAP-REPORT.md'), formatGapReportMarkdown(report) + '\n');

  console.log(`TT_CMS_RUNTIME_L5: ${report.TT_CMS_RUNTIME_L5}`);
  console.log(`TT_CMS_RUNTIME_OWNERSHIP: ${report.TT_CMS_RUNTIME_OWNERSHIP}`);
  console.log(`TT_CMS_CATALOG_WIRING: ${report.TT_CMS_CATALOG_WIRING}`);
  if (summary.p0_blocker) console.log(`TT_CMS_P0_BLOCKER: ${summary.p0_blocker}`);
  console.log('Asset Family Board:');
  for (const fam of summary.ops_asset_families) {
    const b = summary.family_board[fam];
    console.log(`  ${fam} [${b.priority}] L5=${b.l5} CMS=${b.cms_ownership} ${b.progress_bar} ${b.progress_pct}% · ${b.blocker}`);
  }
  console.log(`Evidence: evidence/GO_cms_operation/CMS-L5-VISUAL-GAP-REPORT-LATEST.json`);
  console.log(`Markdown: evidence/GO_cms_operation/CMS-L5-VISUAL-GAP-REPORT-LATEST.md`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
