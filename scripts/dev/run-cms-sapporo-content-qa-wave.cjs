#!/usr/bin/env node
/**
 * Sapporo Content QA Wave · Osaka Golden Template 同源
 *
 *   TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE=1 \
 *   API=https://tt-api-staging.fly.dev \
 *     node scripts/dev/run-cms-sapporo-content-qa-wave.cjs
 *
 * 须 fly auth login（remote cp hero → staging）
 */
const { execSync } = require('child_process');
const path = require('path');
const { getCityPilot } = require('./lib/cms-poi-city-pilot.cjs');
const { getAsset } = require('./lib/cms-content-qa-asset-lock.cjs');
const { ensureCmsQaHeroOnStaging } = require('./lib/cms-destination-ambient-hero.cjs');
const { assertStagingBaselineMutationAuthorized } = require('./lib/staging-rc-baseline-authorize.cjs');

assertStagingBaselineMutationAuthorized('cms_sapporo_content_qa_wave');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const SAPPORO = getCityPilot('札幌');

const SAPPORO_HEROES = {
  'PH-JP-033-ATR': 'ocs-sapporo-odori-park-official-guide-cover.jpg',
  'PH-JP-034-ATR': 'ocs-sapporo-clock-tower-community-media.jpg',
  'PH-JP-035-ATR': 'ocs-sapporo-hitachi-hill-community-cover.jpg',
  'PH-JP-036-ATR': 'ocs-sapporo-shiroi-koibito-provider-cover.jpg',
  'PH-JP-037-ATR': 'ocs-sapporo-moiwa-acquisition-cover.jpg',
  'PH-JP-038-FOOD': 'ocs-sapporo-miso-ramen-guide-avatar.jpg',
  'PH-JP-039-FOOD': 'ocs-sapporo-jingisukan-official-guide-cover.jpg',
  'PH-JP-040-FOOD': 'ocs-sapporo-soup-curry-community-cover.jpg',
  'PH-JP-041-FOOD': 'ocs-sapporo-seafood-provider-cover.jpg',
};

async function syncAllHeroes() {
  console.log('\n===== Pre-sync staging heroes (9) =====');
  for (const matrixId of SAPPORO.matrix_ids) {
    const hero = SAPPORO_HEROES[matrixId];
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

async function main() {
  console.log('TT_CMS_SAPPORO_CONTENT_QA_WAVE: START');
  await syncAllHeroes();

  for (const poi of SAPPORO.pois) {
    const matrixId = SAPPORO.matrix_ids[SAPPORO.pois.indexOf(poi)];
    if (getAsset(matrixId).state === 'LOCKED') {
      console.log(`SKIP LOCKED · ${poi}`);
      continue;
    }
    console.log(`\n===== Remediation · ${poi} =====`);
    runNode('scripts/dev/run-cms-content-qa-poi-remediation.cjs', `--city-zh 札幌 --poi "${poi}"`);
  }

  runNode('scripts/dev/run-cms-poi-city-sapporo-content-qa-closure-evidence.cjs');
  runNode('scripts/dev/run-cms-poi-city-sapporo-content-qa-exit-check.cjs');

  console.log('\nTT_CMS_SAPPORO_CONTENT_QA_WAVE: DONE');
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
