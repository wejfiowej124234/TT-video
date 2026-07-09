/**
 * G3 Production CDN · Official Asset Baseline V1 · policy helpers (prep + verification).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../../..');
const REGISTRY_PATH = path.join(ROOT, 'registry/g3-production-cdn-official-assets.v1.json');
const { loadAssetsManifest } = require('./ocs-official-assets.cjs');

function loadPolicyRegistry() {
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
}

function cdnPublicUrl(filename, policy) {
  const base = (policy?.cdn?.public_base || 'https://cdn.traveltrust.app').replace(/\/$/, '');
  const prefix = policy?.cdn?.official_assets?.prefix || 'official-cold-start/v1';
  return `${base}/${prefix}/${filename}`;
}

function buildR2UploadManifest(assetsDoc, policy) {
  const prefix = policy?.cdn?.official_assets?.prefix || 'official-cold-start/v1';
  const cacheControl =
    policy?.cache_policy?.official_static?.cache_control || 'public, max-age=31536000, immutable';
  return {
    schema: 'traveltrust.g3_ocs_r2_upload_manifest.v1',
    baseline: 'Official Asset Baseline V1',
    bucket: policy?.object_lifecycle?.r2_bucket || 'traveltrust-community-media',
    prefix,
    cache_control: cacheControl,
    objects: (assetsDoc.assets || []).map((a) => ({
      asset_id: a.id,
      filename: a.filename,
      r2_key: `${prefix}/${a.filename}`,
      cdn_url: cdnPublicUrl(a.filename, policy),
      local_source: `data/official-cold-start/media/${a.filename}`,
      mime: a.mime || 'image/jpeg',
      content_length_expected: null,
    })),
  };
}

function buildCloudflareCacheRules(policy) {
  const officialPrefix = policy?.cdn?.official_assets?.prefix || 'official-cold-start/v1';
  const communityPrefix = policy?.cache_policy?.community_user_upload?.prefix || 'community-media/v1';
  const officialCache = policy?.cache_policy?.official_static || {};
  const communityCache = policy?.cache_policy?.community_user_upload || {};
  return {
    schema: 'traveltrust.g3_cloudflare_cache_rules.v1',
    provider: policy?.cdn?.provider || 'cloudflare',
    rules: [
      {
        id: 'official-cold-start-v1-immutable',
        description: 'Official Asset Baseline V1 — global edge cache · immutable',
        match: `https://cdn.traveltrust.app/${officialPrefix}/*`,
        cache: {
          edge_ttl_seconds: officialCache.edge_ttl_seconds || 31536000,
          browser_ttl_seconds: officialCache.browser_ttl_seconds || 31536000,
          cache_control_override: officialCache.cache_control,
          respect_origin: false,
        },
      },
      {
        id: 'community-media-v1',
        description: 'User/community upload prefix — 24h immutable',
        match: `https://cdn.traveltrust.app/${communityPrefix}/*`,
        cache: {
          edge_ttl_seconds: communityCache.edge_ttl_seconds || 86400,
          browser_ttl_seconds: communityCache.browser_ttl_seconds || 86400,
          cache_control_override: communityCache.cache_control,
          respect_origin: true,
        },
      },
    ],
    global_edge: policy?.global_edge || {},
  };
}

function buildR2LifecyclePolicy(policy) {
  const rules = policy?.object_lifecycle?.rules || [];
  return {
    schema: 'traveltrust.g3_r2_lifecycle_policy.v1',
    bucket: policy?.object_lifecycle?.r2_bucket || 'traveltrust-community-media',
    rules: rules.map((r) => ({
      id: r.id,
      prefix: r.prefix,
      status: r.status || 'ACTIVE',
      expiration_days: r.expiration_days ?? null,
      superseded_after_days: r.superseded_after_days ?? null,
      transition: r.transition ?? null,
      delete: r.delete === true,
      note: r.note || null,
    })),
  };
}

function buildProductionAssetUrlMap(assetsDoc, policy) {
  return (assetsDoc.assets || []).map((a) => ({
    asset_id: a.id,
    staging_api_path: a.public_url,
    production_cdn_url: cdnPublicUrl(a.filename, policy),
    filename: a.filename,
  }));
}

module.exports = {
  ROOT,
  REGISTRY_PATH,
  loadPolicyRegistry,
  cdnPublicUrl,
  buildR2UploadManifest,
  buildCloudflareCacheRules,
  buildR2LifecyclePolicy,
  buildProductionAssetUrlMap,
  loadAssetsManifest,
};
