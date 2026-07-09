#!/usr/bin/env node
/**
 * OCS Content L5 · Destination Authenticity Review
 * After G1–G10 + Cross-Chain + Global Consistency (per row workflow).
 *
 *   node scripts/dev/run-ocs-content-l5-destination-authenticity-review.cjs \
 *     --filename ocs-kyoto-culture-community-cover.jpg --visual-pass
 *
 *   node scripts/dev/run-ocs-content-l5-destination-authenticity-review.cjs --all-verified --visual-pass
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const MATRIX = path.join(ROOT, 'data/official-cold-start/content-production-matrix.v1.yaml');
const DATASET = path.join(ROOT, 'data/official-cold-start/dataset.v1.json');
const EVIDENCE_ROWS = path.join(ROOT, 'evidence/GO_official_cold_start_dataset/ocs-content-l5/rows');
const EVIDENCE_ROOT = path.join(ROOT, 'evidence/GO_official_cold_start_dataset/ocs-content-l5');

const AUTHENTICITY_DIMENSIONS = [
  'architecture',
  'streetscape',
  'clothing',
  'language_signage',
  'transportation',
  'natural_environment',
  'food_dining',
  'commercial_form',
  'cultural_elements',
];

const COUNTRY_LABEL = {
  JP: '日本',
  KR: '韩国',
  TH: '泰国',
  SG: '新加坡',
  FR: '法国',
  US: '美国',
  AU: '澳大利亚',
  ES: '西班牙',
  AE: '阿联酋',
};

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

function manifestForSlot(chain, slot) {
  const base = {
    chain_id: chain.id,
    city: chain.city,
    country_code: chain.country_code,
    country_label: COUNTRY_LABEL[chain.country_code] || chain.country_code,
    chain_tags: chain.tags || [],
  };
  switch (slot) {
    case 'guide-avatar':
      return {
        ...base,
        'guide.nickname': chain.guide?.nickname,
        'guide.bio': chain.guide?.bio,
        'guide.avatar_url': chain.guide?.avatar_url,
      };
    case 'provider-cover':
      return {
        ...base,
        'provider.title': chain.provider?.title,
        'provider.category': chain.provider?.category,
        'provider.description': chain.provider?.description,
        'provider.cover_url': chain.provider?.cover_url,
      };
    case 'acquisition-cover':
      return {
        ...base,
        'acquisition.title': chain.acquisition?.title,
        'acquisition.category': chain.acquisition?.category,
        'acquisition.description': chain.acquisition?.description,
        'acquisition.cover_url': chain.acquisition?.cover_url,
      };
    case 'official-guide-cover':
      return {
        ...base,
        'official_guide.title': chain.official_guide?.title,
        'official_guide.destination': chain.official_guide?.destination,
        'official_guide.body': chain.official_guide?.body,
        'official_guide.tags': chain.official_guide?.tags,
        'official_guide.cover_url': chain.official_guide?.cover_url,
      };
    case 'community-cover':
    case 'community-media':
      return {
        ...base,
        'community_post.destination_slug': chain.community_post?.destination_slug,
        'community_post.destination_label': chain.community_post?.destination_label,
        'community_post.post_type': chain.community_post?.post_type,
        'community_post.tags': chain.community_post?.tags,
        'community_post.body_markdown': chain.community_post?.body_markdown,
        'community_post.cover_url': chain.community_post?.cover_url,
        'community_post.media_urls': chain.community_post?.media_urls,
      };
    default:
      return base;
  }
}

function machineManifestChecks(row, manifest) {
  const checks = [];
  let pass = true;

  checks.push({
    id: 'matrix_city_matches_manifest',
    pass: row.city === manifest.city,
    detail: `matrix=${row.city} manifest=${manifest.city}`,
  });
  if (row.city !== manifest.city) pass = false;

  checks.push({
    id: 'country_code_present',
    pass: Boolean(manifest.country_code),
    detail: manifest.country_code || 'missing',
  });
  if (!manifest.country_code) pass = false;

  checks.push({
    id: 'copy_label_non_empty',
    pass: Boolean(row.copy_label && row.copy_label.length > 0),
    detail: row.copy_label || 'empty',
  });
  if (!row.copy_label) pass = false;

  const cityInCopy = row.copy_label.includes(manifest.city);
  const titleAlignedSlot =
    row.slot === 'acquisition-cover' ||
    row.slot === 'provider-cover';
  const titleField =
    row.slot === 'acquisition-cover'
      ? 'acquisition.title'
      : row.slot === 'provider-cover'
        ? 'provider.title'
        : null;
  const manifestTitleAligned =
    titleAlignedSlot &&
    (row.copy_label === manifest[titleField] ||
      (manifest.country_label && row.copy_label.includes(manifest.country_label)) ||
      (manifest.chain_tags || []).some((t) => row.copy_label.includes(t)));
  checks.push({
    id: 'copy_label_contains_city_or_chain_theme',
    pass: cityInCopy || slotUsesSharedCommunityBody(row.slot) || manifestTitleAligned,
    detail: cityInCopy
      ? 'city in copy_label'
      : manifestTitleAligned
        ? 'manifest title/country/tags aligned'
        : 'community shared body ok',
  });
  if (!cityInCopy && !slotUsesSharedCommunityBody(row.slot) && !manifestTitleAligned) pass = false;

  if (manifest['official_guide.destination']) {
    const destOk = manifest['official_guide.destination'] === manifest.city;
    checks.push({
      id: 'official_guide_destination_matches_city',
      pass: destOk,
      detail: manifest['official_guide.destination'],
    });
    if (!destOk) pass = false;
  }

  if (manifest['community_post.destination_label']) {
    const destOk = manifest['community_post.destination_label'] === manifest.city;
    checks.push({
      id: 'community_destination_label_matches_city',
      pass: destOk,
      detail: manifest['community_post.destination_label'],
    });
    if (!destOk) pass = false;
  }

  return { checks, pass };
}

function slotUsesSharedCommunityBody(slot) {
  return slot === 'community-cover' || slot === 'community-media';
}

function buildVisualChecklist(visualPass, row, manifest) {
  const notes = visualPass
    ? `Visual attestation: all elements belong to ${manifest.city} (${manifest.country_label}). No cross-city/country/culture mixing.`
    : 'pending_human_visual_review — run with --visual-pass after human image review';

  const dimensions = {};
  for (const dim of AUTHENTICITY_DIMENSIONS) {
    dimensions[dim] = {
      pass: visualPass,
      belongs_to_city: visualPass ? manifest.city : null,
      belongs_to_country: visualPass ? manifest.country_label : null,
      cross_contamination: visualPass ? false : null,
      notes,
    };
  }
  return dimensions;
}

function reviewOneRow(row, chain, opts) {
  const manifest = manifestForSlot(chain, row.slot);
  const { checks: manifestChecks, pass: manifestPass } = machineManifestChecks(row, manifest);
  const visualPass = opts.visualPass;
  const visualChecklist = buildVisualChecklist(visualPass, row, manifest);

  const pass = manifestPass && visualPass && row.asset_status === 'verified' && row.review_status === 'pass';
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

  const evidence = {
    schema: 'traveltrust.ocs_content_l5_destination_authenticity_review.v1',
    stamp_utc: stamp,
    filename: row.filename,
    chain_id: row.chain_id,
    city: row.city,
    country_code: manifest.country_code,
    country_label: manifest.country_label,
    slot: row.slot,
    surface: row.surface,
    manifest_snapshot: manifest,
    manifest_field_alignment: {
      pass: manifestPass,
      checks: manifestChecks,
      requirement: '图片与 Manifest 全字段 100% 同城同主题对齐',
    },
    destination_authenticity_checklist: visualChecklist,
    prohibited: {
      cross_country_elements: visualPass ? false : null,
      cross_city_elements: visualPass ? false : null,
      cross_culture_mixing: visualPass ? false : null,
    },
    TT_DESTINATION_AUTHENTICITY_REVIEW: pass ? 'PASS' : visualPass ? 'MANIFEST_ONLY' : 'PENDING',
  };

  fs.mkdirSync(EVIDENCE_ROWS, { recursive: true });
  const outPath = path.join(EVIDENCE_ROWS, `${row.filename.replace('.jpg', '')}.DESTINATION-AUTHENTICITY.json`);
  fs.writeFileSync(outPath, JSON.stringify(evidence, null, 2) + '\n');

  return { evidence, outPath, pass };
}

function main() {
  const filename = arg('--filename');
  const allVerified = process.argv.includes('--all-verified');
  const visualPass = process.argv.includes('--visual-pass');

  if (!filename && !allVerified) {
    console.error(
      'usage: --filename ocs-*.jpg [--visual-pass] | --all-verified [--visual-pass]',
    );
    process.exit(2);
  }

  const matrixText = fs.readFileSync(MATRIX, 'utf8');
  const rows = parseMatrixRows(matrixText);
  const dataset = JSON.parse(fs.readFileSync(DATASET, 'utf8'));
  const chainById = new Map(dataset.chains.map((c) => [c.id, c]));

  let targets = rows;
  if (filename) {
    targets = rows.filter((r) => r.filename === filename);
    if (!targets.length) {
      console.error(`ROW_NOT_IN_MATRIX: ${filename}`);
      process.exit(2);
    }
  } else if (allVerified) {
    targets = rows.filter((r) => r.asset_status === 'verified' && r.review_status === 'pass');
  }

  const results = [];
  let allPass = true;

  for (const row of targets) {
    const chain = chainById.get(row.chain_id);
    if (!chain) {
      console.error(`CHAIN_NOT_IN_DATASET: ${row.chain_id}`);
      process.exit(2);
    }
    const { evidence, outPath, pass } = reviewOneRow(row, chain, { visualPass });
    results.push({ filename: row.filename, pass, outPath });
    console.log(`TT_DESTINATION_AUTHENTICITY_REVIEW: ${evidence.TT_DESTINATION_AUTHENTICITY_REVIEW} file=${row.filename}`);
    console.log(`TT_DESTINATION_AUTHENTICITY_EVIDENCE: ${outPath}`);
    if (!pass) allPass = false;
  }

  if (allVerified && results.length) {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const aggregate = {
      schema: 'traveltrust.ocs_content_l5_destination_authenticity_aggregate.v1',
      stamp_utc: stamp,
      matrix_rows_reviewed: results.length,
      matrix_rows_total: 60,
      TT_DESTINATION_AUTHENTICITY_AGGREGATE: allPass && visualPass ? 'PASS' : 'PENDING',
      rows: results.map((r) => ({ filename: r.filename, pass: r.pass })),
      policy:
        '建筑/街景/服饰/语言/交通/自然/饮食/商业/文化元素须全部属于当前城市与国家；禁止跨国家/文化/城市混用。',
    };
    const aggPath = path.join(
      EVIDENCE_ROOT,
      `OCS-CONTENT-L5-DESTINATION-AUTHENTICITY-${results.length}of60.REVIEW.json`,
    );
    fs.writeFileSync(aggPath, JSON.stringify(aggregate, null, 2) + '\n');
    console.log(`TT_DESTINATION_AUTHENTICITY_AGGREGATE: ${aggregate.TT_DESTINATION_AUTHENTICITY_AGGREGATE}`);
    console.log(`TT_DESTINATION_AUTHENTICITY_AGGREGATE_EVIDENCE: ${aggPath}`);
  }

  process.exit(allPass && visualPass ? 0 : 2);
}

main();
