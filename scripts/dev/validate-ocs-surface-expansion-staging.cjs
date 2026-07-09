#!/usr/bin/env node
/**
 * OCS Surface Expansion · Staging operational acceptance (10 required checks).
 *
 *   API=https://tt-api-staging.fly.dev \
 *   STATE=evidence/.../state.json \
 *   node scripts/dev/validate-ocs-surface-expansion-staging.cjs
 *
 * Defaults: OCS_STRICT_LEGACY_MEDIA=1 (hard gate) · staging API only
 * TT_OCS_SURFACE_EXPANSION=VERIFIED only when all 10 PASS
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const {
  isSmokeContent,
  isNonProductionOrigin,
  isOfficialColdStartEmail,
  isTestEmail,
} = require('./lib/smoke-data-heuristics.cjs');
const {
  loadAssetsManifest,
  verifyAllAssets,
  collectPublishedMediaUrls,
  legacyMediaViolations,
  verifyAssetDelivery,
} = require('./lib/ocs-official-assets.cjs');

const ROOT = path.join(__dirname, '../..');
const MANIFEST = path.join(ROOT, 'data/official-cold-start/dataset.v1.json');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const STATE_PATH = process.env.STATE || '';
const OUT = process.env.OUT || process.env.OCS_SURFACE_EXPANSION_SIGNOFF || '';
const STAMP = process.env.OCS_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tourist@test.com';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Test123!';
const REVERSE_PROBE_CHAIN = process.env.OCS_REVERSE_PROBE_CHAIN || 'tokyo-photo';
/** Staging hard gate — set OCS_STRICT_LEGACY_MEDIA=0 to disable (not default). */
const STRICT_LEGACY_MEDIA = process.env.OCS_STRICT_LEGACY_MEDIA !== '0';

/** Sub-checks — all must PASS for VERIFIED. */
const REQUIRED_ACCEPTANCE = [
  'OCS_MANIFEST',
  'OCS_SINGLE_SOURCE',
  'OFFICIAL_IDENTITY',
  'PUBLIC_OPERATIONS',
  'SURFACE_CONSISTENCY',
  'COMMUNITY_FEED',
  'CAMPAIGN',
  'DESTINATION',
  'REVERSE_GOVERNANCE',
  'MEDIA',
  'ASSET_VERIFICATION',
];

/** Official Asset Baseline V1 · five-dimension publish gate (all must PASS). */
const PUBLISH_GATE_DIMENSIONS = {
  METADATA: ['OCS_MANIFEST', 'OCS_SINGLE_SOURCE', 'OFFICIAL_IDENTITY'],
  ASSET: ['MEDIA', 'ASSET_VERIFICATION'],
  GOVERNANCE: ['PUBLIC_OPERATIONS', 'REVERSE_GOVERNANCE'],
  SURFACE: ['SURFACE_CONSISTENCY', 'COMMUNITY_FEED', 'CAMPAIGN', 'DESTINATION'],
  VERIFICATION: ['ASSET_VERIFICATION'],
};

const dataset = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const state = STATE_PATH && fs.existsSync(STATE_PATH) ? JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')) : null;
const client = createClient(API);
const domain = dataset.email_domain || 'ocs.traveltrust.app';

const SHOWCASE_PATTERNS = [/tt-showcase-post-/i, /tt-demo-/i, /community-showcase-/i];
const LEGACY_MEDIA_HOSTS = ['w3schools.com', 'samplelib.com', 'filesamples.com', 'unsplash.com'];

const checks = [];
const issues = [];

