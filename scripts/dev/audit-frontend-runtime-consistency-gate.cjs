#!/usr/bin/env node
/**
 * Frontend Runtime Consistency Gate · source-truth + runtime marker audit.
 *
 *   node scripts/dev/audit-frontend-runtime-consistency-gate.cjs
 *   AUDIT_STAMP=20260703T120000Z node scripts/dev/audit-frontend-runtime-consistency-gate.cjs
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const ROOT = path.resolve(__dirname, '../..');
const LOCAL_API = (process.env.LOCAL_API_BASE || process.env.LOCAL_API || 'http://127.0.0.1:8080').replace(/\/$/, '');
const STAGING_API = (process.env.STAGING_API_BASE || process.env.STAGING_API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const STAMP = process.env.AUDIT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z').slice(0, 15) + 'Z';
const EVID_ROOT = process.env.FRC_EVIDENCE_DIR || path.join(ROOT, 'evidence/GO_frontend_runtime_consistency_gate', STAMP);

const FIX_FILES = [
  'frontend/components/market/useMarketStandaloneBusinessPage.ts',
  'frontend/components/market/MarketSubsiteFilterBar.tsx',
  'frontend/components/market/MarketSubsiteMasonry.tsx',
  'frontend/e2e/market-subsite-catalog-race-regression.spec.ts',
];

const REGISTRY = 'registry/frontend-runtime-consistency-gate.v1.yaml';
const EXPECTED = {
  provider_all: 10,
  acquisition_all: 10,
  provider_jp: 2,
  acquisition_jp: 0,
};

function get(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`${url} HTTP ${res.statusCode}`));
          return;
        }
        try {
          resolve(JSON.parse(d));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('timeout')));
  });
}

async function apiCounts(base) {
  const out = {};
  for (const [key, p] of Object.entries({
    provider_all: '/api/v1/market/provider/listings?limit=50',
    acquisition_all: '/api/v1/market/acquisition/listings?limit=50',
    provider_jp: '/api/v1/market/provider/listings?limit=50&country=jp',
    acquisition_jp: '/api/v1/market/acquisition/listings?limit=50&country=jp',
  })) {
    const j = await get(`${base}${p}`);
    out[key] = (j.items || []).length;
  }
  return out;
}

function readRuntimeMarkers() {
  const hook = fs.readFileSync(path.join(ROOT, FIX_FILES[0]), 'utf8');
  const filterBar = fs.readFileSync(path.join(ROOT, FIX_FILES[1]), 'utf8');
  const masonry = fs.readFileSync(path.join(ROOT, FIX_FILES[2]), 'utf8');
  const e2e = fs.readFileSync(path.join(ROOT, FIX_FILES[3]), 'utf8');
  return {
    localStorage: hook.includes('MARKET_SUBSITE_COUNTRY_STORAGE'),
    url_query: hook.includes('parseCountryParam') || hook.includes('country'),
    useLayoutEffect: hook.includes('useLayoutEffect') && hook.includes('MARKET_SUBSITE_COUNTRY_STORAGE'),
    hydration: hook.includes('useLayoutEffect') && hook.includes('country'),
    epoch_guard: hook.includes('listingsFetchGeneration') && hook.includes('B-061'),
    debounce_ms: hook.includes('SUBSITE_LISTINGS_REFETCH_DEBOUNCE_MS'),
    filterbar_no_dup_hydration: filterBar.includes('useMarketStandaloneBusinessPage') && !filterBar.includes('localStorage.getItem("tt_market_subsite_country_pref'),
    masonry_single_listing_id: (masonry.match(/data-listing-id=\{item\.listingId\}/g) || []).length === 1,
    data_listing_id_dedupe: e2e.includes('[...new Set(raw)]'),
    dual_target: e2e.includes('MARKET_SUBSITE_RACE_TARGET'),
    browser_back: e2e.includes('browser back'),
    tab_switch: e2e.includes('tab switch'),
  };
}

function readRegistryMarkers() {
  const reg = fs.readFileSync(path.join(ROOT, REGISTRY), 'utf8');
  return {
    machine_key: reg.includes('TT_FRONTEND_RUNTIME_CONSISTENCY_GATE: ENFORCED'),
    dual_environment: reg.includes('dual_environment'),
    browser_scenarios: reg.includes('browser_back') && reg.includes('tab_switch'),
  };
}

async function main() {
  const blockers = [];
  const runtime = readRuntimeMarkers();
  const registry = readRegistryMarkers();

  for (const [k, v] of Object.entries(runtime)) {
    if (!v) blockers.push({ code: 'RUNTIME_MARKER_MISSING', field: k });
  }
  for (const [k, v] of Object.entries(registry)) {
    if (!v) blockers.push({ code: 'REGISTRY_MARKER_MISSING', field: k });
  }

  let localCounts = null;
  let stagingCounts = null;
  try {
    localCounts = await apiCounts(LOCAL_API);
  } catch (e) {
    blockers.push({ code: 'LOCAL_API_UNREACHABLE', error: String(e.message || e), hint: 'start-api-local-staging-db-mirror.sh' });
  }
  try {
    stagingCounts = await apiCounts(STAGING_API);
  } catch (e) {
    blockers.push({ code: 'STAGING_API_UNREACHABLE', error: String(e.message || e) });
  }

  for (const label of ['localCounts', 'stagingCounts']) {
    const counts = label === 'localCounts' ? localCounts : stagingCounts;
    if (!counts) continue;
    for (const [k, exp] of Object.entries(EXPECTED)) {
      if (counts[k] !== exp) {
        blockers.push({ code: 'API_COUNT_MISMATCH', env: label, key: k, expected: exp, actual: counts[k] });
      }
    }
  }

  if (localCounts && stagingCounts) {
    for (const k of Object.keys(EXPECTED)) {
      if (localCounts[k] !== stagingCounts[k]) {
        blockers.push({ code: 'PHASE1_PHASE2_API_PARITY_FAIL', key: k, local: localCounts[k], staging: stagingCounts[k] });
      }
    }
  }

  fs.mkdirSync(EVID_ROOT, { recursive: true });
  const report = {
    schema: 'traveltrust.frontend_runtime_consistency_gate_audit.v1',
    stamp: STAMP,
    gate: 'FRONTEND_RUNTIME_CONSISTENCY',
    classification: 'Frontend Runtime Consistency Gate',
    not_data_governance: true,
    governance_gates: { OCS: 'CLOSED', DDG: 'CLOSED', SOPCP: 'CLOSED' },
    dimensions: {
      source_truth: { expected: EXPECTED, phase1: localCounts, phase2: stagingCounts },
      runtime: runtime,
      registry: registry,
    },
    fix_files: FIX_FILES,
    shared_frontend_ssot: true,
    verdict: blockers.length === 0 ? 'PASS' : 'FAIL',
    blocking_count: blockers.length,
    blockers,
  };

  const outPath = path.join(EVID_ROOT, 'runtime-audit.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
  console.log('VERDICT', report.verdict);
  console.log('blocking_count', report.blocking_count);
  console.log('evidence', path.relative(ROOT, outPath));
  process.exit(blockers.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
