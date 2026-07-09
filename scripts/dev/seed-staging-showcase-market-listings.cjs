#!/usr/bin/env node
/**
 * Seed staging showcase market listings (merchant@test.com · non-smoke titles).
 *
 *   API_BASE=https://tt-api-staging.fly.dev node scripts/dev/seed-staging-showcase-market-listings.cjs
 */
const http = require('http');
const https = require('https');

const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const MERCHANT_EMAIL = process.env.MERCHANT_EMAIL || 'merchant@test.com';
const MERCHANT_PASS = process.env.MERCHANT_PASS || 'Test123!';
const lib = API.startsWith('https') ? https : http;

const PROVIDER_TITLE = '西溪印象城 · 旅拍写真套餐';
const ACQUISITION_TITLE = '京都限量版手办代购 · 悬赏任务';
const COVER =
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80';

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
  await req('POST', '/auth/seed-test-accounts', {});
  const r = await req('POST', '/auth/login', { email, password });
  return r.json.token || null;
}

function hasPublished(rows, needle) {
  return (rows || []).some((r) => String(r.title || r.payload?.title || '').includes(needle));
}

(async () => {
  const token = await login(MERCHANT_EMAIL, MERCHANT_PASS);
  if (!token) {
    console.error('seed-showcase-listings: merchant login failed');
    process.exit(1);
  }

  const report = { provider: null, acquisition: null };

  const merchantMine = await req('GET', '/api/v1/me/merchant-listings', null, token);
  if (!hasPublished(merchantMine.json.published, PROVIDER_TITLE)) {
    const body = {
      payload: {
        kind: 'merchant_showcase_studio_v1',
        title: PROVIDER_TITLE,
        city: 'Hangzhou',
        category: 'experience',
        countryIso: 'CN',
        description: 'Staging showcase · 旅拍写真套餐',
        videoUrl: COVER,
        priceUsdc: 299,
      },
    };
    const r = await req('POST', '/api/v1/market/provider/listings', body, token);
    report.provider = { status: r.status, id: r.json.listing?.id || r.json.id || null };
    console.log('seed-showcase-listings: provider', r.status, report.provider.id || '');
  } else {
    report.provider = { status: 'skipped', reason: 'already_published' };
    console.log('seed-showcase-listings: provider skipped (exists)');
  }

  const acqMine = await req('GET', '/api/v1/me/acquisition-listings', null, token);
  if (!hasPublished(acqMine.json.published, ACQUISITION_TITLE)) {
    const body = {
      agree_escrow_copy: true,
      payload: {
        kind: 'acquisition_carry_studio_v1',
        title: ACQUISITION_TITLE,
        bountyMinUsdc: 80,
        bountyMaxUsdc: 220,
        description: 'Staging showcase · 手办代购悬赏',
        videoUrl: COVER,
        countryIso: 'JP',
        category: 'collectibles',
      },
    };
    const r = await req('POST', '/api/v1/market/acquisition/listings', body, token);
    report.acquisition = { status: r.status, id: r.json.listing?.id || r.json.id || null };
    console.log('seed-showcase-listings: acquisition', r.status, report.acquisition.id || '');
  } else {
    report.acquisition = { status: 'skipped', reason: 'already_published' };
    console.log('seed-showcase-listings: acquisition skipped (exists)');
  }

  for (const variant of ['provider', 'acquisition']) {
    const pub = await req('GET', `/api/v1/market/${variant}/listings?limit=20`);
    console.log(`seed-showcase-listings: public ${variant} count=${(pub.json.items || []).length}`);
  }

  const out = process.env.SEED_EVIDENCE_JSON;
  if (out) {
    require('fs').mkdirSync(require('path').dirname(out), { recursive: true });
    require('fs').writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
