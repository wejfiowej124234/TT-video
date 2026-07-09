#!/usr/bin/env node
/**
 * PER P0-1 · Business Closed Loop verification (Inventory-driven · no code changes).
 *
 *   node scripts/dev/run-per-business-closed-loop-p0.cjs
 *   API=https://tt-api-staging.fly.dev WEB=https://tt-web-staging.fly.dev node ...
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const ROOT = path.join(__dirname, '../..');
const INVENTORY_LATEST = path.join(
  ROOT,
  'evidence/GO_content_ownership_inventory/CONTENT-OWNERSHIP-INVENTORY-LATEST.json',
);
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_preparation/per-business-closed-loop');

const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const WEB = (process.env.WEB || process.env.WEB_BASE || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');
const PASSWORD = process.env.TT_TEST_PASSWORD || 'Test123!';
const TOURIST = process.env.TT_TEST_C2_EMAIL || 'tourist@test.com';
const MERCHANT = process.env.TT_TEST_C4_EMAIL || 'merchant@test.com';

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

function request(url, opts = {}) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const u = new URL(url);
    const body = opts.body ? JSON.stringify(opts.body) : null;
    const req = lib.request(
      {
        hostname: u.hostname,
        port: u.port || (url.startsWith('https') ? 443 : 80),
        path: u.pathname + u.search,
        method: opts.method || 'GET',
        headers: {
          ...(body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {}),
          ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
          ...(opts.headers || {}),
        },
      },
      (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(d);
          } catch {
            json = null;
          }
          resolve({ status: res.statusCode || 0, json, text: d, headers: res.headers });
        });
      },
    );
    req.on('error', (e) => resolve({ status: 0, json: null, text: String(e), headers: {} }));
    req.setTimeout(opts.timeoutMs || 20000, () => {
      req.destroy();
      resolve({ status: 0, json: null, text: 'timeout', headers: {} });
    });
    if (body) req.write(body);
    req.end();
  });
}

async function login(email) {
  const r = await request(`${API}/auth/login`, {
    method: 'POST',
    body: { email, password: PASSWORD },
  });
  return r.status === 200 && r.json?.token ? r.json.token : null;
}

async function headWeb(route) {
  const r = await request(`${WEB}${route}`, { method: 'GET', timeoutMs: 25000 });
  return r.status;
}

function rowTemplate(inv, extra) {
  return {
    inventory_id: inv.id,
    page_module: inv.page_module,
    route: inv.route,
    owner: inv.owner,
    inventory_current_status: inv.current_status,
    business_criticality: 'P0',
    entry: extra.entry,
    business_action: extra.business_action,
    expected_result: extra.expected_result,
    actual_result: extra.actual_result,
    blockers: extra.blockers || [],
    loop_result: extra.loop_result,
    evidence_refs: extra.evidence_refs || [],
    owner_sign_off: {
      status: extra.loop_result === 'FAIL' ? 'BLOCKED' : 'PENDING_OWNER',
      owner: inv.owner,
      note: 'Solo maintainer attestation slot · Production Entry Review P0-1',
    },
  };
}

async function probeHomeHeroOcs(inv) {
  const r = await request(`${API}/api/v1/official/cold-start/surfaces/home_hero`);
  const items = r.json?.items || r.json?.campaign?.items || [];
  const ok = r.status === 200 && r.json?.status === 'ok';
  return rowTemplate(inv, {
    entry: `${WEB}/`,
    business_action: 'GET /api/v1/official/cold-start/surfaces/home_hero',
    expected_result: '200 · status=ok · campaign/surface resolved',
    actual_result: `http=${r.status} status=${r.json?.status} items=${Array.isArray(items) ? items.length : 'n/a'}`,
    blockers: ok ? [] : ['home_hero surface unavailable'],
    loop_result: ok ? 'PASS' : 'FAIL',
    evidence_refs: [`${API}/api/v1/official/cold-start/surfaces/home_hero`],
  });
}

async function probeCmsAmbient(inv, id) {
  const r = await request(`${API}/api/v1/catalog/media?asset_kind=landing_ambient&country_iso=JP`);
  const hasCatalog = r.status === 200 && (r.json?.items || []).some((i) => i.url);
  const web = await headWeb('/');
  const webOk = web === 200;
  const loop = webOk && (hasCatalog || inv.current_status === 'draft');
  return rowTemplate(inv, {
    entry: `${WEB}/`,
    business_action: 'User selects country · backdrop loads (catalog or ① fallback)',
    expected_result:
      inv.current_status === 'draft'
        ? 'Page loads · catalog optional empty · fallback ambient acceptable ①'
        : 'Catalog landing_ambient live for JP',
    actual_result: `web_home=${web} catalog_jp_items=${(r.json?.items || []).length} inventory_status=${inv.current_status}`,
    blockers: hasCatalog ? [] : ['CMS Wave1 not live · catalog landing_ambient empty (Expected Difference ①)'],
    loop_result: loop ? (hasCatalog ? 'PASS' : 'PASS_EXPECTED_DIFFERENCE') : 'FAIL',
    evidence_refs: [`${API}/api/v1/catalog/media?asset_kind=landing_ambient&country_iso=JP`, `${WEB}/`],
  });
}

async function probeHomeItinerary(inv) {
  const token = await login(TOURIST);
  if (!token) {
    return rowTemplate(inv, {
      entry: `${WEB}/`,
      business_action: 'POST /api/v1/itineraries (C2 login → create)',
      expected_result: '200 · itinerary_id + daily_itinerary',
      actual_result: 'auth/login failed',
      blockers: ['C2 login failed on staging'],
      loop_result: 'FAIL',
    });
  }
  const r = await request(`${API}/api/v1/itineraries`, {
    method: 'POST',
    token,
    body: { destination: '日本', city: '东京', travel_date: '2026-08-15', days: 3 },
  });
  const ok = r.status === 200 && r.json?.itinerary_id && Array.isArray(r.json?.daily_itinerary);
  return rowTemplate(inv, {
    entry: `${WEB}/`,
    business_action: 'Hero 创单 · POST /api/v1/itineraries',
    expected_result: '200 · itinerary_id · daily_itinerary[]',
    actual_result: `http=${r.status} itinerary_id=${r.json?.itinerary_id || 'none'} days=${r.json?.daily_itinerary?.length ?? 0}`,
    blockers: ok ? [] : [r.json?.message || r.text?.slice(0, 120) || 'itinerary create failed'],
    loop_result: ok ? 'PASS' : 'FAIL',
    evidence_refs: [`${API}/api/v1/itineraries`],
  });
}

async function probeOcsSurface(inv, surface, webRoute) {
  const r = await request(`${API}/api/v1/official/cold-start/surfaces/${surface}`);
  const ok = r.status === 200 && r.json?.status === 'ok';
  return rowTemplate(inv, {
    entry: `${WEB}${webRoute}`,
    business_action: `GET …/official/cold-start/surfaces/${surface}`,
    expected_result: '200 · status=ok · campaign resolved',
    actual_result: `http=${r.status} surface=${r.json?.surface || surface}`,
    blockers: ok ? [] : [`surface ${surface} not ok`],
    loop_result: ok ? 'PASS' : 'FAIL',
    evidence_refs: [`${API}/api/v1/official/cold-start/surfaces/${surface}`],
  });
}

async function probeMarketMain(inv) {
  const orders = await request(`${API}/api/v1/discover/orders?limit=5`);
  const guides = await request(`${API}/api/v1/guides?limit=5`);
  const web = await headWeb('/market');
  const ok = orders.status === 200 && guides.status === 200 && web === 200;
  const blockers = [];
  if ((orders.json?.items || []).length === 0) blockers.push('discover/orders empty on staging');
  if ((guides.json?.items || []).length === 0) blockers.push('guides list empty');
  return rowTemplate(inv, {
    entry: `${WEB}/market`,
    business_action: 'Load market · discover orders + guides SSR/API',
    expected_result: '200 APIs · page 200 · list data for cards',
    actual_result: `web=${web} orders=${(orders.json?.items || []).length} guides=${(guides.json?.items || []).length}`,
    blockers,
    loop_result: ok && blockers.length === 0 ? 'PASS' : ok ? 'PASS_EXPECTED_DIFFERENCE' : 'FAIL',
    evidence_refs: [`${API}/api/v1/discover/orders`, `${API}/api/v1/guides`, `${WEB}/market`],
  });
}

async function probeMarketOrderCover(inv) {
  const orders = await request(`${API}/api/v1/discover/orders?limit=10`);
  const items = orders.json?.items || [];
  const withImage = items.filter((o) => o.image || o.cover_url || o.image_url);
  const ok = orders.status === 200;
  return rowTemplate(inv, {
    entry: `${WEB}/market`,
    business_action: 'Render order cards with cover image or fallback',
    expected_result: 'discover items present · image field or fallback path',
    actual_result: `orders=${items.length} with_image_field=${withImage.length}`,
    blockers: items.length === 0 ? ['discover/orders empty — card loop cannot close on staging'] : [],
    loop_result: ok && items.length > 0 ? 'PASS' : ok ? 'FAIL' : 'FAIL',
    evidence_refs: [`${API}/api/v1/discover/orders`],
  });
}

async function probeMarketGuideAvatar(inv) {
  const guides = await request(`${API}/api/v1/guides?limit=10`);
  const items = guides.json?.items || [];
  const withAvatar = items.filter((g) => g.avatar_url);
  const ok = guides.status === 200 && withAvatar.length > 0;
  let headOk = 0;
  if (withAvatar[0]?.avatar_url) {
    const url = withAvatar[0].avatar_url.startsWith('http')
      ? withAvatar[0].avatar_url
      : `${API}${withAvatar[0].avatar_url}`;
    const h = await request(url, { method: 'GET' });
    headOk = h.status;
  }
  return rowTemplate(inv, {
    entry: `${WEB}/market`,
    business_action: 'Guide cards load avatar_url (OCS-owned media)',
    expected_result: 'guides[] with avatar_url · media HTTP 200',
    actual_result: `guides=${items.length} avatars=${withAvatar.length} sample_http=${headOk}`,
    blockers: ok && headOk === 200 ? [] : ['missing guide avatars or media 404'],
    loop_result: ok && headOk === 200 ? 'PASS' : 'FAIL',
    evidence_refs: [`${API}/api/v1/guides`],
  });
}

async function probeCommunityFeed(inv) {
  const r = await request(`${API}/api/v1/community/feed?limit=10`);
  const posts = r.json?.posts || [];
  const ok = r.status === 200 && posts.length > 0;
  return rowTemplate(inv, {
    entry: `${WEB}/community`,
    business_action: 'GET /api/v1/community/feed',
    expected_result: '200 · posts[] non-empty',
    actual_result: `http=${r.status} posts=${posts.length}`,
    blockers: ok ? [] : ['community feed empty or error'],
    loop_result: ok ? 'PASS' : 'FAIL',
    evidence_refs: [`${API}/api/v1/community/feed`, `${WEB}/community`],
  });
}

async function probeCommunityExplore(inv) {
  const r = await request(`${API}/api/v1/community/explore/destinations`);
  const dest = r.json?.destinations || [];
  const web = await headWeb('/community/explore');
  const ok = r.status === 200 && dest.length > 0 && web === 200;
  return rowTemplate(inv, {
    entry: `${WEB}/community/explore`,
    business_action: 'GET …/community/explore/destinations',
    expected_result: '200 · destinations[] · page 200',
    actual_result: `web=${web} destinations=${dest.length}`,
    blockers: ok ? [] : ['explore destinations missing'],
    loop_result: ok ? 'PASS' : 'FAIL',
    evidence_refs: [`${API}/api/v1/community/explore/destinations`],
  });
}

async function probeGuidesList(inv) {
  const r = await request(`${API}/api/v1/guides?limit=10`);
  const items = r.json?.items || [];
  const web = await headWeb('/guides');
  const ok = r.status === 200 && items.length > 0 && web === 200;
  return rowTemplate(inv, {
    entry: `${WEB}/guides`,
    business_action: 'GET /api/v1/guides · list page',
    expected_result: '200 · guides with OCS avatars · page 200',
    actual_result: `web=${web} guides=${items.length}`,
    blockers: ok ? [] : ['guides list unavailable'],
    loop_result: ok ? 'PASS' : 'FAIL',
    evidence_refs: [`${API}/api/v1/guides`, `${WEB}/guides`],
  });
}

async function probeAuthLogin(inv) {
  const token = await login(TOURIST);
  const web = await headWeb('/auth/login');
  const ok = !!token && web === 200;
  return rowTemplate(inv, {
    entry: `${WEB}/auth/login`,
    business_action: 'POST /auth/login (C2) · page load',
    expected_result: '200 token · login page 200',
    actual_result: `web=${web} token=${token ? 'issued' : 'missing'}`,
    blockers: ok ? [] : ['login API or page failed'],
    loop_result: ok ? 'PASS' : 'FAIL',
    evidence_refs: [`${API}/auth/login`, `${WEB}/auth/login`],
  });
}

async function probeAuthRegister(inv) {
  const web = await headWeb('/auth/register');
  const health = await request(`${API}/health`);
  const ok = web === 200 && health.status === 200;
  return rowTemplate(inv, {
    entry: `${WEB}/auth/register`,
    business_action: 'Register page load · API health (no duplicate account create)',
    expected_result: 'register page 200 · API up',
    actual_result: `web=${web} api_health=${health.status}`,
    blockers: ok ? [] : ['register surface unavailable'],
    loop_result: ok ? 'PASS' : 'FAIL',
    evidence_refs: [`${WEB}/auth/register`, `${API}/health`],
  });
}

async function probeEscrowOrder(inv) {
  const token = await login(TOURIST);
  if (!token) {
    return rowTemplate(inv, {
      entry: `${WEB}/escrow/[id]`,
      business_action: 'Create itinerary/order · GET /api/v1/orders/:id',
      expected_result: 'order readable for escrow page',
      actual_result: 'login failed',
      blockers: ['C2 login failed'],
      loop_result: 'FAIL',
    });
  }
  const create = await request(`${API}/api/v1/itineraries`, {
    method: 'POST',
    token,
    body: { destination: '日本', city: '大阪', travel_date: '2026-09-01', days: 2 },
  });
  const orderId = create.json?.order_id || create.json?.itinerary_id;
  if (!orderId) {
    return rowTemplate(inv, {
      entry: `${WEB}/escrow/[id]`,
      business_action: 'POST itinerary → GET order',
      expected_result: 'order_id for escrow deep link',
      actual_result: `create failed http=${create.status}`,
      blockers: [create.json?.message || 'no order_id'],
      loop_result: 'FAIL',
    });
  }
  const get = await request(`${API}/api/v1/orders/${orderId}`, { token });
  const web = await headWeb(`/escrow/${orderId}`);
  const ok = get.status === 200 && get.json?.order?.id === orderId && web === 200;
  return rowTemplate(inv, {
    entry: `${WEB}/escrow/${orderId}`,
    business_action: 'GET /api/v1/orders/:id after create · escrow page',
    expected_result: '200 order JSON · escrow page 200',
    actual_result: `get=${get.status} state=${get.json?.order?.state} web=${web}`,
    blockers: ok ? [] : ['order fetch or escrow page failed'],
    loop_result: ok ? 'PASS' : 'FAIL',
    evidence_refs: [`${API}/api/v1/orders/${orderId}`, `${WEB}/escrow/${orderId}`],
  });
}

async function probeProviderRegister(inv) {
  const token = await login(MERCHANT);
  const web = await headWeb('/provider/register');
  const ok = !!token && web === 200;
  return rowTemplate(inv, {
    entry: `${WEB}/provider/register`,
    business_action: 'C4 login · provider register page load',
    expected_result: 'merchant auth · register page 200',
    actual_result: `web=${web} merchant_token=${token ? 'yes' : 'no'}`,
    blockers: ok ? [] : ['merchant login or provider register page failed'],
    loop_result: ok ? 'PASS' : 'FAIL',
    evidence_refs: [`${API}/auth/login`, `${WEB}/provider/register`],
  });
}

const PROBE_MAP = {
  'home-hero-ocs': probeHomeHeroOcs,
  'home-destination-ambient': (inv) => probeCmsAmbient(inv, 'home-destination-ambient'),
  'home-itinerary-preview': probeHomeItinerary,
  'home-featured-ocs': (inv) => probeOcsSurface(inv, 'home_hero', '/'),
  'market-main': probeMarketMain,
  'market-order-cover': probeMarketOrderCover,
  'market-guide-avatar': probeMarketGuideAvatar,
  'market-ocs-feed': (inv) => probeOcsSurface(inv, 'market_feed', '/market'),
  'community-main': probeCommunityFeed,
  'community-feed-ocs-promo': (inv) => probeOcsSurface(inv, 'community_feed', '/community'),
  'community-explore': probeCommunityExplore,
  'guides-list-avatar': probeGuidesList,
  'dest-ambient-all-countries': (inv) => probeCmsAmbient(inv, 'dest-ambient-all-countries'),
  'auth-login': probeAuthLogin,
  'auth-register': probeAuthRegister,
  'escrow-order': probeEscrowOrder,
  'provider-register': probeProviderRegister,
};

async function main() {
  const stamp =
    arg('--stamp') || new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  if (!fs.existsSync(INVENTORY_LATEST)) {
    console.error('INVENTORY_LATEST missing');
    process.exit(2);
  }
  const inventory = JSON.parse(fs.readFileSync(INVENTORY_LATEST, 'utf8'));
  const p0Pages = inventory.per_p0_pages || [];
  const p1Pages = (inventory.items_by_criticality?.P1 || []).map((p) => p.id);
  const p2Pages = (inventory.items_by_criticality?.P2 || []).map((p) => p.id);

  const health = await request(`${API}/health`);
  if (health.status !== 200) {
    console.error(`API health failed: ${API}/health status=${health.status}`);
    process.exit(2);
  }

  const p0Results = [];
  for (const inv of p0Pages) {
    const fn = PROBE_MAP[inv.id];
    if (!fn) {
      p0Results.push(
        rowTemplate(inv, {
          entry: inv.route,
          business_action: 'N/A',
          expected_result: 'probe defined',
          actual_result: 'no probe mapped',
          blockers: ['missing probe mapping'],
          loop_result: 'FAIL',
        }),
      );
      continue;
    }
    p0Results.push(await fn(inv));
  }

  const failCount = p0Results.filter((r) => r.loop_result === 'FAIL').length;
  const passCount = p0Results.filter((r) => r.loop_result === 'PASS').length;
  const edCount = p0Results.filter((r) => r.loop_result === 'PASS_EXPECTED_DIFFERENCE').length;
  const overall = failCount === 0 ? 'PASS' : 'FAIL';

  const report = {
    schema: 'traveltrust.per_business_closed_loop_p0.v1',
    stamp_utc: stamp,
    phase: 'Production Preparation · PER Item 1',
    environment: {
      api: API,
      web: WEB,
      phase_note: '② staging probe · not ③ Production GO',
    },
    inventory_ref: 'evidence/GO_content_ownership_inventory/CONTENT-OWNERSHIP-INVENTORY-LATEST.json',
    flow: ['inventory', 'p0_pages', 'evidence', 'signoff'],
    p0_verification: p0Results,
    p1_deferred: {
      note: 'P0-1 scope completes P0 entry list first; P1 verified after P0 PASS',
      page_ids: p1Pages,
      status: 'NOT_RUN',
    },
    p2_deferred: {
      note: 'P2 after P1',
      page_ids: p2Pages,
      status: 'NOT_RUN',
    },
    summary: {
      p0_total: p0Results.length,
      pass: passCount,
      pass_expected_difference: edCount,
      fail: failCount,
      blocking_items: p0Results.filter((r) => r.loop_result === 'FAIL').flatMap((r) => r.blockers),
    },
    owner_sign_off: {
      status: overall === 'PASS' ? 'PENDING_OWNER' : 'BLOCKED',
      attestation:
        'Sebastian Ward · Solo maintainer · PER P0-1 Business Closed Loop evidence pack',
      signed_at_utc: null,
    },
    TT_PER_BUSINESS_CLOSED_LOOP: overall,
    honest_boundary: 'PASS = staging business loops for Inventory P0 · ≠ Production GO · ≠ PER complete',
  };

  const outDir = path.join(EVID_ROOT, stamp);
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'PER-BUSINESS-CLOSED-LOOP-P0.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(
    path.join(EVID_ROOT, 'PER-BUSINESS-CLOSED-LOOP-P0-LATEST.json'),
    JSON.stringify(report, null, 2) + '\n',
  );

  console.log(`TT_PER_BUSINESS_CLOSED_LOOP: ${overall}`);
  console.log(`TT_PER_P0_PASS: ${passCount} EXPECTED_DIFF: ${edCount} FAIL: ${failCount}`);
  console.log(`TT_PER_EVIDENCE: evidence/GO_production_preparation/per-business-closed-loop/${stamp}`);
  if (failCount > 0) {
    for (const r of p0Results.filter((x) => x.loop_result === 'FAIL')) {
      console.log(`TT_PER_P0_FAIL: ${r.inventory_id} blockers=${r.blockers.join(';')}`);
    }
  }
  process.exit(failCount === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
