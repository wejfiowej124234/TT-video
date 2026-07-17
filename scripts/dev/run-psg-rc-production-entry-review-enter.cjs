#!/usr/bin/env node
/**
 * PSG RC Step 4 · Enter Production Entry Review (under Freeze + Cap Cert)
 *
 * Does NOT re-run Foundation Gate / Alignment / Freeze / Cap Cert.
 * Cites freeze_manifest_id. Exit of Step 4 still requires TT_PSG_PRODUCTION_CERT=PASS
 * (Owner: repro×3 · prod candidate · destructive suite) — this script only OPENS Step 4.
 *
 *   FREEZE_MANIFEST_ID=RC-FREEZE-20260717T094900Z \
 *     node scripts/dev/run-psg-rc-production-entry-review-enter.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const EXPECTED_FREEZE = process.env.FREEZE_MANIFEST_ID || 'RC-FREEZE-20260717T094900Z';
const FREEZE_YML = path.join(ROOT, 'registry/psg-release-candidate-freeze-LATEST.v1.yaml');
const CAP_CERT = path.join(ROOT, 'evidence/GO_psg_foundation/capability_cert/PSG-RC-CAPABILITY-CERT-LATEST.json');
const PROD_CERT = path.join(ROOT, 'evidence/GO_psg_foundation/production_cert/PSG-PRODUCTION-CERT-LATEST.json');
const SEQUENCE = path.join(ROOT, 'registry/psg-release-candidate-sequence.v1.yaml');
const PER_MD = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/PRODUCTION-ENTRY-REVIEW.md'
);
const OUT_DIR = path.join(ROOT, 'evidence/GO_psg_foundation/production_entry_review');
const STAMP = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

function fail(msg) {
  console.error(`TT_PSG_RC_PRODUCTION_ENTRY: FAIL ${msg}`);
  process.exit(2);
}

function main() {
  const freezeText = fs.readFileSync(FREEZE_YML, 'utf8');
  if (!/^status:\s*FROZEN/m.test(freezeText)) fail('freeze not FROZEN');
  const freezeId = (freezeText.match(/freeze_manifest_id:\s*(\S+)/) || [])[1];
  if (freezeId !== EXPECTED_FREEZE) fail(`freeze_manifest_id=${freezeId} ≠ ${EXPECTED_FREEZE}`);

  const cap = JSON.parse(fs.readFileSync(CAP_CERT, 'utf8'));
  if (cap.status !== 'PASS') fail(`Cap Cert status=${cap.status}`);
  if (cap.freeze_manifest_id !== EXPECTED_FREEZE) fail('Cap Cert freeze mismatch');

  let prod = null;
  if (fs.existsSync(PROD_CERT)) {
    prod = JSON.parse(fs.readFileSync(PROD_CERT, 'utf8'));
  }

  const head = execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  const exitBlockers = [];
  if (!prod || prod.status !== 'PASS') {
    exitBlockers.push({
      id: 'TT_PSG_PRODUCTION_CERT',
      status: (prod && prod.status) || 'MISSING',
      admission: (prod && prod.admission) || null,
      destructive: (prod && prod.destructive_suite && prod.destructive_suite.status) || null,
      disposition: 'REQUIRED_FOR_STEP4_EXIT',
      note: 'Step 4 may OPEN now; EXIT requires PRODUCTION_CERT PASS (Owner repro×3 · prod candidate · destructive)',
    });
  }
  if (cap.module_release_ladder_confluence && cap.module_release_ladder_confluence.status !== 'PASS') {
    exitBlockers.push({
      id: 'MODULE_RELEASE_LADDER_CONFLUENCE',
      status: cap.module_release_ladder_confluence.status,
      disposition: 'REQUIRED_OR_OWNER_DEFERRAL',
      note: cap.module_release_ladder_confluence.note,
    });
  }

  const report = {
    schema: 'traveltrust.psg_rc_production_entry_review.v1',
    machine_key: 'TT_PSG_RC_PRODUCTION_ENTRY',
    stamp_utc: STAMP,
    status: 'ACTIVE',
    freeze_manifest_id: freezeId,
    git_sha: head,
    production_go: 'NO_GO',
    cited: {
      freeze_manifest_id: freezeId,
      capability_cert_stamp: cap.stamp_utc,
      capability_cert_status: cap.status,
      foundation_gate_stamp: cap.cited_existing?.foundation_gate_stamp || null,
      alignment_audit_stamp: cap.cited_existing?.alignment_audit_stamp || null,
      per_ssot: 'docs/spec/governance-token/evidence/phase3-production-entry-baseline/PRODUCTION-ENTRY-REVIEW.md',
    },
    discipline: {
      no_foundation_gate_rerun: true,
      no_alignment_audit_rerun: true,
      no_rc_freeze_rerun: true,
      no_capability_cert_rerun: true,
    },
    step4_opened: true,
    step4_exit_ready: exitBlockers.length === 0,
    exit_blockers: exitBlockers,
    next_owner_actions_for_exit: [
      'Clear TT_PSG_REPRODUCIBLE_BUILD WAITING_OWNER (3 post-deploy fingerprints or Owner attest)',
      'Set PRODUCTION_CANDIDATE_API_BASE for TT_PSG_ENVIRONMENT_ALIGNMENT PASS',
      'PSG_ALLOW_DESTRUCTIVE_CERT=1 Owner suite → TT_PSG_PRODUCTION_CERT PASS',
      'Module Ladder P1 Real Device Batch PASS or Owner Non-blocking deferral',
    ],
    honest_boundary:
      'ACTIVE Production Entry Review ≠ Step4 EXIT ≠ TT_PSG_PRODUCTION_CERT=PASS ≠ Production GO',
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const stampDir = path.join(OUT_DIR, STAMP);
  fs.mkdirSync(stampDir, { recursive: true });
  fs.writeFileSync(path.join(stampDir, 'PRODUCTION-ENTRY-REVIEW.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'PSG-RC-PRODUCTION-ENTRY-LATEST.json'), JSON.stringify(report, null, 2));

  // Advance RC sequence pointer to Step 4 (opened)
  let seq = fs.readFileSync(SEQUENCE, 'utf8');
  seq = seq.replace(/^  step:\s*[0-9.]+/m, '  step: 4');
  seq = seq.replace(/^  step_id:\s*\S+/m, '  step_id: production_entry_review');
  seq = seq.replace(
    /^  note:\s*>[\s\S]*?(?=\n# ── Anti-patterns)/m,
    `  note: >
    Step 4 Production Entry Review ACTIVE under freeze ${freezeId}.
    Cap Cert PASS cited. Step4 EXIT still blocked until TT_PSG_PRODUCTION_CERT=PASS
    (+ Module Ladder confluence or Owner Non-blocking deferral). ≠ Production GO.

`
  );
  fs.writeFileSync(SEQUENCE, seq, 'utf8');

  // Light PER ladder line sync (status only)
  if (fs.existsSync(PER_MD)) {
    let md = fs.readFileSync(PER_MD, 'utf8');
    if (!md.includes('RC Cap Cert PASS')) {
      md = md.replace(
        /Production Entry Review\s+\*\*OPEN\*\*[^\n]*/,
        `Production Entry Review      **ACTIVE** — RC Step 4 opened · freeze \`${freezeId}\` · Cap Cert PASS · EXIT waits \`TT_PSG_PRODUCTION_CERT=PASS\``
      );
      fs.writeFileSync(PER_MD, md, 'utf8');
    }
  }

  console.log(`TT_PSG_RC_PRODUCTION_ENTRY: ACTIVE freeze_manifest_id=${freezeId}`);
  console.log(`step4_exit_ready=${report.step4_exit_ready} blockers=${exitBlockers.length}`);
  console.log(`evidence: evidence/GO_psg_foundation/production_entry_review/PSG-RC-PRODUCTION-ENTRY-LATEST.json`);
  if (exitBlockers.length) {
    for (const b of exitBlockers) console.log(`EXIT_BLOCKER: ${b.id}=${b.status}`);
  }
}

main();
