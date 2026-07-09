/**
 * POI Wave 8 · ES · 北京 Golden Template（JP/KR/TH/SG/FR/US/AU Country CLOSED 七模板同源）
 */
const { rowsForCountryCity, rowsForCountry } = require('./cms-poi-pilot-waves.cjs');

const WAVE_10_CN_PILOT = {
  wave_id: 'POI-WAVE-10-CN-PILOT',
  label: 'Pilot · ES · 北京',
  country_iso: 'CN',
  country_zh: '中国',
  cities: ['北京'],
  acceptance_unit: 'city',
  acceptance_target: '北京 CLOSED',
  purpose:
    'Catalog Build → per-POI Review → Live · JP/KR/TH/SG/FR/US/AU Golden Template 复制 · pilot done when 北京 CLOSED',
  forbidden: ['bulk_ingest_es_all', 'skip_pilot_before_next_city', 'accept_by_poi_count'],
  template_countries: ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU'],
  template_closure: [
    'evidence/GO_cms_operation/CMS-JP-COUNTRY-CLOSURE-LATEST.json',
    'evidence/GO_cms_operation/CMS-KR-COUNTRY-CLOSURE-LATEST.json',
    'evidence/GO_cms_operation/CMS-TH-COUNTRY-CLOSURE-LATEST.json',
    'evidence/GO_cms_operation/CMS-SG-COUNTRY-CLOSURE-LATEST.json',
    'evidence/GO_cms_operation/CMS-FR-COUNTRY-CLOSURE-LATEST.json',
    'evidence/GO_cms_operation/CMS-US-COUNTRY-CLOSURE-LATEST.json',
    'evidence/GO_cms_operation/CMS-AU-COUNTRY-CLOSURE-LATEST.json',
  ],
};

const CN_CITY_ORDER = ['北京', '上海', '广州', '成都', '杭州', '西安', '厦门', '青岛', '大理'];

function buildCnPilotWaves(scope) {
  const { rows } = scope;
  const cnRows = rowsForCountry(rows, 'CN');
  const bjRows = rowsForCountryCity(rows, 'CN', '北京');

  const wave8 = {
    ...WAVE_10_CN_PILOT,
    status: 'ACTIVE',
    catalog_build: true,
    matrix_ids: bjRows.map((r) => r.matrix_id),
    poi_count: bjRows.length,
    by_city: CN_CITY_ORDER.map((city) => ({
      city_zh: city,
      acceptance_unit: 'city',
      acceptance_target: `${city} CLOSED`,
      poi_count: rowsForCountryCity(rows, 'CN', city).length,
      matrix_ids: rowsForCountryCity(rows, 'CN', city).map((r) => r.matrix_id),
      pois: rowsForCountryCity(rows, 'CN', city).map((r) => ({
        legacy_value: r.legacy_value,
        poi_type: r.poi_type,
        matrix_id: r.matrix_id,
      })),
    })),
    first_matrix_id: bjRows[0]?.matrix_id || null,
    first_poi: bjRows[0]
      ? {
          city_zh: bjRows[0].city_zh,
          legacy_value: bjRows[0].legacy_value,
          matrix_id: bjRows[0].matrix_id,
        }
      : null,
    es_country_total: cnRows.length,
    es_cities: [...new Set(cnRows.map((r) => r.city_zh))],
  };

  return {
    advancement_rule: 'Scope → Country → City → POI · acceptance = City CLOSED → Country Runtime',
    ops_hierarchy: ['asset_family', 'country', 'city', 'asset'],
    acceptance_unit: 'city',
    template_countries: ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU', 'ES', 'AE'],
    jp_country_closed_ssot: 'evidence/GO_cms_operation/CMS-JP-COUNTRY-CLOSURE-LATEST.json',
    kr_country_closed_ssot: 'evidence/GO_cms_operation/CMS-KR-COUNTRY-CLOSURE-LATEST.json',
    th_country_closed_ssot: 'evidence/GO_cms_operation/CMS-TH-COUNTRY-CLOSURE-LATEST.json',
    sg_country_closed_ssot: 'evidence/GO_cms_operation/CMS-SG-COUNTRY-CLOSURE-LATEST.json',
    fr_country_closed_ssot: 'evidence/GO_cms_operation/CMS-FR-COUNTRY-CLOSURE-LATEST.json',
    us_country_closed_ssot: 'evidence/GO_cms_operation/CMS-US-COUNTRY-CLOSURE-LATEST.json',
    au_country_closed_ssot: 'evidence/GO_cms_operation/CMS-AU-COUNTRY-CLOSURE-LATEST.json',
    active_wave: wave8.wave_id,
    active_catalog_build: wave8,
    waves: [wave8],
    cn_denominator: {
      country_iso: 'CN',
      cities: wave8.es_cities,
      poi_total: cnRows.length,
      beijing_pilot: bjRows.length,
    },
    roadmap: [
      { stage: 'jp_country', status: 'CLOSED', ssot: 'CMS-JP-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'kr_country', status: 'CLOSED', ssot: 'CMS-KR-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'th_country', status: 'CLOSED', ssot: 'CMS-TH-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'sg_country', status: 'CLOSED', ssot: 'CMS-SG-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'fr_country', status: 'CLOSED', ssot: 'CMS-FR-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'us_country', status: 'CLOSED', ssot: 'CMS-US-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'au_country', status: 'CLOSED', ssot: 'CMS-AU-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'cn_scope', status: 'LOCKED' },
      { stage: 'catalog_build', status: 'ACTIVE', city: '北京', acceptance: '北京 CLOSED' },
      { stage: 'cn_beijing_execution', status: 'ACTIVE' },
      { stage: 'cn_country_runtime', status: 'NOT_STARTED', when: 'TT_CMS_CN_COUNTRY: CLOSED' },
    ],
  };
}

module.exports = {
  WAVE_10_CN_PILOT,
  CN_CITY_ORDER,
  buildCnPilotWaves,
};
