#!/usr/bin/env node
/**
 * Mainnet Deployment Package — PREP (Timelock wait window)
 *
 * Prepares deploy-day artifacts WITHOUT Web3 Freeze or Gate state change.
 * Final package: node scripts/dev/generate-mainnet-deployment-package.cjs (after Freeze PASS)
 *
 *   node scripts/dev/prepare-mainnet-deployment-package-prep.cjs
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_readiness/mainnet-deployment-package');
const PREP_DIR = path.join(EVID_ROOT, `prep-${STAMP}`);
const TEMPLATE_ROOT = path.join(ROOT, 'docs/runbook/templates/mainnet-package');

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

function readGitHead() {
  try {
    return fs.readFileSync(path.join(ROOT, '.git/HEAD'), 'utf8').trim();
  } catch {
    return 'unknown';
  }
}

function copyTemplateDir() {
  if (!fs.existsSync(TEMPLATE_ROOT)) return [];
  const copied = [];
  const walk = (rel) => {
    const abs = path.join(TEMPLATE_ROOT, rel);
    for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
      const sub = rel ? `${rel}/${ent.name}` : ent.name;
      const src = path.join(TEMPLATE_ROOT, sub);
      const dest = path.join(PREP_DIR, sub);
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
  mkdirp(PREP_DIR);

  const copiedTemplates = copyTemplateDir();

  const dirs = [
    'MANIFEST',
    'wave-1-escrow-factory',
    'runbook',
    'owner-signoff',
    'verify',
    'rollback',
    'emergency-recovery',
    'registry-snapshot',
    'abi-snapshot',
    'deploy-scripts',
    'env',
    'evidence',
  ];
  for (const d of dirs) mkdirp(path.join(PREP_DIR, d));

  const registryFiles = [
    'registry/protocol-convergence-deployments.v1.yaml',
    'registry/escrow-bilateral-mainnet-policy.v1.yaml',
    'registry/mainnet-deployment-package.v1.yaml',
    'registry/web3-three-phase-closure-discipline.v1.yaml',
    'registry/web3-system-master-map.v1.yaml',
  ];
  const registrySnapshot = {};
  for (const rel of registryFiles) {
    const dest = path.join(PREP_DIR, 'registry-snapshot', path.basename(rel));
    registrySnapshot[rel] = {
      snapshotted: copyIfExists(rel, dest),
      sha256: sha256File(rel),
    };
  }

  const abiSnapshot = {};
  const abiDir = path.join(ROOT, 'contracts/abi');
  if (fs.existsSync(abiDir)) {
    for (const f of fs.readdirSync(abiDir).filter((x) => x.endsWith('.json')).sort()) {
      const rel = `contracts/abi/${f}`;
      copyIfExists(rel, path.join(PREP_DIR, 'abi-snapshot', f));
      abiSnapshot[f] = sha256File(rel);
    }
  }

  const deployScripts = [
    'contracts/script/DeployEscrowFactoryV2.s.sol',
    'contracts/script/DeployFundStackUnderTimelock.s.sol',
    'contracts/script/DeployGovernanceStack.s.sol',
    'contracts/script/DeployRegionStewardStakePool.s.sol',
    'contracts/script/DeployCountryPoolRedemptionEpochV0.s.sol',
    'scripts/dev/phase3-mainnet-broadcast-escrow-factory-v2.sh',
    'scripts/ops/runtime-chain-ssot-cast-verify.sh',
  ];
  for (const rel of deployScripts) {
    copyIfExists(rel, path.join(PREP_DIR, 'deploy-scripts', path.basename(rel)));
  }

  const abiVerify = spawnSync('bash', [path.join(ROOT, 'scripts/run-verify-abi-forge.sh')], {
    cwd: ROOT,
    encoding: 'utf8',
  });

  const manifestTemplate = {
    schema: 'traveltrust.mainnet_deployment_package_top_manifest_prep.v1',
    title: 'Mainnet Deployment Package — PREP manifest template',
    status: 'PREP_NOT_GENERATED',
    note: 'Replace with generated manifest after WEB3_FREEZE_PASS — do not broadcast from this file',
    prep_stamp: STAMP,
    prep_utc: new Date().toISOString(),
    git_head: readGitHead(),
    prerequisites_pending: {
      phase2_exit_review: 'PHASE2_EXIT_REVIEW_PASS',
      web3_freeze: 'WEB3_FREEZE_PASS',
      r01_third_party_audit: 'OPEN',
      shadow_launch: 'NOT_STARTED',
      owner_signoff: 'PENDING',
      mainnet_cutover_authorized: false,
    },
    rule_deploy_001: 'No Sepolia param swap — fill after Freeze from frozen bytecode',
    wave_1_escrow: {
      deploy_target: 'EscrowFactoryV2',
      v1_escrow_factory: 'FORBIDDEN on mainnet per registry/escrow-bilateral-mainnet-policy.v1.yaml',
      deploy_script: 'contracts/script/DeployEscrowFactoryV2.s.sol',
      broadcast_gate: 'scripts/dev/phase3-mainnet-broadcast-escrow-factory-v2.sh',
    },
    package_tree: {
      MANIFEST: 'manifest.json (generated at Freeze — this is manifest.template.json)',
      registry_snapshot: 'registry-snapshot/',
      abi_snapshot: 'abi-snapshot/',
      deploy_scripts: 'deploy-scripts/',
      wave_1_escrow_factory: 'wave-1-escrow-factory/',
      runbook: 'runbook/MAINNET-DEPLOYMENT-EXECUTION-V1.md',
      owner_signoff: 'owner-signoff/OWNER-SIGNOFF-PACKAGE.md',
      verify: 'verify/CONTRACT-VERIFY-PACKAGE.md · verify/EXPLORER-VERIFY-PACKAGE.md',
      rollback: 'rollback/MAINNET-ROLLBACK-PREP-V1.md',
      emergency_recovery: 'emergency-recovery/EMERGENCY-RECOVERY-PREP-V1.md',
      env_template: 'env/mainnet.env.template',
    },
    final_generator: 'node scripts/dev/generate-mainnet-deployment-package.cjs',
  };
  fs.writeFileSync(
    path.join(PREP_DIR, 'MANIFEST/manifest.template.json'),
    `${JSON.stringify(manifestTemplate, null, 2)}\n`,
  );

  const prepManifest = {
    schema: 'traveltrust.mainnet_deployment_package_prep.v1',
    recorded_utc: new Date().toISOString(),
    stamp: STAMP,
    prep_dir: path.relative(ROOT, PREP_DIR).replace(/\\/g, '/'),
    verdict: 'MAINNET_DEPLOYMENT_PACKAGE_PREP_COMPLETE',
    gate_impact: 'NONE — does not change Prerequisite / Exit / Freeze gates',
    status: 'PREP_NOT_GENERATED',
    components: {
      wave_1_escrow_factory: 'wave-1-escrow-factory/ESCROW-FACTORY-WAVE1-MAINNET-PREP.md',
      mainnet_deployment_runbook: 'runbook/MAINNET-DEPLOYMENT-EXECUTION-V1.md',
      owner_signoff_package: 'owner-signoff/OWNER-SIGNOFF-PACKAGE.md',
      deployment_manifest_template: 'MANIFEST/manifest.template.json',
      contract_verify_package: 'verify/CONTRACT-VERIFY-PACKAGE.md',
      explorer_verify_package: 'verify/EXPLORER-VERIFY-PACKAGE.md',
      rollback_package: 'rollback/MAINNET-ROLLBACK-PREP-V1.md',
      emergency_recovery_package: 'emergency-recovery/EMERGENCY-RECOVERY-PREP-V1.md',
    },
    registry_snapshot: registrySnapshot,
    abi_snapshot: abiSnapshot,
    abi_forge_verify: { ok: abiVerify.status === 0, exit: abiVerify.status ?? null },
    templates_copied: copiedTemplates,
    refs: {
      registry: 'registry/mainnet-deployment-package.v1.yaml',
      runbook: 'docs/runbook/MAINNET-DEPLOYMENT-PACKAGE-V1.md',
      template_root: 'docs/runbook/templates/mainnet-package/',
    },
    next_after_freeze: [
      'node scripts/dev/generate-mainnet-deployment-package.cjs',
      'bash scripts/gates/check-mainnet-deployment-package-gate.sh',
      'Owner signoff in owner-signoff/',
    ],
  };

  const json = `${JSON.stringify(prepManifest, null, 2)}\n`;
  fs.writeFileSync(path.join(PREP_DIR, 'MAINNET-DEPLOYMENT-PACKAGE-PREP.json'), json);
  fs.writeFileSync(path.join(EVID_ROOT, 'MAINNET-DEPLOYMENT-PACKAGE-PREP-LATEST.json'), json);

  const md = `# Mainnet Deployment Package — PREP

**Verdict:** \`MAINNET_DEPLOYMENT_PACKAGE_PREP_COMPLETE\`  
**Status:** \`PREP_NOT_GENERATED\` — **does not change any Gate**  
**Stamp:** ${STAMP}

Timelock wait window prep. Final SSOT after \`WEB3_FREEZE_PASS\`: \`generate-mainnet-deployment-package.cjs\`.

## Components (8)

| # | Package | Path |
|---|---------|------|
| 1 | Escrow Factory Wave-1 (V2 · V1 FORBIDDEN) | \`wave-1-escrow-factory/\` |
| 2 | Mainnet Deployment Runbook | \`runbook/MAINNET-DEPLOYMENT-EXECUTION-V1.md\` |
| 3 | Owner Sign-off Package | \`owner-signoff/\` |
| 4 | Deployment Manifest (template) | \`MANIFEST/manifest.template.json\` |
| 5 | Contract Verify Package | \`verify/CONTRACT-VERIFY-PACKAGE.md\` |
| 6 | Explorer Verify Package | \`verify/EXPLORER-VERIFY-PACKAGE.md\` |
| 7 | Rollback Package | \`rollback/\` |
| 8 | Emergency Recovery Package | \`emergency-recovery/\` |

## After Freeze

\`\`\`bash
node scripts/dev/generate-mainnet-deployment-package.cjs
\`\`\`
`;
  fs.writeFileSync(path.join(PREP_DIR, 'MAINNET-DEPLOYMENT-PACKAGE-PREP.md'), md);
  fs.writeFileSync(path.join(EVID_ROOT, 'MAINNET-DEPLOYMENT-PACKAGE-PREP-LATEST.md'), md);

  console.log(
    JSON.stringify(
      {
        verdict: prepManifest.verdict,
        status: prepManifest.status,
        gate_impact: prepManifest.gate_impact,
        prep_dir: prepManifest.prep_dir,
        abi_forge_verify: prepManifest.abi_forge_verify.ok,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

main();
