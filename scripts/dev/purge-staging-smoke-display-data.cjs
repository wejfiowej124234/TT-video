#!/usr/bin/env node
/**
 * Purge staging smoke/test display data across Admin Public Ops entity types.
 * Extends market-listings purge to guides / orders / community_posts queues.
 *
 *   API_BASE=https://tt-api-staging.fly.dev node scripts/dev/purge-staging-smoke-display-data.cjs
 */
const http = require('http');
const https = require('https');
const {
  isSmokeContent,
  isNonProductionOrigin,
  isCanonicalGuideId,
  loadOcsEntityIds,
} = require('./lib/smoke-data-heuristics.cjs');
const { assertStagingBaselineMutationAuthorized } = require('./lib/staging-rc-baseline-authorize.cjs');

assertStagingBaselineMutationAuthorized('purge_smoke_display_data');

const ROOT = require('path').join(__dirname, '../..');
const { ocsGuideIds: OCS_GUIDE_IDS, ocsListingIds: OCS_LISTING_IDS } = loadOcsEntityIds(ROOT);

const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tourist@test.com';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Test123!';
const C3_ID = process.env.C3_GUIDE_ID || '';
const DRY_RUN = process.env.DRY_RUN === '1';
const lib = API.startsWith('https') ? https : http;

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
            json = { _raw: d.slice(0, 400) };
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

function shouldUnpublishGuide(row, c3Id) {
  if (OCS_GUIDE_IDS.has(String(row.id))) return false;
  if (row.display_status !== 'published') return false;
  const origin = row.data_origin || '';
  if (origin === 'demo' || origin === 'smoke') return true;
  if (origin === 'test') return !(c3Id && row.id === c3Id);
  if (origin === 'production' && !isCanonicalGuideId(row.id)) return true;
  if (isSmokeContent(row)) return true;
  return false;
}

function shouldUnpublishGeneric(row) {
  if (OCS_LISTING_IDS.has(String(row.id))) return false;
  if (row.display_status !== 'published') return false;
  const origin = row.data_origin || '';
  if (isNonProductionOrigin(origin)) return true;
  if (isSmokeContent(row)) return true;
  return false;
}

(async () => {
  const adminTok = await login(ADMIN_EMAIL, ADMIN_PASS);
  if (!adminTok) {
    console.error('purge-smoke-display-data: admin login failed');
    process.exit(1);
  }

  let c3Id = C3_ID;
  if (!c3Id) {
    const gTok = await login('guide@test.com', 'Test123!');
    if (gTok) {
      const me = await req('GET', '/api/v1/me', null, gTok);
      c3Id = me.json.guide?.id || '';
    }
  }

  const report = { unpublish: [], errors: [], dry_run: DRY_RUN };

  for (const entityType of ['guides', 'orders', 'market_listings', 'community_posts']) {
    const q = await req(
      'GET',
      `/api/v1/admin/official/public-operations/publish-queue?entity_type=${entityType}&limit=500`,
      null,
      adminTok
    );
    const items = q.json.items || [];
    const candidates = items.filter((row) =>
      entityType === 'guides' ? shouldUnpublishGuide(row, c3Id) : shouldUnpublishGeneric(row)
    );
    console.log(`purge-smoke-display-data: ${entityType} candidates=${candidates.length}/${items.length}`);
    for (const row of candidates) {
      if (DRY_RUN) {
        report.unpublish.push({ entity: entityType, id: row.id, label: row.label, action: 'dry' });
        continue;
      }
      const r = await req(
        'POST',
        `/api/v1/admin/official/public-operations/entities/${entityType}/${row.id}/unpublish`,
        {},
        adminTok
      );
      if (r.status >= 200 && r.status < 300) {
        report.unpublish.push({ entity: entityType, id: row.id, label: row.label, action: 'unpublish' });
        console.log('OK unpublish', entityType, row.id, row.label);
      } else {
        report.errors.push({ entity: entityType, id: row.id, status: r.status });
        console.log('WARN unpublish', entityType, row.id, r.status);
      }
    }
  }

  // Market listings owner archive (multi-demo)
  const multiTok = await login('multi-demo@test.com', 'Test123!');
  if (multiTok) {
    for (const [path, variant] of [
      ['/api/v1/me/merchant-listings', 'provider'],
      ['/api/v1/me/acquisition-listings', 'acquisition'],
    ]) {
      const mine = await req('GET', path, null, multiTok);
      for (const row of mine.json.published || []) {
        if (!isSmokeContent(row)) continue;
        if (DRY_RUN) continue;
        await req('POST', `/api/v1/market/${variant}/listings/${encodeURIComponent(row.id)}/archive`, {}, multiTok);
        report.unpublish.push({ entity: `owner_${variant}`, id: row.id, action: 'archive' });
      }
    }
  }

  const out = process.env.PURGE_EVIDENCE_JSON;
  if (out) {
    require('fs').mkdirSync(require('path').dirname(out), { recursive: true });
    require('fs').writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
  }

  console.log(
    `purge-smoke-display-data: done unpublish=${report.unpublish.length} errors=${report.errors.length}`
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
