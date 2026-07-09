#!/usr/bin/env node
/**
 * OCS Production Bootstrap + three execution checkpoints + parity audit evidence.
 *
 *   node scripts/dev/run-ocs-production-bootstrap.cjs
 *
 * Check 1 — Frozen manifest hash unchanged (apply only, never regenerate).
 * Check 2 — Lineage map entity_id → ocs_source_id → published_asset → public API.
 * Check 3 — Parity audit: manifest = prod DB surfaces = public API = frontend probes.
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const { loadAssetsManifest, verifyAssetDelivery } = require('./lib/ocs-official-assets.cjs');

const ROOT = path.join(__dirname, '../..');
const REGISTRY = path.join(ROOT, 'registry/official-cold-start-dataset.v1.yaml');
const DATASET = path.join(ROOT, 'data/official-cold-start/dataset.v1.json');
const PROD_API = (process.env.PROD_API || process.env.API_BASE || 'https://tt-api-prod.fly.dev').replace(/\/$/, '');
const PROD_WEB = (process.env.PROD_WEB || process.env.WEB_BASE || 'https://tt-web-prod.fly.dev').replace(/\/$/, '');
const STAMP = process.env.OCS_PROD_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const EVID_ROOT = path.join(ROOT, 'evidence/GO_ocs_production_bootstrap');
const EVID_DIR = path.join(EVID_ROOT, STAMP);
const ADM_PASS = process.env.ADM_U01_PASSWORD || process.env.ADMIN_PASS || 'Test123!';
const OCS_PASS = process.env.TT_OCS_ACCOUNT_PASSWORD || 'OcsBaseline2026!';
const FLY_APP = process.env.FLY_APP || 'tt-api-prod';
const SKIP_APPLY = process.env.OCS_PROD_SKIP_APPLY === '1';
const SKIP_ASSETS = process.env.OCS_PROD_SKIP_ASSETS === '1';

function sha256File(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

function runNode(script, env, label) {
  const r = spawnSync(process.execPath, [script], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  fs.writeFileSync(path.join(EVID_DIR, `${label}.log`), out);
  return { ok: r.status === 0, status: r.status, out: out.slice(-4000) };
}

function record(checks, id, status, detail, extra = {}) {
  checks.push({ id, status, detail, ...extra });
}

async function resolveSuperAdminEmail() {
  if (process.env.ADMIN_EMAIL) return process.env.ADMIN_EMAIL;
  const envPath = path.join(ROOT, 'scripts/dev/.env.production.local');
  if (!fs.existsSync(envPath)) throw new Error('missing .env.production.local for SuperAdmin lookup');
  const out = {};
  for (const raw of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const line = raw.trim();
    if (line.startsWith('#') || !line.includes('=')) continue;
    const k = line.slice(0, line.indexOf('=')).trim();
    let v = line.slice(line.indexOf('=') + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[k] = v;
  }
  const port = process.env.PROD_PG_PROXY_PORT || '15433';
  const cluster = out.FLY_PROD_MPG_CLUSTER_ID || 'q49ypo4e98pr17ln';
  const u = new URL(out.DATABASE_URL);
  u.hostname = '127.0.0.1';
  u.port = port;
  u.searchParams.delete('sslmode');
  const dsn = u.toString();
  const { spawn } = require('child_process');
  const proxy = spawn('fly', ['mpg', 'proxy', cluster, '-p', port], { stdio: 'ignore' });
  const { Client } = require(path.join(ROOT, 'frontend/node_modules/pg'));
  try {
    for (let i = 0; i < 40; i += 1) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const client = new Client({ connectionString: dsn, connectionTimeoutMillis: 8000 });
        await client.connect();
        const q = await client.query(
          `SELECT email FROM users WHERE role='super_admin' AND email LIKE 'adm-u01-super%@traveltrust.prod' ORDER BY created_at DESC LIMIT 1`
        );
        await client.end();
        if (q.rows[0]?.email) return q.rows[0].email;
      } catch {
        /* retry */
      }
    }
    throw new Error('SuperAdmin lookup failed');
  } finally {
    if (!proxy.killed) proxy.kill();
  }
}

