#!/usr/bin/env node
/**
 * Official Cold Start Dataset (OCS) · Admin Public Operations orchestrator.
 *
 *   API_BASE=https://tt-api-staging.fly.dev node scripts/dev/run-official-cold-start-dataset.cjs
 *
 * Chain order: Official Identity → Guide → Provider → Acquisition → Official Guide → Community Post → Campaign
 * Asset baseline: bootstrap Official Asset Baseline V1 before entity apply (OCS Single Source)
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const {
  loadAssetsManifest,
  bootstrapLocalAssets,
  ASSETS_MANIFEST,
} = require('./lib/ocs-official-assets.cjs');
const ROOT = path.join(__dirname, '../..');
const MANIFEST = path.join(ROOT, 'data/official-cold-start/dataset.v1.json');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tourist@test.com';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Test123!';
const OCS_PASS = process.env.TT_OCS_ACCOUNT_PASSWORD || 'OcsBaseline2026!';
const STAMP = process.env.OCS_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const EVID_DIR = process.env.OCS_EVIDENCE_DIR || path.join(ROOT, 'evidence/GO_official_cold_start_dataset', STAMP);
const STATE_PATH = path.join(EVID_DIR, 'state.json');
const DRY_RUN = process.env.OCS_DRY_RUN === '1';

const client = createClient(API);
const dataset = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const domain = dataset.email_domain || 'ocs.traveltrust.app';

function email(slug) {
  return `${slug}@${domain}`;
}

function loadState() {
  const seedPath = process.env.OCS_STATE_SEED;
  if (seedPath && fs.existsSync(seedPath)) {
    const state = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    if (!state.community_posts) state.community_posts = {};
    return state;
  }
  if (fs.existsSync(STATE_PATH)) {
    const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
    if (!state.community_posts) state.community_posts = {};
    return state;
  }
  return { accounts: {}, guides: {}, listings: {}, official_guides: {}, community_posts: {}, campaigns: {} };
}

function saveState(state) {
  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n');
}

function okStatus(s) {
  return s === 200 || s === 201 || s === 409;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Staging login is memory-only; PG-only official accounts need API restart to hydrate. */
async function stagingHydrateApiMemoryAfterOpsAccounts() {
  if (process.env.TRAVELTRUST_OCS_STAGING_HYDRATE_RESTART !== '1') return;
  const { execSync } = require('child_process');
  console.log('ocs: hydrate — fly apps restart tt-api-staging (PG official accounts → memory)');
  execSync('fly apps restart tt-api-staging', { stdio: 'inherit' });
  for (let i = 0; i < 36; i += 1) {
    await sleep(5000);
    try {
      const r = await client.req('GET', '/health');
      if (r.status === 200) {
        console.log('ocs: API healthy after ops-account hydrate restart');
        return;
      }
    } catch (_) {
      /* retry */
    }
  }
  throw new Error('API not healthy after OCS ops-account hydrate restart');
}

async function precreateAllChainOfficialAccounts(adminTok, state, password) {
  for (const chain of dataset.chains || []) {
    const specs = [
      [
        `guide-acc:${chain.id}`,
        {
          slug: chain.guide.slug,
          account_kind: 'guide',
          display_label: chain.guide.nickname,
          nickname: chain.guide.nickname,
        },
      ],
      [
        `provider-acc:${chain.id}`,
        {
          slug: chain.provider.slug,
          account_kind: 'merchant',
          display_label: chain.provider.title.slice(0, 40),
          nickname: chain.provider.title.slice(0, 20),
        },
      ],
      [
        `acquisition-acc:${chain.id}`,
        {
          slug: chain.acquisition.slug,
          account_kind: 'merchant',
          display_label: chain.acquisition.title.slice(0, 40),
          nickname: chain.acquisition.title.slice(0, 20),
        },
      ],
    ];
    for (const [key, spec] of specs) {
      await ensureOfficialAccount(adminTok, state, key, spec, password);
      saveState(state);
    }
  }
}

