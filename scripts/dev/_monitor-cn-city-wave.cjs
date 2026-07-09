#!/usr/bin/env node
/**
 * Monitor CN city wave · CITY_ZH required · dynamic POI count · 5min stall → kill + resume
 * Prior guard: JP/KR/TH/SG/FR/US/AU/ES/AE LOCK unchanged + prior CN cities LOCK
 */
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { getCityPilot } = require('./lib/cms-poi-city-pilot.cjs');
const { getAsset } = require('./lib/cms-content-qa-asset-lock.cjs');

const CITY_ZH = process.env.CITY_ZH;
if (!CITY_ZH) throw new Error('CITY_ZH required');

const ROOT = path.join(__dirname, '../..');
const pilot = getCityPilot(CITY_ZH);
const POI_TOTAL = pilot.matrix_ids.length;
const slug = pilot.slug;
const token = pilot.closure_key.replace('TT_CMS_POI_CITY_', '');
const TERM_LOG =
  process.env.TERM_LOG || path.join(ROOT, `evidence/GO_cms_operation/_${slug}-wave-monitor.log`);
const STALL_MS = Number(process.env.STALL_MS || 5 * 60 * 1000);
const POLL_MS = 15000;
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const WEB = (process.env.WEB || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');

const EXEC_CLOSURE = path.join(ROOT, `evidence/GO_cms_operation/CMS-POI-CITY-${token}-CLOSURE-LATEST.json`);
const QA_CLOSURE = path.join(
  ROOT,
  `evidence/GO_cms_operation/CMS-POI-CITY-${token}-CONTENT-QA-CLOSURE-LATEST.json`,
);
const EXIT_CHECK = path.join(
  ROOT,
  `evidence/GO_cms_operation/CMS-POI-CITY-${token}-CONTENT-QA-EXIT-CHECK-LATEST.json`,
);
const WAVE_SCRIPT = `scripts/dev/run-cms-${slug}-content-qa-wave.cjs`;
const PRIOR_CN = ['北京', '上海', '广州', '成都', '杭州', '西安', '厦门', '青岛', '大理'].slice(0, ['北京', '上海', '广州', '成都', '杭州', '西安', '厦门', '青岛', '大理'].indexOf(CITY_ZH));

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(TERM_LOG, line + '\n');
}

function cityLockedCount() {
  return pilot.matrix_ids.filter((id) => getAsset(id).state === 'LOCKED').length;
}

function verifyPriorLocks() {
  const reg = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'evidence/GO_cms_operation/CMS-CONTENT-QA-ASSET-LOCK-REGISTRY-LATEST.json'), 'utf8'),
  );
  const assets = Object.values(reg.assets || {});
  const counts = { JP: 0, KR: 0, TH: 0, SG: 0, FR: 0, US: 0, AU: 0, ES: 0, AE: 0 };
  for (const a of assets) {
    const m = String(a.matrix_id || '').match(/^PH-([A-Z]{2})-/);
    if (!m || a.state !== 'LOCKED') continue;
    if (counts[m[1]] != null) counts[m[1]]++;
  }
  const issues = [];
  for (const [iso, n] of Object.entries({ JP: 41, KR: 31, TH: 28, SG: 10, FR: 24, US: 33, AU: 24, ES: 24, AE: 24 })) {
    if (counts[iso] !== n) issues.push(`${iso} ${counts[iso]}/${n}`);
  }
  for (const priorZh of PRIOR_CN) {
    const p = getCityPilot(priorZh);
    const locked = p.matrix_ids.filter((id) => getAsset(id).state === 'LOCKED').length;
    if (locked !== p.matrix_ids.length) issues.push(`${priorZh} ${locked}/${p.matrix_ids.length}`);
  }
  return { pass: issues.length === 0, issues };
}

function wavePid() {
  try {
    const out = execSync('ps -ef 2>/dev/null || ps aux 2>/dev/null', { encoding: 'utf8' });
    for (const line of out.split('\n')) {
      if (line.includes(WAVE_SCRIPT) && !line.includes('_monitor-cn-city-wave')) {
        const pid = line.trim().split(/\s+/)[1];
        if (pid && /^\d+$/.test(pid)) return Number(pid);
      }
    }
  } catch {}
  return null;
}

function killWave(pid) {
  if (!pid) return;
  try {
    if (process.platform === 'win32') execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
    else {
      process.kill(pid, 'SIGTERM');
      try {
        execSync(`pkill -P ${pid} 2>/dev/null || true`);
      } catch {}
    }
    log(`KILLED wave pid=${pid}`);
  } catch (e) {
    log(`kill failed: ${e.message}`);
  }
}

function startWave() {
  log('RESUME wave (SKIP LOCKED automatic)');
  const child = spawn(process.execPath, [WAVE_SCRIPT], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      API,
      WEB,
      TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE: process.env.TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE || '1',
    },
  });
  child.stdout.on('data', (d) => process.stdout.write(d));
  child.stderr.on('data', (d) => process.stderr.write(d));
  child.on('exit', (code) => {
    child.exitCode = code;
  });
  return child;
}

