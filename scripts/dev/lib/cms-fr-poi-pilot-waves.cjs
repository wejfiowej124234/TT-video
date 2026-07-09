/**
 * POI Wave 5 · FR · 巴黎 Golden Template（JP + KR + TH + SG Country CLOSED 四模板同源）
 */
const { rowsForCountryCity, rowsForCountry } = require('./cms-poi-pilot-waves.cjs');

const WAVE_5_FR_PILOT = {
  wave_id: 'POI-WAVE-5-FR-PILOT',
  label: 'Pilot · FR · 巴黎',
  country_iso: 'FR',
  country_zh: '法国',
  cities: ['巴黎'],
  acceptance_unit: 'city',
  acceptance_target: '巴黎 CLOSED',
  purpose:
    'Catalog Build → per-POI Review → Live · JP/KR/TH/SG Golden Template 复制 · pilot done when 巴黎 CLOSED',
  forbidden: ['bulk_ingest_fr_all', 'skip_pilot_before_next_city', 'accept_by_poi_count'],
  template_countries: ['JP', 'KR', 'TH', 'SG'],
  template_closure: [
    'evidence/GO_cms_operation/CMS-JP-COUNTRY-CLOSURE-LATEST.json',
    'evidence/GO_cms_operation/CMS-KR-COUNTRY-CLOSURE-LATEST.json',
    'evidence/GO_cms_operation/CMS-TH-COUNTRY-CLOSURE-LATEST.json',
    'evidence/GO_cms_operation/CMS-SG-COUNTRY-CLOSURE-LATEST.json',
  ],
};

function buildFrPilotWaves(scope) {
  const { rows } = scope;
  const frRows = rowsForCountry(rows, 'FR');
  const parisRows = rowsForCountryCity(rows, 'FR', '巴黎');

  const wave5 = {
    ...WAVE_5_FR_PILOT,
    status: 'ACTIVE',
    catalog_build: true,
    matrix_ids: parisRows.map((r) => r.matrix_id),
    poi_count: parisRows.length,
    by_city: ['巴黎', '里昂', '尼斯'].map((city) => ({
      city_zh: city,
      acceptance_unit: 'city',
      acceptance_target: `${city} CLOSED`,
      poi_count: rowsForCountryCity(rows, 'FR', city).length,
      matrix_ids: rowsForCountryCity(rows, 'FR', city).map((r) => r.matrix_id),
      pois: rowsForCountryCity(rows, 'FR', city).map((r) => ({
        legacy_value: r.legacy_value,
        poi_type: r.poi_type,
        matrix_id: r.matrix_id,
      })),
    })),
    first_matrix_id: parisRows[0]?.matrix_id || null,
    first_poi: parisRows[0]
      ? {
          city_zh: parisRows[0].city_zh,
          legacy_value: parisRows[0].legacy_value,
          matrix_id: parisRows[0].matrix_id,
        }
      : null,
    fr_country_total: frRows.length,
    fr_cities: [...new Set(frRows.map((r) => r.city_zh))],
  };

  return {
    advancement_rule: 'Scope → Country → City → POI · acceptance = City CLOSED → Country Runtime',
    ops_hierarchy: ['asset_family', 'country', 'city', 'asset'],
    acceptance_unit: 'city',
    template_countries: ['JP', 'KR', 'TH', 'SG'],
    jp_country_closed_ssot: 'evidence/GO_cms_operation/CMS-JP-COUNTRY-CLOSURE-LATEST.json',
    kr_country_closed_ssot: 'evidence/GO_cms_operation/CMS-KR-COUNTRY-CLOSURE-LATEST.json',
    th_country_closed_ssot: 'evidence/GO_cms_operation/CMS-TH-COUNTRY-CLOSURE-LATEST.json',
    sg_country_closed_ssot: 'evidence/GO_cms_operation/CMS-SG-COUNTRY-CLOSURE-LATEST.json',
    active_wave: wave5.wave_id,
    active_catalog_build: wave5,
    waves: [wave5],
    fr_denominator: {
      country_iso: 'FR',
      cities: wave5.fr_cities,
      poi_total: frRows.length,
      paris_pilot: parisRows.length,
    },
    roadmap: [
      { stage: 'jp_country', status: 'CLOSED', ssot: 'CMS-JP-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'kr_country', status: 'CLOSED', ssot: 'CMS-KR-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'th_country', status: 'CLOSED', ssot: 'CMS-TH-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'sg_country', status: 'CLOSED', ssot: 'CMS-SG-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'fr_scope', status: 'LOCKED' },
      { stage: 'catalog_build', status: 'ACTIVE', city: '巴黎', acceptance: '巴黎 CLOSED' },
      { stage: 'fr_paris_execution', status: 'ACTIVE' },
      { stage: 'fr_country_runtime', status: 'NOT_STARTED', when: 'TT_CMS_FR_COUNTRY: CLOSED' },
    ],
  };
}

module.exports = {
  WAVE_5_FR_PILOT,
  buildFrPilotWaves,
};
