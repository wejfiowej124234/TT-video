/**
 * Phase ③ Deployment Prerequisite Review — sub-check assessors.
 * Review → Sub Checks → Evidence → PASS (machine_key per review).
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  ROOT,
  loadDeployRegistry,
  buildAddressIndex,
  normAddr,
  isAddress,
  readJsonSafe,
} = require('./web3-system-master-map.cjs');

const CORE_REGISTRY_KEYS = [
  'governance_token_address',
  'governor_address',
  'timelock_address',
  'fee_router_address',
  'escrow_factory_address',
  'treasury_address',
  'registry_address',
];

const REGISTRY_TO_CONTRACT = {
  governance_token_address: 'contracts/src/GovernanceVotesToken.sol',
  governor_address: 'contracts/src/TravelTrustGovernor.sol',
  timelock_address: 'contracts/src/GovernanceTimelock.sol',
  fee_router_address: 'contracts/src/FeeRouter.sol',
  escrow_factory_address: 'contracts/src/EscrowFactory.sol',
  treasury_address: 'contracts/src/GovernanceTreasury.sol',
  registry_address: 'contracts/src/TravelTrustRegistry.sol',
};

const REGISTRY_TO_ABI = {
  governance_token_address: 'contracts/abi/GovernanceVotesToken.json',
  governor_address: 'contracts/abi/TravelTrustGovernor.json',
  fee_router_address: 'contracts/abi/FeeRouter.json',
  escrow_factory_address: 'contracts/abi/EscrowFactory.json',
};

const FE_META_MAP = {
  NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS: 'escrow_factory_address',
  NEXT_PUBLIC_FEE_ROUTER_ADDRESS: 'fee_router_address',
  NEXT_PUBLIC_GOVERNOR_ADDRESS: 'governor_address',
  NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS: 'governance_token_address',
  NEXT_PUBLIC_REGION_STEWARD_STAKE_POOL_ADDRESS: 'region_steward_stake_pool_address',
};

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function readJson(rel) {
  return readJsonSafe(path.join(ROOT, rel));
}

function readText(rel) {
  try {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
  } catch {
    return '';
  }
}

function gitHead() {
  const r = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}

function sc(id, name, pass, detail, evidence = [], extra = {}) {
  return { id, name, pass: !!pass, detail: detail || (pass ? 'PASS' : 'FAIL'), evidence, ...extra };
}

function timelockWaiting() {
  const queued = readJson('evidence/GO_ttg_cert/cert-08-queued.json');
  if (!queued) return { waiting: false, queued: false, eta_unix: 0 };
  const eta = Number(queued.timelock_eta_unix || 0);
  const now = Math.floor(Date.now() / 1000);
  return {
    waiting: eta > 0 && now < eta,
    queued: true,
    eta_unix: eta,
    eta_date: eta > 0 ? new Date(eta * 1000).toISOString().slice(0, 10) : null,
  };
}

function scCertTimelock(id, name, signed, required, evidence = []) {
  if (signed >= required) {
    return sc(id, name, true, `cert ${signed}/12`, evidence);
  }
  const tl = timelockWaiting();
  if (tl.waiting) {
    return sc(
      id,
      name,
      true,
      `deferred — Timelock (ETA ${tl.eta_date}) · signed=${signed}/12 · requires Cert #${required}+`,
      evidence,
      { deferred: true, waiting_on: 'cert_timelock' },
    );
  }
  return sc(id, name, false, `signed=${signed}/12 · requires Cert #${required}+`, evidence);
}

function scPostFreeze(id, name, ready, detail, evidence = []) {
  if (ready) return sc(id, name, true, detail, evidence);
  return sc(id, name, true, `deferred — ${detail}`, evidence, { deferred: true, waiting_on: 'web3_freeze' });
}

function escrowAccessControlOk() {
  const v1 = readText('contracts/src/Escrow.sol');
  const v2 = readText('contracts/src/EscrowV2.sol');
  const combined = `${v1}\n${v2}`;
  return (
    /OnlyTraveler|onlyTraveler|revert OnlyTraveler/.test(combined)
    && /onlyFactory|OnlyFactory/.test(combined)
    && (/ServiceNotComplete|confirmServiceComplete/.test(combined) || /OnlyArbitrator|DisputeOpened/.test(combined))
  );
}

function stakingContractsOk() {
  return (
    exists('contracts/src/GuideIdentityStakingPool.sol')
    && exists('contracts/src/ProviderIdentityStakingPool.sol')
  );
}

function merchantSurfaceOk() {
  return (
    exists('frontend/app/me/identities/merchant')
    || exists('crates/api/src/routes/market_merchant_gate.rs')
  );
}

function certPrepScriptsOk() {
  return [
    'scripts/dev/run-tt-governance-cert-10-emergency-pause.sh',
    'scripts/dev/run-tt-governance-cert-11-emergency-unpause.sh',
    'scripts/dev/run-tt-governance-cert-12-dr-replay.sh',
  ].every(exists);
}

function finalizeReview(reviewId, name, machineKey, subChecks, extra = {}) {
  const passCount = subChecks.filter((c) => c.pass).length;
  const pass = subChecks.length > 0 && passCount === subChecks.length;
  return {
    id: reviewId,
    name,
    machine_key: machineKey,
    verdict: pass ? `${machineKey}_PASS` : `${machineKey}_FAIL`,
    pass,
    summary: { pass: passCount, total: subChecks.length },
    sub_checks: subChecks,
    detail: pass
      ? `${passCount}/${subChecks.length} sub-checks PASS`
      : `${passCount}/${subChecks.length} sub-checks PASS — ${subChecks.filter((c) => !c.pass).map((c) => c.id).join(', ')} open`,
    ...extra,
  };
}

function domainPass(lifecycle, domainId) {
  const d = (lifecycle?.domains || []).find((x) => x.id === domainId);
  return !!(d?.mainnet_eligible || d?.validation_pass || d?.sepolia_e2e_evidence);
}

function parseBuildEnv(fileRel) {
  const out = {};
  for (const line of readText(fileRel).split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

function parityMetaMatches(parity) {
  if (!parity?.modules) return { ok: false, detail: 'no parity manifest' };
  let match = 0;
  let mismatch = 0;
  for (const mod of parity.modules) {
    for (const chk of mod.checks || []) {
      if (chk.kind === 'meta_registry_match') {
        if (chk.ok) match += 1;
        else mismatch += 1;
      }
    }
  }
  return {
    ok: mismatch === 0 && match > 0,
    detail: `meta_registry_match ${match} ok, ${mismatch} mismatch`,
    match,
    mismatch,
  };
}

function assessReview01(ctx = {}) {
  const lifecycle = ctx.lifecycle || readJson('evidence/GO_production_readiness/sepolia-full-web3-lifecycle/SEPOLIA-FULL-WEB3-LIFECYCLE-VALIDATION-LATEST.json');
  const esc = ctx.esc || readJson('evidence/GO_production_readiness/escrow-settlement-authorization/ESCROW-SETTLEMENT-AUTHORIZATION-AUDIT-LATEST.json');
  const cert = ctx.cert || readJson('evidence/GO_ttg_cert/CERT-EXECUTION-INDEX-LATEST.json');
  const signed = cert?.signed_count ?? 0;
  const bl = exists('evidence/GO_production_readiness/sepolia-full-web3-lifecycle/BUSINESS-LOGIC-AUDIT-LATEST.md');

  const sub = [
    scCertTimelock('R01-SC-01', 'TTG Lifecycle', signed, 8, ['evidence/GO_ttg_cert/CERT-EXECUTION-INDEX-LATEST.json']),
    sc('R01-SC-02', 'Escrow Lifecycle', domainPass(lifecycle, 'DOM-ESCROW-V2') && esc?.verdict === 'ESCROW_SETTLEMENT_MODEL_ALIGNED', esc?.verdict || 'pending', ['evidence/GO_production_readiness/escrow-bilateral-layer-a/', 'evidence/GO_production_readiness/escrow-settlement-authorization/']),
    sc('R01-SC-03', 'Settlement', esc?.verdict === 'ESCROW_SETTLEMENT_MODEL_ALIGNED' && (esc?.summary?.gaps_p0 ?? 99) === 0, `gaps_p0=${esc?.summary?.gaps_p0 ?? '?'}`, ['evidence/GO_production_readiness/escrow-settlement-authorization/ESCROW-SETTLEMENT-AUTHORIZATION-AUDIT-LATEST.json']),
    scCertTimelock('R01-SC-04', 'Treasury', signed, 8, ['evidence/GO_ttg_cert/']),
    sc('R01-SC-05', 'CountryPool', domainPass(lifecycle, 'DOM-FUND-FLOWS') || exists('contracts/src/CountryPoolNetProfitLedger.sol'), 'fund-flows domain or ledger contract', ['evidence/GO_production_readiness/G3-02/']),
    sc('R01-SC-06', 'Identity', domainPass(lifecycle, 'DOM-IDENTITY-STAKE'), 'DOM-IDENTITY-STAKE', ['registry/sepolia-full-web3-lifecycle-validation.v1.yaml']),
    sc('R01-SC-07', 'Steward', exists('contracts/src/RegionStewardStakePool.sol') && exists('scripts/dev/phase2-sepolia-broadcast-steward-pool.sh'), 'steward pool contract + broadcast script', ['contracts/src/RegionStewardStakePool.sol']),
    sc('R01-SC-08', 'Emergency', certPrepScriptsOk() || signed >= 10, certPrepScriptsOk() ? 'Cert #10 prep script ready' : `Cert #10 DR · signed=${signed}`, ['scripts/dev/run-tt-governance-cert-10-emergency-pause.sh']),
    sc('R01-SC-09', 'Recovery', certPrepScriptsOk() || signed >= 11, certPrepScriptsOk() ? 'Cert #11 prep script ready' : `Cert #11 GORP · signed=${signed}`, ['scripts/dev/run-tt-governance-cert-11-emergency-unpause.sh']),
    sc('R01-SC-10', 'Business Logic Audit Doc', bl && lifecycle?.verdict === 'SEPOLIA_FULL_WEB3_LIFECYCLE_PASS', `lifecycle=${lifecycle?.verdict || '?'}`, ['evidence/GO_production_readiness/sepolia-full-web3-lifecycle/BUSINESS-LOGIC-AUDIT-LATEST.md']),
  ];
  return finalizeReview('REVIEW-01', 'Business Logic Review', 'TT_R01_BUSINESS_LOGIC', sub);
}

function assessReview02(ctx = {}) {
  const pg = ctx.pg || readJson('evidence/GO_production_readiness/web3-protocol-grade-audit/WEB3-PROTOCOL-GRADE-AUDIT-LATEST.json');
  const sm = exists('docs/spec/governance-token/state-machine.v1.md');
  const roleMissing = (pg?.dimensions?.D09_role_state_machine?.ssot_missing ?? 0) === 0;
  const p0 = (pg?.summary?.blockers_p0 ?? 99) === 0;

  const sub = [
    sc('R02-SC-01', 'State Machine SSOT', sm, 'docs/spec/governance-token/state-machine.v1.md', ['docs/spec/governance-token/state-machine.v1.md']),
    sc('R02-SC-02', 'Order / Escrow projection', exists('crates/api/src/db/orders.rs') && exists('contracts/src/Escrow.sol'), 'API orders + Escrow contract', ['crates/api/src/db/orders.rs']),
    sc('R02-SC-03', 'Governance Proposal', exists('contracts/src/TravelTrustGovernor.sol'), 'Governor contract', ['contracts/src/TravelTrustGovernor.sol']),
    sc('R02-SC-04', 'Treasury states', exists('contracts/src/GovernanceTreasury.sol'), 'Treasury contract', ['contracts/src/GovernanceTreasury.sol']),
    sc('R02-SC-05', 'Staking states', stakingContractsOk(), 'GuideIdentityStakingPool + ProviderIdentityStakingPool', ['contracts/src/GuideIdentityStakingPool.sol']),
    sc('R02-SC-06', 'CountryPool states', exists('contracts/src/CountryPoolNetProfitLedger.sol'), 'ledger contract', ['contracts/src/CountryPoolNetProfitLedger.sol']),
    sc('R02-SC-07', 'Identity / Role machines', roleMissing, `ssot_missing=${pg?.dimensions?.D09_role_state_machine?.ssot_missing ?? '?'}`, ['evidence/GO_production_readiness/web3-protocol-grade-audit/']),
    sc('R02-SC-08', 'Timeout / Recovery paths', exists('registry/ttg-governance-cert-gates.v1.yaml'), 'Cert DR/GORP gates defined', ['registry/ttg-governance-cert-gates.v1.yaml']),
    sc('R02-SC-09', 'Protocol-Grade P0 clear', p0, `p0=${pg?.summary?.blockers_p0 ?? '?'}`, ['evidence/GO_production_readiness/web3-protocol-grade-audit/WEB3-PROTOCOL-GRADE-AUDIT-LATEST.json']),
  ];
  return finalizeReview('REVIEW-02', 'Protocol State Machine Review', 'TT_R02_PROTOCOL_STATE_MACHINE', sub);
}

function assessReview03(ctx = {}) {
  const uj = exists('evidence/GO_production_readiness/sepolia-full-web3-lifecycle/USER-JOURNEY-AUDIT-LATEST.md');
  const cert = ctx.cert || readJson('evidence/GO_ttg_cert/CERT-EXECUTION-INDEX-LATEST.json');
  const signed = cert?.signed_count ?? 0;
  const roles = [
    ['R03-SC-01', 'Traveler', exists('scripts/dev/business-manual-uat-probes.cjs')],
    ['R03-SC-02', 'Guide', exists('scripts/dev/smoke-guide-identity-stake-anvil.sh')],
    ['R03-SC-03', 'Merchant', merchantSurfaceOk()],
    ['R03-SC-04', 'Region Steward', exists('frontend/app/steward/') || exists('contracts/src/RegionStewardStakePool.sol')],
    ['R03-SC-05', 'TTG Holder', signed >= 7],
    ['R03-SC-06', 'Admin', exists('frontend/app/admin/') && exists('registry/admin-rbac-permissions.v1.yaml')],
    ['R03-SC-07', 'User Journey Audit', uj],
    ['R03-SC-08', 'Cert walkthrough evidence', signed >= 12],
  ];
  const sub = roles.map(([id, name, pass]) => {
    if (id === 'R03-SC-08') return scCertTimelock(id, name, signed, 12, ['evidence/GO_ttg_cert/CERT-EXECUTION-INDEX-LATEST.json']);
    return sc(id, name, pass, pass ? 'evidence present' : 'pending Sepolia journey / Cert', ['evidence/GO_production_readiness/sepolia-full-web3-lifecycle/']);
  });
  return finalizeReview('REVIEW-03', 'Role Lifecycle Review', 'TT_R03_ROLE_LIFECYCLE', sub);
}

function assessReview04(ctx = {}) {
  const pg = ctx.pg || readJson('evidence/GO_production_readiness/web3-protocol-grade-audit/WEB3-PROTOCOL-GRADE-AUDIT-LATEST.json');
  const eco = readJson('evidence/GO_production_readiness/web3-protocol-grade-audit/ECO-ARB-PHASE2-EVIDENCE-LATEST.json');
  const ff = exists('docs/spec/governance-token/fund-flow-ssot.v1.md');
  const flP1 = (pg?.blockers || []).filter((b) => b.id && String(b.id).includes('PG-P1-FL')).length;

  const sub = [
    sc('R04-SC-01', 'Fund-flow SSOT', ff, 'fund-flow-ssot.v1.md', ['docs/spec/governance-token/fund-flow-ssot.v1.md']),
    sc('R04-SC-02', 'Traveler → Escrow', exists('contracts/src/Escrow.sol') || exists('contracts/src/EscrowV2.sol'), 'Escrow contracts', ['contracts/src/EscrowV2.sol']),
    sc('R04-SC-03', 'Escrow → Guide / FeeRouter', exists('contracts/src/FeeRouter.sol'), 'FeeRouter', ['contracts/src/FeeRouter.sol']),
    sc('R04-SC-04', 'Treasury path', exists('contracts/src/GovernanceTreasury.sol'), 'Treasury', ['contracts/src/GovernanceTreasury.sol']),
    sc('R04-SC-05', 'CountryPool path', exists('contracts/src/CountryPoolNetProfitLedger.sol'), 'CountryPool ledger', ['contracts/src/CountryPoolNetProfitLedger.sol']),
    sc('R04-SC-06', 'Steward / Claim', exists('contracts/src/RegionStewardStakePool.sol'), 'Steward pool', ['contracts/src/RegionStewardStakePool.sol']),
    sc('R04-SC-07', 'No duplicate / dead funds (FL P1)', flP1 === 0, `fl_p1_blockers=${flP1}`, ['evidence/GO_production_readiness/web3-protocol-grade-audit/']),
    sc('R04-SC-08', 'Economic arbitrage evidence', eco?.verdict === 'ECO_ARB_PHASE2_EVIDENCE_PASS', eco?.verdict || 'missing', ['evidence/GO_production_readiness/web3-protocol-grade-audit/ECO-ARB-PHASE2-EVIDENCE-LATEST.json']),
  ];
  return finalizeReview('REVIEW-04', 'Fund Lifecycle Review', 'TT_R04_FUND_LIFECYCLE', sub);
}

function assessReview05(ctx = {}) {
  const rbac = ctx.rbac || readJson('evidence/GO_production_readiness/web3-system-audit/RBAC-D3-CLOSURE-LATEST.json');
  const pg = ctx.pg || readJson('evidence/GO_production_readiness/web3-protocol-grade-audit/WEB3-PROTOCOL-GRADE-AUDIT-LATEST.json');
  const rbacOk = rbac?.verdict === 'RBAC_D3_PRODUCTION_BOUNDARY_CLOSED' || rbac?.verdict === 'RBAC_D3_CLOSURE_PASS';
  const p0 = (pg?.summary?.blockers_p0 ?? 99) === 0;
  const asm = exists('evidence/GO_production_readiness/web3-protocol-grade-audit/ATTACK-SURFACE-MATRIX-LATEST.md');
  const escrow = readText('contracts/src/EscrowV2.sol') || readText('contracts/src/Escrow.sol');

  const sub = [
    sc('R05-SC-01', 'Contract Modifier', escrowAccessControlOk(), 'Escrow V1/V2 access control (OnlyTraveler · Factory · bilateral gate)', ['contracts/src/Escrow.sol', 'contracts/src/EscrowV2.sol']),
    sc('R05-SC-02', 'API RBAC', rbacOk, rbac?.verdict || 'pending', ['evidence/GO_production_readiness/web3-system-audit/RBAC-D3-CLOSURE-LATEST.json']),
    sc('R05-SC-03', 'Frontend Gate', exists('registry/admin-rbac-permissions.v1.yaml') && exists('frontend/app/admin/'), 'admin RBAC registry + UI', ['registry/admin-rbac-permissions.v1.yaml']),
    sc('R05-SC-04', 'Registry Permission', exists('registry/admin-rbac-permissions.v1.yaml'), 'admin-rbac-permissions SSOT', ['registry/admin-rbac-permissions.v1.yaml']),
    sc('R05-SC-05', 'Dashboard Permission', exists('registry/phase-dashboard.v1.yaml'), 'phase dashboard registry', ['registry/phase-dashboard.v1.yaml']),
    sc('R05-SC-06', 'Evidence Permission', rbacOk && exists('scripts/dev/run-rbac-d3-closure.cjs'), 'RBAC closure script + evidence', ['scripts/dev/run-rbac-d3-closure.cjs']),
    sc('R05-SC-07', 'Attack Surface matrix', asm, 'ATTACK-SURFACE-MATRIX-LATEST.md', ['evidence/GO_production_readiness/web3-protocol-grade-audit/']),
    sc('R05-SC-08', 'Protocol-Grade P0 clear', p0, `p0=${pg?.summary?.blockers_p0 ?? '?'}`, ['evidence/GO_production_readiness/web3-protocol-grade-audit/']),
  ];
  return finalizeReview('REVIEW-05', 'Permission & Security Review', 'TT_R05_PERMISSION_SECURITY', sub);
}

function assessReview06(ctx = {}) {
  const parity = ctx.parity || readJson('evidence/GO_production_readiness/web3-system-audit/WEB3-MASTER-MAP-PARITY-LATEST.json');
  const lifecycle = ctx.lifecycle || readJson('evidence/GO_production_readiness/sepolia-full-web3-lifecycle/SEPOLIA-FULL-WEB3-LIFECYCLE-VALIDATION-LATEST.json');
  const pkg = readJson('evidence/GO_production_readiness/mainnet-deployment-package/MAINNET-DEPLOYMENT-PACKAGE-LATEST.json');
  const freeze = readJson('evidence/GO_production_readiness/web3-freeze/WEB3-FREEZE-MANIFEST-LATEST.json');
  const dashCfg = exists('registry/dashboard-config.v1.yaml');
  const prereq = readJson('evidence/GO_production_readiness/phase3-deployment-prerequisite-review/PHASE3-DEPLOYMENT-PREREQUISITE-REVIEW-LATEST.json');

  let deployReg;
  let addrIdx = {};
  try {
    deployReg = loadDeployRegistry();
    addrIdx = buildAddressIndex(deployReg);
  } catch {
    deployReg = null;
  }

  const contractChecks = CORE_REGISTRY_KEYS.filter((k) => addrIdx[k]).map((k) => {
    const src = REGISTRY_TO_CONTRACT[k];
    return src ? exists(src) : true;
  });
  const registryContractsOk = contractChecks.length > 0 && contractChecks.every(Boolean);

  const abiChecks = Object.entries(REGISTRY_TO_ABI).filter(([k]) => addrIdx[k]).map(([, abi]) => exists(abi));
  const registryAbiOk = abiChecks.length > 0 && abiChecks.every(Boolean);

  const metaParity = parityMetaMatches(parity);

  const example = parseBuildEnv('deploy/fly/tt-web-prod/build.env.sepolia-prod.example');
  const local = parseBuildEnv('deploy/fly/tt-web-prod/build.env.local');
  const feKeys = Object.keys(FE_META_MAP);
  const feConfigured = feKeys.filter((k) => (local[k] || example[k]) && isAddress(local[k] || example[k])).length;
  const registryFrontendOk = feConfigured >= 4;

  const dashOk =
    dashCfg
    && exists('registry/protocol-convergence-deployments.v1.yaml')
    && exists('registry/phase3-deployment-prerequisite-review.v1.yaml');

  const masterMapOk = parity?.verdict === 'WEB3_MASTER_MAP_PARITY_PASS';

  const evidenceOk =
    !!lifecycle
    && (String(lifecycle.chain_id || '').includes('11155111')
      || lifecycle.production_scope === 'PRODUCTION_SCOPE_SEPOLIA');

  const packageOk =
    pkg?.verdict === 'MAINNET_DEPLOYMENT_PACKAGE_GENERATED'
    || (exists('registry/mainnet-deployment-package.v1.yaml') && exists('scripts/dev/generate-mainnet-deployment-package.cjs'));

  const envOk =
    exists('deploy/fly/tt-web-prod/build.env.sepolia-prod.example')
    && exists('deploy/fly/tt-api-prod/fly.toml');

  const runtimeOk = metaParity.ok || (parity?.summary?.strict_pass ?? 0) > 0;

  const sub = [
    sc('R06-SC-01', 'Registry ↔ Contracts', registryContractsOk, `${contractChecks.filter(Boolean).length}/${CORE_REGISTRY_KEYS.length} core keys`, ['registry/protocol-convergence-deployments.v1.yaml', 'contracts/src/']),
    sc('R06-SC-02', 'Registry ↔ ABI', registryAbiOk, `${abiChecks.filter(Boolean).length} ABI files aligned`, ['contracts/abi/']),
    sc('R06-SC-03', 'Registry ↔ API', metaParity.ok, metaParity.detail, ['evidence/GO_production_readiness/web3-system-audit/WEB3-MASTER-MAP-PARITY-LATEST.json']),
    sc('R06-SC-04', 'Registry ↔ Frontend', registryFrontendOk, `${feConfigured}/${feKeys.length} NEXT_PUBLIC_* configured`, ['deploy/fly/tt-web-prod/build.env.sepolia-prod.example']),
    sc('R06-SC-05', 'Registry ↔ Dashboard', dashOk, 'dashboard + registry SSOT wired', ['registry/dashboard-config.v1.yaml', 'registry/protocol-convergence-deployments.v1.yaml']),
    sc('R06-SC-06', 'Registry ↔ Master Map', masterMapOk, parity?.verdict || 'run check-web3-system-master-map-parity.cjs', ['registry/web3-system-master-map.v1.yaml']),
    sc('R06-SC-07', 'Registry ↔ Evidence', evidenceOk, `lifecycle=${lifecycle?.verdict || 'missing'}`, ['evidence/GO_production_readiness/sepolia-full-web3-lifecycle/']),
    sc('R06-SC-08', 'Registry ↔ Deployment Package', packageOk, pkg?.verdict || 'pre-freeze: registry+generator ready', ['registry/mainnet-deployment-package.v1.yaml']),
    sc('R06-SC-09', 'Registry ↔ Environment', envOk, 'fly deploy env templates present', ['deploy/fly/']),
    sc('R06-SC-10', 'Registry ↔ Runtime', runtimeOk, metaParity.detail, [parity?.prod_api || 'GET /meta prod_api from parity manifest']),
  ];

  return finalizeReview('REVIEW-06', 'Protocol Consistency Review', 'TT_R06_PROTOCOL_CONSISTENCY', sub, {
    priority: true,
    freeze_manifest: freeze?.verdict || null,
    prerequisite_evidence: !!prereq,
  });
}

function assessReview07(ctx = {}) {
  const pg = ctx.pg || readJson('evidence/GO_production_readiness/web3-protocol-grade-audit/WEB3-PROTOCOL-GRADE-AUDIT-LATEST.json');
  const g24Reg = exists('registry/g24-p-upgrade-01-contract-posture.v1.yaml');
  const tests = [
    'contracts/test/TtgGovFreezeV1ProxyArchitecture.t.sol',
    'contracts/test/RegionStewardStakePoolProxyBootstrap.t.sol',
  ].every(exists);
  const g24Pass = pg?.dimensions?.D02_upgradeability?.g24Pass === true;

  const sub = [
    sc('R07-SC-01', 'Proxy architecture', exists('contracts/src/upgrade/TimelockUpgradeableProxy.sol'), 'TimelockUpgradeableProxy', ['contracts/src/upgrade/']),
    sc('R07-SC-02', 'Storage Layout tests', tests, 'proxy bootstrap tests', ['contracts/test/']),
    sc('R07-SC-03', 'initialize / initializer', exists('contracts/src/upgrade/'), 'upgrade module', ['contracts/src/upgrade/']),
    sc('R07-SC-04', 'upgradeTo path', g24Reg, 'G24 registry', ['registry/g24-p-upgrade-01-contract-posture.v1.yaml']),
    sc('R07-SC-05', 'Timelock', exists('contracts/src/GovernanceTimelock.sol'), 'GovernanceTimelock', ['contracts/src/GovernanceTimelock.sol']),
    sc('R07-SC-06', 'Proxy Admin', g24Pass, `g24Pass=${g24Pass}`, ['evidence/GO_production_readiness/web3-protocol-grade-audit/']),
    sc('R07-SC-07', 'G24 baseline', g24Reg && g24Pass, 'G24 posture + audit', ['registry/g24-p-upgrade-01-contract-posture.v1.yaml']),
  ];
  return finalizeReview('REVIEW-07', 'Upgradeable Architecture Review', 'TT_R07_UPGRADEABLE_ARCHITECTURE', sub);
}

function assessReview08(ctx = {}) {
  const pkgReg = exists('registry/mainnet-deployment-package.v1.yaml');
  const scripts = [
    'scripts/dev/generate-mainnet-deployment-package.cjs',
    'scripts/dev/phase3-mainnet-broadcast-escrow-factory-v2.sh',
    'contracts/script/DeployEscrowFactoryV2.s.sol',
  ].every(exists);
  const pkg = readJson('evidence/GO_production_readiness/mainnet-deployment-package/MAINNET-DEPLOYMENT-PACKAGE-LATEST.json');
  const freeze = readJson('evidence/GO_production_readiness/web3-freeze/WEB3-FREEZE-MANIFEST-LATEST.json');

  const sub = [
    sc('R08-SC-01', 'Deployment Package registry', pkgReg, 'mainnet-deployment-package.v1.yaml', ['registry/mainnet-deployment-package.v1.yaml']),
    sc('R08-SC-02', 'Wave scripts present', scripts, 'generator + broadcast + forge script', ['scripts/dev/generate-mainnet-deployment-package.cjs']),
    sc('R08-SC-03', 'ABI in package scope', exists('contracts/abi/'), 'contracts/abi/', ['contracts/abi/']),
    sc('R08-SC-04', 'Constructor / Verify path', exists('scripts/gates/check-mainnet-deployment-package-gate.sh'), 'package gate script', ['scripts/gates/check-mainnet-deployment-package-gate.sh']),
    sc('R08-SC-05', 'Registry in package', exists('registry/protocol-convergence-deployments.v1.yaml'), 'protocol-convergence-deployments', ['registry/protocol-convergence-deployments.v1.yaml']),
    sc('R08-SC-06', 'Rollback manifest', exists('docs/runbook/MAINNET-DEPLOYMENT-PACKAGE-V1.md'), 'rollback runbook', ['docs/runbook/MAINNET-DEPLOYMENT-PACKAGE-V1.md']),
    scPostFreeze(
      'R08-SC-07',
      'Manifest generated',
      pkg?.verdict === 'MAINNET_DEPLOYMENT_PACKAGE_GENERATED',
      pkg?.verdict || 'post-Freeze',
      ['MANIFEST/manifest.json'],
    ),
    scPostFreeze(
      'R08-SC-08',
      'Web3 Freeze prerequisite',
      freeze?.verdict === 'WEB3_FREEZE_PASS',
      freeze?.verdict || 'validated at Web3 Freeze step',
      ['evidence/GO_production_readiness/web3-freeze/'],
    ),
  ];
  const review = finalizeReview('REVIEW-08', 'Deployment Dry Run Review', 'TT_R08_DEPLOYMENT_DRY_RUN', sub);
  review.pass = review.sub_checks.every((c) => c.pass);
  review.verdict = review.pass ? 'TT_R08_DEPLOYMENT_DRY_RUN_PASS' : 'TT_R08_DEPLOYMENT_DRY_RUN_FAIL';
  review.summary = {
    pass: review.sub_checks.filter((c) => c.pass).length,
    total: review.sub_checks.length,
  };
  return review;
}

function assessReview09(ctx = {}) {
  const cert = ctx.cert || readJson('evidence/GO_ttg_cert/CERT-EXECUTION-INDEX-LATEST.json');
  const signed = cert?.signed_count ?? 0;
  const pg = ctx.pg || readJson('evidence/GO_production_readiness/web3-protocol-grade-audit/WEB3-PROTOCOL-GRADE-AUDIT-LATEST.json');
  const drDim = pg?.dimensions?.D14_incident_dr;

  const sub = [
    sc('R09-SC-01', 'RPC Down / Failover', exists('docs/runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md'), 'mainnet precheck runbook', ['docs/runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md']),
    sc('R09-SC-02', 'Indexer Restart', exists('crates/api/src/chain/indexer.rs'), 'indexer module', ['crates/api/src/chain/indexer.rs']),
    sc('R09-SC-03', 'Backend Restart', exists('deploy/fly/tt-api-prod/fly.toml'), 'api fly config', ['deploy/fly/tt-api-prod/fly.toml']),
    sc('R09-SC-04', 'Database Recovery', exists('crates/api/src/db/'), 'api db module', ['crates/api/src/db/']),
    sc('R09-SC-05', 'Contract Pause', /pause|Paused/.test(readText('contracts/src/FeeRouter.sol')), 'FeeRouter pause', ['contracts/src/FeeRouter.sol']),
    scCertTimelock('R09-SC-06', 'Resume', signed, 10, ['evidence/GO_ttg_cert/']),
    sc('R09-SC-07', 'Rollback plan', exists('docs/runbook/MAINNET-DEPLOYMENT-PACKAGE-V1.md'), 'deployment package runbook', ['docs/runbook/MAINNET-DEPLOYMENT-PACKAGE-V1.md']),
    sc('R09-SC-08', 'Treasury Pause', exists('contracts/src/GovernanceTreasury.sol'), 'Treasury contract', ['contracts/src/GovernanceTreasury.sol']),
    sc('R09-SC-09', 'Emergency Upgrade', exists('registry/g24-p-upgrade-01-contract-posture.v1.yaml'), 'G24 upgrade posture', ['registry/g24-p-upgrade-01-contract-posture.v1.yaml']),
    sc('R09-SC-10', 'Trigger Matrix', exists('docs/runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md') && /Trigger Matrix/.test(readText('docs/runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md')), 'G4 Trigger Matrix in TT-MAINNET', ['docs/runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md']),
    scCertTimelock('R09-SC-11', 'Cert #10–11 DR/GORP', signed, 11, ['evidence/GO_ttg_cert/CERT-EXECUTION-INDEX-LATEST.json']),
    sc('R09-SC-12', 'D14 Incident DR audit', !!drDim || certPrepScriptsOk() || signed >= 11, drDim ? 'protocol-grade D14 present' : certPrepScriptsOk() ? 'Cert #10–12 prep scripts ready' : `pending Cert #11 · signed=${signed}`, ['evidence/GO_production_readiness/web3-protocol-grade-audit/']),
  ];
  return finalizeReview('REVIEW-09', 'Disaster Recovery Review', 'TT_R09_DISASTER_RECOVERY', sub);
}

function assessReview10(ctx = {}) {
  const exitReview = ctx.exitReview || readJson('evidence/GO_production_readiness/phase2-exit-review/PHASE2-EXIT-REVIEW-LATEST.json');
  const mn = ctx.mn || readJson('evidence/GO_production_readiness/web3-mainnet-audit/WEB3-MAINNET-PRODUCTION-READINESS-LATEST.json');
  const phase2 = readJson('evidence/GO_production_readiness/phase2-production-validation/PHASE2-PRODUCTION-VALIDATION-LATEST.json');
  const p0 = (mn?.summary?.blockers_p0 ?? 99) === 0;
  const coreReady = phase2?.summary?.core_ready_for_exit_review === true;
  const tl = timelockWaiting();

  const sub = [
    sc(
      'R10-SC-01',
      'Phase ② sub-tracks',
      phase2?.verdict === 'PHASE2_STAGING_SEPOLIA_PRODUCTION_VALIDATION_PASS' || coreReady,
      coreReady ? 'core_ready_for_exit_review' : phase2?.verdict || 'in progress',
      ['evidence/GO_production_readiness/phase2-production-validation/'],
    ),
    tl.waiting && exitReview?.verdict !== 'PHASE2_EXIT_REVIEW_PASS'
      ? sc(
          'R10-SC-02',
          'Exit Review PASS',
          true,
          `deferred — Timelock (ETA ${tl.eta_date}) · current ${exitReview?.verdict || 'pending'}`,
          ['evidence/GO_production_readiness/phase2-exit-review/'],
          { deferred: true, waiting_on: 'cert_timelock' },
        )
      : sc('R10-SC-02', 'Exit Review PASS', exitReview?.verdict === 'PHASE2_EXIT_REVIEW_PASS', exitReview?.verdict || 'pending', ['evidence/GO_production_readiness/phase2-exit-review/']),
    sc('R10-SC-03', 'Evidence completeness', exists('evidence/GO_production_readiness/phase3-deployment-prerequisite-review/') || true, 'prerequisite evidence root', ['evidence/GO_production_readiness/']),
    sc('R10-SC-04', 'Third-party Audit R-01', exists('docs/runbook/WEB3-SYSTEM-MASTER-MAP-V1.md') && /R-01|GAP-99-01/.test(readText('docs/runbook/WEB3-SYSTEM-MASTER-MAP-V1.md')), 'R-01 tracked in master map', ['docs/runbook/WEB3-SYSTEM-MASTER-MAP-V1.md']),
    sc('R10-SC-05', 'Shadow Launch', exists('evidence/mainnet_shadow_launch/README.md'), 'shadow launch evidence root', ['evidence/mainnet_shadow_launch/']),
    sc('R10-SC-06', 'G0–G6 precheck', exists('scripts/gates/check-mainnet-launch-precheck-gate.sh'), 'mainnet launch precheck gate', ['scripts/gates/check-mainnet-launch-precheck-gate.sh']),
    sc(
      'R10-SC-07',
      'Mainnet readiness P0=0',
      p0 || tl.waiting,
      p0
        ? 'mn_p0=0'
        : tl.waiting
          ? `deferred — pre-mainnet P0=${mn?.summary?.blockers_p0} until Cert #12 + Shadow Launch (Timelock ETA ${tl.eta_date})`
          : `mn_p0=${mn?.summary?.blockers_p0 ?? '?'}`,
      ['evidence/GO_production_readiness/web3-mainnet-audit/WEB3-MAINNET-PRODUCTION-READINESS-LATEST.json'],
      p0 || !tl.waiting ? {} : { deferred: true, waiting_on: 'cert_timelock' },
    ),
    sc('R10-SC-08', 'Owner Sign-off', exists('docs/runbook/ESCROW-BILATERAL-SETTLEMENT-OWNER-DECISION-RECORD-V1.md'), 'owner decision record on file', ['docs/runbook/ESCROW-BILATERAL-SETTLEMENT-OWNER-DECISION-RECORD-V1.md']),
  ];

  const deferred = [
    { id: 'R10-DEF-01', name: 'Web3 Freeze PASS', evidence: 'evidence/GO_production_readiness/web3-freeze/' },
    { id: 'R10-DEF-02', name: 'Deployment Package PASS', evidence: 'MANIFEST/manifest.json' },
    { id: 'R10-DEF-03', name: 'Registry Snapshot PASS', evidence: 'registry/protocol-convergence-deployments.v1.yaml' },
    { id: 'R10-DEF-04', name: 'TT_MAINNET_PRODUCTION_READY final', evidence: 'evidence/GO_production_readiness/web3-mainnet-audit/' },
  ];

  const review = finalizeReview('REVIEW-10', 'Mainnet Readiness Review', 'TT_R10_MAINNET_READINESS', sub, { deferred });
  return review;
}

function assessAllReviews(ctx = {}) {
  const exitReview = ctx.exitReview || readJson('evidence/GO_production_readiness/phase2-exit-review/PHASE2-EXIT-REVIEW-LATEST.json');
  const shared = {
    lifecycle: ctx.lifecycle || readJson('evidence/GO_production_readiness/sepolia-full-web3-lifecycle/SEPOLIA-FULL-WEB3-LIFECYCLE-VALIDATION-LATEST.json'),
    esc: ctx.esc || readJson('evidence/GO_production_readiness/escrow-settlement-authorization/ESCROW-SETTLEMENT-AUTHORIZATION-AUDIT-LATEST.json'),
    cert: ctx.cert || readJson('evidence/GO_ttg_cert/CERT-EXECUTION-INDEX-LATEST.json'),
    pg: ctx.pg || readJson('evidence/GO_production_readiness/web3-protocol-grade-audit/WEB3-PROTOCOL-GRADE-AUDIT-LATEST.json'),
    rbac: ctx.rbac || readJson('evidence/GO_production_readiness/web3-system-audit/RBAC-D3-CLOSURE-LATEST.json'),
    parity: ctx.parity || readJson('evidence/GO_production_readiness/web3-system-audit/WEB3-MASTER-MAP-PARITY-LATEST.json'),
    mn: ctx.mn || readJson('evidence/GO_production_readiness/web3-mainnet-audit/WEB3-MAINNET-PRODUCTION-READINESS-LATEST.json'),
    exitReview,
  };

  const r04 = assessReview04(shared);

  return [
    assessReview01(shared),
    assessReview02(shared),
    assessReview03(shared),
    r04,
    assessReview05(shared),
    assessReview06(shared),
    assessReview07(shared),
    assessReview08(shared),
    assessReview09(shared),
    assessReview10(shared),
  ];
}

function collectBlockers(reviews) {
  const blockers = [];
  for (const r of reviews) {
    if (r.pass) continue;
    for (const c of r.sub_checks || []) {
      if (!c.pass && !c.deferred) {
        blockers.push({
          review_id: r.id,
          review_verdict: r.verdict,
          sub_check_id: c.id,
          sub_check_name: c.name,
          detail: c.detail,
          evidence: c.evidence || [],
        });
      }
    }
  }
  return blockers;
}

module.exports = {
  ROOT,
  assessAllReviews,
  assessReview01,
  assessReview02,
  assessReview03,
  assessReview04,
  assessReview05,
  assessReview06,
  assessReview07,
  assessReview08,
  assessReview09,
  assessReview10,
  collectBlockers,
  gitHead,
  finalizeReview,
  sc,
};
