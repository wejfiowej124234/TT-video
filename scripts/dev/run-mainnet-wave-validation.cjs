#!/usr/bin/env node
/**
 * Mainnet Validation — post Phase ③ wave deploy verification stub.
 *
 *   node scripts/dev/run-mainnet-wave-validation.cjs --wave=1
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const waveArg = process.argv.find((a) => a.startsWith('--wave='));
const wave = waveArg ? parseInt(waveArg.split('=')[1], 10) : 0;

const pkg = readJson('evidence/GO_production_readiness/mainnet-deployment-package/MAINNET-DEPLOYMENT-PACKAGE-LATEST.json');
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_readiness/mainnet-validation');
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const RUN_DIR = path.join(EVID_ROOT, `wave${wave}-${STAMP}`);

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  } catch {
    return null;
  }
}

if (!wave || wave < 1 || wave > 3) {
  console.error('Usage: node scripts/dev/run-mainnet-wave-validation.cjs --wave=1|2|3');
  process.exit(2);
}

if (pkg?.verdict !== 'MAINNET_DEPLOYMENT_PACKAGE_GENERATED') {
  console.error(JSON.stringify({ error: 'MAINNET_DEPLOYMENT_PACKAGE_GENERATED required', current: pkg?.verdict }, null, 2));
  process.exit(2);
}

fs.mkdirSync(RUN_DIR, { recursive: true });

const report = {
  schema: 'traveltrust.mainnet_wave_validation_report.v1',
  recorded_utc: new Date().toISOString(),
  wave,
  chain_id: '1',
  verdict: 'MAINNET_WAVE_VALIDATION_PENDING',
  package_ref: pkg.package_dir,
  checks: [
    { id: 'REGISTRY-ADDRESSES', pass: false, detail: 'Mainnet addresses populated in protocol-convergence-deployments mainnet block' },
    { id: 'ON-CHAIN-SMOKE', pass: false, detail: 'Post-broadcast contract smoke on chain_id=1' },
    { id: 'API-META-PARITY', pass: false, detail: '/meta contract addresses match registry' },
    { id: 'INDEXER-SYNC', pass: false, detail: 'Indexer ingesting mainnet events' },
  ],
  next: [
    'Complete wave broadcast with Owner dual-control',
    'Fill env/mainnet.env.template addresses',
    'Re-run with on-chain tx evidence',
    wave < 3 ? `Proceed to Wave ${wave + 1} after PASS` : 'Run Shadow Launch + Production GO gate',
  ],
};

const json = JSON.stringify(report, null, 2);
fs.writeFileSync(path.join(RUN_DIR, `MAINNET-WAVE-${wave}-VALIDATION-LATEST.json`), json);
fs.writeFileSync(path.join(EVID_ROOT, `MAINNET-WAVE-${wave}-VALIDATION-LATEST.json`), json);

console.log(JSON.stringify({ wave, verdict: report.verdict }, null, 2));
process.exit(0);
