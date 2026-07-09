#!/usr/bin/env node
/**
 * Phase 4 · Manual 9 · Refresh Recovery · Round A probe
 * Layers: api → database → page (shell) — browser human_action deferred to Round B
 */
const fs = require('fs');
const path = require('path');
const { request } = require('./lib/production-readiness-probe-http.cjs');

const ROOT = path.join(__dirname, '../..');
const WEB = (process.env.WEB || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const EMAIL = process.env.MANUAL_EMAIL || 'tourist@test.com';
const PASSWORD = process.env.MANUAL_PASSWORD || 'Test123!';
const SAMPLE_COMPLETED = process.env.MANUAL_SAMPLE_ORDER || '1bbb38dc-b333-41b2-a0ef-307586b17d46';
const SAMPLE_CREATED = process.env.MANUAL_CREATED_ORDER || '61aed01a-a247-4922-8e21-ba3120833f7b';

const PROBE_OUT = path.join(ROOT, 'evidence/GO_production_readiness/step4/manual/steps/manual-refresh-recovery-probe-LATEST.json');
const EVIDENCE_OUT = path.join(ROOT, 'evidence/GO_production_readiness/step4/manual/steps/manual-refresh_recovery-LATEST.json');

const ROUTES = ['/market', '/orders', `/escrow/${SAMPLE_COMPLETED}`];

function layer(verdict, detail) {
  return { verdict, ...detail };
}

async function fetchWeb(route) {
  const url = `${WEB}${route}`;
  try {
    const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Phase4-Manual-RefreshRecovery/1.0' } });
    const text = await res.text();
    const hasAppShell = /traveltrust|market|orders|escrow|login|next/i.test(text) && text.length > 500;
    return { route, url, http: res.status, ok: res.status === 200 && hasAppShell, body_length: text.length, hasAppShell };
  } catch (e) {
    return { route, url, http: 0, ok: false, error: String(e.message || e) };
  }
}

function readEvidence() {
  if (!fs.existsSync(EVIDENCE_OUT)) return null;
  try {
    return JSON.parse(fs.readFileSync(EVIDENCE_OUT, 'utf8'));
  } catch {
    return null;
  }
}

function writeCheckpoint(partial) {
  fs.mkdirSync(path.dirname(EVIDENCE_OUT), { recursive: true });
  fs.writeFileSync(EVIDENCE_OUT, JSON.stringify(partial, null, 2) + '\n');
}

async function main() {
  const recordedAt = new Date().toISOString();
  const prior = readEvidence();

  const login = await request(`${API}/auth/login`, {
    method: 'POST',
    body: { email: EMAIL, password: PASSWORD },
  });
  const token = login.json?.token;
  const userId = login.json?.user_id;
  const loginOk = login.status === 200 && login.json?.status === 'ok' && Boolean(token);

  const me = loginOk ? await request(`${API}/api/v1/me`, { token }) : { status: 0, json: null };
  const orders = loginOk ? await request(`${API}/api/v1/orders`, { token }) : { status: 0, json: null };
  const completed = loginOk
    ? await request(`${API}/api/v1/orders/${SAMPLE_COMPLETED}`, { token })
    : { status: 0, json: null };
  const created = loginOk
    ? await request(`${API}/api/v1/orders/${SAMPLE_CREATED}`, { token })
    : { status: 0, json: null };
  const invalidMe = await request(`${API}/api/v1/me`, { token: 'invalid-token-xyz' });

  const orderItems = orders.json?.items || [];
  const completedOrder = completed.json?.order || completed.json;
  const createdOrder = created.json?.order || created.json;
  const completedStatus = completedOrder?.status || completedOrder?.state;
  const createdStatus = createdOrder?.status || createdOrder?.state;

  const apiPass =
    loginOk &&
    me.status === 200 &&
    me.json?.status === 'ok' &&
    orders.status === 200 &&
    orders.json?.status === 'ok' &&
    completed.status === 200 &&
    completedStatus === 'completed' &&
    created.status === 200 &&
    invalidMe.status === 401;

  const dbPass =
    apiPass &&
    orderItems.length >= 1 &&
    completedStatus === 'completed' &&
    typeof createdStatus === 'string';

  const routeResults = [];
  for (const route of ROUTES) {
    routeResults.push(await fetchWeb(route));
  }
  const pagePass = routeResults.every((r) => r.ok);

  const verification_chain = {
    human_action: prior?.verification_chain?.human_action || {
      verdict: 'PENDING',
      note: 'Round B browser — hard refresh, session restore, hydration',
      routes: ROUTES,
    },
    api: layer(apiPass ? 'PASS' : 'FAIL', {
      login: { http: login.status, ok: loginOk, user_id: userId || null },
      me: { http: me.status, email: me.json?.user?.email || null },
      orders: { http: orders.status, count: orderItems.length },
      sample_completed: {
        order_id: SAMPLE_COMPLETED,
        http: completed.status,
        status: completedStatus || null,
      },
      sample_created: {
        order_id: SAMPLE_CREATED,
        http: created.status,
        status: createdStatus || null,
      },
      invalid_token_me: { http: invalidMe.status, expected: 401, not_500: invalidMe.status !== 500 },
    }),
    database: layer(dbPass ? 'PASS' : 'FAIL', {
      note: 'Read-only staging · order list + detail status consistent with probe expectations',
      orders_count: orderItems.length,
      completed_status: completedStatus,
      created_status: createdStatus,
      tourist_id: userId || null,
    }),
    page: layer(pagePass ? 'PASS' : 'PARTIAL', {
      note: 'Round A HTML app shell only · Round B adds post-refresh UI state',
      routes: routeResults.map((r) => ({
        route: r.route,
        http: r.http,
        hasAppShell: r.hasAppShell,
        body_length: r.body_length,
      })),
      shell_pass: pagePass,
    }),
    final_outcome: {
      verdict: 'PENDING',
      note: 'Await Round B browser + merge',
    },
  };

  const probeDoc = {
    schema: 'traveltrust.manual_validation_probe.v1',
    check_id: 'refresh_recovery',
    probe_round: 'A',
    recorded_at_utc: recordedAt,
    staging_web: WEB,
    staging_api: API,
    sample_orders: { completed: SAMPLE_COMPLETED, created: SAMPLE_CREATED },
    verification_chain,
    route_shell: routeResults,
    layers_complete: ['api', 'database', 'page_shell'],
    browser_todo: [
      'Hard refresh /market — order_count + guide_count stable',
      'Hard refresh /orders — list loads, no duplicate submit',
      `Hard refresh /escrow/${SAMPLE_COMPLETED} — status completed`,
      'Clear session token → /orders redirects login → re-login restores',
    ],
  };

  const evidenceDoc = {
    schema: 'traveltrust.manual_validation_check.v1',
    check_id: 'refresh_recovery',
    order: 9,
    label: '刷新/恢复',
    verdict: 'PENDING',
    checkpoint: true,
    checkpoint_round: 'A',
    recorded_at_utc: recordedAt,
    validator: 'Cursor Agent · Phase 4 Manual 9 · Round A probe',
    staging_web: WEB,
    staging_api: API,
    verification_chain,
    probe_ref: 'evidence/GO_production_readiness/step4/manual/steps/manual-refresh-recovery-probe-LATEST.json',
  };

  fs.mkdirSync(path.dirname(PROBE_OUT), { recursive: true });
  fs.writeFileSync(PROBE_OUT, JSON.stringify(probeDoc, null, 2) + '\n');
  writeCheckpoint(evidenceDoc);

  console.log(`TT_MANUAL_REFRESH_RECOVERY_PROBE: api=${verification_chain.api.verdict} db=${verification_chain.database.verdict} page_shell=${verification_chain.page.verdict}`);
  console.log(`Probe: ${PROBE_OUT}`);
  console.log(`Checkpoint evidence: ${EVIDENCE_OUT}`);
  process.exit(apiPass && dbPass && pagePass ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
