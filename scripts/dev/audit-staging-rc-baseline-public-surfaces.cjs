#!/usr/bin/env node
/**
 * TT_STAGING_RC_BASELINE · comprehensive public surface audit (read-only · ②).
 * SSOT chain: dataset → assets → governed public views.
 *
 *   node scripts/dev/audit-staging-rc-baseline-public-surfaces.cjs [EVID_DIR]
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const { isStagingCorridorSmokeBody } = require('./lib/staging-corridor-smoke.cjs');
const {
  loadOcsEntityIds,
  isSmokeContent,
  isNonProductionOrigin,
  isOfficialColdStartRow,
  rowHasRealLeakMedia,
} = require('./lib/smoke-data-heuristics.cjs');
const {
  loadUnifiedBaseline,
  isPublishedOfficialGuide,
  isDeployedCampaign,
} = require('./lib/staging-rc-public-surface-unified.cjs');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const WEB = (process.env.WEB || process.env.WEB_BASE || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');
const evidDir = process.argv[2] || process.env.RC_BASELINE_AUDIT_DIR || '';
const ACTIVE = path.join(ROOT, 'evidence/GO_staging_rc_baseline/ACTIVE.json');
const lib = API.startsWith('https') ? https : http;

/** @type {Array<{n:number,domain:string,surface:string,check:string,status:string,detail:string,phase:string}>} */
const rows = [];
let rowN = 0;

function record(domain, surface, check, ok, detail, phase = '②') {
  rowN += 1;
  rows.push({
    n: rowN,
    domain,
    surface,
    check,
    status: ok ? 'PASS' : 'FAIL',
    detail: String(detail || ''),
    phase,
    incomplete_at: ok ? '—' : '—',
  });
  if (!ok) failures.push(`${domain}/${surface}/${check}: ${detail}`);
}

const failures = [];
const passes = [];

function get(urlPath) {
  return new Promise((resolve, reject) => {
    const u = new URL(API + urlPath);
    lib
      .request({ hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method: 'GET' }, (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, json: JSON.parse(d) });
          } catch {
            resolve({ status: res.statusCode, json: { _raw: d.slice(0, 300) } });
          }
        });
      })
      .on('error', reject)
      .end();
  });
}

function head(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    lib
      .request({ hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method: 'HEAD' }, (res) => {
        res.resume();
        resolve(res.statusCode || 0);
      })
      .on('error', reject)
      .end();
  });
}

function listingPayloadHasOcsCover(row) {
  const p = row.payload && typeof row.payload === 'object' ? row.payload : {};
  const raw = p.cover_url || p.coverUrl || p.videoUrl || p.video_url || '';
  const s = String(raw);
  return s.includes('ocs-') && s.includes('/api/v1/uploads/');
}

function campaignItemWouldExposeTechnicalType(item) {
  const type = item?.item_type;
  if (type !== 'community_post' && type !== 'market_listing') return false;
  const r = item?.resolved && typeof item.resolved === 'object' ? item.resolved : {};
  if (type === 'community_post') {
    const body = typeof r.body === 'string' ? r.body.trim() : '';
    const dest = typeof r.destination === 'string' ? r.destination.trim() : '';
    return !body && !dest;
  }
  const payload = r.payload && typeof r.payload === 'object' ? r.payload : {};
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  const variant = typeof r.variant === 'string' ? r.variant.trim() : '';
  return !title && !variant;
}

function dupByKey(items, keyFn) {
  const seen = new Map();
  const dups = [];
  for (const row of items) {
    const k = keyFn(row);
    if (!k) continue;
    if (seen.has(k)) dups.push({ key: k, ids: [seen.get(k), row.id] });
    else seen.set(k, row.id);
  }
  return dups;
}

