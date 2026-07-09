#!/usr/bin/env node
/**
 * Sprint A · Guide HAT 下单真人/API 验证（迪拜 pilot guide）
 * 预约 → 接单 → mock-pay → 完成
 *
 *   API=https://tt-api-staging.fly.dev node scripts/dev/run-sprint-a-guide-hat-order-validation.cjs
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { request } = require('./lib/production-readiness-probe-http.cjs');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const EVID_DIR = path.join(ROOT, 'evidence/GO_production_readiness/step1/hat');
const OUT_JSON = path.join(EVID_DIR, 'SPRINT-A-GUIDE-HAT-ORDER-LATEST.json');
const OUT_MD = path.join(EVID_DIR, 'SPRINT-A-GUIDE-HAT-ORDER-LATEST.md');

const PILOT = {
  guide_id: process.env.SPRINT_A_GUIDE_ID || 'cd69b54b-6407-4a34-90c6-f36c0c658dd7',
  guide_user_id: process.env.SPRINT_A_GUIDE_USER_ID || '41727802-1a7d-41fc-a638-ca8b6e7af285',
  city: '迪拜',
  hourly_rate: '85',
};
const PASSWORD = process.env.TT_TEST_PASSWORD || 'Test123!';
const TOURIST_EMAIL = process.env.TT_TEST_C2_EMAIL || 'tourist@test.com';

async function login(email) {
  const r = await request(`${API}/auth/login`, {
    method: 'POST',
    body: { email, password: PASSWORD },
  });
  return r.status === 200 && r.json?.token ? r.json.token : null;
}

function fail(step, detail, steps) {
  const doc = {
    schema: 'traveltrust.sprint_a_guide_hat_order_validation.v1',
    recorded_at_utc: new Date().toISOString(),
    sprint: 'A',
    pilot: PILOT,
    TT_SPRINT_A_GUIDE_HAT_ORDER: 'FAIL',
    failed_step: step,
    detail,
    steps,
    recommendation: '登记新 Root Cause（须有 Evidence）· 不进入 Sprint B',
  };
  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2) + '\n');
  console.log(`TT_SPRINT_A_GUIDE_HAT_ORDER: FAIL (${step})`);
  console.log(detail);
  process.exit(1);
}

async function main() {
  const stamp = new Date().toISOString();
  const steps = [];

  await request(`${API}/auth/seed-test-accounts`, { method: 'POST', body: {} });

  const touristToken = await login(TOURIST_EMAIL);
  if (!touristToken) fail('login_tourist', 'tourist@test.com login failed', steps);

  const avail = await request(`${API}/api/v1/guides/${PILOT.guide_id}/availability`, {
    userId: PILOT.guide_user_id,
  });
  steps.push({
    step: 'availability_precheck',
    http: avail.status,
    verdict: avail.status === 200 ? 'PASS' : 'FAIL',
  });
  if (avail.status !== 200) fail('availability_precheck', `HTTP ${avail.status}`, steps);

  const amount = '120.00';
  const create = await request(`${API}/api/v1/orders`, {
    method: 'POST',
    token: touristToken,
    headers: { 'Idempotency-Key': crypto.randomUUID() },
    body: {
      guide_id: PILOT.guide_id,
      amount,
      currency: 'USD',
      start_date: '2026-08-10',
      end_date: '2026-08-12',
    },
  });
  const orderId = create.json?.order?.id || create.json?.id;
  steps.push({
    step: 'create_order',
    http: create.status,
    order_id: orderId,
    verdict: orderId && (create.status === 200 || create.status === 201) ? 'PASS' : 'FAIL',
  });
  if (!orderId) fail('create_order', create.text?.slice(0, 200), steps);

  const accept = await request(`${API}/api/v1/orders/${orderId}/accept`, {
    method: 'POST',
    userId: PILOT.guide_user_id,
    body: {},
  });
  steps.push({
    step: 'guide_accept',
    http: accept.status,
    status: accept.json?.order?.status,
    verdict: accept.status === 200 && accept.json?.order?.status === 'accepted' ? 'PASS' : 'FAIL',
  });
  if (steps.at(-1).verdict !== 'PASS') fail('guide_accept', accept.text?.slice(0, 200), steps);

  const pay = await request(`${API}/api/v1/orders/${orderId}/mock-pay`, {
    method: 'POST',
    token: touristToken,
    body: {},
  });
  steps.push({
    step: 'mock_pay',
    http: pay.status,
    status: pay.json?.order?.status,
    verdict: pay.status === 200 && pay.json?.order?.status === 'escrowed' ? 'PASS' : 'FAIL',
  });
  if (steps.at(-1).verdict !== 'PASS') fail('mock_pay', pay.text?.slice(0, 200), steps);

  const complete = await request(`${API}/api/v1/orders/${orderId}/confirm-completion`, {
    method: 'POST',
    userId: PILOT.guide_user_id,
    body: {},
  });
  steps.push({
    step: 'confirm_completion',
    http: complete.status,
    status: complete.json?.order?.status,
    verdict: complete.status === 200 && complete.json?.order?.status === 'completed' ? 'PASS' : 'FAIL',
  });
  if (steps.at(-1).verdict !== 'PASS') fail('confirm_completion', complete.text?.slice(0, 200), steps);

  const doc = {
    schema: 'traveltrust.sprint_a_guide_hat_order_validation.v1',
    recorded_at_utc: stamp,
    sprint: 'A',
    pilot: PILOT,
    TT_SPRINT_A_GUIDE_HAT_ORDER: 'PASS',
    order_id: orderId,
    amount,
    chain: ['create_order', 'guide_accept', 'mock_pay', 'confirm_completion'],
    steps,
    accounts: { tourist: TOURIST_EMAIL, guide_auth: 'X-User-Id pilot guide owner' },
    api: API,
    exit_condition_met: true,
    recommendation: 'BD-004 CLOSED · BD-001 重新评估 CLOSED · Sprint A Review',
  };

  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2) + '\n');
  fs.writeFileSync(
    OUT_MD,
    [
      '# Sprint A · Guide HAT 下单',
      '',
      `**Verdict:** PASS`,
      `**Guide:** ${PILOT.guide_id} (${PILOT.city})`,
      `**Order:** ${orderId}`,
      '',
      'create → accept → mock-pay → completed',
    ].join('\n') + '\n',
  );

  console.log('TT_SPRINT_A_GUIDE_HAT_ORDER: PASS');
  console.log(`order_id=${orderId} guide=${PILOT.guide_id}`);
  console.log(`Evidence: ${OUT_JSON}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
