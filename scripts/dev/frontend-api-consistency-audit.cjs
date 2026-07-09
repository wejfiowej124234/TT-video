#!/usr/bin/env node
/**
 * Enterprise Frontend–API Consistency Audit · full-site API layer
 * Database → API → (mapping contracts) → UI risk signals
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const API = (process.env.API || '').replace(/\/$/, '');
const ENV_LABEL = process.env.ENV_LABEL || 'auto';
const EVIDENCE_JSON = process.env.EVIDENCE_JSON || '';
const STRICT_WARNINGS = process.env.STRICT_WARNINGS === '1';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tourist@test.com';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Test123!';
const C3_CANONICAL_BIO = '测试向导账号，用于联调';

if (!API) {
  console.error('frontend-api-consistency-audit: missing API');
  process.exit(1);
}

const lib = API.startsWith('https') ? https : http;
let warnSeq = 0;

const report = {
  env: ENV_LABEL,
  api: API,
  utc: new Date().toISOString(),
  strict_warnings: STRICT_WARNINGS,
  surfaces: {},
  blocking: [],
  warnings: [],
  pass: true,
};

function req(method, p, body, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(API + p);
    const payload = body ? JSON.stringify(body) : null;
    const r = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method,
        headers: {
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve({ status: res.statusCode, body: d }));
      }
    );
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

async function getJson(p, token) {
  const r = await req('GET', p, null, token);
  let json;
  try {
    json = JSON.parse(r.body);
  } catch {
    json = { _parseError: true, raw: r.body.slice(0, 200) };
  }
  return { status: r.status, json };
}

function block(surface, code, msg) {
  report.blocking.push({ surface, code, msg });
  report.pass = false;
}

function warn(surface, code, msg, detail) {
  warnSeq += 1;
  const id = `W${String(warnSeq).padStart(3, '0')}`;
  const row = { id, surface, code, msg, ...(detail ? { detail } : {}) };
  report.warnings.push(row);
  if (STRICT_WARNINGS) {
    report.pass = false;
  }
}

function dupIds(rows, idKey = 'id') {
  const seen = new Set();
  const dups = [];
  for (const row of rows) {
    const id = String(row[idKey] ?? '');
    if (!id) continue;
    if (seen.has(id)) dups.push(id);
    seen.add(id);
  }
  return dups;
}

function stablePoolIdx(seed, modulo) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return modulo > 0 ? h % modulo : 0;
}

const GUIDE_PORTRAIT_POOL_SIZE = 24;

/** Mirrors frontend resolveGuideAvatarUrl — guide.id + 24-portrait pool */
function guideAvatarPlaceholderKey(g) {
  if ((g.avatar_url || '').trim()) return null;
  const idx = stablePoolIdx(g.id || g.user_id || g.city || 'guide', GUIDE_PORTRAIT_POOL_SIZE);
  return `avatar:${idx}`;
}

/** Mirrors frontend resolveMarketOrderCoverUrl when no explicit image */
function orderCoverPlaceholderKey(o) {
  if ((o.image || '').trim()) return null;
  const city = o.city || o.destination || o.country || '';
  const seed = o.id || o.destination || city || 'order';
  return `cover:${stablePoolIdx(seed, 10)}`;
}

function checkPlaceholderCollisions(rows, keyFn, surface, codePrefix) {
  const buckets = {};
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(row);
  }
  for (const [key, group] of Object.entries(buckets)) {
    if (group.length <= 1) continue;
    const ids = group.map((r) => r.id).join(', ');
    warn(
      surface,
      `${codePrefix}_PLACEHOLDER_COLLISION`,
      `${key} shared by ${group.length} rows — visual duplicate risk in UI`,
      { ids: group.map((r) => ({ id: r.id, city: r.city, origin: r.data_origin })) }
    );
  }
}

async function login(email, password) {
  const r = await req('POST', '/auth/login', { email, password });
  try {
    return JSON.parse(r.body).token || null;
  } catch {
    return null;
  }
}

