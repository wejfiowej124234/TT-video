#!/usr/bin/env node
/**
 * POI Catalog Scope Lock · Step 0 before any POI Upload (② staging CMS ops)
 *
 *   node scripts/dev/run-cms-poi-catalog-scope-lock.cjs
 *   API=https://tt-api-staging.fly.dev node scripts/dev/run-cms-poi-catalog-scope-lock.cjs
 *
 * Enumerates POI denominator from frontend TS SSOT · writes matrix + evidence.
 * Forbidden: POI Upload while staging catalog POI count = 0 and scope not locked.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const { request } = require('./lib/cms-image-inventory.cjs');
const { buildPoiCatalogScope, attachPilotWaves, buildPoiHeroMatrixYaml } = require('./lib/cms-poi-catalog-scope.cjs');
const {
  buildCmsOpsHierarchy,
  formatTodaysTasksConsole,
  formatFamilyTreeConsole,
  writeHierarchyLatest,
  buildPoiCityOpsFromHierarchy,
} = require('./lib/cms-ops-hierarchy.cjs');
const { writeCityOpsLatest } = require('./lib/cms-poi-city-ops.cjs');

const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const MATRIX_OUT = path.join(ROOT, 'data/catalog/poi-hero-matrix.v1.yaml');
const OUT_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CATALOG-SCOPE-LOCK-LATEST.json');
const PILOT_WAVE_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-PILOT-WAVE-LATEST.json');
const FAMILY_STATUS = path.join(ROOT, 'evidence/GO_cms_operation/CMS-ASSET-FAMILY-STATUS-LATEST.json');
const POI_KICKOFF = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-WAVE-KICKOFF-LATEST.json');
const DENOM_LOCK = path.join(ROOT, 'evidence/GO_cms_operation/CMS-DENOMINATOR-LOCK-LATEST.json');

async function probeCatalog(api) {
  const [poiAttr, poiFood, cities] = await Promise.all([
    request(`${api}/api/v1/catalog/poi-images?type=attraction`),
    request(`${api}/api/v1/catalog/poi-images?type=food`),
    request(`${api}/api/v1/catalog/cities`),
  ]);
  const attrItems = poiAttr.json?.items || [];
  const foodItems = poiFood.json?.items || [];
  const cityItems = cities.json?.items || [];
  return {
    probe_api: api,
    catalog_cities: { http: cities.status, count: cityItems.length },
    catalog_poi_attraction: { http: poiAttr.status, count: attrItems.length },
    catalog_poi_food: { http: poiFood.status, count: foodItems.length },
    catalog_empty: attrItems.length === 0 && foodItems.length === 0 && cityItems.length === 0,
    upload_allowed: false,
    upload_gate:
      'POI Upload forbidden until pilot catalog build creates rows · Scope → Country → City → POI · not bulk 330',
  };
}

function readJsonIfExists(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function writeFamilyStatus(stamp, scope, catalog, pilot) {
  const prev = readJsonIfExists(FAMILY_STATUS) || {};
  const active = pilot.active_catalog_build;
  const families = (prev.families || []).map((f) => {
    if (f.id !== 'poi') return f;
    return {
      ...f,
      status: 'SCOPE_LOCKED',
      scope_lock_evidence: 'evidence/GO_cms_operation/CMS-POI-CATALOG-SCOPE-LOCK-LATEST.json',
      pilot_wave_evidence: 'evidence/GO_cms_operation/CMS-POI-PILOT-WAVE-LATEST.json',
      matrix_ssot: 'data/catalog/poi-hero-matrix.v1.yaml',
      next_stage: 'catalog_build',
      lock_category: {
        label: 'POI',
        total: scope.denominator.total,
        live: 0,
        pending: scope.denominator.total,
        completion: `0/${scope.denominator.total} (scope_locked · pilot ${active.poi_count} next)`,
        catalog_empty: catalog.catalog_empty,
        target: 'Pilot · 东京 CLOSED → Osaka ACTIVE → … · not bulk 330',
      },
      full_scope_denominator: scope.denominator,
      active_catalog_build: {
        wave_id: active.wave_id,
        country_iso: active.country_iso,
        cities: active.cities,
        poi_count: active.poi_count,
      },
      closure_evidence: null,
    };
  });
  const out = {
    ...prev,
    schema: 'traveltrust.cms_asset_family_status.v1',
    stamp_utc: stamp,
    layer: 'CMS_OPERATION',
    not_governance: true,
    phase: '② staging',
    pipeline: [
      'Review',
      'Replace',
      'Publish',
      'Verify',
      'Evidence',
      'Live',
    ],
    cms_ops_hierarchy: {
      frozen: true,
      levels: ['asset_family', 'country', 'city', 'asset'],
      acceptance_unit: 'city',
      execution_unit: 'asset',
      evidence: 'evidence/GO_cms_operation/CMS-OPS-HIERARCHY-LATEST.json',
    },
    families,
    TT_CMS_POI_STATUS: 'SCOPE_LOCKED',
    TT_CMS_POI_NEXT_STAGE: 'CATALOG_BUILD',
    cms_ops_hierarchy: 'evidence/GO_cms_operation/CMS-OPS-HIERARCHY-LATEST.json',
    cms_ops_hierarchy_frozen: true,
    active_catalog_build: active?.wave_id || null,
  };
  fs.writeFileSync(FAMILY_STATUS, JSON.stringify(out, null, 2) + '\n');
}

function writePoiKickoff(stamp, scope, catalog, pilot) {
  const active = pilot.active_catalog_build;
  const out = {
    schema: 'traveltrust.cms_poi_wave_kickoff.v1',
    stamp_utc: stamp,
    asset_family: 'poi',
    status: 'SCOPE_LOCKED',
    next_stage: 'CATALOG_BUILD',
    upload_paused: true,
    not_started_items: true,
    advancement_rule: pilot.advancement_rule,
    workflow: [
      'POI Catalog Scope Lock',
      'Pilot Catalog Build (Country → City → POI)',
      'Review',
      'Replace',
      'Publish',
      'Verify',
      'Evidence',
      'Live',
    ],
    do_not_modify: ['destination_ambient_matrix', 'DA-*-HOME evidence except CN visual replace'],
    scope_lock: {
      status: 'FROZEN',
      denominator_total: scope.denominator.total,
      cities: scope.denominator.cities,
      attraction: scope.denominator.attraction,
      food: scope.denominator.food,
      matrix_ssot: 'data/catalog/poi-hero-matrix.v1.yaml',
    },
    active_catalog_build: {
      wave_id: active.wave_id,
      label: active.label,
      country_iso: active.country_iso,
      cities: active.cities,
      poi_count: active.poi_count,
      acceptance_unit: 'city',
      acceptance_target: `${active.cities[0]} CLOSED`,
      matrix_ids: active.matrix_ids,
      first_poi: active.first_poi,
    },
    pilot_acceptance: {
      unit: 'city',
      target: `${active.cities[0]} CLOSED`,
      country_iso: active.country_iso,
    },
    pilot_waves: pilot.waves.map((w) => ({ wave_id: w.wave_id, label: w.label, status: w.status, poi_count: w.poi_count })),
    catalog_gate: catalog.catalog_empty
      ? `Pilot city only · ${active.country_iso} · ${active.cities.join('、')} catalog build · acceptance = ${active.cities[0]} CLOSED · not ${scope.denominator.total} bulk`
      : 'Catalog rows exist · re-lock denominator then next POI loop',
    forbidden: ['poi_upload_while_catalog_empty', 'ingest_all_330_on_day_one', 'skip_pilot_before_wave_2', 'accept_by_poi_count'],
    when_pilot_complete: [
      `${active.cities[0]} CLOSED (all city POIs Live)`,
      're-run run-cms-denominator-lock.cjs + run-cms-poi-city-ops-sync.cjs',
      'validate Catalog API · CMS · page · Evidence · Daily Board',
      'advance to next city (Osaka) or POI-WAVE-2 (KR)',
    ],
    roadmap: pilot.roadmap,
    TT_CMS_POI_WAVE: 'SCOPE_LOCKED_CATALOG_BUILD_NEXT',
  };
  fs.writeFileSync(POI_KICKOFF, JSON.stringify(out, null, 2) + '\n');
}

function writePilotWaveEvidence(stamp, scope, pilot) {
  const out = {
    schema: 'traveltrust.cms_poi_pilot_wave.v1',
    stamp_utc: stamp,
    layer: 'CMS_OPERATION',
    not_governance: true,
    phase: '② staging',
    ...pilot,
    matrix_ssot: 'data/catalog/poi-hero-matrix.v1.yaml',
    TT_CMS_POI_PILOT_WAVE: pilot.active_wave,
    TT_CMS_POI_CATALOG_BUILD_NEXT: pilot.active_catalog_build?.label || null,
    TT_CMS_POI_CATALOG_BUILD_POI_COUNT: pilot.active_catalog_build?.poi_count || 0,
  };
  fs.writeFileSync(PILOT_WAVE_LATEST, JSON.stringify(out, null, 2) + '\n');
  return out;
}

async function main() {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const scope = attachPilotWaves(buildPoiCatalogScope());
  const pilot = scope.pilot_waves;
  const catalog = await probeCatalog(API);
  const denom = readJsonIfExists(DENOM_LOCK);
  const active = pilot.active_catalog_build;

  const report = {
    schema: 'traveltrust.cms_poi_catalog_scope_lock.v1',
    stamp_utc: stamp,
    layer: 'CMS_OPERATION',
    role: 'poi_catalog_scope_lock_frozen',
    not_governance: true,
    phase: '② staging',
    probe_api: API,
    ssot: scope.ssot,
    product_countries: scope.product_countries,
    denominator: scope.denominator,
    by_country: scope.by_country,
    excluded_outside_product: {
      rule: 'GB/IT cities in frontend TS · excluded from Phase 1 product denominator',
      count: scope.excluded_outside_product.length,
    },
    catalog_probe: catalog,
    matrix_ssot: 'data/catalog/poi-hero-matrix.v1.yaml',
    matrix_rows: scope.denominator.total,
    pilot_waves: {
      advancement_rule: pilot.advancement_rule,
      active_wave: pilot.active_wave,
      active_catalog_build: {
        wave_id: active.wave_id,
        label: active.label,
        country_iso: active.country_iso,
        cities: active.cities,
        poi_count: active.poi_count,
        matrix_ids: active.matrix_ids,
      },
      forbidden_bulk: pilot.forbidden,
    },
    roadmap: pilot.roadmap,
    wave_1_pilot: active.first_poi,
    execution_sequence: [
      '1_poi_catalog_scope_lock_frozen',
      '2_pilot_catalog_build_jp_tokyo_only',
      '3_re_run_denominator_lock',
      '4_per_poi_review_replace_publish_verify_evidence_live',
      '5_refresh_after_each_item',
      '6_poi_wave_2_kr_then_wave_3_plus',
      '7_all_330_live_poi_closure',
    ],
    forbidden: ['poi_upload_while_catalog_empty', 'ingest_all_330_on_day_one', 'skip_pilot_before_wave_2'],
    ambient_contrast: {
      ambient: 'Country slot existed · Upload replaced landing_ambient content',
      poi: 'catalog_pois = 0 · pilot catalog build (JP·东京·9) first · then Review → Replace per POI',
    },
    cms_denominator_lock_snapshot: denom
      ? {
          stamp_utc: denom.stamp_utc,
          poi: denom.cms_denominator?.by_category?.poi,
          food: denom.cms_denominator?.by_category?.food,
        }
      : null,
    TT_CMS_POI_CATALOG_SCOPE_LOCK: 'FROZEN',
    TT_CMS_POI_DENOMINATOR_TOTAL: scope.denominator.total,
    TT_CMS_POI_DENOMINATOR_CITIES: scope.denominator.cities,
    TT_CMS_POI_UPLOAD_ALLOWED: false,
    TT_CMS_POI_NEXT_STAGE: 'CATALOG_BUILD',
    TT_CMS_POI_PILOT_CATALOG_BUILD: active.label,
    TT_CMS_POI_PILOT_ACCEPTANCE: `${active.cities[0]} CLOSED`,
    TT_CMS_POI_PILOT_POI_COUNT: active.poi_count,
  };

  fs.mkdirSync(path.dirname(MATRIX_OUT), { recursive: true });
  fs.writeFileSync(MATRIX_OUT, buildPoiHeroMatrixYaml(scope));
  fs.mkdirSync(path.join(ROOT, 'evidence/GO_cms_operation/poi-scope-lock', stamp), { recursive: true });
  fs.writeFileSync(
    path.join(ROOT, 'evidence/GO_cms_operation/poi-scope-lock', stamp, 'CMS-POI-CATALOG-SCOPE-LOCK.json'),
    JSON.stringify(report, null, 2) + '\n',
  );
  fs.writeFileSync(OUT_LATEST, JSON.stringify(report, null, 2) + '\n');
  writePilotWaveEvidence(stamp, scope, pilot);
  writeFamilyStatus(stamp, scope, catalog, pilot);
  writePoiKickoff(stamp, scope, catalog, pilot);
  const hierarchy = buildCmsOpsHierarchy({ scope });
  writeHierarchyLatest(hierarchy, stamp);
  const poiCityOps = buildPoiCityOpsFromHierarchy(hierarchy);
  if (poiCityOps) writeCityOpsLatest({ ...poiCityOps, stamp_utc: stamp }, stamp);

  console.log(`TT_CMS_POI_CATALOG_SCOPE_LOCK: ${report.TT_CMS_POI_CATALOG_SCOPE_LOCK}`);
  console.log(`TT_CMS_POI_DENOMINATOR_TOTAL: ${report.TT_CMS_POI_DENOMINATOR_TOTAL} (full scope · not day-one ingest)`);
  console.log(`TT_CMS_POI_NEXT_STAGE: ${report.TT_CMS_POI_NEXT_STAGE}`);
  console.log(`TT_CMS_POI_PILOT_CATALOG_BUILD: ${report.TT_CMS_POI_PILOT_CATALOG_BUILD}`);
  console.log(`TT_CMS_POI_PILOT_ACCEPTANCE: ${report.TT_CMS_POI_PILOT_ACCEPTANCE}`);
  console.log(`TT_CMS_POI_PILOT_POI_COUNT: ${report.TT_CMS_POI_PILOT_POI_COUNT} (city unit · not acceptance count)`);
  console.log(
    `TT_CMS_POI_BY_TYPE: attraction=${scope.denominator.attraction} food=${scope.denominator.food}`,
  );
  console.log(`TT_CMS_POI_CATALOG_PROBE: cities=${catalog.catalog_cities.count} poi=${catalog.catalog_poi_attraction.count + catalog.catalog_poi_food.count} catalog_empty=${catalog.catalog_empty}`);
  console.log(`TT_CMS_POI_UPLOAD_ALLOWED: ${report.TT_CMS_POI_UPLOAD_ALLOWED}`);
  console.log(`TT_CMS_POI_MATRIX: data/catalog/poi-hero-matrix.v1.yaml (${scope.denominator.total} rows scope · pilot ${active.poi_count})`);
  console.log(`TT_CMS_POI_PILOT_FIRST: ${active.first_poi?.matrix_id} · ${active.first_poi?.city_zh} · ${active.first_poi?.legacy_value}`);
  console.log('TT_CMS_POI_PILOT_POIS:');
  for (const p of active.by_city[0]?.pois || []) {
    console.log(`  ${p.matrix_id} · ${p.legacy_value} (${p.poi_type})`);
  }
  console.log('');
  console.log(formatTodaysTasksConsole(hierarchy));
  console.log('');
  const poiFamily = hierarchy.families.find((f) => f.id === 'poi');
  if (poiFamily) console.log(formatFamilyTreeConsole(poiFamily));
  console.log('');
  console.log('POI 分母 330 已锁 · 四级结构 FINAL · 验收 = City CLOSED · 下一步 东京 Catalog Build');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
