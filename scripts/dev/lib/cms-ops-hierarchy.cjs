/**
 * CMS Operation · Unified 4-level hierarchy (FINAL ops abstraction · do not add levels)
 *
 *   Asset Family → Country → City → Asset
 *
 * - City = ops acceptance unit (daily report)
 * - Asset = execution unit (Review → Replace → Publish → Verify → Evidence → Live)
 * - matrix_id / PH-* / DA-* = evidence layer only · not ops language
 */
const fs = require('fs');
const path = require('path');

const { parseDestinationAmbientRows } = require('./cms-destination-ambient-ops.cjs');

const { AMBIENT_COUNTRY_ORDER } = require('./cms-poi-pilot-waves.cjs');
const { buildPoiCatalogScope, attachPilotWaves } = require('./cms-poi-catalog-scope.cjs');

const ROOT = path.join(__dirname, '../../..');
const HIERARCHY_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-OPS-HIERARCHY-LATEST.json');
const POI_CITY_CLOSURE_REGISTRY = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-CLOSURE-REGISTRY-LATEST.json');
const DA_MATRIX = path.join(ROOT, 'data/catalog/destination-ambient-matrix.v1.yaml');

const CMS_OPS_HIERARCHY = {
  frozen: true,
  final_abstraction: true,
  infrastructure_frozen: true,
  levels: ['asset_family', 'country', 'city', 'asset'],
  acceptance_unit: 'city',
  execution_unit: 'asset',
  ops_language_excludes: ['matrix_id', 'PH-*', 'DA-*', 'CMS-*'],
  evidence_layer_includes: ['matrix_id', 'matrix_row_status', 'execution_gates'],
};

const CMS_PIPELINE = [
  'Review',
  'Replace',
  'Publish',
  'Verify',
  'Evidence',
  'Live',
];

const CMS_OPS_FAMILIES = [
  { id: 'destination_ambient', label: 'Destination Ambient', order: 1 },
  { id: 'poi', label: 'POI', order: 2 },
  { id: 'hotel', label: 'Hotel', order: 3 },
  { id: 'transport', label: 'Transport', order: 4 },
  { id: 'provider_listing', label: 'Provider Listing', order: 5 },
  { id: 'acquisition_listing', label: 'Acquisition Listing', order: 6 },
  { id: 'banner', label: 'Banner', order: 7 },
  { id: 'video_poster', label: 'Video Poster', order: 8 },
];

const STATUS_ENUM = ['NOT_STARTED', 'ACTIVE', 'CLOSED', 'WAITING'];

const COUNTRY_EN = {
  CN: 'China',
  JP: 'Japan',
  KR: 'Korea',
  SG: 'Singapore',
  TH: 'Thailand',
  AE: 'UAE',
  US: 'United States',
  AU: 'Australia',
  FR: 'France',
  ES: 'Spain',
};

const CITY_EN = {
  东京: 'Tokyo',
  大阪: 'Osaka',
  京都: 'Kyoto',
  札幌: 'Sapporo',
  福冈: 'Fukuoka',
  首尔: 'Seoul',
  釜山: 'Busan',
  济州: 'Jeju',
  仁川: 'Incheon',
  曼谷: 'Bangkok',
  清迈: 'Chiang Mai',
  普吉: 'Phuket',
  新加坡: 'Singapore',
  巴黎: 'Paris',
  里昂: 'Lyon',
  尼斯: 'Nice',
  纽约: 'New York',
  洛杉矶: 'Los Angeles',
  旧金山: 'San Francisco',
  拉斯维加斯: 'Las Vegas',
  悉尼: 'Sydney',
  墨尔本: 'Melbourne',
  黄金海岸: 'Gold Coast',
  巴塞罗那: 'Barcelona',
  马德里: 'Madrid',
  塞维利亚: 'Seville',
  迪拜: 'Dubai',
  阿布扎比: 'Abu Dhabi',
  沙迦: 'Sharjah',
  北京: 'Beijing',
  上海: 'Shanghai',
  杭州: 'Hangzhou',
  西安: "Xi'an",
  成都: 'Chengdu',
  广州: 'Guangzhou',
  厦门: 'Xiamen',
  大理: 'Dali',
  青岛: 'Qingdao',
};

