#!/usr/bin/env node
/**
 * OCS Content L5 · Guide Identity Diversity Review
 * Required for guide-avatar slot (and future human-subject portraits when flagged).
 *
 *   node scripts/dev/run-ocs-content-l5-guide-identity-diversity-review.cjs \
 *     --filename ocs-seoul-food-guide-avatar.jpg --visual-pass
 *
 *   node scripts/dev/run-ocs-content-l5-guide-identity-diversity-review.cjs --all-guide-avatars --visual-pass
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const MATRIX = path.join(ROOT, 'data/official-cold-start/content-production-matrix.v1.yaml');
const DATASET = path.join(ROOT, 'data/official-cold-start/dataset.v1.json');
const EVIDENCE_ROWS = path.join(ROOT, 'evidence/GO_official_cold_start_dataset/ocs-content-l5/rows');
const EVIDENCE_ROOT = path.join(ROOT, 'evidence/GO_official_cold_start_dataset/ocs-content-l5');

const IDENTITY_CHECKS = [
  'no_high_face_collision_vs_other_guides',
  'age_layer_variation',
  'gender_presentation_distinct',
  'hair_style_distinct',
  'face_shape_distinct',
  'temperament_distinct',
  'local_professional_image',
  'multi_city_browse_not_same_person',
];

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
      copy_label: get('copy_label'),
      asset_status: get('asset_status'),
      review_status: get('review_status'),
    });
  }
  return rows;
}

function guidePeerSummary(chain) {
  return {
    chain_id: chain.id,
    city: chain.city,
    nickname: chain.guide?.nickname,
    bio_snippet: (chain.guide?.bio || '').slice(0, 60),
  };
}

function buildIdentityChecklist(visualPass, row, peers, manifestGuide) {
  const notes = visualPass
    ? `Distinct from ${peers.map((p) => p.chain_id).join(', ')}; multi-city browse will not read as same guide.`
    : 'pending_human — run with --visual-pass after visual comparison to other guide avatars';

  const checklist = {};
  for (const id of IDENTITY_CHECKS) {
    checklist[id] = { pass: visualPass, notes };
  }
  checklist.local_professional_image.notes = visualPass
    ? `${manifestGuide.nickname}: professional image matches ${row.city} guide role per bio.`
    : notes;
  return checklist;
}

function reviewOne(row, allGuideRows, chainById, opts) {
  if (row.slot !== 'guide-avatar') {
    console.error(`SKIP_NOT_GUIDE_AVATAR: ${row.filename}`);
    return null;
  }

  const chain = chainById.get(row.chain_id);
  const peers = allGuideRows
    .filter((r) => r.filename !== row.filename && r.asset_status === 'verified')
    .map((r) => guidePeerSummary(chainById.get(r.chain_id)))
    .filter((p) => p.chain_id);

  const visualPass = opts.visualPass;
  const checklist = buildIdentityChecklist(visualPass, row, peers, chain.guide || {});
  const pass =
    visualPass &&
    row.asset_status === 'verified' &&
    row.review_status === 'pass';

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const evidence = {
    schema: 'traveltrust.ocs_content_l5_guide_identity_diversity_review.v1',
    stamp_utc: stamp,
    filename: row.filename,
    chain_id: row.chain_id,
    city: row.city,
    guide_nickname: chain.guide?.nickname,
    peer_guides_compared: peers,
    identity_diversity_checklist: checklist,
    TT_GUIDE_IDENTITY_DIVERSITY_REVIEW: pass ? 'PASS' : visualPass ? 'FAIL' : 'PENDING',
  };

  fs.mkdirSync(EVIDENCE_ROWS, { recursive: true });
  const outPath = path.join(EVIDENCE_ROWS, `${row.filename.replace('.jpg', '')}.GUIDE-IDENTITY-DIVERSITY.json`);
  fs.writeFileSync(outPath, JSON.stringify(evidence, null, 2) + '\n');

  console.log(`TT_GUIDE_IDENTITY_DIVERSITY_REVIEW: ${evidence.TT_GUIDE_IDENTITY_DIVERSITY_REVIEW} file=${row.filename}`);
  console.log(`TT_GUIDE_IDENTITY_DIVERSITY_EVIDENCE: ${outPath}`);
  return { evidence, pass, outPath };
}

function main() {
  const filename = arg('--filename');
  const allGuideAvatars = process.argv.includes('--all-guide-avatars');
  const visualPass = process.argv.includes('--visual-pass');

  if (!filename && !allGuideAvatars) {
    console.error('usage: --filename ocs-*-guide-avatar.jpg [--visual-pass] | --all-guide-avatars [--visual-pass]');
    process.exit(2);
  }

  const matrixText = fs.readFileSync(MATRIX, 'utf8');
  const rows = parseMatrixRows(matrixText);
  const dataset = JSON.parse(fs.readFileSync(DATASET, 'utf8'));
  const chainById = new Map(dataset.chains.map((c) => [c.id, c]));
  const guideRows = rows.filter((r) => r.slot === 'guide-avatar');

  let targets = guideRows;
  if (filename) {
    targets = guideRows.filter((r) => r.filename === filename);
    if (!targets.length) {
      console.error(`GUIDE_AVATAR_NOT_IN_MATRIX: ${filename}`);
      process.exit(2);
    }
  } else {
    targets = guideRows.filter((r) => r.asset_status === 'verified' && r.review_status === 'pass');
  }

  const results = [];
  let allPass = true;

  for (const row of targets) {
    const result = reviewOne(row, guideRows, chainById, { visualPass });
    if (!result) continue;
    results.push({ filename: row.filename, pass: result.pass });
    if (!result.pass) allPass = false;
  }

  if (allGuideAvatars && results.length) {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const agg = {
      schema: 'traveltrust.ocs_content_l5_guide_identity_diversity_aggregate.v1',
      stamp_utc: stamp,
      guide_avatars_reviewed: results.length,
      TT_GUIDE_IDENTITY_DIVERSITY_AGGREGATE: allPass && visualPass ? 'PASS' : 'PENDING',
      rows: results,
      policy:
        '不同城市 Guide 不得高度撞脸；年龄/性别/发型/脸型/气质须有明显区别；连续浏览不会误认同一位向导。',
    };
    const aggPath = path.join(EVIDENCE_ROOT, `OCS-CONTENT-L5-GUIDE-IDENTITY-DIVERSITY-${results.length}-GUIDES.REVIEW.json`);
    fs.writeFileSync(aggPath, JSON.stringify(agg, null, 2) + '\n');
    console.log(`TT_GUIDE_IDENTITY_DIVERSITY_AGGREGATE: ${agg.TT_GUIDE_IDENTITY_DIVERSITY_AGGREGATE}`);
    console.log(`TT_GUIDE_IDENTITY_DIVERSITY_AGGREGATE_EVIDENCE: ${aggPath}`);
  }

  process.exit(allPass && visualPass ? 0 : 2);
}

main();
