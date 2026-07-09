#!/usr/bin/env node
/**
 * Community Media Runtime Readiness · DB + API audit (PRM-MEDIA-B001)
 *
 *   node scripts/dev/audit-community-media-runtime-readiness.cjs
 *   node scripts/dev/audit-community-media-runtime-readiness.cjs --evidence-dir evidence/...
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const {
  isNonGovernedCommunityMediaUrl,
  classifyCommunityMediaUrl,
  mediaViolationsFromPosts,
} = require('./lib/community-media-legacy-policy.cjs');

const ROOT = path.join(__dirname, '../..');
const STAMP = process.env.AUDIT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const LOCAL_API = (process.env.LOCAL_API || 'http://127.0.0.1:8080').replace(/\/$/, '');
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust';

function loadPgClient() {
  try {
    return require(path.join(ROOT, 'frontend/node_modules/pg')).Client;
  } catch {
    return require('pg').Client;
  }
}

function parseArgs() {
  const args = { evidenceDir: '' };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--evidence-dir') args.evidenceDir = process.argv[++i];
  }
  return args;
}

async function auditDb() {
  const Client = loadPgClient();
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
  } catch (e) {
    return { ok: false, error: String(e.message || e), rows: [] };
  }
  const q = `
    SELECT id, display_status, display_origin, data_origin, post_type,
           primary_media_asset_id, media_urls, cover_url
    FROM community_posts
    WHERE display_status = 'published'
    ORDER BY created_at DESC
    LIMIT 500`;
  const { rows } = await client.query(q);
  await client.end();

  const violations = [];
  for (const r of rows) {
    const urls = [...(r.media_urls || []), r.cover_url].filter(Boolean);
    for (const u of urls) {
      if (isNonGovernedCommunityMediaUrl(u)) {
        violations.push({
          source: 'db_published',
          post_id: r.id,
          display_origin: r.display_origin,
          url: u,
          class: classifyCommunityMediaUrl(u),
        });
      }
    }
    if (
      r.post_type === 'video' &&
      !r.primary_media_asset_id &&
      (r.media_urls || []).some((u) => /\/uploads\/community-posts\//i.test(u))
    ) {
      violations.push({
        source: 'db_published',
        post_id: r.id,
        type: 'video_without_media_asset',
      });
    }
  }
  return { ok: true, published_count: rows.length, violations, rows: rows.slice(0, 20) };
}

async function auditApiSurfaces() {
  const client = createClient(LOCAL_API);
  const ready = await client.req('GET', '/health/ready');
  if (ready.status !== 200) {
    return { ok: false, error: `API not ready HTTP ${ready.status}`, violations: [] };
  }

  const surfaces = [
    ['feed', '/api/v1/community/feed?limit=100'],
    ['hot', '/api/v1/community/feed?hot=1&limit=100'],
    ['search', '/api/v1/community/feed?q=travel&limit=50'],
  ];

  const allPosts = [];
  const bySurface = {};
  for (const [name, path] of surfaces) {
    const r = await client.req('GET', path);
    const posts = r.json?.posts || [];
    bySurface[name] = posts.length;
    allPosts.push(...posts.map((p) => ({ ...p, _surface: name })));
  }

  const explore = await client.req('GET', '/api/v1/community/explore/destinations');
  const camp = await client.req('GET', '/api/v1/official/cold-start/surfaces/community_feed');

  const violations = [];
  for (const p of allPosts) {
    const surface = p._surface || 'feed';
    violations.push(...mediaViolationsFromPosts([p], `api_${surface}`));
  }

  return {
    ok: violations.length === 0,
    bySurface,
    explore_catalog: explore.json?.catalog,
    campaign_status: camp.status,
    violations,
  };
}

async function main() {
  const { evidenceDir } = parseArgs();
  const db = await auditDb();
  const api = await auditApiSurfaces();

  const report = {
    stamp: STAMP,
    gap_id: 'PRM-MEDIA-B001',
    db,
    api,
    summary: {
      db_published_legacy: db.violations?.length || 0,
      api_surface_legacy: api.violations?.length || 0,
    },
  };

  const outDir = evidenceDir
    ? path.join(ROOT, evidenceDir)
    : path.join(ROOT, 'evidence/GO_production_readiness/community-media-runtime-ready', STAMP, 'audit');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'community-media-audit.json'), JSON.stringify(report, null, 2) + '\n');

  console.log('Community Media Audit (PRM-MEDIA-B001)');
  console.log(`  db published=${db.published_count ?? 'n/a'} legacy_violations=${report.summary.db_published_legacy}`);
  console.log(`  api surface legacy_violations=${report.summary.api_surface_legacy}`);
  console.log(`Evidence: ${path.relative(ROOT, outDir)}`);

  const fail = report.summary.db_published_legacy > 0 || report.summary.api_surface_legacy > 0;
  if (fail) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
