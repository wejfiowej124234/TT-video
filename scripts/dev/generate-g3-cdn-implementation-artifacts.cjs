#!/usr/bin/env node
/**
 * Generate G3 Production CDN implementation artifacts (prep — no DNS cutover).
 *
 *   node scripts/dev/generate-g3-cdn-implementation-artifacts.cjs [OUT_DIR]
 */
const fs = require('fs');
const path = require('path');
const {
  ROOT,
  loadPolicyRegistry,
  loadAssetsManifest,
  buildR2UploadManifest,
  buildCloudflareCacheRules,
  buildR2LifecyclePolicy,
  buildProductionAssetUrlMap,
} = require('./lib/g3-production-cdn-policy.cjs');

const outDir =
  process.argv[2] ||
  path.join(ROOT, 'evidence/GO_production_readiness/G3-01/preparation');

fs.mkdirSync(outDir, { recursive: true });

const policy = loadPolicyRegistry();
const assetsDoc = loadAssetsManifest();

const artifacts = {
  'cloudflare-cache-rules.v1.json': buildCloudflareCacheRules(policy),
  'r2-lifecycle-policy.v1.json': buildR2LifecyclePolicy(policy),
  'ocs-r2-upload-manifest.v1.json': buildR2UploadManifest(assetsDoc, policy),
  'production-cdn-url-map.v1.json': {
    schema: 'traveltrust.g3_production_cdn_url_map.v1',
    baseline: 'Official Asset Baseline V1',
    staging_interim: '/api/v1/uploads/community-posts/:name',
    production_target: policy.cdn.public_base,
    assets: buildProductionAssetUrlMap(assetsDoc, policy),
  },
  'g3-cdn-prep-checklist.v1.json': {
    schema: 'traveltrust.g3_cdn_prep_checklist.v1',
    generated_at: new Date().toISOString(),
    registry: 'registry/g3-production-cdn-official-assets.v1.yaml',
    owner_steps_before_verified: [
      'Cloudflare R2 bucket + API token',
      'cdn.traveltrust.app DNS → R2 public bucket',
      'fly secrets on tt-api-prod (COMMUNITY_MEDIA_S3_*)',
      'bash scripts/dev/configure-production-media-r2-cdn.sh',
      'node scripts/dev/bootstrap-ocs-official-assets-to-r2.cjs --apply',
      'Production HEAD probes on CDN host + cf-cache-status',
      'bash scripts/dev/run-reality-verification.sh --gate G3 --domain G3-01',
    ],
    machine_key_prep: 'TT_G3_PRODUCTION_CDN_PREP',
    machine_key_verified: 'TT_G3_PRODUCTION_CDN_VERIFIED',
    honest_boundary:
      'PREP READY ≠ VERIFIED — Staging asset baseline does not close G3-01 CDN items',
  },
};

for (const [name, doc] of Object.entries(artifacts)) {
  const p = path.join(outDir, name);
  fs.writeFileSync(p, JSON.stringify(doc, null, 2) + '\n');
  console.log(`wrote ${p}`);
}

console.log(`G3_CDN_ARTIFACTS: OK count=${Object.keys(artifacts).length} out=${outDir}`);
