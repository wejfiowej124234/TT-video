#!/usr/bin/env node
/**
 * Timelock period · governance STATUS refresh (structure remains frozen).
 *
 * GOVERNANCE_FREEZE_ACTIVE = governance structure frozen · state continues.
 * Refreshes Dashboard + Production Readiness Book from live evidence.
 *
 *   node scripts/dev/refresh-governance-status.cjs
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');

function runNode(script) {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts/dev', script)], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return { script, ok: r.status === 0, exit: r.status, stderr: (r.stderr || '').trim().slice(0, 400) };
}

function readFreeze() {
  try {
    return JSON.parse(
      fs.readFileSync(
        path.join(ROOT, 'evidence/GO_production_readiness/governance-freeze/GOVERNANCE-FREEZE-MANIFEST-LATEST.json'),
        'utf8',
      ),
    );
  } catch {
    return null;
  }
}

function main() {
  const freeze = readFreeze();
  if (freeze?.verdict !== 'GOVERNANCE_FREEZE_ACTIVE') {
    console.error(JSON.stringify({
      error: 'GOVERNANCE_FREEZE_ACTIVE required — run node scripts/dev/run-governance-freeze.cjs first',
      current: freeze?.verdict || 'missing',
    }, null, 2));
    process.exit(2);
  }

  const steps = [
    'gen-ttg-cert-production-evidence-index.cjs',
    'run-phase2-exit-review.cjs',
    'gen-production-readiness-book.cjs',
  ];

  const results = steps.map(runNode);
  const dash = spawnSync(process.execPath, [path.join(ROOT, 'scripts/dev/run-phase-dashboard.cjs')], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  results.push({
    script: 'run-phase-dashboard.cjs',
    ok: dash.status === 0,
    exit: dash.status,
    stderr: (dash.stderr || '').trim().slice(0, 400),
  });
  const failed = results.filter((r) => !r.ok);

  console.log(JSON.stringify({
    verdict: 'GOVERNANCE_STATUS_REFRESH_COMPLETE',
    update_type: 'state_update',
    governance_freeze: freeze.verdict,
    principle_1: 'PG-P1 Structure Frozen · State Continues',
    mode: 'state_update_only_no_structure_change',
    steps: results.map((r) => ({ script: r.script, ok: r.ok })),
    failed: failed.length,
  }, null, 2));

  process.exit(failed.length ? 1 : 0);
}

main();
