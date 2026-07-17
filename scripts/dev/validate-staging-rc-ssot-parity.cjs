#!/usr/bin/env node
/**
 * Validate Staging runtime matches OCS SSOT + Release Candidate boundaries (② only).
 *
 *   node scripts/dev/validate-staging-rc-ssot-parity.cjs [EVID_DIR]
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { isStagingCorridorSmokeBody } = require('./lib/staging-corridor-smoke.cjs');
const { findLatestOcsStatePath } = require('./lib/smoke-data-heuristics.cjs');
const { loadUnifiedBaseline, isPublishedOfficialGuide, isDeployedCampaign } = require('./lib/staging-rc-public-surface-unified.cjs');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const WEB = (process.env.WEB || process.env.WEB_BASE || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');
const evidDir = process.argv[2] || process.env.SSOT_EVIDENCE_DIR || '';

/** COS permanent · staging_primary = fly_tigris（registry/psg-p0-4-cos-permanent.v1.yaml） */
const COMMUNITY_MEDIA_TIGRIS_HOST = 'traveltrust-community-media.fly.storage.tigris.dev';
/** PI3 CDN cutover target — accept early so RC does not regress after cutover */
const COMMUNITY_MEDIA_CDN_HOST = 'cdn.traveltrust.app';

const lib = API.startsWith('https') ? https : http;

/**
 * MED-02: accept OCS covers that are either legacy upload paths or COS permanent absolute URLs.
 * Do not require `/api/v1/uploads/...` after Tigris rebind.
 */
function isAcceptableOcsMediaCover(cover) {
  const s = String(cover || '');
  if (!s.includes('ocs-')) return false;
  if (s.includes('/api/v1/uploads/')) return true;
  if (!(s.startsWith('http://') || s.startsWith('https://'))) return false;
  try {
    const h = new URL(s).hostname.toLowerCase();
    return h === COMMUNITY_MEDIA_TIGRIS_HOST || h === COMMUNITY_MEDIA_CDN_HOST;
  } catch {
    return false;
  }
}

