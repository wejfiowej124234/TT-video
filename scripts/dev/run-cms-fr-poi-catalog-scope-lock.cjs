#!/usr/bin/env node
/**
 * FR POI Catalog Scope Lock · Country → City → POI 分母 · ② staging
 *
 * 前置: TT_CMS_JP/KR/TH/SG_COUNTRY: CLOSED
 * 不得修改 JP 41 · KR 31 · TH 28 · SG 10 LOCK · Content QA 标准
 */
const fs = require('fs');
const path = require('path');
const { buildPoiCatalogScope } = require('./lib/cms-poi-catalog-scope.cjs');
const { buildFrPilotWaves } = require('./lib/cms-fr-poi-pilot-waves.cjs');
const { getCityPilot } = require('./lib/cms-poi-city-pilot.cjs');
const { buildCmsOpsHierarchy, writeHierarchyLatest, formatTodaysTasksConsole, formatFamilyTreeConsole } = require('./lib/cms-ops-hierarchy.cjs');
const { request } = require('./lib/cms-image-inventory.cjs');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const CLOSURES = {
  JP: path.join(ROOT, 'evidence/GO_cms_operation/CMS-JP-COUNTRY-CLOSURE-LATEST.json'),
  KR: path.join(ROOT, 'evidence/GO_cms_operation/CMS-KR-COUNTRY-CLOSURE-LATEST.json'),
  TH: path.join(ROOT, 'evidence/GO_cms_operation/CMS-TH-COUNTRY-CLOSURE-LATEST.json'),
  SG: path.join(ROOT, 'evidence/GO_cms_operation/CMS-SG-COUNTRY-CLOSURE-LATEST.json'),
};
const OUT_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-FR-POI-CATALOG-SCOPE-LOCK-LATEST.json');
const PILOT_WAVE_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-FR-POI-PILOT-WAVE-LATEST.json');
const REGISTRY_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-CLOSURE-REGISTRY-LATEST.json');
const POI_KICKOFF = path.join(ROOT, 'evidence/GO_cms_operation/CMS-FR-POI-WAVE-KICKOFF-LATEST.json');
const LOCK_REG = path.join(ROOT, 'evidence/GO_cms_operation/CMS-CONTENT-QA-ASSET-LOCK-REGISTRY-LATEST.json');

async function probeParisCatalog(api) {
  const r = await request(`${api}/api/v1/catalog/poi-images?country_iso=FR&city=${encodeURIComponent('巴黎')}&limit=50`);
  const items = r.json?.items || [];
  return { http: r.status, count: items.length, catalog_empty: items.length === 0 };
}

function assertCountryClosed(p, key) {
  if (!fs.existsSync(p)) throw new Error(`${key} closure missing — abort FR kickoff`);
  const doc = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (doc[key] !== 'CLOSED') throw new Error(`${key}=${doc[key] || 'MISSING'} — abort FR kickoff`);
}

function assertPriorLocksUntouched() {
  const reg = JSON.parse(fs.readFileSync(LOCK_REG, 'utf8'));
  const assets = Object.values(reg.assets || {});
  const counts = {
    JP: assets.filter((a) => String(a.matrix_id || '').startsWith('PH-JP-') && a.state === 'LOCKED').length,
    KR: assets.filter((a) => String(a.matrix_id || '').startsWith('PH-KR-') && a.state === 'LOCKED').length,
    TH: assets.filter((a) => String(a.matrix_id || '').startsWith('PH-TH-') && a.state === 'LOCKED').length,
    SG: assets.filter((a) => String(a.matrix_id || '').startsWith('PH-SG-') && a.state === 'LOCKED').length,
  };
  if (counts.JP !== 41) throw new Error(`JP LOCK drift: ${counts.JP}/41 — abort`);
  if (counts.KR !== 31) throw new Error(`KR LOCK drift: ${counts.KR}/31 — abort`);
  if (counts.TH !== 28) throw new Error(`TH LOCK drift: ${counts.TH}/28 — abort`);
  if (counts.SG !== 10) throw new Error(`SG LOCK drift: ${counts.SG}/10 — abort`);
}

function writeRegistry(stamp, pilot) {
  const prev = fs.existsSync(REGISTRY_LATEST) ? JSON.parse(fs.readFileSync(REGISTRY_LATEST, 'utf8')) : {};
  fs.writeFileSync(
    REGISTRY_LATEST,
    JSON.stringify(
      {
        ...prev,
        schema: 'traveltrust.cms_poi_city_closure_registry.v1',
        updated_at_utc: stamp,
        active_country: { country_iso: 'FR', country_zh: '法国', status: 'ACTIVE' },
        active_city: { country_iso: 'FR', city_zh: '巴黎', city_en: 'Paris', status: 'ACTIVE' },
        active_wave: pilot.active_wave,
        template_countries: ['JP', 'KR', 'TH', 'SG'],
        fr_scope_lock: 'evidence/GO_cms_operation/CMS-FR-POI-CATALOG-SCOPE-LOCK-LATEST.json',
        closed_cities: prev.closed_cities || [],
      },
      null,
      2,
    ) + '\n',
  );
}

