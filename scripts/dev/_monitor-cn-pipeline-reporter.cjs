#!/usr/bin/env node
/**
 * CN pipeline reporter · 每城 Triple-Pass 汇报 · 十国最终收口 · 不干扰主 pipeline
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getCityPilot } = require('./lib/cms-poi-city-pilot.cjs');
const { getAsset } = require('./lib/cms-content-qa-asset-lock.cjs');

const ROOT = path.join(__dirname, '../..');
const LOG = path.join(ROOT, 'evidence/GO_cms_operation/_cn-pipeline-city-reports.log');
const CITY_REPORT_DIR = path.join(ROOT, 'evidence/GO_cms_operation/cn-city-triple-pass');
const POLL_MS = 30000;
const STALL_MS = 5 * 60 * 1000;
const CN_CITY_ORDER = ['北京', '上海', '广州', '成都', '杭州', '西安', '厦门', '青岛', '大理'];

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
  if (!fs.existsSync(execP) || !fs.existsSync(qaP) || !fs.existsSync(exitP)) return null;
  const exec = JSON.parse(fs.readFileSync(execP, 'utf8'));
  const qa = JSON.parse(fs.readFileSync(qaP, 'utf8'));
  const exit = JSON.parse(fs.readFileSync(exitP, 'utf8'));
  const pass =
    exec[p.closure_key] === 'CLOSED' &&
    qa[`${p.closure_key}_CONTENT_QA`] === 'CLOSED' &&
    exit[`${p.closure_key}_CONTENT_QA_EXIT`] === 'PASS' &&
    exit.all_pass === true;
  return pass ? { exec, qa, exit, pilot: p } : null;
}

function cityLocked(cityZh) {
  const p = getCityPilot(cityZh);
  return p.matrix_ids.filter((id) => getAsset(id).state === 'LOCKED').length;
}

function pipelineRunning() {
  try {
    const out = execSync('ps -ef 2>/dev/null || ps aux 2>/dev/null', { encoding: 'utf8' });
    return out.includes('_monitor-cn-pipeline-finish.cjs') || out.includes('_monitor-cn-city-wave.cjs');
  } catch {
    return false;
  }
}

function writeCityReport(cityZh, data) {
  fs.mkdirSync(CITY_REPORT_DIR, { recursive: true });
  const token = data.pilot.closure_key.replace('TT_CMS_POI_CITY_', '');
  const out = path.join(CITY_REPORT_DIR, `${token}-TRIPLE-PASS.json`);
  const locked = cityLocked(cityZh);
  const report = {
    schema: 'traveltrust.cms_cn_city_triple_pass_report.v1',
    city_zh: cityZh,
    recorded_at_utc: new Date().toISOString(),
    poi_locked: `${locked}/${data.pilot.matrix_ids.length}`,
    TT_CMS_POI_CITY: data.exec[data.pilot.closure_key],
    TT_CMS_POI_CITY_CONTENT_QA: data.qa[`${data.pilot.closure_key}_CONTENT_QA`],
    TT_CMS_POI_CITY_CONTENT_QA_EXIT: data.exit[`${data.pilot.closure_key}_CONTENT_QA_EXIT`],
    all_pass: data.exit.all_pass,
    evidence: {
      execution: `evidence/GO_cms_operation/CMS-POI-CITY-${token}-CLOSURE-LATEST.json`,
      content_qa: `evidence/GO_cms_operation/CMS-POI-CITY-${token}-CONTENT-QA-CLOSURE-LATEST.json`,
      exit_check: `evidence/GO_cms_operation/CMS-POI-CITY-${token}-CONTENT-QA-EXIT-CHECK-LATEST.json`,
    },
  };
  fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
  log(`CITY REPORT · ${cityZh} · TRIPLE PASS · ${report.poi_locked}`);
  log(`  ${data.pilot.closure_key}: CLOSED`);
  log(`  ${data.pilot.closure_key}_CONTENT_QA: CLOSED`);
  log(`  ${data.pilot.closure_key}_CONTENT_QA_EXIT: PASS`);
}

async function main() {
  log('CN PIPELINE REPORTER START');
  const reported = new Set();
  let lastLocked = {};
  let lastProgressAt = Date.now();
  let activeCity = CN_CITY_ORDER.find((c) => !cityTriple(c)) || null;

  while (true) {
    activeCity = CN_CITY_ORDER.find((c) => !reported.has(c) && !cityTriple(c)) || CN_CITY_ORDER.find((c) => !reported.has(c)) || null;

    for (const cityZh of CN_CITY_ORDER) {
      if (reported.has(cityZh)) continue;
      const triple = cityTriple(cityZh);
      if (triple) {
        writeCityReport(cityZh, triple);
        reported.add(cityZh);
      }
    }

    if (activeCity) {
      const locked = cityLocked(activeCity);
      const prev = lastLocked[activeCity] ?? -1;
      if (locked > prev) {
        lastLocked[activeCity] = locked;
        lastProgressAt = Date.now();
        const p = getCityPilot(activeCity);
        log(`PROGRESS · ${activeCity} · locked=${locked}/${p.matrix_ids.length}`);
      } else if (!pipelineRunning() && !cityTriple(activeCity)) {
        log(`STALL/ABSENT · ${activeCity} at ${locked}/${getCityPilot(activeCity).matrix_ids.length} — resume pipeline`);
        execSync(`node scripts/dev/_monitor-cn-pipeline-finish.cjs`, {
          cwd: ROOT,
          stdio: 'inherit',
          env: {
            ...process.env,
            API: process.env.API || 'https://tt-api-staging.fly.dev',
            WEB: process.env.WEB || 'https://tt-web-staging.fly.dev',
            TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE: '1',
          },
        });
        break;
      } else if (Date.now() - lastProgressAt >= STALL_MS && !cityTriple(activeCity)) {
        log(`STALL 5min · ${activeCity} · locked=${locked}/${getCityPilot(activeCity).matrix_ids.length}`);
        lastProgressAt = Date.now();
      }
    }

    const countryP = path.join(ROOT, 'evidence/GO_cms_operation/CMS-CN-COUNTRY-CLOSURE-LATEST.json');
    const allCitiesDone = CN_CITY_ORDER.every((c) => reported.has(c));
    if (allCitiesDone) {
      if (!fs.existsSync(countryP) || JSON.parse(fs.readFileSync(countryP, 'utf8')).TT_CMS_CN_COUNTRY !== 'CLOSED') {
        if (!pipelineRunning()) {
          log('CN Country Runtime — triggering finish pipeline');
          execSync(`node scripts/dev/_monitor-cn-pipeline-finish.cjs`, {
            cwd: ROOT,
            stdio: 'inherit',
            env: {
              ...process.env,
              API: process.env.API || 'https://tt-api-staging.fly.dev',
              WEB: process.env.WEB || 'https://tt-web-staging.fly.dev',
              TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE: '1',
            },
          });
        }
      } else {
        log('CN COUNTRY CLOSED — generating ten-country final report');
        execSync('node scripts/dev/run-cms-ten-country-final-closure-report.cjs', { cwd: ROOT, stdio: 'inherit' });
        log('CMS PIPELINE STOPPED · TEN-COUNTRY REPORT COMPLETE · NO Production GO');
        break;
      }
    }

    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

main().catch((e) => {
  log(`FATAL ${e.message}`);
  process.exit(1);
});
