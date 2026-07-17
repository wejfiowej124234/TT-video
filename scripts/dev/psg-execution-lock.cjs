#!/usr/bin/env node
/**
 * PSG single-instance execution lock (run_id · environment lease · heartbeat).
 *
 *   node scripts/dev/psg-execution-lock.cjs status
 *   node scripts/dev/psg-execution-lock.cjs preflight --pipeline foundation_gate --env staging
 *   node scripts/dev/psg-execution-lock.cjs acquire --pipeline foundation_gate --env staging
 *   node scripts/dev/psg-execution-lock.cjs heartbeat --run-id <id>
 *   node scripts/dev/psg-execution-lock.cjs release --run-id <id> --status PASS|FAIL|ABORTED
 *   node scripts/dev/psg-execution-lock.cjs adopt --pipeline foundation_gate --env staging --pid <n> [--child-pid <n>]
 *
 * Lifecycle: Preflight → Lock → Run → Observe → Diagnose → Fix → Rerun → Evidence → Registry → Certify
 * SSOT policy: registry/psg-execution-control.v1.yaml
 * ACTIVE lease: registry/psg-execution-lock-ACTIVE.v1.yaml
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const POLICY = path.join(ROOT, 'registry/psg-execution-control.v1.yaml');
const ACTIVE = path.join(ROOT, 'registry/psg-execution-lock-ACTIVE.v1.yaml');
const EVID_DIR = path.join(ROOT, 'evidence/GO_psg_foundation/execution_lock');

const HEARTBEAT_TTL_SEC = Number(process.env.PSG_LOCK_HEARTBEAT_TTL_SEC || 120);
const STALE_AFTER_SEC = Number(process.env.PSG_LOCK_STALE_AFTER_SEC || 300);

function nowIso() {
  return new Date().toISOString();
}

function gitSha() {
  try {
    return execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function emptyActive() {
  return {
    schema: 'traveltrust.psg_execution_lock_active.v1',
    machine_key: 'TT_PSG_EXECUTION_LOCK',
    policy: 'registry/psg-execution-control.v1.yaml',
    active_run: null,
    updated_utc: nowIso(),
  };
}

function readActive() {
  if (!fs.existsSync(ACTIVE)) return emptyActive();
  try {
    const raw = fs.readFileSync(ACTIVE, 'utf8');
    // Minimal YAML subset we write ourselves — also accept JSON.
    if (raw.trim().startsWith('{')) return JSON.parse(raw);
    return parseSimpleYaml(raw);
  } catch {
    return emptyActive();
  }
}

function parseSimpleYaml(raw) {
  // Only supports the shape we emit (no nested arrays of objects).
  const lines = raw.split(/\r?\n/);
  const out = emptyActive();
  let inRun = false;
  let pids = null;
  for (const line of lines) {
    if (/^active_run:\s*$/.test(line)) {
      inRun = true;
      out.active_run = {};
      continue;
    }
    if (/^active_run:\s*null\s*$/.test(line)) {
      out.active_run = null;
      inRun = false;
      continue;
    }
    if (!inRun) {
      const m = line.match(/^([a-z_]+):\s*(.*)$/);
      if (m && m[1] !== 'active_run') {
        let v = m[2].replace(/^"|"$/g, '');
        if (v === 'null') v = null;
        out[m[1]] = v;
      }
      continue;
    }
    if (/^\S/.test(line) && !/^\s/.test(line)) {
      inRun = false;
      continue;
    }
    const pm = line.match(/^\s+pids:\s*$/);
    if (pm) {
      pids = [];
      out.active_run.pids = pids;
      continue;
    }
    const list = line.match(/^\s+-\s+(\d+)\s*$/);
    if (list && pids) {
      pids.push(Number(list[1]));
      continue;
    }
    const km = line.match(/^\s+([a-z_]+):\s*(.*)$/);
    if (km && out.active_run) {
      let v = km[2].replace(/^"|"$/g, '');
      if (v === 'null') v = null;
      else if (/^\d+$/.test(v)) v = Number(v);
      else if (v === 'true') v = true;
      else if (v === 'false') v = false;
      out.active_run[km[1]] = v;
    }
  }
  return out;
}

function toYaml(obj) {
  const lines = [];
  lines.push('# PSG execution lock ACTIVE · machine-managed · do not hand-edit while RUNNING');
  lines.push(`schema: ${obj.schema}`);
  lines.push(`machine_key: ${obj.machine_key}`);
  lines.push(`policy: ${obj.policy}`);
  lines.push(`updated_utc: "${obj.updated_utc}"`);
  if (!obj.active_run) {
    lines.push('active_run: null');
  } else {
    const r = obj.active_run;
    lines.push('active_run:');
    for (const k of [
      'run_id',
      'pipeline',
      'environment',
      'status',
      'pid',
      'git_sha',
      'acquired_utc',
      'heartbeat_utc',
      'lease_expires_utc',
      'note',
    ]) {
      if (r[k] === undefined || r[k] === null) continue;
      const v = typeof r[k] === 'string' ? `"${r[k]}"` : String(r[k]);
      lines.push(`  ${k}: ${v}`);
    }
    if (Array.isArray(r.pids) && r.pids.length) {
      lines.push('  pids:');
      for (const p of r.pids) lines.push(`    - ${p}`);
    }
  }
  lines.push('machine_line: TT_PSG_EXECUTION_LOCK: ' + (obj.active_run ? obj.active_run.status : 'IDLE'));
  return `${lines.join('\n')}\n`;
}

function writeActive(obj) {
  obj.updated_utc = nowIso();
  fs.mkdirSync(path.dirname(ACTIVE), { recursive: true });
  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(ACTIVE, toYaml(obj));
  fs.writeFileSync(
    path.join(EVID_DIR, 'ACTIVE.json'),
    JSON.stringify(obj, null, 2) + '\n'
  );
}

function pidAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    try {
      execSync(`tasklist /FI "PID eq ${pid}"`, { encoding: 'utf8' });
      const out = execSync(`tasklist /FI "PID eq ${pid}"`, { encoding: 'utf8' });
      return out.includes(String(pid));
    } catch {
      return false;
    }
  }
}

function isStale(run) {
  if (!run || run.status !== 'RUNNING') return true;
  const hb = Date.parse(run.heartbeat_utc || run.acquired_utc || 0);
  if (!Number.isFinite(hb)) return true;
  const ageSec = (Date.now() - hb) / 1000;
  if (ageSec > STALE_AFTER_SEC) return true;
  if (run.pid && !pidAlive(run.pid)) return true;
  return false;
}

function makeRunId(pipeline, env) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
  return `psg-${pipeline}-${env}-${stamp}`;
}

function listResidualPids() {
  try {
    const out = execSync(
      'powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq \'node.exe\' -and $_.CommandLine -match \'run-psg-foundation-gate\\\\.cjs|run-official-cold-start-dataset\\\\.cjs\' } | Select-Object -ExpandProperty ProcessId"',
      { cwd: ROOT, encoding: 'utf8', timeout: 15000 },
    );
    return out
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => /^\d+$/.test(s))
      .map(Number)
      .filter((pid) => pid !== process.pid);
  } catch {
    return [];
  }
}

function cmdStatus() {
  const a = readActive();
  const run = a.active_run;
  if (!run) {
    console.log('TT_PSG_EXECUTION_LOCK: IDLE');
    console.log('active_run: null');
    console.log('action: preflight_then_acquire_then_start');
    return 0;
  }
  const stale = isStale(run);
  console.log(`TT_PSG_EXECUTION_LOCK: ${stale ? 'STALE' : run.status}`);
  console.log(`run_id: ${run.run_id}`);
  console.log(`pipeline: ${run.pipeline}`);
  console.log(`environment: ${run.environment}`);
  console.log(`pid: ${run.pid || 'n/a'}`);
  console.log(`heartbeat_utc: ${run.heartbeat_utc}`);
  if (stale) {
    console.log('action: release_stale_then_preflight OR adopt if process still intended');
    return 2;
  }
  console.log('action: resume_existing_run · forbidden: start_new_run');
  return 0;
}

/**
 * ① Execution Preflight — Run / Environment / residual / lock occupancy.
 * Exit 0 = clear to acquire. Exit 3 = active_run (resume). Exit 2 = blocked residual/env.
 */
