#!/usr/bin/env node
/**
 * CMS Product Roadmap · ② Staging UAT (independent from announcements / Pulse)
 *
 *   API=http://127.0.0.1:8080 node scripts/dev/run-cms-roadmap-staging-uat.cjs
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

const API = (process.env.API || 'http://127.0.0.1:8080').replace(/\/$/, '');
const PASSWORD = process.env.ADMIN_PASS || 'Test123!';
const SUPER_EMAIL = process.env.SUPER_EMAIL || 'tourist@test.com';
const EVIDENCE = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/CMS-ROADMAP-STAGING-UAT-LATEST.json'
);

const lib = API.startsWith('https') ? https : http;
const { teardownCmsUatArtifacts } = require('./lib/cms-uat-artifact-teardown.cjs');
const slug = `roadmap-uat-${Date.now()}`;

const report = {
  schema: 'traveltrust.cms_roadmap_staging_uat.v1',
  phase: '②_staging_uat',
  api: API,
  generated_utc: new Date().toISOString(),
  slug,
  steps: {},
  verdict: 'PENDING',
};

function fail(step, detail) {
  report.steps[step] = { status: 'FAIL', detail };
  report.verdict = 'FAIL';
  console.error(`CMS_ROADMAP_UAT: FAIL ${step} — ${detail}`);
}

function pass(step, detail = '') {
  report.steps[step] = { status: 'PASS', ...(detail ? { detail } : {}) };
  console.log(`CMS_ROADMAP_UAT: PASS ${step}${detail ? ` — ${detail}` : ''}`);
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

async function login(email, password) {
  await req('POST', '/auth/seed-test-accounts', { promote_admin_email: email });
  const r = await req('POST', '/auth/login', { email, password });
  if (r.status !== 200 || !r.json.token) return null;
  return r.json.token;
}

async function main() {
  const pubProbe = await req('GET', '/api/v1/public/roadmap');
  if (pubProbe.status === 401) {
    fail('preflight_public_unauthenticated', 'GET /public/roadmap requires auth');
    fs.writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
    process.exit(2);
  }
  pass('preflight_public_unauthenticated', `HTTP ${pubProbe.status}`);

  if (pubProbe.json?.status !== 'ok' || !pubProbe.json?.section) {
    fail('public_section', JSON.stringify(pubProbe.json).slice(0, 200));
  } else {
    pass('public_section', pubProbe.json.section.anchor_id);
  }

  const items = pubProbe.json?.items || [];
  if (items.length < 1) fail('public_milestones', 'no published milestones');
  else pass('public_milestones', `${items.length} items`);

  const pulse = await req('GET', '/api/v1/public/announcements/pulse?limit=50');
  const roadmapInPulse = (pulse.json?.items || []).some((i) => i.lane === 'roadmap' || i.slug?.startsWith('milestone-'));
  if (roadmapInPulse) fail('pulse_excludes_roadmap', 'roadmap item found in pulse');
  else pass('pulse_excludes_roadmap');

  const ann = await req('GET', '/api/v1/public/announcements?lane=product&limit=50');
  const roadmapInAnn = (ann.json?.items || []).some((i) => i.slug?.startsWith('milestone-'));
  if (roadmapInAnn) fail('announcements_excludes_roadmap', 'roadmap slug in product announcements');
  else pass('announcements_excludes_roadmap');

  const superTok = await login(SUPER_EMAIL, PASSWORD);
  if (!superTok) {
    fail('admin_login', SUPER_EMAIL);
    fs.writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
    process.exit(2);
  }
  pass('admin_login');

  const preCleanup = await teardownCmsUatArtifacts(req, superTok);
  if (preCleanup.milestones.archived > 0) {
    pass('pre_cleanup', `archived ${preCleanup.milestones.archived} stale roadmap-uat-* row(s)`);
  } else {
    pass('pre_cleanup', 'no stale roadmap-uat-* rows');
  }

  const sectionAdmin = await req('GET', '/api/v1/admin/content/roadmap/section', null, superTok);
  if (sectionAdmin.status !== 200 || !sectionAdmin.json?.section) {
    fail('admin_section_read', `HTTP ${sectionAdmin.status}`);
  } else {
    pass('admin_section_read', sectionAdmin.json.section.period_label);
  }

  const created = await req(
    'POST',
    '/api/v1/admin/content/roadmap/milestones',
    {
      slug,
      kind: 'product',
      sort_order: 5,
      title_zh: 'UAT 路线图里程碑',
      title_en: 'UAT roadmap milestone',
      summary_zh: 'Staging UAT',
      summary_en: 'Staging UAT',
      ops_status: 'planned',
      cta_kind: 'learn_more',
    },
    superTok
  );
  if (created.status !== 200 || !created.json?.item?.id) {
    fail('admin_create_milestone', JSON.stringify(created.json).slice(0, 200));
    fs.writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
    process.exit(2);
  }
  const item = created.json.item;
  pass('admin_create_milestone', item.id);

  const review = await req(
    'POST',
    `/api/v1/admin/content/roadmap/milestones/${item.id}/submit-review`,
    { version: item.version },
    superTok
  );
  if (review.status !== 200) fail('admin_submit_review', `HTTP ${review.status}`);
  else pass('admin_submit_review');

  const published = await req(
    'POST',
    `/api/v1/admin/content/roadmap/milestones/${item.id}/publish`,
    { version: review.json.item?.version ?? item.version + 1 },
    superTok
  );
  if (published.status !== 200 || published.json?.item?.publish_status !== 'published') {
    fail('admin_publish', JSON.stringify(published.json).slice(0, 200));
  } else {
    pass('admin_publish');
  }

  const pubAfter = await req('GET', '/api/v1/public/roadmap');
  const hit = (pubAfter.json?.items || []).find((i) => i.slug === slug);
  if (!hit) fail('public_after_publish', `slug ${slug} missing`);
  else pass('public_after_publish', hit.ops_status);

  if (!process.env.CMS_UAT_KEEP_ARTIFACT) {
    const postCleanup = await teardownCmsUatArtifacts(req, superTok);
    if (postCleanup.milestones.archived > 0) {
      pass('post_cleanup', `archived ${postCleanup.milestones.archived} UAT milestone(s) incl. ${slug}`);
    } else {
      pass('post_cleanup', 'nothing to archive');
    }
  } else {
    skip('post_cleanup', 'CMS_UAT_KEEP_ARTIFACT=1');
  }

  const failed = Object.values(report.steps).some((s) => s.status === 'FAIL');
  report.verdict = failed ? 'FAIL' : 'PASS';
  fs.writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
  console.log(`CMS_ROADMAP_UAT: verdict=${report.verdict} evidence → ${EVIDENCE}`);
  process.exit(failed ? 2 : 0);
}

main().catch((e) => {
  console.error('CMS_ROADMAP_UAT: fatal', e);
  report.verdict = 'ERROR';
  report.fatal = String(e.message || e);
  fs.writeFileSync(EVIDENCE, JSON.stringify(report, null, 2));
  process.exit(2);
});
