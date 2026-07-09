#!/usr/bin/env node
/**
 * FPC Certification Freeze check — invalidate PASS batches if HEAD diverged from frozen_git_sha.
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
const batchFiles = fs.readdirSync(EVID).filter((f) => /^FPC-100-BATCH-B.+LATEST\.json$/.test(f));

const results = [];
for (const file of batchFiles) {
  const p = path.join(EVID, file);
  const batch = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (!batch.certification_frozen || !batch.pass) continue;

  const frozen = batch.frozen_git_sha || batch.git?.head;
  let status = 'FROZEN_OK';
  if (frozen && frozen !== head) {
    status = 'INVALIDATED';
    batch.verdict = 'INVALIDATED';
    batch.pass = false;
    batch.invalidation = {
      reason: 'git_head_changed_since_frozen',
      frozen_git_sha: frozen,
      current_head: head,
      invalidated_at_utc: new Date().toISOString(),
    };
    fs.writeFileSync(p, JSON.stringify(batch, null, 2) + '\n');
  }

  const expires = batch.expires_at_utc ? Date.parse(batch.expires_at_utc) : null;
  if (expires && Date.now() > expires && status === 'FROZEN_OK') {
    status = 'EXPIRED';
    batch.verdict = 'EXPIRED';
    batch.pass = false;
    fs.writeFileSync(p, JSON.stringify(batch, null, 2) + '\n');
  }

  results.push({ batch_id: batch.batch_id, status, frozen_git_sha: frozen, head });
}

const out = {
  schema: 'traveltrust.fpc_100_freeze_check.v1',
  timestamp_utc: new Date().toISOString(),
  head,
  results,
  any_invalidated: results.some((r) => r.status === 'INVALIDATED'),
  any_expired: results.some((r) => r.status === 'EXPIRED'),
};

const outPath = path.join(EVID, 'FPC-100-FREEZE-CHECK-LATEST.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
console.log('TT_FPC_100_FREEZE_CHECK:', out.any_invalidated ? 'INVALIDATED' : out.any_expired ? 'EXPIRED' : 'OK');
console.log('OUT:', outPath);
process.exit(out.any_invalidated || out.any_expired ? 1 : 0);
