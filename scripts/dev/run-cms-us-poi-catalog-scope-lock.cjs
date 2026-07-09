#!/usr/bin/env node
/**
 * US POI Catalog Scope Lock · Country → City → POI 分母 · ② staging
 *
 * 前置: TT_CMS_JP/KR/TH/SG/FR_COUNTRY: CLOSED
 * 不得修改 JP 41 · KR 31 · TH 28 · SG 10 · FR 24 LOCK · Content QA 标准
 */
const fs = require('fs');
const path = require('path');
const { buildPoiCatalogScope } = require('./lib/cms-poi-catalog-scope.cjs');
const { buildUsPilotWaves } = require('./lib/cms-us-poi-pilot-waves.cjs');
const { getCityPilot } = require('./lib/cms-poi-city-pilot.cjs');
const { buildCmsOpsHierarchy, writeHierarchyLatest } = require('./lib/cms-ops-hierarchy.cjs');
const { request } = require('./lib/cms-image-inventory.cjs');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const CLOSURES = {
  JP: path.join(ROOT, 'evidence/GO_cms_operation/CMS-JP-COUNTRY-CLOSURE-LATEST.json'),
  KR: path.join(ROOT, 'evidence/GO_cms_operation/CMS-KR-COUNTRY-CLOSURE-LATEST.json'),
  TH: path.join(ROOT, 'evidence/GO_cms_operation/CMS-TH-COUNTRY-CLOSURE-LATEST.json'),
  SG: path.join(ROOT, 'evidence/GO_cms_operation/CMS-SG-COUNTRY-CLOSURE-LATEST.json'),
  FR: path.join(ROOT, 'evidence/GO_cms_operation/CMS-FR-COUNTRY-CLOSURE-LATEST.json'),
};
const OUT_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-US-POI-CATALOG-SCOPE-LOCK-LATEST.json');
const PILOT_WAVE_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-US-POI-PILOT-WAVE-LATEST.json');
const REGISTRY_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-CLOSURE-REGISTRY-LATEST.json');
const POI_KICKOFF = path.join(ROOT, 'evidence/GO_cms_operation/CMS-US-POI-WAVE-KICKOFF-LATEST.json');
const LOCK_REG = path.join(ROOT, 'evidence/GO_cms_operation/CMS-CONTENT-QA-ASSET-LOCK-REGISTRY-LATEST.json');

async function probeSfCatalog(api) {
  const r = await request(`${api}/api/v1/catalog/poi-images?country_iso=US&city=${encodeURIComponent('旧金山')}&limit=50`);
  const items = r.json?.items || [];
  return { http: r.status, count: items.length, catalog_empty: items.length === 0 };
}

function assertCountryClosed(p, key) {
  if (!fs.existsSync(p)) throw new Error(`${key} closure missing — abort US kickoff`);
  const doc = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (doc[key] !== 'CLOSED') throw new Error(`${key}=${doc[key] || 'MISSING'} — abort US kickoff`);
}