/** Representative city per country for country-scoped families (Ambient). */
const AMBIENT_ANCHOR_CITY = {
  JP: '东京',
  KR: '首尔',
  TH: '曼谷',
  SG: '新加坡',
  FR: '巴黎',
  US: '纽约',
  AU: '悉尼',
  ES: '巴塞罗那',
  AE: '迪拜',
  CN: '北京',
};

function readJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function parseDaMatrixRows() {
  if (!fs.existsSync(DA_MATRIX)) return [];
  return parseDestinationAmbientRows(fs.readFileSync(DA_MATRIX, 'utf8'));
}

function readPoiCityClosureRegistry() {
  try {
    if (!fs.existsSync(POI_CITY_CLOSURE_REGISTRY)) return null;
    return JSON.parse(fs.readFileSync(POI_CITY_CLOSURE_REGISTRY, 'utf8'));
  } catch {
    return null;
  }
}

function resolveActivePoiCity(scope, registry) {
  const fallback = {
    country_iso: scope.pilot_waves?.active_catalog_build?.country_iso || 'JP',
    city_zh: scope.pilot_waves?.active_catalog_build?.cities?.[0] || '东京',
  };
  if (registry?.active_city?.country_iso && registry?.active_city?.city_zh) {
    return {
      country_iso: registry.active_city.country_iso,
      city_zh: registry.active_city.city_zh,
    };
  }
  return fallback;
}

function resolveFamilyStatus(countries) {
  if (!countries?.length) return 'NOT_STARTED';
  if (countries.every((c) => c.status === 'CLOSED')) return 'CLOSED';
  if (countries.some((c) => c.status === 'ACTIVE' || c.status === 'CLOSED')) return 'ACTIVE';
  return 'NOT_STARTED';
}

function resolveCountryStatus(cities) {
  if (!cities?.length) return 'NOT_STARTED';
  if (cities.every((c) => c.status === 'CLOSED')) return 'CLOSED';
  if (cities.some((c) => c.status === 'ACTIVE' || c.status === 'CLOSED' || c.asset_live > 0)) return 'ACTIVE';
  return 'NOT_STARTED';
}

function resolveCityStatus(assetLive, assetTotal, isActiveFocus) {
  if (assetTotal > 0 && assetLive === assetTotal) return 'CLOSED';
  if (assetLive > 0 || isActiveFocus) return 'ACTIVE';
  return 'NOT_STARTED';
}

function cityOpsDisplay(status, assetLive, assetTotal, countryStatus) {
  if (status === 'CLOSED') return '✅ CLOSED';
  if (status === 'ACTIVE') return `ACTIVE (${assetLive}/${assetTotal})`;
  if (countryStatus === 'ACTIVE') return 'WAITING';
  return 'WAITING';
}

function assetStatusFromLive(isLive, cityActive) {
  if (isLive) return 'LIVE';
  if (cityActive) return 'ACTIVE';
  return 'NOT_STARTED';
}

function buildAssetNode({ ops_label, status, evidence_ref, asset_kind }) {
  return {
    ops_label,
    status,
    asset_kind: asset_kind || null,
    pipeline: CMS_PIPELINE,
    evidence_ref: evidence_ref || null,
  };
}

function buildCityNode({ city_zh, country_iso, countryStatus, assets, isActiveFocus }) {
  const assetTotal = assets.length;
  const assetLive = assets.filter((a) => a.status === 'LIVE').length;
  const status = resolveCityStatus(assetLive, assetTotal, isActiveFocus);
  return {
    city_zh,
    city_en: CITY_EN[city_zh] || city_zh,
    country_iso,
    status,
    display: cityOpsDisplay(status, assetLive, assetTotal, countryStatus),
    acceptance_unit: true,
    asset_total: assetTotal,
    asset_live: assetLive,
    completion: assetTotal ? `${assetLive}/${assetTotal}` : '0/0',
    closed_when: 'all assets Live',
    assets,
  };
}

function buildCountryNode({ country_iso, country_zh, cities }) {
  const status = resolveCountryStatus(cities);
  return {
    country_iso,
    country_zh,
    country_en: COUNTRY_EN[country_iso] || country_iso,
    status,
    display: status === 'CLOSED' ? '✅ CLOSED' : status === 'ACTIVE' ? '▶ ACTIVE' : 'NOT_STARTED',
    cities_total: cities.length,
    cities_closed: cities.filter((c) => c.status === 'CLOSED').length,
    asset_total: cities.reduce((n, c) => n + c.asset_total, 0),
    asset_live: cities.reduce((n, c) => n + c.asset_live, 0),
    closed_when: 'all cities CLOSED',
    cities,
  };
}