function cmdPreflight(args) {
  const pipeline = args.pipeline || 'foundation_gate';
  const env = args.env || args.environment || 'staging';
  const fails = [];
  const warns = [];

  console.log('TT_PSG_PREFLIGHT: START');
  console.log(`pipeline: ${pipeline}`);
  console.log(`environment: ${env}`);

  // Environment Check
  if (!['local', 'staging', 'production'].includes(env)) {
    fails.push('environment_invalid');
  }
  if (env === 'production' && process.env.PSG_ALLOW_PRODUCTION_LEASE !== '1') {
    fails.push('production_requires_owner');
  }
  if (env === 'staging') {
    console.log('environment_check: staging · requires_lease');
  } else if (env === 'local') {
    console.log('environment_check: local · allowed');
  }

  // Run Check + Lock Check
  const a = readActive();
  if (a.active_run && !isStale(a.active_run)) {
    console.log(`run_check: ACTIVE run_id=${a.active_run.run_id} pipeline=${a.active_run.pipeline}`);
    console.log('lock_check: HELD');
    console.log('TT_PSG_PREFLIGHT: BLOCKED active_run');
    console.log('action: resume_existing_run · observe · diagnose · forbidden: start_new_run');
    return 3;
  }
  if (a.active_run && isStale(a.active_run)) {
    warns.push(`stale_lease:${a.active_run.run_id}`);
    console.log(`lock_check: STALE run_id=${a.active_run.run_id} · release before acquire`);
  } else {
    console.log('run_check: no_active_run');
    console.log('lock_check: FREE');
  }

  // Residual process / Staging write occupancy
  const residuals = listResidualPids();
  if (residuals.length) {
    console.log(`residual_process_check: FOUND pids=${residuals.join(',')}`);
    console.log('staging_write_occupancy: BUSY');
    fails.push('residual_psg_write_processes');
  } else {
    console.log('residual_process_check: CLEAR');
    console.log('staging_write_occupancy: CLEAR');
  }

  // Evidence Check reminder (non-blocking)
  console.log('evidence_check: rematerialize new stamp/run_id on rerun · never overwrite prior FAIL');

  if (warns.length) console.log(`warns: ${warns.join(',')}`);
  if (fails.length) {
    console.log(`TT_PSG_PREFLIGHT: FAIL ${fails.join(',')}`);
    console.log('next: Diagnose → Fix residual/concurrency → then acquire');
    return 2;
  }
  console.log('TT_PSG_PREFLIGHT: PASS');
  console.log('action: acquire_lock_then_start');
  return 0;
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      out[k] = v;
    } else out._.push(a);
  }
  return out;
}