async function ensureOfficialAccount(adminTok, state, key, spec, password) {
  if (state.accounts[key]?.id) return state.accounts[key];
  const em = email(spec.slug);
  const list = await client.listOfficialAccounts(adminTok);
  const existing = (list.json.items || []).find((a) => (a.user_email || '').toLowerCase() === em);
  if (existing) {
    state.accounts[key] = { id: existing.id, user_id: existing.user_id, email: em };
    const accExist = state.accounts[key];
    if (!DRY_RUN && accExist && (spec.nickname || spec.avatar_url)) {
      try {
        const userTok = await client.userLogin(em, password);
        const body = {};
        if (spec.nickname) body.nickname = spec.nickname;
        if (spec.avatar_url) body.avatar_url = spec.avatar_url;
        const put = await client.req('PUT', '/api/v1/me', body, userTok);
        if (okStatus(put.status)) console.log(`ocs: persona synced existing ${key}`);
      } catch (e) {
        console.warn(`ocs: persona sync failed existing ${em}: ${e && e.message ? e.message : e}`);
      }
    }
    return state.accounts[key];
  }
  if (DRY_RUN) {
    console.log(`[dry-run] create official account ${em}`);
    return null;
  }
  const r = await client.createOfficialAccount(adminTok, {
    email: em,
    password,
    account_kind: spec.account_kind,
    display_label: spec.display_label,
    nickname: spec.nickname,
    data_origin: 'production',
  });
  if (!okStatus(r.status) || !r.json.item?.id) {
    throw new Error(`createOfficialAccount ${em} HTTP ${r.status} ${JSON.stringify(r.json).slice(0, 200)}`);
  }
  const id = r.json.item.id;
  await client.submitOfficialAccountReview(adminTok, id);
  const pub = await client.publishOfficialAccount(adminTok, id);
  if (!okStatus(pub.status)) {
    throw new Error(`publishOfficialAccount ${em} HTTP ${pub.status}`);
  }
  state.accounts[key] = { id, user_id: r.json.item.user_id, email: em };
  console.log(`ocs: official account ${key} ${em}`);
  const accNew = state.accounts[key];
  if (!DRY_RUN && accNew && (spec.nickname || spec.avatar_url)) {
    try {
      const userTok = await client.userLogin(em, password);
      const body = {};
      if (spec.nickname) body.nickname = spec.nickname;
      if (spec.avatar_url) body.avatar_url = spec.avatar_url;
      const put = await client.req('PUT', '/api/v1/me', body, userTok);
      if (!okStatus(put.status)) {
        console.warn(`ocs: persona sync warn ${em} HTTP ${put.status}`);
      } else {
        console.log(`ocs: persona synced ${key}`);
      }
    } catch (e) {
      console.warn(`ocs: persona sync failed ${em}: ${e && e.message ? e.message : e}`);
    }
  }
  return state.accounts[key];
}

async function ensureGuideChain(adminTok, state, chain, password) {
  const gKey = `guide:${chain.id}`;
  if (state.guides[gKey]?.id) return state.guides[gKey];

  const accKey = `guide-acc:${chain.id}`;
  const acc = await ensureOfficialAccount(
    adminTok,
    state,
    accKey,
    {
      slug: chain.guide.slug,
      account_kind: 'guide',
      display_label: chain.guide.nickname,
      nickname: chain.guide.nickname,
    },
    password
  );
  if (!acc) return null;

  const userTok = await client.userLogin(acc.email, password);
  const created = await client.createGuide(userTok, {
    city: chain.city,
    country_code: chain.country_code,
    languages: chain.guide.languages,
    service_types: chain.guide.service_types,
    bio: chain.guide.bio,
  });
  let guideId = created.json.guide?.id;
  if (!guideId && (created.status === 409 || created.json.error === 'already_guide')) {
    const me = await client.req('GET', '/api/v1/me', null, userTok);
    guideId = me.json.guide?.id || me.json.user?.guide_id || me.json.guide_id;
  }
  if (!guideId) {
    const me = await client.req('GET', '/api/v1/me', null, userTok);
    guideId = me.json.guide?.id || me.json.user?.guide_id || me.json.guide_id;
  }
  if (!guideId && acc?.id) {
    const list = await client.listOfficialAccounts(adminTok);
    const row = (list.json.items || []).find((a) => a.id === acc.id);
    guideId = row?.linked_guide_id;
  }
  if (!guideId) {
    throw new Error(`createGuide ${chain.id} HTTP ${created.status} ${JSON.stringify(created.json).slice(0, 200)}`);
  }
  await client.stakeGuide(userTok, guideId, chain.guide.stake_amount);
  await client.publishEntity(adminTok, 'guides', guideId);
  await client.setSurfaces(adminTok, 'guides', guideId, ['market_feed']);
  await client.linkOfficialAccountGuide(adminTok, acc.id, guideId);
  state.guides[gKey] = { id: guideId, account_id: acc.id, email: acc.email };
  console.log(`ocs: guide ${chain.id} ${guideId}`);
  return state.guides[gKey];
}

