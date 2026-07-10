#!/usr/bin/env node
/**
 * FPC-100 Batch B34 · L5 Data Lifecycle (entity states · ① local)
 *
 *   node scripts/dev/run-fpc-batch-b34-data-lifecycle.cjs
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
const OUT = path.join(EVID, 'FPC-100-BATCH-B34-LATEST.json');
const EVID_DIR = path.join(EVID, 'B34-lifecycle');
const CHECKLIST_PATH = path.join(EVID_DIR, 'FPC-100-DATA-LIFECYCLE-CHECKLIST-BASELINE.v1.json');
const API_BASE = process.env.API_BASE || process.env.API_BASE_URL || 'http://127.0.0.1:8080';

const checklist = JSON.parse(fs.readFileSync(CHECKLIST_PATH, 'utf8'));
const REGISTRY_GATES = checklist.registry_gates || [];
const BUSINESS_GATES = checklist.business_gates_extended || [];

const QUALITY_CHECKS = [
  {
    id: 'Q12_registry_batch',
    domain: 'Q12',
    path: 'registry/full-production-certification-checklist.v1.yaml',
    must_contain: ['id: B34', 'Data Lifecycle'],
  },
  {
    id: 'Q12_b34_checklist',
    domain: 'Q12',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/B34-lifecycle/FPC-100-DATA-LIFECYCLE-CHECKLIST-BASELINE.v1.json',
    must_contain: ['fpc_100_data_lifecycle_checklist', 'entity_lifecycle_transitions'],
  },
  {
    id: 'Q9_ddg_registry',
    domain: 'Q9',
    path: 'registry/display-data-governance.v1.yaml',
    must_contain: ['TT_DISPLAY_DATA_GOVERNANCE: ENFORCED'],
  },
];

const {
  runDependencyChecks,
  runFrozenChainAggregation,
  runGateAggregationParity,
  runCrossModuleLifecycleRegression,
  runReleaseGateSsot,
  runDashboardParity,
  runStaticSsotChecks,
  runSiteWideEntityLifecycleChecks,
  runWorkflowEvidenceParity,
} = require('./lib/fpc-entity-lifecycle-probes.cjs');
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
    else if (g.includes('run-display-data-governance')) {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const auditOut = path.join(
        ROOT,
        `evidence/GO_display_data_governance/local_b34_${stamp}/audit-report.json`
      );
      fs.mkdirSync(path.dirname(auditOut), { recursive: true });
      cmd = `bash ${g}`;
      gateEnv.EVIDENCE_JSON = auditOut;
    } else cmd = `bash ${g}`;
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
      ? 'YES — entity lifecycle corridors validated @ ①'
      : 'NO',
    q2_is_data_truth_consistent: pass
      ? 'YES — DDG + TTOW + frozen evidence chain aligned'
      : 'PARTIAL',
    q3_is_release_blocker_absent: findings.some((f) => f.severity === 'P0') ? 'NO' : 'YES',
    q4_is_evidence_traceable: pass
      ? 'YES — B34 gate-run + no-batch-skip + matrix b34_apply'
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

  const gate = assertCanRun('B34');
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
  const crossModule = runCrossModuleLifecycleRegression(findings);
  const workflowParity = runWorkflowEvidenceParity(findings);
  const siteLifecycle = runSiteWideEntityLifecycleChecks(checklist, findings);
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
    workflowParity.pass &&
    siteLifecycle.pass;
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
        workflow_parity: workflowParity,
        site_lifecycle: siteLifecycle,
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
    batch_id: 'B34',
    title: 'L5 · Data Lifecycle Certification',
    layer: 'L5',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b34-data-lifecycle.cjs',
    product_version: 'v1.0',
    code_anchor_commit: head,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B10', 'B31', 'B33'],
    api_base: API_BASE,
    gates: [...REGISTRY_GATES, ...BUSINESS_GATES],
    gate_results: gateResults,
    gate_pass: businessGatePass,
    runtime_preflight: preflight,
    entity_lifecycle_live: {
      dependencies,
      frozen_chain: frozenChain,
      gate_aggregation: gateAggregation,
      cross_module_regression: crossModule,
      workflow_validation: workflowParity,
      site_entity_lifecycle: siteLifecycle,
      release_gate: releaseGate,
      dashboard_parity: dashboardParity,
    },
    entity_lifecycle_static_ssot: staticSsot,
    business_certification: { verdict: businessVerdict, gate_pass: businessGatePass },
    quality_supplement: {
      verdict: qualityVerdict,
      domains: ['Q9', 'Q12'],
      checks: qualityCheckResults,
    },
    certification_four_questions: fourQuestions,
    overall_verdict: overallVerdict,
    findings,
    verdict: overallVerdict,
    pass,
    gate_verdict: businessVerdict,
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B35' : 'B34-remediation',
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
      'Data Lifecycle ① — entity create→archive · DDG · TTOW · frozen chain · gate aggregation; defer-commit',
    traceability: {
      requirements: [
        'DDG SSOT + runtime PASS',
        'validate-operations-workflow PASS|PASS_WITH_WARN @ SuperAdmin',
        '202/202 page entity_lifecycle PASS|N/A via b34_apply',
        'B21-B33 frozen chain + no-batch-skip aggregation',
        'B07/B10/B33 cross-module lifecycle regression',
      ],
      spec_refs: [
        'registry/display-data-governance.v1.yaml',
        'registry/traveltrust-operations-workflow.v1.yaml',
        'FPC-100/B34-lifecycle/FPC-100-DATA-LIFECYCLE-CHECKLIST-BASELINE.v1.json',
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B34-LATEST.json',
      certification_batch: 'B34',
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
  console.log(`TT_FPC_100_BATCH_B34: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`BUSINESS: ${businessVerdict} QUALITY: ${qualityVerdict} OVERALL: ${overallVerdict}`);
  console.log(`entity_lifecycle_pages: ${siteLifecycle.pass_count}/${siteLifecycle.total}`);
  console.log(`release_readiness: ${gateAggregation.release_readiness_pct ?? dashboardParity.readiness_pct ?? 'n/a'}%`);
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
