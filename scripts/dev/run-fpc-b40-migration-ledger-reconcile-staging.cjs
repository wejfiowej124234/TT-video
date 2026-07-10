#!/usr/bin/env node
/**
 * B40-remediation · Staging _sqlx_migrations ledger reconciliation @ authoritative anchor (LF blobs)
 *
 *   TRAVELTRUST_FPC_B40_STAGING_OK=1 node scripts/dev/run-fpc-b40-migration-ledger-reconcile-staging.cjs
 *   TRAVELTRUST_FPC_B40_STAGING_OK=1 node scripts/dev/run-fpc-b40-migration-ledger-reconcile-staging.cjs --apply
 *
 * Requires: fly proxy 15432:5432 -a tt-traveltrust-staging (or DATABASE_URL to staging)
 * Does NOT modify ① business code — staging ledger + evidence only.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const EVID_DIR = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/B40-deployment'
);
const OUT = path.join(EVID_DIR, 'FPC-100-B40-MIGRATION-LEDGER-RECONCILIATION-LATEST.json');

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function loadAnchorSha() {
  const freeze = path.join(
    ROOT,
    'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-LOCAL-FINAL-FREEZE-LATEST.json'
  );
  return JSON.parse(fs.readFileSync(freeze, 'utf8')).authoritative_immutable_head;
}

function anchorMigrationChecksums(anchorSha) {
  const files = sh(`git ls-tree -r --name-only ${anchorSha} crates/api/migrations`)
    .split('\n')
    .filter((f) => f.endsWith('.sql'));
  const rows = [];
  for (const f of files) {
    const name = path.basename(f);
    const version = name.match(/^(\d+)/)?.[1];
    if (!version) continue;
    const blob = execSync(`git show ${anchorSha}:${f}`, { cwd: ROOT });
    rows.push({
      version,
      file: name,
      checksum_sha384: crypto.createHash('sha384').update(blob).digest('hex'),
      bytes: blob.length,
      line_endings: 'LF',
    });
  }
  return rows;
}

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envFile = path.join(ROOT, 'scripts/dev/.env.staging-onboarding.local');
  const line = fs.readFileSync(envFile, 'utf8').split('\n').find((l) => l.startsWith('DATABASE_URL='));
  if (!line) throw new Error('DATABASE_URL not set');
  let url = line.slice('DATABASE_URL='.length).trim();
  const port = process.env.FLY_PG_PROXY_PORT || '15432';
  return url.replace('@tt-traveltrust-staging.flycast:5432', `@127.0.0.1:${port}`);
}

async function runPg(dbUrl, fn) {
  const pg = require(path.join(ROOT, 'frontend/node_modules/pg'));
  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function fetchStagingLedger(dbUrl) {
  return runPg(dbUrl, async (client) => {
    const res = await client.query(
      "SELECT version, encode(checksum,'hex') AS checksum_hex, installed_on FROM _sqlx_migrations ORDER BY version"
    );
    return res.rows.map((r) => ({
      version: String(r.version),
      checksum_sha384: r.checksum_hex,
      installed_on: r.installed_on,
    }));
  });
}

async function applyUpdates(dbUrl, updates) {
  return runPg(dbUrl, async (client) => {
    const applied = [];
    for (const u of updates) {
      await client.query(
        "UPDATE _sqlx_migrations SET checksum = decode($1, 'hex') WHERE version = $2",
        [u.target_checksum_sha384, u.version]
      );
      applied.push(u);
    }
    return applied;
  });
}

function classifyRow(anchorSha, anchor, dbRow) {
  if (!dbRow) {
    return { classification: 'REAL_DEFECT', issue: 'missing_in_staging_ledger' };
  }
  if (anchor.checksum_sha384 === dbRow.checksum_sha384) {
    return { classification: 'EXPECTED', issue: 'aligned' };
  }
  const blob = execSync(`git show ${anchorSha}:crates/api/migrations/${anchor.file}`, { cwd: ROOT });
  const crlfHex = crypto.createHash('sha384').update(blob.toString('utf8').replace(/\n/g, '\r\n')).digest('hex');
  if (dbRow.checksum_sha384 === crlfHex) {
    return { classification: 'ENVIRONMENT_DRIFT', issue: 'staging_ledger_crlf_vs_anchor_lf' };
  }
  return { classification: 'CONFIG_ISSUE', issue: 'checksum_mismatch_unknown' };
}

async function main() {
  const apply = process.argv.includes('--apply');
  if (process.env.TRAVELTRUST_FPC_B40_STAGING_OK !== '1') {
    console.error('TT_B40_MIGRATION_LEDGER_RECONCILE: FAIL Owner auth TRAVELTRUST_FPC_B40_STAGING_OK=1 required');
    process.exit(2);
  }

  const anchorSha = process.env.FPC_AUTHORITATIVE_GIT_SHA || loadAnchorSha();
  const dbUrl = resolveDatabaseUrl();
  const anchorRows = anchorMigrationChecksums(anchorSha);
  const dbRows = await fetchStagingLedger(dbUrl);
  const dbByVersion = Object.fromEntries(dbRows.map((r) => [r.version, r]));

  const diff = [];
  for (const a of anchorRows) {
    const dbRow = dbByVersion[a.version];
    const meta = classifyRow(anchorSha, a, dbRow);
    if (a.checksum_sha384 !== dbRow?.checksum_sha384) {
      diff.push({
        version: a.version,
        file: a.file,
        anchor_checksum_sha384: a.checksum_sha384,
        staging_checksum_sha384: dbRow?.checksum_sha384 || null,
        installed_on: dbRow?.installed_on || null,
        classification: meta.classification,
        issue: meta.issue,
        remediation: 'UPDATE _sqlx_migrations.checksum to anchor LF blob (schema already applied)',
      });
    }
  }

  const report = {
    schema: 'traveltrust.fpc_100_b40_migration_ledger_reconciliation.v1',
    timestamp_utc: new Date().toISOString(),
    phase: '② staging',
    authoritative_git_sha: anchorSha,
    policy: 'Ledger aligned to authoritative anchor LF git blobs; no ① SQL file edits',
    summary: {
      anchor_migration_count: anchorRows.length,
      staging_ledger_count: dbRows.length,
      drift_rows: diff.length,
      aligned_rows: anchorRows.length - diff.length,
      ledger_aligned: diff.length === 0,
    },
    checksum_diff: diff,
    execution_history_note:
      'Staging ledger mixed CRLF (Windows-era deploys) and LF (Fly Linux CMS migrations). Reconcile checksum column only.',
  };

  if (apply && diff.length) {
    const applied = await applyUpdates(
      dbUrl,
      diff.map((d) => ({ version: d.version, target_checksum_sha384: d.anchor_checksum_sha384 }))
    );
    report.apply = { pass: true, updated_count: applied.length, updated_versions: applied.map((a) => a.version) };
    const dbAfter = await fetchStagingLedger(dbUrl);
    report.post_apply_mismatch_count = anchorRows.filter(
      (a) => dbAfter.find((d) => d.version === a.version)?.checksum_sha384 !== a.checksum_sha384
    ).length;
    report.summary.ledger_aligned = report.post_apply_mismatch_count === 0;
  }

  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  console.log(`TT_B40_MIGRATION_LEDGER_RECONCILE: ${report.summary.ledger_aligned ? 'PASS' : 'DRIFT'}`);
  console.log(`drift_rows=${diff.length} apply=${apply} anchor=${anchorSha.slice(0, 12)}`);
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(report.summary.ledger_aligned ? 0 : 1);
}

main().catch((e) => {
  console.error('TT_B40_MIGRATION_LEDGER_RECONCILE: FAIL', e.message);
  process.exit(2);
});
