#!/usr/bin/env node
/**
 * CMS Content L5 · Phase 0 baseline pack (governance only · no uploads).
 *
 *   node scripts/dev/run-cms-content-l5-baseline-pack.cjs
 *   node scripts/dev/run-cms-content-l5-baseline-pack.cjs --stamp 20260705T002000Z
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const REQUIRED = [
  'docs/runbook/TT-CMS-CONTENT-L5.md',
  'docs/runbook/TT-CMS-PHASE1-SINGLE-ASSET-TEMPLATE.md',
  'docs/runbook/TT-CMS-CHANGE-POLICY.md',
  'docs/runbook/TT-CONTENT-OWNERSHIP-POLICY.md',
  'docs/runbook/TT-MEDIA-PLATFORM-ARCHITECTURE.md',
  'data/catalog/cms-content-brief.v1.yaml',
  'data/catalog/destination-ambient-matrix.v1.yaml',
  'data/catalog/templates/cms-phase1-single-asset-evidence.v1.json',
  'registry/cms-content-l5.v1.yaml',
  'scripts/dev/run-cms-content-l5-destination-ambient-verify.cjs',
  'scripts/dev/scaffold-cms-phase1-single-asset-evidence.cjs',
  'scripts/dev/run-cms-phase1-single-asset-dod.cjs',
  'scripts/dev/run-cms-content-health-score.cjs',
  'scripts/dev/run-cms-content-l5-baseline-pack.cjs',
];

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function countMatrixRows(text) {
  return (text.match(/\n  - matrix_id:/g) || []).length;
}

function countLifecycle(text, state) {
  return (text.match(new RegExp(`asset_lifecycle: ${state}`, 'g')) || []).length;
}

function main() {
  const stamp = arg('--stamp') || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const outDir = path.join(ROOT, 'evidence/GO_cms_content_l5/baseline', stamp);
  fs.mkdirSync(outDir, { recursive: true });

  const missing = REQUIRED.filter((rel) => !fs.existsSync(path.join(ROOT, rel)));
  const matrixText = fs.readFileSync(path.join(ROOT, 'data/catalog/destination-ambient-matrix.v1.yaml'), 'utf8');
  const rows = countMatrixRows(matrixText);
  const draft = countLifecycle(matrixText, 'draft');

  const pass = missing.length === 0 && rows === 10 && draft === 10;

  const report = {
    schema: 'traveltrust.cms_content_l5_baseline.v1',
    stamp_utc: stamp,
    phase: 'CMS Content L5 · Phase 0 Baseline',
    product_name: 'Destination Ambient (first asset family)',
    lifecycle: ['brief', 'asset_matrix', 'designer_upload', 'cms_review', 'catalog_publish', 'verify', 'evidence', 'matrix_pass'],
    asset_lifecycle_enum: ['draft', 'review', 'approved', 'published', 'live', 'archived'],
    phase_1_country_order: ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU', 'ES', 'AE', 'CN'],
    four_layer_ownership: {
      priority_a: 'OCS Official Content',
      priority_b: 'CMS Operational Content',
      priority_c: 'Public Operations',
      priority_d: 'Media Platform (architecture only)',
    },
    artifacts: {
      brief: 'data/catalog/cms-content-brief.v1.yaml',
      matrix: 'data/catalog/destination-ambient-matrix.v1.yaml',
      registry: 'registry/cms-content-l5.v1.yaml',
      runbook: 'docs/runbook/TT-CMS-CONTENT-L5.md',
      phase1_single_asset_template: 'docs/runbook/TT-CMS-PHASE1-SINGLE-ASSET-TEMPLATE.md',
      phase1_evidence_template: 'data/catalog/templates/cms-phase1-single-asset-evidence.v1.json',
      change_policy: 'docs/runbook/TT-CMS-CHANGE-POLICY.md',
    },
    matrix_summary: {
      rows,
      asset_lifecycle_draft: draft,
      matrix_pass: 0,
      expected_phase0: 'all 10 rows asset_lifecycle=draft until Phase 1',
    },
    required_files: REQUIRED.map((r) => ({ path: r, exists: fs.existsSync(path.join(ROOT, r)) })),
    missing_files: missing,
    ocs_parity: {
      image_quality: true,
      brand_consistency: true,
      country_authenticity: true,
      diversity: true,
      wcag: true,
      manifest: 'OCS only',
      matrix: 'CMS Asset Matrix',
      revision: 'CMS required',
      publish: 'CMS Publish',
    },
    machine_keys: {
      TT_CMS_CONTENT_L5: pass ? 'BASELINE_ESTABLISHED' : 'FAIL',
      TT_CMS_CONTENT_L5_EXECUTION: 'NOT_STARTED',
      TT_CMS_CONTENT_L5_READY: 'NO',
      TT_CMS_DESTINATION_AMBIENT_MATRIX: 'ACTIVE',
    },
    next_phase: 'Phase 1 Wave 1 DA-JP-HOME → Wave 2 DA-KR-HOME → Wave 3+ sequential',
    honest_boundary: 'Baseline ≠ 10/10 Destination Ambient CLOSED ≠ Production GO',
    TT_CMS_CONTENT_L5_BASELINE: pass ? 'ESTABLISHED' : 'FAIL',
  };

  fs.writeFileSync(path.join(outDir, 'CMS-CONTENT-L5-BASELINE.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(
    path.join(ROOT, 'evidence/GO_cms_content_l5/CMS-CONTENT-L5-BASELINE-LATEST.json'),
    JSON.stringify(report, null, 2) + '\n',
  );

  execFileSync(process.execPath, [path.join(__dirname, 'run-cms-asset-matrix-pack.cjs'), '--stamp', stamp], {
    stdio: 'inherit',
  });
  execFileSync(process.execPath, [path.join(__dirname, 'run-cms-content-health-score.cjs'), '--stamp', stamp], {
    stdio: 'inherit',
  });

  console.log(`TT_CMS_CONTENT_L5_BASELINE: ${report.TT_CMS_CONTENT_L5_BASELINE}`);
  console.log(`TT_CMS_MATRIX_ROWS: ${rows} lifecycle_draft=${draft}`);
  console.log(`TT_CMS_EVIDENCE: evidence/GO_cms_content_l5/baseline/${stamp}`);
  process.exit(pass ? 0 : 1);
}

main();
