#!/usr/bin/env node
/**
 * Generate Mainnet Deployment Package after Phase ② Exit Review PASS.
 *
 * Produces frozen deploy manifest, wave matrix, env template, rollback runbook refs.
 * Phase ③ MUST consume this package — NOT a testnet param swap.
 *
 *   node scripts/dev/generate-mainnet-deployment-package.cjs
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '../..');
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_readiness/mainnet-deployment-package');
const PKG_DIR = path.join(EVID_ROOT, `package-${STAMP}`);

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

function sha256File(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

function copyIfExists(srcRel, destAbs) {
  const src = path.join(ROOT, srcRel);
  if (!fs.existsSync(src)) return false;
  mkdirp(path.dirname(destAbs));
  fs.copyFileSync(src, destAbs);
  return true;
}

const TEMPLATE_ROOT = path.join(ROOT, 'docs/runbook/templates/mainnet-package');

function copyTemplateTree(destRoot) {
  if (!fs.existsSync(TEMPLATE_ROOT)) return [];
  const copied = [];
  const walk = (rel) => {
    const abs = path.join(TEMPLATE_ROOT, rel);
    for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
      const sub = rel ? `${rel}/${ent.name}` : ent.name;
      const src = path.join(TEMPLATE_ROOT, sub);
      const dest = path.join(destRoot, sub);
      if (ent.isDirectory()) {
        mkdirp(dest);
        walk(sub);
      } else {
        mkdirp(path.dirname(dest));
        fs.copyFileSync(src, dest);
        copied.push(sub);
      }
    }
  };
  walk('');
  return copied;
}

function main() {
  mkdirp(PKG_DIR);
  mkdirp(path.join(PKG_DIR, 'MANIFEST'));
  mkdirp(path.join(PKG_DIR, 'registry-snapshot'));
  mkdirp(path.join(PKG_DIR, 'abi-snapshot'));
  mkdirp(path.join(PKG_DIR, 'deploy-scripts'));
  mkdirp(path.join(PKG_DIR, 'env'));
  mkdirp(path.join(PKG_DIR, 'runbook'));
  mkdirp(path.join(PKG_DIR, 'evidence'));
  mkdirp(path.join(PKG_DIR, 'owner-signoff'));
  mkdirp(path.join(PKG_DIR, 'verify'));
  mkdirp(path.join(PKG_DIR, 'rollback'));
  mkdirp(path.join(PKG_DIR, 'emergency-recovery'));
  mkdirp(path.join(PKG_DIR, 'wave-1-escrow-factory'));

  const prepTemplatesCopied = copyTemplateTree(PKG_DIR);

  const exitReview = readJson('evidence/GO_production_readiness/phase2-exit-review/PHASE2-EXIT-REVIEW-LATEST.json');
  const web3Freeze = readJson('evidence/GO_production_readiness/web3-freeze/WEB3-FREEZE-MANIFEST-LATEST.json');
  if (web3Freeze?.verdict !== 'WEB3_FREEZE_PASS') {
    console.error(JSON.stringify({
      error: 'WEB3_FREEZE_PASS required before generating Mainnet Deployment Package',
      current: web3Freeze?.verdict || 'missing',
      prerequisite: exitReview?.verdict || 'PHASE2_EXIT_REVIEW_PASS first',
      run: 'node scripts/dev/run-web3-freeze.cjs',
    }, null, 2));
    process.exit(2);
  }

  const lifecycle = readJson('evidence/GO_production_readiness/sepolia-full-web3-lifecycle/SEPOLIA-FULL-WEB3-LIFECYCLE-VALIDATION-LATEST.json');
  const discipline = readSafe('registry/web3-three-phase-closure-discipline.v1.yaml');

  const registryFiles = [
    'registry/protocol-convergence-deployments.v1.yaml',
    'registry/web3-three-phase-closure-discipline.v1.yaml',
    'registry/escrow-bilateral-mainnet-policy.v1.yaml',
    'registry/web3-system-master-map.v1.yaml',
    'registry/mainnet-deployment-package.v1.yaml',
  ];

  const registrySnapshot = {};
  for (const rel of registryFiles) {
    const dest = path.join(PKG_DIR, 'registry-snapshot', path.basename(rel));
    if (copyIfExists(rel, dest)) {
      registrySnapshot[rel] = { sha256: sha256File(rel), snapshotted: true };
    } else {
      registrySnapshot[rel] = { sha256: null, snapshotted: false };
    }
  }

  const abiSnapshot = {};
  const abiDir = path.join(ROOT, 'contracts/abi');
  if (fs.existsSync(abiDir)) {
    for (const f of fs.readdirSync(abiDir).filter((x) => x.endsWith('.json')).sort()) {
      const rel = `contracts/abi/${f}`;
      const dest = path.join(PKG_DIR, 'abi-snapshot', f);
      copyIfExists(rel, dest);
      abiSnapshot[f] = sha256File(rel);
    }
  }

  for (const rel of [
    'contracts/script/DeployEscrowFactoryV2.s.sol',
    'contracts/script/DeployFundStackUnderTimelock.s.sol',
    'contracts/script/DeployGovernanceStack.s.sol',
    'contracts/script/DeployRegionStewardStakePool.s.sol',
    'contracts/script/DeployCountryPoolRedemptionEpochV0.s.sol',
    'scripts/dev/phase3-mainnet-broadcast-escrow-factory-v2.sh',
  ]) {
    const base = path.basename(rel);
    copyIfExists(rel, path.join(PKG_DIR, 'deploy-scripts', base));
  }

  const bytecodeHashes = web3Freeze.contract_bytecode_hashes || {};
  fs.writeFileSync(path.join(PKG_DIR, 'contract-bytecode-hashes.json'), JSON.stringify(bytecodeHashes, null, 2));

  const constructorParams = {
    schema: 'traveltrust.mainnet_constructor_parameters.v1',
    note: 'Fill per-wave before broadcast — values from frozen deploy scripts + Owner review',
    wave_1: { EscrowFactoryV2: 'TBD', FeeRouter: 'TBD', Registry: 'TBD' },
    wave_2: { GovernanceTimelock: 'TBD', TravelTrustGovernor: 'TBD', GovernanceTreasury: 'TBD' },
    wave_3: { RegionStewardStakePool: 'TBD', CountryPool: 'TBD', PrimaryMarket: 'TBD' },
  };
  fs.writeFileSync(
    path.join(PKG_DIR, 'constructor-parameters.v1.yaml'),
    `# Constructor parameters — mainnet only\n${yamlLike(constructorParams)}`,
  );

  const rpcMatrix = {
    schema: 'traveltrust.mainnet_rpc_matrix.v1',
    chains: {
      mainnet: { chain_id: '1', rpc_env: 'RPC_URL_MAINNET', production_scope: 'PRODUCTION_SCOPE_MAINNET' },
      sepolia_validation_ref: { chain_id: '11155111', note: 'Phase ② validation only — NOT copied to mainnet env' },
    },
  };
  fs.writeFileSync(path.join(PKG_DIR, 'rpc-matrix.v1.yaml'), `# RPC Matrix\n${yamlLike(rpcMatrix)}`);

  copyIfExists(
    'evidence/GO_production_readiness/web3-freeze/WEB3-FREEZE-MANIFEST-LATEST.json',
    path.join(PKG_DIR, 'evidence/web3-freeze-ref.json'),
  );
  copyIfExists(
    'evidence/GO_production_readiness/sepolia-full-web3-lifecycle/SEPOLIA-FULL-WEB3-LIFECYCLE-VALIDATION-LATEST.json',
    path.join(PKG_DIR, 'evidence/sepolia-production-validation-ref.json'),
  );
  copyIfExists(
    'evidence/GO_production_readiness/phase2-exit-review/PHASE2-EXIT-REVIEW-LATEST.json',
    path.join(PKG_DIR, 'evidence/phase2-exit-review-ref.json'),
  );

  const ownerSignoffTpl = `# Owner Signoff — Mainnet Deployment Package

**Package stamp:** ${STAMP}  
**Status:** PENDING Owner signature

Owner confirms:
- [ ] Reviewed MANIFEST/manifest.json (single SSOT for this deploy)
- [ ] Web3 Freeze manifest matches frozen assets
- [ ] Wave matrix + rollback plan accepted
- [ ] R-01 audit PASS on frozen bytecode
- [ ] Authorize Wave 1 broadcast

Signed: _________________ Date: _________
`;
  fs.writeFileSync(path.join(PKG_DIR, 'owner-signoff/OWNER-SIGNOFF-TEMPLATE.md'), ownerSignoffTpl);
  // Prep template retained as OWNER-SIGNOFF-PACKAGE.md when copied from template_root

  const waveMatrix = {
    schema: 'traveltrust.mainnet_wave_deployment_matrix.v1',
    generated_utc: new Date().toISOString(),
    chain_id: '1',
    production_scope: 'PRODUCTION_SCOPE_MAINNET',
    rule: 'RULE-DEPLOY-001 — deploy per wave from this matrix; no testnet param swap',
    waves: [
      {
        wave: 1,
        name: 'Core business contracts',
        contracts: ['EscrowFactoryV2', 'FeeRouter', 'Registry'],
        deploy_scripts: [
          'contracts/script/DeployEscrowFactoryV2.s.sol',
          'contracts/script/DeployFundStackUnderTimelock.s.sol',
        ],
        broadcast_entry: 'scripts/dev/phase3-mainnet-broadcast-escrow-factory-v2.sh',
        post_deploy_validation: 'node scripts/dev/run-mainnet-wave-validation.cjs --wave=1',
        rollback_ref: 'runbook/MAINNET-ROLLBACK-V1.md#wave-1',
        v1_escrow: 'FORBIDDEN',
      },
      {
        wave: 2,
        name: 'Governance stack',
        contracts: ['GovernanceTimelock', 'TravelTrustGovernor', 'GovernanceTreasury'],
        deploy_scripts: ['contracts/script/DeployGovernanceStack.s.sol'],
        post_deploy_validation: 'node scripts/dev/run-mainnet-wave-validation.cjs --wave=2',
        rollback_ref: 'runbook/MAINNET-ROLLBACK-V1.md#wave-2',
      },
      {
        wave: 3,
        name: 'Extended modules',
        contracts: ['CountryPool', 'RegionStewardStakePool', 'PrimaryMarket'],
        deploy_scripts: [
          'contracts/script/DeployRegionStewardStakePool.s.sol',
          'contracts/script/DeployCountryPoolRedemptionEpochV0.s.sol',
        ],
        post_deploy_validation: 'node scripts/dev/run-mainnet-wave-validation.cjs --wave=3',
        rollback_ref: 'runbook/MAINNET-ROLLBACK-V1.md#wave-3',
      },
    ],
  };

  fs.writeFileSync(
    path.join(PKG_DIR, 'wave-deployment-matrix.v1.yaml'),
    `# Auto-generated Mainnet Wave Deployment Matrix\n# ${new Date().toISOString()}\n\n${yamlLike(waveMatrix)}`,
  );

  const envTplSrc = path.join(TEMPLATE_ROOT, 'env/mainnet.env.template');
  if (!fs.existsSync(envTplSrc)) {
    const envTemplate = `# Mainnet Deployment Package — env template (DO NOT copy from Sepolia)
# Generated: ${new Date().toISOString()}
# Fill addresses AFTER each wave broadcast; dual-control required.

CHAIN_ID=1
PRODUCTION_SCOPE=PRODUCTION_SCOPE_MAINNET
RPC_URL_MAINNET=
USDC_ADDRESS_MAINNET=

# Wave 1 — fill after broadcast
ESCROW_FACTORY_V2_ADDRESS=
FEE_ROUTER_ADDRESS=

# Wave 2 — fill after broadcast
TIMELOCK_ADDRESS=
GOVERNOR_ADDRESS=
GOVERNANCE_TOKEN_ADDRESS=
GOVERNANCE_TREASURY_ADDRESS=

# Wave 3 — fill after broadcast
REGION_STEWARD_STAKE_POOL_ADDRESS=
COUNTRY_POOL_REDEMPTION_EPOCH_ADDRESS=

# Authorization (Owner only, after package review)
# TRAVELTRUST_MAINNET_PHASE3_AUTHORIZED=1
`;
    fs.writeFileSync(path.join(PKG_DIR, 'env/mainnet.env.template'), envTemplate);
  }

  const deployScriptsIndex = {
    schema: 'traveltrust.mainnet_deploy_scripts_index.v1',
    scripts: waveMatrix.waves.flatMap((w) =>
      w.deploy_scripts.map((s) => ({ wave: w.wave, script: s, broadcast: w.broadcast_entry || null })),
    ),
  };
  fs.writeFileSync(
    path.join(PKG_DIR, 'deploy-scripts-index.yaml'),
    `# Mainnet deploy scripts index\n${yamlLike(deployScriptsIndex)}`,
  );

  const rollbackMd = `# Mainnet Rollback v1 (Package ${STAMP})

**Generated with Mainnet Deployment Package — not for ad-hoc use**

See also: \`rollback/MAINNET-ROLLBACK-PREP-V1.md\` (prep template copy)

## Wave 1 — EscrowFactoryV2 · FeeRouter

- Pause new escrow creation via Timelock if deployed; else abort wave before cutover
- Revert \`ESCROW_FACTORY_V2_ADDRESS\` in registry to empty + rollback env
- Evidence: snapshot pre-wave registry in \`registry-snapshot/\`

## Wave 2 — Governance

- Emergency pause via Cert #10 path (Timelock-governed)
- Do NOT upgrade proxies without timelock delay

## Wave 3 — Extended modules

- Disable API routes pointing to new pool addresses
- Steward stake pool: follow unstake cert runbook

## Shadow Launch abort

If Shadow Launch detects P0 regression → halt next wave · Owner decision required.
`;
  fs.writeFileSync(path.join(PKG_DIR, 'runbook/MAINNET-ROLLBACK-V1.md'), rollbackMd);

  const topManifest = {
    schema: 'traveltrust.mainnet_deployment_package_top_manifest.v1',
    title: 'Mainnet Deployment Package — Single Source of Truth',
    generated_utc: new Date().toISOString(),
    stamp: STAMP,
    package_dir: path.relative(ROOT, PKG_DIR).replace(/\\/g, '/'),
    verdict: 'MAINNET_DEPLOYMENT_PACKAGE_GENERATED',
    rule_deploy_001: 'Deploy ONLY from this package — no Sepolia param swap',
    prerequisites: {
      phase2_exit_review: exitReview?.verdict,
      web3_freeze: web3Freeze?.verdict,
      web3_freeze_stamp: web3Freeze?.stamp,
      sepolia_production_validation: lifecycle?.verdict,
    },
    tree: {
      MANIFEST: 'manifest.json (this file)',
      registry_snapshot: 'registry-snapshot/',
      abi_snapshot: 'abi-snapshot/',
      contract_bytecode_hashes: 'contract-bytecode-hashes.json',
      deploy_scripts: 'deploy-scripts/',
      constructor_parameters: 'constructor-parameters.v1.yaml',
      wave_matrix: 'wave-deployment-matrix.v1.yaml',
      rollback_plan: 'runbook/MAINNET-ROLLBACK-V1.md',
      rpc_matrix: 'rpc-matrix.v1.yaml',
      evidence: 'evidence/',
      owner_signoff: 'owner-signoff/OWNER-SIGNOFF-TEMPLATE.md',
      owner_signoff_prep: 'owner-signoff/OWNER-SIGNOFF-PACKAGE.md',
      verify: 'verify/CONTRACT-VERIFY-PACKAGE.md · verify/EXPLORER-VERIFY-PACKAGE.md',
      rollback_prep: 'rollback/MAINNET-ROLLBACK-PREP-V1.md',
      emergency_recovery: 'emergency-recovery/EMERGENCY-RECOVERY-PREP-V1.md',
      wave_1_escrow_factory: 'wave-1-escrow-factory/ESCROW-FACTORY-WAVE1-MAINNET-PREP.md',
      env_template: 'env/mainnet.env.template',
    },
    prep_templates_copied: prepTemplatesCopied.length,
    web3_freeze_ref: web3Freeze?.stamp,
    git_head: readGitHead(),
  };
  fs.writeFileSync(path.join(PKG_DIR, 'MANIFEST/manifest.json'), JSON.stringify(topManifest, null, 2));

  const manifest = {
    schema: 'traveltrust.mainnet_deployment_package_manifest.v1',
    generated_utc: new Date().toISOString(),
    stamp: STAMP,
    package_dir: path.relative(ROOT, PKG_DIR).replace(/\\/g, '/'),
    verdict: 'MAINNET_DEPLOYMENT_PACKAGE_GENERATED',
    single_ssot: 'MANIFEST/manifest.json',
    prerequisite: {
      phase2_exit_review: exitReview.verdict,
      web3_freeze: web3Freeze.verdict,
      web3_freeze_stamp: web3Freeze.stamp,
    },
    sepolia_production_validation: lifecycle?.verdict,
    rule_deploy_001: 'No testnet param swap — use wave matrix + env template in this package',
    contents: topManifest.tree,
    phase3_next: [
      'Owner signoff in owner-signoff/',
      'R-01 PASS on frozen bytecode',
      'export TRAVELTRUST_MAINNET_PHASE3_AUTHORIZED=1',
      'Wave 1 broadcast from deploy-scripts/',
      'run-mainnet-wave-validation.cjs --wave=1',
      'Shadow Launch after Wave 1',
    ],
    mainnet_validation_ref: 'docs/runbook/MAINNET-VALIDATION-V1.md',
  };

  const json = JSON.stringify(manifest, null, 2);
  fs.writeFileSync(path.join(PKG_DIR, 'MAINNET-DEPLOYMENT-PACKAGE-LATEST.json'), json);
  fs.writeFileSync(path.join(EVID_ROOT, 'MAINNET-DEPLOYMENT-PACKAGE-LATEST.json'), json);

  const md = `# Mainnet Deployment Package

**Verdict:** \`MAINNET_DEPLOYMENT_PACKAGE_GENERATED\`  
**Stamp:** ${STAMP}  
**Package:** \`${manifest.package_dir}\`

## RULE-DEPLOY-001

**禁止**将 Sepolia 参数替换为主网参数后直接广播。必须使用本 Package 中的 Wave 矩阵、Env 模板与 Rollback Runbook。

## Single SSOT

\`MANIFEST/manifest.json\` — **这一包就是部署的唯一真源**

## Package tree

- \`MANIFEST/manifest.json\`
- \`registry-snapshot/\` · \`abi-snapshot/\` · \`contract-bytecode-hashes.json\`
- \`deploy-scripts/\` · \`constructor-parameters.v1.yaml\`
- \`wave-deployment-matrix.v1.yaml\` · \`runbook/MAINNET-ROLLBACK-V1.md\`
- \`rpc-matrix.v1.yaml\` · \`evidence/\` · \`owner-signoff/\`
- \`env/mainnet.env.template\`

## Phase ③

Wave 1 → validate → Wave 2 → validate → Wave 3 → Mainnet Validation → Production GO
`;
  fs.writeFileSync(path.join(PKG_DIR, 'MAINNET-DEPLOYMENT-PACKAGE-LATEST.md'), md);
  fs.writeFileSync(path.join(EVID_ROOT, 'MAINNET-DEPLOYMENT-PACKAGE-LATEST.md'), md);

  console.log(JSON.stringify({ verdict: manifest.verdict, package_dir: manifest.package_dir }, null, 2));
}

function readSafe(rel) {
  try {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
  } catch {
    return '';
  }
}

function readGitHead() {
  try {
    return fs.readFileSync(path.join(ROOT, '.git/HEAD'), 'utf8').trim();
  } catch {
    return 'unknown';
  }
}

function yamlLike(obj, indent = 0) {
  const pad = '  '.repeat(indent);
  if (obj === null || obj === undefined) return 'null\n';
  if (typeof obj !== 'object') return `${JSON.stringify(obj)}\n`;
  if (Array.isArray(obj)) {
    return obj.map((v) => `${pad}- ${String(yamlLike(v, indent + 1)).trim()}`).join('\n') + '\n';
  }
  return Object.entries(obj)
    .map(([k, v]) => {
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        return `${pad}${k}:\n${yamlLike(v, indent + 1)}`;
      }
      if (Array.isArray(v)) {
        return `${pad}${k}:\n${yamlLike(v, indent + 1)}`;
      }
      return `${pad}${k}: ${JSON.stringify(v)}`;
    })
    .join('\n');
}

main();
