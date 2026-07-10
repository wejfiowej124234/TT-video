#!/usr/bin/env node
/**
 * FPC-100 Batch B30 · L5 Content Operations (① local)
 *
 *   node scripts/dev/run-fpc-batch-b30-content-operations.cjs
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
const OUT = path.join(EVID, 'FPC-100-BATCH-B30-LATEST.json');
const EVID_DIR = path.join(EVID, 'B30-content-operations');
const CHECKLIST_PATH = path.join(EVID_DIR, 'FPC-100-CONTENT-OPERATIONS-CHECKLIST-BASELINE.v1.json');

const checklist = JSON.parse(fs.readFileSync(CHECKLIST_PATH, 'utf8'));
const REGISTRY_GATES = checklist.registry_gates || [];
const BUSINESS_GATES = checklist.business_gates_extended || [];

const QUALITY_CHECKS = [
  {
    id: 'Q9_cms_matrix_yaml',
    domain: 'Q9',
    path: 'data/catalog/cms-asset-matrix.v1.yaml',
    must_contain: ['production_preparation:', 'daily_board_script:'],
  },
  {
    id: 'Q7_registry_batch',
    domain: 'Q7',
    path: 'registry/full-production-certification-checklist.v1.yaml',
    must_contain: ['id: B30', 'Content Operations'],
  },
  {
    id: 'Q9_b30_checklist',
    domain: 'Q9',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/B30-content-operations/FPC-100-CONTENT-OPERATIONS-CHECKLIST-BASELINE.v1.json',
    must_contain: ['fpc_100_content_operations_checklist', 'cms_asset_matrix_ssot'],
  },
];

const {
  runCmsEvidenceChecks,
  runB12Dependency,
  runDashboardParity,
  runStaticSsotChecks,
} = require('./lib/fpc-content-operations-probes.cjs');
const { assertCanRun } = require('./lib/fpc-batch-sequence.cjs');
const { evaluateRuntimePreflight } = require('./lib/fpc-runtime-preflight.cjs');

function sh(cmd, cwd = ROOT, env = {}) {
  return execSync(cmd, {
    cwd,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
    timeout: env.FPC_GATE_TIMEOUT_MS ? Number(env.FPC_GATE_TIMEOUT_MS) : 900_000,
  });
}

function runGate(g, findings, gateResults, env = {}) {
  let exitCode = 0;
  let stdout = '';
  let stderr = '';
  try {
    const cmd = g.endsWith('.py')
      ? `python ${g}`
      : g.endsWith('.cjs')
        ? `node ${g}`
        : g.includes('--')
          ? `node ${g.split(' ')[0]} ${g.split(' ').slice(1).join(' ')}`
          : `bash ${g}`;
    stdout = sh(cmd, ROOT, { FPC_GATE_TIMEOUT_MS: '600000', ...env });
  } catch (e) {
    exitCode = e.status || 1;
    stdout = e.stdout || '';
    stderr = e.stderr || '';
  }
  const combined = stdout + stderr;
  const pass = exitCode === 0;
  if (!pass) {
    findings.push({
      id: `gate_fail:${path.basename(g.split(' ')[0])}`,
      severity: 'P0',
      gate: g,
      detail: combined.slice(0, 2500),
    });
  }
  gateResults.push({
    gate: g,
    exit_code: exitCode,
    pass,
    summary_line: combined.split('\n').filter(Boolean).slice(-3).join(' | '),
  });
  return pass;
}

function runQualityChecks(findings) {
  return QUALITY_CHECKS.map((q) => {
    const abs = path.join(ROOT, q.path);
    const pass =
      fs.existsSync(abs) &&
      q.must_contain.every((needle) => fs.readFileSync(abs, 'utf8').includes(needle));
    if (!pass) findings.push({ id: q.id, severity: 'P1', detail: q.path });
    return { ...q, pass };
  });
}

function buildFourQuestions(businessVerdict, qualityVerdict, findings, pass) {
  return {
    q1_can_user_complete_core_task: pass ? 'YES — CMS ops loop + consumer assets traceable @ ①' : 'NO',
    q2_is_data_truth_consistent: pass ? 'YES — asset matrix pack + announcements SSOT' : 'PARTIAL',
    q3_is_release_blocker_absent: findings.some((f) => f.severity === 'P0') ? 'NO' : 'YES',
    q4_is_evidence_traceable: pass ? 'YES — GO_cms_operation + FPC B30 LATEST' : 'PARTIAL',
    business_verdict: businessVerdict,
    quality_verdict: qualityVerdict,
  };
}

(async () => {
  const stamp = new Date().toISOString();
  const head = sh('git rev-parse HEAD').trim();
  const findings = [];
  const gateResults = [];

  const gate = assertCanRun('B30');
  if (!gate.ok) {
    findings.push({
      id: 'batch_sequence_blocked',
      severity: 'P0',
      detail: gate.reason || gate.missing_prerequisites?.join(','),
    });
  }

  const preflight = await evaluateRuntimePreflight({
    allowDirty: process.env.FPC_PREFLIGHT_ALLOW_DIRTY === '1',
  });
  if (!preflight.pass) {
    for (const b of preflight.blockers) {
      findings.push({
        id: `preflight:${b}`,
        severity: 'P0',
        type: 'Runtime Event',
        detail: JSON.stringify(preflight.items),
      });
    }
  }

  for (const g of REGISTRY_GATES) runGate(g, findings, gateResults);
  for (const g of BUSINESS_GATES) runGate(g, findings, gateResults);

  const b12Dep = runB12Dependency(findings);
  const cmsEvidence = runCmsEvidenceChecks(checklist, findings);
  const dashboardParity = runDashboardParity(checklist, findings);
  const staticSsot = runStaticSsotChecks(checklist, findings);
  const qualityCheckResults = runQualityChecks(findings);

  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');

  const businessGatePass =
    gate.ok &&
    gateResults.every((g) => g.pass) &&
    preflight.pass &&
    b12Dep.pass &&
    cmsEvidence.pass;
  const qualityPass =
    qualityCheckResults.every((q) => q.pass) &&
    staticSsot.every((s) => s.pass) &&
    dashboardParity.pass &&
    p0.length === 0 &&
    p1.length === 0;
  const businessVerdict = businessGatePass ? 'PASS' : 'FAIL';
  const qualityVerdict = qualityPass ? 'PASS' : businessGatePass ? 'IN_PROGRESS' : 'FAIL';
  const overallVerdict =
    businessVerdict === 'PASS' && qualityVerdict === 'PASS'
      ? 'PASS'
      : businessVerdict === 'FAIL' || qualityVerdict === 'FAIL'
        ? 'FAIL'
        : 'IN_PROGRESS';
  const pass = overallVerdict === 'PASS';
  const fourQuestions = buildFourQuestions(businessVerdict, qualityVerdict, findings, pass);

  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(EVID_DIR, `gate-run-${stamp.replace(/[:.]/g, '-')}.json`),
    JSON.stringify(
      {
        timestamp_utc: stamp,
        preflight,
        gate_results: gateResults,
        b12_dependency: b12Dep,
        cms_evidence: cmsEvidence,
        dashboard_parity: dashboardParity,
        static_ssot: staticSsot,
        qualityCheckResults,
        findings,
        certification_four_questions: fourQuestions,
      },
      null,
      2
    ) + '\n'
  );

  const report = {
    schema: 'traveltrust.fpc_100_batch_certification.v1',
    batch_id: 'B30',
    title: 'L5 · Content Operations Certification',
    layer: 'L5',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b30-content-operations.cjs',
    product_version: 'v1.0',
    code_anchor_commit: head,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B12', 'B26'],
    gates: [...REGISTRY_GATES, ...BUSINESS_GATES],
    gate_results: gateResults,
    gate_pass: businessGatePass,
    runtime_preflight: preflight,
    content_operations_live: {
      b12_dependency: b12Dep,
      cms_evidence: cmsEvidence,
      dashboard_parity: dashboardParity,
      source_alignment: cmsEvidence.matrix?.source_alignment || null,
      content_health_score: cmsEvidence.matrix?.content_health_score || null,
    },
    cms_static_ssot: staticSsot,
    business_certification: { verdict: businessVerdict, gate_pass: businessGatePass },
    quality_supplement: {
      verdict: qualityVerdict,
      domains: ['Q7', 'Q9'],
      checks: qualityCheckResults,
    },
    certification_four_questions: fourQuestions,
    overall_verdict: overallVerdict,
    findings,
    verdict: overallVerdict,
    pass,
    gate_verdict: businessVerdict,
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B31' : 'B30-remediation',
    ai_review: {
      verdict: pass ? 'PASS' : 'FAIL',
      ai_reviewer: 'Internal AI Review',
      review_type: 'Internal AI Review',
      review_date: stamp.slice(0, 10),
      review_version: 'v1',
    },
    human_verified: false,
    human_verifier: null,
    human_note:
      'CMS Content Operations ① — asset matrix · announcements · ops pipeline; probe skip allowed; not ② staging GO',
    traceability: {
      requirements: [
        'check-cms-announcements-gate PASS',
        'run-cms-asset-matrix-pack produces CMS-ASSET-MATRIX-LATEST.json',
        'source_alignment >= 1 row @ ①',
        'B12 data governance frozen PASS dependency',
        'daily report + health score evidence present',
      ],
      spec_refs: [
        'data/catalog/cms-asset-matrix.v1.yaml',
        'evidence/GO_cms_operation/README.md',
        'FPC-100/B30-content-operations/FPC-100-CONTENT-OPERATIONS-CHECKLIST-BASELINE.v1.json',
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B30-LATEST.json',
      certification_batch: 'B30',
      product_version: 'v1.0',
    },
  };

  if (pass) {
    const expiryDays = 30;
    report.certified_at_utc = stamp;
    report.expires_at_utc = new Date(Date.parse(stamp) + expiryDays * 86400000).toISOString();
    report.expiry_policy_days = expiryDays;
    report.certification_frozen = true;
    report.frozen_at_utc = stamp;
    report.frozen_git_sha = head;
  }

  fs.mkdirSync(EVID, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  console.log(`TT_FPC_100_BATCH_B30: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`BUSINESS: ${businessVerdict} QUALITY: ${qualityVerdict} OVERALL: ${overallVerdict}`);
  console.log(`source_alignment: ${cmsEvidence.checks?.find((c) => c.id === 'cms_source_alignment')?.display || cmsEvidence.matrix?.source_alignment?.display || 'n/a'}`);
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
