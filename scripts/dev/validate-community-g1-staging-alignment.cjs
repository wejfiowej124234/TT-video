#!/usr/bin/env node
/**
 * PRM-CONTENT-B002 · Community G1 Content/Media — Phase ② Staging alignment
 *
 * Runs L5 + Media runtime validators against STAGING_API (not local).
 * Writes combined staging evidence — must NOT reuse local GO_production_readiness paths.
 *
 *   STAGING_API_BASE=https://tt-api-staging.fly.dev \
 *     node scripts/dev/validate-community-g1-staging-alignment.cjs \
 *     --evidence-dir evidence/GO_production_readiness/community-g1-staging-alignment/<stamp>
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const http = require('http');
const https = require('https');

const ROOT = path.join(__dirname, '../..');
const GAP_ID = 'PRM-CONTENT-B002';
const STAGING_API = (process.env.STAGING_API_BASE || process.env.LOCAL_API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const STAGING_WEB = (process.env.STAGING_WEB_BASE || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');
const STAMP = process.env.AUDIT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const LOCAL_GIT = execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();

function parseArgs() {
  const args = { evidenceDir: '', skipSubvalidators: false };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--evidence-dir') args.evidenceDir = process.argv[++i];
    if (process.argv[i] === '--skip-subvalidators') args.skipSubvalidators = true;
  }
  return args;
}

function fetchJson(url) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    lib
      .get(url, { timeout: 20000 }, (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, json: JSON.parse(d) });
          } catch {
            resolve({ status: res.statusCode, json: null, raw: d.slice(0, 300) });
          }
        });
      })
      .on('error', (e) => resolve({ status: 0, error: String(e.message || e) }));
  });
}

function runNode(rel, evidenceAbs, extraEnv = {}) {
  const relEvid = path.relative(ROOT, evidenceAbs).replace(/\\/g, '/');
  execSync(`node ${rel} --evidence-dir ${relEvid}`, {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      LOCAL_API: STAGING_API,
      GAP_ID,
      COMMUNITY_VALIDATION_PROFILE: 'staging',
      AUDIT_STAMP: STAMP,
      ...extraEnv,
    },
  });
}

async function main() {
  const { evidenceDir, skipSubvalidators } = parseArgs();
  const outDir = path.join(
    ROOT,
    evidenceDir || `evidence/GO_production_readiness/community-g1-staging-alignment/${STAMP}`
  );
  fs.mkdirSync(outDir, { recursive: true });

  const checks = [];
  const record = (id, status, detail) => checks.push({ id, status, detail });

  const ready = await fetchJson(`${STAGING_API}/health/ready`);
  record('staging_api_ready', ready.status === 200 ? 'PASS' : 'FAIL', `${STAGING_API} HTTP ${ready.status}`);

  const build = await fetchJson(`${STAGING_API}/meta/build`);
  const stagingSha = build.json?.git_sha || '';
  record(
    'staging_build_meta',
    build.status === 200 && stagingSha ? 'PASS' : 'FAIL',
    `git_sha=${stagingSha || 'missing'} local=${LOCAL_GIT.slice(0, 12)}`
  );

  if (checks.some((c) => c.status === 'FAIL')) {
    writeSignoff(outDir, checks, null, null, false);
    process.exit(1);
  }

  if (!skipSubvalidators) {
    runNode('scripts/dev/validate-community-production-ready-runtime.cjs', path.join(outDir, 'l5-runtime'));
    runNode('scripts/dev/validate-community-media-runtime-readiness-g1.cjs', path.join(outDir, 'media-runtime'), {
      SKIP_MEDIA_HEAD_PROBE: process.env.SKIP_MEDIA_HEAD_PROBE || '1',
    });
  }

  const l5Path = path.join(outDir, 'l5-runtime/community-production-ready-signoff.json');
  const mediaPath = path.join(outDir, 'media-runtime/community-media-runtime-signoff.json');
  let l5 = null;
  let media = null;
  if (fs.existsSync(l5Path)) l5 = JSON.parse(fs.readFileSync(l5Path, 'utf8'));
  if (fs.existsSync(mediaPath)) media = JSON.parse(fs.readFileSync(mediaPath, 'utf8'));

  if (process.env.SKIP_COMMUNITY_MEDIA_GUARD_DB !== '1') {
    try {
      runNode('scripts/dev/validate-community-media-guard.cjs', {
        DATABASE_URL: process.env.STAGING_DATABASE_URL || process.env.DATABASE_URL || '',
      });
      record('staging_db_media_guard', 'PASS', 'TT_COMMUNITY_MEDIA_GUARD on staging PG');
    } catch {
      record('staging_db_media_guard', 'FAIL', 'staging PG legacy media rows remain');
    }
  } else {
    record('staging_db_media_guard', 'SKIP', 'SKIP_COMMUNITY_MEDIA_GUARD_DB=1');
  }

  const l5Pass = l5?.machine_keys?.TT_COMMUNITY_PRODUCTION_READY_G1_DOMAIN === 'PASS';
  const mediaPass = media?.machine_keys?.TT_COMMUNITY_MEDIA_RUNTIME_READINESS_G1 === 'PASS';
  const allPass = l5Pass && mediaPass && checks.every((c) => c.status === 'PASS' || c.status === 'SKIP');

  writeSignoff(outDir, checks, l5, media, allPass);
  if (!allPass) process.exit(1);
}

function writeSignoff(outDir, checks, l5, media, allPass) {
  const signoff = {
    stamp: STAMP,
    gap_id: GAP_ID,
    phase: '②_staging',
    verdict: allPass ? 'COMMUNITY_G1_STAGING_ALIGNMENT_PASS' : 'COMMUNITY_G1_STAGING_ALIGNMENT_IN_PROGRESS',
    staging_api_base: STAGING_API,
    staging_web_base: STAGING_WEB,
    local_git_sha: LOCAL_GIT,
    staging_git_sha: l5?.staging_git_sha || null,
    machine_keys: {
      TT_COMMUNITY_G1_STAGING_ALIGNMENT: allPass ? 'PASS' : 'IN_PROGRESS',
      TT_COMMUNITY_PRODUCTION_READY_G1_DOMAIN: l5?.machine_keys?.TT_COMMUNITY_PRODUCTION_READY_G1_DOMAIN || 'UNKNOWN',
      TT_COMMUNITY_MEDIA_RUNTIME_READINESS_G1: media?.machine_keys?.TT_COMMUNITY_MEDIA_RUNTIME_READINESS_G1 || 'UNKNOWN',
      TT_PRODUCTION_GO: 'NO_GO',
    },
    policy: 'Independent staging evidence — do NOT reuse local 20260704T* directories as ② PASS',
    l5_signoff: l5 ? path.relative(ROOT, path.join(outDir, 'l5-runtime/community-production-ready-signoff.json')) : null,
    media_signoff: media
      ? path.relative(ROOT, path.join(outDir, 'media-runtime/community-media-runtime-readiness-signoff.json'))
      : null,
    checks,
    prm_content_b002_status: allPass ? 'CLOSED' : 'OPEN',
  };

  fs.writeFileSync(path.join(outDir, 'community-g1-staging-alignment-signoff.json'), JSON.stringify(signoff, null, 2) + '\n');
  const md = [
    '# Community G1 Staging Alignment · PRM-CONTENT-B002',
    '',
    `**Verdict:** ${signoff.verdict}`,
    `**Phase:** ② Staging · **API:** ${STAGING_API}`,
    '',
    '| Check | Status | Detail |',
    '|-------|--------|--------|',
    ...checks.map((c) => `| ${c.id} | ${c.status} | ${String(c.detail).replace(/\|/g, '/')} |`),
    '',
    l5 ? `**L5:** ${signoff.l5_signoff}` : '',
    media ? `**Media:** ${signoff.media_signoff}` : '',
    '',
    signoff.policy,
  ]
    .filter(Boolean)
    .join('\n');
  fs.writeFileSync(path.join(outDir, 'COMMUNITY-G1-STAGING-ALIGNMENT-CHECKLIST.md'), md);
  fs.writeFileSync(path.join(outDir, 'README.md'), md);

  console.log(`Community G1 Staging Alignment: ${signoff.verdict}`);
  console.log(`PRM-CONTENT-B002: ${signoff.prm_content_b002_status}`);
  console.log(`TT_COMMUNITY_G1_STAGING_ALIGNMENT: ${signoff.machine_keys.TT_COMMUNITY_G1_STAGING_ALIGNMENT}`);
  console.log(`Evidence: ${path.relative(ROOT, outDir)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
