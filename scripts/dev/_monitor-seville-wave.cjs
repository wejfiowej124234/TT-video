#!/usr/bin/env node
/**
 * Monitor Sevilla wave · 5min stall → kill + resume · 8/8 → closure + exit
 * 不得改动 JP/KR/TH/SG/FR/US/AU LOCK · 巴塞罗那+马德里 LOCK · 不启动 ES Country Runtime
 */
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { getCityPilot } = require('./lib/cms-poi-city-pilot.cjs');
const { getAsset } = require('./lib/cms-content-qa-asset-lock.cjs');

const ROOT = path.join(__dirname, '../..');
const TERM_LOG = process.env.TERM_LOG || path.join(ROOT, 'evidence/GO_cms_operation/_seville-wave-monitor.log');
const STALL_MS = Number(process.env.STALL_MS || 5 * 60 * 1000);
const POLL_MS = 15000;
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const WEB = (process.env.WEB || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');

const SEVILLE = getCityPilot('塞维利亚');
const BARCELONA = getCityPilot('巴塞罗那');
const MADRID = getCityPilot('马德里');
const EXEC_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-SEVILLE-CLOSURE-LATEST.json');
const QA_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-SEVILLE-CONTENT-QA-CLOSURE-LATEST.json');
const EXIT_CHECK = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-SEVILLE-CONTENT-QA-EXIT-CHECK-LATEST.json');
const WAVE_SCRIPT = 'scripts/dev/run-cms-seville-content-qa-wave.cjs';

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(TERM_LOG, line + '\n');
}

function sevilleLockedCount() {
  return SEVILLE.matrix_ids.filter((id) => getAsset(id).state === 'LOCKED').length;
}

function verifyPriorLocks() {
  const reg = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'evidence/GO_cms_operation/CMS-CONTENT-QA-ASSET-LOCK-REGISTRY-LATEST.json'), 'utf8'),
  );
  const assets = Object.values(reg.assets || {});
  const counts = { JP: 0, KR: 0, TH: 0, SG: 0, FR: 0, US: 0, AU: 0 };
  for (const a of assets) {
    const m = String(a.matrix_id || '').match(/^PH-([A-Z]{2})-/);
    if (!m || a.state !== 'LOCKED') continue;
    if (counts[m[1]] != null) counts[m[1]]++;
  }
  const bcnLocked = BARCELONA.matrix_ids.filter((id) => getAsset(id).state === 'LOCKED').length;
  const madLocked = MADRID.matrix_ids.filter((id) => getAsset(id).state === 'LOCKED').length;
  const issues = [];
  for (const [iso, n] of Object.entries({ JP: 41, KR: 31, TH: 28, SG: 10, FR: 24, US: 33, AU: 24 })) {
    if (counts[iso] !== n) issues.push(`${iso} ${counts[iso]}/${n}`);
  }
  if (bcnLocked !== 8) issues.push(`Barcelona ${bcnLocked}/8`);
  if (madLocked !== 8) issues.push(`Madrid ${madLocked}/8`);
  return { pass: issues.length === 0, issues, counts, bcnLocked, madLocked };
}

function wavePid() {
  if (process.env.WAVE_PID) return Number(process.env.WAVE_PID);
  try {
    const out = execSync('ps -ef 2>/dev/null || ps aux 2>/dev/null', { encoding: 'utf8' });
    for (const line of out.split('\n')) {
      if (line.includes('run-cms-seville-content-qa-wave.cjs') && !line.includes('_monitor-seville-wave')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[1];
        if (pid && /^\d+$/.test(pid)) return Number(pid);
      }
    }
  } catch {}
  return null;
}

function killWave(pid) {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
    } else {
      process.kill(pid, 'SIGTERM');
      try {
        execSync(`pkill -P ${pid} 2>/dev/null || true`);
      } catch {}
    }
    log(`KILLED wave pid=${pid}`);
  } catch (e) {
    log(`kill failed pid=${pid}: ${e.message}`);
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

function runNode(rel) {
  execSync(`node ${rel}`, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, API, API_BASE: API, WEB, TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE: '1' },
  });
}

