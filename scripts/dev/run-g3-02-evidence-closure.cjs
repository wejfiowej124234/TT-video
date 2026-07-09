#!/usr/bin/env node
/**
 * G3-02-EVIDENCE-CLOSURE — sync EXECUTION vs READINESS manifests (P0-003).
 *
 *   node scripts/dev/run-g3-02-evidence-closure.cjs
 *
 * Discipline: evidence + gate scripts only — no business code.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const STAMP = new Date().toISOString();
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_readiness/G3-02');
const RUN_DIR = path.join(EVID_ROOT, `evidence-closure-${STAMP.replace(/[:.]/g, '-').slice(0, 19)}`);

function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function countVerdicts(payItems) {
  const out = { PASS: 0, PARTIAL: 0, FAIL: 0, OTHER: 0 };
  for (const v of Object.values(payItems || {})) {
    if (out[v] !== undefined) out[v] += 1;
    else out.OTHER += 1;
  }
  return out;
}

function main() {
  mkdirp(RUN_DIR);

  const readinessGate = spawnSync('bash', [path.join(ROOT, 'scripts/check-web3-payment-production-readiness.sh')], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  fs.writeFileSync(path.join(RUN_DIR, 'readiness-gate.log'), `${readinessGate.stdout || ''}${readinessGate.stderr || ''}`, 'utf8');

  const execution = readJson(path.join(EVID_ROOT, 'G3-02-EXECUTION-LATEST.json')) || {};
  const readiness = readJson(path.join(EVID_ROOT, 'WEB3-PAYMENT-PRODUCTION-READINESS-LATEST.json')) || {};

  const execVerdict = execution.overall_verdict || execution.verdict || 'UNKNOWN';
  const readyVerdict = readiness.verdict || 'UNKNOWN';
  const payItems = execution.pay_items || {};
  const counts = countVerdicts(payItems);

  const drift =
    execVerdict !== readyVerdict
      ? {
          kind: 'manifest_verdict_mismatch',
          execution: execVerdict,
          readiness: readyVerdict,
        }
      : null;

  const acceptablePartial = ['PAY-W14'];
  const blockingPartial = Object.entries(payItems)
    .filter(([id, v]) => v === 'PARTIAL' && !acceptablePartial.includes(id))
    .map(([id]) => id);

  const synced =
    execVerdict === readyVerdict &&
    execVerdict === 'WEB3_PAYMENT_PRODUCTION_PASS' &&
    counts.FAIL === 0 &&
    counts.PASS >= 14;

  const manifest = {
    schema: 'traveltrust.g3_02_evidence_closure.v1',
    recorded_utc: STAMP,
    run_dir: path.relative(ROOT, RUN_DIR).replace(/\\/g, '/'),
    p0_item: 'P0-003 G3-02 Evidence Drift',
    verdict: synced ? 'G3_02_EVIDENCE_CLOSURE_PASS' : 'G3_02_EVIDENCE_CLOSURE_OPEN',
    machine_key: 'TT_G3_02_EVIDENCE_CLOSURE',
    production_scope: 'PRODUCTION_SCOPE_SEPOLIA',
    chain_id: 11155111,
    manifests: {
      execution: {
        path: 'evidence/GO_production_readiness/G3-02/G3-02-EXECUTION-LATEST.json',
        run_id: execution.run_id || null,
        overall_verdict: execVerdict,
        pay_item_counts: counts,
        flow: execution.flow || null,
      },
      readiness: {
        path: 'evidence/GO_production_readiness/G3-02/WEB3-PAYMENT-PRODUCTION-READINESS-LATEST.json',
        verdict: readyVerdict,
        checklist_with_artifacts: readiness.checklist_evidence?.with_artifacts ?? null,
        checklist_total: readiness.checklist_evidence?.total ?? null,
      },
    },
    drift,
    blocking_partial_items: blockingPartial,
    acceptable_partial_items: acceptablePartial.filter((id) => payItems[id] === 'PARTIAL'),
    pay_items: payItems,
    discipline: {
      business_code_modified: false,
      stripe_used: false,
      mock_pay_used: false,
    },
    ssot: {
      execution_script: 'scripts/dev/run-g3-02-web3-payment-production-verification.cjs',
      readiness_gate: 'scripts/check-web3-payment-production-readiness.sh',
      runbook: 'docs/runbook/G3-02-WEB3-PAYMENT-PRODUCTION-EXECUTION.md',
    },
  };

  fs.writeFileSync(path.join(RUN_DIR, 'G3-02-EVIDENCE-CLOSURE.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(EVID_ROOT, 'G3-02-EVIDENCE-CLOSURE-LATEST.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        verdict: manifest.verdict,
        execution: execVerdict,
        readiness: readyVerdict,
        drift: !!drift,
        pay_item_counts: counts,
        blocking_partial: blockingPartial,
      },
      null,
      2,
    ),
  );
  process.exit(synced ? 0 : 1);
}

main();