function cmdAcquire(args) {
  const pipeline = args.pipeline || 'foundation_gate';
  const env = args.env || args.environment || 'staging';
  if (!['staging', 'production'].includes(env)) {
    console.error('TT_PSG_EXECUTION_LOCK: FAIL invalid_environment');
    process.exit(2);
  }
  if (env === 'production' && process.env.PSG_ALLOW_PRODUCTION_LEASE !== '1') {
    console.error('TT_PSG_EXECUTION_LOCK: FAIL production_lease_forbidden');
    process.exit(2);
  }
  const a = readActive();
  if (a.active_run && !isStale(a.active_run)) {
    console.error('TT_PSG_EXECUTION_LOCK: BLOCKED active_run_exists');
    console.error(`run_id: ${a.active_run.run_id}`);
    console.error('action: resume_existing_run · forbidden: start_new_run');
    process.exit(3);
  }
  const run_id = args['run-id'] || makeRunId(pipeline, env);
  const acquired = nowIso();
  const leaseExpires = new Date(Date.now() + HEARTBEAT_TTL_SEC * 1000).toISOString();
  a.active_run = {
    run_id,
    pipeline,
    environment: env,
    status: 'RUNNING',
    pid: process.pid,
    pids: [process.pid],
    git_sha: gitSha(),
    acquired_utc: acquired,
    heartbeat_utc: acquired,
    lease_expires_utc: leaseExpires,
    note: args.note || 'acquired',
  };
  writeActive(a);
  if (!fs.existsSync(POLICY)) {
    console.warn('WARN: missing policy file', POLICY);
  }
  console.log(`TT_PSG_EXECUTION_LOCK: ACQUIRED run_id=${run_id}`);
  console.log(run_id);
  return 0;
}