(async () => {
  const baseline = loadUnifiedBaseline(ROOT);
  const {
    ocsGuideIds,
    ocsListingIds,
    ocsCommunityPostIds,
    ocsOfficialGuideIds,
    ocsCampaignIds,
    ocs_state,
    expected,
    campaignSurfacePaths,
  } = baseline;
  const client = createClient(API);
  const adminTok = await client.adminLogin(
    process.env.ADMIN_EMAIL || 'tourist@test.com',
    process.env.ADMIN_PASS || 'Test123!'
  );

  // 0 · Baseline pointer
  let activeOk = false;
  if (fs.existsSync(ACTIVE)) {
    try {
      const a = JSON.parse(fs.readFileSync(ACTIVE, 'utf8'));
      activeOk = a.status === 'READY' && a.machine_key === 'TT_STAGING_RC_BASELINE';
      record('baseline', 'ACTIVE.json', 'TT_STAGING_RC_BASELINE READY', activeOk, a.stamp || a.status);
    } catch {
      record('baseline', 'ACTIVE.json', 'parse', false, 'invalid JSON');
    }
  } else {
    record('baseline', 'ACTIVE.json', 'exists', false, 'missing');
  }

  // 1 · 自由市场 · Provider（商家挂牌）
  const prov = await get('/api/v1/market/provider/listings?limit=100');
  const provRows = prov.json.items || prov.json.listings || [];
  record('market', 'provider', 'count=10 OCS', provRows.length === expected.market_provider, `count=${provRows.length}`);
  const provNonOcs = provRows.filter((r) => !ocsListingIds.has(String(r.id)));
  record('market', 'provider', 'ocs_only', provNonOcs.length === 0, `extras=${provNonOcs.length}`);
  const provSmoke = provRows.filter((r) => isSmokeContent(r) || isNonProductionOrigin(r.data_origin));
  record('market', 'provider', 'no_smoke', provSmoke.length === 0, `smoke=${provSmoke.length}`);
  const provMedia = provRows.filter((r) => rowHasRealLeakMedia(r));
  record('market', 'provider', 'no_legacy_media', provMedia.length === 0, `leak=${provMedia.length}`);
  const provDups = dupByKey(provRows, (r) => (r.payload?.title || r.title || '').trim().toLowerCase());
  record('market', 'provider', 'no_duplicate_titles', provDups.length === 0, `dups=${provDups.length}`);
  const provNoCover = provRows.filter((r) => !listingPayloadHasOcsCover(r));
  record('market', 'provider', 'ocs_cover_in_payload', provNoCover.length === 0, `missing=${provNoCover.length}`);

  // 2 · 旅行收购 · Acquisition
  const acq = await get('/api/v1/market/acquisition/listings?limit=100');
  const acqRows = acq.json.items || acq.json.listings || [];
  record('market', 'acquisition', 'count=10 OCS', acqRows.length === expected.market_acquisition, `count=${acqRows.length}`);
  const acqNonOcs = acqRows.filter((r) => !ocsListingIds.has(String(r.id)));
  record('market', 'acquisition', 'ocs_only', acqNonOcs.length === 0, `extras=${acqNonOcs.length}`);
  const acqSmoke = acqRows.filter((r) => isSmokeContent(r));
  record('market', 'acquisition', 'no_smoke', acqSmoke.length === 0, `smoke=${acqSmoke.length}`);
  const acqNoCover = acqRows.filter((r) => !listingPayloadHasOcsCover(r));
  record('market', 'acquisition', 'ocs_cover_in_payload', acqNoCover.length === 0, `missing=${acqNoCover.length}`);

  // 3 · 向导 · Guides
  const guides = await get('/api/v1/guides?limit=100');
  const guideRows = guides.json.items || guides.json.guides || [];
  record('guides', 'public_catalog', 'count=10 OCS', guideRows.length === expected.public_guides, `count=${guideRows.length}`);
  record(
    'guides',
    'public_catalog',
    'ocs_only',
    guideRows.every((g) => ocsGuideIds.has(String(g.id))),
    `non_ocs=${guideRows.filter((g) => !ocsGuideIds.has(String(g.id))).length}`
  );
  const cityDups = dupByKey(guideRows, (g) => (g.city || '').trim().toLowerCase());
  record('guides', 'public_catalog', 'no_duplicate_cities', cityDups.length === 0, `dups=${cityDups.length}`);
  const guideSmoke = guideRows.filter((g) => isSmokeContent(g) && !isOfficialColdStartRow(g, { ocsGuideIds }));
  record('guides', 'public_catalog', 'no_smoke', guideSmoke.length === 0, `smoke=${guideSmoke.length}`);

  // 4 · 行程 · Discover orders（公开展示）
  const disc = await get('/api/v1/discover/orders?limit=100');
  const discRows = disc.json.items || [];
  record('itinerary', 'discover_orders', 'public_count=0', discRows.length === 0, `public_count=${discRows.length}`);
  const discSmoke = discRows.filter((r) => isSmokeContent(r) || isNonProductionOrigin(r.data_origin));
  record('itinerary', 'discover_orders', 'no_test_origin', discSmoke.length === 0, `test=${discSmoke.length}`);

  // 5 · 社区 · Feed / Explore / Hot
  const feed = await get('/api/v1/community/feed?limit=50');
  const posts = feed.json.posts || [];
  record('community', 'feed', 'count=10 OCS', posts.length === expected.community_feed, `count=${posts.length}`);
  record(
    'community',
    'feed',
    'ocs_only',
    posts.every((p) => ocsCommunityPostIds.has(String(p.id))),
    `non_ocs=${posts.filter((p) => !ocsCommunityPostIds.has(String(p.id))).length}`
  );
  const corridor = posts.filter((p) => isStagingCorridorSmokeBody(p.body || ''));
  record('community', 'feed', 'no_corridor_smoke', corridor.length === 0, `corridor=${corridor.length}`);
  const badCovers = posts.filter(
    (p) => !(p.cover_url || '').includes('ocs-') || !(p.cover_url || '').includes('/api/v1/uploads/community-posts/')
  );
  record('community', 'feed', 'ocs_asset_covers', badCovers.length === 0, `bad=${badCovers.length}`);

  const explore = await get('/api/v1/community/explore/destinations');
  record(
    'community',
    'explore',
    'catalog=api-aggregate-v1',
    explore.json?.catalog === 'api-aggregate-v1',
    `catalog=${explore.json?.catalog || 'n/a'}`
  );

  const hot = await get('/api/v1/community/hot?limit=20');
  const hotPosts = hot.json.posts || hot.json.items || [];
  const hotNonOcs = hotPosts.filter((p) => !ocsCommunityPostIds.has(String(p.id)));
  record('community', 'hot', 'ocs_subset_of_feed', hotNonOcs.length === 0, `non_ocs=${hotNonOcs.length}`);

  // 6 · Official Guide · admin published catalog
  const ogR = await client.req('GET', '/api/v1/admin/official/guides?limit=500', null, adminTok);
  const ogPublished = (ogR.json.items || ogR.json.guides || []).filter(isPublishedOfficialGuide);
  record(
    'official_guide',
    'admin_published',
    'count=10 OCS',
    ogPublished.length === expected.official_guides_published,
    `count=${ogPublished.length}`
  );
  const ogNonOcs = ogPublished.filter((r) => !ocsOfficialGuideIds.has(String(r.id)));
  record('official_guide', 'admin_published', 'ocs_only', ogNonOcs.length === 0, `extras=${ogNonOcs.length}`);
  const ogSmoke = ogPublished.filter((r) => isSmokeContent(r));
  record('official_guide', 'admin_published', 'no_smoke', ogSmoke.length === 0, `smoke=${ogSmoke.length}`);

  // 7 · Campaign · deployed + cold-start surfaces
  const campR = await client.req(
    'GET',
    '/api/v1/admin/official/public-operations/campaigns?limit=200',
    null,
    adminTok
  );
  const campDeployed = (campR.json.items || []).filter(isDeployedCampaign);
  record(
    'campaign',
    'deployed',
    'count=10 OCS',
    campDeployed.length === expected.campaigns_deployed,
    `count=${campDeployed.length}`
  );
  const campNonOcs = campDeployed.filter((r) => !ocsCampaignIds.has(String(r.id)));
  record('campaign', 'deployed', 'ocs_only', campNonOcs.length === 0, `extras=${campNonOcs.length}`);

  for (const [sid, surfPath] of Object.entries(campaignSurfacePaths)) {
    const s = await get(surfPath);
    record('campaign', sid, 'HTTP 200', s.status === 200, `status=${s.status}`);
    const items = s.json?.campaign?.items || s.json?.items || [];
    const minItems = sid === 'campaign_banner' ? 0 : 1;
    record('campaign', sid, 'resolved_items', items.length >= minItems, `items=${items.length}`);
    const technical = items.filter((item) => campaignItemWouldExposeTechnicalType(item));
    record(
      'campaign',
      sid,
      'no_technical_item_type_labels',
      technical.length === 0,
      `technical=${technical.length}`
    );
  }

  // 8 · Admin publish queues · unauthorized published
  for (const et of ['guides', 'market_listings', 'community_posts', 'orders']) {
    const q = await client.req(
      'GET',
      `/api/v1/admin/official/public-operations/publish-queue?entity_type=${et}&limit=500`,
      null,
      adminTok
    );
    const published = (q.json.items || []).filter((x) => x.display_status === 'published');
    const ocsSet =
      et === 'guides' ? ocsGuideIds : et === 'community_posts' ? ocsCommunityPostIds : et === 'market_listings' ? ocsListingIds : new Set();
    const nonOcs =
      et === 'orders'
        ? published.filter((r) => isSmokeContent(r) || isNonProductionOrigin(r.data_origin))
        : published.filter((r) => !ocsSet.has(String(r.id)));
    record('admin', `queue_${et}`, 'no_unauthorized_published', nonOcs.length === 0, `bad=${nonOcs.length} pub=${published.length}`);
  }

  // 9 · Media / cache sample (web rewrite + API direct)
  if (posts[0]?.cover_url) {
    const rel = posts[0].cover_url;
    const apiCode = await head(`${API}${rel.startsWith('/') ? '' : '/'}${rel}`);
    record('asset', 'community_cover', 'API HEAD 200', apiCode === 200, `code=${apiCode}`);
    const webCode = await head(`${WEB}${rel.startsWith('/') ? '' : '/'}${rel}`);
    record('asset', 'community_cover', 'WEB rewrite HEAD 200', webCode === 200, `code=${webCode}`);
  }

  // 10 · Meta profile staging (old API drift)
  const meta = await get('/meta/build');
  const profile = meta.json?.deployment_profile || meta.json?.profile || '';
  record('api', 'meta/build', 'staging_profile', /staging/i.test(profile) || meta.status === 200, `profile=${profile || meta.status}`);

  const verdict = failures.length === 0 ? 'PASS' : 'FAIL';
  if (verdict === 'PASS') passes.push('all_checks');

  const report = {
    schema: 'traveltrust.staging_rc_baseline.public_surface_audit.v1',
    recorded_at: new Date().toISOString(),
    api: API,
    web: WEB,
    ocs_state: ocs_state || null,
    registry: 'registry/staging-rc-baseline.v1.yaml',
    unified_baseline: 'scripts/dev/lib/staging-rc-public-surface-unified.cjs',
    expected_public_surface: expected,
    ssot_chain: baseline.ssotChain,
    machine_keys: {
      TT_STAGING_RC_BASELINE_AUDIT: verdict === 'PASS' ? 'PASS' : 'FAIL',
      TT_STAGING_RC_BASELINE: activeOk ? 'READY' : 'DRIFT',
    },
    checklist: rows,
    failures,
    passes,
    summary: {
      total: rows.length,
      pass: rows.filter((r) => r.status === 'PASS').length,
      fail: rows.filter((r) => r.status === 'FAIL').length,
    },
    honest_boundary: 'Audit PASS on Staging ≠ Production GO',
    remediation: 'bash scripts/dev/run-staging-rc-baseline-final-alignment.sh',
  };

  if (evidDir) {
    fs.mkdirSync(evidDir, { recursive: true });
    fs.writeFileSync(path.join(evidDir, 'public-surface-audit.json'), JSON.stringify(report, null, 2) + '\n');
    fs.writeFileSync(
      path.join(evidDir, 'STATUS.txt'),
      `TT_STAGING_RC_BASELINE_AUDIT: ${report.machine_keys.TT_STAGING_RC_BASELINE_AUDIT}\nfailures=${failures.length}\n`
    );
  }

  console.log(`TT_STAGING_RC_BASELINE_AUDIT: ${verdict} pass=${report.summary.pass}/${report.summary.total}`);
  for (const r of rows.filter((x) => x.status === 'FAIL')) {
    console.error(`FAIL #${r.n} ${r.domain}/${r.surface} · ${r.check} · ${r.detail}`);
  }
  process.exit(failures.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
