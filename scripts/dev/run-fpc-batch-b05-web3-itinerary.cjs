#!/usr/bin/env node
/**
 * FPC-100 Batch B05 · Web3 itinerary golden path (① local)
 *
 *   node scripts/dev/run-fpc-batch-b05-web3-itinerary.cjs
 *
 * Requires: API @ 8080 · optional FE @ 3012 for seed-transaction UI URLs in evidence
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
const OUT = path.join(EVID, 'FPC-100-BATCH-B05-LATEST.json');
const EVID_DIR = path.join(EVID, 'B05-web3-itinerary');
const SEED_TX_EVID = path.join(ROOT, 'evidence/manual-transaction-review/latest.json');
const CODE_ANCHOR = 'e9df0a73f63b5ebccc7c17266f000c3bf867d872';

const GATES = [
  'scripts/dev/run-web3-itinerary-l5-green.sh',
  'scripts/dev/smoke-web3-itinerary-full-chain-local.sh',
  'scripts/dev/smoke-seed-tourist-guide-transaction-local.sh',
  'scripts/gates/check-web3-full-alignment-gate.sh',
];

const ITINERARY_LIFECYCLE = [
  'create',
  'bind',
  'reassign',
  'confirm',
  'complete',
];

function sh(cmd, env = {}) {
  return execSync(cmd, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
  });
}

async function fetchJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { _raw: text.slice(0, 500) };
  }
  return { status: res.status, json };
}

const { assertCanRun } = require('./lib/fpc-batch-sequence.cjs');

(async () => {
  const stamp = new Date().toISOString();
  const findings = [];
  const gateResults = [];

  const gate = assertCanRun('B05');
  if (!gate.ok) {
    findings.push({
      id: 'no_batch_skip',
      severity: 'P0',
      detail: `Cannot run B05 before ${gate.missing_prerequisites?.join(', ')}`,
    });
  }

  let apiMeta = null;
  try {
    const h = await fetchJson('http://127.0.0.1:8080/health');
    if (h.status !== 200) {
      findings.push({ id: 'api_health', severity: 'P0', detail: `/health HTTP ${h.status}` });
    } else {
      const m = await fetchJson('http://127.0.0.1:8080/meta');
      apiMeta = m.json;
      if (m.status !== 200) {
        findings.push({ id: 'api_meta', severity: 'P0', detail: `/meta HTTP ${m.status}` });
      }
    }
  } catch (e) {
    findings.push({ id: 'api_unreachable', severity: 'P0', detail: String(e.message || e) });
  }

  for (const g of GATES) {
    let exitCode = 0;
    let stdout = '';
    let stderr = '';
    const env = {
      API_BASE: 'http://127.0.0.1:8080',
      BASE: 'http://127.0.0.1:8080',
      PLAYWRIGHT_BASE_URL: 'http://127.0.0.1:3012',
      EVID_DIR: path.join(EVID_DIR, 'seed-transaction'),
    };
    try {
      stdout = sh(`bash ${g}`, env);
    } catch (e) {
      exitCode = e.status || 1;
      stdout = e.stdout || '';
      stderr = e.stderr || '';
      findings.push({
        id: `gate_fail:${path.basename(g)}`,
        severity: 'P0',
        gate: g,
        detail: (stderr || stdout || e.message || '').slice(0, 2000),
      });
    }
    const combined = stdout + stderr;
    let alignmentVerdict = null;
    if (g.includes('check-web3-full-alignment')) {
      const m = combined.match(/WEB3_FULL_ALIGNMENT_GATE:\s*(\w+)/);
      alignmentVerdict = m?.[1] || null;
      if (alignmentVerdict === 'FAIL') {
        findings.push({
          id: 'web3_alignment_fail',
          severity: 'P0',
          detail: combined.split('\n').slice(-8).join(' '),
        });
      } else if (alignmentVerdict === 'WARN') {
        findings.push({
          id: 'web3_alignment_warn',
          severity: 'P1',
          detail: 'WEB3_FULL_ALIGNMENT_GATE WARN — documented; no CRITICAL',
        });
      }
    }
    gateResults.push({
      gate: g,
      exit_code: exitCode,
      pass: exitCode === 0,
      alignment_verdict: alignmentVerdict,
      summary_line: combined.split('\n').filter(Boolean).slice(-6).join(' | '),
    });
  }

  let seedTx = null;
  const seedPath = path.join(EVID_DIR, 'seed-transaction/latest.json');
  if (fs.existsSync(seedPath)) {
    seedTx = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  } else if (fs.existsSync(SEED_TX_EVID)) {
    seedTx = JSON.parse(fs.readFileSync(SEED_TX_EVID, 'utf8'));
  }
  if (!seedTx) {
    findings.push({ id: 'seed_tx_evidence_missing', severity: 'P0', detail: seedPath });
  } else if (seedTx.final_status !== 'completed') {
    findings.push({
      id: 'seed_tx_not_completed',
      severity: 'P0',
      detail: `final_status=${seedTx.final_status}`,
    });
  }

  const head = sh('git rev-parse HEAD').trim();
  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');
  const allGatesPass = gateResults.every((g) => g.pass);
  const pass = p0.length === 0 && allGatesPass && gate.ok && !!seedTx;

  const businessFlow = {
    lifecycle: ITINERARY_LIFECYCLE,
    itinerary_smoke: 'smoke-web3-itinerary-full-chain-local.sh (create · bind · reassign)',
    seed_transaction: seedTx
      ? {
          order_id: seedTx.order_id,
          guide_id: seedTx.guide_id,
          final_status: seedTx.final_status,
          chain: seedTx.chain,
          phase: seedTx.phase,
        }
      : null,
    bilateral_confirm: seedTx?.final_status === 'completed',
  };

  const chainEvidence = {
    meta_snapshot: apiMeta
      ? {
          chain_id: apiMeta.chain_id ?? apiMeta.chain?.chain_id,
          escrow_factory_address: apiMeta.escrow_factory_address,
          escrow_factory_v2_address: apiMeta.escrow_factory_v2_address,
          chain_configured: apiMeta.chain_configured ?? apiMeta.chain?.configured,
          p3_chain_off: apiMeta.p3_chain_off ?? apiMeta.order_messages?.chain_off_mounted,
        }
      : null,
    alignment_gate: gateResults.find((g) => g.gate.includes('check-web3-full-alignment')) || null,
    wallet_boundary_note:
      '① mock-pay chain_off sandbox — wallet connect / wrong network / tx pending verified via L5 contracts + escrow draft freeze; ② on-chain deferred',
  };

  const apiEvidence = {
    health: 'http://127.0.0.1:8080/health',
    meta: 'http://127.0.0.1:8080/meta',
    seed_transaction_path: seedTx ? 'B05-web3-itinerary/seed-transaction/latest.json' : null,
    full_chain_smoke: 'smoke-web3-itinerary-full-chain-local.sh',
  };

  const uiEvidence = {
    l5_green: 'run-web3-itinerary-l5-green.sh',
    escrow_draft_freeze_ssot:
      'frontend/evidence/GO_local_web3_itinerary_l5/ESCROW-DRAFT-EXPERIENCE-FREEZE.md',
    vitest_contracts: [
      'homeMarketing.contract.test.ts',
      'useLandingPage.contract.test.ts',
      'escrowDraftExperienceUiFreeze.contract.test.ts',
      'escrowExperienceUi.contract.test.ts',
    ],
    manual_ui_urls: seedTx?.ui_urls || null,
  };

  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(EVID_DIR, `gate-run-${stamp.replace(/[:.]/g, '-')}.json`),
    JSON.stringify(
      {
        timestamp_utc: stamp,
        gate_results: gateResults,
        business_flow: businessFlow,
        chain_evidence: chainEvidence,
        api_evidence: apiEvidence,
        ui_evidence: uiEvidence,
        findings,
      },
      null,
      2
    ) + '\n'
  );

  const report = {
    schema: 'traveltrust.fpc_100_batch_certification.v1',
    batch_id: 'B05',
    title: 'Web3 itinerary golden path (landing → pay → orders → escrow)',
    layer: 'L1-L5',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b05-web3-itinerary.cjs',
    product_version: 'v1.0',
    code_anchor_commit: CODE_ANCHOR,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B02', 'B04'],
    routes: ['/pay', '/orders', '/escrow/[id]', '/itinerary/*'],
    gates: GATES,
    gate_results: gateResults,
    gate_pass: allGatesPass,
    business_flow: businessFlow,
    chain_evidence: chainEvidence,
    api_evidence: apiEvidence,
    ui_evidence: uiEvidence,
    findings,
    verdict: pass ? (p1.length ? 'PASS_WITH_WARN' : 'PASS') : 'FAIL',
    pass,
    gate_verdict: pass ? (p1.length ? 'PASS_WITH_WARN' : 'PASS') : 'FAIL',
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B06' : 'B05-remediation',
    ai_review: {
      verdict: pass ? (p1.length ? 'PASS_WITH_WARN' : 'PASS') : 'FAIL',
      ai_reviewer: 'Internal AI Review',
      review_type: 'Internal AI Review',
      review_date: stamp.slice(0, 10),
      review_version: 'v1',
    },
    human_verified: false,
    human_verifier: null,
    human_note:
      'Web3 golden path ① — mock-pay + L5 contracts; on-chain wallet edges + indexer live reconcile → ②',
    traceability: {
      requirements: [
        '93 §2.0 B-domain P0 five-link',
        'Escrow draft experience freeze',
        'Bilateral confirm-completion on seeded order',
      ],
      spec_refs: [
        'frontend/app/escrow/[id]/README.md',
        'frontend/evidence/GO_local_web3_itinerary_l5/ESCROW-ORDER-PAGE-PHASE1-CLOSURE.md',
        'FPC-100-PRE-RELEASE-DEEP-CHECKLIST-v1.md § B05',
      ],
      code_paths: [
        'scripts/dev/smoke-web3-itinerary-full-chain-local.sh',
        'scripts/dev/smoke-seed-tourist-guide-transaction-local.sh',
        'frontend/components/escrow/EscrowDetail/index.tsx',
      ],
      tests: GATES.map((g) => path.basename(g)),
      evidence_path: 'FPC-100/FPC-100-BATCH-B05-LATEST.json',
      certification_batch: 'B05',
      product_version: 'v1.0',
    },
  };

  if (pass) {
    const expiryDays = 90;
    report.certified_at_utc = stamp;
    report.expires_at_utc = new Date(Date.parse(stamp) + expiryDays * 86400000).toISOString();
    report.expiry_policy_days = expiryDays;
    report.certification_frozen = true;
    report.frozen_at_utc = stamp;
    report.frozen_git_sha = head;
  }

  fs.mkdirSync(EVID, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  console.log(`TT_FPC_100_BATCH_B05: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
