/**
 * Shared smoke / test / automation data heuristics for Display Data Governance.
 * SSOT for purge + audit scripts (staging full-site scan).
 *
 * DDG tier model (long-term · write dead):
 *   FALSE_POSITIVE   — Official Identity (@ocs.traveltrust.app · OCS state map) · not leakage
 *   EXPECTED_OFFICIAL — OCS CDN / Official upload paths · allowed on production surfaces
 *   REAL_LEAK        — Unsplash · Showcase · Demo · Seed · sample hosts · FAIL in production
 */

const fs = require('fs');
const path = require('path');
const { isStagingCorridorSmokeBody } = require('./staging-corridor-smoke.cjs');

const SMOKE_EMAILS = new Set([
  'tourist@test.com',
  'guide@test.com',
  'multi-demo@test.com',
  'merchant@test.com',
  'provider-did-rank-demo@test.com',
  'steward-did-rank-demo@test.com',
]);

const REAL_LEAK_MEDIA_HOSTS = [
  'unsplash.com',
  'filesamples.com',
  'samplelib.com',
  'w3schools.com',
];

const REAL_LEAK_MEDIA_PATTERNS = [
  /tt-showcase/i,
  /tt-demo/i,
  /community-showcase/i,
  /\/showcase\//i,
  /\/demo\//i,
  /\/seed\//i,
];

function norm(s) {
  return String(s || '').trim().toLowerCase();
}

function blobFromRow(row) {
  const p = row.payload || {};
  return [
    row.label,
    row.title,
    row.bio,
    row.body,
    row.description,
    row.summary,
    row.nickname,
    p.title,
    p.description,
    p.summary,
    p.body,
  ]
    .map(norm)
    .filter(Boolean)
    .join(' ');
}

/** Heuristic: automation / smoke / probe / multi-demo content. */
function isSmokeContent(row) {
  const b = blobFromRow(row);
  if (!b) return false;
  return (
    b.includes('multi-demo') ||
    b.includes('l3 closure') ||
    b.includes('probe') ||
    b.includes(' smoke') ||
    b.startsWith('smoke ') ||
    b.includes('did rank demo') ||
    b.startsWith('e2e-') ||
    b.startsWith('pi1-fe-') ||
    b.startsWith('browser-minio-') ||
    b.includes('演示') ||
    b.includes('联调') ||
    b.includes('publish hub demo') ||
    isStagingCorridorSmokeBody(b)
  );
}

function isTestEmail(email) {
  const e = norm(email);
  if (!e) return false;
  if (e.endsWith('@traveltrust.test')) return true;
  return SMOKE_EMAILS.has(e);
}

function isNonProductionOrigin(origin) {
  const o = norm(origin);
  return o === 'test' || o === 'demo' || o === 'smoke';
}

const CANONICAL_GUIDE_EXACT = new Set([
  '00000000-0000-4000-8000-000000000311',
  '00000000-0000-4000-8000-000000000312',
  '00000000-0000-4000-8000-000000000313',
  '00000000-0000-4000-8000-000000000314',
]);
const CANONICAL_GUIDE_PREFIXES = ['f0e0b101-'];

const OCS_EMAIL_DOMAIN = (process.env.OCS_EMAIL_DOMAIN || 'ocs.traveltrust.app').toLowerCase();

function isOfficialColdStartEmail(email) {
  const e = norm(email);
  return e.endsWith(`@${OCS_EMAIL_DOMAIN}`);
}

/** Row may expose owner/user email under several keys (public catalog vs admin queue). */
function rowEmails(row) {
  return [row.owner_email, row.user_email, row.email, row.guide_email, row.author_email]
    .map(norm)
    .filter(Boolean);
}

function isOfficialColdStartRow(row, opts = {}) {
  if (opts.ocsGuideIds && row.id && opts.ocsGuideIds.has(String(row.id))) return true;
  if (opts.ocsListingIds && row.id && opts.ocsListingIds.has(String(row.id))) return true;
  if (opts.ocsCommunityPostIds && row.id && opts.ocsCommunityPostIds.has(String(row.id))) return true;
  if (opts.ocsOfficialGuideIds && row.id && opts.ocsOfficialGuideIds.has(String(row.id))) return true;
  if (opts.ocsCampaignIds && row.id && opts.ocsCampaignIds.has(String(row.id))) return true;
  return rowEmails(row).some(isOfficialColdStartEmail);
}