async function auditS01MarketGuides(token) {
  const sid = 'S01_MARKET_GUIDES';
  const out = { checks: [] };
  const all = await getJson('/api/v1/guides?limit=100');
  const rows = all.json.items || all.json.guides || [];
  out.api_count = rows.length;
  if (all.status !== 200) block(sid, 'API_UNREACHABLE', `GET /guides ${all.status}`);
  const dups = dupIds(rows);
  if (dups.length) block(sid, 'UUID_DUP', dups.join(','));

  for (const [a, b] of [
    ['Hangzhou', '%E6%9D%AD%E5%B7%9E'],
    ['Shanghai', '%E4%B8%8A%E6%B5%B7'],
    ['Beijing', '%E5%8C%97%E4%BA%AC'],
  ]) {
    const en = await getJson(`/api/v1/guides?city=${encodeURIComponent(a)}&limit=50`);
    const zh = await getJson(`/api/v1/guides?city=${b}&limit=50`);
    const n1 = (en.json.items || en.json.guides || []).length;
    const n2 = (zh.json.items || zh.json.guides || []).length;
    if (n1 !== n2) block(sid, 'FILTER_ALIAS_MISMATCH', `${a} en=${n1} zh=${n2}`);
  }

  checkPlaceholderCollisions(rows, guideAvatarPlaceholderKey, sid, 'AVATAR');

  for (const g of rows.filter((x) => x.data_origin === 'test')) {
    if ((g.bio || '').includes('Staging P2 smoke')) {
      warn(sid, 'BIO_NOT_CANONICAL', `test guide ${g.id} bio polluted by smoke`, { bio: g.bio });
    }
    if (!(g.bio || '').includes(C3_CANONICAL_BIO) && (g.city || '').match(/hang|杭/i)) {
      const isC3 = (g.bio || '').includes('联调') || (g.bio || '').includes('smoke');
      if (isC3) warn(sid, 'C3_BIO_DRIFT', `Hangzhou test guide ${g.id} bio not canonical`, { bio: g.bio });
    }
  }

  if (token) {
    const pq = await getJson('/api/v1/admin/official/public-operations/publish-queue?entity_type=guides&limit=300', token);
    const pub = new Set((pq.json.items || []).filter((i) => i.display_status === 'published').map((i) => i.id));
    const orphanProd = rows.filter((g) => g.data_origin === 'production' && !pub.has(g.id));
    if (orphanProd.length) {
      warn(sid, 'STATUS_DRIFT', `${orphanProd.length} production guides public but not in admin published queue`, {
        ids: orphanProd.map((g) => g.id),
      });
    }
  }

  report.surfaces[sid] = out;
}

async function auditS02Discover(token) {
  const sid = 'S02_MARKET_DISCOVER';
  const r = await getJson('/api/v1/discover/orders?limit=100');
  const rows = r.json.items || r.json.orders || [];
  report.surfaces[sid] = { api_count: rows.length };
  if (r.status !== 200) block(sid, 'API_UNREACHABLE', String(r.status));
  if (dupIds(rows).length) block(sid, 'UUID_DUP', 'discover orders');
  const bad = rows.filter((o) => /^(test|demo|smoke)$/i.test(o.data_origin || ''));
  if (bad.length) block(sid, 'DATA_ORIGIN_LEAK', `${bad.length} test/demo in discover`);
  const { isSmokeContent } = require('./lib/smoke-data-heuristics.cjs');
  const smokeOrders = rows.filter((o) => isSmokeContent(o));
  if (smokeOrders.length) block(sid, 'SMOKE_CONTENT_LEAK', `${smokeOrders.length} smoke orders in discover`);
  checkPlaceholderCollisions(rows, orderCoverPlaceholderKey, sid, 'ORDER_COVER');

  if (token) {
    const mine = await getJson('/api/v1/orders?limit=100', token);
    const mineRows = mine.json.items || mine.json.orders || [];
    const discoverIds = new Set(rows.map((o) => o.id));
    const publishedMine = mineRows.filter((o) => /published|open|draft/i.test(o.status || o.display_status || ''));
    const missingFromDiscover = publishedMine.filter((o) => !discoverIds.has(o.id) && o.data_origin === 'production');
    if (missingFromDiscover.length > 5) {
      warn(sid, 'DISCOVER_SUBSET', `${missingFromDiscover.length} user orders not in discover (may be expected by status filter)`, {
        sample: missingFromDiscover.slice(0, 3).map((o) => o.id),
      });
    }
  }
}