function cmdHeartbeat(args) {
  const a = readActive();
  if (!a.active_run) {
    console.error('TT_PSG_EXECUTION_LOCK: FAIL no_active_run');
    process.exit(2);
  }
  if (args['run-id'] && args['run-id'] !== a.active_run.run_id) {
    console.error('TT_PSG_EXECUTION_LOCK: FAIL run_id_mismatch');
    process.exit(2);
  }
  a.active_run.heartbeat_utc = nowIso();
  a.active_run.lease_expires_utc = new Date(Date.now() + HEARTBEAT_TTL_SEC * 1000).toISOString();
  if (args.pid) {
    a.active_run.pid = Number(args.pid);
    const set = new Set(a.active_run.pids || []);
    set.add(Number(args.pid));
    a.active_run.pids = [...set];
  }
  writeActive(a);
  console.log(`TT_PSG_EXECUTION_LOCK: HEARTBEAT run_id=${a.active_run.run_id}`);
  return 0;
}

function cmdRelease(args) {
  const a = readActive();
  if (!a.active_run) {
    console.log('TT_PSG_EXECUTION_LOCK: IDLE already');
    return 0;
  }
  if (args['run-id'] && args['run-id'] !== a.active_run.run_id) {
    console.error('TT_PSG_EXECUTION_LOCK: FAIL run_id_mismatch');
    process.exit(2);
  }
  const finalStatus = args.status || 'ABORTED';
  const closed = {
    ...a.active_run,
    status: finalStatus,
    released_utc: nowIso(),
  };
  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(EVID_DIR, `${closed.run_id}-RELEASED.json`),
    JSON.stringify(closed, null, 2) + '\n'
  );
  a.active_run = null;
  writeActive(a);
  console.log(`TT_PSG_EXECUTION_LOCK: RELEASED status=${finalStatus}`);
  return 0;
}

function cmdAdopt(args) {
  const pipeline = args.pipeline || 'foundation_gate';
  const env = args.env || 'staging';
  const pid = Number(args.pid);
  if (!pid) {
    console.error('TT_PSG_EXECUTION_LOCK: FAIL adopt_requires_pid');
    process.exit(2);
  }
  const a = readActive();
  if (a.active_run && !isStale(a.active_run) && a.active_run.pid !== pid) {
    console.error('TT_PSG_EXECUTION_LOCK: BLOCKED other_active_run');
    process.exit(3);
  }
  const run_id = args['run-id'] || makeRunId(pipeline, env);
  const acquired = nowIso();
  const pids = [pid];
  if (args['child-pid']) pids.push(Number(args['child-pid']));
  a.active_run = {
    run_id,
    pipeline,
    environment: env,
    status: 'RUNNING',
    pid,
    pids,
    git_sha: gitSha(),
    acquired_utc: acquired,
    heartbeat_utc: acquired,
    lease_expires_utc: new Date(Date.now() + HEARTBEAT_TTL_SEC * 1000).toISOString(),
    note: args.note || 'adopted_existing_run_no_restart',
  };
  writeActive(a);
  console.log(`TT_PSG_EXECUTION_LOCK: ADOPTED run_id=${run_id} pid=${pid}`);
  console.log(run_id);
  return 0;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0] || 'status';
  let code = 0;
  if (cmd === 'status') code = cmdStatus();
  else if (cmd === 'preflight') code = cmdPreflight(args);
  else if (cmd === 'acquire') code = cmdAcquire(args);
  else if (cmd === 'heartbeat') code = cmdHeartbeat(args);
  else if (cmd === 'release') code = cmdRelease(args);
  else if (cmd === 'adopt') code = cmdAdopt(args);
  else {
    console.error('usage: status|preflight|acquire|heartbeat|release|adopt');
    process.exit(2);
  }
  process.exit(code);
}

main();
