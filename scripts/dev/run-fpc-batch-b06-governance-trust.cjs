#!/usr/bin/env node
/**
 * FPC-100 Batch B06 · Governance / Trust (① local)
 *
 *   node scripts/dev/run-fpc-batch-b06-governance-trust.cjs
 *
 * Requires: API @ 8080 (optional for governance HTTP contracts in matrix gate)
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
const OUT = path.join(EVID, 'FPC-100-BATCH-B06-LATEST.json');
const EVID_DIR = path.join(EVID, 'B06-governance-trust');
const CODE_ANCHOR = 'e9df0a73f63b5ebccc7c17266f000c3bf867d872';

const GATES = [
  'scripts/dev/smoke-governance-proposals-l5-local.sh',
  'scripts/gates/governance-matrix-local-gate.sh',
  'scripts/gates/check-announcement-lane-governance-gate.sh',
];

const GOVERNANCE_LIFECYCLE = ['proposal', 'vote', 'queue', 'execute', 'state_change'];

const TRUST_CONTRACTS = [
  'components/trust/trustTransparencyHub.contract.test.ts',
  'app/governance/governanceHubPage.contract.test.ts',
  'lib/publicSurfaceAudit.contract.test.ts',
];

function sh(cmd, env = {}) {
  return execSync(cmd, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
  });
}

const { assertCanRun } = require('./lib/fpc-batch-sequence.cjs');

(async () => {
  const stamp = new Date().toISOString();
  const findings = [];
  const gateResults = [];
  const supplementalResults = [];

  const gate = assertCanRun('B06');
  if (!gate.ok) {
    findings.push({
      id: 'no_batch_skip',
      severity: 'P0',
      detail: `Cannot run B06 before ${gate.missing_prerequisites?.join(', ')}`,
    });
  }

  for (const g of GATES) {
    let exitCode = 0;
    let stdout = '';
    let stderr = '';
    try {
      stdout = sh(`bash ${g}`, { API_BASE: 'http://127.0.0.1:8080', BASE: 'http://127.0.0.1:8080' });
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
    gateResults.push({
      gate: g,
      exit_code: exitCode,
      pass: exitCode === 0,
      summary_line: (stdout + stderr).split('\n').filter(Boolean).slice(-4).join(' | '),
    });
  }

  for (const rel of TRUST_CONTRACTS) {
    let exitCode = 0;
    let stdout = '';
    let stderr = '';
    try {
      stdout = sh(`cd frontend && npx vitest run ${rel}`, {});
    } catch (e) {
      exitCode = e.status || 1;
      stdout = e.stdout || '';
      stderr = e.stderr || '';
      findings.push({
        id: `trust_contract_fail:${path.basename(rel)}`,
        severity: 'P0',
        detail: (stderr || stdout || e.message || '').slice(0, 1500),
      });
    }
    supplementalResults.push({ contract: rel, exit_code: exitCode, pass: exitCode === 0 });
  }

  const head = sh('git rev-parse HEAD').trim();
  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');
  const allGatesPass = gateResults.every((g) => g.pass);
  const allSupplementalPass = supplementalResults.every((s) => s.pass);
  const pass = p0.length === 0 && allGatesPass && allSupplementalPass && gate.ok;

  const governanceFlow = {
    lifecycle: GOVERNANCE_LIFECYCLE,
    proposal_smoke: 'smoke-governance-proposals-l5-local.sh (list · create · detail · steward corridor)',
    matrix_slice: 'governance-matrix-local-gate.sh (93 C-GOV-001..011)',
    on_chain_actions: {
      vote: 'GovernanceOnChainVotePanel + getPastVotes wallet gate',
      queue: 'useGovernanceTimelockActions queue',
      execute: 'GovernanceProposalExecutionActionsPanel',
      cancel: 'useGovernanceCancelProposal',
      timelock: 'travelTrustGovernorAbi queue + timelock writes',
    },
    admin_public_separation: 'governanceHubPage.contract.test.ts PER CI-13 (ops admin opt-in only)',
    phase: '① local · on-chain vote/execute deferred to ② unless wallet connected',
  };

  const trustEvidence = {
    hub_ssot: 'frontend/components/trust/TrustTransparencyHub.tsx',
    route: '/trust',
    ci_14: 'trustTransparencyHub.contract.test.ts — no D-4555 in public pillar copy',
    public_surface: 'lib/publicSurfaceAudit.contract.test.ts — /trust registered',
    announcement_lane: 'check-announcement-lane-governance-gate.sh ANNOUNCEMENT_LANE_GOVERNANCE_FROZEN',
    public_trust_vs_internal_spec: 'Public Trust ≠ Internal Spec (locale governance params may retain draft IDs; trust hub body does not)',
  };

  const uiEvidence = {
    governance_proposals_l5: 'GOVERNANCE-PROPOSALS-L5-FREEZE.md',
    vitest_governance_l5: 43,
    vitest_matrix_c_gov: 99,
    trust_contracts: TRUST_CONTRACTS.map((c) => path.basename(c)),
    routes: [
      '/governance',
      '/governance/proposals',
      '/governance/proposals/new',
      '/governance/proposals/[id]',
      '/trust',
      '/traveltrust',
      '/traveltrust/announcements',
      '/staking',
    ],
  };

  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(EVID_DIR, `gate-run-${stamp.replace(/[:.]/g, '-')}.json`),
    JSON.stringify(
      {
        timestamp_utc: stamp,
        gate_results: gateResults,
        supplemental_results: supplementalResults,
        governance_flow: governanceFlow,
        trust_evidence: trustEvidence,
        ui_evidence: uiEvidence,
        findings,
      },
      null,
      2
    ) + '\n'
  );

  const report = {
    schema: 'traveltrust.fpc_100_batch_certification.v1',
    batch_id: 'B06',
    title: 'Governance · trust · TravelTrust network · announcements',
    layer: 'L1-L5',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b06-governance-trust.cjs',
    product_version: 'v1.0',
    code_anchor_commit: CODE_ANCHOR,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B01'],
    routes: [
      '/governance',
      '/governance/*',
      '/trust',
      '/traveltrust',
      '/traveltrust/announcements',
      '/staking',
    ],
    gates: GATES,
    gate_results: gateResults,
    gate_pass: allGatesPass,
    governance_flow: governanceFlow,
    trust_evidence: trustEvidence,
    ui_evidence: uiEvidence,
    supplemental_results: supplementalResults,
    findings,
    verdict: pass ? (p1.length ? 'PASS_WITH_WARN' : 'PASS') : 'FAIL',
    pass,
    gate_verdict: pass ? (p1.length ? 'PASS_WITH_WARN' : 'PASS') : 'FAIL',
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B07' : 'B06-remediation',
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
      'Governance lifecycle ① — contracts + matrix; live on-chain Proposal→Execute state change → ② Sepolia broadcast',
    traceability: {
      requirements: [
        'Public governance hub consumer-safe',
        'Trust page no spec IDs in pillar body (CI-14)',
        'Announcement lane governance frozen',
        'Proposal→Vote→Queue→Execute wiring in L5 contracts',
      ],
      spec_refs: [
        'frontend/evidence/GO_local_identity_workspace/GOVERNANCE-PROPOSALS-L5-FREEZE.md',
        'registry/traveltrust-announcement-lane-governance.v1.yaml',
        'FPC-100-PRE-RELEASE-DEEP-CHECKLIST-v1.md § B06',
      ],
      code_paths: [
        'frontend/app/governance/GovernanceHubPageMain.tsx',
        'frontend/components/trust/TrustTransparencyHub.tsx',
        'frontend/components/governance/GovernanceProposalExecutionActionsPanel.tsx',
      ],
      tests: [...GATES.map((g) => path.basename(g)), ...TRUST_CONTRACTS.map((c) => path.basename(c))],
      evidence_path: 'FPC-100/FPC-100-BATCH-B06-LATEST.json',
      certification_batch: 'B06',
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
  console.log(`TT_FPC_100_BATCH_B06: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
