#!/usr/bin/env node
/**
 * FPC-100 Batch B25-C5 · L2 governance · community · trust/help cluster (① local)
 *
 *   node scripts/dev/run-fpc-batch-b25-c5-governance-community-trust.cjs
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
const OUT = path.join(EVID, 'FPC-100-BATCH-B25-C5-LATEST.json');
const EVID_DIR = path.join(EVID, 'B25-C5-governance-community-trust');
const CHECKLIST_PATH = path.join(EVID_DIR, 'FPC-100-GOVERNANCE-COMMUNITY-TRUST-CHECKLIST-BASELINE.v1.json');

const checklist = JSON.parse(fs.readFileSync(CHECKLIST_PATH, 'utf8'));
const REGISTRY_GATES = checklist.registry_gates || [];
const BUSINESS_GATES = checklist.business_gates_extended || [];

const QUALITY_CHECKS = [
  {
    id: 'Q8_registry_batch',
    domain: 'Q8',
    path: 'registry/full-production-certification-checklist.v1.yaml',
    must_contain: ['id: B25-C5', 'governance_economics'],
  },
  {
    id: 'Q4_community_freeze',
    domain: 'Q4',
    path: 'frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE1-FREEZE.md',
    must_contain: ['/community', 'communitySubRoutes'],
  },
  {
    id: 'Q4_governance_proposals_freeze',
    domain: 'Q4',
    path: 'frontend/evidence/GO_local_identity_workspace/GOVERNANCE-PROPOSALS-L5-FREEZE.md',
    must_contain: ['/governance/proposals', 'governance-proposals-l5'],
  },
  {
    id: 'Q6_display_data_governance',
    domain: 'Q6',
    path: 'registry/display-data-governance.v1.yaml',
    must_contain: ['TT_DISPLAY_DATA_GOVERNANCE: ENFORCED', 'community_feed'],
  },
  {
    id: 'Q5_gov_comm_trust_checklist',
    domain: 'Q5',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/B25-C5-governance-community-trust/FPC-100-GOVERNANCE-COMMUNITY-TRUST-CHECKLIST-BASELINE.v1.json',
    must_contain: ['fpc_100_governance_community_trust_checklist', 'display_governance_ssot'],
  },
];

const {
  runClusterMatrixChecks,
  runDashboardParity,
  runDisplayStateParity,
  runDisplayGovernanceSsot,
  runContentLifecycleSsot,
  runDisplayChainSsot,
  runStaticSsotChecks,
} = require('./lib/fpc-governance-community-trust-probes.cjs');
const { assertCanRun } = require('./lib/fpc-batch-sequence.cjs');
const { evaluateRuntimePreflight } = require('./lib/fpc-runtime-preflight.cjs');

function sh(cmd, cwd = ROOT, env = {}) {
  return execSync(cmd, {
    cwd,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
    timeout: env.FPC_GATE_TIMEOUT_MS ? Number(env.FPC_GATE_TIMEOUT_MS) : 1_200_000,
  });
}

function runGate(g, findings, gateResults, env = {}) {
  let exitCode = 0;
  let stdout = '';
  let stderr = '';
  try {
    const cmd = g.endsWith('.py') ? `python ${g}` : g.endsWith('.cjs') ? `node ${g}` : `bash ${g}`;
    stdout = sh(cmd, ROOT, {
      FPC_GATE_TIMEOUT_MS: g.includes('community-l5') || g.includes('governance-matrix') ? '900000' : '600000',
      SKIP_PLAYWRIGHT: '1',
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
      notes: '36 routes · governance + community + trust/help · B06/B07 gate union + display governance SSOT',
    },
    quality_meets_standard: {
      answer: qualityVerdict === 'PASS' || qualityVerdict === 'PASS_WITH_WARN',
      verdict: qualityVerdict,
      notes: 'Public catalog isolation · content lifecycle · UI freeze docs · API/Registry/Frontend parity',
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
        ? '36/36 governance/community/trust L2 PASS · dashboard next=B25-C6 · B21-B25-C4 frozen'
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

  const gate = assertCanRun('B25-C5');
  if (!gate.ok) {
    findings.push({
      id: 'no_batch_skip',
      severity: 'P0',
      detail: `Cannot run B25-C5 before ${gate.missing_prerequisites?.join(', ')}`,
    });
  }

  const gateEnv = {
    DATABASE_URL: preflight.database_url || process.env.DATABASE_URL,
    API_BASE: preflight.api_base || 'http://127.0.0.1:8080',
    API_BASE_URL: preflight.api_base || 'http://127.0.0.1:8080',
    BASE: preflight.api_base || 'http://127.0.0.1:8080',
  };

  for (const g of REGISTRY_GATES) {
    if (!preflight.pass && (g.includes('community') || g.includes('vertical-slice'))) {
      gateResults.push({ gate: g, exit_code: 1, pass: false, summary_line: 'skipped: preflight failed' });
      findings.push({ id: `gate_skip:${path.basename(g)}`, severity: 'P0', detail: 'API required' });
      continue;
    }
    runGate(g, findings, gateResults, gateEnv);
  }

  const vitestResults = [];
  for (const rel of checklist.vitest_contracts || []) {
    const id = `vitest:${path.basename(rel)}`;
    const row = runVitest(rel, FE, findings, id);
    vitestResults.push({ id, path: rel, ...row });
  }

  for (const g of BUSINESS_GATES) {
    runGate(g, findings, gateResults, gateEnv);
  }

  const clusterChecks = runClusterMatrixChecks(checklist, findings);
  const dashboardParity = runDashboardParity(checklist, findings);
  const displayParity = runDisplayStateParity(checklist, findings);
  const displayGovernance = runDisplayGovernanceSsot(checklist, findings);
  const contentLifecycle = runContentLifecycleSsot(checklist, findings);
  const displayChain = runDisplayChainSsot(checklist, findings);
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
  qualityCheckResults.push({
    id: 'Q6_display_governance',
    domain: 'Q6',
    pass: displayGovernance.pass && contentLifecycle.pass,
    path: 'registry/display-data-governance.v1.yaml',
    notes: [
      ...(displayGovernance.checks?.map((c) => `${c.id}:${c.pass}`) || []),
      ...(contentLifecycle.checks?.map((c) => `${c.id}:${c.pass}`) || []),
    ],
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
    displayGovernance.pass &&
    contentLifecycle.pass &&
    displayChain.pass &&
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
        display_governance: displayGovernance,
        content_lifecycle: contentLifecycle,
        display_chain: displayChain,
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
    batch_id: 'B25-C5',
    title: 'L2 · Page certification — governance · community · trust/help cluster',
    layer: 'L2',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b25-c5-governance-community-trust.cjs',
    product_version: 'v1.0',
    code_anchor_commit: codeAnchor,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B06', 'B07', 'B20', 'B23', 'B25-C4'],
    route_clusters: checklist.clusters,
    cluster_routes: checklist.cluster_routes,
    gates: [...REGISTRY_GATES, ...BUSINESS_GATES],
    gate_results: gateResults,
    gate_pass: businessGatePass,
    runtime_preflight: preflight,
    governance_community_trust_live: {
      cluster_checks: clusterChecks,
      dashboard_parity: dashboardParity,
      display_parity: displayParity,
      display_governance: displayGovernance,
      content_lifecycle: contentLifecycle,
      display_chain: displayChain,
      vitest_results: vitestResults,
    },
    governance_community_static_ssot: staticSsot,
    business_certification: { verdict: businessVerdict, gate_pass: businessGatePass },
    quality_supplement: {
      verdict: qualityVerdict,
      domains: ['Q4', 'Q5', 'Q6', 'Q8'],
      checks: qualityCheckResults,
    },
    certification_four_questions: fourQuestions,
    overall_verdict: overallVerdict,
    findings,
    verdict: overallVerdict,
    pass,
    gate_verdict: businessVerdict,
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B25-C6' : 'B25-C5-remediation',
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
      'governance/community/trust 36 routes ① — RBAC · public display SSOT · content lifecycle; defer-commit',
    traceability: {
      requirements: [
        '36/36 governance_economics + community + trust_legal_help L2 certified (4 CONDITIONAL chain_off)',
        'governance proposals + matrix + community L5 green + display-data-governance SSOT PASS',
        'test accounts public_catalog allowed:false · community showcase production hard-off',
        'content lifecycle: proposals vote · community create_post · moderation cases',
        'page matrix b25_c5_apply cluster_certified',
      ],
      spec_refs: [
        'frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE1-FREEZE.md',
        'frontend/evidence/GO_local_identity_workspace/GOVERNANCE-PROPOSALS-L5-FREEZE.md',
        'registry/display-data-governance.v1.yaml',
        'registry/test-accounts-business-immutable.v1.yaml',
        'frontend/app/community/README.md',
        'FPC-100/B25-C5-governance-community-trust/FPC-100-GOVERNANCE-COMMUNITY-TRUST-CHECKLIST-BASELINE.v1.json',
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B25-C5-LATEST.json',
      certification_batch: 'B25-C5',
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
  console.log(`TT_FPC_100_BATCH_B25-C5: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`BUSINESS: ${businessVerdict} QUALITY: ${qualityVerdict} OVERALL: ${overallVerdict}`);
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
