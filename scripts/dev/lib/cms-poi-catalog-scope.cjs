/**
 * POI Catalog Scope · frontend TS SSOT → ops denominator (attraction + food · ten product countries)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../../..');

const FRONTEND_PATHS = {
  cityToRegion: 'frontend/lib/cityDetails/constants.ts',
  attractions: 'frontend/lib/cityDetails/attractions.ts',
  productAttractions: 'frontend/lib/cityDetails/productCountryPoi.ts',
  food: 'frontend/lib/cityDetails/food.ts',
  productFood: 'frontend/lib/cityDetails/productCountryPoi.ts',
  productCountries: 'frontend/lib/productCountries.ts',
};

const ISO_BY_ZH = {
  中国: 'CN',
  日本: 'JP',
  韩国: 'KR',
  新加坡: 'SG',
  泰国: 'TH',
  阿联酋: 'AE',
  美国: 'US',
  澳大利亚: 'AU',
  法国: 'FR',
  西班牙: 'ES',
  意大利: 'IT',
  英国: 'GB',
};

function readUtf8(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function parseCityToRegion(text) {
  const m = text.match(/CITY_TO_REGION[^=]*=\s*\{([\s\S]*?)\};/);
  if (!m) return {};
  const map = {};
  for (const part of m[1].split(',')) {
    const mm = part.match(/([^\s:]+)\s*:\s*"([^"]+)"/);
    if (mm) map[mm[1].trim()] = mm[2];
  }
  return map;
}

function extractExportBlock(text, exportName) {
  const idx = text.indexOf(`export const ${exportName}`);
  if (idx < 0) return null;
  const startBrace = text.indexOf('{', idx);
  let depth = 0;
  let i = startBrace;
  for (; i < text.length; i++) {
    if (text[i] === '{') depth++;
    if (text[i] === '}') {
      depth--;
      if (depth === 0) {
        i++;
        break;
      }
    }
  }
  return text.slice(startBrace + 1, i - 1);
}

function parsePoiRecord(filePath, exportName) {
  const text = readUtf8(filePath);
  const body = extractExportBlock(text, exportName);
  if (!body) return {};
  const cities = {};
  const cityRe = /^\s{2}([^\n:]+):\s*\[/gm;
  let cm;
  while ((cm = cityRe.exec(body)) !== null) {
    const city = cm[1].trim();
    const from = cm.index + cm[0].length;
    const rest = body.slice(from);
    const close = rest.indexOf('\n  ],');
    const block = close >= 0 ? rest.slice(0, close) : rest.slice(0, 4000);
    const values = [...block.matchAll(/value:\s*"([^"]+)"/g)].map((x) => x[1]);
    if (values.length) cities[city] = values;
  }
  return cities;
}

function mergeCityMaps(...maps) {
  const out = {};
  for (const m of maps) {
    for (const [city, vals] of Object.entries(m)) {
      if (!out[city]) out[city] = [];
      for (const v of vals) if (!out[city].includes(v)) out[city].push(v);
    }
  }
  return out;
}

function parseProductCountries(text) {
  const order = [];
  for (const m of text.matchAll(/iso:\s*"([A-Z]{2})"[^}]*nameZh:\s*"([^"]+)"/g)) {
    order.push({ iso: m[1], country_zh: m[2] });
  }
  return order;
}

function slugifyLegacy(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fff-]/g, '');
}

function matrixId(iso, seq, poiType) {
  return `PH-${iso}-${String(seq).padStart(3, '0')}-${poiType === 'food' ? 'FOOD' : 'ATR'}`;
}

function buildPoiCatalogScope(options = {}) {
  const root = options.root || ROOT;
  const paths = options.paths || FRONTEND_PATHS;

  const cityToRegion = parseCityToRegion(readUtf8(paths.cityToRegion));
  const productCountries = parseProductCountries(readUtf8(paths.productCountries));
  const productIsoSet = new Set(productCountries.map((c) => c.iso));
  const ambientWaveOrder = ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU', 'ES', 'AE', 'CN'];
  const countryOrder = ambientWaveOrder
    .map((iso) => productCountries.find((c) => c.iso === iso))
    .filter(Boolean)
    .concat(productCountries.filter((c) => !ambientWaveOrder.includes(c.iso)));

  const attractions = mergeCityMaps(
    parsePoiRecord(paths.attractions, 'ATTRACTIONS_DETAILS_BY_CITY'),
    parsePoiRecord(paths.productAttractions, 'PRODUCT_COUNTRY_POI_ATTRACTIONS'),
  );
  const food = mergeCityMaps(
    parsePoiRecord(paths.food, 'FOOD_BY_CITY'),
    parsePoiRecord(paths.productFood, 'PRODUCT_COUNTRY_POI_FOOD'),
  );

  const excludedCountries = [];
  const rows = [];
  let seq = 0;

  for (const { iso, country_zh } of countryOrder) {
    const cities = new Set([
      ...Object.keys(attractions).filter((c) => cityToRegion[c] === country_zh),
      ...Object.keys(food).filter((c) => cityToRegion[c] === country_zh),
    ]);
    const sortedCities = [...cities].sort((a, b) => a.localeCompare(b, 'zh'));

    for (const city_zh of sortedCities) {
      for (const poiType of ['attraction', 'food']) {
        const source = poiType === 'attraction' ? attractions : food;
        const pois = source[city_zh] || [];
        for (const legacy_value of pois) {
          seq++;
          rows.push({
            matrix_id: matrixId(iso, seq, poiType),
            execution_order: seq,
            country_iso: iso,
            country_zh,
            city_zh,
            poi_type: poiType,
            legacy_value,
            slug: slugifyLegacy(legacy_value),
            catalog_slot: {
              entity: 'catalog_pois',
              unique_key: `(city_id, poi_type, slug)`,
              asset_kind: 'poi_hero',
              admin_route: '/admin/content/poi-images',
            },
            matrix_row_status: 'pending',
            asset_lifecycle: 'draft',
            current_source: 'ts_unsplash_fallback',
          });
        }
      }
    }
  }

  const byCountry = countryOrder.map(({ iso, country_zh }) => {
    const countryRows = rows.filter((r) => r.country_iso === iso);
    const cityNames = [...new Set(countryRows.map((r) => r.city_zh))].sort((a, b) => a.localeCompare(b, 'zh'));
    return {
      country_iso: iso,
      country_zh,
      cities: cityNames.length,
      city_names: cityNames,
      attraction: countryRows.filter((r) => r.poi_type === 'attraction').length,
      food: countryRows.filter((r) => r.poi_type === 'food').length,
      total: countryRows.length,
    };
  });

  for (const [city, regionZh] of Object.entries(cityToRegion)) {
    const iso = ISO_BY_ZH[regionZh];
    if (!iso || productIsoSet.has(iso)) continue;
    excludedCountries.push({ country_iso: iso, country_zh: regionZh, city_zh: city, reason: 'outside_product_countries' });
  }

  const allCityCount = new Set(rows.map((r) => r.city_zh)).size;
  const attractionTotal = rows.filter((r) => r.poi_type === 'attraction').length;
  const foodTotal = rows.filter((r) => r.poi_type === 'food').length;

  return {
    ssot: {
      city_to_region: paths.cityToRegion,
      attractions: [paths.attractions, paths.productAttractions],
      food: [paths.food, paths.productFood],
      product_countries: paths.productCountries,
    },
    product_countries: countryOrder,
    denominator: {
      description:
        'Each catalog_pois row (city × poi_type × legacy_value) in ten product countries · not IMG-FAM-POI-* family slots',
      cities: allCityCount,
      attraction: attractionTotal,
      food: foodTotal,
      total: rows.length,
      cms_lock_categories: {
        poi: attractionTotal,
        food: foodTotal,
        note: 'After catalog ingest · run-cms-denominator-lock re-probes /api/v1/catalog/poi-images',
      },
    },
    by_country: byCountry,
    excluded_outside_product: excludedCountries,
    rows,
    wave_1_pilot: rows.find((r) => r.country_iso === 'JP' && r.city_zh === '东京' && r.legacy_value === '浅草寺') || rows[0],
  };
}

function attachPilotWaves(scope) {
  const { buildPilotWaves } = require('./cms-poi-pilot-waves.cjs');
  return { ...scope, pilot_waves: buildPilotWaves(scope) };
}

function buildPoiHeroMatrixYaml(scope) {
  const lines = [];
  lines.push('# CMS Content L5 · POI Hero Asset Matrix');
  lines.push('# Product: POI Hero · Catalog: catalog_pois + poi_hero media');
  lines.push('# Scope lock: scripts/dev/run-cms-poi-catalog-scope-lock.cjs');
  lines.push('');
  lines.push('schema: traveltrust.cms_poi_hero_matrix.v1');
  lines.push('version: 1');
  lines.push(`effective_utc: "${new Date().toISOString().slice(0, 10)}"`);
  lines.push('machine_key: TT_CMS_POI_HERO_MATRIX');
  lines.push('status: SCOPE_LOCKED');
  lines.push('brief_ssot: data/catalog/cms-content-brief.v1.yaml');
  lines.push('');
  lines.push('scope_ssot:');
  for (const [k, v] of Object.entries(scope.ssot)) {
    if (Array.isArray(v)) {
      lines.push(`  ${k}:`);
      for (const p of v) lines.push(`    - ${p}`);
    } else {
      lines.push(`  ${k}: ${v}`);
    }
  }
  lines.push('');
  lines.push('phase_1_prerequisite:');
  lines.push('  - poi_catalog_scope_lock');
  lines.push('  - pilot_catalog_build_country_city_poi');
  lines.push('  - denominator_re_lock_per_wave');
  lines.push('  forbidden_shortcut: upload_while_catalog_empty');
  lines.push('  forbidden_bulk: ingest_all_330_on_day_one');
  lines.push('');
  lines.push('phase_1_pilot_discipline:');
  lines.push('  advancement: Scope → Country → City → POI');
  lines.push('  acceptance_unit: city');
  lines.push('  city_status_enum: [NOT_STARTED, ACTIVE, CLOSED]');
  lines.push('  ops_hierarchy: [asset_family, country, city, asset]');
  lines.push('  full_scope_rows: ' + scope.denominator.total);
  lines.push('  wave_1_pilot:');
  lines.push('    wave_id: POI-WAVE-1-PILOT');
  lines.push('    country_iso: JP');
  lines.push('    cities: [东京]');
  lines.push('    purpose: Catalog Build → full loop · validate pipeline before Wave 2');
  lines.push('  wave_2:');
  lines.push('    wave_id: POI-WAVE-2');
  lines.push('    country_iso: KR');
  lines.push('  wave_3_plus:');
  lines.push('    countries: [TH, SG, FR, US, AU, ES, AE, CN]');
  lines.push('  forbidden:');
  lines.push('    - ingest_all_330_on_day_one');
  lines.push('    - skip_pilot_before_wave_2');
  lines.push('    - batch_upload_all_countries');
  lines.push('');
  lines.push('phase_1_fixed_workflow:');
  lines.push('  - poi_scope_lock');
  lines.push('  - catalog_ingest');
  lines.push('  - cms_review');
  lines.push('  - designer_replace');
  lines.push('  - catalog_publish');
  lines.push('  - verify');
  lines.push('  - evidence');
  lines.push('  - matrix_pass');
  lines.push('');
  lines.push('summary:');
  lines.push(`  total_rows: ${scope.denominator.total}`);
  lines.push('  matrix_pass: 0');
  lines.push(`  cities: ${scope.denominator.cities}`);
  lines.push(`  attraction_rows: ${scope.denominator.attraction}`);
  lines.push(`  food_rows: ${scope.denominator.food}`);
  lines.push('  asset_lifecycle_draft: ' + scope.denominator.total);
  lines.push('');
  lines.push('rows:');
  for (const row of scope.rows) {
    lines.push(`  - matrix_id: ${row.matrix_id}`);
    lines.push(`    execution_order: ${row.execution_order}`);
    lines.push(`    country_iso: ${row.country_iso}`);
    lines.push(`    country_zh: ${row.country_zh}`);
    lines.push(`    city_zh: ${row.city_zh}`);
    lines.push(`    poi_type: ${row.poi_type}`);
    lines.push(`    legacy_value: ${row.legacy_value}`);
    lines.push(`    slug: ${row.slug}`);
    lines.push(`    asset_kind: poi_hero`);
    lines.push(`    current_source: ts_unsplash_fallback`);
    lines.push(`    asset_lifecycle: draft`);
    lines.push(`    matrix_row_status: pending`);
  }
  lines.push('');
  return lines.join('\n');
}

module.exports = {
  FRONTEND_PATHS,
  buildPoiCatalogScope,
  attachPilotWaves,
  buildPoiHeroMatrixYaml,
  slugifyLegacy,
  matrixId,
};
