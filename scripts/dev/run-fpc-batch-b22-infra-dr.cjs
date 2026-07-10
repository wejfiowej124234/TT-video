#!/usr/bin/env node
/**
 * FPC-100 Batch B22 · DR / infra / fly deploy SSOT (① local)
 *
 *   node scripts/dev/run-fpc-batch-b22-infra-dr.cjs
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
const OUT = path.join(EVID, 'FPC-100-BATCH-B22-LATEST.json');
const EVID_DIR = path.join(EVID, 'B22-infra-dr');
const CHECKLIST_PATH = path.join(EVID_DIR, 'FPC-100-INFRA-CHECKLIST-BASELINE.v1.json');
const API_BASE = (process.env.API_BASE || 'http://127.0.0.1:8080').replace(/\/$/, '');

const checklist = JSON.parse(fs.readFileSync(CHECKLIST_PATH, 'utf8'));
const REGISTRY_GATES = checklist.registry_gates || [];
const BUSINESS_GATES = checklist.business_gates_extended || [];

const QUALITY_CHECKS = [
  {
    id: 'Q10_quality_matrix',
    domain: 'Q10',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-QUALITY-DOMAIN-MATRIX-LATEST.json',
    must_contain: ['"id": "Q10"', 'observability'],
  },
  {
    id: 'Q10_registry_batch',
    domain: 'Q10',
    path: 'registry/full-production-certification-checklist.v1.yaml',
    must_contain: ['id: B22', 'check-phase3-production-infrastructure-ssot.sh'],
  },
  {
    id: 'Q10_infra_checklist',
    domain: 'Q10',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/B22-infra-dr/FPC-100-INFRA-CHECKLIST-BASELINE.v1.json',
    must_contain: ['fpc_100_infra_checklist', 'executive_dashboard_gate_consistency'],
  },
  {
    id: 'Q10_phase3_registry',
    domain: 'Q10',
    path: 'registry/phase3-production-infrastructure.v1.yaml',
    must_contain: ['PI3-001', 'interim_prod_hosts'],
  },
  {
    id: 'Q14_quality_matrix',
    domain: 'Q14',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-QUALITY-DOMAIN-MATRIX-LATEST.json',
    must_contain: ['"id": "Q14"', 'reliability_recovery'],
  },
  {
    id: 'Q14_fly_staging_toml',
    domain: 'Q14',
    path: 'deploy/fly/tt-api-staging/fly.toml',
    must_contain: ['REQUEST_TIMEOUT_SECS', '120'],
  },
  {
    id: 'Q14_audit_script',
    domain: 'Q14',
    path: 'scripts/dev/audit-executive-dashboard-gate-consistency.cjs',
    must_contain: ['NOT_STARTED', 'forbid_interim_as_closed'],
  },
];

const { runLiveProbes, runStaticSsotChecks, loadChecklist } = require('./lib/fpc-infra-probes.cjs');
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
    PORT: '8080',
  };
}

function runGate(g, findings, gateResults, env = {}) {
  let exitCode = 0;
  let stdout = '';
  let stderr = '';
  const merged = { ...gateEnvExtra(), ...env };
  const cmd = g.endsWith('.py')
    ? `python ${g}`
    : g.endsWith('.cjs')
      ? `node ${g}`
      : `bash ${g}`;
  try {
    stdout = sh(cmd, ROOT, {
      FPC_GATE_TIMEOUT_MS: g.includes('pi3-001') ? '600000' : '300000',
      ...merged,
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
      notes: 'Phase3 infra SSOT + Fly backup + PI3-001 + executive dashboard gate audit',
    },
    quality_meets_standard: {
      answer: qualityVerdict === 'PASS' || qualityVerdict === 'PASS_WITH_WARN',
      verdict: qualityVerdict,
      notes: 'Q10 infra observability SSOT + Q14 recovery (REQUEST_TIMEOUT parity · registry host drift)',
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
        ? 'Registry ↔ fly.toml ↔ baseline ↔ meta local profile consistency PASS at ①'
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

  const gate = assertCanRun('B22');
  if (!gate.ok) {
    findings.push({
      id: 'no_batch_skip',
      severity: 'P0',
      detail: `Cannot run B22 before ${gate.missing_prerequisites?.join(', ')}`,
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
  const vitestPhase2 = runVitest(
    'lib/phase2/phase2StagingUiRealUserSprint.contract.test.ts',
    FE,
    findings,
    'vitest_phase2_staging_api'
  );
  const qualityCheckResults = runQualityChecks(findings);
  qualityCheckResults.push({
    id: 'Q10_live_infra_probes',
    domain: 'Q10',
    pass: liveEvidence.pass === true,
    path: 'scripts/dev/lib/fpc-infra-probes.cjs',
    notes: liveEvidence.probes?.map((p) => `${p.id}:${p.pass}`) || [],
  });
  qualityCheckResults.push({
    id: 'Q14_static_infra_ssot',
    domain: 'Q14',
    pass: staticSsot.every((s) => s.pass),
    path: 'fly.toml + registry host + b475 baseline',
    notes: staticSsot.map((s) => `${s.id}:${s.pass}`),
  });
  qualityCheckResults.push({
    id: 'Q14_vitest_phase2_staging',
    domain: 'Q14',
    pass: vitestPhase2.pass,
    path: 'frontend/lib/phase2/phase2StagingUiRealUserSprint.contract.test.ts',
    notes: [vitestPhase2.summary],
  });

  const head = sh('git rev-parse HEAD').trim();
  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');
  const businessGatePass =
    gateResults.every((g) => g.pass) && gate.ok && preflight.pass && liveEvidence.pass !== false;
  const qualityPass =
    qualityCheckResults.every((q) => q.pass) &&
    staticSsot.every((s) => s.pass) &&
    vitestPhase2.pass &&
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
        infra_live_evidence: liveEvidence,
        static_ssot: staticSsot,
        vitest: { phase2Staging: vitestPhase2 },
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
    batch_id: 'B22',
    title: 'DR · backup · infra · fly deploy SSOT',
    layer: 'L3',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b22-infra-dr.cjs',
    product_version: 'v1.0',
    code_anchor_commit: codeAnchor,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B21'],
    gates: [...REGISTRY_GATES, ...BUSINESS_GATES],
    gate_results: gateResults,
    gate_pass: businessGatePass,
    runtime_preflight: preflight,
    infra_live_evidence: liveEvidence,
    infra_static_ssot: staticSsot,
    business_certification: { verdict: businessVerdict, gate_pass: businessGatePass },
    quality_supplement: {
      verdict: qualityVerdict,
      domains: ['Q10', 'Q14'],
      checks: qualityCheckResults,
    },
    certification_four_questions: fourQuestions,
    overall_verdict: overallVerdict,
    findings,
    verdict: overallVerdict,
    pass,
    gate_verdict: businessVerdict,
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B23' : 'B22-remediation',
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
      'Infra/DR ① — phase3 registry + fly.toml + PI3-001 + executive dashboard audit; B21 payment chain untouched; not ② deploy GO',
    traceability: {
      requirements: [
        'check-phase3-production-infrastructure-ssot.sh PASS',
        'check-fly-pg-backup-status.sh PASS or skip when fly unauth',
        'PI3-001 execution gate PASS',
        'executive dashboard gate audit PASS (rollup open=3 incl G3-02 NOT_STARTED)',
        'registry staging API host single SSOT https://tt-api-staging.fly.dev',
        'tt-api-prod + tt-api-staging REQUEST_TIMEOUT_SECS=120 parity',
      ],
      spec_refs: [
        'registry/phase3-production-infrastructure.v1.yaml',
        'registry/executive-dashboard.v1.yaml',
        'deploy/fly/tt-api-staging/fly.toml',
        'deploy/fly/tt-api-prod/fly.toml',
        'FPC-100/B22-infra-dr/FPC-100-INFRA-CHECKLIST-BASELINE.v1.json',
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B22-LATEST.json',
      certification_batch: 'B22',
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
  console.log(`TT_FPC_100_BATCH_B22: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`BUSINESS: ${businessVerdict} QUALITY: ${qualityVerdict} OVERALL: ${overallVerdict}`);
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
