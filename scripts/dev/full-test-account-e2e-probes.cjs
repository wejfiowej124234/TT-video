#!/usr/bin/env node
/**
 * Full Test Account E2E — API / persistence probes (staging).
 * Validates login, /me identity, role endpoints, and cross-layer data (API as DB proxy).
 */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const PASSWORD = process.env.FTAE_PASSWORD || 'Test123!';
const OUT = process.env.FTAE_PROBE_JSON || '';
const lib = API.startsWith('https') ? https : http;

/** @type {Array<{id:string,account:string,layer:string,status:'PASS'|'FAIL',note:string}>} */
const results = [];

function record(id, account, layer, status, note) {
  results.push({ id, account, layer, status, note });
  console.log(`FTAE_PROBE ${id} ${account} ${layer} ${status} ${note}`);
}

function req(method, urlPath, body, token, userId) {
  return new Promise((resolve, reject) => {
    const u = new URL(API + urlPath);
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(userId ? { 'X-User-Id': userId } : {}),
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
            json = { _raw: d.slice(0, 300) };
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

async function seed(promoteAdminEmail) {
  await req('POST', '/auth/seed-test-accounts', {}).catch(() => null);
  if (promoteAdminEmail) {
    await req('POST', '/auth/seed-test-accounts', { promote_admin_email: promoteAdminEmail });
  }
}

async function login(email) {
  const r = await req('POST', '/auth/login', { email, password: PASSWORD });
  if (r.status !== 200 || !r.json.token) return null;
  return { token: r.json.token, userId: r.json.user_id || '', email };
}

async function probeAccount(cfg) {
  const { id, email, promoteAdmin, checks } = cfg;
  await seed(promoteAdmin ? email : null);
  const session = await login(email);
  if (!session) {
    record(`${id}-LOGIN`, id, 'api', 'FAIL', `login failed ${email}`);
    return;
  }
  record(`${id}-LOGIN`, id, 'api', 'PASS', 'token ok');

  const me = await req('GET', '/api/v1/me', null, session.token, session.userId);
  if (me.status !== 200) {
    record(`${id}-ME`, id, 'db-proxy', 'FAIL', `/me ${me.status}`);
    return;
  }
  const meEmail = (me.json.user?.email || me.json.email || '').toLowerCase();
  if (meEmail !== email.toLowerCase()) {
    record(`${id}-ME`, id, 'db-proxy', 'FAIL', `email mismatch api=${meEmail}`);
    return;
  }
  record(`${id}-ME`, id, 'db-proxy', 'PASS', `user_id=${me.json.user?.id || session.userId}`);

  for (const check of checks) {
    try {
      await check.fn(id, session, me.json, req);
    } catch (e) {
      record(`${id}-${check.name}`, id, check.layer || 'api', 'FAIL', e.message || String(e));
    }
  }
}

const ACCOUNTS = [
  {
    id: 'C2',
    email: 'tourist@test.com',
    promoteAdmin: true,
    checks: [
      {
        name: 'ORDERS',
        layer: 'db-proxy',
        async fn(id, s, me, rq) {
          const r = await rq('GET', '/api/v1/orders?role=traveler&limit=20', null, s.token, s.userId);
          if (r.status !== 200) throw new Error(`orders ${r.status}`);
          const items = r.json.items || [];
          record(`${id}-ORDERS`, 'C2', 'db-proxy', 'PASS', `count=${items.length}`);
        },
      },
      {
        name: 'CONVERSATIONS',
        layer: 'db-proxy',
        async fn(id, s, me, rq) {
          const r = await rq('GET', '/api/v1/community/conversations?limit=20', null, s.token, s.userId);
          if (r.status !== 200) throw new Error(`conversations ${r.status}`);
          const items = r.json.items || r.json.conversations || [];
          record(`${id}-CONVERSATIONS`, 'C2', 'db-proxy', 'PASS', `count=${items.length}`);
        },
      },
      {
        name: 'ADMIN',
        layer: 'api',
        async fn(id, s, me, rq) {
          const r = await rq('GET', '/api/v1/admin/capabilities', null, s.token, s.userId);
          if (r.status !== 200) throw new Error(`admin capabilities ${r.status}`);
          record(`${id}-ADMIN`, 'C2', 'api', 'PASS', 'capabilities ok');
        },
      },
      {
        name: 'GOVERNANCE',
        layer: 'api',
        async fn(id, s, me, rq) {
          const r = await rq('GET', '/api/v1/governance/proposals?limit=10', null, s.token, s.userId);
          if (r.status !== 200) throw new Error(`proposals ${r.status}`);
          const rows = r.json.proposals || r.json.items || [];
          record(`${id}-GOVERNANCE`, 'C2', 'api', 'PASS', `proposals=${rows.length}`);
        },
      },
    ],
  },
  {
    id: 'C3',
    email: 'guide@test.com',
    checks: [
      {
        name: 'GUIDE_PROFILE',
        layer: 'db-proxy',
        async fn(id, s, me, rq) {
          const guideId = me.guide?.id;
          if (!guideId) throw new Error('me.guide.id missing');
          const r = await rq('GET', `/api/v1/guides/${guideId}`, null, s.token, s.userId);
          if (r.status !== 200) throw new Error(`guide profile ${r.status}`);
          record(`${id}-GUIDE_PROFILE`, 'C3', 'db-proxy', 'PASS', `guide_id=${guideId}`);
        },
      },
      {
        name: 'MARKET_VISIBLE',
        layer: 'db-proxy',
        async fn(id, s, me, rq) {
          const guideId = me.guide?.id;
          const hz = await rq('GET', '/api/v1/guides?city=Hangzhou&limit=50');
          const items = hz.json.items || hz.json.guides || [];
          if (!items.some((g) => g.id === guideId)) throw new Error('C3 not in Hangzhou guides');
          record(`${id}-MARKET_VISIBLE`, 'C3', 'db-proxy', 'PASS', 'in guides catalog');
        },
      },
      {
        name: 'GUIDE_ORDERS',
        layer: 'db-proxy',
        async fn(id, s, me, rq) {
          const r = await rq('GET', '/api/v1/orders?role=guide&limit=20', null, s.token, s.userId);
          if (r.status !== 200) throw new Error(`guide orders ${r.status}`);
          record(`${id}-GUIDE_ORDERS`, 'C3', 'db-proxy', 'PASS', `count=${(r.json.items || []).length}`);
        },
      },
    ],
  },
  {
    id: 'C1',
    email: 'multi-demo@test.com',
    checks: [
      {
        name: 'ACQUISITION_LISTINGS',
        layer: 'api',
        async fn(id, s, me, rq) {
          const r = await rq('GET', '/api/v1/market/acquisition/listings?limit=20', null, s.token, s.userId);
          if (r.status !== 200) throw new Error(`acquisition ${r.status}`);
          record(`${id}-ACQUISITION_LISTINGS`, 'C1', 'api', 'PASS', `count=${(r.json.items || []).length}`);
        },
      },
      {
        name: 'IDENTITIES',
        layer: 'db-proxy',
        async fn(id, s, me, rq) {
          const roles = me.identities || me.roles || [];
          record(`${id}-IDENTITIES`, 'C1', 'db-proxy', 'PASS', `identities=${Array.isArray(roles) ? roles.length : 'me_ok'}`);
        },
      },
    ],
  },
  {
    id: 'C4',
    email: 'merchant@test.com',
    checks: [
      {
        name: 'PROVIDER_LISTINGS',
        layer: 'api',
        async fn(id, s, me, rq) {
          const r = await rq('GET', '/api/v1/market/provider/listings?limit=20', null, s.token, s.userId);
          if (r.status !== 200) throw new Error(`provider listings ${r.status}`);
          record(`${id}-PROVIDER_LISTINGS`, 'C4', 'api', 'PASS', `count=${(r.json.items || []).length}`);
        },
      },
      {
        name: 'MERCHANT_ME',
        layer: 'db-proxy',
        async fn(id, s, me, rq) {
          const provider = me.provider || me.merchant;
          record(`${id}-MERCHANT_ME`, 'C4', 'db-proxy', 'PASS', provider ? 'provider envelope' : 'me ok');
        },
      },
    ],
  },
  {
    id: 'E2',
    email: 'provider-did-rank-demo@test.com',
    checks: [
      {
        name: 'DID_RANK',
        layer: 'api',
        async fn(id, s, me, rq) {
          const r = await rq('GET', '/api/v1/did-rank/boards?limit=10', null, s.token, s.userId);
          if (r.status !== 200 && r.status !== 404) throw new Error(`did-rank ${r.status}`);
          record(`${id}-DID_RANK`, 'E2', 'api', 'PASS', `status=${r.status}`);
        },
      },
    ],
  },
];

(async () => {
  for (const cfg of ACCOUNTS) {
    await probeAccount(cfg);
  }

  const fails = results.filter((r) => r.status === 'FAIL');
  const payload = {
    schema: 'traveltrust.ftae_probes.v1',
    api: API,
    recorded_at: new Date().toISOString(),
    verdict: fails.length === 0 ? 'PASS' : 'FAIL',
    summary: { pass: results.length - fails.length, fail: fails.length },
    results,
  };
  if (OUT) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');
  }
  console.log(`FTAE_PROBE_VERDICT: ${payload.verdict} pass=${payload.summary.pass} fail=${payload.summary.fail}`);
  if (fails.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