function assertPriorLocksUntouched() {
  const reg = JSON.parse(fs.readFileSync(LOCK_REG, 'utf8'));
  const assets = Object.values(reg.assets || {});
  const counts = {
    JP: assets.filter((a) => String(a.matrix_id || '').startsWith('PH-JP-') && a.state === 'LOCKED').length,
    KR: assets.filter((a) => String(a.matrix_id || '').startsWith('PH-KR-') && a.state === 'LOCKED').length,
    TH: assets.filter((a) => String(a.matrix_id || '').startsWith('PH-TH-') && a.state === 'LOCKED').length,
    SG: assets.filter((a) => String(a.matrix_id || '').startsWith('PH-SG-') && a.state === 'LOCKED').length,
    FR: assets.filter((a) => String(a.matrix_id || '').startsWith('PH-FR-') && a.state === 'LOCKED').length,
  };
  if (counts.JP !== 41) throw new Error(`JP LOCK drift: ${counts.JP}/41 — abort`);
  if (counts.KR !== 31) throw new Error(`KR LOCK drift: ${counts.KR}/31 — abort`);
  if (counts.TH !== 28) throw new Error(`TH LOCK drift: ${counts.TH}/28 — abort`);
  if (counts.SG !== 10) throw new Error(`SG LOCK drift: ${counts.SG}/10 — abort`);
  if (counts.FR !== 24) throw new Error(`FR LOCK drift: ${counts.FR}/24 — abort`);
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
        active_country: { country_iso: 'US', country_zh: '美国', status: 'ACTIVE' },
        active_city: { country_iso: 'US', city_zh: '旧金山', city_en: 'San Francisco', status: 'ACTIVE' },
        active_wave: pilot.active_wave,
        template_countries: ['JP', 'KR', 'TH', 'SG', 'FR'],
        us_scope_lock: 'evidence/GO_cms_operation/CMS-US-POI-CATALOG-SCOPE-LOCK-LATEST.json',
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
  assertCountryClosed(CLOSURES.FR, 'TT_CMS_FR_COUNTRY');
  assertPriorLocksUntouched();

  const stamp = new Date().toISOString();
  const scope = buildPoiCatalogScope();
  const usRows = scope.rows.filter((r) => r.country_iso === 'US');
  const usByCity = {};
  for (const row of usRows) {
    usByCity[row.city_zh] = usByCity[row.city_zh] || { attraction: 0, food: 0, total: 0, matrix_ids: [] };
    usByCity[row.city_zh][row.poi_type === 'food' ? 'food' : 'attraction'] += 1;
    usByCity[row.city_zh].total += 1;
    usByCity[row.city_zh].matrix_ids.push(row.matrix_id);
  }

  const pilot = buildUsPilotWaves(scope);
  const active = pilot.active_catalog_build;
  const sf = getCityPilot('旧金山');
  const catalog = await probeSfCatalog(API);

  const report = {
    schema: 'traveltrust.cms_us_poi_catalog_scope_lock.v1',
    recorded_at_utc: stamp,
    phase: '② staging',
    layer: 'CMS_OPERATION',
    template_countries: [
      { country_iso: 'JP', TT_CMS_JP_COUNTRY: 'CLOSED' },
      { country_iso: 'KR', TT_CMS_KR_COUNTRY: 'CLOSED' },
      { country_iso: 'TH', TT_CMS_TH_COUNTRY: 'CLOSED' },
      { country_iso: 'SG', TT_CMS_SG_COUNTRY: 'CLOSED' },
      { country_iso: 'FR', TT_CMS_FR_COUNTRY: 'CLOSED' },
    ],
    lock_guard: {
      jp_locked_required: 41,
      kr_locked_required: 31,
      th_locked_required: 28,
      sg_locked_required: 10,
      fr_locked_required: 24,
      verified: true,
    },
    country: { country_iso: 'US', country_zh: '美国' },
    us_denominator: {
      cities: Object.keys(usByCity).sort(),
      city_breakdown: usByCity,
      poi_total: usRows.length,
      attraction: usRows.filter((r) => r.poi_type === 'attraction').length,
      food: usRows.filter((r) => r.poi_type === 'food').length,
    },
    pilot_wave: pilot,
    active_catalog_build: active,
    san_francisco_pilot: {
      city_zh: '旧金山',
      poi_count: sf.matrix_ids.length,
      matrix_ids: sf.matrix_ids,
      acceptance: '旧金山 CLOSED',
    },
    catalog_probe: catalog,
    workflow: ['US Scope Lock', '旧金山 → 拉斯维加斯 → 洛杉矶 → 纽约', 'US Country Runtime', 'TT_CMS_US_COUNTRY: CLOSED'],
    forbidden: ['modify_jp_kr_th_sg_fr_lock', 'adjust_content_qa_standard', 'production_go', 'next_country'],
    production_go: 'BLOCKED',
    next_country: 'BLOCKED',
    TT_CMS_US_POI_CATALOG_SCOPE_LOCK: 'FROZEN',
    TT_CMS_US_POI_DENOMINATOR_TOTAL: usRows.length,
    TT_CMS_US_POI_PILOT_ACCEPTANCE: '旧金山 CLOSED',
    TT_CMS_US_POI_NEXT_STAGE: 'CATALOG_BUILD',
    usa_status: 'ACTIVE',
  };

  fs.mkdirSync(path.dirname(OUT_LATEST), { recursive: true });
  fs.writeFileSync(OUT_LATEST, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(PILOT_WAVE_LATEST, JSON.stringify({ schema: 'traveltrust.cms_us_poi_pilot_wave.v1', stamp_utc: stamp, ...pilot }, null, 2) + '\n');
  writeRegistry(stamp, pilot);
  fs.writeFileSync(
    POI_KICKOFF,
    JSON.stringify(
      {
        schema: 'traveltrust.cms_us_poi_wave_kickoff.v1',
        stamp_utc: stamp,
        country_iso: 'US',
        status: 'SCOPE_LOCKED',
        active_city: '旧金山',
        template: 'JP + KR + TH + SG + FR Golden Template',
        TT_CMS_US_POI_WAVE: 'SCOPE_LOCKED_CATALOG_BUILD_NEXT',
      },
      null,
      2,
    ) + '\n',
  );

  const hierarchy = buildCmsOpsHierarchy({ scope: { ...scope, pilot_waves: pilot, us_active: true } });
  writeHierarchyLatest(hierarchy, stamp.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'));

  const { buildUsaContentQa } = require('./lib/cms-usa-content-qa.cjs');
  fs.writeFileSync(
    path.join(ROOT, 'evidence/GO_cms_operation/CMS-USA-CONTENT-QA-LATEST.json'),
    JSON.stringify(buildUsaContentQa({ stamp_utc: stamp, skip_template_guard: true }), null, 2) + '\n',
  );

  console.log(`TT_CMS_US_POI_CATALOG_SCOPE_LOCK: ${report.TT_CMS_US_POI_CATALOG_SCOPE_LOCK}`);
  console.log(`TT_CMS_US_POI_DENOMINATOR_TOTAL: ${report.TT_CMS_US_POI_DENOMINATOR_TOTAL} (4 cities · pilot 旧金山 ${active.poi_count})`);
  console.log(`JP 41 · KR 31 · TH 28 · SG 10 · FR 24 LOCK unchanged`);
  console.log(`Evidence: ${OUT_LATEST}`);
  console.log('\nNext: node scripts/dev/run-cms-san-francisco-content-qa-wave.cjs');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
