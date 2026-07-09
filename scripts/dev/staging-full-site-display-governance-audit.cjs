#!/usr/bin/env node
/**
 * Staging Full-Site Display Data Governance audit (read-only).
 * Scans public surfaces + Admin Public Ops publish queues + CMS/Growth shallow checks.
 *
 *   API=https://tt-api-staging.fly.dev node scripts/dev/staging-full-site-display-governance-audit.cjs
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const {
  classifyPublicLeak,
  classifyAdminPublishedLeak,
  classifyDdgTier,
  isSmokeContent,
  isNonProductionOrigin,
  isCanonicalGuideId,
  isOfficialColdStartRow,
  loadOcsEntityIds,
} = require('./lib/smoke-data-heuristics.cjs');

const ROOT = path.join(__dirname, '../..');

function loadOcsEntityIdsFromEnv() {
  return loadOcsEntityIds(ROOT);
}

const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tourist@test.com';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Test123!';
const C3_EMAIL = process.env.C3_EMAIL || 'guide@test.com';
const OUT = process.env.FS_DG_JSON || '';
const OCS_DDG_REMEDIATION_MODE = process.env.OCS_DDG_REMEDIATION_MODE === '1';
const lib = API.startsWith('https') ? https : http;

/** @type {Array<{id:string,surface:string,classification:string,ddg_tier?:string,blocking:boolean,summary:string,detail:string}>} */
const issues = [];
/** @type {Record<string, number>} */
const tierCounts = { FALSE_POSITIVE: 0, EXPECTED_OFFICIAL: 0, REAL_LEAK: 0 };

function add(id, surface, classification, summary, detail = '', ddgTier = '', blocking = true) {
  issues.push({
    id,
    surface,
    classification,
    ddg_tier: ddgTier || undefined,
    blocking,
    summary,
    detail,
  });
  if (ddgTier && tierCounts[ddgTier] !== undefined) tierCounts[ddgTier] += 1;
}

function req(method, urlPath, body, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(API + urlPath);
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    const r = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method,
        headers,
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          let json;
          try {
            json = JSON.parse(d);
          } catch {
            json = { _raw: d.slice(0, 500) };
          }
          resolve({ status: res.statusCode, json });
        });
      }
    );
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

async function login(email, password) {
  await req('POST', '/auth/seed-test-accounts', { promote_admin_email: ADMIN_EMAIL });
  const r = await req('POST', '/auth/login', { email, password });
  return r.json.token || null;
}

function auditPublicRows(surface, rows, opts) {
  const scanned = { surface, public_count: rows.length, leaks: 0, advisory: 0 };
  const marketMediaDeferred =
    OCS_DDG_REMEDIATION_MODE && (surface === 'provider' || surface === 'acquisition');
  for (const row of rows) {
    const tier = classifyDdgTier(row, { ...opts, surface });
    const cls = classifyPublicLeak(row, surface, opts);
    if (tier === 'FALSE_POSITIVE' || tier === 'EXPECTED_OFFICIAL') continue;
    if (!cls) continue;
    if (cls === 'EXPECTED_DIFFERENCE') continue;
    const isBlocking = !marketMediaDeferred;
    if (isBlocking) scanned.leaks += 1;
    else scanned.advisory += 1;
    add(
      `FS-${surface.toUpperCase()}-PUB-${String(row.id || 'unknown').slice(0, 8)}`,
      surface,
      cls,
      `${cls} on public ${surface}`,
      JSON.stringify({
        id: row.id,
        data_origin: row.data_origin,
        title: row.payload?.title || row.title || row.bio || row.body?.slice?.(0, 60),
      }),
      tier === 'REAL_LEAK' ? 'REAL_LEAK' : '',
      isBlocking
    );
  }
  return scanned;
}

async function auditAdminQueue(entityType, token, opts) {
  const r = await req(
    'GET',
    `/api/v1/admin/official/public-operations/publish-queue?entity_type=${entityType}&limit=500`,
    null,
    token
  );
  const items = r.json.items || [];
  const published = items.filter((x) => x.display_status === 'published');
  const scanned = {
    entity_type: entityType,
    queue_total: items.length,
    published: published.length,
    smoke_published: 0,
    nonprod_published: 0,
  };
  for (const row of published) {
    if (isNonProductionOrigin(row.data_origin)) scanned.nonprod_published += 1;
    if (isSmokeContent(row)) scanned.smoke_published += 1;
    const tier = classifyDdgTier(row, { ...opts, entityType });
    const cls = classifyAdminPublishedLeak(row, entityType, opts);
    if (!cls || cls === 'EXPECTED_DIFFERENCE') continue;
    add(
      `FS-ADMIN-${entityType.toUpperCase()}-${String(row.id).slice(0, 8)}`,
      `admin_${entityType}`,
      cls,
      `${cls} in admin published queue (${entityType})`,
      row.label || row.id,
      tier === 'REAL_LEAK' ? 'REAL_LEAK' : tier || ''
    );
  }
  return scanned;
}

