#!/usr/bin/env node
/**
 * Osaka Content QA Exit Check · Golden Template gate
 *
 *   WEB=https://tt-web-staging.fly.dev API=https://tt-api-staging.fly.dev \
 *     node scripts/dev/run-cms-poi-city-osaka-content-qa-exit-check.cjs
 *
 * 五项全部 PASS → TT_CMS_POI_CITY_OSAKA_GOLDEN_TEMPLATE: YES
 * Gate 2 Runtime = Gate 4 · city_consumer_runtime（national 不否决 · 见 CMS-CONTENT-QA-STANDARD-FROZEN.v1.json）
 * 任一项 FAIL → 不得复制到札幌 · 不得修改大阪 LOCK
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { chromium } = require('../../frontend/node_modules/playwright');
const { getCityPilot } = require('./lib/cms-poi-city-pilot.cjs');
const { readRegistry, getAsset } = require('./lib/cms-content-qa-asset-lock.cjs');
const { buildJapanContentQa } = require('./lib/cms-japan-content-qa.cjs');
const { classifyRuntimeSource } = require('./lib/cms-l5-runtime-audit.cjs');

const ROOT = path.join(__dirname, '../..');
const WEB = (process.env.WEB || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const OUT_JSON = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-OSAKA-CONTENT-QA-EXIT-CHECK-LATEST.json');
const OUT_MD = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-OSAKA-CONTENT-QA-EXIT-CHECK-LATEST.md');
const SHOT_DIR = path.join(ROOT, 'evidence/GO_cms_operation/content-qa-exit-check/osaka');

const OSAKA = getCityPilot('大阪');
const CONTENT_QA_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-OSAKA-CONTENT-QA-CLOSURE-LATEST.json');

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

function normUrl(u) {
  if (!u) return '';
  return u.split('?')[0].replace(/\/$/, '');
}

function filename(u) {
  return normUrl(u).split('/').pop() || '';
}

function checkLockRegistry() {
  const issues = [];
  const rows = [];
  for (const matrixId of OSAKA.matrix_ids) {
    const poi = OSAKA.pois[OSAKA.matrix_ids.indexOf(matrixId)];
    const a = getAsset(matrixId);
    rows.push({ matrix_id: matrixId, poi, state: a.state, replace_count: a.replace_count, unlock_reason: a.unlock_reason });
    if (a.state !== 'LOCKED') issues.push(`${poi}: not LOCKED`);
    if (a.replace_count !== 1) issues.push(`${poi}: replace_count=${a.replace_count}`);
    if (a.unlock_reason) issues.push(`${poi}: unlock_reason set`);
  }
  return {
    id: 'assets_locked_8_8',
    label: '8/8 Asset 全部 LOCKED · 无 Unlock',
    pass: issues.length === 0,
    rows,
    issues,
  };
}

function checkSixDimensions(runtimeCheck) {
  const report = buildJapanContentQa();
  const city = report.cities.find((c) => c.city_zh === '大阪');
  const issues = [];
  if (!city?.content_qa_closed) issues.push('city content_qa_closed false');
  if (city?.backlog_issue_count !== 0) issues.push(`open backlog ${city?.backlog_issue_count}`);
  const cityDims = ['execution', 'cms_ownership', 'geo_matching', 'content_accuracy', 'l5_quality'];
  for (const d of cityDims) {
    if (city?.[d]?.verdict !== 'PASS') {
      const reason = city?.[d]?.reason || city?.[d]?.note || '';
      issues.push(`${d}=${city?.[d]?.verdict}${reason ? ` (${reason})` : ''}`);
    }
  }
  // Gate 2 Runtime = Gate 4 · city_consumer_runtime（不采用 national POI 族）
  if (!runtimeCheck?.pass) {
    issues.push(
      `runtime_consumer=FAIL (City Consumer Runtime · Gate 4 同源 · ${(runtimeCheck?.issues || []).slice(0, 2).join('; ')})`,
    );
  }
  for (const matrixId of OSAKA.matrix_ids) {
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
  const expected = {};
  for (const matrixId of OSAKA.matrix_ids) {
    expected[OSAKA.pois[OSAKA.matrix_ids.indexOf(matrixId)]] = getAsset(matrixId).hero_file;
  }
  const r = await fetchJson(
    `${API}/api/v1/catalog/poi-images?country_iso=JP&city=${encodeURIComponent('大阪')}&limit=50`,
  );
  if (!r.ok) {
    return { id: 'catalog_api', label: 'Catalog API 可读', pass: false, issues: [`HTTP ${r.status}`] };
  }
  const byLegacy = {};
  for (const item of r.json?.items || []) {
    byLegacy[item.legacy_value || item.name_zh] = item;
  }
  const rows = [];
  for (const [poi, heroFile] of Object.entries(expected)) {
    const row = byLegacy[poi];
    const fn = filename(row?.image_url);
    const ok = fn === heroFile && ['published', 'payload', 'catalog'].includes(String(row?.image_source || 'payload'));
    rows.push({ poi, expected: heroFile, catalog: fn, image_source: row?.image_source, pass: ok });
    if (!ok) issues.push(`${poi}: catalog=${fn || 'MISSING'} expected=${heroFile}`);
  }
  return {
    id: 'catalog_api_osaka',
    label: 'Catalog API 8/8 与 LOCK 一致',
    pass: issues.length === 0,
    rows,
    issues,
  };
}

async function probeStagingCatalogOptIn() {
  const lib = WEB.startsWith('https') ? https : http;
  return new Promise((resolve) => {
    lib.get(`${WEB}/market`, (res) => {
      let html = '';
      res.on('data', (c) => (html += c));
      res.on('end', () => {
        const chunks = [...html.matchAll(/\/_next\/static\/chunks\/[^"' ]+\.js/g)].slice(0, 12).map((m) => m[0]);
        resolve({ html_ok: res.statusCode >= 200 && res.statusCode < 400, chunks });
      });
    }).on('error', () => resolve({ html_ok: false, chunks: [] }));
  });
}

async function detectCatalogOptInFlag() {
  const probe = await probeStagingCatalogOptIn();
  let enabled = null;
  for (const chunk of probe.chunks || []) {
    const url = chunk.startsWith('http') ? chunk : `${WEB}${chunk}`;
    const lib = url.startsWith('https') ? https : http;
    const body = await new Promise((resolve) => {
      lib.get(url, (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve(d.slice(0, 500000)));
      }).on('error', () => resolve(''));
    });
    if (body.includes('NEXT_PUBLIC_CATALOG_API_ENABLED":"1"') || body.includes('CATALOG_API_ENABLED==="1"')) {
      enabled = '1';
      break;
    }
    if (body.includes('NEXT_PUBLIC_CATALOG_API_ENABLED":"0"') || body.includes('CATALOG_API_ENABLED==="0"')) {
      enabled = '0';
    }
  }
  return { catalog_api_enabled: enabled, probe };
}

async function checkConsumerRuntime(catalogRows) {
  const optIn = await detectCatalogOptInFlag();
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
    await page.goto(`${WEB}/market`, { waitUntil: 'networkidle', timeout: 120000 });
    await page.locator('[data-tt-market-page]').waitFor({ state: 'visible', timeout: 60000 });

    const openItinerary = page.getByRole('button', { name: /Custom itinerary|自定义行程/i }).first();
    await openItinerary.scrollIntoViewIfNeeded();
    await openItinerary.click({ force: true, timeout: 60000 });

    const dlg = page.getByTestId('custom-itinerary-panel');
    await dlg.waitFor({ state: 'visible', timeout: 60000 });

    await dlg
      .getByRole('group', { name: /Total days|总天数|行程天数/i })
      .getByRole('button', { name: /^2 days$|^2\s*天$/ })
      .click({ timeout: 30000 });

    await dlg.getByRole('button', { name: /^(Country|国家)$/ }).click({ timeout: 30000 });
    await dlg.getByRole('option', { name: '日本' }).click({ timeout: 30000 });

    await dlg.getByRole('heading', { level: 3, name: /第\s*1\s*天|Day\s*1/i }).waitFor({ timeout: 60000 });

    const day1Heading = dlg.getByRole('heading', { level: 3, name: /第\s*1\s*天|Day\s*1/i }).first();
    const day1 = day1Heading.locator('xpath=../..');
    await day1.getByRole('button', { name: '大阪', exact: true }).click({ timeout: 30000 });

    await page.waitForTimeout(1500);

    const attrPois = OSAKA.pois.slice(0, 4);
    const foodPois = OSAKA.pois.slice(4);
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
    const shotPath = path.join(SHOT_DIR, `osaka-poi-runtime-${stamp}.png`);
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
        hits.push({
          src: img.currentSrc || img.src,
          alt: img.alt || '',
          context: title.slice(0, 120),
        });
      }
      return hits;
    });

    const catalogByPoi = Object.fromEntries((catalogRows || []).map((r) => [r.poi, r.expected]));

    for (const poi of OSAKA.pois) {
      const expectedHero = catalogByPoi[poi] || getAsset(OSAKA.matrix_ids[OSAKA.pois.indexOf(poi)]).hero_file;
      const expectedFn = expectedHero;
      const match = domImages.find(
        (img) =>
          img.context.includes(poi) ||
          img.context.startsWith(poi) ||
          filename(img.src).includes(expectedFn.replace('.jpg', '')),
      );
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
        poi,
        expected_fn: expectedFn,
        runtime_fn: srcFn || null,
        runtime_src: src,
        source_lane: cls.current_source,
        cms_runtime_ok: cmsOk,
        found_in_dom: Boolean(match),
      });
      if (!cmsOk) {
        issues.push(
          `${poi}: consumer ${srcFn || 'NOT_FOUND'} ≠ ${expectedFn} · lane=${cls.current_source}`,
        );
      }
    }

    if (catalogApiCalls === 0) {
      issues.push('Consumer 未发起 catalog/poi-images 请求');
    }

    await browser.close();
    return {
      id: 'consumer_runtime_cms',
      label: 'Consumer Runtime 实际页面读取 CMS（非仅 Verify）',
      pass: issues.length === 0,
      staging_catalog_opt_in: optIn.catalog_api_enabled,
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
  const reg = readRegistry();
  const open = OSAKA.matrix_ids.filter((id) => getAsset(id).state !== 'LOCKED');
  const unlocks = OSAKA.matrix_ids.filter((id) => getAsset(id).unlock_reason);
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
    '# Osaka Content QA Exit Check',
    '',
    `**Golden Template:** \`${report.TT_CMS_POI_CITY_OSAKA_GOLDEN_TEMPLATE}\``,
    '',
    '| # | 检查项 | 结果 |',
    '|---|--------|------|',
  ];
  report.checks.forEach((c, i) => {
    lines.push(`| ${i + 1} | ${c.label} | ${c.pass ? '✅ PASS' : '❌ FAIL'} |`);
  });
  lines.push('', `**Verdict:** ${report.verdict}`, '');
  if (report.blockers?.length) {
    lines.push('## Blockers', '');
    for (const b of report.blockers) lines.push(`- ${b}`);
  }
  if (report.checks.find((c) => c.id === 'consumer_runtime_cms')?.screenshot) {
    lines.push('', `Screenshot: \`${report.checks.find((c) => c.id === 'consumer_runtime_cms').screenshot}\``);
  }
  lines.push('', '---', '通过后：**不得修改大阪** · 复制模板至札幌');
  return lines.join('\n');
}

async function main() {
  const lockCheck = checkLockRegistry();
  const catalogCheck = await checkCatalogApi();
  const catalogRows = catalogCheck.rows || [];
  const runtime = await checkConsumerRuntime(catalogRows);
  const checks = [
    lockCheck,
    checkSixDimensions(runtime),
    catalogCheck,
    runtime,
    checkVisualExit(runtime),
    checkNoBacklogUnlock(),
  ];

  const allPass = checks.every((c) => c.pass);
  const blockers = checks.filter((c) => !c.pass).flatMap((c) => c.issues || [`${c.id} failed`]);

  const report = {
    schema: 'traveltrust.cms_poi_city_content_qa_exit_check.v1',
    recorded_at_utc: new Date().toISOString(),
    city: { city_zh: '大阪', city_en: 'Osaka', country_iso: 'JP' },
    web_base: WEB,
    api_base: API,
    checks,
    all_pass: allPass,
    verdict: allPass ? 'GOLDEN_TEMPLATE_READY' : 'NOT_READY',
    TT_CMS_POI_CITY_OSAKA_GOLDEN_TEMPLATE: allPass ? 'YES' : 'NO',
    TT_CMS_POI_CITY_OSAKA_CONTENT_QA: fs.existsSync(CONTENT_QA_CLOSURE) ? 'CLOSED' : 'OPEN',
    runtime_tiers: {
      city: {
        tier: 'city_consumer_runtime',
        gate_2_equals_gate_4: true,
        consumer_surface: '/market → Custom Itinerary → 日本 → 大阪 → POI preview',
      },
      country: {
        tier: 'national_runtime',
        when: 'TT_CMS_JP_COUNTRY: CLOSED',
        not_veto_city_golden_template: true,
      },
      workflow: [
        'City CLOSED',
        'City Content QA CLOSED',
        'Golden Template (City)',
        '复制到本国其它城市',
        'Country Runtime 全站验收',
        'Country CLOSED',
      ],
    },
    blockers,
    next_when_pass: '复制同一模板至札幌 · 不修改大阪 · 不新增规则',
    next_when_fail: '修复 Blocker · 不得进入札幌 · 不得 Unlock 除非真实错误',
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(OUT_MD, formatMd(report) + '\n');

  console.log(`TT_CMS_POI_CITY_OSAKA_GOLDEN_TEMPLATE: ${report.TT_CMS_POI_CITY_OSAKA_GOLDEN_TEMPLATE}`);
  console.log(`Verdict: ${report.verdict}`);
  for (const c of checks) {
    console.log(`  ${c.pass ? 'PASS' : 'FAIL'} ${c.label}`);
    if (!c.pass && c.issues?.length) {
      for (const i of c.issues.slice(0, 5)) console.log(`    · ${i}`);
    }
  }
  console.log(`Evidence: ${OUT_JSON}`);
  if (!allPass) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
