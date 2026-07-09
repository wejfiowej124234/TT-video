/**
 * POI Wave 2 · KR · 首尔 Golden Template（日本 TT_CMS_JP_COUNTRY: CLOSED 同源）
 */
const { rowsForCountryCity, rowsForCountry } = require('./cms-poi-pilot-waves.cjs');

const WAVE_2_KR_PILOT = {
  wave_id: 'POI-WAVE-2-KR-PILOT',
  label: 'Pilot · KR · 首尔',
  country_iso: 'KR',
  country_zh: '韩国',
  cities: ['首尔'],
  acceptance_unit: 'city',
  acceptance_target: '首尔 CLOSED',
  purpose:
    'Catalog Build → per-POI Review → Live · 日本 Golden Template 复制 · pilot done when 首尔 CLOSED',
  forbidden: ['bulk_ingest_kr_all', 'skip_pilot_before_next_city', 'accept_by_poi_count'],
  template_country: 'JP',
  template_closure: 'evidence/GO_cms_operation/CMS-JP-COUNTRY-CLOSURE-LATEST.json',
};

function buildKrPilotWaves(scope) {
  const { rows, product_countries: productCountries } = scope;
  const krRows = rowsForCountry(rows, 'KR');
  const seoulRows = rowsForCountryCity(rows, 'KR', '首尔');

  const wave2 = {
    ...WAVE_2_KR_PILOT,
    status: 'ACTIVE',
    catalog_build: true,
    matrix_ids: seoulRows.map((r) => r.matrix_id),
    poi_count: seoulRows.length,
    by_city: WAVE_2_KR_PILOT.cities.map((city) => ({
      city_zh: city,
      acceptance_unit: 'city',
      acceptance_target: `${city} CLOSED`,
      poi_count: rowsForCountryCity(rows, 'KR', city).length,
      matrix_ids: rowsForCountryCity(rows, 'KR', city).map((r) => r.matrix_id),
      pois: rowsForCountryCity(rows, 'KR', city).map((r) => ({
        legacy_value: r.legacy_value,
        poi_type: r.poi_type,
        matrix_id: r.matrix_id,
      })),
    })),
    first_matrix_id: seoulRows[0]?.matrix_id || null,
    first_poi: seoulRows[0]
      ? {
          city_zh: seoulRows[0].city_zh,
          legacy_value: seoulRows[0].legacy_value,
          matrix_id: seoulRows[0].matrix_id,
        }
      : null,
    kr_country_total: krRows.length,
    kr_cities: [...new Set(krRows.map((r) => r.city_zh))],
  };

  return {
    advancement_rule: 'Scope → Country → City → POI · acceptance = City CLOSED',
    ops_hierarchy: ['asset_family', 'country', 'city', 'asset'],
    acceptance_unit: 'city',
    template_country: 'JP',
    jp_country_closed_ssot: 'evidence/GO_cms_operation/CMS-JP-COUNTRY-CLOSURE-LATEST.json',
    active_wave: wave2.wave_id,
    active_catalog_build: wave2,
    waves: [wave2],
    kr_denominator: {
      country_iso: 'KR',
      cities: wave2.kr_cities,
      poi_total: krRows.length,
      seoul_pilot: seoulRows.length,
    },
    roadmap: [
      { stage: 'jp_country', status: 'CLOSED', ssot: 'CMS-JP-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'kr_scope', status: 'LOCKED' },
      { stage: 'catalog_build', status: 'ACTIVE', city: '首尔', acceptance: '首尔 CLOSED' },
      { stage: 'kr_seoul_execution', status: 'ACTIVE' },
      { stage: 'kr_seoul_content_qa', status: 'NOT_STARTED' },
      { stage: 'kr_country_runtime', status: 'NOT_STARTED', when: 'TT_CMS_KR_COUNTRY: CLOSED' },
    ],
  };
}

module.exports = {
  WAVE_2_KR_PILOT,
  buildKrPilotWaves,
};