function runNode(args) {
  execSync(`node ${args}`, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, API, API_BASE: API, WEB, TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE: '1' },
  });
}

function runClosurePipeline() {
  log(`${POI_TOTAL}/${POI_TOTAL} LOCK — running closure pipeline`);
  runNode(`scripts/dev/run-cms-phase1-poi-wave1-closed-loop.cjs --city-zh ${CITY_ZH} --skip-refresh`);
  runNode(`scripts/dev/run-cms-poi-city-${slug}-closure-evidence.cjs`);
  runNode(`scripts/dev/run-cms-poi-city-${slug}-content-qa-closure-evidence.cjs`);
  for (let i = 1; i <= 12; i++) {
    try {
      runNode(`scripts/dev/run-cms-poi-city-${slug}-content-qa-exit-check.cjs`);
      break;
    } catch {
      if (i === 12) throw new Error('Exit check failed after retries');
      log(`Exit check retry ${i}/12 in 8s`);
      execSync('sleep 8');
    }
  }
}

function verifyDone() {
  const execKey = pilot.closure_key;
  const qaKey = `${execKey}_CONTENT_QA`;
  const exitKey = `${execKey}_CONTENT_QA_EXIT`;
  const execDoc = fs.existsSync(EXEC_CLOSURE) ? JSON.parse(fs.readFileSync(EXEC_CLOSURE, 'utf8')) : null;
  const qaDoc = fs.existsSync(QA_CLOSURE) ? JSON.parse(fs.readFileSync(QA_CLOSURE, 'utf8')) : null;
  const exitDoc = fs.existsSync(EXIT_CHECK) ? JSON.parse(fs.readFileSync(EXIT_CHECK, 'utf8')) : null;
  return {
    exec: execDoc?.[execKey] === 'CLOSED',
    qa: qaDoc?.[qaKey] === 'CLOSED',
    exit: exitDoc?.[exitKey] === 'PASS' && exitDoc?.all_pass === true,
    locked: cityLockedCount(),
  };
}

async function main() {
  fs.mkdirSync(path.dirname(TERM_LOG), { recursive: true });
  const guard0 = verifyPriorLocks();
  if (!guard0.pass) throw new Error(`Prior lock guard failed: ${guard0.issues.join('; ')}`);
  log(`MONITOR START city=${CITY_ZH} poi=${POI_TOTAL} stall=${STALL_MS}ms`);

  let lastLockCount = cityLockedCount();
  let lastProgressAt = Date.now();
  let child = null;
  let closureStarted = false;

  if (lastLockCount < POI_TOTAL && !wavePid()) {
    child = startWave();
    log(`Started wave pid=${child.pid} locked=${lastLockCount}/${POI_TOTAL}`);
  }

  while (true) {
    const locked = cityLockedCount();
    if (locked > lastLockCount) {
      lastLockCount = locked;
      lastProgressAt = Date.now();
      log(`PROGRESS locked=${locked}/${POI_TOTAL}`);
      const guard = verifyPriorLocks();
      if (!guard.pass) throw new Error(`Prior lock drift: ${guard.issues.join('; ')}`);
    }

    if (locked >= POI_TOTAL && !closureStarted) {
      const stillRunning = wavePid();
      if (stillRunning) {
        await new Promise((r) => setTimeout(r, 5000));
        const again = wavePid();
        if (again && Date.now() - lastProgressAt > 60000) {
          killWave(again);
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
      closureStarted = true;
      runClosurePipeline();
      break;
    }

    if (locked < POI_TOTAL) {
      const stalled = Date.now() - lastProgressAt >= STALL_MS;
      const pid = child?.pid || wavePid();
      if (stalled && pid) {
        log(`STALL at locked=${locked}/${POI_TOTAL} — kill + resume`);
        killWave(pid);
        child = null;
        await new Promise((r) => setTimeout(r, 3000));
        lastProgressAt = Date.now();
        child = startWave();
      } else if (!pid && locked < POI_TOTAL) {
        child = startWave();
        lastProgressAt = Date.now();
      } else if (child && child.exitCode != null && locked < POI_TOTAL) {
        child = startWave();
        lastProgressAt = Date.now();
      }
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }

  const final = verifyDone();
  const guardEnd = verifyPriorLocks();
  log(`FINAL exec=${final.exec} qa=${final.qa} exit=${final.exit} locked=${final.locked}/${POI_TOTAL}`);
  log(`PRIOR_LOCK_GUARD: ${guardEnd.pass ? 'PASS' : guardEnd.issues.join('; ')}`);
  if (!final.exec || !final.qa || !final.exit || !guardEnd.pass) process.exit(1);
  log(`${CITY_ZH} TRIPLE PASS`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
