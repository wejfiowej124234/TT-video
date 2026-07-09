#!/usr/bin/env node
/**
 * Production OCS CMS Cities/POI Bootstrap — frozen SSOT apply only.
 *
 *   node scripts/dev/run-ocs-production-cms-cities-poi-bootstrap.cjs
 *
 * SSOT (read-only, never mutate):
 *   data/catalog/poi-hero-matrix.v1.yaml
 *   data/official-cold-start/dataset.v1.json
 *
 * Lineage: ocs_source_id | matrix_id → city_id → poi_id → public catalog API
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const { CITY_PILOTS } = require('./lib/cms-poi-city-pilot.cjs');

const ROOT = path.join(__dirname, '../..');
const POI_MATRIX = path.join(ROOT, 'data/catalog/poi-hero-matrix.v1.yaml');
const OCS_REGISTRY = path.join(ROOT, 'registry/official-cold-start-dataset.v1.yaml');
const OCS_DATASET = path.join(ROOT, 'data/official-cold-start/dataset.v1.json');
const PROD_API = (process.env.PROD_API || process.env.API_BASE || 'https://tt-api-prod.fly.dev').replace(/\/$/, '');
const PROD_WEB = (process.env.PROD_WEB || process.env.WEB_BASE || 'https://tt-web-prod.fly.dev').replace(/\/$/, '');
const STAMP = process.env.OCS_PROD_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const EVID_ROOT = path.join(ROOT, 'evidence/GO_ocs_production_bootstrap');
const EVID_DIR = path.join(EVID_ROOT, STAMP);
const ADM_PASS = process.env.ADM_U01_PASSWORD || process.env.ADMIN_PASS || 'Test123!';
const SLEEP_CITY_SEC = Number(process.env.CMS_OPS_RATE_LIMIT_SLEEP_SEC || 3);
const SLEEP_POI_MS = Number(process.env.OCS_PROD_POI_SLEEP_MS || 800);
const PRODUCT_ISOS = ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU', 'ES', 'AE', 'CN'];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function adminReq(client, tok, method, urlPath, body, label = urlPath) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const r = await client.req(method, urlPath, body, tok);
    if (r.status !== 429) return r;
    const waitSec = Number(r.json?.retry_after_seconds || 60);
    console.warn(`rate_limit ${label} attempt=${attempt + 1} sleep=${waitSec}s`);
    await sleep((waitSec + 2) * 1000);
  }
  throw new Error(`rate_limit_exhausted ${label}`);
}

function sha256File(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

function parsePilotRows(matrixText, matrixIds) {
  const rows = [];
  for (const matrixId of matrixIds) {
    const blockRe = new RegExp(`  - matrix_id: ${matrixId}[\\s\\S]*?(?=\\n  - matrix_id:|\\nrows:|$)`);
    const block = matrixText.match(blockRe)?.[0];
    if (!block) throw new Error(`matrix row missing: ${matrixId}`);
    const get = (key) => block.match(new RegExp(`\\n    ${key}: "?([^"\\n]+)"?`))?.[1]?.trim();
    rows.push({
      matrix_id: matrixId,
      execution_order: Number(get('execution_order') || 0),
      country_iso: get('country_iso'),
      country_zh: get('country_zh'),
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

function buildOcsCityChainMap() {
  const dataset = JSON.parse(fs.readFileSync(OCS_DATASET, 'utf8'));
  const map = {};
  for (const chain of dataset.chains || []) {
    map[chain.city] = chain.id;
  }
  return map;
}

async function resolveSuperAdminEmail() {
  if (process.env.ADMIN_EMAIL) return process.env.ADMIN_EMAIL;
  const envPath = path.join(ROOT, 'scripts/dev/.env.production.local');
  if (!fs.existsSync(envPath)) throw new Error('missing .env.production.local');
  const out = {};
  for (const raw of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const line = raw.trim();
    if (line.startsWith('#') || !line.includes('=')) continue;
    const k = line.slice(0, line.indexOf('=')).trim();
    let v = line.slice(line.indexOf('=') + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[k] = v;
  }
  const port = process.env.PROD_PG_PROXY_PORT || '15433';
  const cluster = out.FLY_PROD_MPG_CLUSTER_ID || 'q49ypo4e98pr17ln';
  const u = new URL(out.DATABASE_URL);
  u.hostname = '127.0.0.1';
  u.port = port;
  u.searchParams.delete('sslmode');
  const dsn = u.toString();
  const proxy = spawn('fly', ['mpg', 'proxy', cluster, '-p', port], { stdio: 'ignore' });
  const { Client } = require(path.join(ROOT, 'frontend/node_modules/pg'));
  try {
    for (let i = 0; i < 40; i += 1) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const client = new Client({ connectionString: dsn, connectionTimeoutMillis: 8000 });
        await client.connect();
        const q = await client.query(
          `SELECT email FROM users WHERE role='super_admin' AND email LIKE 'adm-u01-super%@traveltrust.prod' ORDER BY created_at DESC LIMIT 1`
        );
        await client.end();
        if (q.rows[0]?.email) return q.rows[0].email;
      } catch {
        /* retry */
      }
    }
    throw new Error('SuperAdmin lookup failed');
  } finally {
    if (!proxy.killed) proxy.kill();
  }
}