/** MED-03: absolute media URLs HEAD directly; relative paths stay WEB-prefixed. */
function mediaHeadTarget(cover) {
  const s = String(cover || '');
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${WEB}${s}`;
  return `${WEB}/${s}`;
}

function get(urlPath) {
  return new Promise((resolve, reject) => {
    const u = new URL(API + urlPath);
    const r = lib.request({ hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method: 'GET' }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(d) });
        } catch {
          resolve({ status: res.statusCode, json: { _raw: d.slice(0, 300) } });
        }
      });
    });
    r.on('error', reject);
    r.end();
  });
}

function head(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const r = lib.request({ hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method: 'HEAD' }, (res) => {
      res.resume();
      resolve(res.statusCode || 0);
    });
    r.on('error', reject);
    r.end();
  });
}

(async () => {
  const statePath = process.env.OCS_STATE || findLatestOcsStatePath(ROOT) || '';
  const baseline = loadUnifiedBaseline(ROOT);
  const {
    ocsGuideIds,
    ocsListingIds,
    ocsCommunityPostIds,
    ocsOfficialGuideIds,
    ocsCampaignIds,
    ocs_state,
    expected,
  } = baseline;
  const failures = [];
  const passes = [];

  if (ocsCommunityPostIds.size !== expected.community_feed) {
    failures.push(`ocs_community_posts=${ocsCommunityPostIds.size} expected ${expected.community_feed} state=${ocs_state}`);
  } else {
    passes.push('ocs_state_10_posts');
  }
  if (ocsOfficialGuideIds.size !== expected.official_guides_published) {
    failures.push(`ocs_official_guides=${ocsOfficialGuideIds.size} expected ${expected.official_guides_published}`);
  } else {
    passes.push('ocs_state_10_official_guides');
  }
  if (ocsCampaignIds.size !== expected.campaigns_deployed) {
    failures.push(`ocs_campaigns=${ocsCampaignIds.size} expected ${expected.campaigns_deployed}`);
  } else {
    passes.push('ocs_state_10_campaigns');
  }

  const feed = await get('/api/v1/community/feed?limit=50');
  const posts = feed.json.posts || [];
  if (posts.length !== 10) {
    failures.push(`feed_count=${posts.length} expected 10`);
  } else {
    passes.push('feed_count_10');
  }

  for (const p of posts) {
    if (!ocsCommunityPostIds.has(String(p.id))) {
      failures.push(`feed_non_ocs_post=${p.id}`);
    }
    if (isStagingCorridorSmokeBody(p.body || '')) {
      failures.push(`feed_smoke_body=${p.id}`);
    }
    const cover = p.cover_url || '';
    if (!isAcceptableOcsMediaCover(cover)) {
      failures.push(`feed_bad_cover=${p.id}`);
    }
  }
  if (!failures.some((f) => f.startsWith('feed_'))) {
    passes.push('feed_ocs_only');
  }

  const guides = await get('/api/v1/guides?limit=50');
  const guideItems = guides.json.items || guides.json.guides || [];
  if (guideItems.length !== 10) {
    failures.push(`public_guides=${guideItems.length} expected 10`);
  } else if (guideItems.every((g) => ocsGuideIds.has(String(g.id)))) {
    passes.push('guides_ocs_only');
  } else {
    failures.push('public_guides_non_ocs');
  }

  for (const variant of ['provider', 'acquisition']) {
    const market = await get(`/api/v1/market/${variant}/listings?limit=50`);
    const rows = market.json.items || market.json.listings || [];
    const want = variant === 'provider' ? expected.market_provider : expected.market_acquisition;
    if (rows.length !== want) {
      failures.push(`market_${variant}=${rows.length} expected ${want}`);
    } else if (rows.every((r) => ocsListingIds.has(String(r.id)))) {
      passes.push(`market_${variant}_ocs_only`);
    } else {
      failures.push(`market_${variant}_non_ocs`);
    }
    for (const r of rows) {
      const p = r.payload && typeof r.payload === 'object' ? r.payload : {};
      const raw = p.cover_url || p.coverUrl || p.videoUrl || p.video_url || '';
      if (!isAcceptableOcsMediaCover(raw)) {
        failures.push(`market_${variant}_missing_cover=${r.id}`);
      }
    }
  }

  const disc = await get('/api/v1/discover/orders?limit=50');
  const discRows = disc.json.items || [];
  if (discRows.length !== 0) {
    failures.push(`discover_public=${discRows.length} expected 0`);
  } else {
    passes.push('discover_smoke_zero');
  }

  try {
    const client = createClient(API);
    const adminTok = await client.adminLogin(
      process.env.ADMIN_EMAIL || 'tourist@test.com',
      process.env.ADMIN_PASS || 'Test123!'
    );
    const ogR = await client.req('GET', '/api/v1/admin/official/guides?limit=200', null, adminTok);
    const ogPublished = (ogR.json.items || ogR.json.guides || []).filter(isPublishedOfficialGuide);
    if (ogPublished.length !== expected.official_guides_published) {
      failures.push(`official_guides_published=${ogPublished.length} expected ${expected.official_guides_published}`);
    } else if (ogPublished.every((r) => ocsOfficialGuideIds.has(String(r.id)))) {
      passes.push('official_guides_ocs_only');
    } else {
      failures.push('official_guides_non_ocs');
    }

    const campR = await client.req(
      'GET',
      '/api/v1/admin/official/public-operations/campaigns?limit=200',
      null,
      adminTok
    );
    const campDeployed = (campR.json.items || []).filter(isDeployedCampaign);
    if (campDeployed.length !== expected.campaigns_deployed) {
      failures.push(`campaigns_deployed=${campDeployed.length} expected ${expected.campaigns_deployed}`);
    } else if (campDeployed.every((r) => ocsCampaignIds.has(String(r.id)))) {
      passes.push('campaigns_ocs_only');
    } else {
      failures.push('campaigns_non_ocs');
    }
  } catch (e) {
    failures.push(`admin_official_probe=${String(e.message || e).slice(0, 80)}`);
  }

  const sampleCover = posts[0]?.cover_url;
  if (sampleCover) {
    const mediaUrl = mediaHeadTarget(sampleCover);
    const code = await head(mediaUrl);
    if (code === 200 || code === 206) passes.push('web_rewrite_media_200');
    else failures.push(`web_media_head=${code} url=${mediaUrl}`);

    // MED-01 regression tripwire: absolute Tigris/CDN must be allowed by Staging next/image
    if (/^https?:\/\//i.test(String(sampleCover))) {
      try {
        const enc = encodeURIComponent(String(sampleCover));
        const nextImg = `${WEB}/_next/image?url=${enc}&w=640&q=75`;
        const imgCode = await head(nextImg);
        if (imgCode === 200 || imgCode === 206) passes.push('next_image_absolute_media_200');
        else failures.push(`next_image_media_head=${imgCode} url=${nextImg}`);
      } catch (e) {
        failures.push(`next_image_media_probe=${String(e.message || e).slice(0, 80)}`);
      }
    }
  }

  const report = {
    schema: 'traveltrust.staging_rc_ssot_parity.v1',
    recorded_at: new Date().toISOString(),
    api: API,
    web: WEB,
    ocs_state: ocs_state || statePath,
    release_candidate_ref:
      'evidence/manual-uat/signoff/RELEASE-CANDIDATE-SIGNOFF-20260702T144513Z.md',
    manifest_ssot: 'data/official-cold-start/dataset.v1.json',
    assets_ssot: 'data/official-cold-start/assets.v1.json',
    unified_baseline: 'scripts/dev/lib/staging-rc-public-surface-unified.cjs',
    expected_public_surface: expected,
    verdict: failures.length === 0 ? 'ALIGNED' : 'FAIL',
    machine_keys: {
      TT_STAGING_RC_SSOT_PARITY: failures.length === 0 ? 'ALIGNED' : 'FAIL',
      TT_PRODUCTION_GO: 'NO_GO',
    },
    passes,
    failures,
    honest_boundary:
      'Staging ALIGNED to OCS SSOT + RC boundaries ≠ Production GO ≠ G3 CDN VERIFIED',
    forbidden_claims: ['Production GO', 'Release published', 'G3 CDN VERIFIED'],
  };

  if (evidDir) {
    fs.mkdirSync(evidDir, { recursive: true });
    fs.writeFileSync(path.join(evidDir, 'staging-rc-ssot-parity.json'), JSON.stringify(report, null, 2) + '\n');
    fs.writeFileSync(
      path.join(evidDir, 'STATUS.txt'),
      `TT_STAGING_RC_SSOT_PARITY: ${report.machine_keys.TT_STAGING_RC_SSOT_PARITY}\nat=${path.basename(evidDir)}\nfailures=${failures.length}\n`
    );
  }

  console.log(`STAGING_RC_SSOT_PARITY: ${report.verdict}`);
  for (const f of failures) console.error(`FAIL: ${f}`);
  process.exit(failures.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
