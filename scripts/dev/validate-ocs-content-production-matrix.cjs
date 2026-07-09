#!/usr/bin/env node
/**
 * Validate OCS Content Production Matrix ↔ brief ↔ assets alignment.
 * Closure: all rows asset_status=verified review_status=pass → TT_CONTENT_PRODUCTION_MATRIX: PASS
 *
 *   node scripts/dev/validate-ocs-content-production-matrix.cjs
 *   node scripts/dev/validate-ocs-content-production-matrix.cjs --require-ready
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const MATRIX = path.join(ROOT, 'data/official-cold-start/content-production-matrix.v1.yaml');
const BRIEF = path.join(ROOT, 'data/official-cold-start/content-brief.v1.yaml');
const ASSETS = path.join(ROOT, 'data/official-cold-start/assets.v1.json');
const MEDIA = path.join(ROOT, 'data/official-cold-start/media');

function parseMatrixRows(text) {
  const rows = [];
  for (const block of text.split(/\n  - filename:/).slice(1)) {
    const filename = block.match(/^ (ocs-[a-z0-9-]+\.jpg)/)?.[1];
    if (!filename) continue;
    const get = (key) => block.match(new RegExp(`${key}: "?([^"\\n]+)"?`))?.[1]?.trim();
    rows.push({
      filename,
      chain_id: get('chain_id'),
      city: get('city'),
      slot: get('slot'),
      surface: get('surface'),
      asset_status: get('asset_status'),
      review_status: get('review_status'),
    });
  }
  return rows;
}

function briefFilenames(text) {
  return [...text.matchAll(/^\s+filename:\s+(ocs-[a-z0-9-]+\.jpg)\s*$/gm)].map((m) => m[1]);
}

function main() {
  const requireReady = process.argv.includes('--require-ready');
  if (!fs.existsSync(MATRIX)) {
    console.error('validate-ocs-content-production-matrix: MISSING', MATRIX);
    process.exit(2);
  }

  const rows = parseMatrixRows(fs.readFileSync(MATRIX, 'utf8'));
  const briefNames = briefFilenames(fs.readFileSync(BRIEF, 'utf8'));
  const assetsDoc = JSON.parse(fs.readFileSync(ASSETS, 'utf8'));
  const assetSet = new Set((assetsDoc.assets || []).map((a) => a.filename));

  if (rows.length !== 60) {
    console.error(`MATRIX_COUNT: expected 60 got ${rows.length}`);
    process.exit(2);
  }

  for (const fn of briefNames) {
    if (!rows.find((r) => r.filename === fn)) {
      console.error(`MATRIX_MISSING_ROW: ${fn}`);
      process.exit(2);
    }
  }

  for (const row of rows) {
    if (!assetSet.has(row.filename)) {
      console.error(`MATRIX_ORPHAN_ASSET: ${row.filename}`);
      process.exit(2);
    }
  }

  const pending = rows.filter((r) => r.asset_status === 'pending' || r.review_status === 'pending');
  const failed = rows.filter((r) => r.review_status === 'fail');
  const verified = rows.filter((r) => r.asset_status === 'verified' && r.review_status === 'pass');

  if (requireReady) {
    if (failed.length) {
      console.error(`MATRIX_REVIEW_FAIL: ${failed.length} rows`);
      process.exit(2);
    }
    if (verified.length !== 60) {
      console.error(`MATRIX_NOT_READY: verified+pass ${verified.length}/60 pending=${pending.length}`);
      process.exit(2);
    }
    for (const row of rows) {
      const mediaPath = path.join(MEDIA, row.filename);
      if (!fs.existsSync(mediaPath)) {
        console.error(`MATRIX_MEDIA_MISSING: ${row.filename}`);
        process.exit(2);
      }
      const size = fs.statSync(mediaPath).size;
      if (size <= 16 * 1024) {
        console.error(`MATRIX_PLACEHOLDER_SIZE: ${row.filename} ${size}B`);
        process.exit(2);
      }
    }
    console.log('TT_CONTENT_PRODUCTION_MATRIX: PASS rows=60 verified=60');
    return;
  }

  console.log(
    `TT_CONTENT_PRODUCTION_MATRIX_VALIDATE: PASS rows=60 verified=${verified.length} pending=${pending.length} fail=${failed.length}`,
  );
}

main();
