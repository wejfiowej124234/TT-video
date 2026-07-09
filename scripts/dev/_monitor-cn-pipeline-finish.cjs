#!/usr/bin/env node
/** CN pipeline · 九城 Triple Pass → TT_CMS_CN_COUNTRY: CLOSED · NO Production GO */
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const { getCityPilot } = require('./lib/cms-poi-city-pilot.cjs');
const { getAsset } = require('./lib/cms-content-qa-asset-lock.cjs');

const ROOT = path.join(__dirname, '../..');
const LOG = path.join(ROOT, 'evidence/GO_cms_operation/_cn-pipeline-finish.log');
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const WEB = (process.env.WEB || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');
const POLL_MS = 60000;
const CN_CITY_ORDER = ["北京","上海","广州","成都","杭州","西安","厦门","青岛","大理"];

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.mkdirSync(path.dirname(LOG), { recursive: true });
  fs.appendFileSync(LOG, line + '\n');
}

function cityTriple(cityZh) {
  const p = getCityPilot(cityZh);
  const token = p.closure_key.replace('TT_CMS_POI_CITY_', '');
  const execP = path.join(ROOT, `evidence/GO_cms_operation/CMS-POI-CITY-${token}-CLOSURE-LATEST.json`);
  const qaP = path.join(ROOT, `evidence/GO_cms_operation/CMS-POI-CITY-${token}-CONTENT-QA-CLOSURE-LATEST.json`);
  const exitP = path.join(ROOT, `evidence/GO_cms_operation/CMS-POI-CITY-${token}-CONTENT-QA-EXIT-CHECK-LATEST.json`);
  if (!fs.existsSync(execP) || !fs.existsSync(qaP) || !fs.existsSync(exitP)) return false;
  const exec = JSON.parse(fs.readFileSync(execP, 'utf8'));
  const qa = JSON.parse(fs.readFileSync(qaP, 'utf8'));
  const exit = JSON.parse(fs.readFileSync(exitP, 'utf8'));
  return exec[p.closure_key] === 'CLOSED' && qa[`${p.closure_key}_CONTENT_QA`] === 'CLOSED' && exit[`${p.closure_key}_CONTENT_QA_EXIT`] === 'PASS' && exit.all_pass === true;
}

function runCityMonitor(cityZh) {
  log(`CITY START ${cityZh}`);
  const child = spawnSync(process.execPath, ['scripts/dev/_monitor-cn-city-wave.cjs'], {
    cwd: ROOT,
    env: { ...process.env, CITY_ZH: cityZh, API, WEB, TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE: '1' },
    stdio: 'inherit',
    timeout: 6 * 60 * 60 * 1000,
  });
  if (child.status !== 0) throw new Error(`${cityZh} monitor failed exit ${child.status}`);
  if (!cityTriple(cityZh)) throw new Error(`${cityZh} TRIPLE PASS not confirmed`);
  writeCityReport(cityZh);
  log(`${cityZh} TRIPLE PASS`);
}

function writeCityReport(cityZh) {
  const p = getCityPilot(cityZh);
  const token = p.closure_key.replace('TT_CMS_POI_CITY_', '');
  const dir = path.join(ROOT, 'evidence/GO_cms_operation/cn-city-triple-pass');
  fs.mkdirSync(dir, { recursive: true });
  const locked = p.matrix_ids.filter((id) => getAsset(id).state === 'LOCKED').length;
  fs.writeFileSync(
    path.join(dir, `${token}-TRIPLE-PASS.json`),
    JSON.stringify(
      {
        schema: 'traveltrust.cms_cn_city_triple_pass_report.v1',
        city_zh: cityZh,
        recorded_at_utc: new Date().toISOString(),
        poi_locked: `${locked}/${p.matrix_ids.length}`,
        [`${p.closure_key}`]: 'CLOSED',
        [`${p.closure_key}_CONTENT_QA`]: 'CLOSED',
        [`${p.closure_key}_CONTENT_QA_EXIT`]: 'PASS',
      },
      null,
      2,
    ) + '\n',
  );
}

function runNode(rel) {
  execSync(`node ${rel}`, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, API, API_BASE: API, WEB, TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE: '1' },
  });
}

async function main() {
  log('CN PIPELINE START · 九城 → Country CLOSED · NO Production GO');
  for (const cityZh of CN_CITY_ORDER) {
    if (cityTriple(cityZh)) {
      log(`SKIP ${cityZh} already TRIPLE PASS`);
      continue;
    }
    runCityMonitor(cityZh);
  }
  const countryP = path.join(ROOT, 'evidence/GO_cms_operation/CMS-CN-COUNTRY-CLOSURE-LATEST.json');
  if (!fs.existsSync(countryP) || JSON.parse(fs.readFileSync(countryP, 'utf8')).TT_CMS_CN_COUNTRY !== 'CLOSED') {
    log('CN Country Runtime Audit START');
    runNode('scripts/dev/run-cms-cn-country-runtime-audit.cjs');
    log('CN Country CLOSED evidence START');
    runNode('scripts/dev/run-cms-cn-country-closure-evidence.cjs');
  }
  const country = JSON.parse(fs.readFileSync(countryP, 'utf8'));
  log(`FINAL TT_CMS_CN_COUNTRY=${country.TT_CMS_CN_COUNTRY}`);
  log('Generating ten-country final closure report');
  runNode('scripts/dev/run-cms-ten-country-final-closure-report.cjs');
  log('CMS PIPELINE STOPPED · TEN-COUNTRY REPORT COMPLETE · PAUSED · NO Production GO');
}

main().catch((e) => { log(`FATAL ${e.message}`); process.exit(1); });
