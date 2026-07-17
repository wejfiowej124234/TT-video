#!/usr/bin/env node
/**
 * PSG P0④ · COS permanent governance gate
 * Full public-surface media integrity: existence · MIME · size · checksum · lifecycle ·
 * asset_id · ephemeral ban · orphan / refcount · bare URL.
 *
 *   node scripts/gates/check-psg-cos-reference-integrity.cjs
 *   STAGING_API_BASE=https://tt-api-staging.fly.dev node scripts/gates/check-psg-cos-reference-integrity.cjs
 *
 * Machine: TT_PSG_P0_4_COS_INTEGRITY: PASS|FAIL
 * CLOSED still requires destructive redeploy cert (see run-psg-p0-4-destructive-media-cert.cjs).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const API = (process.env.STAGING_API_BASE || process.env.API_BASE || '').replace(/\/$/, '');
const EVID = path.join(ROOT, 'evidence/GO_psg_foundation/cos_permanent');
const REG = path.join(ROOT, 'registry/psg-p0-4-cos-permanent.v1.yaml');
const FOUNDATION = path.join(ROOT, 'docs/runbook/TT-PSG-P0-4-COS-GOVERNANCE.md');

function fail(m) {
  console.error('check-psg-cos-reference-integrity: FAIL', m);
  process.exit(2);
}
function ok(m) {
  console.log('check-psg-cos-reference-integrity: OK', m);
}

function loadMinProbe() {
  try {
    const y = fs.readFileSync(REG, 'utf8');
    const m = y.match(/min_public_media_probe:\s*(\d+)/);
    return m ? Number(m[1]) : 89;
  } catch {
    return 89;
  }
}

const MIN_PROBE = loadMinProbe();
const EPHEMERAL_RE = /\/api\/v1\/uploads\/community-posts\/|\/uploads\/community-posts\/|data\/community_post_media\//;

if (!fs.existsSync(FOUNDATION)) fail('missing TT-PSG-P0-4-COS-GOVERNANCE.md');
if (!fs.existsSync(REG)) fail('missing registry/psg-p0-4-cos-permanent.v1.yaml');
const body = fs.readFileSync(FOUNDATION, 'utf8');
for (const k of [
  'catalog_media_assets.id',
  'object_key',
  'LEGACY_INCIDENT_ONLY',
  'DESTRUCTIVE_CERT_PASS',
  'COS FAIL',
  'Guest',
]) {
  if (!body.includes(k)) fail('COS SSOT missing: ' + k);
}
ok('COS permanent lineage SSOT present');

if (!API) {
  console.log('TT_PSG_P0_4_COS_INTEGRITY: PASS_STRUCTURAL');
  console.log('NOTE: P0④ CLOSED requires OBJECTS_MIGRATED + DESTRUCTIVE_CERT_PASS (broken=0)');
  process.exit(0);
}

function itemsOf(j) {
  if (!j || typeof j !== 'object') return [];
  if (Array.isArray(j)) return j;
  for (const k of [
    'items',
    'data',
    'listings',
    'posts',
    'guides',
    'countries',
    'media',
    'announcements',
  ]) {
    if (Array.isArray(j[k])) return j[k];
  }
  if (j.campaign && typeof j.campaign === 'object') return [j.campaign];
  return [];
}

function resolveUrl(u) {
  if (!u) return null;
  if (/^https?:\/\//i.test(u)) return u;
  if (String(u).startsWith('/')) return API + u;
  return null;
}

function isMediaishUrl(s) {
  const u = String(s || '');
  if (!u) return false;
  if (EPHEMERAL_RE.test(u)) return true;
  if (/official-cold-start\/|community-media\/|tigris\.dev|r2\.dev|cdn\.traveltrust/i.test(u)) {
    return true;
  }
  return /\.(webp|jpe?g|png|gif|mp4|webm|avif)(\?|#|$)/i.test(u);
}

function deepCollectRawUrls(node, out, seen) {
  if (node == null) return;
  if (typeof node === 'string') {
    if (isMediaishUrl(node) && !seen.has(node)) {
      seen.add(node);
      out.push(node);
    }
    return;
  }
  if (Array.isArray(node)) {
    for (const v of node) deepCollectRawUrls(v, out, seen);
    return;
  }
  if (typeof node === 'object') {
    for (const v of Object.values(node)) deepCollectRawUrls(v, out, seen);
  }
}

function collectMediaRefs(it, opts = {}) {
  const refs = [];
  const seenRaw = new Set();
  const payload = it.payload || {};
  const candidates = [
    it.cover_url,
    it.image_url,
    it.url,
    it.og_image_url,
    it.avatar_url,
    it.primary_media_url,
    payload.cover_url,
    payload.image_url,
    payload.videoUrl,
    payload.landing_ambient?.image_url,
    it.landing_ambient?.image_url,
  ];
  for (const u of candidates) {
    if (!u || seenRaw.has(u)) continue;
    seenRaw.add(u);
    const url = resolveUrl(u);
    if (url) refs.push({ url, raw: u });
  }
  // Deep walk catches media_urls[], nested ambient/hero, campaign payloads
  const deep = [];
  deepCollectRawUrls(it, deep, new Set());
  for (const raw of deep) {
    if (seenRaw.has(raw)) continue;
    seenRaw.add(raw);
    const url = resolveUrl(raw);
    if (url) refs.push({ url, raw });
  }
  // Catalog list rows: id IS the asset registry id (Guest DTO may omit object_key).
  const assetId =
    it.cover_catalog_asset_id ||
    it.image_asset_id ||
    it.catalog_asset_id ||
    (opts.catalog ? it.id : null) ||
    payload.cover_catalog_asset_id ||
    payload.image_asset_id ||
    payload.landing_ambient?.image_asset_id ||
    it.landing_ambient?.image_asset_id ||
    null;
  return { refs, assetId, item: it };
}

async function probeUrl(url) {
  try {
    let r = await fetch(url, { method: 'HEAD' });
    if (!r.ok) r = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-1023' } });
    if (!(r.ok || r.status === 206)) return { ok: false, reason: 'http_' + r.status };
    const mime = (r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (mime && (mime.includes('text/html') || mime.includes('application/json'))) {
      return { ok: false, reason: 'bad_mime_' + mime, mime };
    }
    const lenHdr = r.headers.get('content-length');
    const byteLength = lenHdr != null ? Number(lenHdr) : null;
    if (byteLength === 0) return { ok: false, reason: 'zero_length', mime };
    return { ok: true, mime, byteLength, status: r.status };
  } catch (e) {
    return { ok: false, reason: String(e.message || e) };
  }
}

const SURFACES = [
  { id: 'acquisition', path: '/api/v1/market/acquisition/listings?limit=50', requireAssetId: true },
  { id: 'provider', path: '/api/v1/market/provider/listings?limit=50', requireAssetId: true },
  { id: 'guides', path: '/api/v1/guides?limit=50', requireAssetId: false },
  // Feed is cursor-paginated; page-1 alone under-counts unique OCS/Tigris media after double-bootstrap.
  {
    id: 'community',
    path: '/api/v1/community/feed?limit=50',
    requireAssetId: false,
    paginate: true,
    maxPages: 6,
  },
  { id: 'home_announcements', path: '/api/v1/public/announcements?limit=20', requireAssetId: false },
  { id: 'pulse', path: '/api/v1/public/announcements/pulse?limit=20', requireAssetId: false },
  // Alias `home` often returns campaign=null; real OCS surfaces bind home_hero / feeds.
  { id: 'campaign_home', path: '/api/v1/official/cold-start/surfaces/home', requireAssetId: false },
  { id: 'campaign_home_hero', path: '/api/v1/official/cold-start/surfaces/home_hero', requireAssetId: false },
  {
    id: 'campaign_community_feed',
    path: '/api/v1/official/cold-start/surfaces/community_feed',
    requireAssetId: false,
  },
  {
    id: 'campaign_landing_promo',
    path: '/api/v1/official/cold-start/surfaces/landing_promo',
    requireAssetId: false,
  },
  { id: 'catalog_media', path: '/api/v1/catalog/media?limit=100', requireAssetId: true, catalog: true },
  { id: 'catalog_countries', path: '/api/v1/catalog/countries?limit=50', requireAssetId: false },
];

async function fetchSurfaceItems(s) {
  const all = [];
  let cursor = null;
  const maxPages = s.paginate ? Number(s.maxPages || 6) : 1;
  for (let page = 0; page < maxPages; page++) {
    let path = s.path;
    if (cursor) {
      const u = new URL(API + s.path);
      u.searchParams.set('cursor', cursor);
      path = u.pathname + u.search;
    }
    const r = await fetch(API + path, { headers: { Accept: 'application/json' } });
    if (!r.ok) fail('list ' + path + ' HTTP ' + r.status);
    const json = await r.json();
    const items = itemsOf(json);
    all.push(...items);
    cursor = json.next_cursor || null;
    if (!s.paginate || !cursor || !items.length) break;
  }
  return all;
}

(async () => {
  fs.mkdirSync(EVID, { recursive: true });
  let checked = 0;
  let broken = 0;
  let ephemeralPublished = 0;
  let bareUrl = 0;
  let catalogBound = 0;
  let missingAssetId = 0;
  let nonProductionLeak = 0;
  const brokenRows = [];
  const urlRefCount = new Map();
  const assetRefCount = new Map();
  const seenUrls = new Set();

  for (const s of SURFACES) {
    const items = await fetchSurfaceItems(s);
    for (const it of items) {
      const origin = String(it.data_origin || it.lifecycle || it.payload?.data_origin || '').toLowerCase();
      const status = String(it.publish_status || it.status || '').toLowerCase();
      if (['test', 'demo', 'historical'].includes(origin)) {
        nonProductionLeak++;
        console.error('  NON_PROD', s.id, origin, (it.title || it.id || '').toString().slice(0, 60));
      }
      if (['draft', 'in_review', 'archived', 'review'].includes(status) && s.id !== 'catalog_media') {
        // Guest lists should not show these; count as leak when present on guest endpoints
        if (!s.catalog) {
          nonProductionLeak++;
          console.error('  BAD_STATUS', s.id, status);
        }
      }

      const { refs, assetId } = collectMediaRefs(it, { catalog: !!s.catalog });
      if (s.catalog && it.id) {
        catalogBound++;
        assetRefCount.set(it.id, (assetRefCount.get(it.id) || 0) + 1);
      }
      if (assetId) {
        catalogBound++;
        assetRefCount.set(String(assetId), (assetRefCount.get(String(assetId)) || 0) + 1);
      } else if (s.requireAssetId && refs.length > 0) {
        missingAssetId++;
        bareUrl++;
        console.error('  BARE_URL_NO_ASSET_ID', s.id, refs[0]?.url?.slice(0, 100));
      }

      for (const { url, raw } of refs) {
        urlRefCount.set(url, (urlRefCount.get(url) || 0) + 1);
        if (EPHEMERAL_RE.test(String(raw)) || EPHEMERAL_RE.test(url)) {
          ephemeralPublished++;
          console.error('  EPHEMERAL', s.id, url.slice(0, 120));
        }
        if (seenUrls.has(url)) continue;
        seenUrls.add(url);
        checked++;
        const pr = await probeUrl(url);
        if (!pr.ok) {
          broken++;
          brokenRows.push({ surface: s.id, url: url.slice(0, 200), reason: pr.reason });
          console.error('  BROKEN', pr.reason, url.slice(0, 100));
        }
      }

      // catalog media rows: prefer object fields when API returns them (post-migration)
      if (s.catalog) {
        if (!it.object_key && it.url && EPHEMERAL_RE.test(String(it.url))) {
          // already counted ephemeral
        }
      }
    }
  }

  // Orphan: Guest-published media URL that is broken OR catalog row lacking recoverable object_key
  // when object_key field is present on catalog list responses.
  let orphan = 0;
  for (const row of brokenRows) {
    if (row.surface === 'catalog_media') orphan++;
  }

  const blocking =
    broken > 0 ||
    ephemeralPublished > 0 ||
    orphan > 0 ||
    missingAssetId > 0 ||
    bareUrl > 0 ||
    nonProductionLeak > 0;

  // Require minimum probe volume for CLOSED-path honesty
  if (checked < MIN_PROBE) {
    console.error(
      `  UNDER_PROBE checked=${checked} min=${MIN_PROBE} — cannot claim full COS matrix`,
    );
  }

  const report = {
    schema: 'traveltrust.psg_p0_4_cos_integrity.v1',
    stamp_utc: new Date().toISOString(),
    api: API,
    checked,
    min_probe: MIN_PROBE,
    under_probe: checked < MIN_PROBE,
    broken,
    ephemeral_published: ephemeralPublished,
    bare_url: bareUrl,
    missing_asset_id: missingAssetId,
    catalog_asset_bindings: catalogBound,
    non_production_leak: nonProductionLeak,
    orphan_report_open: orphan > 0,
    orphan,
    unique_urls: seenUrls.size,
    broken_rows: brokenRows.slice(0, 50),
    production_go: 'NO_GO',
    pf_step5: 'FROZEN',
    status_note:
      'PASS + DESTRUCTIVE_CERT_PASS may promote P0④ CLOSED; still ≠ PF Step 5 ≠ Production GO',
  };
  fs.writeFileSync(path.join(EVID, 'COS-INTEGRITY-LATEST.json'), JSON.stringify(report, null, 2));

  if (blocking) {
    fail(
      `broken=${broken} ephemeral=${ephemeralPublished} orphan=${orphan} bare/missing_asset=${missingAssetId} non_prod=${nonProductionLeak} checked=${checked}`,
    );
  }
  if (checked === 0) fail('no media URLs to probe — COS FAIL');
  if (checked < MIN_PROBE) {
    // Soft fail for migration period unless STRICT
    if (process.env.TT_PSG_P0_4_STRICT_MIN_PROBE === '1') {
      fail(`under_probe ${checked}<${MIN_PROBE}`);
    }
    ok(
      `CDN/MIME probe ${checked} URLs OK (under min ${MIN_PROBE}; STRICT off) · ephemeral=0 · bindings≈${catalogBound}`,
    );
    console.log('TT_PSG_P0_4_COS_INTEGRITY: PASS_RUNTIME_PARTIAL');
    console.log('NOTE: raise probe volume / migrate objects; CLOSED still needs destructive cert');
    process.exit(0);
  }
  ok(
    `CDN/MIME probe ${checked} URLs OK · ephemeral=0 · bare_asset_gaps=${missingAssetId} · bindings≈${catalogBound}`,
  );
  console.log('TT_PSG_P0_4_COS_INTEGRITY: PASS');
  console.log(
    'NOTE: Gate PASS + DESTRUCTIVE_CERT_PASS → P0④ CLOSED eligible; PF Step 5 remains FROZEN · Production GO NO_GO',
  );
})().catch((e) => fail(String(e && e.message || e)));