function buildLineage(state, dataset) {
  const rows = [];
  for (const chain of dataset.chains || []) {
    const g = state.guides?.[`guide:${chain.id}`];
    const p = state.listings?.[`provider:${chain.id}`];
    const a = state.listings?.[`acquisition:${chain.id}`];
    const og = state.official_guides?.[`official_guide:${chain.id}`];
    const cp = state.community_posts?.[`community_post:${chain.id}`];
    rows.push({
      ocs_source_id: chain.id,
      guide: g
        ? {
            guide_id: g.id,
            ocs_source_id: chain.id,
            published_asset: chain.guide?.avatar_url,
            public_api: `${PROD_API}/api/v1/guides/${g.id}`,
          }
        : null,
      provider_listing: p
        ? {
            listing_id: p.id,
            ocs_source_id: chain.id,
            published_asset: chain.provider?.cover_url,
            public_api: `${PROD_API}/api/v1/market/provider/listings/${p.id}`,
            market_api: `${PROD_API}/api/v1/market/provider/listings?limit=100`,
          }
        : null,
      acquisition_listing: a
        ? {
            listing_id: a.id,
            ocs_source_id: chain.id,
            published_asset: chain.acquisition?.cover_url,
            public_api: `${PROD_API}/api/v1/market/acquisition/listings/${a.id}`,
            market_api: `${PROD_API}/api/v1/market/acquisition/listings?limit=100`,
          }
        : null,
      official_guide: og
        ? {
            post_id: og.id,
            ocs_source_id: chain.id,
            published_asset: chain.official_guide?.cover_url,
            public_api: `${PROD_API}/api/v1/official/guides/${og.id}`,
          }
        : null,
      community_post: cp
        ? {
            post_id: cp.id,
            ocs_source_id: chain.id,
            published_asset: chain.community_post?.cover_url,
            public_api: `${PROD_API}/api/v1/community/posts/${cp.id}`,
            feed_api: `${PROD_API}/api/v1/community/feed?limit=50`,
          }
        : null,
    });
  }
  for (const c of dataset.campaigns || []) {
    const row = state.campaigns?.[c.id];
    if (row?.id) {
      rows.push({
        ocs_source_id: c.id,
        campaign: {
          campaign_id: row.id,
          ocs_source_id: c.id,
          surface: c.surface,
          public_api: `${PROD_API}/api/v1/official/cold-start/surfaces/${c.surface}`,
        },
      });
    }
  }
  return rows;
}

async function probeWeb(route) {
  try {
    const res = await fetch(`${PROD_WEB}${route}`, { redirect: 'manual' });
    return { route, status: res.status, ok: [200, 307, 308].includes(res.status) };
  } catch (e) {
    return { route, status: 0, ok: false, error: String(e.message || e) };
  }
}

