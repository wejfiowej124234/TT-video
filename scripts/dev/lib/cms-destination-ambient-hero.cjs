/**
 * Destination Ambient Hero · shared helpers (3840×2160 Visual L5 track)
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const ROOT = path.join(__dirname, '../../..');
const HERO_MATRIX = path.join(ROOT, 'data/catalog/destination-ambient-hero-matrix.v1.yaml');
const PIPELINE_MATRIX = path.join(ROOT, 'data/catalog/destination-ambient-matrix.v1.yaml');
const HERO_MEDIA_DIR = path.join(ROOT, 'data/catalog/media/destination-ambient-hero');
const COMMUNITY_MEDIA_DIR = path.join(ROOT, 'data/community_post_media');
const EVID_DIR = path.join(ROOT, 'evidence/GO_cms_content_l5/destination-ambient-hero/rows');

const HERO_TIERS = {
  PASS: { min_width_px: 3840, min_height_px: 2160, label: 'Hero Recommended' },
  WARN: { min_width_px: 1920, min_height_px: 1080, label: 'Hero Minimum' },
  FAIL: { min_width_px: 0, min_height_px: 0, label: 'Below minimum or undecodable' },
};

const MIN_BYTES = 16 * 1024;
const ASPECT_TARGET = 16 / 9;
const ASPECT_TOLERANCE = 0.02;

function unsplashHeroUrl(slug) {
  return `https://images.unsplash.com/photo-${slug}?auto=format&fit=crop&w=3840&h=2160&q=92&fm=jpg`;
}

function pngDimensions(buf) {
  if (!buf || buf.length < 24) return null;
  const sig = buf.slice(0, 8).toString('hex');
  if (sig !== '89504e470d0a1a0a') return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function imageDimensions(buf) {
  return jpegDimensions(buf) || pngDimensions(buf);
}

function heroPublicPath(filename) {
  return `/api/v1/uploads/community-posts/${filename}`;
}

function heroPublicUrl(apiBase, filename) {
  return `${apiBase.replace(/\/$/, '')}${heroPublicPath(filename)}`;
}

function parseHeroMatrixRows(text) {
  const rows = [];
  for (const block of text.split(/\n  - matrix_id:/).slice(1)) {
    const matrix_id = block.match(/^ ([^\n]+)/)?.[1]?.trim();
    if (!matrix_id) continue;
    const get = (key) => block.match(new RegExp(`\\n    ${key}: "?([^"\\n]+)"?`))?.[1]?.trim();
    const getNested = (parent, key) => {
      const re = new RegExp(`\\n    ${parent}:[\\s\\S]*?\\n      ${key}: "?([^"\\n]+)"?`);
      return block.match(re)?.[1]?.trim();
    };
    rows.push({
      matrix_id,
      pipeline_matrix_id: get('pipeline_matrix_id'),
      execution_order: Number(get('execution_order') || 0),
      country_zh: get('country_zh'),
      country_iso: get('country_iso'),
      landmark_zh: get('landmark_zh'),
      ts_reference_slug: get('ts_reference_slug'),
      pipeline_public_url_file: get('pipeline_public_url_file'),
      hero_filename: getNested('hero_target', 'filename'),
      hero_width_px: Number(getNested('hero_target', 'width_px') || 3840),
      hero_height_px: Number(getNested('hero_target', 'height_px') || 2160),
      visual_l5_status: get('visual_l5_status'),
      hero_lifecycle: get('hero_lifecycle'),
    });
  }
  return rows.sort((a, b) => a.execution_order - b.execution_order);
}

function parseHeroMatrixRow(text, matrixId) {
  return parseHeroMatrixRows(text).find((r) => r.matrix_id === matrixId) || null;
}

function jpegDimensions(buf) {
  if (!buf || buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    if (marker === 0xc0 || marker === 0xc2 || marker === 0xc1) {
      return {
        height: buf.readUInt16BE(i + 5),
        width: buf.readUInt16BE(i + 7),
      };
    }
    const len = buf.readUInt16BE(i + 2);
    if (len < 2) break;
    i += 2 + len;
  }
  return null;
}

function classifyHeroTier(width, height) {
  if (!width || !height) return { tier: 'FAIL', ...HERO_TIERS.FAIL };
  if (width >= HERO_TIERS.PASS.min_width_px && height >= HERO_TIERS.PASS.min_height_px) {
    return { tier: 'PASS', ...HERO_TIERS.PASS, width, height };
  }
  if (width >= HERO_TIERS.WARN.min_width_px && height >= HERO_TIERS.WARN.min_height_px) {
    return { tier: 'WARN', ...HERO_TIERS.WARN, width, height };
  }
  return { tier: 'FAIL', ...HERO_TIERS.FAIL, width, height };
}

function aspectRatioOk(width, height) {
  if (!width || !height) return false;
  const ratio = width / height;
  return Math.abs(ratio - ASPECT_TARGET) / ASPECT_TARGET <= ASPECT_TOLERANCE;
}

function fetchBuffer(url, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchBuffer(res.headers.location, timeoutMs).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} ${url}`));
        res.resume();
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`timeout ${url}`));
    });
  });
}

async function ensureHeroFileLocal(row, { force = false } = {}) {
  const filename = row.hero_filename;
  if (!filename) throw new Error(`missing hero_filename for ${row.matrix_id}`);
  fs.mkdirSync(HERO_MEDIA_DIR, { recursive: true });
  fs.mkdirSync(COMMUNITY_MEDIA_DIR, { recursive: true });
  const heroPath = path.join(HERO_MEDIA_DIR, filename);
  const servePath = path.join(COMMUNITY_MEDIA_DIR, filename);

  if (!force && fs.existsSync(heroPath)) {
    const buf = fs.readFileSync(heroPath);
    const dim = imageDimensions(buf);
    const tier = classifyHeroTier(dim?.width, dim?.height);
    if (tier.tier === 'PASS') {
      if (!fs.existsSync(servePath)) fs.copyFileSync(heroPath, servePath);
      return { heroPath, servePath, dim, tier, source: 'local_cache', bytes: buf.length };
    }
  }

  const src = unsplashHeroUrl(row.ts_reference_slug);
  console.log(`HERO_FETCH: ${row.matrix_id} ← ${src.slice(0, 80)}…`);
  const buf = await fetchBuffer(src);
  const dim = imageDimensions(buf);
  const tier = classifyHeroTier(dim?.width, dim?.height);
  if (tier.tier === 'FAIL') {
    throw new Error(`${row.matrix_id} fetched image ${dim?.width}×${dim?.height} below WARN minimum`);
  }
  if (buf.length < MIN_BYTES) throw new Error(`${row.matrix_id} bytes ${buf.length} < ${MIN_BYTES}`);
  if (!aspectRatioOk(dim.width, dim.height)) {
    console.warn(`HERO_ASPECT_WARN: ${row.matrix_id} ${dim.width}×${dim.height}`);
  }
  fs.writeFileSync(heroPath, buf);
  fs.copyFileSync(heroPath, servePath);
  return { heroPath, servePath, dim, tier, source: 'unsplash_3840x2160', bytes: buf.length };
}

async function headOk(url, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const u = new URL(url);
    const req = lib.request({ method: 'HEAD', hostname: u.hostname, path: u.pathname + u.search, timeout: timeoutMs }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.end();
  });
}

/** Staging 上 cp 已有 da-hero-jp-home-v1 → ocs-*（无需本地上传字节 · 须 fly auth） */
async function seedHeroOnStagingRemoteCp(heroFile, { flyApp = 'tt-api-staging', sourceFile = 'da-hero-jp-home-v1.jpg', apiBase = 'https://tt-api-staging.fly.dev' } = {}) {
  const url = heroPublicUrl(apiBase, heroFile);
  if (await headOk(url)) return { ok: true, method: 'already_on_staging' };
  const { execFileSync } = require('child_process');
  const remoteCmd = `cp data/community_post_media/${sourceFile} data/community_post_media/${heroFile}`;
  execFileSync('fly', ['ssh', 'console', '-a', flyApp, '-C', remoteCmd], {
    stdio: 'pipe',
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  });
  if (await headOk(url)) return { ok: true, method: 'fly_remote_cp' };
  throw new Error(`staging hero still missing after remote cp: ${heroFile}`);
}

