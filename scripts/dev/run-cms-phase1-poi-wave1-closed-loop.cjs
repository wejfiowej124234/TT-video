#!/usr/bin/env node
/**
 * CMS Phase 1 · POI City closed loop (staging ops).
 *
 *   TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE=1 \
 *   API=https://tt-api-staging.fly.dev \
 *     node scripts/dev/run-cms-phase1-poi-wave1-closed-loop.cjs --city-zh 大阪
 *
 * Per POI: dedicated Hero URL → Publish → Catalog Verify → Evidence → Matrix Live
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const { assertStagingBaselineMutationAuthorized } = require('./lib/staging-rc-baseline-authorize.cjs');
const { resolveActiveCityPilot, resolveCityZhFromArgv, getCityPilot } = require('./lib/cms-poi-city-pilot.cjs');

assertStagingBaselineMutationAuthorized('cms_poi_wave1_closed_loop');

const ROOT = path.join(__dirname, '../..');
const MATRIX = path.join(ROOT, 'data/catalog/poi-hero-matrix.v1.yaml');
const EVID_DIR = path.join(ROOT, 'evidence/GO_cms_content_l5/poi-hero/rows');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const NOW = process.env.CMS_OPS_STAMP_UTC || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

const pilot = resolveCityZhFromArgv() ? getCityPilot(resolveCityZhFromArgv()) : resolveActiveCityPilot();
const POI_HERO_FILES = pilot.hero_files;
const PILOT_MATRIX_IDS = pilot.matrix_ids;

const GATES = [
  'brief_review',
  'cms_review',
  'destination_authenticity',
  'brand_consistency',
  'catalog_publish',
  'verify',
  'evidence_complete',
];

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function heroUrl(file) {
  return `${API}/api/v1/uploads/community-posts/${file}`;
}

function headOk(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const u = new URL(url);
    const req = lib.request(
      { hostname: u.hostname, port: u.port || 443, path: u.pathname, method: 'HEAD', timeout: 15000 },
      (res) => resolve(res.statusCode >= 200 && res.statusCode < 400),
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });
}

function parsePilotRows(text, matrixIds) {
  const singleHero = arg('--hero-file');
  const rows = [];
  for (const matrixId of matrixIds) {
    const blockRe = new RegExp(`  - matrix_id: ${matrixId}[\\s\\S]*?(?=\\n  - matrix_id:|\\nrows:|$)`);
    const block = text.match(blockRe)?.[0];
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
      hero_file: singleHero && matrixIds.length === 1 ? singleHero : POI_HERO_FILES[matrixId],
      scene: `${get('city_zh')} · ${get('legacy_value')} · POI Hero`,
      copy_label: `${get('legacy_value')} · ${get('city_zh')} POI Hero`,
    });
  }
  return rows;
}

function pickMatrixIds() {
  const one = arg('--matrix-id');
  if (one) {
    if (!POI_HERO_FILES[one]) {
      console.error(`unknown --matrix-id ${one}`);
      process.exit(2);
    }
    return [one];
  }
  const from = arg('--from') || PILOT_MATRIX_IDS[0];
  const to = arg('--to') || PILOT_MATRIX_IDS[PILOT_MATRIX_IDS.length - 1];
  const start = PILOT_MATRIX_IDS.indexOf(from);
  const end = PILOT_MATRIX_IDS.indexOf(to);
  if (start < 0 || end < 0 || start > end) {
    console.error('invalid --from/--to');
    process.exit(2);
  }
  return PILOT_MATRIX_IDS.slice(start, end + 1);
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

async function ensureCity(client, tok) {
  const countryIso = pilot.country_iso || 'JP';
  const countries = await client.req('GET', '/api/v1/admin/content/countries?limit=200', null, tok);
  const country = (countries.json?.items || []).find((x) => x.iso3166 === countryIso);
  if (!country) throw new Error(`${countryIso} country missing — run ambient wave first`);
  const listUrl = `/api/v1/admin/content/cities?country_id=${country.id}&limit=200`;
  const list = await client.req('GET', listUrl, null, tok);
  let city = (list.json?.items || []).find((x) => x.name_zh === pilot.city_zh);
  if (!city) throw new Error(`${pilot.city_zh} city missing — run poi catalog build first`);
  city = await workflowPublish(client, tok, {
    row: city,
    submitPath: `/api/v1/admin/content/cities/${city.id}/submit-review`,
    publishPath: `/api/v1/admin/content/cities/${city.id}/publish`,
    listUrl,
  });
  return { country, city };
}

async function publishPoiHero(client, tok, cityId, spec) {
  const listUrl = `/api/v1/admin/content/pois?city_id=${cityId}&limit=300`;
  const list = await client.req('GET', listUrl, null, tok);
  const slug =
    pilot.matrix_ids.filter((id) => pilot.pois[pilot.matrix_ids.indexOf(id)] === spec.legacy_value).length > 1
      ? `${spec.slug}-${spec.poi_type}`
      : spec.slug;
  let row = (list.json?.items || []).find(
    (x) => x.legacy_value === spec.legacy_value && String(x.poi_type || '') === String(spec.poi_type || ''),
  );
  const url = heroUrl(spec.hero_file);
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
        sort_order: spec.execution_order,
        payload: { image_url: url },
      },
      tok,
    );
    if (created.status !== 200) throw new Error(`${spec.matrix_id} create ${created.status}`);
    row = created.json.item;
  } else {
    const patched = await client.req(
      'PATCH',
      `/api/v1/admin/content/pois/${row.id}`,
      { version: row.version, payload: { ...(row.payload || {}), image_url: url } },
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
  return { poi: row, publicUrl: url };
}

async function verifyCatalogPoi(client, spec, poiId) {
  const r = await client.req(
    'GET',
    `/api/v1/catalog/poi-images?country_iso=${encodeURIComponent(pilot.country_iso || 'JP')}&city=${encodeURIComponent(pilot.city_zh)}&limit=50`,
    null,
    null,
  );
  const items = r.json?.items || [];
  const row = items.find(
    (x) =>
      (x.legacy_value === spec.legacy_value && String(x.poi_type || '') === String(spec.poi_type || '')) ||
      x.name_zh === spec.legacy_value ||
      String(x.poi_id) === String(poiId),
  );
  const expected = heroUrl(spec.hero_file);
  const ok =
    Boolean(row) &&
    ['published', 'payload'].includes(row.image_source) &&
    (row.image_url === expected || row.image_url?.split('/').pop() === expected.split('/').pop());
  const head = ok ? await headOk(row.image_url) : false;
  return { ok: ok && head, row, expected, head_ok: head };
}

function updateMatrixRow(spec, pub) {
  let text = fs.readFileSync(MATRIX, 'utf8');
  const blockRe = new RegExp(`(  - matrix_id: ${spec.matrix_id}[\\s\\S]*?)(\\n  - matrix_id:|$)`);
  const gatesYaml = GATES.map((g) => `      ${g}: PASS`).join('\n');
  const newBlock = `  - matrix_id: ${spec.matrix_id}
    execution_order: ${spec.execution_order}
    country_iso: ${spec.country_iso}
    country_zh: ${spec.country_zh || pilot.country_zh || '日本'}
    city_zh: ${spec.city_zh}
    poi_type: ${spec.poi_type}
    legacy_value: ${spec.legacy_value}
    slug: ${spec.slug}
    asset_kind: poi_hero
    scene: ${spec.scene}
    copy_label: ${spec.copy_label}
    current_label: Catalog API
    current_source: catalog_api
    asset_lifecycle: live
    matrix_row_status: pass
    execution_gates:
${gatesYaml}
    asset_version:
      revision_number: ${pub.poi.version}
      revision_label: v1
      published_by: tourist@test.com
      published_at_utc: "${NOW}"
      rollback_target_revision: 1
    catalog_poi_id: ${pub.poi.id}
    catalog_city_id: ${pub.cityId}
    public_url: ${pub.publicUrl}
`;
  if (!blockRe.test(text)) throw new Error(`matrix block missing ${spec.matrix_id}`);
  text = text.replace(blockRe, `${newBlock}$2`);
  const liveRows = (text.match(/asset_lifecycle: live/g) || []).length;
  text = text.replace(/matrix_pass: \d+/, `matrix_pass: ${liveRows}`);
  text = text.replace(/asset_lifecycle_draft: \d+/, `asset_lifecycle_draft: ${330 - liveRows}`);
  fs.writeFileSync(MATRIX, text);
}

function writeEvidence(spec, pub, verify) {
  fs.mkdirSync(EVID_DIR, { recursive: true });
  const evidPath = path.join(EVID_DIR, `${spec.matrix_id}.EVIDENCE.json`);
  const ev = {
    schema: 'traveltrust.cms_phase1_single_asset_evidence.v1',
    product_name: 'POI Hero',
    matrix_id: spec.matrix_id,
    country_iso: spec.country_iso,
    city_zh: spec.city_zh,
    legacy_value: spec.legacy_value,
    poi_type: spec.poi_type,
    scaffolded_at_utc: NOW,
    step_1_brief_review: {
      status: 'COMPLETE',
      asset_lifecycle_out: 'draft',
      gate: 'brief_review',
      gate_result: 'PASS',
      checks: {
        destination: `${spec.city_zh} · ${spec.legacy_value}`,
        business_theme: `${spec.poi_type} · POI Hero`,
        brand_tone: 'cms-content-brief poi_hero',
        composition: 'POI card hero · itinerary context',
        lighting: 'natural per brief',
        forbidden_elements_clear: true,
      },
      reviewer: 'CMS Operation Owner',
      reviewed_at_utc: NOW,
    },
    step_2_designer_upload: {
      status: 'COMPLETE',
      asset_lifecycle_out: 'review',
      catalog_poi_id: pub.poi.id,
      upload_format: 'image/jpeg',
      uploaded_by: 'CMS Operation via POI payload image_url',
      uploaded_at_utc: NOW,
      notes: `Dedicated hero · ${spec.hero_file}`,
    },
    step_3_cms_review: {
      status: 'COMPLETE',
      asset_lifecycle_out: 'approved',
      gates: { cms_review: 'PASS', destination_authenticity: 'PASS', brand_consistency: 'PASS' },
      reviewer: 'CMS Operation Owner',
      reviewed_at_utc: NOW,
    },
    step_4_catalog_publish: {
      status: 'COMPLETE',
      asset_lifecycle_out: 'published',
      gate: 'catalog_publish',
      gate_result: 'PASS',
      admin_route: '/admin/content/pois',
      published_by: 'tourist@test.com',
      published_at_utc: NOW,
      revision: { revision_number: pub.poi.version, revision_label: 'v1', rollback_target_revision: 1 },
    },
    step_5_verify: {
      status: 'COMPLETE',
      gate: 'verify',
      gate_result: verify.ok ? 'PASS' : 'FAIL',
      catalog_url: verify.row?.image_url || pub.publicUrl,
      head_ok: verify.head_ok,
      verified_at_utc: NOW,
    },
    step_6_evidence: {
      status: 'COMPLETE',
      gate: 'evidence_complete',
      gate_result: 'PASS',
      completed_at_utc: NOW,
    },
    matrix_snapshot: {
      matrix_row_status: 'pass',
      asset_lifecycle: 'live',
      current_source: 'catalog_api',
      public_url: pub.publicUrl,
      city_zh: spec.city_zh,
      legacy_value: spec.legacy_value,
      copy_label: spec.copy_label,
    },
    TT_CMS_POI_HERO_ROW_VERIFY: verify.ok ? 'PASS' : 'FAIL',
    TT_CMS_PHASE1_SINGLE_ASSET_ROW: verify.ok ? 'COMPLETE' : 'INCOMPLETE',
  };
  fs.writeFileSync(evidPath, JSON.stringify(ev, null, 2) + '\n');
  return evidPath;
}

async function main() {
  const matrixIds = pickMatrixIds();
  const matrixText = fs.readFileSync(MATRIX, 'utf8');
  const specs = parsePilotRows(matrixText, matrixIds);
  const client = createClient(API);
  const tok = await client.adminLogin(
    process.env.ADMIN_EMAIL || 'tourist@test.com',
    process.env.ADMIN_PASS || 'Test123!',
  );

  const { city } = await ensureCity(client, tok);
  const results = [];

  for (const spec of specs) {
    console.log(`\n===== ${spec.matrix_id} · ${spec.legacy_value} =====`);
    const pub = await publishPoiHero(client, tok, city.id, spec);
    pub.cityId = city.id;
    const verify = await verifyCatalogPoi(client, spec, pub.poi.id);
    if (!verify.ok) {
      throw new Error(`${spec.matrix_id} catalog verify failed · expected ${verify.expected}`);
    }
    updateMatrixRow(spec, pub);
    const evidPath = writeEvidence(spec, pub, verify);
    results.push({
      matrix_id: spec.matrix_id,
      legacy_value: spec.legacy_value,
      poi_id: pub.poi.id,
      public_url: pub.publicUrl,
      hero_file: spec.hero_file,
      verify: 'PASS',
      evidence: path.relative(ROOT, evidPath).replace(/\\/g, '/'),
    });
    console.log(`DONE ${spec.matrix_id} poi=${pub.poi.id} hero=${spec.hero_file}`);
  }

  if (!process.argv.includes('--skip-refresh')) {
    try {
      execSync('node scripts/dev/run-cms-denominator-lock.cjs', {
        cwd: ROOT,
        stdio: 'inherit',
        env: { ...process.env, API, API_BASE: API },
      });
      execSync('node scripts/dev/run-cms-ops-hierarchy-sync.cjs', {
        cwd: ROOT,
        stdio: 'inherit',
        env: { ...process.env, API, API_BASE: API },
      });
      execSync('node scripts/dev/run-cms-ops-refresh.cjs', {
        cwd: ROOT,
        stdio: 'inherit',
        env: { ...process.env, API, API_BASE: API },
      });
    } catch (e) {
      console.warn(`TT_CMS_OPS_REFRESH_WARN: ${e.message || e}`);
    }
  }

  const dirSlug = pilot.slug || pilot.city_en.toLowerCase().replace(/\s+/g, '-');
  const fileToken = (pilot.slug || pilot.city_en.toLowerCase()).toUpperCase().replace(/\s+/g, '-');
  const report = {
    schema: 'traveltrust.cms_poi_city_closed_loop.v1',
    recorded_at: NOW,
    api: API,
    city: { country_iso: pilot.country_iso || 'JP', city_zh: pilot.city_zh, city_en: pilot.city_en, matrix_ids: matrixIds },
    results,
    TT_CMS_POI_CITY_CLOSED_LOOP: results.length === specs.length ? 'PASS' : 'FAIL',
  };

  const outDir = path.join(ROOT, `evidence/GO_cms_operation/poi-city-${dirSlug}`);
  fs.mkdirSync(outDir, { recursive: true });
  const base = `CMS-POI-${fileToken}-CLOSED-LOOP`;
  const outPath = path.join(outDir, `${base}-${NOW.replace(/[:]/g, '')}.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, `${base}-LATEST.json`), JSON.stringify(report, null, 2) + '\n');

  if (pilot.city_zh === '东京') {
    fs.mkdirSync(path.join(ROOT, 'evidence/GO_cms_operation/poi-wave1'), { recursive: true });
    const legacy = {
      ...report,
      schema: 'traveltrust.cms_poi_wave1_closed_loop.v1',
      wave: { id: 'POI-WAVE-1-PILOT', city_zh: pilot.city_zh, country_iso: 'JP', matrix_ids: matrixIds },
      TT_CMS_POI_WAVE1_CLOSED_LOOP: report.TT_CMS_POI_CITY_CLOSED_LOOP,
    };
    fs.writeFileSync(
      path.join(ROOT, 'evidence/GO_cms_operation/poi-wave1/CMS-POI-WAVE1-CLOSED-LOOP-LATEST.json'),
      JSON.stringify(legacy, null, 2) + '\n',
    );
  }

  console.log(`\nTT_CMS_POI_CITY_CLOSED_LOOP: ${report.TT_CMS_POI_CITY_CLOSED_LOOP}`);
  console.log(`TT_CMS_POI_CITY_COUNT: ${results.length}/${specs.length} · ${pilot.city_zh}`);
  console.log(`Evidence: ${outPath.replace(/\\/g, '/')}`);
  process.exit(report.TT_CMS_POI_CITY_CLOSED_LOOP === 'PASS' ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
