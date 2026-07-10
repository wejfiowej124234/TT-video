#!/usr/bin/env node
/**
 * FPC-100 Batch B21 · Payment / PSP / Webhook (① local)
 *
 *   node scripts/dev/run-fpc-batch-b21-payment.cjs
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
const OUT = path.join(EVID, 'FPC-100-BATCH-B21-LATEST.json');
const EVID_DIR = path.join(EVID, 'B21-stripe');
const CHECKLIST_PATH = path.join(EVID_DIR, 'FPC-100-PAYMENT-CHECKLIST-BASELINE.v1.json');
const API_BASE = (process.env.API_BASE || 'http://127.0.0.1:8080').replace(/\/$/, '');

const checklist = JSON.parse(fs.readFileSync(CHECKLIST_PATH, 'utf8'));
const REGISTRY_GATES = checklist.registry_gates || [];
const BUSINESS_GATES = checklist.business_gates_extended || [];

const QUALITY_CHECKS = [
  {
    id: 'Q12_quality_matrix',
    domain: 'Q12',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-QUALITY-DOMAIN-MATRIX-LATEST.json',
    must_contain: ['"id": "Q12"', 'business_readiness'],
  },
  {
    id: 'Q12_registry_batch',
    domain: 'Q12',
    path: 'registry/full-production-certification-checklist.v1.yaml',
    must_contain: ['id: B21', 'check-pi3-003-stripe-live-baseline-record.py'],
  },
  {
    id: 'Q12_payment_checklist',
    domain: 'Q12',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/B21-stripe/FPC-100-PAYMENT-CHECKLIST-BASELINE.v1.json',
    must_contain: ['fpc_100_payment_checklist', 'mock_pay_order_lifecycle'],
  },
  {
    id: 'Q12_pi3_baseline',
    domain: 'Q12',
    path: 'evidence/pi3_003_stripe_live_production_webhook/baseline_record.v1.json',
    must_contain: ['PLANNED', 'stripe'],
  },
  {
    id: 'Q14_quality_matrix',
    domain: 'Q14',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-QUALITY-DOMAIN-MATRIX-LATEST.json',
    must_contain: ['"id": "Q14"', 'reliability_recovery'],
  },
  {
    id: 'Q14_onboarding_webhook_script',
    domain: 'Q14',
    path: 'scripts/dev/onboarding-webhook-local.sh',
    must_contain: ['internal/onboarding/payments/webhook', 'idempotency_key'],
  },
  {
    id: 'Q14_smoke_onboarding_ref',
    domain: 'Q14',
    path: 'scripts/dev/smoke-onboarding-full-chain-local.sh',
    must_contain: ['internal webhook', 'mark_entitlement_paid'],
  },
];

const {
  runLiveProbes,
  runStaticSsotChecks,
  classifyStripeEnvAlignmentOutput,
  loadChecklist,
} = require('./lib/fpc-payment-probes.cjs');
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

function gateEnvExtra() {
  return {
    API_BASE,
    API_BASE_URL: API_BASE,
    BASE: API_BASE,
    BASE_URL: API_BASE,
    PORT: '8080',
    P3_CHAIN_OFF: process.env.P3_CHAIN_OFF || '1',
    SEED_TEST_ACCOUNTS: process.env.SEED_TEST_ACCOUNTS || '1',
  };
}

function runGate(g, findings, gateResults, env = {}) {
  let exitCode = 0;
  let stdout = '';
  let stderr = '';
  const merged = { ...gateEnvExtra(), ...env };
  const cmd = g.endsWith('.py') ? `python ${g}` : `bash ${g}`;
  try {
    stdout = sh(cmd, ROOT, {
      FPC_GATE_TIMEOUT_MS: g.includes('full-chain') ? '600000' : '300000',
      ...merged,
    });
  } catch (e) {
    exitCode = e.status || 1;
    stdout = e.stdout || '';
    stderr = e.stderr || '';
  }
  const combined = stdout + stderr;
  let pass = exitCode === 0;

  if (!pass && g.includes('check-production-stripe-env-alignment')) {
    const classified = classifyStripeEnvAlignmentOutput(combined);
    if (classified.pass) {
      pass = true;
      findings.push({
        id: 'prod_stripe_env_①_deferred',
        severity: 'P2',
        gate: g,
        detail: classified.note,
      });
    }
  }

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

function runCargoStripeTests(findings) {
  let exitCode = 0;
  let stdout = '';
  try {
    stdout = sh('cargo test -p traveltrust-api stripe_onboarding::tests -- --nocapture', ROOT, {
      FPC_GATE_TIMEOUT_MS: '300000',
    });
  } catch (e) {
    exitCode = e.status || 1;
    stdout = (e.stdout || '') + (e.stderr || '');
    findings.push({ id: 'cargo_stripe_onboarding_tests', severity: 'P1', detail: stdout.slice(0, 1500) });
  }
  return { pass: exitCode === 0, exit_code: exitCode, summary: stdout.split('\n').slice(-3).join(' ') };
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
      notes: 'PSP mock-pay + internal onboarding webhook + registry PI3-003 + golden smokes',
    },
    quality_meets_standard: {
      answer: qualityVerdict === 'PASS' || qualityVerdict === 'PASS_WITH_WARN',
      verdict: qualityVerdict,
      notes: 'Q12 business readiness + Q14 payment reliability · Stripe signature SSOT · vitest routes',
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
        ? 'PSP→Webhook→API→DB→Order lifecycle consistency PASS at ①'
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

  const gate = assertCanRun('B21');
  if (!gate.ok) {
    findings.push({
      id: 'no_batch_skip',
      severity: 'P0',
      detail: `Cannot run B21 before ${gate.missing_prerequisites?.join(', ')}`,
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
      liveEvidence = await runLiveProbes(API_BASE, CHECKLIST_PATH, ROOT, findings);
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
  const cargoStripe = runCargoStripeTests(findings);
  const vitestApi = runVitest('lib/api.test.ts', FE, findings, 'vitest_api_routes');
  const vitestMeta = runVitest('lib/apiClient/meta.test.ts', FE, findings, 'vitest_meta_mock_pay');
  const qualityCheckResults = runQualityChecks(findings);
  qualityCheckResults.push({
    id: 'Q14_live_payment_probes',
    domain: 'Q14',
    pass: liveEvidence.pass === true,
    path: 'scripts/dev/lib/fpc-payment-probes.cjs',
    notes: liveEvidence.probes?.map((p) => `${p.id}:${p.pass}`) || [],
  });
  qualityCheckResults.push({
    id: 'Q12_static_payment_ssot',
    domain: 'Q12',
    pass: staticSsot.every((s) => s.pass),
    path: 'stripe signature + webhook_apply + mock_pay SSOT',
    notes: staticSsot.map((s) => `${s.id}:${s.pass}`),
  });
  qualityCheckResults.push({
    id: 'Q12_cargo_stripe_tests',
    domain: 'Q12',
    pass: cargoStripe.pass,
    path: 'crates/api/src/stripe_onboarding/tests.rs',
    notes: [cargoStripe.summary],
  });
  qualityCheckResults.push({
    id: 'Q14_vitest_api_routes',
    domain: 'Q14',
    pass: vitestApi.pass,
    path: 'frontend/lib/api.test.ts',
    notes: [vitestApi.summary],
  });
  qualityCheckResults.push({
    id: 'Q14_vitest_meta_mock_pay',
    domain: 'Q14',
    pass: vitestMeta.pass,
    path: 'frontend/lib/apiClient/meta.test.ts',
    notes: [vitestMeta.summary],
  });

  const head = sh('git rev-parse HEAD').trim();
  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');
  const businessGatePass =
    gateResults.every((g) => g.pass) && gate.ok && preflight.pass && liveEvidence.pass !== false;
  const qualityPass =
    qualityCheckResults.every((q) => q.pass) &&
    staticSsot.every((s) => s.pass) &&
    cargoStripe.pass &&
    vitestApi.pass &&
    vitestMeta.pass &&
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
        payment_live_evidence: liveEvidence,
        static_ssot: staticSsot,
        cargo_stripe: cargoStripe,
        vitest: { api: vitestApi, meta: vitestMeta },
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
    batch_id: 'B21',
    title: 'Payment · PSP · Webhook · mock-pay · onboarding idempotency',
    layer: 'L3',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b21-payment.cjs',
    product_version: 'v1.0',
    code_anchor_commit: codeAnchor,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B20'],
    gates: [...REGISTRY_GATES, ...BUSINESS_GATES],
    gate_results: gateResults,
    gate_pass: businessGatePass,
    runtime_preflight: preflight,
    payment_live_evidence: liveEvidence,
    payment_static_ssot: staticSsot,
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
    next_batch: pass ? 'B22' : 'B21-remediation',
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
      'Payment ① — mock-pay sandbox + internal onboarding webhook + Stripe signature SSOT; PI3-003 PLANNED until ③; not ②③ PSP GO',
    traceability: {
      requirements: [
        'PI3-003 baseline_record PLANNED valid at ①',
        'order_mock_pay_enabled true when P3_CHAIN_OFF=1',
        'mock-pay POST → order status escrowed persisted',
        'internal onboarding webhook idempotency → entitlement paid',
        'smoke-seed-tourist-guide-transaction-local.sh PASS',
        'smoke-onboarding-full-chain-local.sh PASS',
      ],
      spec_refs: [
        'registry/full-production-certification-checklist.v1.yaml',
        'registry/production-usdc-go-live-master-checklist.v1.yaml',
        'docs/runbook/TT-9618-onboarding-local-testnet.md',
        'FPC-100/B21-stripe/FPC-100-PAYMENT-CHECKLIST-BASELINE.v1.json',
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B21-LATEST.json',
      certification_batch: 'B21',
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
  console.log(`TT_FPC_100_BATCH_B21: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`BUSINESS: ${businessVerdict} QUALITY: ${qualityVerdict} OVERALL: ${overallVerdict}`);
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
