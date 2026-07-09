#!/usr/bin/env node
/**
 * Community Content Readiness · G1 validator (PRM-CONTENT-B001)
 *
 * Static + optional runtime (API feed must have zero legacy/demo/showcase violations).
 *
 *   node scripts/dev/validate-community-content-readiness-g1.cjs
 *   LOCAL_API=http://127.0.0.1:8080 node scripts/dev/validate-community-content-readiness-g1.cjs
 *   --evidence-dir evidence/GO_production_readiness/content-readiness-g1/<stamp>
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const ROOT = path.join(__dirname, '../..');
const STAMP = process.env.AUDIT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');

function parseArgs() {
  const args = { evidenceDir: '' };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--evidence-dir') args.evidenceDir = process.argv[++i];
  }
  return args;
}

function read(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

const checks = [];
function record(id, status, detail) {
  checks.push({ id, status, detail });
}

function httpGet(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout: 8000 }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 400, status: res.statusCode, json: JSON.parse(body) });
        } catch {
          resolve({ ok: false, status: res.statusCode, json: null });
        }
      });
    });
    req.on('error', (e) => resolve({ ok: false, status: 0, error: String(e.message || e) }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, status: 0, error: 'timeout' });
    });
  });
}

const LEGACY_MEDIA = ['unsplash.com', 'w3schools.com', 'samplelib.com', 'filesamples.com'];
const SHOWCASE_ID = /^tt-showcase-post-/i;
const SHOWCASE_AUTHOR = /^tt-demo-/i;

function feedViolations(posts) {
  const v = [];
  for (const p of posts || []) {
    const id = String(p.id || p.post_id || '');
    if (SHOWCASE_ID.test(id)) v.push({ type: 'frontend_showcase_id', id });
    const authorId = String(p.author?.id || p.user_id || '');
    if (SHOWCASE_AUTHOR.test(authorId)) v.push({ type: 'frontend_showcase_author', id: authorId });
    const urls = [...(p.media_urls || []), p.media_url, p.cover_url].filter(Boolean);
    for (const u of urls) {
      const s = String(u).toLowerCase();
      if (LEGACY_MEDIA.some((h) => s.includes(h))) v.push({ type: 'legacy_media', url: u, post_id: id });
    }
  }
  return v;
}

async function main() {
  const { evidenceDir } = parseArgs();
  const mig = read('crates/api/migrations/20260704130000_community_content_readiness_governed.sql');
  record(
    'gov_view_excludes_showcase',
    /display_origin NOT IN \('SHOWCASE', 'TEST', 'SMOKE'\)/.test(mig) ? 'PASS' : 'FAIL',
    'governed_community_posts_v1 excludes SHOWCASE/TEST/SMOKE'
  );
  record(
    'seed_demo_showcase_draft',
    /data_origin, display_status, display_origin/.test(read('crates/api/src/db/seed_community_public_showcase.rs')) &&
      read('crates/api/src/db/seed_community_public_showcase.rs').includes("'demo', 'draft', 'SHOWCASE'")
      ? 'PASS'
      : 'FAIL',
    'PG seed inserts demo/SHOWCASE/draft'
  );
  record(
    'seed_off_on_staging_profile',
    read('crates/api/src/db/seed_community_public_showcase.rs').includes('profile == "staging"') ? 'PASS' : 'FAIL',
    'Showcase seed disabled on staging/production profile'
  );
  record(
    'frontend_production_filter',
    exists('frontend/lib/communityContentProductionProfile.ts') &&
      read('frontend/lib/communityFeedShowcaseMerge.ts').includes('filterCommunityProductionReadyPosts')
      ? 'PASS'
      : 'FAIL',
    'Frontend strips B/C layers from API-mapped feed'
  );
    record(
      'api_feed_content_filter',
      read('crates/api/src/chain_off/community_public_surface.rs').includes('filter_feed_posts_content_readiness')
        ? 'PASS'
        : 'FAIL',
      'API response filters legacy demo media when public catalog filter on'
    );
    record(
      'promo_preview_production',
      read('frontend/components/community/communityFeedPromoMedia.ts').includes('isCommunityContentProductionProfile')
        ? 'PASS'
        : 'FAIL',
      'Promo preview uses governed posts in production profile'
    );
    record(
      'showcase_deep_link_production',
      read('frontend/lib/communityShowcase.ts').includes('isCommunityContentProductionProfile()') &&
        read('frontend/lib/communityShowcase.ts').includes('findCommunityShowcasePostById')
        ? 'PASS'
        : 'FAIL',
      'Showcase deep links disabled in production profile'
    );
    record(
      'legacy_read_path_governed',
      read('crates/api/src/db/community.rs').includes('governed_community_posts_v1') ? 'PASS' : 'FAIL',
      'Community public reads use governed view'
    );

  const localApi = (process.env.LOCAL_API || 'http://127.0.0.1:8080').replace(/\/$/, '');
  let runtimeViolations = [];
  const feedRes = await httpGet(`${localApi}/api/v1/community/feed?limit=100`);
  if (!feedRes.ok) {
    record('runtime_feed', 'SKIPPED', feedRes.error || `HTTP ${feedRes.status}`);
    record(
      'runtime_feed_clean',
      'SKIPPED',
      'API not reachable — run with LOCAL_API when stack is up for full G1 PASS'
    );
  } else {
    const posts = feedRes.json?.posts || [];
    runtimeViolations = feedViolations(posts);
    record(
      'runtime_feed_clean',
      runtimeViolations.length === 0 ? 'PASS' : 'FAIL',
      runtimeViolations.length === 0
        ? `feed posts=${posts.length} · zero legacy/demo violations`
        : `${runtimeViolations.length} violation(s): ${JSON.stringify(runtimeViolations.slice(0, 5))}`
    );
  }

  const staticPass = checks.filter((c) => c.status !== 'SKIPPED').every((c) => c.status === 'PASS');
  const runtimeCheck = checks.find((c) => c.id === 'runtime_feed_clean');
  const runtimePass = runtimeCheck?.status === 'PASS';
  const staticOnly = process.argv.includes('--static-only');
  const pass = staticPass && (runtimePass || (staticOnly && runtimeCheck?.status === 'SKIPPED'));

  const signoff = {
    stamp: STAMP,
    gap_id: 'PRM-CONTENT-B001',
    go_gate: 'G1',
    domain: 'content_readiness',
    machine_keys: {
      TT_COMMUNITY_CONTENT_READINESS_G1: pass ? 'PASS' : 'IN_PROGRESS',
      TT_PRODUCTION_GO: 'NO_GO',
    },
    acceptance: {
      feed_governed: true,
      no_frontend_showcase_in_feed: true,
      no_sample_video_urls: true,
      no_unsplash_seed: true,
      allow_only: ['ugc', 'official', 'campaign'],
    },
    checks,
    runtime_violations: runtimeViolations,
    verdict: pass
      ? runtimePass
        ? 'CONTENT_READINESS_G1_PASS'
        : 'CONTENT_READINESS_G1_STATIC_PASS'
      : 'CONTENT_READINESS_G1_IN_PROGRESS',
    pcp_boundary: 'PCP Governance CLOSED — this gate is Content baseline only',
  };

  const outDir = evidenceDir
    ? path.join(ROOT, evidenceDir)
    : path.join(ROOT, 'evidence/GO_production_readiness/content-readiness-g1', STAMP);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'content-readiness-g1-signoff.json'), JSON.stringify(signoff, null, 2) + '\n');
  fs.writeFileSync(
    path.join(outDir, 'CONTENT-READINESS-G1-GAP-SNAPSHOT.md'),
    `# Community Content Readiness · G1 Gap Snapshot\n\n**Verdict:** ${signoff.verdict}\n\n**Gap:** PRM-CONTENT-B001\n\n## Checks\n\n${checks.map((c) => `- ${c.id}: **${c.status}** — ${c.detail}`).join('\n')}\n\n## Runtime violations\n\n${runtimeViolations.length ? JSON.stringify(runtimeViolations, null, 2) : 'none'}\n`
  );

  console.log(`Community Content Readiness G1: ${signoff.verdict}`);
  for (const c of checks) console.log(`  ${c.status.padEnd(7)} ${c.id} — ${c.detail}`);
  console.log(`Evidence: ${path.relative(ROOT, outDir)}`);
  if (!pass) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
