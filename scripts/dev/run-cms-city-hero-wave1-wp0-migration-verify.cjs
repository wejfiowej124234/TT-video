#!/usr/bin/env node
/**
 * City Hero Wave 1 · WP0 · DB migration verify + evidence
 * Validates catalog_media_assets.asset_kind CHECK includes city_hero.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');

function loadPgClient() {
  try {
    return require(path.join(ROOT, 'frontend/node_modules/pg')).Client;
  } catch {
    return require('pg').Client;
  }
}
const MIGRATION = path.join(ROOT, 'crates/api/migrations/20260707120000_cms_city_hero_asset_kind.sql');
const EVID_DIR = path.join(ROOT, 'evidence/GO_cms_operation/city-hero');
const OUT_JSON = path.join(EVID_DIR, 'CMS-CITY-HERO-WAVE1-WP0-MIGRATION-LATEST.json');
const OUT_MD = path.join(EVID_DIR, 'CMS-CITY-HERO-WAVE1-WP0-MIGRATION-LATEST.md');

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

function staticChecks() {
  const checks = [];
  const exists = fs.existsSync(MIGRATION);
  checks.push({
    id: 'migration_file_exists',
    verdict: exists ? 'PASS' : 'FAIL',
    path: 'crates/api/migrations/20260707120000_cms_city_hero_asset_kind.sql',
  });
  if (!exists) return checks;

  const sql = fs.readFileSync(MIGRATION, 'utf8');
  const hasCityHero = /'city_hero'/.test(sql);
  const hasDrop = /DROP CONSTRAINT IF EXISTS catalog_media_assets_asset_kind_check/.test(sql);
  const hasAdd = /ADD CONSTRAINT catalog_media_assets_asset_kind_check/.test(sql);
  const preservesExisting = ['poi_hero', 'landing_ambient', 'hotel_tier_stock', 'transport_stock', 'generic'].every(
    (k) => sql.includes(`'${k}'`),
  );
  const noOtherTables = !/ALTER TABLE(?! catalog_media_assets)/.test(sql.replace(/\s+/g, ' '));

  checks.push(
    { id: 'includes_city_hero', verdict: hasCityHero ? 'PASS' : 'FAIL' },
    { id: 'drops_old_check', verdict: hasDrop ? 'PASS' : 'FAIL' },
    { id: 'adds_named_check', verdict: hasAdd ? 'PASS' : 'FAIL' },
    { id: 'preserves_existing_kinds', verdict: preservesExisting ? 'PASS' : 'FAIL' },
    { id: 'scope_catalog_media_assets_only', verdict: noOtherTables ? 'PASS' : 'FAIL' },
  );
  return checks;
}

function runSqlx(databaseUrl) {
  const env = { ...process.env, DATABASE_URL: databaseUrl };
  const run = spawnSync('sqlx', ['migrate', 'run'], {
    cwd: path.join(ROOT, 'crates/api'),
    env,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  const info = spawnSync('sqlx', ['migrate', 'info'], {
    cwd: path.join(ROOT, 'crates/api'),
    env,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  const infoText = (info.stdout || '') + (info.stderr || '');
  const applied =
    /20260707120000.*(?:Applied|\(applied\)|\/installed)/i.test(infoText);
  return {
    migrate_run: {
      exit_code: run.status,
      verdict: run.status === 0 ? 'PASS' : 'FAIL',
      stdout_tail: (run.stdout || '').slice(-500),
      stderr_tail: (run.stderr || '').slice(-500),
    },
    migrate_info: {
      exit_code: info.status,
      verdict: info.status === 0 && applied ? 'PASS' : info.status === 0 ? 'FAIL' : 'FAIL',
      applied,
      stdout_tail: infoText.slice(-800),
    },
  };
}

async function pgChecks(databaseUrl) {
  const Client = loadPgClient();
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const checkRow = await client.query(
      `SELECT pg_get_constraintdef(c.oid) AS def
       FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       WHERE t.relname = 'catalog_media_assets'
         AND c.conname = 'catalog_media_assets_asset_kind_check'`,
    );
    const def = checkRow.rows[0]?.def || '';
    const checkIncludesCityHero = def.includes('city_hero');

    let insertProbe = { verdict: 'SKIP', reason: 'no_table' };
    const tableExists = await client.query(
      `SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'catalog_media_assets'`,
    );
    if (tableExists.rowCount > 0) {
      const probeUrl = `https://wp0-probe.invalid/city-hero/${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await client.query('BEGIN');
      try {
        await client.query(
          `INSERT INTO catalog_media_assets (asset_kind, source_type, url, publish_status)
           VALUES ($1, $2, $3, 'draft')`,
          ['city_hero', 'upload', probeUrl],
        );
        insertProbe = { verdict: 'PASS', note: 'INSERT city_hero succeeded (rolled back)' };
      } catch (e) {
        insertProbe = { verdict: 'FAIL', error: String(e.message || e) };
      } finally {
        await client.query('ROLLBACK');
      }
    }

    let rejectProbe = { verdict: 'SKIP' };
    if (tableExists.rowCount > 0) {
      const badUrl = `https://wp0-probe.invalid/bad/${Date.now()}`;
      await client.query('BEGIN');
      try {
        await client.query(
          `INSERT INTO catalog_media_assets (asset_kind, source_type, url, publish_status)
           VALUES ($1, $2, $3, 'draft')`,
          ['not_a_valid_kind', 'upload', badUrl],
        );
        rejectProbe = { verdict: 'FAIL', note: 'invalid kind should have been rejected' };
      } catch {
        rejectProbe = { verdict: 'PASS', note: 'invalid asset_kind still rejected' };
      } finally {
        await client.query('ROLLBACK');
      }
    }

    return {
      constraint_def: def,
      check_includes_city_hero: {
        verdict: checkIncludesCityHero ? 'PASS' : 'FAIL',
      },
      insert_city_hero_probe: insertProbe,
      reject_invalid_kind_probe: rejectProbe,
    };
  } finally {
    await client.end();
  }
}

async function main() {
  const stamp = new Date().toISOString();
  const staticChecksResult = staticChecks();
  const databaseUrl = loadDatabaseUrl();

  let sqlxResult = { verdict: 'SKIP', reason: 'no DATABASE_URL' };
  let pgResult = { verdict: 'SKIP', reason: 'no DATABASE_URL' };

  if (databaseUrl) {
    sqlxResult = runSqlx(databaseUrl);
    try {
      pgResult = await pgChecks(databaseUrl);
    } catch (e) {
      pgResult = { verdict: 'FAIL', error: String(e.message || e) };
    }
  }

  const allStaticPass = staticChecksResult.every((c) => c.verdict === 'PASS');
  const sqlxPass =
    sqlxResult.migrate_run?.verdict === 'PASS' && sqlxResult.migrate_info?.verdict === 'PASS';
  const pgPass =
    pgResult.check_includes_city_hero?.verdict === 'PASS' &&
    pgResult.insert_city_hero_probe?.verdict === 'PASS' &&
    pgResult.reject_invalid_kind_probe?.verdict === 'PASS';

  const wp0Pass = allStaticPass && sqlxPass && pgPass;

  const doc = {
    schema: 'traveltrust.cms_city_hero_wave1_wp0_migration_evidence.v1',
    recorded_at_utc: stamp,
    work_package: 'WP0',
    TT_CMS_CITY_HERO_WAVE1_WP0: wp0Pass ? 'PASS' : 'FAIL',
    TT_CMS_CITY_HERO_WAVE1_TOKYO: 'PENDING_IMPLEMENTATION',
    migration: 'crates/api/migrations/20260707120000_cms_city_hero_asset_kind.sql',
    scope: {
      changed: ['catalog_media_assets.asset_kind CHECK'],
      untouched: ['admin', 'api', 'runtime', 'frontend', 'asset_upload', 'registry', 'ownership_matrix', 'p1_standard'],
    },
    static_checks: staticChecksResult,
    sqlx: sqlxResult,
    postgres: pgResult,
    next_step: wp0Pass ? 'WP1 Admin allowlist' : 'fix WP0 migration or DB verification',
  };

  const md = [
    '# City Hero Wave 1 · WP0 Migration',
    '',
    '| | |',
    '|---|---|',
    `| **Date** | ${stamp.slice(0, 10)} |`,
    `| **Verdict** | **${doc.TT_CMS_CITY_HERO_WAVE1_WP0}** |`,
    '| **Migration** | `20260707120000_cms_city_hero_asset_kind.sql` |',
    '',
    '## Static Checks',
    '',
    ...staticChecksResult.map((c) => `- ${c.id}: **${c.verdict}**`),
    '',
    '## SQLx',
    '',
    `- migrate run: **${sqlxResult.migrate_run?.verdict ?? sqlxResult.verdict ?? 'SKIP'}**`,
    `- migrate info (applied): **${sqlxResult.migrate_info?.verdict ?? 'SKIP'}**`,
    '',
    '## PostgreSQL',
    '',
    `- CHECK includes city_hero: **${pgResult.check_includes_city_hero?.verdict ?? pgResult.verdict ?? 'SKIP'}**`,
    `- INSERT city_hero probe: **${pgResult.insert_city_hero_probe?.verdict ?? 'SKIP'}**`,
    `- Reject invalid kind: **${pgResult.reject_invalid_kind_probe?.verdict ?? 'SKIP'}**`,
    '',
    '## Next',
    '',
    doc.next_step,
  ].join('\n');

  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2) + '\n');
  fs.writeFileSync(OUT_MD, md + '\n');

  console.log(`TT_CMS_CITY_HERO_WAVE1_WP0: ${doc.TT_CMS_CITY_HERO_WAVE1_WP0}`);
  console.log(`Evidence: ${OUT_JSON}`);
  if (!wp0Pass) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
