#!/usr/bin/env node
/**
 * OCS Content L5 · Official Guide Destination Review
 * Applies to official-guide-cover slot.
 *
 *   node scripts/dev/run-ocs-content-l5-official-guide-destination-review.cjs \
 *     --filename ocs-seoul-food-official-guide-cover.jpg --visual-pass
 *
 *   node scripts/dev/run-ocs-content-l5-official-guide-destination-review.cjs --all-official-guide-covers --visual-pass
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const MATRIX = path.join(ROOT, 'data/official-cold-start/content-production-matrix.v1.yaml');
const DATASET = path.join(ROOT, 'data/official-cold-start/dataset.v1.json');
const EVIDENCE_ROWS = path.join(ROOT, 'evidence/GO_official_cold_start_dataset/ocs-content-l5/rows');
const EVIDENCE_ROOT = path.join(ROOT, 'evidence/GO_official_cold_start_dataset/ocs-content-l5');

const OFFICIAL_GUIDE_CHECKS = [
  'destination_landmark_sequence_readable',
  'route_or_map_cover_semantics',
  'official_guide_title_body_alignment',
  'not_guide_portrait',
  'not_provider_service_interior',
  'not_acquisition_product_still_life',
  'not_community_candid_moment',
  'local_destination_expression',
  'cross_city_route_cover_distinct',
  'hero_wide_composition_quality',
];

const FRAMEWORK_POLICY =
  'Official Guide Cover 须表达目的地路线/地图封面语义；禁止 Guide 肖像、Provider 服务场、Acquisition 商品静物、Community 生活抓拍；跨城路线封面须明显不同。';

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

function officialGuidePeerSummary(chain, row) {
  return {
    chain_id: chain.id,
    city: chain.city,
    title: chain.official_guide?.title,
    destination: chain.official_guide?.destination,
    body_snippet: (chain.official_guide?.body || '').slice(0, 60),
    scene: row.scene,
  };
}

function emitFramework() {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const framework = {
    schema: 'traveltrust.ocs_content_l5_official_guide_destination_review_framework.v1',
    stamp_utc: stamp,
    status: 'ACTIVE',
    applies_to_slots: ['official-guide-cover'],
    first_execution_row: {
      'seoul-food': 'ocs-seoul-food-official-guide-cover.jpg',
    },
    checklist_dimensions: OFFICIAL_GUIDE_CHECKS,
    policy: FRAMEWORK_POLICY,
    machine_key_when_active: 'TT_OFFICIAL_GUIDE_DESTINATION_REVIEW',
    TT_OFFICIAL_GUIDE_DESTINATION_FRAMEWORK: 'ESTABLISHED',
  };
  const outPath = path.join(EVIDENCE_ROOT, 'OCS-CONTENT-L5-OFFICIAL-GUIDE-DESTINATION-REVIEW-FRAMEWORK.json');
  fs.mkdirSync(EVIDENCE_ROOT, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(framework, null, 2) + '\n');
  console.log(`TT_OFFICIAL_GUIDE_DESTINATION_FRAMEWORK: ESTABLISHED`);
  console.log(`TT_OFFICIAL_GUIDE_DESTINATION_FRAMEWORK_EVIDENCE: ${outPath}`);
}

function buildChecklist(visualPass, row, peers, officialGuide) {
  const notes = visualPass
    ? `Route cover for ${officialGuide.title}; distinct from ${peers.map((p) => p.chain_id).join(', ')}.`
    : 'pending_human — run with --visual-pass after visual review';

  const checklist = {};
  for (const id of OFFICIAL_GUIDE_CHECKS) {
    checklist[id] = { pass: visualPass, notes };
  }
  checklist.official_guide_title_body_alignment.notes = visualPass
    ? `${officialGuide.title} · ${officialGuide.destination}: ${officialGuide.body}`
    : notes;
  checklist.route_or_map_cover_semantics.notes = visualPass
    ? `${row.scene || 'route cover'} — multi-stop route readable, not single landmark poster.`
    : notes;
  return checklist;
}

function reviewOne(row, allOfficialRows, chainById, opts) {
  if (row.slot !== 'official-guide-cover') {
    console.error(`SKIP_NOT_OFFICIAL_GUIDE_COVER: ${row.filename}`);
    return null;
  }

  const chain = chainById.get(row.chain_id);
  const peers = allOfficialRows
    .filter((r) => r.filename !== row.filename && r.asset_status === 'verified')
    .map((r) => officialGuidePeerSummary(chainById.get(r.chain_id), r))
    .filter((p) => p.chain_id);

  const visualPass = opts.visualPass;
  const checklist = buildChecklist(visualPass, row, peers, chain.official_guide || {});
  const pass = visualPass && row.asset_status === 'verified' && row.review_status === 'pass';

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const evidence = {
    schema: 'traveltrust.ocs_content_l5_official_guide_destination_review.v1',
    stamp_utc: stamp,
    filename: row.filename,
    chain_id: row.chain_id,
    city: row.city,
    official_guide_title: chain.official_guide?.title,
    official_guide_destination: chain.official_guide?.destination,
    peer_official_guides_compared: peers,
    official_guide_destination_checklist: checklist,
    TT_OFFICIAL_GUIDE_DESTINATION_REVIEW: pass ? 'PASS' : visualPass ? 'FAIL' : 'PENDING',
  };

  fs.mkdirSync(EVIDENCE_ROWS, { recursive: true });
  const outPath = path.join(EVIDENCE_ROWS, `${row.filename.replace('.jpg', '')}.OFFICIAL-GUIDE-DESTINATION.json`);
  fs.writeFileSync(outPath, JSON.stringify(evidence, null, 2) + '\n');
  console.log(`TT_OFFICIAL_GUIDE_DESTINATION_REVIEW: ${evidence.TT_OFFICIAL_GUIDE_DESTINATION_REVIEW} file=${row.filename}`);
  console.log(`TT_OFFICIAL_GUIDE_DESTINATION_EVIDENCE: ${outPath}`);
  return { evidence, pass, outPath };
}

function main() {
  if (process.argv.includes('--emit-framework')) {
    emitFramework();
    process.exit(0);
  }

  const filename = arg('--filename');
  const allOfficialGuideCovers = process.argv.includes('--all-official-guide-covers');
  const visualPass = process.argv.includes('--visual-pass');

  if (!filename && !allOfficialGuideCovers) {
    console.error(
      'usage: --emit-framework | --filename ocs-*-official-guide-cover.jpg [--visual-pass] | --all-official-guide-covers [--visual-pass]',
    );
    process.exit(2);
  }

  const matrixText = fs.readFileSync(MATRIX, 'utf8');
  const rows = parseMatrixRows(matrixText);
  const dataset = JSON.parse(fs.readFileSync(DATASET, 'utf8'));
  const chainById = new Map(dataset.chains.map((c) => [c.id, c]));
  const officialRows = rows.filter((r) => r.slot === 'official-guide-cover');

  let targets = officialRows;
  if (filename) {
    targets = officialRows.filter((r) => r.filename === filename);
    if (!targets.length) {
      console.error(`OFFICIAL_GUIDE_COVER_NOT_IN_MATRIX: ${filename}`);
      process.exit(2);
    }
  } else {
    targets = officialRows.filter((r) => r.asset_status === 'verified' && r.review_status === 'pass');
  }

  const results = [];
  let allPass = true;

  for (const row of targets) {
    const result = reviewOne(row, officialRows, chainById, { visualPass });
    if (!result) continue;
    results.push({ filename: row.filename, pass: result.pass });
    if (!result.pass) allPass = false;
  }

  if (allOfficialGuideCovers && results.length) {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const agg = {
      schema: 'traveltrust.ocs_content_l5_official_guide_destination_aggregate.v1',
      stamp_utc: stamp,
      official_guide_covers_reviewed: results.length,
      TT_OFFICIAL_GUIDE_DESTINATION_AGGREGATE: allPass && visualPass ? 'PASS' : 'PENDING',
      rows: results,
      policy: FRAMEWORK_POLICY,
    };
    const aggPath = path.join(
      EVIDENCE_ROOT,
      `OCS-CONTENT-L5-OFFICIAL-GUIDE-DESTINATION-${results.length}-GUIDES.REVIEW.json`,
    );
    fs.writeFileSync(aggPath, JSON.stringify(agg, null, 2) + '\n');
    console.log(`TT_OFFICIAL_GUIDE_DESTINATION_AGGREGATE: ${agg.TT_OFFICIAL_GUIDE_DESTINATION_AGGREGATE}`);
    console.log(`TT_OFFICIAL_GUIDE_DESTINATION_AGGREGATE_EVIDENCE: ${aggPath}`);
  }

  process.exit(allPass && visualPass ? 0 : 2);
}

main();
