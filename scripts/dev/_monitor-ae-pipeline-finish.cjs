#!/usr/bin/env node
/**
 * AE pipeline finish · Sharjah TRIPLE PASS → AE Country CLOSED
 * NO CN · NO ③ Production GO
 */
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const { getCityPilot } = require('./lib/cms-poi-city-pilot.cjs');
const { getAsset } = require('./lib/cms-content-qa-asset-lock.cjs');

const ROOT = path.join(__dirname, '../..');
const LOG = path.join(ROOT, 'evidence/GO_cms_operation/_ae-pipeline-finish.log');
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const WEB = (process.env.WEB || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');
const STALL_MS = Number(process.env.STALL_MS || 5 * 60 * 1000);
const POLL_MS = Number(process.env.POLL_MS || 60000);

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.mkdirSync(path.dirname(LOG), { recursive: true });
  fs.appendFileSync(LOG, line + '\n');
}

function sharjahStatus() {
  const p = getCityPilot('沙迦');
  const locked = p.matrix_ids.filter((id) => getAsset(id).state === 'LOCKED').length;
  const total = p.matrix_ids.length;
  const execP = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-SHARJAH-CLOSURE-LATEST.json');
  const qaP = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-SHARJAH-CONTENT-QA-CLOSURE-LATEST.json');
  const exitP = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-SHARJAH-CONTENT-QA-EXIT-CHECK-LATEST.json');
  let triple = false;
  if (fs.existsSync(execP) && fs.existsSync(qaP) && fs.existsSync(exitP)) {
    const exec = JSON.parse(fs.readFileSync(execP, 'utf8'));
    const qa = JSON.parse(fs.readFileSync(qaP, 'utf8'));
    const exit = JSON.parse(fs.readFileSync(exitP, 'utf8'));
    triple =
      exec.TT_CMS_POI_CITY_SHARJAH === 'CLOSED' &&
      qa.TT_CMS_POI_CITY_SHARJAH_CONTENT_QA === 'CLOSED' &&
      exit.TT_CMS_POI_CITY_SHARJAH_CONTENT_QA_EXIT === 'PASS' &&
      exit.all_pass === true;
  }
  return { locked, total, triple };
}

function cityMonitorRunning() {
  try {
    const out = execSync('ps -ef 2>/dev/null || ps aux 2>/dev/null', { encoding: 'utf8' });
    return out.split('\n').some((l) => l.includes('_monitor-ae-city-wave.cjs') && !l.includes('grep'));
  } catch {
    return false;
  }
}

function startSharjahMonitor() {
  log('RESUME Sharjah monitor (CITY_ZH=沙迦 · SKIP LOCKED)');
  const child = spawnSync(process.execPath, ['scripts/dev/_monitor-ae-city-wave.cjs'], {
    cwd: ROOT,
    env: {
      ...process.env,
      CITY_ZH: '沙迦',
      API,
      WEB,
      TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE: '1',
    },
    stdio: 'inherit',
    timeout: 2 * 60 * 60 * 1000,
  });
  if (child.status !== 0) throw new Error(`Sharjah monitor exit ${child.status}`);
}

function runNode(rel) {
  execSync(`node ${rel}`, {
    cwd: ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      API,
      API_BASE: API,
      WEB,
      TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE: '1',
    },
  });
}

function countryClosed() {
  const p = path.join(ROOT, 'evidence/GO_cms_operation/CMS-AE-COUNTRY-CLOSURE-LATEST.json');
  if (!fs.existsSync(p)) return false;
  return JSON.parse(fs.readFileSync(p, 'utf8')).TT_CMS_AE_COUNTRY === 'CLOSED';
}

async function main() {
  log('AE PIPELINE FINISH MONITOR START · Sharjah → Country CLOSED · NO CN · NO Production GO');
  let lastLocked = -1;
  let lastProgressAt = Date.now();

  while (true) {
    const s = sharjahStatus();
    if (s.locked !== lastLocked) {
      lastLocked = s.locked;
      lastProgressAt = Date.now();
      log(`SHARJAH locked=${s.locked}/${s.total}`);
    }
    if (s.triple) {
      log('SHARJAH TRIPLE PASS confirmed');
      break;
    }

    const mon = cityMonitorRunning();
    if (!mon && s.locked < s.total) {
      log(`City monitor absent at ${s.locked}/${s.total} — restart (5min stall handled by city monitor when UP)`);
      startSharjahMonitor();
      lastProgressAt = Date.now();
      continue;
    }

    log(`WAIT locked=${s.locked}/${s.total} city_monitor=${mon ? 'UP' : 'DOWN'}`);
    await new Promise((r) => setTimeout(r, POLL_MS));
  }

  if (!countryClosed()) {
    log('AE Country Runtime Audit START');
    runNode('scripts/dev/run-cms-ae-country-runtime-audit.cjs');
    log('AE Country CLOSED evidence START');
    runNode('scripts/dev/run-cms-ae-country-closure-evidence.cjs');
  }

  const country = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'evidence/GO_cms_operation/CMS-AE-COUNTRY-CLOSURE-LATEST.json'), 'utf8'),
  );
  log(`FINAL TT_CMS_AE_COUNTRY=${country.TT_CMS_AE_COUNTRY}`);
  log('AE PIPELINE COMPLETE · PAUSED · NO CN · NO Production GO');
}

main().catch((e) => {
  log(`FATAL ${e.message}`);
  process.exit(1);
});
