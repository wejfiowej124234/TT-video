/**
 * City Hero Wave 1 · WP3 Ops helpers
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../../..');

const WAVE1 = {
  matrix_id: 'CH-JP-TOKYO-001',
  country_iso: 'JP',
  country_zh: '日本',
  city_slug: 'tokyo',
  city_zh: '东京',
  city_en: 'Tokyo',
  asset_key: 'city_hero_tokyo',
  fallback_key: 'hero_japan',
  asset_kind: 'city_hero',
  hero_filename: 'city-hero-tokyo-v1.jpg',
};

function loadPgClient() {
  try {
    return require(path.join(ROOT, 'frontend/node_modules/pg')).Client;
  } catch {
    return require('pg').Client;
  }
}

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return null;
  for (const rawLine of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    const m = line.match(/^DATABASE_URL=(.+)$/);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  }
  return null;
}

async function workflowPublishMedia(client, tok, asset) {
  const getPath = `/api/v1/admin/content/media-assets/${asset.id}`;
  let current = asset;
  if (current.publish_status === 'draft') {
    await client.req('POST', `${getPath}/submit-review`, { version: current.version }, tok);
    current = (await client.req('GET', getPath, null, tok)).json.item;
  }
  if (current.publish_status === 'in_review') {
    await client.req('POST', `${getPath}/publish`, { version: current.version }, tok);
    current = (await client.req('GET', getPath, null, tok)).json.item;
  }
  return current;
}

async function seedJpTokyoCatalogRefs(pgClient) {
  const country = await pgClient.query(
    `SELECT id FROM catalog_countries WHERE iso3166 = 'JP' AND publish_status = 'published' LIMIT 1`,
  );
  if (country.rows[0]) {
    const city = await pgClient.query(
      `SELECT id FROM catalog_cities WHERE country_id = $1 AND slug = 'tokyo' AND publish_status = 'published' LIMIT 1`,
      [country.rows[0].id],
    );
    if (city.rows[0]) {
      return { country_id: country.rows[0].id, city_id: city.rows[0].id, seeded: false };
    }
  }

  const countryIns = await pgClient.query(
    `INSERT INTO catalog_countries (iso3166, name_zh, name_en, sort_order, open_status, publish_status, version, published_at)
     VALUES ('JP', '日本', 'Japan', 1, 'open', 'published', 1, now())
     ON CONFLICT (iso3166) DO UPDATE SET publish_status = 'published', updated_at = now()
     RETURNING id`,
  );
  const countryId = countryIns.rows[0].id;
  const cityIns = await pgClient.query(
    `INSERT INTO catalog_cities (country_id, slug, name_zh, name_en, sort_order, open_status, publish_status, version, published_at)
     VALUES ($1, 'tokyo', '东京', 'Tokyo', 1, 'open', 'published', 1, now())
     ON CONFLICT (country_id, slug) DO UPDATE SET publish_status = 'published', updated_at = now()
     RETURNING id`,
    [countryId],
  );
  return { country_id: countryId, city_id: cityIns.rows[0].id, seeded: true };
}

module.exports = {
  ROOT,
  WAVE1,
  loadPgClient,
  loadDatabaseUrl,
  workflowPublishMedia,
  seedJpTokyoCatalogRefs,
};