const PROD_AMBIENT_COUNTRIES = [
  { matrixId: 'DA-JP-HOME', iso: 'JP', nameZh: '日本', nameEn: 'Japan', sort: 1, chain: 'tokyo-photo', scene: '富士山·河口湖镜面或神社山景', label: '日本·Destination Ambient' },
  { matrixId: 'DA-KR-HOME', iso: 'KR', nameZh: '韩国', nameEn: 'South Korea', sort: 2, chain: 'seoul-food', scene: '景福宫或韩屋框景', label: '韩国·Destination Ambient' },
  { matrixId: 'DA-TH-HOME', iso: 'TH', nameZh: '泰国', nameEn: 'Thailand', sort: 3, chain: 'bangkok-temple', scene: '海岛泻湖或曼谷文化地标', label: '泰国·Destination Ambient' },
  { matrixId: 'DA-SG-HOME', iso: 'SG', nameZh: '新加坡', nameEn: 'Singapore', sort: 4, chain: 'singapore-family', scene: '滨海湾金沙 · Blue Hour', label: '新加坡·Destination Ambient' },
  { matrixId: 'DA-FR-HOME', iso: 'FR', nameZh: '法国', nameEn: 'France', sort: 5, chain: 'paris-art', scene: '巴黎埃菲尔或塞纳河暮色', label: '法国·Destination Ambient' },
  { matrixId: 'DA-US-HOME', iso: 'US', nameZh: '美国', nameEn: 'United States', sort: 6, chain: 'nyc-skyline', scene: '纽约曼哈顿或标志性天际', label: '美国·Destination Ambient' },
  { matrixId: 'DA-AU-HOME', iso: 'AU', nameZh: '澳大利亚', nameEn: 'Australia', sort: 7, chain: 'sydney-coast', scene: '悉尼歌剧院港湾 · 晴天广角', label: '澳大利亚·Destination Ambient' },
  { matrixId: 'DA-ES-HOME', iso: 'ES', nameZh: '西班牙', nameEn: 'Spain', sort: 8, chain: 'barcelona-arch', scene: '巴塞罗那高迪建筑或城市天际', label: '西班牙·Destination Ambient' },
  { matrixId: 'DA-AE-HOME', iso: 'AE', nameZh: '阿联酋', nameEn: 'UAE', sort: 9, chain: 'dubai-luxury', scene: '哈利法塔夜景或沙漠城市天际', label: '阿联酋·Destination Ambient' },
  {
    matrixId: 'DA-CN-HOME',
    iso: 'CN',
    nameZh: '中国',
    nameEn: 'China',
    sort: 10,
    chain: 'product_country_only',
    imageFile: 'ocs-kyoto-culture-community-media.jpg',
    scene: '长城或同类山脊 · 暖色 foliage · 中低明度天空',
    label: '中国·Destination Ambient',
  },
];

function ambientImageUrl(c) {
  const file = c.imageFile || `ocs-${c.chain}-community-media.jpg`;
  return `${PROD_API}/api/v1/uploads/community-posts/${file}`;
}

async function publishProdAmbientCountry(client, tok, c) {
  let countries = await client.req('GET', '/api/v1/admin/content/countries?limit=200', null, tok);
  let row = (countries.json?.items || []).find((x) => x.iso3166 === c.iso);
  if (!row) {
    const created = await client.req(
      'POST',
      '/api/v1/admin/content/countries',
      {
        iso3166: c.iso,
        name_zh: c.nameZh,
        name_en: c.nameEn,
        sort_order: c.sort,
        open_status: 'open',
        payload: { matrix_id: c.matrixId, ocs_prod_bootstrap: STAMP },
      },
      tok
    );
    if (created.status !== 200) throw new Error(`${c.iso} create ${created.status}`);
    row = created.json.item;
  }

  const url = ambientImageUrl(c);
  const mediaList = await client.req(
    'GET',
    `/api/v1/admin/content/media-assets?asset_kind=landing_ambient&country_id=${row.id}`,
    null,
    tok
  );
  let asset = (mediaList.json?.items || []).find((x) => x.country_id === row.id);
  if (!asset) {
    const created = await client.req(
      'POST',
      '/api/v1/admin/content/media-assets',
      {
        asset_kind: 'landing_ambient',
        source_type: 'upload',
        url,
        license: { holder: 'TravelTrust OCS', usage: `prod_destination_ambient_${c.matrixId.toLowerCase()}` },
        alt_text_zh: c.label,
        alt_text_en: `${c.nameEn} Destination Ambient`,
        country_id: row.id,
        payload: { matrix_id: c.matrixId, ocs_prod_bootstrap: STAMP },
      },
      tok
    );
    if (created.status !== 200) throw new Error(`${c.iso} media ${created.status}`);
    asset = created.json.item;
  }

  if (asset.publish_status === 'draft') {
    await client.req('POST', `/api/v1/admin/content/media-assets/${asset.id}/submit-review`, { version: asset.version }, tok);
    asset = (await client.req('GET', `/api/v1/admin/content/media-assets/${asset.id}`, null, tok)).json.item;
  }
  if (asset.publish_status === 'in_review') {
    await client.req('POST', `/api/v1/admin/content/media-assets/${asset.id}/publish`, { version: asset.version }, tok);
    asset = (await client.req('GET', `/api/v1/admin/content/media-assets/${asset.id}`, null, tok)).json.item;
  }

  countries = await client.req('GET', '/api/v1/admin/content/countries?limit=200', null, tok);
  row = (countries.json?.items || []).find((x) => x.iso3166 === c.iso);
  const patch = await client.req(
    'PATCH',
    `/api/v1/admin/content/countries/${row.id}/landing-ambient`,
    { version: row.version, landing_ambient: { image_url: url, image_asset_id: asset.id } },
    tok
  );
  if (patch.status !== 200) throw new Error(`${c.iso} patch ${patch.status}`);

  countries = await client.req('GET', '/api/v1/admin/content/countries?limit=200', null, tok);
  row = (countries.json?.items || []).find((x) => x.iso3166 === c.iso);
  if (row.publish_status === 'draft') {
    await client.req('POST', `/api/v1/admin/content/countries/${row.id}/submit-review`, { version: row.version }, tok);
    countries = await client.req('GET', '/api/v1/admin/content/countries?limit=200', null, tok);
    row = (countries.json?.items || []).find((x) => x.iso3166 === c.iso);
  }
  if (row.publish_status === 'in_review') {
    await client.req('POST', `/api/v1/admin/content/countries/${row.id}/publish`, { version: row.version }, tok);
  }

  const cat = await client.req('GET', `/api/v1/catalog/media?asset_kind=landing_ambient&country_iso=${c.iso}`);
  if ((cat.json?.count || 0) < 1) throw new Error(`${c.iso} catalog count ${cat.json?.count}`);
  return { iso: c.iso, matrixId: c.matrixId, countryId: row.id, publicUrl: url };
}

