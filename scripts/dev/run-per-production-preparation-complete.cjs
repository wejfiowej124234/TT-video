#!/usr/bin/env node
/**
 * PER Production Preparation · complete frozen five-item track (no scope expansion).
 *
 *   node scripts/dev/run-per-production-preparation-complete.cjs
 */
const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const STAMP_BASE = process.env.PER_STAMP_BASE || '20260705T014800Z';

function run(label, cmd, args) {
  console.log(`\n== ${label} ==`);
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: false });
  if (r.status !== 0) {
    console.error(`PER complete: FAIL at ${label}`);
    process.exit(r.status || 1);
  }
}

const node = process.execPath;

run('P0-2 sign-off', node, [
  'scripts/dev/sign-per-item-owner.cjs',
  '--item',
  'p0-2',
  '--signed-at',
  '2026-07-05T01:48:00Z',
]);

run('P0-3 Rollback Verified', node, [
  'scripts/dev/run-per-rollback-verified-p0-3.cjs',
  '--stamp',
  `${STAMP_BASE}P3`,
]);

run('P0-3 sign-off', node, [
  'scripts/dev/sign-per-item-owner.cjs',
  '--item',
  'p0-3',
  '--signed-at',
  '2026-07-05T01:49:00Z',
]);

run('P0-4 Monitoring Verified', node, [
  'scripts/dev/run-per-monitoring-verified-p0-4.cjs',
  '--stamp',
  `${STAMP_BASE}P4`,
]);

run('P0-4 sign-off', node, [
  'scripts/dev/sign-per-item-owner.cjs',
  '--item',
  'p0-4',
  '--signed-at',
  '2026-07-05T01:50:00Z',
]);

run('P0-5 Production Configuration Verified', node, [
  'scripts/dev/run-per-production-configuration-verified-p0-5.cjs',
  '--stamp',
  `${STAMP_BASE}P5`,
]);

run('P0-5 sign-off', node, [
  'scripts/dev/sign-per-item-owner.cjs',
  '--item',
  'p0-5',
  '--signed-at',
  '2026-07-05T01:51:00Z',
]);

run('PER Decision Review pack', node, [
  'scripts/dev/run-per-decision-review-pack.cjs',
  '--stamp',
  `${STAMP_BASE}DR`,
  '--signed-at',
  '2026-07-05T01:52:00Z',
]);

console.log('\nTT_PER_PRODUCTION_PREPARATION: COMPLETE');
console.log('TT_PER_DECISION_REVIEW: READY');
console.log('Next: CMS Operation Wave 1 (JP)');
