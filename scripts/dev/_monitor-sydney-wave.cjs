#!/usr/bin/env node
/**
 * Monitor Sydney wave · 5min stall → kill + resume · 8/8 → closure + exit
 */
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const { getCityPilot } = require('./lib/cms-poi-city-pilot.cjs');
const { getAsset } = require('./lib/cms-content-qa-asset-lock.cjs');

const ROOT = path.join(__dirname, '../..');
const TERM_LOG = process.env.TERM_LOG || path.join(ROOT, 'evidence/GO_cms_operation/_sydney-wave-monitor.log');
const STALL_MS = Number(process.env.STALL_MS || 5 * 60 * 1000);
const POLL_MS = 15000;
const API = (process.env.API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const WEB = (process.env.WEB || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');

const SYDNEY = getCityPilot('悉尼');
const EXEC_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-SYDNEY-CLOSURE-LATEST.json');
const QA_CLOSURE = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-SYDNEY-CONTENT-QA-CLOSURE-LATEST.json');
const EXIT_CHECK = path.join(ROOT, 'evidence/GO_cms_operation/CMS-POI-CITY-SYDNEY-CONTENT-QA-EXIT-CHECK-LATEST.json');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(TERM_LOG, line + '\n');
}

function lockedCount() {
  return SYDNEY.matrix_ids.filter((id) => getAsset(id).state === 'LOCKED').length;
}

function countLockLines(text) {
  return (text.match(/TT_CMS_CONTENT_QA_POI: LOCKED/g) || []).length;
}

function wavePid() {
  if (process.env.WAVE_PID) return Number(process.env.WAVE_PID);
  try {
    const out = execSync('ps -ef 2>/dev/null || ps aux 2>/dev/null', { encoding: 'utf8' });
    for (const line of out.split('\n')) {
      if (line.includes('run-cms-sydney-content-qa-wave.cjs') && !line.includes('_monitor-sydney-wave')) {
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
  const child = spawn(
    process.execPath,
    ['scripts/dev/run-cms-sydney-content-qa-wave.cjs'],
    {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        API,
        WEB,
        TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE: process.env.TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE || '1',
      },
    },
  );
  child.stdout.on('data', (d) => process.stdout.write(d));
  child.stderr.on('data', (d) => process.stderr.write(d));
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
  runNode('scripts/dev/run-cms-phase1-poi-wave1-closed-loop.cjs --city-zh 悉尼 --skip-refresh');
  runNode('scripts/dev/run-cms-poi-city-sydney-closure-evidence.cjs');
  runNode('scripts/dev/run-cms-poi-city-sydney-content-qa-closure-evidence.cjs');
  for (let i = 1; i <= 12; i++) {
    try {
      runNode('scripts/dev/run-cms-poi-city-sydney-content-qa-exit-check.cjs');
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
    exec: execDoc?.TT_CMS_POI_CITY_SYDNEY === 'CLOSED',
    qa: qaDoc?.TT_CMS_POI_CITY_SYDNEY_CONTENT_QA === 'CLOSED',
    exit: exitDoc?.TT_CMS_POI_CITY_SYDNEY_CONTENT_QA_EXIT === 'PASS' && exitDoc?.all_pass === true,
    locked: lockedCount(),
  };
}

async function main() {
  fs.mkdirSync(path.dirname(TERM_LOG), { recursive: true });
  log(`MONITOR START stall=${STALL_MS}ms`);

  let lastLockCount = lockedCount();
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
    const locked = lockedCount();
    const done = verifyDone();

    if (locked > lastLockCount) {
      lastLockCount = locked;
      lastProgressAt = Date.now();
      log(`PROGRESS locked=${locked}/8`);
    }

    if (locked >= 8 && !closureStarted) {
      const pid = child?.pid || wavePid();
      if (pid) {
        await new Promise((r) => setTimeout(r, 5000));
        const stillRunning = wavePid();
        if (stillRunning) {
          const stallSinceLock = Date.now() - lastProgressAt;
          if (stallSinceLock > 60000) {
            killWave(stillRunning);
            await new Promise((r) => setTimeout(r, 3000));
          }
        }
      }
      closureStarted = true;
      try {
        runClosurePipeline();
      } catch (e) {
        log(`Closure pipeline error: ${e.message}`);
        throw e;
      }
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
      }
      if (child?.exitCode != null && locked < 8) {
        log(`Wave exited code=${child.exitCode} locked=${locked}/8 — resume`);
        child = startWave();
        lastProgressAt = Date.now();
      }
    }

    await new Promise((r) => setTimeout(r, POLL_MS));
  }

  const final = verifyDone();
  log(`FINAL exec=${final.exec} qa=${final.qa} exit=${final.exit} locked=${final.locked}/8`);
  if (!final.exec || !final.qa || !final.exit) {
    process.exit(1);
  }
  log('SYDNEY TRIPLE PASS — awaiting Melbourne confirmation (not auto-starting)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
