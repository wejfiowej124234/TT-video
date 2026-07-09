#!/usr/bin/env node
/**
 * Align Staging deployed campaigns to OCS baseline only (10 deployed).
 *
 *   STATE=evidence/.../state.json node scripts/dev/align-ocs-staging-campaigns.cjs
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const { isSmokeContent } = require('./lib/smoke-data-heuristics.cjs');
const {
  loadUnifiedBaseline,
  isDeployedCampaign,
} = require('./lib/staging-rc-public-surface-unified.cjs');
const { assertStagingBaselineMutationAuthorized } = require('./lib/staging-rc-baseline-authorize.cjs');

assertStagingBaselineMutationAuthorized('align_campaigns');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const STATE_PATH = process.env.STATE || process.env.OCS_STATE || '';
const DRY_RUN = process.env.DRY_RUN === '1';
const OUT = process.env.ALIGN_EVIDENCE_JSON || '';

const client = createClient(API);

function pgClient() {
  let Client;
  try {
    Client = require('pg').Client;
  } catch {
    Client = require(path.join(ROOT, 'frontend/node_modules/pg')).Client;
  }
  return Client;
}

async function reconcileRolledBackOcsCampaign(adminTok, campaignId, report) {
  const detail = await client.req(
    'GET',
    `/api/v1/admin/official/public-operations/campaigns/${campaignId}`,
    null,
    adminTok
  );
  const row = detail.json.item || detail.json;
  if (!row || String(row.status || '').toLowerCase() !== 'rolled_back') return false;

  const dsn = process.env.DATABASE_URL || process.env.STAGING_DATABASE_URL || '';
  if (dsn && String(row.publish_status || '').toLowerCase() === 'published') {
    try {
      const Client = pgClient();
      const pg = new Client({ connectionString: dsn });
      await pg.connect();
      await pg.query(
        `UPDATE ops_cold_start_campaigns SET publish_status = 'draft', updated_at = NOW() WHERE id = $1 AND status = 'rolled_back'`,
        [campaignId]
      );
      await pg.end();
      report.reconcile = report.reconcile || [];
      report.reconcile.push({ id: campaignId, action: 'sql_publish_status_draft' });
    } catch (e) {
      report.errors.push({
        id: campaignId,
        action: 'reconcile_sql',
        detail: String(e.message || e).slice(0, 120),
      });
      return false;
    }
  }

  const sr = await client.submitCampaignReview(adminTok, campaignId);
  if (sr.status < 200 || sr.status >= 300) {
    report.errors.push({ id: campaignId, action: 'submit_review', status: sr.status, body: sr.json });
    return false;
  }
  const dep = await client.deployCampaign(adminTok, campaignId);
  if (dep.status >= 200 && dep.status < 300) {
    report.deploy.push({ id: campaignId, action: 'redeploy_rolled_back', status: dep.status });
    console.log('OK redeploy rolled_back', campaignId);
    return true;
  }
  report.errors.push({ id: campaignId, action: 'redeploy', status: dep.status, body: dep.json });
  return false;
}

(async () => {
  const baseline = loadUnifiedBaseline(ROOT);
  const statePath = STATE_PATH || baseline.ocs_state;
  if (!statePath || !fs.existsSync(statePath)) {
    console.error('align-ocs-campaigns: missing STATE');
    process.exit(1);
  }
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const ocsById = new Map();
  for (const [slug, v] of Object.entries(state.campaigns || {})) {
    if (v?.id) ocsById.set(String(v.id), slug);
  }
  if (ocsById.size < baseline.expected.campaigns_deployed) {
    console.error(`align-ocs-campaigns: expected ${baseline.expected.campaigns_deployed} OCS, got ${ocsById.size}`);
    process.exit(1);
  }

  const adminTok = await client.adminLogin(
    process.env.ADMIN_EMAIL || 'tourist@test.com',
    process.env.ADMIN_PASS || 'Test123!'
  );
  const campR = await client.req(
    'GET',
    '/api/v1/admin/official/public-operations/campaigns?limit=200',
    null,
    adminTok
  );
  const items = campR.json.items || [];
  const deployed = items.filter(isDeployedCampaign);
  const legacyPublished = items.filter((row) => {
    if (ocsById.has(String(row.id))) return false;
    const st = String(row.status || '').toLowerCase();
    const pub = String(row.publish_status || '').toLowerCase();
    return st === 'rolled_back' || pub === 'published' || st === 'deployed';
  });
  const toRollback = deployed.filter((row) => !ocsById.has(String(row.id)) || isSmokeContent(row));
  const toArchive = legacyPublished.filter((row) => String(row.status || '').toLowerCase() !== 'archived');
  const toDeploy = items.filter(
    (row) => ocsById.has(String(row.id)) && !isDeployedCampaign(row)
  );

  const report = {
    schema: 'traveltrust.ocs_staging_campaigns_align.v1',
    recorded_at: new Date().toISOString(),
    ocs_campaign_count: ocsById.size,
    deployed_before: deployed.length,
    rollback: [],
    archive: [],
    deploy: [],
    errors: [],
    dry_run: DRY_RUN,
  };

  console.log(
    `align-ocs-campaigns: deployed=${deployed.length} ocs=${ocsById.size} rollback=${toRollback.length} archive=${toArchive.length} deploy=${toDeploy.length}`
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
      console.log('ERR rollback', row.id, r.status);
    }
  }

  for (const row of toArchive) {
    if (DRY_RUN) {
      report.archive.push({ id: row.id, name: row.name, action: 'dry_run' });
      continue;
    }
    const st = String(row.status || '').toLowerCase();
    if (st === 'deployed') {
      const rb = await client.rollbackCampaign(adminTok, row.id);
      if (rb.status < 200 || rb.status >= 300) {
        if (rb.json?.error !== 'not_deployed') {
          report.errors.push({ id: row.id, action: 'rollback_before_archive', status: rb.status, body: rb.json });
          continue;
        }
      }
    }
    const r = await client.archiveCampaign(adminTok, row.id);
    if (r.status >= 200 && r.status < 300) {
      report.archive.push({ id: row.id, name: row.name, action: 'archive', status: r.status });
      console.log('OK archive', row.id, row.name);
    } else {
      report.errors.push({ id: row.id, action: 'archive', status: r.status, body: r.json });
      console.log('ERR archive', row.id, r.status);
    }
  }

  for (const row of toDeploy) {
    if (DRY_RUN) {
      report.deploy.push({ id: row.id, action: 'dry_run' });
      continue;
    }
    if (String(row.status || '').toLowerCase() === 'rolled_back') {
      await reconcileRolledBackOcsCampaign(adminTok, row.id, report);
      continue;
    }
    const st = String(row.publish_status || row.status || '').toLowerCase();
    if (st === 'draft' || st === 'review') {
      await client.submitCampaignReview(adminTok, row.id);
    }
    const r = await client.deployCampaign(adminTok, row.id);
    if (r.status >= 200 && r.status < 300) {
      report.deploy.push({ id: row.id, slug: ocsById.get(String(row.id)), action: 'deploy', status: r.status });
      console.log('OK deploy', row.id, ocsById.get(String(row.id)));
    } else {
      report.errors.push({ id: row.id, action: 'deploy', status: r.status, body: r.json });
    }
  }

  const campAfter = await client.req(
    'GET',
    '/api/v1/admin/official/public-operations/campaigns?limit=200',
    null,
    adminTok
  );
  const deployedAfter = (campAfter.json.items || []).filter(isDeployedCampaign);
  const extras = deployedAfter.filter((r) => !ocsById.has(String(r.id)));
  report.deployed_after = deployedAfter.length;
  report.extras_after = extras.map((r) => ({ id: r.id, name: r.name }));
  report.ok =
    deployedAfter.length === baseline.expected.campaigns_deployed &&
    extras.length === 0 &&
    report.errors.length === 0;

  if (OUT) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  }

  console.log(`align-ocs-campaigns: deployed_after=${deployedAfter.length} extras=${extras.length}`);
  if (!report.ok) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
