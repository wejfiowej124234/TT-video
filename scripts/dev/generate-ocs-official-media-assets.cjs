#!/usr/bin/env node
/**
 * Generate Official Asset Baseline V1 · assets.v1.json + media binaries + dataset URL sync.
 *
 *   node scripts/dev/generate-ocs-official-media-assets.cjs
 */
const fs = require('fs');
const path = require('path');
const {
  ASSETS_MANIFEST,
  DATASET_MANIFEST,
  loadDataset,
  buildAssetsManifestFromDataset,
  applyAssetUrlsToDataset,
  writeMediaBinaries,
} = require('./lib/ocs-official-assets.cjs');

const WRITE_DATASET = process.env.OCS_ASSETS_WRITE_DATASET !== '0';

const dataset = loadDataset();
const assetsDoc = buildAssetsManifestFromDataset(dataset);
writeMediaBinaries(assetsDoc, { force: process.env.OCS_ASSETS_FORCE_MEDIA === '1' });

fs.mkdirSync(path.dirname(ASSETS_MANIFEST), { recursive: true });
fs.writeFileSync(ASSETS_MANIFEST, JSON.stringify(assetsDoc, null, 2) + '\n');

if (WRITE_DATASET) {
  const synced = applyAssetUrlsToDataset(dataset, assetsDoc);
  fs.writeFileSync(DATASET_MANIFEST, JSON.stringify(synced, null, 2) + '\n');
}

console.log(`OCS_ASSETS_GENERATE: OK assets=${assetsDoc.assets.length} manifest=${ASSETS_MANIFEST}`);
if (WRITE_DATASET) {
  console.log(`OCS_ASSETS_GENERATE: dataset synced ${DATASET_MANIFEST}`);
}
