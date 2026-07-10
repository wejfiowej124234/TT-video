#!/usr/bin/env node
/**
 * FPC-100 Batch B19 · Observability · health · metrics · logging (① local)
 *
 *   node scripts/dev/run-fpc-batch-b19-observability.cjs
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
const OUT = path.join(EVID, 'FPC-100-BATCH-B19-LATEST.json');
const EVID_DIR = path.join(EVID, 'B19-observability');
const CODE_ANCHOR = 'e9df0a73f63b5ebccc7c17266f000c3bf867d872';
const CHECKLIST_PATH = path.join(
  EVID_DIR,
  'FPC-100-OBSERVABILITY-CHECKLIST-BASELINE.v1.json'
);
const API_BASE = (process.env.API_BASE || 'http://127.0.0.1:8080').replace(/\/$/, '');

const REGISTRY_GATES = ['scripts/gates/check-api-build-health-gate.sh'];

const BUSINESS_GATES = ['scripts/gates/smoke-api-public-routes.sh'];

const QUALITY_CHECKS = [
  {
    id: 'Q10_quality_matrix',
    domain: 'Q10',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-QUALITY-DOMAIN-MATRIX-LATEST.json',
    must_contain: ['"id": "Q10"', 'B19', 'observability'],
  },
  {
    id: 'Q10_registry_batch',
    domain: 'Q10',
    path: 'registry/full-production-certification-checklist.v1.yaml',
    must_contain: ['id: B19', 'check-api-build-health-gate.sh'],
  },
  {
    id: 'Q10_observability_checklist',
    domain: 'Q10',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/B19-observability/FPC-100-OBSERVABILITY-CHECKLIST-BASELINE.v1.json',
    must_contain: ['fpc_100_observability_checklist', 'health_readiness'],
  },
  {
    id: 'Q10_admin_observability_contract',
    domain: 'Q10',
    path: 'frontend/app/admin/observability/adminObservabilityPage.contract.test.ts',
    must_contain: ['AdminObservabilityPage', 'adminFetchJson'],
  },
  {
    id: 'Q10_smoke_public_routes_ref',
    domain: 'Q10',
    path: 'scripts/gates/smoke-api-public-routes.sh',
    must_contain: ['/metrics', '/meta'],
  },
];

const { runLiveProbes, runStaticSsotChecks } = require('./lib/fpc-observability-probes.cjs');
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
    stdout = sh(`bash ${g}`, ROOT, {
      API_BASE,
      API_BASE_URL: API_BASE,
      BASE: API_BASE,
      PORT: '8080',
      FPC_GATE_TIMEOUT_MS: g.includes('check-api-build') ? '600000' : '300000',
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
      severity: g.includes('smoke-api') ? 'P0' : 'P0',
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

function runAdminObservabilityVitest(findings) {
  let exitCode = 0;
  let stdout = '';
  try {
    stdout = sh(
      'npx vitest run app/admin/observability/adminObservabilityPage.contract.test.ts --reporter=dot',
      FE,
      { FPC_GATE_TIMEOUT_MS: '120000' }
    );
  } catch (e) {
    exitCode = e.status || 1;
    stdout = (e.stdout || '') + (e.stderr || '');
    findings.push({
      id: 'vitest_admin_observability',
      severity: 'P1',
      detail: stdout.slice(0, 1500),
    });
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
      notes: 'API build health + smoke-api-public-routes + live health/meta/metrics probes',
    },
    quality_meets_standard: {
      answer: qualityVerdict === 'PASS' || qualityVerdict === 'PASS_WITH_WARN',
      verdict: qualityVerdict,
      notes: 'Q10 observability SSOT · trace/metrics/handlers · admin observability contract',
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
        ? 'All P0/P1 remediated · gates green · live observability probes PASS'
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

  const gate = assertCanRun('B19');
  if (!gate.ok) {
    findings.push({
      id: 'no_batch_skip',
      severity: 'P0',
      detail: `Cannot run B19 before ${gate.missing_prerequisites?.join(', ')}`,
    });
  }

  for (const g of REGISTRY_GATES) {
    runGate(g, findings, gateResults);
  }
  for (const g of BUSINESS_GATES) {
    runGate(g, findings, gateResults);
  }

  let liveEvidence = { pass: false, skipped: true, reason: 'preflight blocked' };
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
  const vitestObs = runAdminObservabilityVitest(findings);
  const qualityCheckResults = runQualityChecks(findings);
  qualityCheckResults.push({
    id: 'Q10_live_observability_probes',
    domain: 'Q10',
    pass: liveEvidence.pass === true,
    path: 'scripts/dev/lib/fpc-observability-probes.cjs',
    notes: liveEvidence.probes?.map((p) => `${p.id}:${p.pass}`) || [],
  });
  qualityCheckResults.push({
    id: 'Q10_static_ssot',
    domain: 'Q10',
    pass: staticSsot.every((s) => s.pass),
    path: 'crates/api observability SSOT',
    notes: staticSsot.map((s) => `${s.id}:${s.pass}`),
  });
  qualityCheckResults.push({
    id: 'Q10_admin_observability_vitest',
    domain: 'Q10',
    pass: vitestObs.pass,
    path: 'adminObservabilityPage.contract.test.ts',
    notes: [vitestObs.summary],
  });

  const head = sh('git rev-parse HEAD').trim();
  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');
  const businessGatePass =
    gateResults.every((g) => g.pass) && gate.ok && preflight.pass && liveEvidence.pass !== false;
  const qualityPass =
    qualityCheckResults.every((q) => q.pass) &&
    staticSsot.every((s) => s.pass) &&
    vitestObs.pass &&
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
        live_observability_evidence: liveEvidence,
        static_ssot: staticSsot,
        vitest_admin_observability: vitestObs,
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
    batch_id: 'B19',
    title: 'Observability · health · metrics · logging · trace',
    layer: 'L4',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b19-observability.cjs',
    product_version: 'v1.0',
    code_anchor_commit: CODE_ANCHOR,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B00', 'B18'],
    gates: [...REGISTRY_GATES, ...BUSINESS_GATES],
    gate_results: gateResults,
    gate_pass: businessGatePass,
    runtime_preflight: preflight,
    observability_live_evidence: liveEvidence,
    observability_static_ssot: staticSsot,
    business_certification: { verdict: businessVerdict, gate_pass: businessGatePass },
    quality_supplement: {
      verdict: qualityVerdict,
      domains: ['Q10'],
      checks: qualityCheckResults,
    },
    certification_four_questions: fourQuestions,
    overall_verdict: overallVerdict,
    findings,
    verdict: overallVerdict,
    pass,
    gate_verdict: businessVerdict,
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B20' : 'B19-remediation',
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
      'Observability ① — /health /health/ready /meta /metrics live probes + trace headers + PII-safe errors; not ②③ GO',
    traceability: {
      requirements: [
        'check-api-build-health-gate.sh PASS',
        'smoke-api-public-routes.sh PASS',
        'Live /health/ready database probe + Prometheus metrics + x-request-id echo',
      ],
      spec_refs: [
        'registry/full-production-certification-checklist.v1.yaml',
        'crates/api/src/routes/health_meta/handlers.rs',
        'crates/api/src/middleware/trace.rs',
        'FPC-100/B19-observability/FPC-100-OBSERVABILITY-CHECKLIST-BASELINE.v1.json',
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B19-LATEST.json',
      certification_batch: 'B19',
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
  console.log(`TT_FPC_100_BATCH_B19: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`BUSINESS: ${businessVerdict} QUALITY: ${qualityVerdict} OVERALL: ${overallVerdict}`);
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
