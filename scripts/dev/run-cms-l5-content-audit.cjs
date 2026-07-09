#!/usr/bin/env node
/**
 * CMS L5 Content Audit · Staging Runtime + Catalog + Market API
 *
 *   node scripts/dev/run-cms-l5-content-audit.cjs
 *
 * SSOT = Runtime DOM + Catalog API + Market listings API
 * 不读 Matrix / Registry / Runbook / Evidence
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('../../frontend/node_modules/playwright');

const ROOT = path.join(__dirname, '../..');
const OUT_JSON = path.join(ROOT, 'evidence/GO_cms_operation/CMS-L5-CONTENT-GAP-REPORT-LATEST.json');
const OUT_MD = path.join(ROOT, 'evidence/GO_cms_operation/CMS-L5-CONTENT-GAP-REPORT-LATEST.md');

const { WEB_DEFAULT, API_DEFAULT, auditExtractedImages } = require('./lib/cms-l5-runtime-audit.cjs');
const {
  CONTENT_FAMILIES,
  fetchCatalogInventory,
  buildDestinationAmbientSlots,
  buildListingContentSlots,
  mergeRuntimeIntoSlots,
  buildRuntimeContentRows,
  evaluateContentSlot,
  buildRemediationList,
  formatContentGapMarkdown,
  summarizeContentReport,
  applyContentAuditSsot,
} = require('./lib/cms-l5-content-audit.cjs');

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
  { path: '/market', waitMs: 4000, setup: 'market_modal' },
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
          ?.textContent?.slice(0, 160) || '';
      const cls = img.className?.toString?.() || '';
      let role = 'content';
      if (/ambient|ken|backdrop|landing/i.test(cls + ctx)) role = 'ambient_backdrop';
      push({
        kind: 'img',
        src: img.currentSrc || img.src,
        alt: img.alt || '',
        selector: cls.slice(0, 100) || 'img',
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
    const tries = [
      () => page.getByRole('button', { name: /定制行程|定制旅行|AI 生成行程|Custom/i }).first(),
      () => page.getByRole('link', { name: /定制|Custom/i }).first(),
      () => page.locator('[data-testid*="custom-itinerary"], [data-testid*="CustomItinerary"]').first(),
    ];
    for (const get of tries) {
      const el = get();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await el.click();
        await page.waitForTimeout(3000);
        break;
      }
    }
  }
}

async function main() {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

  console.log('Fetching Catalog + Market inventory...');
  const catalogInv = await fetchCatalogInventory(API);

  const browser = await chromium.launch({ headless: true, args: ['--disable-http2'] });
  const runtimeAssets = [];
  const pageRuns = [];

  for (const spec of PAGES) {
    const pagePath = spec.page_label || spec.path;
    const url = `${WEB}${spec.path}`;
    let status = 200;
    let images = [];
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
      status = resp?.status?.() || 0;
      await page.waitForTimeout(spec.waitMs);
      if (spec.setup) await setupPage(page, spec.setup, spec.country_button);
      images = await extractRuntimeImages(page);
      const rows = await auditExtractedImages({ page_path: pagePath, images, webBase: WEB, apiBase: API });
      runtimeAssets.push(...rows);
    } catch (e) {
      status = `error:${e.message}`;
    }
    pageRuns.push({ page_path: pagePath, http: status, runtime_images: images.length });
    await context.close();
  }
  await browser.close();

  const ambientSlots = buildDestinationAmbientSlots(catalogInv, runtimeAssets, API);
  let providerSlots = buildListingContentSlots(catalogInv, 'provider', API);
  let acquisitionSlots = buildListingContentSlots(catalogInv, 'acquisition', API);
  providerSlots = mergeRuntimeIntoSlots(providerSlots, runtimeAssets, (slot, r) =>
    r.asset_family === 'provider_listing' && r.runtime_image_url && slot.catalog?.catalog_url && r.runtime_image_url.includes(slot.catalog.catalog_url.split('/').pop()),
  );
  acquisitionSlots = mergeRuntimeIntoSlots(acquisitionSlots, runtimeAssets, (slot, r) =>
    r.asset_family === 'acquisition_listing' && r.runtime_image_url && slot.catalog?.catalog_url && r.runtime_image_url.includes(slot.catalog.catalog_url.split('/').pop()),
  );

  const ambientEval = [];
  for (const slot of ambientSlots) {
    const rt = runtimeAssets.find(
      (r) =>
        r.asset_family === 'destination_ambient' &&
        (r.page_path === slot.page_path || (slot.country_iso === 'CN' && r.page_path === '/')),
    );
    ambientEval.push(
      await evaluateContentSlot(
        {
          ...slot,
          natural_width: rt?.runtime_probe?.natural_width,
          natural_height: rt?.runtime_probe?.natural_height,
        },
        API,
      ),
    );
  }

  const listingEval = [];
  for (const slot of [...providerSlots, ...acquisitionSlots]) {
    listingEval.push(await evaluateContentSlot(slot, API));
  }

  const nonSlotRuntime = runtimeAssets.filter(
    (r) => !['destination_ambient', 'provider_listing', 'acquisition_listing'].includes(r.asset_family),
  );
  const otherEval = await buildRuntimeContentRows(nonSlotRuntime, catalogInv, API);

  const rawEvaluated = [...ambientEval, ...listingEval, ...otherEval];
  const ssotAligned = applyContentAuditSsot(rawEvaluated);
  const { allEvaluated, familyReports, remediation, summary, audit_ssot, destination_ambient_ssot_closed } =
    ssotAligned;

  const report = {
    schema: 'traveltrust.cms_l5_content_gap_report.v1',
    stamp_utc: stamp,
    phase: '② staging',
    ssot: ['runtime_dom', 'catalog_api', 'market_listings_api', 'ambient_runtime_wiring_evidence_overlay'],
    excluded: ['matrix', 'registry', 'runbook'],
    ambient_runtime_wiring_ssot: 'evidence/GO_cms_operation/CMS-AMBIENT-RUNTIME-WIRING-LATEST.json',
    destination_ambient_ssot_closed,
    audit_ssot,
    web_base: WEB,
    api_base: API,
    catalog_inventory_counts: {
      countries: catalogInv.countries?.length || 0,
      landing_ambient: catalogInv.destination_ambient?.length || 0,
      poi_images: catalogInv.poi_images?.length || 0,
      hotel_tiers: catalogInv.hotel_tiers?.length || 0,
      transport: catalogInv.transport?.length || 0,
      city_hero: catalogInv.city_hero?.length || 0,
      banner: catalogInv.banner?.length || 0,
      video_poster: catalogInv.video_poster?.length || 0,
      provider_listings: catalogInv.provider_listings?.length || 0,
      acquisition_listings: catalogInv.acquisition_listings?.length || 0,
    },
    pages_audited: pageRuns,
    family_reports: familyReports,
    summary,
    assets: allEvaluated,
    remediation,
    completion_targets: {
      cms_takeover_pct: 100,
      runtime_cms_pct: 100,
      l5_pass_pct: 100,
      text_consistency_pct: 100,
      geo_consistency_pct: 100,
      legacy_sources_allowed: ['ocs_by_explicit_design_only'],
    },
    TT_CMS_CONTENT_AUDIT: summary.runtime_cms_pct === 100 && summary.l5_pass_pct === 100 ? 'PASS' : 'GAPS_OPEN',
  };

  const outDir = path.join(ROOT, 'evidence/GO_cms_operation/l5-content-audit', stamp);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(OUT_MD, formatContentGapMarkdown(report) + '\n');
  fs.writeFileSync(path.join(outDir, 'CMS-L5-CONTENT-GAP-REPORT.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'CMS-L5-CONTENT-GAP-REPORT.md'), formatContentGapMarkdown(report) + '\n');

  console.log(`TT_CMS_CONTENT_AUDIT: ${report.TT_CMS_CONTENT_AUDIT}`);
  console.log(`CMS接管率: ${summary.cms_takeover_pct}% · Runtime CMS: ${summary.runtime_cms_pct}% · L5: ${summary.l5_pass_pct}%`);
  console.log('Family reports:');
  for (const fam of CONTENT_FAMILIES) {
    const f = familyReports[fam];
    console.log(
      `  ${fam}: total=${f.total_assets} cms=${f.cms_taken_over} runtime=${f.runtime_cms_effective} l5=${f.l5_pass} unmigrated=${f.unmigrated} status=${f.status}`,
    );
  }
  console.log(`P0=${remediation.P0.length} P1=${remediation.P1.length} P2=${remediation.P2.length}`);
  console.log(`Evidence: evidence/GO_cms_operation/CMS-L5-CONTENT-GAP-REPORT-LATEST.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
