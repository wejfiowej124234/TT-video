#!/usr/bin/env node
/**
 * Admin Matrix Completeness · SettlementRouter Runtime Evidence (② Staging).
 * Prints HTTP codes + totals only — never tokens/passwords.
 *
 *   node scripts/dev/probe-admin-matrix-sr-staging-runtime.cjs
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');

const API = (process.env.STAGING_API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const WEB = (process.env.STAGING_WEB_BASE || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');
const OUT =
  process.env.TT_SR_RUNTIME_OUT ||
  path.join(
    process.cwd(),
    'evidence/DEPLOYMENT_THREE_STATE/20260727T054956Z-admin-matrix-sr-fix',
    `runtime-probe-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}Z`
  );

async function httpGet(url) {
  const lib = url.startsWith('https') ? require('https') : require('http');
  return new Promise((resolve) => {
    const req = lib.get(url, { timeout: 30000 }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => resolve({ status: res.statusCode, len: d.length, body: d, location: res.headers.location || null }));
    });
    req.on('error', (e) => resolve({ status: 0, err: String(e.message || e) }));
  });
}

function digTotal(j) {
  if (!j || typeof j !== 'object') return { via: null, total: null };
  const metaStats = j.meta && j.meta.settlement_router_stats;
  if (metaStats && typeof metaStats.total === 'number') {
    return { via: 'meta.settlement_router_stats', total: metaStats.total, stats: metaStats };
  }
  if (j.summary && typeof j.summary.total === 'number') {
    return { via: 'summary.total', total: j.summary.total, stats: j.summary };
  }
  const stats =
    j.settlement_router_stats ||
    (j.data && j.data.settlement_router_stats) ||
    null;
  if (stats && typeof stats.total === 'number') return { via: 'stats', total: stats.total, stats };
  if (typeof j.total === 'number') return { via: 'total', total: j.total };
  return { via: null, total: null, keys: Object.keys(j).slice(0, 24) };
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

  const health = await httpGet(`${API}/health`);
  const fin = await client.req('GET', '/api/v1/admin/finance/summary', null, token);
  const sr = await client.req('GET', '/api/v1/admin/settlement-router/events?limit=20', null, token);
  const rbac = await client.req('GET', '/api/v1/admin/rbac/route-matrix', null, token);
  const caps = await client.req('GET', '/api/v1/admin/capabilities', null, token);

  const finDig = digTotal(fin.json);
  const srDig = digTotal(sr.json);
  const items =
    (sr.json && (sr.json.items || sr.json.events || (sr.json.data && sr.json.data.items))) || [];
  const itemLen = Array.isArray(items) ? items.length : null;

  let rbacHasSr = false;
  const rbacRaw = JSON.stringify(rbac.json || {});
  if (/settlement-router|settlement_router/i.test(rbacRaw)) rbacHasSr = true;

  const webSr = await httpGet(`${WEB}/admin/settlement-router`);
  const webFin = await httpGet(`${WEB}/admin/finance`);
  const webHtmlHas =
    webSr.body && /settlement-router|SettlementRouter|settlementRouter/i.test(webSr.body);

  const summary = {
    stamp: path.basename(OUT).replace(/^runtime-probe-/, ''),
    auth_gate: session.gate,
    auth_email: session.email,
    capabilities_http: session.capabilities_http,
    tip_cite: 'ea71c577ce6f99696df33f9394cf96746edc843b',
    TT_REALITY_CLOSURE: 'NOT_ARMED',
    PRR_READY: false,
    TT_PRODUCTION_GO: 'NO_GO',
    api: API,
    web: WEB,
    health_http: health.status,
    finance_summary_http: fin.status,
    finance_sr_total: finDig.total,
    finance_sr_via: finDig.via,
    finance_sr_stats: finDig.stats || null,
    sr_events_http: sr.status,
    sr_events_total: srDig.total,
    sr_events_items_len: itemLen,
    rbac_http: rbac.status,
    rbac_has_settlement_router_row: rbacHasSr,
    capabilities_http: caps.status,
    web_admin_settlement_router_http: webSr.status,
    web_admin_settlement_router_redirect: webSr.location || null,
    web_admin_finance_http: webFin.status,
    web_sr_html_mentions_route: !!webHtmlHas,
    align_bridge_total_3: finDig.total === 3 || srDig.total === 3,
    events_list_deployed: sr.status === 200,
    honest_boundary:
      'API/WEB runtime PASS ≠ B-ADMIN CLOSED ≠ Matrix Recalc ≠ Reality Closure ARM ≠ Production GO',
    verdict:
      sr.status === 200 && (finDig.total === 3 || srDig.total === 3)
        ? 'PASS_RUNTIME_PARTIAL'
        : sr.status === 404
          ? 'OPEN_PENDING_DEPLOY'
          : 'NEED_FIX',
  };

  fs.writeFileSync(path.join(OUT, 'SUMMARY.json'), JSON.stringify(summary, null, 2));
  fs.writeFileSync(
    path.join(OUT, 'finance-summary.status.json'),
    JSON.stringify({ http: fin.status, dig: finDig }, null, 2)
  );
  fs.writeFileSync(
    path.join(OUT, 'sr-events.status.json'),
    JSON.stringify(
      {
        http: sr.status,
        dig: srDig,
        items_len: itemLen,
        sample_keys:
          itemLen && items[0] && typeof items[0] === 'object' ? Object.keys(items[0]).slice(0, 16) : [],
      },
      null,
      2
    )
  );
  console.log(JSON.stringify(summary, null, 2));
  process.exit(summary.events_list_deployed && summary.align_bridge_total_3 ? 0 : 3);
})().catch((e) => {
  console.error(String(e && e.stack ? e.stack : e));
  process.exit(1);
});
