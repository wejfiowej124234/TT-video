#!/usr/bin/env node
/**
 * FPC-100 Batch B23 · L1 full page coverage 202/202 (① local)
 *
 *   node scripts/dev/run-fpc-batch-b23-full-page-coverage.cjs
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
const OUT = path.join(EVID, 'FPC-100-BATCH-B23-LATEST.json');
const EVID_DIR = path.join(EVID, 'B23-full-page-coverage');
const CHECKLIST_PATH = path.join(EVID_DIR, 'FPC-100-PAGE-COVERAGE-CHECKLIST-BASELINE.v1.json');
const FORENSIC_DIR = path.join(EVID_DIR, 'forensic-latest');
const FORENSIC_SUMMARY = path.join(FORENSIC_DIR, 'forensic-summary.json');

const checklist = JSON.parse(fs.readFileSync(CHECKLIST_PATH, 'utf8'));
const REGISTRY_GATES = checklist.registry_gates || [];

const QUALITY_CHECKS = [
  {
    id: 'Q1_quality_matrix',
    domain: 'Q1',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-QUALITY-DOMAIN-MATRIX-LATEST.json',
    must_contain: ['"id": "Q1"', 'layer1_surface_coverage', 'B23'],
  },
  {
    id: 'Q1_registry_batch',
    domain: 'Q1',
    path: 'registry/full-production-certification-checklist.v1.yaml',
    must_contain: ['id: B23', 'run-phase1-site-page-forensic.sh'],
  },
  {
    id: 'Q1_page_checklist',
    domain: 'Q1',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/B23-full-page-coverage/FPC-100-PAGE-COVERAGE-CHECKLIST-BASELINE.v1.json',
    must_contain: ['fpc_100_page_coverage_checklist', '202'],
  },
  {
    id: 'Q1_page_matrix',
    domain: 'Q1',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json',
    must_contain: ['pages_total', 'layer1_surface_coverage'],
  },
];

const {
  loadChecklist,
  runMatrixCoverageChecks,
  runForensicParity,
  runStaticSsotChecks,
} = require('./lib/fpc-page-coverage-probes.cjs');
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

function runForensicAndApply(findings) {
  fs.mkdirSync(FORENSIC_DIR, { recursive: true });
  try {
    sh(`python scripts/dev/generate-phase1-site-page-forensic.py "${FORENSIC_DIR.replace(/\\/g, '/')}"`, ROOT, {
      FPC_GATE_TIMEOUT_MS: '120000',
    });
  } catch (e) {
    findings.push({
      id: 'forensic_generate_fail',
      severity: 'P0',
      detail: ((e.stdout || '') + (e.stderr || '')).slice(0, 1500),
    });
    return { pass: false };
  }
  try {
    sh(`node scripts/dev/apply-fpc-l1-page-matrix-from-forensic.cjs "${FORENSIC_SUMMARY.replace(/\\/g, '/')}"`, ROOT);
  } catch (e) {
    findings.push({
      id: 'l1_matrix_apply_fail',
      severity: 'P0',
      detail: ((e.stdout || '') + (e.stderr || '')).slice(0, 1500),
    });
    return { pass: false, forensic_summary: FORENSIC_SUMMARY };
  }
  return { pass: true, forensic_summary: FORENSIC_SUMMARY };
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
      notes: '04/13-1 route gates + phase1 forensic + L1 matrix 202/202',
    },
    quality_meets_standard: {
      answer: qualityVerdict === 'PASS' || qualityVerdict === 'PASS_WITH_WARN',
      verdict: qualityVerdict,
      notes: 'Q1 product function — registry/matrix/frontend route contract SSOT',
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
        ? '202/202 L1 layer1_surface_coverage PASS/N/A · zero duplicate routes'
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

  const gate = assertCanRun('B23');
  if (!gate.ok) {
    findings.push({
      id: 'no_batch_skip',
      severity: 'P0',
      detail: `Cannot run B23 before ${gate.missing_prerequisites?.join(', ')}`,
    });
  }

  for (const g of REGISTRY_GATES) {
    if (g.includes('run-phase1-site-page-forensic')) {
      runGate(g, findings, gateResults, { SITE_FORENSIC_OUT: FORENSIC_DIR });
    } else {
      runGate(g, findings, gateResults);
    }
  }

  const forensicApply = preflight.pass ? runForensicAndApply(findings) : { pass: false, skipped: true };

  const matrixChecks = runMatrixCoverageChecks(checklist, findings);
  const forensicParity = runForensicParity(FORENSIC_SUMMARY, findings);
  const staticSsot = runStaticSsotChecks(ROOT, findings);
  const vitestCommunity = runVitest(
    'app/community/communitySubRoutes.contract.test.ts',
    FE,
    findings,
    'vitest_community_routes'
  );
  const vitestAdmin = runVitest(
    'app/admin/adminMissingPages.contract.test.ts',
    FE,
    findings,
    'vitest_admin_pages'
  );
  const qualityCheckResults = runQualityChecks(findings);
  qualityCheckResults.push({
    id: 'Q1_matrix_l1_coverage',
    domain: 'Q1',
    pass: matrixChecks.pass,
    path: 'FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json',
    notes: matrixChecks.checks?.map((c) => `${c.id}:${c.pass}`) || [],
  });
  qualityCheckResults.push({
    id: 'Q1_forensic_parity',
    domain: 'Q1',
    pass: forensicParity.pass === true,
    path: FORENSIC_SUMMARY,
    notes: [String(forensicParity.l1_coverage_pct)],
  });
  qualityCheckResults.push({
    id: 'Q1_vitest_community_routes',
    domain: 'Q1',
    pass: vitestCommunity.pass,
    path: 'communitySubRoutes.contract.test.ts',
    notes: [vitestCommunity.summary],
  });
  qualityCheckResults.push({
    id: 'Q1_vitest_admin_pages',
    domain: 'Q1',
    pass: vitestAdmin.pass,
    path: 'adminMissingPages.contract.test.ts',
    notes: [vitestAdmin.summary],
  });

  const head = sh('git rev-parse HEAD').trim();
  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');
  const businessGatePass =
    gateResults.every((g) => g.pass) &&
    gate.ok &&
    preflight.pass &&
    forensicApply.pass !== false &&
    matrixChecks.pass &&
    forensicParity.pass !== false;
  const qualityPass =
    qualityCheckResults.every((q) => q.pass) &&
    staticSsot.every((s) => s.pass) &&
    vitestCommunity.pass &&
    vitestAdmin.pass &&
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
        forensic_apply: forensicApply,
        matrix_checks: matrixChecks,
        forensic_parity: forensicParity,
        static_ssot: staticSsot,
        vitest: { community: vitestCommunity, admin: vitestAdmin },
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
    batch_id: 'B23',
    title: 'L1 · 100% page coverage enumeration (202/202)',
    layer: 'L1',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b23-full-page-coverage.cjs',
    product_version: 'v1.0',
    code_anchor_commit: codeAnchor,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B22'],
    gates: REGISTRY_GATES,
    gate_results: gateResults,
    gate_pass: businessGatePass,
    runtime_preflight: preflight,
    page_coverage_live: {
      forensic_summary: FORENSIC_SUMMARY,
      matrix_checks: matrixChecks,
      forensic_parity: forensicParity,
    },
    page_static_ssot: staticSsot,
    business_certification: { verdict: businessVerdict, gate_pass: businessGatePass },
    quality_supplement: {
      verdict: qualityVerdict,
      domains: ['Q1'],
      checks: qualityCheckResults,
    },
    certification_four_questions: fourQuestions,
    overall_verdict: overallVerdict,
    findings,
    verdict: overallVerdict,
    pass,
    gate_verdict: businessVerdict,
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B24' : 'B23-remediation',
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
      'L1 202/202 ① — route gates + forensic + matrix layer1 PASS; B21/B22 untouched; not L2 per-page certification',
    traceability: {
      requirements: [
        'check-04-frontend-routes-vs-app.py PASS',
        'check-13-1-table1-routes-vs-app.py PASS',
        'phase1 site page forensic exit 0',
        'FPC-100-PAGE-CERTIFICATION-MATRIX coverage_pct=100',
        'zero duplicate routes in matrix',
        'global not-found + global-error present',
      ],
      spec_refs: [
        'docs/spec/04-后端与API.md',
        'docs/spec/13-1-UI产品级SSOT与页面规范.md',
        'docs/spec/96-20-前后端页面对齐与UI生产级审计报告.md',
        'FPC-100/B23-full-page-coverage/FPC-100-PAGE-COVERAGE-CHECKLIST-BASELINE.v1.json',
        'FPC-100/FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json',
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B23-LATEST.json',
      certification_batch: 'B23',
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
  console.log(`TT_FPC_100_BATCH_B23: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`BUSINESS: ${businessVerdict} QUALITY: ${qualityVerdict} OVERALL: ${overallVerdict}`);
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
