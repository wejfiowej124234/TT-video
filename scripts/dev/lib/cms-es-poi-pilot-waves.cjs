/**
 * POI Wave 8 · ES · 巴塞罗那 Golden Template（JP/KR/TH/SG/FR/US/AU Country CLOSED 七模板同源）
 */
const { rowsForCountryCity, rowsForCountry } = require('./cms-poi-pilot-waves.cjs');

const WAVE_8_ES_PILOT = {
  wave_id: 'POI-WAVE-8-ES-PILOT',
  label: 'Pilot · ES · 巴塞罗那',
  country_iso: 'ES',
  country_zh: '西班牙',
  cities: ['巴塞罗那'],
  acceptance_unit: 'city',
  acceptance_target: '巴塞罗那 CLOSED',
  purpose:
    'Catalog Build → per-POI Review → Live · JP/KR/TH/SG/FR/US/AU Golden Template 复制 · pilot done when 巴塞罗那 CLOSED',
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

const ES_CITY_ORDER = ['巴塞罗那', '马德里', '塞维利亚'];

function buildEsPilotWaves(scope) {
  const { rows } = scope;
  const esRows = rowsForCountry(rows, 'ES');
  const bcnRows = rowsForCountryCity(rows, 'ES', '巴塞罗那');

  const wave8 = {
    ...WAVE_8_ES_PILOT,
    status: 'ACTIVE',
    catalog_build: true,
    matrix_ids: bcnRows.map((r) => r.matrix_id),
    poi_count: bcnRows.length,
    by_city: ES_CITY_ORDER.map((city) => ({
      city_zh: city,
      acceptance_unit: 'city',
      acceptance_target: `${city} CLOSED`,
      poi_count: rowsForCountryCity(rows, 'ES', city).length,
      matrix_ids: rowsForCountryCity(rows, 'ES', city).map((r) => r.matrix_id),
      pois: rowsForCountryCity(rows, 'ES', city).map((r) => ({
        legacy_value: r.legacy_value,
        poi_type: r.poi_type,
        matrix_id: r.matrix_id,
      })),
    })),
    first_matrix_id: bcnRows[0]?.matrix_id || null,
    first_poi: bcnRows[0]
      ? {
          city_zh: bcnRows[0].city_zh,
          legacy_value: bcnRows[0].legacy_value,
          matrix_id: bcnRows[0].matrix_id,
        }
      : null,
    es_country_total: esRows.length,
    es_cities: [...new Set(esRows.map((r) => r.city_zh))],
  };

  return {
    advancement_rule: 'Scope → Country → City → POI · acceptance = City CLOSED → Country Runtime',
    ops_hierarchy: ['asset_family', 'country', 'city', 'asset'],
    acceptance_unit: 'city',
    template_countries: ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU'],
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
    es_denominator: {
      country_iso: 'ES',
      cities: wave8.es_cities,
      poi_total: esRows.length,
      barcelona_pilot: bcnRows.length,
    },
    roadmap: [
      { stage: 'jp_country', status: 'CLOSED', ssot: 'CMS-JP-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'kr_country', status: 'CLOSED', ssot: 'CMS-KR-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'th_country', status: 'CLOSED', ssot: 'CMS-TH-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'sg_country', status: 'CLOSED', ssot: 'CMS-SG-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'fr_country', status: 'CLOSED', ssot: 'CMS-FR-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'us_country', status: 'CLOSED', ssot: 'CMS-US-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'au_country', status: 'CLOSED', ssot: 'CMS-AU-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'es_scope', status: 'LOCKED' },
      { stage: 'catalog_build', status: 'ACTIVE', city: '巴塞罗那', acceptance: '巴塞罗那 CLOSED' },
      { stage: 'es_barcelona_execution', status: 'ACTIVE' },
      { stage: 'es_country_runtime', status: 'NOT_STARTED', when: 'TT_CMS_ES_COUNTRY: CLOSED' },
    ],
  };
}

module.exports = {
  WAVE_8_ES_PILOT,
  ES_CITY_ORDER,
  buildEsPilotWaves,
};
