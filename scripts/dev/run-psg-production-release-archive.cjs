#!/usr/bin/env node
/**
 * Immutable Release Archive — byte-copy Baseline cites only.
 * No Gate re-run · no Evidence regeneration · refuse overwrite.
 *
 *   node scripts/dev/run-psg-production-release-archive.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '../..');
const TAG = process.env.RELEASE_BASELINE_TAG || 'v1.1.0-psg-go.20260717';
const EXPECTED_SHA = '0bbc7adbd3142b111463fc398288ab94be5c0b84';
const EXPECTED_FREEZE = 'RC-FREEZE-20260717T094900Z';
const STAMP = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

function fail(m) {
  console.error(`TT_PSG_PRODUCTION_RELEASE_ARCHIVE: FAIL ${m}`);
  process.exit(2);
}

function sha256buf(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function main() {
  const baselinePath = path.join(ROOT, 'evidence/GO_psg_foundation/release_baseline/RELEASE-BASELINE-LATEST.json');
  if (!fs.existsSync(baselinePath)) fail('missing RELEASE-BASELINE-LATEST.json');
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  if (baseline.tag !== TAG) fail(`baseline tag ${baseline.tag} ≠ ${TAG}`);
  if (baseline.git_sha !== EXPECTED_SHA) fail(`baseline git_sha mismatch`);
  if (baseline.freeze_manifest_id !== EXPECTED_FREEZE) fail(`baseline freeze mismatch`);

  const extra = [
    'evidence/GO_psg_foundation/release_baseline/RELEASE-BASELINE-LATEST.json',
    `evidence/GO_psg_foundation/release_baseline/${baseline.stamp_utc}/RELEASE-BASELINE-MANIFEST.json`,
    'registry/psg-production-release-baseline-LATEST.v1.yaml',
    'docs/runbook/TT-PSG-PRODUCTION-RELEASE-BASELINE-LATEST.md',
  ];

  const paths = [];
  const seen = new Set();
  for (const c of baseline.cited_artifacts || []) {
    const p = String(c.path).replace(/\\/g, '/');
    if (!seen.has(p)) {
      seen.add(p);
      paths.push(p);
    }
  }
  for (const p of extra) {
    if (!seen.has(p)) {
      seen.add(p);
      paths.push(p);
    }
  }

  const archRoot = path.join(ROOT, 'evidence/GO_psg_foundation/release_archive', TAG);
  if (fs.existsSync(archRoot)) fail(`archive already exists (immutable): ${archRoot}`);
  const filesRoot = path.join(archRoot, 'files');
  fs.mkdirSync(filesRoot, { recursive: true });

  const citeSha = new Map((baseline.cited_artifacts || []).map((c) => [String(c.path).replace(/\\/g, '/'), c.sha256]));
  const entries = [];

  for (const rel of paths) {
    const src = path.join(ROOT, rel);
    if (!fs.existsSync(src) || !fs.statSync(src).isFile()) fail(`missing cite source: ${rel}`);
    const data = fs.readFileSync(src);
    const digest = sha256buf(data);
    if (citeSha.has(rel) && citeSha.get(rel) !== digest) {
      fail(`sha256 drift vs baseline cite: ${rel}`);
    }
    const dest = path.join(filesRoot, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, data);
    if (!fs.readFileSync(dest).equals(data)) fail(`copy mismatch: ${rel}`);
    entries.push({
      path: rel,
      archive_path: `files/${rel}`,
      sha256: digest,
      bytes: data.length,
    });
  }

  const manifest = {
    schema: 'traveltrust.psg_production_release_archive.v1',
    machine_key: 'TT_PSG_PRODUCTION_RELEASE_ARCHIVE',
    stamp_utc: STAMP,
    status: 'IMMUTABLE',
    tag: TAG,
    git_sha: EXPECTED_SHA,
    freeze_manifest_id: EXPECTED_FREEZE,
    baseline_manifest: 'evidence/GO_psg_foundation/release_baseline/RELEASE-BASELINE-LATEST.json',
    baseline_stamp_utc: baseline.stamp_utc,
    tt_psg_production_cert: baseline.tt_psg_production_cert,
    tt_production_go: baseline.tt_production_go,
    owner_attestation: baseline.owner_attestation,
    discipline: {
      byte_copy_only: true,
      no_content_mutation: true,
      no_gate_rerun: true,
      no_evidence_regeneration: true,
      overwrite_forbidden: true,
    },
    file_count: entries.length,
    files: entries,
    honest_boundary:
      'Archive is a byte-level freeze of Baseline cites + Baseline LATEST artifacts. ≠ re-Cert. ≠ new GO.',
  };

  let body = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  manifest.manifest_sha256 = sha256buf(body);
  body = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(archRoot, 'manifest.json'), body);

  const latest = {
    schema: 'traveltrust.psg_production_release_archive_latest.v1',
    machine_key: 'TT_PSG_PRODUCTION_RELEASE_ARCHIVE',
    tag: TAG,
    git_sha: EXPECTED_SHA,
    archive_dir: `evidence/GO_psg_foundation/release_archive/${TAG}`,
    manifest: `evidence/GO_psg_foundation/release_archive/${TAG}/manifest.json`,
    stamp_utc: STAMP,
    status: 'IMMUTABLE',
  };
  const latestJson = `${JSON.stringify(latest, null, 2)}\n`;
  fs.writeFileSync(path.join(ROOT, 'evidence/GO_psg_foundation/release_archive/RELEASE-ARCHIVE-LATEST.json'), latestJson);
  fs.writeFileSync(
    path.join(
      ROOT,
      'docs/spec/governance-token/evidence/phase3-production-entry-baseline/PER-EXIT-BLOCKERS/RELEASE-ARCHIVE-LATEST.json'
    ),
    latestJson
  );

  console.log(`TT_PSG_PRODUCTION_RELEASE_ARCHIVE: IMMUTABLE stamp=${STAMP}`);
  console.log(`archive_dir: evidence/GO_psg_foundation/release_archive/${TAG}`);
  console.log(`manifest: evidence/GO_psg_foundation/release_archive/${TAG}/manifest.json`);
  console.log(`file_count: ${entries.length}`);
  for (const e of entries) {
    console.log(`  ${e.sha256.slice(0, 12)}  ${e.path}`);
  }
}

main();
