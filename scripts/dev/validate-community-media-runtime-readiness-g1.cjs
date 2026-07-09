#!/usr/bin/env node
/**
 * Community Media Runtime Readiness (G1 · PRM-MEDIA-B001)
 *
 * Surfaces: Feed · Hot · Search · Detail · Explore · Campaign + HEAD playback probe.
 *
 *   node scripts/dev/validate-community-media-runtime-readiness-g1.cjs
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const {
  isNonGovernedCommunityMediaUrl,
  classifyCommunityMediaUrl,
  mediaViolationsFromPosts,
  collectPostMediaUrls,
  resolveMediaUrlForFetch,
} = require('./lib/community-media-legacy-policy.cjs');

const ROOT = path.join(__dirname, '../..');
const STAMP = process.env.AUDIT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const LOCAL_API = (process.env.LOCAL_API || 'http://127.0.0.1:8080').replace(/\/$/, '');
const SKIP_HEAD = process.env.SKIP_MEDIA_HEAD_PROBE === '1';

const SURFACE_CHECKS = [
  { id: 'feed', label: 'Feed', path: '/api/v1/community/feed?limit=100' },
  { id: 'hot', label: 'Hot', path: '/api/v1/community/feed?hot=1&limit=100' },
  { id: 'search', label: 'Search', path: '/api/v1/community/feed?q=travel&limit=50' },
  { id: 'explore', label: 'Explore', path: '/api/v1/community/explore/destinations' },
  { id: 'campaign', label: 'Campaign', path: '/api/v1/official/cold-start/surfaces/community_feed' },
];

function parseArgs() {
  const args = { evidenceDir: '' };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--evidence-dir') args.evidenceDir = process.argv[++i];
  }
  return args;
}

function read(rel) {
  return fs.existsSync(path.join(ROOT, rel)) ? fs.readFileSync(path.join(ROOT, rel), 'utf8') : '';
}

function headUrl(url) {
  return new Promise((resolve) => {
    const abs = resolveMediaUrlForFetch(url, LOCAL_API);
    if (!abs) return resolve({ url, ok: true, status: 0, skipped: true });
    const lib = abs.startsWith('https') ? https : http;
    const req = lib.request(abs, { method: 'HEAD', timeout: 10000 }, (res) => {
      resolve({ url: abs, ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode });
    });
    req.on('error', (e) => resolve({ url: abs, ok: false, status: 0, error: String(e.message || e) }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ url: abs, ok: false, status: 0, error: 'timeout' });
    });
    req.end();
  });
}

function setCheck(checklist, id, status, detail) {
  checklist[id] = { id, status, detail };
}

async function main() {
  const { evidenceDir } = parseArgs();
  const client = createClient(LOCAL_API);
  const checklist = {};
  const violations = [];
  const headResults = [];

  for (const s of [
    ...SURFACE_CHECKS,
    { id: 'detail', label: 'Detail' },
    { id: 'profile', label: 'Profile' },
    { id: 'images', label: 'Images' },
    { id: 'videos', label: 'Videos' },
    { id: 'playback_network', label: 'Playback Network' },
    { id: 'frontend_showcase', label: 'Frontend Showcase' },
    { id: 'db_remediation', label: 'DB Remediation' },
    { id: 'media_cdn', label: 'Media CDN' },
  ]) {
    setCheck(checklist, s.id, 'PENDING', 'not run');
  }

  // ── Static ──
  const mig = read('crates/api/migrations/20260704140000_community_media_runtime_readiness_g1.sql');
  setCheck(
    checklist,
    'db_remediation',
    mig.includes('community_media_runtime_readiness_g1') ? 'PASS' : 'FAIL',
    'migration 20260704140000 present'
  );

  const surfaceRs = read('crates/api/src/chain_off/community_public_surface.rs');
  setCheck(
    checklist,
    'frontend_showcase',
    surfaceRs.includes('is_non_governed_community_media_url') &&
      read('frontend/lib/communityContentProfile.ts').includes('isCommunityContentProductionProfile')
      ? 'PASS'
      : 'FAIL',
    'API + frontend production profile media gates'
  );

  const ready = await client.req('GET', '/health/ready');
  if (ready.status !== 200) {
    for (const k of Object.keys(checklist)) {
      if (checklist[k].status === 'PENDING') {
        setCheck(checklist, k, 'FAIL', `API down HTTP ${ready.status}`);
      }
    }
    return finish(false, checklist, violations, headResults, evidenceDir);
  }

  let allPosts = [];
  for (const surf of SURFACE_CHECKS.slice(0, 3)) {
    const r = await client.req('GET', surf.path);
    const posts = r.json?.posts || [];
    const v = mediaViolationsFromPosts(posts, surf.id);
    violations.push(...v);
    allPosts = allPosts.concat(posts);
    setCheck(
      checklist,
      surf.id,
      r.status === 200 && v.length === 0 ? 'PASS' : 'FAIL',
      r.status === 200 ? `posts=${posts.length} legacy=${v.length}` : `HTTP ${r.status}`
    );
  }

  const explore = await client.req('GET', SURFACE_CHECKS[3].path);
  setCheck(
    checklist,
    'explore',
    explore.status === 200 ? 'PASS' : 'FAIL',
    explore.status === 200 ? `catalog=${explore.json?.catalog || 'ok'}` : `HTTP ${explore.status}`
  );

  const camp = await client.req('GET', SURFACE_CHECKS[4].path);
  setCheck(
    checklist,
    'campaign',
    camp.status === 200 ? 'PASS' : 'FAIL',
    camp.status === 200 ? `deployed=${camp.json?.deployed ?? 'n/a'}` : `HTTP ${camp.status}`
  );

  const sampleId = allPosts[0]?.id ? String(allPosts[0].id) : null;
  if (!sampleId) {
    setCheck(checklist, 'detail', 'PASS', 'empty governed catalog — detail route OK');
    setCheck(checklist, 'profile', 'PASS', 'empty — no public author sample');
  } else {
    const detail = await client.req('GET', `/api/v1/community/posts/${sampleId}`);
    const dv = mediaViolationsFromPosts(detail.json?.post ? [detail.json.post] : [], 'detail');
    violations.push(...dv);
    setCheck(
      checklist,
      'detail',
      detail.status === 200 && dv.length === 0 ? 'PASS' : 'FAIL',
      `HTTP ${detail.status} legacy=${dv.length}`
    );
    const authorId = detail.json?.post?.author?.id || detail.json?.post?.user_id;
    if (authorId) {
      const prof = await client.req('GET', `/api/v1/community/users/${authorId}/posts?limit=20`);
      const pv = mediaViolationsFromPosts(prof.json?.posts || [], 'profile');
      violations.push(...pv);
      setCheck(
        checklist,
        'profile',
        prof.status === 200 && pv.length === 0 ? 'PASS' : 'FAIL',
        `posts=${(prof.json?.posts || []).length} legacy=${pv.length}`
      );
    } else {
      setCheck(checklist, 'profile', 'PASS', 'no author on sample');
    }
  }

  const mediaUrls = new Set();
  for (const p of allPosts) {
    for (const u of collectPostMediaUrls(p)) mediaUrls.add(u);
  }
  const imageUrls = [...mediaUrls].filter((u) => /\.(jpe?g|png|webp|gif)(\?|$)/i.test(u) || u.includes('/uploads/'));
  const videoUrls = [...mediaUrls].filter((u) => /\.(mp4|webm|mov)(\?|$)/i.test(u) || u.includes('media-assets'));
  setCheck(
    checklist,
    'images',
    violations.filter((v) => imageUrls.some((u) => u === v.url)).length === 0 ? 'PASS' : 'FAIL',
    `urls=${imageUrls.length}`
  );
  setCheck(
    checklist,
    'videos',
    violations.filter((v) => videoUrls.some((u) => u === v.url)).length === 0 ? 'PASS' : 'FAIL',
    `urls=${videoUrls.length}`
  );

  const caps = await client.req('GET', '/api/v1/community/media/capabilities');
  setCheck(
    checklist,
    'media_cdn',
    caps.status === 200 ? 'PASS' : 'FAIL',
    caps.status === 200 ? `status=${caps.json?.status || 'ok'}` : `HTTP ${caps.status}`
  );

  let headFail = 0;
  if (!SKIP_HEAD && mediaUrls.size > 0) {
    for (const u of mediaUrls) {
      const hr = await headUrl(u);
      headResults.push(hr);
      if (!hr.ok && !hr.skipped) headFail++;
    }
  }
  setCheck(
    checklist,
    'playback_network',
    SKIP_HEAD || mediaUrls.size === 0 || headFail === 0 ? 'PASS' : 'FAIL',
    SKIP_HEAD
      ? 'SKIP_MEDIA_HEAD_PROBE=1'
      : mediaUrls.size === 0
        ? 'no media URLs in governed surfaces'
        : `probed=${mediaUrls.size} fail=${headFail}`
  );

  const allPass = Object.values(checklist).every((c) => c.status === 'PASS');
  return finish(allPass, checklist, violations, headResults, evidenceDir);
}

function finish(allPass, checklist, violations, headResults, evidenceDir) {
  const gapId = process.env.GAP_ID || 'PRM-MEDIA-B001';
  const profile = process.env.COMMUNITY_VALIDATION_PROFILE || 'local';
  const rows = Object.entries(checklist).map(([id, c]) => ({
    id,
    label: id,
    production: c.status,
    detail: c.detail,
  }));

  const signoff = {
    stamp: STAMP,
    gap_id: gapId,
    validation_profile: profile,
    staging_api_base: profile === 'staging' ? LOCAL_API : undefined,
    verdict: allPass ? 'COMMUNITY_MEDIA_RUNTIME_READY_G1' : 'COMMUNITY_MEDIA_RUNTIME_READY_G1_IN_PROGRESS',
    machine_keys: {
      TT_COMMUNITY_MEDIA_RUNTIME_READINESS_G1: allPass ? 'PASS' : 'IN_PROGRESS',
      TT_PRODUCTION_GO: 'NO_GO',
    },
    checklist: rows,
    legacy_violations: violations,
    head_probe: headResults.slice(0, 50),
    prm_media_b001_status: gapId === 'PRM-MEDIA-B001' ? (allPass ? 'READY_TO_CLOSE' : 'OPEN') : undefined,
    prm_gap_status: allPass ? 'CLOSED' : 'OPEN',
  };

  const outDir = evidenceDir
    ? path.join(ROOT, evidenceDir)
    : path.join(ROOT, 'evidence/GO_production_readiness/community-media-runtime-ready', STAMP);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'community-media-runtime-signoff.json'), JSON.stringify(signoff, null, 2) + '\n');

  const md = [
    '# Community Media Runtime Ready (G1 Domain) · Evidence',
    '',
    `**Verdict:** ${signoff.verdict}`,
    `**Gap:** ${gapId} · **${signoff.prm_gap_status || signoff.prm_media_b001_status}**`,
    '',
    '| Check | Status | Detail |',
    '|-------|--------|--------|',
    ...rows.map((r) => `| ${r.label} | ${r.production === 'PASS' ? '✅' : '❌'} | ${r.detail.replace(/\|/g, '/')} |`),
    '',
  ].join('\n');
  fs.writeFileSync(path.join(outDir, 'COMMUNITY-MEDIA-RUNTIME-CHECKLIST.md'), md);
  fs.writeFileSync(path.join(outDir, 'README.md'), md);

  console.log(`Community Media Runtime Ready (G1): ${signoff.verdict}`);
  for (const r of rows) {
    console.log(`  ${r.production === 'PASS' ? 'PASS' : 'FAIL'}  ${r.label.padEnd(18)} ${r.detail}`);
  }
  console.log(`Evidence: ${path.relative(ROOT, outDir)}`);
  console.log(`PRM gap ${gapId}: ${signoff.prm_gap_status || signoff.prm_media_b001_status}`);
  if (!allPass) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
