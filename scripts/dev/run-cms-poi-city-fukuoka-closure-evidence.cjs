#!/usr/bin/env node
/**
 * POI City Closure Evidence · JP · 福冈 · ② staging
 *
 *   API=https://tt-api-staging.fly.dev node scripts/dev/run-cms-poi-city-fukuoka-closure-evidence.cjs
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const { getCityPilot, readRegistry } = require('./lib/cms-poi-city-pilot.cjs');
const { getAsset } = require('./lib/cms-content-qa-asset-lock.cjs');

const ROOT = path.join(__dirname, '../..');
const MATRIX = path.join(ROOT, 'data/catalog/poi-hero-matrix.v1.yaml');
const EVID_DIR = path.join(ROOT, 'evidence/GO_cms_content_l5/poi-hero/rows');
const REGISTRY_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-CLOSURE-REGISTRY-LATEST.json');
const POI_KICKOFF = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-WAVE-KICKOFF-LATEST.json');
const PILOT_WAVE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-PILOT-WAVE-LATEST.json');

const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const NOW = process.env.CMS_OPS_STAMP_UTC || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

const FUKUOKA = getCityPilot('福冈');

function parseMatrixRow(text, matrixId) {
  const blockRe = new RegExp(`  - matrix_id: ${matrixId}[\\s\\S]*?(?=\\n  - matrix_id:|\\nrows:|$)`);
  const block = text.match(blockRe)?.[0];
  if (!block) throw new Error(`matrix row missing: ${matrixId}`);
  const get = (key) => block.match(new RegExp(`\\n    ${key}: "?([^"\\n]+)"?`))?.[1]?.trim();
  return {
    matrix_id: matrixId,
    legacy_value: get('legacy_value'),
    asset_lifecycle: get('asset_lifecycle'),
    matrix_row_status: get('matrix_row_status'),
    public_url: get('public_url'),
  };
}

function readEvidence(matrixId) {
  const p = path.join(EVID_DIR, `${matrixId}.EVIDENCE.json`);
  if (!fs.existsSync(p)) return { ok: false, path: p, reason: 'missing' };
  const ev = JSON.parse(fs.readFileSync(p, 'utf8'));
  const verifyOk = ev.TT_CMS_POI_HERO_ROW_VERIFY === 'PASS' || ev.step_5_verify?.gate_result === 'PASS';
  const evidenceOk = ev.step_6_evidence?.gate_result === 'PASS' || ev.TT_CMS_PHASE1_SINGLE_ASSET_ROW === 'COMPLETE';
  return { ok: verifyOk && evidenceOk, path: p, verify: ev.TT_CMS_POI_HERO_ROW_VERIFY, evidence: ev.step_6_evidence?.gate_result };
}

function fetchJson(url) {
  const lib = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    lib
      .get({ hostname: u.hostname, path: u.pathname + u.search, headers: { Accept: 'application/json' } }, (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try {
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode, json: JSON.parse(d) });
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

function readJsonIfExists(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

async function main() {
  const matrixText = fs.readFileSync(MATRIX, 'utf8');
  const matrixRows = [];
  const matrixIssues = [];

  for (const matrixId of FUKUOKA.matrix_ids) {
    const row = parseMatrixRow(matrixText, matrixId);
    matrixRows.push(row);
    if (row.matrix_row_status !== 'pass' || row.asset_lifecycle !== 'live') {
      matrixIssues.push(`${matrixId}: status=${row.matrix_row_status} lifecycle=${row.asset_lifecycle}`);
    }
  }

  const evidenceRows = FUKUOKA.matrix_ids.map((id) => ({ matrix_id: id, ...readEvidence(id) }));
  const evidenceMissing = evidenceRows.filter((r) => !r.ok);

  const catalogUrl = `${API}/api/v1/catalog/poi-images?country_iso=JP&city=${encodeURIComponent(FUKUOKA.city_zh)}&limit=50`;
  const catalog = await fetchJson(catalogUrl);
  const catalogItems = catalog.json?.items || [];
  const catalogIssues = [];
  for (const matrixId of FUKUOKA.matrix_ids) {
    const heroFile = getAsset(matrixId).hero_file || FUKUOKA.hero_files[matrixId];
    const hit = catalogItems.find((x) => (x.image_url || '').split('/').pop() === heroFile);
    if (!hit?.image_url) catalogIssues.push(`catalog missing: ${matrixId} hero=${heroFile}`);
  }

  const loopPath = path.join(ROOT, FUKUOKA.closed_loop_latest);
  const closedLoop = readJsonIfExists(loopPath);
  const loopOk =
    closedLoop?.TT_CMS_POI_CITY_CLOSED_LOOP === 'PASS' &&
    (closedLoop?.results || []).length === FUKUOKA.matrix_ids.length;

  const checks = {
    matrix_pass_live: matrixIssues.length === 0,
    evidence_complete: evidenceMissing.length === 0,
    catalog_readable: catalog.ok && catalogItems.length >= FUKUOKA.matrix_ids.length && catalogIssues.length === 0,
    city_closed_loop: loopOk,
  };
  const allOk = Object.values(checks).every(Boolean);

  if (!allOk) {
    console.error(`${FUKUOKA.closure_key}: NOT_CLOSED`);
    if (matrixIssues.length) console.error('  matrix:', matrixIssues.join('; '));
    if (evidenceMissing.length) {
      console.error('  evidence:', evidenceMissing.map((r) => `${r.matrix_id}:${r.reason || r.verify}`).join('; '));
    }
    if (catalogIssues.length) console.error('  catalog:', catalogIssues.join('; '));
    if (!catalog.ok) console.error(`  catalog http: ${catalog.status}`);
    if (!loopOk) console.error('  closed_loop: missing or not PASS');
    process.exit(1);
  }

  const stamp = NOW.replace(/[:]/g, '');
  const OUT_LATEST = path.join(ROOT, FUKUOKA.closure_latest);
  const closure = {
    schema: 'traveltrust.cms_poi_city_closure.v1',
    stamp_utc: stamp,
    layer: 'CMS_OPERATION',
    not_governance: true,
    phase: '② staging',
    acceptance_unit: 'city',
    city: { country_iso: FUKUOKA.country_iso, country_zh: '日本', city_zh: FUKUOKA.city_zh, city_en: FUKUOKA.city_en },
    poi_count: FUKUOKA.matrix_ids.length,
    matrix_ids: FUKUOKA.matrix_ids,
    pois: FUKUOKA.pois,
    checks,
    matrix_rows: matrixRows,
    evidence_refs: evidenceRows.map((r) => path.relative(ROOT, r.path).replace(/\\/g, '/')),
    catalog_probe: { api: catalogUrl, http: catalog.status, count: catalogItems.length },
    closed_loop_evidence: FUKUOKA.closed_loop_latest,
    jp_pilot_cities_complete: true,
    next_city: null,
    closure_keys: { [FUKUOKA.closure_key]: 'CLOSED', TT_CMS_POI_ACTIVE_CITY: null },
    frozen: true,
    [FUKUOKA.closure_key]: 'CLOSED',
  };

  fs.mkdirSync(path.dirname(OUT_LATEST), { recursive: true });
  fs.writeFileSync(OUT_LATEST, JSON.stringify(closure, null, 2) + '\n');

  const prev = readRegistry() || {};
  const closedBefore = (prev.closed_cities || []).filter(
    (c) => !(c.country_iso === FUKUOKA.country_iso && c.city_zh === FUKUOKA.city_zh),
  );
  const registry = {
    schema: 'traveltrust.cms_poi_city_closure_registry.v1',
    stamp_utc: stamp,
    closed_cities: [
      ...closedBefore,
      {
        country_iso: FUKUOKA.country_iso,
        city_zh: FUKUOKA.city_zh,
        city_en: FUKUOKA.city_en,
        closed_at_utc: NOW,
        poi_count: FUKUOKA.matrix_ids.length,
        closure_evidence: FUKUOKA.closure_latest,
        [FUKUOKA.closure_key]: 'CLOSED',
      },
    ],
    active_city: null,
    TT_CMS_POI_ACTIVE_CITY: null,
    jp_pilot_wave_complete: true,
    [FUKUOKA.closure_key]: 'CLOSED',
  };
  fs.writeFileSync(REGISTRY_LATEST, JSON.stringify(registry, null, 2) + '\n');

  const kickoff = readJsonIfExists(POI_KICKOFF);
  if (kickoff) {
    kickoff.stamp_utc = stamp;
    kickoff.status = 'JP_CITY_PILOT_COMPLETE';
    kickoff.fukuoka_city_closure = { status: 'CLOSED', evidence: FUKUOKA.closure_latest };
    kickoff.active_catalog_build = null;
    kickoff.TT_CMS_POI_WAVE = 'JP_CITY_PILOT_COMPLETE';
    kickoff[FUKUOKA.closure_key] = 'CLOSED';
    kickoff.TT_CMS_POI_ACTIVE_CITY = null;
    fs.writeFileSync(POI_KICKOFF, JSON.stringify(kickoff, null, 2) + '\n');
  }

  const pilotWave = readJsonIfExists(PILOT_WAVE);
  if (pilotWave) {
    pilotWave.stamp_utc = stamp;
    pilotWave.fukuoka_closed = true;
    pilotWave.jp_city_pilot_complete = true;
    pilotWave.active_catalog_build = null;
    pilotWave[FUKUOKA.closure_key] = 'CLOSED';
    fs.writeFileSync(PILOT_WAVE, JSON.stringify(pilotWave, null, 2) + '\n');
  }

  execSync('node scripts/dev/run-cms-denominator-lock.cjs', { cwd: ROOT, stdio: 'inherit', env: { ...process.env, API, API_BASE: API } });
  execSync('node scripts/dev/run-cms-ops-hierarchy-sync.cjs', { cwd: ROOT, stdio: 'inherit', env: { ...process.env, API, API_BASE: API } });
  execSync('node scripts/dev/run-cms-ops-refresh.cjs', { cwd: ROOT, stdio: 'inherit', env: { ...process.env, API, API_BASE: API } });

  console.log(`\n${FUKUOKA.closure_key}: CLOSED`);
  console.log(`Evidence: ${OUT_LATEST.replace(/\\/g, '/')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