function buildDestinationAmbientFamily(daRows, cmsItems) {
  const countries = AMBIENT_COUNTRY_ORDER.map((iso) => {
    const row = daRows.find((r) => r.country_iso === iso);
    const city_zh = AMBIENT_ANCHOR_CITY[iso] || row?.country_zh;
    const cms = (cmsItems || []).find((i) => i.matrix_id === row?.matrix_id);
    const isLive = row?.asset_lifecycle === 'live' || cms?.l5_status === 'LIVE';
    const assets = [
      buildAssetNode({
        ops_label: 'Ambient',
        status: isLive ? 'LIVE' : 'NOT_STARTED',
        asset_kind: 'landing_ambient',
        evidence_ref: row ? { matrix_id: row.matrix_id } : null,
      }),
    ];
    const cities = [
      buildCityNode({
        city_zh,
        country_iso: iso,
        countryStatus: 'ACTIVE',
        isActiveFocus: false,
        assets,
      }),
    ];
    return buildCountryNode({
      country_iso: iso,
      country_zh: row?.country_zh || COUNTRY_EN[iso],
      cities,
    });
  });

  return {
    id: 'destination_ambient',
    label: 'Destination Ambient',
    order: 1,
    status: 'CLOSED',
    hierarchy: CMS_OPS_HIERARCHY.levels,
    acceptance_unit: 'city',
    execution_unit: 'asset',
    pipeline: CMS_PIPELINE,
    countries,
    summary: {
      countries_closed: countries.filter((c) => c.status === 'CLOSED').length,
      countries_total: countries.length,
      asset_live: countries.reduce((n, c) => n + c.asset_live, 0),
      asset_total: countries.reduce((n, c) => n + c.asset_total, 0),
    },
    closure_evidence: 'evidence/GO_cms_operation/CMS-AMBIENT-WAVE1-CLOSURE-LATEST.json',
    matrix_ssot: 'data/catalog/destination-ambient-matrix.v1.yaml',
  };
}

function matchPoiAssetLive(scopeRow, cmsItems) {
  for (const item of cmsItems || []) {
    if (item.country_iso !== scopeRow.country_iso) continue;
    if (item.city_name_zh !== scopeRow.city_zh) continue;
    if ((item.label || '').includes(scopeRow.legacy_value) && item.l5_status === 'LIVE') return true;
  }
  return false;
}