/** Content QA · 确保 staging 可读 hero（HEAD → remote cp → sftp） */
async function ensureCmsQaHeroOnStaging(heroFile, apiBase) {
  const url = heroPublicUrl(apiBase, heroFile);
  fs.mkdirSync(COMMUNITY_MEDIA_DIR, { recursive: true });
  const localPath = path.join(COMMUNITY_MEDIA_DIR, heroFile);
  if (!fs.existsSync(localPath)) {
    const buf = await fetchBuffer(heroPublicUrl(apiBase, 'da-hero-jp-home-v1.jpg'));
    fs.writeFileSync(localPath, buf);
  }
  if (await headOk(url)) return { method: 'already_on_staging' };
  try {
    const cp = await seedHeroOnStagingRemoteCp(heroFile, { apiBase });
    console.log(`STAGING_HERO: ${heroFile} via ${cp.method}`);
    return cp;
  } catch (e) {
    console.warn(`REMOTE_CP_WARN: ${e.message || e}`);
  }
  if (process.env.CMS_QA_SKIP_FLY_SYNC === '1') {
    throw new Error(`CMS_QA_SKIP_FLY_SYNC=1 and staging missing ${heroFile}`);
  }
  try {
    syncHeroFilesToFly([heroFile]);
  } catch (e) {
    throw new Error(`staging hero sync failed for ${heroFile}: ${e.message || e} · run: fly auth login`);
  }
  if (!(await headOk(url))) throw new Error(`staging hero HEAD fail: ${url}`);
  return { method: 'fly_sftp' };
}

