#!/usr/bin/env node
/**
 * Align Staging public guides catalog to OCS baseline only.
 * Unpublishes legacy canonical showcase + test guides still on public catalog.
 *
 *   STATE=evidence/GO_official_cold_start_dataset/<UTC>/state.json \
 *   node scripts/dev/align-ocs-staging-guides-public-catalog.cjs
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const { isCanonicalGuideId } = require('./lib/smoke-data-heuristics.cjs');
const { assertStagingBaselineMutationAuthorized } = require('./lib/staging-rc-baseline-authorize.cjs');

assertStagingBaselineMutationAuthorized('align_guides');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const STATE_PATH = process.env.STATE || '';
const DRY_RUN = process.env.DRY_RUN === '1';
const OUT = process.env.ALIGN_EVIDENCE_JSON || '';

const client = createClient(API);

(async () => {
  if (!STATE_PATH || !fs.existsSync(STATE_PATH)) {
    console.error('align-ocs-guides: missing STATE path');
    process.exit(1);
  }
  const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  const ocsGuideIds = new Set(Object.values(state.guides || {}).map((g) => g.id).filter(Boolean));
  if (ocsGuideIds.size < 10) {
    console.error('align-ocs-guides: expected 10 OCS guides in state');
    process.exit(1);
  }

  const adminTok = await client.adminLogin(process.env.ADMIN_EMAIL || 'tourist@test.com', process.env.ADMIN_PASS || 'Test123!');
  const q = await client.req(
    'GET',
    '/api/v1/admin/official/public-operations/publish-queue?entity_type=guides&limit=500',
    null,
    adminTok
  );
  const published = (q.json.items || []).filter((x) => x.display_status === 'published');
  const toUnpublish = published.filter((row) => !ocsGuideIds.has(row.id));

  const report = {
    schema: 'traveltrust.ocs_staging_guides_catalog_align.v1',
    recorded_at: new Date().toISOString(),
    ocs_guide_count: ocsGuideIds.size,
    published_before: published.length,
    unpublish_candidates: toUnpublish.map((r) => ({
      id: r.id,
      label: r.label,
      data_origin: r.data_origin,
      canonical: isCanonicalGuideId(r.id),
    })),
    unpublish: [],
    errors: [],
    dry_run: DRY_RUN,
  };

  const toPublish = (q.json.items || []).filter(
    (row) => ocsGuideIds.has(row.id) && row.display_status !== 'published'
  );

  console.log(
    `align-ocs-guides: published=${published.length} ocs=${ocsGuideIds.size} unpublish=${toUnpublish.length} publish=${toPublish.length}`
  );

  for (const row of toUnpublish) {
    if (DRY_RUN) {
      report.unpublish.push({ id: row.id, label: row.label, action: 'dry_run' });
      console.log('[dry-run] unpublish', row.id, row.label);
      continue;
    }
    const r = await client.req(
      'POST',
      `/api/v1/admin/official/public-operations/entities/guides/${row.id}/unpublish`,
      {},
      adminTok
    );
    if (r.status >= 200 && r.status < 300) {
      report.unpublish.push({ id: row.id, label: row.label, action: 'unpublish', status: r.status });
      console.log('OK unpublish', row.id, row.label);
    } else {
      report.errors.push({ id: row.id, status: r.status, body: r.json });
      console.log('ERR unpublish', row.id, r.status);
    }
  }

  report.publish = [];
  for (const row of toPublish) {
    if (DRY_RUN) {
      report.publish.push({ id: row.id, label: row.label, action: 'dry_run' });
      console.log('[dry-run] publish', row.id, row.label);
      continue;
    }
    const r = await client.publishEntity(adminTok, 'guides', row.id);
    if (r.status >= 200 && r.status < 300) {
      report.publish.push({ id: row.id, label: row.label, action: 'publish', status: r.status });
      await client.setSurfaces(adminTok, 'guides', row.id, ['market_feed']);
      console.log('OK publish', row.id, row.label);
    } else {
      report.errors.push({ id: row.id, action: 'publish', status: r.status, body: r.json });
      console.log('ERR publish', row.id, r.status);
    }
  }

  report.surface_fix = [];
  const publishedOcs = (q.json.items || []).filter(
    (row) => ocsGuideIds.has(row.id) && row.display_status === 'published'
  );
  for (const row of publishedOcs) {
    const surfaces = row.display_surfaces || [];
    if (surfaces.includes('market_feed')) continue;
    if (DRY_RUN) {
      report.surface_fix.push({ id: row.id, action: 'dry_run' });
      continue;
    }
    const r = await client.setSurfaces(adminTok, 'guides', row.id, ['market_feed']);
    if (r.status >= 200 && r.status < 300) {
      report.surface_fix.push({ id: row.id, action: 'set_market_feed', status: r.status });
      console.log('OK surface market_feed', row.id);
    } else {
      report.errors.push({ id: row.id, action: 'surface', status: r.status, body: r.json });
    }
  }

  const pubAfter = await client.req('GET', '/api/v1/guides?limit=300');
  const items = pubAfter.json.items || pubAfter.json.guides || [];
  const extrasOnPublic = items.filter((g) => !ocsGuideIds.has(g.id));

  // C3 / legacy seeds may leak via TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET even when publish-queue hidden
  for (const g of extrasOnPublic) {
    if (DRY_RUN) {
      report.unpublish.push({ id: g.id, city: g.city, action: 'dry_run_public_extra' });
      console.log('[dry-run] public extra (needs SEED_GUIDE_PUBLIC_MARKET=0 or API redeploy)', g.id, g.city);
      continue;
    }
    const r = await client.req(
      'POST',
      `/api/v1/admin/official/public-operations/entities/guides/${g.id}/unpublish`,
      {},
      adminTok
    );
    if (r.status >= 200 && r.status < 300) {
      report.unpublish.push({ id: g.id, city: g.city, action: 'unpublish_public_extra', status: r.status });
      console.log('OK unpublish public extra', g.id, g.city);
    } else {
      report.errors.push({ id: g.id, status: r.status, body: r.json, note: 'public_extra_may_need_seed_guide_public_market_0' });
      console.log('ERR unpublish public extra', g.id, r.status);
    }
  }

  const pubFinal = await client.req('GET', '/api/v1/guides?limit=300');
  const finalItems = pubFinal.json.items || pubFinal.json.guides || [];
  report.public_after = {
    count: finalItems.length,
    ocs_only: finalItems.every((g) => ocsGuideIds.has(g.id)),
    cities: finalItems.map((g) => g.city),
    extras_before_fix: extrasOnPublic.map((g) => ({ id: g.id, city: g.city, data_origin: g.data_origin })),
  };

  const byCity = {};
  for (const g of finalItems) {
    const c = (g.city || '?').trim();
    byCity[c] = (byCity[c] || 0) + 1;
  }
  report.duplicate_cities_after = Object.entries(byCity).filter(([, n]) => n > 1);

  if (OUT) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  }

  console.log(`align-ocs-guides: public_after=${finalItems.length} dup_cities=${report.duplicate_cities_after.length}`);
  if (report.errors.length) process.exit(1);
  if (finalItems.length !== ocsGuideIds.size || report.duplicate_cities_after.length) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
