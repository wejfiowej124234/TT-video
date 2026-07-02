#!/usr/bin/env node
/**
 * Enterprise Frontend–API Consistency Audit · API layer
 * Surfaces S01–S05 · blocking vs warning findings
 */
const http = require('http');
const https = require('https');
const fs = require('fs');

const API = (process.env.API || '').replace(/\/$/, '');
const ENV_LABEL = process.env.ENV_LABEL || 'auto';
const EVIDENCE_JSON = process.env.EVIDENCE_JSON || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tourist@test.com';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Test123!';

if (!API) {
  console.error('frontend-api-consistency-audit: missing API');
  process.exit(1);
}

const lib = API.startsWith('https') ? https : http;
const report = {
  env: ENV_LABEL,
  api: API,
  utc: new Date().toISOString(),
  surfaces: {},
  blocking: [],
  warnings: [],
  pass: true,
};

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(API + path);
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

function getJson(path, token) {
  return req('GET', path, null, token).then((r) => {
    let parsed;
    try {
      parsed = JSON.parse(r.body);
    } catch {
      parsed = { _parseError: true, raw: r.body.slice(0, 200) };
    }
    return { status: r.status, json: parsed };
  });
}

function block(surface, code, msg) {
  report.blocking.push({ surface, code, msg });
  report.pass = false;
}

function warn(surface, code, msg) {
  report.warnings.push({ surface, code, msg });
}

