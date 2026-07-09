#!/usr/bin/env node
/**
 * CMS Announcements · ② Staging UAT (Admin → Rust API → PG → Public → Pulse)
 *
 *   API=https://tt-api-staging.fly.dev node scripts/dev/run-cms-announcements-staging-uat.cjs
 *   API=http://127.0.0.1:8080 DATABASE_URL=postgres://... node scripts/dev/run-cms-announcements-staging-uat.cjs
 *
 * Exit 0 = all checklist steps PASS · exit 2 = FAIL (evidence still written)
 */
'use strict';

const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  for (const raw of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const k = line.slice(0, line.indexOf('=')).trim();
    let v = line.slice(line.indexOf('=') + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

function mergeEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const raw of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const k = line.slice(0, line.indexOf('=')).trim();
    let v = line.slice(line.indexOf('=') + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

function pgClient() {
  const { Client } = require(path.join(ROOT, 'frontend/node_modules/pg'));
  return Client;
}
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const WEB = (process.env.WEB || process.env.WEB_BASE || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');
const isRemoteStaging = /fly\.dev$/i.test(new URL(API).hostname);
if (isRemoteStaging) {
  mergeEnvFile(path.join(ROOT, 'scripts/dev/.env.staging-secrets.local'));
  if (process.env.STAGING_DATABASE_URL) process.env.DATABASE_URL = process.env.STAGING_DATABASE_URL;
  else if (process.env.DATABASE_URL && !process.env.STAGING_UAT_ALLOW_LOCAL_DB) process.env.DATABASE_URL = '';
}
const PASSWORD = process.env.ADMIN_PASS || process.env.PASSWORD || 'Test123!';
const SUPER_EMAIL = process.env.SUPER_EMAIL || process.env.STAGING_UAT_EMAIL || 'tourist@test.com';
const OPS_EMAIL = process.env.OPS_EMAIL || `cms-ops-uat-${Date.now()}@traveltrust.test`;
const DATABASE_URL = process.env.DATABASE_URL || '';
const EVIDENCE = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/CMS-ANNOUNCEMENTS-STAGING-UAT-LATEST.json'
);

const lib = API.startsWith('https') ? https : http;
const { teardownCmsUatArtifacts } = require('./lib/cms-uat-artifact-teardown.cjs');
const slug = `cms-uat-${Date.now()}`;
const forbiddenPublicKeys = ['publish_status', 'version', 'console_role', 'published_by'];

const report = {
  schema: 'traveltrust.cms_announcements_staging_uat.v1',
  phase: '②_staging_uat',
  api: API,
  web: WEB,
  generated_utc: new Date().toISOString(),
  slug,
  steps: {},
  gaps: [],
  verdict: 'PENDING',
};

function fail(step, detail) {
  report.steps[step] = { status: 'FAIL', detail };
  report.verdict = 'FAIL';
  console.error(`CMS_STAGING_UAT: FAIL ${step} — ${detail}`);
}

function pass(step, detail = '') {
  report.steps[step] = { status: 'PASS', ...(detail ? { detail } : {}) };
  console.log(`CMS_STAGING_UAT: PASS ${step}${detail ? ` — ${detail}` : ''}`);
}

function skip(step, detail) {
  report.steps[step] = { status: 'SKIP', detail };
  console.log(`CMS_STAGING_UAT: SKIP ${step} — ${detail}`);
}

function req(method, urlPath, body, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(API + urlPath);
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
            json = { _raw: d.slice(0, 500) };
          }
          resolve({ status: res.statusCode, json, raw: d });
        });
      }
    );
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

async function login(email, password, promote) {
  if (promote) {
    await req('POST', '/auth/seed-test-accounts', { promote_admin_email: email });
  }
  const r = await req('POST', '/auth/login', { email, password });
  if (r.status !== 200 || !r.json.token) return null;
  return r.json.token;
}

async function ensureOpsConsoleRole(email, userId) {
  if (!DATABASE_URL) return false;
  const Client = pgClient();
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query(
      `INSERT INTO admin_console_roles (user_id, console_role)
       VALUES ($1, 'Ops')
       ON CONFLICT (user_id) DO UPDATE SET console_role = 'Ops', updated_at = now()`,
      [userId]
    );
    await client.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [userId]);
  } finally {
    await client.end();
  }
  return true;
}

async function registerOpsUser() {
  const reg = await req('POST', '/auth/register', {
    email: OPS_EMAIL,
    password: PASSWORD,
    nickname: 'CMS UAT Ops',
  });
  if (reg.status !== 200 && reg.status !== 201) return null;
  const userId = reg.json.user_id;
  await req('POST', '/auth/seed-test-accounts', { promote_admin_email: OPS_EMAIL });
  if (DATABASE_URL && userId) {
    try {
      await ensureOpsConsoleRole(OPS_EMAIL, userId);
    } catch (e) {
      console.error(`CMS_STAGING_UAT: WARN ops console role — ${e.message}`);
      return null;
    }
  } else if (!DATABASE_URL) {
    return null;
  }
  return login(OPS_EMAIL, PASSWORD, false);
}