async function auditS03Community() {
  const sid = 'S03_COMMUNITY';
  const feed = await getJson('/api/v1/community/feed?limit=50');
  const posts = feed.json.posts || [];
  report.surfaces[sid] = { feed_count: posts.length };
  if (feed.status !== 200) block(sid, 'API_UNREACHABLE', String(feed.status));
  if (dupIds(posts).length) block(sid, 'UUID_DUP', 'feed posts');
  const bad = posts.filter((p) => /^(test|demo|smoke)$/i.test(p.data_origin || ''));
  if (bad.length) block(sid, 'DATA_ORIGIN_LEAK', `${bad.length} test/demo in community feed`);
  const { isSmokeContent } = require('./lib/smoke-data-heuristics.cjs');
  const smokePosts = posts.filter((p) => isSmokeContent(p));
  if (smokePosts.length) block(sid, 'SMOKE_CONTENT_LEAK', `${smokePosts.length} smoke posts in feed`);

  const p1 = await getJson('/api/v1/community/feed?limit=10');
  const page1 = p1.json.posts || [];
  const cur = p1.json.next_cursor;
  if (cur && page1.length >= 10) {
    const p2 = await getJson('/api/v1/community/feed?limit=10&cursor=' + encodeURIComponent(cur));
    const page2 = p2.json.posts || [];
    const overlap = page2.filter((p) => page1.some((x) => x.id === p.id));
    if (overlap.length) block(sid, 'PAGINATION_DUP', `overlap ${overlap.length}`);
    if (page2.length && page1[0] && page2[0] && page1[0].id === page2[0].id) {
      warn(sid, 'PAGINATION_SORT', 'page2 first id equals page1 first — sort/cursor drift risk');
    }
  }

  const postsList = await getJson('/api/v1/community/posts?limit=50');
  if (postsList.status === 200 && (postsList.json.posts || postsList.json.items || []).length) {
    warn(sid, 'POSTS_LIST_LEAK', 'GET /community/posts returned list — UI must use /feed only');
  }
}

async function auditS04Governance(token) {
  const sid = 'S04_GOVERNANCE';
  if (!token) {
    warn(sid, 'SKIP_NO_TOKEN', 'governance audit skipped — no bearer');
    return;
  }
  const r = await getJson('/api/v1/governance/proposals?limit=100', token);
  const rows = r.json.proposals || r.json.items || [];
  report.surfaces[sid] = { api_count: rows.length };
  if (r.status !== 200) block(sid, 'API_UNREACHABLE', String(r.status));
  if (dupIds(rows).length) block(sid, 'UUID_DUP', 'proposals');
}

async function auditS05Official(token) {
  const sid = 'S05_OFFICIAL';
  const names = ['homepage', 'market', 'community', 'festival', 'holiday', 'regional'];
  const out = { surfaces: {} };
  for (const s of names) {
    const r = await getJson('/api/v1/official/cold-start/surfaces/' + s);
    const c = r.json.campaign;
    out.surfaces[s] = { status: r.status, has_campaign: !!c };
    if (c && (c.status === 'draft' || c.display_status === 'draft')) {
      block(sid, 'DRAFT_LEAK', `surface ${s} draft campaign ${c.id}`);
    }
  }
  if (token) {
    const admin = await getJson('/api/v1/admin/official/public-operations/campaigns?limit=100', token);
    const deployed = (admin.json.items || admin.json.campaigns || []).filter(
      (c) => c.display_status === 'published' || c.status === 'deployed'
    );
    const publicWithCampaign = Object.values(out.surfaces).filter((x) => x.has_campaign).length;
    if (deployed.length > 0 && publicWithCampaign === 0) {
      warn(sid, 'CAMPAIGN_PUBLIC_GAP', `${deployed.length} admin deployed campaigns but 0 public surfaces expose campaign`);
    }
  }
  report.surfaces[sid] = out;
}

