#!/usr/bin/env node
/**
 * Generate / refresh OCS Content Production Matrix from content-brief + dataset.
 * Operational SSOT for design · ops · engineering (one table).
 *
 *   node scripts/dev/generate-ocs-content-production-matrix.cjs
 *   node scripts/dev/generate-ocs-content-production-matrix.cjs --preserve-status
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const BRIEF = path.join(ROOT, 'data/official-cold-start/content-brief.v1.yaml');
const DATASET = path.join(ROOT, 'data/official-cold-start/dataset.v1.json');
const MATRIX = path.join(ROOT, 'data/official-cold-start/content-production-matrix.v1.yaml');

const SLOT_SURFACE_LABEL = {
  'guide-avatar': 'Guide',
  'provider-cover': 'Provider',
  'acquisition-cover': 'Acquisition',
  'official-guide-cover': 'Official Guide',
  'community-cover': 'Community Cover',
  'community-media': 'Community Media',
};

const SLOT_COPY_FIELD = {
  'guide-avatar': ['guide', 'nickname'],
  'provider-cover': ['provider', 'title'],
  'acquisition-cover': ['acquisition', 'title'],
  'official-guide-cover': ['official_guide', 'title'],
  'community-cover': ['community_post', 'body_markdown'],
  'community-media': ['community_post', 'body_markdown'],
};

function parseBriefChains(text) {
  const chains = [];
  const chainBlocks = text.split(/\n  - chain_id:/).slice(1);
  for (const block of chainBlocks) {
    const chainId = block.match(/^ ([^\n]+)/)?.[1]?.trim();
    const city = block.match(/city: ([^\n]+)/)?.[1]?.trim();
    const assets = [];
    const assetBlocks = block.split(/\n      - slot:/).slice(1);
    for (const ab of assetBlocks) {
      const slot = ab.match(/^ ([^\n]+)/)?.[1]?.trim();
      const filename = ab.match(/filename: (ocs-[a-z0-9-]+\.jpg)/)?.[1];
      const scene = ab.match(/recommended_scene: ([^\n]+)/)?.[1]?.trim();
      if (slot && filename) assets.push({ slot, filename, scene: scene || '' });
    }
    if (chainId && city) chains.push({ chain_id: chainId, city, assets });
  }
  return chains;
}

function copyForSlot(chain, slot) {
  const pathKeys = SLOT_COPY_FIELD[slot];
  if (!pathKeys) return '';
  let node = chain;
  for (const k of pathKeys) {
    node = node?.[k];
  }
  const s = (node ?? '').toString().trim();
  return s.length > 48 ? `${s.slice(0, 45)}…` : s;
}

function loadExistingRows() {
  if (!fs.existsSync(MATRIX)) return new Map();
  const text = fs.readFileSync(MATRIX, 'utf8');
  const map = new Map();
  for (const block of text.split(/\n  - filename:/).slice(1)) {
    const filename = block.match(/^ (ocs-[a-z0-9-]+\.jpg)/)?.[1];
    if (!filename) continue;
    const assetStatus = block.match(/asset_status: (\w+)/)?.[1] || 'pending';
    const reviewStatus = block.match(/review_status: (\w+)/)?.[1] || 'pending';
    map.set(filename, { asset_status: assetStatus, review_status: reviewStatus });
  }
  return map;
}

function main() {
  const preserve = process.argv.includes('--preserve-status');
  const briefText = fs.readFileSync(BRIEF, 'utf8');
  const dataset = JSON.parse(fs.readFileSync(DATASET, 'utf8'));
  const chainById = Object.fromEntries((dataset.chains || []).map((c) => [c.id, c]));
  const briefChains = parseBriefChains(briefText);
  const existing = preserve ? loadExistingRows() : new Map();

  const rows = [];
  for (const bc of briefChains) {
    const chain = chainById[bc.chain_id] || {};
    for (const a of bc.assets) {
      const prev = existing.get(a.filename);
      rows.push({
        filename: a.filename,
        chain_id: bc.chain_id,
        city: bc.city,
        slot: a.slot,
        surface: SLOT_SURFACE_LABEL[a.slot] || a.slot,
        scene: a.scene,
        copy_label: copyForSlot(chain, a.slot),
        asset_status: prev?.asset_status || 'pending',
        review_status: prev?.review_status || 'pending',
      });
    }
  }

  if (rows.length !== 60) {
    console.error(`generate-ocs-content-production-matrix: expected 60 rows got ${rows.length}`);
    process.exit(2);
  }

  const lines = [
    '# OCS Content Production Matrix · 设计/运营/开发唯一进度表',
    '# 与 content-brief.v1.yaml 同步 · Manifest First 纪律',
    '# Generate: node scripts/dev/generate-ocs-content-production-matrix.cjs',
    '',
    'schema: traveltrust.ocs_content_production_matrix.v1',
    'version: 1',
    'effective_utc: "2026-07-04"',
    'machine_key: TT_CONTENT_PRODUCTION_MATRIX',
    'status: IN_PROGRESS',
    '',
    'row_status_enum:',
    '  asset_status: [pending, replaced, verified]',
    '  review_status: [pending, pass, fail]',
    '',
    'rows:',
  ];

  for (const r of rows) {
    lines.push(`  - filename: ${r.filename}`);
    lines.push(`    chain_id: ${r.chain_id}`);
    lines.push(`    city: ${r.city}`);
    lines.push(`    slot: ${r.slot}`);
    lines.push(`    surface: ${r.surface}`);
    lines.push(`    scene: "${r.scene.replace(/"/g, '\\"')}"`);
    lines.push(`    copy_label: "${r.copy_label.replace(/"/g, '\\"')}"`);
    lines.push(`    asset_status: ${r.asset_status}`);
    lines.push(`    review_status: ${r.review_status}`);
  }

  fs.writeFileSync(MATRIX, `${lines.join('\n')}\n`);
  console.log(`TT_CONTENT_PRODUCTION_MATRIX_GENERATE: OK rows=${rows.length} path=${MATRIX}`);
}

main();