(async () => {
  const adminTok = await login(ADMIN_EMAIL, ADMIN_PASS);
  if (!adminTok) {
    console.error('FS_DG_AUDIT: admin login failed');
    process.exit(1);
  }
  const c3Tok = await login(C3_EMAIL, 'Test123!');
  let c3GuideId = '';
  if (c3Tok) {
    const me = await req('GET', '/api/v1/me', null, c3Tok);
    c3GuideId = me.json.guide?.id || '';
  }
  const opts = { c3GuideId, ...loadOcsEntityIdsFromEnv() };

  const surfaces = {};

  const prov = await req('GET', '/api/v1/market/provider/listings?limit=200');
  surfaces.provider = auditPublicRows('provider', prov.json.items || [], opts);

  const acq = await req('GET', '/api/v1/market/acquisition/listings?limit=200');
  surfaces.acquisition = auditPublicRows('acquisition', acq.json.items || [], opts);

  const guides = await req('GET', '/api/v1/guides?limit=200');
  const guideRows = guides.json.items || guides.json.guides || [];
  surfaces.guides = auditPublicRows('guides', guideRows, opts);
  const prodGuides = guideRows.filter((g) => g.data_origin === 'production');
  const nonCanonicalProd = prodGuides.filter(
    (g) => !isCanonicalGuideId(g.id) && g.id !== c3GuideId && !isOfficialColdStartRow(g, opts)
  );
  if (nonCanonicalProd.length) {
    add(
      'FS-GUIDES-NONCANONICAL-PROD',
      'guides',
      'TEST_DATA_LEAKAGE',
      'Non-canonical production guides on public catalog',
      nonCanonicalProd.map((g) => g.id).join(',')
    );
  }

  const disc = await req('GET', '/api/v1/discover/orders?limit=200');
  surfaces.discover = auditPublicRows('discover', disc.json.items || [], opts);

  const feed = await req('GET', '/api/v1/community/feed?limit=100');
  const posts = feed.json.posts || feed.json.items || [];
  surfaces.community = auditPublicRows('community', posts, opts);

  for (const et of ['guides', 'orders', 'market_listings', 'community_posts']) {
    surfaces[`admin_${et}`] = await auditAdminQueue(et, adminTok, opts);
  }

  const stats = await req('GET', '/api/v1/admin/official/public-operations/stats', null, adminTok);
  surfaces.admin_stats = stats.json;

  // CMS publish queue (shallow)
  const cms = await req('GET', '/api/v1/admin/content/publish-queue?limit=100', null, adminTok);
  const cmsItems = cms.json.items || [];
  surfaces.cms_publish_queue = {
    total: cmsItems.length,
    draft: cmsItems.filter((x) => x.publish_status === 'draft').length,
  };

  // Official guides admin (shallow)
  const og = await req('GET', '/api/v1/admin/official/guides?limit=50', null, adminTok);
  const ogItems = og.json.items || og.json.posts || [];
  surfaces.official_guides_admin = { total: ogItems.length };
  for (const row of ogItems) {
    if (isSmokeContent(row) && row.publish_status === 'published') {
      add(
        `FS-OFFICIAL-GUIDES-${String(row.id || '').slice(0, 8)}`,
        'official_guides',
        'TEST_DATA_LEAKAGE',
        'Smoke content in official guides admin published',
        row.title || row.id
      );
    }
  }

  const counts = {
    PRODUCT_DATA_DEFECT: issues.filter((i) => i.blocking && i.classification === 'PRODUCT_DATA_DEFECT').length,
    TEST_DATA_LEAKAGE: issues.filter((i) => i.blocking && i.classification === 'TEST_DATA_LEAKAGE').length,
    EXPECTED_DIFFERENCE: issues.filter((i) => i.classification === 'EXPECTED_DIFFERENCE').length,
    POST_GO_ENHANCEMENT: issues.filter((i) => i.classification === 'POST_GO_ENHANCEMENT').length,
    ADVISORY: issues.filter((i) => !i.blocking).length,
  };
  const blocking = counts.PRODUCT_DATA_DEFECT + counts.TEST_DATA_LEAKAGE;
  const payload = {
    schema: 'traveltrust.staging_full_site_display_governance.v2',
    api: API,
    recorded_at: new Date().toISOString(),
    ocs_ddg_remediation_mode: OCS_DDG_REMEDIATION_MODE,
    verdict: blocking === 0 ? 'PASS' : 'FAIL',
    ddg_tiers: tierCounts,
    ddg_tier_policy: {
      FALSE_POSITIVE: 'Official Identity (@ocs.traveltrust.app · OCS state map) — not leakage',
      EXPECTED_OFFICIAL: 'OCS CDN / Official upload paths — allowed',
      REAL_LEAK: 'Unsplash · Showcase · Demo · Seed · sample hosts — blocking in production',
    },
    surfaces,
    issue_counts: counts,
    issues,
    c3_guide_id: c3GuideId,
    ocs_state: opts.ocs_state || null,
  };

  if (OUT) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');
  }

  console.log(`FS_DG_AUDIT_VERDICT: ${payload.verdict} blocking=${blocking}`);
  console.log(`  PRODUCT_DATA_DEFECT=${counts.PRODUCT_DATA_DEFECT}`);
  console.log(`  TEST_DATA_LEAKAGE=${counts.TEST_DATA_LEAKAGE}`);
  for (const i of issues) {
    console.log(`${i.classification} ${i.id} ${i.summary}`);
  }
  if (blocking) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
