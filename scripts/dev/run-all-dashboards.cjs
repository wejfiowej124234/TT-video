#!/usr/bin/env node
/**
 * Fixed entry · TravelTrust Dashboard System (3 cockpits)
 *
 *   node scripts/dev/dashboard.cjs [--refresh] [--execute]
 *
 * Discipline: drive daily work from dashboards — do not expand governance framework.
 */
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const args = process.argv.slice(2);

function runNode(scriptRel, extraArgs = []) {
  return spawnSync(process.execPath, [path.join(__dirname, scriptRel), ...extraArgs], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'inherit',
  });
}

function runBash(scriptRel, extraArgs = []) {
  const bash = process.platform === 'win32' ? 'bash' : 'bash';
  return spawnSync(bash, [path.join(__dirname, scriptRel), ...extraArgs], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'inherit',
  });
}

if (args.includes('--execute')) {
  console.log('Dashboard execute — Phase ② parallel sub-tracks + Cert #8 prep\n');
  runNode('run-phase2-g6-cover-remediation.cjs');
  runNode('run-phase2-subtrack-evidence.cjs');
  runNode('gen-ttg-cert-production-evidence-index.cjs');
  runBash('run-tt-governance-cert-08-treasury-spend.sh');
  const hatBase = path.join(ROOT, 'evidence/GO_hat_r1_sepolia');
  let etaUnix = 0;
  try {
    for (const ent of fs.readdirSync(hatBase, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue;
      const etaFile = path.join(hatBase, ent.name, 'TREASURY_EXECUTE_EARLIEST_UNIX.txt');
      if (fs.existsSync(etaFile)) etaUnix = Number(fs.readFileSync(etaFile, 'utf8').trim()) || 0;
    }
  } catch {
    etaUnix = 0;
  }
  const timelockReady = etaUnix > 0 && Math.floor(Date.now() / 1000) >= etaUnix;
  if (timelockReady && process.env.HAT_R1_LIVE_WALLET_OK === '1' && process.env.HAT_R1_ALLOW_SPEND_EXECUTE === '1') {
    console.log('Cert #8 Timelock elapsed — attempting Wave 2 finalize\n');
    runBash('run-cert8-tl2-execute-and-finalize.sh');
  } else if (process.env.HAT_R1_LIVE_WALLET_OK === '1' && process.env.HAT_R1_PHASE_B_PAUSED === '0') {
    if (!process.env.HAT_R1_ALLOW_SPEND_EXECUTE || process.env.HAT_R1_ALLOW_SPEND_EXECUTE === '0') {
      runBash('run-tt-governance-cert-08-treasury-spend.sh', ['--try-chain', '--queue-only']);
    } else {
      console.log('HAT_R1_ALLOW_SPEND_EXECUTE=1 — run finalize manually after TL#2 execute');
    }
  } else {
    console.log('Cert #8 chain: skipped (set HAT_R1_LIVE_WALLET_OK=1 HAT_R1_PHASE_B_PAUSED=0 for on-chain capture)');
  }
  if (!args.includes('--refresh')) {
    args.push('--refresh');
  }
}

const scripts = [
  { name: 'Project', file: 'run-phase-dashboard.cjs' },
  { name: 'Web3', file: 'run-web3-dashboard.cjs' },
  { name: 'Operations', file: 'run-operations-dashboard.cjs' },
];

console.log('TravelTrust Dashboard System\n');

for (const s of scripts) {
  console.log(`${'='.repeat(60)}\n▶ ${s.name} Dashboard\n${'='.repeat(60)}\n`);
  spawnSync(process.execPath, [path.join(__dirname, s.file), ...args.filter((a) => a !== '--execute')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
}

console.log('\n---\nFixed entry: node scripts/dev/dashboard.cjs [--refresh] [--execute]');
console.log('Deployment Dashboard: NOT ACTIVE until Phase ② end (see registry/deployment-dashboard.v1.yaml)\n');
console.log('Discipline: complete Cert · UAT · evidence → refresh dashboard. No new governance layers.\n');
