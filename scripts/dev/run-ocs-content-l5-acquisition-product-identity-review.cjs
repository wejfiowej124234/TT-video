#!/usr/bin/env node
/**
 * OCS Content L5 · Acquisition Product Identity Review
 * Required for acquisition-cover slot.
 *
 *   node scripts/dev/run-ocs-content-l5-acquisition-product-identity-review.cjs \
 *     --filename ocs-seoul-food-acquisition-cover.jpg --visual-pass
 *
 *   node scripts/dev/run-ocs-content-l5-acquisition-product-identity-review.cjs --all-acquisition-covers --visual-pass
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const MATRIX = path.join(ROOT, 'data/official-cold-start/content-production-matrix.v1.yaml');
const DATASET = path.join(ROOT, 'data/official-cold-start/dataset.v1.json');
const EVIDENCE_ROWS = path.join(ROOT, 'evidence/GO_official_cold_start_dataset/ocs-content-l5/rows');
const EVIDENCE_ROOT = path.join(ROOT, 'evidence/GO_official_cold_start_dataset/ocs-content-l5');

const PRODUCT_CHECKS = [
  'no_same_product_archetype_vs_other_acquisitions',
  'distinct_local_product_category',
  'acquisition_bounty_semantics_clear',
  'not_guide_portrait_scene',
  'not_provider_service_scene',
  'not_official_guide_landscape',
  'not_community_street_scene',
  'local_specialty_packaging',
  'manifest_product_alignment',
  'multi_city_browse_not_same_product',
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
      scene: get('scene'),
      copy_label: get('copy_label'),
      asset_status: get('asset_status'),
      review_status: get('review_status'),
    });
  }
  return rows;
}

function acquisitionPeerSummary(chain, row) {
  return {
    chain_id: chain.id,
    city: chain.city,
    title: chain.acquisition?.title,
    category: chain.acquisition?.category,
    description_snippet: (chain.acquisition?.description || '').slice(0, 60),
    scene: row.scene,
  };
}

function buildProductChecklist(visualPass, row, peers, manifestAcquisition) {
  const notes = visualPass
    ? `Distinct product identity from ${peers.map((p) => p.chain_id).join(', ')}; acquisition/bounty semantics only.`
    : 'pending_human — run with --visual-pass after visual comparison to other acquisition covers';

  const checklist = {};
  for (const id of PRODUCT_CHECKS) {
    checklist[id] = { pass: visualPass, notes };
  }
  checklist.manifest_product_alignment.notes = visualPass
    ? `${manifestAcquisition.title} (${manifestAcquisition.category}): ${manifestAcquisition.description}`
    : notes;
  checklist.acquisition_bounty_semantics_clear.notes = visualPass
    ? 'Still-life product/packaging; readable as proxy-purchase or bounty listing, not tour service.'
    : notes;
  return checklist;
}

function reviewOne(row, allAcquisitionRows, chainById, opts) {
  if (row.slot !== 'acquisition-cover') {
    console.error(`SKIP_NOT_ACQUISITION_COVER: ${row.filename}`);
    return null;
  }

  const chain = chainById.get(row.chain_id);
  const peers = allAcquisitionRows
    .filter((r) => r.filename !== row.filename && r.asset_status === 'verified')
    .map((r) => acquisitionPeerSummary(chainById.get(r.chain_id), r))
    .filter((p) => p.chain_id);

  const visualPass = opts.visualPass;
  const checklist = buildProductChecklist(visualPass, row, peers, chain.acquisition || {});
  const pass = visualPass && row.asset_status === 'verified' && row.review_status === 'pass';

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const evidence = {
    schema: 'traveltrust.ocs_content_l5_acquisition_product_identity_review.v1',
    stamp_utc: stamp,
    filename: row.filename,
    chain_id: row.chain_id,
    city: row.city,
    acquisition_title: chain.acquisition?.title,
    acquisition_category: chain.acquisition?.category,
    peer_acquisitions_compared: peers,
    product_identity_checklist: checklist,
    TT_ACQUISITION_PRODUCT_IDENTITY_REVIEW: pass ? 'PASS' : visualPass ? 'FAIL' : 'PENDING',
  };

  fs.mkdirSync(EVIDENCE_ROWS, { recursive: true });
  const outPath = path.join(EVIDENCE_ROWS, `${row.filename.replace('.jpg', '')}.ACQUISITION-PRODUCT-IDENTITY.json`);
  fs.writeFileSync(outPath, JSON.stringify(evidence, null, 2) + '\n');

  console.log(`TT_ACQUISITION_PRODUCT_IDENTITY_REVIEW: ${evidence.TT_ACQUISITION_PRODUCT_IDENTITY_REVIEW} file=${row.filename}`);
  console.log(`TT_ACQUISITION_PRODUCT_IDENTITY_EVIDENCE: ${outPath}`);
  return { evidence, pass, outPath };
}

function main() {
  const filename = arg('--filename');
  const allAcquisitionCovers = process.argv.includes('--all-acquisition-covers');
  const visualPass = process.argv.includes('--visual-pass');

  if (!filename && !allAcquisitionCovers) {
    console.error('usage: --filename ocs-*-acquisition-cover.jpg [--visual-pass] | --all-acquisition-covers [--visual-pass]');
    process.exit(2);
  }

  const matrixText = fs.readFileSync(MATRIX, 'utf8');
  const rows = parseMatrixRows(matrixText);
  const dataset = JSON.parse(fs.readFileSync(DATASET, 'utf8'));
  const chainById = new Map(dataset.chains.map((c) => [c.id, c]));
  const acquisitionRows = rows.filter((r) => r.slot === 'acquisition-cover');

  let targets = acquisitionRows;
  if (filename) {
    targets = acquisitionRows.filter((r) => r.filename === filename);
    if (!targets.length) {
      console.error(`ACQUISITION_COVER_NOT_IN_MATRIX: ${filename}`);
      process.exit(2);
    }
  } else {
    targets = acquisitionRows.filter((r) => r.asset_status === 'verified' && r.review_status === 'pass');
  }

  const results = [];
  let allPass = true;

  for (const row of targets) {
    const result = reviewOne(row, acquisitionRows, chainById, { visualPass });
    if (!result) continue;
    results.push({ filename: row.filename, pass: result.pass });
    if (!result.pass) allPass = false;
  }

  if (allAcquisitionCovers && results.length) {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const agg = {
      schema: 'traveltrust.ocs_content_l5_acquisition_product_identity_aggregate.v1',
      stamp_utc: stamp,
      acquisition_covers_reviewed: results.length,
      TT_ACQUISITION_PRODUCT_IDENTITY_AGGREGATE: allPass && visualPass ? 'PASS' : 'PENDING',
      rows: results,
      policy:
        '代购/悬赏商品须具明确本地特色与业务语义；不得与 Guide/Provider/Community/Official Guide 主体或场景混用；跨城商品不得高度相似。',
    };
    const aggPath = path.join(
      EVIDENCE_ROOT,
      `OCS-CONTENT-L5-ACQUISITION-PRODUCT-IDENTITY-${results.length}-ACQUISITIONS.REVIEW.json`,
    );
    fs.writeFileSync(aggPath, JSON.stringify(agg, null, 2) + '\n');
    console.log(`TT_ACQUISITION_PRODUCT_IDENTITY_AGGREGATE: ${agg.TT_ACQUISITION_PRODUCT_IDENTITY_AGGREGATE}`);
    console.log(`TT_ACQUISITION_PRODUCT_IDENTITY_AGGREGATE_EVIDENCE: ${aggPath}`);
  }

  process.exit(allPass && visualPass ? 0 : 2);
}

main();
