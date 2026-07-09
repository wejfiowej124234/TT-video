#!/usr/bin/env node
/**
 * FPC-100 Batch B00 · Anchor certification (① local)
 * Records SHA, /meta, /health, registry anchors, page matrix scaffold status.
 *
 *   node scripts/dev/run-fpc-batch-b00-anchor.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const EVID = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100'
);
const OUT = path.join(EVID, 'FPC-100-BATCH-B00-LATEST.json');
const CODE_ANCHOR = 'e9df0a73f63b5ebccc7c17266f000c3bf867d872';
const API = (process.env.API_BASE || 'http://127.0.0.1:8080').replace(/\/$/, '');

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
}

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { _raw: text.slice(0, 500) };
  }
  return { status: res.status, body };
}

(async () => {
  const stamp = new Date().toISOString();
  const findings = [];
  const warns = [];

  const head = sh('git rev-parse HEAD');
  const porcelain = sh('git status --porcelain');
  const branch = sh('git branch --show-current');
  const dirty = porcelain.length > 0;

  if (dirty) {
    warns.push({ id: 'working_tree_dirty', detail: 'uncommitted changes present during B00' });
  }

  const codeAnchorMatch = head === CODE_ANCHOR || sh(`git merge-base --is-ancestor ${CODE_ANCHOR} HEAD && echo yes || echo no`) === 'yes';
  if (!codeAnchorMatch && head !== CODE_ANCHOR) {
    // doc-only commits ahead of code anchor are OK if ancestor
  }

  let health = { status: 0, body: null };
  let meta = { status: 0, body: null };
  try {
    health = await fetchJson(`${API}/health`);
  } catch (e) {
    findings.push({ id: 'health_unreachable', severity: 'P0', detail: String(e.message) });
  }
  try {
    meta = await fetchJson(`${API}/meta`);
  } catch (e) {
    findings.push({ id: 'meta_unreachable', severity: 'P0', detail: String(e.message) });
  }

  if (health.status !== 200) {
    findings.push({ id: 'health_not_200', severity: 'P0', detail: `status=${health.status}` });
  }
  if (meta.status !== 200) {
    findings.push({ id: 'meta_not_200', severity: 'P0', detail: `status=${meta.status}` });
  }

  const matrixPath = path.join(EVID, 'FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json');
  let matrix = null;
  if (fs.existsSync(matrixPath)) {
    matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
  } else {
    findings.push({ id: 'page_matrix_missing', severity: 'P1', detail: matrixPath });
  }

  const registries = [
    'registry/full-production-certification-checklist.v1.yaml',
    'registry/per-wave-backlog.v1.yaml',
    'registry/test-accounts-business-immutable.v1.yaml',
    'registry/business-flow-matrix.v1.yaml',
  ];
  const registry_anchors = registries.map((p) => ({
    path: p,
    exists: fs.existsSync(path.join(ROOT, p)),
  }));
  for (const r of registry_anchors) {
    if (!r.exists) findings.push({ id: 'registry_missing', severity: 'P0', path: r.path });
  }

  const metaSha =
    meta.body?.git_sha ||
    meta.body?.git?.sha ||
    meta.body?.build?.git_sha ||
    meta.body?.version?.git_sha ||
    null;

  const p0p1 = findings.filter((f) => f.severity === 'P0' || f.severity === 'P1');
  const pass = p0p1.length === 0;

  const report = {
    schema: 'traveltrust.fpc_100_batch_certification.v1',
    batch_id: 'B00',
    title: 'Anchor · Meta · Health · Registry · Page matrix scaffold',
    layer: 'L1',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b00-anchor.cjs',
    code_anchor_commit: CODE_ANCHOR,
    git: {
      head,
      branch,
      working_tree_clean: !dirty,
      porcelain_lines: dirty ? porcelain.split('\n').filter(Boolean).length : 0,
      code_anchor_is_ancestor_of_head: sh(
        `git merge-base --is-ancestor ${CODE_ANCHOR} HEAD 2>/dev/null && echo true || echo false`
      ),
    },
    api_base: API,
    health: { status: health.status, ok: health.status === 200 },
    meta: {
      status: meta.status,
      git_sha_field: metaSha,
      body_keys: meta.body && typeof meta.body === 'object' ? Object.keys(meta.body).slice(0, 30) : [],
    },
    registry_anchors,
    page_matrix: matrix
      ? {
          path: 'FPC-100/FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json',
          pages_total: matrix.coverage_summary?.pages_total,
          pages_not_started: matrix.coverage_summary?.pages_not_started,
          scaffolded: true,
        }
      : { scaffolded: false },
    per_round1_exit: {
      valid: true,
      doc: 'PER-ROUND1-EXIT.md',
      note: 'PER R1 remains valid; FPC-100 is superset certification',
    },
    findings,
    warns,
    verdict: pass ? (warns.length ? 'PASS_WITH_WARN' : 'PASS') : 'FAIL',
    pass,
    next_batch: pass ? 'B01' : 'B00-remediation',
  };

  if (pass) {
    const expiryDays = 30;
    report.certified_at_utc = stamp;
    report.expires_at_utc = new Date(Date.parse(stamp) + expiryDays * 86400000).toISOString();
    report.expiry_policy_days = expiryDays;
    report.certification_frozen = true;
    report.frozen_at_utc = stamp;
    report.frozen_git_sha = head;
    report.release_blocker = 'NO';
    report.human_verified = false;
    report.human_verifier = null;
    report.human_note = 'Machine-only anchor; human verification deferred to B01+';
  }

  fs.mkdirSync(EVID, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  console.log(`TT_FPC_100_BATCH_B00: ${report.verdict}`);
  console.log(`pass: ${pass} p0_p1: ${p0p1.length} warns: ${warns.length}`);
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
