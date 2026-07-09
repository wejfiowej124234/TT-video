#!/usr/bin/env node
/**
 * TH POI Catalog Scope Lock · Country → City → POI 分母 · ② staging
 *
 * 前置: TT_CMS_JP_COUNTRY + TT_CMS_KR_COUNTRY: CLOSED
 * 不得修改日本 41 LOCK · 韩国 31 LOCK · Content QA 标准
 *
 *   node scripts/dev/run-cms-th-poi-catalog-scope-lock.cjs
 *   API=https://tt-api-staging.fly.dev node scripts/dev/run-cms-th-poi-catalog-scope-lock.cjs
 */
const fs = require('fs');
const path = require('path');
const { buildPoiCatalogScope } = require('./lib/cms-poi-catalog-scope.cjs');
const { buildThPilotWaves } = require('./lib/cms-th-poi-pilot-waves.cjs');
const { getCityPilot } = require('./lib/cms-poi-city-pilot.cjs');
const { buildCmsOpsHierarchy, writeHierarchyLatest, formatTodaysTasksConsole, formatFamilyTreeConsole } = require('./lib/cms-ops-hierarchy.cjs');
const { request } = require('./lib/cms-image-inventory.cjs');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const JP_COUNTRY_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-JP-COUNTRY-CLOSURE-LATEST.json');
const KR_COUNTRY_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-KR-COUNTRY-CLOSURE-LATEST.json');
const OUT_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-TH-POI-CATALOG-SCOPE-LOCK-LATEST.json');
const PILOT_WAVE_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-TH-POI-PILOT-WAVE-LATEST.json');
const REGISTRY_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-CLOSURE-REGISTRY-LATEST.json');
const POI_KICKOFF = path.join(ROOT, 'evidence/GO_cms_operation/CMS-TH-POI-WAVE-KICKOFF-LATEST.json');
const LOCK_REG = path.join(ROOT, 'evidence/GO_cms_operation/CMS-CONTENT-QA-ASSET-LOCK-REGISTRY-LATEST.json');

async function probeThCatalog(api) {
  const r = await request(`${api}/api/v1/catalog/poi-images?country_iso=TH&city=${encodeURIComponent('曼谷')}&limit=50`);
  const items = r.json?.items || [];
  return { http: r.status, count: items.length, catalog_empty: items.length === 0 };
}

function assertCountryClosed(p, key) {
  if (!fs.existsSync(p)) throw new Error(`${key} closure missing — abort TH kickoff`);
  const doc = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (doc[key] !== 'CLOSED') throw new Error(`${key}=${doc[key] || 'MISSING'} — abort TH kickoff`);
}

function assertPriorLocksUntouched() {
  const reg = JSON.parse(fs.readFileSync(LOCK_REG, 'utf8'));
  const assets = Object.values(reg.assets || {});
  const jpLocked = assets.filter((a) => String(a.matrix_id || '').startsWith('PH-JP-') && a.state === 'LOCKED');
  const krLocked = assets.filter((a) => String(a.matrix_id || '').startsWith('PH-KR-') && a.state === 'LOCKED');
  if (jpLocked.length !== 41) throw new Error(`JP LOCK drift: ${jpLocked.length}/41 — abort`);
  if (krLocked.length !== 31) throw new Error(`KR LOCK drift: ${krLocked.length}/31 — abort`);
}

