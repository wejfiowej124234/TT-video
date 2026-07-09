#!/usr/bin/env node
/**
 * Chiang Mai · Execution + Content QA Wave · JP + KR 双模板同源
 *
 *   TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE=1 \
 *   API=https://tt-api-staging.fly.dev \
 *     node scripts/dev/run-cms-chiang-mai-content-qa-wave.cjs
 *
 * 顺序: Catalog Build → 9×(Replace 1× → Publish → Verify → LOCK) → Execution CLOSED → Content QA CLOSED → Exit Check
 */
const { execSync } = require('child_process');
const path = require('path');
const { getCityPilot } = require('./lib/cms-poi-city-pilot.cjs');
const { getAsset } = require('./lib/cms-content-qa-asset-lock.cjs');
const { ensureCmsQaHeroOnStaging } = require('./lib/cms-destination-ambient-hero.cjs');
const { assertStagingBaselineMutationAuthorized } = require('./lib/staging-rc-baseline-authorize.cjs');

assertStagingBaselineMutationAuthorized('cms_chiang_mai_content_qa_wave');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const CHIANG_MAI = getCityPilot('清迈');

const CHIANG_MAI_HEROES = CHIANG_MAI.hero_files;

async function syncAllHeroes() {
  const unique = [...new Set(Object.values(CHIANG_MAI_HEROES))];
  console.log(`\n===== Pre-sync staging heroes (${unique.length} unique / ${CHIANG_MAI.matrix_ids.length} POI) =====`);
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
      runNode('scripts/dev/run-cms-poi-city-chiang-mai-content-qa-exit-check.cjs');
      return;
    } catch {
      if (attempt === maxAttempts) throw new Error('Chiang Mai exit check failed after retries');
      await new Promise((r) => setTimeout(r, 8000));
    }
  }
}

async function main() {
  console.log('TT_CMS_CHIANG_MAI_CONTENT_QA_WAVE: START');

  console.log('\n===== Catalog Build · 清迈 =====');
  runNode('scripts/dev/run-cms-phase1-poi-pilot-catalog-build.cjs', '--city-zh 清迈');

  await syncAllHeroes();

  for (const matrixId of CHIANG_MAI.matrix_ids) {
    if (getAsset(matrixId).state === 'LOCKED') {
      const poi = CHIANG_MAI.pois[CHIANG_MAI.matrix_ids.indexOf(matrixId)];
      console.log(`SKIP LOCKED · ${poi} · ${matrixId}`);
      continue;
    }
    const poi = CHIANG_MAI.pois[CHIANG_MAI.matrix_ids.indexOf(matrixId)];
    console.log(`\n===== Remediation · ${poi} · ${matrixId} =====`);
    runNode(
      'scripts/dev/run-cms-content-qa-poi-remediation.cjs',
      `--city-zh 清迈 --matrix-id ${matrixId} --poi "${poi}"`,
    );
  }

  console.log('\n===== Execution closed loop · 清迈 9/9 =====');
  runNode('scripts/dev/run-cms-phase1-poi-wave1-closed-loop.cjs', '--city-zh 清迈 --skip-refresh');

  console.log('\n===== Execution CLOSED · 清迈 =====');
  runNode('scripts/dev/run-cms-poi-city-chiang-mai-closure-evidence.cjs');

  runNode('scripts/dev/run-cms-poi-city-chiang-mai-content-qa-closure-evidence.cjs');
  await runExitCheckWithRetry();

  console.log('\nTT_CMS_CHIANG_MAI_CONTENT_QA_WAVE: DONE');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
