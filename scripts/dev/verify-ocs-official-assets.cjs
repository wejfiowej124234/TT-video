#!/usr/bin/env node
/**
 * Official Asset Baseline V1 · Asset Verification (HEAD 200 · MIME · Content-Length · decodable).
 *
 *   API=https://tt-api-staging.fly.dev node scripts/dev/verify-ocs-official-assets.cjs
 */
const fs = require('fs');
const path = require('path');
const {
  loadAssetsManifest,
  loadDataset,
  verifyAllAssets,
  collectPublishedMediaUrls,
  legacyMediaViolations,
  verifyAssetDelivery,
} = require('./lib/ocs-official-assets.cjs');

const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const OUT = process.env.OUT || '';
const STATE_PATH = process.env.STATE || '';

const assetsDoc = loadAssetsManifest();
const dataset = loadDataset();

(async () => {
  const delivery = await verifyAllAssets(API, assetsDoc);
  const manifestUrls = collectPublishedMediaUrls(dataset);
  const legacy = legacyMediaViolations(manifestUrls);

  const feedProbe = [];
  if (STATE_PATH && fs.existsSync(STATE_PATH)) {
    const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    for (const key of Object.keys(state.community_posts || {})) {
      const chainId = key.replace('community_post:', '');
      const chain = dataset.chains.find((c) => c.id === chainId);
      if (!chain?.community_post) continue;
      for (const u of [chain.community_post.cover_url, ...(chain.community_post.media_urls || [])]) {
        if (!u) continue;
        const asset = assetsDoc.assets.find((a) => a.public_url === u);
        if (asset) {
          feedProbe.push(await verifyAssetDelivery(API, asset));
        }
      }
    }
  }

  const report = {
    schema: 'traveltrust.ocs_official_asset_verification.v1',
    api: API,
    recorded_at: new Date().toISOString(),
    asset_count: assetsDoc.assets.length,
    delivery_ok: delivery.ok,
    delivery_pass: delivery.results.filter((r) => r.ok).length,
    delivery_fail: delivery.results.filter((r) => !r.ok).length,
    legacy_violations: legacy,
    legacy_ok: legacy.length === 0,
    results: delivery.results,
    feed_probe: feedProbe,
    machine_keys: {
      TT_OCS_OFFICIAL_ASSET_BASELINE: delivery.ok && legacy.length === 0 ? 'V1_VERIFIED' : 'V1_FAIL',
      TT_OCS_OFFICIAL_ASSET_BASELINE_V1: delivery.ok && legacy.length === 0 ? 'VERIFIED' : 'FAIL',
      TT_OCS_ASSET_VERIFICATION: delivery.ok ? 'PASS' : 'FAIL',
    },
  };

  if (OUT) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  }

  const fail = delivery.results.filter((r) => !r.ok);
  if (fail.length) {
    console.error(`OCS_ASSET_VERIFICATION: FAIL ${fail.length}/${delivery.results.length}`);
    for (const f of fail.slice(0, 5)) {
      console.error(`  ${f.filename} ${f.url} status=${f.status} checks=${JSON.stringify(f.checks)}`);
    }
    process.exit(1);
  }
  if (legacy.length) {
    console.error(`OCS_ASSET_VERIFICATION: FAIL legacy URLs ${legacy.length}`);
    process.exit(1);
  }
  console.log(`OCS_ASSET_VERIFICATION: PASS ${delivery.results.length}/${delivery.results.length}`);
  console.log(`TT_OCS_ASSET_VERIFICATION: PASS`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
