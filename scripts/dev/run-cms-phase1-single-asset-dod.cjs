#!/usr/bin/env node
/**
 * CMS Phase 1 · single-asset Definition of Done check.
 *
 *   node scripts/dev/run-cms-phase1-single-asset-dod.cjs --matrix-id DA-JP-HOME
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const MATRIX = path.join(ROOT, 'data/catalog/destination-ambient-matrix.v1.yaml');
const EVID_DIR = path.join(ROOT, 'evidence/GO_cms_content_l5/destination-ambient/rows');

const GATES = [
  'brief_review',
  'cms_review',
  'destination_authenticity',
  'brand_consistency',
  'catalog_publish',
  'verify',
  'evidence_complete',
];

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function parseMatrixRow(text, matrixId) {
  const blocks = text.split(/\n  - matrix_id:/);
  for (const block of blocks.slice(1)) {
    if (!block.startsWith(` ${matrixId}`)) continue;
    const get = (key) => block.match(new RegExp(`\\n    ${key}: "?([^"\\n]+)"?`))?.[1]?.trim();
    const gatesBlock = block.match(/\n    execution_gates:[\s\S]*?(?=\n    asset_version:|\n    catalog_)/);
    const gates = {};
    for (const g of GATES) {
      const m = gatesBlock?.[0].match(new RegExp(`\\n      ${g}: (.+)`));
      gates[g] = m ? m[1].trim().replace(/^"|"$/g, '') : null;
    }
    return {
      matrix_id: matrixId,
      asset_lifecycle: get('asset_lifecycle'),
      matrix_row_status: get('matrix_row_status'),
      execution_gates: gates,
    };
  }
  return null;
}

function main() {
  const matrixId = arg('--matrix-id');
  if (!matrixId || !/^DA-[A-Z]{2}-[A-Z_]+$/.test(matrixId)) {
    console.error('usage: node run-cms-phase1-single-asset-dod.cjs --matrix-id DA-JP-HOME');
    process.exit(2);
  }

  const row = parseMatrixRow(fs.readFileSync(MATRIX, 'utf8'), matrixId);
  if (!row) {
    console.error(`ROW_NOT_IN_MATRIX: ${matrixId}`);
    process.exit(2);
  }

  const evidPath = path.join(EVID_DIR, `${matrixId}.EVIDENCE.json`);
  const checks = [];
  let pass = true;

  for (const g of GATES) {
    const ok = row.execution_gates[g] === 'PASS';
    checks.push({ id: `execution_gate_${g}`, pass: ok, detail: row.execution_gates[g] });
    if (!ok) pass = false;
  }

  checks.push({
    id: 'matrix_row_status_pass',
    pass: row.matrix_row_status === 'pass',
    detail: row.matrix_row_status,
  });
  checks.push({
    id: 'asset_lifecycle_live',
    pass: row.asset_lifecycle === 'live',
    detail: row.asset_lifecycle,
  });
  checks.push({
    id: 'evidence_file_exists',
    pass: fs.existsSync(evidPath),
    detail: evidPath.replace(/\\/g, '/'),
  });

  if (row.matrix_row_status !== 'pass') pass = false;
  if (row.asset_lifecycle !== 'live') pass = false;
  if (!fs.existsSync(evidPath)) pass = false;

  let evidence = null;
  if (fs.existsSync(evidPath)) {
    evidence = JSON.parse(fs.readFileSync(evidPath, 'utf8'));
    const verifyOk = evidence.TT_CMS_DESTINATION_AMBIENT_ROW_VERIFY === 'PASS';
    checks.push({
      id: 'evidence_row_verify_pass',
      pass: verifyOk,
      detail: evidence.TT_CMS_DESTINATION_AMBIENT_ROW_VERIFY,
    });
    if (!verifyOk) pass = false;

    evidence.definition_of_done = {
      brief_review_pass: row.execution_gates.brief_review === 'PASS',
      cms_review_pass: row.execution_gates.cms_review === 'PASS',
      destination_authenticity_pass: row.execution_gates.destination_authenticity === 'PASS',
      brand_consistency_pass: row.execution_gates.brand_consistency === 'PASS',
      catalog_publish_pass: row.execution_gates.catalog_publish === 'PASS',
      verify_pass: row.execution_gates.verify === 'PASS',
      evidence_complete: row.execution_gates.evidence_complete === 'PASS',
      matrix_row_pass: row.matrix_row_status === 'pass',
      asset_lifecycle_live: row.asset_lifecycle === 'live',
    };
    evidence.TT_CMS_PHASE1_SINGLE_ASSET_ROW = pass ? 'COMPLETE' : 'INCOMPLETE';
    evidence.dod_checked_at_utc = new Date().toISOString();
    evidence.dod_checks = checks;
    fs.writeFileSync(evidPath, JSON.stringify(evidence, null, 2) + '\n');
  }

  console.log(`TT_CMS_PHASE1_SINGLE_ASSET_ROW: ${pass ? 'COMPLETE' : 'INCOMPLETE'}`);
  console.log(`TT_CMS_MATRIX_ID: ${matrixId}`);
  console.log(`TT_CMS_EVIDENCE: ${evidPath.replace(/\\/g, '/')}`);
  for (const c of checks.filter((x) => !x.pass)) {
    console.log(`TT_CMS_DOD_FAIL: ${c.id}=${c.detail}`);
  }
  process.exit(pass ? 0 : 1);
}

main();
