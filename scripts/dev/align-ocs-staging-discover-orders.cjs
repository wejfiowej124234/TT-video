#!/usr/bin/env node
/**
 * Align Staging discover public surface — unpublish non-OCS / smoke orders (Baseline discover smoke=0).
 *
 *   STATE=evidence/.../state.json node scripts/dev/align-ocs-staging-discover-orders.cjs
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const { isSmokeContent, isNonProductionOrigin } = require('./lib/smoke-data-heuristics.cjs');
const { assertStagingBaselineMutationAuthorized } = require('./lib/staging-rc-baseline-authorize.cjs');

assertStagingBaselineMutationAuthorized('align_discover_orders');

const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const STATE_PATH = process.env.STATE || process.env.OCS_STATE || '';
const DRY_RUN = process.env.DRY_RUN === '1';
const OUT = process.env.ALIGN_EVIDENCE_JSON || '';

const client = createClient(API);

(async () => {
  const ocsOrderIds = new Set();
  if (STATE_PATH && fs.existsSync(STATE_PATH)) {
    try {
      const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
      for (const v of Object.values(state.orders || {})) {
        if (v?.id) ocsOrderIds.add(String(v.id));
      }
    } catch {
      /* optional state.orders */
    }
  }

  const adminTok = await client.adminLogin(
    process.env.ADMIN_EMAIL || 'tourist@test.com',
    process.env.ADMIN_PASS || 'Test123!'
  );
  const q = await client.req(
    'GET',
    '/api/v1/admin/official/public-operations/publish-queue?entity_type=orders&limit=500',
    null,
    adminTok
  );
  const published = (q.json.items || []).filter((x) => x.display_status === 'published');
  const toUnpublish = published.filter((row) => {
    if (ocsOrderIds.has(String(row.id))) return false;
    if (isNonProductionOrigin(row.data_origin || '')) return true;
    if (isSmokeContent(row)) return true;
    return true;
  });

  const report = {
    schema: 'traveltrust.ocs_staging_discover_orders_align.v1',
    recorded_at: new Date().toISOString(),
    ocs_order_ids: ocsOrderIds.size,
    published_before: published.length,
    unpublish: [],
    errors: [],
    dry_run: DRY_RUN,
  };

  console.log(
    `align-ocs-discover: published=${published.length} unpublish=${toUnpublish.length} ocs_orders=${ocsOrderIds.size}`
  );

  for (const row of toUnpublish) {
    if (DRY_RUN) {
      report.unpublish.push({ id: row.id, label: row.label, action: 'dry_run' });
      continue;
    }
    const r = await client.unpublishEntity(adminTok, 'orders', row.id);
    if (r.status >= 200 && r.status < 300) {
      report.unpublish.push({ id: row.id, label: row.label, action: 'unpublish', status: r.status });
      console.log('OK unpublish order', row.id, row.label);
    } else {
      report.errors.push({ id: row.id, status: r.status, body: r.json });
      console.log('ERR unpublish', row.id, r.status);
    }
  }

  const disc = await client.req('GET', '/api/v1/discover/orders?limit=50', null, adminTok);
  const publicAfter = disc.json.items || [];
  report.public_after = publicAfter.length;
  report.ok = publicAfter.length === 0 && report.errors.length === 0;

  if (OUT) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  }

  console.log(`align-ocs-discover: public_after=${publicAfter.length}`);
  if (!report.ok) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