async function refreshFromList(client, tok, listUrl, id) {
  const list = await adminReq(client, tok, 'GET', listUrl, null, listUrl);
  const row = (list.json?.items || []).find((x) => String(x.id) === String(id));
  if (!row) throw new Error(`refreshFromList missing id=${id}`);
  return row;
}

async function workflowPublish(client, tok, { row, submitPath, publishPath, listUrl }) {
  let current = row;
  if (current.publish_status === 'draft') {
    await adminReq(client, tok, 'POST', submitPath, { version: current.version }, submitPath);
    current = await refreshFromList(client, tok, listUrl, current.id);
  }
  if (current.publish_status === 'in_review') {
    await adminReq(client, tok, 'POST', publishPath, { version: current.version }, publishPath);
    current = await refreshFromList(client, tok, listUrl, current.id);
  }
  return current;
}

function heroUrl(file) {
  return `${PROD_API}/api/v1/uploads/community-posts/${file}`;
}

async function ensureCountry(client, tok, countryIso) {
  const listUrl = '/api/v1/admin/content/countries?limit=200';
  const list = await adminReq(client, tok, 'GET', listUrl, null, listUrl);
  const row = (list.json?.items || []).find((x) => x.iso3166 === countryIso);
  if (!row) throw new Error(`${countryIso} country missing — run destination ambient first`);
  return workflowPublish(client, tok, {
    row,
    submitPath: `/api/v1/admin/content/countries/${row.id}/submit-review`,
    publishPath: `/api/v1/admin/content/countries/${row.id}/publish`,
    listUrl,
  });
}

async function ensureCity(client, tok, countryId, pilot, ocsCityChain) {
  const listUrl = `/api/v1/admin/content/cities?country_id=${countryId}&limit=200`;
  const list = await adminReq(client, tok, 'GET', listUrl, null, listUrl);
  let row = (list.json?.items || []).find((x) => x.name_zh === pilot.city_zh);
  const ocsSourceId = ocsCityChain[pilot.city_zh] || null;
  if (!row) {
    const created = await adminReq(
      client,
      tok,
      'POST',
      '/api/v1/admin/content/cities',
      {
        country_id: countryId,
        slug: pilot.slug,
        name_zh: pilot.city_zh,
        name_en: pilot.city_en,
        sort_order: 1,
        open_status: 'open',
        payload: {
          ocs_source_id: ocsSourceId,
          matrix_ssot: 'data/catalog/poi-hero-matrix.v1.yaml',
          ocs_prod_bootstrap: STAMP,
        },
      },
      `create-city-${pilot.city_zh}`
    );
    if (created.status !== 200) {
      throw new Error(`create city ${pilot.city_zh} ${created.status} ${JSON.stringify(created.json).slice(0, 200)}`);
    }
    row = created.json.item;
  }
  row = await workflowPublish(client, tok, {
    row,
    submitPath: `/api/v1/admin/content/cities/${row.id}/submit-review`,
    publishPath: `/api/v1/admin/content/cities/${row.id}/publish`,
    listUrl,
  });
  return row;
}

