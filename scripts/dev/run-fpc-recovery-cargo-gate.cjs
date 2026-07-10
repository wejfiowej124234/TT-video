#!/usr/bin/env node
/**
 * FPC B35 · cargo idempotency HTTP contract gate (① local)
 *
 *   node scripts/dev/run-fpc-recovery-cargo-gate.cjs
 */
'use strict';

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

function sh(cmd) {
  return execSync(cmd, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 600_000,
  });
}

try {
  const out = sh('cargo test -p traveltrust-api idempotency_http_contract -- --nocapture 2>&1');
  const passed = [...out.matchAll(/(\d+) passed/g)].reduce((s, m) => s + Number(m[1]), 0);
  if (passed < 1) {
    console.error('TT_FPC_RECOVERY_CARGO: FAIL — no idempotency tests passed');
    console.error(out.slice(-2000));
    process.exit(1);
  }
  console.log(`TT_FPC_RECOVERY_CARGO: OK passed=${passed}`);
  process.exit(0);
} catch (e) {
  console.error('TT_FPC_RECOVERY_CARGO: FAIL');
  console.error((e.stdout || '') + (e.stderr || ''));
  process.exit(e.status || 1);
}
