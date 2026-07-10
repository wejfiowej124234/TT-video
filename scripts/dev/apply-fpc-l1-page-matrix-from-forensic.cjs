#!/usr/bin/env node
/**
 * Apply L1 layer1_surface_coverage from phase1 forensic-summary.json → page matrix.
 *
 *   node scripts/dev/apply-fpc-l1-page-matrix-from-forensic.cjs [forensic-summary.json]
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const MATRIX_PATH = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json'
);

const argPath = process.argv[2] || process.env.FPC_FORENSIC_SUMMARY;
if (!argPath) {
  console.error('Usage: node scripts/dev/apply-fpc-l1-page-matrix-from-forensic.cjs <forensic-summary.json>');
  process.exit(2);
}
const forensicPath = argPath;

const forensic = JSON.parse(fs.readFileSync(path.resolve(forensicPath), 'utf8'));
const matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));
const byRoute = new Map(forensic.pages.map((p) => [p.route, p]));

let updated = 0;
let missing = 0;
for (const page of matrix.pages) {
  const row = byRoute.get(page.route);
  if (!row) {
    missing += 1;
    continue;
  }
  page.layer1_surface_coverage = { ...page.layer1_surface_coverage, ...row.layer1_surface_coverage };
  page.fpc_batch = 'B23';
  page.evidence_path = path.relative(ROOT, forensicPath).replace(/\\/g, '/');
  updated += 1;
}

const l1Complete = (p) =>
  Object.values(p.layer1_surface_coverage || {}).every((v) => v === 'PASS' || v === 'N/A');

const done = matrix.pages.filter(l1Complete).length;
const total = matrix.pages.length;
matrix.timestamp_utc = new Date().toISOString();
matrix.coverage_summary = {
  ...matrix.coverage_summary,
  pages_total: total,
  pages_certified_pass: done,
  pages_certified_fail: 0,
  pages_not_started: total - done,
  coverage_pct: total ? Math.round((done / total) * 1000) / 10 : 0,
};
matrix.five_layers = {
  ...matrix.five_layers,
  L1_page_coverage:
    done === total
      ? `${total}/${total} layer1_surface_coverage PASS/N/A — B23 CLOSED at ①`
      : `${done}/${total} layer1_surface_coverage — B23 IN_PROGRESS`,
};
matrix.inventory = {
  ...matrix.inventory,
  page_tsx_count: forensic.pages_total || total,
  global_surfaces: forensic.global_surfaces || matrix.inventory?.global_surfaces,
};
matrix.b23_l1_apply = {
  forensic_summary: path.relative(ROOT, forensicPath).replace(/\\/g, '/'),
  updated,
  missing_routes_in_forensic: missing,
  l1_complete: done,
  applied_at_utc: matrix.timestamp_utc,
};

fs.writeFileSync(MATRIX_PATH, JSON.stringify(matrix, null, 2) + '\n');
console.log(`TT_FPC_L1_MATRIX_APPLY: updated=${updated} missing=${missing} l1=${done}/${total}`);
process.exit(done === total && missing === 0 && forensic.global_surfaces_ok !== false ? 0 : 1);
