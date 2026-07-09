#!/usr/bin/env node
/**
 * City Hero Wave 1 · WP3 · Tokyo Catalog Publish (Ops)
 * No API/Frontend code changes · no Matrix/Registry edits
 *
 *   TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE=1 \
 *   API=https://tt-api-staging.fly.dev \
 *     node scripts/dev/run-cms-city-hero-wave1-wp3-tokyo-publish.cjs
 *
 *   LOCAL_API=http://127.0.0.1:8080 node scripts/dev/run-cms-city-hero-wave1-wp3-tokyo-publish.cjs --target local
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const { assertStagingBaselineMutationAuthorized } = require('./lib/staging-rc-baseline-authorize.cjs');
const {
  heroPublicUrl,
  ensureCmsQaHeroOnStaging,
  verifyHeroAssetUrl,
} = require('./lib/cms-destination-ambient-hero.cjs');
const {
  ROOT,
  WAVE1,
  loadPgClient,
  loadDatabaseUrl,
  workflowPublishMedia,
  seedJpTokyoCatalogRefs,
} = require('./lib/cms-city-hero-wp3.cjs');

const STAGING_API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(
  /\/$/,
  '',
);
const LOCAL_API = (process.env.LOCAL_API || 'http://127.0.0.1:8080').replace(/\/$/, '');
const TARGET = process.argv.includes('--target') ? process.argv[process.argv.indexOf('--target') + 1] : 'auto';
const NOW = new Date().toISOString();

async function adminSupportsCityHero(client, tok) {
  const probeUrl = `${STAGING_API}/api/v1/uploads/community-posts/da-hero-jp-home-v1.jpg`;
  const r = await client.req(
    'POST',
    '/api/v1/admin/content/media-assets',
    {
      asset_kind: 'city_hero',
      source_type: 'upload',
      url: `https://wp3-probe.invalid/${Date.now()}`,
      stock_pool_key: `city_hero_probe_${Date.now()}`,
      license: { holder: 'probe' },
    },
    tok,
  );
  if (r.status === 200 && r.json?.item?.id) {
    await client.req('POST', `/api/v1/admin/content/media-assets/${r.json.item.id}/archive`, { version: r.json.item.version }, tok);
    return true;
  }
  return r.json?.error !== 'invalid_asset_kind';
}

async function publishViaAdmin(apiBase, refs, publicUrl) {
  const client = createClient(apiBase);
  const tok = await client.adminLogin(
    process.env.ADMIN_EMAIL || 'tourist@test.com',
    process.env.ADMIN_PASS || 'Test123!',
  );

  const list = await client.req(
    'GET',
    `/api/v1/admin/content/media-assets?asset_kind=${WAVE1.asset_kind}&country_id=${refs.country_id}`,
    null,
    tok,
  );
  let asset = (list.json?.items || []).find((x) => x.stock_pool_key === WAVE1.asset_key);

  if (!asset) {
    const created = await client.req(
      'POST',
      '/api/v1/admin/content/media-assets',
      {
        asset_kind: WAVE1.asset_kind,
        source_type: 'upload',
        url: publicUrl,
        stock_pool_key: WAVE1.asset_key,
        license: { holder: 'TravelTrust CMS City Hero', usage: WAVE1.asset_key },
        alt_text_zh: `${WAVE1.city_zh} · City Hero`,
        alt_text_en: `${WAVE1.city_en} · City Hero`,
        country_id: refs.country_id,
        city_id: refs.city_id,
      },
      tok,
    );
    if (created.status !== 200) {
      throw new Error(`admin create ${created.status} ${JSON.stringify(created.json)}`);
    }
    asset = created.json.item;
  } else if (asset.url !== publicUrl) {
    const patched = await client.req(
      'PATCH',
      `/api/v1/admin/content/media-assets/${asset.id}`,
      { version: asset.version, url: publicUrl, stock_pool_key: WAVE1.asset_key },
      tok,
    );
    if (patched.status !== 200) throw new Error(`admin patch ${patched.status}`);
    asset = patched.json.item;
  }

  asset = await workflowPublishMedia(client, tok, asset);
  if (asset.publish_status !== 'published') {
    throw new Error(`publish incomplete status=${asset.publish_status}`);
  }
  return { method: 'admin_api', asset_id: asset.id, publish_status: asset.publish_status, version: asset.version };
}

async function publishViaOpsSql(databaseUrl, refs, publicUrl) {
  const Client = loadPgClient();
  const pg = new Client({ connectionString: databaseUrl });
  await pg.connect();
  try {
    const existing = await pg.query(
      `SELECT id, url, publish_status, version FROM catalog_media_assets
       WHERE stock_pool_key = $1 OR (asset_kind = 'city_hero' AND url = $2)
       LIMIT 1`,
      [WAVE1.asset_key, publicUrl],
    );
    let row;
    if (existing.rows[0]) {
      const upd = await pg.query(
        `UPDATE catalog_media_assets SET
           asset_kind = 'city_hero', source_type = 'upload', url = $2,
           stock_pool_key = $3, country_id = $4, city_id = $5,
           publish_status = 'published', published_at = COALESCE(published_at, now()),
           license = $6::jsonb, alt_text_zh = $7, alt_text_en = $8,
           version = version + 1, updated_at = now()
         WHERE id = $1
         RETURNING id, publish_status, version`,
        [
          existing.rows[0].id,
          publicUrl,
          WAVE1.asset_key,
          refs.country_id,
          refs.city_id,
          JSON.stringify({ holder: 'TravelTrust CMS City Hero', usage: WAVE1.asset_key }),
          `${WAVE1.city_zh} · City Hero`,
          `${WAVE1.city_en} · City Hero`,
        ],
      );
      row = upd.rows[0];
    } else {
      const ins = await pg.query(
        `INSERT INTO catalog_media_assets
         (asset_kind, source_type, url, stock_pool_key, country_id, city_id, publish_status, license,
          alt_text_zh, alt_text_en, version, published_at)
         VALUES ('city_hero', 'upload', $1, $2, $3, $4, 'published', $5::jsonb, $6, $7, 1, now())
         RETURNING id, publish_status, version`,
        [
          publicUrl,
          WAVE1.asset_key,
          refs.country_id,
          refs.city_id,
          JSON.stringify({ holder: 'TravelTrust CMS City Hero', usage: WAVE1.asset_key }),
          `${WAVE1.city_zh} · City Hero`,
          `${WAVE1.city_en} · City Hero`,
        ],
      );
      row = ins.rows[0];
    }
    return { method: 'ops_sql', asset_id: row.id, publish_status: row.publish_status, version: row.version };
  } finally {
    await pg.end();
  }
}

async function resolvePublishTarget() {
  if (TARGET === 'local') return { apiBase: LOCAL_API, mode: 'local' };
  if (TARGET === 'staging') return { apiBase: STAGING_API, mode: 'staging' };
  const client = createClient(STAGING_API);
  const tok = await client.adminLogin(
    process.env.ADMIN_EMAIL || 'tourist@test.com',
    process.env.ADMIN_PASS || 'Test123!',
  );
  const stagingOk = await adminSupportsCityHero(client, tok);
  if (stagingOk) return { apiBase: STAGING_API, mode: 'staging' };
  return { apiBase: LOCAL_API, mode: 'local_fallback' };
}

async function main() {
  if (TARGET === 'staging' || TARGET === 'auto') {
    assertStagingBaselineMutationAuthorized('cms_city_hero_wp3_tokyo_publish');
  }

  const databaseUrl = loadDatabaseUrl();
  if (!databaseUrl) throw new Error('DATABASE_URL required for WP3 catalog refs + local publish');

  console.log('HERO_STAGING: ensure city-hero-tokyo-v1.jpg on staging uploads…');
  await ensureCmsQaHeroOnStaging(WAVE1.hero_filename, STAGING_API);
  const publicUrl = heroPublicUrl(STAGING_API, WAVE1.hero_filename);
  const heroVerify = await verifyHeroAssetUrl(publicUrl, 'WARN');
  if (!heroVerify.ok) throw new Error(`hero url verify failed ${publicUrl}`);

  const Client = loadPgClient();
  const pg = new Client({ connectionString: databaseUrl });
  await pg.connect();
  const refs = await seedJpTokyoCatalogRefs(pg);
  await pg.end();
  console.log(`CATALOG_REFS: country=${refs.country_id} city=${refs.city_id} seeded=${refs.seeded}`);

  const target = await resolvePublishTarget();
  console.log(`PUBLISH_TARGET: ${target.mode} api=${target.apiBase}`);

  let publishResult;
  if (target.mode === 'staging') {
    publishResult = await publishViaAdmin(target.apiBase, refs, publicUrl);
  } else {
    try {
      publishResult = await publishViaAdmin(target.apiBase, refs, publicUrl);
    } catch (e) {
      console.warn(`ADMIN_PUBLISH_WARN: ${e.message || e} → ops_sql`);
      publishResult = await publishViaOpsSql(databaseUrl, refs, publicUrl);
    }
  }

  const verifyApi =
    target.mode === 'staging' && publishResult.method === 'admin_api'
      ? STAGING_API
      : LOCAL_API;

  console.log(`\nTT_CMS_CITY_HERO_WAVE1_WP3_PUBLISH: OK`);
  console.log(`asset_key: ${WAVE1.asset_key}`);
  console.log(`public_url: ${publicUrl}`);
  console.log(`method: ${publishResult.method}`);
  console.log(`verify_api: ${verifyApi}`);
  console.log(`Run: node scripts/dev/run-cms-city-hero-wave1-wp3-publish-verify.cjs --api ${verifyApi}`);
}

main().catch((e) => {
  console.error(e.stack || e.message || e);
  process.exit(1);
});
