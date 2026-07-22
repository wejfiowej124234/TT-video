#!/usr/bin/env node
/**
 * Staging guides · OCS 10 only + content repair (SQL · no Admin HTTP).
 * Hides non-OCS from public catalog (data_origin=test) and restores OCS city/bio/title/avatar
 * from dataset.v1.json. API must rehydrate (restart) for GET /guides to reflect memory store.
 *
 *   STAGING_RC_BASELINE_ALIGNING=1 STATE=…/state.json \
 *     node scripts/dev/archive-and-repair-staging-ocs-guides.cjs
 */
const fs = require('fs');
const path = require('path');
const { assertStagingBaselineMutationAuthorized } = require('./lib/staging-rc-baseline-authorize.cjs');
const { loadDataset, loadAssetsManifest, resolvePublicUrl } = require('./lib/ocs-official-assets.cjs');

assertStagingBaselineMutationAuthorized('archive_and_repair_ocs_guides');

const ROOT = path.join(__dirname, '../..');
const STATE_PATH = process.env.STATE || process.env.OCS_STATE || '';
const DRY_RUN = process.env.DRY_RUN === '1';
const API = (process.env.API_BASE || process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');

async function main() {
  if (!STATE_PATH || !fs.existsSync(STATE_PATH)) {
    console.error('archive-repair-guides: missing STATE');
    process.exit(1);
  }
  const dsn = process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL;
  if (!dsn) {
    console.error('archive-repair-guides: missing STAGING_DATABASE_URL');
    process.exit(2);
  }

  const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  const ocsIds = Object.values(state.guides || {})
    .map((v) => v && v.id)
    .filter(Boolean);
  if (ocsIds.length !== 10) {
    console.error(`archive-repair-guides: expected 10 OCS guide ids, got ${ocsIds.length}`);
    process.exit(1);
  }

  const dataset = loadDataset();
  const assetsDoc = loadAssetsManifest();
  const byChain = new Map((dataset.chains || []).map((c) => [c.id, c]));

  const repairs = [];
  for (const [key, mapped] of Object.entries(state.guides || {})) {
    const chainId = String(key).replace(/^guide:/, '');
    const chain = byChain.get(chainId);
    if (!mapped?.id || !chain?.guide) continue;
    const avatarRow = (assetsDoc.assets || []).find((a) => a.chain_id === chainId && a.slot === 'guide-avatar');
    const avatarUrl = avatarRow ? resolvePublicUrl(API, avatarRow.public_url) : chain.guide.avatar_url || null;
    repairs.push({
      id: mapped.id,
      city: chain.city,
      country_code: chain.country_code,
      bio: chain.guide.bio || null,
      public_title: chain.guide.nickname || null,
      avatar_url: avatarUrl,
      languages: JSON.stringify(chain.guide.languages || ['zh', 'en']),
      service_types: JSON.stringify(chain.guide.service_types || ['experience']),
    });
  }
  if (repairs.length !== 10) {
    console.error(`archive-repair-guides: expected 10 repair rows, got ${repairs.length}`);
    process.exit(1);
  }

  const { Client } = require(path.join(ROOT, 'frontend/node_modules/pg'));
  const client = new Client({ connectionString: dsn, connectionTimeoutMillis: 20000 });
  await client.connect();
  try {
    const before = await client.query(
      `SELECT data_origin, COUNT(*)::int AS n
       FROM guides WHERE status = 'active'
       GROUP BY 1 ORDER BY 1`
    );
    console.log('before active_by_origin', before.rows);

    if (DRY_RUN) {
      const preview = await client.query(
        `SELECT id::text, city, data_origin, left(coalesce(bio,''), 40) AS bio
         FROM guides
         WHERE status = 'active' AND NOT (id = ANY($1::uuid[]))
         LIMIT 30`,
        [ocsIds]
      );
      console.log('dry_run would hide', preview.rowCount, preview.rows);
      console.log('dry_run would repair', repairs.map((r) => ({ id: r.id, city: r.city })));
      return;
    }

    const hide = await client.query(
      `UPDATE guides
       SET data_origin = 'test', updated_at = now()
       WHERE status = 'active' AND NOT (id = ANY($1::uuid[]))
         AND data_origin = 'production'
       RETURNING id::text, city`,
      [ocsIds]
    );
    console.log('hidden_non_ocs', hide.rowCount);

    let repaired = 0;
    for (const r of repairs) {
      const u = await client.query(
        `UPDATE guides
         SET city = $2,
             country_code = $3,
             bio = $4,
             public_title = $5,
             avatar_url = $6,
             languages = $7::jsonb,
             service_types = $8::jsonb,
             status = 'active',
             data_origin = 'production',
             updated_at = now()
         WHERE id = $1::uuid
         RETURNING id::text, city`,
        [
          r.id,
          r.city,
          r.country_code,
          r.bio,
          r.public_title,
          r.avatar_url,
          r.languages,
          r.service_types,
        ]
      );
      if (u.rowCount) repaired += 1;
      else console.warn('missing OCS guide row', r.id, r.city);
    }
    console.log('ocs_repaired', repaired);

    const after = await client.query(
      `SELECT data_origin, COUNT(*)::int AS n
       FROM guides WHERE status = 'active'
       GROUP BY 1 ORDER BY 1`
    );
    const pub = await client.query(
      `SELECT id::text, city, left(coalesce(public_title,''), 40) AS title, left(coalesce(bio,''), 40) AS bio
       FROM guides
       WHERE status = 'active' AND data_origin = 'production'
       ORDER BY city`
    );
    console.log('after active_by_origin', after.rows);
    console.log('production_public_candidates', pub.rowCount, pub.rows);

    const out = process.env.OUT;
    if (out) {
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(
        out,
        JSON.stringify(
          {
            schema: 'traveltrust.archive_and_repair_staging_ocs_guides.v1',
            hidden_non_ocs: hide.rowCount,
            ocs_repaired: repaired,
            production_active: pub.rowCount,
            production_cities: pub.rows.map((x) => x.city),
            note: 'Restart tt-api-staging so chain_off hydrate picks up SQL changes',
          },
          null,
          2
        ) + '\n'
      );
    }

    if (repaired !== 10 || pub.rowCount !== 10) {
      console.error('archive-repair-guides: FAIL expected 10 production active OCS guides');
      process.exit(1);
    }
    console.log('archive-repair-guides: OK — restart API to refresh public GET /guides');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
