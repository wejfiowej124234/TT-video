#!/usr/bin/env node
/**
 * Atomic TT_PRODUCTION_GO=GO — ONLY after Owner attestation on Step5 decision package.
 *
 * Solo Developer model (default):
 *   Owner Sign-off = single human attestation (name + signed_utc + decision).
 *   No second Approver / PR Reviewer / Merge Request required.
 *   Does NOT waive Gates · Evidence · Freeze · Certification · Release Archive.
 *
 *   node scripts/dev/apply-psg-rc-production-go-after-owner-signoff.cjs \
 *     --package evidence/GO_psg_foundation/production_go/OWNER-DECISION-PACKAGE-LATEST.json
 *
 * Hard rules:
 *   - owner_attestation.decision MUST be GO
 *   - name + signed_utc required
 *   - freeze_manifest_id MUST match RC-FREEZE-20260717T094900Z (or FREEZE_MANIFEST_ID)
 *   - locked TT_PSG_PRODUCTION_CERT=PASS (cite only — no cert re-run)
 *   - Does NOT re-run Foundation / Alignment / Freeze / Cap Cert / Production Cert
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const EXPECTED_FREEZE = process.env.FREEZE_MANIFEST_ID || 'RC-FREEZE-20260717T094900Z';
const MATRIX = path.join(ROOT, 'registry/production-readiness-master-matrix.v1.yaml');
const PROD_CERT = path.join(ROOT, 'evidence/GO_psg_foundation/production_cert/PSG-PRODUCTION-CERT-LATEST.json');

function fail(m) {
  console.error(`TT_PRODUCTION_GO_APPLY: FAIL ${m}`);
  process.exit(2);
}

function parseArgs() {
  let packagePath = '';
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--package') packagePath = process.argv[++i];
  }
  if (!packagePath) {
    fail('Usage: --package <OWNER-DECISION-PACKAGE.json>');
  }
  return path.isAbsolute(packagePath) ? packagePath : path.join(ROOT, packagePath);
}

function main() {
  const pkgPath = parseArgs();
  if (!fs.existsSync(pkgPath)) fail(`missing package ${pkgPath}`);
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  if (pkg.freeze_manifest_id !== EXPECTED_FREEZE) {
    fail(`package freeze ${pkg.freeze_manifest_id} ≠ ${EXPECTED_FREEZE}`);
  }
  if (pkg.tt_psg_production_cert !== 'PASS') fail('package tt_psg_production_cert ≠ PASS');

  const prod = JSON.parse(fs.readFileSync(PROD_CERT, 'utf8'));
  if (prod.status !== 'PASS') fail(`live locked cert status=${prod.status}`);

  const att = pkg.owner_attestation || {};
  if (att.decision !== 'GO') {
    fail(`owner_attestation.decision=${att.decision || 'null'} — refuse GO apply (need GO)`);
  }
  if (!att.name || !String(att.name).trim()) fail('owner_attestation.name required');
  if (!att.signed_utc || !String(att.signed_utc).trim()) fail('owner_attestation.signed_utc required');

  let matrix = fs.readFileSync(MATRIX, 'utf8');
  if (!/TT_PRODUCTION_GO:\s*NO_GO/.test(matrix) && !/TT_PRODUCTION_GO:\s*GO\b/.test(matrix)) {
    fail('matrix missing TT_PRODUCTION_GO key');
  }
  if (/TT_PRODUCTION_GO:\s*GO\b/.test(matrix) && !/TT_PRODUCTION_GO:\s*NO_GO/.test(matrix)) {
    console.log('TT_PRODUCTION_GO_APPLY: already GO — idempotent OK');
    process.exit(0);
  }

  const next = matrix.replace(/TT_PRODUCTION_GO:\s*NO_GO/, 'TT_PRODUCTION_GO: GO');
  if (next === matrix) fail('failed to replace TT_PRODUCTION_GO: NO_GO');
  fs.writeFileSync(MATRIX, next);

  pkg.status = 'OWNER_SIGNED_GO_APPLIED';
  pkg.production_go = 'GO';
  pkg.machine_keys = { ...(pkg.machine_keys || {}), TT_PRODUCTION_GO: 'GO' };
  pkg.applied_utc = new Date().toISOString();
  pkg.applied_matrix = 'registry/production-readiness-master-matrix.v1.yaml';
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

  const latest = path.join(ROOT, 'evidence/GO_psg_foundation/production_go/OWNER-DECISION-PACKAGE-LATEST.json');
  if (path.resolve(pkgPath) !== path.resolve(latest)) {
    fs.writeFileSync(latest, `${JSON.stringify(pkg, null, 2)}\n`);
  }

  console.log('TT_PRODUCTION_GO_APPLY: PASS');
  console.log('TT_PRODUCTION_GO: GO');
  console.log(`attestor: ${att.name} @ ${att.signed_utc}`);
  console.log('no_gate_rerun: true');
}

main();
