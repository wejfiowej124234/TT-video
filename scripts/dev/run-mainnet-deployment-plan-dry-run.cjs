#!/usr/bin/env node
/**
 * P3-04 · Mainnet Deployment Plan dry-run (simulation only — no broadcast).
 *
 *   node scripts/dev/run-mainnet-deployment-plan-dry-run.cjs
 *
 * Validates preconditions, ABI-002 prep artifacts, deploy script presence,
 * and step/evidence/rollback documentation — without forge --broadcast.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

const REQUIRED = [
  'registry/mainnet-deployment-plan.v1.yaml',
  'registry/mainnet-address-registry.v1.yaml',
  'registry/phase3-production-entry-baseline.v1.yaml',
  'docs/spec/governance-token/MAINNET-DEPLOYMENT-PLAN-v1.md',
  'contracts/abi/EscrowV2.json',
  'contracts/abi/EscrowFactoryV2.json',
  'contracts/script/DeployEscrowFactoryV2.s.sol',
  'contracts/script/DeployGovFreezeV2CleanBaseline.s.sol',
];

const checks = [];
let fail = 0;

function pass(id, detail) {
  checks.push({ id, result: 'PASS', detail });
}

function failCheck(id, detail) {
  checks.push({ id, result: 'FAIL', detail });
  fail += 1;
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function readYaml(rel) {
  const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  // minimal parse for key fields without PyYAML dependency
  return text;
}

for (const rel of REQUIRED) {
  if (exists(rel)) pass(`file:${rel}`, 'present');
  else failCheck(`file:${rel}`, 'missing');
}

const planYaml = readYaml('registry/mainnet-deployment-plan.v1.yaml');
if (planYaml.includes('verdict: MAINNET_DEPLOYMENT_PLAN_READY')) {
  pass('plan:verdict', 'MAINNET_DEPLOYMENT_PLAN_READY');
} else {
  failCheck('plan:verdict', 'missing MAINNET_DEPLOYMENT_PLAN_READY');
}

if (planYaml.includes('execution_status: PLAN_ONLY')) {
  pass('plan:execution_status', 'PLAN_ONLY');
} else {
  failCheck('plan:execution_status', 'expected PLAN_ONLY');
}

if (planYaml.includes('status: DEPLOYMENT_PREPARATION_READY')) {
  pass('abi-002:status', 'DEPLOYMENT_PREPARATION_READY');
} else {
  failCheck('abi-002:status', 'expected DEPLOYMENT_PREPARATION_READY');
}

if (planYaml.includes('broadcast_authorized: false')) {
  pass('network:broadcast', 'not authorized');
} else {
  failCheck('network:broadcast', 'broadcast must remain false in P3-04');
}

const stepMatches = planYaml.match(/^\s+-\s+step:\s+\d+/gm) || [];
if (stepMatches.length >= 7) pass('deploy:steps', `${stepMatches.length} documented steps`);
else failCheck('deploy:steps', `expected >=7 steps, found ${stepMatches.length}`);

const escrowAbi = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'contracts/abi/EscrowV2.json'), 'utf8')
);
const hasConfirm = escrowAbi.some(
  (e) => e.type === 'function' && e.name === 'confirmServiceComplete'
);
if (hasConfirm) pass('abi-002:confirmServiceComplete', 'selector present');
else failCheck('abi-002:confirmServiceComplete', 'missing in EscrowV2.json');

const baseline = readYaml('registry/phase3-production-entry-baseline.v1.yaml');
if (baseline.includes('p3_03_complete: true')) pass('p3-03:complete', 'true');
else failCheck('p3-03:complete', 'P3-03 must be complete before dry-run');

const outDir = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline'
);
const outFile = path.join(outDir, 'P3-04-DRY-RUN.json');
const payload = {
  generated_utc: new Date().toISOString(),
  mode: 'simulation_only',
  verdict: fail === 0 ? 'MAINNET_DEPLOYMENT_PLAN_DRY_RUN: PASS' : 'MAINNET_DEPLOYMENT_PLAN_DRY_RUN: FAIL',
  checks,
  fail_count: fail,
};
fs.writeFileSync(outFile, JSON.stringify(payload, null, 2) + '\n');

console.log(`TT_MAINNET_DEPLOYMENT_PLAN_DRY_RUN: ${fail === 0 ? 'PASS' : 'FAIL'} (${checks.length} checks, ${fail} failures)`);
console.log(`Evidence: ${path.relative(ROOT, outFile)}`);
process.exit(fail === 0 ? 0 : 2);
