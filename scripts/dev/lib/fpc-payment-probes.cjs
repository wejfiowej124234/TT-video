/**
 * FPC B21 · Payment / PSP / Webhook live + static probes (① local)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function loadChecklist(checklistPath) {
  return JSON.parse(fs.readFileSync(checklistPath, 'utf8'));
}

async function fetchJson(url, { method = 'GET', headers = {}, body } = {}) {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body != null ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(45000),
  });
  let json = null;
  let text = '';
  try {
    text = await res.text();
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}

function loadInternalSecret(root) {
  if (process.env.INTERNAL_API_SECRET) return process.env.INTERNAL_API_SECRET;
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return '';
  const line = fs
    .readFileSync(envPath, 'utf8')
    .split('\n')
    .find((l) => l.startsWith('INTERNAL_API_SECRET='));
  return line ? line.slice('INTERNAL_API_SECRET='.length).trim().replace(/\r$/, '') : '';
}

async function probeMetaMockPay(apiBase, spec, findings) {
  const row = await fetchJson(`${apiBase}${spec.path}`);
  const enabled = row.json?.orders?.order_mock_pay_enabled === true;
  const pass = row.status === 200 && (!spec.require_order_mock_pay_enabled || enabled);
  if (!pass) {
    findings.push({
      id: 'live_meta_mock_pay',
      severity: 'P0',
      detail: `order_mock_pay_enabled=${row.json?.orders?.order_mock_pay_enabled} (need P3_CHAIN_OFF=1 on API)`,
    });
  }
  return {
    id: 'live_meta_mock_pay',
    domain: 'psp_adapter_mock_pay',
    pass,
    order_mock_pay_enabled: row.json?.orders?.order_mock_pay_enabled,
  };
}

async function probeStripeWebhookUnconfigured(apiBase, spec, findings) {
  const row = await fetchJson(`${apiBase}${spec.path}`, {
    method: spec.method || 'POST',
    body: spec.body || {},
  });
  const ok = spec.allowed_when_whsec_unset.includes(row.status);
  const errOk =
    !spec.error_key ||
    row.json?.error === spec.error_key ||
    row.json?.message === spec.error_key ||
    (row.text || '').includes(spec.error_key);
  const pass = ok && errOk;
  if (!pass) {
    findings.push({
      id: 'live_stripe_webhook_unconfigured',
      severity: 'P0',
      detail: `POST stripe/onboarding HTTP ${row.status} error=${row.json?.error || row.text?.slice(0, 120)}`,
    });
  }
  return {
    id: 'live_stripe_webhook_unconfigured',
    domain: 'stripe_webhook_signature',
    pass,
    http: row.status,
    error: row.json?.error,
  };
}

async function probeInternalWebhookDeny(apiBase, spec, findings) {
  const row = await fetchJson(`${apiBase}${spec.path}`, {
    method: spec.method || 'POST',
    body: spec.body,
  });
  const pass = spec.allowed_without_secret.includes(row.status);
  if (!pass) {
    findings.push({
      id: 'live_internal_webhook_deny',
      severity: 'P0',
      detail: `internal webhook without secret HTTP ${row.status}`,
    });
  }
  return {
    id: 'live_internal_webhook_deny',
    domain: 'failure_recovery_webhook',
    pass,
    http: row.status,
  };
}

async function login(apiBase, email, password) {
  const row = await fetchJson(`${apiBase}/auth/login`, {
    method: 'POST',
    body: { email, password },
  });
  if (row.status !== 200 || !row.json?.token) {
    throw new Error(`login ${email} HTTP ${row.status}`);
  }
  return row.json.token;
}

async function probeMockPayLifecycle(apiBase, spec, findings) {
  try {
    const touristToken = await login(apiBase, spec.tourist_email, spec.password);
    const guideToken = await login(apiBase, spec.guide_email, spec.password);

    const meGuide = await fetchJson(`${apiBase}/api/v1/me`, {
      headers: { Authorization: `Bearer ${guideToken}` },
    });
    const guideId = meGuide.json?.guide?.id;
    if (!guideId) throw new Error('guide.id missing on seed account');

    const createIdem = require('crypto').randomUUID();
    const amount = `88.${Math.floor(Math.random() * 90 + 10)}`;
    const create = await fetchJson(`${apiBase}/api/v1/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${touristToken}`,
        'Idempotency-Key': createIdem,
      },
      body: {
        guide_id: guideId,
        amount,
        currency: 'USD',
      },
    });
    const orderId =
      create.json?.order?.id || create.json?.order_id || create.json?.id;
    if (![200, 201].includes(create.status) || !orderId) {
      throw new Error(`POST /orders HTTP ${create.status} body=${create.text?.slice(0, 200)}`);
    }

    const accept = await fetchJson(`${apiBase}/api/v1/orders/${orderId}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${guideToken}` },
      body: {},
    });
    if (accept.status !== 200) throw new Error(`accept HTTP ${accept.status}`);

    const pay = await fetchJson(`${apiBase}/api/v1/orders/${orderId}/mock-pay`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${touristToken}` },
      body: {},
    });
    if (pay.status !== 200) throw new Error(`mock-pay HTTP ${pay.status} ${pay.text?.slice(0, 200)}`);

    const status = pay.json?.order?.status || pay.json?.status;
    const get = await fetchJson(`${apiBase}/api/v1/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${touristToken}` },
    });
    const persisted = get.json?.order?.status || get.json?.status;
    const pass =
      (status === spec.expected_after_mock_pay || persisted === spec.expected_after_mock_pay) &&
      persisted === spec.expected_after_mock_pay;
    if (!pass) {
      findings.push({
        id: 'live_mock_pay_lifecycle',
        severity: 'P0',
        detail: `mock-pay status=${status} GET=${persisted} expected=${spec.expected_after_mock_pay}`,
      });
    }
    return {
      id: 'live_mock_pay_lifecycle',
      domain: 'order_state_machine_escrowed',
      pass,
      order_id: orderId,
      status_after_pay: persisted,
    };
  } catch (e) {
    findings.push({
      id: 'live_mock_pay_lifecycle',
      severity: 'P0',
      detail: String(e.message || e),
    });
    return { id: 'live_mock_pay_lifecycle', domain: 'order_state_machine_escrowed', pass: false };
  }
}

async function probeOnboardingWebhookIdempotency(apiBase, root, spec, findings) {
  const secret = loadInternalSecret(root);
  if (!secret) {
    findings.push({
      id: 'live_onboarding_webhook_idem',
      severity: 'P1',
      detail: 'INTERNAL_API_SECRET unset — skip idempotency probe',
    });
    return { id: 'live_onboarding_webhook_idem', domain: 'idempotency_payment_intent', pass: false, skipped: true };
  }
  try {
    const stamp = Date.now();
    const email = `fpc-b21-pay-${stamp}@example.com`;
    const reg = await fetchJson(`${apiBase}/auth/register`, {
      method: 'POST',
      body: {
        email,
        password: 'Test123!',
        nickname: 'FPC B21 Pay',
        role: 'provider',
      },
    });
    if (![200, 201].includes(reg.status) || !reg.json?.token) {
      throw new Error(`register HTTP ${reg.status}`);
    }
    const token = reg.json.token;
    const idemKeyUuid = require('crypto').randomUUID();

    const pi1 = await fetchJson(`${apiBase}/api/v1/onboarding/payment-intents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Idempotency-Key': idemKeyUuid,
      },
      body: { role: 'provider', jurisdictions: 'US' },
    });
    const pi2 = await fetchJson(`${apiBase}/api/v1/onboarding/payment-intents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Idempotency-Key': idemKeyUuid,
      },
      body: { role: 'provider', jurisdictions: 'US' },
    });
    if (![200, 201].includes(pi1.status)) throw new Error(`payment-intent HTTP ${pi1.status}`);
    const idemKey = pi1.json?.idempotency_key || idemKeyUuid;
    if (!idemKey) throw new Error('payment-intent missing idempotency_key');

    const body = JSON.stringify({
      schema_version: 1,
      idempotency_key: idemKey,
      provider_event_id: `evt_b21_${stamp}`,
      outcome: 'succeeded',
    });
    const wh1 = await fetch(`${apiBase}/api/v1/internal/onboarding/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Api-Secret': secret,
        'X-Forwarded-For': '127.0.0.1',
        'X-Forwarded-Proto': 'https',
      },
      body,
      signal: AbortSignal.timeout(45000),
    });
    const wh1Json = await wh1.json().catch(() => ({}));
    const wh2 = await fetch(`${apiBase}/api/v1/internal/onboarding/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Api-Secret': secret,
        'X-Forwarded-For': '127.0.0.1',
        'X-Forwarded-Proto': 'https',
      },
      body: JSON.stringify({
        schema_version: 1,
        idempotency_key: idemKey,
        provider_event_id: `evt_b21_${stamp}_dup`,
        outcome: 'succeeded',
      }),
      signal: AbortSignal.timeout(45000),
    });
    const wh2Json = await wh2.json().catch(() => ({}));

    const ent = await fetchJson(`${apiBase}/api/v1/onboarding/entitlements/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const paid =
      ent.json?.status === 'paid' ||
      ent.json?.entitlement?.status === 'paid' ||
      (Array.isArray(ent.json?.entitlements) &&
        ent.json.entitlements.some((i) => i.status === 'paid')) ||
      (Array.isArray(ent.json?.items) && ent.json.items.some((i) => i.status === 'paid'));

    const idemOk = pi2.status === pi1.status;
    const whOk = [200, 202].includes(wh1.status) && [200, 202].includes(wh2.status);
    const pass = idemOk && whOk && paid;
    if (!pass) {
      findings.push({
        id: 'live_onboarding_webhook_idem',
        severity: 'P0',
        detail: `idem replay pi2=${pi2.status} wh1=${wh1.status} wh2=${wh2.status} paid=${paid}`,
      });
    }
    return {
      id: 'live_onboarding_webhook_idem',
      domain: 'idempotency_payment_intent',
      pass,
      idempotency_key: idemKey,
      entitlement_paid: paid,
      webhook_replay: wh2Json?.duplicate || wh2Json?.idempotent || whOk,
    };
  } catch (e) {
    findings.push({
      id: 'live_onboarding_webhook_idem',
      severity: 'P0',
      detail: String(e.message || e),
    });
    return { id: 'live_onboarding_webhook_idem', domain: 'idempotency_payment_intent', pass: false };
  }
}

function runStaticSsotChecks(root, findings) {
  const checks = [
    {
      id: 'ssot_stripe_signature',
      domain: 'stripe_webhook_signature',
      path: 'crates/api/src/stripe_onboarding/signature.rs',
      must_contain: ['verify_stripe_signature', 'Stripe-Signature'],
    },
    {
      id: 'ssot_apply_payment_webhook',
      domain: 'internal_onboarding_webhook',
      path: 'crates/api/src/db/onboarding/webhook_apply.rs',
      must_contain: ['apply_payment_webhook'],
    },
    {
      id: 'ssot_order_mock_pay',
      domain: 'psp_adapter_mock_pay',
      path: 'crates/api/src/chain_off/orders_flow/accept_cancel_pay_complete.rs',
      must_contain: ['order_mock_pay_impl'],
    },
    {
      id: 'ssot_prod_checklist',
      domain: 'prod_stripe_env_hygiene',
      path: 'registry/production-usdc-go-live-master-checklist.v1.yaml',
      must_contain: ['stripe', 'webhook'],
    },
    {
      id: 'ssot_onboarding_mod',
      domain: 'failure_recovery_webhook',
      path: 'crates/api/src/routes/onboarding/mod.rs',
      must_contain: ['hooks/stripe/onboarding'],
    },
  ];
  const results = [];
  for (const c of checks) {
    const abs = path.join(root, c.path);
    let pass = fs.existsSync(abs);
    const notes = [];
    if (!pass) {
      findings.push({ id: `static_missing:${c.id}`, severity: 'P1', detail: c.path });
    } else {
      const text = fs.readFileSync(abs, 'utf8');
      for (const needle of c.must_contain) {
        if (!text.includes(needle)) {
          pass = false;
          notes.push(`missing:${needle}`);
          findings.push({
            id: `static_ssot:${c.id}`,
            severity: 'P1',
            detail: `${c.path} missing ${needle}`,
          });
        }
      }
    }
    results.push({ id: c.id, domain: c.domain, pass, path: c.path, notes });
  }
  return results;
}

function classifyStripeEnvAlignmentOutput(combined) {
  if (combined.includes('STRIPE_ENABLED must be 1 for prod') && combined.includes('PASS=')) {
    return {
      severity: 'P2',
      pass: true,
      note: '① local: prod .env.production.local STRIPE_ENABLED=0 until ③ Production GO',
    };
  }
  return { severity: 'P0', pass: false, note: combined.slice(0, 1500) };
}

async function runLiveProbes(apiBase, checklistPath, root, findings) {
  const checklist = loadChecklist(checklistPath);
  const lp = checklist.live_probes;
  const rows = [
    await probeMetaMockPay(apiBase, lp.meta_mock_pay_flag, findings),
    await probeStripeWebhookUnconfigured(apiBase, lp.stripe_webhook_unconfigured, findings),
    await probeInternalWebhookDeny(apiBase, lp.internal_webhook_deny, findings),
    await probeMockPayLifecycle(apiBase, lp.mock_pay_order_lifecycle, findings),
    await probeOnboardingWebhookIdempotency(apiBase, root, lp.onboarding_webhook_idempotency, findings),
  ];
  return { pass: rows.every((r) => r.pass), api_base: apiBase, probes: rows };
}

module.exports = {
  loadChecklist,
  runLiveProbes,
  runStaticSsotChecks,
  classifyStripeEnvAlignmentOutput,
};
