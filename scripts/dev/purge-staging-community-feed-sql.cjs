#!/usr/bin/env node
/**
 * SQL hygiene: draft/hide non-OCS + corridor-smoke community posts still on public feed surfaces.
 * Requires DATABASE_URL (staging fly proxy).
 *
 *   DATABASE_URL=... STATE=evidence/.../state.json node scripts/dev/purge-staging-community-feed-sql.cjs
 */
const fs = require('fs');
const path = require('path');
const { isStagingCorridorSmokeBody } = require('./lib/staging-corridor-smoke.cjs');
const { assertStagingBaselineMutationAuthorized } = require('./lib/staging-rc-baseline-authorize.cjs');

assertStagingBaselineMutationAuthorized('purge_community_feed_sql');

const ROOT = path.join(__dirname, '../..');
const STATE_PATH = process.env.STATE || process.env.OCS_STATE || '';
const DRY_RUN = process.env.DRY_RUN === '1';
const OUT = process.env.PURGE_SQL_EVIDENCE_JSON || '';

function pgClient() {
  let Client;
  try {
    Client = require('pg').Client;
  } catch {
    Client = require(path.join(ROOT, 'frontend/node_modules/pg')).Client;
  }
  return Client;
}

(async () => {
  const dsn = process.env.DATABASE_URL || process.env.STAGING_DATABASE_URL || '';
  if (!dsn) {
    console.error('purge-community-feed-sql: missing DATABASE_URL');
    process.exit(1);
  }
  if (!STATE_PATH || !fs.existsSync(STATE_PATH)) {
    console.error('purge-community-feed-sql: missing STATE');
    process.exit(1);
  }
  const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  const ocsIds = Object.values(state.community_posts || {})
    .map((p) => p?.id)
    .filter(Boolean);
  if (ocsIds.length < 10) {
    console.error('purge-community-feed-sql: need 10 OCS post ids');
    process.exit(1);
  }

  const Client = pgClient();
  const pg = new Client({ connectionString: dsn });
  await pg.connect();

  const report = {
    schema: 'traveltrust.staging_community_feed_sql_purge.v1',
    recorded_at: new Date().toISOString(),
    ocs_post_ids: ocsIds,
    dry_run: DRY_RUN,
    actions: [],
  };

  const listRes = await pg.query(
    `SELECT id, body, display_status, data_origin, cover_url
     FROM community_posts
     WHERE display_status = 'published'
     ORDER BY created_at DESC
     LIMIT 500`
  );

  const toFix = listRes.rows.filter(
    (r) => !ocsIds.includes(String(r.id)) || isStagingCorridorSmokeBody(r.body || '')
  );
  console.log(`purge-community-feed-sql: published=${listRes.rows.length} fix=${toFix.length}`);

  for (const row of toFix) {
    const action = {
      id: row.id,
      body: String(row.body || '').slice(0, 40),
      reason: !ocsIds.includes(String(row.id)) ? 'not_in_ocs_ssot' : 'corridor_smoke_body',
    };
    if (!DRY_RUN) {
      await pg.query(
        `UPDATE community_posts
         SET display_status = 'draft',
             visibility_status = 'hidden',
             updated_at = NOW()
         WHERE id = $1::uuid`,
        [row.id]
      );
      action.applied = true;
    }
    report.actions.push(action);
  }

  await pg.end();

  if (OUT) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  }

  console.log(`purge-community-feed-sql: done actions=${report.actions.length} dry_run=${DRY_RUN}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
