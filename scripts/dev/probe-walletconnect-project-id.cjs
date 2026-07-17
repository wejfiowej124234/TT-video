#!/usr/bin/env node
/**
 * OA-01 · Read-only WalletConnect Project ID probe (no deploy · no secret print)
 *
 *   node scripts/dev/probe-walletconnect-project-id.cjs
 *
 * Exit 0 → WC_PROJECT_ID: KEY_PRESENT
 * Exit 2 → KEY_ABSENT | KEY_MALFORMED
 * Writes evidence/GO_phase2_staging_reality/OA-01/WC-PROJECT-ID-PROBE-LATEST.json
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const HEX32 = /^[0-9a-fA-F]{32}$/;
const OUT_DIR = path.join(ROOT, 'evidence/GO_phase2_staging_reality/OA-01');
const OUT = path.join(OUT_DIR, 'WC-PROJECT-ID-PROBE-LATEST.json');

function readKey(file) {
  if (!fs.existsSync(file)) return { path: file, status: 'MISSING', present: false };
  const text = fs.readFileSync(file, 'utf8');
  const line = text.split(/\r?\n/).find((l) => l.startsWith('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID='));
  if (!line) return { path: file, status: 'KEY_ABSENT', present: false };
  const val = line.slice('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID='.length).trim().replace(/^["']|["']$/g, '');
  if (!val) return { path: file, status: 'KEY_ABSENT', present: false };
  if (!HEX32.test(val)) return { path: file, status: 'KEY_MALFORMED', present: false, length: val.length };
  return { path: file, status: 'KEY_PRESENT', present: true, masked: `${val.slice(0, 4)}…${val.slice(-4)}` };
}

const sources = [
  readKey(path.join(ROOT, 'deploy/fly/tt-web-staging/build.env.local')),
  readKey(path.join(ROOT, 'frontend/.env.local')),
  readKey(path.join(ROOT, '.env')),
];

const envVal = (process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '').trim();
sources.push(
  !envVal
    ? { path: 'process.env', status: 'KEY_ABSENT', present: false }
    : HEX32.test(envVal)
      ? { path: 'process.env', status: 'KEY_PRESENT', present: true, masked: `${envVal.slice(0, 4)}…${envVal.slice(-4)}` }
      : { path: 'process.env', status: 'KEY_MALFORMED', present: false, length: envVal.length },
);

const anyPresent = sources.some((s) => s.present);
const anyMalformed = sources.some((s) => s.status === 'KEY_MALFORMED');
const verdict = anyPresent ? 'KEY_PRESENT' : anyMalformed ? 'KEY_MALFORMED' : 'KEY_ABSENT';
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

const report = {
  schema: 'traveltrust.wc_project_id_probe.v1',
  machine_key: 'WC_PROJECT_ID',
  verdict,
  stamp_utc: stamp,
  batch: 'TT_PHASE2_STAGING_REALITY_CLOSURE',
  oa: 'OA-01',
  sources,
  next:
    verdict === 'KEY_PRESENT'
      ? 'Owner may rebuild Staging Web: bash scripts/dev/deploy-tt-web-staging.sh'
      : 'Owner: create Project ID at https://cloud.reown.com then bash scripts/dev/set-walletconnect-project-id.sh <32-hex>',
  forbidden: ['print_full_project_id', 'git_commit_secrets', 'start_OA02_before_KEY_PRESENT'],
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);

console.log(`WC_PROJECT_ID: ${verdict}`);
console.log(`probe: wrote ${path.relative(ROOT, OUT)}`);
process.exit(verdict === 'KEY_PRESENT' ? 0 : 2);
