#!/usr/bin/env node
/**
 * Xi'an · Execution + Content QA Wave · JP + KR 双模板同源
 *
 *   TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE=1 \
 *   API=https://tt-api-staging.fly.dev \
 *     node scripts/dev/run-cms-xian-content-qa-wave.cjs
 *
 * 顺序: Catalog Build → 10×(Replace 1× → Publish → Verify → LOCK) → Execution CLOSED → Content QA CLOSED → Exit Check
 */
const { execSync } = require('child_process');
const path = require('path');
const { getCityPilot } = require('./lib/cms-poi-city-pilot.cjs');
const { getAsset } = require('./lib/cms-content-qa-asset-lock.cjs');
const { ensureCmsQaHeroOnStaging } = require('./lib/cms-destination-ambient-hero.cjs');
const { assertStagingBaselineMutationAuthorized } = require('./lib/staging-rc-baseline-authorize.cjs');

assertStagingBaselineMutationAuthorized('cms_xian_content_qa_wave');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const XIAN = getCityPilot('西安');

const XIAN_HEROES = XIAN.hero_files;

async function syncAllHeroes() {
  const unique = [...new Set(Object.values(XIAN_HEROES))];
  console.log(`\n===== Pre-sync staging heroes (${unique.length} unique / ${XIAN.matrix_ids.length} POI) =====`);
  for (const hero of unique) {
    console.log(`  sync ${hero}`);
    await ensureCmsQaHeroOnStaging(hero, API);
  }
}

function runNode(rel, args = '') {
  execSync(`node ${rel} ${args}`, {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      API,
      API_BASE: API,
      TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE: process.env.TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE || '1',
    },
  });
}

async function runExitCheckWithRetry(maxAttempts = 12) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`\n===== Exit Check attempt ${attempt}/${maxAttempts} =====`);
    try {
      runNode('scripts/dev/run-cms-poi-city-xian-content-qa-exit-check.cjs');
      return;
    } catch {
      if (attempt === maxAttempts) throw new Error("Xi'an exit check failed after retries");
      await new Promise((r) => setTimeout(r, 8000));
    }
  }
}

async function main() {
  console.log('TT_CMS_XIAN_CONTENT_QA_WAVE: START');

  console.log('\n===== Catalog Build · 西安 =====');
  runNode('scripts/dev/run-cms-phase1-poi-pilot-catalog-build.cjs', '--city-zh 西安');

  await syncAllHeroes();

  for (const matrixId of XIAN.matrix_ids) {
    if (getAsset(matrixId).state === 'LOCKED') {
      const poi = XIAN.pois[XIAN.matrix_ids.indexOf(matrixId)];
      console.log(`SKIP LOCKED · ${poi} · ${matrixId}`);
      continue;
    }
    const poi = XIAN.pois[XIAN.matrix_ids.indexOf(matrixId)];
    console.log(`\n===== Remediation · ${poi} · ${matrixId} =====`);
    runNode(
      'scripts/dev/run-cms-content-qa-poi-remediation.cjs',
      `--city-zh 西安 --matrix-id ${matrixId} --poi "${poi}"`,
    );
  }

  console.log('\n===== Execution closed loop · 西安 8/8 =====');
  runNode('scripts/dev/run-cms-phase1-poi-wave1-closed-loop.cjs', '--city-zh 西安 --skip-refresh');

  console.log('\n===== Execution CLOSED · 西安 =====');
  runNode('scripts/dev/run-cms-poi-city-xian-closure-evidence.cjs');

  runNode('scripts/dev/run-cms-poi-city-xian-content-qa-closure-evidence.cjs');
  await runExitCheckWithRetry();

  console.log('\nTT_CMS_XIAN_CONTENT_QA_WAVE: DONE');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
