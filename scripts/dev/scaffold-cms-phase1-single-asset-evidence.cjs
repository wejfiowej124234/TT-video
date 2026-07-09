#!/usr/bin/env node
/**
 * CMS Phase 1 · scaffold single-asset evidence JSON from Matrix row.
 *
 *   node scripts/dev/scaffold-cms-phase1-single-asset-evidence.cjs --matrix-id DA-JP-HOME
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const MATRIX = path.join(ROOT, 'data/catalog/destination-ambient-matrix.v1.yaml');
const TEMPLATE = path.join(ROOT, 'data/catalog/templates/cms-phase1-single-asset-evidence.v1.json');
const OUT_DIR = path.join(ROOT, 'evidence/GO_cms_content_l5/destination-ambient/rows');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function parseMatrixRow(text, matrixId) {
  const blocks = text.split(/\n  - matrix_id:/);
  for (const block of blocks.slice(1)) {
    if (!block.startsWith(` ${matrixId}`)) continue;
    const get = (key) => block.match(new RegExp(`\\n    ${key}: "?([^"\\n]+)"?`))?.[1]?.trim();
    return {
      matrix_id: matrixId,
      execution_order: Number(get('execution_order')),
      country_zh: get('country_zh'),
      country_iso: get('country_iso'),
      surface: get('surface'),
      scene: get('scene'),
      copy_label: get('copy_label'),
      asset_lifecycle: get('asset_lifecycle'),
      matrix_row_status: get('matrix_row_status'),
      current_source: get('current_source'),
    };
  }
  return null;
}

function main() {
  const matrixId = arg('--matrix-id');
  if (!matrixId || !/^DA-[A-Z]{2}-[A-Z_]+$/.test(matrixId)) {
    console.error('usage: node scaffold-cms-phase1-single-asset-evidence.cjs --matrix-id DA-JP-HOME');
    process.exit(2);
  }

  const row = parseMatrixRow(fs.readFileSync(MATRIX, 'utf8'), matrixId);
  if (!row) {
    console.error(`ROW_NOT_IN_MATRIX: ${matrixId}`);
    process.exit(2);
  }

  const stamp = new Date().toISOString();
  const tpl = JSON.parse(fs.readFileSync(TEMPLATE, 'utf8'));
  const out = {
    ...tpl,
    matrix_id: matrixId,
    country_iso: row.country_iso,
    execution_order: row.execution_order,
    scaffolded_at_utc: stamp,
    matrix_snapshot: {
      matrix_row_status: row.matrix_row_status,
      asset_lifecycle: row.asset_lifecycle,
      current_source: row.current_source,
      public_url: null,
      country_zh: row.country_zh,
      scene: row.scene,
      copy_label: row.copy_label,
      surface: row.surface,
    },
    TT_CMS_PHASE1_SINGLE_ASSET_ROW: 'IN_PROGRESS',
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, `${matrixId}.EVIDENCE.json`);
  if (fs.existsSync(outPath) && !process.argv.includes('--force')) {
    console.error(`EVIDENCE_EXISTS: ${outPath.replace(/\\/g, '/')} (use --force to overwrite)`);
    process.exit(1);
  }
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');

  console.log(`TT_CMS_PHASE1_EVIDENCE_SCAFFOLD: OK`);
  console.log(`TT_CMS_MATRIX_ID: ${matrixId}`);
  console.log(`TT_CMS_EVIDENCE: ${outPath.replace(/\\/g, '/')}`);
  console.log(`TT_CMS_PHASE1_SINGLE_ASSET_ROW: IN_PROGRESS`);
}

main();
