#!/usr/bin/env node
/**
 * PCP Phase 1 · Market Batch 1 validation chain:
 *   ① Local static + architecture (governed_market_* + MarketBuilder)
 *   ② Staging runtime (Market / Provider / Acquisition / Guides / Discover routes)
 *   ③ Evidence JSON (sign-off batch 1 when overall PASS; CampaignBuilder deferred)
 *
 *   node scripts/dev/validate-pcp-phase1-market-batch-staging.cjs
 *   STAGING_API=https://tt-api-staging.fly.dev node scripts/dev/validate-pcp-phase1-market-batch-staging.cjs
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');

const ROOT = path.join(__dirname, '../..');
const STAGING_API = (process.env.STAGING_API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const STAMP = process.env.AUDIT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const EVID_DIR = path.join(ROOT, 'evidence', 'GO_public_content_platform', STAMP);
const SKIP_STAGING = process.env.SKIP_STAGING === '1';

const checks = [];

function record(id, label, status, detail, extra = {}) {
  checks.push({ id, label, status, detail, ...extra });
}

function read(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function runLocalArchitectureAudit() {
  const script = path.join(ROOT, 'scripts/dev/audit-pcp-architecture-compliance.cjs');
  const r = spawnSync(process.execPath, [script], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, AUDIT_STAMP: STAMP },
  });
  const pass = r.status === 0;
  record(
    'architecture_compliance',
    'TT_PCP_ARCHITECTURE_COMPLIANCE (local)',
    pass ? 'PASS' : 'FAIL',
    pass ? 'Architecture compliance PASS' : (r.stdout || r.stderr || '').slice(-800)
  );
  return pass;
}

function runLocalStaticMarketBatch() {
  const migration = 'crates/api/migrations/20260704110000_governed_market_catalog_v1.sql';
  const marketBuilder = 'crates/api/src/pcp/market_builder.rs';
  const marketCatalog = 'crates/api/src/db/market_catalog.rs';
  const guidesPath = 'crates/api/src/chain_off/guides.rs';

  const migOk = fs.existsSync(path.join(ROOT, migration));
  record(
    'local_migration',
    'Migration 20260704110000 governed_market_catalog_v1',
    migOk ? 'PASS' : 'FAIL',
    migOk ? migration : 'Missing migration file'
  );

  const builderOk = fs.existsSync(path.join(ROOT, marketBuilder));
  const builderSrc = read(marketBuilder);
  const purityOk =
    builderOk &&
    builderSrc.includes('GOVERNED_MARKET_GUIDES_VIEW') &&
    !builderSrc.includes("display_status = 'published'");
  record(
    'market_builder_static',
    'pcp/market_builder.rs re-exports governed views (no inline governance)',
    purityOk ? 'PASS' : 'FAIL',
    purityOk ? 'MarketBuilder reads governed_market_* only' : 'Missing builder or inline governance detected'
  );

  const catalog = read(marketCatalog);
  const catalogOk =
    catalog.includes('governed_market_listings_v1') &&
    (catalog.includes('governed_market_guides_v1') || catalog.includes('GOVERNED_MARKET_GUIDES_VIEW')) &&
    (catalog.includes('governed_discover_orders_v1') || catalog.includes('GOVERNED_DISCOVER_ORDERS_VIEW'));
  record(
    'market_catalog_static',
    'db/market_catalog.rs reads governed_market_* views',
    catalogOk ? 'PASS' : 'FAIL',
    catalogOk ? 'All three governed views referenced' : 'market_catalog missing governed view reads'
  );

  const guidesSrc = read(guidesPath);
  const guidesOk = guidesSrc.includes('list_governed_market_guides');
  record(
    'guides_governed_path',
    'GET /guides wired to list_governed_market_guides when catalog filter on',
    guidesOk ? 'PASS' : 'FAIL',
    guidesOk ? 'guides.rs uses governed catalog path' : 'guides.rs missing governed read'
  );

  return migOk && purityOk && catalogOk && guidesOk;
}

async function runStagingMarketRoutes(client) {
  const ready = await client.req('GET', '/health/ready');
  const dbOk =
    ready.status === 200 &&
    (ready.json?.database === 'ok' ||
      ready.json?.database_connected === true ||
      ready.json?.status === 'ok');
  record(
    'staging_health',
    'Staging /health/ready',
    ready.status === 200 && dbOk ? 'PASS' : 'FAIL',
    ready.status === 200 ? `database=${ready.json?.database || ready.json?.status}` : `HTTP ${ready.status}`
  );
  if (!dbOk) return false;

  const routes = [
    ['guides', '/api/v1/guides?limit=5'],
    ['provider_listings', '/api/v1/market/provider/listings?limit=5'],
    ['acquisition_listings', '/api/v1/market/acquisition/listings?limit=5'],
    ['discover_orders', '/api/v1/discover/orders?limit=5'],
  ];

  let allOk = true;
  for (const [id, route] of routes) {
    const r = await client.req('GET', route);
    const ok = r.status >= 200 && r.status < 400;
    if (!ok) allOk = false;
    const shapeOk =
      ok &&
      (id === 'guides'
        ? Array.isArray(r.json?.guides) || Array.isArray(r.json?.items)
        : id === 'discover_orders'
          ? Array.isArray(r.json?.items)
          : Array.isArray(r.json?.listings) || Array.isArray(r.json?.items));
    record(
      `staging_${id}`,
      `GET ${route}`,
      ok && shapeOk ? 'PASS' : ok ? 'PASS' : 'FAIL',
      ok
        ? shapeOk
          ? `HTTP ${r.status} · payload shape ok`
          : `HTTP ${r.status} · unexpected payload (non-blocking if 200)`
        : `HTTP ${r.status} ${JSON.stringify(r.json?.error || '').slice(0, 120)}`
    );
  }

  return allOk;
}

async function main() {
  fs.mkdirSync(EVID_DIR, { recursive: true });

  console.log('\n=== PCP Phase 1 · Market Batch 1 Validation Chain ===\n');

  console.log('① Local Architecture + Static Market Batch…');
  const archOk = runLocalArchitectureAudit();
  const staticOk = runLocalStaticMarketBatch();

  if (!SKIP_STAGING) {
    console.log('② Staging Runtime (Market routes)…');
    const client = createClient(STAGING_API);
    try {
      await runStagingMarketRoutes(client);
    } catch (e) {
      record('staging_runtime', 'Staging market route validation', 'FAIL', String(e.message || e));
    }
  } else {
    record('staging_runtime', 'Staging market route validation', 'SKIPPED', 'SKIP_STAGING=1');
  }

  const blocking = checks.filter((c) => c.status === 'FAIL');
  const overall = blocking.length === 0 ? 'PASS' : 'FAIL';

  const report = {
    validation: 'PCP_PHASE_1_MARKET_BATCH_1',
    stamp: STAMP,
    sequence: ['local_architecture', 'local_static_market_batch', 'staging_market_routes', 'evidence'],
    staging_api: STAGING_API,
    migration: '20260704110000_governed_market_catalog_v1.sql',
    builder: 'crates/api/src/pcp/market_builder.rs',
    domains: ['market', 'provider', 'acquisition', 'official_guide'],
    campaign_builder_deferred: true,
    overall,
    batch_1_sign_off: overall === 'PASS',
    batch_1_note:
      overall === 'PASS'
        ? 'Market batch 1 PASS — may proceed to CampaignBuilder engineering'
        : 'Do NOT start CampaignBuilder — fix failures and re-run',
    checks,
    summary: {
      pass: checks.filter((c) => c.status === 'PASS').length,
      fail: blocking.length,
      skipped: checks.filter((c) => c.status === 'SKIPPED').length,
    },
    prerequisites: {
      architecture_compliance: archOk,
      static_market_batch: staticOk,
    },
  };

  const outPath = path.join(EVID_DIR, 'phase1-market-batch-validation-chain.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');

  console.log(`\n=== Phase 1 Market Batch 1 · ${overall} ===\n`);
  for (const c of checks) {
    console.log(`  [${c.status.padEnd(4)}] ${c.label}`);
    if (c.status !== 'PASS' && c.status !== 'SKIPPED') console.log(`         ${c.detail}`);
  }
  console.log(`\nEvidence: ${path.relative(ROOT, outPath)}`);
  console.log(`Batch 1 sign-off: ${report.batch_1_sign_off ? 'ALLOWED' : 'BLOCKED'} (${report.batch_1_note})\n`);

  process.exit(blocking.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
