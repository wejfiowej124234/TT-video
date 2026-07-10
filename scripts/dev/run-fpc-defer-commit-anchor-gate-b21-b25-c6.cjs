#!/usr/bin/env node
/**
 * FPC-100 · defer-commit aggregate gate — B21 → B25-C6 (① local)
 *
 *   node scripts/dev/run-fpc-defer-commit-anchor-gate-b21-b25-c6.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const {
  EVID,
  ROOT,
  assertCanRun,
  computeBurnDown,
  parseExecutionSequence,
} = require('./lib/fpc-batch-sequence.cjs');
const { evaluateEvidenceComplete, REQUIRED_EVIDENCE_FIELDS } = require('./lib/fpc-batch-dod.cjs');

const ANCHOR_BATCHES = [
  'B21',
  'B22',
  'B23',
  'B24',
  'B25-C1',
  'B25-C2',
  'B25-C3',
  'B25-C4',
  'B25-C5',
  'B25-C6',
];

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
  if (burn.next_required_batch !== 'B26') {
    findings.push({
      severity: 'P0',
      id: 'dashboard_next_batch',
      detail: `expected B26 got ${burn.next_required_batch}`,
    });
  }
  if (burn.skip_violations?.length) {
    findings.push({
      severity: 'P0',
      id: 'skip_violations',
      detail: burn.skip_violations.join(','),
    });
  }

  const b26 = assertCanRun('B26');
  if (!b26.ok) {
    findings.push({
      severity: 'P0',
      id: 'b26_blocked',
      detail: b26.missing_prerequisites?.join(',') || b26.reason,
    });
  }

  const dashPath = path.join(EVID, 'FPC-100-RELEASE-DASHBOARD-LATEST.json');
  const dash = fs.existsSync(dashPath) ? JSON.parse(fs.readFileSync(dashPath, 'utf8')) : null;
  const matrixPath = path.join(EVID, 'FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json');
  const matrix = fs.existsSync(matrixPath) ? JSON.parse(fs.readFileSync(matrixPath, 'utf8')) : null;
  const uiScored = matrix?.pages?.filter((p) => p.layer2_l5_scores?.ui != null).length ?? 0;

  const allPass = findings.length === 0 && rows.every((r) => r.pass);
  const out = {
    schema: 'traveltrust.fpc_100_defer_commit_anchor_gate.v1',
    timestamp_utc: new Date().toISOString(),
    phase: '① local',
    anchor_batches: ANCHOR_BATCHES,
    batches: rows,
    burn_down: burn,
    b26_unlock: b26.ok,
    ui_scored_pages: uiScored,
    required_evidence_fields: REQUIRED_EVIDENCE_FIELDS,
    findings,
    verdict: allPass ? 'PASS' : 'FAIL',
    pass: allPass,
  };

  const outPath = path.join(EVID, 'FPC-100-DEFER-COMMIT-ANCHOR-GATE-B21-B25-C6-LATEST.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  console.log(`TT_FPC_DEFER_COMMIT_ANCHOR_GATE: ${out.verdict}`);
  console.log(`batches: ${rows.filter((r) => r.pass).length}/${rows.length} pass`);
  console.log(`next_batch: ${burn.next_required_batch} readiness: ${burn.release_readiness_pct}%`);
  console.log(`EVIDENCE: ${outPath}`);
  process.exit(allPass ? 0 : 1);
}

main();