function runClosurePipeline() {
  log('8/8 LOCK — running closure pipeline');
  runNode('scripts/dev/run-cms-phase1-poi-wave1-closed-loop.cjs --city-zh 塞维利亚 --skip-refresh');
  runNode('scripts/dev/run-cms-poi-city-seville-closure-evidence.cjs');
  runNode('scripts/dev/run-cms-poi-city-seville-content-qa-closure-evidence.cjs');
  for (let i = 1; i <= 12; i++) {
    try {
      runNode('scripts/dev/run-cms-poi-city-seville-content-qa-exit-check.cjs');
      break;
    } catch {
      if (i === 12) throw new Error('Exit check failed after retries');
      log(`Exit check retry ${i}/12 in 8s`);
      execSync('sleep 8');
    }
  }
}

function verifyDone() {
  const execDoc = fs.existsSync(EXEC_CLOSURE) ? JSON.parse(fs.readFileSync(EXEC_CLOSURE, 'utf8')) : null;
  const qaDoc = fs.existsSync(QA_CLOSURE) ? JSON.parse(fs.readFileSync(QA_CLOSURE, 'utf8')) : null;
  const exitDoc = fs.existsSync(EXIT_CHECK) ? JSON.parse(fs.readFileSync(EXIT_CHECK, 'utf8')) : null;
  return {
    exec: execDoc?.TT_CMS_POI_CITY_SEVILLE === 'CLOSED',
    qa: qaDoc?.TT_CMS_POI_CITY_SEVILLE_CONTENT_QA === 'CLOSED',
    exit: exitDoc?.TT_CMS_POI_CITY_SEVILLE_CONTENT_QA_EXIT === 'PASS' && exitDoc?.all_pass === true,
    locked: sevilleLockedCount(),
  };
}

async function main() {
  fs.mkdirSync(path.dirname(TERM_LOG), { recursive: true });
  const guard0 = verifyPriorLocks();
  if (!guard0.pass) throw new Error(`Prior lock guard failed at start: ${guard0.issues.join('; ')}`);
  log(`MONITOR START stall=${STALL_MS}ms · prior locks OK (BCN ${guard0.bcnLocked}/8 MAD ${guard0.madLocked}/8)`);

  let lastLockCount = sevilleLockedCount();
  let lastProgressAt = Date.now();
  let child = null;
  let closureStarted = false;

  const existing = wavePid();
  if (existing) {
    log(`Watching existing wave pid=${existing} locked=${lastLockCount}/8`);
  } else if (lastLockCount < 8) {
    child = startWave();
    log(`Started new wave pid=${child.pid}`);
  }

  while (true) {
    const locked = sevilleLockedCount();

    if (locked > lastLockCount) {
      lastLockCount = locked;
      lastProgressAt = Date.now();
      log(`PROGRESS locked=${locked}/8`);
      const guard = verifyPriorLocks();
      if (!guard.pass) throw new Error(`Prior lock drift: ${guard.issues.join('; ')}`);
    }

    if (locked >= 8 && !closureStarted) {
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

    if (locked < 8) {
      const stalled = Date.now() - lastProgressAt >= STALL_MS;
      const pid = child?.pid || wavePid();
      if (stalled && pid) {
        log(`STALL ${STALL_MS}ms at locked=${locked}/8 — kill + resume`);
        killWave(pid);
        child = null;
        await new Promise((r) => setTimeout(r, 3000));
        lastProgressAt = Date.now();
        child = startWave();
      } else if (!pid && locked < 8) {
        log('Wave not running — start resume');
        child = startWave();
        lastProgressAt = Date.now();
      } else if (child && child.exitCode != null && locked < 8) {
        log(`Wave exited code=${child.exitCode} locked=${locked}/8 — resume`);
        child = startWave();
        lastProgressAt = Date.now();
      }
    }

    await new Promise((r) => setTimeout(r, POLL_MS));
  }

  const final = verifyDone();
  const guardEnd = verifyPriorLocks();
  log(`FINAL exec=${final.exec} qa=${final.qa} exit=${final.exit} locked=${final.locked}/8`);
  log(`PRIOR_LOCK_GUARD: ${guardEnd.pass ? 'PASS' : guardEnd.issues.join('; ')}`);
  if (!final.exec || !final.qa || !final.exit || !guardEnd.pass) process.exit(1);
  log('SEVILLE TRIPLE PASS — ready for ES Country Runtime Audit');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
