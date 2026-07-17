#!/usr/bin/env node
/**
 * R1 · Foundation Gate aggregator
 *
 *   node scripts/dev/run-psg-foundation-gate.cjs
 *
 * Runs admission / B4 / data-foundation gates, writes aggregate LATEST.
 * Exit 0 only when foundation_gate.status === PASS.
 * Does NOT Freeze · does NOT start Capability Cert · ≠ Production GO.
 *
 * Single-instance: acquires PSG execution lock (registry/psg-execution-control.v1.yaml).
 * On Cursor disconnect: resume/observe existing ACTIVE lock — do not start_new_run.
 */
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync, spawn } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const OUT_REG = path.join(ROOT, 'registry/psg-foundation-gate-LATEST.v1.yaml');
const EVID_ROOT = path.join(ROOT, 'evidence/GO_psg_foundation/foundation_gate');
const STAMP = process.env.STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const EVID_DIR = path.join(EVID_ROOT, STAMP);
const LOCK_CLI = path.join(ROOT, 'scripts/dev/psg-execution-lock.cjs');
const ENV_CLASS = process.env.PSG_LOCK_ENV || 'staging';
/**
 * B4 = OCS Bootstrap ×2 under Staging serial HTTP 429 (≈12×60s per city × 10 cities × 2 passes).
 * Evidence 20260717T022352Z: default 2h spawnSync killed healthy pass-1 at dubai (exit_code=-1).
 * Default 6h — override with FOUNDATION_GATE_TIMEOUT_MS. Never use PSG_SKIP_BOOTSTRAP=1 to fake PASS.
 */
const CHECK_TIMEOUT_MS = Number(process.env.FOUNDATION_GATE_TIMEOUT_MS || 21600000);

const CHECKS = [
  {
    key: 'ssot_drift',
    machine_line: 'TT_PSG_SSOT_DRIFT',
    cmd: ['node', 'scripts/gates/check-psg-ssot-drift.cjs'],
  },
  {
    key: 'env_alignment',
    machine_line: 'TT_PSG_ENVIRONMENT_ALIGNMENT',
    cmd: ['node', 'scripts/gates/check-psg-environment-alignment.cjs'],
  },
  {
    key: 'repro',
    machine_line: 'TT_PSG_REPRODUCIBLE_BUILD',
    cmd: ['node', 'scripts/gates/check-psg-reproducible-build.cjs'],
  },
  {
    key: 'runtime_b4',
    machine_line: 'TT_PSG_RUNTIME_B4',
    cmd: ['bash', 'scripts/gates/run-psg-runtime-certification.sh'],
  },
  {
    key: 'data_foundation',
    machine_line: 'TT_PSG_DATA_FOUNDATION',
    cmd: ['node', 'scripts/gates/check-psg-public-data-isolation.cjs'],
  },
];

