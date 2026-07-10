/**
 * FPC batch execution sequence — No Batch Skip Policy SSOT consumer.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const REGISTRY = path.join(ROOT, 'registry/full-production-certification-checklist.v1.yaml');
const EVID = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100'
);

/** Canonical order — B00→B41 linear; B24 before B25-C* sub-corridors. */
const DEFAULT_SEQUENCE = [
  'B00', 'B01', 'B02', 'B03', 'B04', 'B05', 'B06', 'B07', 'B08', 'B09', 'B10', 'B11',
  'B12', 'B13', 'B14', 'B15', 'B16', 'B17', 'B18', 'B19', 'B20', 'B21', 'B22', 'B23',
  'B24', 'B25-C1', 'B25-C2', 'B25-C3', 'B25-C4', 'B25-C5', 'B25-C6',
  'B26', 'B30', 'B31', 'B32', 'B33', 'B34', 'B35', 'B36', 'B40', 'B41',
];

function parseExecutionSequence() {
  if (!fs.existsSync(REGISTRY)) return DEFAULT_SEQUENCE;
  const raw = fs.readFileSync(REGISTRY, 'utf8');
  const block = raw.match(/execution_sequence:\s*\n((?:\s+-\s+B[^\n]+\n)+)/);
  if (!block) return DEFAULT_SEQUENCE;
  return block[1]
    .split('\n')
    .map((l) => l.match(/-\s+(B\S+)/)?.[1])
    .filter(Boolean);
}

function loadBatchPass(batchId) {
  const p = path.join(EVID, `FPC-100-BATCH-${batchId}-LATEST.json`);
  if (!fs.existsSync(p)) return false;
  try {
    const b = JSON.parse(fs.readFileSync(p, 'utf8'));
    const verdictOk = b.verdict === 'PASS' || b.verdict === 'PASS_WITH_WARN';
    const dodOk = b.dod?.all_met === true;
    // ① Engineering: frozen gate PASS + evidence; commit/clean-tree deferred to batch anchor.
    const engineeringOk =
      !!b.certification_frozen &&
      !!b.gate_pass &&
      b.dod?.gate_pass !== false &&
      (verdictOk || b.dod?.evidence_complete === true);
    return dodOk || engineeringOk;
  } catch {
    return false;
  }
}

function batchStatuses(sequence) {
  return sequence.map((id) => ({
    batch_id: id,
    pass: loadBatchPass(id),
  }));
}

function computeBurnDown(sequence = parseExecutionSequence()) {
  const statuses = batchStatuses(sequence);
  const completed = statuses.filter((s) => s.pass).length;
  const total = sequence.length;
  let contiguous = 0;
  for (const s of statuses) {
    if (s.pass) contiguous += 1;
    else break;
  }
  const skipped = [];
  for (let i = 0; i < statuses.length; i += 1) {
    if (statuses[i].pass) {
      for (let j = 0; j < i; j += 1) {
        if (!statuses[j].pass && !skipped.includes(statuses[j].batch_id)) {
          skipped.push(statuses[j].batch_id);
        }
      }
    }
  }
  const nextRequired = statuses.find((s) => !s.pass)?.batch_id || null;
  const releaseReadinessPct = total ? Math.round((contiguous / total) * 1000) / 10 : 0;
  return {
    completed,
    remaining: total - completed,
    total,
    contiguous_completed: contiguous,
    release_readiness_pct: releaseReadinessPct,
    coverage_pct: total ? Math.round((completed / total) * 1000) / 10 : 0,
    next_required_batch: nextRequired,
    skip_violations: skipped,
    sequence_ok: skipped.length === 0,
  };
}

function assertCanRun(batchId, sequence = parseExecutionSequence()) {
  const idx = sequence.indexOf(batchId);
  if (idx < 0) {
    return { ok: false, reason: `unknown_batch:${batchId}` };
  }
  const missing = [];
  for (let i = 0; i < idx; i += 1) {
    if (!loadBatchPass(sequence[i])) missing.push(sequence[i]);
  }
  if (missing.length) {
    return {
      ok: false,
      reason: 'NO_BATCH_SKIP',
      batch_id: batchId,
      missing_prerequisites: missing,
      next_required_batch: sequence.find((id) => !loadBatchPass(id)) || null,
    };
  }
  return { ok: true, batch_id: batchId };
}

module.exports = {
  DEFAULT_SEQUENCE,
  parseExecutionSequence,
  loadBatchPass,
  batchStatuses,
  computeBurnDown,
  assertCanRun,
  EVID,
  ROOT,
};
