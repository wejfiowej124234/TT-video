/**
 * POI Wave 7 · AU · 悉尼 Golden Template（JP/KR/TH/SG/FR/US Country CLOSED 六模板同源）
 */
const { rowsForCountryCity, rowsForCountry } = require('./cms-poi-pilot-waves.cjs');

const WAVE_7_AU_PILOT = {
  wave_id: 'POI-WAVE-7-AU-PILOT',
  label: 'Pilot · AU · 悉尼',
  country_iso: 'AU',
  country_zh: '澳大利亚',
  cities: ['悉尼'],
  acceptance_unit: 'city',
  acceptance_target: '悉尼 CLOSED',
  purpose:
    'Catalog Build → per-POI Review → Live · JP/KR/TH/SG/FR Golden Template 复制 · pilot done when 悉尼 CLOSED',
  forbidden: ['bulk_ingest_au_all', 'skip_pilot_before_next_city', 'accept_by_poi_count'],
  template_countries: ['JP', 'KR', 'TH', 'SG', 'FR', 'US'],
  template_closure: [
    'evidence/GO_cms_operation/CMS-JP-COUNTRY-CLOSURE-LATEST.json',
    'evidence/GO_cms_operation/CMS-KR-COUNTRY-CLOSURE-LATEST.json',
    'evidence/GO_cms_operation/CMS-TH-COUNTRY-CLOSURE-LATEST.json',
    'evidence/GO_cms_operation/CMS-SG-COUNTRY-CLOSURE-LATEST.json',
    'evidence/GO_cms_operation/CMS-FR-COUNTRY-CLOSURE-LATEST.json',
    'evidence/GO_cms_operation/CMS-US-COUNTRY-CLOSURE-LATEST.json',
  ],
};

const AU_CITY_ORDER = ['悉尼', '墨尔本', '黄金海岸'];

function buildAuPilotWaves(scope) {
  const { rows } = scope;
  const auRows = rowsForCountry(rows, 'AU');
  const sydRows = rowsForCountryCity(rows, 'AU', '悉尼');

  const wave7 = {
    ...WAVE_7_AU_PILOT,
    status: 'ACTIVE',
    catalog_build: true,
    matrix_ids: sydRows.map((r) => r.matrix_id),
    poi_count: sydRows.length,
    by_city: AU_CITY_ORDER.map((city) => ({
      city_zh: city,
      acceptance_unit: 'city',
      acceptance_target: `${city} CLOSED`,
      poi_count: rowsForCountryCity(rows, 'AU', city).length,
      matrix_ids: rowsForCountryCity(rows, 'AU', city).map((r) => r.matrix_id),
      pois: rowsForCountryCity(rows, 'AU', city).map((r) => ({
        legacy_value: r.legacy_value,
        poi_type: r.poi_type,
        matrix_id: r.matrix_id,
      })),
    })),
    first_matrix_id: sydRows[0]?.matrix_id || null,
    first_poi: sydRows[0]
      ? {
          city_zh: sydRows[0].city_zh,
          legacy_value: sydRows[0].legacy_value,
          matrix_id: sydRows[0].matrix_id,
        }
      : null,
    au_country_total: auRows.length,
    au_cities: [...new Set(auRows.map((r) => r.city_zh))],
  };

  return {
    advancement_rule: 'Scope → Country → City → POI · acceptance = City CLOSED → Country Runtime',
    ops_hierarchy: ['asset_family', 'country', 'city', 'asset'],
    acceptance_unit: 'city',
    template_countries: ['JP', 'KR', 'TH', 'SG', 'FR', 'US'],
    jp_country_closed_ssot: 'evidence/GO_cms_operation/CMS-JP-COUNTRY-CLOSURE-LATEST.json',
    kr_country_closed_ssot: 'evidence/GO_cms_operation/CMS-KR-COUNTRY-CLOSURE-LATEST.json',
    th_country_closed_ssot: 'evidence/GO_cms_operation/CMS-TH-COUNTRY-CLOSURE-LATEST.json',
    sg_country_closed_ssot: 'evidence/GO_cms_operation/CMS-SG-COUNTRY-CLOSURE-LATEST.json',
    fr_country_closed_ssot: 'evidence/GO_cms_operation/CMS-FR-COUNTRY-CLOSURE-LATEST.json',
    active_wave: wave7.wave_id,
    active_catalog_build: wave7,
    waves: [wave7],
    au_denominator: {
      country_iso: 'AU',
      cities: wave7.au_cities,
      poi_total: auRows.length,
      sydney_pilot: sydRows.length,
    },
    roadmap: [
      { stage: 'jp_country', status: 'CLOSED', ssot: 'CMS-JP-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'kr_country', status: 'CLOSED', ssot: 'CMS-KR-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'th_country', status: 'CLOSED', ssot: 'CMS-TH-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'sg_country', status: 'CLOSED', ssot: 'CMS-SG-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'fr_country', status: 'CLOSED', ssot: 'CMS-FR-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'us_country', status: 'CLOSED', ssot: 'CMS-US-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'au_scope', status: 'LOCKED' },
      { stage: 'catalog_build', status: 'ACTIVE', city: '悉尼', acceptance: '悉尼 CLOSED' },
      { stage: 'au_sydney_execution', status: 'ACTIVE' },
      { stage: 'au_country_runtime', status: 'NOT_STARTED', when: 'TT_CMS_AU_COUNTRY: CLOSED' },
    ],
  };
}

module.exports = {
  WAVE_7_AU_PILOT,
  AU_CITY_ORDER,
  buildAuPilotWaves,
};
