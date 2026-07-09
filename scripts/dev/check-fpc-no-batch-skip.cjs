#!/usr/bin/env node
/**
 * FPC No Batch Skip Policy — enforce B00→B01→…→B41 linear execution.
 *
 *   node scripts/dev/check-fpc-no-batch-skip.cjs
 *   node scripts/dev/check-fpc-no-batch-skip.cjs --batch B02
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { computeBurnDown, assertCanRun, parseExecutionSequence, EVID } = require('./lib/fpc-batch-sequence.cjs');

const batchArg = process.argv.find((a, i) => process.argv[i - 1] === '--batch');
const sequence = parseExecutionSequence();
const burn = computeBurnDown(sequence);

const report = {
  schema: 'traveltrust.fpc_100_no_batch_skip.v1',
  timestamp_utc: new Date().toISOString(),
  policy: 'NO_BATCH_SKIP',
  execution_sequence: sequence,
  burn_down: {
    completed: burn.completed,
    remaining: burn.remaining,
    total: burn.total,
    coverage_pct: burn.coverage_pct,
    release_readiness_pct: burn.release_readiness_pct,
    next_required_batch: burn.next_required_batch,
  },
  skip_violations: burn.skip_violations,
  sequence_ok: burn.sequence_ok,
};

if (batchArg) {
  report.batch_check = assertCanRun(batchArg, sequence);
}

const outPath = path.join(EVID, 'FPC-100-NO-BATCH-SKIP-LATEST.json');
fs.mkdirSync(EVID, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');

const label = burn.sequence_ok ? 'OK' : 'SKIP_VIOLATION';
console.log('TT_FPC_NO_BATCH_SKIP:', label);
console.log('TT_RELEASE_READINESS:', `${burn.release_readiness_pct}%`);
console.log('NEXT_BATCH:', burn.next_required_batch || 'ALL_DONE');
console.log('OUT:', outPath);

if (batchArg && !report.batch_check.ok) {
  console.error('BLOCKED:', report.batch_check.reason, report.batch_check.missing_prerequisites?.join(', '));
  process.exit(2);
}
process.exit(burn.sequence_ok ? 0 : 1);
