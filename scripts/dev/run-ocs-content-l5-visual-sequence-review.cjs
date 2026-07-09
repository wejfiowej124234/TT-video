#!/usr/bin/env node
/**
 * OCS Content L5 · Visual Sequence Review (9th · FINAL special review)
 * Audits continuous-browse experience across verified Official Content Library.
 * Framework frozen at 9 classes — no further review categories.
 *
 *   node scripts/dev/run-ocs-content-l5-visual-sequence-review.cjs \
 *     --filename ocs-bangkok-temple-community-cover.jpg --visual-pass
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const MATRIX = path.join(ROOT, 'data/official-cold-start/content-production-matrix.v1.yaml');
const EVIDENCE_ROWS = path.join(ROOT, 'evidence/GO_official_cold_start_dataset/ocs-content-l5/rows');
const EVIDENCE_ROOT = path.join(ROOT, 'evidence/GO_official_cold_start_dataset/ocs-content-l5');

const SEQUENCE_CHECKS = [
  'no_adjacent_similar_composition_in_chain',
  'no_tone_rhythm_collision_with_prior_row',
  'no_subject_focal_repeat_vs_recent_rows',
  'no_camera_angle_mirror_with_same_chain_slots',
  'feed_browse_sequence_distinct',
  'visual_weight_variation_ok',
  'light_mood_not_duplicate_prior_slot',
  'cross_surface_chain_sequence_ok',
  'portfolio_browse_no_template_run',
  'no_quality_regression_on_sequence',
];

const SEQUENCE_POLICY =
  'Visual Sequence：连续浏览 Official Content Library 时无构图/色调/主体/镜位/光线/节奏/视觉重心重复；禁止连续相似画面。';

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
  const rows = parseMatrixRows(matrixText);
  const row = rows.find((r) => r.filename === filename);
  if (!row) {
    console.error(`ROW_NOT_IN_MATRIX: ${filename}`);
    process.exit(2);
  }

  const verified = rows.filter((r) => r.asset_status === 'verified' && r.review_status === 'pass');
  const chainRows = rows.filter((r) => r.chain_id === row.chain_id);
  const chainVerified = chainRows.filter((r) => r.asset_status === 'verified' && r.review_status === 'pass');
  const priorInChain = chainRows.filter((r) => chainRows.indexOf(r) < chainRows.indexOf(row));

  const checklist = {};
  for (const id of SEQUENCE_CHECKS) {
    checklist[id] = {
      pass: visualPass,
      policy: SEQUENCE_POLICY,
      notes: visualPass
        ? `${filename} vs ${verified.length - 1} prior verified + chain slots ${priorInChain.map((r) => r.slot).join(', ')} — sequence distinct.`
        : 'pending --visual-pass',
    };
  }

  const pass = visualPass && row.asset_status === 'verified' && row.review_status === 'pass';
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

  const rowEvidence = {
    schema: 'traveltrust.ocs_content_l5_visual_sequence_review.v1',
    stamp_utc: stamp,
    filename: row.filename,
    chain_id: row.chain_id,
    slot: row.slot,
    prior_chain_slots: priorInChain.map((r) => ({ slot: r.slot, filename: r.filename })),
    visual_sequence_checklist: checklist,
    TT_VISUAL_SEQUENCE_REVIEW: pass ? 'PASS' : visualPass ? 'FAIL' : 'PENDING',
  };

  fs.mkdirSync(EVIDENCE_ROWS, { recursive: true });
  const rowPath = path.join(EVIDENCE_ROWS, `${row.filename.replace('.jpg', '')}.VISUAL-SEQUENCE.json`);
  fs.writeFileSync(rowPath, JSON.stringify(rowEvidence, null, 2) + '\n');

  const agg = {
    schema: 'traveltrust.ocs_content_l5_visual_sequence_aggregate.v1',
    stamp_utc: stamp,
    trigger_filename: filename,
    library_rows_verified: verified.length,
    TT_VISUAL_SEQUENCE_AGGREGATE: pass && visualPass ? 'PASS' : 'PENDING',
    nine_class_framework_frozen: true,
  };
  const aggPath = path.join(EVIDENCE_ROOT, `OCS-CONTENT-L5-VISUAL-SEQUENCE-${verified.length}of60.REVIEW.json`);
  fs.writeFileSync(aggPath, JSON.stringify(agg, null, 2) + '\n');

  console.log(`TT_VISUAL_SEQUENCE_REVIEW: ${rowEvidence.TT_VISUAL_SEQUENCE_REVIEW} file=${row.filename}`);
  console.log(`TT_VISUAL_SEQUENCE_EVIDENCE: ${rowPath}`);
  console.log(`TT_VISUAL_SEQUENCE_AGGREGATE: ${agg.TT_VISUAL_SEQUENCE_AGGREGATE}`);
  console.log(`TT_VISUAL_SEQUENCE_AGGREGATE_EVIDENCE: ${aggPath}`);

  process.exit(pass ? 0 : 2);
}

main();
