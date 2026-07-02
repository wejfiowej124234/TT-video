#!/usr/bin/env node
const http = require('http');
const https = require('https');

const API = (process.env.API || '').replace(/\/$/, '');
const ENV_LABEL = process.env.ENV_LABEL || 'auto';
const lib = API.startsWith('https') ? https : http;

function get(path) {
  return new Promise((resolve, reject) => {
    lib.get(API + path, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(API + path);
    const payload = JSON.stringify(body);
    const r = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => resolve(JSON.parse(d)));
      }
    );
    r.on('error', reject);
    r.write(payload);
    r.end();
  });
}

(async () => {
  const hz = await get('/api/v1/guides?city=Hangzhou&limit=20');
  const rows = hz.items || hz.guides || [];
  if (!rows.length) throw new Error('UAT-01 no hangzhou guides');
  const login = await post('/auth/login', { email: 'guide@test.com', password: 'Test123!' });
  const me = await get('/api/v1/me').catch(() => null);
  let gid = null;
  if (login.token) {
    const u = new URL(API + '/api/v1/me');
    gid = await new Promise((resolve, reject) => {
      lib.get(
        { hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80), path: u.pathname, headers: { Authorization: 'Bearer ' + login.token } },
        (res) => {
          let d = '';
          res.on('data', (c) => (d += c));
          res.on('end', () => resolve(JSON.parse(d).guide?.id || null));
        }
      ).on('error', reject);
    });
  }
  if (!gid || !rows.some((g) => g.id === gid)) throw new Error('UAT-01 C3 not in market');
  const disc = await get('/api/v1/discover/orders?limit=20');
  const orders = disc.items || disc.orders || [];
  for (const o of orders) {
    if ((o.data_origin || '').match(/test|demo|smoke/i)) throw new Error('UAT-08 test order in discover');
  }
  console.log('PASS probes env=' + ENV_LABEL + ' guides=' + rows.length + ' discover=' + orders.length);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