async function auditS06Content(token) {
  const sid = 'S06_CONTENT';
  const countries = await getJson('/api/v1/catalog/countries?limit=50');
  const cRows = countries.json.items || [];
  report.surfaces[sid] = { catalog_countries: cRows.length };
  if (countries.status !== 200) warn(sid, 'CATALOG_UNREACHABLE', `countries ${countries.status}`);
  if (token) {
    const pois = await getJson('/api/v1/admin/content/pois?limit=50', token);
    const pRows = pois.json.items || [];
    report.surfaces[sid].admin_pois = pRows.length;
    const pubPois = pRows.filter((p) => p.display_status === 'published' || p.status === 'published');
    if (pRows.length > 0 && pubPois.length === 0) {
      warn(sid, 'CONTENT_ALL_DRAFT', `${pRows.length} admin POIs but none published`);
    }
  }
}

async function auditS07UserCenter(token) {
  const sid = 'S07_USER_CENTER';
  if (!token) {
    warn(sid, 'SKIP_NO_TOKEN', 'user center audit skipped');
    return;
  }
  const me = await getJson('/api/v1/me', token);
  if (me.status !== 200) block(sid, 'API_UNREACHABLE', '/me ' + me.status);
  const stats = await getJson('/api/v1/me/stats', token);
  if (stats.status !== 200 && stats.status !== 404) {
    warn(sid, 'STATS_DRIFT', `/me/stats ${stats.status}`);
  }
  report.surfaces[sid] = {
    role: me.json.user?.role,
    email: me.json.user?.email,
    stats_ok: stats.status === 200,
  };
}

async function auditS08Orders(token) {
  const sid = 'S08_ORDERS';
  if (!token) {
    warn(sid, 'SKIP_NO_TOKEN', 'orders audit skipped');
    return;
  }
  const r = await getJson('/api/v1/orders?limit=50', token);
  const rows = r.json.items || r.json.orders || [];
  report.surfaces[sid] = { api_count: rows.length, page: r.json.page };
  if (r.status !== 200) block(sid, 'API_UNREACHABLE', String(r.status));
  if (dupIds(rows).length) block(sid, 'UUID_DUP', 'orders list');
  const p1 = await getJson('/api/v1/orders?limit=10', token);
  const cur = p1.json.page?.next_cursor;
  if (cur) {
    const p2 = await getJson('/api/v1/orders?limit=10&cursor=' + encodeURIComponent(cur), token);
    const a = p1.json.items || [];
    const b = p2.json.items || [];
    const overlap = b.filter((o) => a.some((x) => x.id === o.id));
    if (overlap.length) block(sid, 'PAGINATION_DUP', `orders overlap ${overlap.length}`);
  }
}

async function auditS09Messages(token) {
  const sid = 'S09_MESSAGES';
  if (!token) {
    warn(sid, 'SKIP_NO_TOKEN', 'messages audit skipped');
    return;
  }
  const r = await getJson('/api/v1/community/conversations?limit=50', token);
  const rows = r.json.conversations || r.json.items || [];
  report.surfaces[sid] = { api_count: rows.length };
  if (r.status !== 200) block(sid, 'API_UNREACHABLE', String(r.status));
  if (dupIds(rows, 'id').length) block(sid, 'UUID_DUP', 'conversations');
}

async function auditS10Admin(token) {
  const sid = 'S10_ADMIN_PUBLIC_OPS';
  if (!token) {
    warn(sid, 'SKIP_NO_TOKEN', 'admin audit skipped');
    return;
  }
  const stats = await getJson('/api/v1/admin/official/public-operations/stats', token);
  const pq = await getJson('/api/v1/admin/official/public-operations/publish-queue?entity_type=guides&limit=500', token);
  const pubGuides = (pq.json.items || []).filter((i) => i.display_status === 'published');
  const apiGuides = await getJson('/api/v1/guides?limit=100');
  const publicGuides = apiGuides.json.items || [];
  const statsGuides = stats.json.data_origin_counts?.guides;
  report.surfaces[sid] = {
    admin_published_guides: pubGuides.length,
    public_api_guides: publicGuides.length,
    stats_total: statsGuides?.total,
  };
  if (statsGuides && statsGuides.total < pubGuides.length) {
    warn(sid, 'ADMIN_STATS_DRIFT', `stats guides.total ${statsGuides.total} < published queue ${pubGuides.length}`);
  }
}

