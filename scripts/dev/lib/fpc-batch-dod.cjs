/**
 * FPC Batch Definition of Done — all five gates required for PASS.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { EVID, ROOT } = require('./fpc-batch-sequence.cjs');

const DASHBOARD = path.join(EVID, 'FPC-100-RELEASE-DASHBOARD-LATEST.json');
const REGISTRY = path.join(ROOT, 'registry/full-production-certification-checklist.v1.yaml');

const REQUIRED_EVIDENCE_FIELDS = [
  'product_version',
  'certified_at_utc',
  'expires_at_utc',
  'certification_frozen',
  'frozen_at_utc',
  'frozen_git_sha',
  'release_blocker',
  'human_verified',
  'ai_review',
  'traceability',
  'verdict',
  'pass',
];

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function loadBatch(batchId) {
  const p = path.join(EVID, `FPC-100-BATCH-${batchId}-LATEST.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function evaluateGatePass(batch) {
  if (!batch) return false;
  const p0p1 = (batch.findings || []).filter((f) => f.severity === 'P0' || f.severity === 'P1');
  if (p0p1.length > 0) return false;
  if (batch.per_spot_check && batch.per_spot_check.verdict !== 'PASS') return false;
  if (batch.gate_pass === false) return false;
  if (batch.gate_pass === true) return true;
  return batch.verdict !== 'FAIL';
}

function evaluateEvidenceComplete(batch) {
  if (!batch) return false;
  for (const f of REQUIRED_EVIDENCE_FIELDS) {
    if (batch[f] === undefined || batch[f] === null) {
      if (f === 'human_verifier' && batch.human_verified === false) continue;
      if (f === 'pass') continue;
      return false;
    }
  }
  return !!(batch.batch_id && batch.ai_review?.verdict && batch.traceability?.certification_batch);
}

function evaluateDashboardRefreshed(batch) {
  if (!fs.existsSync(DASHBOARD)) return false;
  const dash = JSON.parse(fs.readFileSync(DASHBOARD, 'utf8'));
  const dashTs = Date.parse(dash.timestamp_utc || 0);
  const batchTs = Date.parse(batch.finalized_at_utc || batch.timestamp_utc || 0);
  const listed = (dash.ai_review_summary || []).some((r) => r.batch_id === batch.batch_id);
  return listed && dashTs >= batchTs - 60000;
}

function evaluateGitState(batchId, batch) {
  const head = sh('git rev-parse HEAD');
  const porcelain = sh('git status --porcelain');
  const workingTreeClean = porcelain.length === 0;
  const relPath = `docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-BATCH-${batchId}-LATEST.json`;
  let commitComplete = false;
  try {
    const diff = sh(`git diff HEAD -- "${relPath}"`);
    commitComplete = workingTreeClean && diff.length === 0;
  } catch {
    commitComplete = false;
  }
  return { head, workingTreeClean, commitComplete, frozenSha: batch.frozen_git_sha || head };
}

function evaluateDoD(batchId, { refreshDashboardFirst = false } = {}) {
  const batch = loadBatch(batchId);
  if (!batch) {
    return {
      batch_id: batchId,
      ok: false,
      all_met: false,
      verdict: 'NOT_STARTED',
      pass: false,
      items: {},
    };
  }

  const gatePass = evaluateGatePass(batch);
  const evidenceComplete = evaluateEvidenceComplete(batch);
  const git = evaluateGitState(batchId, batch);

  if (refreshDashboardFirst) {
    try {
      sh('node scripts/dev/refresh-fpc-100-release-dashboard.cjs');
    } catch {
      /* recorded via dashboard_refreshed */
    }
  }
  const dashboardRefreshed = evaluateDashboardRefreshed(batch);

  const items = {
    gate_pass: gatePass,
    evidence_complete: evidenceComplete,
    dashboard_refreshed: dashboardRefreshed,
    commit_complete: git.commitComplete,
    working_tree_clean: git.workingTreeClean,
  };
  const allMet = Object.values(items).every(Boolean);

  return {
    batch_id: batchId,
    ok: allMet,
    all_met: allMet,
    items,
    committed_sha: git.head,
    verdict: allMet
      ? batch.gate_verdict === 'PASS_WITH_WARN' || batch.verdict === 'PASS_WITH_WARN'
        ? 'PASS_WITH_WARN'
        : 'PASS'
      : gatePass
        ? 'IN_PROGRESS'
        : batch.verdict === 'FAIL'
          ? 'FAIL'
          : 'IN_PROGRESS',
    pass: allMet,
  };
}

function applyDoD(batchId, dodResult) {
  const p = path.join(EVID, `FPC-100-BATCH-${batchId}-LATEST.json`);
  const batch = loadBatch(batchId);
  if (!batch) return null;

  const stamp = new Date().toISOString();
  batch.dod = {
    ...dodResult.items,
    all_met: dodResult.all_met,
    checked_at_utc: stamp,
    committed_sha: dodResult.committed_sha,
    policy: 'Gate PASS + Evidence + Dashboard + Commit + Clean tree',
  };
  batch.verdict = dodResult.verdict;
  batch.pass = dodResult.pass;
  if (dodResult.all_met) {
    batch.finalized_at_utc = stamp;
    batch.frozen_git_sha = dodResult.committed_sha;
    batch.certification_frozen = true;
    batch.frozen_at_utc = batch.frozen_at_utc || stamp;
  } else if (dodResult.verdict === 'IN_PROGRESS') {
    batch.pass = false;
  }

  fs.writeFileSync(p, JSON.stringify(batch, null, 2) + '\n');
  return batch;
}

module.exports = {
  REQUIRED_EVIDENCE_FIELDS,
  evaluateDoD,
  applyDoD,
  loadBatch,
};
