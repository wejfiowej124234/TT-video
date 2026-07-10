#!/usr/bin/env node
/**
 * ① local · B33 operations workflow gate — SuperAdmin bootstrap + validate-operations-workflow.
 *
 *   node scripts/dev/run-fpc-operations-workflow-local-gate.cjs
 */
'use strict';

const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '../..');
const API = (process.env.API_BASE || process.env.API || 'http://127.0.0.1:8080').replace(/\/$/, '');
const PG_CONTAINER = process.env.TRAVELTRUST_PG_CONTAINER || 'traveltrust-postgres';
const PG_USER = process.env.PGUSER || 'traveltrust';
const PG_DB = process.env.PGDATABASE || 'traveltrust';
const STAMP = new Date().toISOString().replace(/[:.]/g, '-');
const OUT =
  process.env.OUT ||
  path.join(ROOT, `evidence/GO_operations_workflow_validation/local_b33_${STAMP}/workflow-validation.json`);
const PASSWORD = process.env.ADMIN_PASS || 'Test123!';
const SUPER_EMAIL = process.env.B33_OPS_SUPER_EMAIL || `adm-ops-b33-${Date.now()}@traveltrust.test`;

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function req(method, p, body, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(API + p);
    const payload = body ? JSON.stringify(body) : null;
    const r = http.request(
      {
        hostname: u.hostname,
        port: u.port || 80,
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

async function bootstrapSuperAdmin() {
  const reg = await req('POST', '/auth/register', {
    email: SUPER_EMAIL,
    password: PASSWORD,
    nickname: 'B33 Ops Super',
  });
  if (reg.status !== 200 && reg.status !== 201) {
    throw new Error(`register super HTTP ${reg.status}`);
  }
  const userId = reg.json.user_id;
  const promote = await req('POST', '/auth/seed-test-accounts', { promote_admin_email: SUPER_EMAIL });
  if (promote.status !== 200) {
    throw new Error(`seed promote HTTP ${promote.status}`);
  }
  sh(
    `docker exec ${PG_CONTAINER} psql -U ${PG_USER} -d ${PG_DB} -v ON_ERROR_STOP=1 -c ${JSON.stringify(
      `UPDATE users SET role = 'super_admin' WHERE id = '${userId}'::uuid;`
    )}`
  );
  sh(
    `docker exec ${PG_CONTAINER} psql -U ${PG_USER} -d ${PG_DB} -v ON_ERROR_STOP=1 -c ${JSON.stringify(
      `UPDATE admin_security_policies SET policy_value = jsonb_set(COALESCE(policy_value, '{}'::jsonb), '{enforced}', 'false'::jsonb, true) WHERE policy_key = 'admin_2fa_policy';`
    )}`
  );
  const login = await req('POST', '/auth/login', { email: SUPER_EMAIL, password: PASSWORD });
  if (login.status !== 200 || !login.json.token) {
    throw new Error(`login super HTTP ${login.status}`);
  }
  return { email: SUPER_EMAIL, token: login.json.token, userId };
}

async function resolveGuideId(token) {
  if (process.env.WF_GUIDE_ID) return process.env.WF_GUIDE_ID;
  const pq = await req(
    'GET',
    '/api/v1/admin/official/public-operations/publish-queue?entity_type=guides&limit=50',
    null,
    token
  );
  const items = pq.json.items || [];
  const pick = items.find((x) => x.id) || null;
  return pick?.id || '';
}

async function main() {
  const health = await req('GET', '/health');
  if (health.status !== 200) {
    console.error('TT_FPC_OPS_WORKFLOW_GATE: FAIL api_health', health.status);
    process.exit(1);
  }

  const admin = await bootstrapSuperAdmin();
  const guideId = await resolveGuideId(admin.token);
  if (!guideId) {
    console.error('TT_FPC_OPS_WORKFLOW_GATE: FAIL no_guide_id_in_publish_queue');
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const n = Date.now() % 676;
  const isoUnique =
    String.fromCharCode(65 + (n % 26)) + String.fromCharCode(65 + Math.floor(n / 26) % 26);
  const jumpN = (Date.now() + 17) % 676;
  const jumpIso =
    String.fromCharCode(65 + (jumpN % 26)) + String.fromCharCode(65 + Math.floor(jumpN / 26) % 26);
  const child = spawnSync(
    process.execPath,
    [path.join(__dirname, 'validate-operations-workflow.cjs')],
    {
      cwd: ROOT,
      encoding: 'utf8',
      env: {
        ...process.env,
        API,
        API_BASE: API,
        ADMIN_EMAIL: admin.email,
        ADMIN_PASS: PASSWORD,
        WF_GUIDE_ID: guideId,
        WF_VAL_STAMP: STAMP,
        WF_CONTENT_ISO: isoUnique,
        WF_JUMP_ISO: jumpIso,
        OUT,
      },
    }
  );

  const stdout = (child.stdout || '') + (child.stderr || '');
  process.stdout.write(stdout);
  if (!stdout.includes('WF_VALIDATION:')) {
    console.log(`TT_FPC_OPS_WORKFLOW_GATE: super=${admin.email} guide=${guideId} out=${OUT}`);
  }

  let verdict = 'FAIL';
  if (fs.existsSync(OUT)) {
    const report = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    verdict = report.verdict || 'FAIL';
  }

  const pass = verdict === 'PASS' || verdict === 'PASS_WITH_WARN';
  console.log(
    `TT_FPC_OPS_WORKFLOW_GATE: ${pass ? 'PASS' : 'FAIL'} verdict=${verdict} guide=${guideId} evidence=${OUT}`
  );
  process.exit(pass ? 0 : child.status || 1);
}

main().catch((e) => {
  console.error('TT_FPC_OPS_WORKFLOW_GATE: ERROR', e.message);
  process.exit(1);
});
