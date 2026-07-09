#!/usr/bin/env node
/**
 * Community Media Guard — long-term guardrail (not a Blocker gap; CI FAIL on regression)
 *
 * 1) Repo data layer — seeds + migrations that can insert published legacy media
 * 2) Optional PG — community_posts (published) + community_media_assets
 *
 *   node scripts/dev/validate-community-media-guard.cjs
 *   SKIP_COMMUNITY_MEDIA_GUARD_DB=1 node scripts/dev/validate-community-media-guard.cjs
 *
 * Exit 0 → TT_COMMUNITY_MEDIA_GUARD: PASS
 */
const fs = require('fs');
const path = require('path');
const { RuntimeIdentity } = require('./lib/runtime-identity.cjs');
const {
  isNonGovernedCommunityMediaUrl,
  isLegacyDemoHost,
  LEGACY_DEMO_HOSTS,
  STALE_TEST_CDN_HOSTS,
} = require('./lib/community-media-legacy-policy.cjs');

const ROOT = path.join(__dirname, '../..');

/** Historical remediation — allowed to mention legacy hosts while fixing data */
const MIGRATION_ALLOWLIST = new Set([
  'crates/api/migrations/20260704130000_community_content_readiness_governed.sql',
  'crates/api/migrations/20260704140000_community_media_runtime_readiness_g1.sql',
]);

const SEED_COMMUNITY_PREFIX = 'crates/api/src/db/seed_community';

function normRel(p) {
  return p.replace(/\\/g, '/');
}

function listMigrations() {
  const dir = path.join(ROOT, 'crates/api/migrations');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => n.endsWith('.sql'))
    .map((n) => normRel(path.join('crates/api/migrations', n)));
}

function listCommunitySeedFiles() {
  const dir = path.join(ROOT, 'crates/api/src/db');
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => n.startsWith('seed_community') && n.endsWith('.rs'))
    .map((n) => normRel(path.join('crates/api/src/db', n)));
}

function forbiddenInPublishedContext(text) {
  const hits = [];
  const lower = text.toLowerCase();
  for (const h of [...LEGACY_DEMO_HOSTS, ...STALE_TEST_CDN_HOSTS]) {
    if (lower.includes(h)) hits.push(h);
  }
  if (/\/api\/v1\/uploads\/community-posts\/[^'"\s]+\.(mp4|webm|mov|m4v)/i.test(text)) {
    hits.push('legacy_upload_video_path');
  }
  return hits;
}

function scanCommunitySeeds() {
  const violations = [];
  for (const rel of listCommunitySeedFiles()) {
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    if (rel.endsWith('seed_community_public_showcase.rs')) {
      if (!text.includes("'draft', 'SHOWCASE'")) {
        violations.push({ kind: 'seed_invariant', file: rel, detail: 'showcase seed must stay draft/SHOWCASE' });
      }
    }
    const blocks = text.split(/\n\s*\n/);
    for (const block of blocks) {
      if (!/display_status|published|'published'/i.test(block)) continue;
      if (!/'published'|"published"/i.test(block)) continue;
      for (const needle of forbiddenInPublishedContext(block)) {
        violations.push({ kind: 'seed_published_legacy', file: rel, needle });
      }
    }
  }
  return violations;
}

function scanMigrations() {
  const violations = [];
  for (const rel of listMigrations()) {
    if (MIGRATION_ALLOWLIST.has(rel)) continue;
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    if (!/community_posts|community_media_assets/i.test(text)) continue;
    const inserts =
      text.match(/INSERT\s+INTO\s+community_(posts|media_assets)[\s\S]*?;/gi) || [];
    for (const block of inserts) {
      if (!/'published'|"published"|display_status\s*=\s*'published'/i.test(block)) continue;
      for (const needle of forbiddenInPublishedContext(block)) {
        violations.push({ kind: 'migration_insert_published_legacy', file: rel, needle });
      }
    }
  }
  return violations;
}

function scanProductionProfileGate() {
  const rel = 'frontend/lib/communityContentProfile.ts';
  const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  if (!text.includes('allowCommunityShowcaseLayers') || !text.includes('isCommunityContentProductionProfile')) {
    return [{ kind: 'frontend_gate', file: rel, detail: 'missing production profile gate' }];
  }
  return [];
}

function scanRepoData() {
  return [...scanCommunitySeeds(), ...scanMigrations(), ...scanProductionProfileGate()];
}

async function scanDb() {
  if (process.env.SKIP_COMMUNITY_MEDIA_GUARD_DB === '1') {
    return { skipped: true, violations: [] };
  }
  const conn = process.env.DATABASE_URL || 'postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust';
  let Client;
  try {
    Client = require(path.join(ROOT, 'frontend/node_modules/pg')).Client;
  } catch {
    return { skipped: true, violations: [], note: 'pg module unavailable' };
  }
  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
  } catch (e) {
    return { skipped: true, violations: [], note: String(e.message || e) };
  }

  const violations = [];
  const posts = await client.query(`
    SELECT id, display_status, display_origin, post_type, primary_media_asset_id,
           media_urls, cover_url
    FROM community_posts
    WHERE display_status = 'published'
    LIMIT 1000`);
  for (const r of posts.rows) {
    const urls = [...(r.media_urls || []), r.cover_url].filter(Boolean);
    for (const u of urls) {
      if (isNonGovernedCommunityMediaUrl(u)) {
        violations.push({
          kind: 'db_published_post',
          post_id: r.id,
          url: u,
          display_origin: r.display_origin,
        });
      }
    }
  }

  const assets = await client.query(`
    SELECT id, playback_url, object_key, state
    FROM community_media_assets
    WHERE playback_url IS NOT NULL
    LIMIT 2000`);
  for (const r of assets.rows) {
    if (isNonGovernedCommunityMediaUrl(r.playback_url)) {
      violations.push({ kind: 'db_media_asset', asset_id: r.id, url: r.playback_url, state: r.state });
    }
  }

  await client.end();
  return { skipped: false, violations, published_posts: posts.rows.length };
}

async function main() {
  const runtimeId = RuntimeIdentity.current();
  if (runtimeId.isProduction()) {
    console.log('RuntimeIdentity: production — media guard repo scan (no showcase seed on prod)');
  }
  const repoViolations = scanRepoData();
  const db = await scanDb();
  const all = [...repoViolations, ...db.violations];
  const pass = all.length === 0;

  console.log(`Community Media Guard: ${pass ? 'PASS' : 'FAIL'}`);
  console.log(`  repo_data_violations=${repoViolations.length}`);
  console.log(`  db_violations=${db.violations.length}${db.skipped ? ' (db skipped)' : ''}`);
  if (!pass) {
    for (const v of all.slice(0, 30)) {
      console.log(`  FAIL  ${JSON.stringify(v)}`);
    }
    if (all.length > 30) console.log(`  ... +${all.length - 30} more`);
    console.log('TT_COMMUNITY_MEDIA_GUARD: FAIL');
    process.exit(1);
  }
  console.log('TT_COMMUNITY_MEDIA_GUARD: PASS');
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
