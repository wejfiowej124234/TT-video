#!/usr/bin/env node
/**
 * Escrow Bilateral Settlement — Layer A implementation evidence
 *
 *   node scripts/dev/run-escrow-bilateral-layer-a-evidence.cjs
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_readiness/escrow-bilateral-layer-a');
const RUN_DIR = path.join(EVID_ROOT, `evidence-${STAMP}`);

function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readSafe(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function check(name, pass, detail) {
  return { name, pass, detail };
}

function runCmd(label, cmd, args, cwd = ROOT) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', shell: process.platform === 'win32' });
  return { label, ok: r.status === 0, status: r.status, stdout: (r.stdout || '').slice(-4000), stderr: (r.stderr || '').slice(-2000) };
}

mkdirp(RUN_DIR);

const checks = [];

// DB migration
checks.push(
  check(
    'migration_service_completion_columns',
    /service_tourist_confirmed/.test(readSafe('crates/api/migrations/20260708120000_orders_service_completion_bilateral.sql')),
    'orders.service_tourist_confirmed + service_guide_confirmed',
  ),
);

// API route + impl
const routes = readSafe('crates/api/src/routes/orders/mod.rs');
const impl = readSafe('crates/api/src/chain_off/orders_flow/accept_cancel_pay_complete.rs');
checks.push(
  check(
    'api_confirm_service_completion_route',
    routes.includes('confirm-service-completion') && routes.includes('order_confirm_service_completion'),
    'POST /api/v1/orders/:id/confirm-service-completion',
  ),
);
checks.push(
  check(
    'api_bilateral_service_completion_impl',
    impl.includes('order_confirm_service_completion_impl')
      && impl.includes('service_completion_pending')
      && impl.includes('service_completion_confirmed'),
    'Bilateral Escrowed → pending → Completed',
  ),
);

// Frontend
const elig = readSafe('frontend/components/escrow/EscrowDetail/escrowOnChainEligibility.ts');
checks.push(
  check(
    'frontend_release_gate_service_completion',
    elig.includes('canReleaseAfterServiceCompletion') && elig.includes('service_tourist_confirmed'),
    'Release gated on service completion, not rating',
  ),
);
checks.push(
  check(
    'frontend_api_client_service_completion',
    readSafe('frontend/lib/apiClient/orders/orderHttp.ts').includes('orderConfirmServiceCompletion'),
    'orderConfirmServiceCompletion client',
  ),
);

// Layer B design artifacts
checks.push(
  check(
    'layer_b_escrow_v2_contract',
    fs.existsSync(path.join(ROOT, 'contracts/src/EscrowV2.sol')),
    'EscrowV2.sol present',
  ),
);
checks.push(
  check(
    'layer_b_factory_v2_contract',
    fs.existsSync(path.join(ROOT, 'contracts/src/EscrowFactoryV2.sol')),
    'EscrowFactoryV2.sol present',
  ),
);
checks.push(
  check(
    'registry_mainnet_policy',
    /mainnet_deploy: FORBIDDEN/.test(readSafe('registry/escrow-bilateral-mainnet-policy.v1.yaml')),
    'V1 mainnet forbidden SSOT',
  ),
);

const passCount = checks.filter((c) => c.pass).length;
const verdict = passCount === checks.length ? 'LAYER_A_EVIDENCE_PASS' : 'LAYER_A_EVIDENCE_PARTIAL';

const report = {
  verdict,
  stamp: STAMP,
  decision: 'B3 EscrowV2 + FactoryV2',
  model: 'Bilateral Confirmation Settlement Model',
  checks,
  v1_mainnet: 'FORBIDDEN — testnet legacy only',
};

const json = JSON.stringify(report, null, 2);
fs.writeFileSync(path.join(RUN_DIR, 'ESCROW-BILATERAL-LAYER-A-EVIDENCE-LATEST.json'), json);
fs.writeFileSync(path.join(EVID_ROOT, 'ESCROW-BILATERAL-LAYER-A-EVIDENCE-LATEST.json'), json);

const md = `# Escrow Bilateral Layer A Evidence

**Verdict:** \`${verdict}\`  
**Stamp:** ${STAMP}  
**Decision path:** B3 EscrowV2 + FactoryV2  

## Checks (${passCount}/${checks.length})

${checks.map((c) => `- [${c.pass ? 'x' : ' '}] **${c.name}** — ${c.detail}`).join('\n')}

## V1 Escrow

V1 \`Escrow.sol\` / \`EscrowFactory.sol\` — **testnet legacy only**; **must not** deploy to mainnet.

## Layer B (design)

- \`contracts/src/EscrowV2.sol\` — \`confirmServiceComplete()\` + gated \`release()\`
- \`contracts/src/EscrowFactoryV2.sol\` — deploys V2 instances only
`;

fs.writeFileSync(path.join(RUN_DIR, 'ESCROW-BILATERAL-LAYER-A-EVIDENCE-LATEST.md'), md);
fs.writeFileSync(path.join(EVID_ROOT, 'ESCROW-BILATERAL-LAYER-A-EVIDENCE-LATEST.md'), md);

console.log(JSON.stringify({ verdict, passCount, total: checks.length, runDir: RUN_DIR }, null, 2));
process.exit(verdict === 'LAYER_A_EVIDENCE_PASS' ? 0 : 1);
