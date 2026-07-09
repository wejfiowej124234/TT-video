#!/usr/bin/env node
/**
 * Purge staging smoke market listings (Multi-demo / probe / smoke / L3 closure).
 * - Admin unpublish from public-operations queue
 * - multi-demo@test.com archives owned published listings
 *
 *   API_BASE=https://tt-api-staging.fly.dev node scripts/dev/purge-staging-smoke-market-listings.cjs
 */
const http = require('http');
const https = require('https');

const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tourist@test.com';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Test123!';
const MULTI_EMAIL = process.env.MULTI_DEMO_EMAIL || 'multi-demo@test.com';
const MULTI_PASS = process.env.MULTI_DEMO_PASS || 'Test123!';
const DRY_RUN = process.env.DRY_RUN === '1';
const lib = API.startsWith('https') ? https : http;

function isSmokeListing(row) {
  const title = String(row.payload?.title || row.label || '').trim().toLowerCase();
  const desc = String(row.payload?.description || '').trim().toLowerCase();
  const label = String(row.label || '').trim().toLowerCase();
  const blob = `${title} ${desc} ${label}`;
  return (
    blob.includes('multi-demo') ||
    blob.includes('l3 closure') ||
    blob.includes('probe') ||
    blob.includes(' smoke') ||
    title.startsWith('smoke ')
  );
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

function variantFromLabel(label) {
  if (/acquisition/i.test(label || '')) return 'acquisition';
  if (/provider/i.test(label || '')) return 'provider';
  return null;
}

(async () => {
  const adminTok = await login(ADMIN_EMAIL, ADMIN_PASS);
  if (!adminTok) {
    console.error('purge-smoke-listings: admin login failed');
    process.exit(1);
  }

  const multiTok = await login(MULTI_EMAIL, MULTI_PASS);
  const report = {
    schema: 'traveltrust.purge_staging_smoke_market_listings.v1',
    api: API,
    at: new Date().toISOString(),
    dry_run: DRY_RUN,
    admin_unpublished: [],
    owner_archived: [],
    skipped: [],
    errors: [],
  };

  const queue = await req(
    'GET',
    '/api/v1/admin/official/public-operations/publish-queue?entity_type=market_listings&limit=500',
    null,
    adminTok
  );
  const items = queue.json.items || [];
  const smokeItems = items.filter(isSmokeListing);
  console.log(`purge-smoke-listings: admin queue smoke candidates=${smokeItems.length}/${items.length}`);

  for (const row of smokeItems) {
    if (row.display_status === 'published') {
      if (DRY_RUN) {
        console.log('DRY admin unpublish', row.id, row.label);
        report.admin_unpublished.push({ id: row.id, label: row.label, action: 'dry_unpublish' });
        continue;
      }
      const r = await req(
        'POST',
        `/api/v1/admin/official/public-operations/entities/market_listings/${row.id}/unpublish`,
        {},
        adminTok
      );
      if (r.status >= 200 && r.status < 300) {
        report.admin_unpublished.push({ id: row.id, label: row.label, action: 'unpublish' });
        console.log('OK admin unpublish', row.id, row.label);
      } else {
        report.errors.push({ id: row.id, step: 'admin_unpublish', status: r.status, label: row.label });
        console.log('WARN admin unpublish', row.id, r.status);
      }
    }
  }

  if (multiTok) {
    for (const [path, variant] of [
      ['/api/v1/me/merchant-listings', 'provider'],
      ['/api/v1/me/acquisition-listings', 'acquisition'],
    ]) {
      const mine = await req('GET', path, null, multiTok);
      const published = (mine.json.published || []).filter((r) => isSmokeListing(r));
      console.log(`purge-smoke-listings: multi-demo ${variant} smoke published=${published.length}`);
      for (const row of published) {
        if (DRY_RUN) {
          console.log('DRY archive', variant, row.id, row.title || row.payload?.title);
          report.owner_archived.push({ id: row.id, variant, action: 'dry_archive' });
          continue;
        }
        const r = await req(
          'POST',
          `/api/v1/market/${variant}/listings/${encodeURIComponent(row.id)}/archive`,
          {},
          multiTok
        );
        if (r.status >= 200 && r.status < 300) {
          report.owner_archived.push({ id: row.id, variant, title: row.title || row.payload?.title, action: 'archive' });
          console.log('OK archive', variant, row.id);
        } else {
          report.errors.push({ id: row.id, step: 'owner_archive', variant, status: r.status });
          console.log('WARN archive', variant, row.id, r.status);
        }
      }
    }
  } else {
    report.errors.push({ step: 'multi_demo_login', message: 'login failed' });
  }

  for (const variant of ['provider', 'acquisition']) {
    const pub = await req('GET', `/api/v1/market/${variant}/listings?limit=200`);
    const leaks = (pub.json.items || []).filter(isSmokeListing);
    if (leaks.length) {
      console.log(`WARN public ${variant} smoke leaks=${leaks.length}`);
      for (const row of leaks) {
        report.errors.push({ step: 'public_leak', variant, id: row.id, title: row.payload?.title });
      }
    } else {
      console.log(`OK public ${variant} smoke leaks=0 count=${(pub.json.items || []).length}`);
    }
  }

  const out = process.env.PURGE_EVIDENCE_JSON;
  if (out) {
    require('fs').mkdirSync(require('path').dirname(out), { recursive: true });
    require('fs').writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
  }

  console.log(
    `purge-smoke-listings: done admin_unpublished=${report.admin_unpublished.length} owner_archived=${report.owner_archived.length} errors=${report.errors.length}`
  );
  if (report.errors.some((e) => e.step === 'public_leak')) process.exit(2);
  if (report.errors.length && !report.admin_unpublished.length && !report.owner_archived.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
