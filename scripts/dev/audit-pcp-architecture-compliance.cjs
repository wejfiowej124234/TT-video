#!/usr/bin/env node
/**
 * TT_PCP_ARCHITECTURE_COMPLIANCE — Community public read path audit (Phase 0.5).
 *
 * Validates:
 *   1. Public catalog surfaces read governed_community_posts_v1 (P2)
 *   2. FeedBuilder has no governance business rules (display_status / surface / tier)
 *   3. Public detail route uses Governed View for non-owner reads
 *
 *   node scripts/dev/audit-pcp-architecture-compliance.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const STAMP = process.env.AUDIT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const EVID_DIR = path.join(ROOT, 'evidence', 'GO_public_content_platform', STAMP);

const GOVERNED = 'governed_community_posts_v1';
const RAW = 'FROM community_posts';

function read(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function fnBody(src, fnName) {
  const marker = `pub async fn ${fnName}(`;
  const start = src.indexOf(marker);
  if (start < 0) return '';
  const rest = src.slice(start);
  const nextPub = rest.indexOf('\npub async fn ', 1);
  return nextPub >= 0 ? rest.slice(0, nextPub) : rest;
}

function usesGoverned(body) {
  return body.includes(GOVERNED);
}

function usesRawCommunityPosts(body) {
  return /FROM community_posts/i.test(body);
}

function checkSurface(id, label, body, opts = {}) {
  const { allowRaw = false, note = null } = opts;
  let status = 'PASS';
  let detail = note || 'Uses Governed View';

  if (!body) {
    status = 'FAIL';
    detail = 'Function body not found';
  } else if (!usesGoverned(body)) {
    status = 'FAIL';
    detail = `Missing ${GOVERNED}`;
  } else if (usesRawCommunityPosts(body) && !allowRaw) {
    status = 'WARN';
    detail = 'Uses Governed View but also references raw community_posts';
  }

  return { id, label, status, detail };
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function run() {
  const community = read('crates/api/src/db/community.rs');
  const posts = read('crates/api/src/routes/community/posts.rs');
  const feedBuilder = read('crates/api/src/pcp/feed_builder.rs');

  const surfaces = [
    checkSurface('community_feed', 'Community Feed', fnBody(community, 'list_feed')),
    checkSurface('community_feed_hot', 'Community Feed (hot)', fnBody(community, 'list_feed_hot')),
    checkSurface(
      'community_feed_following',
      'Community Feed (following)',
      fnBody(community, 'list_feed_by_following'),
    ),
    checkSurface(
      'community_post_detail',
      'Community Post Detail (governed read)',
      fnBody(community, 'get_governed_public_post_by_id'),
    ),
    checkSurface(
      'community_user_profile_timeline',
      'User Profile Timeline (public_only)',
      fnBody(community, 'list_posts_by_user'),
    ),
    checkSurface(
      'community_explore_destinations',
      'Explore Destinations',
      fnBody(community, 'list_explore_destination_counts'),
    ),
    checkSurface(
      'community_posts_by_tag_stats',
      'Posts-by-tag public count',
      fnBody(community, 'count_public_posts_with_tag'),
    ),
  ];

  const routeDetailPass = posts.includes('get_governed_public_post_by_id');
  surfaces.push({
    id: 'community_post_detail_route',
    label: 'GET /posts/:id non-owner path',
    status: routeDetailPass ? 'PASS' : 'FAIL',
    detail: routeDetailPass
      ? 'Route delegates public read to get_governed_public_post_by_id'
      : 'Route still reads raw community_posts for public catalog',
  });

  const builderForbidden = ['display_status', 'display_surfaces', 'entity_visible_on_public_surface', 'content_tier'];
  const builderViolations = builderForbidden.filter((k) => feedBuilder.includes(k));
  const builderCheck = {
    id: 'feed_builder_purity',
    label: 'FeedBuilder — no governance rules',
    status: builderViolations.length === 0 ? 'PASS' : 'FAIL',
    detail:
      builderViolations.length === 0
        ? 'Builder re-exports db feed queries only'
        : `Forbidden governance tokens in feed_builder: ${builderViolations.join(', ')}`,
  };

  const marketBuilderPcp = exists('crates/api/src/pcp/market_builder.rs');
  const campaignBuilderPcp = exists('crates/api/src/pcp/campaign_builder.rs');
  const expectedDifferences = [
    {
      id: 'author_raw_read',
      label: 'Author/owner reads (get_post_by_id, me/posts)',
      status: 'EXPECTED',
      detail: 'Non-catalog authenticated paths may read community_posts',
    },
    {
      id: 'viewer_non_production_supplement',
      label: 'list_viewer_own_non_production_feed_supplement',
      status: 'EXPECTED',
      detail: 'Dev/test supplement for viewer own non-production posts — not public catalog',
    },
    {
      id: 'market_builder',
      label: 'MarketBuilder',
      status: marketBuilderPcp ? 'PASS' : 'REFERENCE',
      detail: marketBuilderPcp
        ? 'pcp/market_builder.rs + governed_market_* (Phase 1 Batch 1)'
        : 'Reference implementation — report-only in Phase 0.5',
    },
    {
      id: 'campaign_builder',
      label: 'CampaignBuilder',
      status: campaignBuilderPcp ? 'PASS' : 'PARTIAL',
      detail: campaignBuilderPcp
        ? 'pcp/campaign_builder.rs + governed_campaign_* (Phase 1 Batch 2)'
        : 'Cold-start consumer path — separate audit in OCIP',
    },
  ];

  const allChecks = [...surfaces, builderCheck];
  const blocking = allChecks.filter((c) => c.status === 'FAIL');
  const overall = blocking.length === 0 ? 'PASS' : 'FAIL';

  const report = {
    audit: 'TT_PCP_ARCHITECTURE_COMPLIANCE',
    phase: '0.5',
    stamp: STAMP,
    overall,
    principle: 'P2 — All Public APIs consume Governed Views only',
    governed_view: GOVERNED,
    surfaces: allChecks,
    expected_differences: expectedDifferences,
    phase_1_deferred: [
      'SearchBuilder',
      'RecommendationBuilder',
      'trait PublicBuilder abstraction',
    ],
    summary: {
      pass: allChecks.filter((c) => c.status === 'PASS').length,
      warn: allChecks.filter((c) => c.status === 'WARN').length,
      fail: blocking.length,
    },
  };

  fs.mkdirSync(EVID_DIR, { recursive: true });
  const outPath = path.join(EVID_DIR, 'phase0.5-architecture-validation.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');

  console.log(`\n=== ${report.audit} · ${overall} ===\n`);
  for (const s of allChecks) {
    console.log(`  [${s.status.padEnd(4)}] ${s.label}`);
    if (s.status !== 'PASS') console.log(`         ${s.detail}`);
  }
  console.log(`\nEvidence: ${path.relative(ROOT, outPath)}`);
  console.log(`Phase 1 deferred until validation PASS: ${report.phase_1_deferred.join(', ')}\n`);

  process.exit(blocking.length === 0 ? 0 : 1);
}

run();