async function auditS11GuideDetail() {
  const sid = 'S11_GUIDE_DETAIL';
  const list = await getJson('/api/v1/guides?limit=20');
  const rows = list.json.items || [];
  const out = { checked: 0, missing_availability: [] };
  for (const g of rows.slice(0, 5)) {
    const av = await getJson(`/api/v1/guides/${encodeURIComponent(g.id)}/availability`);
    out.checked += 1;
    if (av.status === 404) out.missing_availability.push(g.id);
    const detail = await getJson(`/api/v1/guides/${encodeURIComponent(g.id)}`);
    if (detail.status === 200 && detail.json.guide) {
      if (detail.json.guide.id !== g.id) {
        block(sid, 'UUID_DRIFT', `list ${g.id} detail ${detail.json.guide.id}`);
      }
    }
  }
  if (out.missing_availability.length) {
    warn(sid, 'AVAILABILITY_GAP', `${out.missing_availability.length} guides missing availability endpoint`);
  }
  report.surfaces[sid] = out;
}

/** Listings without videoUrl share one PLACEHOLDER_IMG by design — no per-id pool yet. */
function listingHasExplicitMedia(row) {
  const p = row.payload || {};
  const videoUrl = typeof p.videoUrl === 'string' ? p.videoUrl.trim() : '';
  return videoUrl.startsWith('http://') || videoUrl.startsWith('https://');
}

async function auditS12MarketListings(token) {
  const sid = 'S12_MARKET_LISTINGS';
  for (const variant of ['provider', 'acquisition']) {
    const r = await getJson(`/api/v1/market/${variant}/listings?limit=50`);
    const rows = r.json.items || [];
    report.surfaces[sid] = report.surfaces[sid] || {};
    report.surfaces[sid][variant] = { api_count: rows.length, detail_checked: 0 };
    if (r.status !== 200) block(sid, 'API_UNREACHABLE', `${variant} listings ${r.status}`);
    if (dupIds(rows).length) block(sid, 'UUID_DUP', variant);
    const bad = rows.filter((x) => /^(test|demo|smoke)$/i.test(x.data_origin || ''));
    if (bad.length) block(sid, 'DATA_ORIGIN_LEAK', `${bad.length} test ${variant} listings visible`);

    if (token) {
      const admin = await getJson(
        `/api/v1/admin/official/public-operations/publish-queue?entity_type=market_listings&limit=500`,
        token
      );
      const adminPub = (admin.json.items || []).filter(
        (x) =>
          x.display_status === 'published' &&
          (x.label || '').toLowerCase().includes(variant === 'provider' ? 'provider' : 'acquisition')
      );
      const pubIds = new Set(rows.map((r) => r.id));
      const adminIds = new Set(adminPub.map((x) => x.id));
      const orphanPublic = rows.filter((r) => !adminIds.has(r.id));
      const missingPublic = adminPub.filter((x) => !pubIds.has(x.id) && x.data_origin === 'production');
      if (orphanPublic.length) {
        block(sid, 'ADMIN_DRIFT_ORPHAN', `${variant} public not in admin queue: ${orphanPublic.map((r) => r.id).join(',')}`);
      }
      if (missingPublic.length) {
        warn(sid, 'ADMIN_DRIFT_MISSING', `${variant} admin published missing public: ${missingPublic.map((x) => x.id).join(',')}`);
      }
      report.surfaces[sid][variant].admin_published = adminPub.length;
    }

    for (const row of rows) {
      if (!row.id) block(sid, 'MISSING_ID', `${variant} listing without id`);
      const title = row.payload?.title;
      if (typeof title !== 'string' || !title.trim()) {
        warn(sid, 'MISSING_TITLE', `${variant} ${row.id} missing payload.title`);
      }
    }

    const withoutMedia = rows.filter((row) => !listingHasExplicitMedia(row));
    if (withoutMedia.length > 1) {
      report.surfaces[sid][variant].shared_placeholder_count = withoutMedia.length;
    }

    for (const row of rows.slice(0, 3)) {
      if (!row.id) continue;
      const detail = await getJson(
        `/api/v1/market/${variant}/listings/${encodeURIComponent(row.id)}`
      );
      report.surfaces[sid][variant].detail_checked += 1;
      if (detail.status !== 200) {
        warn(sid, 'DETAIL_GAP', `${variant} detail ${row.id} HTTP ${detail.status}`);
        continue;
      }
      const lid = detail.json.listing?.id || detail.json.id;
      if (lid && lid !== row.id) block(sid, 'UUID_DRIFT', `${variant} list ${row.id} detail ${lid}`);
    }
  }
}

