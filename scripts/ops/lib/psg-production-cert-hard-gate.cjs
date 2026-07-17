#!/usr/bin/env node
/**
 * PSG Production Cert hard gate (Node) — same semantics as psg-production-cert-hard-gate.sh
 *
 *   const { requirePsgProductionCertPass } = require('../ops/lib/psg-production-cert-hard-gate.cjs');
 *   requirePsgProductionCertPass();
 *
 * Destructive cert pipeline (run-psg-production-cert.sh) may set PSG_ALLOW_DESTRUCTIVE_CERT=1
 * before apply steps that must run prior to TT_PSG_PRODUCTION_CERT=PASS.
 */
'use strict';

const fs = require('fs');
const path = require('path');

function requirePsgProductionCertPass() {
  if (process.env.PSG_ALLOW_DESTRUCTIVE_CERT === '1') {
    return;
  }
  if (process.env.TT_PGC_BYPASS === '1') {
    if (!process.env.TT_PGC_BYPASS_REASON || !process.env.TT_PGC_BYPASS_OWNER) {
      console.error('TT_PGC_HARD_GATE: FAIL bypass requires TT_PGC_BYPASS_REASON + TT_PGC_BYPASS_OWNER');
      process.exit(2);
    }
    console.warn(
      `TT_PGC_HARD_GATE: BYPASS owner=${process.env.TT_PGC_BYPASS_OWNER} reason=${process.env.TT_PGC_BYPASS_REASON}`
    );
    return;
  }

  const root = process.env.PGC_ROOT || process.env.ROOT || path.resolve(__dirname, '../../..');
  const evid = path.join(
    root,
    process.env.TT_PSG_PRODUCTION_CERT_EVIDENCE ||
      'evidence/GO_psg_foundation/production_cert/PSG-PRODUCTION-CERT-LATEST.json'
  );

  if (!fs.existsSync(evid)) {
    console.error(`TT_PGC_HARD_GATE: FAIL missing ${evid}`);
    console.error(
      'TT_PGC_HARD_GATE: run bash scripts/gates/run-psg-production-cert.sh until TT_PSG_PRODUCTION_CERT: PASS'
    );
    process.exit(2);
  }

  let j;
  try {
    j = JSON.parse(fs.readFileSync(evid, 'utf8'));
  } catch (e) {
    console.error(`TT_PGC_HARD_GATE: FAIL unreadable ${evid}: ${e.message}`);
    process.exit(2);
  }

  const status = String(j.status || j.machine_status || '');
  if (status !== 'PASS') {
    console.error(`TT_PGC_HARD_GATE: FAIL TT_PSG_PRODUCTION_CERT status=${status || 'UNKNOWN'} (need PASS)`);
    console.error(`TT_PGC_HARD_GATE: evidence=${evid}`);
    process.exit(2);
  }

  const a = j.admission || {};
  if (a.TT_PSG_SSOT_DRIFT || a.TT_PSG_REPRODUCIBLE_BUILD || a.TT_PSG_ENVIRONMENT_ALIGNMENT) {
    if (
      a.TT_PSG_SSOT_DRIFT !== 'PASS' ||
      a.TT_PSG_REPRODUCIBLE_BUILD !== 'PASS' ||
      a.TT_PSG_ENVIRONMENT_ALIGNMENT !== 'PASS'
    ) {
      console.error(
        `TT_PGC_HARD_GATE: FAIL admission trio ssot=${a.TT_PSG_SSOT_DRIFT} repro=${a.TT_PSG_REPRODUCIBLE_BUILD} env=${a.TT_PSG_ENVIRONMENT_ALIGNMENT}`
      );
      process.exit(2);
    }
  }

  console.log('TT_PGC_HARD_GATE: OK TT_PSG_PRODUCTION_CERT=PASS');
}

module.exports = { requirePsgProductionCertPass };