function buildPoiFamily(scope, cmsItems, activeCity) {
  const cityRegistry = readPoiCityClosureRegistry();
  activeCity = activeCity || resolveActivePoiCity(scope, cityRegistry);

  const countries = [];
  for (const iso of AMBIENT_COUNTRY_ORDER) {
    const meta = scope.product_countries.find((c) => c.iso === iso);
    if (!meta) continue;
    const countryRows = scope.rows.filter((r) => r.country_iso === iso);
    if (!countryRows.length) continue;

    const cityNames = [...new Set(countryRows.map((r) => r.city_zh))].sort((a, b) => a.localeCompare(b, 'zh'));
    const countryStatusPreview = iso === activeCity.country_iso ? 'ACTIVE' : 'NOT_STARTED';

    const cities = cityNames.map((city_zh) => {
      const poiRows = countryRows.filter((r) => r.city_zh === city_zh);
      const isActiveFocus = activeCity.country_iso === iso && activeCity.city_zh === city_zh;
      const assets = poiRows.map((r) =>
        buildAssetNode({
          ops_label: r.legacy_value,
          status: assetStatusFromLive(matchPoiAssetLive(r, cmsItems), isActiveFocus),
          asset_kind: r.poi_type,
          evidence_ref: { matrix_id: r.matrix_id, slug: r.slug },
        }),
      );
      return buildCityNode({
        city_zh,
        country_iso: iso,
        countryStatus: countryStatusPreview,
        isActiveFocus,
        assets,
      });
    });

    countries.push(
      buildCountryNode({
        country_iso: iso,
        country_zh: meta.country_zh,
        cities,
      }),
    );
  }

  if (cityRegistry?.closed_cities?.length) {
    for (const closed of cityRegistry.closed_cities) {
      const country = countries.find((c) => c.country_iso === closed.country_iso);
      const city = country?.cities.find((c) => c.city_zh === closed.city_zh);
      if (city && city.asset_live === city.asset_total && city.asset_total > 0) {
        city.status = 'CLOSED';
        city.display = cityOpsDisplay('CLOSED', city.asset_live, city.asset_total, country?.status);
      }
    }
  }

  // Ensure active city marked ACTIVE even when catalog empty
  const activeCountry = countries.find((c) => c.country_iso === activeCity.country_iso);
  const activeCityNode = activeCountry?.cities.find((c) => c.city_zh === activeCity.city_zh);
  if (activeCityNode && activeCityNode.status === 'NOT_STARTED') {
    activeCityNode.status = 'ACTIVE';
    activeCityNode.display = cityOpsDisplay('ACTIVE', activeCityNode.asset_live, activeCityNode.asset_total, 'ACTIVE');
    if (activeCountry) {
      activeCountry.status = resolveCountryStatus(activeCountry.cities);
      activeCountry.display = activeCountry.status === 'ACTIVE' ? '▶ ACTIVE' : activeCountry.display;
    }
  }

  const assetTotal = scope.denominator.total;
  const assetLive = countries.reduce((n, c) => n + c.asset_live, 0);

  return {
    id: 'poi',
    label: 'POI',
    order: 2,
    status: assetLive === assetTotal && assetTotal > 0 ? 'CLOSED' : 'ACTIVE',
    hierarchy: CMS_OPS_HIERARCHY.levels,
    acceptance_unit: 'city',
    execution_unit: 'asset',
    pipeline: CMS_PIPELINE,
    countries,
    summary: {
      countries_closed: countries.filter((c) => c.status === 'CLOSED').length,
      countries_total: countries.length,
      cities_closed: countries.reduce((n, c) => n + c.cities_closed, 0),
      cities_total: countries.reduce((n, c) => n + c.cities_total, 0),
      asset_live: assetLive,
      asset_total: assetTotal,
      completion: `${assetLive}/${assetTotal}`,
    },
    active_city: {
      country_iso: activeCity.country_iso,
      country_en: COUNTRY_EN[activeCity.country_iso],
      city_zh: activeCity.city_zh,
      city_en: CITY_EN[activeCity.city_zh] || activeCity.city_zh,
    },
    scope_lock: 'evidence/GO_cms_operation/CMS-POI-CATALOG-SCOPE-LOCK-LATEST.json',
    matrix_ssot: 'data/catalog/poi-hero-matrix.v1.yaml',
    closed_when: 'all countries CLOSED · 330/330 assets Live',
  };
}

function buildPlaceholderFamily({ id, label, order, status }) {
  return {
    id,
    label,
    order,
    status: status || 'NOT_STARTED',
    hierarchy: CMS_OPS_HIERARCHY.levels,
    acceptance_unit: 'city',
    execution_unit: 'asset',
    pipeline: CMS_PIPELINE,
    countries: [],
    summary: { asset_live: 0, asset_total: null, note: 'Scope lock pending · same 4-level tree when ACTIVE' },
    display: 'NOT_STARTED',
  };
}

function buildTodaysTasks(hierarchy) {
  const tasks = [];
  for (const family of hierarchy.families) {
    if (family.status === 'CLOSED') {
      tasks.push({ family: family.label, display: '✅ CLOSED', kind: 'family_closed' });
      continue;
    }
    if (family.status === 'NOT_STARTED' || !family.countries?.length) {
      tasks.push({ family: family.label, display: 'NOT_STARTED', kind: 'family_waiting' });
      continue;
    }
    const activeCountry = family.countries.find((c) => c.status === 'ACTIVE' || c.cities.some((city) => city.status === 'ACTIVE'));
    if (!activeCountry) {
      tasks.push({ family: family.label, display: 'NOT_STARTED', kind: 'family_waiting' });
      continue;
    }
    const sortedCities = [...activeCountry.cities].sort((a, b) => {
      if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
      if (b.status === 'ACTIVE' && a.status !== 'ACTIVE') return 1;
      if (a.status === 'CLOSED' && b.status !== 'CLOSED') return -1;
      if (b.status === 'CLOSED' && a.status !== 'CLOSED') return 1;
      return a.city_en.localeCompare(b.city_en);
    });
    tasks.push({
      family: family.label,
      country_en: activeCountry.country_en,
      country_zh: activeCountry.country_zh,
      kind: 'family_active',
      cities: sortedCities.map((city) => ({
        city_en: city.city_en,
        city_zh: city.city_zh,
        display: city.display,
        status: city.status,
      })),
    });
  }
  return tasks;
}

