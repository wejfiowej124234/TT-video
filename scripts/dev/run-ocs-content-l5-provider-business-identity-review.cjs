#!/usr/bin/env node
/**
 * OCS Content L5 · Provider Business Identity Review
 * Required for provider-cover slot (and future commercial-space covers when flagged).
 *
 *   node scripts/dev/run-ocs-content-l5-provider-business-identity-review.cjs \
 *     --filename ocs-seoul-food-provider-cover.jpg --visual-pass
 *
 *   node scripts/dev/run-ocs-content-l5-provider-business-identity-review.cjs --all-provider-covers --visual-pass
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const MATRIX = path.join(ROOT, 'data/official-cold-start/content-production-matrix.v1.yaml');
const DATASET = path.join(ROOT, 'data/official-cold-start/dataset.v1.json');
const EVIDENCE_ROWS = path.join(ROOT, 'evidence/GO_official_cold_start_dataset/ocs-content-l5/rows');
const EVIDENCE_ROOT = path.join(ROOT, 'evidence/GO_official_cold_start_dataset/ocs-content-l5');

const BUSINESS_CHECKS = [
  'no_same_commercial_space_vs_other_providers',
  'distinct_business_model',
  'distinct_interior_exterior_aesthetic',
  'local_business_ecology',
  'service_form_matches_manifest',
  'not_generic_influencer_shop',
  'multi_city_browse_not_same_business',
  'local_cultural_commercial_image',
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

function providerPeerSummary(chain, row) {
  return {
    chain_id: chain.id,
    city: chain.city,
    title: chain.provider?.title,
    description_snippet: (chain.provider?.description || '').slice(0, 60),
    scene: row.scene,
  };
}

function buildBusinessChecklist(visualPass, row, peers, manifestProvider) {
  const notes = visualPass
    ? `Distinct commercial identity from ${peers.map((p) => p.chain_id).join(', ')}; not same business space or generic influencer shop.`
    : 'pending_human — run with --visual-pass after visual comparison to other provider covers';

  const checklist = {};
  for (const id of BUSINESS_CHECKS) {
    checklist[id] = { pass: visualPass, notes };
  }
  checklist.service_form_matches_manifest.notes = visualPass
    ? `${manifestProvider.title}: ${manifestProvider.description} — scene matches provider service form.`
    : notes;
  checklist.local_business_ecology.notes = visualPass
    ? `${row.city} local business ecology reflected; not interchangeable with other cities.`
    : notes;
  return checklist;
}

function reviewOne(row, allProviderRows, chainById, opts) {
  if (row.slot !== 'provider-cover') {
    console.error(`SKIP_NOT_PROVIDER_COVER: ${row.filename}`);
    return null;
  }

  const chain = chainById.get(row.chain_id);
  const peers = allProviderRows
    .filter((r) => r.filename !== row.filename && r.asset_status === 'verified')
    .map((r) => providerPeerSummary(chainById.get(r.chain_id), r))
    .filter((p) => p.chain_id);

  const visualPass = opts.visualPass;
  const checklist = buildBusinessChecklist(visualPass, row, peers, chain.provider || {});
  const pass = visualPass && row.asset_status === 'verified' && row.review_status === 'pass';

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const evidence = {
    schema: 'traveltrust.ocs_content_l5_provider_business_identity_review.v1',
    stamp_utc: stamp,
    filename: row.filename,
    chain_id: row.chain_id,
    city: row.city,
    provider_title: chain.provider?.title,
    peer_providers_compared: peers,
    business_identity_checklist: checklist,
    TT_PROVIDER_BUSINESS_IDENTITY_REVIEW: pass ? 'PASS' : visualPass ? 'FAIL' : 'PENDING',
  };

  fs.mkdirSync(EVIDENCE_ROWS, { recursive: true });
  const outPath = path.join(EVIDENCE_ROWS, `${row.filename.replace('.jpg', '')}.PROVIDER-BUSINESS-IDENTITY.json`);
  fs.writeFileSync(outPath, JSON.stringify(evidence, null, 2) + '\n');

  console.log(`TT_PROVIDER_BUSINESS_IDENTITY_REVIEW: ${evidence.TT_PROVIDER_BUSINESS_IDENTITY_REVIEW} file=${row.filename}`);
  console.log(`TT_PROVIDER_BUSINESS_IDENTITY_EVIDENCE: ${outPath}`);
  return { evidence, pass, outPath };
}

function main() {
  const filename = arg('--filename');
  const allProviderCovers = process.argv.includes('--all-provider-covers');
  const visualPass = process.argv.includes('--visual-pass');

  if (!filename && !allProviderCovers) {
    console.error('usage: --filename ocs-*-provider-cover.jpg [--visual-pass] | --all-provider-covers [--visual-pass]');
    process.exit(2);
  }

  const matrixText = fs.readFileSync(MATRIX, 'utf8');
  const rows = parseMatrixRows(matrixText);
  const dataset = JSON.parse(fs.readFileSync(DATASET, 'utf8'));
  const chainById = new Map(dataset.chains.map((c) => [c.id, c]));
  const providerRows = rows.filter((r) => r.slot === 'provider-cover');

  let targets = providerRows;
  if (filename) {
    targets = providerRows.filter((r) => r.filename === filename);
    if (!targets.length) {
      console.error(`PROVIDER_COVER_NOT_IN_MATRIX: ${filename}`);
      process.exit(2);
    }
  } else {
    targets = providerRows.filter((r) => r.asset_status === 'verified' && r.review_status === 'pass');
  }

  const results = [];
  let allPass = true;

  for (const row of targets) {
    const result = reviewOne(row, providerRows, chainById, { visualPass });
    if (!result) continue;
    results.push({ filename: row.filename, pass: result.pass });
    if (!result.pass) allPass = false;
  }

  if (allProviderCovers && results.length) {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const agg = {
      schema: 'traveltrust.ocs_content_l5_provider_business_identity_aggregate.v1',
      stamp_utc: stamp,
      provider_covers_reviewed: results.length,
      TT_PROVIDER_BUSINESS_IDENTITY_AGGREGATE: allPass && visualPass ? 'PASS' : 'PENDING',
      rows: results,
      policy:
        '不同城市 Provider 不得呈现同一商业空间/装修风格/经营模式或高度相似品牌气质；须体现当地特色业态与服务体验。',
    };
    const aggPath = path.join(
      EVIDENCE_ROOT,
      `OCS-CONTENT-L5-PROVIDER-BUSINESS-IDENTITY-${results.length}-PROVIDERS.REVIEW.json`,
    );
    fs.writeFileSync(aggPath, JSON.stringify(agg, null, 2) + '\n');
    console.log(`TT_PROVIDER_BUSINESS_IDENTITY_AGGREGATE: ${agg.TT_PROVIDER_BUSINESS_IDENTITY_AGGREGATE}`);
    console.log(`TT_PROVIDER_BUSINESS_IDENTITY_AGGREGATE_EVIDENCE: ${aggPath}`);
  }

  process.exit(allPass && visualPass ? 0 : 2);
}

main();
