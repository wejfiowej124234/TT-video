#!/usr/bin/env node
/**
 * Web3 Phase ①② Closure Orchestrator
 *
 * Runs ONLY local + Sepolia validation tracks. Does NOT broadcast mainnet.
 *
 *   node scripts/dev/run-web3-phase12-closure.cjs
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_readiness/web3-phase12-closure');
const RUN_DIR = path.join(EVID_ROOT, `run-${STAMP}`);

function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function run(label, cmd, args) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32' });
  return {
    label,
    ok: r.status === 0,
    status: r.status,
    stdout: (r.stdout || '').slice(-2500),
    stderr: (r.stderr || '').slice(-1000),
  };
}

function runNode(label, rel) {
  return run(label, process.execPath, [path.join(__dirname, rel)]);
}

mkdirp(RUN_DIR);

const steps = [];

steps.push(run('phase_boundary_gate', 'bash', ['scripts/gates/check-web3-phase-boundary.sh']));
const forgeR = spawnSync('forge', ['test', '--match-contract', 'EscrowV2Test'], {
  cwd: path.join(ROOT, 'contracts'),
  encoding: 'utf8',
  shell: process.platform === 'win32',
});
steps.push({
  label: 'forge_EscrowV2',
  ok: forgeR.status === 0,
  status: forgeR.status,
  stdout: (forgeR.stdout || '').slice(-1500),
  stderr: (forgeR.stderr || '').slice(-500),
});

steps.push(runNode('layer_a_evidence', 'run-escrow-bilateral-layer-a-evidence.cjs'));
steps.push(runNode('layer_b_evidence', 'run-escrow-bilateral-layer-b-evidence.cjs'));
steps.push(runNode('escrow_settlement_audit', 'run-escrow-settlement-authorization-audit.cjs'));
steps.push(runNode('protocol_grade_audit', 'run-web3-protocol-grade-audit.cjs'));
steps.push(runNode('web3_system_closure', 'run-web3-system-closure.cjs'));
steps.push(runNode('sepolia_full_lifecycle', 'run-sepolia-full-web3-lifecycle-validation.cjs'));

const esc = readJson(path.join(ROOT, 'evidence/GO_production_readiness/escrow-settlement-authorization/ESCROW-SETTLEMENT-AUTHORIZATION-AUDIT-LATEST.json'));
const pg = readJson(path.join(ROOT, 'evidence/GO_production_readiness/web3-protocol-grade-audit/WEB3-PROTOCOL-GRADE-AUDIT-LATEST.json'));
const certIdx = readJson(path.join(ROOT, 'evidence/GO_ttg_cert/CERT-EXECUTION-INDEX-LATEST.json'));
const lifecycle = readJson(path.join(ROOT, 'evidence/GO_production_readiness/sepolia-full-web3-lifecycle/SEPOLIA-FULL-WEB3-LIFECYCLE-VALIDATION-LATEST.json'));

const certSigned = certIdx?.signed_count ?? 0;
const certTotal = certIdx?.total_certs ?? 12;
const cert812Done = certSigned >= 12;

const phase12Checks = [
  {
    id: 'PHASE-BOUNDARY',
    pass: steps.find((s) => s.label === 'phase_boundary_gate')?.ok,
    detail: 'Mainnet broadcast blocked without Phase ③ auth',
  },
  {
    id: 'ESCROW-V2-FORGE',
    pass: steps.find((s) => s.label === 'forge_EscrowV2')?.ok,
    detail: 'EscrowV2 bilateral release tests',
  },
  {
    id: 'LAYER-A',
    pass: readJson(path.join(ROOT, 'evidence/GO_production_readiness/escrow-bilateral-layer-a/ESCROW-BILATERAL-LAYER-A-EVIDENCE-LATEST.json'))?.verdict === 'LAYER_A_EVIDENCE_PASS',
    detail: 'Off-chain bilateral service completion',
  },
  {
    id: 'LAYER-B',
    pass: readJson(path.join(ROOT, 'evidence/GO_production_readiness/escrow-bilateral-layer-b/ESCROW-BILATERAL-LAYER-B-EVIDENCE-LATEST.json'))?.verdict === 'LAYER_B_EVIDENCE_PASS',
    detail: 'EscrowV2/FactoryV2 design + tests',
  },
  {
    id: 'ESCROW-SETTLEMENT',
    pass: esc?.verdict === 'ESCROW_SETTLEMENT_MODEL_ALIGNED' && (esc?.summary?.gaps_p0 ?? 99) === 0,
    detail: esc?.verdict || 'unknown',
  },
  {
    id: 'PROTOCOL-GRADE-P0',
    pass: (pg?.summary?.blockers_p0 ?? pg?.p0 ?? 99) === 0,
    detail: pg?.verdict || 'unknown',
  },
  {
    id: 'CERT-8-12',
    pass: cert812Done,
    detail: `TTG Cert ${certSigned}/${certTotal}`,
  },
  {
    id: 'SEPOLIA-LIFECYCLE',
    pass: lifecycle?.verdict === 'SEPOLIA_FULL_WEB3_LIFECYCLE_PASS',
    detail: `${lifecycle?.verdict || 'unknown'} · ${lifecycle?.summary?.domains_sepolia_e2e_pass ?? '?'}/${lifecycle?.summary?.domains_total ?? 10} domains · RULE-PH2-001`,
  },
  {
    id: 'MAINNET-NOT-STARTED',
    pass: true,
    detail: 'Phase ③ deferred — no mainnet broadcast in this orchestrator',
  },
];

const passCount = phase12Checks.filter((c) => c.pass).length;
const phase12CorePass =
  phase12Checks.filter((c) => ['PHASE-BOUNDARY', 'ESCROW-V2-FORGE', 'LAYER-A', 'LAYER-B', 'ESCROW-SETTLEMENT', 'PROTOCOL-GRADE-P0', 'MAINNET-NOT-STARTED'].includes(c.id) && c.pass).length === 7;

const lifecyclePass = lifecycle?.verdict === 'SEPOLIA_FULL_WEB3_LIFECYCLE_PASS';

const verdict = phase12CorePass
  ? cert812Done && lifecyclePass
    ? 'WEB3_PHASE12_CLOSURE_PASS'
    : 'WEB3_PHASE12_CLOSURE_IN_PROGRESS'
  : 'WEB3_PHASE12_CLOSURE_BLOCKED';

const report = {
  verdict,
  stamp: STAMP,
  active_phases: [1, 2],
  phase3_mainnet: 'NOT_STARTED — requires separate Owner authorization',
  discipline: 'registry/web3-three-phase-closure-discipline.v1.yaml',
  lifecycle_ssot: 'registry/phase2-staging-sepolia-production-validation.v1.yaml',
  lifecycle_sub_track: '2D · registry/sepolia-full-web3-lifecycle-validation.v1.yaml',
  exit_rule: 'RULE-PH2-001 — Sepolia E2E evidence required per mainnet feature',
  checks: phase12Checks,
  steps,
  cert: { signed: certSigned, total: certTotal },
  sepolia_lifecycle: lifecycle?.verdict,
  escrow_settlement: esc?.verdict,
  protocol_grade: pg?.verdict,
  next_phase2_actions: [
    'node scripts/dev/run-phase2-production-validation.cjs — Phase ② master (②-A…②-F)',
    'Complete ②-A Website UAT · ②-B Admin · ②-C CMS/COS · ②-D Web3 · ②-E Security',
    'node scripts/dev/run-phase2-exit-review.cjs — ②-F',
    'node scripts/dev/run-web3-freeze.cjs',
    'node scripts/dev/generate-mainnet-deployment-package.cjs',
  ],
  phase3_prerequisites: [
    'WEB3_PHASE12_CLOSURE_PASS',
    'PHASE2_EXIT_REVIEW_PASS',
    'WEB3_FREEZE_PASS',
    'MAINNET_DEPLOYMENT_PACKAGE_GENERATED (MANIFEST/manifest.json)',
    'SEPOLIA_FULL_WEB3_LIFECYCLE_PASS (RULE-PH2-001)',
    'R-01 third-party audit',
    'Shadow Launch + G6',
    'Owner signoff + Mainnet Registry Matrix',
    'TRAVELTRUST_MAINNET_PHASE3_AUTHORIZED=1',
  ],
};

const json = JSON.stringify(report, null, 2);
fs.writeFileSync(path.join(RUN_DIR, 'WEB3-PHASE12-CLOSURE-LATEST.json'), json);
fs.writeFileSync(path.join(EVID_ROOT, 'WEB3-PHASE12-CLOSURE-LATEST.json'), json);

const md = `# Web3 Phase ①② Closure

**Verdict:** \`${verdict}\`  
**Stamp:** ${STAMP}  
**Scope:** Local + Sepolia ONLY — **no mainnet broadcast**

## Checks (${passCount}/${phase12Checks.length})

${phase12Checks.map((c) => `- [${c.pass ? 'x' : ' '}] **${c.id}** — ${c.detail}`).join('\n')}

## Phase ③ (NOT in scope)

Mainnet deploy is **deferred** until R-01 · Shadow Launch · G6 · Owner auth · Registry Matrix PASS.
`;

fs.writeFileSync(path.join(RUN_DIR, 'WEB3-PHASE12-CLOSURE-LATEST.md'), md);
fs.writeFileSync(path.join(EVID_ROOT, 'WEB3-PHASE12-CLOSURE-LATEST.md'), md);

console.log(JSON.stringify({ verdict, passCount, total: phase12Checks.length, cert: `${certSigned}/${certTotal}`, dashboard: 'node scripts/dev/run-phase-dashboard.cjs' }, null, 2));
process.exit(verdict === 'WEB3_PHASE12_CLOSURE_BLOCKED' ? 1 : 0);
