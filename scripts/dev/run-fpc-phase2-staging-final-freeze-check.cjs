#!/usr/bin/env node
/**
 * FPC-100 · Phase ② Staging Final Freeze — lock B40+B41 evidence chain
 *
 *   node scripts/dev/run-fpc-phase2-staging-final-freeze-check.cjs [--require-clean]
 *
 * Boundary: ② staging CLOSED ≠ ③ Production GO
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { EVID, ROOT, computeBurnDown, parseExecutionSequence } = require('./lib/fpc-batch-sequence.cjs');
const { probeMetaSha, probeRuntimeHealth } = require('./lib/fpc-deployment-probes.cjs');

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
}

const AUTHORITATIVE_SHA = '9a73a8de977d2b6d67ddca20ef953da6135ccd7b';
const STAGING_API = process.env.STAGING_API || 'https://tt-api-staging.fly.dev';
const PHASE2_BATCHES = ['B40', 'B41'];

function loadBatch(batchId) {
  const p = path.join(EVID, `FPC-100-BATCH-${batchId}-LATEST.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function main() {
  return (async () => {
  const requireClean = process.argv.includes('--require-clean');
  const stamp = new Date().toISOString();
  const head = sh('git rev-parse HEAD');
  const branch = sh('git branch --show-current');
  const outPath = path.join(EVID, 'FPC-100-PHASE2-STAGING-FINAL-FREEZE-LATEST.json');
  const relOut = path.relative(ROOT, outPath).replace(/\\/g, '/');
  const porcelain = sh('git status --porcelain');
  const foreignDirty = porcelain
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.endsWith(relOut));
  const treeClean = foreignDirty.length === 0;
  const findings = [];
  const batchRows = [];

  if (requireClean && !treeClean) {
    findings.push({
      severity: 'P0',
      id: 'working_tree_not_clean',
      detail: foreignDirty.slice(0, 8).join('; '),
    });
  }

  const localFreezePath = path.join(EVID, 'FPC-100-LOCAL-FINAL-FREEZE-LATEST.json');
  let localFreezeOk = false;
  if (fs.existsSync(localFreezePath)) {
    const lf = JSON.parse(fs.readFileSync(localFreezePath, 'utf8'));
    localFreezeOk = lf.pass === true && lf.verdict === 'PASS';
    if (!localFreezeOk) {
      findings.push({
        severity: 'P0',
        id: 'local_final_freeze_not_pass',
        detail: lf.verdict,
      });
    }
    if (lf.authoritative_immutable_head !== AUTHORITATIVE_SHA) {
      findings.push({
        severity: 'P0',
        id: 'local_freeze_anchor_mismatch',
        detail: `${lf.authoritative_immutable_head} != ${AUTHORITATIVE_SHA}`,
      });
    }
  } else {
    findings.push({ severity: 'P0', id: 'local_final_freeze_missing', detail: localFreezePath });
  }

  for (const batchId of PHASE2_BATCHES) {
    const batch = loadBatch(batchId);
    if (!batch) {
      findings.push({ batch_id: batchId, severity: 'P0', id: 'evidence_missing' });
      batchRows.push({ batch_id: batchId, pass: false });
      continue;
    }
    const p0 = (batch.findings || []).filter((f) => f.severity === 'P0').length;
    const verdictOk = batch.verdict === 'PASS';
    const anchorOk =
      batch.authoritative_immutable_head === AUTHORITATIVE_SHA ||
      batch.code_anchor_commit === AUTHORITATIVE_SHA;
    const humanOk = batchId !== 'B41' || batch.human_verified === true;
    const pass = verdictOk && p0 === 0 && anchorOk && humanOk && batch.gate_pass !== false;
    if (!pass) {
      findings.push({
        batch_id: batchId,
        severity: 'P0',
        id: 'phase2_batch_fail',
        detail: `verdict=${batch.verdict} p0=${p0} anchor=${anchorOk} human=${humanOk}`,
      });
    }
    batchRows.push({
      batch_id: batchId,
      pass,
      verdict: batch.verdict,
      human_verified: batch.human_verified || false,
      authoritative_immutable_head: batch.authoritative_immutable_head,
    });
  }

  const burn = computeBurnDown(parseExecutionSequence());
  if (burn.next_required_batch != null) {
    findings.push({
      severity: 'P0',
      id: 'fpc_sequence_incomplete',
      detail: `next=${burn.next_required_batch}`,
    });
  }

  let headReachable = head === AUTHORITATIVE_SHA;
  if (!headReachable) {
    try {
      sh(`git merge-base --is-ancestor ${AUTHORITATIVE_SHA} ${head}`);
      headReachable = true;
    } catch {
      headReachable = false;
    }
  }
  if (!headReachable) {
    findings.push({
      severity: 'P0',
      id: 'anchor_not_ancestor_of_head',
      detail: `anchor=${AUTHORITATIVE_SHA} head=${head}`,
    });
  }

  let stagingHealth = { pass: false };
  let stagingMeta = { pass: false };
  const stagingFindings = [];
  try {
    stagingHealth = await probeRuntimeHealth(STAGING_API, process.env.STAGING_WEB || 'https://tt-web-staging.fly.dev', stagingFindings);
    if (!stagingHealth.pass) {
      findings.push({
        severity: 'P1',
        id: 'staging_health_fail',
        detail: STAGING_API,
      });
    }
    stagingMeta = await probeMetaSha(STAGING_API, AUTHORITATIVE_SHA, stagingFindings);
    if (!stagingMeta.pass) {
      findings.push({
        severity: 'P0',
        id: 'staging_meta_sha_mismatch',
        detail: stagingMeta.detail || stagingMeta.staging_sha || stagingFindings.map((f) => f.detail).join('; '),
      });
    }
    findings.push(...stagingFindings.filter((f) => f.severity === 'P0'));
  } catch (e) {
    findings.push({
      severity: 'P1',
      id: 'staging_probe_error',
      detail: String(e.message || e),
    });
  }

  const p0Count = findings.filter((f) => f.severity === 'P0').length;
  const pass = p0Count === 0 && batchRows.every((r) => r.pass) && localFreezeOk && headReachable;

  const out = {
    schema: 'traveltrust.fpc_100_phase2_staging_final_freeze.v1',
    timestamp_utc: stamp,
    phase: '② staging',
    machine_key: 'TT_PHASE2_STAGING_FINAL_FREEZE',
    git: { head, branch, working_tree_clean: treeClean },
    authoritative_immutable_head: AUTHORITATIVE_SHA,
    sole_candidate_for_phase3: true,
    phase2_batches: {
      rows: batchRows,
      pass_count: batchRows.filter((r) => r.pass).length,
      total: PHASE2_BATCHES.length,
    },
    local_final_freeze_ref: 'FPC-100-LOCAL-FINAL-FREEZE-LATEST.json',
    burn_down: burn,
    staging: {
      api: STAGING_API,
      health: stagingHealth,
      meta_sha: stagingMeta,
    },
    phase3_entry: {
      authorized: pass,
      note: 'Phase ③ Production GO requires separate checklist; B40/B41 PASS does not declare Production GO',
      phase: '③',
    },
    production_go_declaration: {
      allowed: false,
      reason: 'Await Phase ③ all gates PASS + Owner sign-off',
    },
    findings,
    verdict: pass ? 'PASS' : 'FAIL',
    pass,
  };

  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  console.log(`TT_PHASE2_STAGING_FINAL_FREEZE: ${out.verdict}`);
  console.log(`anchor: ${AUTHORITATIVE_SHA}`);
  console.log(`phase2: ${out.phase2_batches.pass_count}/${out.phase2_batches.total} PASS`);
  console.log(`staging meta: ${stagingMeta.pass ? 'MATCH' : 'MISMATCH'}`);
  console.log(`EVIDENCE: ${outPath}`);
  process.exit(pass ? 0 : 1);
  })();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
