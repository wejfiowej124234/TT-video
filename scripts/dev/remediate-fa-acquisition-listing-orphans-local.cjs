#!/usr/bin/env node
/**
 * ① local · remediate FA audit S12 acquisition listing orphans (public API but absent from OCS publish queue).
 *
 *   node scripts/dev/remediate-fa-acquisition-listing-orphans-local.cjs
 *
 * Unpublishes drift rows in market_listings @ local dev — mirrors B31 DDG probe remediation pattern.
 */
'use strict';

const { execSync } = require('child_process');
const http = require('http');

const API = (process.env.API_BASE || process.env.API || 'http://127.0.0.1:8080').replace(/\/$/, '');
const PG_CONTAINER = process.env.TRAVELTRUST_PG_CONTAINER || 'traveltrust-postgres';
const PG_USER = process.env.PGUSER || 'traveltrust';
const PG_DB = process.env.PGDATABASE || 'traveltrust';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tourist@test.com';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Test123!';

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
        res.on('end', () => resolve({ status: res.statusCode, body: d }));
      }
    );
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

async function getJson(p, token) {
  const r = await req('GET', p, null, token);
  let json;
  try {
    json = JSON.parse(r.body);
  } catch {
    json = {};
  }
  return { status: r.status, json };
}

async function login(email, password) {
  const r = await req('POST', '/auth/login', { email, password });
  try {
    return JSON.parse(r.body).token || null;
  } catch {
    return null;
  }
}

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

async function findOrphanAcquisitionIds(token) {
  const pub = await getJson('/api/v1/market/acquisition/listings?limit=500');
  const rows = pub.json.items || [];
  if (pub.status !== 200) {
    throw new Error(`acquisition listings HTTP ${pub.status}`);
  }
  const admin = await getJson(
    '/api/v1/admin/official/public-operations/publish-queue?entity_type=market_listings&limit=500',
    token
  );
  const adminPub = (admin.json.items || []).filter(
    (x) => x.display_status === 'published' && (x.label || '').toLowerCase().includes('acquisition')
  );
  const adminIds = new Set(adminPub.map((x) => x.id));
  return rows.filter((r) => r.id && !adminIds.has(r.id)).map((r) => r.id);
}

async function main() {
  const token = await login(ADMIN_EMAIL, ADMIN_PASS);
  if (!token) {
    console.error('TT_FA_ACQ_ORPHAN_REMEDIATE: FAIL admin login');
    process.exit(1);
  }

  const orphanIds = await findOrphanAcquisitionIds(token);
  if (!orphanIds.length) {
    console.log('TT_FA_ACQ_ORPHAN_REMEDIATE: PASS nothing_to_fix');
    process.exit(0);
  }

  const idList = orphanIds.map((id) => `'${String(id).replace(/'/g, "''")}'`).join(',');
  const sql = `UPDATE market_listings SET display_status = 'draft', status = 'archived', updated_at = now() WHERE variant = 'acquisition' AND id IN (${idList}) AND status = 'published';`;

  try {
    sh(
      `docker exec ${PG_CONTAINER} psql -U ${PG_USER} -d ${PG_DB} -v ON_ERROR_STOP=1 -c ${JSON.stringify(sql)}`
    );
  } catch (e) {
    console.error('TT_FA_ACQ_ORPHAN_REMEDIATE: FAIL docker/psql', e.stderr || e.message);
    process.exit(1);
  }

  const remaining = await findOrphanAcquisitionIds(token);
  const pass = remaining.length === 0;
  console.log(
    `TT_FA_ACQ_ORPHAN_REMEDIATE: ${pass ? 'PASS' : 'FAIL'} unpublished=${orphanIds.length} remaining=${remaining.length}`
  );
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error('TT_FA_ACQ_ORPHAN_REMEDIATE: ERROR', e.message);
  process.exit(1);
});
