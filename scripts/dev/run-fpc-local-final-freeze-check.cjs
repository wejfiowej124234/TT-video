#!/usr/bin/env node
/**
 * FPC-100 · Local Final Freeze check — B21→B36 frozen chain @ ① (pre/post anchor)
 *
 *   node scripts/dev/run-fpc-local-final-freeze-check.cjs [--require-clean]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { EVID, ROOT, computeBurnDown, parseExecutionSequence } = require('./lib/fpc-batch-sequence.cjs');
const { evaluateEvidenceComplete } = require('./lib/fpc-batch-dod.cjs');

const FREEZE_CHAIN_B21_B36 = [
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
  'B26',
  'B30',
  'B31',
  'B32',
  'B33',
  'B34',
  'B35',
  'B36',
];

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function loadBatch(batchId) {
  const p = path.join(EVID, `FPC-100-BATCH-${batchId}-LATEST.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function main() {
  const requireClean = process.argv.includes('--require-clean');
  const stamp = new Date().toISOString();
  const head = sh('git rev-parse HEAD');
  const branch = sh('git branch --show-current');
  const porcelain = sh('git status --porcelain');
  const treeClean = porcelain.length === 0;
  const findings = [];
  const batchRows = [];

  if (requireClean && !treeClean) {
    findings.push({
      severity: 'P0',
      id: 'working_tree_not_clean',
      detail: porcelain.split('\n').slice(0, 8).join('; '),
    });
  }

  for (const batchId of FREEZE_CHAIN_B21_B36) {
    const batch = loadBatch(batchId);
    if (!batch) {
      findings.push({ batch_id: batchId, severity: 'P0', id: 'evidence_missing' });
      batchRows.push({ batch_id: batchId, pass: false });
      continue;
    }
    const p0 = (batch.findings || []).filter((f) => f.severity === 'P0').length;
    const p1 = (batch.findings || []).filter((f) => f.severity === 'P1').length;
    const frozen = !!batch.certification_frozen;
    const verdictOk = batch.verdict === 'PASS' || batch.verdict === 'PASS_WITH_WARN';
    const evidenceOk = evaluateEvidenceComplete(batch);
    const pass = frozen && verdictOk && evidenceOk && p0 === 0 && p1 === 0 && batch.gate_pass !== false;
    if (!pass) {
      findings.push({
        batch_id: batchId,
        severity: 'P0',
        id: 'freeze_chain_fail',
        detail: `frozen=${frozen} verdict=${batch.verdict} p0=${p0} p1=${p1}`,
      });
    }
    batchRows.push({
      batch_id: batchId,
      pass,
      verdict: batch.verdict,
      certification_frozen: frozen,
      frozen_git_sha: batch.frozen_git_sha || batch.defer_commit_anchor?.immutable_head || null,
    });
  }

  const burn = computeBurnDown(parseExecutionSequence());
  if (burn.next_required_batch !== 'B40') {
    findings.push({
      severity: 'P0',
      id: 'next_batch_not_b40',
      detail: burn.next_required_batch,
    });
  }

  const anchorB3036 = path.join(EVID, 'FPC-100-DEFER-COMMIT-ANCHOR-B30-B36-LATEST.json');
  let anchorOk = false;
  let authoritativeSha = null;
  if (fs.existsSync(anchorB3036)) {
    const anchor = JSON.parse(fs.readFileSync(anchorB3036, 'utf8'));
    authoritativeSha = anchor.immutable_head || null;
    anchorOk = anchor.immutable_head === head && anchor.batches?.length === 7;
    if (!anchorOk) {
      findings.push({
        severity: requireClean ? 'P0' : 'P1',
        id: 'anchor_head_drift',
        detail: `anchor=${anchor.immutable_head} head=${head}`,
      });
    }
  } else if (requireClean) {
    findings.push({ severity: 'P0', id: 'anchor_b30_b36_missing', detail: anchorB3036 });
  }

  const dashPath = path.join(EVID, 'FPC-100-RELEASE-DASHBOARD-LATEST.json');
  const dash = fs.existsSync(dashPath) ? JSON.parse(fs.readFileSync(dashPath, 'utf8')) : null;
  const readiness = dash?.release_readiness?.pct ?? burn.release_readiness_pct;

  const pass = findings.length === 0 && batchRows.every((r) => r.pass);
  const out = {
    schema: 'traveltrust.fpc_100_local_final_freeze.v1',
    timestamp_utc: stamp,
    phase: '① local',
    machine_key: 'TT_LOCAL_FINAL_FREEZE',
    git: { head, branch, working_tree_clean: treeClean },
    authoritative_immutable_head: authoritativeSha || head,
    freeze_chain: {
      batches: FREEZE_CHAIN_B21_B36,
      rows: batchRows,
      pass_count: batchRows.filter((r) => r.pass).length,
      total: FREEZE_CHAIN_B21_B36.length,
    },
    burn_down: burn,
    release_readiness_pct: readiness,
    next_required_batch: burn.next_required_batch,
    anchor_b30_b36: anchorOk,
    b40_entry: {
      authorized: false,
      note: 'B40 ② staging one-shot — requires explicit Owner authorization; no ① business code changes after freeze',
      phase: '②',
    },
    findings,
    verdict: pass ? 'PASS' : 'FAIL',
    pass,
  };

  const outPath = path.join(EVID, 'FPC-100-LOCAL-FINAL-FREEZE-LATEST.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  console.log(`TT_LOCAL_FINAL_FREEZE: ${out.verdict}`);
  console.log(`chain: ${out.freeze_chain.pass_count}/${out.freeze_chain.total} frozen PASS`);
  console.log(`HEAD: ${head} clean=${treeClean} readiness=${readiness}% next=${burn.next_required_batch}`);
  console.log(`EVIDENCE: ${outPath}`);
  process.exit(pass ? 0 : 1);
}

main();
