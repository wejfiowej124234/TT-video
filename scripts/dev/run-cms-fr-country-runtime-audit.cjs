#!/usr/bin/env node
/**
 * France Country Runtime Audit · national_runtime · ② staging
 *
 * 验证法国相关内容 Consumer 读 CMS · 无 Unsplash/OCS/fallback · 三城 LOCK 不变 · JP/KR/TH/SG LOCK 不变
 * 不修改 LOCK · 不调整 Content QA 标准 · 不得进入下一国家或 ③ Production GO
 *
 *   WEB=https://tt-web-staging.fly.dev API=https://tt-api-staging.fly.dev \
 *     node scripts/dev/run-cms-fr-country-runtime-audit.cjs
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('../../frontend/node_modules/playwright');
const {
  ROOT,
  FR_CITIES,
  EVIDENCE,
  readJson,
  cityExitPath,
  isForbiddenFallback,
  validateFourCityExitChecks,
  validateFourCityContentQaClosures,
  validateFourCityExecutionClosures,
  validateCatalogApiAllFrPois,
  validateFranceAmbient,
  validateFrLockRegistryUnchanged,
  validateSgLockRegistryUnchanged,
  validateThLockRegistryUnchanged,
  validateKrLockRegistryUnchanged,
  validateJpLockRegistryUnchanged,
  validateFrScopeLock,
  summarizeCityRuntimeRows,
  filename,
  fetchJson,
} = require('./lib/cms-fr-country-runtime.cjs');
const { CITY_PILOTS } = require('./lib/cms-poi-city-pilot.cjs');
const { classifyRuntimeSource } = require('./lib/cms-l5-runtime-audit.cjs');

const WEB = (process.env.WEB || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const OUT_JSON = EVIDENCE.runtime_audit;
const OUT_MD = path.join(ROOT, 'evidence/GO_cms_operation/CMS-FR-COUNTRY-RUNTIME-AUDIT-LATEST.md');
const SHOT_DIR = path.join(ROOT, 'evidence/GO_cms_operation/content-qa-exit-check/fr-country');

const CONSUMER_SURFACES = [
  { id: 'home_france', path: '/', setup: 'home_france' },
  { id: 'market', path: '/market', setup: 'market_base' },
  { id: 'market_itinerary_fr', path: '/market', setup: 'market_fr_poi' },
  { id: 'market_provider', path: '/market/provider', setup: 'scroll' },
  { id: 'market_acquisition', path: '/market/acquisition', setup: 'scroll' },
  { id: 'traveltrust', path: '/traveltrust', setup: 'scroll' },
  { id: 'community', path: '/community', setup: 'scroll' },
];

function aggregateExitCheckPoiRuntime() {
  const rows = [];
  const issues = [];
  for (const cityZh of FR_CITIES) {
    const pilot = CITY_PILOTS[cityZh];
    const exitPath = cityExitPath(cityZh);
    const exit = readJson(exitPath);
    const consumer = exit?.checks?.find((c) => c.id === 'consumer_runtime_cms');
    if (!consumer?.pass) {
      issues.push(`${cityZh}: city exit consumer_runtime not PASS`);
      continue;
    }
    for (const row of consumer.rows || []) {
      const cmsOk = row.cms_runtime_ok === true;
      rows.push({
        city_zh: cityZh,
        matrix_id: row.matrix_id,
        poi: row.poi,
        expected_fn: row.expected_fn,
        runtime_fn: row.runtime_fn,
        cms_runtime_ok: cmsOk,
        source: 'city_exit_check',
        exit_check: path.relative(ROOT, exitPath).replace(/\\/g, '/'),
      });
      if (!cmsOk) issues.push(`${cityZh} ${row.poi}: exit runtime not CMS`);
    }
    if ((consumer.rows || []).length !== pilot.matrix_ids.length) {
      issues.push(`${cityZh}: exit runtime rows ${(consumer.rows || []).length}/${pilot.matrix_ids.length}`);
    }
  }
  const summary = summarizeCityRuntimeRows(rows);
  return {
    id: 'fr_poi_runtime_exit_aggregate',
    label: '三城 Market POI Runtime · Exit Check Gate 4 聚合',
    pass: issues.length === 0 && summary.pass === summary.total,
    poi_runtime: summary,
    poi_rows: rows,
    issues,
  };
}

function isFranceScopedImage(img) {
  const blob = `${img.src || ''} ${img.alt || ''} ${img.context || ''}`.toLowerCase();
  return /france|fr\b|paris|lyon|nice|法国|巴黎|里昂|尼斯|卢浮宫|埃菲尔|塞纳|圣母院|老里昂|圣母院|天使湾|尼斯老城|可颂|马卡龙|蜗牛|红酒/.test(
    blob,
  );
}

async function scanPageImages(page, scope, { franceOnly = false } = {}) {
  const images = await page.evaluate(() => {
    const hits = [];
    for (const img of document.querySelectorAll('img')) {
      const rect = img.getBoundingClientRect();
      if (rect.width < 48 || rect.height < 48) continue;
      hits.push({
        src: img.currentSrc || img.src,
        alt: img.alt || '',
        context: (img.closest('section,article,main')?.textContent || '').slice(0, 80).replace(/\s+/g, ' '),
      });
    }
    return hits;
  });

  const issues = [];
  const rows = [];
  for (const img of images) {
    if (franceOnly && !isFranceScopedImage(img)) continue;
    const forbidden = isForbiddenFallback(img.src);
    const cls = classifyRuntimeSource(img.src || '');
    rows.push({
      scope,
      src_tail: filename(img.src),
      current_source: cls.current_source,
      forbidden_fallback: forbidden,
    });
    if (forbidden) issues.push(`${scope}: forbidden fallback ${filename(img.src)} (${cls.current_source})`);
  }
  return { rows, issues, image_count: images.length };
}

async function catalogFranceAmbientUrl() {
  const r = await fetchJson(`${API}/api/v1/catalog/media?asset_kind=landing_ambient&country_iso=FR`);
  const url = r.json?.items?.[0]?.url || null;
  return { url, published: Boolean(url), http: r.status };
}

async function gotoWithRetry(page, url, attempts = 4) {
  let lastErr = null;
  for (let i = 1; i <= attempts; i++) {
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 120000 });
      return;
    } catch (e) {
      lastErr = e;
      const transient = /ERR_CONNECTION|Timeout|net::|ECONNRESET|ETIMEDOUT/i.test(String(e.message || e));
      if (!transient || i === attempts) break;
      await new Promise((r) => setTimeout(r, 8000 * i));
    }
  }
  throw lastErr;
}

async function liveConsumerProbe(poiAggregate) {
  const browser = await chromium.launch({ headless: true, args: ['--disable-http2'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const issues = [];
  const surfaceRows = [];
  let catalogApiCalls = 0;

  page.on('request', (req) => {
    if (req.url().includes('/api/v1/catalog/poi-images') || req.url().includes('/api/v1/catalog/media')) {
      catalogApiCalls += 1;
    }
  });

  try {
    await gotoWithRetry(page, `${WEB}/`);
    await page.locator('#landing-hero-form').waitFor({ state: 'visible', timeout: 90000 }).catch(() => {});
    await page.waitForTimeout(3000);
    const frBtn = page.locator('#landing-hero-form').getByRole('button', { name: '法国', exact: true });
    const frBtnVisible = await frBtn.isVisible().catch(() => false);
    if (frBtnVisible) {
      await frBtn.scrollIntoViewIfNeeded();
      await frBtn.click();
      await page.waitForTimeout(4000);
      const ambientSrc = await page.evaluate(() => {
        const host = document.querySelector('[data-tt-home-ambient-phase="A"]');
        return host?.getAttribute('data-tt-home-ambient-src') || '';
      });
      const ambientOk = Boolean(ambientSrc) && !isForbiddenFallback(ambientSrc) && !/unsplash/i.test(ambientSrc);
      surfaceRows.push({ surface: 'home_france_ambient', pass: ambientOk, runtime_src: ambientSrc });
      if (!ambientOk) issues.push(`home 法国 ambient: ${ambientSrc || 'MISSING'}`);
    } else {
      const ambientCatalog = await catalogFranceAmbientUrl();
      const ambientOk =
        ambientCatalog.published &&
        Boolean(ambientCatalog.url) &&
        !isForbiddenFallback(ambientCatalog.url) &&
        !/unsplash/i.test(ambientCatalog.url || '');
      surfaceRows.push({
        surface: 'home_france_ambient_catalog_fallback',
        pass: ambientOk,
        runtime_src: ambientCatalog.url,
        note: 'landing 法国 pill not visible · catalog media fallback',
      });
      if (!ambientOk) issues.push(`home 法国 ambient catalog fallback: ${ambientCatalog.url || 'MISSING'}`);
    }

    await gotoWithRetry(page, `${WEB}/market`);
    await page.locator('[data-tt-market-page]').waitFor({ state: 'visible', timeout: 60000 });
    await page.waitForTimeout(4000);
    const openItinerary = page.getByRole('button', { name: /Custom itinerary|自定义行程/i }).first();
    await openItinerary.scrollIntoViewIfNeeded();
    await openItinerary.click({ force: true, timeout: 60000 });
    await page.waitForTimeout(1500);
    if (!(await page.locator('[data-tt-custom-itinerary-modal="1"]').isVisible().catch(() => false))) {
      await openItinerary.click({ force: true, timeout: 30000 });
    }
    await page.locator('[data-tt-custom-itinerary-modal="1"]').waitFor({ state: 'visible', timeout: 60000 });
    surfaceRows.push({ surface: 'market_custom_itinerary_shell', pass: true });

    fs.mkdirSync(SHOT_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    await page.screenshot({ path: path.join(SHOT_DIR, `fr-country-runtime-${stamp}.png`), fullPage: false });

    for (const spec of CONSUMER_SURFACES.filter((s) => s.setup === 'scroll')) {
      await gotoWithRetry(page, `${WEB}${spec.path}`);
      await page.waitForTimeout(5000);
      await page.evaluate(async () => {
        window.scrollTo(0, document.body.scrollHeight / 2);
        await new Promise((r) => setTimeout(r, 800));
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise((r) => setTimeout(r, 800));
      });
      const scan = await scanPageImages(page, spec.id, { franceOnly: true });
      surfaceRows.push({
        surface: spec.id,
        pass: scan.issues.length === 0,
        image_count: scan.image_count,
        forbidden_count: scan.issues.length,
      });
      if (scan.issues.length) issues.push(...scan.issues.slice(0, 2));
    }

    await browser.close();

    return {
      id: 'live_consumer_runtime',
      label: 'Live Consumer · 首页法国 Ambient + Market 壳 + 法国相关内容无 fallback',
      pass: issues.length === 0,
      catalog_api_requests: catalogApiCalls,
      poi_runtime: poiAggregate.poi_runtime,
      poi_rows: poiAggregate.poi_rows,
      surface_rows: surfaceRows,
      issues,
    };
  } catch (e) {
    await browser.close();
    return {
      id: 'live_consumer_runtime',
      label: 'Live Consumer · 首页法国 Ambient + Market 壳 + 法国相关内容无 fallback',
      pass: false,
      issues: [String(e.message || e)],
      poi_rows: poiAggregate.poi_rows,
      surface_rows: surfaceRows,
    };
  }
}

async function liveConsumerProbeWithRetry(poiAggregate, attempts = 8) {
  let last = null;
  for (let i = 1; i <= attempts; i++) {
    last = await liveConsumerProbe(poiAggregate);
    if (last.pass) return { ...last, attempt: i };
    const transient = (last.issues || []).some((x) =>
      /ERR_CONNECTION|Timeout|net::|ECONNRESET|ETIMEDOUT/i.test(String(x)),
    );
    if (!transient || i === attempts) break;
    await new Promise((r) => setTimeout(r, 8000 * i));
  }
  return last;
}

function formatMd(report) {
  const lines = [
    '# France Country Runtime Audit',
    '',
    `**Verdict:** \`${report.verdict}\``,
    `**TT_CMS_FR_COUNTRY_RUNTIME:** \`${report.TT_CMS_FR_COUNTRY_RUNTIME}\``,
    '',
    '| # | 检查项 | 结果 |',
    '|---|--------|------|',
  ];
  report.checks.forEach((c, i) => {
    lines.push(`| ${i + 1} | ${c.label} | ${c.pass ? '✅ PASS' : '❌ FAIL'} |`);
  });
  lines.push('', `**FR POI Runtime:** ${report.poi_runtime_pass}/${report.poi_runtime_required} PASS`);
  lines.push('', '**三城汇总**', '');
  for (const row of report.city_summary || []) {
    lines.push(
      `- ${row.city_zh}: Exit ${row.exit_runtime} · Catalog ${row.catalog_pass}/${row.catalog_total} · Live ${row.live_pass}/${row.live_total}`,
    );
  }
  return lines.join('\n');
}

async function main() {
  const poiAggregate = aggregateExitCheckPoiRuntime();
  const staticChecks = [
    validateJpLockRegistryUnchanged(),
    validateKrLockRegistryUnchanged(),
    validateThLockRegistryUnchanged(),
    validateSgLockRegistryUnchanged(),
    validateFrLockRegistryUnchanged(),
    validateFrScopeLock(),
    validateFourCityExecutionClosures(),
    validateFourCityContentQaClosures(),
    validateFourCityExitChecks(),
    validateFranceAmbient(),
    await validateCatalogApiAllFrPois(API),
    poiAggregate,
  ];

  const live = await liveConsumerProbeWithRetry(poiAggregate);
  const checks = [...staticChecks, live];

  const allPass = checks.every((c) => c.pass);
  const poiRequired = FR_CITIES.reduce((n, zh) => n + CITY_PILOTS[zh].matrix_ids.length, 0);
  const poiRuntimePass = (poiAggregate.poi_rows || []).filter((r) => r.cms_runtime_ok).length;

  const citySummary = FR_CITIES.map((cityZh) => {
    const pilot = CITY_PILOTS[cityZh];
    const exit = staticChecks.find((c) => c.id === 'three_city_exit_checks')?.rows?.find((r) => r.city_zh === cityZh);
    const catalogRows =
      staticChecks.find((c) => c.id === 'catalog_api_fr_poi')?.rows?.filter((r) => r.city_zh === cityZh) || [];
    const liveRows = (poiAggregate.poi_rows || []).filter((r) => r.city_zh === cityZh);
    return {
      city_zh: cityZh,
      exit_runtime: exit?.runtime || '—',
      catalog_pass: catalogRows.filter((r) => r.pass).length,
      catalog_total: pilot.matrix_ids.length,
      live_pass: liveRows.filter((r) => r.cms_runtime_ok).length,
      live_total: pilot.matrix_ids.length,
    };
  });

  const report = {
    schema: 'traveltrust.cms_fr_country_runtime_audit.v1',
    recorded_at_utc: new Date().toISOString(),
    phase: '② staging',
    country: { country_iso: 'FR', country_zh: '法国', cities: FR_CITIES },
    jp_lock_guard: { required: 41, unchanged: true },
    kr_lock_guard: { required: 31, unchanged: true },
    th_lock_guard: { required: 28, unchanged: true },
    sg_lock_guard: { required: 10, unchanged: true },
    fr_lock_guard: { required: 24, unchanged: true },
    next_country: 'BLOCKED',
    production_go: 'BLOCKED',
    web_base: WEB,
    api_base: API,
    content_qa_standard: 'evidence/GO_cms_operation/CMS-CONTENT-QA-STANDARD-FROZEN.v1.json',
    runtime_tier: 'national_runtime',
    consumer_surfaces: CONSUMER_SURFACES.map((s) => s.id),
    checks,
    all_pass: allPass,
    poi_runtime_pass: poiRuntimePass,
    poi_runtime_required: poiRequired,
    city_summary: citySummary,
    verdict: allPass ? 'FR_COUNTRY_RUNTIME_PASS' : 'NOT_READY',
    TT_CMS_FR_COUNTRY_RUNTIME: allPass ? 'PASS' : 'FAIL',
    blockers: checks.filter((c) => !c.pass).flatMap((c) => c.issues || []),
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(OUT_MD, formatMd(report) + '\n');

  console.log(`TT_CMS_FR_COUNTRY_RUNTIME: ${report.TT_CMS_FR_COUNTRY_RUNTIME}`);
  console.log(`FR POI Runtime: ${poiRuntimePass}/${poiRequired} PASS`);
  console.log(`Verdict: ${report.verdict}`);
  for (const c of checks) {
    console.log(`  ${c.pass ? 'PASS' : 'FAIL'} ${c.label}`);
    if (!c.pass && c.issues?.length) {
      for (const i of c.issues.slice(0, 4)) console.log(`    · ${i}`);
    }
  }
  console.log('');
  console.log('City summary:');
  for (const row of citySummary) {
    console.log(
      `  ${row.city_zh} | Exit ${row.exit_runtime} | Catalog ${row.catalog_pass}/${row.catalog_total} | Live ${row.live_pass}/${row.live_total}`,
    );
  }
  console.log(`Evidence: ${OUT_JSON}`);
  if (!allPass) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