async function main() {
  assertCountryClosed(CLOSURES.JP, 'TT_CMS_JP_COUNTRY');
  assertCountryClosed(CLOSURES.KR, 'TT_CMS_KR_COUNTRY');
  assertCountryClosed(CLOSURES.TH, 'TT_CMS_TH_COUNTRY');
  assertCountryClosed(CLOSURES.SG, 'TT_CMS_SG_COUNTRY');
  assertPriorLocksUntouched();

  const stamp = new Date().toISOString();
  const scope = buildPoiCatalogScope();
  const frRows = scope.rows.filter((r) => r.country_iso === 'FR');
  const frByCity = {};
  for (const row of frRows) {
    frByCity[row.city_zh] = frByCity[row.city_zh] || { attraction: 0, food: 0, total: 0, matrix_ids: [] };
    frByCity[row.city_zh][row.poi_type === 'food' ? 'food' : 'attraction'] += 1;
    frByCity[row.city_zh].total += 1;
    frByCity[row.city_zh].matrix_ids.push(row.matrix_id);
  }

  const pilot = buildFrPilotWaves(scope);
  const active = pilot.active_catalog_build;
  const paris = getCityPilot('巴黎');
  const catalog = await probeParisCatalog(API);

  const report = {
    schema: 'traveltrust.cms_fr_poi_catalog_scope_lock.v1',
    recorded_at_utc: stamp,
    phase: '② staging',
    layer: 'CMS_OPERATION',
    template_countries: [
      { country_iso: 'JP', TT_CMS_JP_COUNTRY: 'CLOSED' },
      { country_iso: 'KR', TT_CMS_KR_COUNTRY: 'CLOSED' },
      { country_iso: 'TH', TT_CMS_TH_COUNTRY: 'CLOSED' },
      { country_iso: 'SG', TT_CMS_SG_COUNTRY: 'CLOSED' },
    ],
    lock_guard: {
      jp_locked_required: 41,
      kr_locked_required: 31,
      th_locked_required: 28,
      sg_locked_required: 10,
      verified: true,
    },
    country: { country_iso: 'FR', country_zh: '法国' },
    fr_denominator: {
      cities: Object.keys(frByCity).sort(),
      city_breakdown: frByCity,
      poi_total: frRows.length,
      attraction: frRows.filter((r) => r.poi_type === 'attraction').length,
      food: frRows.filter((r) => r.poi_type === 'food').length,
    },
    pilot_wave: pilot,
    active_catalog_build: active,
    paris_pilot: {
      city_zh: '巴黎',
      poi_count: paris.matrix_ids.length,
      matrix_ids: paris.matrix_ids,
      acceptance: '巴黎 CLOSED',
    },
    catalog_probe: catalog,
    workflow: ['FR Scope Lock', '巴黎 → 里昂 → 尼斯', 'FR Country Runtime', 'TT_CMS_FR_COUNTRY: CLOSED'],
    forbidden: ['modify_jp_kr_th_sg_lock', 'adjust_content_qa_standard', 'production_go', 'next_country'],
    production_go: 'BLOCKED',
    next_country: 'BLOCKED',
    TT_CMS_FR_POI_CATALOG_SCOPE_LOCK: 'FROZEN',
    TT_CMS_FR_POI_DENOMINATOR_TOTAL: frRows.length,
    TT_CMS_FR_POI_PILOT_ACCEPTANCE: '巴黎 CLOSED',
    TT_CMS_FR_POI_NEXT_STAGE: 'CATALOG_BUILD',
    france_status: 'ACTIVE',
  };

  fs.mkdirSync(path.dirname(OUT_LATEST), { recursive: true });
  fs.writeFileSync(OUT_LATEST, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(PILOT_WAVE_LATEST, JSON.stringify({ schema: 'traveltrust.cms_fr_poi_pilot_wave.v1', stamp_utc: stamp, ...pilot }, null, 2) + '\n');
  writeRegistry(stamp, pilot);
  fs.writeFileSync(
    POI_KICKOFF,
    JSON.stringify(
      {
        schema: 'traveltrust.cms_fr_poi_wave_kickoff.v1',
        stamp_utc: stamp,
        country_iso: 'FR',
        status: 'SCOPE_LOCKED',
        active_city: '巴黎',
        template: 'JP + KR + TH + SG Golden Template',
        TT_CMS_FR_POI_WAVE: 'SCOPE_LOCKED_CATALOG_BUILD_NEXT',
      },
      null,
      2,
    ) + '\n',
  );

  const hierarchy = buildCmsOpsHierarchy({ scope: { ...scope, pilot_waves: pilot, fr_active: true } });
  writeHierarchyLatest(hierarchy, stamp.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'));

  const { buildFranceContentQa } = require('./lib/cms-france-content-qa.cjs');
  fs.writeFileSync(
    path.join(ROOT, 'evidence/GO_cms_operation/CMS-FRANCE-CONTENT-QA-LATEST.json'),
    JSON.stringify(buildFranceContentQa({ stamp_utc: stamp, skip_template_guard: true }), null, 2) + '\n',
  );

  console.log(`TT_CMS_FR_POI_CATALOG_SCOPE_LOCK: ${report.TT_CMS_FR_POI_CATALOG_SCOPE_LOCK}`);
  console.log(`TT_CMS_FR_POI_DENOMINATOR_TOTAL: ${report.TT_CMS_FR_POI_DENOMINATOR_TOTAL} (3 cities · pilot 巴黎 ${active.poi_count})`);
  console.log(`JP 41 · KR 31 · TH 28 · SG 10 LOCK unchanged`);
  console.log(`Evidence: ${OUT_LATEST}`);
  console.log('\nNext: node scripts/dev/run-cms-paris-content-qa-wave.cjs');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
