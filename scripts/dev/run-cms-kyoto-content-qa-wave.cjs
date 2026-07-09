#!/usr/bin/env node
/**
 * Kyoto Content QA Wave · Osaka Golden Template 同源
 *
 *   TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE=1 \
 *   API=https://tt-api-staging.fly.dev \
 *     node scripts/dev/run-cms-kyoto-content-qa-wave.cjs
 */
const { execSync } = require('child_process');
const path = require('path');
const { getCityPilot } = require('./lib/cms-poi-city-pilot.cjs');
const { getAsset } = require('./lib/cms-content-qa-asset-lock.cjs');
const { ensureCmsQaHeroOnStaging } = require('./lib/cms-destination-ambient-hero.cjs');
const { assertStagingBaselineMutationAuthorized } = require('./lib/staging-rc-baseline-authorize.cjs');

assertStagingBaselineMutationAuthorized('cms_kyoto_content_qa_wave');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const KYOTO = getCityPilot('京都');

const KYOTO_HEROES = {
  'PH-JP-026-ATR': 'ocs-kyoto-culture-official-guide-cover.jpg',
  'PH-JP-027-ATR': 'ocs-kyoto-culture-community-media.jpg',
  'PH-JP-028-ATR': 'ocs-kyoto-culture-community-cover.jpg',
  'PH-JP-029-ATR': 'ocs-kyoto-culture-provider-cover.jpg',
  'PH-JP-030-FOOD': 'ocs-kyoto-culture-acquisition-cover.jpg',
  'PH-JP-031-FOOD': 'ocs-kyoto-culture-guide-avatar.jpg',
  'PH-JP-032-FOOD': 'ocs-kyoto-yudofu-community-cover.jpg',
};

async function syncAllHeroes() {
  console.log('\n===== Pre-sync staging heroes (7) =====');
  for (const matrixId of KYOTO.matrix_ids) {
    const hero = KYOTO_HEROES[matrixId];
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
      runNode('scripts/dev/run-cms-poi-city-kyoto-content-qa-exit-check.cjs');
      return;
    } catch {
      if (attempt === maxAttempts) throw new Error('Kyoto exit check failed after retries');
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

async function main() {
  console.log('TT_CMS_KYOTO_CONTENT_QA_WAVE: START');
  await syncAllHeroes();

  for (const poi of KYOTO.pois) {
    const matrixId = KYOTO.matrix_ids[KYOTO.pois.indexOf(poi)];
    if (getAsset(matrixId).state === 'LOCKED') {
      console.log(`SKIP LOCKED · ${poi}`);
      continue;
    }
    console.log(`\n===== Remediation · ${poi} =====`);
    runNode('scripts/dev/run-cms-content-qa-poi-remediation.cjs', `--city-zh 京都 --poi "${poi}"`);
  }

  runNode('scripts/dev/run-cms-poi-city-kyoto-content-qa-closure-evidence.cjs');
  await runExitCheckWithRetry();

  console.log('\nTT_CMS_KYOTO_CONTENT_QA_WAVE: DONE');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
