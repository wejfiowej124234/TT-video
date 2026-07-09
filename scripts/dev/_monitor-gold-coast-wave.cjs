#!/usr/bin/env node
/**
 * Monitor Gold Coast wave · 5min stall (LOCK phase only) → kill + resume
 * 8/8 后不 kill wave/Exit Check · 自动 closure + exit · 不启动 AU Country Runtime
 */
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { getCityPilot } = require('./lib/cms-poi-city-pilot.cjs');
const { getAsset } = require('./lib/cms-content-qa-asset-lock.cjs');

const ROOT = path.join(__dirname, '../..');
const TERM_LOG = process.env.TERM_LOG || path.join(ROOT, 'evidence/GO_cms_operation/_gold-coast-wave-monitor.log');
const STALL_MS = Number(process.env.STALL_MS || 5 * 60 * 1000);
const POLL_MS = 15000;
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const WEB = (process.env.WEB || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');

const GOLD_COAST = getCityPilot('黄金海岸');
const SYDNEY = getCityPilot('悉尼');
const MELBOURNE = getCityPilot('墨尔本');
const EXEC_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-GOLD-COAST-CLOSURE-LATEST.json');
const QA_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-GOLD-COAST-CONTENT-QA-CLOSURE-LATEST.json');
const EXIT_CHECK = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-GOLD-COAST-CONTENT-QA-EXIT-CHECK-LATEST.json');
const WAVE_SCRIPT = 'scripts/dev/run-cms-gold-coast-content-qa-wave.cjs';

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(TERM_LOG, line + '\n');
}

function goldCoastLockedCount() {
  return GOLD_COAST.matrix_ids.filter((id) => getAsset(id).state === 'LOCKED').length;
}

function verifyPriorLocks() {
  const reg = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'evidence/GO_cms_operation/CMS-CONTENT-QA-ASSET-LOCK-REGISTRY-LATEST.json'), 'utf8'),
  );
  const assets = Object.values(reg.assets || {});
  const counts = { JP: 0, KR: 0, TH: 0, SG: 0, FR: 0, US: 0 };
  for (const a of assets) {
    const m = String(a.matrix_id || '').match(/^PH-([A-Z]{2})-/);
    if (!m || a.state !== 'LOCKED') continue;
    if (counts[m[1]] != null) counts[m[1]]++;
  }
  const sydneyLocked = SYDNEY.matrix_ids.filter((id) => getAsset(id).state === 'LOCKED').length;
  const melbourneLocked = MELBOURNE.matrix_ids.filter((id) => getAsset(id).state === 'LOCKED').length;
  const issues = [];
  for (const [iso, n] of Object.entries({ JP: 41, KR: 31, TH: 28, SG: 10, FR: 24, US: 33 })) {
    if (counts[iso] !== n) issues.push(`${iso} ${counts[iso]}/${n}`);
  }
  if (sydneyLocked !== 8) issues.push(`Sydney ${sydneyLocked}/8`);
  if (melbourneLocked !== 8) issues.push(`Melbourne ${melbourneLocked}/8`);
  return { pass: issues.length === 0, issues, sydneyLocked, melbourneLocked };
}

function wavePid() {
  if (process.env.WAVE_PID) return Number(process.env.WAVE_PID);
  try {
    const out = execSync('ps -ef 2>/dev/null || ps aux 2>/dev/null', { encoding: 'utf8' });
    for (const line of out.split('\n')) {
      if (line.includes('run-cms-gold-coast-content-qa-wave.cjs') && !line.includes('_monitor-gold-coast-wave')) {
        const pid = line.trim().split(/\s+/)[1];
        if (pid && /^\d+$/.test(pid)) return Number(pid);
      }
    }
  } catch {}
  return null;
}

function closureOrExitRunning() {
  try {
    const out = execSync('ps -ef 2>/dev/null || ps aux 2>/dev/null', { encoding: 'utf8' });
    return /gold-coast-content-qa-exit-check|gold-coast-closure-evidence|gold-coast-content-qa-closure|phase1-poi-wave1-closed-loop/.test(
      out,
    );
  } catch {
    return false;
  }
}

