/**
 * Official Asset Baseline V1 · shared helpers (OCS Single Source · no new platform APIs).
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const ROOT = path.join(__dirname, '../../..');
const ASSETS_MANIFEST = path.join(ROOT, 'data/official-cold-start/assets.v1.json');
const DATASET_MANIFEST = path.join(ROOT, 'data/official-cold-start/dataset.v1.json');
const MEDIA_DIR = path.join(ROOT, 'data/official-cold-start/media');
const COMMUNITY_MEDIA_DIR = path.join(ROOT, 'data/community_post_media');

/** Minimal valid 1×1 JPEG (baseline placeholder · decodable). */
const MIN_JPEG_B64 =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';
const MIN_JPEG = Buffer.from(MIN_JPEG_B64, 'base64');

const LEGACY_MEDIA_HOSTS = ['w3schools.com', 'samplelib.com', 'filesamples.com', 'unsplash.com'];

const CHAIN_ASSET_SLOTS = [
  { slot: 'guide-avatar', binds: [{ entity: 'guide', field: 'avatar_url' }] },
  { slot: 'provider-cover', binds: [{ entity: 'provider', field: 'cover_url' }] },
  { slot: 'acquisition-cover', binds: [{ entity: 'acquisition', field: 'cover_url' }] },
  { slot: 'official-guide-cover', binds: [{ entity: 'official_guide', field: 'cover_url' }] },
  { slot: 'community-cover', binds: [{ entity: 'community_post', field: 'cover_url' }] },
  { slot: 'community-media', binds: [{ entity: 'community_post', field: 'media_urls', index: 0 }] },
];

function loadAssetsManifest() {
  if (!fs.existsSync(ASSETS_MANIFEST)) {
    throw new Error(`missing assets manifest: ${ASSETS_MANIFEST}`);
  }
  return JSON.parse(fs.readFileSync(ASSETS_MANIFEST, 'utf8'));
}

function loadDataset() {
  return JSON.parse(fs.readFileSync(DATASET_MANIFEST, 'utf8'));
}

function publicCommunityUrl(filename) {
  return `/api/v1/uploads/community-posts/${filename}`;
}

function assetFilename(chainId, slot) {
  return `ocs-${chainId}-${slot}.jpg`;
}

function buildAssetsManifestFromDataset(dataset) {
  const assets = [];
  for (const chain of dataset.chains || []) {
    for (const def of CHAIN_ASSET_SLOTS) {
      const filename = assetFilename(chain.id, def.slot);
      assets.push({
        id: `ocs/${chain.id}/${def.slot}`,
        chain_id: chain.id,
        slot: def.slot,
        filename,
        public_url: publicCommunityUrl(filename),
        storage_dir: 'community_post_media',
        mime: 'image/jpeg',
        kind: 'image',
        source_file: `media/${filename}`,
        binds: def.binds,
      });
    }
  }
  return {
    schema: 'traveltrust.official_cold_start_assets.v1',
    version: 1,
    baseline: 'Official Asset Baseline V1',
    effective_utc: new Date().toISOString().slice(0, 10),
    storage_policy: {
      public_read: 'GET /api/v1/uploads/community-posts/:name (anonymous)',
      note: 'Flat filenames only — nested paths rejected by upload serve route',
    },
    assets,
  };
}

function applyAssetUrlsToDataset(dataset, assetsDoc) {
  const byChainSlot = new Map();
  for (const a of assetsDoc.assets) {
    byChainSlot.set(`${a.chain_id}:${a.slot}`, a.public_url);
  }
  for (const chain of dataset.chains || []) {
    if (chain.guide) {
      chain.guide.avatar_url = byChainSlot.get(`${chain.id}:guide-avatar`);
    }
    if (chain.provider) {
      chain.provider.cover_url = byChainSlot.get(`${chain.id}:provider-cover`);
    }
    if (chain.acquisition) {
      chain.acquisition.cover_url = byChainSlot.get(`${chain.id}:acquisition-cover`);
    }
    if (chain.official_guide) {
      chain.official_guide.cover_url = byChainSlot.get(`${chain.id}:official-guide-cover`);
    }
    if (chain.community_post) {
      chain.community_post.cover_url = byChainSlot.get(`${chain.id}:community-cover`);
      chain.community_post.media_urls = [byChainSlot.get(`${chain.id}:community-media`)];
    }
  }
  return dataset;
}

function writeMediaBinaries(assetsDoc, { force = false } = {}) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  const py = `
from PIL import Image
import sys
path, r, g, b = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
Image.new('RGB', (640, 480), (r, g, b)).save(path, quality=82)
`;
  for (let i = 0; i < (assetsDoc.assets || []).length; i++) {
    const a = assetsDoc.assets[i];
    const out = path.join(MEDIA_DIR, a.filename);
    if (!force && fs.existsSync(out) && fs.statSync(out).size > 4096) {
      continue;
    }
    const hash = a.filename.split('').reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) >>> 0, 0);
    const r = 40 + (hash % 80);
    const g = 50 + ((hash >> 8) % 70);
    const b = 60 + ((hash >> 16) % 60);
    try {
      const { execFileSync } = require('child_process');
      execFileSync('python', ['-c', py, out, String(r), String(g), String(b)], { stdio: 'pipe' });
    } catch {
      fs.writeFileSync(out, MIN_JPEG);
    }
  }
}

