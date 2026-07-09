#!/usr/bin/env node
/**
 * KR POI Catalog Scope Lock · Country → City → POI 分母 · ② staging
 *
 * 前置: TT_CMS_JP_COUNTRY: CLOSED · 不得修改日本 41 LOCK
 *
 *   node scripts/dev/run-cms-kr-poi-catalog-scope-lock.cjs
 *   API=https://tt-api-staging.fly.dev node scripts/dev/run-cms-kr-poi-catalog-scope-lock.cjs
 */
const fs = require('fs');
const path = require('path');
const { buildPoiCatalogScope } = require('./lib/cms-poi-catalog-scope.cjs');
const { buildKrPilotWaves } = require('./lib/cms-kr-poi-pilot-waves.cjs');
const { getCityPilot } = require('./lib/cms-poi-city-pilot.cjs');
const { buildCmsOpsHierarchy, writeHierarchyLatest, formatTodaysTasksConsole, formatFamilyTreeConsole } = require('./lib/cms-ops-hierarchy.cjs');
const { writeCityOpsLatest } = require('./lib/cms-poi-city-ops.cjs');
const { request } = require('./lib/cms-image-inventory.cjs');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const JP_COUNTRY_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-JP-COUNTRY-CLOSURE-LATEST.json');
const OUT_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-KR-POI-CATALOG-SCOPE-LOCK-LATEST.json');
const PILOT_WAVE_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-KR-POI-PILOT-WAVE-LATEST.json');
const REGISTRY_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-CLOSURE-REGISTRY-LATEST.json');
const POI_KICKOFF = path.join(ROOT, 'evidence/GO_cms_operation/CMS-KR-POI-WAVE-KICKOFF-LATEST.json');
const JP_LOCK_REG = path.join(ROOT, 'evidence/GO_cms_operation/CMS-CONTENT-QA-ASSET-LOCK-REGISTRY-LATEST.json');

async function probeKrCatalog(api) {
  const r = await request(`${api}/api/v1/catalog/poi-images?country_iso=KR&city=${encodeURIComponent('首尔')}&limit=50`);
  const items = r.json?.items || [];
  return { http: r.status, count: items.length, catalog_empty: items.length === 0 };
}

function assertJpCountryClosed() {
  if (!fs.existsSync(JP_COUNTRY_CLOSURE)) {
    throw new Error('TT_CMS_JP_COUNTRY not CLOSED — abort KR kickoff');
  }
  const doc = JSON.parse(fs.readFileSync(JP_COUNTRY_CLOSURE, 'utf8'));
  if (doc.TT_CMS_JP_COUNTRY !== 'CLOSED') {
    throw new Error(`TT_CMS_JP_COUNTRY=${doc.TT_CMS_JP_COUNTRY} — abort KR kickoff`);
  }
}

function assertJpLocksUntouched() {
  const reg = JSON.parse(fs.readFileSync(JP_LOCK_REG, 'utf8'));
  const jpLocked = Object.values(reg.assets || {}).filter(
    (a) => String(a.matrix_id || '').startsWith('PH-JP-') && a.state === 'LOCKED',
  );
  if (jpLocked.length !== 41) {
    throw new Error(`JP LOCK count drift: ${jpLocked.length}/41 — abort`);
  }
}

function writeRegistry(stamp, pilot) {
  const prev = fs.existsSync(REGISTRY_LATEST) ? JSON.parse(fs.readFileSync(REGISTRY_LATEST, 'utf8')) : {};
  const active = pilot.active_catalog_build;
  const out = {
    ...prev,
    schema: 'traveltrust.cms_poi_city_closure_registry.v1',
    updated_at_utc: stamp,
    active_country: { country_iso: 'KR', country_zh: '韩国', status: 'ACTIVE' },
    active_city: { country_iso: 'KR', city_zh: '首尔', city_en: 'Seoul', status: 'ACTIVE' },
    active_wave: pilot.active_wave,
    jp_country_closed_ssot: 'evidence/GO_cms_operation/CMS-JP-COUNTRY-CLOSURE-LATEST.json',
    kr_scope_lock: 'evidence/GO_cms_operation/CMS-KR-POI-CATALOG-SCOPE-LOCK-LATEST.json',
    template_country: 'JP',
    closed_cities: prev.closed_cities || [],
  };
  fs.writeFileSync(REGISTRY_LATEST, JSON.stringify(out, null, 2) + '\n');
}

