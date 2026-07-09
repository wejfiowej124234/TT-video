#!/usr/bin/env node
/**
 * Align Staging community feed to OCS SSOT only (unpublish non-OCS published posts).
 *
 *   STATE=evidence/.../state.json node scripts/dev/align-ocs-staging-community-feed.cjs
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const { isStagingCorridorSmokeBody } = require('./lib/staging-corridor-smoke.cjs');
const { assertStagingBaselineMutationAuthorized } = require('./lib/staging-rc-baseline-authorize.cjs');

assertStagingBaselineMutationAuthorized('align_community_feed');

const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const STATE_PATH = process.env.STATE || process.env.OCS_STATE || '';
const DRY_RUN = process.env.DRY_RUN === '1';
const OUT = process.env.ALIGN_EVIDENCE_JSON || '';

const client = createClient(API);

(async () => {
  if (!STATE_PATH || !fs.existsSync(STATE_PATH)) {
    console.error('align-ocs-community-feed: missing STATE');
    process.exit(1);
  }
  const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  const ocsPostIds = new Set(
    Object.values(state.community_posts || {})
      .map((p) => p?.id)
      .filter(Boolean)
  );
  if (ocsPostIds.size < 10) {
    console.error(`align-ocs-community-feed: expected 10 OCS posts, got ${ocsPostIds.size}`);
    process.exit(1);
  }

  const adminTok = await client.adminLogin(
    process.env.ADMIN_EMAIL || 'tourist@test.com',
    process.env.ADMIN_PASS || 'Test123!'
  );
  const q = await client.req(
    'GET',
    '/api/v1/admin/official/public-operations/publish-queue?entity_type=community_posts&limit=500',
    null,
    adminTok
  );
  const published = (q.json.items || []).filter((x) => x.display_status === 'published');
  const toUnpublish = published.filter(
    (row) => !ocsPostIds.has(row.id) || isStagingCorridorSmokeBody(row.body || row.label || '')
  );

  const report = {
    schema: 'traveltrust.ocs_staging_community_feed_align.v1',
    recorded_at: new Date().toISOString(),
    ocs_post_count: ocsPostIds.size,
    published_before: published.length,
    unpublish_candidates: toUnpublish.map((r) => ({
      id: r.id,
      label: (r.label || r.body || '').slice(0, 60),
      in_ocs: ocsPostIds.has(r.id),
      smoke_body: isStagingCorridorSmokeBody(r.body || r.label || ''),
    })),
    unpublish: [],
    errors: [],
    dry_run: DRY_RUN,
  };

  console.log(
    `align-ocs-community-feed: published=${published.length} ocs=${ocsPostIds.size} unpublish=${toUnpublish.length}`
  );

  for (const row of toUnpublish) {
    if (DRY_RUN) {
      report.unpublish.push({ id: row.id, action: 'dry_run' });
      continue;
    }
    const r = await client.req(
      'POST',
      `/api/v1/admin/official/public-operations/entities/community_posts/${row.id}/unpublish`,
      {},
      adminTok
    );
    if (r.status >= 200 && r.status < 300) {
      report.unpublish.push({ id: row.id, action: 'unpublish', status: r.status });
      console.log('OK unpublish', row.id);
    } else {
      report.errors.push({ id: row.id, status: r.status });
      console.log('ERR unpublish', row.id, r.status);
    }
  }

  const feed = await client.req('GET', '/api/v1/community/feed?limit=50');
  const feedPosts = feed.json.posts || [];
  report.feed_after = {
    count: feedPosts.length,
    ocs_only:
      feedPosts.length === ocsPostIds.size &&
      feedPosts.every((p) => ocsPostIds.has(p.id)),
    smoke_in_feed: feedPosts.filter((p) => isStagingCorridorSmokeBody(p.body || '')).length,
    non_ocs: feedPosts.filter((p) => !ocsPostIds.has(p.id)).map((p) => p.id),
  };

  if (OUT) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  }

  if (report.errors.length) process.exit(1);
  if (!DRY_RUN && !report.feed_after.ocs_only) {
    console.warn('align-ocs-community-feed: feed not OCS-only yet — run SQL purge + redeploy');
    process.exit(2);
  }
  console.log('align-ocs-community-feed: OK');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
