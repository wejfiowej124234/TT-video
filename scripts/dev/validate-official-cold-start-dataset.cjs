#!/usr/bin/env node
/**
 * OCS Phase 1 acceptance: Coverage + Surface Coverage + chain spot checks.
 *
 *   API=https://tt-api-staging.fly.dev STATE=evidence/.../state.json node scripts/dev/validate-official-cold-start-dataset.cjs
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const { isSmokeContent } = require('./lib/smoke-data-heuristics.cjs');

const ROOT = path.join(__dirname, '../..');
const MANIFEST = path.join(ROOT, 'data/official-cold-start/dataset.v1.json');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const STATE_PATH = process.env.STATE || '';
const WEB = (process.env.WEB_BASE || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');
const OUT = process.env.OCS_VALIDATE_JSON || '';

const dataset = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const state = STATE_PATH && fs.existsSync(STATE_PATH) ? JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')) : null;
const client = createClient(API);

const issues = [];

function fail(id, msg) {
  issues.push({ id, severity: 'blocking', msg });
}

function warn(id, msg) {
  issues.push({ id, severity: 'enhancement', msg });
}

(async () => {
  const C3_EMAIL = process.env.C3_EMAIL || 'guide@test.com';
  let c3GuideId = '';
  try {
    const c3Tok = await client.userLogin(C3_EMAIL, process.env.C3_PASS || 'Test123!');
    const me = await client.req('GET', '/api/v1/me', null, c3Tok);
    c3GuideId = me.json.user?.guide_id || me.json.guide?.id || me.json.guide_id || '';
  } catch {
    /* optional */
  }
  const adminTok = await client.adminLogin(process.env.ADMIN_EMAIL || 'tourist@test.com', process.env.ADMIN_PASS || 'Test123!');

  const expectedChains = dataset.chains.length;
  const expectedOps = dataset.ops_accounts.length;
  const expectedCampaigns = dataset.campaigns.length;

  let chainComplete = 0;
  const chainReport = [];

  if (!state) {
    fail('STATE', 'missing state.json — run apply first');
  } else {
    const opsFound = dataset.ops_accounts.filter((o) => state.accounts[o.slug]?.id).length;
    if (opsFound < expectedOps) fail('COVERAGE_OPS', `ops accounts ${opsFound}/${expectedOps}`);

    for (const chain of dataset.chains) {
      const g = state.guides[`guide:${chain.id}`]?.id;
      const p = state.listings[`provider:${chain.id}`]?.id;
      const a = state.listings[`acquisition:${chain.id}`]?.id;
      const og = state.official_guides[`official_guide:${chain.id}`]?.id;
      const cp = chain.community_post
        ? state.community_posts[`community_post:${chain.id}`]?.id
        : true;
      const ok = !!(g && p && a && og && cp);
      if (ok) chainComplete += 1;
      chainReport.push({
        chain: chain.id,
        guide: g,
        provider: p,
        acquisition: a,
        official_guide: og,
        community_post: chain.community_post ? cp : 'n/a',
        complete: ok,
      });
      if (!ok) {
        fail(
          `CHAIN_${chain.id}`,
          `incomplete chain guide=${!!g} provider=${!!p} acquisition=${!!a} og=${!!og} cp=${chain.community_post ? !!cp : 'n/a'}`
        );
      }
    }

    const campaignsFound = dataset.campaigns.filter((c) => state.campaigns[c.id]?.id).length;
    if (campaignsFound < expectedCampaigns) fail('COVERAGE_CAMPAIGNS', `campaigns ${campaignsFound}/${expectedCampaigns}`);
  }

  const coverage = {
    ops_accounts: `${dataset.ops_accounts.filter((o) => state?.accounts[o.slug]?.id).length || 0}/${expectedOps}`,
    chains_complete: `${chainComplete}/${expectedChains}`,
    campaigns: `${dataset.campaigns.filter((c) => state?.campaigns[c.id]?.id).length || 0}/${expectedCampaigns}`,
  };

  const pubGuides = await client.req('GET', '/api/v1/guides?limit=200');
  const guideItems = pubGuides.json.items || pubGuides.json.guides || [];
  const ocsGuides = guideItems.filter((g) => {
    const b = `${g.bio || ''} ${g.city || ''}`.toLowerCase();
    return !isSmokeContent(g) && g.data_origin === 'production';
  });

  const provider = await client.req('GET', '/api/v1/market/provider/listings?limit=100');
  const providerItems = provider.json.items || provider.json.listings || [];
  const prodProviders = providerItems.filter((r) => r.data_origin === 'production' || !isSmokeContent(r));

  const acquisition = await client.req('GET', '/api/v1/market/acquisition/listings?limit=100');
  const acqItems = acquisition.json.items || acquisition.json.listings || [];
  const prodAcq = acqItems.filter((r) => r.data_origin === 'production' || !isSmokeContent(r));

  const campaigns = await client.req('GET', '/api/v1/admin/official/public-operations/campaigns?limit=50', null, adminTok);
  const campaignItems = campaigns.json.items || [];
  const deployedCampaigns = campaignItems.filter((c) => c.publish_status === 'published' || c.status === 'deployed');

  const coldStart = await client.req('GET', '/api/v1/official/cold-start/surfaces/home_hero');
  const coldStartOk = coldStart.status === 200;

  const feed = await client.req('GET', '/api/v1/community/feed?limit=20');
  const feedPosts = feed.json.posts || feed.json.items || [];
  const prodFeedPosts = feedPosts.filter((p) => p.data_origin === 'production' || !isSmokeContent(p));

  const stats = await client.req('GET', '/api/v1/admin/official/public-operations/stats', null, adminTok);

  const expectedCommunityPosts = dataset.chains.filter((c) => c.community_post).length;

  const surfaces = {
    guides_public: { count: guideItems.length, production: ocsGuides.length, ok: ocsGuides.length >= 10 },
    provider_public: { count: providerItems.length, production: prodProviders.length, ok: prodProviders.length >= 1 },
    acquisition_public: { count: acqItems.length, production: prodAcq.length, ok: prodAcq.length >= 1 },
    campaigns_deployed: { count: deployedCampaigns.length, ok: deployedCampaigns.length >= 1 },
    community_feed: {
      count: feedPosts.length,
      production: prodFeedPosts.length,
      expected_ocs_min: expectedCommunityPosts,
      ok: prodFeedPosts.length >= Math.min(3, expectedCommunityPosts),
    },
    cold_start_home: { ok: coldStartOk, status: coldStart.status },
    admin_stats: { ok: stats.status === 200 },
  };

  for (const [k, v] of Object.entries(surfaces)) {
    if (v.ok === false) fail(`SURFACE_${k.toUpperCase()}`, JSON.stringify(v));
  }

  for (const row of guideItems) {
    if (c3GuideId && row.id === c3GuideId) continue;
    if (isSmokeContent(row)) fail('LEAK_SMOKE_GUIDE', row.id || row.bio?.slice(0, 40));
    if (row.data_origin === 'test' || row.data_origin === 'demo') warn('EXPECTED_OR_LEAK', `guide ${row.id} origin=${row.data_origin}`);
  }

  const blocking = issues.filter((i) => i.severity === 'blocking').length;
  const payload = {
    schema: 'traveltrust.official_cold_start_dataset.validation.v1',
    api: API,
    web: WEB,
    recorded_at: new Date().toISOString(),
    verdict: blocking === 0 ? 'PASS' : 'FAIL',
    coverage,
    chain_report: chainReport,
    surfaces,
    issues,
  };

  if (OUT) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');
  }

  console.log(`OCS_VALIDATE_VERDICT: ${payload.verdict} blocking=${blocking}`);
  console.log(`  Coverage chains: ${coverage.chains_complete} ops: ${coverage.ops_accounts} campaigns: ${coverage.campaigns}`);
  console.log(`  Surfaces: guides=${surfaces.guides_public.production} provider=${surfaces.provider_public.production} acquisition=${surfaces.acquisition_public.production} community_feed=${surfaces.community_feed.production} campaigns=${surfaces.campaigns_deployed.count}`);
  for (const i of issues) console.log(`${i.severity} ${i.id} ${i.msg}`);
  if (blocking) process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
