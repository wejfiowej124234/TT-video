/**
 * POI Wave 6 · US · 旧金山 Golden Template（JP + KR + TH + SG + FR Country CLOSED 五模板同源）
 */
const { rowsForCountryCity, rowsForCountry } = require('./cms-poi-pilot-waves.cjs');

const WAVE_6_US_PILOT = {
  wave_id: 'POI-WAVE-6-US-PILOT',
  label: 'Pilot · US · 旧金山',
  country_iso: 'US',
  country_zh: '美国',
  cities: ['旧金山'],
  acceptance_unit: 'city',
  acceptance_target: '旧金山 CLOSED',
  purpose:
    'Catalog Build → per-POI Review → Live · JP/KR/TH/SG/FR Golden Template 复制 · pilot done when 旧金山 CLOSED',
  forbidden: ['bulk_ingest_us_all', 'skip_pilot_before_next_city', 'accept_by_poi_count'],
  template_countries: ['JP', 'KR', 'TH', 'SG', 'FR'],
  template_closure: [
    'evidence/GO_cms_operation/CMS-JP-COUNTRY-CLOSURE-LATEST.json',
    'evidence/GO_cms_operation/CMS-KR-COUNTRY-CLOSURE-LATEST.json',
    'evidence/GO_cms_operation/CMS-TH-COUNTRY-CLOSURE-LATEST.json',
    'evidence/GO_cms_operation/CMS-SG-COUNTRY-CLOSURE-LATEST.json',
    'evidence/GO_cms_operation/CMS-FR-COUNTRY-CLOSURE-LATEST.json',
  ],
};

const US_CITY_ORDER = ['旧金山', '拉斯维加斯', '洛杉矶', '纽约'];

function buildUsPilotWaves(scope) {
  const { rows } = scope;
  const usRows = rowsForCountry(rows, 'US');
  const sfRows = rowsForCountryCity(rows, 'US', '旧金山');

  const wave6 = {
    ...WAVE_6_US_PILOT,
    status: 'ACTIVE',
    catalog_build: true,
    matrix_ids: sfRows.map((r) => r.matrix_id),
    poi_count: sfRows.length,
    by_city: US_CITY_ORDER.map((city) => ({
      city_zh: city,
      acceptance_unit: 'city',
      acceptance_target: `${city} CLOSED`,
      poi_count: rowsForCountryCity(rows, 'US', city).length,
      matrix_ids: rowsForCountryCity(rows, 'US', city).map((r) => r.matrix_id),
      pois: rowsForCountryCity(rows, 'US', city).map((r) => ({
        legacy_value: r.legacy_value,
        poi_type: r.poi_type,
        matrix_id: r.matrix_id,
      })),
    })),
    first_matrix_id: sfRows[0]?.matrix_id || null,
    first_poi: sfRows[0]
      ? {
          city_zh: sfRows[0].city_zh,
          legacy_value: sfRows[0].legacy_value,
          matrix_id: sfRows[0].matrix_id,
        }
      : null,
    us_country_total: usRows.length,
    us_cities: [...new Set(usRows.map((r) => r.city_zh))],
  };

  return {
    advancement_rule: 'Scope → Country → City → POI · acceptance = City CLOSED → Country Runtime',
    ops_hierarchy: ['asset_family', 'country', 'city', 'asset'],
    acceptance_unit: 'city',
    template_countries: ['JP', 'KR', 'TH', 'SG', 'FR'],
    jp_country_closed_ssot: 'evidence/GO_cms_operation/CMS-JP-COUNTRY-CLOSURE-LATEST.json',
    kr_country_closed_ssot: 'evidence/GO_cms_operation/CMS-KR-COUNTRY-CLOSURE-LATEST.json',
    th_country_closed_ssot: 'evidence/GO_cms_operation/CMS-TH-COUNTRY-CLOSURE-LATEST.json',
    sg_country_closed_ssot: 'evidence/GO_cms_operation/CMS-SG-COUNTRY-CLOSURE-LATEST.json',
    fr_country_closed_ssot: 'evidence/GO_cms_operation/CMS-FR-COUNTRY-CLOSURE-LATEST.json',
    active_wave: wave6.wave_id,
    active_catalog_build: wave6,
    waves: [wave6],
    us_denominator: {
      country_iso: 'US',
      cities: wave6.us_cities,
      poi_total: usRows.length,
      san_francisco_pilot: sfRows.length,
    },
    roadmap: [
      { stage: 'jp_country', status: 'CLOSED', ssot: 'CMS-JP-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'kr_country', status: 'CLOSED', ssot: 'CMS-KR-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'th_country', status: 'CLOSED', ssot: 'CMS-TH-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'sg_country', status: 'CLOSED', ssot: 'CMS-SG-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'fr_country', status: 'CLOSED', ssot: 'CMS-FR-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'us_scope', status: 'LOCKED' },
      { stage: 'catalog_build', status: 'ACTIVE', city: '旧金山', acceptance: '旧金山 CLOSED' },
      { stage: 'us_san_francisco_execution', status: 'ACTIVE' },
      { stage: 'us_country_runtime', status: 'NOT_STARTED', when: 'TT_CMS_US_COUNTRY: CLOSED' },
    ],
  };
}

module.exports = {
  WAVE_6_US_PILOT,
  US_CITY_ORDER,
  buildUsPilotWaves,
};
