#!/usr/bin/env node
/**
 * Escrow Bilateral Settlement — Layer B evidence (PG-P0-ESC)
 *
 *   node scripts/dev/run-escrow-bilateral-layer-b-evidence.cjs
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_readiness/escrow-bilateral-layer-b');
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

function runForgeTest() {
  const r = spawnSync(
    'forge',
    ['test', '--match-contract', 'EscrowV2Test', '-vv'],
    { cwd: path.join(ROOT, 'contracts'), encoding: 'utf8', shell: process.platform === 'win32' },
  );
  return {
    label: 'forge_test_EscrowV2',
    ok: r.status === 0,
    status: r.status,
    stdout: (r.stdout || '').slice(-3000),
    stderr: (r.stderr || '').slice(-1500),
  };
}

mkdirp(RUN_DIR);

const checks = [];

checks.push(
  check('escrow_v2_contract', fs.existsSync(path.join(ROOT, 'contracts/src/EscrowV2.sol')), 'EscrowV2.sol'),
);
checks.push(
  check(
    'escrow_v2_bilateral_release_gate',
    /travelerServiceConfirmed/.test(readSafe('contracts/src/EscrowV2.sol'))
      && /ServiceNotComplete/.test(readSafe('contracts/src/EscrowV2.sol')),
    'release() requires both service flags',
  ),
);
checks.push(
  check('escrow_factory_v2_contract', fs.existsSync(path.join(ROOT, 'contracts/src/EscrowFactoryV2.sol')), 'EscrowFactoryV2.sol'),
);
checks.push(
  check(
    'deploy_script_v2',
    fs.existsSync(path.join(ROOT, 'contracts/script/DeployEscrowFactoryV2.s.sol')),
    'DeployEscrowFactoryV2.s.sol',
  ),
);
checks.push(
  check(
    'broadcast_shell_v2',
    fs.existsSync(path.join(ROOT, 'scripts/dev/phase2-sepolia-broadcast-escrow-factory-v2.sh')),
    'phase2-sepolia-broadcast-escrow-factory-v2.sh',
  ),
);
checks.push(
  check(
    'registry_mainnet_policy',
    /mainnet_deploy: FORBIDDEN/.test(readSafe('registry/escrow-bilateral-mainnet-policy.v1.yaml')),
    'V1 mainnet forbidden in policy SSOT',
  ),
);
checks.push(
  check(
    'keeper_layer_c_design',
    fs.existsSync(path.join(ROOT, 'docs/runbook/ESCROW-KEEPER-LAYER-C-DESIGN-V1.md')),
    'Keeper Layer C design doc',
  ),
);

const forge = runForgeTest();
checks.push(check('forge_escrow_v2_tests', forge.ok, forge.ok ? 'PASS' : `exit ${forge.status}`));

const passCount = checks.filter((c) => c.pass).length;
const verdict = passCount === checks.length ? 'LAYER_B_EVIDENCE_PASS' : 'LAYER_B_EVIDENCE_PARTIAL';

const report = {
  verdict,
  stamp: STAMP,
  decision: 'B3 EscrowV2 + FactoryV2',
  checks,
  forge,
  v1_mainnet: 'FORBIDDEN',
  v2_mainnet_deploy: 'REQUIRED — address TBD until broadcast + registry',
};

const json = JSON.stringify(report, null, 2);
fs.writeFileSync(path.join(RUN_DIR, 'ESCROW-BILATERAL-LAYER-B-EVIDENCE-LATEST.json'), json);
fs.writeFileSync(path.join(EVID_ROOT, 'ESCROW-BILATERAL-LAYER-B-EVIDENCE-LATEST.json'), json);

const md = `# Escrow Bilateral Layer B Evidence (PG-P0-ESC)

**Verdict:** \`${verdict}\`  
**Stamp:** ${STAMP}

## Checks (${passCount}/${checks.length})

${checks.map((c) => `- [${c.pass ? 'x' : ' '}] **${c.name}** — ${c.detail}`).join('\n')}

## V1 Legacy

**Mainnet deploy: FORBIDDEN** — see \`registry/escrow-bilateral-mainnet-policy.v1.yaml\`

## Next (Owner)

1. Sepolia broadcast: \`TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1 bash scripts/dev/phase2-sepolia-broadcast-escrow-factory-v2.sh\`
2. Registry \`escrow_factory_v2_address\` + mainnet env manifest
3. Cert #8–12 · R-01 · Shadow Launch · G6
`;

fs.writeFileSync(path.join(RUN_DIR, 'ESCROW-BILATERAL-LAYER-B-EVIDENCE-LATEST.md'), md);
fs.writeFileSync(path.join(EVID_ROOT, 'ESCROW-BILATERAL-LAYER-B-EVIDENCE-LATEST.md'), md);

console.log(JSON.stringify({ verdict, passCount, total: checks.length, runDir: RUN_DIR }, null, 2));
process.exit(verdict === 'LAYER_B_EVIDENCE_PASS' ? 0 : 1);