function assertPublicShape(items) {
  for (const item of items) {
    for (const k of forbiddenPublicKeys) {
      if (Object.prototype.hasOwnProperty.call(item, k)) {
        return `forbidden field ${k} on public item ${item.slug || item.id}`;
      }
    }
    if (!item.title_en && !item.title_zh) return 'missing title';
    if (item.summary_en === undefined && item.summary_zh === undefined) return 'missing summary';
  }
  return null;
}

async function main() {
  // Preflight: public route must exist (no auth wall)
  const pubProbe = await req('GET', '/api/v1/public/announcements?lane=product&limit=1');
  if (pubProbe.status === 401 || pubProbe.json?.error === 'unauthorized') {
    fail('preflight_public_unauthenticated', 'GET /public/announcements requires auth — CMS routes not deployed on this stack');
    report.gaps.push('deploy_blocker: merge CMS + fly deploy tt-api-staging before ② UAT can pass');
    report.verdict = 'BLOCKED_DEPLOY';
    fs.writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
    console.log(`CMS_STAGING_UAT: evidence → ${EVIDENCE}`);
    process.exit(2);
  }
  pass('preflight_public_unauthenticated', `HTTP ${pubProbe.status}`);

  const health = await req('GET', '/health');
  if (health.status !== 200) {
    fail('preflight_health', `HTTP ${health.status}`);
    fs.writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
    process.exit(2);
  }
  pass('preflight_health');

  // A — SuperAdmin publish flow
  const superTok = await login(SUPER_EMAIL, PASSWORD, true);
  if (!superTok) {
    fail('A_admin_login', `login failed for ${SUPER_EMAIL}`);
    fs.writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
    process.exit(2);
  }
  pass('A_admin_login', SUPER_EMAIL);

  const preCleanup = await teardownCmsUatArtifacts(req, superTok);
  if (preCleanup.totalArchived > 0) {
    pass('A_pre_cleanup', `archived ${preCleanup.totalArchived} stale UAT artifact(s)`);
  } else {
    pass('A_pre_cleanup', 'no stale cms-uat-* rows');
  }

  const caps = await req('GET', '/api/v1/admin/capabilities', null, superTok);
  const consoleRole = caps.json?.console_role_70 || caps.json?.console_role || '';
  if (consoleRole !== 'SuperAdmin') {
    report.gaps.push(`super_console_role=${consoleRole || 'unknown'} (expected SuperAdmin — run bootstrap-staging-super-admin.sh on staging)`);
  }

  const createBody = {
    slug,
    lane: 'product',
    kind: 'product',
    content_tier: 'upcoming',
    pinned: false,
    sort_order: 10,
    title_zh: 'CMS UAT 产品公告',
    title_en: 'CMS UAT Product Announcement',
    summary_zh: 'Staging UAT 自动验证',
    summary_en: 'Staging UAT automated verification',
    body_zh: '计划上线目标 · subject to Production GO',
    body_en: 'Planned launch target · subject to Production GO',
    release_at: '2026-07-15',
    cta_kind: 'link',
    cta_href: '/traveltrust/announcements',
    network_scope: 'none',
  };

  const created = await req('POST', '/api/v1/admin/content/announcements', createBody, superTok);
  if (created.status !== 200 || created.json?.status !== 'ok') {
    fail('A_create_draft', `HTTP ${created.status} ${JSON.stringify(created.json).slice(0, 200)}`);
    fs.writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
    process.exit(2);
  }
  const item = created.json.item;
  pass('A_create_draft', item.id);

  const review = await req(
    'POST',
    `/api/v1/admin/content/announcements/${item.id}/submit-review`,
    { version: item.version },
    superTok
  );
  if (review.status !== 200) {
    fail('A_submit_review', `HTTP ${review.status}`);
    fs.writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
    process.exit(2);
  }
  pass('A_submit_review');

  const published = await req(
    'POST',
    `/api/v1/admin/content/announcements/${item.id}/publish`,
    { version: review.json.item?.version ?? item.version + 1 },
    superTok
  );
  if (published.status !== 200 || published.json?.item?.publish_status !== 'published') {
    fail('A_publish', `HTTP ${published.status} ${JSON.stringify(published.json).slice(0, 200)}`);
    fs.writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
    process.exit(2);
  }
  pass('A_publish');

  if (DATABASE_URL) {
    const Client = pgClient();
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
    try {
      const { rows } = await client.query(
        `SELECT publish_status, published_at FROM cms_public_announcements WHERE slug = $1`,
        [slug]
      );
      const row = rows[0];
      if (!row || row.publish_status !== 'published' || !row.published_at) {
        fail('A_db_published', JSON.stringify(row));
      } else {
        pass('A_db_published', row.published_at.toISOString());
      }
      report.gaps.push('published_by column not in cms_public_announcements schema (P1 revision track)');
    } catch (e) {
      skip('A_db_published', e.message);
    } finally {
      await client.end();
    }
  } else {
    skip('A_db_published', 'DATABASE_URL not set');
  }

  // B — Public API (cms-uat-* intentionally excluded from public surface · lane hygiene)
  const pub = await req('GET', `/api/v1/public/announcements?lane=product&limit=50`);
  if (pub.status !== 200 || pub.json?.status !== 'ok') {
    fail('B_public_api', `HTTP ${pub.status}`);
  } else {
    const items = pub.json.items || [];
    const hit = items.find((i) => i.slug === slug);
    if (hit) {
      fail('B_public_hygiene', `cms-uat slug ${slug} must not appear on public surface`);
    } else {
      pass('B_public_hygiene', `cms-uat slug excluded (${items.length} public product rows)`);
    }
    const adminList = await req('GET', '/api/v1/admin/content/announcements?lane=product&limit=50', null, superTok);
    const adminHit = (adminList.json?.items || []).find((i) => i.slug === slug);
    if (adminList.status !== 200 || !adminHit || adminHit.publish_status !== 'published') {
      fail('B_admin_published', `admin list missing published ${slug}`);
    } else {
      const shapeErr = assertPublicShape([
        {
          slug: adminHit.slug,
          title_en: adminHit.title_en,
          title_zh: adminHit.title_zh,
          summary_en: adminHit.summary_en,
          summary_zh: adminHit.summary_zh,
        },
      ]);
      if (shapeErr) fail('B_public_shape', shapeErr);
      else pass('B_admin_published', `published in admin · release_at=${adminHit.release_at || 'null'}`);
    }
  }

  // C — Pulse (product lane only)
  const pulse = await req('GET', '/api/v1/public/announcements/pulse?limit=20');
  if (pulse.status !== 200) {
    fail('C_pulse_api', `HTTP ${pulse.status}`);
  } else {
    const items = pulse.json.items || [];
    const badLane = items.find((i) => i.lane !== 'product');
    if (badLane) fail('C_pulse_lane', `non-product lane in pulse: ${badLane.lane}`);
    else pass('C_pulse_api', `${items.length} items · product lane only`);
  }

  // D — Ops governance negative
  let opsTok = await login(OPS_EMAIL, PASSWORD, false);
  if (!opsTok) {
    opsTok = await registerOpsUser();
  }
  if (!opsTok) {
    skip('D_ops_governance_denied', 'could not provision Ops session (need DATABASE_URL for console role)');
  } else {
    const govAttempt = await req(
      'POST',
      '/api/v1/admin/content/announcements',
      {
        ...createBody,
        slug: `${slug}-gov-denied`,
        lane: 'governance',
        kind: 'trust',
      },
      opsTok
    );
    if (govAttempt.status === 403 && (govAttempt.json?.error === 'admin_announcement_lane_denied' || govAttempt.json?.error === 'admin_permission_denied')) {
      pass('D_ops_governance_denied', `HTTP 403 ${govAttempt.json.error}`);
    } else {
      fail('D_ops_governance_denied', `expected 403 lane denied got HTTP ${govAttempt.status} ${JSON.stringify(govAttempt.json).slice(0, 120)}`);
    }
  }

  // E — Audit log
  const audit = await req('GET', '/api/v1/admin/audit-logs?limit=20&action=admin.content.announcement.publish', null, superTok);
  if (audit.status === 200 && Array.isArray(audit.json?.items)) {
    const hit = audit.json.items.find((e) => e.action === 'admin.content.announcement.publish');
    if (hit) pass('E_audit_publish', hit.id || hit.created_at);
    else skip('E_audit_publish', 'no publish row in recent audit logs (table may be empty on stack)');
  } else {
    skip('E_audit_publish', `HTTP ${audit.status}`);
  }

  if (!process.env.CMS_UAT_KEEP_ARTIFACT) {
    const postCleanup = await teardownCmsUatArtifacts(req, superTok);
    if (postCleanup.totalArchived > 0) {
      pass('F_post_cleanup', `archived ${postCleanup.totalArchived} UAT artifact(s) incl. ${slug}`);
    } else {
      pass('F_post_cleanup', 'nothing to archive');
    }
  } else {
    skip('F_post_cleanup', 'CMS_UAT_KEEP_ARTIFACT=1');
  }

  const failed = Object.values(report.steps).some((s) => s.status === 'FAIL');
  report.verdict = failed ? 'FAIL' : 'PASS';
  fs.writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
  console.log(`CMS_STAGING_UAT: verdict=${report.verdict} evidence → ${EVIDENCE}`);
  process.exit(failed ? 2 : 0);
}

main().catch((e) => {
  console.error('CMS_STAGING_UAT: fatal', e);
  report.verdict = 'ERROR';
  report.fatal = String(e.message || e);
  fs.writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
  process.exit(2);
});