function bootstrapLocalAssets(assetsDoc, { targetDir = COMMUNITY_MEDIA_DIR } = {}) {
  fs.mkdirSync(targetDir, { recursive: true });
  const copied = [];
  for (const a of assetsDoc.assets) {
    const src = path.join(MEDIA_DIR, a.filename);
    const dst = path.join(targetDir, a.filename);
    if (!fs.existsSync(src)) {
      fs.writeFileSync(src, MIN_JPEG);
    }
    fs.copyFileSync(src, dst);
    copied.push({ filename: a.filename, dst });
  }
  return copied;
}

function resolvePublicUrl(apiBase, publicPath) {
  const base = (apiBase || '').replace(/\/$/, '');
  if (!publicPath) return '';
  if (/^https?:\/\//i.test(publicPath)) return publicPath;
  return `${base}${publicPath.startsWith('/') ? '' : '/'}${publicPath}`;
}

function httpRequest(url, method = 'GET', timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request(url, { method, timeout: timeoutMs }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        resolve({
          status: res.statusCode || 0,
          headers: res.headers,
          body: Buffer.concat(chunks),
        });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.end();
  });
}

function isJpegDecodable(buf) {
  return buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

function isPngDecodable(buf) {
  return (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  );
}

function isImageDecodable(buf, mime) {
  const m = (mime || '').toLowerCase();
  if (m.includes('png')) return isPngDecodable(buf);
  if (m.includes('webp')) return buf.length >= 12;
  return isJpegDecodable(buf);
}

async function verifyAssetDelivery(apiBase, asset, opts = {}) {
  const url = resolvePublicUrl(apiBase, asset.public_url);
  const retries = Number(opts.retries ?? 3);
  let head;
  let get;
  for (let attempt = 0; attempt <= retries; attempt++) {
    head = await httpRequest(url, 'HEAD');
    get = await httpRequest(url, 'GET');
    if (head.status !== 429 && get.status !== 429) break;
    await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
  }

  const mime = String(get.headers['content-type'] || head.headers['content-type'] || '').split(';')[0].trim();
  const len = Number(get.headers['content-length'] || head.headers['content-length'] || get.body?.length || 0);
  const body = get.body || Buffer.alloc(0);

  const checks = {
    head_200: head.status === 200,
    get_200: get.status === 200,
    mime_ok: !asset.mime || mime === asset.mime || (asset.kind === 'image' && mime.startsWith('image/')),
    content_length_ok: len > 0,
    decodable: asset.kind === 'image' ? isImageDecodable(body, mime || asset.mime) : body.length > 0,
  };
  const ok = Object.values(checks).every(Boolean);
  return {
    ok,
    url,
    status: get.status,
    mime,
    content_length: len,
    checks,
  };
}

function collectPublishedMediaUrls(dataset, state) {
  const urls = new Set();
  for (const chain of dataset.chains || []) {
    for (const def of CHAIN_ASSET_SLOTS) {
      const slot = def.slot;
      const a = `${chain.id}:${slot}`;
      const assetsDoc = fs.existsSync(ASSETS_MANIFEST) ? loadAssetsManifest() : null;
      if (assetsDoc) {
        const row = assetsDoc.assets.find((x) => x.chain_id === chain.id && x.slot === slot);
        if (row?.public_url) urls.add(row.public_url);
      }
    }
    if (chain.guide?.avatar_url) urls.add(chain.guide.avatar_url);
    if (chain.provider?.cover_url) urls.add(chain.provider.cover_url);
    if (chain.acquisition?.cover_url) urls.add(chain.acquisition.cover_url);
    if (chain.official_guide?.cover_url) urls.add(chain.official_guide.cover_url);
    if (chain.community_post?.cover_url) urls.add(chain.community_post.cover_url);
    for (const u of chain.community_post?.media_urls || []) urls.add(u);
  }
  return [...urls].filter(Boolean);
}

function legacyMediaViolations(urls) {
  const v = [];
  for (const u of urls) {
    const s = String(u).toLowerCase();
    if (LEGACY_MEDIA_HOSTS.some((h) => s.includes(h))) {
      v.push({ url: u, type: 'legacy_host' });
    }
    if (s.includes('showcase') || s.includes('samplelib')) {
      v.push({ url: u, type: 'showcase' });
    }
    if (s.includes('/ocs/') && s.split('/').length > 6) {
      v.push({ url: u, type: 'invalid_nested_path' });
    }
  }
  return v;
}

async function verifyAllAssets(apiBase, assetsDoc, opts = {}) {
  const delayMs = Number(opts.delayMs ?? process.env.OCS_ASSET_VERIFY_DELAY_MS ?? 250);
  const results = [];
  for (const asset of assetsDoc.assets) {
    const r = await verifyAssetDelivery(apiBase, asset);
    results.push({ asset_id: asset.id, filename: asset.filename, ...r });
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }
  const ok = results.every((r) => r.ok);
  return { ok, results };
}

module.exports = {
  ROOT,
  ASSETS_MANIFEST,
  DATASET_MANIFEST,
  MEDIA_DIR,
  COMMUNITY_MEDIA_DIR,
  MIN_JPEG,
  CHAIN_ASSET_SLOTS,
  LEGACY_MEDIA_HOSTS,
  loadAssetsManifest,
  loadDataset,
  publicCommunityUrl,
  assetFilename,
  buildAssetsManifestFromDataset,
  applyAssetUrlsToDataset,
  writeMediaBinaries,
  bootstrapLocalAssets,
  resolvePublicUrl,
  verifyAssetDelivery,
  verifyAllAssets,
  collectPublishedMediaUrls,
  legacyMediaViolations,
  isImageDecodable,
};
