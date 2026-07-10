#!/usr/bin/env node
/**
 * FPC-100 Batch B25-C1 · L2 marketing & brand cluster (① local)
 *
 *   node scripts/dev/run-fpc-batch-b25-c1-marketing-brand.cjs
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
const OUT = path.join(EVID, 'FPC-100-BATCH-B25-C1-LATEST.json');
const EVID_DIR = path.join(EVID, 'B25-C1-marketing-brand');
const CHECKLIST_PATH = path.join(EVID_DIR, 'FPC-100-MARKETING-BRAND-CHECKLIST-BASELINE.v1.json');

const checklist = JSON.parse(fs.readFileSync(CHECKLIST_PATH, 'utf8'));
const REGISTRY_GATES = checklist.registry_gates || [];
const BUSINESS_GATES = checklist.business_gates_extended || [];

const QUALITY_CHECKS = [
  {
    id: 'Q2_quality_matrix',
    domain: 'Q2',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-QUALITY-DOMAIN-MATRIX-LATEST.json',
    must_contain: ['"id": "Q2"', 'B25-C1'],
  },
  {
    id: 'Q2_registry_batch',
    domain: 'Q2',
    path: 'registry/full-production-certification-checklist.v1.yaml',
    must_contain: ['id: B25-C1', 'marketing_brand'],
  },
  {
    id: 'Q4_page_matrix_cluster',
    domain: 'Q4',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json',
    must_contain: ['marketing_brand', 'layer2_l5_scores'],
  },
  {
    id: 'Q4_marketing_checklist',
    domain: 'Q4',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/B25-C1-marketing-brand/FPC-100-MARKETING-BRAND-CHECKLIST-BASELINE.v1.json',
    must_contain: ['fpc_100_marketing_brand_checklist', 'cluster_routes'],
  },
];

const {
  loadChecklist,
  runClusterMatrixChecks,
  runDashboardParity,
  runDisplayStateParity,
  runStaticSsotChecks,
} = require('./lib/fpc-marketing-brand-probes.cjs');
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
      notes: 'marketing_brand 4 routes · UI freeze + data chain + dashboard/registry parity',
    },
    quality_meets_standard: {
      answer: qualityVerdict === 'PASS' || qualityVerdict === 'PASS_WITH_WARN',
      verdict: qualityVerdict,
      notes: 'Q2 UX/UI + Q4 page certification · L2 scores + production_ready',
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
        ? '4/4 marketing_brand L2 PASS · dashboard next=B25-C2 · B21-B24 frozen'
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

  const gate = assertCanRun('B25-C1');
  if (!gate.ok) {
    findings.push({
      id: 'no_batch_skip',
      severity: 'P0',
      detail: `Cannot run B25-C1 before ${gate.missing_prerequisites?.join(', ')}`,
    });
  }

  for (const g of REGISTRY_GATES) {
    runGate(g, findings, gateResults);
  }

  const vitestResults = [];
  for (const rel of checklist.vitest_contracts || []) {
    const id = `vitest:${path.basename(rel)}`;
    const row = runVitest(rel, FE, findings, id);
    vitestResults.push({ id, path: rel, ...row });
  }

  for (const g of BUSINESS_GATES) {
    runGate(g, findings, gateResults);
  }

  const clusterChecks = runClusterMatrixChecks(checklist, findings);
  const dashboardParity = runDashboardParity(checklist, findings);
  const displayParity = runDisplayStateParity(checklist, findings);
  const staticSsot = runStaticSsotChecks(ROOT, checklist, findings);
  const qualityCheckResults = runQualityChecks(findings);

  qualityCheckResults.push({
    id: 'Q4_cluster_l2',
    domain: 'Q4',
    pass: clusterChecks.pass,
    path: 'FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json',
    notes: clusterChecks.checks?.map((c) => `${c.id}:${c.pass}`) || [],
  });
  qualityCheckResults.push({
    id: 'Q4_dashboard_parity',
    domain: 'Q4',
    pass: dashboardParity.pass,
    path: 'FPC-100-RELEASE-DASHBOARD-LATEST.json',
    notes: dashboardParity.checks?.map((c) => `${c.id}:${c.pass}`) || [],
  });

  const head = sh('git rev-parse HEAD').trim();
  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');
  const businessGatePass =
    gateResults.every((g) => g.pass) &&
    gate.ok &&
    preflight.pass &&
    vitestResults.every((v) => v.pass);
  const qualityPass =
    qualityCheckResults.every((q) => q.pass) &&
    staticSsot.every((s) => s.pass) &&
    clusterChecks.pass &&
    dashboardParity.pass &&
    displayParity.pass &&
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
        cluster_checks: clusterChecks,
        dashboard_parity: dashboardParity,
        display_parity: displayParity,
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
    batch_id: 'B25-C1',
    title: 'L2 · Page certification — marketing & brand cluster',
    layer: 'L2',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b25-c1-marketing-brand.cjs',
    product_version: 'v1.0',
    code_anchor_commit: codeAnchor,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B23', 'B24'],
    route_clusters: ['marketing_brand'],
    cluster_routes: checklist.cluster_routes,
    gates: [...REGISTRY_GATES, ...BUSINESS_GATES],
    gate_results: gateResults,
    gate_pass: businessGatePass,
    runtime_preflight: preflight,
    marketing_brand_live: {
      cluster_checks: clusterChecks,
      dashboard_parity: dashboardParity,
      display_parity: displayParity,
      vitest_results: vitestResults,
    },
    marketing_static_ssot: staticSsot,
    business_certification: { verdict: businessVerdict, gate_pass: businessGatePass },
    quality_supplement: {
      verdict: qualityVerdict,
      domains: ['Q2', 'Q4'],
      checks: qualityCheckResults,
    },
    certification_four_questions: fourQuestions,
    overall_verdict: overallVerdict,
    findings,
    verdict: overallVerdict,
    pass,
    gate_verdict: businessVerdict,
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B25-C2' : 'B25-C1-remediation',
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
      'marketing_brand 4 routes ① — UI freeze + L2 page cards; B21/B22/B23/B24 frozen; not ② staging GO',
    traceability: {
      requirements: [
        '4/4 marketing_brand routes L2 certified with production_ready YES',
        'five-main UI gate + landing data chain + did-rank L5 green',
        'FPC release dashboard next_required_batch aligns with registry',
        'executive dashboard gate audit PASS',
        'page matrix L2 apply b25_c1_apply cluster_certified',
      ],
      spec_refs: [
        'frontend/evidence/GO_local_marketing_front_closure/FIVE-PAGES-ENTERPRISE-CODE-AUDIT-20260603.md',
        'frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md',
        'frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md',
        'FPC-100/B25-C1-marketing-brand/FPC-100-MARKETING-BRAND-CHECKLIST-BASELINE.v1.json',
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B25-C1-LATEST.json',
      certification_batch: 'B25-C1',
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
  console.log(`TT_FPC_100_BATCH_B25-C1: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`BUSINESS: ${businessVerdict} QUALITY: ${qualityVerdict} OVERALL: ${overallVerdict}`);
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
