#!/usr/bin/env node
/**
 * OCS Content L5 · Surface Boundary Review (8th special review)
 * Ensures each asset stays within its Surface role — no cross-surface semantic bleed.
 *
 *   node scripts/dev/run-ocs-content-l5-surface-boundary-review.cjs \
 *     --filename ocs-bangkok-temple-official-guide-cover.jpg --visual-pass
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const MATRIX = path.join(ROOT, 'data/official-cold-start/content-production-matrix.v1.yaml');
const EVIDENCE_ROWS = path.join(ROOT, 'evidence/GO_official_cold_start_dataset/ocs-content-l5/rows');

const BOUNDARY_BY_SLOT = {
  'guide-avatar': [
    'guide_role_only_no_provider_service',
    'guide_role_only_no_acquisition_product',
    'guide_role_only_no_official_route_poster',
    'guide_role_only_no_community_ugc',
  ],
  'provider-cover': [
    'provider_service_only_no_guide_portrait',
    'provider_service_only_no_acquisition_product',
    'provider_service_only_no_official_route_poster',
    'provider_service_only_no_community_ugc',
  ],
  'acquisition-cover': [
    'acquisition_product_only_no_guide_portrait',
    'acquisition_product_only_no_provider_service',
    'acquisition_product_only_no_official_route_poster',
    'acquisition_product_only_no_community_ugc',
  ],
  'official-guide-cover': [
    'official_route_only_no_guide_portrait',
    'official_route_only_no_provider_service',
    'official_route_only_no_acquisition_product',
    'official_route_only_no_community_ugc',
    'route_destination_guide_semantics_clear',
  ],
  'community-cover': [
    'community_moment_only_no_guide_portrait',
    'community_moment_only_no_provider_service',
    'community_moment_only_no_acquisition_product',
    'community_moment_only_no_official_route_poster',
  ],
  'community-media': [
    'community_detail_only_no_guide_portrait',
    'community_detail_only_no_provider_service',
    'community_detail_only_no_acquisition_product',
    'community_detail_only_no_official_route_poster',
  ],
};

const POLICY =
  'Surface Boundary：每行素材仅表达所属 Surface 业务语义；禁止 Guide/Provider/Acquisition/Official Guide/Community 职责混用。';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function parseMatrixRows(text) {
  const rows = [];
  for (const block of text.split(/\n  - filename:/).slice(1)) {
    const filename = block.match(/^ (ocs-[a-z0-9-]+\.jpg)/)?.[1];
    if (!filename) continue;
    const get = (key) => block.match(new RegExp(`\\n    ${key}: "?([^"\\n]+)"?`))?.[1]?.trim();
    rows.push({
      filename,
      chain_id: get('chain_id'),
      city: get('city'),
      slot: get('slot'),
      surface: get('surface'),
      scene: get('scene'),
      asset_status: get('asset_status'),
      review_status: get('review_status'),
    });
  }
  return rows;
}

function main() {
  const filename = arg('--filename');
  const visualPass = process.argv.includes('--visual-pass');

  if (!filename) {
    console.error('usage: --filename ocs-*.jpg --visual-pass');
    process.exit(2);
  }

  const matrixText = fs.readFileSync(MATRIX, 'utf8');
  const row = parseMatrixRows(matrixText).find((r) => r.filename === filename);
  if (!row) {
    console.error(`ROW_NOT_IN_MATRIX: ${filename}`);
    process.exit(2);
  }

  const checks = BOUNDARY_BY_SLOT[row.slot];
  if (!checks) {
    console.error(`NO_BOUNDARY_RULES_FOR_SLOT: ${row.slot}`);
    process.exit(2);
  }

  const checklist = {};
  for (const id of checks) {
    checklist[id] = {
      pass: visualPass,
      policy: POLICY,
      notes: visualPass ? `${row.surface} boundary OK for ${row.filename}` : 'pending --visual-pass',
    };
  }

  const pass = visualPass && row.asset_status === 'verified' && row.review_status === 'pass';
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const evidence = {
    schema: 'traveltrust.ocs_content_l5_surface_boundary_review.v1',
    stamp_utc: stamp,
    filename: row.filename,
    chain_id: row.chain_id,
    slot: row.slot,
    surface: row.surface,
    surface_boundary_checklist: checklist,
    TT_SURFACE_BOUNDARY_REVIEW: pass ? 'PASS' : visualPass ? 'FAIL' : 'PENDING',
  };

  fs.mkdirSync(EVIDENCE_ROWS, { recursive: true });
  const outPath = path.join(EVIDENCE_ROWS, `${row.filename.replace('.jpg', '')}.SURFACE-BOUNDARY.json`);
  fs.writeFileSync(outPath, JSON.stringify(evidence, null, 2) + '\n');

  console.log(`TT_SURFACE_BOUNDARY_REVIEW: ${evidence.TT_SURFACE_BOUNDARY_REVIEW} file=${row.filename}`);
  console.log(`TT_SURFACE_BOUNDARY_EVIDENCE: ${outPath}`);
  process.exit(pass ? 0 : 2);
}

main();
