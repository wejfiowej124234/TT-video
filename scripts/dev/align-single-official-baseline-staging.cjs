#!/usr/bin/env node
/**
 * Single Official Public Catalog Policy (SOPCP) · Staging catalog alignment.
 * Actions: unpublish from Public Catalog only — does NOT delete database rows.
 *
 *   STATE=evidence/GO_official_cold_start_dataset/<UTC>/state.json \
 *   OUT=evidence/GO_official_cold_start_dataset/<UTC>/single-official-baseline-align.json \
 *   node scripts/dev/align-single-official-baseline-staging.cjs
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const { isCanonicalGuideId } = require('./lib/smoke-data-heuristics.cjs');

const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const STATE_PATH = process.env.STATE || '';
const DRY_RUN = process.env.DRY_RUN === '1';
const OUT = process.env.OUT || '';

const client = createClient(API);

function ocsSets(state) {
  const guides = new Set(Object.values(state?.guides || {}).map((v) => v.id).filter(Boolean));
  const provider = new Set(
    Object.entries(state?.listings || {})
      .filter(([k]) => k.startsWith('provider:'))
      .map(([, v]) => v.id)
  );
  const acquisition = new Set(
    Object.entries(state?.listings || {})
      .filter(([k]) => k.startsWith('acquisition:'))
      .map(([, v]) => v.id)
  );
  return { guides, listings: new Set([...provider, ...acquisition]) };
}

(async () => {
  if (!STATE_PATH || !fs.existsSync(STATE_PATH)) {
    console.error('SOB align: missing STATE');
    process.exit(1);
  }
  const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  const ocs = ocsSets(state);
  const adminTok = await client.adminLogin(process.env.ADMIN_EMAIL || 'tourist@test.com', process.env.ADMIN_PASS || 'Test123!');

  const report = {
    schema: 'traveltrust.single_official_public_catalog_align.v1',
    policy: 'single_official_public_catalog_policy',
    scope: 'public_catalog_unpublish_only',
    db_deletion: false,
    recorded_at: new Date().toISOString(),
    dry_run: DRY_RUN,
    unpublish: [],
    errors: [],
    before: {},
    after: {},
  };

  async function unpublishEntity(entityType, row, reason) {
    if (DRY_RUN) {
      report.unpublish.push({ entity_type: entityType, id: row.id, label: row.label, reason, action: 'dry_run' });
      console.log('[dry-run]', entityType, row.id, row.label, reason);
      return;
    }
    const r = await client.req(
      'POST',
      `/api/v1/admin/official/public-operations/entities/${entityType}/${row.id}/unpublish`,
      {},
      adminTok
    );
    if (r.status >= 200 && r.status < 300) {
      report.unpublish.push({ entity_type: entityType, id: row.id, label: row.label, reason, status: r.status });
      console.log('OK unpublish', entityType, row.id, row.label);
    } else {
      report.errors.push({ entity_type: entityType, id: row.id, status: r.status, body: r.json });
      console.log('ERR unpublish', entityType, row.id, r.status);
    }
  }

  for (const et of ['guides', 'market_listings']) {
    const q = await client.req(
      'GET',
      `/api/v1/admin/official/public-operations/publish-queue?entity_type=${et}&limit=500`,
      null,
      adminTok
    );
    const published = (q.json.items || []).filter((x) => x.display_status === 'published');
    const ocsSet = et === 'guides' ? ocs.guides : ocs.listings;
    report.before[`publish_queue_${et}`] = published.length;
    const toDrop = published.filter((row) => !ocsSet.has(row.id));
    for (const row of toDrop) {
      const reason = isCanonicalGuideId(row.id) ? 'CANONICAL_SHOWCASE' : row.data_origin === 'test' ? 'TEST_SEED' : 'LEGACY_PRODUCTION';
      await unpublishEntity(et, row, reason);
    }
  }

  const pubGuides = await client.req('GET', '/api/v1/guides?limit=500');
  const guideExtras = (pubGuides.json.items || []).filter((g) => !ocs.guides.has(g.id));
  for (const g of guideExtras) {
    await unpublishEntity('guides', { id: g.id, label: g.city }, 'PUBLIC_API_EXTRA');
  }

  const prov = await client.req('GET', '/api/v1/market/provider/listings?limit=500');
  const provExtras = (prov.json.items || []).filter((r) => !ocs.listings.has(r.id));
  for (const r of provExtras) {
    await unpublishEntity('market_listings', { id: r.id, label: r.payload?.title || r.id }, 'PUBLIC_API_EXTRA');
  }

  const acq = await client.req('GET', '/api/v1/market/acquisition/listings?limit=500');
  const acqExtras = (acq.json.items || []).filter((r) => !ocs.listings.has(r.id));
  for (const r of acqExtras) {
    await unpublishEntity('market_listings', { id: r.id, label: r.payload?.title || r.id }, 'PUBLIC_API_EXTRA');
  }

  report.after = {
    guides_public: ((await client.req('GET', '/api/v1/guides?limit=500')).json.items || []).length,
    provider_public: ((await client.req('GET', '/api/v1/market/provider/listings?limit=500')).json.items || []).length,
    acquisition_public: ((await client.req('GET', '/api/v1/market/acquisition/listings?limit=500')).json.items || []).length,
    publish_queue_guides: report.before.publish_queue_guides,
    publish_queue_listings: report.before.publish_queue_market_listings,
  };

  for (const et of ['guides', 'market_listings']) {
    const q = await client.req(
      'GET',
      `/api/v1/admin/official/public-operations/publish-queue?entity_type=${et}&limit=500`,
      null,
      adminTok
    );
    report.after[`publish_queue_${et}`] = (q.json.items || []).filter((x) => x.display_status === 'published').length;
  }

  if (OUT) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  }

  console.log('SOB align done', JSON.stringify(report.after));
  if (report.errors.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
