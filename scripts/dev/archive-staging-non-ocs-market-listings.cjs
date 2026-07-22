#!/usr/bin/env node
/**
 * Archive non-OCS market_listings on Staging so public GET respects SOPCP 10+10
 * (current API filters status=published only; display_status unpublish alone is ignored until API redeploy).
 *
 *   STAGING_RC_BASELINE_ALIGNING=1 STATE=…/state.json node scripts/dev/archive-staging-non-ocs-market-listings.cjs
 */
const fs = require('fs');
const path = require('path');
const { assertStagingBaselineMutationAuthorized } = require('./lib/staging-rc-baseline-authorize.cjs');

assertStagingBaselineMutationAuthorized('archive_non_ocs_market_listings');

const ROOT = path.join(__dirname, '../..');
const STATE_PATH = process.env.STATE || process.env.OCS_STATE || '';
const DRY_RUN = process.env.DRY_RUN === '1';

async function main() {
  if (!STATE_PATH || !fs.existsSync(STATE_PATH)) {
    console.error('archive-non-ocs-market: missing STATE');
    process.exit(1);
  }
  const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  const ocsIds = Object.values(state.listings || {})
    .map((v) => v && v.id)
    .filter(Boolean);
  if (ocsIds.length < 20) {
    console.error(`archive-non-ocs-market: expected ≥20 OCS listing ids, got ${ocsIds.length}`);
    process.exit(1);
  }
  const dsn = process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL;
  if (!dsn) {
    console.error('archive-non-ocs-market: missing STAGING_DATABASE_URL');
    process.exit(2);
  }
  const { Client } = require(path.join(ROOT, 'frontend/node_modules/pg'));
  const client = new Client({ connectionString: dsn, connectionTimeoutMillis: 20000 });
  await client.connect();
  try {
    const before = await client.query(
      `SELECT variant, COUNT(*)::int AS n FROM market_listings WHERE status='published' GROUP BY 1`
    );
    console.log('before published', before.rows);
    if (DRY_RUN) {
      const preview = await client.query(
        `SELECT id::text, variant, left(coalesce(payload->>'title',''), 40) AS title
         FROM market_listings
         WHERE status='published' AND NOT (id = ANY($1::uuid[]))
         LIMIT 20`,
        [ocsIds]
      );
      console.log('dry_run would archive', preview.rowCount, preview.rows);
      return;
    }
    const r = await client.query(
      `UPDATE market_listings
       SET status = 'archived', updated_at = now()
       WHERE status = 'published' AND NOT (id = ANY($1::uuid[]))
       RETURNING id::text, variant`,
      [ocsIds]
    );
    console.log('archived', r.rowCount);
    // OCS rows must be production+published so public_catalog_surface filter keeps them.
    const keep = await client.query(
      `UPDATE market_listings
       SET status = 'published',
           data_origin = 'production',
           display_status = 'published',
           updated_at = now()
       WHERE id = ANY($1::uuid[])
       RETURNING id::text, variant`,
      [ocsIds]
    );
    console.log('ocs_restored_production', keep.rowCount);
    const after = await client.query(
      `SELECT variant, COUNT(*)::int AS n FROM market_listings WHERE status='published' GROUP BY 1`
    );
    console.log('after published', after.rows);
    const out = process.env.OUT;
    if (out) {
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(
        out,
        JSON.stringify(
          {
            schema: 'traveltrust.archive_non_ocs_market_listings.v1',
            archived: r.rowCount,
            ocs_keep: ocsIds.length,
            after: after.rows,
          },
          null,
          2
        ) + '\n'
      );
    }
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