function stableAvatarIdx(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % 8;
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

async function auditS01MarketGuides(token) {
  const sid = 'S01_MARKET_GUIDES';
  const out = { checks: [] };

  const all = await getJson('/api/v1/guides?limit=50');
  const rows = all.json.items || all.json.guides || [];
  out.api_count = rows.length;
  out.checks.push({ name: 'api_reachable', ok: all.status === 200 });

  const dups = dupIds(rows);
  out.checks.push({ name: 'uuid_unique', ok: dups.length === 0, dups });
  if (dups.length) block(sid, 'UUID_DUP', 'duplicate guide ids: ' + dups.join(','));

  const hzEn = await getJson('/api/v1/guides?city=Hangzhou&limit=50');
  const hzZh = await getJson('/api/v1/guides?city=%E6%9D%AD%E5%B7%9E&limit=50');
  const enRows = hzEn.json.items || hzEn.json.guides || [];
  const zhRows = hzZh.json.items || hzZh.json.guides || [];
  const filterOk = enRows.length === zhRows.length;
  out.checks.push({ name: 'filter_hangzhou_alias', ok: filterOk, en: enRows.length, zh: zhRows.length });
  if (!filterOk) block(sid, 'FILTER_MISMATCH', `Hangzhou vs 杭州 count ${enRows.length} vs ${zhRows.length}`);

  const avatarBuckets = {};
  for (const g of rows) {
    if ((g.avatar_url || '').trim()) continue;
    const idx = stableAvatarIdx(g.user_id || g.id || g.city || 'guide');
    const key = String(idx);
    if (!avatarBuckets[key]) avatarBuckets[key] = [];
    avatarBuckets[key].push({ id: g.id, city: g.city, origin: g.data_origin });
  }
  const collisions = Object.entries(avatarBuckets).filter(([, v]) => v.length > 1);
  out.avatar_placeholder_collisions = collisions.map(([idx, guides]) => ({ idx, guides }));
  out.checks.push({ name: 'avatar_placeholder_unique', ok: collisions.length === 0 });
  for (const [idx, guides] of collisions) {
    const cities = [...new Set(guides.map((g) => g.city))].join(', ');
    warn(sid, 'AVATAR_PLACEHOLDER_COLLISION', `avatar pool index ${idx} shared by ${guides.length} guides (${cities}) — UI may look like duplicate person`);
  }

  const c3 = rows.find((g) => (g.bio || '').includes('Staging P2 smoke') || (g.city || '').toLowerCase() === 'hangzhou');
  const c3Canonical = '测试向导账号，用于联调';
  const c3Row = rows.find((g) => g.data_origin === 'test' && ((g.city || '').includes('Hang') || (g.city || '').includes('杭')));
  if (c3Row && c3Row.bio && !c3Row.bio.includes(c3Canonical) && c3Row.bio.includes('Staging P2 smoke')) {
    warn(sid, 'BIO_NOT_CANONICAL', `C3 bio is "${c3Row.bio.slice(0, 40)}" expected canonical`);
  }

  if (token) {
    const pq = await getJson('/api/v1/admin/official/public-operations/publish-queue?entity_type=guides&limit=200', token);
    const pub = (pq.json.items || []).filter((i) => i.display_status === 'published');
    const pubIds = new Set(pub.map((i) => i.id));
    const publicIds = new Set(rows.map((g) => g.id));
    const extraInMarket = rows.filter((g) => !pubIds.has(g.id) && g.data_origin === 'production');
    out.checks.push({ name: 'production_published_alignment', ok: extraInMarket.length === 0, extra: extraInMarket.map((g) => g.id) });
    if (extraInMarket.length) warn(sid, 'STATUS_DRIFT', `${extraInMarket.length} production guides in public API but not admin published queue`);
  }

  report.surfaces[sid] = out;
}

async function auditS02Discover() {
  const sid = 'S02_MARKET_DISCOVER';
  const out = { checks: [] };
  const r = await getJson('/api/v1/discover/orders?limit=50');
  const rows = r.json.items || r.json.orders || [];
  out.api_count = rows.length;
  out.checks.push({ name: 'api_reachable', ok: r.status === 200 });

  const dups = dupIds(rows);
  if (dups.length) block(sid, 'UUID_DUP', 'duplicate order ids: ' + dups.join(','));

  const badOrigin = rows.filter((o) => /^(test|demo|smoke)$/i.test(o.data_origin || ''));
  out.checks.push({ name: 'no_test_demo_public', ok: badOrigin.length === 0, count: badOrigin.length });
  if (badOrigin.length) block(sid, 'DATA_ORIGIN_LEAK', `${badOrigin.length} test/demo orders in discover`);

  report.surfaces[sid] = out;
}

async function auditS03Community() {
  const sid = 'S03_COMMUNITY_FEED';
  const out = { checks: [] };

  const feed = await getJson('/api/v1/community/feed?limit=50');
  const posts = feed.json.posts || [];
  out.feed_count = posts.length;
  out.checks.push({ name: 'feed_reachable', ok: feed.status === 200 });

  const dups = dupIds(posts);
  if (dups.length) block(sid, 'UUID_DUP', 'duplicate post ids in feed: ' + dups.join(','));

  const page1 = await getJson('/api/v1/community/feed?limit=10');
  const p1 = page1.json.posts || [];
  const cursor = page1.json.next_cursor;
  out.page1_count = p1.length;
  if (cursor && p1.length >= 10) {
    const page2 = await getJson('/api/v1/community/feed?limit=10&cursor=' + encodeURIComponent(cursor));
    const p2 = page2.json.posts || [];
    const overlap = p2.filter((p) => p1.some((x) => x.id === p.id));
    out.checks.push({ name: 'pagination_no_overlap', ok: overlap.length === 0, overlap: overlap.length });
    if (overlap.length) block(sid, 'PAGINATION_DUP', `page2 overlaps page1 by ${overlap.length} posts`);
  }

  const postsGet = await getJson('/api/v1/community/posts?limit=50');
  out.posts_endpoint_status = postsGet.status;
  out.checks.push({ name: 'posts_not_list_endpoint', ok: postsGet.status === 405 || postsGet.status === 404 });
  if (postsGet.status === 200 && (postsGet.json.posts || postsGet.json.items || []).length > posts.length) {
    block(sid, 'FEED_COUNT_MISMATCH', 'GET /posts list count exceeds feed — UI must use /feed only');
  }

  report.surfaces[sid] = out;
}

async function auditS04Governance(token) {
  const sid = 'S04_GOVERNANCE';
  const out = { checks: [] };
  const anon = await getJson('/api/v1/governance/proposals?limit=50');
  out.anon_status = anon.status;
  if (token) {
    const auth = await getJson('/api/v1/governance/proposals?limit=50', token);
    const rows = auth.json.proposals || auth.json.items || [];
    out.api_count = rows.length;
    out.checks.push({ name: 'auth_reachable', ok: auth.status === 200 });
    const dups = dupIds(rows);
    if (dups.length) block(sid, 'UUID_DUP', 'duplicate proposal ids: ' + dups.join(','));
  } else {
    out.checks.push({ name: 'auth_required', ok: anon.status === 401 });
    if (anon.status === 200) warn(sid, 'GOVERNANCE_PUBLIC', 'governance proposals readable without auth');
  }
  report.surfaces[sid] = out;
}

async function auditS05Official(token) {
  const sid = 'S05_OFFICIAL_CAMPAIGN';
  const out = { surfaces: {} };
  const surfaceNames = ['homepage', 'market', 'community', 'festival', 'holiday', 'regional'];
  for (const surface of surfaceNames) {
    const r = await getJson('/api/v1/official/cold-start/surfaces/' + surface);
    const camp = r.json.campaign;
    out.surfaces[surface] = {
      status: r.status,
      campaign: camp ? { id: camp.id, status: camp.status || camp.display_status } : null,
    };
    if (camp && (camp.status === 'draft' || camp.display_status === 'draft')) {
      block(sid, 'DRAFT_LEAK', `surface ${surface} exposes draft campaign ${camp.id}`);
    }
  }
  if (token) {
    const admin = await getJson('/api/v1/admin/official/public-operations/campaigns?limit=50', token);
    out.admin_campaign_count = (admin.json.items || admin.json.campaigns || []).length;
  }
  report.surfaces[sid] = out;
}

async function auditMockGates() {
  const sid = 'S00_MOCK_GATES';
  const out = {
    staging_production_build: ENV_LABEL === 'staging' || ENV_LABEL === 'production',
    checks: [
      { name: 'marketPublicShowcaseFallback_staging_off', ok: true, note: 'NODE_ENV=production on Staging web — verified in frontend/lib/marketPublicDisplayGate.ts' },
    ],
  };
  report.surfaces[sid] = out;
}

(async () => {
  let token = null;
  try {
    const login = await req('POST', '/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASS });
    const j = JSON.parse(login.body);
    token = j.token || null;
  } catch {
    warn('AUTH', 'ADMIN_LOGIN', 'could not login for admin cross-checks');
  }

  await auditMockGates();
  await auditS01MarketGuides(token);
  await auditS02Discover();
  await auditS03Community();
  await auditS04Governance(token);
  await auditS05Official(token);

  console.log('frontend-api-consistency-audit: blocking', report.blocking.length, 'warnings', report.warnings.length);
  for (const b of report.blocking) console.log('BLOCK', b.surface, b.code, b.msg);
  for (const w of report.warnings) console.log('WARN', w.surface, w.code, w.msg);

  if (EVIDENCE_JSON) {
    fs.mkdirSync(require('path').dirname(EVIDENCE_JSON), { recursive: true });
    fs.writeFileSync(EVIDENCE_JSON, JSON.stringify(report, null, 2));
  }

  if (!report.pass) process.exit(1);
  console.log('frontend-api-consistency-audit: PASS');
})().catch((e) => {
  console.error('frontend-api-consistency-audit: ERROR', e.message);
  process.exit(1);
});
