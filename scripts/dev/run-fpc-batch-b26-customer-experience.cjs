#!/usr/bin/env node
/**
 * FPC-100 Batch B26 · L2.5 Customer Experience (202 pages · ① local)
 *
 *   node scripts/dev/run-fpc-batch-b26-customer-experience.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const FE = path.join(ROOT, 'frontend');
const EVID = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100'
);
const OUT = path.join(EVID, 'FPC-100-BATCH-B26-LATEST.json');
const EVID_DIR = path.join(EVID, 'B26-customer-experience');
const CHECKLIST_PATH = path.join(EVID_DIR, 'FPC-100-CUSTOMER-EXPERIENCE-CHECKLIST-BASELINE.v1.json');

const checklist = JSON.parse(fs.readFileSync(CHECKLIST_PATH, 'utf8'));
const BUSINESS_GATES = checklist.business_gates_extended || [];

const QUALITY_CHECKS = [
  {
    id: 'Q3_quality_matrix',
    domain: 'Q3',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-QUALITY-DOMAIN-MATRIX-LATEST.json',
    must_contain: ['"id": "Q3"', 'B26'],
  },
  {
    id: 'Q3_registry_batch',
    domain: 'Q3',
    path: 'registry/full-production-certification-checklist.v1.yaml',
    must_contain: ['id: B26', 'Customer Experience'],
  },
  {
    id: 'Q3_cx_checklist',
    domain: 'Q3',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/B26-customer-experience/FPC-100-CUSTOMER-EXPERIENCE-CHECKLIST-BASELINE.v1.json',
    must_contain: ['fpc_100_customer_experience_checklist', 'all_202_pages'],
  },
];

const {
  loadChecklist,
  runSiteWideCxChecks,
  runOtherConsumerClosure,
  runDashboardParity,
  runStaticSsotChecks,
} = require('./lib/fpc-customer-experience-probes.cjs');
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
    const cmd = g.endsWith('.py') ? `python ${g}` : g.endsWith('.cjs') ? `node ${g}` : `bash ${g}`;
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
      id: `gate_fail:${path.basename(g)}`,
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

function runVitest(relativePath, cwd, findings, id) {
  let exitCode = 0;
  let stdout = '';
  try {
    stdout = sh(`npx vitest run ${relativePath} --reporter=dot`, cwd, {
      FPC_GATE_TIMEOUT_MS: '180000',
    });
  } catch (e) {
    exitCode = e.status || 1;
    stdout = (e.stdout || '') + (e.stderr || '');
    findings.push({ id, severity: 'P1', detail: stdout.slice(0, 1500) });
  }
  return { pass: exitCode === 0, exit_code: exitCode, summary: stdout.split('\n').slice(-2).join(' ') };
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
    q1_can_user_complete_core_task: pass ? 'YES — 202/202 pages L2.5 CX PASS' : 'NO',
    q2_is_data_truth_consistent: pass ? 'YES — page matrix b26_apply all_cx_pass' : 'PARTIAL',
    q3_is_release_blocker_absent: findings.some((f) => f.severity === 'P0') ? 'NO' : 'YES',
    q4_is_evidence_traceable: pass ? 'YES — B26 checklist + matrix + gate-run' : 'PARTIAL',
    business_verdict: businessVerdict,
    quality_verdict: qualityVerdict,
  };
}

(async () => {
  const stamp = new Date().toISOString();
  const head = sh('git rev-parse HEAD').trim();
  const codeAnchor = head;
  const findings = [];
  const gateResults = [];

  const gate = assertCanRun('B26');
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

  for (const g of BUSINESS_GATES) {
    runGate(g, findings, gateResults);
  }

  const vitestResults = (checklist.vitest_contracts || []).map((rel) => ({
    path: rel,
    ...runVitest(rel, FE, findings, `vitest_fail:${path.basename(rel)}`),
  }));

  const siteCx = runSiteWideCxChecks(checklist, findings);
  const otherConsumer = runOtherConsumerClosure(checklist, findings);
  const dashboardParity = runDashboardParity(checklist, findings);
  const staticSsot = runStaticSsotChecks(checklist, findings);
  const qualityCheckResults = runQualityChecks(findings);

  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');

  const businessGatePass =
    gate.ok &&
    gateResults.every((g) => g.pass) &&
    preflight.pass &&
    siteCx.pass &&
    otherConsumer.pass;
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
        vitest_results: vitestResults,
        site_cx: siteCx,
        other_consumer: otherConsumer,
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
    batch_id: 'B26',
    title: 'L2.5 · Customer Experience Certification (202 pages)',
    layer: 'L2_5',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b26-customer-experience.cjs',
    product_version: 'v1.0',
    code_anchor_commit: codeAnchor,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B23', 'B25-C1', 'B25-C2', 'B25-C3', 'B25-C4', 'B25-C5', 'B25-C6'],
    scope: 'all_202_pages',
    other_consumer_routes: checklist.other_consumer_routes,
    gates: BUSINESS_GATES,
    gate_results: gateResults,
    gate_pass: businessGatePass,
    runtime_preflight: preflight,
    customer_experience_live: {
      site_cx: siteCx,
      other_consumer: otherConsumer,
      dashboard_parity: dashboardParity,
      vitest_results: vitestResults,
    },
    cx_static_ssot: staticSsot,
    business_certification: { verdict: businessVerdict, gate_pass: businessGatePass },
    quality_supplement: {
      verdict: qualityVerdict,
      domains: ['Q3'],
      checks: qualityCheckResults,
    },
    certification_four_questions: fourQuestions,
    overall_verdict: overallVerdict,
    findings,
    verdict: overallVerdict,
    pass,
    gate_verdict: businessVerdict,
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B30' : 'B26-remediation',
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
      'L2.5 CX 202 pages ① — user_goal · primary_cta · journey score · ≤3-click core action; defer-commit after B21-B25 anchor',
    traceability: {
      requirements: [
        '202/202 pages layer2_5_customer_experience.certification_verdict PASS',
        'user_goal + primary_cta non-empty on every page card',
        'other_consumer 9-route gap closed via b26_apply',
        'FPC release dashboard refreshed · executive gate audit PASS',
      ],
      spec_refs: [
        'FPC-100-QUALITY-DOMAIN-MATRIX-v1.md §Q3',
        'registry/full-production-certification-checklist.v1.yaml · B26',
        'FPC-100/B26-customer-experience/FPC-100-CUSTOMER-EXPERIENCE-CHECKLIST-BASELINE.v1.json',
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B26-LATEST.json',
      certification_batch: 'B26',
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
  console.log(`TT_FPC_100_BATCH_B26: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`BUSINESS: ${businessVerdict} QUALITY: ${qualityVerdict} OVERALL: ${overallVerdict}`);
  console.log(`cx_pages: ${siteCx.pass_count}/${siteCx.total}`);
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