function buildCmsOpsHierarchy(options = {}) {
  const denomLock = options.denom_lock || readJson(path.join(ROOT, 'evidence/GO_cms_operation/CMS-DENOMINATOR-LOCK-LATEST.json'));
  const cmsItems = options.cms_items || denomLock?.cms_denominator?.items || [];
  const poiItems = cmsItems.filter((i) => i.category === 'poi' || i.category === 'food');
  const ambientItems = cmsItems.filter((i) => i.category === 'destination_ambient');
  const daRows = options.da_rows || parseDaMatrixRows();
  const scope = options.scope || attachPilotWaves(buildPoiCatalogScope());

  const families = [
    buildDestinationAmbientFamily(daRows, ambientItems),
    buildPoiFamily(scope, poiItems),
    buildPlaceholderFamily({ id: 'hotel', label: 'Hotel', order: 3 }),
    buildPlaceholderFamily({ id: 'transport', label: 'Transport', order: 4 }),
    buildPlaceholderFamily({ id: 'provider_listing', label: 'Provider Listing', order: 5 }),
    buildPlaceholderFamily({ id: 'acquisition_listing', label: 'Acquisition Listing', order: 6 }),
    buildPlaceholderFamily({ id: 'banner', label: 'Banner', order: 7 }),
    buildPlaceholderFamily({ id: 'video_poster', label: 'Video Poster', order: 8 }),
  ];

  const activeFocus = families.find((f) => f.status === 'ACTIVE' && f.active_city);
  const todays_tasks = buildTodaysTasks({ families });

  return {
    schema: 'traveltrust.cms_ops_hierarchy.v1',
    layer: 'CMS_OPERATION',
    not_governance: true,
    phase: '② staging',
    cms_ops_hierarchy: CMS_OPS_HIERARCHY,
    pipeline: CMS_PIPELINE,
    families,
    todays_tasks,
    active_focus: activeFocus
      ? {
          asset_family: activeFocus.label,
          country: activeFocus.active_city.country_en,
          city: activeFocus.active_city.city_en,
          acceptance: `${activeFocus.active_city.city_en} CLOSED`,
        }
      : null,
    rollup: {
      destination_ambient: 'CLOSED',
      poi: families.find((f) => f.id === 'poi')?.summary?.completion || '0/330',
      next_family_after_poi: 'Hotel',
    },
    TT_CMS_OPS_HIERARCHY: 'FROZEN',
    TT_CMS_INFRASTRUCTURE: 'FROZEN',
    TT_CMS_CONTENT_MODE: 'execution_only',
    TT_CMS_ACCEPTANCE_UNIT: 'city',
    TT_CMS_EXECUTION_UNIT: 'asset',
    TT_CMS_ACTIVE_CITY: activeFocus
      ? `${activeFocus.active_city.country_en} · ${activeFocus.active_city.city_en}`
      : null,
  };
}