function killWave(pid) {
  if (!pid || closureOrExitRunning()) {
    log('SKIP kill — closure/exit check in progress');
    return;
  }
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
    } else {
      process.kill(pid, 'SIGTERM');
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
  child.stderr.on('data', (d) => process.stdout.write(d));
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
  log('8/8 LOCK — running closure pipeline (no wave kill)');
  runNode('scripts/dev/run-cms-phase1-poi-wave1-closed-loop.cjs --city-zh 黄金海岸 --skip-refresh');
  runNode('scripts/dev/run-cms-poi-city-gold-coast-closure-evidence.cjs');
  runNode('scripts/dev/run-cms-poi-city-gold-coast-content-qa-closure-evidence.cjs');
  for (let i = 1; i <= 12; i++) {
    try {
      runNode('scripts/dev/run-cms-poi-city-gold-coast-content-qa-exit-check.cjs');
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
    exec: execDoc?.TT_CMS_POI_CITY_GOLD_COAST === 'CLOSED',
    qa: qaDoc?.TT_CMS_POI_CITY_GOLD_COAST_CONTENT_QA === 'CLOSED',
    exit: exitDoc?.TT_CMS_POI_CITY_GOLD_COAST_CONTENT_QA_EXIT === 'PASS' && exitDoc?.all_pass === true,
    locked: goldCoastLockedCount(),
  };
}

async function main() {
  fs.mkdirSync(path.dirname(TERM_LOG), { recursive: true });
  const guard0 = verifyPriorLocks();
  if (!guard0.pass) throw new Error(`Prior lock guard failed: ${guard0.issues.join('; ')}`);
  log(`MONITOR START stall=${STALL_MS}ms (LOCK phase only) · prior locks OK`);

  let lastLockCount = goldCoastLockedCount();
  let lastProgressAt = Date.now();
  let child = null;
  let closureStarted = false;

  if (lastLockCount < 8) {
    child = startWave();
    log(`Started wave pid=${child.pid} locked=${lastLockCount}/8`);
  }

  while (true) {
    const locked = goldCoastLockedCount();
    const done = verifyDone();
    if (done.exec && done.qa && done.exit) break;

    if (locked > lastLockCount) {
      lastLockCount = locked;
      lastProgressAt = Date.now();
      log(`PROGRESS locked=${locked}/8`);
      const guard = verifyPriorLocks();
      if (!guard.pass) throw new Error(`Prior lock drift: ${guard.issues.join('; ')}`);
    }

    if (locked >= 8 && !closureStarted) {
      closureStarted = true;
      const waveRunning = wavePid();
      if (waveRunning) {
        log(`8/8 LOCK — wave pid=${waveRunning} still running; waiting for natural closure (no kill)`);
        for (let i = 0; i < 40; i++) {
          await new Promise((r) => setTimeout(r, 15000));
          const d = verifyDone();
          if (d.exec && d.qa && d.exit) break;
          if (!wavePid() && !(d.exec && d.qa && d.exit)) break;
        }
      }
      const d = verifyDone();
      if (!(d.exec && d.qa && d.exit)) runClosurePipeline();
      break;
    }

    if (locked < 8) {
      const stalled = Date.now() - lastProgressAt >= STALL_MS;
      const pid = child?.pid || wavePid();
      if (stalled && pid && !closureOrExitRunning()) {
        log(`STALL ${STALL_MS}ms at locked=${locked}/8 — kill + resume`);
        killWave(pid);
        child = null;
        await new Promise((r) => setTimeout(r, 3000));
        lastProgressAt = Date.now();
        child = startWave();
      } else if (!pid && locked < 8) {
        log('Wave not running — resume');
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
  log('GOLD_COAST TRIPLE PASS — paused · awaiting AU Country Runtime confirmation (not auto-starting)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