async function main() {
  assertJpCountryClosed();
  assertJpLocksUntouched();

  const stamp = new Date().toISOString();
  const scope = buildPoiCatalogScope();
  const krRows = scope.rows.filter((r) => r.country_iso === 'KR');
  const krByCity = {};
  for (const row of krRows) {
    krByCity[row.city_zh] = krByCity[row.city_zh] || { attraction: 0, food: 0, total: 0, matrix_ids: [] };
    krByCity[row.city_zh][row.poi_type === 'food' ? 'food' : 'attraction'] += 1;
    krByCity[row.city_zh].total += 1;
    krByCity[row.city_zh].matrix_ids.push(row.matrix_id);
  }

  const pilot = buildKrPilotWaves(scope);
  const active = pilot.active_catalog_build;
  const seoul = getCityPilot('首尔');
  const catalog = await probeKrCatalog(API);

  const report = {
    schema: 'traveltrust.cms_kr_poi_catalog_scope_lock.v1',
    recorded_at_utc: stamp,
    phase: '② staging',
    layer: 'CMS_OPERATION',
    template_country: {
      country_iso: 'JP',
      TT_CMS_JP_COUNTRY: 'CLOSED',
      closure_ssot: 'evidence/GO_cms_operation/CMS-JP-COUNTRY-CLOSURE-LATEST.json',
    },
    jp_lock_guard: { required_locked: 41, verified: true, registry: 'CMS-CONTENT-QA-ASSET-LOCK-REGISTRY-LATEST.json' },
    country: { country_iso: 'KR', country_zh: '韩国' },
    kr_denominator: {
      cities: Object.keys(krByCity).sort(),
      city_breakdown: krByCity,
      poi_total: krRows.length,
      attraction: krRows.filter((r) => r.poi_type === 'attraction').length,
      food: krRows.filter((r) => r.poi_type === 'food').length,
    },
    pilot_wave: pilot,
    active_catalog_build: active,
    seoul_pilot: {
      city_zh: '首尔',
      poi_count: seoul.matrix_ids.length,
      matrix_ids: seoul.matrix_ids,
      acceptance: '首尔 CLOSED',
    },
    catalog_probe: catalog,
    workflow: [
      'KR Scope Lock',
      'Seoul Catalog Build',
      'Execution per POI',
      'Content QA per POI',
      'City Runtime Exit Check',
      'TT_CMS_POI_CITY_SEOUL_CONTENT_QA: CLOSED',
    ],
    forbidden: ['modify_jp_41_lock', 'adjust_content_qa_standard', 'production_go'],
    TT_CMS_KR_POI_CATALOG_SCOPE_LOCK: 'FROZEN',
    TT_CMS_KR_POI_DENOMINATOR_TOTAL: krRows.length,
    TT_CMS_KR_POI_PILOT_CATALOG_BUILD: active.label,
    TT_CMS_KR_POI_PILOT_ACCEPTANCE: '首尔 CLOSED',
    TT_CMS_KR_POI_PILOT_POI_COUNT: active.poi_count,
    TT_CMS_KR_POI_NEXT_STAGE: 'CATALOG_BUILD',
    korea_status: 'ACTIVE',
  };

  fs.mkdirSync(path.dirname(OUT_LATEST), { recursive: true });
  fs.writeFileSync(OUT_LATEST, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(
    PILOT_WAVE_LATEST,
    JSON.stringify(
      {
        schema: 'traveltrust.cms_kr_poi_pilot_wave.v1',
        stamp_utc: stamp,
        ...pilot,
        TT_CMS_KR_POI_PILOT_WAVE: pilot.active_wave,
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
        schema: 'traveltrust.cms_kr_poi_wave_kickoff.v1',
        stamp_utc: stamp,
        asset_family: 'poi',
        country_iso: 'KR',
        status: 'SCOPE_LOCKED',
        next_stage: 'CATALOG_BUILD',
        active_city: '首尔',
        template: 'JP Golden Template',
        jp_country_closed: JP_COUNTRY_CLOSURE.replace(/\\/g, '/').replace(`${ROOT}/`.replace(/\\/g, '/'), ''),
        when_pilot_complete: ['首尔 CLOSED', 'advance to 釜山'],
        TT_CMS_KR_POI_WAVE: 'SCOPE_LOCKED_CATALOG_BUILD_NEXT',
      },
      null,
      2,
    ) + '\n',
  );

  const scopeWithKrPilot = { ...scope, pilot_waves: pilot, kr_active: true };
  const hierarchy = buildCmsOpsHierarchy({ scope: scopeWithKrPilot });
  writeHierarchyLatest(hierarchy, stamp.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'));

  console.log(`TT_CMS_KR_POI_CATALOG_SCOPE_LOCK: ${report.TT_CMS_KR_POI_CATALOG_SCOPE_LOCK}`);
  console.log(`TT_CMS_KR_POI_DENOMINATOR_TOTAL: ${report.TT_CMS_KR_POI_DENOMINATOR_TOTAL} (4 cities · pilot 首尔 ${active.poi_count})`);
  console.log(`TT_CMS_KR_POI_PILOT: ${active.label} · acceptance = 首尔 CLOSED`);
  console.log(`JP LOCK guard: 41/41 unchanged`);
  console.log(`Korea: ACTIVE · Japan: CLOSED (template)`);
  console.log(`Evidence: ${OUT_LATEST}`);
  console.log('');
  console.log(formatTodaysTasksConsole(hierarchy));
  const poiFamily = hierarchy.families.find((f) => f.id === 'poi');
  if (poiFamily) console.log('\n' + formatFamilyTreeConsole(poiFamily));
  console.log('\nNext: node scripts/dev/run-cms-seoul-content-qa-wave.cjs');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
