#!/usr/bin/env node
/**
 * FPC-100 · defer-commit aggregate gate — B30 → B36 (① local · pre-commit)
 *
 *   node scripts/dev/run-fpc-defer-commit-anchor-gate-b30-b36.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const {
  EVID,
  assertCanRun,
  computeBurnDown,
  parseExecutionSequence,
} = require('./lib/fpc-batch-sequence.cjs');
const { evaluateEvidenceComplete } = require('./lib/fpc-batch-dod.cjs');

const ANCHOR_BATCHES = ['B30', 'B31', 'B32', 'B33', 'B34', 'B35', 'B36'];

function loadBatch(batchId) {
  const p = path.join(EVID, `FPC-100-BATCH-${batchId}-LATEST.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function main() {
  const findings = [];
  const rows = [];

  for (const batchId of ANCHOR_BATCHES) {
    const batch = loadBatch(batchId);
    if (!batch) {
      findings.push({ batch_id: batchId, severity: 'P0', id: 'evidence_missing', detail: 'LATEST.json missing' });
      rows.push({ batch_id: batchId, pass: false });
      continue;
    }
    const p0 = (batch.findings || []).filter((f) => f.severity === 'P0').length;
    const p1 = (batch.findings || []).filter((f) => f.severity === 'P1').length;
    const frozen = !!batch.certification_frozen;
    const gatePass = batch.gate_pass !== false && batch.verdict !== 'FAIL';
    const verdictOk = batch.verdict === 'PASS' || batch.verdict === 'PASS_WITH_WARN';
    const evidenceOk = evaluateEvidenceComplete(batch);
    const pass = frozen && gatePass && verdictOk && evidenceOk && p0 === 0 && p1 === 0;
    if (!pass) {
      findings.push({
        batch_id: batchId,
        severity: 'P0',
        id: 'batch_not_anchor_ready',
        detail: `frozen=${frozen} gate=${gatePass} verdict=${batch.verdict} evidence=${evidenceOk} p0=${p0} p1=${p1}`,
      });
    }
    rows.push({
      batch_id: batchId,
      pass,
      verdict: batch.verdict,
      certification_frozen: frozen,
      gate_pass: batch.gate_pass,
      p0,
      p1,
      evidence_complete: evidenceOk,
    });
  }

  const burn = computeBurnDown(parseExecutionSequence());
  if (burn.next_required_batch !== 'B40') {
    findings.push({
      severity: 'P0',
      id: 'dashboard_next_batch',
      detail: `expected B40 got ${burn.next_required_batch}`,
    });
  }
  if (burn.skip_violations?.length) {
    findings.push({
      severity: 'P0',
      id: 'skip_violations',
      detail: burn.skip_violations.join(','),
    });
  }

  const b40 = assertCanRun('B40');
  if (!b40.ok) {
    findings.push({
      severity: 'P0',
      id: 'b40_unlock',
      detail: b40.missing_prerequisites?.join(',') || b40.reason,
    });
  }

  const allPass = findings.length === 0 && rows.every((r) => r.pass);
  const out = {
    schema: 'traveltrust.fpc_100_defer_commit_anchor_gate.v1',
    timestamp_utc: new Date().toISOString(),
    phase: '① local',
    anchor_id: 'B30-B36',
    anchor_batches: ANCHOR_BATCHES,
    batches: rows,
    burn_down: burn,
    b40_unlock: b40.ok,
    findings,
    verdict: allPass ? 'PASS' : 'FAIL',
    pass: allPass,
  };

  const outPath = path.join(EVID, 'FPC-100-DEFER-COMMIT-ANCHOR-GATE-B30-B36-LATEST.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  console.log(`TT_FPC_DEFER_COMMIT_ANCHOR_GATE_B30_B36: ${out.verdict}`);
  console.log(`batches: ${rows.filter((r) => r.pass).length}/${rows.length} pass`);
  console.log(`next_batch: ${burn.next_required_batch} readiness: ${burn.release_readiness_pct}%`);
  console.log(`EVIDENCE: ${outPath}`);
  process.exit(allPass ? 0 : 1);
}

main();
