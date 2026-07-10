#!/usr/bin/env node
/**
 * FPC-100 Batch B25-C4 · L2 identity & onboarding cluster (① local)
 *
 *   node scripts/dev/run-fpc-batch-b25-c4-identity-onboarding.cjs
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
const OUT = path.join(EVID, 'FPC-100-BATCH-B25-C4-LATEST.json');
const EVID_DIR = path.join(EVID, 'B25-C4-identity-onboarding');
const CHECKLIST_PATH = path.join(EVID_DIR, 'FPC-100-IDENTITY-ONBOARDING-CHECKLIST-BASELINE.v1.json');

const checklist = JSON.parse(fs.readFileSync(CHECKLIST_PATH, 'utf8'));
const REGISTRY_GATES = checklist.registry_gates || [];
const BUSINESS_GATES = checklist.business_gates_extended || [];

const QUALITY_CHECKS = [
  {
    id: 'Q8_registry_batch',
    domain: 'Q8',
    path: 'registry/full-production-certification-checklist.v1.yaml',
    must_contain: ['id: B25-C4', 'identity_onboarding'],
  },
  {
    id: 'Q4_auth_login_freeze',
    domain: 'Q4',
    path: 'frontend/evidence/GO_local_auth_l5/AUTH-LOGIN-UI-FREEZE.md',
    must_contain: ['/auth/login', 'authLoginUiFreeze'],
  },
  {
    id: 'Q4_me_identities_freeze',
    domain: 'Q4',
    path: 'frontend/evidence/GO_local_auth_l5/ME-IDENTITIES-UI-FREEZE.md',
    must_contain: ['/me/identities', 'meIdentitiesUiFreeze'],
  },
  {
    id: 'Q6_test_accounts_registry',
    domain: 'Q6',
    path: 'registry/test-accounts-business-immutable.v1.yaml',
    must_contain: ['immutable_logical_ids', 'C1', 'public_catalog', 'allowed: false'],
  },
  {
    id: 'Q5_identity_checklist',
    domain: 'Q5',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/B25-C4-identity-onboarding/FPC-100-IDENTITY-ONBOARDING-CHECKLIST-BASELINE.v1.json',
    must_contain: ['fpc_100_identity_onboarding_checklist', 'identity_ssot'],
  },
];

const {
  runClusterMatrixChecks,
  runDashboardParity,
  runDisplayStateParity,
  runIdentitySsot,
  runProfileLinksParity,
  runDisplayChainSsot,
  runStaticSsotChecks,
} = require('./lib/fpc-identity-onboarding-probes.cjs');
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
      FPC_GATE_TIMEOUT_MS: g.includes('multi-identity') ? '600000' : '600000',
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
      notes: 'identity_onboarding 26 routes · auth contract + session hash + multi-identity IA smoke',
    },
    quality_meets_standard: {
      answer: qualityVerdict === 'PASS' || qualityVerdict === 'PASS_WITH_WARN',
      verdict: qualityVerdict,
      notes: 'Test-account registry SSOT · identity_slots API · profile link parity · UI freeze docs',
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
        ? '26/26 identity_onboarding L2 PASS · dashboard next=B25-C5 · B21-B25-C3 frozen'
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

  const gate = assertCanRun('B25-C4');
  if (!gate.ok) {
    findings.push({
      id: 'no_batch_skip',
      severity: 'P0',
      detail: `Cannot run B25-C4 before ${gate.missing_prerequisites?.join(', ')}`,
    });
  }

  const gateEnv = {
    DATABASE_URL: preflight.database_url || process.env.DATABASE_URL,
    API_BASE: preflight.api_base || 'http://127.0.0.1:8080',
    API_BASE_URL: preflight.api_base || 'http://127.0.0.1:8080',
  };

  for (const g of REGISTRY_GATES) {
    if (!preflight.pass && (g.includes('auth-contract') || g.includes('multi-identity'))) {
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

  const clusterChecks = runClusterMatrixChecks(checklist, findings);
  const dashboardParity = runDashboardParity(checklist, findings);
  const displayParity = runDisplayStateParity(checklist, findings);
  const identitySsot = runIdentitySsot(checklist, findings);
  const profileLinks = runProfileLinksParity(checklist, findings);
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
    id: 'Q6_identity_ssot',
    domain: 'Q6',
    pass: identitySsot.pass && profileLinks.pass,
    path: 'registry/test-accounts-business-immutable.v1.yaml',
    notes: [
      ...(identitySsot.checks?.map((c) => `${c.id}:${c.pass}`) || []),
      ...(profileLinks.checks?.map((c) => `${c.id}:${c.pass}`) || []),
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
    identitySsot.pass &&
    profileLinks.pass &&
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
        identity_ssot: identitySsot,
        profile_links: profileLinks,
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
    batch_id: 'B25-C4',
    title: 'L2 · Page certification — identity & onboarding cluster',
    layer: 'L2',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b25-c4-identity-onboarding.cjs',
    product_version: 'v1.0',
    code_anchor_commit: codeAnchor,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B03', 'B08', 'B20', 'B23', 'B25-C3'],
    route_clusters: ['identity_onboarding'],
    cluster_routes: checklist.cluster_routes,
    gates: [...REGISTRY_GATES, ...BUSINESS_GATES],
    gate_results: gateResults,
    gate_pass: businessGatePass,
    runtime_preflight: preflight,
    identity_onboarding_live: {
      cluster_checks: clusterChecks,
      dashboard_parity: dashboardParity,
      display_parity: displayParity,
      identity_ssot: identitySsot,
      profile_links: profileLinks,
      display_chain: displayChain,
      vitest_results: vitestResults,
    },
    identity_static_ssot: staticSsot,
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
    next_batch: pass ? 'B25-C5' : 'B25-C4-remediation',
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
      'identity_onboarding 26 routes ① — auth/session/identity_slots + test-account governance; defer-commit',
    traceability: {
      requirements: [
        '26/26 identity_onboarding L2 certified',
        'auth-contract + session-hash + multi-identity IA smoke PASS',
        'immutable test accounts C1–C4 E1 E2 · public_catalog allowed:false',
        'GET /api/v1/me identity_slots + profile link SSOT parity',
        'page matrix b25_c4_apply cluster_certified',
      ],
      spec_refs: [
        'frontend/evidence/GO_local_auth_l5/AUTH-LOGIN-UI-FREEZE.md',
        'frontend/evidence/GO_local_auth_l5/AUTH-REGISTER-UI-FREEZE.md',
        'frontend/evidence/GO_local_auth_l5/ME-IDENTITIES-UI-FREEZE.md',
        'registry/test-accounts-business-immutable.v1.yaml',
        'crates/api/src/chain_off/me.rs',
        'FPC-100/B25-C4-identity-onboarding/FPC-100-IDENTITY-ONBOARDING-CHECKLIST-BASELINE.v1.json',
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B25-C4-LATEST.json',
      certification_batch: 'B25-C4',
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
  console.log(`TT_FPC_100_BATCH_B25-C4: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`BUSINESS: ${businessVerdict} QUALITY: ${qualityVerdict} OVERALL: ${overallVerdict}`);
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
