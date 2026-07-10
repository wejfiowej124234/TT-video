#!/usr/bin/env node
/**
 * FPC-100 Batch B24 · Domain regression · R-002 · 93 matrix (① local)
 *
 *   node scripts/dev/run-fpc-batch-b24-regression.cjs
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
const OUT = path.join(EVID, 'FPC-100-BATCH-B24-LATEST.json');
const EVID_DIR = path.join(EVID, 'B24-regression');
const CHECKLIST_PATH = path.join(EVID_DIR, 'FPC-100-REGRESSION-CHECKLIST-BASELINE.v1.json');

const checklist = JSON.parse(fs.readFileSync(CHECKLIST_PATH, 'utf8'));
const REGISTRY_GATES = checklist.registry_gates || [];
const BUSINESS_GATES = checklist.business_gates_extended || [];

const QUALITY_CHECKS = [
  {
    id: 'Q8_regression_matrix',
    domain: 'Q8',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-QUALITY-DOMAIN-MATRIX-LATEST.json',
    must_contain: ['"id": "Q8"', 'B24'],
  },
  {
    id: 'Q8_registry_batch',
    domain: 'Q8',
    path: 'registry/full-production-certification-checklist.v1.yaml',
    must_contain: ['id: B24', 'Domain regression'],
  },
  {
    id: 'Q8_r002_readme',
    domain: 'Q8',
    path: 'evidence/GO_local_r002_verify/README.md',
    must_contain: ['PARTIAL_GO', 'ISS-007'],
  },
  {
    id: 'Q17_regression_checklist',
    domain: 'Q17',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/B24-regression/FPC-100-REGRESSION-CHECKLIST-BASELINE.v1.json',
    must_contain: ['fpc_100_regression_checklist', 'anchor_count'],
  },
];

const {
  loadChecklist,
  runMatrixWiringChecks,
  runAnchorCargoParity,
  runReportGateSemantics,
  runStaticSsotChecks,
} = require('./lib/fpc-regression-probes.cjs');
const { assertCanRun } = require('./lib/fpc-batch-sequence.cjs');
const { evaluateRuntimePreflight } = require('./lib/fpc-runtime-preflight.cjs');

function sh(cmd, cwd = ROOT, env = {}) {
  const childEnv = { ...process.env, ...env };
  if (childEnv.FPC_UNSET_DATABASE_URL === '1') {
    delete childEnv.DATABASE_URL;
    delete childEnv.P3_CHAIN_OFF;
    delete childEnv.TRAVELTRUST_PUBLIC_CATALOG_SURFACE;
    delete childEnv.TRAVELTRUST_R002_REPORT_PARENT;
    delete childEnv.FPC_UNSET_DATABASE_URL;
  }
  return execSync(cmd, {
    cwd,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: childEnv,
    timeout: childEnv.FPC_GATE_TIMEOUT_MS ? Number(childEnv.FPC_GATE_TIMEOUT_MS) : 900_000,
  });
}

function runGate(g, findings, gateResults, env = {}) {
  let exitCode = 0;
  let stdout = '';
  let stderr = '';
  try {
    const cmd = g.endsWith('.py') ? `python ${g}` : g.endsWith('.cjs') ? `node ${g}` : `bash ${g}`;
    stdout = sh(cmd, ROOT, {
      FPC_GATE_TIMEOUT_MS: '600000',
      ...env,
    });
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

function runQualityChecks(findings) {
  const results = [];
  for (const q of QUALITY_CHECKS) {
    const abs = path.join(ROOT, q.path);
    let pass = fs.existsSync(abs);
    const notes = [];
    if (!pass) {
      findings.push({ id: `quality_missing:${q.id}`, severity: 'P0', detail: q.path });
    } else if (q.must_contain) {
      const text = fs.readFileSync(abs, 'utf8');
      for (const needle of q.must_contain) {
        if (!text.includes(needle)) {
          pass = false;
          findings.push({
            id: `quality_ssot:${q.id}`,
            severity: 'P1',
            detail: `${q.path} missing ${needle}`,
          });
          notes.push(`missing:${needle}`);
        }
      }
    }
    results.push({ id: q.id, domain: q.domain, pass, path: q.path, notes });
  }
  return results;
}

function buildFourQuestions(businessVerdict, qualityVerdict, findings, recertPass) {
  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');
  const p2 = findings.filter((f) => f.severity === 'P2');
  return {
    business_correct: {
      answer: businessVerdict === 'PASS' || businessVerdict === 'PASS_WITH_WARN',
      verdict: businessVerdict,
      notes: '43-anchor ISS-007 R-002 · PARTIAL_GO valid · --fail-on-no-go chain',
    },
    quality_meets_standard: {
      answer: qualityVerdict === 'PASS' || qualityVerdict === 'PASS_WITH_WARN',
      verdict: qualityVerdict,
      notes: 'Q8 regression + Q17 evidence · matrix wiring + false-GO guard',
    },
    findings_identified: {
      answer: findings.length > 0,
      p0: p0.length,
      p1: p1.length,
      p2: p2.length,
      items: findings,
    },
    recertification_passed: {
      answer: recertPass,
      notes: recertPass
        ? '43/43 PASS · release_gate PARTIAL_GO · local-verify-r002 chain exit 0'
        : 'Pending fix + re-run batch runner',
    },
  };
}

(async () => {
  const stamp = new Date().toISOString();
  const findings = [];
  const gateResults = [];
  const codeAnchor = sh('git rev-parse HEAD').trim();

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

  const gate = assertCanRun('B24');
  if (!gate.ok) {
    findings.push({
      id: 'no_batch_skip',
      severity: 'P0',
      detail: `Cannot run B24 before ${gate.missing_prerequisites?.join(', ')}`,
    });
  }

  const r002Env = {
    DATABASE_URL: process.env.DATABASE_URL || 'postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust',
    P3_CHAIN_OFF: '1',
    TRAVELTRUST_PUBLIC_CATALOG_SURFACE: '0',
    TRAVELTRUST_R002_REPORT_PARENT: 'evidence/GO_local_r002_verify',
    REPORT_JSON: 'evidence/GO_local_r002_verify/r002_iss007_prereport/report.json',
    TRAVELTRUST_R002_REPORT_PATH: 'evidence/GO_local_r002_verify/r002_iss007_prereport/report.json',
    R002_FAIL_ON_NO_GO: '1',
    FPC_GATE_TIMEOUT_MS: '600000',
  };

  for (const g of REGISTRY_GATES) {
    if (g.includes('ci-local-delivery-minimum')) {
      // PG app-stack matrix tests skip without DATABASE_URL; full-suite + DATABASE_URL pollutes shared DB.
      runGate(g, findings, gateResults, {
        FPC_GATE_TIMEOUT_MS: '600000',
        FPC_UNSET_DATABASE_URL: '1',
      });
    } else {
      runGate(g, findings, gateResults, r002Env);
    }
  }
  for (const g of BUSINESS_GATES) {
    runGate(g, findings, gateResults, r002Env);
  }

  const wiringChecks = runMatrixWiringChecks(ROOT, checklist, findings);
  const anchorChecks = runAnchorCargoParity(ROOT, checklist, findings);
  const reportChecks = runReportGateSemantics(ROOT, checklist, findings);
  const staticSsot = runStaticSsotChecks(ROOT, checklist, findings);
  const qualityCheckResults = runQualityChecks(findings);

  qualityCheckResults.push({
    id: 'Q8_matrix_wiring',
    domain: 'Q8',
    pass: wiringChecks.every((c) => c.pass),
    path: 'crates/api/src/routes/mod.rs',
    notes: wiringChecks.map((c) => `${c.id}:${c.pass}`),
  });
  qualityCheckResults.push({
    id: 'Q8_anchor_cargo_parity',
    domain: 'Q8',
    pass: anchorChecks.every((c) => c.pass),
    path: 'scripts/gen-r002-iss007-prereport.py',
    notes: [`anchors:${checklist.anchor_count}`],
  });
  qualityCheckResults.push({
    id: 'Q8_r002_report_gate',
    domain: 'Q8',
    pass: reportChecks.every((c) => c.pass),
    path: checklist.report_json_ssot,
    notes: reportChecks.map((c) => c.id),
  });

  const head = sh('git rev-parse HEAD').trim();
  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');
  const businessGatePass =
    gateResults.every((g) => g.pass) && gate.ok && preflight.pass;
  const qualityPass =
    qualityCheckResults.every((q) => q.pass) &&
    staticSsot.every((s) => s.pass) &&
    wiringChecks.every((c) => c.pass) &&
    anchorChecks.every((c) => c.pass) &&
    reportChecks.every((c) => c.pass) &&
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
        wiring_checks: wiringChecks,
        anchor_checks: anchorChecks,
        report_checks: reportChecks,
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
    batch_id: 'B24',
    title: 'Domain regression · R-002 · 93 matrix · release gate',
    layer: 'technical',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b24-regression.cjs',
    product_version: 'v1.0',
    code_anchor_commit: codeAnchor,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B10', 'B11', 'B23'],
    gates: [...REGISTRY_GATES, ...BUSINESS_GATES],
    gate_results: gateResults,
    gate_pass: businessGatePass,
    runtime_preflight: preflight,
    regression_live: {
      wiring_checks: wiringChecks,
      anchor_checks: anchorChecks,
      report_checks: reportChecks,
      report_json_ssot: checklist.report_json_ssot,
    },
    regression_static_ssot: staticSsot,
    business_certification: { verdict: businessVerdict, gate_pass: businessGatePass },
    quality_supplement: {
      verdict: qualityVerdict,
      domains: ['Q8', 'Q17'],
      checks: qualityCheckResults,
    },
    certification_four_questions: fourQuestions,
    overall_verdict: overallVerdict,
    findings,
    verdict: overallVerdict,
    pass,
    gate_verdict: businessVerdict,
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B25-C1' : 'B24-remediation',
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
      'ISS-007 43-anchor narrow slice ① — PARTIAL_GO valid; not staging full-matrix GO; B21/B22/B23 frozen',
    traceability: {
      requirements: [
        '43/43 matrix_93 cargo filters PASS with DATABASE_URL',
        'release_gate PARTIAL_GO or GO with release_gate_reason',
        'local-verify-r002-prereport-chain exit 0',
        'matrix db_api_tests modules wired in routes/orders/community',
        'false-GO guard: no --require-go on ISS-007 prereport',
      ],
      spec_refs: [
        'docs/spec/93-全站功能验证矩阵-域别回归清单.md',
        'docs/spec/R-002-回归执行闭环与发布准入.md',
        'evidence/GO_local_r002_verify/README.md',
        'FPC-100/B24-regression/FPC-100-REGRESSION-CHECKLIST-BASELINE.v1.json',
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B24-LATEST.json',
      certification_batch: 'B24',
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
  console.log(`TT_FPC_100_BATCH_B24: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`BUSINESS: ${businessVerdict} QUALITY: ${qualityVerdict} OVERALL: ${overallVerdict}`);
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
