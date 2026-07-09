#!/usr/bin/env node
/**
 * Fukuoka · Execution + Content QA Wave · Osaka Golden Template 同源
 *
 *   TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE=1 \
 *   API=https://tt-api-staging.fly.dev \
 *     node scripts/dev/run-cms-fukuoka-content-qa-wave.cjs
 *
 * 顺序: Catalog Build → 8×(Replace 1× → Publish → Verify → LOCK) → Execution CLOSED → Content QA CLOSED → Exit Check
 */
const { execSync } = require('child_process');
const path = require('path');
const { getCityPilot } = require('./lib/cms-poi-city-pilot.cjs');
const { getAsset } = require('./lib/cms-content-qa-asset-lock.cjs');
const { ensureCmsQaHeroOnStaging } = require('./lib/cms-destination-ambient-hero.cjs');
const { assertStagingBaselineMutationAuthorized } = require('./lib/staging-rc-baseline-authorize.cjs');

assertStagingBaselineMutationAuthorized('cms_fukuoka_content_qa_wave');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const FUKUOKA = getCityPilot('福冈');

const FUKUOKA_HEROES = {
  'PH-JP-018-ATR': 'ocs-fukuoka-hakata-official-guide-cover.jpg',
  'PH-JP-019-ATR': 'ocs-fukuoka-dazaifu-community-media.jpg',
  'PH-JP-020-ATR': 'ocs-fukuoka-nokonoshima-community-cover.jpg',
  'PH-JP-021-ATR': 'ocs-fukuoka-yatai-atr-provider-cover.jpg',
  'PH-JP-022-FOOD': 'ocs-fukuoka-tonkotsu-ramen-guide-avatar.jpg',
  'PH-JP-023-FOOD': 'ocs-fukuoka-mentaiko-acquisition-cover.jpg',
  'PH-JP-024-FOOD': 'ocs-fukuoka-mizutaki-official-guide-cover.jpg',
  'PH-JP-025-FOOD': 'ocs-fukuoka-yatai-food-community-media.jpg',
};

async function syncAllHeroes() {
  console.log('\n===== Pre-sync staging heroes (8) =====');
  for (const matrixId of FUKUOKA.matrix_ids) {
    const hero = FUKUOKA_HEROES[matrixId];
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
      runNode('scripts/dev/run-cms-poi-city-fukuoka-content-qa-exit-check.cjs');
      return;
    } catch {
      if (attempt === maxAttempts) throw new Error('Fukuoka exit check failed after retries');
      await new Promise((r) => setTimeout(r, 8000));
    }
  }
}

async function main() {
  console.log('TT_CMS_FUKUOKA_CONTENT_QA_WAVE: START');

  console.log('\n===== Catalog Build · 福冈 =====');
  runNode('scripts/dev/run-cms-phase1-poi-pilot-catalog-build.cjs', '--city-zh 福冈');

  await syncAllHeroes();

  for (const matrixId of FUKUOKA.matrix_ids) {
    if (getAsset(matrixId).state === 'LOCKED') {
      const poi = FUKUOKA.pois[FUKUOKA.matrix_ids.indexOf(matrixId)];
      console.log(`SKIP LOCKED · ${poi} · ${matrixId}`);
      continue;
    }
    const poi = FUKUOKA.pois[FUKUOKA.matrix_ids.indexOf(matrixId)];
    console.log(`\n===== Remediation · ${poi} · ${matrixId} =====`);
    runNode(
      'scripts/dev/run-cms-content-qa-poi-remediation.cjs',
      `--city-zh 福冈 --matrix-id ${matrixId} --poi "${poi}"`,
    );
  }

  console.log('\n===== Execution closed loop · 福冈 8/8 =====');
  runNode('scripts/dev/run-cms-phase1-poi-wave1-closed-loop.cjs', '--city-zh 福冈 --skip-refresh');

  console.log('\n===== Execution CLOSED · 福冈 =====');
  runNode('scripts/dev/run-cms-poi-city-fukuoka-closure-evidence.cjs');

  runNode('scripts/dev/run-cms-poi-city-fukuoka-content-qa-closure-evidence.cjs');
  await runExitCheckWithRetry();

  console.log('\nTT_CMS_FUKUOKA_CONTENT_QA_WAVE: DONE');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
