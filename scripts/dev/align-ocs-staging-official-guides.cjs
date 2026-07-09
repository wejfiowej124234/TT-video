#!/usr/bin/env node
/**
 * Align Staging official guides admin catalog to OCS baseline only (10 published).
 *
 *   STATE=evidence/.../state.json node scripts/dev/align-ocs-staging-official-guides.cjs
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const { isSmokeContent } = require('./lib/smoke-data-heuristics.cjs');
const {
  loadUnifiedBaseline,
  isPublishedOfficialGuide,
} = require('./lib/staging-rc-public-surface-unified.cjs');
const { assertStagingBaselineMutationAuthorized } = require('./lib/staging-rc-baseline-authorize.cjs');

assertStagingBaselineMutationAuthorized('align_official_guides');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const STATE_PATH = process.env.STATE || process.env.OCS_STATE || '';
const DRY_RUN = process.env.DRY_RUN === '1';
const OUT = process.env.ALIGN_EVIDENCE_JSON || '';

const client = createClient(API);

(async () => {
  const baseline = loadUnifiedBaseline(ROOT);
  const statePath = STATE_PATH || baseline.ocs_state;
  if (!statePath || !fs.existsSync(statePath)) {
    console.error('align-ocs-official-guides: missing STATE');
    process.exit(1);
  }
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const ocsById = new Map();
  for (const v of Object.values(state.official_guides || {})) {
    if (v?.id) ocsById.set(String(v.id), v);
  }
  if (ocsById.size < baseline.expected.official_guides_published) {
    console.error(`align-ocs-official-guides: expected ${baseline.expected.official_guides_published} OCS, got ${ocsById.size}`);
    process.exit(1);
  }

  const adminTok = await client.adminLogin(
    process.env.ADMIN_EMAIL || 'tourist@test.com',
    process.env.ADMIN_PASS || 'Test123!'
  );
  const ogR = await client.req('GET', '/api/v1/admin/official/guides?limit=500', null, adminTok);
  const items = ogR.json.items || ogR.json.guides || [];
  const published = items.filter(isPublishedOfficialGuide);
  const toArchive = published.filter((row) => !ocsById.has(String(row.id)) || isSmokeContent(row));
  const toPublish = items.filter(
    (row) => ocsById.has(String(row.id)) && !isPublishedOfficialGuide(row)
  );

  const report = {
    schema: 'traveltrust.ocs_staging_official_guides_align.v1',
    recorded_at: new Date().toISOString(),
    ocs_official_guide_count: ocsById.size,
    published_before: published.length,
    archive: [],
    publish: [],
    errors: [],
    dry_run: DRY_RUN,
  };

  console.log(
    `align-ocs-official-guides: published=${published.length} ocs=${ocsById.size} archive=${toArchive.length} publish=${toPublish.length}`
  );

  for (const row of toArchive) {
    if (DRY_RUN) {
      report.archive.push({ id: row.id, title: row.title, action: 'dry_run' });
      continue;
    }
    const r = await client.archiveOfficialGuide(adminTok, row.id);
    if (r.status >= 200 && r.status < 300) {
      report.archive.push({ id: row.id, title: row.title, action: 'archive', status: r.status });
      console.log('OK archive', row.id, row.title);
    } else {
      report.errors.push({ id: row.id, action: 'archive', status: r.status, body: r.json });
      console.log('ERR archive', row.id, r.status);
    }
  }

  for (const row of toPublish) {
    if (DRY_RUN) {
      report.publish.push({ id: row.id, action: 'dry_run' });
      continue;
    }
    await client.submitOfficialGuideReview(adminTok, row.id);
    const r = await client.publishOfficialGuide(adminTok, row.id);
    if (r.status >= 200 && r.status < 300) {
      report.publish.push({ id: row.id, action: 'publish', status: r.status });
      console.log('OK publish', row.id);
    } else {
      report.errors.push({ id: row.id, action: 'publish', status: r.status, body: r.json });
    }
  }

  const ogAfter = await client.req('GET', '/api/v1/admin/official/guides?limit=500', null, adminTok);
  const publishedAfter = (ogAfter.json.items || ogAfter.json.guides || []).filter(isPublishedOfficialGuide);
  const extras = publishedAfter.filter((r) => !ocsById.has(String(r.id)));
  report.published_after = publishedAfter.length;
  report.extras_after = extras.map((r) => ({ id: r.id, title: r.title }));
  report.ok =
    publishedAfter.length === baseline.expected.official_guides_published &&
    extras.length === 0 &&
    report.errors.length === 0;

  if (OUT) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  }

  console.log(
    `align-ocs-official-guides: published_after=${publishedAfter.length} extras=${extras.length}`
  );
  if (!report.ok) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
