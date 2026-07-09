#!/usr/bin/env node
/**
 * WEB3-SYSTEM-META-CONTRACTS-CLOSURE — probe prod /meta 10/10 + record closure evidence.
 *
 *   node scripts/dev/run-web3-system-meta-contracts-closure.cjs
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const STAMP = new Date().toISOString();
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_readiness/web3-system-audit');
const RUN_DIR = path.join(EVID_ROOT, `meta-closure-${STAMP.replace(/[:.]/g, '-').slice(0, 19)}`);

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

async function main() {
  mkdirp(RUN_DIR);
  const probe = spawnSync(process.execPath, [path.join(__dirname, 'check-web3-system-production-meta-contracts.cjs')], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  fs.writeFileSync(path.join(RUN_DIR, 'probe.log'), `${probe.stdout || ''}${probe.stderr || ''}`, 'utf8');

  const latest = readJson(path.join(EVID_ROOT, 'WEB3-SYSTEM-META-CONTRACTS-LATEST.json')) || {};
  const pass = latest.verdict === 'WEB3_SYSTEM_META_CONTRACTS_PASS';

  const steward = spawnSync(
    process.execPath,
    [
      '-e',
      `const {request}=require('./scripts/dev/lib/production-readiness-probe-http.cjs');request('${process.env.PROD_API || 'https://tt-api-prod.fly.dev'}/api/v1/steward/stake-quote?jurisdictions=CN').then(r=>console.log(JSON.stringify({status:r.status,ok:r.json?.status})));`,
    ],
    { cwd: ROOT, encoding: 'utf8' },
  );

  const manifest = {
    schema: 'traveltrust.web3_system_meta_contracts_closure.v1',
    recorded_utc: STAMP,
    run_dir: path.relative(ROOT, RUN_DIR).replace(/\\/g, '/'),
    p0_item: 'P0-002 Production Runtime Wiring',
    verdict: pass ? 'WEB3_SYSTEM_META_CONTRACTS_CLOSURE_PASS' : 'WEB3_SYSTEM_META_CONTRACTS_CLOSURE_OPEN',
    probe: {
      wired: `${latest.wired_count}/${latest.target_count}`,
      ssot_match: latest.ssot_match_count,
      rows: latest.rows,
    },
    steward_stake_quote: steward.stdout?.trim() || null,
    governance_chain_closed: pass && latest.rows?.some((r) => r.key === 'timelock_address' && r.status === 'match'),
    runbook: 'docs/runbook/WEB3-SYSTEM-PRODUCTION-RUNTIME-WIRING.md',
    discipline: { business_code_modified: false, config_only: true },
  };

  fs.writeFileSync(path.join(RUN_DIR, 'WEB3-SYSTEM-META-CONTRACTS-CLOSURE.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(EVID_ROOT, 'WEB3-SYSTEM-META-CONTRACTS-CLOSURE-LATEST.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(JSON.stringify({ verdict: manifest.verdict, wired: manifest.probe.wired, ssot_match: manifest.probe.ssot_match }, null, 2));
  process.exit(pass ? 0 : 1);
}

main();
