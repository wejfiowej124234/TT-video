/**
 * POI Wave 4 · SG · 新加坡 Golden Template（JP + KR + TH Country CLOSED 三模板同源）
 */
const { rowsForCountryCity, rowsForCountry } = require('./cms-poi-pilot-waves.cjs');

const WAVE_4_SG_PILOT = {
  wave_id: 'POI-WAVE-4-SG-PILOT',
  label: 'Pilot · SG · 新加坡',
  country_iso: 'SG',
  country_zh: '新加坡',
  cities: ['新加坡'],
  acceptance_unit: 'city',
  acceptance_target: '新加坡 CLOSED',
  purpose:
    'Catalog Build → per-POI Review → Live · JP/KR/TH Golden Template 复制 · pilot done when 新加坡 CLOSED',
  forbidden: ['bulk_ingest_sg_all', 'skip_pilot_before_country_runtime', 'accept_by_poi_count'],
  template_countries: ['JP', 'KR', 'TH'],
  template_closure: [
    'evidence/GO_cms_operation/CMS-JP-COUNTRY-CLOSURE-LATEST.json',
    'evidence/GO_cms_operation/CMS-KR-COUNTRY-CLOSURE-LATEST.json',
    'evidence/GO_cms_operation/CMS-TH-COUNTRY-CLOSURE-LATEST.json',
  ],
};

function buildSgPilotWaves(scope) {
  const { rows } = scope;
  const sgRows = rowsForCountry(rows, 'SG');
  const singaporeRows = rowsForCountryCity(rows, 'SG', '新加坡');

  const wave4 = {
    ...WAVE_4_SG_PILOT,
    status: 'ACTIVE',
    catalog_build: true,
    matrix_ids: singaporeRows.map((r) => r.matrix_id),
    poi_count: singaporeRows.length,
    by_city: WAVE_4_SG_PILOT.cities.map((city) => ({
      city_zh: city,
      acceptance_unit: 'city',
      acceptance_target: `${city} CLOSED`,
      poi_count: rowsForCountryCity(rows, 'SG', city).length,
      matrix_ids: rowsForCountryCity(rows, 'SG', city).map((r) => r.matrix_id),
      pois: rowsForCountryCity(rows, 'SG', city).map((r) => ({
        legacy_value: r.legacy_value,
        poi_type: r.poi_type,
        matrix_id: r.matrix_id,
      })),
    })),
    first_matrix_id: singaporeRows[0]?.matrix_id || null,
    first_poi: singaporeRows[0]
      ? {
          city_zh: singaporeRows[0].city_zh,
          legacy_value: singaporeRows[0].legacy_value,
          matrix_id: singaporeRows[0].matrix_id,
        }
      : null,
    sg_country_total: sgRows.length,
    sg_cities: [...new Set(sgRows.map((r) => r.city_zh))],
  };

  return {
    advancement_rule: 'Scope → Country → City → POI · acceptance = City CLOSED → Country Runtime',
    ops_hierarchy: ['asset_family', 'country', 'city', 'asset'],
    acceptance_unit: 'city',
    template_countries: ['JP', 'KR', 'TH'],
    jp_country_closed_ssot: 'evidence/GO_cms_operation/CMS-JP-COUNTRY-CLOSURE-LATEST.json',
    kr_country_closed_ssot: 'evidence/GO_cms_operation/CMS-KR-COUNTRY-CLOSURE-LATEST.json',
    th_country_closed_ssot: 'evidence/GO_cms_operation/CMS-TH-COUNTRY-CLOSURE-LATEST.json',
    active_wave: wave4.wave_id,
    active_catalog_build: wave4,
    waves: [wave4],
    sg_denominator: {
      country_iso: 'SG',
      cities: wave4.sg_cities,
      poi_total: sgRows.length,
      singapore_pilot: singaporeRows.length,
    },
    roadmap: [
      { stage: 'jp_country', status: 'CLOSED', ssot: 'CMS-JP-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'kr_country', status: 'CLOSED', ssot: 'CMS-KR-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'th_country', status: 'CLOSED', ssot: 'CMS-TH-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'sg_scope', status: 'LOCKED' },
      { stage: 'catalog_build', status: 'ACTIVE', city: '新加坡', acceptance: '新加坡 CLOSED' },
      { stage: 'sg_singapore_execution', status: 'ACTIVE' },
      { stage: 'sg_singapore_content_qa', status: 'NOT_STARTED' },
      { stage: 'sg_country_runtime', status: 'NOT_STARTED', when: 'TT_CMS_SG_COUNTRY: CLOSED' },
    ],
  };
}

module.exports = {
  WAVE_4_SG_PILOT,
  buildSgPilotWaves,
};
