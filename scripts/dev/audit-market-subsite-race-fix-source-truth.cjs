#!/usr/bin/env node
/**
 * Phase① local_mirror vs Phase② staging · Market Subsite Race Fix source-truth audit.
 *
 *   node scripts/dev/audit-market-subsite-race-fix-source-truth.cjs
 *   LOCAL_API=http://127.0.0.1:8080 STAGING_API=https://tt-api-staging.fly.dev node scripts/dev/audit-market-subsite-race-fix-source-truth.cjs
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const ROOT = path.resolve(__dirname, '../..');
const LOCAL_API = (process.env.LOCAL_API_BASE || process.env.LOCAL_API || 'http://127.0.0.1:8080').replace(/\/$/, '');
const STAGING_API = (process.env.STAGING_API_BASE || process.env.STAGING_API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const STAMP = process.env.AUDIT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z').slice(0, 15) + 'Z';

const FIX_FILES = [
  'frontend/components/market/useMarketStandaloneBusinessPage.ts',
  'frontend/components/market/MarketSubsiteFilterBar.tsx',
  'frontend/components/market/MarketSubsiteMasonry.tsx',
  'frontend/e2e/market-subsite-catalog-race-regression.spec.ts',
  'frontend/lib/marketSubsiteFilters.ts',
  'frontend/lib/marketHubBrowserTruth.ts',
  'frontend/app/market/MarketPageClient.tsx',
];

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
  for (const [key, path] of Object.entries({
    provider_all: '/api/v1/market/provider/listings?limit=50',
    acquisition_all: '/api/v1/market/acquisition/listings?limit=50',
    provider_jp: '/api/v1/market/provider/listings?limit=50&country=jp',
    acquisition_jp: '/api/v1/market/acquisition/listings?limit=50&country=jp',
  })) {
    const j = await get(`${base}${path}`);
    out[key] = (j.items || []).length;
  }
  return out;
}

function readFixMarkers() {
  const hook = fs.readFileSync(path.join(ROOT, FIX_FILES[0]), 'utf8');
  const masonry = fs.readFileSync(path.join(ROOT, FIX_FILES[2]), 'utf8');
  const filters = fs.readFileSync(path.join(ROOT, FIX_FILES[4]), 'utf8');
  const hubTruth = fs.readFileSync(path.join(ROOT, FIX_FILES[5]), 'utf8');
  const hubPage = fs.readFileSync(path.join(ROOT, FIX_FILES[6]), 'utf8');
  return {
    epoch_guard: hook.includes('listingsFetchGeneration') && hook.includes('B-061'),
    layout_hydration: hook.includes('useLayoutEffect') && hook.includes('useEffectiveSubsiteCountry'),
    debounce_ms: hook.includes('SUBSITE_LISTINGS_REFETCH_DEBOUNCE_MS'),
    filterbar_no_dup_hydration: fs.readFileSync(path.join(ROOT, FIX_FILES[1]), 'utf8').includes('useEffectiveSubsiteCountry'),
    masonry_single_listing_id:
      (masonry.match(/data-listing-id=\{item\.listingId\}/g) || []).length === 1,
    e2e_dedupe: fs.readFileSync(path.join(ROOT, FIX_FILES[3]), 'utf8').includes('[...new Set(raw)]'),
    e2e_dual_target: fs.readFileSync(path.join(ROOT, FIX_FILES[3]), 'utf8').includes('MARKET_SUBSITE_RACE_TARGET'),
    sync_effective_country: hook.includes('resolveEffectiveSubsiteCountry') || filters.includes('resolveEffectiveSubsiteCountry'),
    explicit_save_flag: filters.includes('MARKET_SUBSITE_COUNTRY_SAVED_STORAGE') && filters.includes('hasExplicitSubsiteCountryPref'),
    browser_truth_attrs: fs.readFileSync(path.join(ROOT, 'frontend/components/market/MarketStandaloneBusinessPage.tsx'), 'utf8').includes('data-tt-subsite-country'),
    subsite_listings_query_attr: fs.readFileSync(path.join(ROOT, 'frontend/components/market/MarketStandaloneBusinessPage.tsx'), 'utf8').includes('data-tt-subsite-listings-query'),
    e2e_browser_truth: fs.readFileSync(path.join(ROOT, FIX_FILES[3]), 'utf8').includes('data-tt-subsite-list-count'),
    e2e_orphan_ls: fs.readFileSync(path.join(ROOT, FIX_FILES[3]), 'utf8').includes('orphan localStorage'),
    hub_browser_truth_attrs:
      hubPage.includes('data-tt-market-country') &&
      hubPage.includes('data-tt-market-orders-query') &&
      hubPage.includes('data-tt-market-guides-query'),
    hub_query_builder: hubTruth.includes('buildMarketHubDiscoverOrdersQuery') && hubTruth.includes('buildMarketHubGuidesQuery'),
  };
}

async function main() {
  const blockers = [];
  const markers = readFixMarkers();
  for (const [k, v] of Object.entries(markers)) {
    if (!v) blockers.push({ code: 'FIX_MARKER_MISSING', field: k });
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
        blockers.push({
          code: 'PHASE1_PHASE2_API_PARITY_FAIL',
          key: k,
          local: localCounts[k],
          staging: stagingCounts[k],
        });
      }
    }
  }

  const outDir = path.join(ROOT, 'evidence/GO_market_subsite_frontend_race_fix', STAMP);
  fs.mkdirSync(outDir, { recursive: true });

  const report = {
    schema: 'traveltrust.market_subsite_race_fix_source_truth.v1',
    stamp: STAMP,
    classification: 'Market Subsite Frontend Race Fix',
    not_data_governance: true,
    governance_gates: { OCS: 'CLOSED', DDG: 'CLOSED', SOPCP: 'CLOSED' },
    phase1: { label: 'local_staging_mirror', api_base: LOCAL_API, counts: localCounts },
    phase2: { label: 'staging', api_base: STAGING_API, counts: stagingCounts },
    expected: EXPECTED,
    fix_markers: markers,
    fix_files: FIX_FILES,
    shared_frontend_ssot: true,
    verdict: blockers.length === 0 ? 'PASS' : 'FAIL',
    blocking_count: blockers.length,
    blockers,
  };

  const outPath = path.join(outDir, 'source-truth-audit.json');
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
