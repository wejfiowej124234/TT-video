#!/usr/bin/env node
/**
 * ① local · remediate DDG community feed probe leaks (E2E probe posts public but draft in OCS queue).
 *
 *   node scripts/dev/remediate-ddg-community-probe-leaks-local.cjs
 *
 * Archives smoke/probe community_posts still visible on public feed @ local dev.
 */
'use strict';

const { execSync } = require('child_process');
const http = require('http');

const API = (process.env.API_BASE || process.env.API || 'http://127.0.0.1:8080').replace(/\/$/, '');
const PG_CONTAINER = process.env.TRAVELTRUST_PG_CONTAINER || 'traveltrust-postgres';
const PG_USER = process.env.PGUSER || 'traveltrust';
const PG_DB = process.env.PGDATABASE || 'traveltrust';

const { isSmokeContent } = require('./lib/smoke-data-heuristics.cjs');

function pubGet(path) {
  return new Promise((resolve, reject) => {
    const u = new URL(API + path);
    http
      .get({ hostname: u.hostname, port: u.port || 80, path: u.pathname + u.search }, (res) => {
        let d = '';
        res.on('data', (c) => (d += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(d));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

async function main() {
  const feed = await pubGet('/api/v1/community/feed?limit=200');
  const rows = feed.posts || feed.items || [];
  const bad = rows.filter((p) => isSmokeContent(p));
  if (!bad.length) {
    console.log('TT_DDG_COMMUNITY_PROBE_REMEDIATE: PASS nothing_to_fix');
    process.exit(0);
  }

  const ids = bad.map((p) => p.id).filter(Boolean);
  const idList = ids.map((id) => `'${id.replace(/'/g, "''")}'`).join(',');
  const sql = `UPDATE community_posts SET visibility_status = 'archived' WHERE id IN (${idList}) AND visibility_status = 'public';`;

  let updated = 0;
  try {
    sh(
      `docker exec ${PG_CONTAINER} psql -U ${PG_USER} -d ${PG_DB} -v ON_ERROR_STOP=1 -c ${JSON.stringify(sql)}`
    );
    updated = ids.length;
  } catch (e) {
    console.error('TT_DDG_COMMUNITY_PROBE_REMEDIATE: FAIL docker/psql', e.stderr || e.message);
    process.exit(1);
  }

  const feedAfter = await pubGet('/api/v1/community/feed?limit=200');
  const badAfter = (feedAfter.posts || feedAfter.items || []).filter((p) => isSmokeContent(p));
  const pass = badAfter.length === 0;
  console.log(
    `TT_DDG_COMMUNITY_PROBE_REMEDIATE: ${pass ? 'PASS' : 'FAIL'} archived=${updated} remaining=${badAfter.length}`
  );
  process.exit(pass ? 0 : 1);
}

main().catch((e) => {
  console.error('TT_DDG_COMMUNITY_PROBE_REMEDIATE: ERROR', e.message);
  process.exit(1);
});
