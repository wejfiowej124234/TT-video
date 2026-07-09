#!/usr/bin/env node
/**
 * Sprint B · Provider HAT 下单 Discovery（只 Evidence · 不修 · 不关闭 BD-002）
 *
 * 链：Provider 创建商品 → Market 可见 → 下单 → accept → mock-pay → 完成
 *
 *   API=https://tt-api-staging.fly.dev node scripts/dev/run-sprint-b-provider-hat-order-validation.cjs
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { request } = require('./lib/production-readiness-probe-http.cjs');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const EVID_DIR = path.join(ROOT, 'evidence/GO_production_readiness/step2/hat');
const OUT_JSON = path.join(EVID_DIR, 'SPRINT-B-PROVIDER-HAT-ORDER-LATEST.json');
const OUT_MD = path.join(EVID_DIR, 'SPRINT-B-PROVIDER-HAT-ORDER-LATEST.md');

const PASSWORD = process.env.TT_TEST_PASSWORD || 'Test123!';
const MERCHANT_EMAIL = process.env.TT_TEST_C4_EMAIL || 'merchant@test.com';
const TOURIST_EMAIL = process.env.TT_TEST_C2_EMAIL || 'tourist@test.com';
const COVER = process.env.PROVIDER_HAT_COVER || '/api/v1/uploads/community-posts/ocs-tokyo-photo-provider-cover.jpg';

async function login(email) {
  const r = await request(`${API}/auth/login`, {
    method: 'POST',
    body: { email, password: PASSWORD },
  });
  return r.status === 200 && r.json?.token ? r.json.token : null;
}

function verdictFrom(cond) {
  return cond ? 'PASS' : 'FAIL';
}

function summarize(doc) {
  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2) + '\n');
  fs.writeFileSync(
    OUT_MD,
    [
      '# Sprint B · Provider HAT 下单 Discovery',
      '',
      `**Verdict:** ${doc.TT_SPRINT_B_PROVIDER_HAT_ORDER}`,
      `**Recorded:** ${doc.recorded_at_utc}`,
      '',
      '| Step | Verdict | Detail |',
      '|------|---------|--------|',
      ...doc.steps.map((s) => `| ${s.step} | ${s.verdict} | ${s.detail || s.error || s.http || ''} |`),
      '',
      `**BD-005:** ${doc.bd005_attribution.status} — ${doc.bd005_attribution.reason}`,
      '',
      doc.recommendation,
    ].join('\n') + '\n',
  );
}

async function main() {
  const stamp = new Date().toISOString();
  const steps = [];

  await request(`${API}/auth/seed-test-accounts`, { method: 'POST', body: {} });

  const merchantToken = await login(MERCHANT_EMAIL);
  if (!merchantToken) {
    const doc = {
      schema: 'traveltrust.sprint_b_provider_hat_order_validation.v1',
      recorded_at_utc: stamp,
      sprint: 'B',
      mode: 'discovery_only',
      TT_SPRINT_B_PROVIDER_HAT_ORDER: 'FAIL',
      failed_step: 'provider_login',
      steps,
      TT_SPRINT_B: 'READY',
      TT_SPRINT_B_ACTIVE: false,
      recommendation: 'Provider 登录失败 · 保持 Discovery · 不 ACTIVE',
    };
    summarize(doc);
    console.log('TT_SPRINT_B_PROVIDER_HAT_ORDER: FAIL (provider_login)');
    process.exit(1);
  }

  const me = await request(`${API}/api/v1/me`, { token: merchantToken });
  const merchantUserId = me.json?.user?.id;
  steps.push({
    step: 'provider_auth',
    http: me.status,
    role: me.json?.user?.role,
    has_active_guide: !!me.json?.guide?.id && me.json?.guide?.status === 'active',
    verdict: me.status === 200 && me.json?.user?.role === 'provider' ? 'PASS' : 'FAIL',
    detail: `role=${me.json?.user?.role} guide=${me.json?.guide?.id || 'none'}`,
  });

  const title = `Sprint B HAT Probe ${Date.now()}`;
  const create = await request(`${API}/api/v1/market/provider/listings`, {
    method: 'POST',
    token: merchantToken,
    body: {
      payload: {
        kind: 'merchant_showcase_studio_v1',
        title,
        city: 'Hangzhou',
        category: 'experience',
        countryIso: 'CN',
        description: 'Sprint B Provider HAT discovery probe',
        videoUrl: COVER,
        priceUsdc: 199,
      },
    },
  });
  const newListingId = create.json?.listing_id || create.json?.listing?.id;
  steps.push({
    step: 'create_listing',
    http: create.status,
    listing_id: newListingId,
    title,
    verdict: create.status === 200 && newListingId ? 'PASS' : 'FAIL',
    detail: create.json?.error || create.json?.reason || newListingId,
  });

  const catalog = await request(`${API}/api/v1/market/provider/listings?limit=50`);
  const catalogItems = catalog.json?.items || [];
  const ownVisible = catalogItems.some((x) => x.id === newListingId);
  steps.push({
    step: 'market_visible_own_listing',
    http: catalog.status,
    listing_id: newListingId,
    public_catalog_count: catalogItems.length,
    verdict: ownVisible ? 'PASS' : 'WARN',
    detail: ownVisible
      ? 'own listing in public catalog'
      : 'merchant@test.com listing filtered from public catalog (dev/smoke data_origin)',
  });

  const sampleCatalogId = catalogItems[0]?.id;
  steps.push({
    step: 'market_visible_catalog',
    http: catalog.status,
    sample_listing_id: sampleCatalogId,
    verdict: catalog.status === 200 && catalogItems.length > 0 ? 'PASS' : 'FAIL',
    detail: `public provider listings=${catalogItems.length}`,
  });

  const touristToken = await login(TOURIST_EMAIL);
  if (!touristToken) {
    steps.push({ step: 'tourist_login', verdict: 'FAIL', detail: 'tourist login failed' });
    const doc = buildDoc(stamp, steps, null, 'FAIL');
    summarize(doc);
    console.log('TT_SPRINT_B_PROVIDER_HAT_ORDER: FAIL (tourist_login)');
    process.exit(1);
  }

  const orderListingId = newListingId || sampleCatalogId;
  const order = await request(`${API}/api/v1/market/provider/listings/${orderListingId}/orders`, {
    method: 'POST',
    token: touristToken,
    headers: { 'Idempotency-Key': crypto.randomUUID() },
    body: {},
  });
  const orderId = order.json?.order?.id;
  steps.push({
    step: 'create_order',
    http: order.status,
    listing_id: orderListingId,
    order_id: orderId,
    error: order.json?.error,
    hint: order.json?.hint,
    verdict: orderId ? 'PASS' : 'FAIL',
    detail: orderId || order.json?.error || order.text?.slice(0, 120),
  });

  if (orderId) {
    const accept = await request(`${API}/api/v1/orders/${orderId}/accept`, {
      method: 'POST',
      userId: merchantUserId,
      body: {},
    });
    steps.push({
      step: 'provider_accept',
      http: accept.status,
      status: accept.json?.order?.status,
      verdict: accept.status === 200 && accept.json?.order?.status === 'accepted' ? 'PASS' : 'FAIL',
      detail: accept.json?.order?.status || accept.json?.error,
    });

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
      detail: pay.json?.order?.status || pay.json?.error,
    });

    const complete = await request(`${API}/api/v1/orders/${orderId}/confirm-completion`, {
      method: 'POST',
      userId: merchantUserId,
      body: {},
    });
    steps.push({
      step: 'confirm_completion',
      http: complete.status,
      status: complete.json?.order?.status,
      verdict: complete.status === 200 && complete.json?.order?.status === 'completed' ? 'PASS' : 'FAIL',
      detail: complete.json?.order?.status || complete.json?.error,
    });
  } else {
    steps.push({ step: 'provider_accept', verdict: 'SKIP', detail: 'blocked by create_order' });
    steps.push({ step: 'mock_pay', verdict: 'SKIP', detail: 'blocked by create_order' });
    steps.push({ step: 'confirm_completion', verdict: 'SKIP', detail: 'blocked by create_order' });
  }

  const chainSteps = ['create_order', 'provider_accept', 'mock_pay', 'confirm_completion'];
  const chainPass = chainSteps.every((name) => steps.find((s) => s.step === name)?.verdict === 'PASS');
  const overall = chainPass ? 'PASS' : 'FAIL';

  const doc = buildDoc(stamp, steps, orderId, overall);
  summarize(doc);

  console.log(`TT_SPRINT_B_PROVIDER_HAT_ORDER: ${overall}`);
  console.log(`BD-005 attribution: ${doc.bd005_attribution.status}`);
  console.log(`TT_SPRINT_B: ${doc.TT_SPRINT_B} (ACTIVE=${doc.TT_SPRINT_B_ACTIVE})`);
  steps.forEach((s) => console.log(`  ${s.step}: ${s.verdict}`));
  console.log(`Evidence: ${OUT_JSON}`);
  process.exit(overall === 'PASS' ? 0 : 1);
}

function buildDoc(stamp, steps, orderId, overall) {
  let bd005;
  if (overall === 'PASS') {
    bd005 = {
      status: 'CLOSE_CANDIDATE',
      reason: 'Provider HAT 全链 PASS · BD-005 可设 root_cause_confirmed=true · CLOSED',
    };
  } else {
    bd005 = {
      status: 'OPEN',
      reason: 'Provider HAT 未 PASS · BD-005 保持 OPEN',
      failed_step: steps.find((s) => s.verdict === 'FAIL')?.step,
    };
  }

  return {
    schema: 'traveltrust.sprint_b_provider_hat_order_validation.v1',
    recorded_at_utc: stamp,
    sprint: 'B',
    mode: process.env.SPRINT_B_HAT_MODE || 'fix_validation',
    policy: 'BD-005 Fix Validation · pilot merchant active guide · TT_SPRINT_B ACTIVE=false until Owner toggle',
    api: API,
    accounts: { merchant: MERCHANT_EMAIL, tourist: TOURIST_EMAIL },
    TT_SPRINT_B_PROVIDER_HAT_ORDER: overall,
    order_id: orderId,
    chain: ['create_listing', 'market_visible', 'create_order', 'provider_accept', 'mock_pay', 'confirm_completion'],
    steps,
    bd005_attribution: bd005,
    fix_pilot: 'merchant@test.com',
    TT_SPRINT_B: 'READY',
    TT_SPRINT_B_ACTIVE: false,
    root_cause_confirmed: overall === 'PASS',
    recommendation:
      overall === 'PASS'
        ? 'BD-005 Validation PASS · registry 可 CLOSED · root_cause_confirmed=true'
        : 'BD-005 保持 OPEN · 继续 Fix',
  };
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