async function ensureListing(adminTok, state, chain, variant, password) {
  const spec = variant === 'provider' ? chain.provider : chain.acquisition;
  const lKey = `${variant}:${chain.id}`;
  if (state.listings[lKey]?.id) return state.listings[lKey];

  const accKey = `${variant}-acc:${chain.id}`;
  const acc = await ensureOfficialAccount(
    adminTok,
    state,
    accKey,
    {
      slug: spec.slug,
      account_kind: 'merchant',
      display_label: spec.title.slice(0, 40),
      nickname: spec.title.slice(0, 20),
    },
    password
  );
  if (!acc) return null;

  const boot = await client.bootstrapOfficialAccountMarket(adminTok, acc.id, variant);
  if (!okStatus(boot.status)) {
    throw new Error(`bootstrapMarket ${lKey} HTTP ${boot.status} ${JSON.stringify(boot.json).slice(0, 200)}`);
  }

  const userTok = await client.userLogin(acc.email, password);
  let r;
  if (variant === 'provider') {
    r = await client.createProviderListing(userTok, {
      kind: 'merchant_showcase_studio_v1',
      title: spec.title,
      city: chain.city,
      category: spec.category,
      countryIso: chain.country_code,
      description: spec.description,
      videoUrl: spec.cover_url,
      priceUsdc: spec.price_usdc,
    });
  } else {
    r = await client.createAcquisitionListing(userTok, {
      kind: 'acquisition_carry_studio_v1',
      title: spec.title,
      bountyMinUsdc: spec.bounty_min_usdc,
      bountyMaxUsdc: spec.bounty_max_usdc,
      description: spec.description,
      videoUrl: spec.cover_url,
      countryIso: chain.country_code,
      category: spec.category,
    });
  }
  const listingId = r.json.listing_id || r.json.listing?.id || r.json.id;
  if (!listingId) {
    throw new Error(`createListing ${lKey} HTTP ${r.status} ${JSON.stringify(r.json).slice(0, 200)}`);
  }
  await client.publishEntity(adminTok, 'market_listings', listingId);
  const surfaces =
    variant === 'provider' ? ['market_provider', 'market_feed'] : ['market_acquisition', 'market_feed'];
  await client.setSurfaces(adminTok, 'market_listings', listingId, surfaces);
  state.listings[lKey] = { id: listingId, account_id: acc.id };
  console.log(`ocs: ${variant} ${chain.id} ${listingId}`);
  return state.listings[lKey];
}

