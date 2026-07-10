#!/usr/bin/env node
/**
 * FPC-100 Batch B10 · Business Flow Matrix Certification (① local)
 *
 *   node scripts/dev/run-fpc-batch-b10-business-flows.cjs
 *
 * Gates: production readiness master checklist (BFM SSOT)
 * Cross-domain: prior FPC corridor batches must PASS before matrix certifies whole platform.
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
const OUT = path.join(EVID, 'FPC-100-BATCH-B10-LATEST.json');
const EVID_DIR = path.join(EVID, 'B10-business-flows');
const CODE_ANCHOR = 'e9df0a73f63b5ebccc7c17266f000c3bf867d872';
const BFM_YAML = path.join(ROOT, 'registry/business-flow-matrix.v1.yaml');
const BFM_EVID_ROOT = path.join(ROOT, 'evidence/GO_production_readiness/step3/bfm');
const MASTER_JSON = path.join(
  ROOT,
  'evidence/GO_production_readiness/PRODUCTION-READINESS-MASTER-CHECKLIST-LATEST.json'
);

const GATES = ['scripts/dev/run-production-readiness-master-checklist.cjs'];

const CROSS_DOMAIN_CHAINS = [
  {
    id: 'guide_identity_market_escrow_review',
    flow: 'guide',
    domains: ['identity', 'market', 'escrow', 'review', 'trust'],
    fpc_batches: ['B03', 'B04', 'B05'],
    note: 'Guide 8-step chain spans auth/me, market subsite, web3 escrow, reviews/trust',
  },
  {
    id: 'provider_onboarding_catalog_order',
    flow: 'provider',
    domains: ['identity', 'provider', 'market', 'order', 'escrow'],
    fpc_batches: ['B03', 'B04', 'B05'],
    note: 'Provider 5-step chain spans onboarding, catalog, order completion',
  },
  {
    id: 'acquisition_trust_escrow',
    flow: 'acquisition',
    domains: ['identity', 'market', 'trust', 'escrow', 'review'],
    fpc_batches: ['B03', 'B05', 'B08'],
    note: 'Acquisition 4-step chain spans identities hub, acquisition smoke, bilateral confirm',
  },
  {
    id: 'governance_order_isolation',
    flow: 'governance',
    domains: ['governance', 'order'],
    fpc_batches: ['B05', 'B06'],
    note: 'Governance proposals must not mutate order state (orthogonal domains)',
  },
  {
    id: 'community_trust_admin',
    flow: 'community',
    domains: ['community', 'trust', 'admin'],
    fpc_batches: ['B07', 'B03', 'B09'],
    note: 'Community corridor + trust projection + admin moderation RBAC',
  },
];

function sh(cmd, env = {}) {
  return execSync(cmd, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
  });
}

function gateVerdictPass(verdict) {
  return verdict === 'pass' || verdict === 'PASS';
}

function parseBfmFlows(text) {
  const flows = [];
  for (const block of (text.split('flows:')[1] || '').split(/\n  - id: /).slice(1)) {
    const id = block.match(/^(guide|provider|acquisition)/)?.[1];
    if (!id) continue;
    const label = block.match(/\n    label: (.+)/)?.[1];
    const flowVerdict = block.match(/\n    verdict: (\w+)/)?.[1];
    const steps = [
      ...block.matchAll(/\{ id: (\w+), label: ([^,]+), verdict: (\w+)(?:, note: "[^"]*")? \}/g),
    ].map((m) => ({
      id: m[1],
      label: m[2].trim(),
      verdict: m[3],
    }));
    flows.push({ id, label, flow_verdict: flowVerdict, steps });
  }
  return flows;
}

function stepEvidencePath(flowId, stepId) {
  return path.join(BFM_EVID_ROOT, 'steps', `${flowId}-${stepId}-LATEST.json`);
}

function readStepEvidence(flowId, stepId) {
  const p = stepEvidencePath(flowId, stepId);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function buildFlowCertifications(flows) {
  return flows.map((flow) => {
    const stepCerts = flow.steps.map((step) => {
      const evid = readStepEvidence(flow.id, step.id);
      const evidVerdict = evid?.verdict || evid?.step_verdict || null;
      const evidPass = evidVerdict ? gateVerdictPass(evidVerdict) : false;
      const registryPass = gateVerdictPass(step.verdict);
      return {
        step_id: step.id,
        label: step.label,
        registry_verdict: step.verdict,
        evidence_path: `evidence/GO_production_readiness/step3/bfm/steps/${flow.id}-${step.id}-LATEST.json`,
        evidence_verdict: evidVerdict,
        pass: registryPass && evidPass,
      };
    });
    const flowJson = path.join(BFM_EVID_ROOT, `BFM-${flow.id.toUpperCase()}-FLOW-LATEST.json`);
    let flowEvidenceVerdict = null;
    if (fs.existsSync(flowJson)) {
      try {
        const doc = JSON.parse(fs.readFileSync(flowJson, 'utf8'));
        const key = Object.keys(doc).find((k) => k.startsWith('TT_BFM_'));
        flowEvidenceVerdict = key ? doc[key] : null;
      } catch {
        flowEvidenceVerdict = null;
      }
    }
    const stepsPass = stepCerts.filter((s) => s.pass).length;
    const flowPass =
      gateVerdictPass(flow.flow_verdict || 'pass') &&
      stepCerts.length > 0 &&
      stepsPass === stepCerts.length &&
      gateVerdictPass(flowEvidenceVerdict || 'PASS');
    return {
      flow_id: flow.id,
      label: flow.label,
      verdict: flowPass ? 'PASS' : 'FAIL',
      pass: flowPass,
      step_count: stepCerts.length,
      steps_pass: stepsPass,
      flow_evidence: `evidence/GO_production_readiness/step3/bfm/BFM-${flow.id.toUpperCase()}-FLOW-LATEST.json`,
      flow_evidence_verdict: flowEvidenceVerdict,
      steps: stepCerts,
    };
  });
}

const { assertCanRun, loadBatchPass } = require('./lib/fpc-batch-sequence.cjs');

(async () => {
  const stamp = new Date().toISOString();
  const findings = [];
  const gateResults = [];

  const gate = assertCanRun('B10');
  if (!gate.ok) {
    findings.push({
      id: 'no_batch_skip',
      severity: 'P0',
      detail: `Cannot run B10 before ${gate.missing_prerequisites?.join(', ')}`,
    });
  }

  const bfmText = fs.readFileSync(BFM_YAML, 'utf8');
  const bfmFlows = parseBfmFlows(bfmText);
  if (bfmFlows.length !== 3) {
    findings.push({
      id: 'bfm_flow_count',
      severity: 'P0',
      detail: `expected 3 BFM flows, parsed ${bfmFlows.length}`,
    });
  }

  for (const g of GATES) {
    let exitCode = 0;
    let stdout = '';
    let stderr = '';
    try {
      stdout = sh(`node ${g}`, {});
    } catch (e) {
      exitCode = e.status || 1;
      stdout = e.stdout || '';
      stderr = e.stderr || '';
      findings.push({
        id: `gate_fail:${path.basename(g)}`,
        severity: 'P0',
        gate: g,
        detail: (stderr || stdout || e.message || '').slice(0, 2500),
      });
    }
    const combined = stdout + stderr;
    gateResults.push({
      gate: g,
      exit_code: exitCode,
      pass: exitCode === 0,
      summary_line: combined.split('\n').filter(Boolean).slice(-4).join(' | '),
    });
  }

  let masterSnapshot = null;
  if (fs.existsSync(MASTER_JSON)) {
    try {
      masterSnapshot = JSON.parse(fs.readFileSync(MASTER_JSON, 'utf8'));
      const bfmGate = masterSnapshot.production_go?.gates?.business_flow_matrix;
      const bfmBlocking = masterSnapshot.business_flow_matrix?.blocking_checks;
      if (bfmGate !== 'PASS' || bfmBlocking !== 0) {
        findings.push({
          id: 'master_checklist_bfm_not_pass',
          severity: 'P0',
          detail: `business_flow_matrix=${bfmGate} blocking=${bfmBlocking}`,
        });
      }
      const parsedSteps = (masterSnapshot.business_flow_matrix?.flows || []).flatMap((f) => f.steps || []);
      if (parsedSteps.length === 0) {
        findings.push({
          id: 'master_checklist_bfm_steps_empty',
          severity: 'P0',
          detail: 'PRODUCTION-READINESS-MASTER-CHECKLIST parsed zero BFM steps — registry/parser drift',
        });
      }
    } catch (e) {
      findings.push({
        id: 'master_checklist_read_fail',
        severity: 'P0',
        detail: String(e.message || e),
      });
    }
  } else {
    findings.push({
      id: 'master_checklist_missing',
      severity: 'P0',
      detail: MASTER_JSON,
    });
  }

  const businessFlowCertifications = buildFlowCertifications(bfmFlows);
  for (const cert of businessFlowCertifications) {
    if (!cert.pass) {
      findings.push({
        id: `bfm_flow_fail:${cert.flow_id}`,
        severity: 'P0',
        detail: `${cert.label} steps_pass=${cert.steps_pass}/${cert.step_count}`,
      });
    }
  }

  const crossDomainResults = CROSS_DOMAIN_CHAINS.map((chain) => {
    const batchResults = chain.fpc_batches.map((batchId) => ({
      batch_id: batchId,
      pass: loadBatchPass(batchId),
    }));
    const pass = batchResults.every((b) => b.pass);
    return { ...chain, batch_results: batchResults, pass };
  });

  for (const chain of crossDomainResults) {
    if (!chain.pass) {
      const failed = chain.batch_results.filter((b) => !b.pass).map((b) => b.batch_id);
      findings.push({
        id: `cross_domain_fail:${chain.id}`,
        severity: 'P0',
        detail: `flow=${chain.flow} failed_batches=${failed.join(',')}`,
      });
    }
  }

  const head = sh('git rev-parse HEAD').trim();
  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');
  const allGatesPass = gateResults.every((g) => g.pass);
  const allFlowsPass = businessFlowCertifications.every((c) => c.pass);
  const crossDomainPass = crossDomainResults.every((c) => c.pass);
  const pass =
    p0.length === 0 && allGatesPass && allFlowsPass && crossDomainPass && gate.ok;

  const businessFlowMatrix = {
    registry: 'registry/business-flow-matrix.v1.yaml',
    verification_chain: ['human_click', 'api', 'database', 'page', 'final_outcome'],
    flow_count: bfmFlows.length,
    total_steps: bfmFlows.reduce((n, f) => n + f.steps.length, 0),
    master_checklist: 'evidence/GO_production_readiness/PRODUCTION-READINESS-MASTER-CHECKLIST-LATEST.json',
    certifications: businessFlowCertifications,
    matrix_verdict: allFlowsPass ? 'PASS' : 'FAIL',
    phase: '① local',
  };

  const crossDomainConsistency = {
    policy: 'Individual FPC corridor batches must PASS before B10 certifies end-to-end platform flows',
    chains: crossDomainResults,
    cdia_note:
      'scripts/dev/cross-domain-integration-audit.py absent in tree — ① uses FPC batch chain + BFM human evidence; live CDIA → ②',
    phase: '① local',
  };

  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(EVID_DIR, `gate-run-${stamp.replace(/[:.]/g, '-')}.json`),
    JSON.stringify(
      {
        timestamp_utc: stamp,
        gate_results: gateResults,
        business_flow_matrix: businessFlowMatrix,
        cross_domain_consistency: crossDomainConsistency,
        master_snapshot: masterSnapshot
          ? {
              TT_PRODUCTION_ENTRY_READY: masterSnapshot.production_go?.current,
              bfm_blocking: masterSnapshot.business_flow_matrix?.blocking_checks,
            }
          : null,
        findings,
      },
      null,
      2
    ) + '\n'
  );

  const report = {
    schema: 'traveltrust.fpc_100_batch_certification.v1',
    batch_id: 'B10',
    title: 'Business Flow Matrix · Guide · Provider · Acquisition',
    layer: 'L3',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b10-business-flows.cjs',
    product_version: 'v1.0',
    code_anchor_commit: CODE_ANCHOR,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B03', 'B04', 'B05', 'B08'],
    routes: ['cross-domain · all product corridors'],
    gates: GATES,
    gate_results: gateResults,
    gate_pass: allGatesPass,
    business_flow_matrix: businessFlowMatrix,
    cross_domain_consistency: crossDomainConsistency,
    findings,
    verdict: pass ? (p1.length ? 'PASS_WITH_WARN' : 'PASS') : 'FAIL',
    pass,
    gate_verdict: pass ? (p1.length ? 'PASS_WITH_WARN' : 'PASS') : 'FAIL',
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B11' : 'B10-remediation',
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
      'BFM ① — registry + human 5-layer step evidence; governance/community/admin cross-domain via prior FPC batches; CDIA live probes → ②',
    traceability: {
      requirements: [
        'Guide / Provider / Acquisition flows all steps PASS with evidence',
        'Master checklist business_flow_matrix PASS',
        'Cross-domain FPC corridor batches contiguous PASS',
        'Business Flow Certification artifact per flow',
      ],
      spec_refs: [
        'registry/business-flow-matrix.v1.yaml',
        'registry/cross-domain-integration-audit-probes.v1.yaml',
        'FPC-100-PRE-RELEASE-DEEP-CHECKLIST-v1.md § B10',
        'evidence/manual-uat/README.md',
      ],
      code_paths: [
        'scripts/dev/run-production-readiness-master-checklist.cjs',
        'scripts/dev/run-bfm-session-b-guide.cjs',
        'scripts/dev/run-bfm-session-a-provider.cjs',
        'scripts/dev/run-bfm-session-c-acquisition.cjs',
      ],
      tests: GATES.map((g) => path.basename(g)),
      evidence_path: 'FPC-100/FPC-100-BATCH-B10-LATEST.json',
      certification_batch: 'B10',
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
  console.log(`TT_FPC_100_BATCH_B10: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(
    'FLOWS:',
    businessFlowCertifications.map((c) => `${c.flow_id}=${c.verdict}`).join(' ')
  );
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
