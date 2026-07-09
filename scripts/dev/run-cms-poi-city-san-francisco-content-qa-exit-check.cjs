#!/usr/bin/env node
/**
 * San Francisco Content QA Exit Check · JP + KR + TH + SG + FR Golden Template 同源
 *
 *   WEB=https://tt-web-staging.fly.dev API=https://tt-api-staging.fly.dev \
 *     node scripts/dev/run-cms-poi-city-san-francisco-content-qa-exit-check.cjs
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { chromium } = require('../../frontend/node_modules/playwright');
const { getCityPilot } = require('./lib/cms-poi-city-pilot.cjs');
const { getAsset } = require('./lib/cms-content-qa-asset-lock.cjs');
const { buildUsaContentQa } = require('./lib/cms-usa-content-qa.cjs');
const { classifyRuntimeSource } = require('./lib/cms-l5-runtime-audit.cjs');
const { poiAttrFoodGroups } = require('./lib/cms-poi-attr-food-groups.cjs');

const ROOT = path.join(__dirname, '../..');
const WEB = (process.env.WEB || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const OUT_JSON = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-SAN_FRANCISCO-CONTENT-QA-EXIT-CHECK-LATEST.json');
const OUT_MD = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-SAN_FRANCISCO-CONTENT-QA-EXIT-CHECK-LATEST.md');
const SHOT_DIR = path.join(ROOT, 'evidence/GO_cms_operation/content-qa-exit-check/san-francisco');

const SAN_FRANCISCO = getCityPilot('旧金山');
const POI_COUNT = SAN_FRANCISCO.matrix_ids.length;
const CONTENT_QA_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-SAN_FRANCISCO-CONTENT-QA-CLOSURE-LATEST.json');

function fetchJson(url) {
  const lib = url.startsWith('https') ? https : http;
  return new Promise((resolve) => {
    const u = new URL(url);
    lib.get({ hostname: u.hostname, path: u.pathname + u.search, headers: { Accept: 'application/json' } }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        try {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode, json: JSON.parse(d) });
        } catch {
          resolve({ ok: false, status: res.statusCode, json: null });
        }
      });
    }).on('error', () => resolve({ ok: false, status: 0, json: null }));
  });
}

function filename(u) {
  if (!u) return '';
  return u.split('?')[0].replace(/\/$/, '').split('/').pop() || '';
}

function checkLockRegistry() {
  const issues = [];
  const rows = [];
  for (const matrixId of SAN_FRANCISCO.matrix_ids) {
    const poi = SAN_FRANCISCO.pois[SAN_FRANCISCO.matrix_ids.indexOf(matrixId)];
    const a = getAsset(matrixId);
    rows.push({ matrix_id: matrixId, poi, state: a.state, replace_count: a.replace_count, unlock_reason: a.unlock_reason });
    if (a.state !== 'LOCKED') issues.push(`${poi}: not LOCKED`);
    if (a.replace_count !== 1) issues.push(`${poi}: replace_count=${a.replace_count}`);
    if (a.unlock_reason) issues.push(`${poi}: unlock_reason set`);
  }
  return {
    id: 'assets_locked_8_8',
    label: `${POI_COUNT}/${POI_COUNT} Asset 全部 LOCKED · 无 Unlock`,
    pass: issues.length === 0,
    rows,
    issues,
  };
}

function checkSixDimensions(runtimeCheck) {
  const report = buildUsaContentQa();
  const city = report.cities.find((c) => c.city_zh === '旧金山');
  const issues = [];
  if (!city?.content_qa_closed) issues.push('city content_qa_closed false');
  if (city?.backlog_issue_count !== 0) issues.push(`open backlog ${city?.backlog_issue_count}`);
  for (const d of ['execution', 'cms_ownership', 'geo_matching', 'content_accuracy', 'l5_quality']) {
    if (city?.[d]?.verdict !== 'PASS') {
      const reason = city?.[d]?.reason || city?.[d]?.note || '';
      issues.push(`${d}=${city?.[d]?.verdict}${reason ? ` (${reason})` : ''}`);
    }
  }
  if (!runtimeCheck?.pass) {
    issues.push(
      `runtime_consumer=FAIL (City Consumer Runtime · Gate 4 同源 · ${(runtimeCheck?.issues || []).slice(0, 2).join('; ')})`,
    );
  }
  for (const matrixId of SAN_FRANCISCO.matrix_ids) {
    const qa = getAsset(matrixId).content_qa;
    if (!qa?.all_pass) issues.push(`${matrixId} lock snapshot not all_pass`);
  }
  return {
    id: 'six_dimensions_pass',
    label: '六维全部 PASS（City Runtime = Gate 4 同源 · 非 national）',
    pass: issues.length === 0,
    runtime_scope: 'city_consumer_runtime',
    city_snapshot: city
      ? {
          execution: city.execution.verdict,
          cms_ownership: city.cms_ownership.verdict,
          runtime_consumer: runtimeCheck?.pass ? 'PASS' : 'FAIL',
          geo_matching: city.geo_matching.verdict,
          content_accuracy: city.content_accuracy.verdict,
          l5_quality: city.l5_quality.verdict,
          content_qa_closed: city.content_qa_closed,
        }
      : null,
    issues,
  };
}

async function checkCatalogApi() {
  const issues = [];
  const r = await fetchJson(
    `${API}/api/v1/catalog/poi-images?country_iso=US&city=${encodeURIComponent('旧金山')}&limit=50`,
  );
  if (!r.ok) {
    return { id: 'catalog_api', label: 'Catalog API 可读', pass: false, issues: [`HTTP ${r.status}`] };
  }
  const items = r.json?.items || [];
  const rows = [];
  for (const matrixId of SAN_FRANCISCO.matrix_ids) {
    const poi = SAN_FRANCISCO.pois[SAN_FRANCISCO.matrix_ids.indexOf(matrixId)];
    const heroFile = getAsset(matrixId).hero_file;
    const row = items.find((x) => filename(x.image_url) === heroFile);
    const fn = filename(row?.image_url);
    const ok = fn === heroFile && ['published', 'payload', 'catalog'].includes(String(row?.image_source || 'payload'));
    rows.push({ matrix_id: matrixId, poi, expected: heroFile, catalog: fn, image_source: row?.image_source, pass: ok });
    if (!ok) issues.push(`${matrixId} ${poi}: catalog=${fn || 'MISSING'} expected=${heroFile}`);
  }
  return {
    id: 'catalog_api_san_francisco',
    label: `Catalog API ${POI_COUNT}/${POI_COUNT} 与 LOCK 一致`,
    pass: issues.length === 0,
    rows,
    issues,
  };
}

async function checkConsumerRuntimeOnce(catalogRows) {
  const browser = await chromium.launch({ headless: true, args: ['--disable-http2'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const issues = [];
  const runtimeRows = [];
  let catalogApiCalls = 0;

  page.on('request', (req) => {
    if (req.url().includes('/api/v1/catalog/poi-images') || req.url().includes('/api/v1/catalog/pois')) {
      catalogApiCalls += 1;
    }
  });

  try {
    await page.goto(`${WEB}/`, { waitUntil: 'load', timeout: 120000 });
    await page.locator('#landing-hero-form').waitFor({ state: 'visible', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(2000);

    await page.goto(`${WEB}/market`, { waitUntil: 'load', timeout: 120000 });
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
    const dlg = page.getByTestId('custom-itinerary-panel');
    await dlg.waitFor({ state: 'visible', timeout: 90000 });

    await dlg
      .getByRole('group', { name: /Total days|总天数|行程天数/i })
      .getByRole('button', { name: /^2 days$|^2\s*天$/ })
      .click({ timeout: 30000 });

    await dlg.getByRole('button', { name: /^(Country|国家)$/ }).click({ timeout: 30000 });
    await dlg.getByRole('option', { name: '美国' }).click({ timeout: 30000 });

    await dlg.getByRole('heading', { level: 3, name: /第\s*1\s*天|Day\s*1/i }).waitFor({ timeout: 60000 });

    const day1Heading = dlg.getByRole('heading', { level: 3, name: /第\s*1\s*天|Day\s*1/i }).first();
    const day1 = day1Heading.locator('xpath=../..');
    await day1.getByRole('button', { name: '旧金山', exact: true }).click({ timeout: 30000 });

    await page.waitForTimeout(1500);

    const { attrPois, foodPois } = poiAttrFoodGroups(SAN_FRANCISCO);
    for (const poi of attrPois) {
      await day1
        .getByRole('group', { name: /Attractions|景区/i })
        .getByRole('button', { name: poi, exact: true })
        .click({ timeout: 30000 });
    }
    for (const poi of foodPois) {
      await day1
        .getByRole('group', { name: /Food|美食/i })
        .getByRole('button', { name: poi, exact: true })
        .click({ timeout: 30000 });
    }

    await page.waitForTimeout(2500);

    fs.mkdirSync(SHOT_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const shotPath = path.join(SHOT_DIR, `san-francisco-poi-runtime-${stamp}.png`);
    await page.screenshot({ path: shotPath, fullPage: false });

    const domImages = await page.evaluate(() => {
      const hits = [];
      const panel = document.querySelector('[data-testid="custom-itinerary-panel"]');
      const root = panel || document.body;
      for (const btn of root.querySelectorAll('button')) {
        const img = btn.querySelector('img');
        if (!img) continue;
        const rect = img.getBoundingClientRect();
        if (rect.width < 32 || rect.height < 32) continue;
        const titleEl = btn.querySelector('p.font-medium, p.text-small');
        const title = (titleEl?.textContent || btn.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
        hits.push({ src: img.currentSrc || img.src, context: title.slice(0, 120) });
      }
      return hits;
    });

    const catalogByMatrix = Object.fromEntries((catalogRows || []).map((r) => [r.matrix_id, r.expected]));
    const usedSrc = new Set();
    const heroDemand = {};
    for (const matrixId of SAN_FRANCISCO.matrix_ids) {
      const fn = catalogByMatrix[matrixId] || getAsset(matrixId).hero_file;
      heroDemand[fn] = (heroDemand[fn] || 0) + 1;
    }

    for (let i = 0; i < SAN_FRANCISCO.matrix_ids.length; i++) {
      const matrixId = SAN_FRANCISCO.matrix_ids[i];
      const poi = SAN_FRANCISCO.pois[i];
      const expectedFn = catalogByMatrix[matrixId] || getAsset(matrixId).hero_file;
      const sharedHero = (heroDemand[expectedFn] || 1) > 1;
      let match = domImages.find(
        (img) =>
          filename(img.src) === expectedFn &&
          !usedSrc.has(img.src) &&
          (img.context.includes(poi) || img.context.startsWith(poi)),
      );
      if (!match) {
        match = domImages.find((img) => !usedSrc.has(img.src) && filename(img.src) === expectedFn);
      }
      if (!match && sharedHero) {
        match = domImages.find(
          (img) =>
            filename(img.src) === expectedFn &&
            (img.context.includes(poi) || img.context.startsWith(poi)),
        );
      }
      if (match) usedSrc.add(match.src);
      const src = match?.src || null;
      const srcFn = filename(src);
      const cls = classifyRuntimeSource(src || '');
      const cmsOk =
        src &&
        (src.includes('/uploads/community-posts/') ||
          src.includes('/api/v1/catalog/') ||
          src.includes('/api/v1/uploads/')) &&
        srcFn === expectedFn &&
        !cls.flags?.is_unsplash &&
        cls.current_source !== 'placeholder';
      runtimeRows.push({
        matrix_id: matrixId,
        poi,
        expected_fn: expectedFn,
        runtime_fn: srcFn || null,
        runtime_src: src,
        source_lane: cls.current_source,
        cms_runtime_ok: cmsOk,
        found_in_dom: Boolean(match),
      });
      if (!cmsOk) {
        issues.push(`${poi}: consumer ${srcFn || 'NOT_FOUND'} ≠ ${expectedFn} · lane=${cls.current_source}`);
      }
    }

    if (catalogApiCalls === 0) issues.push('Consumer 未发起 catalog/poi-images 请求');

    await browser.close();
    return {
      id: 'consumer_runtime_cms',
      label: 'Consumer Runtime 实际页面读取 CMS（非仅 Verify）',
      pass: issues.length === 0,
      catalog_api_requests: catalogApiCalls,
      screenshot: path.relative(ROOT, shotPath).replace(/\\/g, '/'),
      rows: runtimeRows,
      issues,
    };
  } catch (e) {
    await browser.close();
    return {
      id: 'consumer_runtime_cms',
      label: 'Consumer Runtime 实际页面读取 CMS（非仅 Verify）',
      pass: false,
      issues: [String(e.message || e)],
      rows: runtimeRows,
    };
  }
}

async function checkConsumerRuntime(catalogRows, attempts = 4) {
  let last = null;
  for (let i = 1; i <= attempts; i++) {
    last = await checkConsumerRuntimeOnce(catalogRows);
    if (last.pass) return { ...last, probe_attempt: i };
    const transient = (last.issues || []).some((x) =>
      /ERR_CONNECTION|Timeout|net::|ECONNRESET|ETIMEDOUT|market-page/i.test(String(x)),
    );
    if (!transient || i === attempts) break;
    await new Promise((r) => setTimeout(r, 8000 * i));
  }
  return last;
}

function checkVisualExit(runtimeCheck) {
  const issues = [];
  for (const row of runtimeCheck.rows || []) {
    const cls = classifyRuntimeSource(row.runtime_src || '');
    if (cls.flags?.is_unsplash) issues.push(`${row.poi}: unsplash`);
    if (cls.current_source === 'placeholder') issues.push(`${row.poi}: placeholder`);
    if (row.runtime_fn && row.expected_fn && row.runtime_fn !== row.expected_fn) {
      issues.push(`${row.poi}: wrong image file`);
    }
  }
  return {
    id: 'visual_screenshot',
    label: '页面截图/DOM · 无旧图/错图/Fallback',
    pass: issues.length === 0 && runtimeCheck.pass,
    screenshot: runtimeCheck.screenshot || null,
    issues,
  };
}

function checkNoBacklogUnlock() {
  const open = SAN_FRANCISCO.matrix_ids.filter((id) => getAsset(id).state !== 'LOCKED');
  const unlocks = SAN_FRANCISCO.matrix_ids.filter((id) => getAsset(id).unlock_reason);
  const issues = [];
  if (open.length) issues.push(`unlocked: ${open.length}`);
  if (unlocks.length) issues.push(`unlock_reason: ${unlocks.length}`);
  if (!fs.existsSync(CONTENT_QA_CLOSURE)) issues.push('missing CONTENT_QA_CLOSURE evidence');
  return {
    id: 'no_backlog_unlock',
    label: '无 Open Backlog · 无 Unlock',
    pass: issues.length === 0,
    issues,
  };
}

function formatMd(report) {
  const lines = [
    '# San Francisco Content QA Exit Check',
    '',
    `**Verdict:** \`${report.verdict}\``,
    `**Content QA:** \`${report.TT_CMS_POI_CITY_SAN_FRANCISCO_CONTENT_QA}\``,
    '',
    '| # | 检查项 | 结果 |',
    '|---|--------|------|',
  ];
  report.checks.forEach((c, i) => {
    lines.push(`| ${i + 1} | ${c.label} | ${c.pass ? '✅ PASS' : '❌ FAIL'} |`);
  });
  lines.push('', `**City Runtime:** ${report.city_runtime_pass_count}/${POI_COUNT} PASS`);
  return lines.join('\n');
}

async function main() {
  const catalogCheck = await checkCatalogApi();
  const runtime = await checkConsumerRuntime(catalogCheck.rows || []);
  const checks = [
    checkLockRegistry(),
    checkSixDimensions(runtime),
    catalogCheck,
    runtime,
    checkVisualExit(runtime),
    checkNoBacklogUnlock(),
  ];

  const allPass = checks.every((c) => c.pass);
  const cityRuntimePass = (runtime.rows || []).filter((r) => r.cms_runtime_ok).length;

  const report = {
    schema: 'traveltrust.cms_poi_city_content_qa_exit_check.v1',
    recorded_at_utc: new Date().toISOString(),
    city: { city_zh: '旧金山', city_en: 'San Francisco', country_iso: 'US', poi_count: POI_COUNT },
    replicated_from: 'JP + KR + TH + SG + FR Golden Template (TT_CMS_JP_COUNTRY: CLOSED)',
    web_base: WEB,
    api_base: API,
    checks,
    all_pass: allPass,
    city_runtime_pass_count: cityRuntimePass,
    city_runtime_required: POI_COUNT,
    verdict: allPass ? 'CONTENT_QA_EXIT_PASS' : 'NOT_READY',
    TT_CMS_POI_CITY_SAN_FRANCISCO_CONTENT_QA: fs.existsSync(CONTENT_QA_CLOSURE) ? 'CLOSED' : 'OPEN',
    TT_CMS_POI_CITY_SAN_FRANCISCO_CONTENT_QA_EXIT: allPass ? 'PASS' : 'FAIL',
    runtime_tiers: {
      city: { tier: 'city_consumer_runtime', gate_2_equals_gate_4: true },
      country: { tier: 'national_runtime', when: 'TT_CMS_US_COUNTRY: CLOSED', not_in_scope: true },
    },
    blockers: checks.filter((c) => !c.pass).flatMap((c) => c.issues || []),
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(OUT_MD, formatMd(report) + '\n');

  console.log(`TT_CMS_POI_CITY_SAN_FRANCISCO_CONTENT_QA_EXIT: ${report.TT_CMS_POI_CITY_SAN_FRANCISCO_CONTENT_QA_EXIT}`);
  console.log(`City Runtime: ${cityRuntimePass}/${POI_COUNT} PASS`);
  console.log(`Verdict: ${report.verdict}`);
  for (const c of checks) {
    console.log(`  ${c.pass ? 'PASS' : 'FAIL'} ${c.label}`);
    if (!c.pass && c.issues?.length) {
      for (const i of c.issues.slice(0, 4)) console.log(`    · ${i}`);
    }
  }
  console.log(`Evidence: ${OUT_JSON}`);
  if (!allPass || cityRuntimePass !== POI_COUNT) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
