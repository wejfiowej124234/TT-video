#!/usr/bin/env node
/**
 * POI City Closure Evidence · JP · 东京 · ② staging
 *
 * Prereq: 9/9 POI closed loop complete · matrix pass/live · Evidence on disk
 *
 *   node scripts/dev/run-cms-poi-city-tokyo-closure-evidence.cjs
 *   API=https://tt-api-staging.fly.dev node scripts/dev/run-cms-poi-city-tokyo-closure-evidence.cjs
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const MATRIX = path.join(ROOT, 'data/catalog/poi-hero-matrix.v1.yaml');
const EVID_DIR = path.join(ROOT, 'evidence/GO_cms_content_l5/poi-hero/rows');
const WAVE1_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/poi-wave1/CMS-POI-WAVE1-CLOSED-LOOP-LATEST.json');
const OUT_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-TOKYO-CLOSURE-LATEST.json');
const REGISTRY_LATEST = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-CLOSURE-REGISTRY-LATEST.json');
const POI_KICKOFF = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-WAVE-KICKOFF-LATEST.json');
const PILOT_WAVE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-PILOT-WAVE-LATEST.json');

const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const NOW = process.env.CMS_OPS_STAMP_UTC || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

const TOKYO = {
  country_iso: 'JP',
  country_zh: '日本',
  city_zh: '东京',
  city_en: 'Tokyo',
  matrix_ids: [
    'PH-JP-009-ATR',
    'PH-JP-010-ATR',
    'PH-JP-011-ATR',
    'PH-JP-012-ATR',
    'PH-JP-013-ATR',
    'PH-JP-014-FOOD',
    'PH-JP-015-FOOD',
    'PH-JP-016-FOOD',
    'PH-JP-017-FOOD',
  ],
  pois: ['浅草寺', '东京塔', '新宿', '涩谷', '上野公园', '寿司', '拉面', '天妇罗', '居酒屋'],
};

const NEXT_CITY = {
  country_iso: 'JP',
  country_zh: '日本',
  city_zh: '大阪',
  city_en: 'Osaka',
  matrix_ids: [
    'PH-JP-001-ATR',
    'PH-JP-002-ATR',
    'PH-JP-003-ATR',
    'PH-JP-004-ATR',
    'PH-JP-005-FOOD',
    'PH-JP-006-FOOD',
    'PH-JP-007-FOOD',
    'PH-JP-008-FOOD',
  ],
};

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
  return {
    ok: verifyOk && evidenceOk,
    path: p,
    verify: ev.TT_CMS_POI_HERO_ROW_VERIFY,
    evidence: ev.step_6_evidence?.gate_result,
  };
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

  for (const matrixId of TOKYO.matrix_ids) {
    const row = parseMatrixRow(matrixText, matrixId);
    matrixRows.push(row);
    if (row.matrix_row_status !== 'pass' || row.asset_lifecycle !== 'live') {
      matrixIssues.push(`${matrixId}: status=${row.matrix_row_status} lifecycle=${row.asset_lifecycle}`);
    }
  }

  const evidenceRows = TOKYO.matrix_ids.map((id) => ({ matrix_id: id, ...readEvidence(id) }));
  const evidenceMissing = evidenceRows.filter((r) => !r.ok);

  const catalogUrl = `${API}/api/v1/catalog/poi-images?country_iso=JP&city=${encodeURIComponent(TOKYO.city_zh)}&limit=50`;
  const catalog = await fetchJson(catalogUrl);
  const catalogItems = catalog.json?.items || [];
  const catalogByLegacy = Object.fromEntries(catalogItems.map((x) => [x.legacy_value, x]));
  const catalogIssues = [];
  for (const poi of TOKYO.pois) {
    const row = catalogByLegacy[poi];
    if (!row?.image_url) catalogIssues.push(`catalog missing: ${poi}`);
  }

  const wave1 = readJsonIfExists(WAVE1_LATEST);
  const wave1Ok = wave1?.TT_CMS_POI_WAVE1_CLOSED_LOOP === 'PASS' && (wave1?.results || []).length === 9;

  const checks = {
    matrix_pass_live: matrixIssues.length === 0,
    evidence_complete: evidenceMissing.length === 0,
    catalog_readable: catalog.ok && catalogItems.length >= 9 && catalogIssues.length === 0,
    wave1_closed_loop: wave1Ok,
  };
  const allOk = Object.values(checks).every(Boolean);

  if (!allOk) {
    console.error('TT_CMS_POI_CITY_TOKYO: NOT_CLOSED');
    if (matrixIssues.length) console.error('  matrix:', matrixIssues.join('; '));
    if (evidenceMissing.length) {
      console.error(
        '  evidence:',
        evidenceMissing.map((r) => `${r.matrix_id}:${r.reason || r.verify}`).join('; '),
      );
    }
    if (catalogIssues.length) console.error('  catalog:', catalogIssues.join('; '));
    if (!catalog.ok) console.error(`  catalog http: ${catalog.status}`);
    if (!wave1Ok) console.error('  wave1: missing or not PASS');
    process.exit(1);
  }

  const stamp = NOW.replace(/[:]/g, '');
  const closure = {
    schema: 'traveltrust.cms_poi_city_closure.v1',
    stamp_utc: stamp,
    layer: 'CMS_OPERATION',
    not_governance: true,
    phase: '② staging',
    acceptance_unit: 'city',
    city: {
      country_iso: TOKYO.country_iso,
      country_zh: TOKYO.country_zh,
      city_zh: TOKYO.city_zh,
      city_en: TOKYO.city_en,
    },
    poi_count: TOKYO.matrix_ids.length,
    matrix_ids: TOKYO.matrix_ids,
    pois: TOKYO.pois,
    checks,
    matrix_rows: matrixRows,
    evidence_refs: evidenceRows.map((r) => path.relative(ROOT, r.path).replace(/\\/g, '/')),
    catalog_probe: {
      api: catalogUrl,
      http: catalog.status,
      count: catalogItems.length,
      legacy_values: TOKYO.pois.map((p) => ({ legacy_value: p, ok: Boolean(catalogByLegacy[p]?.image_url) })),
    },
    wave1_evidence: 'evidence/GO_cms_operation/poi-wave1/CMS-POI-WAVE1-CLOSED-LOOP-LATEST.json',
    next_city: NEXT_CITY,
    closure_keys: {
      TT_CMS_POI_CITY_TOKYO: 'CLOSED',
      TT_CMS_POI_ACTIVE_CITY: `${NEXT_CITY.country_iso} · ${NEXT_CITY.city_zh}`,
      TT_CMS_POI_CITY_OSAKA: 'ACTIVE',
    },
    frozen: true,
    TT_CMS_POI_CITY_TOKYO: 'CLOSED',
  };

  fs.mkdirSync(path.dirname(OUT_LATEST), { recursive: true });
  fs.writeFileSync(OUT_LATEST, JSON.stringify(closure, null, 2) + '\n');
  const stampedDir = path.join(ROOT, 'evidence/GO_cms_operation/poi-city-closure', stamp);
  fs.mkdirSync(stampedDir, { recursive: true });
  fs.writeFileSync(path.join(stampedDir, 'CMS-POI-CITY-TOKYO-CLOSURE.json'), JSON.stringify(closure, null, 2) + '\n');

  const registry = {
    schema: 'traveltrust.cms_poi_city_closure_registry.v1',
    stamp_utc: stamp,
    closed_cities: [
      {
        country_iso: TOKYO.country_iso,
        city_zh: TOKYO.city_zh,
        city_en: TOKYO.city_en,
        closed_at_utc: NOW,
        poi_count: TOKYO.matrix_ids.length,
        closure_evidence: 'evidence/GO_cms_operation/CMS-POI-CITY-TOKYO-CLOSURE-LATEST.json',
        TT_CMS_POI_CITY_TOKYO: 'CLOSED',
      },
    ],
    active_city: {
      country_iso: NEXT_CITY.country_iso,
      city_zh: NEXT_CITY.city_zh,
      city_en: NEXT_CITY.city_en,
      acceptance_target: `${NEXT_CITY.city_zh} CLOSED`,
      matrix_ids: NEXT_CITY.matrix_ids,
      poi_count: NEXT_CITY.matrix_ids.length,
    },
    TT_CMS_POI_ACTIVE_CITY: `${NEXT_CITY.country_iso} · ${NEXT_CITY.city_zh}`,
  };
  fs.writeFileSync(REGISTRY_LATEST, JSON.stringify(registry, null, 2) + '\n');

  const kickoff = readJsonIfExists(POI_KICKOFF);
  if (kickoff) {
    kickoff.stamp_utc = stamp;
    kickoff.status = 'CATALOG_BUILD_ACTIVE';
    kickoff.next_stage = 'CATALOG_BUILD';
    kickoff.upload_paused = false;
    kickoff.tokyo_city_closure = {
      status: 'CLOSED',
      evidence: 'evidence/GO_cms_operation/CMS-POI-CITY-TOKYO-CLOSURE-LATEST.json',
    };
    kickoff.active_catalog_build = {
      wave_id: 'POI-JP-CITY-OSAKA',
      label: `JP · ${NEXT_CITY.city_zh}`,
      country_iso: NEXT_CITY.country_iso,
      cities: [NEXT_CITY.city_zh],
      poi_count: NEXT_CITY.matrix_ids.length,
      acceptance_unit: 'city',
      acceptance_target: `${NEXT_CITY.city_zh} CLOSED`,
      matrix_ids: NEXT_CITY.matrix_ids,
      first_matrix_id: NEXT_CITY.matrix_ids[0],
      after: '东京 CLOSED',
    };
    kickoff.pilot_acceptance = { unit: 'city', target: `${NEXT_CITY.city_zh} CLOSED`, country_iso: NEXT_CITY.country_iso };
    kickoff.TT_CMS_POI_WAVE = 'CATALOG_BUILD_ACTIVE';
    kickoff.TT_CMS_POI_UPLOAD_PAUSED = false;
    kickoff.TT_CMS_POI_CITY_TOKYO = 'CLOSED';
    kickoff.TT_CMS_POI_ACTIVE_CITY = `${NEXT_CITY.country_iso} · ${NEXT_CITY.city_zh}`;
    fs.writeFileSync(POI_KICKOFF, JSON.stringify(kickoff, null, 2) + '\n');
  }

  const pilotWave = readJsonIfExists(PILOT_WAVE);
  if (pilotWave) {
    pilotWave.stamp_utc = stamp;
    pilotWave.tokyo_closed = true;
    pilotWave.active_catalog_build = kickoff?.active_catalog_build || registry.active_city;
    pilotWave.TT_CMS_POI_CATALOG_BUILD_NEXT = `JP · ${NEXT_CITY.city_zh}`;
    pilotWave.TT_CMS_POI_CITY_TOKYO = 'CLOSED';
    fs.writeFileSync(PILOT_WAVE, JSON.stringify(pilotWave, null, 2) + '\n');
  }

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

  console.log(`\nTT_CMS_POI_CITY_TOKYO: CLOSED`);
  console.log(`TT_CMS_POI_ACTIVE_CITY: ${NEXT_CITY.country_iso} · ${NEXT_CITY.city_zh}`);
  console.log(`Evidence: ${OUT_LATEST.replace(/\\/g, '/')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
