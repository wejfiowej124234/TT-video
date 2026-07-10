#!/usr/bin/env node
/**
 * FPC-100 Batch B20 · Web3 deep · escrow · Sepolia alignment · vacancy (① local)
 *
 *   node scripts/dev/run-fpc-batch-b20-web3.cjs
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
const OUT = path.join(EVID, 'FPC-100-BATCH-B20-LATEST.json');
const EVID_DIR = path.join(EVID, 'B20-web3');
const CODE_ANCHOR = 'e9df0a73f63b5ebccc7c17266f000c3bf867d872';
const CHECKLIST_PATH = path.join(EVID_DIR, 'FPC-100-WEB3-CHECKLIST-BASELINE.v1.json');
const API_BASE = (process.env.API_BASE || 'http://127.0.0.1:8080').replace(/\/$/, '');

const REGISTRY_GATES = [
  'scripts/gates/check-web3-deployment-truth-gate.sh',
  'scripts/gates/check-web3-runtime-activation-gate.sh',
  'scripts/gates/check-phase2-web3-runtime-alignment-gate.sh',
  'scripts/gates/check-vacancy-deployment-readiness-gate.sh',
];

const BUSINESS_GATES = [
  'scripts/gates/check-web3-full-alignment-gate.sh',
  'scripts/dev/smoke-web3-itinerary-full-chain-local.sh',
  'scripts/dev/run-web3-itinerary-l5-green.sh',
  'scripts/dev/check-55-quick-verify.sh',
];

const QUALITY_CHECKS = [
  {
    id: 'Q15_quality_matrix',
    domain: 'Q15',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-QUALITY-DOMAIN-MATRIX-LATEST.json',
    must_contain: ['"id": "Q15"', 'B20', 'web3'],
  },
  {
    id: 'Q15_registry_batch',
    domain: 'Q15',
    path: 'registry/full-production-certification-checklist.v1.yaml',
    must_contain: ['id: B20', 'check-web3-deployment-truth-gate.sh'],
  },
  {
    id: 'Q15_web3_checklist',
    domain: 'Q15',
    path: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/B20-web3/FPC-100-WEB3-CHECKLIST-BASELINE.v1.json',
    must_contain: ['fpc_100_web3_checklist', 'chain_sync_checkpoint_parity'],
  },
  {
    id: 'Q15_protocol_registry',
    domain: 'Q15',
    path: 'registry/protocol-convergence-deployments.v1.yaml',
    must_contain: ['protocol_ssot', 'treasury_semantics'],
  },
  {
    id: 'Q15_smoke_web3_ref',
    domain: 'Q15',
    path: 'scripts/dev/smoke-web3-itinerary-full-chain-local.sh',
    must_contain: ['TT_WEB3_ITINERARY_FULL_CHAIN_SMOKE'],
  },
];

const {
  runLiveProbes,
  runStaticSsotChecks,
  resolveRpcEnv,
  loadChecklist,
} = require('./lib/fpc-web3-probes.cjs');
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
  const checklist = loadChecklist(CHECKLIST_PATH);
  const rpc = resolveRpcEnv(checklist, ROOT);
  return {
    CHAIN_RPC_URL: rpc,
    API_BASE,
    API_BASE_URL: API_BASE,
    BASE: API_BASE,
    BASE_URL: API_BASE,
    PORT: '8080',
    VACANCY_RECONCILE_LIVE: process.env.VACANCY_RECONCILE_LIVE || '1',
  };
}

function runGate(g, findings, gateResults, env = {}) {
  let exitCode = 0;
  let stdout = '';
  let stderr = '';
  const merged = { ...gateEnvExtra(), ...env };
  try {
    stdout = sh(`bash ${g}`, ROOT, {
      FPC_GATE_TIMEOUT_MS: g.includes('deployment-truth') || g.includes('full-alignment') ? '600000' : '300000',
      ...merged,
    });
  } catch (e) {
    exitCode = e.status || 1;
    stdout = e.stdout || '';
    stderr = e.stderr || '';
  }
  const combined = stdout + stderr;
  let pass = exitCode === 0;
  if (!pass && g.includes('runtime-activation')) {
    const altRpc = 'https://ethereum-sepolia-rpc.publicnode.com';
    try {
      stdout = sh(`bash ${g}`, ROOT, {
        FPC_GATE_TIMEOUT_MS: '600000',
        ...merged,
        CHAIN_RPC_URL: altRpc,
      });
      pass = true;
      gateResults.push({
        gate: g,
        exit_code: 0,
        pass: true,
        summary_line: `RPC retry publicnode | ${stdout.split('\n').filter(Boolean).slice(-2).join(' | ')}`,
      });
      return true;
    } catch (retryErr) {
      combined.concat(retryErr.stdout || '', retryErr.stderr || '');
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
      notes: 'Registry web3 gates + full alignment + golden path smoke + chain_sync live parity',
    },
    quality_meets_standard: {
      answer: qualityVerdict === 'PASS' || qualityVerdict === 'PASS_WITH_WARN',
      verdict: qualityVerdict,
      notes: 'Q15 Web3 SSOT · protocol registry · chainEnv + chainSync vitest',
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
        ? 'All P0/P1 remediated · Blockchain→Indexer→DB→API consistency PASS'
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

  const gate = assertCanRun('B20');
  if (!gate.ok) {
    findings.push({
      id: 'no_batch_skip',
      severity: 'P0',
      detail: `Cannot run B20 before ${gate.missing_prerequisites?.join(', ')}`,
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
      liveEvidence.rpc_used = resolveRpcEnv(loadChecklist(CHECKLIST_PATH), ROOT);
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
  const vitestChain = runVitest('lib/chainEnv.test.ts', FE, findings, 'vitest_chain_env');
  const vitestChainSync = runVitest(
    'components/escrow/EscrowDetail/types.chainSync.parseResponse.checkpointAndStatus.test.ts',
    FE,
    findings,
    'vitest_chain_sync_parse'
  );
  const qualityCheckResults = runQualityChecks(findings);
  qualityCheckResults.push({
    id: 'Q15_live_web3_probes',
    domain: 'Q15',
    pass: liveEvidence.pass === true,
    path: 'scripts/dev/lib/fpc-web3-probes.cjs',
    notes: liveEvidence.probes?.map((p) => `${p.id}:${p.pass}`) || [],
  });
  qualityCheckResults.push({
    id: 'Q15_static_ssot',
    domain: 'Q15',
    pass: staticSsot.every((s) => s.pass),
    path: 'registry + chain_sync + chainEnv SSOT',
    notes: staticSsot.map((s) => `${s.id}:${s.pass}`),
  });
  qualityCheckResults.push({
    id: 'Q15_vitest_chain_env',
    domain: 'Q15',
    pass: vitestChain.pass,
    path: 'frontend/lib/chainEnv.test.ts',
    notes: [vitestChain.summary],
  });
  qualityCheckResults.push({
    id: 'Q15_vitest_chain_sync',
    domain: 'Q15',
    pass: vitestChainSync.pass,
    path: 'types.chainSync.parseResponse.checkpointAndStatus.test.ts',
    notes: [vitestChainSync.summary],
  });

  const head = sh('git rev-parse HEAD').trim();
  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');
  const businessGatePass =
    gateResults.every((g) => g.pass) && gate.ok && preflight.pass && liveEvidence.pass !== false;
  const qualityPass =
    qualityCheckResults.every((q) => q.pass) &&
    staticSsot.every((s) => s.pass) &&
    vitestChain.pass &&
    vitestChainSync.pass &&
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
        web3_live_evidence: liveEvidence,
        static_ssot: staticSsot,
        vitest: { chainEnv: vitestChain, chainSync: vitestChainSync },
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
    batch_id: 'B20',
    title: 'Web3 deep · escrow · Sepolia · vacancy · chain_sync parity',
    layer: 'L3',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b20-web3.cjs',
    product_version: 'v1.0',
    code_anchor_commit: CODE_ANCHOR,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B05', 'B19'],
    gates: [...REGISTRY_GATES, ...BUSINESS_GATES],
    gate_results: gateResults,
    gate_pass: businessGatePass,
    runtime_preflight: preflight,
    web3_live_evidence: liveEvidence,
    web3_static_ssot: staticSsot,
    business_certification: { verdict: businessVerdict, gate_pass: businessGatePass },
    quality_supplement: {
      verdict: qualityVerdict,
      domains: ['Q15'],
      checks: qualityCheckResults,
    },
    certification_four_questions: fourQuestions,
    overall_verdict: overallVerdict,
    findings,
    verdict: overallVerdict,
    pass,
    gate_verdict: businessVerdict,
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B21' : 'B20-remediation',
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
      'Web3 deep ① — Sepolia registry gates + meta/metrics/chain_sync checkpoint parity + golden path; not ②③ GO',
    traceability: {
      requirements: [
        'WEB3_REGISTRY_CONVERGENCE PASS',
        'WEB3_RUNTIME_ACTIVATION_GATE PASS',
        'TT_PHASE2_WEB3_RUNTIME_READY PASS',
        'chain_sync.checkpoint matches meta.indexer.checkpoint when runtime',
        'smoke-web3-itinerary-full-chain-local.sh PASS',
      ],
      spec_refs: [
        'registry/full-production-certification-checklist.v1.yaml',
        'registry/protocol-convergence-deployments.v1.yaml',
        'docs/spec/14-合约-API-ABI-前后端对齐.md',
        'FPC-100/B20-web3/FPC-100-WEB3-CHECKLIST-BASELINE.v1.json',
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B20-LATEST.json',
      certification_batch: 'B20',
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
  console.log(`TT_FPC_100_BATCH_B20: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`BUSINESS: ${businessVerdict} QUALITY: ${qualityVerdict} OVERALL: ${overallVerdict}`);
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
