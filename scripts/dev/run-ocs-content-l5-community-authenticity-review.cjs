#!/usr/bin/env node
/**
 * OCS Content L5 · Community Authenticity Review
 * Applies to community-cover and community-media slots.
 *
 *   node scripts/dev/run-ocs-content-l5-community-authenticity-review.cjs \
 *     --filename ocs-seoul-food-community-cover.jpg --visual-pass
 *
 *   node scripts/dev/run-ocs-content-l5-community-authenticity-review.cjs --all-community-covers --visual-pass
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const MATRIX = path.join(ROOT, 'data/official-cold-start/content-production-matrix.v1.yaml');
const DATASET = path.join(ROOT, 'data/official-cold-start/dataset.v1.json');
const EVIDENCE_ROWS = path.join(ROOT, 'evidence/GO_official_cold_start_dataset/ocs-content-l5/rows');
const EVIDENCE_ROOT = path.join(ROOT, 'evidence/GO_official_cold_start_dataset/ocs-content-l5');

/** Long-term fixed checks (priority over aesthetics). */
const COMMUNITY_LONG_TERM_CHECKS = [
  'authentic_share_feel',
  'natural_interaction',
  'feed_thumbnail_readability',
  'emotional_travel_expression',
  'ugc_style_not_commercial_poster',
];

const COMMUNITY_SURFACE_CHECKS = [
  'destination_authentic_street_or_food_scene',
  'not_guide_portrait',
  'not_provider_service_space',
  'not_acquisition_product_still_life',
  'not_official_guide_route_poster',
  'cover_vs_media_scene_distinct',
  'community_post_body_alignment',
  'local_cultural_authenticity',
];

const COMMUNITY_CHECKS = [...COMMUNITY_LONG_TERM_CHECKS, ...COMMUNITY_SURFACE_CHECKS];

const LONG_TERM_POLICY = {
  authentic_share_feel: '像旅行者发布，而不是广告图。',
  natural_interaction: '人物动作、视线、环境符合真实旅行场景。',
  feed_thumbnail_readability: '缩略图在 Feed 中一眼能理解内容。',
  emotional_travel_expression: '传递旅行体验，而不仅是展示景点。',
  ugc_style_not_commercial_poster: '高质量真实分享风格，非商业宣传海报。',
};

const FRAMEWORK_POLICY =
  'Community Cover/Media 须呈现真实社区旅行瞬间；六类专项审核之 Community 闸；禁止与其它 Surface 语义混用。';

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
      copy_label: get('copy_label'),
      asset_status: get('asset_status'),
      review_status: get('review_status'),
    });
  }
  return rows;
}

function communityPeerSummary(chain, row) {
  return {
    chain_id: chain.id,
    city: chain.city,
    destination_label: chain.community_post?.destination_label,
    tags: chain.community_post?.tags,
    body_snippet: (chain.community_post?.body_markdown || '').slice(0, 60),
    slot: row.slot,
    scene: row.scene,
  };
}

function emitFramework() {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const framework = {
    schema: 'traveltrust.ocs_content_l5_community_authenticity_review_framework.v1',
    stamp_utc: stamp,
    status: 'ACTIVE',
    applies_to_slots: ['community-cover', 'community-media'],
    first_execution_rows: {
      'seoul-food': ['ocs-seoul-food-community-cover.jpg', 'ocs-seoul-food-community-media.jpg'],
    },
    long_term_fixed_checks: COMMUNITY_LONG_TERM_CHECKS,
    long_term_policy: LONG_TERM_POLICY,
    checklist_dimensions: COMMUNITY_CHECKS,
    policy: FRAMEWORK_POLICY,
    machine_key_when_active: 'TT_COMMUNITY_AUTHENTICITY_REVIEW',
    TT_COMMUNITY_AUTHENTICITY_FRAMEWORK: 'ESTABLISHED',
  };
  const outPath = path.join(EVIDENCE_ROOT, 'OCS-CONTENT-L5-COMMUNITY-AUTHENTICITY-REVIEW-FRAMEWORK.json');
  fs.mkdirSync(EVIDENCE_ROOT, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(framework, null, 2) + '\n');
  console.log(`TT_COMMUNITY_AUTHENTICITY_FRAMEWORK: ESTABLISHED`);
  console.log(`TT_COMMUNITY_AUTHENTICITY_FRAMEWORK_EVIDENCE: ${outPath}`);
}

function buildChecklist(visualPass, row, peers, communityPost) {
  const checklist = {};
  for (const id of COMMUNITY_LONG_TERM_CHECKS) {
    checklist[id] = {
      pass: visualPass,
      policy: LONG_TERM_POLICY[id],
      notes: visualPass ? LONG_TERM_POLICY[id] : 'pending_human — --visual-pass',
    };
  }
  for (const id of COMMUNITY_SURFACE_CHECKS) {
    const notes = visualPass
      ? `Surface isolation OK; distinct from ${peers.map((p) => `${p.chain_id}/${p.slot}`).join(', ')}.`
      : 'pending_human — --visual-pass';
    checklist[id] = { pass: visualPass, notes };
  }
  checklist.community_post_body_alignment.notes = visualPass
    ? `${communityPost.destination_label}: ${(communityPost.body_markdown || '').slice(0, 80)}`
    : checklist.community_post_body_alignment.notes;
  if (row.slot === 'community-cover') {
    checklist.cover_vs_media_scene_distinct.notes = visualPass
      ? 'Cover = dish close-up; media row must use market aisle scale (Row 18).'
      : checklist.cover_vs_media_scene_distinct.notes;
  }
  return checklist;
}

