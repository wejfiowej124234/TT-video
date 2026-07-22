#!/usr/bin/env node
/**
 * Lock Staging deployed campaigns to dataset.v1.json 10 names (②).
 * Canonical 20260708 state.json has empty campaigns{} — UUID align cannot run.
 * Match by campaign name; keep one deployed row per dataset name; rollback extras.
 *
 *   STAGING_RC_BASELINE_ALIGNING=1 node scripts/dev/lock-staging-campaigns-10-by-dataset.cjs
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const { isDeployedCampaign } = require('./lib/staging-rc-public-surface-unified.cjs');
const { assertStagingBaselineMutationAuthorized } = require('./lib/staging-rc-baseline-authorize.cjs');

assertStagingBaselineMutationAuthorized('lock_campaigns_by_dataset');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const DRY_RUN = process.env.DRY_RUN === '1';
const OUT = process.env.OUT || '';
const EXPECTED = 10;

const client = createClient(API);

function normName(s) {
  return String(s || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

(async () => {
  const dataset = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'data/official-cold-start/dataset.v1.json'), 'utf8')
  );
  const wantNames = (dataset.campaigns || []).map((c) => String(c.name || '').trim()).filter(Boolean);
  if (wantNames.length !== EXPECTED) {
    console.error(`lock-campaigns: dataset campaigns=${wantNames.length} expected ${EXPECTED}`);
    process.exit(1);
  }

  const adminTok = await client.adminLogin(
    process.env.ADMIN_EMAIL || 'tourist@test.com',
    process.env.ADMIN_PASS || 'Test123!'
  );
  const campR = await client.req(
    'GET',
    '/api/v1/admin/official/public-operations/campaigns?limit=500',
    null,
    adminTok
  );
  const items = campR.json.items || [];
  const deployed = items.filter(isDeployedCampaign);

  /** @type {Map<string, any>} */
  const keepByName = new Map();
  for (const name of wantNames) {
    const nn = normName(name);
    const matches = deployed
      .filter((r) => normName(r.name) === nn)
      .sort((a, b) => String(b.deployed_at || '').localeCompare(String(a.deployed_at || '')));
    if (matches[0]) keepByName.set(name, matches[0]);
  }

  // Prefer PER COS / home_hero if a dataset name had no match — fill gaps from home_hero newest
  if (keepByName.size < EXPECTED) {
    const keptIds = new Set([...keepByName.values()].map((r) => String(r.id)));
    const fillers = deployed
      .filter((r) => !keptIds.has(String(r.id)))
      .filter((r) => (r.surfaces || []).includes('home_hero'))
      .sort((a, b) => String(b.deployed_at || '').localeCompare(String(a.deployed_at || '')));
    for (const row of fillers) {
      if (keepByName.size >= EXPECTED) break;
      const slot = wantNames.find((n) => !keepByName.has(n));
      if (!slot) break;
      keepByName.set(slot, row);
    }
  }

  const keepIds = new Set([...keepByName.values()].map((r) => String(r.id)));
  const toRollback = deployed.filter((r) => !keepIds.has(String(r.id)));

  const report = {
    schema: 'traveltrust.lock_staging_campaigns_10_by_dataset.v1',
    recorded_at: new Date().toISOString(),
    dry_run: DRY_RUN,
    dataset_names: wantNames,
    deployed_before: deployed.length,
    keep: [...keepByName.entries()].map(([name, row]) => ({
      dataset_name: name,
      id: row.id,
      name: row.name,
      surfaces: row.surfaces,
    })),
    rollback: [],
    errors: [],
  };

  console.log(
    `lock-campaigns: deployed=${deployed.length} keep=${keepIds.size} rollback=${toRollback.length}`
  );

  for (const row of toRollback) {
    if (DRY_RUN) {
      report.rollback.push({ id: row.id, name: row.name, action: 'dry_run' });
      continue;
    }
    const r = await client.rollbackCampaign(adminTok, row.id);
    if (r.status >= 200 && r.status < 300) {
      report.rollback.push({ id: row.id, name: row.name, action: 'rollback', status: r.status });
      console.log('OK rollback', row.id, row.name);
    } else {
      report.errors.push({ id: row.id, action: 'rollback', status: r.status, body: r.json });
      console.log('ERR rollback', row.id, r.status, JSON.stringify(r.json).slice(0, 120));
    }
  }

  const afterR = await client.req(
    'GET',
    '/api/v1/admin/official/public-operations/campaigns?limit=500',
    null,
    adminTok
  );
  const deployedAfter = (afterR.json.items || []).filter(isDeployedCampaign);
  report.deployed_after = deployedAfter.length;
  report.ok = deployedAfter.length === EXPECTED && report.errors.length === 0 && keepIds.size === EXPECTED;

  if (OUT) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  }

  console.log(
    `lock-campaigns: deployed_after=${deployedAfter.length} ok=${report.ok} keep=${keepIds.size}`
  );
  if (!report.ok) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
