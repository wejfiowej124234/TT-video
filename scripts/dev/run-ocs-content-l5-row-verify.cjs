#!/usr/bin/env node
/**
 * OCS Content L5 · per-row verify (no batch skip).
 *
 *   node scripts/dev/run-ocs-content-l5-row-verify.cjs --filename ocs-tokyo-photo-provider-cover.jpg
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const MATRIX = path.join(ROOT, 'data/official-cold-start/content-production-matrix.v1.yaml');
const MEDIA = path.join(ROOT, 'data/official-cold-start/media');
const EVIDENCE_ROWS = path.join(ROOT, 'evidence/GO_official_cold_start_dataset/ocs-content-l5/rows');

const MIN_BYTES = 16 * 1024;

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function parseMatrixRow(text, filename) {
  const blocks = text.split(/\n  - filename:/);
  for (const block of blocks.slice(1)) {
    if (!block.startsWith(` ${filename}`)) continue;
    const get = (key) => block.match(new RegExp(`\\n    ${key}: "?([^"\\n]+)"?`))?.[1]?.trim();
    return {
      filename,
      chain_id: get('chain_id'),
      city: get('city'),
      slot: get('slot'),
      surface: get('surface'),
      scene: get('scene'),
      copy_label: get('copy_label'),
      asset_status: get('asset_status'),
      review_status: get('review_status'),
    };
  }
  return null;
}

function isJpeg(buf) {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

function main() {
  const filename = arg('--filename');
  if (!filename || !/^ocs-[a-z0-9-]+\.jpg$/.test(filename)) {
    console.error('usage: node run-ocs-content-l5-row-verify.cjs --filename ocs-<chain>-<slot>.jpg');
    process.exit(2);
  }

  const matrixText = fs.readFileSync(MATRIX, 'utf8');
  const row = parseMatrixRow(matrixText, filename);
  if (!row) {
    console.error(`ROW_NOT_IN_MATRIX: ${filename}`);
    process.exit(2);
  }

  const mediaPath = path.join(MEDIA, filename);
  const checks = [];
  let pass = true;

  if (!fs.existsSync(mediaPath)) {
    checks.push({ id: 'media_exists', pass: false, detail: 'missing file' });
    pass = false;
  } else {
    const buf = fs.readFileSync(mediaPath);
    const size = buf.length;
    const jpegOk = isJpeg(buf);
    const sizeOk = size > MIN_BYTES;
    checks.push({ id: 'media_exists', pass: true, detail: mediaPath });
    checks.push({ id: 'jpeg_magic', pass: jpegOk, detail: jpegOk ? 'ok' : 'not jpeg' });
    checks.push({ id: 'min_size_16kb', pass: sizeOk, detail: `${size} bytes` });
    if (!jpegOk || !sizeOk) pass = false;
  }

  checks.push({
    id: 'matrix_asset_status',
    pass: row.asset_status === 'verified' || row.asset_status === 'replaced',
    detail: row.asset_status,
  });
  checks.push({
    id: 'matrix_review_pass',
    pass: row.review_status === 'pass',
    detail: row.review_status,
  });

  if (row.review_status !== 'pass') pass = false;
  if (row.asset_status === 'pending') pass = false;

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const evidence = {
    schema: 'traveltrust.ocs_content_l5_row_verify.v1',
    stamp_utc: stamp,
    filename,
    row,
    checks,
    TT_OCS_CONTENT_L5_ROW_VERIFY: pass ? 'PASS' : 'FAIL',
    gates_manual: {
      G2_copy_alignment: 'pending_human',
      G3_slot_differentiation: 'pending_human',
      G9_content_authenticity: 'pending_human',
      G10_content_diversity: 'pending_human',
    },
  };

  fs.mkdirSync(EVIDENCE_ROWS, { recursive: true });
  const evidencePath = path.join(EVIDENCE_ROWS, `${filename.replace('.jpg', '')}.${stamp}.json`);
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2) + '\n');

  console.log(`TT_OCS_CONTENT_L5_ROW_VERIFY: ${evidence.TT_OCS_CONTENT_L5_ROW_VERIFY} file=${filename}`);
  console.log(`TT_OCS_CONTENT_L5_ROW_EVIDENCE: ${evidencePath}`);
  for (const c of checks) {
    console.log(`  ${c.pass ? 'PASS' : 'FAIL'} ${c.id} ${c.detail}`);
  }

  process.exit(pass ? 0 : 2);
}

main();
