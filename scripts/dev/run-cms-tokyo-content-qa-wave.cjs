#!/usr/bin/env node
/**
 * Tokyo Content QA Wave · Osaka Golden Template 同源
 *
 *   TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE=1 \
 *   API=https://tt-api-staging.fly.dev \
 *     node scripts/dev/run-cms-tokyo-content-qa-wave.cjs
 */
const { execSync } = require('child_process');
const path = require('path');
const { getCityPilot } = require('./lib/cms-poi-city-pilot.cjs');
const { getAsset } = require('./lib/cms-content-qa-asset-lock.cjs');
const { ensureCmsQaHeroOnStaging } = require('./lib/cms-destination-ambient-hero.cjs');
const { assertStagingBaselineMutationAuthorized } = require('./lib/staging-rc-baseline-authorize.cjs');

assertStagingBaselineMutationAuthorized('cms_tokyo_content_qa_wave');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const TOKYO = getCityPilot('东京');

const TOKYO_HEROES = {
  'PH-JP-009-ATR': 'ocs-tokyo-photo-official-guide-cover.jpg',
  'PH-JP-010-ATR': 'ocs-tokyo-photo-community-media.jpg',
  'PH-JP-011-ATR': 'ocs-tokyo-photo-community-cover.jpg',
  'PH-JP-012-ATR': 'ocs-tokyo-photo-provider-cover.jpg',
  'PH-JP-013-ATR': 'ocs-tokyo-photo-acquisition-cover.jpg',
  'PH-JP-014-FOOD': 'ocs-tokyo-sushi-community-cover.jpg',
  'PH-JP-015-FOOD': 'ocs-tokyo-ramen-guide-avatar.jpg',
  'PH-JP-016-FOOD': 'ocs-tokyo-tempura-provider-cover.jpg',
  'PH-JP-017-FOOD': 'ocs-tokyo-photo-guide-avatar.jpg',
};

async function syncAllHeroes() {
  console.log('\n===== Pre-sync staging heroes (9) =====');
  for (const matrixId of TOKYO.matrix_ids) {
    const hero = TOKYO_HEROES[matrixId];
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

async function runExitCheckWithRetry(maxAttempts = 8) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`\n===== Exit Check attempt ${attempt}/${maxAttempts} =====`);
    try {
      runNode('scripts/dev/run-cms-poi-city-tokyo-content-qa-exit-check.cjs');
      return;
    } catch {
      if (attempt === maxAttempts) throw new Error('Tokyo exit check failed after retries');
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

async function main() {
  console.log('TT_CMS_TOKYO_CONTENT_QA_WAVE: START');
  await syncAllHeroes();

  for (const poi of TOKYO.pois) {
    const matrixId = TOKYO.matrix_ids[TOKYO.pois.indexOf(poi)];
    if (getAsset(matrixId).state === 'LOCKED') {
      console.log(`SKIP LOCKED · ${poi}`);
      continue;
    }
    console.log(`\n===== Remediation · ${poi} =====`);
    runNode('scripts/dev/run-cms-content-qa-poi-remediation.cjs', `--city-zh 东京 --poi "${poi}"`);
  }

  runNode('scripts/dev/run-cms-poi-city-tokyo-content-qa-closure-evidence.cjs');
  await runExitCheckWithRetry();

  console.log('\nTT_CMS_TOKYO_CONTENT_QA_WAVE: DONE');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