function isCanonicalGuideId(id) {
  if (!id) return false;
  if (CANONICAL_GUIDE_EXACT.has(id)) return true;
  return CANONICAL_GUIDE_PREFIXES.some((p) => id.startsWith(p));
}

function rowMediaUrls(row) {
  const p = row.payload || {};
  const urls = [
    row.avatar_url,
    row.cover_url,
    row.video_url,
    p.avatar_url,
    p.cover_url,
    p.videoUrl,
    p.video_url,
    ...(Array.isArray(row.media_urls) ? row.media_urls : []),
    ...(Array.isArray(p.media_urls) ? p.media_urls : []),
  ];
  return urls.filter(Boolean).map(String);
}

function isExpectedOfficialMediaUrl(url) {
  const u = String(url || '');
  return u.includes('/api/v1/uploads/') && u.includes('/ocs/');
}

function isRealLeakMediaUrl(url) {
  if (!url || isExpectedOfficialMediaUrl(url)) return false;
  const u = norm(url);
  if (REAL_LEAK_MEDIA_HOSTS.some((h) => u.includes(h))) return true;
  return REAL_LEAK_MEDIA_PATTERNS.some((p) => p.test(String(url)));
}

function rowHasRealLeakMedia(row) {
  return rowMediaUrls(row).some(isRealLeakMediaUrl);
}

function resolveOcsMediaUrl(apiBase, urlOrPath) {
  const u = String(urlOrPath || '').trim();
  if (!u) return u;
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  const base = String(apiBase || '').replace(/\/$/, '');
  return `${base}${u.startsWith('/') ? '' : '/'}${u}`;
}

/**
 * Canonical Staging OCS runtime pack (10×4 lock).
 * Nested ocs-* experiment folders must NOT win lexicographic "latest" (that caused
 * gate false-positives: live 20260708 UUIDs vs expansion-staging UUIDs).
 */
const CANONICAL_OCS_RUNTIME_STATE_REL =
  'evidence/GO_official_cold_start_dataset/20260708T121151Z/state.json';

function findLatestOcsStatePath(root) {
  const base = path.join(root, 'evidence/GO_official_cold_start_dataset');
  if (!fs.existsSync(base)) return null;

  // 1) ACTIVE pointer (PSG / 10×4 lock)
  const activePtr = path.join(base, 'ACTIVE.json');
  if (fs.existsSync(activePtr)) {
    try {
      const active = JSON.parse(fs.readFileSync(activePtr, 'utf8'));
      const rel = String(active.ocs_runtime_state || active.state_path || '').replace(/\\/g, '/');
      if (rel) {
        const abs = path.isAbsolute(rel) ? rel : path.join(root, rel);
        if (fs.existsSync(abs)) return abs;
      }
    } catch {
      /* fall through */
    }
  }

  // 2) Registry-pinned canonical pack (top-level stamp only)
  const canonical = path.join(root, CANONICAL_OCS_RUNTIME_STATE_REL);
  if (fs.existsSync(canonical)) return canonical;

  // 3) Top-level YYYYMMDDTHHMMSSZ stamps only — never nested ocs-* experiments
  const stampRe = /^\d{8}T\d{6}Z$/;
  const candidates = [];
  for (const ent of fs.readdirSync(base, { withFileTypes: true })) {
    if (!ent.isDirectory() || !stampRe.test(ent.name)) continue;
    const statePath = path.join(base, ent.name, 'state.json');
    if (fs.existsSync(statePath)) candidates.push(statePath);
  }
  candidates.sort();
  return candidates.length ? candidates[candidates.length - 1] : null;
}

function loadOcsEntityIds(root = path.join(__dirname, '../../..')) {
  const statePath =
    process.env.OCS_STATE ||
    process.env.OCS_STATE_PATH ||
    findLatestOcsStatePath(root) ||
    '';
  const ocsGuideIds = new Set();
  const ocsListingIds = new Set();
  const ocsCommunityPostIds = new Set();
  const ocsOfficialGuideIds = new Set();
  const ocsCampaignIds = new Set();
  if (statePath && fs.existsSync(statePath)) {
    try {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      for (const v of Object.values(state.guides || {})) {
        if (v?.id) ocsGuideIds.add(String(v.id));
      }
      for (const v of Object.values(state.listings || {})) {
        if (v?.id) ocsListingIds.add(String(v.id));
      }
      for (const v of Object.values(state.community_posts || {})) {
        if (v?.id) ocsCommunityPostIds.add(String(v.id));
      }
      for (const v of Object.values(state.official_guides || {})) {
        if (v?.id) ocsOfficialGuideIds.add(String(v.id));
      }
      for (const v of Object.values(state.campaigns || {})) {
        if (v?.id) ocsCampaignIds.add(String(v.id));
      }
    } catch {
      /* ignore */
    }
  }
  return {
    ocsGuideIds,
    ocsListingIds,
    ocsCommunityPostIds,
    ocsOfficialGuideIds,
    ocsCampaignIds,
    ocs_state: statePath || null,
  };
}