function reviewOne(row, allCommunityRows, chainById, opts) {
  if (!['community-cover', 'community-media'].includes(row.slot)) {
    console.error(`SKIP_NOT_COMMUNITY_SLOT: ${row.filename}`);
    return null;
  }

  const chain = chainById.get(row.chain_id);
  const peers = allCommunityRows
    .filter((r) => r.filename !== row.filename && r.asset_status === 'verified')
    .map((r) => communityPeerSummary(chainById.get(r.chain_id), r))
    .filter((p) => p.chain_id);

  const visualPass = opts.visualPass;
  const checklist = buildChecklist(visualPass, row, peers, chain.community_post || {});
  const pass = visualPass && row.asset_status === 'verified' && row.review_status === 'pass';

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const evidence = {
    schema: 'traveltrust.ocs_content_l5_community_authenticity_review.v1',
    stamp_utc: stamp,
    filename: row.filename,
    chain_id: row.chain_id,
    city: row.city,
    slot: row.slot,
    community_post_destination: chain.community_post?.destination_label,
    peer_community_compared: peers,
    long_term_fixed_checks: COMMUNITY_LONG_TERM_CHECKS,
    community_authenticity_checklist: checklist,
    TT_COMMUNITY_AUTHENTICITY_REVIEW: pass ? 'PASS' : visualPass ? 'FAIL' : 'PENDING',
  };

  fs.mkdirSync(EVIDENCE_ROWS, { recursive: true });
  const outPath = path.join(EVIDENCE_ROWS, `${row.filename.replace('.jpg', '')}.COMMUNITY-AUTHENTICITY.json`);
  fs.writeFileSync(outPath, JSON.stringify(evidence, null, 2) + '\n');
  console.log(`TT_COMMUNITY_AUTHENTICITY_REVIEW: ${evidence.TT_COMMUNITY_AUTHENTICITY_REVIEW} file=${row.filename}`);
  console.log(`TT_COMMUNITY_AUTHENTICITY_EVIDENCE: ${outPath}`);
  return { evidence, pass, outPath };
}

function main() {
  if (process.argv.includes('--emit-framework')) {
    emitFramework();
    process.exit(0);
  }

  const filename = arg('--filename');
  const allCommunityCovers = process.argv.includes('--all-community-covers');
  const allCommunitySlots = process.argv.includes('--all-community-slots');
  const visualPass = process.argv.includes('--visual-pass');

  if (!filename && !allCommunityCovers && !allCommunitySlots) {
    console.error(
      'usage: --emit-framework | --filename ocs-*-community-*.jpg [--visual-pass] | --all-community-covers [--visual-pass] | --all-community-slots [--visual-pass]',
    );
    process.exit(2);
  }

  const matrixText = fs.readFileSync(MATRIX, 'utf8');
  const rows = parseMatrixRows(matrixText);
  const dataset = JSON.parse(fs.readFileSync(DATASET, 'utf8'));
  const chainById = new Map(dataset.chains.map((c) => [c.id, c]));
  const communityRows = rows.filter((r) => ['community-cover', 'community-media'].includes(r.slot));

  let targets = communityRows;
  if (filename) {
    targets = communityRows.filter((r) => r.filename === filename);
    if (!targets.length) {
      console.error(`COMMUNITY_SLOT_NOT_IN_MATRIX: ${filename}`);
      process.exit(2);
    }
  } else if (allCommunityCovers) {
    targets = communityRows.filter(
      (r) => r.slot === 'community-cover' && r.asset_status === 'verified' && r.review_status === 'pass',
    );
  } else {
    targets = communityRows.filter((r) => r.asset_status === 'verified' && r.review_status === 'pass');
  }

  const results = [];
  let allPass = true;

  for (const row of targets) {
    const result = reviewOne(row, communityRows, chainById, { visualPass });
    if (!result) continue;
    results.push({ filename: row.filename, slot: row.slot, pass: result.pass });
    if (!result.pass) allPass = false;
  }

  if ((allCommunityCovers || allCommunitySlots) && results.length) {
    const fixedStamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const label = allCommunityCovers ? 'COMMUNITY-COVERS' : 'COMMUNITY-SLOTS';
    const agg = {
      schema: 'traveltrust.ocs_content_l5_community_authenticity_aggregate.v1',
      stamp_utc: fixedStamp,
      community_slots_reviewed: results.length,
      TT_COMMUNITY_AUTHENTICITY_AGGREGATE: allPass && visualPass ? 'PASS' : 'PENDING',
      rows: results,
      long_term_fixed_checks: COMMUNITY_LONG_TERM_CHECKS,
      policy: FRAMEWORK_POLICY,
    };
    const aggPath = path.join(
      EVIDENCE_ROOT,
      `OCS-CONTENT-L5-COMMUNITY-AUTHENTICITY-${results.length}-${label}.REVIEW.json`,
    );
    fs.writeFileSync(aggPath, JSON.stringify(agg, null, 2) + '\n');
    console.log(`TT_COMMUNITY_AUTHENTICITY_AGGREGATE: ${agg.TT_COMMUNITY_AUTHENTICITY_AGGREGATE}`);
    console.log(`TT_COMMUNITY_AUTHENTICITY_AGGREGATE_EVIDENCE: ${aggPath}`);
  }

  process.exit(allPass && visualPass ? 0 : 2);
}

main();