function formatTodaysTasksConsole(hierarchy) {
  const lines = ["Today's Tasks", '─'.repeat(24), ''];
  for (const task of hierarchy.todays_tasks || []) {
    if (task.kind === 'family_closed') {
      lines.push(`${task.family}`);
      lines.push(`  ✅ CLOSED`);
      lines.push('');
      continue;
    }
    if (task.kind === 'family_waiting') {
      lines.push(`${task.family}`);
      lines.push(`  NOT_STARTED`);
      lines.push('');
      continue;
    }
    lines.push(`${task.family}`);
    lines.push(`  ${task.country_en}`);
    for (const city of task.cities) {
      const mark = city.status === 'CLOSED' ? '✅' : city.status === 'ACTIVE' ? '▶' : ' ';
      lines.push(`    ${city.city_en.padEnd(12)} ${mark} ${city.display}`);
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

function formatFamilyTreeConsole(family) {
  if (family.status === 'CLOSED' && family.id === 'destination_ambient') {
    return `${family.label}\n  ✅ CLOSED (10/10 countries)`;
  }
  if (!family.countries?.length) {
    return `${family.label}\n  NOT_STARTED`;
  }

  const lines = [family.label];
  for (const country of family.countries) {
    const showDetail = country.status === 'ACTIVE' || country.cities.some((c) => c.status === 'ACTIVE' || c.status === 'CLOSED');
    if (!showDetail && country.status === 'NOT_STARTED') {
      lines.push(`  ${country.country_en}`);
      for (const city of country.cities) {
        lines.push(`    ${city.city_en.padEnd(12)} WAITING`);
      }
      continue;
    }
    const sortedCities = [...country.cities].sort((a, b) => {
      if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
      if (b.status === 'ACTIVE' && a.status !== 'ACTIVE') return 1;
      if (a.status === 'CLOSED' && b.status !== 'CLOSED') return -1;
      if (b.status === 'CLOSED' && a.status !== 'CLOSED') return 1;
      return a.city_en.localeCompare(b.city_en);
    });
    lines.push(`  ${country.country_en}${country.status === 'CLOSED' ? '  ✅ CLOSED' : country.status === 'ACTIVE' ? '' : ''}`);
    for (const city of sortedCities) {
      lines.push(`    ${city.city_en.padEnd(12)} ${city.display}`);
      if (city.status === 'ACTIVE' && city.assets?.length) {
        for (const asset of city.assets) {
          const mark = asset.status === 'LIVE' ? '✓' : '·';
          lines.push(`      ${mark} ${asset.ops_label}`);
        }
      }
    }
  }
  return lines.join('\n');
}

function formatOpsHierarchyConsole(hierarchy) {
  const lines = [
    'CMS Operation · 四级结构（FINAL · Asset Family → Country → City → Asset）',
    `验收单位 City · 执行单位 Asset · 流程 ${CMS_PIPELINE.join(' → ')}`,
    '',
  ];
  for (const family of hierarchy.families) {
    lines.push(formatFamilyTreeConsole(family));
    lines.push('');
  }
  if (hierarchy.active_focus) {
    lines.push(`Active City: ${hierarchy.active_focus.country} · ${hierarchy.active_focus.city} · target ${hierarchy.active_focus.acceptance}`);
  }
  return lines.join('\n').trimEnd();
}

function writeHierarchyLatest(hierarchy, stampUtc) {
  const out = {
    ...hierarchy,
    stamp_utc: stampUtc || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'),
  };
  fs.mkdirSync(path.dirname(HIERARCHY_LATEST), { recursive: true });
  fs.writeFileSync(HIERARCHY_LATEST, JSON.stringify(out, null, 2) + '\n');
  return out;
}

function readHierarchyLatest() {
  return readJson(HIERARCHY_LATEST);
}

/** Backward compat · POI city ops section derived from unified hierarchy */
function buildPoiCityOpsFromHierarchy(hierarchy) {
  const poi = hierarchy.families.find((f) => f.id === 'poi');
  if (!poi) return null;
  return {
    schema: 'traveltrust.cms_poi_city_ops.v1',
    layer: 'CMS_OPERATION',
    asset_family: 'poi',
    hierarchy: CMS_OPS_HIERARCHY.levels,
    acceptance_unit: 'city',
    execution_unit: 'asset',
    countries: poi.countries,
    summary: poi.summary,
    active_city: poi.active_city,
    pilot_acceptance: poi.active_city
      ? { unit: 'city', target: `${poi.active_city.city_zh} CLOSED` }
      : null,
    TT_CMS_POI_ACCEPTANCE_UNIT: 'city',
    TT_CMS_POI_ACTIVE_CITY: poi.active_city
      ? `${poi.active_city.country_iso} · ${poi.active_city.city_zh}`
      : null,
  };
}

module.exports = {
  HIERARCHY_LATEST,
  CMS_OPS_HIERARCHY,
  CMS_PIPELINE,
  CMS_OPS_FAMILIES,
  STATUS_ENUM,
  COUNTRY_EN,
  CITY_EN,
  buildCmsOpsHierarchy,
  buildTodaysTasks,
  formatTodaysTasksConsole,
  formatOpsHierarchyConsole,
  formatFamilyTreeConsole,
  writeHierarchyLatest,
  readHierarchyLatest,
  buildPoiCityOpsFromHierarchy,
};
