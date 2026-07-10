#!/usr/bin/env node
/**
 * FPC-100 Batch B35 · L5 Recovery (fault recovery · idempotency · runbook) @ ① local
 *
 *   FPC_PREFLIGHT_ALLOW_DIRTY=1 node scripts/dev/run-fpc-batch-b35-recovery.cjs
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
const OUT = path.join(EVID, 'FPC-100-BATCH-B35-LATEST.json');
const EVID_DIR = path.join(EVID, 'B35-recovery');
const CHECKLIST_PATH = path.join(EVID_DIR, 'FPC-100-RECOVERY-CHECKLIST-BASELINE.v1.json');
const API_BASE = process.env.API_BASE || process.env.API_BASE_URL || 'http://127.0.0.1:8080';

const checklist = JSON.parse(fs.readFileSync(CHECKLIST_PATH, 'utf8'));
const REGISTRY_GATES = checklist.registry_gates || [];
const BUSINESS_GATES = checklist.business_gates_extended || [];

const QUALITY_CHECKS = [
  {
    id: 'Q14_quality_matrix',
    domain: 'Q14',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-QUALITY-DOMAIN-MATRIX-LATEST.json',
    must_contain: ['"id": "Q14"', 'reliability_recovery'],
  },
  {
    id: 'Q14_registry_batch',
    domain: 'Q14',
    path: 'registry/full-production-certification-checklist.v1.yaml',
    must_contain: ['id: B35', 'Recovery Certification'],
  },
  {
    id: 'Q14_b35_checklist',
    domain: 'Q14',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/B35-recovery/FPC-100-RECOVERY-CHECKLIST-BASELINE.v1.json',
    must_contain: ['fpc_100_recovery_checklist', 'failure_mode_graceful_degrade'],
  },
  {
    id: 'Q7_runbook',
    domain: 'Q7',
    path: 'ops/RUNBOOK.md',
    must_contain: ['Runbook', 'Idempotency-Key'],
  },
];

const {
  runDependencyChecks,
  runFrozenChainAggregation,
  runGateAggregationParity,
  runCrossModuleRecoveryRegression,
  runIdempotencyWiringCheck,
  runRecoveryRunbookSsot,
  runRecoveryLiveEvidenceParity,
  runReleaseGateSsot,
  runDashboardParity,
  runStaticSsotChecks,
  runSiteWideRecoveryChecks,
} = require('./lib/fpc-recovery-probes.cjs');
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
  const gateEnv = {
    FPC_GATE_TIMEOUT_MS: '600000',
    API_BASE,
    API_BASE_URL: API_BASE,
    BASE: API_BASE,
    API: API_BASE,
    PORT: '8080',
    ENV_LABEL: 'local',
    SEED_TEST_ACCOUNTS: '1',
    ...env,
  };
  try {
    let cmd;
    if (g.endsWith('.py')) cmd = `python ${g}`;
    else if (g.endsWith('.cjs')) cmd = `node ${g}`;
    else cmd = `bash ${g}`;
    stdout = sh(cmd, ROOT, gateEnv);
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
    q1_can_user_complete_core_task: pass
      ? 'YES — recovery paths validated @ ① (degrade · retry · idempotency)'
      : 'NO',
    q2_is_data_truth_consistent: pass
      ? 'YES — idempotency + error contract + frozen chain aligned'
      : 'PARTIAL',
    q3_is_release_blocker_absent: findings.some((f) => f.severity === 'P0') ? 'NO' : 'YES',
    q4_is_evidence_traceable: pass
      ? 'YES — B35 gate-run + live probes + matrix b35_apply'
      : 'PARTIAL',
    business_verdict: businessVerdict,
    quality_verdict: qualityVerdict,
  };
}

(async () => {
  const stamp = new Date().toISOString();
  const head = sh('git rev-parse HEAD').trim();
  const findings = [];
  const gateResults = [];

  const gate = assertCanRun('B35');
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

  const dependencies = runDependencyChecks(checklist, findings);
  const frozenChain = runFrozenChainAggregation(checklist, findings);
  const gateAggregation = runGateAggregationParity(findings);
  const crossModule = runCrossModuleRecoveryRegression(findings);
  const idempotencyWiring = runIdempotencyWiringCheck(findings);
  const runbookSsot = runRecoveryRunbookSsot(checklist, findings);
  const liveEvidence = runRecoveryLiveEvidenceParity(findings);
  const siteRecovery = runSiteWideRecoveryChecks(checklist, findings);
  const releaseGate = runReleaseGateSsot(checklist, findings);
  const dashboardParity = runDashboardParity(checklist, findings);
  const staticSsot = runStaticSsotChecks(checklist, findings);
  const qualityCheckResults = runQualityChecks(findings);

  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');

  const businessGatePass =
    gate.ok &&
    gateResults.every((g) => g.pass) &&
    preflight.pass &&
    dependencies.pass &&
    frozenChain.pass &&
    gateAggregation.pass &&
    crossModule.pass &&
    idempotencyWiring.pass &&
    runbookSsot.pass &&
    liveEvidence.pass &&
    siteRecovery.pass;
  const qualityPass =
    qualityCheckResults.every((q) => q.pass) &&
    staticSsot.every((s) => s.pass) &&
    releaseGate.pass &&
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
        dependencies,
        frozen_chain: frozenChain,
        gate_aggregation: gateAggregation,
        cross_module: crossModule,
        idempotency_wiring: idempotencyWiring,
        runbook_ssot: runbookSsot,
        live_evidence: liveEvidence,
        site_recovery: siteRecovery,
        release_gate: releaseGate,
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
    batch_id: 'B35',
    title: 'L5 · Recovery Certification',
    layer: 'L5',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b35-recovery.cjs',
    product_version: 'v1.0',
    code_anchor_commit: head,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B05', 'B21', 'B22'],
    api_base: API_BASE,
    gates: [...REGISTRY_GATES, ...BUSINESS_GATES],
    gate_results: gateResults,
    gate_pass: businessGatePass,
    runtime_preflight: preflight,
    recovery_live: {
      dependencies,
      frozen_chain: frozenChain,
      gate_aggregation: gateAggregation,
      cross_module_regression: crossModule,
      idempotency_wiring: idempotencyWiring,
      runbook_ssot: runbookSsot,
      live_probes: liveEvidence,
      site_recovery: siteRecovery,
      release_gate: releaseGate,
      dashboard_parity: dashboardParity,
    },
    recovery_static_ssot: staticSsot,
    business_certification: { verdict: businessVerdict, gate_pass: businessGatePass },
    quality_supplement: {
      verdict: qualityVerdict,
      domains: ['Q7', 'Q14'],
      checks: qualityCheckResults,
    },
    certification_four_questions: fourQuestions,
    overall_verdict: overallVerdict,
    findings,
    verdict: overallVerdict,
    pass,
    gate_verdict: businessVerdict,
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B36' : 'B35-remediation',
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
      'Recovery ① — api_500/network/CDN/wallet degrade · idempotency · runbook SSOT · frozen chain; defer-commit',
    traceability: {
      requirements: [
        'cargo idempotency_http_contract PASS',
        'live recovery probes (401/400/idempotency/meta) PASS',
        '202/202 page recovery PASS|N/A via b35_apply',
        'B05/B21/B22/B21-B34 frozen chain + no-batch-skip aggregation',
        'B454 degrade evidence gate + ops RUNBOOK SSOT',
      ],
      spec_refs: [
        'ops/RUNBOOK.md',
        'registry/full-production-certification-checklist.v1.yaml',
        'FPC-100/B35-recovery/FPC-100-RECOVERY-CHECKLIST-BASELINE.v1.json',
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B35-LATEST.json',
      certification_batch: 'B35',
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
  console.log(`TT_FPC_100_BATCH_B35: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`BUSINESS: ${businessVerdict} QUALITY: ${qualityVerdict} OVERALL: ${overallVerdict}`);
  console.log(`recovery_pages: ${siteRecovery.pass_count}/${siteRecovery.total}`);
  console.log(
    `release_readiness: ${gateAggregation.release_readiness_pct ?? dashboardParity.readiness_pct ?? 'n/a'}%`
  );
  console.log(`EVIDENCE: ${OUT}`);

  if (pass) {
    try {
      sh('node scripts/dev/refresh-fpc-100-release-dashboard.cjs', ROOT);
    } catch {
      /* best-effort dashboard refresh */
    }
  }

  process.exit(pass ? 0 : 1);
})();
