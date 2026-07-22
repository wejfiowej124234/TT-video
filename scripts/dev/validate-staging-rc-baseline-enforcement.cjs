#!/usr/bin/env node
/**
 * TT_STAGING_RC_BASELINE enforcement · live Staging runtime must match OCS SSOT (② only).
 *
 *   node scripts/dev/validate-staging-rc-baseline-enforcement.cjs [EVID_DIR]
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { isStagingCorridorSmokeBody } = require('./lib/staging-corridor-smoke.cjs');
const { loadOcsEntityIds, isSmokeContent, isNonProductionOrigin } = require('./lib/smoke-data-heuristics.cjs');
const { loadUnifiedBaseline, isPublishedOfficialGuide, isDeployedCampaign } = require('./lib/staging-rc-public-surface-unified.cjs');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const WEB = (process.env.WEB || process.env.WEB_BASE || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');
const evidDir = process.argv[2] || process.env.RC_BASELINE_EVIDENCE_DIR || '';
const ACTIVE = path.join(ROOT, 'evidence/GO_staging_rc_baseline/ACTIVE.json');

function runParity(outDir) {
  const r = spawnSync(
    process.execPath,
    [path.join(ROOT, 'scripts/dev/validate-staging-rc-ssot-parity.cjs'), outDir || ''],
    {
      cwd: ROOT,
      encoding: 'utf8',
      env: {
        ...process.env,
        API_BASE: API,
        WEB_BASE: WEB,
        SSOT_EVIDENCE_DIR: outDir || '',
      },
    }
  );
  return { pass: r.status === 0, tail: (r.stdout || r.stderr || '').trim() };
}

(async () => {
  const baseline = loadUnifiedBaseline(ROOT);
  const {
    ocsGuideIds,
    ocsListingIds,
    ocsCommunityPostIds,
    ocsOfficialGuideIds,
    ocsCampaignIds,
    ocs_state,
    expected,
  } = baseline;
  const failures = [];
  const passes = [];

  if (fs.existsSync(ACTIVE)) {
    try {
      const active = JSON.parse(fs.readFileSync(ACTIVE, 'utf8'));
      if (active.status === 'READY' && active.machine_key === 'TT_STAGING_RC_BASELINE') {
        passes.push('active_pointer_ready');
      } else {
        failures.push(`active_status=${active.status || 'unknown'}`);
      }
    } catch {
      failures.push('active_pointer_parse');
    }
  } else {
    failures.push('missing_active_pointer');
  }

  const parity = runParity(evidDir);
  if (parity.pass) passes.push('ssot_parity');
  else failures.push('ssot_parity_fail');

  const http = API.startsWith('https') ? require('https') : require('http');
  const get = (urlPath) =>
    new Promise((resolve, reject) => {
      const u = new URL(API + urlPath);
      http
        .request({ hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method: 'GET' }, (res) => {
          let d = '';
          res.on('data', (c) => (d += c));
          res.on('end', () => {
            try {
              resolve(JSON.parse(d));
            } catch {
              resolve({ _raw: d.slice(0, 200) });
            }
          });
        })
        .on('error', reject)
        .end();
    });

  const feed = await get('/api/v1/community/feed?limit=50');
  const posts = feed.posts || [];
  for (const p of posts) {
    if (isStagingCorridorSmokeBody(p.body || '')) failures.push(`smoke_body=${p.id}`);
    if (isSmokeContent(p)) failures.push(`smoke_content=${p.id}`);
  }
  if (!failures.some((f) => f.startsWith('smoke_'))) passes.push('feed_no_smoke');

  const explore = await get('/api/v1/community/explore/destinations');
  if (explore.catalog !== 'api-aggregate-v1') {
    failures.push(`destinations_catalog=${explore.catalog || 'n/a'}`);
  } else {
    passes.push('destinations_api_aggregate');
  }

  try {
    const client = createClient(API);
    const adminTok = await client.adminLogin(
      process.env.ADMIN_EMAIL || 'tourist@test.com',
      process.env.ADMIN_PASS || 'Test123!'
    );
    for (const entityType of ['community_posts', 'guides', 'market_listings']) {
      const q = await client.req(
        'GET',
        `/api/v1/admin/official/public-operations/publish-queue?entity_type=${entityType}&limit=500`,
        null,
        adminTok
      );
      const published = (q.json.items || []).filter((r) => r.display_status === 'published');
      for (const row of published) {
        const id = String(row.id);
        const ocsOk =
          entityType === 'community_posts'
            ? ocsCommunityPostIds.has(id)
            : entityType === 'guides'
              ? ocsGuideIds.has(id)
              : ocsListingIds.has(id);
        if (!ocsOk) failures.push(`admin_published_non_ocs_${entityType}=${id}`);
        if (isStagingCorridorSmokeBody(row.body || row.label || '')) {
          failures.push(`admin_smoke_${entityType}=${id}`);
        }
        if (isSmokeContent(row) && isNonProductionOrigin(row.data_origin || '')) {
          failures.push(`admin_test_origin_${entityType}=${id}`);
        }
      }
    }
    if (!failures.some((f) => f.startsWith('admin_'))) passes.push('admin_queue_clean');

    const ogR = await client.req('GET', '/api/v1/admin/official/guides?limit=500', null, adminTok);
    let ogPublished = (ogR.json.items || ogR.json.guides || []).filter(isPublishedOfficialGuide);
    if (ogR.status === 404 || ogR.status === 405) {
      const q = await client.req(
        'GET',
        '/api/v1/admin/official/public-operations/publish-queue?entity_type=guides&limit=500',
        null,
        adminTok
      );
      ogPublished = (q.json.items || []).filter(
        (r) => String(r.display_status || '').toLowerCase() === 'published'
      );
      passes.push('official_guides_via_publish_queue');
    }
    for (const row of ogPublished) {
      const id = String(row.id);
      if (!ocsOfficialGuideIds.has(id) && !ocsGuideIds.has(id)) {
        failures.push(`admin_official_guide_non_ocs=${row.id}`);
      }
      if (isSmokeContent(row)) failures.push(`admin_official_guide_smoke=${row.id}`);
    }
    if (ogPublished.length !== expected.official_guides_published) {
      failures.push(`admin_official_guides_count=${ogPublished.length}`);
    }

    const campR = await client.req(
      'GET',
      '/api/v1/admin/official/public-operations/campaigns?limit=200',
      null,
      adminTok
    );
    const campDeployed = (campR.json.items || []).filter(isDeployedCampaign);
    for (const row of campDeployed) {
      if (ocsCampaignIds.size > 0 && !ocsCampaignIds.has(String(row.id))) {
        failures.push(`admin_campaign_non_ocs=${row.id}`);
      }
      if (isSmokeContent(row)) failures.push(`admin_campaign_smoke=${row.id}`);
    }
    if (campDeployed.length !== expected.campaigns_deployed) {
      failures.push(`admin_campaigns_deployed_count=${campDeployed.length}`);
    }
    if (
      !failures.some(
        (f) =>
          f.startsWith('admin_official_') ||
          f.startsWith('admin_campaign')
      )
    ) {
      passes.push('admin_official_campaign_clean');
    }
  } catch (e) {
    failures.push(`admin_queue_probe=${String(e.message || e).slice(0, 80)}`);
  }

  const report = {
    schema: 'traveltrust.staging_rc_baseline.enforcement.v1',
    recorded_at: new Date().toISOString(),
    api: API,
    web: WEB,
    ocs_state: ocs_state || null,
    registry: 'registry/staging-rc-baseline.v1.yaml',
    verdict: failures.length === 0 ? 'ENFORCED' : 'DRIFT',
    machine_keys: {
      TT_STAGING_RC_BASELINE: failures.length === 0 ? 'READY' : 'DRIFT',
      TT_STAGING_RC_SSOT_PARITY: parity.pass ? 'ALIGNED' : 'FAIL',
    },
    expected: {
      ...expected,
      ocs_listings: ocsListingIds.size,
      ocs_guides: ocsGuideIds.size,
      ocs_posts: ocsCommunityPostIds.size,
      ocs_official_guides: ocsOfficialGuideIds.size,
      ocs_campaigns: ocsCampaignIds.size,
    },
    unified_baseline: 'scripts/dev/lib/staging-rc-public-surface-unified.cjs',
    passes,
    failures,
    forbidden: [
      'historical_smoke_on_public_surfaces',
      'non_ocs_catalog_rows',
      'legacy_volume_media_404',
      'new_business_features',
    ],
    allowed_only: ['deployment_sync', 'production_cutover_prep', 'baseline_realignment'],
    honest_boundary: 'ENFORCED on Staging ≠ Production GO',
  };

  if (evidDir) {
    fs.mkdirSync(evidDir, { recursive: true });
    fs.writeFileSync(path.join(evidDir, 'staging-rc-baseline-enforcement.json'), JSON.stringify(report, null, 2) + '\n');
    fs.writeFileSync(
      path.join(evidDir, 'STATUS.txt'),
      `TT_STAGING_RC_BASELINE: ${report.machine_keys.TT_STAGING_RC_BASELINE}\nfailures=${failures.length}\n`
    );
  }

  console.log(`TT_STAGING_RC_BASELINE: ${report.machine_keys.TT_STAGING_RC_BASELINE}`);
  console.log(`TT_STAGING_RC_BASELINE_ENFORCEMENT: ${report.verdict}`);
  for (const f of failures) console.error(`FAIL: ${f}`);
  process.exit(failures.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
