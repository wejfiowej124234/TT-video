#!/usr/bin/env node
/**
 * City Hero Wave 1 · WP4 · Runtime resolver verify + evidence
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const RESOLVER = path.join(ROOT, 'frontend/lib/catalogApi/resolveCityHero.ts');
const TESTS = path.join(ROOT, 'frontend/lib/catalogApi/resolveCityHero.test.ts');
const WP3_EVID = path.join(ROOT, 'evidence/GO_cms_operation/city-hero/CMS-CITY-HERO-WAVE1-WP3-PUBLISH-LATEST.json');
const EVID_DIR = path.join(ROOT, 'evidence/GO_cms_operation/city-hero');
const OUT_JSON = path.join(EVID_DIR, 'CMS-CITY-HERO-WAVE1-WP4-RESOLVER-LATEST.json');
const OUT_MD = path.join(EVID_DIR, 'CMS-CITY-HERO-WAVE1-WP4-RESOLVER-LATEST.md');

function staticChecks() {
  const src = fs.readFileSync(RESOLVER, 'utf8');
  const tests = fs.readFileSync(TESTS, 'utf8');
  return [
    { id: 'resolver_file', verdict: fs.existsSync(RESOLVER) ? 'PASS' : 'FAIL' },
    { id: 'fallback_chain_city_hero', verdict: /assetKind: "city_hero"/.test(src) ? 'PASS' : 'FAIL' },
    { id: 'fallback_chain_landing_ambient', verdict: /assetKind: "landing_ambient"/.test(src) ? 'PASS' : 'FAIL' },
    { id: 'fallback_chain_ts', verdict: /source: "ts"/.test(src) && /landingAmbientImageUrl/.test(src) ? 'PASS' : 'FAIL' },
    { id: 'catalog_api_fallback_source', verdict: /catalog-api-fallback/.test(src) ? 'PASS' : 'FAIL' },
    { id: 'fallback_used_flag', verdict: /fallback_used/.test(src) ? 'PASS' : 'FAIL' },
    { id: 'hero_japan_map', verdict: /hero_japan/.test(src) ? 'PASS' : 'FAIL' },
    { id: 'client_city_slug', verdict: fs.readFileSync(path.join(ROOT, 'frontend/lib/catalogApi/client.ts'), 'utf8').includes('citySlug') ? 'PASS' : 'FAIL' },
    { id: 'no_consumer_wiring', verdict: !fs.existsSync(path.join(ROOT, 'frontend/lib/catalogApi/useCityHeroUrl.ts')) ? 'PASS' : 'FAIL' },
    { id: 'unit_tests_present', verdict: tests.includes('catalog-api-fallback') ? 'PASS' : 'FAIL' },
    {
      id: 'landing_pages_untouched',
      verdict: !fs.readFileSync(path.join(ROOT, 'frontend/components/landing/LandingHomeAmbientBackdrop.tsx'), 'utf8').includes('resolveCityHero')
        ? 'PASS'
        : 'FAIL',
    },
  ];
}

function runVitest() {
  const r = spawnSync('npx', ['vitest', 'run', 'lib/catalogApi/resolveCityHero.test.ts'], {
    cwd: path.join(ROOT, 'frontend'),
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  const out = (r.stdout || '') + (r.stderr || '');
  const passed = /Tests\s+\d+\s+passed/.test(out) || (r.status === 0 && out.includes('passed'));
  return {
    verdict: r.status === 0 && passed ? 'PASS' : 'FAIL',
    exit_code: r.status,
    output_tail: out.slice(-1200),
  };
}

function readWp3() {
  if (!fs.existsSync(WP3_EVID)) return { TT_CMS_CITY_HERO_WAVE1_WP3: 'MISSING' };
  return JSON.parse(fs.readFileSync(WP3_EVID, 'utf8'));
}

function main() {
  const stamp = new Date().toISOString();
  const wp3 = readWp3();
  const staticChecksResult = staticChecks();
  const vitest = runVitest();

  const staticPass = staticChecksResult.every((c) => c.verdict === 'PASS');
  const wp3Pass = wp3.TT_CMS_CITY_HERO_WAVE1_WP3 === 'PASS';
  const wp4Pass = staticPass && vitest.verdict === 'PASS' && wp3Pass;

  const doc = {
    schema: 'traveltrust.cms_city_hero_wave1_wp4_resolver_evidence.v1',
    recorded_at_utc: stamp,
    work_package: 'WP4',
    TT_CMS_CITY_HERO_WAVE1_WP4: wp4Pass ? 'PASS' : 'FAIL',
    TT_CMS_CITY_HERO_WAVE1_TOKYO: 'PENDING_IMPLEMENTATION',
    upstream_wp3: wp3.TT_CMS_CITY_HERO_WAVE1_WP3,
    resolver: 'frontend/lib/catalogApi/resolveCityHero.ts',
    fallback_chain: ['city_hero(catalog-api)', 'landing_ambient(catalog-api-fallback)', 'ts'],
    wave1_tokyo: {
      country_iso: 'JP',
      city_slug: 'tokyo',
      asset_key: 'city_hero_tokyo',
      fallback_key: 'hero_japan',
    },
    static_checks: staticChecksResult,
    vitest,
    scope: {
      changed: ['resolveCityHero.ts', 'resolveCityHero.test.ts', 'types.ts', 'client.ts citySlug', 'catalogApi/index.ts exports'],
      untouched: ['home', 'travel', 'consumer_hooks', 'registry', 'matrix', 'p1_standard', 'new_assets'],
    },
    wp6_workspace_test_reminder:
      'Full cargo test -p traveltrust-api remains blocked by workspace E0063 until WP6 · vitest resolver tests are WP4 authority',
    next_step: wp4Pass ? 'WP5 Home/Travel Consumer wiring' : 'fix WP4 resolver',
  };

  const md = [
    '# City Hero Wave 1 · WP4 Resolver',
    '',
    '| | |',
    '|---|---|',
    `| **Date** | ${stamp.slice(0, 10)} |`,
    `| **Verdict** | **${doc.TT_CMS_CITY_HERO_WAVE1_WP4}** |`,
    '',
    '## Fallback',
    '',
    '`city_hero → landing_ambient → ts`',
    '',
    '## Vitest',
    '',
    `- **${vitest.verdict}**`,
    '',
    '## Next',
    '',
    doc.next_step,
  ].join('\n');

  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2) + '\n');
  fs.writeFileSync(OUT_MD, md + '\n');

  console.log(`TT_CMS_CITY_HERO_WAVE1_WP4: ${doc.TT_CMS_CITY_HERO_WAVE1_WP4}`);
  console.log(`WP3 upstream: ${wp3.TT_CMS_CITY_HERO_WAVE1_WP3}`);
  console.log(`Evidence: ${OUT_JSON}`);
  if (!wp4Pass) process.exit(1);
}

main();
