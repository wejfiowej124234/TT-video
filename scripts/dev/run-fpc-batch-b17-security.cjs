#!/usr/bin/env node
/**
 * FPC-100 Batch B17 · Security · secrets · RBAC · CSP (① local)
 *
 * Four questions (Owner review) — B14/B15/B16 template:
 *   1. Business correct?
 *   2. Quality meets standard?
 *   3. Findings identified?
 *   4. Re-certification passed?
 *
 *   node scripts/dev/run-fpc-batch-b17-security.cjs
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
const OUT = path.join(EVID, 'FPC-100-BATCH-B17-LATEST.json');
const EVID_DIR = path.join(EVID, 'B17-security');
const CODE_ANCHOR = 'e9df0a73f63b5ebccc7c17266f000c3bf867d872';
const CHECKLIST_PATH = path.join(EVID_DIR, 'FPC-100-SECURITY-CHECKLIST-BASELINE.v1.json');
const API_BASE = (process.env.API_BASE || 'http://127.0.0.1:8080').replace(/\/$/, '');

const REGISTRY_GATES = [
  'scripts/gates/check-invariants.sh',
  'scripts/gates/audit-deps.sh',
  'scripts/gates/check-auth-email-resend-gate.sh',
];

const BUSINESS_GATES = [
  'scripts/dev/scan-repository-cfg-drift.sh',
  'scripts/dev/l5-enterprise-rbac-security-audit.sh',
  'scripts/dev/verify-production-stripe-webhook-signature-static.sh',
  'scripts/dev/verify-production-cookie-csp-headers.sh',
  'scripts/gates/me-routes-local-gate.sh',
  'scripts/dev/smoke-admin-rbac-matrix-local.sh',
];

const QUALITY_CHECKS = [
  {
    id: 'Q11_quality_matrix',
    domain: 'Q11',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100-QUALITY-DOMAIN-MATRIX-v1.md',
    must_contain: ['Q11', 'Security', 'B17'],
  },
  {
    id: 'Q11_registry_batch',
    domain: 'Q11',
    path: 'registry/full-production-certification-checklist.v1.yaml',
    must_contain: ['id: B17', 'check-invariants.sh'],
  },
  {
    id: 'Q11_alignment_policy',
    domain: 'Q11',
    path: 'docs/runbook/TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md',
    must_contain: ['OPEN_BLOCKING_RISKS'],
  },
  {
    id: 'Q11_security_checklist',
    domain: 'Q11',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/B17-security/FPC-100-SECURITY-CHECKLIST-BASELINE.v1.json',
    must_contain: ['fpc_100_security_checklist', 'authentication'],
  },
  {
    id: 'Q11_me_security_contract',
    domain: 'Q11',
    path: 'frontend/lib/apiClient/meSecurity/meSecurity.test.ts',
    must_contain: ['meSecurity'],
  },
  {
    id: 'Q11_auth_flow_contract',
    domain: 'Q11',
    path: 'frontend/lib/auth/authFlowL5.contract.test.ts',
    must_contain: ['AUTH_FLOW_PAGES'],
  },
];

const {
  runLiveProbes,
  runStaticSsotChecks,
  classifyAuditDepsOutput,
} = require('./lib/fpc-security-probes.cjs');
const { assertCanRun } = require('./lib/fpc-batch-sequence.cjs');
const { evaluateRuntimePreflight } = require('./lib/fpc-runtime-preflight.cjs');

function sh(cmd, cwd = ROOT, env = {}) {
  return execSync(cmd, {
    cwd,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
    timeout: env.FPC_GATE_TIMEOUT_MS ? Number(env.FPC_GATE_TIMEOUT_MS) : 600_000,
  });
}

function runGate(g, findings, gateResults, env = {}) {
  let exitCode = 0;
  let stdout = '';
  let stderr = '';
  try {
    stdout = sh(`bash ${g}`, ROOT, {
      API_BASE,
      BASE: API_BASE,
      SEED_TEST_ACCOUNTS: '1',
      FPC_GATE_TIMEOUT_MS: g.includes('audit-deps') ? '360000' : '600000',
      ...env,
    });
  } catch (e) {
    exitCode = e.status || 1;
    stdout = e.stdout || '';
    stderr = e.stderr || '';
  }
  const combined = stdout + stderr;
  let pass = exitCode === 0;
  if (g.includes('audit-deps.sh') && exitCode !== 0) {
    const audit = classifyAuditDepsOutput(combined);
    if (audit.severity === 'P2') {
      pass = true;
      findings.push({
        id: 'gate_fail:audit-deps',
        severity: 'P2',
        gate: g,
        detail: audit.note || combined.slice(0, 2000),
      });
    } else {
      findings.push({
        id: 'gate_fail:audit-deps',
        severity: audit.severity || 'P1',
        gate: g,
        detail: audit.note || combined.slice(0, 2000),
      });
      pass = false;
    }
  } else if (exitCode !== 0) {
    findings.push({
      id: `gate_fail:${path.basename(g)}`,
      severity: 'P0',
      gate: g,
      detail: combined.slice(0, 2500),
    });
    pass = false;
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
      notes: 'Registry + extended security gates · internal 403 · secrets scan · RBAC · webhook · CSP',
    },
    quality_meets_standard: {
      answer: qualityVerdict === 'PASS' || qualityVerdict === 'PASS_WITH_WARN',
      verdict: qualityVerdict,
      notes: 'Q11 security SSOT · live probes · static auth/session/RBAC/upload/webhook anchors',
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
        ? 'All P0/P1 remediated · gates green · live probes PASS'
        : 'Pending fix + re-run batch runner',
    },
  };
}

(async () => {
  const stamp = new Date().toISOString();
  const findings = [];
  const gateResults = [];

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

  const gate = assertCanRun('B17');
  if (!gate.ok) {
    findings.push({
      id: 'no_batch_skip',
      severity: 'P0',
      detail: `Cannot run B17 before ${gate.missing_prerequisites?.join(', ')}`,
    });
  }

  for (const g of REGISTRY_GATES) {
    runGate(g, findings, gateResults);
  }
  for (const g of BUSINESS_GATES) {
    runGate(g, findings, gateResults);
  }

  let liveEvidence = { pass: false, skipped: true, reason: 'probe error' };
  if (preflight.pass) {
    try {
      liveEvidence = await runLiveProbes(API_BASE, CHECKLIST_PATH, findings);
      liveEvidence.skipped = false;
    } catch (e) {
      findings.push({
        id: 'live_probes_error',
        severity: 'P0',
        detail: String(e.message || e),
      });
      liveEvidence = { pass: false, skipped: false, error: String(e.message || e) };
    }
  }

  const staticSsot = runStaticSsotChecks(ROOT, findings);
  const qualityCheckResults = runQualityChecks(findings);
  qualityCheckResults.push({
    id: 'Q11_live_security_probes',
    domain: 'Q11',
    pass: liveEvidence.pass === true,
    path: 'scripts/dev/lib/fpc-security-probes.cjs',
    notes: liveEvidence.probes?.map((p) => `${p.id}:${p.pass}`) || [],
  });
  qualityCheckResults.push({
    id: 'Q11_static_ssot',
    domain: 'Q11',
    pass: staticSsot.every((s) => s.pass),
    path: 'crates/api + frontend security SSOT',
    notes: staticSsot.filter((s) => !s.pass).map((s) => s.id),
  });

  const head = sh('git rev-parse HEAD').trim();
  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');
  const businessGatePass =
    gateResults.every((g) => g.pass) && gate.ok && preflight.pass && liveEvidence.pass !== false;
  const qualityPass =
    qualityCheckResults.every((q) => q.pass) &&
    staticSsot.every((s) => s.pass) &&
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
        live_evidence: liveEvidence,
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
    batch_id: 'B17',
    title: 'Security · secrets · internal routes · CSP',
    layer: 'L4',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b17-security.cjs',
    product_version: 'v1.0',
    code_anchor_commit: CODE_ANCHOR,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B00', 'B09', 'B16'],
    gates: [...REGISTRY_GATES, ...BUSINESS_GATES],
    gate_results: gateResults,
    gate_pass: businessGatePass,
    runtime_preflight: preflight,
    security_live_evidence: liveEvidence,
    security_static_ssot: staticSsot,
    business_certification: { verdict: businessVerdict, gate_pass: businessGatePass },
    quality_supplement: {
      verdict: qualityVerdict,
      domains: ['Q11'],
      checks: qualityCheckResults,
    },
    certification_four_questions: fourQuestions,
    overall_verdict: overallVerdict,
    findings,
    verdict: overallVerdict,
    pass,
    gate_verdict: businessVerdict,
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B18' : 'B17-remediation',
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
      'Security ① — invariants · secrets · internal 403 · RBAC · webhook sig · CSP headers · rate_limits meta; not ② staging / ③ Production GO',
    traceability: {
      requirements: [
        'Internal routes 403/401 without X-Internal-Api-Secret',
        'No secrets in tracked repo (scan-repository-cfg-drift)',
        'Admin RBAC deny enforced (smoke-admin-rbac-matrix-local)',
        'Stripe webhook signature SSOT',
        'API security headers on /health',
        'Q11 static + live security probes',
      ],
      spec_refs: [
        'registry/full-production-certification-checklist.v1.yaml',
        'FPC-100-QUALITY-DOMAIN-MATRIX-v1.md',
        'FPC-100/B17-security/FPC-100-SECURITY-CHECKLIST-BASELINE.v1.json',
        'docs/runbook/TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md',
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B17-LATEST.json',
      certification_batch: 'B17',
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
  console.log(`TT_FPC_100_BATCH_B17: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length} p2: ${findings.filter((f) => f.severity === 'P2').length}`);
  console.log(`BUSINESS: ${businessVerdict} QUALITY: ${qualityVerdict} OVERALL: ${overallVerdict}`);
  console.log('FOUR_Q:', JSON.stringify(fourQuestions, null, 0).slice(0, 480));
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