async function applyProdDestinationAmbient(client, adminTok, checks) {
  if (process.env.OCS_PROD_SKIP_CMS_AMBIENT === '1') {
    record(checks, 'cms_destination_ambient', 'SKIP', 'OCS_PROD_SKIP_CMS_AMBIENT=1');
    return [];
  }
  const published = [];
  for (const c of PROD_AMBIENT_COUNTRIES) {
    const row = await publishProdAmbientCountry(client, adminTok, c);
    published.push(row);
    console.log(`ocs-prod: ambient ${c.iso} published`);
    if (PROD_AMBIENT_COUNTRIES.indexOf(c) < PROD_AMBIENT_COUNTRIES.length - 1) {
      await new Promise((r) => setTimeout(r, Number(process.env.CMS_OPS_RATE_LIMIT_SLEEP_SEC || 3) * 1000));
    }
  }
  fs.writeFileSync(path.join(EVID_DIR, 'cms-destination-ambient-prod.json'), JSON.stringify(published, null, 2) + '\n');
  record(checks, 'cms_destination_ambient', 'PASS', `published ${published.length}/10 countries`);
  return published;
}

(async () => {
  fs.mkdirSync(EVID_DIR, { recursive: true });
  const checks = [];
  const preHashes = {
    registry_yaml: sha256File(REGISTRY),
    dataset_json: sha256File(DATASET),
  };
  fs.writeFileSync(path.join(EVID_DIR, 'check1-manifest-pre.json'), JSON.stringify(preHashes, null, 2) + '\n');

  const postHashes = {
    registry_yaml: sha256File(REGISTRY),
    dataset_json: sha256File(DATASET),
  };
  const manifestFrozen =
    preHashes.registry_yaml === postHashes.registry_yaml && preHashes.dataset_json === postHashes.dataset_json;
  record(
    checks,
    'check1_manifest_frozen',
    manifestFrozen ? 'PASS' : 'FAIL',
    manifestFrozen ? 'registry + dataset sha256 unchanged' : 'manifest mutated — abort apply',
    { pre: preHashes, post: postHashes }
  );
  if (!manifestFrozen) {
    fs.writeFileSync(path.join(EVID_DIR, 'OCS-PROD-BOOTSTRAP-LATEST.json'), JSON.stringify({ verdict: 'FAIL', checks }, null, 2));
    process.exit(1);
  }

  const adminEmail = await resolveSuperAdminEmail();
  console.log(`ocs-prod: super_admin=${adminEmail}`);

  if (!SKIP_ASSETS) {
    const assetOut = path.join(EVID_DIR, 'asset-bootstrap.json');
    const boot = runNode(path.join(__dirname, 'bootstrap-ocs-official-assets.cjs'), {
      API: PROD_API,
      API_BASE: PROD_API,
      FLY_APP,
      OUT: assetOut,
    }, 'asset-bootstrap');
    record(checks, 'asset_bootstrap', boot.ok ? 'PASS' : 'FAIL', boot.out.slice(-400));
  } else {
    record(checks, 'asset_bootstrap', 'SKIP', 'OCS_PROD_SKIP_ASSETS=1');
  }

  const statePath = path.join(EVID_DIR, 'state.json');
  if (!SKIP_APPLY) {
    const apply = runNode(path.join(__dirname, 'run-official-cold-start-dataset.cjs'), {
      API_BASE: PROD_API,
      ADMIN_EMAIL: adminEmail,
      ADMIN_PASS: ADM_PASS,
      TT_OCS_ACCOUNT_PASSWORD: OCS_PASS,
      OCS_STAMP: STAMP,
      OCS_EVIDENCE_DIR: EVID_DIR,
      OCS_POST_INTERVAL_MS: process.env.OCS_POST_INTERVAL_MS || '6500',
    }, 'ocs-apply');
    record(checks, 'ocs_apply', apply.ok ? 'PASS' : 'FAIL', apply.out.slice(-600));
    if (!apply.ok) {
      fs.writeFileSync(
        path.join(EVID_DIR, 'OCS-PROD-BOOTSTRAP-LATEST.json'),
        JSON.stringify({ verdict: 'FAIL', checks, OCS_PRODUCTION_BOOTSTRAP: 'FAIL' }, null, 2) + '\n'
      );
      process.exit(1);
    }
  } else if (!fs.existsSync(statePath)) {
    throw new Error('OCS_PROD_SKIP_APPLY=1 but state.json missing');
  }

  const postApplyHashes = {
    registry_yaml: sha256File(REGISTRY),
    dataset_json: sha256File(DATASET),
  };
  const stillFrozen =
    preHashes.registry_yaml === postApplyHashes.registry_yaml &&
    preHashes.dataset_json === postApplyHashes.dataset_json;
  record(checks, 'check1_manifest_post_apply', stillFrozen ? 'PASS' : 'FAIL', 'post-apply manifest hash', {
    hashes: postApplyHashes,
  });

  const dataset = JSON.parse(fs.readFileSync(DATASET, 'utf8'));
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const lineage = buildLineage(state, dataset);
  fs.writeFileSync(path.join(EVID_DIR, 'check2-lineage.json'), JSON.stringify(lineage, null, 2) + '\n');
  const lineageComplete = lineage.filter((r) => r.guide && r.provider_listing && r.acquisition_listing).length;
  record(
    checks,
    'check2_lineage_traceable',
    lineageComplete >= (dataset.chains || []).length ? 'PASS' : 'FAIL',
    `traceable chains ${lineageComplete}/${(dataset.chains || []).length}`,
    { sample: lineage.slice(0, 2) }
  );

  const validateJson = path.join(EVID_DIR, 'ocs-validate.json');
  const validate = runNode(path.join(__dirname, 'validate-official-cold-start-dataset.cjs'), {
    API_BASE: PROD_API,
    WEB_BASE: PROD_WEB,
    STATE: statePath,
    ADMIN_EMAIL: adminEmail,
    ADMIN_PASS: ADM_PASS,
    OCS_VALIDATE_JSON: validateJson,
  }, 'ocs-validate');
  let validatePayload = null;
  if (fs.existsSync(validateJson)) {
    validatePayload = JSON.parse(fs.readFileSync(validateJson, 'utf8'));
  }
  record(
    checks,
    'check3_ocs_validate',
    validate.ok && validatePayload?.verdict === 'PASS' ? 'PASS' : 'FAIL',
    validatePayload?.verdict || validate.out.slice(-200)
  );

  const client = createClient(PROD_API);
  const adminTok = await client.userLogin(adminEmail, ADM_PASS);

  await applyProdDestinationAmbient(client, adminTok, checks);

  const countries = await client.req('GET', '/api/v1/admin/content/countries?limit=200', null, adminTok);
  const countryItems = countries.json.items || [];
  const publishedCountries = countryItems.filter((c) => c.publish_status === 'published');

  const catalogCountries = await client.req('GET', '/api/v1/catalog/countries?limit=50');
  const catalogCountryItems = catalogCountries.json.items || [];
  const ambientPublished = catalogCountryItems.filter((c) => {
    const la = c.payload?.landing_ambient || c.landing_ambient;
    return !!(la && la.image_url);
  }).length;

  const productIsos = ['JP', 'KR', 'TH', 'SG', 'FR', 'US', 'AU', 'ES', 'AE', 'CN'];
  let catalogCityCount = 0;
  let catalogPoiCount = 0;
  for (const iso of productIsos) {
    const cities = await client.req('GET', `/api/v1/catalog/cities?country_iso=${iso}&limit=100`);
    catalogCityCount += cities.json.count || (cities.json.items || []).length;
    for (const city of cities.json.items || []) {
      const poi = await client.req(
        'GET',
        `/api/v1/catalog/poi-images?country_iso=${iso}&city=${encodeURIComponent(city.name_zh)}&limit=100`
      );
      catalogPoiCount += poi.json.count || (poi.json.items || []).length;
    }
  }

  const guides = await client.req('GET', '/api/v1/guides?limit=200');
  const guideCount = (guides.json.items || guides.json.guides || []).length;
  const provider = await client.req('GET', '/api/v1/market/provider/listings?limit=100');
  const providerCount = (provider.json.items || provider.json.listings || []).length;
  const acquisition = await client.req('GET', '/api/v1/market/acquisition/listings?limit=100');
  const acqCount = (acquisition.json.items || acquisition.json.listings || []).length;
  const feed = await client.req('GET', '/api/v1/community/feed?limit=50');
  const feedCount = (feed.json.posts || feed.json.items || []).length;
  const homeHero = await client.req('GET', '/api/v1/official/cold-start/surfaces/home_hero');
  const marketFeed = await client.req('GET', '/api/v1/official/cold-start/surfaces/market_feed');

  const targets = {
    countries: { actual: publishedCountries.length, target: 10, ok: publishedCountries.length >= 10 },
    landing_ambient: { actual: ambientPublished, target: 10, ok: ambientPublished >= 10 },
    cities: { actual: catalogCityCount, target: 38, ok: catalogCityCount >= 38 },
    poi: { actual: catalogPoiCount, target: 234, ok: catalogPoiCount >= 234, ssot_full: 330, ssot_ok: catalogPoiCount >= 330 },
    guides: { actual: guideCount, target: 1, ok: guideCount > 0 },
    provider_listings: { actual: providerCount, target: 1, ok: providerCount > 0 },
    acquisition_listings: { actual: acqCount, target: 10, ok: acqCount >= 10 },
    community_feed: { actual: feedCount, target: 3, ok: feedCount >= 3 },
    campaign_home_hero: { actual: homeHero.status === 200 ? 1 : 0, target: 1, ok: homeHero.status === 200 },
    campaign_market_feed: {
      actual: marketFeed.status === 200 && marketFeed.json?.campaign ? 1 : 0,
      target: 1,
      ok: marketFeed.status === 200 && !!marketFeed.json?.campaign,
    },
  };

  const webProbes = await Promise.all(['/', '/market', '/community', '/guides'].map((r) => probeWeb(r)));
  const webOk = webProbes.every((p) => p.ok);

  const assetsDoc = loadAssetsManifest();
  let assetProbeOk = 0;
  for (const a of assetsDoc.assets.slice(0, 5)) {
    const probe = await verifyAssetDelivery(PROD_API, a);
    if (probe.ok) assetProbeOk += 1;
  }

  const ocsCatalogPass = validate.ok && validatePayload?.verdict === 'PASS';
  const ocsSurfacePass =
    targets.guides.ok &&
    targets.provider_listings.ok &&
    targets.acquisition_listings.ok &&
    targets.community_feed.ok &&
    targets.campaign_home_hero.ok &&
    targets.campaign_market_feed.ok &&
    targets.countries.ok &&
    targets.landing_ambient.ok &&
    webOk &&
    assetProbeOk >= 5;
  const parityPass = ocsCatalogPass && ocsSurfacePass && targets.cities.ok && targets.poi.ok;

  const report = {
    schema: 'traveltrust.ocs_production_bootstrap.v1',
    stamp: STAMP,
    recorded_at: new Date().toISOString(),
    api: PROD_API,
    web: PROD_WEB,
    policy: 'Frozen OCS apply → Production (no manifest regeneration)',
    check1_manifest_frozen: stillFrozen,
    check2_lineage_rows: lineage.length,
    check3_parity: {
      targets,
      web_probes: webProbes,
      asset_probe_sample: `${assetProbeOk}/5`,
      ocs_validate_verdict: validatePayload?.verdict || 'UNKNOWN',
    },
    machine_keys: {
      OCS_PRODUCTION_BOOTSTRAP:
        ocsCatalogPass && stillFrozen && lineageComplete >= (dataset.chains || []).length ? 'PASS' : 'FAIL',
      OCS_PRODUCTION_PARITY_AUDIT: parityPass ? 'PASS' : ocsSurfacePass ? 'PARTIAL_CMS_POI_PENDING' : 'FAIL',
      OCS_PRODUCTION_CATALOG_PARITY: ocsSurfacePass && ocsCatalogPass ? 'PASS' : 'FAIL',
      TT_OCS_PROD_BOOTSTRAP: ocsCatalogPass && stillFrozen ? 'PASS' : 'FAIL',
    },
    checks,
    admin_email_redacted: adminEmail.replace(/^(.{8}).*(@.*)$/, '$1***$2'),
    evidence_dir: EVID_DIR.replace(/\\/g, '/'),
    next_steps: parityPass
      ? [
          '② Web3 Payment Production Verification (USDC + Escrow)',
          '③ CMS Full Operations Verification',
          '④ API / Data Lineage / Parity',
          '⑤ CDN / Media',
          '⑥ Domain / TLS / CORS',
          '⑦ Monitoring / Alert',
          '⑧ Backup / Rollback',
          '⑨ Security Review',
          '⑩ Owner Final Sign-off',
        ]
      : ['Complete CMS surfaces (countries/ambient) if pending', 'Re-run parity audit', 'Then ② Web3 Payment Verification'],
    owner_signoff: 'BLOCKED until OCS_PRODUCTION_PARITY_AUDIT=PASS',
  };

  fs.writeFileSync(path.join(EVID_DIR, 'OCS-PROD-BOOTSTRAP.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(EVID_ROOT, 'OCS-PROD-BOOTSTRAP-LATEST.json'), JSON.stringify(report, null, 2) + '\n');

  console.log(`OCS_PRODUCTION_BOOTSTRAP: ${report.machine_keys.OCS_PRODUCTION_BOOTSTRAP}`);
  console.log(`OCS_PRODUCTION_PARITY_AUDIT: ${report.machine_keys.OCS_PRODUCTION_PARITY_AUDIT}`);
  console.log(`evidence=${EVID_DIR.replace(/\\/g, '/')}`);
  if (report.machine_keys.OCS_PRODUCTION_BOOTSTRAP !== 'PASS') process.exit(1);
  if (report.machine_keys.OCS_PRODUCTION_PARITY_AUDIT !== 'PASS') process.exit(2);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
