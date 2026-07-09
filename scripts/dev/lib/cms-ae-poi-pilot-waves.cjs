/**
 * POI Wave 8 · ES · 阿布扎比 Golden Template（JP/KR/TH/SG/FR/US/AU Country CLOSED 七模板同源）
 */
const { rowsForCountryCity, rowsForCountry } = require('./cms-poi-pilot-waves.cjs');

const WAVE_9_AE_PILOT = {
  wave_id: 'POI-WAVE-9-AE-PILOT',
  label: 'Pilot · ES · 阿布扎比',
  country_iso: 'AE',
  country_zh: '阿联酋',
  cities: ['阿布扎比'],
  acceptance_unit: 'city',
  acceptance_target: '阿布扎比 CLOSED',
  purpose:
    'Catalog Build → per-POI Review → Live · JP/KR/TH/SG/FR/US/AU Golden Template 复制 · pilot done when 阿布扎比 CLOSED',
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

const AE_CITY_ORDER = ['阿布扎比', '迪拜', '沙迦'];

function buildAePilotWaves(scope) {
  const { rows } = scope;
  const aeRows = rowsForCountry(rows, 'AE');
  const auhRows = rowsForCountryCity(rows, 'AE', '阿布扎比');

  const wave8 = {
    ...WAVE_9_AE_PILOT,
    status: 'ACTIVE',
    catalog_build: true,
    matrix_ids: auhRows.map((r) => r.matrix_id),
    poi_count: auhRows.length,
    by_city: AE_CITY_ORDER.map((city) => ({
      city_zh: city,
      acceptance_unit: 'city',
      acceptance_target: `${city} CLOSED`,
      poi_count: rowsForCountryCity(rows, 'AE', city).length,
      matrix_ids: rowsForCountryCity(rows, 'AE', city).map((r) => r.matrix_id),
      pois: rowsForCountryCity(rows, 'AE', city).map((r) => ({
        legacy_value: r.legacy_value,
        poi_type: r.poi_type,
        matrix_id: r.matrix_id,
      })),
    })),
    first_matrix_id: auhRows[0]?.matrix_id || null,
    first_poi: auhRows[0]
      ? {
          city_zh: auhRows[0].city_zh,
          legacy_value: auhRows[0].legacy_value,
          matrix_id: auhRows[0].matrix_id,
        }
      : null,
    es_country_total: aeRows.length,
    es_cities: [...new Set(aeRows.map((r) => r.city_zh))],
  };

  return {
    advancement_rule: 'Scope → Country → City → POI · acceptance = City CLOSED → Country Runtime',
    ops_hierarchy: ['asset_family', 'country', 'city', 'asset'],
    acceptance_unit: 'city',
    template_countries: ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU', 'ES'],
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
    ae_denominator: {
      country_iso: 'AE',
      cities: wave8.es_cities,
      poi_total: aeRows.length,
      abu_dhabi_pilot: auhRows.length,
    },
    roadmap: [
      { stage: 'jp_country', status: 'CLOSED', ssot: 'CMS-JP-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'kr_country', status: 'CLOSED', ssot: 'CMS-KR-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'th_country', status: 'CLOSED', ssot: 'CMS-TH-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'sg_country', status: 'CLOSED', ssot: 'CMS-SG-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'fr_country', status: 'CLOSED', ssot: 'CMS-FR-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'us_country', status: 'CLOSED', ssot: 'CMS-US-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'au_country', status: 'CLOSED', ssot: 'CMS-AU-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'ae_scope', status: 'LOCKED' },
      { stage: 'catalog_build', status: 'ACTIVE', city: '阿布扎比', acceptance: '阿布扎比 CLOSED' },
      { stage: 'ae_abu_dhabi_execution', status: 'ACTIVE' },
      { stage: 'ae_country_runtime', status: 'NOT_STARTED', when: 'TT_CMS_AE_COUNTRY: CLOSED' },
    ],
  };
}

module.exports = {
  WAVE_9_AE_PILOT,
  AE_CITY_ORDER,
  buildAePilotWaves,
};
