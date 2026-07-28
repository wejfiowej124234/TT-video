#!/usr/bin/env node
/**
 * Admin Matrix · meta.source Reality probe (② Staging).
 * Covers Finance / Approvals / Region / Capabilities / SR / FeeRouter / Home.
 *
 *   node scripts/dev/probe-admin-matrix-meta-source-staging.cjs
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');

const API = (process.env.STAGING_API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const WEB = (process.env.STAGING_WEB_BASE || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');
const OUT =
  process.env.TT_META_SOURCE_OUT ||
  path.join(
    process.cwd(),
    'evidence/DEPLOYMENT_THREE_STATE',
    `admin-matrix-meta-source-probe-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}Z`
  );

const PATHS = [
  ['approvals', '/api/v1/admin/approvals?limit=5'],
  ['fee_router_routed', '/api/v1/admin/fee-router/routed-events?limit=5'],
  ['settlement_router_events', '/api/v1/admin/settlement-router/events?limit=5'],
  ['region_vault_forwarded', '/api/v1/admin/region-vault/forwarded-events?limit=5'],
  ['metrics_home_overview', '/api/v1/admin/metrics/home-overview'],
  ['capabilities', '/api/v1/admin/capabilities'],
  ['finance_summary', '/api/v1/admin/finance/summary'],
  ['users', '/api/v1/admin/users?limit=2'],
  ['orders', '/api/v1/admin/orders?limit=2'],
  ['disputes', '/api/v1/admin/disputes?limit=2'],
];

/** Expected meta.source (CONFIRM_DESIGN allowed for finance). */
const EXPECT = {
  approvals: { any: ['postgres', 'memory'] },
  fee_router_routed: { any: ['postgres'] },
  settlement_router_events: { any: ['postgres'] },
  region_vault_forwarded: { any: ['postgres'] },
  metrics_home_overview: { any: ['postgres', 'derived', 'snapshot', 'live'] },
  capabilities: { any: ['rbac_matrix_v1', 'postgres'] },
  finance_summary: { any: ['chain_off', 'postgres'], confirm_design: ['chain_off'] },
  users: { any: ['postgres'] },
  orders: { any: ['postgres'] },
  disputes: { any: ['postgres'] },
};

function pickSource(body) {
  if (!body || typeof body !== 'object') return { meta: null, applied: null, top: null };
  return {
    meta: body.meta && body.meta.source != null ? body.meta.source : null,
    applied: body.applied_filters && body.applied_filters.source != null ? body.applied_filters.source : null,
    top: body.source != null ? body.source : null,
  };
}

function evalRow(name, http, src) {
  const exp = EXPECT[name] || { any: [] };
  const got = src.meta || src.applied || src.top;
  const okHttp = http === 200;
  const okSrc = got != null && exp.any.includes(String(got));
  const confirm = got != null && (exp.confirm_design || []).includes(String(got));
  let status = 'FAIL';
  if (okHttp && okSrc && confirm) status = 'PASS_CONFIRM_DESIGN';
  else if (okHttp && okSrc) status = 'PASS';
  else if (okHttp && got == null) status = 'NEED_FIX_MISSING_META_SOURCE';
  else if (okHttp) status = 'NEED_FIX_UNEXPECTED_SOURCE';
  else status = 'FAIL_HTTP';
  return { status, got, okHttp, okSrc, confirm };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const client = createClient(API);
  let session;
  try {
    session = await client.adminSession(null, null);
  } catch (e) {
    const summary = {
      verdict: 'FAIL',
      reason: 'admin_session_gate_failed',
      detail: String(e.message || e),
      auth_gate: 'seed_login_role_capabilities_200',
      api: API,
      out: OUT,
    };
    fs.writeFileSync(path.join(OUT, 'SUMMARY.json'), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify(summary, null, 2));
    process.exit(2);
  }
  const { token } = session;

  const metaRes = await client.req('GET', '/meta', null, null).catch(() => null);
  // /meta is often unauthenticated
  let buildSha = null;
  try {
    const https = require('https');
    buildSha = await new Promise((resolve) => {
      https
        .get(`${API}/meta`, { timeout: 20000 }, (res) => {
          let d = '';
          res.on('data', (c) => (d += c));
          res.on('end', () => {
            try {
              resolve(JSON.parse(d)?.build?.git_sha || null);
            } catch {
              resolve(null);
            }
          });
        })
        .on('error', () => resolve(null));
    });
  } catch {
    buildSha = null;
  }

  const rows = {};
  let needFix = 0;
  let fail = 0;
  let pass = 0;
  let confirm = 0;

  for (const [name, p] of PATHS) {
    const r = await client.req('GET', p, null, token);
    const src = pickSource(r.json);
    const ev = evalRow(name, r.status, src);
    rows[name] = {
      path: p,
      http: r.status,
      source: src,
      expect_any: EXPECT[name]?.any || [],
      ...ev,
    };
    if (ev.status.startsWith('PASS_CONFIRM')) confirm += 1;
    else if (ev.status.startsWith('PASS')) pass += 1;
    else if (ev.status.startsWith('NEED_FIX')) needFix += 1;
    else fail += 1;
  }

  // unauth web route smoke (redirect expected)
  const webPaths = ['/admin', '/admin/finance', '/admin/approvals', '/admin/capabilities', '/admin/settlement-router'];
  const web = {};
  for (const wp of webPaths) {
    const url = `${WEB}${wp}`;
    const lib = require('https');
    const hit = await new Promise((resolve) => {
      const req = lib.get(url, { timeout: 20000 }, (res) => {
        resolve({ status: res.statusCode, location: res.headers.location || null });
      });
      req.on('error', (e) => resolve({ status: 0, err: String(e.message || e) }));
    });
    web[wp] = hit;
  }

  const verdict =
    fail > 0
      ? 'FAIL'
      : needFix > 0
        ? 'NEED_FIX'
        : confirm > 0
          ? 'PASS_WITH_CONFIRM_DESIGN'
          : 'PASS';

  const summary = {
    machine: 'TT_ADMIN_MATRIX_META_SOURCE_REALITY',
    stamp: path.basename(OUT),
    tip_cite: 'ea71c577ce6f99696df33f9394cf96746edc843b',
    tip_immobile: true,
    TT_REALITY_CLOSURE: 'NOT_ARMED',
    PRR_READY: false,
    TT_PRODUCTION_GO: 'NO_GO',
    auth_gate: session.gate,
    auth_email: session.email,
    capabilities_http: session.capabilities_http,
    api: API,
    web: WEB,
    api_build_sha: buildSha,
    counts: { pass, confirm_design: confirm, need_fix: needFix, fail },
    rows,
    web_unauth: web,
    verdict,
    honesty:
      'PASS≠Admin200/200≠ARM≠PRR≠ProductionGO; Staging bake SHA may ≠ tip (CONFIRM_DESIGN)',
  };

  fs.writeFileSync(path.join(OUT, 'SUMMARY.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  process.exit(verdict === 'FAIL' ? 2 : verdict === 'NEED_FIX' ? 3 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
