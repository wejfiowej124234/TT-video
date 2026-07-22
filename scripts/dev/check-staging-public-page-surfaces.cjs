#!/usr/bin/env node
/**
 * Staging public page-surface deep check (② · ≠ GO).
 * Verifies identity tip · OCS canonical pack · 10×4 OCS IDs · campaigns · announcements ·
 * ambient · no Unsplash/mojibake · wallet dropdown chunk.
 *
 *   node scripts/dev/check-staging-public-page-surfaces.cjs
 *   API_BASE=… WEB_BASE=… EXPECT_GIT_SHA=… node scripts/dev/check-staging-public-page-surfaces.cjs
 *
 * PSG SSOT: docs/runbook/TT-PSG-STAGING-PUBLIC-PAGE-SURFACES-LATEST.md
 */
const fs = require('fs');
const path = require('path');
const { loadOcsEntityIds } = require('./lib/smoke-data-heuristics.cjs');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API_BASE || process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const WEB = (process.env.WEB_BASE || process.env.WEB || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');
const EXPECT = (process.env.EXPECT_GIT_SHA || '').trim();
const OUT =
  process.env.OUT ||
  path.join(ROOT, 'evidence/GO_public_display_10x4_lock/STAGING-PAGE-SURFACES-LATEST.json');

function hasUnsplash(s) {
  return /unsplash\.com/i.test(String(s || ''));
}

function hasMojibake(s) {
  const t = String(s || '');
  return /Ã.|Â.|ï¿½|�/.test(t) || /[\u00C3\u00C2][\u0080-\u00BF]/.test(t);
}

function listOf(json, keys) {
  for (const k of keys) {
    if (Array.isArray(json[k])) return json[k];
  }
  return Array.isArray(json) ? json : [];
}

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

(async () => {
  const fails = [];
  const ocs = loadOcsEntityIds(ROOT);
  const report = {
    schema: 'traveltrust.staging_public_page_surfaces.v1',
    recorded_utc: new Date().toISOString(),
    api: API,
    web: WEB,
    ocs_runtime_state: ocs.ocs_state || null,
    surfaces: {},
    fails: [],
    verdict: 'UNKNOWN',
    honest_boundary: 'PAGE_SURFACE_OK ≠ Reality Closure PASS ≠ Production GO',
  };

  // Forbid nested expansion packs winning as SSOT
  if (ocs.ocs_state && /ocs-surface-expansion/i.test(String(ocs.ocs_state))) {
    fails.push('ocs_state_is_nested_expansion_pack');
  }
  if (!ocs.ocs_state || !/20260708T121151Z/i.test(String(ocs.ocs_state).replace(/\\/g, '/'))) {
    fails.push('ocs_state_not_canonical_20260708_pack');
  }

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
    report.surfaces.identity.note =
      'web_api_tip_mismatch_without_EXPECT (allowed for FE-only); set EXPECT_GIT_SHA to enforce';
  }
  if (ri.json.identity_source !== 'docker-bake' && !webSha) fails.push('identity_source_weak');

  const catalogChecks = [
    ['guides', `${API}/api/v1/guides?limit=50`, ['items', 'guides'], 10, ocs.ocsGuideIds, ['city', 'title', 'display_name', 'bio']],
    ['provider', `${API}/api/v1/market/provider/listings?limit=50`, ['items', 'listings'], 10, ocs.ocsListingIds, ['title', 'label']],
    ['acquisition', `${API}/api/v1/market/acquisition/listings?limit=50`, ['items', 'listings'], 10, ocs.ocsListingIds, ['title', 'label']],
    ['community', `${API}/api/v1/community/feed?limit=50`, ['posts', 'items', 'feed'], 10, ocs.ocsCommunityPostIds, ['body', 'title']],
    ['announcements', `${API}/api/v1/public/announcements?limit=50`, ['items', 'announcements'], null, null, ['title_zh', 'summary_zh']],
    ['announcements_pulse', `${API}/api/v1/public/announcements/pulse`, ['items', 'pulse', 'labels'], null, null, ['title_zh', 'summary_zh']],
    ['landing_ambient', `${API}/api/v1/catalog/media?asset_kind=landing_ambient&limit=20`, ['items'], 10, null, ['url', 'cdn_url', 'title']],
    ['did_rank_guides', `${API}/api/v1/did-rank/guides?limit=20`, ['guides', 'items'], null, null, ['city', 'title', 'bio']],
    ['discover_orders', `${API}/api/v1/discover/orders?limit=50`, ['items', 'orders'], 0, null, []],
  ];

  for (const [id, url, keys, expect, ocsSet, textFields] of catalogChecks) {
    const { status, json } = await getJson(url);
    const rows = listOf(json, keys);
    const n = rows.length;
    const blob = JSON.stringify(json);
    let nonOcs = 0;
    let mojibake = 0;
    for (const row of rows) {
      const rid = String(row.id || '');
      if (ocsSet && rid && !ocsSet.has(rid)) nonOcs += 1;
      const text = textFields
        .map((f) => f.split('.').reduce((a, k) => (a == null ? a : a[k]), row))
        .filter(Boolean)
        .join(' | ');
      if (hasMojibake(text) || hasMojibake(JSON.stringify(row))) mojibake += 1;
    }
    const rowOut = {
      http: status,
      count: n,
      unsplash: hasUnsplash(blob),
      non_ocs: nonOcs,
      mojibake,
      expect,
    };
    report.surfaces[id] = rowOut;
    if (status !== 200) fails.push(`${id}_http_${status}`);
    if (expect != null && n !== expect) fails.push(`${id}_count_${n}_ne_${expect}`);
    if (rowOut.unsplash) fails.push(`${id}_unsplash`);
    if (nonOcs > 0) fails.push(`${id}_non_ocs_${nonOcs}`);
    if (mojibake > 0) fails.push(`${id}_mojibake_${mojibake}`);
  }

  const annRows = listOf((await getJson(`${API}/api/v1/public/announcements?limit=50`)).json, [
    'items',
    'announcements',
  ]);
  const annEmpty = annRows.filter((a) => !String(a.title_zh || a.title || '').trim()).length;
  report.surfaces.announcements_title_zh_empty = annEmpty;
  if (annEmpty > 0) fails.push(`announcements_empty_title_zh_${annEmpty}`);

  const campSurfaces = ['home_hero', 'home_feed', 'market_feed', 'community_feed', 'landing_promo'];
  report.surfaces.campaigns = {};
  for (const s of campSurfaces) {
    const r = await getJson(`${API}/api/v1/official/cold-start/surfaces/${s}`);
    const camp = r.json.campaign || r.json.item || null;
    report.surfaces.campaigns[s] = {
      http: r.status,
      id: camp && camp.id,
      name: camp && camp.name,
    };
    if (r.status !== 200) fails.push(`campaign_surface_${s}_http_${r.status}`);
    if (!camp || !camp.id) fails.push(`campaign_surface_${s}_empty`);
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