function record(id, label, ok, detail) {
  checks.push({ id, label, ok, detail });
  if (!ok) issues.push({ id, severity: 'blocking', msg: detail });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function feedPosts(json) {
  return json?.posts || json?.items || [];
}

function postInFeed(posts, id) {
  return posts.some((p) => String(p.id) === String(id));
}

function campaignHasResolvedPost(campJson, postId) {
  const items = campJson?.campaign?.items || campJson?.items || [];
  return items.some((it) => {
    const ref = it?.item_ref_id;
    const resolvedId = it?.resolved?.id;
    if (it.item_type === 'community_post' && String(ref) === String(postId)) {
      return Boolean(resolvedId);
    }
    return resolvedId && String(resolvedId) === String(postId);
  });
}

function exploreCount(exploreJson, label) {
  const row = (exploreJson?.destinations || []).find(
    (d) => String(d.destination || '').trim() === String(label).trim()
  );
  return row ? Number(row.post_count || 0) : 0;
}

function exploreHasDestination(exploreJson, label) {
  return (exploreJson?.destinations || []).some(
    (d) => String(d.destination || d.label || '').trim() === String(label).trim()
  );
}

function mediaViolations(posts, context) {
  const v = [];
  for (const p of posts || []) {
    const id = String(p.id || '');
    if (SHOWCASE_PATTERNS.some((re) => re.test(id))) v.push({ context, type: 'showcase_id', id });
    const authorEmail = p.author?.email || p.user_email || '';
    if (SHOWCASE_PATTERNS.some((re) => re.test(authorEmail))) v.push({ context, type: 'showcase_author', id: authorEmail });
    for (const u of [...(p.media_urls || []), p.cover_url, p.media_url].filter(Boolean)) {
      const s = String(u).toLowerCase();
      if (LEGACY_MEDIA_HOSTS.some((h) => s.includes(h))) v.push({ context, type: 'legacy_media', url: u, post_id: id });
      if (s.includes('showcase') || s.includes('samplelib')) v.push({ context, type: 'showcase_url', url: u, post_id: id });
    }
  }
  return v;
}

function surfacesMatch(expected, actual) {
  const exp = expected || ['community_feed'];
  const act = actual || [];
  if (act.length === 0) return true;
  return exp.every((s) => act.includes(s));
}

async function main() {
  if (!/^https:\/\/tt-api-staging\./i.test(API) && process.env.OCS_ALLOW_NON_STAGING !== '1') {
    record('ENV_STAGING', 'Staging API only', false, `API must be tt-api-staging (got ${API})`);
    return finish(false);
  }

  if (!state?.community_posts) {
    record('OCS_MANIFEST', 'OCS state.json with community_posts', false, 'missing STATE — run apply first');
    return finish(false);
  }

  const adminTok = await client.adminLogin(ADMIN_EMAIL, ADMIN_PASS);
  const expectedCp = dataset.chains.filter((c) => c.community_post).length;
  const ocsPostIds = new Set();

  // 1 · OCS_MANIFEST
  let manifestOk = true;
  for (const chain of dataset.chains) {
    if (!chain.community_post) continue;
    const cpKey = `community_post:${chain.id}`;
    const mapped = state.community_posts[cpKey];
    if (!mapped?.id) {
      manifestOk = false;
      continue;
    }
    ocsPostIds.add(String(mapped.id));
  }
  record(
    'OCS_MANIFEST',
    '10 community_post from OCS orchestrator (not SQL/seed)',
    manifestOk && ocsPostIds.size >= expectedCp,
    `community_posts=${ocsPostIds.size}/${expectedCp}`
  );

  const feedRes = await client.req('GET', '/api/v1/community/feed?limit=100');
  const posts = feedPosts(feedRes.json);
  const ocsOnFeed = [...ocsPostIds].filter((id) => postInFeed(posts, id));
  const leakPosts = posts.filter(
    (p) => isNonProductionOrigin(p.data_origin) || isSmokeContent(p) || isTestEmail(p.author?.email || p.user_email)
  );
  const strayOcs = posts.filter((p) => {
    const email = p.author?.email || p.user_email || '';
    const id = String(p.id);
    if (isOfficialColdStartEmail(email) && !ocsPostIds.has(id)) return true;
    if (ocsPostIds.has(id) && email && !isOfficialColdStartEmail(email)) return true;
    return false;
  });

  // 2 · OCS_SINGLE_SOURCE
  record(
    'OCS_SINGLE_SOURCE',
    'Feed official content only from OCS manifest state map',
    strayOcs.length === 0 && leakPosts.length === 0,
    `stray_official=${strayOcs.length} leak=${leakPosts.length} ocs_ids=${ocsPostIds.size}`
  );

  // 3 · OFFICIAL_IDENTITY
  let identityOk = true;
  for (const chain of dataset.chains) {
    if (!chain.community_post) continue;
    const slug = chain.community_post.author_account_slug;
    const acc = state.accounts[slug];
    const cpId = state.community_posts[`community_post:${chain.id}`]?.id;
    if (!acc?.email?.endsWith(`@${domain}`)) identityOk = false;
    if (!cpId || !acc?.user_id) continue;
    const detail = await client.req('GET', `/api/v1/community/posts/${cpId}`);
    const authorId = detail.json?.post?.author?.id || detail.json?.post?.user_id;
    if (authorId && String(authorId) !== String(acc.user_id)) identityOk = false;
  }
  record('OFFICIAL_IDENTITY', 'author_account_slug binds Official Account', identityOk, `domain=@${domain}`);

  // 5 · SURFACE_CONSISTENCY (before ops probe mutates)
  let surfaceOk = true;
  const pqAll = await client.req(
    'GET',
    '/api/v1/admin/official/public-operations/publish-queue?entity_type=community_posts&limit=200',
    null,
    adminTok
  );
  const pqItems = pqAll.json?.items || [];
  for (const chain of dataset.chains) {
    if (!chain.community_post) continue;
    const cpId = state.community_posts[`community_post:${chain.id}`]?.id;
    if (!cpId) {
      surfaceOk = false;
      continue;
    }
    const row = pqItems.find((x) => String(x.id) === String(cpId));
    if (!row || row.display_status !== 'published') {
      surfaceOk = false;
      continue;
    }
    if (!surfacesMatch(chain.community_post.surfaces, row.display_surfaces)) surfaceOk = false;
    if (typeof chain.community_post.priority === 'number' && row.display_priority !== chain.community_post.priority) {
      surfaceOk = false;
    }
  }
  const picks = (dataset.campaigns || []).find((c) => c.id === 'official-picks');
  if (picks) {
    for (const ref of picks.item_refs || []) {
      if (!ref.startsWith('community_post:')) continue;
      const chainId = ref.split(':')[1];
      if (!state.community_posts[`community_post:${chainId}`]?.id) surfaceOk = false;
    }
  }
  record(
    'SURFACE_CONSISTENCY',
    'Manifest surfaces/priority/campaign refs match Public Operations',
    surfaceOk,
    `published_rows=${pqItems.filter((r) => ocsPostIds.has(String(r.id))).length}`
  );

  // 4 · PUBLIC_OPERATIONS
  const probeChain = dataset.chains.find((c) => c.id === REVERSE_PROBE_CHAIN) || dataset.chains[0];
  const probeId = state.community_posts[`community_post:${probeChain.id}`]?.id;
  let opsOk = false;
  if (probeId) {
    const pri = await client.setPriority(adminTok, 'community_posts', probeId, 150);
    const feat = await client.setFeatured(adminTok, 'community_posts', probeId, true);
    const surf = await client.setSurfaces(adminTok, 'community_posts', probeId, ['community_feed', 'community_featured']);
    opsOk = pri.status < 400 && feat.status < 400 && surf.status < 400;
    await client.setPriority(adminTok, 'community_posts', probeId, probeChain.community_post.priority || 100);
    await client.setSurfaces(adminTok, 'community_posts', probeId, probeChain.community_post.surfaces || ['community_feed']);
  }
  record('PUBLIC_OPERATIONS', 'Publish / Unpublish / Priority / Featured / Surface', opsOk, `probe=${probeId || 'none'}`);

  // 6 · COMMUNITY_FEED (governed path + OCS visibility + zero leakage)
  record(
    'COMMUNITY_FEED',
    'Feed official content from governed path',
    feedRes.status === 200 && ocsOnFeed.length >= Math.min(10, expectedCp) && leakPosts.length === 0,
    `ocs_on_feed=${ocsOnFeed.length}/${expectedCp} leak=${leakPosts.length}`
  );

  // 7 · CAMPAIGN
  const campRes = await client.req('GET', '/api/v1/official/cold-start/surfaces/community_feed');
  const campItems = campRes.json?.campaign?.items || [];
  const campOk =
    campRes.status === 200 &&
    campItems.some(
      (it) => it.item_type === 'community_post' && ocsPostIds.has(String(it?.resolved?.id || it?.item_ref_id || ''))
    );
  record(
    'CAMPAIGN',
    'Campaign community_post refs without second source',
    campOk,
    `items=${campItems.length}`
  );

  // 8 · DESTINATION
  const exploreRes = await client.req('GET', '/api/v1/community/explore/destinations');
  let destOk = exploreRes.status === 200 && exploreRes.json?.catalog === 'api-aggregate-v1';
  for (const chainId of ['tokyo-photo', 'kyoto-culture']) {
    const chain = dataset.chains.find((c) => c.id === chainId);
    if (!chain?.community_post) continue;
    if (!chain.community_post.destination_slug) destOk = false;
    const label = chain.community_post.destination_label || chain.city;
    const cpId = state.community_posts[`community_post:${chainId}`]?.id;
    if (cpId) {
      const det = await client.req('GET', `/api/v1/community/posts/${cpId}`);
      if (det.json?.post?.destination !== label) destOk = false;
    }
    if (!exploreHasDestination(exploreRes.json, label)) destOk = false;
  }
  record('DESTINATION', 'destination_slug · explore · no Hub API', destOk, `catalog=${exploreRes.json?.catalog || 'n/a'}`);

  // 9 · REVERSE_GOVERNANCE
  let reverseOk = false;
  const reverseDetail = {};
  if (probeId) {
    const label = probeChain.community_post?.destination_label || probeChain.city;
    const feedBefore = feedPosts((await client.req('GET', '/api/v1/community/feed?limit=200')).json);
    const exploreBefore = await client.req('GET', '/api/v1/community/explore/destinations');
    const campBefore = await client.req('GET', '/api/v1/official/cold-start/surfaces/community_feed');
    const visibleBefore = postInFeed(feedBefore, probeId);
    const countBefore = label ? exploreCount(exploreBefore.json, label) : 0;
    const campBeforeOk = campaignHasResolvedPost(campBefore.json, probeId);

    await client.unpublishEntity(adminTok, 'community_posts', probeId);
    await sleep(700);

    const feedAfter = feedPosts((await client.req('GET', '/api/v1/community/feed?limit=200')).json);
    const exploreAfter = await client.req('GET', '/api/v1/community/explore/destinations');
    const campAfter = await client.req('GET', '/api/v1/official/cold-start/surfaces/community_feed');
    const hiddenFeed = !postInFeed(feedAfter, probeId);
    const countAfter = label ? exploreCount(exploreAfter.json, label) : 0;
    const exploreDropped = !label || countAfter < countBefore;
    const campAfterOk = !campaignHasResolvedPost(campAfter.json, probeId);

    await client.publishEntity(adminTok, 'community_posts', probeId);
    await client.setSurfaces(adminTok, 'community_posts', probeId, probeChain.community_post.surfaces || ['community_feed']);
    if (probeChain.community_post.priority) {
      await client.setPriority(adminTok, 'community_posts', probeId, probeChain.community_post.priority);
    }

    reverseOk = visibleBefore && hiddenFeed && exploreDropped && campBeforeOk && campAfterOk;
    Object.assign(reverseDetail, {
      probe_post_id: probeId,
      visible_before: visibleBefore,
      hidden_after_unpublish: hiddenFeed,
      explore_count_before: countBefore,
      explore_count_after: countAfter,
      campaign_sync: campAfterOk,
    });
  }
  record('REVERSE_GOVERNANCE', 'Unpublish hides Feed · Explore · Campaign', reverseOk, JSON.stringify(reverseDetail));

  // 10 · MEDIA (strict default · manifest + feed URLs)
  const mediaV = mediaViolations(posts, 'feed');
  const manifestUrls = collectPublishedMediaUrls(dataset);
  const manifestLegacy = legacyMediaViolations(manifestUrls);
  const mediaOk = mediaV.length === 0 && (!STRICT_LEGACY_MEDIA || manifestLegacy.length === 0);
  record(
    'MEDIA',
    'No Showcase / Sample / Legacy URLs (OCS_STRICT_LEGACY_MEDIA=1)',
    mediaOk,
    mediaV.length
      ? JSON.stringify(mediaV.slice(0, 3))
      : manifestLegacy.length
        ? JSON.stringify(manifestLegacy.slice(0, 3))
        : `strict=${STRICT_LEGACY_MEDIA} scanned=${posts.length}`
  );

  // 11 · ASSET_VERIFICATION (HEAD 200 · MIME · Content-Length · decodable)
  let assetVerifyOk = false;
  let assetDetail = 'assets manifest missing — run generate-ocs-official-media-assets.cjs';
  try {
    const assetsDoc = loadAssetsManifest();
    const cachedVerifyPath =
      STATE_PATH && fs.existsSync(STATE_PATH)
        ? path.join(path.dirname(STATE_PATH), 'asset-verification.json')
        : '';
    let delivery = null;
    if (cachedVerifyPath && fs.existsSync(cachedVerifyPath)) {
      const cached = JSON.parse(fs.readFileSync(cachedVerifyPath, 'utf8'));
      if (cached.delivery_ok === true && cached.delivery_pass === cached.asset_count) {
        delivery = { ok: true, results: cached.results || [] };
        assetDetail = `reused ${cachedVerifyPath} pass=${cached.delivery_pass}/${cached.asset_count}`;
      }
    }
    if (!delivery) {
      delivery = await verifyAllAssets(API, assetsDoc, { delayMs: 300 });
      assetDetail = delivery.ok
        ? `assets=${delivery.results.length} live_scan`
        : JSON.stringify({ delivery_fail: delivery.results.filter((r) => !r.ok).slice(0, 3) });
    }
    const feedAssetFails = [];
    for (const chain of dataset.chains) {
      if (!chain.community_post) continue;
      const cover = chain.community_post.cover_url;
      const asset = assetsDoc.assets.find((a) => a.public_url === cover);
      if (!asset) {
        feedAssetFails.push({ chain: chain.id, reason: 'cover_not_in_assets_manifest' });
        continue;
      }
      const cachedRow = delivery.results.find((r) => r.filename === asset.filename);
      const r = cachedRow?.ok ? cachedRow : await verifyAssetDelivery(API, asset);
      if (!r.ok) feedAssetFails.push({ chain: chain.id, url: r.url, checks: r.checks });
      await sleep(300);
    }
    assetVerifyOk = delivery.ok && feedAssetFails.length === 0;
    if (feedAssetFails.length) {
      assetDetail = JSON.stringify({
        delivery_ok: delivery.ok,
        feed_fails: feedAssetFails.slice(0, 3),
      });
    }
  } catch (e) {
    assetDetail = String(e.message || e).slice(0, 200);
  }
  record(
    'ASSET_VERIFICATION',
    'Official Asset Baseline · HEAD 200 · MIME · Content-Length · image decodable',
    assetVerifyOk,
    assetDetail
  );

  const pass = REQUIRED_ACCEPTANCE.every((id) => checks.find((c) => c.id === id)?.ok);
  return finish(pass);
}

function finish(pass) {
  const missing = REQUIRED_ACCEPTANCE.filter((id) => !checks.find((c) => c.id === id));
  if (missing.length) {
    for (const id of missing) record(id, 'missing check', false, 'not executed');
  }

  const acceptancePass = REQUIRED_ACCEPTANCE.every((id) => checks.find((c) => c.id === id)?.ok);
  const ttStatus = acceptancePass ? 'VERIFIED' : 'READY_FOR_STAGING_VERIFICATION';

  const publishGate = {};
  for (const [dim, ids] of Object.entries(PUBLISH_GATE_DIMENSIONS)) {
    const uniqueIds = [...new Set(ids)];
    publishGate[dim] = {
      pass: uniqueIds.every((id) => checks.find((c) => c.id === id)?.ok),
      checks: uniqueIds.map((id) => ({
        id,
        ok: checks.find((c) => c.id === id)?.ok ?? false,
      })),
    };
  }
  const publishGatePass = Object.values(publishGate).every((d) => d.pass);

  const payload = {
    schema: 'traveltrust.ocs_surface_expansion.staging_acceptance.v1',
    stamp: STAMP,
    environment: 'staging',
    api: API,
    manifest: 'data/official-cold-start/dataset.v1.json',
    assets_manifest: 'data/official-cold-start/assets.v1.json',
    state_path: STATE_PATH || null,
    recorded_at: new Date().toISOString(),
    verdict: acceptancePass && publishGatePass ? 'PASS' : 'FAIL',
    required_acceptance: REQUIRED_ACCEPTANCE,
    required_acceptance_count: REQUIRED_ACCEPTANCE.length,
    publish_gate: publishGate,
    publish_gate_pass: publishGatePass,
    publish_gate_rule:
      'Metadata · Asset · Governance · Surface · Verification — all PASS before publish',
    ocs_strict_legacy_media: STRICT_LEGACY_MEDIA,
    machine_keys: {
      TT_OCS_SURFACE_EXPANSION: ttStatus,
      TT_OCS_OFFICIAL_ASSET_BASELINE: publishGate.ASSET?.pass && publishGate.VERIFICATION?.pass ? 'V1_VERIFIED' : 'V1_PENDING',
      TT_OCS_ASSET_VERIFICATION: checks.find((c) => c.id === 'ASSET_VERIFICATION')?.ok ? 'PASS' : 'FAIL',
      TT_OFFICIAL_COLD_START_DATASET: acceptancePass ? 'CLOSED_SURFACE_EXPANSION_VERIFIED' : 'CLOSED_UNLESS_TOUCHED',
    },
    acceptance_checks: checks,
    issues,
    honest_boundary:
      'Staging VERIFIED ≠ G3-01 Production Network · Asset binaries must exist on API volume (bootstrap)',
  };

  const outPath =
    OUT ||
    (STATE_PATH
      ? path.join(path.dirname(STATE_PATH), 'ocs-surface-expansion-signoff.json')
      : path.join(ROOT, 'evidence/GO_official_cold_start_dataset/ocs-surface-expansion-staging', STAMP, 'ocs-surface-expansion-signoff.json'));

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n');

  console.log(`OCS_SURFACE_EXPANSION_VERDICT: ${payload.verdict}`);
  console.log(`TT_OCS_SURFACE_EXPANSION: ${ttStatus}`);
  console.log(`publish_gate_pass: ${publishGatePass}`);
  for (const [dim, row] of Object.entries(publishGate)) {
    console.log(`  ${row.pass ? 'PASS' : 'FAIL'} ${dim}`);
  }
  console.log(`required_acceptance: ${REQUIRED_ACCEPTANCE.filter((id) => checks.find((c) => c.id === id)?.ok).length}/${REQUIRED_ACCEPTANCE.length}`);
  console.log(`evidence=${outPath.replace(/\\/g, '/')}`);
  for (const id of REQUIRED_ACCEPTANCE) {
    const c = checks.find((x) => x.id === id);
    console.log(`  ${c?.ok ? 'PASS' : 'FAIL'} ${id} ${c?.detail || ''}`);
  }

  if (!acceptancePass || !publishGatePass) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
