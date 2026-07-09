#!/usr/bin/env node
/**
 * HAT-003 · Tourist Persona Validation（Scope A Fix 后）
 * Exit: login 3× PASS · role tourist/traveler · admin capabilities deny
 */
const fs = require('fs');
const path = require('path');
const { request } = require('./lib/production-readiness-probe-http.cjs');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const EVID_DIR = path.join(ROOT, 'evidence/GO_production_readiness/step2/hat');
const OUT_JSON = path.join(EVID_DIR, 'HAT-003-TOURIST-LOGIN-VALIDATION-LATEST.json');
const SPRINT_OUT = path.join(ROOT, 'evidence/GO_production_readiness/sprints/HAT-003-FIX-VALIDATION-LATEST.json');

const PASSWORD = process.env.TT_TEST_PASSWORD || 'Test123!';
const TOURIST = process.env.TT_TEST_C2_EMAIL || 'tourist@test.com';
const ADMIN_PROMOTE = process.env.HAT003_ADMIN_PROMOTE_EMAIL || 'multi-demo@test.com';

async function main() {
  const stamp = new Date().toISOString();
  const triple = [];
  for (let i = 1; i <= 3; i++) {
    await request(`${API}/auth/seed-test-accounts`, {
      method: 'POST',
      body: { promote_admin_email: ADMIN_PROMOTE },
    });
    const r = await request(`${API}/auth/login`, {
      method: 'POST',
      body: { email: TOURIST, password: PASSWORD },
    });
    triple.push({
      attempt: i,
      http: r.status,
      role: r.json?.role,
      has_token: !!r.json?.token,
      verdict: r.status === 200 && r.json?.token ? 'PASS' : 'FAIL',
    });
  }

  const login = await request(`${API}/auth/login`, {
    method: 'POST',
    body: { email: TOURIST, password: PASSWORD },
  });
  const token = login.json?.token;
  const me = token ? await request(`${API}/api/v1/me`, { token }) : null;
  const caps = token ? await request(`${API}/api/v1/admin/capabilities`, { token }) : null;
  const orders = token ? await request(`${API}/api/v1/orders?limit=1`, { token }) : null;
  const logout = token
    ? await request(`${API}/auth/logout`, { method: 'POST', token, body: {} })
    : null;
  const meAfter = token ? await request(`${API}/api/v1/me`, { token }) : null;

  const roleOk = ['tourist', 'traveler'].includes(login.json?.role);
  const capsDeny = caps && [401, 403].includes(caps.status);
  const tripleOk = triple.every((t) => t.verdict === 'PASS');
  const overall = tripleOk && roleOk && capsDeny ? 'PASS' : 'FAIL';

  const doc = {
    schema: 'traveltrust.hat003_tourist_login_validation.v1',
    recorded_at_utc: stamp,
    mode: 'fix_validation',
    issue_id: 'HAT-003',
    api: API,
    pilot: TOURIST,
    admin_promote_isolated_to: ADMIN_PROMOTE,
    TT_HAT003_TOURIST_PERSONA_VALIDATION: overall,
    TT_SPRINT_B: 'READY',
    TT_SPRINT_B_ACTIVE: false,
    triple_pass: triple,
    steps: [
      { step: 'login_triple', verdict: tripleOk ? 'PASS' : 'FAIL', triple },
      { step: 'role_persona', role: login.json?.role, verdict: roleOk ? 'PASS' : 'FAIL' },
      { step: 'admin_capabilities_deny', http: caps?.status, verdict: capsDeny ? 'PASS' : 'FAIL' },
      { step: 'browse_orders', http: orders?.status, verdict: orders?.status === 200 ? 'PASS' : 'FAIL' },
      { step: 'logout_json_body', http: logout?.status, verdict: logout?.status === 200 ? 'PASS' : 'FAIL' },
      { step: 'session_invalid_after_logout', http: meAfter?.status, verdict: meAfter?.status === 401 ? 'PASS' : 'FAIL' },
    ],
    governance_after_validation: {
      root_cause_confirmed: overall === 'PASS',
      hat003_close_candidate: overall === 'PASS',
    },
  };

  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2) + '\n');
  fs.writeFileSync(
    SPRINT_OUT,
    JSON.stringify(
      {
        schema: 'traveltrust.hat003_fix_validation.v1',
        recorded_at_utc: stamp,
        issue_id: 'HAT-003',
        pilot: TOURIST,
        TT_HAT003_TOURIST_PERSONA_VALIDATION: overall,
        evidence: 'evidence/GO_production_readiness/step2/hat/HAT-003-TOURIST-LOGIN-VALIDATION-LATEST.json',
      },
      null,
      2,
    ) + '\n',
  );

  console.log(`TT_HAT003_TOURIST_PERSONA_VALIDATION: ${overall}`);
  console.log(`TT_SPRINT_B: READY (ACTIVE=false)`);
  process.exit(overall === 'PASS' ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
