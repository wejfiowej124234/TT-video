#!/usr/bin/env node
/**
 * FPC Change Impact — invalidate only affected batches (not full system).
 *
 *   node scripts/dev/check-fpc-change-impact.cjs
 *   node scripts/dev/check-fpc-change-impact.cjs --dry-run
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
const MAP = path.join(ROOT, 'registry/fpc-100-change-impact-map.v1.json');
const dryRun = process.argv.includes('--dry-run');

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function norm(p) {
  return p.replace(/\\/g, '/');
}

function loadMap() {
  return JSON.parse(fs.readFileSync(MAP, 'utf8'));
}

function isDocOnly(file, map) {
  return map.doc_only_prefixes.some((pre) => file.startsWith(pre));
}

function batchesForFile(file, map) {
  const hits = new Set();
  for (const rule of map.rules) {
    for (const pre of rule.paths) {
      const prefix = pre.replace(/\*\*$/, '');
      if (file.startsWith(prefix) || file.includes(prefix)) {
        rule.batches.forEach((b) => hits.add(b));
      }
    }
  }
  return hits;
}

const map = loadMap();
const head = sh('git rev-parse HEAD');
const batchFiles = fs.readdirSync(EVID).filter((f) => /^FPC-100-BATCH-.+-LATEST\.json$/.test(f));

const report = {
  schema: 'traveltrust.fpc_100_change_impact.v1',
  timestamp_utc: new Date().toISOString(),
  head,
  dry_run: dryRun,
  batches: [],
};

for (const file of batchFiles) {
  const p = path.join(EVID, file);
  const batch = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (!batch.certification_frozen || !batch.pass) {
    report.batches.push({ batch_id: batch.batch_id, status: 'SKIPPED', reason: 'not_frozen_or_not_pass' });
    continue;
  }

  const frozen = batch.frozen_git_sha;
  if (!frozen || frozen === head) {
    report.batches.push({ batch_id: batch.batch_id, status: 'FROZEN_OK', frozen_git_sha: frozen });
    continue;
  }

  let changed;
  try {
    changed = sh(`git diff --name-only ${frozen}..${head}`).split('\n').filter(Boolean).map(norm);
  } catch {
    report.batches.push({ batch_id: batch.batch_id, status: 'FROZEN_OK', note: 'diff_failed' });
    continue;
  }

  const codeChanges = changed.filter((f) => !isDocOnly(f, map));
  if (codeChanges.length === 0) {
    report.batches.push({
      batch_id: batch.batch_id,
      status: 'FROZEN_OK',
      reason: 'doc_only_changes_since_frozen',
      changed_files: changed,
    });
    continue;
  }

  const impacted = new Set();
  for (const f of codeChanges) {
    batchesForFile(f, map).forEach((b) => impacted.add(b));
  }
  (map.catch_all_batches_on_any_code_change || []).forEach((b) => impacted.add(b));

  const batchId = batch.batch_id;
  if (!impacted.has(batchId)) {
    report.batches.push({
      batch_id: batchId,
      status: 'FROZEN_OK',
      reason: 'code_changed_outside_batch_impact_map',
      code_changes: codeChanges.length,
    });
    continue;
  }

  const matchingChanges = codeChanges.filter((f) => batchesForFile(f, map).has(batchId));

  if (!dryRun) {
    batch.verdict = 'INVALIDATED';
    batch.pass = false;
    batch.invalidation = {
      reason: 'change_impact',
      frozen_git_sha: frozen,
      current_head: head,
      impacted_by_files: matchingChanges,
      invalidated_at_utc: new Date().toISOString(),
    };
    fs.writeFileSync(p, JSON.stringify(batch, null, 2) + '\n');
  }

  report.batches.push({
    batch_id: batchId,
    status: 'INVALIDATED',
    impacted_by_files: matchingChanges,
    all_code_changes: codeChanges.length,
  });
}

report.any_invalidated = report.batches.some((b) => b.status === 'INVALIDATED');
const outPath = path.join(EVID, 'FPC-100-CHANGE-IMPACT-LATEST.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');
console.log('TT_FPC_100_CHANGE_IMPACT:', report.any_invalidated ? 'INVALIDATED' : 'OK');
console.log('OUT:', outPath);
process.exit(report.any_invalidated ? 1 : 0);
