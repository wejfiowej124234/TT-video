#!/usr/bin/env node
/**
 * Staging public page-surface deep check (② · ≠ GO).
 * Verifies identity tip match · 10×4 · announcements · ambient · feeds · no Unsplash HTML · wallet dropdown chunk.
 *
 *   node scripts/dev/check-staging-public-page-surfaces.cjs
 *   API_BASE=… WEB_BASE=… EXPECT_GIT_SHA=… node scripts/dev/check-staging-public-page-surfaces.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API_BASE || process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const WEB = (process.env.WEB_BASE || process.env.WEB || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');
const EXPECT = (process.env.EXPECT_GIT_SHA || '').trim();
const OUT =
  process.env.OUT ||
  path.join(ROOT, 'evidence/GO_public_display_10x4_lock/STAGING-PAGE-SURFACES-LATEST.json');

async function getJson(url) {
  const r = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(40000) });
  const text = await r.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { _raw: text.slice(0, 200) };
  }
  return { status: r.status, json };
}

async function getText(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(40000) });
  const text = await r.text();
  return { status: r.status, text };
}

function hasUnsplash(s) {
  return /unsplash\.com/i.test(String(s || ''));
}

function countList(json, keys) {
  for (const k of keys) {
    if (Array.isArray(json[k])) return json[k].length;
  }
  if (Array.isArray(json)) return json.length;
  return 0;
}

(async () => {
  const fails = [];
  const report = {
    schema: 'traveltrust.staging_public_page_surfaces.v1',
    recorded_utc: new Date().toISOString(),
    api: API,
    web: WEB,
    surfaces: {},
    fails: [],
    verdict: 'UNKNOWN',
  };

  const ri = await getJson(`${WEB}/api/release-identity?t=${Date.now()}`);
  const meta = await getJson(`${API}/meta`);
  const webSha = ri.json.git_sha || '';
  const apiSha = (meta.json.build && meta.json.build.git_sha) || '';
  report.surfaces.identity = {
    web_sha: webSha,
    api_sha: apiSha,
    identity_source: ri.json.identity_source || null,
    cms_baseline: ri.json.cms_baseline || null,
    web_api_match: Boolean(webSha && apiSha && webSha === apiSha),
    expect: EXPECT || null,
  };
  if (EXPECT) {
    if (webSha !== EXPECT) fails.push(`web_sha_ne_expect:${EXPECT.slice(0, 12)}`);
  } else if (!report.surfaces.identity.web_api_match) {
    // FE-only tip bump may leave API behind — warn but do not fail without EXPECT
    report.surfaces.identity.note = 'web_api_tip_mismatch_without_EXPECT (allowed for FE-only); set EXPECT_GIT_SHA to enforce';
  }
  if (ri.json.identity_source !== 'docker-bake' && !webSha) fails.push('identity_source_weak');

  const checks = [
    ['guides', `${API}/api/v1/guides?limit=50`, ['items', 'guides'], 10],
    ['provider', `${API}/api/v1/market/provider/listings?limit=50`, ['items', 'listings'], 10],
    ['acquisition', `${API}/api/v1/market/acquisition/listings?limit=50`, ['items', 'listings'], 10],
    ['community', `${API}/api/v1/community/feed?limit=50`, ['posts', 'items', 'feed'], 10],
    ['announcements', `${API}/api/v1/public/announcements?limit=50`, ['items', 'announcements'], null],
    ['announcements_pulse', `${API}/api/v1/public/announcements/pulse`, ['items', 'pulse', 'labels'], null],
    ['landing_ambient', `${API}/api/v1/catalog/media?asset_kind=landing_ambient&limit=20`, ['items'], 10],
    ['did_rank_guides', `${API}/api/v1/did-rank/guides?limit=20`, ['guides', 'items'], null],
  ];

  for (const [id, url, keys, expect] of checks) {
    const { status, json } = await getJson(url);
    const n = countList(json, keys);
    const blob = JSON.stringify(json);
    const row = {
      http: status,
      count: n,
      unsplash: hasUnsplash(blob),
      expect,
    };
    report.surfaces[id] = row;
    if (status !== 200) fails.push(`${id}_http_${status}`);
    if (expect != null && n !== expect) fails.push(`${id}_count_${n}_ne_${expect}`);
    if (row.unsplash) fails.push(`${id}_unsplash`);
  }

  const pages = ['/', '/market', '/market/provider', '/market/acquisition', '/did-rank', '/community', '/traveltrust'];
  report.surfaces.pages = {};
  let walletDropInBundle = false;
  for (const p of pages) {
    const { status, text } = await getText(`${WEB}${p}`);
    const unsplash = (text.match(/unsplash\.com/gi) || []).length;
    const cos = (text.match(/tigris\.dev|traveltrust-community-media|da-hero-/gi) || []).length;
    report.surfaces.pages[p] = { http: status, unsplash, cos, len: text.length };
    if (status !== 200) fails.push(`page_${p}_http_${status}`);
    if (unsplash > 0) fails.push(`page_${p}_unsplash`);
    // pull a few script URLs and look for wallet dropdown marker (home only once)
    if (p === '/' && !walletDropInBundle) {
      const urls = [...text.matchAll(/\/_next\/static\/[^"']+\.js/g)].map((m) => m[0]).slice(0, 50);
      for (const u of urls) {
        try {
          const js = await getText(`${WEB}${u}`);
          if (/wallet-header-dropdown|tt-wallet-dropdown/.test(js.text)) {
            walletDropInBundle = true;
            break;
          }
          if (/createPortal/.test(js.text) && /z-\[320\]/.test(js.text) && /aria-modal/.test(js.text)) {
            fails.push('wallet_modal_z320_still_in_bundle');
            break;
          }
        } catch {
          /* ignore */
        }
      }
    }
  }
  report.surfaces.wallet_dropdown_in_js = walletDropInBundle;
  if (!walletDropInBundle) fails.push('wallet_dropdown_missing_in_js');

  report.fails = fails;
  report.verdict = fails.length ? 'PAGE_SURFACE_DRIFT' : 'PAGE_SURFACE_OK';
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  console.log(report.verdict === 'PAGE_SURFACE_OK' ? 'TT_STAGING_PAGE_SURFACES: OK' : 'TT_STAGING_PAGE_SURFACES: DRIFT');
  process.exit(fails.length ? 2 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
