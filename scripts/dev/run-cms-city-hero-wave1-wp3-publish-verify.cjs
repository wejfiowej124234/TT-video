#!/usr/bin/env node
/**
 * City Hero Wave 1 · WP3 · Publish verify + evidence
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { WAVE1, loadDatabaseUrl, loadPgClient } = require('./lib/cms-city-hero-wp3.cjs');

const ROOT = path.join(__dirname, '../..');
const WP2_EVID = path.join(ROOT, 'evidence/GO_cms_operation/city-hero/CMS-CITY-HERO-WAVE1-WP2-API-CITY-SLUG-LATEST.json');
const EVID_DIR = path.join(ROOT, 'evidence/GO_cms_operation/city-hero');
const OUT_JSON = path.join(EVID_DIR, 'CMS-CITY-HERO-WAVE1-WP3-PUBLISH-LATEST.json');
const OUT_MD = path.join(EVID_DIR, 'CMS-CITY-HERO-WAVE1-WP3-PUBLISH-LATEST.md');

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

async function fetchJson(url) {
  const r = await fetch(url);
  const j = await r.json();
  return { status: r.status, json: j };
}

async function pgPublishedRow(databaseUrl) {
  const Client = loadPgClient();
  const pg = new Client({ connectionString: databaseUrl });
  await pg.connect();
  try {
    const q = await pg.query(
      `SELECT m.id, m.asset_kind, m.publish_status, m.stock_pool_key, m.url,
              co.iso3166 AS country_iso, c.slug AS city_slug
       FROM catalog_media_assets m
       LEFT JOIN catalog_countries co ON co.id = m.country_id
       LEFT JOIN catalog_cities c ON c.id = m.city_id
       WHERE m.stock_pool_key = $1 AND m.publish_status = 'published'
       LIMIT 1`,
      [WAVE1.asset_key],
    );
    return q.rows[0] || null;
  } finally {
    await pg.end();
  }
}

function readWp2() {
  if (!fs.existsSync(WP2_EVID)) return { TT_CMS_CITY_HERO_WAVE1_WP2: 'MISSING' };
  return JSON.parse(fs.readFileSync(WP2_EVID, 'utf8'));
}

async function main() {
  const stamp = new Date().toISOString();
  const api = arg('--api', process.env.LOCAL_API || process.env.API || 'http://127.0.0.1:8080').replace(/\/$/, '');
  const wp2 = readWp2();
  const databaseUrl = loadDatabaseUrl();

  const queryUrl = `${api}/api/v1/catalog/media?asset_kind=city_hero&country_iso=JP&city_slug=tokyo`;
  let catalog = { verdict: 'FAIL', reason: 'not_probed' };
  try {
    const { status, json } = await fetchJson(queryUrl);
    const row = (json.items || []).find((i) => i.asset_key === WAVE1.asset_key || i.stock_pool_key === WAVE1.asset_key);
    catalog = {
      verdict: status === 200 && json.count >= 1 && row ? 'PASS' : 'FAIL',
      http_status: status,
      count: json.count,
      row: row
        ? {
            asset_kind: row.asset_kind,
            city_slug: row.city_slug,
            asset_key: row.asset_key,
            country_iso: row.country_iso,
            url: row.url,
          }
        : null,
      query: queryUrl,
    };
  } catch (e) {
    catalog = { verdict: 'FAIL', error: String(e.message || e), query: queryUrl };
  }

  let dbRow = null;
  if (databaseUrl) {
    dbRow = await pgPublishedRow(databaseUrl);
  }

  const acceptance = {
    asset_kind: catalog.row?.asset_kind === WAVE1.asset_kind,
    city_slug: catalog.row?.city_slug === WAVE1.city_slug,
    asset_key: catalog.row?.asset_key === WAVE1.asset_key,
    status_published: dbRow?.publish_status === 'published',
    country_jp: catalog.row?.country_iso === WAVE1.country_iso || dbRow?.country_iso === WAVE1.country_iso,
    fallback_key_preserved: WAVE1.fallback_key === 'hero_japan',
    url_live: Boolean(catalog.row?.url?.startsWith('http')),
  };

  const wp3Pass =
    wp2.TT_CMS_CITY_HERO_WAVE1_WP2 === 'PASS' &&
    catalog.verdict === 'PASS' &&
    Object.values(acceptance).every(Boolean);

  const doc = {
    schema: 'traveltrust.cms_city_hero_wave1_wp3_publish_evidence.v1',
    recorded_at_utc: stamp,
    work_package: 'WP3',
    TT_CMS_CITY_HERO_WAVE1_WP3: wp3Pass ? 'PASS' : 'FAIL',
    TT_CMS_CITY_HERO_WAVE1_TOKYO: 'PENDING_IMPLEMENTATION',
    upstream_wp2: wp2.TT_CMS_CITY_HERO_WAVE1_WP2,
    matrix_id: WAVE1.matrix_id,
    asset_key: WAVE1.asset_key,
    fallback_key: WAVE1.fallback_key,
    catalog_api_probe: catalog,
    db_published_row: dbRow,
    acceptance_checks: acceptance,
    scope: {
      ops_only: true,
      untouched: ['resolver', 'home', 'travel', 'frontend', 'registry', 'matrix', 'p1_standard', 'api_code'],
    },
    wp6_workspace_test_reminder:
      'Before WP6: run full cargo test -p traveltrust-api after workspace E0063 (OrderRow/GuideRow) is cleared · not a City Hero defect',
    staging_deploy_note:
      'Staging Admin may return invalid_asset_kind until WP0–WP2 deploy · local publish + local API verify is Wave 1 pilot path',
    next_step: wp3Pass ? 'WP4 Runtime resolver' : 'fix publish or start local API with WP2 binary',
  };

  const md = [
    '# City Hero Wave 1 · WP3 Catalog Publish',
    '',
    '| | |',
    '|---|---|',
    `| **Date** | ${stamp.slice(0, 10)} |`,
    `| **Verdict** | **${doc.TT_CMS_CITY_HERO_WAVE1_WP3}** |`,
    `| **asset_key** | \`${WAVE1.asset_key}\` |`,
    `| **fallback_key** | \`${WAVE1.fallback_key}\` (matrix · unchanged) |`,
    '',
    '## Catalog API',
    '',
    `- Query: \`${queryUrl}\``,
    `- count: **${catalog.count ?? 'n/a'}**`,
    `- row: \`${catalog.row ? JSON.stringify(catalog.row) : 'missing'}\``,
    '',
    '## Acceptance',
    '',
    ...Object.entries(acceptance).map(([k, v]) => `- ${k}: **${v ? 'PASS' : 'FAIL'}**`),
    '',
    '## Next',
    '',
    doc.next_step,
  ].join('\n');

  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2) + '\n');
  fs.writeFileSync(OUT_MD, md + '\n');

  console.log(`TT_CMS_CITY_HERO_WAVE1_WP3: ${doc.TT_CMS_CITY_HERO_WAVE1_WP3}`);
  console.log(`Evidence: ${OUT_JSON}`);
  if (!wp3Pass) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
