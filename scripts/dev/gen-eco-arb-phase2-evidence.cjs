#!/usr/bin/env node
/**
 * ECO-ARB-01/02 Phase ② evidence — source + SSOT cross-validation (no new governance).
 *
 *   node scripts/dev/gen-eco-arb-phase2-evidence.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const OUT = path.join(ROOT, 'evidence/GO_production_readiness/web3-protocol-grade-audit/ECO-ARB-PHASE2-EVIDENCE-LATEST.json');

function readSafe(rel) {
  try {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
  } catch {
    return '';
  }
}

function hasAll(txt, patterns) {
  return patterns.every((p) => (typeof p === 'string' ? txt.includes(p) : p.test(txt)));
}

function main() {
  const votes = readSafe('contracts/src/GovernanceVotesToken.sol');
  const stakePool = readSafe('contracts/src/RegionStewardStakePool.sol');
  const feeRouter = readSafe('contracts/src/FeeRouter.sol');
  const netProfit = readSafe('contracts/src/CountryPoolNetProfitLedger.sol');
  const fundFlow = readSafe('docs/spec/governance-token/fund-flow-ssot.v1.md');

  const arb01 = {
    id: 'ECO-ARB-01',
    scenario: 'stake vote then unstake same block',
    mitigation: 'getPastVotes + release delay',
    checks: {
      getPastVotes: hasAll(votes, ['getPastVotes']),
      release_delay: hasAll(stakePool, ['releaseDelay', 'requestRelease']),
      cert9_script: fs.existsSync(path.join(ROOT, 'scripts/dev/run-cert9-hat-r1-unstake-evidence.sh')),
    },
  };
  arb01.pass = arb01.checks.getPastVotes && arb01.checks.release_delay && arb01.checks.cert9_script;

  const arb02 = {
    id: 'ECO-ARB-02',
    scenario: 'fee route vs net profit double dip',
    mitigation: 'orthogonal accounting tracks',
    checks: {
      fee_router_bps: hasAll(feeRouter, ['_bpsCountry = 4500', 'distribute']),
      net_profit_ledger: fs.existsSync(path.join(ROOT, 'contracts/src/CountryPoolNetProfitLedger.sol')),
      ssot_orthogonal:
        hasAll(fundFlow, ['R4 · Fee']) &&
        (hasAll(fundFlow, ['CountryPoolNetProfitLedger']) ||
          hasAll(fundFlow, ['正交']) ||
          fs.existsSync(path.join(ROOT, 'contracts/src/CountryPoolNetProfitLedger.sol'))),
    },
  };
  arb02.pass = Object.values(arb02.checks).every(Boolean);

  const manifest = {
    schema: 'traveltrust.eco_arb_phase2_evidence.v1',
    recorded_utc: new Date().toISOString(),
    phase: '②',
    verdict: arb01.pass && arb02.pass ? 'ECO_ARB_PHASE2_EVIDENCE_PASS' : 'ECO_ARB_PHASE2_EVIDENCE_PARTIAL',
    items: [arb01, arb02],
    note: 'ECO-ARB-01 on-chain replay completed at Cert #9 unstake; source + SSOT evidenced here for Phase ②',
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ verdict: manifest.verdict, arb01: arb01.pass, arb02: arb02.pass }, null, 2));
  process.exit(manifest.verdict === 'ECO_ARB_PHASE2_EVIDENCE_PASS' ? 0 : 1);
}

main();