function writeRegistry(stamp, pilot) {
  const prev = fs.existsSync(REGISTRY_LATEST) ? JSON.parse(fs.readFileSync(REGISTRY_LATEST, 'utf8')) : {};
  const out = {
    ...prev,
    schema: 'traveltrust.cms_poi_city_closure_registry.v1',
    updated_at_utc: stamp,
    active_country: { country_iso: 'TH', country_zh: '泰国', status: 'ACTIVE' },
    active_city: { country_iso: 'TH', city_zh: '曼谷', city_en: 'Bangkok', status: 'ACTIVE' },
    active_wave: pilot.active_wave,
    jp_country_closed_ssot: 'evidence/GO_cms_operation/CMS-JP-COUNTRY-CLOSURE-LATEST.json',
    kr_country_closed_ssot: 'evidence/GO_cms_operation/CMS-KR-COUNTRY-CLOSURE-LATEST.json',
    th_scope_lock: 'evidence/GO_cms_operation/CMS-TH-POI-CATALOG-SCOPE-LOCK-LATEST.json',
    template_countries: ['JP', 'KR'],
    closed_cities: prev.closed_cities || [],
  };
  fs.writeFileSync(REGISTRY_LATEST, JSON.stringify(out, null, 2) + '\n');
}

async function main() {
  assertCountryClosed(JP_COUNTRY_CLOSURE, 'TT_CMS_JP_COUNTRY');
  assertCountryClosed(KR_COUNTRY_CLOSURE, 'TT_CMS_KR_COUNTRY');
  assertPriorLocksUntouched();

  const stamp = new Date().toISOString();
  const scope = buildPoiCatalogScope();
  const thRows = scope.rows.filter((r) => r.country_iso === 'TH');
  const thByCity = {};
  for (const row of thRows) {
    thByCity[row.city_zh] = thByCity[row.city_zh] || { attraction: 0, food: 0, total: 0, matrix_ids: [] };
    thByCity[row.city_zh][row.poi_type === 'food' ? 'food' : 'attraction'] += 1;
    thByCity[row.city_zh].total += 1;
    thByCity[row.city_zh].matrix_ids.push(row.matrix_id);
  }

  const pilot = buildThPilotWaves(scope);
  const active = pilot.active_catalog_build;
  const bangkok = getCityPilot('曼谷');
  const catalog = await probeThCatalog(API);

  const report = {
    schema: 'traveltrust.cms_th_poi_catalog_scope_lock.v1',
    recorded_at_utc: stamp,
    phase: '② staging',
    layer: 'CMS_OPERATION',
    template_countries: [
      { country_iso: 'JP', TT_CMS_JP_COUNTRY: 'CLOSED', closure_ssot: 'evidence/GO_cms_operation/CMS-JP-COUNTRY-CLOSURE-LATEST.json' },
      { country_iso: 'KR', TT_CMS_KR_COUNTRY: 'CLOSED', closure_ssot: 'evidence/GO_cms_operation/CMS-KR-COUNTRY-CLOSURE-LATEST.json' },
    ],
    lock_guard: {
      jp_locked_required: 41,
      kr_locked_required: 31,
      verified: true,
      registry: 'CMS-CONTENT-QA-ASSET-LOCK-REGISTRY-LATEST.json',
    },
    country: { country_iso: 'TH', country_zh: '泰国' },
    th_denominator: {
      cities: Object.keys(thByCity).sort(),
      city_breakdown: thByCity,
      poi_total: thRows.length,
      attraction: thRows.filter((r) => r.poi_type === 'attraction').length,
      food: thRows.filter((r) => r.poi_type === 'food').length,
    },
    pilot_wave: pilot,
    active_catalog_build: active,
    bangkok_pilot: {
      city_zh: '曼谷',
      poi_count: bangkok.matrix_ids.length,
      matrix_ids: bangkok.matrix_ids,
      acceptance: '曼谷 CLOSED',
    },
    catalog_probe: catalog,
    workflow: [
      'TH Scope Lock',
      'Bangkok Catalog Build',
      'Execution per POI',
      'Content QA per POI',
      'City Runtime Exit Check',
      'TT_CMS_POI_CITY_BANGKOK_CONTENT_QA: CLOSED',
      '… 普吉 → 清迈',
      'TH Country Runtime',
      'TT_CMS_TH_COUNTRY: CLOSED',
    ],
    forbidden: ['modify_jp_41_lock', 'modify_kr_31_lock', 'adjust_content_qa_standard', 'production_go'],
    production_go: 'BLOCKED',
    TT_CMS_TH_POI_CATALOG_SCOPE_LOCK: 'FROZEN',
    TT_CMS_TH_POI_DENOMINATOR_TOTAL: thRows.length,
    TT_CMS_TH_POI_PILOT_CATALOG_BUILD: active.label,
    TT_CMS_TH_POI_PILOT_ACCEPTANCE: '曼谷 CLOSED',
    TT_CMS_TH_POI_PILOT_POI_COUNT: active.poi_count,
    TT_CMS_TH_POI_NEXT_STAGE: 'CATALOG_BUILD',
    thailand_status: 'ACTIVE',
    korea_status: 'CLOSED',
    japan_status: 'CLOSED',
  };

  fs.mkdirSync(path.dirname(OUT_LATEST), { recursive: true });
  fs.writeFileSync(OUT_LATEST, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(
    PILOT_WAVE_LATEST,
    JSON.stringify(
      {
        schema: 'traveltrust.cms_th_poi_pilot_wave.v1',
        stamp_utc: stamp,
        ...pilot,
        TT_CMS_TH_POI_PILOT_WAVE: pilot.active_wave,
      },
      null,
      2,
    ) + '\n',
  );

  writeRegistry(stamp, pilot);

  fs.writeFileSync(
    POI_KICKOFF,
    JSON.stringify(
      {
        schema: 'traveltrust.cms_th_poi_wave_kickoff.v1',
        stamp_utc: stamp,
        asset_family: 'poi',
        country_iso: 'TH',
        status: 'SCOPE_LOCKED',
        next_stage: 'CATALOG_BUILD',
        active_city: '曼谷',
        template: 'JP + KR Golden Template',
        when_pilot_complete: ['曼谷 CLOSED', 'advance to 普吉'],
        TT_CMS_TH_POI_WAVE: 'SCOPE_LOCKED_CATALOG_BUILD_NEXT',
      },
      null,
      2,
    ) + '\n',
  );

  const scopeWithThPilot = { ...scope, pilot_waves: pilot, th_active: true };
  const hierarchy = buildCmsOpsHierarchy({ scope: scopeWithThPilot });
  writeHierarchyLatest(hierarchy, stamp.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'));

  // Refresh Thailand Content QA board
  const { buildThailandContentQa } = require('./lib/cms-thailand-content-qa.cjs');
  const thBoard = buildThailandContentQa({ stamp_utc: stamp, skip_template_guard: true });
  fs.writeFileSync(
    path.join(ROOT, 'evidence/GO_cms_operation/CMS-THAILAND-CONTENT-QA-LATEST.json'),
    JSON.stringify(thBoard, null, 2) + '\n',
  );

  console.log(`TT_CMS_TH_POI_CATALOG_SCOPE_LOCK: ${report.TT_CMS_TH_POI_CATALOG_SCOPE_LOCK}`);
  console.log(`TT_CMS_TH_POI_DENOMINATOR_TOTAL: ${report.TT_CMS_TH_POI_DENOMINATOR_TOTAL} (3 cities · pilot 曼谷 ${active.poi_count})`);
  console.log(`TT_CMS_TH_POI_PILOT: ${active.label} · acceptance = 曼谷 CLOSED`);
  console.log(`JP LOCK guard: 41/41 · KR LOCK guard: 31/31 unchanged`);
  console.log(`Thailand: ACTIVE · Korea/Japan: CLOSED (templates)`);
  console.log(`Evidence: ${OUT_LATEST}`);
  console.log('');
  console.log(formatTodaysTasksConsole(hierarchy));
  const poiFamily = hierarchy.families.find((f) => f.id === 'poi');
  if (poiFamily) console.log('\n' + formatFamilyTreeConsole(poiFamily));
  console.log('\nNext: TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE=1 API=https://tt-api-staging.fly.dev node scripts/dev/run-cms-bangkok-content-qa-wave.cjs');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
