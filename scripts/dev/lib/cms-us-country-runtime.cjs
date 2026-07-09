/**
 * USA Country Runtime · national_runtime tier · Content QA frozen standard 同源
 * 不修改 LOCK · 不调整 Content QA 标准 · 不得进入下一国家或 ③ Production GO
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { CITY_PILOTS } = require('./cms-poi-city-pilot.cjs');
const { getAsset } = require('./cms-content-qa-asset-lock.cjs');
const { classifyRuntimeSource } = require('./cms-l5-runtime-audit.cjs');
const { loadAmbientRuntimeWiringSsot } = require('./cms-l5-audit-ssot.cjs');

const ROOT = path.join(__dirname, '../../..');
const US_CITIES = ['旧金山', '拉斯维加斯', '洛杉矶', '纽约'];
const FR_CITIES = ['巴黎', '里昂', '尼斯'];
const TH_CITIES = ['曼谷', '普吉', '清迈'];
const SG_CITIES = ['新加坡'];
const KR_CITIES = ['首尔', '釜山', '济州', '仁川'];
const JP_CITIES = ['东京', '大阪', '京都', '札幌', '福冈'];

const EVIDENCE = {
  runtime_audit: path.join(ROOT, 'evidence/GO_cms_operation/CMS-US-COUNTRY-RUNTIME-AUDIT-LATEST.json'),
  country_closure: path.join(ROOT, 'evidence/GO_cms_operation/CMS-US-COUNTRY-CLOSURE-LATEST.json'),
  content_qa: path.join(ROOT, 'evidence/GO_cms_operation/CMS-USA-CONTENT-QA-LATEST.json'),
  frozen_standard: path.join(ROOT, 'evidence/GO_cms_operation/CMS-CONTENT-QA-STANDARD-FROZEN.v1.json'),
  us_scope_lock: path.join(ROOT, 'evidence/GO_cms_operation/CMS-US-POI-CATALOG-SCOPE-LOCK-LATEST.json'),
};

function readJson(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function cityToken(cityEn) {
  return String(cityEn || '').replace(/\s+/g, '-').toUpperCase();
}

function cityEvidenceToken(cityZh) {
  return cityToken(CITY_PILOTS[cityZh].city_en);
}

const US_CITY_QA_EVIDENCE_TOKEN = {
  旧金山: 'SAN_FRANCISCO',
  拉斯维加斯: 'LAS_VEGAS',
  洛杉矶: 'LOS_ANGELES',
  纽约: 'NEW_YORK',
};

function cityQaEvidenceToken(cityZh) {
  return US_CITY_QA_EVIDENCE_TOKEN[cityZh] || cityEvidenceToken(cityZh);
}

function cityExitPath(cityZh) {
  return path.join(
    ROOT,
    'evidence/GO_cms_operation',
    `CMS-POI-CITY-${cityQaEvidenceToken(cityZh)}-CONTENT-QA-EXIT-CHECK-LATEST.json`,
  );
}

function cityContentQaClosurePath(cityZh) {
  return path.join(
    ROOT,
    'evidence/GO_cms_operation',
    `CMS-POI-CITY-${cityQaEvidenceToken(cityZh)}-CONTENT-QA-CLOSURE-LATEST.json`,
  );
}

function cityExecClosurePath(cityZh) {
  return path.join(
    ROOT,
    'evidence/GO_cms_operation',
    `CMS-POI-CITY-${cityEvidenceToken(cityZh)}-CLOSURE-LATEST.json`,
  );
}

function filename(u) {
  if (!u) return '';
  return u.split('?')[0].replace(/\/$/, '').split('/').pop() || '';
}

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

function cmsPoiRuntimeOk(src, expectedFn) {
  const srcFn = filename(src);
  const cls = classifyRuntimeSource(src || '');
  return Boolean(
    src &&
      (src.includes('/uploads/community-posts/') ||
        src.includes('/api/v1/catalog/') ||
        src.includes('/api/v1/uploads/')) &&
      srcFn === expectedFn &&
      !cls.flags?.is_unsplash &&
      cls.current_source !== 'placeholder',
  );
}

function isForbiddenFallback(src) {
  if (!src) return true;
  const cls = classifyRuntimeSource(src);
  if (cls.flags?.is_unsplash || cls.flags?.is_pexels || cls.flags?.is_placeholder) return true;
  if (/unsplash|pexels|placehold\.co|via\.placeholder/i.test(src)) return true;
  return false;
}

function validateUsCityExitChecks() {
  const rows = [];
  const issues = [];
  for (const cityZh of US_CITIES) {
    const pilot = CITY_PILOTS[cityZh];
    const exitPath = cityExitPath(cityZh);
    const exit = readJson(exitPath);
    const consumerPass = exit?.checks?.find((c) => c.id === 'consumer_runtime_cms')?.pass === true;
    const pass =
      exit &&
      exit.all_pass === true &&
      consumerPass &&
      (exit.verdict === 'CONTENT_QA_EXIT_PASS' ||
        exit.verdict === 'GOLDEN_TEMPLATE_READY' ||
        (exit.city_runtime_pass_count === pilot.matrix_ids.length &&
          exit.city_runtime_required === pilot.matrix_ids.length));
    rows.push({
      city_zh: cityZh,
      city_en: pilot.city_en,
      poi_count: pilot.matrix_ids.length,
      exit_check: path.relative(ROOT, exitPath).replace(/\\/g, '/'),
      pass: Boolean(pass),
      runtime:
        exit?.city_runtime_pass_count != null
          ? `${exit.city_runtime_pass_count}/${exit.city_runtime_required}`
          : pass
            ? `${pilot.matrix_ids.length}/${pilot.matrix_ids.length}`
            : 'MISSING',
      verdict: exit?.verdict || 'MISSING',
    });
    if (!pass) issues.push(`${cityZh}: city exit check not PASS (${exit?.verdict || 'missing'})`);
  }
  return {
    id: 'four_city_exit_checks',
    label: '四城 Golden Template Exit Check · city_consumer_runtime',
    pass: issues.length === 0,
    rows,
    issues,
  };
}

function validateUsCityContentQaClosures() {
  const rows = [];
  const issues = [];
  for (const cityZh of US_CITIES) {
    const pilot = CITY_PILOTS[cityZh];
    const p = cityContentQaClosurePath(cityZh);
    const doc = readJson(p);
    const locked = pilot.matrix_ids.filter((id) => getAsset(id).state === 'LOCKED').length;
    const pass = Boolean(doc) && locked === pilot.matrix_ids.length;
    rows.push({
      city_zh: cityZh,
      content_qa_closure: path.relative(ROOT, p).replace(/\\/g, '/'),
      locked: `${locked}/${pilot.matrix_ids.length}`,
      pass,
    });
    if (!pass) issues.push(`${cityZh}: Content QA closure or LOCK incomplete`);
  }
  return {
    id: 'four_city_content_qa_closed',
    label: '四城 Content QA CLOSED · LOCK 不变',
    pass: issues.length === 0,
    rows,
    issues,
  };
}

function validateUsCityExecutionClosures() {
  const rows = [];
  const issues = [];
  for (const cityZh of US_CITIES) {
    const p = cityExecClosurePath(cityZh);
    const doc = readJson(p);
    const pass = Boolean(doc);
    rows.push({ city_zh: cityZh, execution_closure: path.relative(ROOT, p).replace(/\\/g, '/'), pass });
    if (!pass) issues.push(`${cityZh}: Execution closure evidence missing`);
  }
  return {
    id: 'four_city_execution_closed',
    label: '四城 Execution CLOSED',
    pass: issues.length === 0,
    rows,
    issues,
  };
}

async function validateCatalogApiAllUsPois(apiBase) {
  const issues = [];
  const rows = [];
  for (const cityZh of US_CITIES) {
    const pilot = CITY_PILOTS[cityZh];
    const r = await fetchJson(
      `${apiBase}/api/v1/catalog/poi-images?country_iso=US&city=${encodeURIComponent(cityZh)}&limit=50`,
    );
    if (!r.ok) {
      issues.push(`${cityZh}: catalog API HTTP ${r.status}`);
      continue;
    }
    const items = r.json?.items || [];
    for (const matrixId of pilot.matrix_ids) {
      const heroFile = getAsset(matrixId).hero_file || pilot.hero_files[matrixId];
      const row = items.find((x) => filename(x.image_url) === heroFile);
      const fn = filename(row?.image_url);
      const ok =
        fn === heroFile && ['published', 'payload', 'catalog'].includes(String(row?.image_source || 'payload'));
      rows.push({ city_zh: cityZh, matrix_id: matrixId, expected: heroFile, catalog: fn, pass: ok });
      if (!ok) issues.push(`${cityZh} ${matrixId}: catalog=${fn || 'MISSING'}`);
    }
  }
  const total = rows.length;
  const passCount = rows.filter((r) => r.pass).length;
  return {
    id: 'catalog_api_us_poi',
    label: `Catalog API US POI ${passCount}/${total} 与 LOCK 一致`,
    pass: issues.length === 0,
    pass_count: passCount,
    required: total,
    rows,
    issues,
  };
}

function validateUsaAmbient() {
  const ambient = loadAmbientRuntimeWiringSsot();
  const us = ambient.by_iso?.US;
  const issues = [];
  if (!ambient.is_closed) issues.push('Ambient wiring SSOT not CLOSED (10/10)');
  if (!us?.runtime_reads_cms_catalog) issues.push('美国 Ambient Runtime 未读 CMS catalog');
  if (us?.still_unsplash) issues.push('美国 Ambient 仍 Unsplash');
  if (us?.still_ts_fallback) issues.push('美国 Ambient 仍 TS fallback');
  return {
    id: 'usa_ambient_runtime',
    label: '首页 Destination Ambient · 美国读 CMS · 无 Unsplash',
    pass: issues.length === 0,
    row: us || null,
    ssot: 'evidence/GO_cms_operation/CMS-AMBIENT-RUNTIME-WIRING-LATEST.json',
    issues,
  };
}

function validateUsLockRegistryUnchanged() {
  const issues = [];
  const rows = [];
  for (const cityZh of US_CITIES) {
    const pilot = CITY_PILOTS[cityZh];
    for (const matrixId of pilot.matrix_ids) {
      const a = getAsset(matrixId);
      rows.push({ matrix_id: matrixId, city_zh: cityZh, state: a.state, replace_count: a.replace_count });
      if (a.state !== 'LOCKED') issues.push(`${matrixId}: not LOCKED`);
      if (a.replace_count !== 1) issues.push(`${matrixId}: replace_count=${a.replace_count}`);
      if (a.unlock_reason) issues.push(`${matrixId}: unlock_reason set`);
    }
  }
  return {
    id: 'us_lock_registry_unchanged',
    label: '四城 US LOCK 资产 (33/33)',
    pass: issues.length === 0,
    locked_count: rows.filter((r) => r.state === 'LOCKED').length,
    total: rows.length,
    rows,
    issues,
  };
}

function validateFrLockRegistryUnchanged() {
  const issues = [];
  const rows = [];
  for (const cityZh of FR_CITIES) {
    const pilot = CITY_PILOTS[cityZh];
    for (const matrixId of pilot.matrix_ids) {
      const a = getAsset(matrixId);
      rows.push({ matrix_id: matrixId, city_zh: cityZh, state: a.state, replace_count: a.replace_count });
      if (a.state !== 'LOCKED') issues.push(`${matrixId}: FR lock changed`);
      if (a.replace_count !== 1) issues.push(`${matrixId}: FR replace_count=${a.replace_count}`);
      if (a.unlock_reason) issues.push(`${matrixId}: FR unlock_reason set`);
    }
  }
  return {
    id: 'fr_lock_registry_unchanged',
    label: '法国三城 LOCK 资产未改动 (24/24)',
    pass: issues.length === 0,
    locked_count: rows.filter((r) => r.state === 'LOCKED').length,
    total: rows.length,
    rows,
    issues,
  };
}

function validateThLockRegistryUnchanged() {
  const issues = [];
  const rows = [];
  for (const cityZh of TH_CITIES) {
    const pilot = CITY_PILOTS[cityZh];
    for (const matrixId of pilot.matrix_ids) {
      const a = getAsset(matrixId);
      rows.push({ matrix_id: matrixId, city_zh: cityZh, state: a.state, replace_count: a.replace_count });
      if (a.state !== 'LOCKED') issues.push(`${matrixId}: TH lock changed`);
      if (a.replace_count !== 1) issues.push(`${matrixId}: TH replace_count=${a.replace_count}`);
      if (a.unlock_reason) issues.push(`${matrixId}: TH unlock_reason set`);
    }
  }
  return {
    id: 'th_lock_registry_unchanged',
    label: '泰国三城 LOCK 资产未改动 (28/28)',
    pass: issues.length === 0,
    locked_count: rows.filter((r) => r.state === 'LOCKED').length,
    total: rows.length,
    rows,
    issues,
  };
}

function validateSgLockRegistryUnchanged() {
  const issues = [];
  const rows = [];
  for (const cityZh of SG_CITIES) {
    const pilot = CITY_PILOTS[cityZh];
    for (const matrixId of pilot.matrix_ids) {
      const a = getAsset(matrixId);
      rows.push({ matrix_id: matrixId, city_zh: cityZh, state: a.state, replace_count: a.replace_count });
      if (a.state !== 'LOCKED') issues.push(`${matrixId}: SG lock changed`);
      if (a.replace_count !== 1) issues.push(`${matrixId}: SG replace_count=${a.replace_count}`);
      if (a.unlock_reason) issues.push(`${matrixId}: SG unlock_reason set`);
    }
  }
  return {
    id: 'sg_lock_registry_unchanged',
    label: '新加坡 SG LOCK 资产未改动 (10/10)',
    pass: issues.length === 0,
    locked_count: rows.filter((r) => r.state === 'LOCKED').length,
    total: rows.length,
    rows,
    issues,
  };
}

function validateKrLockRegistryUnchanged() {
  const issues = [];
  const rows = [];
  for (const cityZh of KR_CITIES) {
    const pilot = CITY_PILOTS[cityZh];
    for (const matrixId of pilot.matrix_ids) {
      const a = getAsset(matrixId);
      rows.push({ matrix_id: matrixId, city_zh: cityZh, state: a.state, replace_count: a.replace_count });
      if (a.state !== 'LOCKED') issues.push(`${matrixId}: KR lock changed`);
      if (a.replace_count !== 1) issues.push(`${matrixId}: KR replace_count=${a.replace_count}`);
      if (a.unlock_reason) issues.push(`${matrixId}: KR unlock_reason set`);
    }
  }
  return {
    id: 'kr_lock_registry_unchanged',
    label: '韩国四城 LOCK 资产未改动 (31/31)',
    pass: issues.length === 0,
    locked_count: rows.filter((r) => r.state === 'LOCKED').length,
    total: rows.length,
    rows,
    issues,
  };
}

function validateJpLockRegistryUnchanged() {
  const issues = [];
  const rows = [];
  for (const cityZh of JP_CITIES) {
    const pilot = CITY_PILOTS[cityZh];
    for (const matrixId of pilot.matrix_ids) {
      const a = getAsset(matrixId);
      rows.push({ matrix_id: matrixId, city_zh: cityZh, state: a.state, replace_count: a.replace_count });
      if (a.state !== 'LOCKED') issues.push(`${matrixId}: not LOCKED`);
      if (a.replace_count !== 1) issues.push(`${matrixId}: replace_count=${a.replace_count}`);
      if (a.unlock_reason) issues.push(`${matrixId}: unlock_reason set`);
    }
  }
  return {
    id: 'jp_lock_registry_unchanged',
    label: '日本五城 LOCK 资产未改动 (41/41)',
    pass: issues.length === 0,
    locked_count: rows.filter((r) => r.state === 'LOCKED').length,
    total: rows.length,
    rows,
    issues,
  };
}

function validateUsScopeLock() {
  const doc = readJson(EVIDENCE.us_scope_lock);
  const issues = [];
  const poiTotal = doc?.us_denominator?.poi_total;
  const cityCount = doc?.us_denominator?.cities?.length;
  if (!doc) issues.push('CMS-US-POI-CATALOG-SCOPE-LOCK-LATEST.json missing');
  if (poiTotal !== 33) issues.push(`US scope poi_total=${poiTotal || 'MISSING'} (expected 33)`);
  if (cityCount !== 4) issues.push(`US scope city_count=${cityCount || 'MISSING'} (expected 4)`);
  if (doc?.TT_CMS_US_POI_CATALOG_SCOPE_LOCK !== 'FROZEN') {
    issues.push(`TT_CMS_US_POI_CATALOG_SCOPE_LOCK=${doc?.TT_CMS_US_POI_CATALOG_SCOPE_LOCK || 'MISSING'}`);
  }
  return {
    id: 'us_scope_lock',
    label: 'US POI Catalog Scope Lock · 33 POI / 4 cities 不变',
    pass: issues.length === 0,
    doc: doc
      ? { poi_total: poiTotal, city_count: cityCount, TT: doc.TT_CMS_US_POI_CATALOG_SCOPE_LOCK }
      : null,
    issues,
  };
}

function summarizeCityRuntimeRows(cityRows) {
  const pass = cityRows.filter((r) => r.cms_runtime_ok).length;
  return { pass, total: cityRows.length };
}

module.exports = {
  ROOT,
  US_CITIES,
  FR_CITIES,
  TH_CITIES,
  SG_CITIES,
  KR_CITIES,
  JP_CITIES,
  EVIDENCE,
  readJson,
  cityExitPath,
  cityContentQaClosurePath,
  cityExecClosurePath,
  filename,
  fetchJson,
  cmsPoiRuntimeOk,
  isForbiddenFallback,
  validateUsCityExitChecks,
  validateUsCityContentQaClosures,
  validateUsCityExecutionClosures,
  validateCatalogApiAllUsPois,
  validateUsaAmbient,
  validateUsLockRegistryUnchanged,
  validateFrLockRegistryUnchanged,
  validateSgLockRegistryUnchanged,
  validateThLockRegistryUnchanged,
  validateKrLockRegistryUnchanged,
  validateJpLockRegistryUnchanged,
  validateUsScopeLock,
  summarizeCityRuntimeRows,
};