function gitSha() {
  try {
    return execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

/** Async spawn so lock heartbeats (setInterval) keep firing during long B4. */
function runCheck(check) {
  const logPath = path.join(EVID_DIR, `${check.key}.log`);
  const exists = fs.existsSync(path.join(ROOT, check.cmd[1]));
  if (!exists) {
    return Promise.resolve({
      status: 'FAIL',
      machine_line: check.machine_line,
      gate: check.cmd.join(' '),
      detail: 'gate_script_missing',
      log: null,
    });
  }
  return new Promise((resolve) => {
    const child = spawn(check.cmd[0], check.cmd.slice(1), {
      cwd: ROOT,
      env: process.env,
      windowsHide: true,
    });
    let out = '';
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fs.writeFileSync(logPath, out);
      resolve(result);
    };
    const timer = setTimeout(() => {
      try {
        child.kill('SIGTERM');
      } catch {
        /* ignore */
      }
      try {
        child.kill();
      } catch {
        /* ignore */
      }
      finish({
        status: 'FAIL',
        machine_line: check.machine_line,
        gate: check.cmd.join(' '),
        exit_code: -1,
        detail: `check_timeout_ms=${CHECK_TIMEOUT_MS}`,
        log: path.relative(ROOT, logPath).replace(/\\/g, '/'),
      });
    }, CHECK_TIMEOUT_MS);
    child.stdout.on('data', (d) => {
      out += d.toString();
    });
    child.stderr.on('data', (d) => {
      out += d.toString();
    });
    child.on('error', (err) => {
      out += `\nspawn_error: ${err.message}\n`;
      finish({
        status: 'FAIL',
        machine_line: check.machine_line,
        gate: check.cmd.join(' '),
        exit_code: -1,
        detail: 'spawn_error',
        log: path.relative(ROOT, logPath).replace(/\\/g, '/'),
      });
    });
    child.on('close', (code, signal) => {
      let status = 'FAIL';
      if (code === 0) status = 'PASS';
      else if (/WAITING|SKIPPED|PARTIAL/i.test(out)) {
        if (/WAITING/i.test(out)) status = 'WAITING';
        else if (/SKIPPED/i.test(out)) status = 'SKIPPED';
        else status = 'FAIL';
      }
      finish({
        status,
        machine_line: check.machine_line,
        gate: check.cmd.join(' '),
        exit_code: code === null ? -1 : code,
        detail: signal ? `signal=${signal}` : undefined,
        log: path.relative(ROOT, logPath).replace(/\\/g, '/'),
      });
    });
  });
}

function toYaml(obj) {
  const lines = [];
  lines.push('# Foundation Gate · auto-generated · DO NOT hand-edit status');
  lines.push(`schema: ${obj.schema}`);
  lines.push(`machine_key: ${obj.machine_key}`);
  lines.push(`sequence_ssot: ${obj.sequence_ssot}`);
  lines.push(`human: ${obj.human}`);
  lines.push('');
  lines.push('foundation_gate:');
  lines.push(`  status: ${obj.foundation_gate.status}`);
  lines.push(`  stamp_utc: "${obj.foundation_gate.stamp_utc}"`);
  lines.push(`  git_sha: ${obj.foundation_gate.git_sha}`);
  lines.push(
    `  aggregate_rule: "PASS only when every check is PASS; any FAIL|WAITING|SKIPPED|UNKNOWN → FAIL"`,
  );
  lines.push('  checks:');
  for (const [k, v] of Object.entries(obj.foundation_gate.checks)) {
    lines.push(`    ${k}:`);
    lines.push(`      status: ${v.status}`);
    lines.push(`      machine_line: ${v.machine_line}`);
    lines.push(`      gate: ${v.gate}`);
    if (v.exit_code !== undefined) lines.push(`      exit_code: ${v.exit_code}`);
    if (v.log) lines.push(`      log: ${v.log}`);
    if (v.detail) lines.push(`      detail: ${v.detail}`);
  }
  if (obj.foundation_gate.run_id) {
    lines.push(`  run_id: ${obj.foundation_gate.run_id}`);
  }
  lines.push(`evidence_dir: ${obj.evidence_dir}`);
  lines.push(
    'honest_boundary: "foundation_gate.status=PASS ≠ Freeze ≠ TT_PSG_PRODUCTION_CERT=PASS ≠ Production GO"',
  );
  lines.push(`machine_line: TT_PSG_FOUNDATION_GATE: ${obj.foundation_gate.status}`);
  return `${lines.join('\n')}\n`;
}

function lockCmd(args) {
  const r = spawnSync(process.execPath, [LOCK_CLI, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: process.env,
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  return r;
}

(async () => {
  fs.mkdirSync(EVID_DIR, { recursive: true });
  const sha = gitSha();

  let runId = process.env.PSG_LOCK_RUN_ID || '';
  if (process.env.PSG_LOCK_SKIP === '1') {
    console.warn('TT_PSG_FOUNDATION_GATE: WARN PSG_LOCK_SKIP=1 (Owner-only · not for normal RC)');
  } else if (runId) {
    lockCmd(['heartbeat', '--run-id', runId, '--pid', String(process.pid)]);
  } else {
    const pf = lockCmd(['preflight', '--pipeline', 'foundation_gate', '--env', ENV_CLASS]);
    if (pf.status === 3) {
      console.error('TT_PSG_FOUNDATION_GATE: FAIL preflight_active_run · resume_existing_run');
      process.exit(3);
    }
    if (pf.status !== 0) {
      console.error('TT_PSG_FOUNDATION_GATE: FAIL preflight_blocked · Diagnose→Fix before acquire');
      process.exit(1);
    }
    const acq = lockCmd([
      'acquire',
      '--pipeline',
      'foundation_gate',
      '--env',
      ENV_CLASS,
      '--note',
      `foundation_gate stamp=${STAMP}`,
    ]);
    if (acq.status !== 0) {
      console.error('TT_PSG_FOUNDATION_GATE: FAIL execution_lock_blocked · resume_existing_run');
      process.exit(acq.status === 3 ? 3 : 1);
    }
    runId =
      String(acq.stdout || '')
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.startsWith('psg-'))
        .pop() || '';
    process.env.PSG_LOCK_RUN_ID = runId;
  }

  const hb = setInterval(() => {
    if (!runId || process.env.PSG_LOCK_SKIP === '1') return;
    lockCmd(['heartbeat', '--run-id', runId, '--pid', String(process.pid)]);
  }, 60_000);
  if (hb.unref) hb.unref();

  console.log(
    `TT_PSG_FOUNDATION_GATE: RUNNING · sha=${sha} · stamp=${STAMP}` +
      (runId ? ` · run_id=${runId}` : ''),
  );

  let status = 'FAIL';
  try {
    const checks = {};
    for (const c of CHECKS) {
      if (runId && process.env.PSG_LOCK_SKIP !== '1') {
        lockCmd(['heartbeat', '--run-id', runId, '--pid', String(process.pid)]);
      }
      console.log(`foundation_gate · check ${c.key}`);
      checks[c.key] = await runCheck(c);
      console.log(`  → ${checks[c.key].status}`);
    }

    const statuses = Object.values(checks).map((c) => c.status);
    const allPass = statuses.length === CHECKS.length && statuses.every((s) => s === 'PASS');
    status = allPass ? 'PASS' : 'FAIL';

    const report = {
      schema: 'traveltrust.psg_foundation_gate.v1',
      machine_key: 'TT_PSG_FOUNDATION_GATE',
      sequence_ssot: 'registry/psg-release-candidate-sequence.v1.yaml',
      human: 'docs/runbook/TT-PSG-RELEASE-CANDIDATE-SEQUENCE.md',
      foundation_gate: {
        status,
        stamp_utc: STAMP,
        git_sha: sha,
        checks,
        run_id: runId || null,
      },
      evidence_dir: path.relative(ROOT, EVID_DIR).replace(/\\/g, '/'),
    };

    fs.writeFileSync(path.join(EVID_DIR, 'FOUNDATION-GATE-LATEST.json'), JSON.stringify(report, null, 2));
    fs.writeFileSync(
      path.join(EVID_ROOT, 'ACTIVE.json'),
      JSON.stringify(
        { stamp: STAMP, status, evidence: report.evidence_dir, run_id: runId || null },
        null,
        2,
      ),
    );
    fs.writeFileSync(OUT_REG, toYaml(report));

    console.log(`TT_PSG_FOUNDATION_GATE: ${status} · registry=${path.relative(ROOT, OUT_REG)}`);
  } finally {
    clearInterval(hb);
    if (runId && process.env.PSG_LOCK_SKIP !== '1') {
      lockCmd(['release', '--run-id', runId, '--status', status]);
    }
  }
  process.exit(status === 'PASS' ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
