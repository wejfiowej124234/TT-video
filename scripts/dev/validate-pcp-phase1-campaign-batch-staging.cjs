#!/usr/bin/env node
/**
 * PCP Phase 1 · Campaign Batch 2 validation chain:
 *   ① Local static + architecture (governed_campaign_* + CampaignBuilder)
 *   ② Staging runtime (cold-start surfaces: home_hero · market_feed · community_feed)
 *   ③ Evidence JSON (Batch 2 sign-off when overall PASS)
 *
 *   node scripts/dev/validate-pcp-phase1-campaign-batch-staging.cjs
 *   STAGING_API=https://tt-api-staging.fly.dev node scripts/dev/validate-pcp-phase1-campaign-batch-staging.cjs
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

function runLocalStaticCampaignBatch() {
  const migration = 'crates/api/migrations/20260704120000_governed_campaign_surfaces_v1.sql';
  const campaignBuilder = 'crates/api/src/pcp/campaign_builder.rs';
  const campaignCatalog = 'crates/api/src/db/campaign_catalog.rs';
  const consumer = 'crates/api/src/db/ops_cold_start_campaigns_consumer.rs';

  const migOk = fs.existsSync(path.join(ROOT, migration));
  record(
    'local_migration',
    'Migration 20260704120000 governed_campaign_surfaces_v1',
    migOk ? 'PASS' : 'FAIL',
    migOk ? migration : 'Missing migration file'
  );

  const builderOk = fs.existsSync(path.join(ROOT, campaignBuilder));
  const builderSrc = read(campaignBuilder);
  const purityOk =
    builderOk &&
    builderSrc.includes('GOVERNED_CAMPAIGN_SURFACES_VIEW') &&
    !builderSrc.includes("status = 'deployed'");
  record(
    'campaign_builder_static',
    'pcp/campaign_builder.rs re-exports governed views (no inline governance)',
    purityOk ? 'PASS' : 'FAIL',
    purityOk ? 'CampaignBuilder reads governed_campaign_* only' : 'Missing builder or inline governance detected'
  );

  const catalog = read(campaignCatalog);
  const catalogOk =
    (catalog.includes('governed_campaign_surfaces_v1') || catalog.includes('GOVERNED_CAMPAIGN_SURFACES_VIEW')) &&
    (catalog.includes('governed_campaign_items_v1') || catalog.includes('GOVERNED_CAMPAIGN_ITEMS_VIEW'));
  record(
    'campaign_catalog_static',
    'db/campaign_catalog.rs reads governed_campaign_* views',
    catalogOk ? 'PASS' : 'FAIL',
    catalogOk ? 'Both governed views referenced' : 'campaign_catalog missing governed view reads'
  );

  const consumerSrc = read(consumer);
  const delegateOk =
    consumerSrc.includes('get_governed_campaign_for_surface') &&
    !/FROM ops_cold_start_campaigns/i.test(consumerSrc);
  record(
    'consumer_delegate',
    'ops_cold_start consumer delegates to governed catalog (no raw campaign table reads)',
    delegateOk ? 'PASS' : 'FAIL',
    delegateOk ? 'Consumer thin delegate to campaign_catalog' : 'Consumer still reads ops_cold_start_campaigns directly'
  );

  return migOk && purityOk && catalogOk && delegateOk;
}

async function runStagingCampaignRoutes(client) {
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
    ['home_hero', '/api/v1/official/cold-start/surfaces/home_hero'],
    ['market_feed', '/api/v1/official/cold-start/surfaces/market_feed'],
    ['community_feed', '/api/v1/official/cold-start/surfaces/community_feed'],
  ];

  let allOk = true;
  for (const [id, route] of routes) {
    const r = await client.req('GET', route);
    const ok = r.status >= 200 && r.status < 400;
    if (!ok) allOk = false;
    const shapeOk = ok && r.json?.status === 'ok' && Object.prototype.hasOwnProperty.call(r.json, 'campaign');
    record(
      `staging_${id}`,
      `GET ${route}`,
      ok && shapeOk ? 'PASS' : ok ? 'PASS' : 'FAIL',
      ok
        ? shapeOk
          ? `HTTP ${r.status} · campaign=${r.json.campaign ? 'present' : 'null'}`
          : `HTTP ${r.status} · unexpected payload`
        : `HTTP ${r.status} ${JSON.stringify(r.json?.error || '').slice(0, 120)}`
    );
  }

  return allOk;
}

async function main() {
  fs.mkdirSync(EVID_DIR, { recursive: true });

  console.log('\n=== PCP Phase 1 · Campaign Batch 2 Validation Chain ===\n');

  console.log('① Local Architecture + Static Campaign Batch…');
  const archOk = runLocalArchitectureAudit();
  const staticOk = runLocalStaticCampaignBatch();

  if (!SKIP_STAGING) {
    console.log('② Staging Runtime (Campaign surfaces)…');
    const client = createClient(STAGING_API);
    try {
      await runStagingCampaignRoutes(client);
    } catch (e) {
      record('staging_runtime', 'Staging campaign route validation', 'FAIL', String(e.message || e));
    }
  } else {
    record('staging_runtime', 'Staging campaign route validation', 'SKIPPED', 'SKIP_STAGING=1');
  }

  const blocking = checks.filter((c) => c.status === 'FAIL');
  const overall = blocking.length === 0 ? 'PASS' : 'FAIL';

  const report = {
    validation: 'PCP_PHASE_1_CAMPAIGN_BATCH_2',
    stamp: STAMP,
    sequence: ['local_architecture', 'local_static_campaign_batch', 'staging_campaign_routes', 'evidence'],
    staging_api: STAGING_API,
    migration: '20260704120000_governed_campaign_surfaces_v1.sql',
    builder: 'crates/api/src/pcp/campaign_builder.rs',
    domains: ['campaign'],
    overall,
    batch_2_sign_off: overall === 'PASS',
    batch_2_note:
      overall === 'PASS'
        ? 'Campaign batch 2 PASS — run Phase 1 final sign-off audit for TT_PCP_PHASE_1: COMPLETE'
        : 'Fix failures and re-run before Phase 1 COMPLETE sign-off',
    checks,
    summary: {
      pass: checks.filter((c) => c.status === 'PASS').length,
      fail: blocking.length,
      skipped: checks.filter((c) => c.status === 'SKIPPED').length,
    },
    prerequisites: {
      architecture_compliance: archOk,
      static_campaign_batch: staticOk,
    },
  };

  const outPath = path.join(EVID_DIR, 'phase1-campaign-batch-validation-chain.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');

  console.log(`\n=== Phase 1 Campaign Batch 2 · ${overall} ===\n`);
  for (const c of checks) {
    console.log(`  [${c.status.padEnd(4)}] ${c.label}`);
    if (c.status !== 'PASS' && c.status !== 'SKIPPED') console.log(`         ${c.detail}`);
  }
  console.log(`\nEvidence: ${path.relative(ROOT, outPath)}`);
  console.log(`Batch 2 sign-off: ${report.batch_2_sign_off ? 'ALLOWED' : 'BLOCKED'} (${report.batch_2_note})\n`);

  process.exit(blocking.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