/**
 * DDG tier for a row on a production-facing surface.
 * @returns {'FALSE_POSITIVE'|'EXPECTED_OFFICIAL'|'REAL_LEAK'|null}
 */
function classifyDdgTier(row, context = {}) {
  const origin = row.data_origin || '';
  const c3Id = context.c3GuideId || '';
  const entityType = context.entityType || '';
  const surface = context.surface || entityType || '';

  if (c3Id && String(row.id) === String(c3Id)) return 'REAL_LEAK';
  if (rowEmails(row).some(isTestEmail)) return 'REAL_LEAK';
  if (isNonProductionOrigin(origin)) return 'REAL_LEAK';
  if (isSmokeContent(row)) return 'REAL_LEAK';

  const official = isOfficialColdStartRow(row, context);
  const mediaUrls = rowMediaUrls(row);
  const allExpectedOfficial = mediaUrls.length > 0 && mediaUrls.every(isExpectedOfficialMediaUrl);
  if (official && allExpectedOfficial) return 'EXPECTED_OFFICIAL';
  if (official && rowHasRealLeakMedia(row)) return 'REAL_LEAK';
  if (official || rowEmails(row).some(isOfficialColdStartEmail)) return 'FALSE_POSITIVE';

  if (entityType === 'guides' || surface === 'guides') {
    if (origin === 'production' && isCanonicalGuideId(row.id)) return null;
    if (origin === 'production' && !isCanonicalGuideId(row.id)) return 'REAL_LEAK';
  }

  if (origin === 'production' && rowHasRealLeakMedia(row)) return 'REAL_LEAK';
  if (origin === 'production' && isSmokeContent(row)) return 'REAL_LEAK';
  return null;
}

/** Map DDG tier to legacy blocking classification for existing gates. */
function tierToBlockingClassification(tier) {
  if (tier === 'REAL_LEAK') return 'TEST_DATA_LEAKAGE';
  return null;
}

/**
 * Classify a public-catalog row leak.
 * @returns {'PRODUCT_DATA_DEFECT'|'TEST_DATA_LEAKAGE'|'EXPECTED_DIFFERENCE'|null}
 */
function classifyPublicLeak(row, surface, opts = {}) {
  const tier = classifyDdgTier(row, { ...opts, surface });
  if (tier === 'FALSE_POSITIVE' || tier === 'EXPECTED_OFFICIAL') return null;
  if (tier === 'REAL_LEAK') {
    const origin = row.data_origin || '';
    if (origin === 'production' && isSmokeContent(row)) return 'PRODUCT_DATA_DEFECT';
    return 'TEST_DATA_LEAKAGE';
  }
  return null;
}

function classifyAdminPublishedLeak(row, entityType, opts = {}) {
  if (row.display_status !== 'published') return null;
  const tier = classifyDdgTier(row, { ...opts, entityType });
  if (tier === 'FALSE_POSITIVE' || tier === 'EXPECTED_OFFICIAL') return null;
  if (tier === 'REAL_LEAK') {
    const origin = row.data_origin || '';
    if (origin === 'production' && isSmokeContent(row)) return 'PRODUCT_DATA_DEFECT';
    return 'TEST_DATA_LEAKAGE';
  }
  return null;
}

module.exports = {
  SMOKE_EMAILS,
  REAL_LEAK_MEDIA_HOSTS,
  isSmokeContent,
  isStagingCorridorSmokeBody,
  isTestEmail,
  isNonProductionOrigin,
  isCanonicalGuideId,
  isOfficialColdStartEmail,
  isOfficialColdStartRow,
  isExpectedOfficialMediaUrl,
  isRealLeakMediaUrl,
  rowHasRealLeakMedia,
  rowMediaUrls,
  resolveOcsMediaUrl,
  CANONICAL_OCS_RUNTIME_STATE_REL,
  findLatestOcsStatePath,
  loadOcsEntityIds,
  classifyDdgTier,
  tierToBlockingClassification,
  classifyPublicLeak,
  classifyAdminPublishedLeak,
  blobFromRow,
};
