#!/usr/bin/env node
/**
 * Finalize FPC batch — Definition of Done (all 5 required for PASS).
 *
 *   node scripts/dev/finalize-fpc-batch-dod.cjs --batch B02
 *   node scripts/dev/finalize-fpc-batch-dod.cjs --batch B02 --refresh-dashboard
 *
 * DoD: Gate PASS · Evidence complete · Dashboard refreshed · Commit · Clean tree
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { assertCanRun } = require('./lib/fpc-batch-sequence.cjs');
const { evaluateDoD, applyDoD } = require('./lib/fpc-batch-dod.cjs');

const EVID = path.join(
  __dirname,
  '../../docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100'
);

const batchId = process.argv.find((a, i) => process.argv[i - 1] === '--batch');
const refreshFirst = process.argv.includes('--refresh-dashboard');

if (!batchId) {
  console.error('Usage: node scripts/dev/finalize-fpc-batch-dod.cjs --batch B02 [--refresh-dashboard]');
  process.exit(2);
}

const order = assertCanRun(batchId);
if (!order.ok && batchId !== 'B00') {
  console.error('NO_BATCH_SKIP:', order.missing_prerequisites?.join(', '));
  process.exit(2);
}

const dod = evaluateDoD(batchId, { refreshDashboardFirst: refreshFirst });
applyDoD(batchId, dod);

const outPath = path.join(EVID, `FPC-100-BATCH-DOD-${batchId}-LATEST.json`);
fs.mkdirSync(EVID, { recursive: true });
fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      schema: 'traveltrust.fpc_100_batch_dod.v1',
      timestamp_utc: new Date().toISOString(),
      batch_id: batchId,
      ...dod,
    },
    null,
    2
  ) + '\n'
);

console.log(`TT_FPC_BATCH_DOD_${batchId}:`, dod.all_met ? 'PASS' : dod.verdict);
console.log('ITEMS:', JSON.stringify(dod.items));
console.log('EVIDENCE:', path.join(EVID, `FPC-100-BATCH-${batchId}-LATEST.json`));
process.exit(dod.all_met ? 0 : 1);
