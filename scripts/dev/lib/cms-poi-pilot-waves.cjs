/**
 * POI catalog scope helpers · internal sequencing only (deprecated ops language: Wave 1/2/3)
 */
const AMBIENT_COUNTRY_ORDER = ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU', 'ES', 'AE', 'CN'];

/** Wave 1 pilot · validate Catalog → CMS → page → Evidence → Daily Board · acceptance = City CLOSED */
const WAVE_1_PILOT = {
  wave_id: 'POI-WAVE-1-PILOT',
  label: 'Pilot · JP · 东京',
  country_iso: 'JP',
  country_zh: '日本',
  cities: ['东京'],
  acceptance_unit: 'city',
  acceptance_target: '东京 CLOSED',
  purpose:
    'Catalog Build → per-POI Review → Live · validate pipeline · pilot done when 东京 CLOSED (not "9 POIs")',
  forbidden: ['bulk_ingest_330', 'skip_pilot_before_wave_2', 'accept_by_poi_count'],
};

function rowsForCountryCity(scopeRows, countryIso, cityZh) {
  return scopeRows.filter((r) => r.country_iso === countryIso && r.city_zh === cityZh);
}

function rowsForCountry(scopeRows, countryIso) {
  return scopeRows.filter((r) => r.country_iso === countryIso);
}

function buildPilotWaves(scope) {
  const { rows, product_countries: productCountries } = scope;
  const countryOrder = AMBIENT_COUNTRY_ORDER.map((iso) => productCountries.find((c) => c.iso === iso)).filter(Boolean);

  const wave1Rows = WAVE_1_PILOT.cities.flatMap((city) => rowsForCountryCity(rows, WAVE_1_PILOT.country_iso, city));
  const wave1 = {
    ...WAVE_1_PILOT,
    status: 'ACTIVE',
    catalog_build: true,
    matrix_ids: wave1Rows.map((r) => r.matrix_id),
    poi_count: wave1Rows.length,
    by_city: WAVE_1_PILOT.cities.map((city) => ({
      city_zh: city,
      acceptance_unit: 'city',
      acceptance_target: `${city} CLOSED`,
      poi_count: rowsForCountryCity(rows, WAVE_1_PILOT.country_iso, city).length,
      matrix_ids: rowsForCountryCity(rows, WAVE_1_PILOT.country_iso, city).map((r) => r.matrix_id),
      pois: rowsForCountryCity(rows, WAVE_1_PILOT.country_iso, city).map((r) => ({
        legacy_value: r.legacy_value,
        poi_type: r.poi_type,
        matrix_id: r.matrix_id,
      })),
    })),
    first_matrix_id: wave1Rows[0]?.matrix_id || null,
    first_poi: wave1Rows[0]
      ? { city_zh: wave1Rows[0].city_zh, legacy_value: wave1Rows[0].legacy_value, matrix_id: wave1Rows[0].matrix_id }
      : null,
  };

  const krRows = rowsForCountry(rows, 'KR');
  const wave2 = {
    wave_id: 'POI-WAVE-2',
    label: 'Wave 2 · KR · 全量',
    country_iso: 'KR',
    country_zh: '韩国',
    status: 'NOT_STARTED',
    after: 'POI-WAVE-1-PILOT pipeline validated',
    cities: [...new Set(krRows.map((r) => r.city_zh))],
    matrix_ids: krRows.map((r) => r.matrix_id),
    poi_count: krRows.length,
  };

  const wave3Countries = countryOrder.filter((c) => !['JP', 'KR'].includes(c.iso));
  const wave3Rows = wave3Countries.flatMap((c) => rowsForCountry(rows, c.iso));
  const wave3 = {
    wave_id: 'POI-WAVE-3-PLUS',
    label: 'Wave 3+ · TH → SG → FR → US → AU → ES → AE → CN',
    status: 'NOT_STARTED',
    after: 'POI-WAVE-2 complete',
    countries: wave3Countries.map((c) => ({
      country_iso: c.iso,
      country_zh: c.country_zh,
      poi_count: rowsForCountry(rows, c.iso).length,
    })),
    matrix_ids: wave3Rows.map((r) => r.matrix_id),
    poi_count: wave3Rows.length,
  };

  const activeCatalogBuild = wave1;

  return {
    advancement_rule: 'Scope → Country → City → POI · acceptance = City CLOSED',
    ops_hierarchy: ['asset_family', 'country', 'city', 'asset'],
    acceptance_unit: 'city',
    full_scope_denominator: scope.denominator.total,
    catalog_build_not_bulk: true,
    forbidden: ['ingest_all_330_on_day_one', 'poi_upload_before_pilot_catalog_build'],
    active_wave: wave1.wave_id,
    active_catalog_build: activeCatalogBuild,
    waves: [wave1, wave2, wave3],
    roadmap: [
      { stage: 'destination_ambient', status: 'CLOSED' },
      { stage: 'poi_scope', status: 'LOCKED', denominator: scope.denominator.total },
      { stage: 'catalog_build', status: 'ACTIVE', city: '东京', acceptance: '东京 CLOSED' },
      { stage: 'poi_wave_1', status: 'ACTIVE', note: 'Pilot · per-POI loop · city CLOSED = wave milestone' },
      { stage: 'poi_wave_2', status: 'NOT_STARTED', country_iso: 'KR' },
      { stage: 'poi_wave_3_plus', status: 'NOT_STARTED' },
      { stage: 'poi_closed', status: 'NOT_STARTED', target: `${scope.denominator.total}/${scope.denominator.total}` },
      { stage: 'hotel', status: 'NOT_STARTED' },
      { stage: 'transport', status: 'NOT_STARTED' },
      { stage: 'listing', status: 'NOT_STARTED' },
    ],
  };
}

module.exports = {
  AMBIENT_COUNTRY_ORDER,
  WAVE_1_PILOT,
  buildPilotWaves,
  rowsForCountryCity,
  rowsForCountry,
};
