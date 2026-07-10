#!/usr/bin/env node
/**
 * FPC B35 · frontend recovery contract vitest gate (① local)
 *
 *   node scripts/dev/run-fpc-recovery-vitest-gate.cjs
 */
'use strict';

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const FE = path.join(ROOT, 'frontend');

const TESTS = [
  'lib/l5/l5EdgeCaseExceptionAudit.contract.test.ts',
];

function sh(cmd, cwd) {
  return execSync(cmd, {
    cwd,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 300_000,
  });
}

try {
  const files = TESTS.join(' ');
  const out = sh(`npx vitest run ${files} 2>&1`, FE);
  if (!/Tests\s+\d+\s+passed/.test(out) || /Tests\s+0\s+passed/.test(out)) {
    console.error('TT_FPC_RECOVERY_VITEST: FAIL');
    console.error(out.slice(-2500));
    process.exit(1);
  }
  console.log('TT_FPC_RECOVERY_VITEST: OK');
  console.log(out.split('\n').filter((l) => /Test Files|Tests|Duration/.test(l)).join(' | '));
  process.exit(0);
} catch (e) {
  console.error('TT_FPC_RECOVERY_VITEST: FAIL');
  console.error((e.stdout || '') + (e.stderr || ''));
  process.exit(e.status || 1);
}
