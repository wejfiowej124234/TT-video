#!/usr/bin/env node
/**
 * FPC-100 Batch B32 · L5 API Contract (all methods · ① local)
 *
 *   node scripts/dev/run-fpc-batch-b32-api-contract.cjs
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
const OUT = path.join(EVID, 'FPC-100-BATCH-B32-LATEST.json');
const EVID_DIR = path.join(EVID, 'B32-api-contract');
const CHECKLIST_PATH = path.join(EVID_DIR, 'FPC-100-API-CONTRACT-CHECKLIST-BASELINE.v1.json');
const API_BASE = process.env.API_BASE || process.env.API_BASE_URL || 'http://127.0.0.1:8080';

const checklist = JSON.parse(fs.readFileSync(CHECKLIST_PATH, 'utf8'));
const REGISTRY_GATES = checklist.registry_gates || [];
const BUSINESS_GATES = checklist.business_gates_extended || [];

const QUALITY_CHECKS = [
  {
    id: 'Q12_registry_batch',
    domain: 'Q12',
    path: 'registry/full-production-certification-checklist.v1.yaml',
    must_contain: ['id: B32', 'API Contract'],
  },
  {
    id: 'Q12_b32_checklist',
    domain: 'Q12',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/B32-api-contract/FPC-100-API-CONTRACT-CHECKLIST-BASELINE.v1.json',
    must_contain: ['fpc_100_api_contract_checklist', 'release_gate_bundle'],
  },
  {
    id: 'Q14_fa_audit_registry',
    domain: 'Q14',
    path: 'registry/frontend-api-consistency-audit.v1.yaml',
    must_contain: ['TT_FRONTEND_API_CONSISTENCY_AUDIT: ENFORCED'],
  },
];

const {
  runSiteWideApiContractChecks,
  runB11CrossCheck,
  runReleaseGateSsot,
  runDashboardParity,
  runStaticSsotChecks,
  runCargoApiTests,
} = require('./lib/fpc-api-contract-probes.cjs');
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
    PORT: '8080',
    ENV_LABEL: 'local',
    ...env,
  };
  try {
    let cmd;
    if (g.endsWith('.py')) cmd = `python ${g}`;
    else if (g.endsWith('.cjs')) cmd = `node ${g}`;
    else if (g.includes('run-frontend-api-consistency-audit')) {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const auditOut = path.join(
        ROOT,
        `evidence/GO_frontend_api_consistency_audit/local_b32_${stamp}/audit-report.json`
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
      ? 'YES — consumed API methods contract-certified @ ①'
      : 'NO',
    q2_is_data_truth_consistent: pass ? 'YES — 04↔apiClient↔runtime smoke aligned' : 'PARTIAL',
    q3_is_release_blocker_absent: findings.some((f) => f.severity === 'P0') ? 'NO' : 'YES',
    q4_is_evidence_traceable: pass ? 'YES — B32 gate-run + FA audit + matrix b32_apply' : 'PARTIAL',
    business_verdict: businessVerdict,
    quality_verdict: qualityVerdict,
  };
}

(async () => {
  const stamp = new Date().toISOString();
  const head = sh('git rev-parse HEAD').trim();
  const findings = [];
  const gateResults = [];

  const gate = assertCanRun('B32');
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

  const b11Cross = runB11CrossCheck(findings);
  const siteContract = runSiteWideApiContractChecks(checklist, findings);
  const releaseGate = runReleaseGateSsot(checklist, findings);
  const cargoTests = runCargoApiTests(findings);
  const dashboardParity = runDashboardParity(checklist, findings);
  const staticSsot = runStaticSsotChecks(checklist, findings);
  const qualityCheckResults = runQualityChecks(findings);

  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');

  const businessGatePass =
    gate.ok &&
    gateResults.every((g) => g.pass) &&
    preflight.pass &&
    b11Cross.pass &&
    siteContract.pass &&
    cargoTests.pass;
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
        b11_cross_check: b11Cross,
        site_contract: siteContract,
        release_gate: releaseGate,
        cargo_tests: cargoTests,
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
    batch_id: 'B32',
    title: 'L5 · API Contract Certification (all methods)',
    layer: 'L5',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b32-api-contract.cjs',
    product_version: 'v1.0',
    code_anchor_commit: head,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B11', 'B31'],
    api_base: API_BASE,
    gates: [...REGISTRY_GATES, ...BUSINESS_GATES],
    gate_results: gateResults,
    gate_pass: businessGatePass,
    runtime_preflight: preflight,
    api_contract_live: {
      b11_cross_check: b11Cross,
      site_contract: siteContract,
      release_gate: releaseGate,
      cargo_tests: cargoTests,
      dashboard_parity: dashboardParity,
    },
    api_contract_static_ssot: staticSsot,
    business_certification: { verdict: businessVerdict, gate_pass: businessGatePass },
    quality_supplement: {
      verdict: qualityVerdict,
      domains: ['Q12', 'Q14'],
      checks: qualityCheckResults,
    },
    certification_four_questions: fourQuestions,
    overall_verdict: overallVerdict,
    findings,
    verdict: overallVerdict,
    pass,
    gate_verdict: businessVerdict,
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B33' : 'B32-remediation',
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
      'API Contract ① — 04 routes · public smoke · FA consistency · B453-B457 release gates · cargo test; defer-commit',
    traceability: {
      requirements: [
        'run-check-04-routes + smoke-api-public-routes PASS @ API 8080',
        'frontend-api-consistency-audit SSOT + runtime audit PASS (warnings OK @ ①)',
        '202/202 page api_data_chain PASS|N/A via b32_apply',
        'B11 frozen PASS cross-check · cargo test -p traveltrust-api',
        'Release gate bundle B453-B457 wired via 04 routes gate',
      ],
      spec_refs: [
        'docs/spec/04-后端与API.md §3.4',
        'registry/frontend-api-consistency-audit.v1.yaml',
        'FPC-100/B32-api-contract/FPC-100-API-CONTRACT-CHECKLIST-BASELINE.v1.json',
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B32-LATEST.json',
      certification_batch: 'B32',
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
  console.log(`TT_FPC_100_BATCH_B32: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`BUSINESS: ${businessVerdict} QUALITY: ${qualityVerdict} OVERALL: ${overallVerdict}`);
  console.log(`api_contract_pages: ${siteContract.pass_count}/${siteContract.total}`);
  console.log(`cargo_tests: ${cargoTests.tests_passed ?? 'n/a'}`);
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
