#!/usr/bin/env node
/**
 * Regenerate docs/runbook/TESTNET-PERFECT-VALIDATION-REPORT.md header + manifest stub.
 * Full narrative SSOT remains in the markdown file; this merges machine-readable tail.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

function arg(name, fallback = '') {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const stamp = arg('stamp', new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z');
const evidDir = arg('evid-dir', path.join(ROOT, 'evidence/GO_phase2_testnet_perfect_validation', stamp));
const p2execDir = arg('p2exec-dir', '');
const uatDir = arg('uat-dir', '');
const admVerdict = arg('adm-verdict', 'SKIP');
const openP0 = Number(arg('open-p0', '1'));
const openP1 = Number(arg('open-p1', '10'));

const readiness = Math.max(0, Math.min(100, 100 - openP0 * 15 - openP1 * 2));
const go = openP0 === 0 && openP1 === 0 ? 'GO' : 'NO-GO';

fs.mkdirSync(evidDir, { recursive: true });

const manifest = {
  schema: 'testnet_perfect_validation.v1',
  stamp,
  recorded_at: new Date().toISOString(),
  phase: '② testnet',
  exit_criteria_met: go === 'GO',
  open_testnet_p0: openP0,
  open_testnet_p1: openP1,
  phase2_readiness: readiness,
  tt_testnet_perfect_validation_go: go,
  evidence: {
    p2exec: p2execDir ? path.relative(ROOT, p2execDir) : null,
    uat: uatDir ? path.relative(ROOT, uatDir) : null,
    adm_u01: admVerdict,
  },
};

fs.writeFileSync(
  path.join(evidDir, 'testnet-perfect-validation-manifest.v1.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);

console.log(`manifest: ${path.relative(ROOT, path.join(evidDir, 'testnet-perfect-validation-manifest.v1.json'))}`);
console.log(`TT_TESTNET_PERFECT_VALIDATION_GO: ${go}`);
console.log(`TT_PHASE2_READINESS: ${readiness}/100`);
process.exit(go === 'GO' ? 0 : 1);
