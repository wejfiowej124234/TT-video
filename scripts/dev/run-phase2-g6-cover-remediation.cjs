#!/usr/bin/env node
/**
 * Phase ②-C · G6 Cover/CDN remediation (Staging OCS asset baseline + DB bindings)
 *
 *   node scripts/dev/run-phase2-g6-cover-remediation.cjs
 *
 * Requires: fly proxy OR DATABASE_URL reachable (see scripts/dev/.env.staging-onboarding.local)
 * Does NOT touch governance contracts or Timelock params.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { loadAssetsManifest, verifyAssetDelivery } = require('./lib/ocs-official-assets.cjs');

const ROOT = path.join(__dirname, '../..');
const STAGING_API = (process.env.STAGING_API_BASE || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const EVID_OPS = path.join(ROOT, 'evidence/GO_production_readiness/operations-dashboard');
const EVID_PHASE2 = path.join(ROOT, 'evidence/GO_production_readiness/phase2-production-validation');

function runNode(script, env = {}) {
  const r = spawnSync(process.execPath, [path.join(__dirname, script)], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  return { ok: r.status === 0, status: r.status, out: `${r.stdout || ''}${r.stderr || ''}`.trim() };
}

function latestOcsState() {
  const base = path.join(ROOT, 'evidence/GO_official_cold_start_dataset');
  if (!fs.existsSync(base)) return null;
  return fs
    .readdirSync(base, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(base, d.name, 'state.json'))
    .filter((p) => fs.existsSync(p))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];
}

function loadStagingDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envFile = path.join(ROOT, 'scripts/dev/.env.staging-onboarding.local');
  if (!fs.existsSync(envFile)) return '';
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (t.startsWith('DATABASE_URL=')) {
      let url = t.slice('DATABASE_URL='.length).trim();
      if (url.includes('flycast')) {
        url = url.replace('@tt-traveltrust-staging.flycast:', '@127.0.0.1:15432/');
        url = url.replace(':5432/', ':15432/');
      }
      return url;
    }
  }
  return '';
}

async function ensureAssetsOnStaging() {
  const assets = loadAssetsManifest();
  const sample = assets.assets.find((a) => a.slot === 'provider-cover');
  if (!sample) return { ok: false, note: 'no sample asset' };
  const probe = await verifyAssetDelivery(STAGING_API, sample);
  if (probe.ok) return { ok: true, method: 'http_probe_existing' };
  return runNode('bootstrap-ocs-official-assets.cjs', {
    API: STAGING_API,
    FLY_APP: 'tt-api-staging',
  });
}

async function main() {
  const statePath = process.env.STATE || latestOcsState();
  if (!statePath) {
    console.error('G6_REMEDIATION: FAIL no OCS state.json — run run-official-cold-start-dataset.cjs first');
    process.exit(2);
  }

  const report = {
    schema: 'traveltrust.phase2_g6_cover_remediation.v1',
    recorded_utc: new Date().toISOString(),
    staging_api: STAGING_API,
    ocs_state: path.relative(ROOT, statePath).replace(/\\/g, '/'),
    steps: {},
  };

  report.steps.assets = await ensureAssetsOnStaging();

  const dbUrl = loadStagingDatabaseUrl();
  if (!dbUrl && !process.env.DATABASE_URL) {
    console.error('G6_REMEDIATION: WARN set DATABASE_URL or run: fly proxy 15432:5432 -a tt-traveltrust-staging');
  }

  report.steps.media_bindings = runNode('remediate-ocs-official-media-bindings-staging.cjs', {
    API: STAGING_API,
    STAGING_RC_BASELINE_AUTHORIZED: '1',
    STATE: statePath,
    DATABASE_URL: dbUrl || process.env.DATABASE_URL || '',
  });

  const alignEnv = { API: STAGING_API, STAGING_RC_BASELINE_AUTHORIZED: '1', STATE: statePath };
  for (const script of [
    'align-ocs-staging-guides-public-catalog.cjs',
    'align-ocs-staging-market-catalog.cjs',
    'align-ocs-staging-community-feed.cjs',
  ]) {
    report.steps[script] = runNode(script, alignEnv);
  }

  report.steps.g6 = runNode('run-ocs-g6-staging-public-uat-blind-review.cjs', { API: STAGING_API });
  const g6Pass = /TT_G6_STAGING_PUBLIC_UAT_BLIND_REVIEW: PASS/.test(report.steps.g6.out);

  if (g6Pass) {
    const signoff = {
      schema: 'traveltrust.phase2_cms_cos_validation.v1',
      recorded_utc: report.recorded_utc,
      phase: '②-C',
      verdict: 'PHASE2_CMS_COS_VALIDATION_PASS',
      g6: 'PASS',
      media_bindings: report.steps.media_bindings.ok ? 'PASS' : 'PARTIAL',
      note: 'G6 blind review PASS · OCS Official Asset Baseline cover URLs bound',
    };
    fs.mkdirSync(EVID_OPS, { recursive: true });
    fs.writeFileSync(path.join(EVID_OPS, 'CMS-COS-VALIDATION-LATEST.json'), `${JSON.stringify(signoff, null, 2)}\n`);
    report.signoff = signoff.verdict;
  }

  const outPath = path.join(EVID_PHASE2, 'PHASE2-G6-COVER-REMEDIATION-LATEST.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(JSON.stringify({ g6_pass: g6Pass, signoff: report.signoff || null }, null, 2));
  process.exit(g6Pass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
