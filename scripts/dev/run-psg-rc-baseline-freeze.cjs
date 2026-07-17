#!/usr/bin/env node
/**
 * PSG RC Step 2.5 · Baseline Freeze (R2 Freeze Manifest)
 *
 * Does NOT re-run Foundation Gate or start Capability Certification.
 * Reads existing foundation_gate LATEST + Alignment Audit LATEST, then freezes.
 *
 *   node scripts/dev/run-psg-rc-baseline-freeze.cjs
 */
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const FOUNDATION = path.join(ROOT, 'registry/psg-foundation-gate-LATEST.v1.yaml');
const ALIGNMENT_JSON = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/LOCAL-STAGING-FULL-ALIGNMENT-AUDIT-LATEST.json'
);
const FREEZE_OUT = path.join(ROOT, 'registry/psg-release-candidate-freeze-LATEST.v1.yaml');
const SEQUENCE = path.join(ROOT, 'registry/psg-release-candidate-sequence.v1.yaml');
const CMS_MATRIX = path.join(ROOT, 'data/catalog/cms-asset-matrix.v1.yaml');

function sha256File(abs) {
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

function sha256Tree(relDir) {
  const abs = path.join(ROOT, relDir);
  const files = [];
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else files.push(p);
    }
  };
  walk(abs);
  files.sort();
  const h = crypto.createHash('sha256');
  for (const f of files) {
    h.update(path.relative(ROOT, f).replace(/\\/g, '/'));
    h.update('\0');
    h.update(fs.readFileSync(f));
    h.update('\0');
  }
  return h.digest('hex');
}

