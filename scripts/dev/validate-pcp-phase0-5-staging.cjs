#!/usr/bin/env node
/**
 * PCP Phase 0.5 — Validation chain (fixed order):
 *   ① Local Architecture Validation (TT_PCP_ARCHITECTURE_COMPLIANCE)
 *   ② Staging Runtime Validation (Publish/Unpublish · Surface · Builder purity)
 *   ③ Evidence (written; sign-off only when overall PASS)
 *
 *   node scripts/dev/validate-pcp-phase0-5-staging.cjs
 *   STAGING_API=https://tt-api-staging.fly.dev node scripts/dev/validate-pcp-phase0-5-staging.cjs
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');

const ROOT = path.join(__dirname, '../..');
const STAGING_API = (process.env.STAGING_API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const STAMP = process.env.AUDIT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const EVID_DIR = path.join(ROOT, 'evidence', 'GO_public_content_platform', STAMP);
const ENTITY = 'community_posts';
// Must use PUBLIC_OPS_SURFACE_IDS (see public_operations_display_admin.rs).
// `homepage` is NOT a valid ops surface id — normalize strips it to [] (= all surfaces).
const SURFACE_OFF = ['market_feed'];
const SURFACE_ON = ['community_feed'];

const checks = [];

function record(id, label, status, detail, extra = {}) {
  checks.push({ id, label, status, detail, ...extra });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function feedIds(json) {
  const posts = json?.posts || [];
  return posts.map((p) => String(p.id || p.post_id || '')).filter(Boolean);
}

function postVisible(json) {
  return Boolean(json?.post && json.post.id);
}

async function findFeedPost(client) {
  for (const limit of [50, 100, 200]) {
    const feed = await client.req('GET', `/api/v1/community/feed?limit=${limit}`);
    if (feed.status !== 200) {
      throw new Error(`feed HTTP ${feed.status}`);
    }
    const ids = feedIds(feed.json);
    if (ids.length) return { id: ids[0], feedCount: ids.length, limit };
  }
  return null;
}

async function assertFeedContains(client, postId, expect) {
  const feed = await client.req('GET', '/api/v1/community/feed?limit=200');
  const ids = feedIds(feed.json);
  const found = ids.includes(String(postId));
  return found === expect ? { ok: true, found, feedSize: ids.length } : { ok: false, found, feedSize: ids.length };
}

async function assertDetailVisible(client, postId, expect) {
  const detail = await client.req('GET', `/api/v1/community/posts/${postId}`);
  const visible = postVisible(detail.json);
  return visible === expect ? { ok: true, visible } : { ok: false, visible, status: detail.status };
}

async function fetchEntityState(client, adminTok, postId) {
  const pq = await client.req(
    'GET',
    `/api/v1/admin/official/public-operations/publish-queue?entity_type=${ENTITY}&limit=500`,
    null,
    adminTok
  );
  const item = (pq.json?.items || []).find((i) => String(i.id) === String(postId));
  return item || null;
}

async function runStagingRuntime(client, adminTok) {
  // Preflight
  const ready = await client.req('GET', '/health/ready');
  const dbOk =
    ready.status === 200 &&
    (ready.json?.database === 'ok' ||
      ready.json?.database_connected === true ||
      ready.json?.status === 'ok');
  if (ready.status !== 200) {
    record('staging_health', 'Staging /health/ready', 'FAIL', `HTTP ${ready.status}`);
    return;
  }
  record(
    'staging_health',
    'Staging /health/ready',
    dbOk ? 'PASS' : 'FAIL',
    dbOk ? `database=${ready.json?.database || 'ok'}` : JSON.stringify(ready.json)
  );
  record(
    'staging_db',
    'Staging database reachable',
    dbOk ? 'PASS' : 'FAIL',
    dbOk ? 'health/ready database ok' : 'database not ok in health/ready'
  );
  if (!dbOk) return;

  const candidate = await findFeedPost(client);
  if (!candidate) {
    record(
      'staging_feed_baseline',
      'Community Feed baseline',
      'FAIL',
      'No public posts in feed — cannot run Publish/Unpublish loop'
    );
    return;
  }
  record(
    'staging_feed_baseline',
    'Community Feed baseline',
    'PASS',
    `Found post ${candidate.id} in feed (limit=${candidate.limit}, count=${candidate.feedCount})`
  );

  const postId = candidate.id;
  const before = await fetchEntityState(client, adminTok, postId);
  const originalStatus = before?.display_status || 'published';
  const originalSurfaces = Array.isArray(before?.display_surfaces) ? [...before.display_surfaces] : [];

  try {
    // Scenario 1 — Publish / Unpublish loop
    const unpublish = await client.unpublishEntity(adminTok, ENTITY, postId);
    if (unpublish.status >= 400 || unpublish.json?.status === 'error') {
      record(
        'scenario_1_unpublish',
        'Admin Unpublish',
        'FAIL',
        `HTTP ${unpublish.status} ${JSON.stringify(unpublish.json?.error || unpublish.json)}`
      );
    } else {
      record('scenario_1_unpublish', 'Admin Unpublish', 'PASS', `display_status→hidden for ${postId}`);
      await sleep(400);

      const feedAfterUnpub = await assertFeedContains(client, postId, false);
      const governanceInactive = !feedAfterUnpub.ok;
      record(
        'scenario_1_feed_hidden',
        'Unpublish → Feed hidden',
        feedAfterUnpub.ok ? 'PASS' : 'FAIL',
        feedAfterUnpub.ok
          ? 'Post absent from feed immediately after unpublish'
          : `Post still in feed (feedSize=${feedAfterUnpub.feedSize}) — STAGING_GOVERNED_VIEW_NOT_ACTIVE: deploy Phase 0 + migration 20260704100000`
      );

      const detailAfterUnpub = await assertDetailVisible(client, postId, false);
      record(
        'scenario_1_detail_hidden',
        'Unpublish → Detail invisible',
        detailAfterUnpub.ok ? 'PASS' : 'FAIL',
        detailAfterUnpub.ok
          ? 'GET /posts/:id returns post=null for anonymous'
          : `Detail still visible (HTTP ${detailAfterUnpub.status})`
      );

      const republish = await client.publishEntity(adminTok, ENTITY, postId);
      if (republish.status >= 400 || republish.json?.status === 'error') {
        record(
          'scenario_1_publish',
          'Admin Publish (restore)',
          'FAIL',
          `HTTP ${republish.status} ${JSON.stringify(republish.json?.error || republish.json)}`
        );
      } else {
        record('scenario_1_publish', 'Admin Publish (restore)', 'PASS', `display_status→published`);
        await sleep(400);

        const feedAfterPub = await assertFeedContains(client, postId, true);
        record(
          'scenario_1_feed_restored',
          'Publish → Feed restored',
          feedAfterPub.ok ? 'PASS' : 'FAIL',
          feedAfterPub.ok ? 'Post back in feed' : `Post not in feed after publish`
        );

        const detailAfterPub = await assertDetailVisible(client, postId, true);
        record(
          'scenario_1_detail_restored',
          'Publish → Detail visible',
          detailAfterPub.ok ? 'PASS' : 'FAIL',
          detailAfterPub.ok ? 'Detail visible again' : 'Detail still null after publish'
        );
      }
    }

    // Scenario 2 — Surface OFF / ON (community_feed)
    const surfaceOff = await client.setSurfaces(adminTok, ENTITY, postId, SURFACE_OFF);
    if (surfaceOff.status >= 400 || surfaceOff.json?.status === 'error') {
      record(
        'scenario_2_surface_off',
        'Surface OFF (no community_feed)',
        'FAIL',
        `HTTP ${surfaceOff.status} ${JSON.stringify(surfaceOff.json?.error || surfaceOff.json)}`
      );
    } else {
      record(
        'scenario_2_surface_off',
        'Surface OFF (no community_feed)',
        'PASS',
        `display_surfaces=${JSON.stringify(SURFACE_OFF)}`
      );
      await sleep(400);

      const feedSurfaceOff = await assertFeedContains(client, postId, false);
      record(
        'scenario_2_feed_off',
        'Surface OFF → Feed hidden',
        feedSurfaceOff.ok ? 'PASS' : 'FAIL',
        feedSurfaceOff.ok ? 'Absent from feed' : 'Still in feed'
      );

      const detailSurfaceOff = await assertDetailVisible(client, postId, false);
      record(
        'scenario_2_detail_off',
        'Surface OFF → Detail invisible (governed view)',
        detailSurfaceOff.ok ? 'PASS' : 'FAIL',
        detailSurfaceOff.ok
          ? 'Detail null — same governed view as feed'
          : 'Detail still visible when community_feed surface off'
      );

      const surfaceOn = await client.setSurfaces(adminTok, ENTITY, postId, SURFACE_ON);
      if (surfaceOn.status >= 400 || surfaceOn.json?.status === 'error') {
        record(
          'scenario_2_surface_on',
          'Surface ON (community_feed)',
          'FAIL',
          `HTTP ${surfaceOn.status}`
        );
      } else {
        record(
          'scenario_2_surface_on',
          'Surface ON (community_feed)',
          'PASS',
          `display_surfaces=${JSON.stringify(SURFACE_ON)}`
        );
        await sleep(400);

        const feedSurfaceOn = await assertFeedContains(client, postId, true);
        record(
          'scenario_2_feed_on',
          'Surface ON → Feed restored',
          feedSurfaceOn.ok ? 'PASS' : 'FAIL',
          feedSurfaceOn.ok ? 'Back in feed' : 'Not in feed after surface restore'
        );
      }
    }
  } finally {
    // Always restore original governance state
    if (originalStatus === 'published') {
      await client.publishEntity(adminTok, ENTITY, postId);
    } else {
      await client.unpublishEntity(adminTok, ENTITY, postId);
    }
    if (originalSurfaces.length) {
      await client.setSurfaces(adminTok, ENTITY, postId, originalSurfaces);
    } else {
      await client.setSurfaces(adminTok, ENTITY, postId, []);
    }
  }
}

function runLocalArchitectureAudit() {
  const script = path.join(ROOT, 'scripts/dev/audit-pcp-architecture-compliance.cjs');
  const r = spawnSync(process.execPath, [script], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, AUDIT_STAMP: STAMP },
  });
  const pass = r.status === 0;
  record(
    'architecture_compliance',
    'TT_PCP_ARCHITECTURE_COMPLIANCE (local)',
    pass ? 'PASS' : 'FAIL',
    pass ? 'All public catalog surfaces + FeedBuilder purity PASS' : (r.stdout || r.stderr || '').slice(-800)
  );

  // Scenario 3 — Builder purity (subset of architecture audit, explicit for sign-off checklist)
  const feedBuilder = fs.readFileSync(path.join(ROOT, 'crates/api/src/pcp/feed_builder.rs'), 'utf8');
  const forbidden = ['display_status', 'display_surfaces', 'entity_visible_on_public_surface', 'content_tier'];
  const hits = forbidden.filter((k) => feedBuilder.includes(k));
  record(
    'builder_purity',
    'FeedBuilder — no governance rules',
    hits.length === 0 ? 'PASS' : 'FAIL',
    hits.length === 0 ? 'No display_status/surface/tier checks in Builder' : `Found: ${hits.join(', ')}`
  );

  return pass && hits.length === 0;
}

async function main() {
  fs.mkdirSync(EVID_DIR, { recursive: true });

  console.log('\n=== PCP Phase 0.5 Validation Chain ===\n');
  console.log('① Local Architecture Validation…');
  runLocalArchitectureAudit();

  console.log('② Staging Runtime Validation…');
  const client = createClient(STAGING_API);
  let adminTok;
  try {
    adminTok = await client.adminLogin(
      process.env.ADMIN_EMAIL || 'tourist@test.com',
      process.env.ADMIN_PASS || 'Test123!'
    );
    await runStagingRuntime(client, adminTok);
  } catch (e) {
    record('staging_runtime', 'Staging runtime validation', 'FAIL', String(e.message || e));
  }

  const blocking = checks.filter((c) => c.status === 'FAIL');
  const overall = blocking.length === 0 ? 'PASS' : 'FAIL';

  const report = {
    validation: 'PCP_PHASE_0_5',
    stamp: STAMP,
    sequence: ['local_architecture', 'staging_runtime', 'evidence', 'sign_off_if_pass'],
    staging_api: STAGING_API,
    overall,
    sign_off: false,
    sign_off_note:
      overall === 'PASS'
        ? 'All checks PASS — user may mark TT_PCP_PHASE_0_5 COMPLETE'
        : 'Do NOT sign off — fix failures and re-run',
    checks,
    summary: {
      pass: checks.filter((c) => c.status === 'PASS').length,
      fail: blocking.length,
    },
  };

  const outPath = path.join(EVID_DIR, 'phase0.5-validation-chain.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');

  console.log(`\n=== Phase 0.5 Validation · ${overall} ===\n`);
  for (const c of checks) {
    console.log(`  [${c.status.padEnd(4)}] ${c.label}`);
    if (c.status !== 'PASS') console.log(`         ${c.detail}`);
  }
  console.log(`\nEvidence: ${path.relative(ROOT, outPath)}`);
  console.log(`Sign-off: ${report.sign_off ? 'ALLOWED' : 'BLOCKED'} (${report.sign_off_note})\n`);

  process.exit(blocking.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
