#!/usr/bin/env node
/**
 * FPC-100 · read-only post-anchor attestation — B21 → B25-C6 (① local)
 *
 * Records authoritative immutable HEAD without amending the anchor commit or
 * mutating frozen batch LATEST / anchor manifest files from that commit.
 *
 *   node scripts/dev/run-fpc-post-anchor-attestation-b21-b25-c6.cjs
 *   node scripts/dev/run-fpc-post-anchor-attestation-b21-b25-c6.cjs --head <sha>
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { EVID, ROOT } = require('./lib/fpc-batch-sequence.cjs');
const { evaluateEvidenceComplete } = require('./lib/fpc-batch-dod.cjs');

const AUTHORITATIVE_HEAD_DEFAULT = '21f830ffbf6afe8237dab1021e6113fd57ffcd3e';
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

const ANCHOR_REL = 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-DEFER-COMMIT-ANCHOR-B21-B25-C6-LATEST.json';
const OUT_PATH = path.join(EVID, 'FPC-100-POST-ANCHOR-ATTESTATION-B21-B25-C6-LATEST.json');

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function loadBatch(batchId) {
  const p = path.join(EVID, `FPC-100-BATCH-${batchId}-LATEST.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function main() {
  const headArg = process.argv.find((a, i) => process.argv[i - 1] === '--head');
  const authoritativeHead = headArg || AUTHORITATIVE_HEAD_DEFAULT;
  const stamp = new Date().toISOString();
  const findings = [];
  const checks = [];

  // Git object exists
  let commitExists = false;
  try {
    sh(`git cat-file -t ${authoritativeHead}`);
    commitExists = true;
    checks.push({ id: 'git_commit_exists', pass: true, head: authoritativeHead });
  } catch {
    findings.push({ severity: 'P0', id: 'commit_missing', detail: authoritativeHead });
    checks.push({ id: 'git_commit_exists', pass: false, head: authoritativeHead });
  }

  // Anchor file present in authoritative commit tree
  let anchorInCommit = false;
  let manifestHeadInCommit = null;
  if (commitExists) {
    try {
      const blob = sh(`git show ${authoritativeHead}:${ANCHOR_REL}`);
      const manifest = JSON.parse(blob);
      manifestHeadInCommit = manifest.immutable_head || null;
      anchorInCommit = !!manifest.anchor_id;
      checks.push({
        id: 'anchor_manifest_in_commit',
        pass: anchorInCommit,
        anchor_id: manifest.anchor_id,
        manifest_immutable_head: manifestHeadInCommit,
      });
      if (manifest.anchor_id !== 'B21-B25-C6') {
        findings.push({ severity: 'P0', id: 'anchor_id_mismatch', detail: manifest.anchor_id });
      }
    } catch (e) {
      findings.push({ severity: 'P0', id: 'anchor_not_in_commit', detail: String(e.message || e) });
      checks.push({ id: 'anchor_manifest_in_commit', pass: false });
    }
  }

  // Read-only: do not rewrite anchor / batch LATEST on disk
  const anchorPath = path.join(ROOT, ANCHOR_REL);
  let workingManifestHead = null;
  if (fs.existsSync(anchorPath)) {
    const live = JSON.parse(fs.readFileSync(anchorPath, 'utf8'));
    workingManifestHead = live.immutable_head || null;
    checks.push({
      id: 'readonly_no_manifest_rewrite',
      pass: true,
      note: 'attestation only writes POST-ANCHOR-ATTESTATION LATEST',
      working_manifest_immutable_head: workingManifestHead,
    });
  }

  // Batch frozen PASS @ authoritative commit (read from commit blobs)
  const batchRows = [];
  for (const batchId of ANCHOR_BATCHES) {
    const rel = `docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-BATCH-${batchId}-LATEST.json`;
    let row = { batch_id: batchId, pass: false };
    try {
      const blob = sh(`git show ${authoritativeHead}:${rel}`);
      const batch = JSON.parse(blob);
      const p0 = (batch.findings || []).filter((f) => f.severity === 'P0').length;
      const p1 = (batch.findings || []).filter((f) => f.severity === 'P1').length;
      const frozen = !!batch.certification_frozen;
      const verdictOk = batch.verdict === 'PASS' || batch.verdict === 'PASS_WITH_WARN';
      const evidenceOk = evaluateEvidenceComplete(batch);
      const pass = frozen && batch.gate_pass !== false && verdictOk && evidenceOk && p0 === 0 && p1 === 0;
      row = {
        batch_id: batchId,
        pass,
        verdict: batch.verdict,
        certification_frozen: frozen,
        p0,
        p1,
        evidence_complete: evidenceOk,
      };
      if (!pass) {
        findings.push({
          severity: 'P0',
          id: 'batch_not_frozen_at_head',
          batch_id: batchId,
          detail: JSON.stringify(row),
        });
      }
    } catch (e) {
      findings.push({
        severity: 'P0',
        id: 'batch_missing_at_head',
        batch_id: batchId,
        detail: String(e.message || e),
      });
      row = { batch_id: batchId, pass: false, error: String(e.message || e) };
    }
    batchRows.push(row);
  }
  checks.push({
    id: 'batches_at_authoritative_head',
    pass: batchRows.every((r) => r.pass),
    pass_count: batchRows.filter((r) => r.pass).length,
    total: batchRows.length,
  });

  // Optional: current HEAD should be at or after authoritative (not rewrite history)
  const currentHead = sh('git rev-parse HEAD');
  let headReachable = currentHead === authoritativeHead;
  if (!headReachable) {
    try {
      sh(`git merge-base --is-ancestor ${authoritativeHead} HEAD`);
      headReachable = true;
    } catch {
      headReachable = false;
    }
  }
  checks.push({
    id: 'authoritative_head_reachable',
    pass: headReachable,
    current_head: currentHead,
    authoritative_head: authoritativeHead,
  });
  if (!headReachable) {
    findings.push({
      severity: 'P1',
      id: 'head_not_reachable',
      detail: `current=${currentHead} authoritative=${authoritativeHead}`,
    });
  }

  const allPass = findings.filter((f) => f.severity === 'P0').length === 0 && batchRows.every((r) => r.pass);
  const attestation = {
    schema: 'traveltrust.fpc_100_post_anchor_attestation.v1',
    readonly: true,
    does_not_amend_anchor_commit: true,
    timestamp_utc: stamp,
    phase: '① local',
    anchor_id: 'B21-B25-C6',
    authoritative_immutable_head: authoritativeHead,
    anchor_manifest_immutable_head_at_commit: manifestHeadInCommit,
    anchor_manifest_immutable_head_working_copy: workingManifestHead,
    stale_manifest_head_note:
      manifestHeadInCommit && manifestHeadInCommit !== authoritativeHead
        ? 'finalize-amend SHA drift in anchor manifest; authoritative_immutable_head is the anchor commit SHA'
        : null,
    verifier: 'run-fpc-post-anchor-attestation-b21-b25-c6.cjs',
    batches: batchRows,
    checks,
    findings,
    verdict: allPass ? 'PASS' : 'FAIL',
    pass: allPass,
    policy: {
      push: false,
      deploy: false,
      phase2: false,
      note: 'Read-only attestation sidecar — does not mutate B21-B25 anchor commit tree',
    },
    next_batch_after_anchor: 'B26',
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(attestation, null, 2) + '\n');
  console.log(`TT_FPC_POST_ANCHOR_ATTESTATION: ${attestation.verdict}`);
  console.log(`AUTHORITATIVE_IMMUTABLE_HEAD: ${authoritativeHead}`);
  console.log(`batches: ${batchRows.filter((r) => r.pass).length}/${batchRows.length} pass @ head`);
  console.log(`EVIDENCE: ${OUT_PATH}`);
  process.exit(allPass ? 0 : 1);
}

main();
