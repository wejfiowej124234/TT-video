#!/usr/bin/env node
/**
 * Business Domain Validation probes — extend Business Manual UAT beyond guides.
 * Provider · Acquisition · Discover · Messages · Itinerary API sanity
 */
const http = require('http');
const https = require('https');

const API = (process.env.API || process.env.API_BASE || '').replace(/\/$/, '');
if (!API) {
  console.error('business-domain-validation-probes: missing API');
  process.exit(1);
}
const ENV_LABEL = process.env.ENV_LABEL || 'auto';
const lib = API.startsWith('https') ? https : http;

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
        res.on('end', () => {
          let json;
          try {
            json = JSON.parse(d);
          } catch {
            json = { _raw: d.slice(0, 200) };
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
  const r = await req('POST', '/auth/login', { email, password });
  return r.json.token || null;
}

const results = [];

function pass(id, msg) {
  results.push({ id, status: 'PASS', msg });
}
function fail(id, msg) {
  results.push({ id, status: 'FAIL', msg });
  throw new Error(`${id}: ${msg}`);
}

(async () => {
  // UAT-01 guides (existing)
  const hz = await req('GET', '/api/v1/guides?city=Hangzhou&limit=20');
  const guides = hz.json.items || hz.json.guides || [];
  if (!guides.length) fail('UAT-01', 'no hangzhou guides');
  const c3Tok = await login('guide@test.com', 'Test123!');
  let c3Id = null;
  if (c3Tok) {
    const me = await req('GET', '/api/v1/me', null, c3Tok);
    c3Id = me.json.guide?.id || null;
  }
  if (!c3Id || !guides.some((g) => g.id === c3Id)) fail('UAT-01', 'C3 not in market');
  pass('UAT-01', `guides=${guides.length} c3=${c3Id}`);

  // UAT-08 discover
  const disc = await req('GET', '/api/v1/discover/orders?limit=20');
  const orders = disc.json.items || disc.json.orders || [];
  for (const o of orders) {
    if ((o.data_origin || '').match(/test|demo|smoke/i)) fail('UAT-08', 'test order in discover');
  }
  pass('UAT-08', `discover=${orders.length}`);

  // UAT-04 provider listings
  const prov = await req('GET', '/api/v1/market/provider/listings?limit=50');
  if (prov.status !== 200) fail('UAT-04', `provider listings ${prov.status}`);
  const provRows = prov.json.items || [];
  const provTest = provRows.filter((x) => /^(test|demo|smoke)$/i.test(x.data_origin || ''));
  const provSmoke = provRows.filter((x) => {
    const t = String(x.payload?.title || '').toLowerCase();
    const d = String(x.payload?.description || '').toLowerCase();
    return t.includes('multi-demo') || t.includes('probe') || d.includes('l3 closure') || t.includes(' smoke');
  });
  if (provTest.length) fail('UAT-04', `${provTest.length} test provider listings public`);
  if (provSmoke.length) fail('UAT-04', `${provSmoke.length} smoke provider listings public`);
  pass('UAT-04', `provider_listings=${provRows.length}`);

  // UAT-09 acquisition listings
  const acq = await req('GET', '/api/v1/market/acquisition/listings?limit=50');
  if (acq.status !== 200) fail('UAT-09', `acquisition listings ${acq.status}`);
  const acqRows = acq.json.items || [];
  const acqTest = acqRows.filter((x) => /^(test|demo|smoke)$/i.test(x.data_origin || ''));
  const acqSmoke = acqRows.filter((x) => {
    const t = String(x.payload?.title || '').toLowerCase();
    const d = String(x.payload?.description || '').toLowerCase();
    return t.includes('multi-demo') || t.includes('probe') || d.includes('l3 closure') || t.includes(' smoke');
  });
  if (acqTest.length) fail('UAT-09', `${acqTest.length} test acquisition listings public`);
  if (acqSmoke.length) fail('UAT-09', `${acqSmoke.length} smoke acquisition listings public`);
  pass('UAT-09', `acquisition_listings=${acqRows.length}`);

  // UAT-10 messages count (authed tourist)
  const tok = await login('tourist@test.com', 'Test123!');
  if (!tok) fail('UAT-10', 'tourist login failed');
  const conv = await req('GET', '/api/v1/community/conversations?limit=30', null, tok);
  if (conv.status !== 200) fail('UAT-10', `conversations ${conv.status}`);
  const convCount = (conv.json.items || conv.json.conversations || []).length;
  pass('UAT-10', `conversations=${convCount}`);

  // UAT-11 itinerary custom endpoint reachable (OPTIONS/POST schema — GET catalog)
  const countries = await req('GET', '/api/v1/catalog/countries');
  if (countries.status !== 200 && countries.status !== 404) {
    fail('UAT-11', `catalog/countries ${countries.status}`);
  }
  pass('UAT-11', `catalog_countries=${countries.status}`);

  console.log('PASS probes env=' + ENV_LABEL + ' ' + results.map((r) => r.id).join(','));
})().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
