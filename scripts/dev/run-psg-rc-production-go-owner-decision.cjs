#!/usr/bin/env node
/**
 * PSG RC Step 5 · Owner Decision package (cite-only · no Gate re-run)
 *
 * Solo Developer: package is for Owner Sign-off (single attestation).
 * Does NOT require PR / second Approver / Code Reviewer.
 * Does NOT set TT_PRODUCTION_GO=GO until apply-…-after-owner-signoff runs.
 *
 * Assembles final decision pack + sign-off checklist from locked:
 *   - PER EXIT_BLOCKERS clear
 *   - TT_PSG_PRODUCTION_CERT=PASS
 *   - Freeze RC-FREEZE-20260717T094900Z
 *
 * Does NOT set TT_PRODUCTION_GO=GO. Owner fills attestation, then:
 *   node scripts/dev/apply-psg-rc-production-go-after-owner-signoff.cjs \
 *     --package <path-to-OWNER-DECISION-PACKAGE.json>
 *
 *   FREEZE_MANIFEST_ID=RC-FREEZE-20260717T094900Z \
 *     node scripts/dev/run-psg-rc-production-go-owner-decision.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const EXPECTED_FREEZE = process.env.FREEZE_MANIFEST_ID || 'RC-FREEZE-20260717T094900Z';
const STAMP = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

const PATHS = {
  freeze: 'registry/psg-release-candidate-freeze-LATEST.v1.yaml',
  sequence: 'registry/psg-release-candidate-sequence.v1.yaml',
  foundation: 'registry/psg-foundation-gate-LATEST.v1.yaml',
  matrix: 'registry/production-readiness-master-matrix.v1.yaml',
  prodCert: 'evidence/GO_psg_foundation/production_cert/PSG-PRODUCTION-CERT-LATEST.json',
  entry: 'evidence/GO_psg_foundation/production_entry_review/PSG-RC-PRODUCTION-ENTRY-LATEST.json',
  goOpen: 'evidence/GO_psg_foundation/production_go/PSG-RC-PRODUCTION-GO-LATEST.json',
  capCert: 'evidence/GO_psg_foundation/capability_cert/PSG-RC-CAPABILITY-CERT-LATEST.json',
  perClear:
    'docs/spec/governance-token/evidence/phase3-production-entry-baseline/PER-EXIT-BLOCKERS/PER-EXIT-BLOCKERS-CLEAR-LATEST.json',
  ladder:
    'docs/spec/governance-token/evidence/phase3-production-entry-baseline/PER-EXIT-BLOCKERS/OWNER-ACCEPTED-MODULE-LADDER-CONFLUENCE.json',
  repro: 'evidence/GO_psg_foundation/production_cert/PSG-REPRODUCIBLE-BUILD-LATEST.json',
  envAlign: 'evidence/GO_psg_foundation/production_cert/PSG-ENVIRONMENT-ALIGNMENT-LATEST.json',
};

const OUT_DIR = path.join(ROOT, 'evidence/GO_psg_foundation/production_go', STAMP);
const PER_DIR = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/PER-EXIT-BLOCKERS'
);
const LATEST_DIR = path.join(ROOT, 'evidence/GO_psg_foundation/production_go');

function fail(m) {
  console.error(`TT_PSG_RC_OWNER_DECISION: FAIL ${m}`);
  process.exit(2);
}

function readJson(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) fail(`missing ${rel}`);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function readText(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) fail(`missing ${rel}`);
  return fs.readFileSync(p, 'utf8');
}

function yamlField(text, key) {
  const m = text.match(new RegExp(`(?:^|\\n)\\s*${key}:\\s*(\\S+)`, 'm'));
  return m ? m[1].replace(/^["']|["']$/g, '') : null;
}

function main() {
  const freezeYml = readText(PATHS.freeze);
  if (!/^status:\s*FROZEN/m.test(freezeYml)) fail('freeze not FROZEN');
  const freezeId = yamlField(freezeYml, 'freeze_manifest_id');
  if (freezeId !== EXPECTED_FREEZE) fail(`freeze_manifest_id=${freezeId} ≠ ${EXPECTED_FREEZE}`);
  const freezeGit = yamlField(freezeYml, 'git_sha');

  const prod = readJson(PATHS.prodCert);
  if (prod.status !== 'PASS') fail(`TT_PSG_PRODUCTION_CERT status=${prod.status}`);
  if (prod.freeze_manifest_id && prod.freeze_manifest_id !== EXPECTED_FREEZE) {
    fail(`prod cert freeze mismatch ${prod.freeze_manifest_id}`);
  }

  const entry = readJson(PATHS.entry);
  if (entry.step4_exit_ready !== true && entry.status !== 'EXIT_READY') {
    fail(`Step4 not EXIT_READY (status=${entry.status})`);
  }
  if (Array.isArray(entry.exit_blockers) && entry.exit_blockers.length > 0) {
    fail(`exit_blockers still open: ${entry.exit_blockers.map((b) => b.id || b).join(',')}`);
  }

  const perClear = readJson(PATHS.perClear);
  if (perClear.tt_psg_production_cert !== 'PASS') fail('PER clear tt_psg_production_cert ≠ PASS');

  const cap = readJson(PATHS.capCert);
  const repro = readJson(PATHS.repro);
  const envA = readJson(PATHS.envAlign);
  const ladder = fs.existsSync(path.join(ROOT, PATHS.ladder))
    ? readJson(PATHS.ladder)
    : null;
  const foundationYml = readText(PATHS.foundation);
  const matrixYml = readText(PATHS.matrix);
  const liveGo = yamlField(matrixYml, 'TT_PRODUCTION_GO') || 'NO_GO';
  if (liveGo === 'GO') {
    fail('TT_PRODUCTION_GO already GO — refuse to regenerate pending Owner package');
  }

  const head = execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();

  const cited = {
    freeze_manifest: PATHS.freeze,
    freeze_manifest_id: freezeId,
    freeze_git_sha: freezeGit,
    production_cert: PATHS.prodCert,
    production_cert_stamp: prod.stamp_utc,
    production_entry: PATHS.entry,
    per_exit_clear: PATHS.perClear,
    capability_cert: PATHS.capCert,
    capability_cert_stamp: cap.stamp_utc,
    foundation_gate: PATHS.foundation,
    foundation_gate_status: yamlField(foundationYml, 'status') || 'PASS',
    repro: PATHS.repro,
    repro_status: repro.status,
    env_alignment: PATHS.envAlign,
    env_alignment_status: envA.status,
    module_ladder_signoff: ladder ? PATHS.ladder : null,
    module_ladder_status: ladder?.status || prod.module_ladder_confluence?.status || null,
  };

  const checklist = [
    {
      id: 'OD-01',
      item: 'Confirm freeze baseline RC-FREEZE-20260717T094900Z still FROZEN',
      cite: PATHS.freeze,
      required: true,
      owner_mark: '☐',
    },
    {
      id: 'OD-02',
      item: 'Confirm TT_PSG_PRODUCTION_CERT=PASS (locked) — do not re-run Production Cert',
      cite: PATHS.prodCert,
      required: true,
      owner_mark: '☐',
    },
    {
      id: 'OD-03',
      item: 'Confirm Step4 EXIT_READY · exit_blockers=[]',
      cite: PATHS.entry,
      required: true,
      owner_mark: '☐',
    },
    {
      id: 'OD-04',
      item: 'Confirm PER EXIT_BLOCKERS clear cites same freeze + PASS',
      cite: PATHS.perClear,
      required: true,
      owner_mark: '☐',
    },
    {
      id: 'OD-05',
      item: 'Confirm admission trio PASS (SSOT · Repro · Env) from locked cert JSON only',
      cite: PATHS.prodCert,
      required: true,
      owner_mark: '☐',
    },
    {
      id: 'OD-06',
      item: 'Confirm destructive suite PASS (no SKIPPED) from locked cert JSON only',
      cite: PATHS.prodCert,
      required: true,
      owner_mark: '☐',
    },
    {
      id: 'OD-07',
      item: 'Confirm Module Ladder Owner Non-blocking deferral on file (or Ladder PASS)',
      cite: PATHS.ladder,
      required: true,
      owner_mark: '☐',
    },
    {
      id: 'OD-08',
      item: 'Owner attestation: decision GO | NO_GO | GO_WITH_EXCEPTION + name + signed_utc',
      cite: 'owner_attestation block in this package',
      required: true,
      owner_mark: '☐',
    },
  ];

  const pkg = {
    schema: 'traveltrust.psg_rc_production_go_owner_decision.v1',
    machine_key: 'TT_PSG_RC_OWNER_DECISION',
    stamp_utc: STAMP,
    status: 'PENDING_OWNER_SIGNOFF',
    freeze_manifest_id: freezeId,
    workspace_git_sha: head,
    production_go: 'NO_GO',
    tt_psg_production_cert: 'PASS',
    discipline: {
      no_foundation_gate_rerun: true,
      no_alignment_audit_rerun: true,
      no_rc_freeze_rerun: true,
      no_capability_cert_rerun: true,
      no_production_cert_rerun: true,
      cite_locked_evidence_only: true,
    },
    cited,
    locked_production_cert: {
      status: prod.status,
      stamp_utc: prod.stamp_utc,
      admission: prod.admission,
      destructive_suite: prod.destructive_suite,
      domains: prod.domains,
      freeze_manifest_id: prod.freeze_manifest_id || freezeId,
    },
    step4: {
      status: entry.status,
      step4_exit_ready: entry.step4_exit_ready === true || entry.status === 'EXIT_READY',
      exit_blockers: entry.exit_blockers || [],
    },
    checklist,
    owner_attestation: {
      name: null,
      role: 'solo_owner',
      decision: null,
      allowed_decisions: ['GO', 'NO_GO', 'GO_WITH_EXCEPTION'],
      signed_utc: null,
      exceptions: [],
      notes: null,
      instruction:
        'Fill name + decision + signed_utc (ISO-8601). Only decision=GO unlocks atomic TT_PRODUCTION_GO write.',
    },
    atomic_go_apply: {
      when: 'After owner_attestation.decision=GO and checklist OD-01..OD-08 marked complete',
      command:
        'node scripts/dev/apply-psg-rc-production-go-after-owner-signoff.cjs --package evidence/GO_psg_foundation/production_go/OWNER-DECISION-PACKAGE-LATEST.json',
      effect: 'Atomically set registry/production-readiness-master-matrix.v1.yaml TT_PRODUCTION_GO: GO',
      forbids: [
        'Setting TT_PRODUCTION_GO=GO before Owner attestation',
        'Re-running any PASS Gate to claim GO',
        'Chat-only GO without this package',
      ],
    },
    honest_boundary:
      'PENDING_OWNER_SIGNOFF ≠ TT_PRODUCTION_GO: GO · Package assemble ≠ Gate re-run · Cap Cert/Production Cert remain cited only',
  };

  const md = `# PSG RC Step 5 · Owner Decision · Sign-off Checklist

**Package stamp:** \`${STAMP}\`  
**Freeze:** \`${freezeId}\`  
**TT_PSG_PRODUCTION_CERT:** \`PASS\` (locked · do not re-run)  
**TT_PRODUCTION_GO (live matrix):** \`${liveGo}\` — **must stay NO_GO until Owner signs + apply script**

## Cite-only evidence (no Gate re-run)

| Lane | Path | Status |
|------|------|--------|
| Freeze | \`${PATHS.freeze}\` | FROZEN |
| Production Cert | \`${PATHS.prodCert}\` | PASS · stamp \`${prod.stamp_utc}\` |
| Step4 Entry | \`${PATHS.entry}\` | EXIT_READY · blockers=0 |
| PER Clear | \`${PATHS.perClear}\` | PASS |
| Cap Cert (cite) | \`${PATHS.capCert}\` | ${cap.status} |
| Repro (cite) | \`${PATHS.repro}\` | ${repro.status} |
| Env Align (cite) | \`${PATHS.envAlign}\` | ${envA.status} |
| Ladder deferral | \`${PATHS.ladder}\` | ${ladder?.status || 'MISSING'} |

## Checklist (Owner)

${checklist.map((c) => `- ${c.owner_mark} **${c.id}** ${c.item}`).join('\n')}

## Owner attestation (edit JSON package)

In \`OWNER-DECISION-PACKAGE-LATEST.json\` set:

\`\`\`json
"owner_attestation": {
  "name": "Sebastian Ward",
  "role": "solo_owner",
  "decision": "GO",
  "signed_utc": "<ISO-8601 UTC>",
  "exceptions": [],
  "notes": null
}
\`\`\`

Allowed \`decision\`: \`GO\` · \`NO_GO\` · \`GO_WITH_EXCEPTION\`.

## Atomic GO (only after attestation = GO)

\`\`\`bash
node scripts/dev/apply-psg-rc-production-go-after-owner-signoff.cjs \\
  --package evidence/GO_psg_foundation/production_go/OWNER-DECISION-PACKAGE-LATEST.json
\`\`\`

**Forbidden:** re-run Foundation / Alignment / Freeze / Cap Cert / Production Cert to obtain GO.
`;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(LATEST_DIR, { recursive: true });
  fs.mkdirSync(PER_DIR, { recursive: true });

  const pkgName = 'OWNER-DECISION-PACKAGE.json';
  const mdName = 'OWNER-SIGNOFF-CHECKLIST.md';
  fs.writeFileSync(path.join(OUT_DIR, pkgName), `${JSON.stringify(pkg, null, 2)}\n`);
  fs.writeFileSync(path.join(OUT_DIR, mdName), md);
  fs.writeFileSync(path.join(LATEST_DIR, 'OWNER-DECISION-PACKAGE-LATEST.json'), `${JSON.stringify(pkg, null, 2)}\n`);
  fs.writeFileSync(path.join(LATEST_DIR, 'OWNER-SIGNOFF-CHECKLIST-LATEST.md'), md);
  fs.writeFileSync(path.join(PER_DIR, 'OWNER-DECISION-PACKAGE-LATEST.json'), `${JSON.stringify(pkg, null, 2)}\n`);
  fs.writeFileSync(path.join(PER_DIR, 'OWNER-SIGNOFF-CHECKLIST-LATEST.md'), md);

  // Refresh Step5 open pointer — still NO_GO
  const goOpen = {
    schema: 'traveltrust.psg_rc_production_go_open.v1',
    machine_key: 'TT_PSG_RC_PRODUCTION_GO',
    stamp_utc: STAMP,
    status: 'OWNER_DECISION_PENDING',
    freeze_manifest_id: freezeId,
    git_sha: head,
    tt_psg_production_cert: 'PASS',
    production_cert_stamp: prod.stamp_utc,
    step4_status: 'EXIT_READY',
    production_go: 'NO_GO',
    owner_decision_package: 'evidence/GO_psg_foundation/production_go/OWNER-DECISION-PACKAGE-LATEST.json',
    owner_signoff_checklist: 'evidence/GO_psg_foundation/production_go/OWNER-SIGNOFF-CHECKLIST-LATEST.md',
    honest_boundary:
      'OWNER_DECISION_PENDING ≠ TT_PRODUCTION_GO: GO · apply only after owner_attestation.decision=GO',
  };
  fs.writeFileSync(path.join(LATEST_DIR, 'PSG-RC-PRODUCTION-GO-LATEST.json'), `${JSON.stringify(goOpen, null, 2)}\n`);
  fs.writeFileSync(path.join(PER_DIR, 'PSG-RC-PRODUCTION-GO-LATEST.json'), `${JSON.stringify(goOpen, null, 2)}\n`);

  // Sequence note only (step already 5) — do not flip TT_PRODUCTION_GO
  let seq = readText(PATHS.sequence);
  if (/tt_psg_production_cert:\s*PASS/.test(seq)) {
    seq = seq.replace(
      /note:\s*>\s*\n(?: {4}.+\n)+/,
      `note: >
    Step 5 Owner Decision PENDING under freeze ${freezeId}.
    TT_PSG_PRODUCTION_CERT=PASS locked · package OWNER-DECISION-PACKAGE-LATEST.json.
    TT_PRODUCTION_GO remains NO_GO until Owner attestation + apply-psg-rc-production-go-after-owner-signoff.

`
    );
    fs.writeFileSync(path.join(ROOT, PATHS.sequence), seq);
  }

  console.log(`TT_PSG_RC_OWNER_DECISION: PENDING_OWNER_SIGNOFF stamp=${STAMP}`);
  console.log(`package: evidence/GO_psg_foundation/production_go/OWNER-DECISION-PACKAGE-LATEST.json`);
  console.log(`checklist: evidence/GO_psg_foundation/production_go/OWNER-SIGNOFF-CHECKLIST-LATEST.md`);
  console.log(`TT_PRODUCTION_GO: NO_GO (await Owner attestation + atomic apply)`);
}

main();