async function upsertPoi(client, tok, cityId, spec, pilot, allSpecs, ocsCityChain) {
  const listUrl = `/api/v1/admin/content/pois?city_id=${cityId}&limit=300`;
  const list = await adminReq(client, tok, 'GET', listUrl, null, listUrl);
  const slug =
    allSpecs.filter((s) => s.legacy_value === spec.legacy_value).length > 1
      ? `${spec.slug}-${spec.poi_type}`
      : spec.slug;
  let row = (list.json?.items || []).find(
    (x) => x.legacy_value === spec.legacy_value && String(x.poi_type || '') === String(spec.poi_type || '')
  );
  const heroFile = (pilot.hero_files && pilot.hero_files[spec.matrix_id]) || pilot.interim_image;
  const url = heroUrl(heroFile);
  const ocsSourceId = ocsCityChain[pilot.city_zh] || spec.matrix_id;

  if (!row) {
    const created = await adminReq(
      client,
      tok,
      'POST',
      '/api/v1/admin/content/pois',
      {
        city_id: cityId,
        poi_type: spec.poi_type,
        slug,
        name_zh: spec.name_zh,
        name_en: spec.name_en || slug,
        legacy_value: spec.legacy_value,
        sort_order: spec.execution_order || 0,
        payload: {
          image_url: url,
          ocs_source_id: ocsSourceId,
          matrix_id: spec.matrix_id,
          ocs_prod_bootstrap: STAMP,
        },
      },
      `create-poi-${spec.matrix_id}`
    );
    if (created.status !== 200) throw new Error(`${spec.matrix_id} poi create ${created.status}`);
    row = created.json.item;
  } else {
    const patched = await adminReq(
      client,
      tok,
      'PATCH',
      `/api/v1/admin/content/pois/${row.id}`,
      {
        version: row.version,
        payload: {
          ...(row.payload || {}),
          image_url: url,
          ocs_source_id: ocsSourceId,
          matrix_id: spec.matrix_id,
          ocs_prod_bootstrap: STAMP,
        },
      },
      `patch-poi-${spec.matrix_id}`
    );
    if (patched.status !== 200) throw new Error(`${spec.matrix_id} poi patch ${patched.status}`);
    row = patched.json.item;
  }
  row = await workflowPublish(client, tok, {
    row,
    submitPath: `/api/v1/admin/content/pois/${row.id}/submit-review`,
    publishPath: `/api/v1/admin/content/pois/${row.id}/publish`,
    listUrl,
  });
  return {
    poi_id: row.id,
    matrix_id: spec.matrix_id,
    ocs_source_id: ocsSourceId,
    legacy_value: spec.legacy_value,
    published_asset: url,
    public_api: `${PROD_API}/api/v1/catalog/poi-images?country_iso=${encodeURIComponent(
      pilot.country_iso
    )}&city=${encodeURIComponent(pilot.city_zh)}&limit=100`,
  };
}

async function countCatalogSurfaces(client) {
  let cityCount = 0;
  let poiCount = 0;
  for (const iso of PRODUCT_ISOS) {
    const cities = await client.req('GET', `/api/v1/catalog/cities?country_iso=${iso}&limit=100`);
    cityCount += cities.json.count || (cities.json.items || []).length;
    for (const city of cities.json.items || []) {
      const poi = await client.req(
        'GET',
        `/api/v1/catalog/poi-images?country_iso=${iso}&city=${encodeURIComponent(city.name_zh)}&limit=100`
      );
      poiCount += poi.json.count || (poi.json.items || []).length;
    }
  }
  const countries = await client.req('GET', '/api/v1/catalog/countries?limit=50');
  return {
    countries: countries.json.count || (countries.json.items || []).length,
    cities: cityCount,
    poi: poiCount,
  };
}

async function probeWeb(route) {
  try {
    const res = await fetch(`${PROD_WEB}${route}`, { redirect: 'manual' });
    return { route, status: res.status, ok: [200, 307, 308].includes(res.status) };
  } catch (e) {
    return { route, status: 0, ok: false, error: String(e.message || e) };
  }
}

