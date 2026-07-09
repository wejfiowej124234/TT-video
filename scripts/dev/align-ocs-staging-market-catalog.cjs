#!/usr/bin/env node
/**
 * Align Staging public market catalog to OCS baseline only (provider + acquisition).
 *
 *   STATE=evidence/.../state.json node scripts/dev/align-ocs-staging-market-catalog.cjs
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const { isSmokeContent } = require('./lib/smoke-data-heuristics.cjs');
const { assertStagingBaselineMutationAuthorized } = require('./lib/staging-rc-baseline-authorize.cjs');

assertStagingBaselineMutationAuthorized('align_market_catalog');

const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const STATE_PATH = process.env.STATE || process.env.OCS_STATE || '';
const DRY_RUN = process.env.DRY_RUN === '1';
const OUT = process.env.ALIGN_EVIDENCE_JSON || '';

const client = createClient(API);

function listingSurfaces(key) {
  return key.startsWith('provider:')
    ? ['market_provider', 'market_feed']
    : ['market_acquisition', 'market_feed'];
}

(async () => {
  if (!STATE_PATH || !fs.existsSync(STATE_PATH)) {
    console.error('align-ocs-market: missing STATE');
    process.exit(1);
  }
  const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  const ocsById = new Map();
  for (const [key, row] of Object.entries(state.listings || {})) {
    if (row?.id) ocsById.set(String(row.id), key);
  }
  if (ocsById.size < 20) {
    console.error(`align-ocs-market: expected 20 OCS listings, got ${ocsById.size}`);
    process.exit(1);
  }

  const adminTok = await client.adminLogin(
    process.env.ADMIN_EMAIL || 'tourist@test.com',
    process.env.ADMIN_PASS || 'Test123!'
  );
  const q = await client.req(
    'GET',
    '/api/v1/admin/official/public-operations/publish-queue?entity_type=market_listings&limit=500',
    null,
    adminTok
  );
  const items = q.json.items || [];
  const published = items.filter((x) => x.display_status === 'published');
  const toUnpublish = published.filter((row) => !ocsById.has(String(row.id)) || isSmokeContent(row));
  const toPublish = items.filter(
    (row) => ocsById.has(String(row.id)) && row.display_status !== 'published'
  );

  const report = {
    schema: 'traveltrust.ocs_staging_market_catalog_align.v1',
    recorded_at: new Date().toISOString(),
    ocs_listing_count: ocsById.size,
    published_before: published.length,
    unpublish: [],
    publish: [],
    surface_fix: [],
    errors: [],
    dry_run: DRY_RUN,
  };

  console.log(
    `align-ocs-market: published=${published.length} ocs=${ocsById.size} unpublish=${toUnpublish.length} publish=${toPublish.length}`
  );

  for (const row of toUnpublish) {
    if (DRY_RUN) {
      report.unpublish.push({ id: row.id, label: row.label, action: 'dry_run' });
      continue;
    }
    const r = await client.unpublishEntity(adminTok, 'market_listings', row.id);
    if (r.status >= 200 && r.status < 300) {
      report.unpublish.push({ id: row.id, label: row.label, action: 'unpublish', status: r.status });
      console.log('OK unpublish', row.id, row.label);
    } else {
      report.errors.push({ id: row.id, status: r.status, body: r.json });
      console.log('ERR unpublish', row.id, r.status);
    }
  }

  for (const row of toPublish) {
    const key = ocsById.get(String(row.id));
    if (DRY_RUN) {
      report.publish.push({ id: row.id, action: 'dry_run' });
      continue;
    }
    const r = await client.publishEntity(adminTok, 'market_listings', row.id);
    if (r.status >= 200 && r.status < 300) {
      report.publish.push({ id: row.id, action: 'publish', status: r.status });
      await client.setSurfaces(adminTok, 'market_listings', row.id, listingSurfaces(key));
      console.log('OK publish', row.id, key);
    } else {
      report.errors.push({ id: row.id, action: 'publish', status: r.status, body: r.json });
    }
  }

  // Queue may show published while governed public view is empty — re-publish OCS rows missing from market API.
  if (!DRY_RUN) {
    for (const variant of ['provider', 'acquisition']) {
      const pub = await client.req('GET', `/api/v1/market/${variant}/listings?limit=300`, null, adminTok);
      const onPublic = new Set((pub.json.items || pub.json.listings || []).map((r) => String(r.id)));
      for (const [key, id] of ocsById.entries()) {
        const wantVariant = key.startsWith('provider:') ? 'provider' : 'acquisition';
        if (wantVariant !== variant || onPublic.has(String(id))) continue;
        const row = items.find((x) => String(x.id) === String(id));
        if (!row) continue;
        if (row.display_status !== 'published') {
          const pr = await client.publishEntity(adminTok, 'market_listings', id);
          if (pr.status >= 200 && pr.status < 300) {
            report.publish.push({ id, action: 'republish_missing_public', status: pr.status });
          }
        }
        await client.setSurfaces(adminTok, 'market_listings', id, listingSurfaces(key));
        console.log('OK ensure public', variant, id, key);
      }
    }
  }

  for (const row of items.filter(
    (x) => ocsById.has(String(x.id)) && x.display_status === 'published'
  )) {
    const key = ocsById.get(String(row.id));
    const want = listingSurfaces(key);
    const have = row.display_surfaces || [];
    if (want.every((s) => have.includes(s))) continue;
    if (DRY_RUN) {
      report.surface_fix.push({ id: row.id, action: 'dry_run' });
      continue;
    }
    const r = await client.setSurfaces(adminTok, 'market_listings', row.id, want);
    if (r.status >= 200 && r.status < 300) {
      report.surface_fix.push({ id: row.id, surfaces: want, status: r.status });
      console.log('OK surface', row.id, want.join(','));
    } else {
      report.errors.push({ id: row.id, action: 'surface', status: r.status, body: r.json });
    }
  }

  const publicAfter = { provider: 0, acquisition: 0, extras: [] };
  for (const variant of ['provider', 'acquisition']) {
    const pub = await client.req('GET', `/api/v1/market/${variant}/listings?limit=300`, null, adminTok);
    const list = pub.json.items || pub.json.listings || [];
    publicAfter[variant] = list.length;
    for (const row of list) {
      if (!ocsById.has(String(row.id))) {
        publicAfter.extras.push({ variant, id: row.id, title: row.title || row.label });
        if (!DRY_RUN) {
          const r = await client.unpublishEntity(adminTok, 'market_listings', row.id);
          if (r.status >= 200 && r.status < 300) {
            report.unpublish.push({ id: row.id, variant, action: 'unpublish_public_extra', status: r.status });
            console.log('OK unpublish public extra', variant, row.id);
          }
        }
      }
    }
  }

  if (!DRY_RUN) {
    for (const variant of ['provider', 'acquisition']) {
      const pub = await client.req('GET', `/api/v1/market/${variant}/listings?limit=300`, null, adminTok);
      const list = pub.json.items || pub.json.listings || [];
      publicAfter[variant] = list.length;
    }
    publicAfter.extras = publicAfter.extras.filter((e) => {
      /* recount after fixes */
      return false;
    });
    for (const variant of ['provider', 'acquisition']) {
      const pub = await client.req('GET', `/api/v1/market/${variant}/listings?limit=300`, null, adminTok);
      const list = pub.json.items || pub.json.listings || [];
      for (const row of list) {
        if (!ocsById.has(String(row.id))) {
          publicAfter.extras.push({ variant, id: row.id });
        }
      }
      publicAfter[variant] = list.length;
    }
  }

  report.public_after = publicAfter;
  const expectPerVariant = 10;
  report.ok =
    publicAfter.provider === expectPerVariant &&
    publicAfter.acquisition === expectPerVariant &&
    publicAfter.extras.length === 0 &&
    report.errors.length === 0;

  if (OUT) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  }

  console.log(
    `align-ocs-market: provider=${publicAfter.provider} acquisition=${publicAfter.acquisition} extras=${publicAfter.extras.length}`
  );
  if (!report.ok) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
