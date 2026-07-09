#!/usr/bin/env node
/**
 * Upsert Web3 System contract addresses into scripts/dev/.env.production.local
 * from gov_freeze_v2 SSOT (public on-chain addresses only).
 *
 *   node scripts/dev/upsert-web3-system-production-env-local.cjs
 */
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '.env.production.local');

const SSOT = {
  TIMELOCK_ADDRESS: '0x904a6c4c6aab698afbf08ec6151d317c393520cc',
  GOVERNANCE_TOKEN_ADDRESS: '0x2837ea0c50e27d59b88af617abbb231a040062c5',
  GOVERNANCE_TREASURY_P4CAP_ADDRESS: '0xc1de17cd47b3ef2a68a4dc6cb1a5cc4fd4eb5ce2',
  LEGACY_TREASURY_ADDRESS: '0x6a8323fb2394A1e9655F7132F4E4B8222d2898be',
  REGION_STEWARD_STAKE_POOL_ADDRESS: '0x3a89378bfad12d1028707dd37055294854c8784e',
  GUIDE_STAKING_ADDRESS: '0x5bdACF35292bDd681103BBb50865d8D2Fd49653f',
  STAKING_PROVIDER_ADDRESS: '0xa90cA23767C1DdcA1Eb8AB292185e9af1106b075',
  GOVERNOR_ADDRESS: '0x847b00ddb6ffed71812abc358a407dad4b099fcb',
  FEE_ROUTER_ADDRESS: '0x81A8009210c5215100564c6E4123F672c4459306',
  ESCROW_FACTORY_ADDRESS: '0xbf746B6a330e61416c6D87aB9b0758f7107C8006',
  REGISTRY_ADDRESS: '0xc50913e154f850583D0afbE9158a75E0e2167AAb',
};

function upsertEnv(content, key, value) {
  const re = new RegExp(`^${key}=.*$`, 'm');
  const line = `${key}=${value}`;
  if (re.test(content)) return content.replace(re, line);
  return `${content.replace(/\s*$/, '')}\n${line}\n`;
}

function main() {
  if (!fs.existsSync(ENV_PATH)) {
    console.error('missing', ENV_PATH);
    process.exit(2);
  }
  let content = fs.readFileSync(ENV_PATH, 'utf8');
  for (const [k, v] of Object.entries(SSOT)) {
    content = upsertEnv(content, k, v);
  }
  // Legacy alias kept for phase3 backward compat
  content = upsertEnv(content, 'GUIDE_STAKING_POOL_ADDRESS', SSOT.GUIDE_STAKING_ADDRESS);
  content = upsertEnv(content, 'PROVIDER_STAKING_POOL_ADDRESS', SSOT.STAKING_PROVIDER_ADDRESS);
  fs.writeFileSync(ENV_PATH, content, 'utf8');
  console.log(JSON.stringify({ updated: Object.keys(SSOT).length + 2, path: ENV_PATH }, null, 2));
}

main();
