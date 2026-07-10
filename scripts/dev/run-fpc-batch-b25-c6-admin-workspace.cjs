#!/usr/bin/env node
/**
 * FPC-100 Batch B25-C6 · L2 admin workspace cluster (114 pages · ① local)
 *
 *   node scripts/dev/run-fpc-batch-b25-c6-admin-workspace.cjs
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
const OUT = path.join(EVID, 'FPC-100-BATCH-B25-C6-LATEST.json');
const EVID_DIR = path.join(EVID, 'B25-C6-admin-workspace');
const CHECKLIST_PATH = path.join(EVID_DIR, 'FPC-100-ADMIN-WORKSPACE-CHECKLIST-BASELINE.v1.json');

const checklist = JSON.parse(fs.readFileSync(CHECKLIST_PATH, 'utf8'));
const REGISTRY_GATES = checklist.registry_gates || [];
const BUSINESS_GATES = checklist.business_gates_extended || [];

const QUALITY_CHECKS = [
  {
    id: 'Q8_registry_batch',
    domain: 'Q8',
    path: 'registry/full-production-certification-checklist.v1.yaml',
    must_contain: ['id: B25-C6', 'admin_workspace'],
  },
  {
    id: 'Q7_admin_readme',
    domain: 'Q7',
    path: 'frontend/app/admin/README.md',
    must_contain: ['/admin', 'require_admin_actor', 'adminL5ConfirmL5'],
  },
  {
    id: 'Q7_admin_rbac_registry',
    domain: 'Q7',
    path: 'registry/admin-rbac-route-matrix.v1.yaml',
    must_contain: ['admin.users.read', 'admin.platform.publish'],
  },
  {
    id: 'Q6_display_governance',
    domain: 'Q6',
    path: 'registry/display-data-governance.v1.yaml',
    must_contain: ['TT_DISPLAY_DATA_GOVERNANCE: ENFORCED'],
  },
  {
    id: 'Q5_admin_checklist',
    domain: 'Q5',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/B25-C6-admin-workspace/FPC-100-ADMIN-WORKSPACE-CHECKLIST-BASELINE.v1.json',
    must_contain: ['fpc_100_admin_workspace_checklist', 'admin_rbac_ssot'],
  },
];

const {
  runClusterMatrixChecks,
  runDashboardParity,
  runDisplayStateParity,
  runAdminRbacSsot,
  runCmsOpsSsot,
  runWorkflowSsot,
  runCmsApiUnauthProbe,
  runDisplayChainSsot,
  runStaticSsotChecks,
  countAdminPageTsx,
} = require('./lib/fpc-admin-workspace-probes.cjs');
const { assertCanRun } = require('./lib/fpc-batch-sequence.cjs');
const { evaluateRuntimePreflight } = require('./lib/fpc-runtime-preflight.cjs');

function sh(cmd, cwd = ROOT, env = {}) {
  return execSync(cmd, {
    cwd,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
    timeout: env.FPC_GATE_TIMEOUT_MS ? Number(env.FPC_GATE_TIMEOUT_MS) : 1_800_000,
  });
}

function runGate(g, findings, gateResults, env = {}) {
  let exitCode = 0;
  let stdout = '';
  let stderr = '';
  try {
    const cmd = g.endsWith('.py') ? `python ${g}` : g.endsWith('.cjs') ? `node ${g}` : `bash ${g}`;
    const timeout =
      g.includes('run-admin-l5-green') || g.includes('governance-matrix') ? '1800000' : '900000';
    stdout = sh(cmd, ROOT, {
      FPC_GATE_TIMEOUT_MS: timeout,
      SEED_TEST_ACCOUNTS: '1',
      SKIP_STAGING: '1',
      SKIP_PLAYWRIGHT: '1',
      DATABASE_URL: env.DATABASE_URL || process.env.DATABASE_URL,
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
      detail: combined.slice(0, 3000),
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
      notes: '114 admin routes · RBAC matrix · L5 green · CMS API unauth · public ops SSOT',
    },
    quality_meets_standard: {
      answer: qualityVerdict === 'PASS' || qualityVerdict === 'PASS_WITH_WARN',
      verdict: qualityVerdict,
      notes: 'Audit mapping · publish/review workflows · test-account public catalog isolation',
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
        ? '114/114 admin_workspace L2 PASS · B25-C cluster complete · B21-B25-C5 frozen'
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

  const gate = assertCanRun('B25-C6');
  if (!gate.ok) {
    findings.push({
      id: 'no_batch_skip',
      severity: 'P0',
      detail: `Cannot run B25-C6 before ${gate.missing_prerequisites?.join(', ')}`,
    });
  }

  const expectedPages = checklist.cluster_page_count || 114;
  const pageTsxCount = countAdminPageTsx();
  if (pageTsxCount !== expectedPages) {
    findings.push({
      id: 'admin_route_files_drift',
      severity: 'P1',
      detail: `page.tsx count=${pageTsxCount} expected=${expectedPages}`,
    });
  }

  const gateEnv = {
    DATABASE_URL: preflight.database_url || process.env.DATABASE_URL,
    API_BASE: preflight.api_base || 'http://127.0.0.1:8080',
    API_BASE_URL: preflight.api_base || 'http://127.0.0.1:8080',
    BASE: preflight.api_base || 'http://127.0.0.1:8080',
  };

  for (const g of REGISTRY_GATES) {
    if (!preflight.pass && (g.includes('rbac-matrix') || g.includes('audit-mapping'))) {
      gateResults.push({ gate: g, exit_code: 1, pass: false, summary_line: 'skipped: preflight failed' });
      findings.push({ id: `gate_skip:${path.basename(g)}`, severity: 'P0', detail: 'API/DB required' });
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

  let cmsApiProbe = { pass: false, checks: [] };
  if (preflight.pass) {
    cmsApiProbe = await runCmsApiUnauthProbe(checklist, findings, gateEnv.API_BASE);
  } else {
    findings.push({ id: 'cms_api_probe_skip', severity: 'P0', detail: 'API preflight failed' });
  }

  const clusterChecks = runClusterMatrixChecks(checklist, findings);
  const dashboardParity = runDashboardParity(checklist, findings);
  const displayParity = runDisplayStateParity(checklist, findings);
  const adminRbac = runAdminRbacSsot(checklist, findings);
  const cmsOps = runCmsOpsSsot(checklist, findings);
  const workflow = runWorkflowSsot(checklist, findings);
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
    id: 'Q7_admin_rbac_cms',
    domain: 'Q7',
    pass: adminRbac.pass && cmsOps.pass && workflow.pass && cmsApiProbe.pass,
    path: 'registry/admin-rbac-route-matrix.v1.yaml',
    notes: [
      ...(adminRbac.checks?.map((c) => `${c.id}:${c.pass}`) || []),
      ...(cmsOps.checks?.map((c) => `${c.id}:${c.pass}`) || []),
      ...(workflow.checks?.map((c) => `${c.id}:${c.pass}`) || []),
      `cms_api_unauth:${cmsApiProbe.pass}`,
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
    adminRbac.pass &&
    cmsOps.pass &&
    workflow.pass &&
    displayChain.pass &&
    cmsApiProbe.pass &&
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
        page_tsx_count: pageTsxCount,
        gate_results: gateResults,
        vitest_results: vitestResults,
        cms_api_probe: cmsApiProbe,
        cluster_checks: clusterChecks,
        dashboard_parity: dashboardParity,
        display_parity: displayParity,
        admin_rbac: adminRbac,
        cms_ops: cmsOps,
        workflow,
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
    batch_id: 'B25-C6',
    title: 'L2 · Page certification — admin workspace (114 pages)',
    layer: 'L2',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b25-c6-admin-workspace.cjs',
    product_version: 'v1.0',
    code_anchor_commit: codeAnchor,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B09', 'B20', 'B23', 'B25-C5'],
    route_clusters: checklist.clusters,
    cluster_page_count: expectedPages,
    cluster_routes: clusterChecks.routes,
    gates: [...REGISTRY_GATES, ...BUSINESS_GATES],
    gate_results: gateResults,
    gate_pass: businessGatePass,
    runtime_preflight: preflight,
    admin_workspace_live: {
      page_tsx_count: pageTsxCount,
      cluster_checks: clusterChecks,
      dashboard_parity: dashboardParity,
      display_parity: displayParity,
      admin_rbac: adminRbac,
      cms_ops: cmsOps,
      workflow,
      cms_api_probe: cmsApiProbe,
      display_chain: displayChain,
      vitest_results: vitestResults,
    },
    admin_static_ssot: staticSsot,
    business_certification: { verdict: businessVerdict, gate_pass: businessGatePass },
    quality_supplement: {
      verdict: qualityVerdict,
      domains: ['Q4', 'Q5', 'Q6', 'Q7', 'Q8'],
      checks: qualityCheckResults,
    },
    certification_four_questions: fourQuestions,
    overall_verdict: overallVerdict,
    findings,
    verdict: overallVerdict,
    pass,
    gate_verdict: businessVerdict,
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B26' : 'B25-C6-remediation',
    ai_review: {
      verdict: pass ? 'PASS' : 'FAIL',
      ai_reviewer: 'Internal AI Review',
      review_type: 'Internal AI Review',
      review_date: stamp.slice(0, 10),
      review_version: 'v1',
    },
    human_verified: false,
    human_verifier: null,
    human_note: 'admin_workspace 114 routes ① — RBAC · CMS/Official ops · audit · defer-commit',
    traceability: {
      requirements: [
        '114/114 admin_workspace L2 certified (finance/indexer CONDITIONAL @ ①)',
        'smoke-admin-rbac-matrix + audit mapping + run-admin-l5-green PASS',
        'CMS/Official/Growth admin API unauth 401/403 · public-operations SSOT PASS',
        'ROUTE_DENY_MATRIX · admin audit logs · test-account public_catalog isolation',
        'page matrix b25_c6_apply cluster_certified',
      ],
      spec_refs: [
        'frontend/app/admin/README.md',
        'registry/admin-rbac-route-matrix.v1.yaml',
        'registry/admin-rbac-permissions.v1.yaml',
        'crates/api/src/routes/admin/admin_rbac.rs',
        'frontend/evidence/GO_local_admin_workspace_closure/README.md',
        'FPC-100/B25-C6-admin-workspace/FPC-100-ADMIN-WORKSPACE-CHECKLIST-BASELINE.v1.json',
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B25-C6-LATEST.json',
      certification_batch: 'B25-C6',
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
  console.log(`TT_FPC_100_BATCH_B25-C6: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`BUSINESS: ${businessVerdict} QUALITY: ${qualityVerdict} OVERALL: ${overallVerdict}`);
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