async function ensureOfficialGuidePost(adminTok, state, chain) {
  const ogKey = `official_guide:${chain.id}`;
  if (state.official_guides[ogKey]?.id) return state.official_guides[ogKey];

  const authorSlug =
    chain.community_post?.author_account_slug ||
    ['official', 'asia', 'japan', 'europe', 'support'][dataset.chains.findIndex((c) => c.id === chain.id) % 5];
  const author = state.accounts[authorSlug];
  if (!author?.id) throw new Error(`missing ops author ${authorSlug} for official guide ${chain.id}`);

  const r = await client.createOfficialGuide(adminTok, {
    author_account_id: author.id,
    title: chain.official_guide.title,
    body: chain.official_guide.body,
    destination: chain.official_guide.destination,
    tags: chain.official_guide.tags,
    cover_url: chain.official_guide.cover_url,
    featured: true,
  });
  const postId = r.json.item?.id;
  if (!postId) {
    throw new Error(`createOfficialGuide ${chain.id} HTTP ${r.status} ${JSON.stringify(r.json).slice(0, 200)}`);
  }
  await client.submitOfficialGuideReview(adminTok, postId);
  await client.publishOfficialGuide(adminTok, postId);
  state.official_guides[ogKey] = { id: postId };
  console.log(`ocs: official guide ${chain.id} ${postId}`);
  return state.official_guides[ogKey];
}

async function ensureCommunityPost(adminTok, state, chain, password) {
  const spec = chain.community_post;
  if (!spec) return null;
  const cpKey = `community_post:${chain.id}`;
  if (state.community_posts[cpKey]?.id) return state.community_posts[cpKey];

  const authorSlug = spec.author_account_slug;
  if (!authorSlug) throw new Error(`community_post ${chain.id} missing author_account_slug`);
  const author = state.accounts[authorSlug];
  if (!author?.id) throw new Error(`missing ops author ${authorSlug} for community_post ${chain.id}`);

  if (DRY_RUN) {
    console.log(`[dry-run] community_post ${chain.id}`);
    return null;
  }

  const userTok = await client.userLogin(author.email, password);
  await sleep(Number(process.env.OCS_POST_INTERVAL_MS || 6500));
  let r;
  for (let attempt = 0; attempt < 6; attempt++) {
    r = await client.createCommunityPost(userTok, {
      body: spec.body_markdown,
      post_type: spec.post_type || 'photo',
      destination: spec.destination_label || chain.city,
      tags: spec.tags || [],
      media_urls: spec.media_urls || [],
      cover_url: spec.cover_url,
    });
    if (r.status !== 429 || r.json.error !== 'post_too_fast') break;
    await sleep(6500 * (attempt + 1));
  }
  const postId = r.json.id;
  if (!postId) {
    throw new Error(`createCommunityPost ${chain.id} HTTP ${r.status} ${JSON.stringify(r.json).slice(0, 200)}`);
  }

  await client.publishEntity(adminTok, 'community_posts', postId);
  const surfaces = spec.surfaces?.length ? spec.surfaces : ['community_feed'];
  await client.setSurfaces(adminTok, 'community_posts', postId, surfaces);
  if (typeof spec.priority === 'number') {
    await client.setPriority(adminTok, 'community_posts', postId, spec.priority);
  }
  if (spec.priority >= 98 || surfaces.includes('community_featured')) {
    await client.setFeatured(adminTok, 'community_posts', postId, true);
  }

  state.community_posts[cpKey] = { id: postId, author_account_slug: authorSlug, canonical_key: spec.canonical_key };
  console.log(`ocs: community_post ${chain.id} ${postId}`);
  return state.community_posts[cpKey];
}

function resolveItemRef(state, ref) {
  const [kind, chainId] = ref.split(':');
  if (kind === 'guide') return { item_type: 'guide', item_ref_id: state.guides[`guide:${chainId}`]?.id };
  if (kind === 'provider') return { item_type: 'market_listing', item_ref_id: state.listings[`provider:${chainId}`]?.id };
  if (kind === 'acquisition') return { item_type: 'market_listing', item_ref_id: state.listings[`acquisition:${chainId}`]?.id };
  if (kind === 'official_guide') return { item_type: 'guide_post', item_ref_id: state.official_guides[`official_guide:${chainId}`]?.id };
  if (kind === 'community_post') return { item_type: 'community_post', item_ref_id: state.community_posts[`community_post:${chainId}`]?.id };
  return null;
}

