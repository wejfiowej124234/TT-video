/**
 * POI Wave 3 · TH · 曼谷 Golden Template（JP + KR Country CLOSED 双模板同源）
 */
const { rowsForCountryCity, rowsForCountry } = require('./cms-poi-pilot-waves.cjs');

const WAVE_3_TH_PILOT = {
  wave_id: 'POI-WAVE-3-TH-PILOT',
  label: 'Pilot · TH · 曼谷',
  country_iso: 'TH',
  country_zh: '泰国',
  cities: ['曼谷'],
  acceptance_unit: 'city',
  acceptance_target: '曼谷 CLOSED',
  purpose:
    'Catalog Build → per-POI Review → Live · JP/KR Golden Template 复制 · pilot done when 曼谷 CLOSED',
  forbidden: ['bulk_ingest_th_all', 'skip_pilot_before_next_city', 'accept_by_poi_count'],
  template_countries: ['JP', 'KR'],
  template_closure: [
    'evidence/GO_cms_operation/CMS-JP-COUNTRY-CLOSURE-LATEST.json',
    'evidence/GO_cms_operation/CMS-KR-COUNTRY-CLOSURE-LATEST.json',
  ],
};

function buildThPilotWaves(scope) {
  const { rows } = scope;
  const thRows = rowsForCountry(rows, 'TH');
  const bangkokRows = rowsForCountryCity(rows, 'TH', '曼谷');

  const wave3 = {
    ...WAVE_3_TH_PILOT,
    status: 'ACTIVE',
    catalog_build: true,
    matrix_ids: bangkokRows.map((r) => r.matrix_id),
    poi_count: bangkokRows.length,
    by_city: WAVE_3_TH_PILOT.cities.map((city) => ({
      city_zh: city,
      acceptance_unit: 'city',
      acceptance_target: `${city} CLOSED`,
      poi_count: rowsForCountryCity(rows, 'TH', city).length,
      matrix_ids: rowsForCountryCity(rows, 'TH', city).map((r) => r.matrix_id),
      pois: rowsForCountryCity(rows, 'TH', city).map((r) => ({
        legacy_value: r.legacy_value,
        poi_type: r.poi_type,
        matrix_id: r.matrix_id,
      })),
    })),
    first_matrix_id: bangkokRows[0]?.matrix_id || null,
    first_poi: bangkokRows[0]
      ? {
          city_zh: bangkokRows[0].city_zh,
          legacy_value: bangkokRows[0].legacy_value,
          matrix_id: bangkokRows[0].matrix_id,
        }
      : null,
    th_country_total: thRows.length,
    th_cities: [...new Set(thRows.map((r) => r.city_zh))],
  };

  return {
    advancement_rule: 'Scope → Country → City → POI · acceptance = City CLOSED',
    ops_hierarchy: ['asset_family', 'country', 'city', 'asset'],
    acceptance_unit: 'city',
    template_countries: ['JP', 'KR'],
    jp_country_closed_ssot: 'evidence/GO_cms_operation/CMS-JP-COUNTRY-CLOSURE-LATEST.json',
    kr_country_closed_ssot: 'evidence/GO_cms_operation/CMS-KR-COUNTRY-CLOSURE-LATEST.json',
    active_wave: wave3.wave_id,
    active_catalog_build: wave3,
    waves: [wave3],
    th_denominator: {
      country_iso: 'TH',
      cities: wave3.th_cities,
      poi_total: thRows.length,
      bangkok_pilot: bangkokRows.length,
    },
    roadmap: [
      { stage: 'jp_country', status: 'CLOSED', ssot: 'CMS-JP-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'kr_country', status: 'CLOSED', ssot: 'CMS-KR-COUNTRY-CLOSURE-LATEST.json' },
      { stage: 'th_scope', status: 'LOCKED' },
      { stage: 'catalog_build', status: 'ACTIVE', city: '曼谷', acceptance: '曼谷 CLOSED' },
      { stage: 'th_bangkok_execution', status: 'ACTIVE' },
      { stage: 'th_bangkok_content_qa', status: 'NOT_STARTED' },
      { stage: 'th_country_runtime', status: 'NOT_STARTED', when: 'TT_CMS_TH_COUNTRY: CLOSED' },
    ],
  };
}

module.exports = {
  WAVE_3_TH_PILOT,
  buildThPilotWaves,
};