(async () => {
  fs.mkdirSync(EVID_DIR, { recursive: true });
  const preHashes = {
    ocs_registry_yaml: sha256File(OCS_REGISTRY),
    ocs_dataset_json: sha256File(OCS_DATASET),
    poi_hero_matrix_yaml: sha256File(POI_MATRIX),
  };
  fs.writeFileSync(path.join(EVID_DIR, 'check1-ssot-pre.json'), JSON.stringify(preHashes, null, 2) + '\n');

  const adminEmail = await resolveSuperAdminEmail();
  const client = createClient(PROD_API);
  const tok = await client.userLogin(adminEmail, ADM_PASS);
  const ocsCityChain = buildOcsCityChainMap();
  const matrixText = fs.readFileSync(POI_MATRIX, 'utf8');
  const cityKeys = Object.keys(CITY_PILOTS);
  const lineage = [];
  const cityReports = [];

  console.log(`ocs-prod-cms: cities/poi bootstrap · ${cityKeys.length} cities · api=${PROD_API}`);

  for (const cityZh of cityKeys) {
    const pilot = CITY_PILOTS[cityZh];
    const pilotRows = parsePilotRows(matrixText, pilot.matrix_ids);
    console.log(`\n== ${cityZh} (${pilot.country_iso}) · ${pilotRows.length} POI ==`);
    const country = await ensureCountry(client, tok, pilot.country_iso);
    const city = await ensureCity(client, tok, country.id, pilot, ocsCityChain);
    const poiResults = [];

    for (const spec of pilotRows) {
      const r = await upsertPoi(client, tok, city.id, spec, pilot, pilotRows, ocsCityChain);
      poiResults.push(r);
      lineage.push({
        ocs_source_id: r.ocs_source_id,
        matrix_id: r.matrix_id,
        city_id: city.id,
        city_zh: pilot.city_zh,
        poi_id: r.poi_id,
        legacy_value: r.legacy_value,
        published_asset: r.published_asset,
        public_api: r.public_api,
      });
      await sleep(SLEEP_POI_MS);
    }

    const verify = await client.req(
      'GET',
      `/api/v1/catalog/poi-images?country_iso=${encodeURIComponent(pilot.country_iso)}&city=${encodeURIComponent(
        pilot.city_zh
      )}&limit=100`
    );
    const catalogCount = verify.json?.count ?? (verify.json?.items || []).length;
    cityReports.push({
      city_zh: cityZh,
      country_iso: pilot.country_iso,
      city_id: city.id,
      ocs_source_id: ocsCityChain[cityZh] || null,
      poi_applied: poiResults.length,
      catalog_poi_count: catalogCount,
      ok: catalogCount >= pilotRows.length,
    });
    console.log(`  OK ${cityZh} city=${city.id} catalog_poi=${catalogCount}/${pilotRows.length}`);

    if (cityKeys.indexOf(cityZh) < cityKeys.length - 1) {
      await sleep(SLEEP_CITY_SEC * 1000);
    }
  }

  const postHashes = {
    ocs_registry_yaml: sha256File(OCS_REGISTRY),
    ocs_dataset_json: sha256File(OCS_DATASET),
    poi_hero_matrix_yaml: sha256File(POI_MATRIX),
  };
  const ssotFrozen =
    preHashes.ocs_registry_yaml === postHashes.ocs_registry_yaml &&
    preHashes.ocs_dataset_json === postHashes.ocs_dataset_json &&
    preHashes.poi_hero_matrix_yaml === postHashes.poi_hero_matrix_yaml;

  fs.writeFileSync(path.join(EVID_DIR, 'check2-lineage-cities-poi.json'), JSON.stringify(lineage, null, 2) + '\n');
  fs.writeFileSync(path.join(EVID_DIR, 'cms-cities-poi-prod-apply.json'), JSON.stringify(cityReports, null, 2) + '\n');

  const surfaces = await countCatalogSurfaces(client);
  const webProbes = await Promise.all(['/', '/market', '/community', '/guides'].map((r) => probeWeb(r)));

  const targets = {
    countries: { actual: surfaces.countries, target: 10, ok: surfaces.countries >= 10 },
    cities: { actual: surfaces.cities, target: 38, ok: surfaces.cities >= 38 },
    poi: { actual: surfaces.poi, target: 234, ok: surfaces.poi >= 234, ssot_full: 330, ssot_ok: surfaces.poi >= 330 },
  };

  const citiesApplyOk = cityReports.every((c) => c.ok);
  const parityPass = ssotFrozen && citiesApplyOk && targets.countries.ok && targets.cities.ok && targets.poi.ok;

  const report = {
    schema: 'traveltrust.ocs_production_cms_cities_poi_bootstrap.v1',
    stamp: STAMP,
    recorded_at: new Date().toISOString(),
    api: PROD_API,
    web: PROD_WEB,
    policy: 'Frozen SSOT apply — poi-hero-matrix + OCS dataset read-only',
    check1_ssot_frozen: ssotFrozen,
    pre_hashes: preHashes,
    post_hashes: postHashes,
    cities_applied: cityReports.length,
    poi_lineage_rows: lineage.length,
    catalog_surfaces: surfaces,
    targets,
    web_probes: webProbes,
    machine_keys: {
      OCS_PRODUCTION_CMS_CITIES_POI: citiesApplyOk && ssotFrozen ? 'PASS' : 'FAIL',
      OCS_PRODUCTION_PARITY_AUDIT: parityPass ? 'PASS' : 'FAIL',
    },
    admin_email_redacted: adminEmail.replace(/^(.{8}).*(@.*)$/, '$1***$2'),
    evidence_dir: EVID_DIR.replace(/\\/g, '/'),
  };

  fs.writeFileSync(path.join(EVID_DIR, 'OCS-PROD-CMS-CITIES-POI.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(EVID_ROOT, 'OCS-PROD-CMS-CITIES-POI-LATEST.json'), JSON.stringify(report, null, 2) + '\n');

  console.log(`\nOCS_PRODUCTION_CMS_CITIES_POI: ${report.machine_keys.OCS_PRODUCTION_CMS_CITIES_POI}`);
  console.log(`OCS_PRODUCTION_PARITY_AUDIT: ${report.machine_keys.OCS_PRODUCTION_PARITY_AUDIT}`);
  console.log(`catalog: countries=${surfaces.countries} cities=${surfaces.cities} poi=${surfaces.poi}`);
  console.log(`evidence=${EVID_DIR.replace(/\\/g, '/')}`);

  if (!parityPass) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
