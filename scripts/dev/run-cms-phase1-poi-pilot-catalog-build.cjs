#!/usr/bin/env node
/**
 * CMS Phase 1 · POI City Catalog Build (staging ops).
 *
 *   TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE=1 \
 *   API=https://tt-api-staging.fly.dev \
 *     node scripts/dev/run-cms-phase1-poi-pilot-catalog-build.cjs --city-zh 大阪
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const { assertStagingBaselineMutationAuthorized } = require('./lib/staging-rc-baseline-authorize.cjs');
const { resolveActiveCityPilot, resolveCityZhFromArgv, getCityPilot } = require('./lib/cms-poi-city-pilot.cjs');

assertStagingBaselineMutationAuthorized('cms_poi_pilot_catalog_build');

const ROOT = path.join(__dirname, '../..');
const MATRIX = path.join(ROOT, 'data/catalog/poi-hero-matrix.v1.yaml');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const NOW = process.env.CMS_OPS_STAMP_UTC || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

const pilot = resolveCityZhFromArgv() ? getCityPilot(resolveCityZhFromArgv()) : resolveActiveCityPilot();
const INTERIM_IMAGE = `${API}/api/v1/uploads/community-posts/${pilot.interim_image}`;
const PILOT_MATRIX_IDS = pilot.matrix_ids;

function parsePilotRows(text) {
  const rows = [];
  for (const matrixId of PILOT_MATRIX_IDS) {
    const blockRe = new RegExp(`  - matrix_id: ${matrixId}[\\s\\S]*?(?=\\n  - matrix_id:|\\nrows:|$)`);
    const block = text.match(blockRe)?.[0];
    if (!block) throw new Error(`matrix row missing: ${matrixId}`);
    const get = (key) => block.match(new RegExp(`\\n    ${key}: "?([^"\\n]+)"?`))?.[1]?.trim();
    rows.push({
      matrix_id: matrixId,
      country_iso: get('country_iso'),
      city_zh: get('city_zh'),
      poi_type: get('poi_type'),
      legacy_value: get('legacy_value'),
      slug: get('slug'),
      name_zh: get('legacy_value'),
      name_en: get('slug'),
    });
  }
  return rows;
}

async function refreshFromList(client, tok, listUrl, id) {
  const list = await client.req('GET', listUrl, null, tok);
  const row = (list.json?.items || []).find((x) => String(x.id) === String(id));
  if (!row) throw new Error(`refreshFromList missing id=${id} url=${listUrl}`);
  return row;
}

async function workflowPublish(client, tok, { row, submitPath, publishPath, listUrl }) {
  let current = row;
  if (current.publish_status === 'draft') {
    await client.req('POST', submitPath, { version: current.version }, tok);
    current = await refreshFromList(client, tok, listUrl, current.id);
  }
  if (current.publish_status === 'in_review') {
    await client.req('POST', publishPath, { version: current.version }, tok);
    current = await refreshFromList(client, tok, listUrl, current.id);
  }
  return current;
}

async function ensureCountry(client, tok, countryIso) {
  const listUrl = '/api/v1/admin/content/countries?limit=200';
  const list = await client.req('GET', listUrl, null, tok);
  const row = (list.json?.items || []).find((x) => x.iso3166 === countryIso);
  if (!row) throw new Error(`${countryIso} country missing — run ambient wave first`);
  return workflowPublish(client, tok, {
    row,
    submitPath: `/api/v1/admin/content/countries/${row.id}/submit-review`,
    publishPath: `/api/v1/admin/content/countries/${row.id}/publish`,
    listUrl,
  });
}

async function ensureCity(client, tok, countryId, cityPilot) {
  const listUrl = `/api/v1/admin/content/cities?country_id=${countryId}&limit=200`;
  const list = await client.req('GET', listUrl, null, tok);
  let row = (list.json?.items || []).find((x) => x.name_zh === cityPilot.city_zh);
  if (!row) {
    const created = await client.req(
      'POST',
      '/api/v1/admin/content/cities',
      {
        country_id: countryId,
        slug: cityPilot.slug,
        name_zh: cityPilot.city_zh,
        name_en: cityPilot.city_en,
        sort_order: 1,
        open_status: 'open',
        payload: {},
      },
      tok,
    );
    if (created.status !== 200) {
      throw new Error(`create ${cityPilot.city_zh} ${created.status} ${JSON.stringify(created.json)}`);
    }
    row = created.json.item;
  }
  return workflowPublish(client, tok, {
    row,
    submitPath: `/api/v1/admin/content/cities/${row.id}/submit-review`,
    publishPath: `/api/v1/admin/content/cities/${row.id}/publish`,
    listUrl,
  });
}

async function upsertPilotPoi(client, tok, cityId, spec, allSpecs) {
  const listUrl = `/api/v1/admin/content/pois?city_id=${cityId}&limit=300`;
  const list = await client.req('GET', listUrl, null, tok);
  const slug =
    allSpecs.filter((s) => s.legacy_value === spec.legacy_value).length > 1
      ? `${spec.slug}-${spec.poi_type}`
      : spec.slug;
  let row = (list.json?.items || []).find(
    (x) => x.legacy_value === spec.legacy_value && String(x.poi_type || '') === String(spec.poi_type || ''),
  );
  if (!row) {
    const created = await client.req(
      'POST',
      '/api/v1/admin/content/pois',
      {
        city_id: cityId,
        poi_type: spec.poi_type,
        slug,
        name_zh: spec.name_zh,
        name_en: spec.name_en || slug,
        legacy_value: spec.legacy_value,
        sort_order: 0,
        payload: { image_url: INTERIM_IMAGE },
      },
      tok,
    );
    if (created.status !== 200) throw new Error(`${spec.matrix_id} poi ${created.status}`);
    row = created.json.item;
  } else {
    const patched = await client.req(
      'PATCH',
      `/api/v1/admin/content/pois/${row.id}`,
      { version: row.version, payload: { ...(row.payload || {}), image_url: INTERIM_IMAGE } },
      tok,
    );
    if (patched.status !== 200) throw new Error(`${spec.matrix_id} patch ${patched.status}`);
    row = patched.json.item;
  }
  row = await workflowPublish(client, tok, {
    row,
    submitPath: `/api/v1/admin/content/pois/${row.id}/submit-review`,
    publishPath: `/api/v1/admin/content/pois/${row.id}/publish`,
    listUrl,
  });
  return { poi: row };
}

(async () => {
  const matrixText = fs.readFileSync(MATRIX, 'utf8');
  const pilotRows = parsePilotRows(matrixText);
  const client = createClient(API);
  const tok = await client.adminLogin(
    process.env.ADMIN_EMAIL || 'tourist@test.com',
    process.env.ADMIN_PASS || 'Test123!',
  );

  const country = await ensureCountry(client, tok, pilot.country_iso || 'JP');
  const city = await ensureCity(client, tok, country.id, pilot);
  const results = [];

  for (const spec of pilotRows) {
    const r = await upsertPilotPoi(client, tok, city.id, spec, pilotRows);
    results.push({ matrix_id: spec.matrix_id, poi_id: r.poi.id });
    console.log(`OK ${spec.matrix_id} poi=${r.poi.id}`);
  }

  const verify = await client.req(
    'GET',
    `/api/v1/catalog/poi-images?country_iso=${encodeURIComponent(pilot.country_iso || 'JP')}&city=${encodeURIComponent(pilot.city_zh)}&limit=50`,
    null,
    tok,
  );
  const count = verify.json?.count ?? (verify.json?.items || []).length;

  const report = {
    schema: 'traveltrust.cms_poi_pilot_catalog_build.v1',
    recorded_at: NOW,
    api: API,
    pilot: { country_iso: pilot.country_iso || 'JP', city_zh: pilot.city_zh, matrix_ids: PILOT_MATRIX_IDS },
    interim_image: INTERIM_IMAGE,
    results,
    verify: { catalog_poi_images: count, expected: pilotRows.length },
    TT_CMS_POI_PILOT_CATALOG_BUILD: count >= pilotRows.length ? 'PASS' : 'FAIL',
  };

  const outDir = path.join(ROOT, 'evidence/GO_cms_operation/poi-pilot');
  fs.mkdirSync(outDir, { recursive: true });
  const dirSlug = pilot.slug || pilot.city_en.toLowerCase().replace(/\s+/g, '-');
  const outPath = path.join(outDir, `CMS-POI-PILOT-CATALOG-BUILD-${dirSlug}-${NOW.replace(/[:]/g, '')}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, `CMS-POI-PILOT-CATALOG-BUILD-${dirSlug}-LATEST.json`), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'CMS-POI-PILOT-CATALOG-BUILD-LATEST.json'), JSON.stringify(report, null, 2) + '\n');

  console.log(`TT_CMS_POI_PILOT_CATALOG_BUILD: ${report.TT_CMS_POI_PILOT_CATALOG_BUILD}`);
  console.log(`TT_CMS_POI_CATALOG_IMAGES: ${count}/${pilotRows.length} · ${pilot.city_zh}`);
  console.log(`Evidence: ${outPath.replace(/\\/g, '/')}`);
  process.exit(count >= pilotRows.length ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
