#!/usr/bin/env node
/** Apply PRM-MEDIA-B001 migration when psql CLI unavailable (Windows). */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '../..');
const sqlPath = path.join(ROOT, 'crates/api/migrations/20260704140000_community_media_runtime_readiness_g1.sql');
const conn = process.env.DATABASE_URL || 'postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust';
const { Client } = require(path.join(ROOT, 'frontend/node_modules/pg'));

async function main() {
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = new Client({ connectionString: conn });
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log('TT_COMMUNITY_MEDIA_MIGRATION_G1: PASS');
}

main().catch((e) => {
  console.error('TT_COMMUNITY_MEDIA_MIGRATION_G1: FAIL', e.message || e);
  process.exit(1);
});