function syncHeroFilesToFly(filenames, flyApp = 'tt-api-staging') {
  const { execFileSync } = require('child_process');
  const names = (Array.isArray(filenames) ? filenames : [filenames]).filter(Boolean);
  const uploaded = [];
  const skipped = [];
  for (const name of names) {
    const localPath = path.join(COMMUNITY_MEDIA_DIR, name);
    if (!fs.existsSync(localPath)) throw new Error(`missing local hero ${localPath}`);
    const remotePath = `data/community_post_media/${name}`;
    try {
      execFileSync('fly', ['ssh', 'sftp', 'put', '-a', flyApp, localPath, remotePath], {
        stdio: 'pipe',
        encoding: 'utf8',
        maxBuffer: 8 * 1024 * 1024,
      });
      uploaded.push(name);
    } catch (e) {
      const msg = String(e.stderr || e.message || e);
      if (/already exists/i.test(msg)) {
        skipped.push(name);
        continue;
      }
      throw e;
    }
  }
  return { filenames: names, uploaded, skipped, fly_app: flyApp, method: 'fly_ssh_sftp_put' };
}

function syncHeroFileToFly(row, flyApp = 'tt-api-staging') {
  return syncHeroFilesToFly([row.hero_filename], flyApp);
}

async function verifyHeroAssetUrl(url, requireTier = 'PASS') {
  const buf = await fetchBuffer(url);
  const dim = imageDimensions(buf);
  const tier = classifyHeroTier(dim?.width, dim?.height);
  const aspectOk = aspectRatioOk(dim?.width, dim?.height);
  const bytesOk = buf.length >= MIN_BYTES;
  const tierOk = requireTier === 'WARN' ? tier.tier !== 'FAIL' : tier.tier === 'PASS';
  return {
    ok: tierOk && bytesOk && aspectOk,
    dim,
    tier,
    bytes: buf.length,
    aspectOk,
    checks: {
      decode: Boolean(dim),
      tier: tier.tier,
      bytesOk,
      aspectOk,
    },
  };
}

module.exports = {
  ROOT,
  HERO_MATRIX,
  PIPELINE_MATRIX,
  HERO_MEDIA_DIR,
  COMMUNITY_MEDIA_DIR,
  EVID_DIR,
  HERO_TIERS,
  MIN_BYTES,
  unsplashHeroUrl,
  heroPublicPath,
  heroPublicUrl,
  parseHeroMatrixRows,
  parseHeroMatrixRow,
  jpegDimensions,
  pngDimensions,
  imageDimensions,
  classifyHeroTier,
  aspectRatioOk,
  fetchBuffer,
  ensureHeroFileLocal,
  ensureCmsQaHeroOnStaging,
  seedHeroOnStagingRemoteCp,
  headOk,
  syncHeroFileToFly,
  syncHeroFilesToFly,
  verifyHeroAssetUrl,
};