async function auditS13Itinerary(token) {
  const sid = 'S13_ITINERARY';
  const countries = await getJson('/api/v1/catalog/countries?limit=50');
  report.surfaces[sid] = {
    catalog_countries: (countries.json.items || []).length,
    catalog_status: countries.status,
  };
  if (countries.status !== 200) block(sid, 'CATALOG_UNREACHABLE', `countries ${countries.status}`);
  if (token) {
    const itin = await getJson('/api/v1/itineraries?limit=20', token);
    report.surfaces[sid].itineraries_status = itin.status;
    report.surfaces[sid].itineraries_count = (itin.json.items || itin.json.itineraries || []).length;
    if (itin.status !== 200 && itin.status !== 404 && itin.status !== 405) {
      warn(sid, 'ITINERARIES_DRIFT', `/itineraries ${itin.status}`);
    }
  } else {
    warn(sid, 'SKIP_NO_TOKEN', 'itinerary authed list skipped');
  }
}

async function auditS14Web3() {
  const sid = 'S14_WEB3_META';
  const meta = await getJson('/meta');
  const chainId = meta.json.chain?.chain_id;
  report.surfaces[sid] = {
    status: meta.status,
    chain_id: chainId,
    has_contracts: !!meta.json.chain?.contracts,
  };
  if (meta.status !== 200) block(sid, 'META_UNREACHABLE', String(meta.status));
  if (ENV_LABEL === 'staging' && Number(chainId) !== 11155111) {
    block(sid, 'CHAIN_ID_DRIFT', `staging expected 11155111 got ${chainId}`);
  }
  const contracts = meta.json.chain?.contracts || {};
  const required = ['governor_address', 'treasury_address'];
  for (const k of required) {
    if (!contracts[k]) warn(sid, 'CONTRACT_GAP', `missing chain.contracts.${k}`);
  }
}

async function auditS00MockPolicy() {
  const sid = 'S00_MOCK_POLICY';
  if (ENV_LABEL === 'staging' || ENV_LABEL === 'production') {
    report.surfaces[sid] = {
      note: 'Staging/Prod web: marketPublicShowcaseFallbackEnabled=false (NODE_ENV=production)',
      market_mock_detail_env: 'must be unset on deploy',
    };
  }
}

(async () => {
  const token = await login(ADMIN_EMAIL, ADMIN_PASS);
  if (!token) warn('AUTH', 'LOGIN_FAIL', `could not login ${ADMIN_EMAIL}`);

  await auditS00MockPolicy();
  await auditS01MarketGuides(token);
  await auditS02Discover(token);
  await auditS03Community();
  await auditS04Governance(token);
  await auditS05Official(token);
  await auditS06Content(token);
  await auditS07UserCenter(token);
  await auditS08Orders(token);
  await auditS09Messages(token);
  await auditS10Admin(token);
  await auditS11GuideDetail();
  await auditS12MarketListings(token);
  await auditS13Itinerary(token);
  await auditS14Web3();

  console.log(
    'frontend-api-consistency-audit:',
    'blocking',
    report.blocking.length,
    'warnings',
    report.warnings.length,
    STRICT_WARNINGS ? '(strict)' : ''
  );
  for (const b of report.blocking) console.log('BLOCK', b.surface, b.code, b.msg);
  for (const w of report.warnings) console.log('WARN', w.id, w.surface, w.code, w.msg);

  if (EVIDENCE_JSON) {
    fs.mkdirSync(path.dirname(EVIDENCE_JSON), { recursive: true });
    fs.writeFileSync(EVIDENCE_JSON, JSON.stringify(report, null, 2));
  }

  if (!report.pass) process.exit(1);
  if (STRICT_WARNINGS && report.warnings.length > 0) process.exit(1);
  console.log('frontend-api-consistency-audit: PASS');
})().catch((e) => {
  console.error('frontend-api-consistency-audit: ERROR', e.message);
  process.exit(1);
});