async function ensureCampaigns(adminTok, state) {
  for (const c of dataset.campaigns || []) {
    if (state.campaigns[c.id]?.id) continue;
    const r = await client.createCampaign(adminTok, {
      name: c.name,
      campaign_kind: c.kind,
      surfaces: c.surfaces,
    });
    const campaignId = r.json.item?.id;
    if (!campaignId) {
      throw new Error(`createCampaign ${c.id} HTTP ${r.status}`);
    }
    let order = 0;
    for (const ref of c.item_refs || []) {
      const item = resolveItemRef(state, ref);
      if (!item?.item_ref_id) {
        console.warn(`ocs: skip campaign item ${c.id} ${ref} (missing entity)`);
        continue;
      }
      await client.addCampaignItem(adminTok, campaignId, { ...item, sort_order: order++ });
    }
    await client.submitCampaignReview(adminTok, campaignId);
    await client.deployCampaign(adminTok, campaignId);
    state.campaigns[c.id] = { id: campaignId };
    console.log(`ocs: campaign ${c.id} deployed`);
  }
}

(async () => {
  console.log(`== Official Cold Start Dataset · ${STAMP} ==`);
  console.log(`api=${API} manifest=${MANIFEST}`);
  fs.mkdirSync(EVID_DIR, { recursive: true });

  if (fs.existsSync(ASSETS_MANIFEST) && process.env.OCS_SKIP_ASSET_BOOTSTRAP !== '1') {
    try {
      const assetsDoc = loadAssetsManifest();
      const copied = bootstrapLocalAssets(assetsDoc);
      console.log(`ocs: asset baseline local bootstrap ${copied.length} files`);
    } catch (e) {
      console.warn(`ocs: asset bootstrap WARN ${String(e.message || e).slice(0, 120)}`);
    }
  }

  const adminTok = await client.adminLogin(ADMIN_EMAIL, ADMIN_PASS);
  const state = loadState();

  for (const ops of dataset.ops_accounts || []) {
    await ensureOfficialAccount(adminTok, state, ops.slug, ops, OCS_PASS);
    saveState(state);
  }

  await precreateAllChainOfficialAccounts(adminTok, state, OCS_PASS);

  await stagingHydrateApiMemoryAfterOpsAccounts();
  let chainAdminTok = adminTok;
  if (process.env.TRAVELTRUST_OCS_STAGING_HYDRATE_RESTART === '1') {
    chainAdminTok = await client.adminLogin(ADMIN_EMAIL, ADMIN_PASS);
  }

  for (const chain of dataset.chains || []) {
    await ensureGuideChain(chainAdminTok, state, chain, OCS_PASS);
    saveState(state);
    await ensureListing(chainAdminTok, state, chain, 'provider', OCS_PASS);
    saveState(state);
    await ensureListing(chainAdminTok, state, chain, 'acquisition', OCS_PASS);
    saveState(state);
    await ensureOfficialGuidePost(chainAdminTok, state, chain);
    saveState(state);
    await ensureCommunityPost(chainAdminTok, state, chain, OCS_PASS);
    saveState(state);
  }

  await ensureCampaigns(chainAdminTok, state);
  saveState(state);

  const report = {
    schema: 'traveltrust.official_cold_start_dataset.run.v1',
    stamp: STAMP,
    api: API,
    manifest: 'data/official-cold-start/dataset.v1.json',
    counts: {
      accounts: Object.keys(state.accounts).length,
      guides: Object.keys(state.guides).length,
      listings: Object.keys(state.listings).length,
      official_guides: Object.keys(state.official_guides).length,
      community_posts: Object.keys(state.community_posts).length,
      campaigns: Object.keys(state.campaigns).length,
    },
    state,
  };
  fs.writeFileSync(path.join(EVID_DIR, 'ocs-run-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('TT_OFFICIAL_COLD_START_DATASET: complete');
  console.log(`evidence=${EVID_DIR.replace(/\\/g, '/')}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
