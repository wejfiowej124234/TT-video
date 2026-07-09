#!/usr/bin/env node
/**
 * OCS Content L5 · Content Brief ↔ assets manifest 对齐校验（内容工程 · 非 Runtime Gate）
 *
 *   node scripts/dev/validate-ocs-content-l5-brief.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const BRIEF = path.join(ROOT, 'data/official-cold-start/content-brief.v1.yaml');
const ASSETS = path.join(ROOT, 'data/official-cold-start/assets.v1.json');

function briefFilenamesFromYaml(text) {
  return [...text.matchAll(/^\s+filename:\s+(ocs-[a-z0-9-]+\.jpg)\s*$/gm)].map((m) => m[1]);
}

function loadBriefFilenames() {
  if (!fs.existsSync(BRIEF)) {
    console.error('validate-ocs-content-l5-brief: MISSING', BRIEF);
    process.exit(2);
  }
  const names = briefFilenamesFromYaml(fs.readFileSync(BRIEF, 'utf8'));
  return names;
}

function loadAssets() {
  return JSON.parse(fs.readFileSync(ASSETS, 'utf8'));
}

function main() {
  const briefFilenames = loadBriefFilenames();
  const assetsDoc = loadAssets();
  const assetFilenames = new Set((assetsDoc.assets || []).map((a) => a.filename));

  if (briefFilenames.length !== 60) {
    console.error(`BRIEF_COUNT: expected 60 got ${briefFilenames.length}`);
    process.exit(2);
  }

  for (const fn of briefFilenames) {
    if (!assetFilenames.has(fn)) {
      console.error(`BRIEF_ASSET_MISMATCH: ${fn} in brief but not in assets.v1.json`);
      process.exit(2);
    }
  }
  const dup = briefFilenames.filter((f, i) => briefFilenames.indexOf(f) !== i);
  if (dup.length) {
    console.error('BRIEF_DUPLICATE_FILENAME:', [...new Set(dup)].join(', '));
    process.exit(2);
  }

  for (const fn of assetFilenames) {
    if (!briefFilenames.includes(fn)) {
      console.error(`ASSETS_ORPHAN: ${fn} in assets.v1.json but not in content brief`);
      process.exit(2);
    }
  }

  console.log('TT_OCS_CONTENT_L5_BRIEF_VALIDATE: PASS chains=10 assets=60');
}

main();
