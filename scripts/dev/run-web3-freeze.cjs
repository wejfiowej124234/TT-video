#!/usr/bin/env node
/**
 * Web3 Freeze — snapshot + hash all deploy-relevant assets after Phase ③ Deployment Prerequisite Review PASS.
 *
 *   node scripts/dev/run-web3-freeze.cjs
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_readiness/web3-freeze');
const RUN_DIR = path.join(EVID_ROOT, `freeze-${STAMP}`);

function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  } catch {
    return null;
  }
}

function sha256File(abs) {
  if (!fs.existsSync(abs)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

function sha256Buf(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, '/');
}

function collectGlob(dirRel, pattern) {
  const dir = path.join(ROOT, dirRel);
  if (!fs.existsSync(dir)) return [];
  const out = [];
  function walk(d) {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const abs = path.join(d, ent.name);
      if (ent.isDirectory()) walk(abs);
      else if (pattern.test(ent.name)) out.push(rel(abs));
    }
  }
  walk(dir);
  return out.sort();
}

function hashFiles(fileRels) {
  const entries = {};
  for (const f of fileRels) {
    const abs = path.join(ROOT, f);
    entries[f] = { sha256: sha256File(abs), exists: fs.existsSync(abs) };
  }
  const concat = fileRels
    .filter((f) => entries[f].exists)
    .map((f) => entries[f].sha256)
    .join('');
  return { entries, aggregate_sha256: concat ? sha256Buf(concat) : null };
}

function readGitHead() {
  try {
    return fs.readFileSync(path.join(ROOT, '.git/HEAD'), 'utf8').trim();
  } catch {
    return 'unknown';
  }
}

function tryForgeBytecodeHashes() {
  const out = {};
  const contracts = [
    'EscrowV2', 'EscrowFactoryV2', 'FeeRouter', 'Registry',
    'GovernanceTimelock', 'TravelTrustGovernor', 'GovernanceTreasury',
    'GovernanceVotesToken', 'RegionStewardStakePool',
  ];
  for (const name of contracts) {
    const artifact = path.join(ROOT, `contracts/out/${name}.sol/${name}.json`);
    if (!fs.existsSync(artifact)) {
      out[name] = { bytecode_hash: null, note: 'run forge build to populate' };
      continue;
    }
    try {
      const j = JSON.parse(fs.readFileSync(artifact, 'utf8'));
      const bytecode = j.deployedBytecode?.object || j.bytecode?.object;
      out[name] = {
        bytecode_hash: bytecode ? sha256Buf(Buffer.from(bytecode.replace(/^0x/, ''), 'hex')) : null,
        artifact: rel(artifact),
      };
    } catch {
      out[name] = { bytecode_hash: null, error: 'parse failed' };
    }
  }
  return out;
}

function main() {
  mkdirp(RUN_DIR);

  const exitReview = readJson('evidence/GO_production_readiness/phase2-exit-review/PHASE2-EXIT-REVIEW-LATEST.json');
  const prerequisite = readJson('evidence/GO_production_readiness/phase3-deployment-prerequisite-review/PHASE3-DEPLOYMENT-PREREQUISITE-REVIEW-LATEST.json');
  if (exitReview?.verdict !== 'PHASE2_EXIT_REVIEW_PASS') {
    console.error(JSON.stringify({
      error: 'PHASE2_EXIT_REVIEW_PASS required before Web3 Freeze',
      current: exitReview?.verdict || 'missing',
      run: 'node scripts/dev/run-phase2-exit-review.cjs',
    }, null, 2));
    process.exit(2);
  }
  if (prerequisite?.verdict !== 'PHASE3_DEPLOYMENT_PREREQUISITE_REVIEW_PASS') {
    console.error(JSON.stringify({
      error: 'PHASE3_DEPLOYMENT_PREREQUISITE_REVIEW_PASS required before Web3 Freeze',
      current: prerequisite?.verdict || 'missing',
      run: 'node scripts/dev/run-phase3-deployment-prerequisite-review.cjs',
    }, null, 2));
    process.exit(2);
  }

  // Optional forge build for bytecode hashes
  spawnSync('forge', ['build'], { cwd: path.join(ROOT, 'contracts'), encoding: 'utf8', shell: process.platform === 'win32' });

  const contractSources = collectGlob('contracts/src', /\.sol$/);
  const abiFiles = collectGlob('contracts/abi', /\.json$/);

  const registryFiles = [
    'registry/protocol-convergence-deployments.v1.yaml',
    'registry/web3-three-phase-closure-discipline.v1.yaml',
    'registry/web3-system-master-map.v1.yaml',
    'registry/escrow-bilateral-mainnet-policy.v1.yaml',
    'registry/sepolia-full-web3-lifecycle-validation.v1.yaml',
    'registry/mainnet-deployment-package.v1.yaml',
    'registry/web3-freeze.v1.yaml',
  ];

  const runbookFiles = [
    'docs/runbook/WEB3-THREE-PHASE-CLOSURE-DISCIPLINE-V1.md',
    'docs/runbook/SEPOLIA-FULL-WEB3-LIFECYCLE-VALIDATION-V1.md',
    'docs/runbook/PHASE2-EXIT-REVIEW-V1.md',
    'docs/runbook/WEB3-FREEZE-V1.md',
    'docs/runbook/MAINNET-DEPLOYMENT-PACKAGE-V1.md',
    'docs/runbook/MAINNET-VALIDATION-V1.md',
    'docs/runbook/WEB3-SYSTEM-MASTER-MAP-V1.md',
    'docs/runbook/ESCROW-BILATERAL-SETTLEMENT-OWNER-DECISION-RECORD-V1.md',
  ];

  const protocolSsot = [
    'docs/spec/governance-token/protocol-ssot.v1.yaml',
    'docs/spec/governance-token/protocol-ssot.v1.md',
    'docs/spec/governance-token/fund-flow-ssot.v1.md',
  ];

  const deployScripts = [
    'contracts/script/DeployEscrowFactoryV2.s.sol',
    'contracts/script/DeployFundStackUnderTimelock.s.sol',
    'contracts/script/DeployGovernanceStack.s.sol',
    'contracts/script/DeployRegionStewardStakePool.s.sol',
    'contracts/script/DeployCountryPoolRedemptionEpochV0.s.sol',
    'scripts/dev/phase3-mainnet-broadcast-escrow-factory-v2.sh',
  ];

  const evidenceRefs = [
    'evidence/GO_production_readiness/sepolia-full-web3-lifecycle/SEPOLIA-FULL-WEB3-LIFECYCLE-VALIDATION-LATEST.json',
    'evidence/GO_production_readiness/phase2-exit-review/PHASE2-EXIT-REVIEW-LATEST.json',
    'evidence/GO_production_readiness/web3-system-audit/WEB3-SYSTEM-CLOSURE-LATEST.json',
    'evidence/GO_production_readiness/web3-protocol-grade-audit/WEB3-PROTOCOL-GRADE-AUDIT-LATEST.json',
    'evidence/GO_ttg_cert/CERT-EXECUTION-INDEX-LATEST.json',
  ];

  const freezeManifest = {
    schema: 'traveltrust.web3_freeze_manifest.v1',
    recorded_utc: new Date().toISOString(),
    stamp: STAMP,
    verdict: 'WEB3_FREEZE_PASS',
    git_head: readGitHead(),
    exit_review_ref: exitReview.stamp,
    scope: {
      contracts: hashFiles(contractSources),
      registry: hashFiles(registryFiles),
      abi: hashFiles(abiFiles),
      runbooks: hashFiles(runbookFiles),
      protocol_ssot: hashFiles(protocolSsot),
      deployment_scripts: hashFiles(deployScripts),
      master_map: hashFiles(['registry/web3-system-master-map.v1.yaml', 'docs/runbook/WEB3-SYSTEM-MASTER-MAP-V1.md']),
      evidence: hashFiles(evidenceRefs),
    },
    contract_bytecode_hashes: tryForgeBytecodeHashes(),
    note: 'Any change to frozen assets after this stamp invalidates Mainnet Deployment Package — re-freeze required',
  };

  const json = JSON.stringify(freezeManifest, null, 2);
  fs.writeFileSync(path.join(RUN_DIR, 'WEB3-FREEZE-MANIFEST-LATEST.json'), json);
  fs.writeFileSync(path.join(EVID_ROOT, 'WEB3-FREEZE-MANIFEST-LATEST.json'), json);

  const md = `# Web3 Freeze Manifest

**Verdict:** \`WEB3_FREEZE_PASS\`  
**Stamp:** ${STAMP}  
**Git HEAD:** ${freezeManifest.git_head}

Frozen: Contracts · Registry · ABI · Runbooks · Evidence refs · Master Map · Protocol SSOT · Deploy Scripts

Next: \`node scripts/dev/generate-mainnet-deployment-package.cjs\`
`;
  fs.writeFileSync(path.join(RUN_DIR, 'WEB3-FREEZE-MANIFEST-LATEST.md'), md);
  fs.writeFileSync(path.join(EVID_ROOT, 'WEB3-FREEZE-MANIFEST-LATEST.md'), md);

  console.log(JSON.stringify({ verdict: 'WEB3_FREEZE_PASS', stamp: STAMP, contracts: contractSources.length, abi: abiFiles.length }, null, 2));
}

main();
