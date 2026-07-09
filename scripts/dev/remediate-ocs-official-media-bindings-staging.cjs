#!/usr/bin/env node
/**
 * Rebind OCS published entities to Official Asset Baseline URLs (Staging · HTTP-only where possible).
 *
 *   API=https://tt-api-staging.fly.dev STATE=evidence/.../state.json \
 *     node scripts/dev/remediate-ocs-official-media-bindings-staging.cjs
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const { assertStagingBaselineMutationAuthorized } = require('./lib/staging-rc-baseline-authorize.cjs');
const { loadAssetsManifest, loadDataset, resolvePublicUrl } = require('./lib/ocs-official-assets.cjs');

assertStagingBaselineMutationAuthorized('remediate_ocs_media_bindings');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const STATE_PATH = process.env.STATE || process.env.OCS_STATE || '';
const OUT = process.env.OUT || '';
const OCS_PASS = process.env.TT_OCS_ACCOUNT_PASSWORD || 'OcsBaseline2026!';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tourist@test.com';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Test123!';

const client = createClient(API);
const assetsDoc = loadAssetsManifest();
const dataset = loadDataset();

function urlFor(chainId, slot) {
  const row = assetsDoc.assets.find((a) => a.chain_id === chainId && a.slot === slot);
  return row ? resolvePublicUrl(API, row.public_url) : null;
}

function manifestUrlFor(chainId, slot) {
  const row = assetsDoc.assets.find((a) => a.chain_id === chainId && a.slot === slot);
  return row?.public_url || null;
}

(async () => {
  if (!STATE_PATH || !fs.existsSync(STATE_PATH)) {
    throw new Error(`missing STATE=${STATE_PATH}`);
  }
  const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  const adminTok = await client.adminLogin(ADMIN_EMAIL, ADMIN_PASS);
  const results = [];

  for (const chain of dataset.chains || []) {
    const gKey = `guide:${chain.id}`;
    const mapped = state.guides?.[gKey];
    const avatarUrl = manifestUrlFor(chain.id, 'guide-avatar');
    if (mapped?.id && avatarUrl) {
      const sql = `
        UPDATE guides
        SET avatar_url = '${avatarUrl.replace(/'/g, "''")}',
            updated_at = NOW()
        WHERE id = '${mapped.id}'::uuid;
      `.trim();
      results.push({
        kind: 'guide_avatar',
        chain: chain.id,
        guide_id: mapped.id,
        ok: null,
        url: avatarUrl,
        sql_hint: sql,
        note: 'guide-profile PATCH rejects community-posts path — SQL bind',
      });
    }

    const ogKey = `official_guide:${chain.id}`;
    const ogId = state.official_guides?.[ogKey]?.id;
    const ogCover = manifestUrlFor(chain.id, 'official-guide-cover');
    if (ogId && ogCover) {
      const patch = await client.req(
        'PATCH',
        `/api/v1/admin/official/guides/${ogId}`,
        { cover_url: ogCover },
        adminTok
      );
      results.push({
        kind: 'official_guide_cover',
        chain: chain.id,
        ok: patch.status < 400,
        url: ogCover,
        http: patch.status,
      });
    }

    const cpKey = `community_post:${chain.id}`;
    const cpId = state.community_posts?.[cpKey]?.id;
    const cover = manifestUrlFor(chain.id, 'community-cover');
    const media = manifestUrlFor(chain.id, 'community-media');
    if (cpId && cover) {
      const sql = `
        UPDATE community_posts
        SET cover_url = '${cover.replace(/'/g, "''")}',
            media_urls = ARRAY['${media.replace(/'/g, "''")}']::text[]
        WHERE id = '${cpId}'::uuid;
      `.trim();
      results.push({
        kind: 'community_post_media',
        chain: chain.id,
        post_id: cpId,
        ok: null,
        url: cover,
        sql_hint: sql,
        note: 'Apply via fly postgres / DATABASE_URL — no public PATCH for cover_url',
      });
    }

    for (const variant of ['provider', 'acquisition']) {
      const slot = variant === 'provider' ? 'provider-cover' : 'acquisition-cover';
      const lKey = `${variant}:${chain.id}`;
      const listingId = state.listings?.[lKey]?.id;
      const coverUrl = manifestUrlFor(chain.id, slot);
      if (listingId && coverUrl) {
        const esc = coverUrl.replace(/'/g, "''");
        const sql = `
          UPDATE market_listings
          SET payload = payload
              || jsonb_build_object('cover_url', '${esc}', 'videoUrl', '${esc}'),
              updated_at = NOW()
          WHERE id = '${listingId}'::uuid;
        `.trim();
        results.push({
          kind: `${variant}_cover`,
          chain: chain.id,
          listing_id: listingId,
          ok: null,
          url: coverUrl,
          sql_hint: sql,
          note: 'Apply via fly postgres / DATABASE_URL',
        });
      }
    }
  }

  if (process.env.DATABASE_URL) {
    let Client;
    try {
      Client = require('pg').Client;
    } catch {
      try {
        Client = require(path.join(ROOT, 'frontend/node_modules/pg')).Client;
      } catch {
        Client = null;
      }
    }
    if (Client) {
      const pg = new Client({ connectionString: process.env.DATABASE_URL });
      await pg.connect();
      for (const r of results) {
        if (!r.sql_hint) continue;
        try {
          await pg.query(r.sql_hint);
          r.ok = true;
          r.applied = 'DATABASE_URL';
        } catch (e) {
          r.ok = false;
          r.error = String(e.message || e).slice(0, 200);
        }
      }
      await pg.end();
    }
  }

  const report = {
    schema: 'traveltrust.ocs_official_media_bindings_remediation.v1',
    api: API,
    state_path: STATE_PATH,
    recorded_at: new Date().toISOString(),
    http_patched: results.filter((r) => r.ok === true && !r.sql_hint && !r.applied).length,
  sql_applied: results.filter((r) => r.applied === 'DATABASE_URL').length,
    sql_pending: results.filter((r) => r.ok === null && r.sql_hint).length,
    results,
  };

  if (OUT) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  }

  const sqlPending = results.filter((r) => r.ok === null);
  if (sqlPending.length && !process.env.DATABASE_URL) {
    console.warn(`OCS_MEDIA_BINDINGS: WARN ${sqlPending.length} SQL rows need DATABASE_URL or manual apply`);
    for (const r of sqlPending.slice(0, 3)) {
      console.warn(r.sql_hint);
    }
    process.exit(1);
  }

  const httpFail = results.filter((r) => r.ok === false);
  const sqlFail = results.filter((r) => r.ok === false && r.sql_hint);
  if (httpFail.length || sqlFail.length) {
    console.error(`OCS_MEDIA_BINDINGS: FAIL http=${httpFail.length} sql=${sqlFail.length}`);
    process.exit(1);
  }
  console.log(`OCS_MEDIA_BINDINGS: OK http=${report.http_patched} sql=${report.sql_applied}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