function parseYamlSimpleStatus(text) {
  const m = text.match(/^\s*status:\s*(\S+)/m);
  return m ? m[1].replace(/['"]/g, '') : null;
}

function migrationHead() {
  const dir = path.join(ROOT, 'crates/api/migrations');
  const names = fs
    .readdirSync(dir)
    .filter((n) => n.endsWith('.sql'))
    .sort();
  return names[names.length - 1] || null;
}

function fail(msg) {
  console.error(`TT_PSG_RC_BASELINE_FREEZE: FAIL ${msg}`);
  process.exit(2);
}

function main() {
  if (!fs.existsSync(FOUNDATION)) fail('missing registry/psg-foundation-gate-LATEST.v1.yaml');
  if (!fs.existsSync(ALIGNMENT_JSON)) fail('missing LOCAL-STAGING-FULL-ALIGNMENT-AUDIT-LATEST.json');

  const foundationText = fs.readFileSync(FOUNDATION, 'utf8');
  if (!/foundation_gate:\s*\n\s*status:\s*PASS/.test(foundationText)) {
    fail('foundation_gate.status must be PASS (read existing; do not re-run Foundation Gate)');
  }
  const fgStamp = (foundationText.match(/stamp_utc:\s*"?([^"\n]+)"?/) || [])[1] || null;

  const alignment = JSON.parse(fs.readFileSync(ALIGNMENT_JSON, 'utf8'));
  if (Number(alignment.blocking_count) !== 0) {
    fail(`alignment blocking_count=${alignment.blocking_count} (need 0)`);
  }
  if (!['LOCAL_SSOT_READY', 'ALIGNED'].includes(alignment.verdict)) {
    fail(`alignment verdict=${alignment.verdict} (need LOCAL_SSOT_READY|ALIGNED)`);
  }

  const existing = fs.existsSync(FREEZE_OUT) ? fs.readFileSync(FREEZE_OUT, 'utf8') : '';
  if (/^status:\s*FROZEN/m.test(existing)) {
    const id = (existing.match(/freeze_manifest_id:\s*(\S+)/) || [])[1];
    console.log(`TT_PSG_RC_BASELINE_FREEZE: ALREADY_FROZEN freeze_manifest_id=${id}`);
    process.exit(0);
  }

  const gitSha = execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const freezeId = `RC-FREEZE-${stamp}`;
  const registrySha = sha256Tree('registry');
  const mig = migrationHead();
  const configFp = sha256File(path.join(ROOT, '.env.example'));
  const cmsSnap = fs.existsSync(CMS_MATRIX)
    ? `cms-asset-matrix:${sha256File(CMS_MATRIX).slice(0, 16)}`
    : 'cms-asset-matrix:missing';
  const runtimeBuildId = `local-api-meta:${alignment.runtime?.local_api_health || 'unknown'}|web:${alignment.runtime?.local_web || 'unknown'}|git:${gitSha.slice(0, 12)}`;

  const evidDir = path.join(
    ROOT,
    'docs/spec/governance-token/evidence/phase3-production-entry-baseline',
    `RC-BASELINE-FREEZE-${stamp}`
  );
  fs.mkdirSync(evidDir, { recursive: true });

  const yaml = `# Freeze Manifest · immutable Release Candidate pointer (R2)
# Written only at Step 2.5 by freeze procedure. Capability Cert MUST cite freeze_manifest_id.
schema: traveltrust.psg_release_candidate_freeze_manifest.v1
machine_key: TT_PSG_RC_BASELINE_FREEZE
sequence_ssot: registry/psg-release-candidate-sequence.v1.yaml
human: docs/runbook/TT-PSG-RELEASE-CANDIDATE-SEQUENCE.md

status: FROZEN
# When FROZEN, status=FROZEN and fields below are immutable until THAWED for Blocking Defect only.

freeze_manifest:
  freeze_manifest_id: ${freezeId}
  frozen_utc: "${new Date().toISOString()}"
  git_sha: ${gitSha}
  registry_sha: ${registrySha}
  migration_version: ${mig}
  config_fingerprint: ${configFp}
  cms_snapshot_id: ${cmsSnap}
  runtime_build_id: "${runtimeBuildId}"
  foundation_gate_stamp: ${fgStamp}
  alignment_audit_stamp: ${alignment.stamp}
  evidence_refs:
    - docs/spec/governance-token/evidence/phase3-production-entry-baseline/LOCAL-STAGING-FULL-ALIGNMENT-AUDIT-LATEST.json
    - registry/psg-foundation-gate-LATEST.v1.yaml
    - docs/spec/governance-token/evidence/phase3-production-entry-baseline/ALIGNMENT-FIX-STEP2-CLOSEOUT-LATEST.json

cert_citation_rule: >
  Capability Certification artifacts MUST set freeze_manifest_id (and optionally
  copy git_sha for display). They MUST NOT assemble a parallel baseline from
  ad-hoc SHA / migration / CMS sources.

unlock_only_when: Blocking Defect invalidating frozen baseline
on_thaw: "status=THAWED · invalidate Step-3 certs citing this freeze_manifest_id · re-run Steps 1–2.5"

honest_boundary: "FROZEN ≠ Capability Cert started ≠ TT_PSG_PRODUCTION_CERT=PASS ≠ Production GO"
machine_line: TT_PSG_RC_BASELINE_FREEZE: FROZEN
`;

  fs.writeFileSync(FREEZE_OUT, yaml, 'utf8');
  fs.writeFileSync(path.join(evidDir, 'FREEZE-MANIFEST.yaml'), yaml, 'utf8');
  fs.writeFileSync(
    path.join(evidDir, 'freeze-summary.json'),
    JSON.stringify(
      {
        schema: 'traveltrust.psg_rc_baseline_freeze_summary.v1',
        freeze_manifest_id: freezeId,
        status: 'FROZEN',
        git_sha: gitSha,
        alignment_stamp: alignment.stamp,
        alignment_verdict: alignment.verdict,
        blocking_count: alignment.blocking_count,
        foundation_gate_stamp: fgStamp,
        no_foundation_rerun: true,
        no_capability_cert_started: true,
      },
      null,
      2
    ),
    'utf8'
  );

  // Advance sequence current pointer (minimal surgical replace of current: block fields).
  let seq = fs.readFileSync(SEQUENCE, 'utf8');
  seq = seq.replace(/^  step:\s*\d+/m, '  step: 2.5');
  seq = seq.replace(/^  step_id:\s*\S+/m, '  step_id: baseline_freeze');
  seq = seq.replace(/^  rc_freeze:\s*\S+/m, '  rc_freeze: FROZEN');
  seq = seq.replace(/^  freeze_manifest_id:\s*\S+/m, `  freeze_manifest_id: ${freezeId}`);
  seq = seq.replace(/^  foundation_gate_status:\s*\S+/m, '  foundation_gate_status: PASS');
  seq = seq.replace(
    /^  note:\s*>[\s\S]*?(?=\n# ── Anti-patterns)/m,
    `  note: >
    Step 2 Alignment LOCAL_SSOT_READY (blocking=0) recorded; Step 2.5 Baseline Freeze
    FROZEN (${freezeId}). Capability Certification NOT started — cite freeze_manifest_id only.

`
  );
  fs.writeFileSync(SEQUENCE, seq, 'utf8');

  console.log(`TT_PSG_RC_BASELINE_FREEZE: FROZEN freeze_manifest_id=${freezeId}`);
  console.log(`evidence: ${path.relative(ROOT, evidDir).replace(/\\/g, '/')}`);
  console.log('next: Capability Certification (Step 3) — not started by this script');
}

main();
