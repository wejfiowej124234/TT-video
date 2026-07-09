#!/usr/bin/env node
/**
 * FPC Certification Freeze — expiry check + delegates path invalidation to change-impact.
 *
 *   node scripts/dev/check-fpc-certification-freeze.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const EVID = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100'
);

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
}

const head = sh('git rev-parse HEAD');
const batchFiles = fs.readdirSync(EVID).filter((f) => /^FPC-100-BATCH-.+-LATEST\.json$/.test(f));

const results = [];
for (const file of batchFiles) {
  const p = path.join(EVID, file);
  const batch = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (!batch.certification_frozen) continue;

  let status = batch.pass ? 'FROZEN_OK' : batch.verdict || 'NOT_PASS';

  const expires = batch.expires_at_utc ? Date.parse(batch.expires_at_utc) : null;
  if (expires && Date.now() > expires && batch.pass) {
    status = 'EXPIRED';
    batch.verdict = 'EXPIRED';
    batch.pass = false;
    batch.expiry = { expired_at_utc: new Date().toISOString() };
    fs.writeFileSync(p, JSON.stringify(batch, null, 2) + '\n');
  }

  results.push({
    batch_id: batch.batch_id,
    status,
    frozen_git_sha: batch.frozen_git_sha,
    head,
  });
}

// Path-scoped invalidation (not full-system HEAD compare)
let impact = { any_invalidated: false };
try {
  sh('node scripts/dev/check-fpc-change-impact.cjs');
  const impactPath = path.join(EVID, 'FPC-100-CHANGE-IMPACT-LATEST.json');
  if (fs.existsSync(impactPath)) impact = JSON.parse(fs.readFileSync(impactPath, 'utf8'));
} catch {
  impact = { any_invalidated: true, note: 'change_impact_script_failed' };
}

const out = {
  schema: 'traveltrust.fpc_100_freeze_check.v2',
  timestamp_utc: new Date().toISOString(),
  head,
  expiry_results: results,
  change_impact: impact,
  any_expired: results.some((r) => r.status === 'EXPIRED'),
  any_invalidated: !!impact.any_invalidated,
};

const outPath = path.join(EVID, 'FPC-100-FREEZE-CHECK-LATEST.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
const label = out.any_invalidated ? 'INVALIDATED' : out.any_expired ? 'EXPIRED' : 'OK';
console.log('TT_FPC_100_FREEZE_CHECK:', label);
console.log('OUT:', outPath);
process.exit(out.any_invalidated || out.any_expired ? 1 : 0);
