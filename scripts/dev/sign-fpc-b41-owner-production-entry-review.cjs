#!/usr/bin/env node
/**
 * B41 · Owner sign-off + human verification rollup (evidence-only · ② staging)
 *
 *   TRAVELTRUST_FPC_B41_HUMAN_VERIFIED_OK=1 \
 *   TRAVELTRUST_FPC_B41_OWNER_SIGNOFF_OK=1 \
 *     node scripts/dev/sign-fpc-b41-owner-production-entry-review.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const EVID = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100'
);
const B41_OUT = path.join(EVID, 'FPC-100-BATCH-B41-LATEST.json');
const CHECKLIST = path.join(
  EVID,
  'B41-production-entry-review/FPC-100-PRODUCTION-ENTRY-REVIEW-CHECKLIST-BASELINE.v1.json'
);
const SIGN_OUT = path.join(
  EVID,
  'B41-production-entry-review/FPC-100-B41-OWNER-SIGNOFF-LATEST.json'
);

function main() {
  if (process.env.TRAVELTRUST_FPC_B41_HUMAN_VERIFIED_OK !== '1') {
    console.error('TT_FPC_B41_SIGNOFF: FAIL TRAVELTRUST_FPC_B41_HUMAN_VERIFIED_OK=1 required');
    process.exit(2);
  }
  if (process.env.TRAVELTRUST_FPC_B41_OWNER_SIGNOFF_OK !== '1') {
    console.error('TT_FPC_B41_SIGNOFF: FAIL TRAVELTRUST_FPC_B41_OWNER_SIGNOFF_OK=1 required');
    process.exit(2);
  }
  if (!fs.existsSync(B41_OUT)) {
    console.error('TT_FPC_B41_SIGNOFF: FAIL B41 evidence missing — run batch runner first');
    process.exit(2);
  }

  const checklist = JSON.parse(fs.readFileSync(CHECKLIST, 'utf8'));
  const report = JSON.parse(fs.readFileSync(B41_OUT, 'utf8'));
  const machineOk =
    report.gate_pass === true &&
    report.business_certification?.verdict === 'PASS' &&
    report.quality_supplement?.verdict === 'PASS' &&
    (report.findings || []).filter((f) => f.severity === 'P0').length === 0;

  if (!machineOk) {
    console.error('TT_FPC_B41_SIGNOFF: FAIL machine gate not PASS — fix probes before sign-off');
    process.exit(1);
  }

  const signedAt = new Date().toISOString();
  const signer = process.env.FPC_B41_HUMAN_VERIFIER || 'Sebastian Ward';
  const attestation =
    'Sebastian Ward · Solo maintainer · FPC B41 Production Entry Review @ ② staging · ' +
    'human corridor verified · Owner sign-off · not ③ Production GO';

  report.human_verified = true;
  report.human_verifier = signer;
  report.owner_sign_off = {
    status: 'SIGNED',
    signed_at_utc: signedAt,
    signer,
    attestation,
    phase: '② staging · Production Entry Review',
    env: checklist.owner_signoff_env,
  };
  report.overall_verdict = 'PASS';
  report.verdict = 'PASS';
  report.pass = true;
  report.release_blocker = 'NO';
  report.certified_at_utc = report.certified_at_utc || signedAt;
  report.expires_at_utc =
    report.expires_at_utc ||
    new Date(Date.parse(signedAt) + 30 * 86400000).toISOString();
  report.certification_frozen = true;
  report.frozen_at_utc = report.frozen_at_utc || signedAt;
  report.frozen_git_sha = report.authoritative_immutable_head;

  const rollup = [];
  for (const batchId of checklist.human_required_rollup_batches || []) {
    const p = path.join(EVID, `FPC-100-BATCH-${batchId}-LATEST.json`);
    if (!fs.existsSync(p)) continue;
    const b = JSON.parse(fs.readFileSync(p, 'utf8'));
    b.human_verified = true;
    b.human_verifier = signer;
    b.human_note = `Production Entry Review rollup @ B41 sign-off ${signedAt.slice(0, 10)}`;
    fs.writeFileSync(p, JSON.stringify(b, null, 2) + '\n');
    rollup.push({ batch_id: batchId, human_verified: true });
  }

  fs.writeFileSync(B41_OUT, JSON.stringify(report, null, 2) + '\n');

  const signDoc = {
    schema: 'traveltrust.fpc_100_b41_owner_signoff.v1',
    timestamp_utc: signedAt,
    phase: '② staging',
    signer,
    attestation,
    b41_verdict: 'PASS',
    human_rollup_batches: rollup,
    machine_key: 'TT_FULL_PRODUCTION_CERTIFICATION',
    phase_honesty: '② Production Entry Review sign-off ≠ ③ Production GO',
  };
  fs.writeFileSync(SIGN_OUT, JSON.stringify(signDoc, null, 2) + '\n');

  const md = `# FPC B41 · Production Entry Review · Owner Sign-off

**UTC signed:** ${signedAt}  
**Signer:** ${signer}  
**Phase:** ② staging · Production Entry Review

## Attestation

${attestation}

## Human verification rollup

${rollup.map((r) => `- ${r.batch_id}: human_verified=true`).join('\n')}

## Honest boundary

② Production Entry Review **≠** ③ Production GO · PSP · mainnet · G-1/G-2 remain separate.

**TT_FPC_B41_OWNER_SIGNOFF: SIGNED**
`;
  fs.writeFileSync(
    path.join(EVID, 'B41-production-entry-review/FPC-100-B41-OWNER-SIGNOFF-LATEST.md'),
    md
  );

  try {
    require('child_process').execSync('node scripts/dev/refresh-fpc-100-release-dashboard.cjs', {
      cwd: ROOT,
      stdio: 'inherit',
    });
  } catch {
    /* best-effort */
  }

  console.log('TT_FPC_B41_OWNER_SIGNOFF: SIGNED');
  console.log(`human_rollup=${rollup.length} batches`);
  console.log(`EVIDENCE: ${SIGN_OUT}`);
}

main();
