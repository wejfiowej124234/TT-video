#!/usr/bin/env node
/**
 * Probe prod /meta chain.contracts vs gov_freeze_v2 SSOT (10-key parity).
 *
 *   node scripts/dev/check-web3-system-production-meta-contracts.cjs
 *
 * Exit 0 when 10/10 match · exit 1 otherwise.
 */
const fs = require('fs');
const path = require('path');
const { request } = require('./lib/production-readiness-probe-http.cjs');

const ROOT = path.join(__dirname, '../..');
const PROD_API = (process.env.PROD_API || 'https://tt-api-prod.fly.dev').replace(/\/$/, '');

const META_KEYS = [
  'governor_address',
  'timelock_address',
  'governance_token_address',
  'fee_router_address',
  'treasury_address',
  'registry_address',
  'escrow_factory_address',
  'region_steward_stake_pool_address',
  'guide_staking_address',
  'staking_provider_address',
];

const SSOT = {
  governor_address: '0x847b00ddb6ffed71812abc358a407dad4b099fcb',
  timelock_address: '0x904a6c4c6aab698afbf08ec6151d317c393520cc',
  governance_token_address: '0x2837ea0c50e27d59b88af617abbb231a040062c5',
  fee_router_address: '0x81A8009210c5215100564c6E4123F672c4459306',
  treasury_address: '0xc1de17cd47b3ef2a68a4dc6cb1a5cc4fd4eb5ce2',
  registry_address: '0xc50913e154f850583D0afbE9158a75E0e2167AAb',
  escrow_factory_address: '0xbf746B6a330e61416c6D87aB9b0758f7107C8006',
  region_steward_stake_pool_address: '0x3a89378bfad12d1028707dd37055294854c8784e',
  guide_staking_address: '0x5bdACF35292bDd681103BBb50865d8D2Fd49653f',
  staking_provider_address: '0xa90cA23767C1DdcA1Eb8AB292185e9af1106b075',
};

function norm(a) {
  return (a || '').toLowerCase();
}

async function main() {
  const meta = await request(`${PROD_API}/meta`);
  const contracts = meta.json?.chain?.contracts || {};
  const rows = [];
  let wired = 0;
  let matched = 0;

  for (const key of META_KEYS) {
    const actual = contracts[key];
    const expected = SSOT[key];
    const isNull = !actual;
    if (!isNull) wired += 1;
    let status = 'null';
    if (!isNull && !expected) status = 'wired_no_ssot';
    else if (!isNull && expected && norm(actual) === norm(expected)) {
      status = 'match';
      matched += 1;
    } else if (!isNull && expected) status = 'mismatch';
    rows.push({ key, actual: actual || null, expected: expected || null, status });
  }

  const ssotKeys = META_KEYS.filter((k) => SSOT[k]);
  const allSsotMatch = ssotKeys.every((k) => rows.find((r) => r.key === k)?.status === 'match');
  const allWired = wired === META_KEYS.length;

  const manifest = {
    schema: 'traveltrust.web3_system_prod_meta_contracts.v1',
    recorded_utc: new Date().toISOString(),
    prod_api: PROD_API,
    wired_count: wired,
    target_count: META_KEYS.length,
    ssot_match_count: matched,
    verdict: allWired && allSsotMatch ? 'WEB3_SYSTEM_META_CONTRACTS_PASS' : 'WEB3_SYSTEM_META_CONTRACTS_OPEN',
    rows,
    runbook: 'docs/runbook/WEB3-SYSTEM-PRODUCTION-RUNTIME-WIRING.md',
  };

  const outDir = path.join(ROOT, 'evidence/GO_production_readiness/web3-system-audit');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'WEB3-SYSTEM-META-CONTRACTS-LATEST.json'), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(JSON.stringify({ verdict: manifest.verdict, wired: `${wired}/${META_KEYS.length}`, ssot_match: matched }, null, 2));
  process.exit(manifest.verdict === 'WEB3_SYSTEM_META_CONTRACTS_PASS' ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
