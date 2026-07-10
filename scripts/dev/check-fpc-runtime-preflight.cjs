#!/usr/bin/env node
/**
 * FPC Runtime Preflight CLI — run before each batch (B13+).
 *
 *   node scripts/dev/check-fpc-runtime-preflight.cjs
 *   node scripts/dev/check-fpc-runtime-preflight.cjs --batch B13
 *   node scripts/dev/check-fpc-runtime-preflight.cjs --expect-env P3_CHAIN_OFF=1
 */
'use strict';

const { evaluateRuntimePreflight } = require('./lib/fpc-runtime-preflight.cjs');

const batchId = process.argv.find((a, i) => process.argv[i - 1] === '--batch') || null;
const expectEnv = [];
for (let i = 0; i < process.argv.length; i += 1) {
  if (process.argv[i] === '--expect-env' && process.argv[i + 1]) {
    expectEnv.push(process.argv[i + 1]);
  }
}
const allowDirty = process.argv.includes('--allow-dirty');

(async () => {
  const result = await evaluateRuntimePreflight({ expectEnv, allowDirty });
  console.log(`TT_FPC_RUNTIME_PREFLIGHT: ${result.pass ? 'PASS' : 'FAIL'}`);
  if (batchId) console.log('BATCH:', batchId);
  console.log('ITEMS:', JSON.stringify(result.items));
  if (!result.pass) {
    console.log('BLOCKERS:', result.blockers.join(', '));
    process.exit(1);
  }
  process.exit(0);
})();
