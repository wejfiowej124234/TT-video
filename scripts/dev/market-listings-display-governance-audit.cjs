#!/usr/bin/env node
/**
 * Provider + Acquisition · Display Data Governance & FE/API parity audit.
 * API/DB (admin queue) as SSOT; classifies issues for ledger output.
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tourist@test.com';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Test123!';
const OUT = process.env.ML_DG_JSON || '';
const lib = API.startsWith('https') ? https : http;

/** @type {Array<{id:string,variant:string,classification:string,summary:string,detail:string}>} */
const issues = [];

function add(id, variant, classification, summary, detail = '') {
  issues.push({ id, variant, classification, summary, detail });
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

async function login() {
  await req('POST', '/auth/seed-test-accounts', { promote_admin_email: ADMIN_EMAIL });
  const r = await req('POST', '/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASS });
  return r.json.token || null;
}

function variantFromLabel(label) {
  if (/acquisition/i.test(label || '')) return 'acquisition';
  if (/provider/i.test(label || '')) return 'provider';
  return 'unknown';
}

function isSmokeMarketListing(row) {
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

async function auditVariant(variant, token) {
  const pub = await req('GET', `/api/v1/market/${variant}/listings?limit=200`);
  if (pub.status !== 200) {
    add(`ML-${variant.toUpperCase()}-API`, variant, 'PRODUCT_DEFECT', `Public listings HTTP ${pub.status}`);
    return;
  }
  const pubRows = pub.json.items || [];
  const pubIds = pubRows.map((r) => r.id).filter(Boolean);
  if (new Set(pubIds).size !== pubIds.length) {
    add(`ML-${variant.toUpperCase()}-DUP-ID`, variant, 'PRODUCT_DEFECT', 'Duplicate listing ids in public API');
  }

  const admin = await req(
    'GET',
    '/api/v1/admin/official/public-operations/publish-queue?entity_type=market_listings&limit=500',
    null,
    token
  );
  const adminRows = (admin.json.items || []).filter((x) => variantFromLabel(x.label) === variant);
  const adminPub = adminRows.filter((x) => x.display_status === 'published');
  const adminById = Object.fromEntries(adminRows.map((x) => [x.id, x]));

  for (const row of pubRows) {
    if (isSmokeMarketListing(row)) {
      add(`ML-${variant.toUpperCase()}-SMOKE-${row.id.slice(0, 8)}`, variant, 'PRODUCT_DEFECT', 'Smoke listing visible on public catalog', row.payload?.title || row.id);
    }
    const a = adminById[row.id];
    if (!a) {
      add(`ML-${variant.toUpperCase()}-ORPHAN-${row.id.slice(0, 8)}`, variant, 'PRODUCT_DEFECT', 'Public card without admin queue row', row.id);
      continue;
    }
    if (a.display_status !== 'published') {
      add(`ML-${variant.toUpperCase()}-DISPLAY-${row.id.slice(0, 8)}`, variant, 'PRODUCT_DEFECT', 'display_status leak to public', `${a.display_status}`);
    }
    if (/^(test|demo|smoke)$/i.test(a.data_origin || '')) {
      add(`ML-${variant.toUpperCase()}-ORIGIN-${row.id.slice(0, 8)}`, variant, 'PRODUCT_DEFECT', 'test/demo/smoke data_origin on public', a.data_origin);
    }
    const apiOrigin = row.data_origin || a.data_origin;
    if (row.data_origin && a.data_origin && row.data_origin !== a.data_origin) {
      add(`ML-${variant.toUpperCase()}-ORIGIN-DRIFT-${row.id.slice(0, 8)}`, variant, 'PRODUCT_DEFECT', 'API data_origin ≠ admin', `${row.data_origin} vs ${a.data_origin}`);
    }
    if (!apiOrigin || apiOrigin !== 'production') {
      add(`ML-${variant.toUpperCase()}-NONPROD-${row.id.slice(0, 8)}`, variant, 'PRODUCT_DEFECT', 'Non-production listing visible', String(apiOrigin));
    }
    const detail = await req('GET', `/api/v1/market/${variant}/listings/${encodeURIComponent(row.id)}`);
    if (detail.status !== 200) {
      add(`ML-${variant.toUpperCase()}-DETAIL-${row.id.slice(0, 8)}`, variant, 'PRODUCT_DEFECT', 'List item missing detail', String(detail.status));
    } else {
      const lid = detail.json.listing?.id || detail.json.id;
      if (lid && lid !== row.id) {
        add(`ML-${variant.toUpperCase()}-UUID-DRIFT`, variant, 'PRODUCT_DEFECT', 'List/detail id drift', `${row.id} vs ${lid}`);
      }
    }
  }

  for (const a of adminPub) {
    if (variantFromLabel(a.label) !== variant) continue;
    if (a.data_origin === 'production' && !pubIds.includes(a.id)) {
      add(`ML-${variant.toUpperCase()}-MISSING-${a.id.slice(0, 8)}`, variant, 'PRODUCT_DEFECT', 'Admin published not on public API', a.label || a.id);
    }
  }

  const titles = new Map();
  for (const row of pubRows) {
    const t = (row.payload?.title || '').trim().toLowerCase();
    if (!t) {
      add(`ML-${variant.toUpperCase()}-NO-TITLE-${row.id.slice(0, 8)}`, variant, 'PRODUCT_DEFECT', 'Missing payload.title', row.id);
      continue;
    }
    if (!titles.has(t)) titles.set(t, []);
    titles.get(t).push(row.id);
  }
  for (const [t, ids] of titles) {
    if (ids.length > 1) {
      add(`ML-${variant.toUpperCase()}-DUP-TITLE`, variant, 'PRODUCT_DEFECT', 'Duplicate titles on public catalog', `${t} (${ids.length})`);
    }
  }

  const noMedia = pubRows.filter((r) => {
    const p = r.payload || {};
    const v = typeof p.videoUrl === 'string' ? p.videoUrl.trim() : '';
    return !(v.startsWith('http://') || v.startsWith('https://'));
  });
  if (noMedia.length > 1) {
    add(`ML-${variant.toUpperCase()}-PLACEHOLDER-MEDIA`, variant, 'ENHANCEMENT', 'Multiple cards share placeholder media pool', `count=${noMedia.length}`);
  }

  return { variant, public_count: pubRows.length, admin_published: adminPub.length };
}

(async () => {
  const token = await login();
  if (!token) {
    console.error('ML_DG_AUDIT: login failed');
    process.exit(1);
  }

  const provider = await auditVariant('provider', token);
  const acquisition = await auditVariant('acquisition', token);

  const defects = issues.filter((i) => i.classification === 'PRODUCT_DEFECT');
  const payload = {
    schema: 'traveltrust.market_listings_display_governance.v1',
    api: API,
    recorded_at: new Date().toISOString(),
    verdict: defects.length === 0 ? 'PASS' : 'FAIL',
    surfaces: { provider, acquisition },
    issue_counts: {
      PRODUCT_DEFECT: defects.length,
      EXPECTED_DIFFERENCE: issues.filter((i) => i.classification === 'EXPECTED_DIFFERENCE').length,
      ENHANCEMENT: issues.filter((i) => i.classification === 'ENHANCEMENT').length,
    },
    issues,
  };

  if (OUT) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');
  }

  console.log(`ML_DG_AUDIT_VERDICT: ${payload.verdict} defects=${defects.length} enhancement=${payload.issue_counts.ENHANCEMENT}`);
  for (const i of issues) {
    console.log(`${i.classification} ${i.id} ${i.summary}`);
  }
  if (defects.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
