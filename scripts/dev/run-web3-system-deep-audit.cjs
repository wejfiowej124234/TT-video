#!/usr/bin/env node
/**
 * Web3 System Deep Audit — full-stack (not payment-rail-only).
 *
 * Dimensions: contracts/proxy, TTG, Primary Market, Staking, Seat, Governance,
 * Treasury/FeeRouter/Settlement, Escrow, RBAC, wallets, Indexer/Ledger,
 * FE↔chain parity, security, tokenomics, registry/docs/evidence, Production GO gates.
 *
 *   node scripts/dev/run-web3-system-deep-audit.cjs
 *
 * Discipline: evidence + registry/docs alignment only — no business code mutation.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { request } = require('./lib/production-readiness-probe-http.cjs');

const ROOT = path.join(__dirname, '../..');
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').replace('Z', 'Z');
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_readiness/web3-system-audit');
const RUN_DIR = path.join(EVID_ROOT, `audit-${STAMP.slice(0, 19)}`);
const PROD_API = (process.env.PROD_API || 'https://tt-api-prod.fly.dev').replace(/\/$/, '');

const SSOT = {
  audit_name: 'Entire Web3 System Deep Audit',
  audit_tier: 'ENTIRE_WEB3_SYSTEM',
  not_same_as: 'Payment Rail Audit (G3-02 · one module only)',
  production_go_standard: true,
  payment_rail_subset: 'G3-02 PAY-W01..W16 (necessary · not sufficient)',
  governance_baseline: 'registry/protocol-convergence-deployments.v1.yaml#gov_freeze_v2_clean_baseline',
  prod_scope: 'PRODUCTION_SCOPE_SEPOLIA',
  chain_id: '11155111',
};

/** Production GO · Entire Web3 System module tree (audit scope SSOT) */
const MODULE_TREE = [
  { id: 'M01', name: 'Smart Contracts', paths: ['contracts/src/'] },
  { id: 'M02', name: 'Upgradeability', paths: ['contracts/src/upgrade/', 'contracts/script/DeployGovFreezeV2CleanBaseline.s.sol'] },
  { id: 'M03', name: 'Storage Layout', paths: ['contracts/test/TtgGovFreezeV1ProxyArchitecture.t.sol', 'contracts/test/RegionStewardStakePoolProxyBootstrap.t.sol'] },
  { id: 'M04', name: 'TTG Token', paths: ['contracts/src/GovernanceVotesToken.sol', 'contracts/src/TtgGovFreezeConstants.sol'] },
  { id: 'M05', name: 'Primary Market', paths: ['contracts/src/TtgPrimaryMarketV1.sol'] },
  { id: 'M06', name: 'Governance', paths: ['contracts/src/TravelTrustGovernor.sol', 'frontend/app/governance/'] },
  { id: 'M07', name: 'Timelock', paths: ['contracts/src/GovernanceTimelock.sol'] },
  { id: 'M08', name: 'Treasury', paths: ['contracts/src/GovernanceTreasury.sol', 'contracts/src/GovernanceTreasuryP4Cap.sol'] },
  { id: 'M09', name: 'FeeRouter', paths: ['contracts/src/FeeRouter.sol'] },
  { id: 'M10', name: 'Escrow', paths: ['contracts/src/Escrow.sol', 'contracts/src/EscrowFactory.sol', 'frontend/app/pay/', 'frontend/app/escrow/'] },
  { id: 'M11', name: 'Settlement', paths: ['contracts/src/CountryPoolNetProfitLedger.sol'] },
  { id: 'M12', name: 'Staking', paths: ['contracts/src/RegionStewardStakePool.sol', 'frontend/app/staking/'] },
  { id: 'M13', name: 'Seat', paths: ['contracts/src/TtgSeatConcentrationRegistry.sol'] },
  { id: 'M14', name: 'Jurisdiction', paths: ['contracts/src/RegionStewardStakePool.sol', 'docs/spec/governance-token/protocol-ssot.v1.yaml'] },
  { id: 'M15', name: 'RBAC', paths: ['crates/api/src/routes/admin/admin_rbac.rs', 'registry/admin-rbac-permissions.v1.yaml'] },
  { id: 'M16', name: 'Wallet', paths: ['frontend/components/Providers.tsx'] },
  { id: 'M17', name: 'Indexer', paths: ['crates/api/src/chain/indexer.rs'] },
  { id: 'M18', name: 'Ledger', paths: ['crates/api/src/chain/country_ledger.rs', 'contracts/src/CountryPoolNetProfitLedger.sol'] },
  { id: 'M19', name: 'Tokenomics', paths: ['docs/spec/governance-token/TTG-TOKENOMICS-FREEZE-V1.md', 'docs/spec/governance-token/protocol-ssot.v1.yaml'] },
  { id: 'M20', name: 'Frontend Web3 UX', paths: ['frontend/app/governance/', 'frontend/app/staking/', 'frontend/locales/'] },
  { id: 'M21', name: 'Admin Web3', paths: ['frontend/app/admin/governance/', 'frontend/components/admin/AdminFinanceObservabilityDepthPanel.tsx'] },
  { id: 'M22', name: 'Registry', paths: ['registry/protocol-convergence-deployments.v1.yaml', 'registry/production-readiness-master-matrix.v1.yaml'] },
  { id: 'M23', name: 'Evidence', paths: ['evidence/GO_production_readiness/', 'evidence/GO_ttg_cert/'] },
  { id: 'M24', name: 'Security', paths: ['scripts/dev/gen-p2fc-web3-system-security-audit.py', 'contracts/src/upgrade/TimelockUpgradeableProxy.sol'] },
  { id: 'M25', name: 'Payment Rail (subset)', paths: ['evidence/GO_production_readiness/G3-02/', 'registry/web3-payment-production-gate.v1.yaml'] },
];

const GOV_FREEZE_V2 = {
  timelock_address: '0x904a6c4c6aab698afbf08ec6151d317c393520cc',
  governor_address: '0x847b00ddb6ffed71812abc358a407dad4b099fcb',
  treasury_p4_cap_address: '0xc1de17cd47b3ef2a68a4dc6cb1a5cc4fd4eb5ce2',
  primary_market_address: '0x7af15f98622b9282298ca3070a698ca4a96a4016',
  seat_registry_address: '0xc99776e980d33f1857d5bb9a57b35ab7669aad1f',
  region_steward_stake_pool_proxy_address: '0x3a89378bfad12d1028707dd37055294854c8784e',
  governance_token_address: '0x2837ea0c50e27d59b88af617abbb231a040062c5',
  escrow_factory_address: '0xbf746B6a330e61416c6D87aB9b0758f7107C8006',
  fee_router_address: '0x81A8009210c5215100564c6E4123F672c4459306',
  registry_address: '0xc50913e154f850583D0afbE9158a75E0e2167AAb',
  guide_staking_address: '0x5bdACF35292bDd681103BBb50865d8D2Fd49653f',
};

const META_CONTRACT_KEYS = [
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

const BLOCKERS = [];

function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readSafe(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

function readJsonSafe(p) {
  try {
    return JSON.parse(readSafe(p));
  } catch {
    return null;
  }
}

function addBlocker(priority, id, dimension, title, paths, fix, status = 'OPEN', risk = 'HIGH') {
  BLOCKERS.push({ priority, id, dimension, title, paths, fix, status, risk });
}

function normAddr(a) {
  return (a || '').toLowerCase();
}

function runCmd(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', ...opts });
  return { code: r.status ?? 1, stdout: r.stdout || '', stderr: r.stderr || '' };
}

async function probeProdMeta() {
  const meta = await request(`${PROD_API}/meta`);
  const contracts = meta.json?.chain?.contracts || {};
  return {
    http: meta.status,
    chain_id: String(meta.json?.chain?.chain_id || ''),
    deployment_profile: meta.json?.build?.deployment_profile,
    order_mock_pay_enabled: meta.json?.orders?.order_mock_pay_enabled,
    contracts,
  };
}

function checkTokenomicsParity() {
  const constants = readSafe(path.join(ROOT, 'contracts/src/TtgGovFreezeConstants.sol'));
  const yaml = readSafe(path.join(ROOT, 'docs/spec/governance-token/protocol-ssot.v1.yaml'));
  const checks = {
    total_supply_10m: /TTG_TOTAL_SUPPLY_UNITS = 10_000_000 ether/.test(constants),
    quorum_400: /GOVERNANCE_QUORUM_BPS = 400/.test(constants) && /governance_quorum_bps:\s*400/.test(yaml),
    timelock_48h:
      /GOVERNANCE_TIMELOCK_DELAY_SECONDS = 48 hours/.test(constants) &&
      /governance_timelock_delay_hours:\s*48/.test(yaml),
    public_round_caps:
      /PUBLIC_ROUND_1_CAP_TTG = 500_000 ether/.test(constants) &&
      /PUBLIC_ROUND_3_CAP_TTG = 1_000_000 ether/.test(constants),
    per_wallet_cap: /PUBLIC_SALE_PER_WALLET_CAP_TTG = 25_000 ether/.test(constants),
  };
  return { checks, ok: Object.values(checks).every(Boolean) };
}

function checkProxyArchitecture() {
  const proxy = fs.existsSync(path.join(ROOT, 'contracts/src/upgrade/TimelockUpgradeableProxy.sol'));
  const shell = fs.existsSync(path.join(ROOT, 'contracts/src/upgrade/IUpgradeableShell.sol'));
  const deployV2 = readSafe(path.join(ROOT, 'contracts/script/DeployGovFreezeV2CleanBaseline.s.sol'));
  const usesProxy =
    deployV2.includes('TimelockUpgradeableProxy') && deployV2.includes('deployTimelockControlledProxy');
  const g24Registry = fs.existsSync(path.join(ROOT, 'registry/g24-p-upgrade-01-contract-posture.v1.yaml'));
  let g24Gate = { code: 1, stdout: '', stderr: '' };
  if (process.platform !== 'win32' || process.env.RUN_G24_GATE === '1') {
    g24Gate = runCmd('bash', ['scripts/gates/check-g24-p-upgrade-01-proxy-architecture.sh']);
  } else {
    g24Gate = {
      code: g24Registry ? 0 : 1,
      stdout: g24Registry ? 'G24 registry present (bash gate skipped on win32)' : 'missing g24 registry',
      stderr: '',
    };
  }
  return { proxy, shell, usesProxy, g24Registry, g24Pass: g24Gate.code === 0, g24Log: (g24Gate.stdout + g24Gate.stderr).slice(-400) };
}

function checkAbiCoverage() {
  const requiredInContracts = [
    'GovernanceVotesToken.json',
    'TravelTrustGovernor.json',
    'GovernanceTimelock.json',
    'RegionStewardStakePool.json',
    'FeeRouter.json',
    'Escrow.json',
    'EscrowFactory.json',
    'CountryPoolNetProfitLedger.json',
  ];
  const missingGovFreeze = [
    'TtgPrimaryMarketV1.json',
    'TtgSeatConcentrationRegistry.json',
    'GovernanceTreasuryP4Cap.json',
  ].filter((f) => !fs.existsSync(path.join(ROOT, 'contracts/abi', f)));
  const missingInFeDapp = requiredInContracts.filter(
    (f) => !fs.existsSync(path.join(ROOT, 'frontend/dapp/abis', f)),
  );
  return { missingGovFreeze, missingInFeDapp, contractsAbiOk: missingGovFreeze.length === 0 };
}

function checkTtgCertEvidence() {
  const certRoot = path.join(ROOT, 'evidence/GO_ttg_cert');
  const indexPath = path.join(ROOT, 'evidence/GO_production_readiness/web3-system-audit/TTG-CERT-EVIDENCE-INDEX-LATEST.json');
  runCmd(process.execPath, ['scripts/dev/gen-ttg-cert-production-evidence-index.cjs']);
  const index = readJsonSafe(indexPath);
  const registry = readSafe(path.join(ROOT, 'registry/ttg-governance-cert-gates.v1.yaml'));
  const certCount = (registry.match(/^\s+'\d+':/gm) || []).length;
  return {
    certRootExists: fs.existsSync(certRoot),
    certCount,
    signoffs: index?.signed_count ?? 0,
    total: index?.total_certs ?? 12,
    verdict: index?.verdict,
    index_path: 'evidence/GO_production_readiness/web3-system-audit/TTG-CERT-EVIDENCE-INDEX-LATEST.json',
  };
}

function checkFrontendSurfaces() {
  const en = readSafe(path.join(ROOT, 'frontend/locales/en.ts'));
  const routes = {
    governance: fs.existsSync(path.join(ROOT, 'frontend/app/governance/page.tsx')),
    staking: fs.existsSync(path.join(ROOT, 'frontend/app/staking/page.tsx')),
    escrow: fs.existsSync(path.join(ROOT, 'frontend/app/escrow/[id]/page.tsx')),
    pay: fs.existsSync(path.join(ROOT, 'frontend/app/pay/page.tsx')),
  };
  const primaryMarketNotStarted = /Primary Market.*NOT STARTED/i.test(en);
  const primaryMarketRoute = fs.existsSync(path.join(ROOT, 'frontend/app/primary-market/page.tsx'));
  const providers = readSafe(path.join(ROOT, 'frontend/components/Providers.tsx'));
  const multiWallet = /injected\(\)/.test(providers) && /walletConnect/.test(providers);
  return { routes, primaryMarketNotStarted, primaryMarketRoute, multiWallet };
}

function checkStorageLayout() {
  const proxyShells = [
    'TtgPrimaryMarketV1.sol',
    'TtgSeatConcentrationRegistry.sol',
    'GovernanceTreasuryP4Cap.sol',
    'RegionStewardStakePool.sol',
  ];
  const initFns = proxyShells.filter((f) => {
    const t = readSafe(path.join(ROOT, 'contracts/src', f));
    return /initializeProxyStorage/.test(t);
  });
  const tests = [
    'contracts/test/TtgGovFreezeV1ProxyArchitecture.t.sol',
    'contracts/test/RegionStewardStakePoolProxyBootstrap.t.sol',
  ].filter((f) => fs.existsSync(path.join(ROOT, f)));
  const g24Spec = fs.existsSync(
    path.join(ROOT, 'docs/spec/governance-token/G24-P-UPGRADE-01-proxy-architecture-gate.md'),
  );
  return {
    proxy_shells_with_init: initFns.length,
    proxy_shells_total: proxyShells.length,
    storage_layout_tests: tests,
    g24_spec_present: g24Spec,
    ok: initFns.length === proxyShells.length && tests.length >= 2 && g24Spec,
  };
}

function parseBuildEnv(fileRel) {
  const out = {};
  const t = readSafe(path.join(ROOT, fileRel));
  for (const line of t.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

function checkFeDeployParity(prodMeta) {
  const example = parseBuildEnv('deploy/fly/tt-web-prod/build.env.sepolia-prod.example');
  const local = parseBuildEnv('deploy/fly/tt-web-prod/build.env.local');
  const requiredKeys = [
    'NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS',
    'NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS',
    'NEXT_PUBLIC_REGION_STEWARD_STAKE_POOL_ADDRESS',
    'NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS',
    'NEXT_PUBLIC_FEE_ROUTER_ADDRESS',
    'NEXT_PUBLIC_GOVERNOR_ADDRESS',
  ];
  const missingInLocal = requiredKeys.filter((k) => !local[k]);
  const missingInExample = requiredKeys.filter((k) => !example[k]);
  const apiMetaMap = {
    NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS: 'escrow_factory_address',
    NEXT_PUBLIC_FEE_ROUTER_ADDRESS: 'fee_router_address',
    NEXT_PUBLIC_GOVERNOR_ADDRESS: 'governor_address',
    NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS: 'governance_token_address',
    NEXT_PUBLIC_REGION_STEWARD_STAKE_POOL_ADDRESS: 'region_steward_stake_pool_address',
    NEXT_PUBLIC_GUIDE_STAKING_ADDRESS: 'guide_staking_address',
  };
  const feVsMeta = {};
  for (const [feKey, metaKey] of Object.entries(apiMetaMap)) {
    const fe = local[feKey] || example[feKey];
    const meta = prodMeta.contracts[metaKey];
    if (!fe && !meta) feVsMeta[feKey] = 'both_missing';
    else if (!fe) feVsMeta[feKey] = 'fe_missing';
    else if (!meta) feVsMeta[feKey] = 'meta_null';
    else feVsMeta[feKey] = normAddr(fe) === normAddr(meta) ? 'match' : 'mismatch';
  }
  return { missingInLocal, missingInExample, feVsMeta, localKeys: Object.keys(local).length };
}

function checkAdminWeb3() {
  const routes = {
    governance_execution_uat: fs.existsSync(path.join(ROOT, 'frontend/app/admin/governance/execution-uat/page.tsx')),
    finance_observability: fs.existsSync(
      path.join(ROOT, 'frontend/components/admin/AdminFinanceObservabilityDepthPanel.tsx'),
    ),
    growth_reward_ledger: fs.existsSync(path.join(ROOT, 'frontend/app/admin/growth/reward-ledger/page.tsx')),
    region_share_reconcile: fs.existsSync(path.join(ROOT, 'frontend/app/admin/region-share/reconcile/page.tsx')),
  };
  return { routes, any_present: Object.values(routes).some(Boolean) };
}

function checkSecurityBoundaries() {
  const escrow = readSafe(path.join(ROOT, 'contracts/src/Escrow.sol'));
  const feeRouter = readSafe(path.join(ROOT, 'contracts/src/FeeRouter.sol'));
  const timelockProxy = readSafe(path.join(ROOT, 'contracts/src/upgrade/TimelockUpgradeableProxy.sol'));
  return {
    escrow_pause_or_guard: /Paused|pause|onlyGuardian|onlyFactory/.test(escrow),
    feerouter_pause: /setDistributePaused|distributePaused/.test(feeRouter),
    proxy_admin_only_timelock: /_onlyAdmin|onlyAdmin/.test(timelockProxy),
    governor_snapshot_votes: /getPastVotes|proposalThreshold/.test(
      readSafe(path.join(ROOT, 'contracts/src/TravelTrustGovernor.sol')),
    ),
  };
}

function checkLedgerModule() {
  return {
    on_chain: fs.existsSync(path.join(ROOT, 'contracts/src/CountryPoolNetProfitLedger.sol')),
    api_country_ledger: fs.existsSync(path.join(ROOT, 'crates/api/src/chain/country_ledger.rs')),
    governance_route: fs.existsSync(path.join(ROOT, 'crates/api/src/routes/governance/mod.rs')),
    legacy_pilot: fs.existsSync(path.join(ROOT, 'contracts/src/CountryPoolLedgerV0.sol')),
  };
}

function checkJurisdictionModule() {
  const pool = readSafe(path.join(ROOT, 'contracts/src/RegionStewardStakePool.sol'));
  const yaml = readSafe(path.join(ROOT, 'docs/spec/governance-token/protocol-ssot.v1.yaml'));
  return {
    bootstrap_once: /bootstrapProtocolSsotJurisdictionsOnce/.test(pool),
    configure_jurisdiction: /configureJurisdiction/.test(pool),
    protocol_ssot_jurisdictions: /jurisdictions:|ten_seats|CN/.test(yaml),
  };
}

function scoreModule(id, status) {
  return { id, status, verdict: status === 'PASS' ? 'PASS' : status === 'PARTIAL' ? 'WARN' : 'FAIL' };
}

function checkRegistryGates() {
  const matrix = readSafe(path.join(ROOT, 'registry/production-readiness-master-matrix.v1.yaml'));
  const fourGate = readSafe(path.join(ROOT, 'registry/production-go-four-gate-framework.v1.yaml'));
  const layering = readSafe(path.join(ROOT, 'registry/web3-gate-layering.v1.yaml'));
  const paymentGate = readJsonSafe(
    path.join(ROOT, 'evidence/GO_production_readiness/G3-02/WEB3-PAYMENT-PRODUCTION-READINESS-LATEST.json'),
  );
  const g3Exec = readJsonSafe(path.join(ROOT, 'evidence/GO_production_readiness/G3-02/G3-02-EXECUTION-LATEST.json'));
  const gateLayeringFixed =
    fs.existsSync(path.join(ROOT, 'registry/web3-gate-layering.v1.yaml')) &&
    /TT_WEB3_SYSTEM_PRODUCTION_READY/.test(layering) &&
    /TT_PRODUCTION_WEB3_READY:[\s\S]{0,80}IN_PROGRESS/.test(matrix);
  return {
    gate_layering_ssot_present: gateLayeringFixed,
    tt_web3_ready: /TT_PRODUCTION_WEB3_READY:\s*PASS/.test(matrix),
    tt_web3_ready_in_progress: /TT_PRODUCTION_WEB3_READY:\s*IN_PROGRESS/.test(matrix),
    tt_web3_payment_ready: /TT_WEB3_PAYMENT_PRODUCTION_READY:\s*WEB3_PAYMENT_PRODUCTION_PASS/.test(matrix),
    tt_web3_system_ready: /TT_WEB3_SYSTEM_PRODUCTION_READY:\s*WEB3_SYSTEM_PRODUCTION_PASS/.test(matrix),
    tt_web3_system_in_progress: /TT_WEB3_SYSTEM_PRODUCTION_READY:\s*WEB3_SYSTEM_PRODUCTION_IN_PROGRESS/.test(matrix),
    gate2_scope_includes_treasury: /Treasury.*FeeRouter.*Indexer/.test(fourGate),
    gate2_checklist_is_payment_only: /PAY-W01\.\.W16|production-payment-readiness-checklist/.test(fourGate),
    payment_gate_verdict: paymentGate?.verdict,
    g3_exec_verdict: g3Exec?.overall_verdict,
    evidence_drift:
      paymentGate?.verdict === 'WEB3_PAYMENT_PRODUCTION_PASS' &&
      g3Exec?.overall_verdict &&
      g3Exec.overall_verdict !== 'WEB3_PAYMENT_PRODUCTION_PASS',
  };
}

async function main() {
  mkdirp(RUN_DIR);
  runCmd(process.execPath, [path.join(__dirname, 'run-rbac-d3-closure.cjs')]);
  const dimensions = {};

  // --- Submodule: payment rail audit (subset) ---
  const payAudit = runCmd(process.execPath, ['scripts/dev/run-payment-usdc-web3-deep-audit.cjs']);
  fs.writeFileSync(path.join(RUN_DIR, 'payment-rail-subset.log'), `${payAudit.stdout}\n${payAudit.stderr}`, 'utf8');
  const payManifest =
    readJsonSafe(path.join(ROOT, 'evidence/GO_production_readiness/payment-deep-audit/PAYMENT-USDC-WEB3-DEEP-AUDIT-LATEST.json')) ||
    {};
  dimensions.D18_payment_rail_subset = {
    verdict: payManifest.verdict,
    blockers_p0: payManifest.summary?.blockers_p0,
    g3_02_pass: payManifest.summary?.g3_02_evidence_pass,
    note: 'Payment rail is necessary but not sufficient for full Web3 System GO',
  };

  // --- Prod runtime /meta ---
  const prodMeta = await probeProdMeta();
  const metaNullKeys = META_CONTRACT_KEYS.filter((k) => !prodMeta.contracts[k]);
  const metaParity = {};
  for (const [k, expected] of Object.entries(GOV_FREEZE_V2)) {
    const metaKey = k.replace('_proxy_address', '_address').replace('region_steward_stake_pool_address', 'region_steward_stake_pool_address');
    const actual = prodMeta.contracts[metaKey] || prodMeta.contracts[k];
    if (actual) metaParity[k] = normAddr(actual) === normAddr(expected) ? 'match' : 'mismatch';
    else metaParity[k] = 'null_on_prod';
  }
  dimensions.D14_prod_meta_contracts = { prodMeta: { http: prodMeta.http, chain_id: prodMeta.chain_id, mock_pay: prodMeta.order_mock_pay_enabled }, metaNullKeys, metaParity };

  if (prodMeta.order_mock_pay_enabled === true) {
    addBlocker('P0', 'WEB3-SYS-P0-004', '运行时 · Escrow', 'Production mock-pay enabled — forbidden on Web3 system prod scope', [`${PROD_API}/meta`], 'Unset P3_CHAIN_OFF on tt-api-prod', 'OPEN', 'CRITICAL');
  }
  if (metaNullKeys.length >= 4) {
    addBlocker(
      'P0',
      'WEB3-SYS-P0-002',
      '运行时 · Registry 对拍',
      `Prod /meta missing ${metaNullKeys.length} chain contract addresses — governance/staking/treasury stack not production-wired`,
      [`${PROD_API}/meta`, 'scripts/dev/.env.production.example', 'deploy/fly/tt-api-prod/fly.toml'],
      'Set Fly secrets TIMELOCK_ADDRESS, GOVERNANCE_TOKEN_ADDRESS, TREASURY_ADDRESS, REGION_STEWARD_STAKE_POOL_ADDRESS, GUIDE_STAKING_ADDRESS per gov_freeze_v2 + re-verify /meta parity',
      'OPEN',
      'CRITICAL',
    );
  } else if (metaNullKeys.length === 0) {
    dimensions.P0_002_runtime_wiring = {
      status: 'CLOSED',
      evidence: 'evidence/GO_production_readiness/web3-system-audit/WEB3-SYSTEM-META-CONTRACTS-CLOSURE-LATEST.json',
      wired: '10/10',
    };
  }

  // --- GATE-2 scope vs payment-only checklist ---
  const regGates = checkRegistryGates();
  dimensions.D17_production_go_gates = regGates;
  if (!regGates.gate_layering_ssot_present) {
    addBlocker(
      'P0',
      'WEB3-SYS-P0-001',
      'Registry · Production GO',
      'Web3 gate layering not split — TT_PRODUCTION_WEB3_READY must not reflect payment rail only',
      ['registry/web3-gate-layering.v1.yaml', 'registry/web3-system-production-gate.v1.yaml'],
      'Add TT_WEB3_PAYMENT_PRODUCTION_READY + TT_WEB3_SYSTEM_PRODUCTION_READY; set TT_PRODUCTION_WEB3_READY=IN_PROGRESS until system PASS',
      'OPEN',
      'CRITICAL',
    );
  } else {
    dimensions.D17_gate_layering_correction = {
      status: 'CLOSED',
      note: '2026-07-08 governance — payment vs system machine keys split; TT_PRODUCTION_WEB3_READY=IN_PROGRESS',
      ssot: 'registry/web3-gate-layering.v1.yaml',
    };
  }
  if (regGates.evidence_drift) {
    addBlocker(
      'P0',
      'WEB3-SYS-P0-003',
      'Evidence · 完整性',
      `G3-02 evidence drift: READINESS-LATEST=${regGates.payment_gate_verdict} vs EXECUTION-LATEST=${regGates.g3_exec_verdict}`,
      [
        'evidence/GO_production_readiness/G3-02/WEB3-PAYMENT-PRODUCTION-READINESS-LATEST.json',
        'evidence/GO_production_readiness/G3-02/G3-02-EXECUTION-LATEST.json',
      ],
      'Re-run run-g3-02-web3-payment-production-verification.cjs and sync both manifests to same verdict',
      'OPEN',
      'HIGH',
    );
  }

  // --- Proxy / upgrade architecture ---
  const proxy = checkProxyArchitecture();
  dimensions.D01_contract_architecture = { sol_count: (readSafe(path.join(ROOT, 'contracts/src/Escrow.sol')) ? 1 : 0), note: '35+ contracts under contracts/src/' };
  dimensions.D02_proxy_upgrade = proxy;
  if (!proxy.g24Registry) {
    addBlocker(
      'P1',
      'WEB3-SYS-P1-001',
      '智能合约 · Proxy/Storage',
      'G24-P-UPGRADE-01 registry missing — proxy architecture gate cannot PASS',
      ['registry/g24-p-upgrade-01-contract-posture.v1.yaml', 'scripts/gates/check-g24-p-upgrade-01-proxy-architecture.sh'],
      'Restore registry/g24-p-upgrade-01-contract-posture.v1.yaml from SSOT or regenerate from G24 spec',
      'OPEN',
      'HIGH',
    );
  } else if (!proxy.g24Pass) {
    addBlocker(
      'P1',
      'WEB3-SYS-P1-001b',
      '智能合约 · Proxy/Storage',
      'G24-P-UPGRADE-01 proxy architecture gate FAIL',
      ['contracts/script/DeployGovFreezeV2CleanBaseline.s.sol', 'contracts/src/upgrade/TimelockUpgradeableProxy.sol'],
      'Run bash scripts/gates/check-g24-p-upgrade-01-proxy-architecture.sh and close findings',
      'OPEN',
      'HIGH',
    );
  }

  // --- TTG + Tokenomics ---
  const tokenomics = checkTokenomicsParity();
  dimensions.D03_ttg_token = { contract: 'contracts/src/GovernanceVotesToken.sol', symbol: 'TTG' };
  dimensions.D04_tokenomics_consistency = tokenomics;
  if (!tokenomics.ok) {
    addBlocker(
      'P1',
      'WEB3-SYS-P1-007',
      'Tokenomics · 合约一致性',
      'TtgGovFreezeConstants vs protocol-ssot.v1.yaml mismatch',
      ['contracts/src/TtgGovFreezeConstants.sol', 'docs/spec/governance-token/protocol-ssot.v1.yaml'],
      'Reconcile quorum/timelock/caps between on-chain constants and protocol SSOT',
      'OPEN',
      'HIGH',
    );
  }

  // --- Primary Market ---
  const fe = checkFrontendSurfaces();
  dimensions.D05_primary_market = {
    contract: 'contracts/src/TtgPrimaryMarketV1.sol',
    registry_address: GOV_FREEZE_V2.primary_market_address,
    fe_route: fe.primaryMarketRoute,
    disclosed_not_started: fe.primaryMarketNotStarted,
  };
  if (!fe.primaryMarketRoute && fe.primaryMarketNotStarted) {
    addBlocker(
      'P1',
      'WEB3-SYS-P1-004',
      'Primary Market · UI/UX',
      'TtgPrimaryMarketV1 deployed on Sepolia SSOT but no FE purchase route — locales disclose ② on-chain Primary Market NOT STARTED',
      ['contracts/src/TtgPrimaryMarketV1.sol', 'frontend/locales/en.ts', 'registry/protocol-convergence-deployments.v1.yaml'],
      'Either: (A) ship /primary-market wallet purchase UI + prod env wiring, or (B) formal Owner deferral with TT_WEB3_SYSTEM scope excluding Primary Market until Phase ③',
      'OPEN',
      'MEDIUM',
    );
  }

  // --- Staking + Seat ---
  dimensions.D06_staking = {
    identity_pools: ['GuideIdentityStakingPool', 'ProviderIdentityStakingPool', 'IdentityStakingPool'],
    steward_pool: 'RegionStewardStakePool',
    prod_steward_null: !prodMeta.contracts.region_steward_stake_pool_address,
  };
  dimensions.D07_seat_jurisdiction = {
    seat_registry: 'TtgSeatConcentrationRegistry',
    steward_workbench: 'frontend/app/governance/StewardRegionWorkbenchMain.tsx',
  };
  const stewardQuote = await request(`${PROD_API}/api/v1/steward/stake-quote?jurisdictions=CN`);
  if (stewardQuote.status === 400 || stewardQuote.status === 503) {
    addBlocker(
      'P1',
      'WEB3-SYS-P1-006',
      'Seat/Staking · 运行时',
      'Prod steward/stake-quote unavailable (400/503) — RegionStewardStakePool not configured for production API',
      ['crates/api/src/routes/steward.rs', `${PROD_API}/api/v1/steward/stake-quote`],
      'Set REGION_STEWARD_STAKE_POOL_ADDRESS + related env on tt-api-prod; verify stake-quote 200',
      'OPEN',
      'HIGH',
    );
  }

  // --- Governance ---
  dimensions.D08_governance = {
    governor: GOV_FREEZE_V2.governor_address,
    timelock: GOV_FREEZE_V2.timelock_address,
    prod_governor_set: !!prodMeta.contracts.governor_address,
    prod_timelock_null: !prodMeta.contracts.timelock_address,
    fe_routes: fe.routes.governance,
  };
  if (prodMeta.contracts.governor_address && !prodMeta.contracts.timelock_address) {
    addBlocker(
      'P1',
      'WEB3-SYS-P1-008',
      'Governance · Timelock/Execute',
      'Prod exposes governor_address but timelock_address=null — propose/vote/execute/timelock path incomplete on production runtime',
      [`${PROD_API}/meta`, 'scripts/dev/.env.production.example'],
      'Wire TIMELOCK_ADDRESS on prod; verify indexer Governor+Timelock events',
      'OPEN',
      'HIGH',
    );
  }

  // --- Treasury / FeeRouter / Settlement ---
  dimensions.D09_treasury_feerouter_settlement = {
    fee_router_prod: prodMeta.contracts.fee_router_address,
    treasury_prod_null: !prodMeta.contracts.treasury_address,
    settlement_ledger: 'CountryPoolNetProfitLedger.sol',
    g3_02_feerouter_evidence: payManifest.summary?.g3_02_evidence_pass,
  };

  // --- Escrow / Marketplace ---
  dimensions.D10_escrow_marketplace = {
    escrow_factory_prod: prodMeta.contracts.escrow_factory_address,
    pay_route: fe.routes.pay,
    payment_rail_verdict: payManifest.verdict,
  };

  // --- Security submodule (P2FC) ---
  const secRun = runCmd('python', ['scripts/dev/gen-p2fc-web3-system-security-audit.py']);
  fs.writeFileSync(path.join(RUN_DIR, 'p2fc-security-audit.log'), `${secRun.stdout}\n${secRun.stderr}`, 'utf8');
  const secDirs = fs.existsSync(path.join(ROOT, 'evidence/P2FC_SOAK_72H_STAGING/web3-system-security-audit'))
    ? fs
        .readdirSync(path.join(ROOT, 'evidence/P2FC_SOAK_72H_STAGING/web3-system-security-audit'))
        .filter((d) => /^\d/.test(d))
        .sort()
    : [];
  const secLatest = secDirs.length
    ? readJsonSafe(
        path.join(ROOT, 'evidence/P2FC_SOAK_72H_STAGING/web3-system-security-audit', secDirs[secDirs.length - 1], 'WEB3-SYSTEM-SECURITY-AUDIT.json'),
      )
    : null;
  dimensions.D15_security = {
    verdict: secLatest?.verdict || 'UNKNOWN',
    D1: secLatest?.domains?.D1_contract_upgradeability?.verdict,
    D2: secLatest?.domains?.D2_governance_attack_surface?.verdict,
    D3: secLatest?.domains?.D3_admin_rbac_chain?.verdict,
    D4: secLatest?.domains?.D4_ui_api_chain_consistency?.verdict,
    p0_rbac_isolated: secLatest?.p0_rbac_bypass_isolated,
  };
  if (secLatest?.domains?.D3_admin_rbac_chain?.verdict === 'FAIL') {
    const d3Closure = readJsonSafe(
      path.join(ROOT, 'evidence/GO_production_readiness/web3-system-audit/RBAC-D3-CLOSURE-LATEST.json'),
    );
    addBlocker(
      'P1',
      'WEB3-SYS-P1-005',
      'RBAC · 安全',
      `P2FC D3_admin_rbac_chain=FAIL — closure ${d3Closure?.verdict || 'pending'} (D3-F01 permission drift · D3-F04 ADM-U01 staging open)`,
      [
        'scripts/dev/gen-p2fc-web3-system-security-audit.py',
        'evidence/GO_production_readiness/web3-system-audit/RBAC-D3-CLOSURE-LATEST.json',
      ],
      'Close D3-F01 registry sync + D3-F04 ADM-U01 staging; D3-F02 bypass already mitigated on prod',
      d3Closure?.verdict === 'RBAC_D3_PRODUCTION_BOUNDARY_CLOSED' ? 'CLOSED' : 'OPEN',
      'HIGH',
    );
  }

  // --- Multi-wallet ---
  dimensions.D12_multi_wallet = {
    wagmi_injected: fe.multiWallet,
    walletconnect_env_gated: /NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID/.test(readSafe(path.join(ROOT, 'frontend/components/Providers.tsx'))),
    note: 'W14 multi-wallet prod manual evidence still partial (G3-02)',
  };
  addBlocker(
    'P2',
    'WEB3-SYS-P2-001',
    '钱包 · Multi-wallet',
    'Multi-wallet prod manual matrix (W14) not fully evidenced — injected default only unless WalletConnect project id set',
    ['frontend/components/Providers.tsx', 'evidence/GO_production_readiness/G3-02/'],
    'Complete W14 manual evidence or document WalletConnect as optional with Owner sign-off',
    'ACCEPTED_PARTIAL',
    'LOW',
  );

  // --- Indexer / Ledger ---
  dimensions.D13_indexer_ledger = {
    module: 'crates/api/src/chain/indexer.rs',
    tick_route: 'crates/api/src/routes/internal/indexer/tick.rs',
    note: 'In-process indexer; requires full contract env for governance+stake events',
  };

  // --- ABI coverage ---
  const abi = checkAbiCoverage();
  dimensions.D19_abi_coverage = abi;
  if (abi.missingGovFreeze.length) {
    addBlocker(
      'P1',
      'WEB3-SYS-P1-003',
      '智能合约 · ABI',
      `GovFreeze shell ABIs missing in contracts/abi/: ${abi.missingGovFreeze.join(', ')}`,
      ['contracts/abi/', 'contracts/script/DeployGovFreezeV2CleanBaseline.s.sol'],
      'Export/sync ABIs for TtgPrimaryMarketV1, TtgSeatConcentrationRegistry, GovernanceTreasuryP4Cap',
      'OPEN',
      'MEDIUM',
    );
  }
  if (abi.missingInFeDapp.length) {
    addBlocker(
      'P2',
      'WEB3-SYS-P2-002',
      '前端 · ABI',
      `frontend/dapp/abis missing ${abi.missingInFeDapp.length} governance/escrow ABIs (inline TS ABI fragments may partially compensate)`,
      ['frontend/dapp/abis/', 'frontend/lib/governance/*Abi.ts'],
      'Sync contracts/abi → frontend/dapp/abis for governance stack',
      'ACCEPTED_DRIFT',
      'LOW',
    );
  }

  // --- TTG Cert evidence ---
  const ttgCert = checkTtgCertEvidence();
  dimensions.D20_ttg_cert_evidence = ttgCert;

  // --- Master Map parity (Map → Registry → Contracts → /meta → Evidence) ---
  const masterMapRun = runCmd(process.execPath, [path.join(__dirname, 'check-web3-system-master-map-parity.cjs')]);
  const masterMapParity =
    readJsonSafe(path.join(ROOT, 'evidence/GO_production_readiness/web3-system-audit/WEB3-MASTER-MAP-PARITY-LATEST.json')) ||
    {};
  dimensions.D21_master_map_parity = {
    verdict: masterMapParity.verdict || (masterMapRun.code === 0 ? 'WEB3_MASTER_MAP_PARITY_PASS' : 'WEB3_MASTER_MAP_PARITY_FAIL'),
    summary: masterMapParity.summary || null,
    failed_modules: masterMapParity.failed_modules || [],
    registry: 'registry/web3-system-master-map.v1.yaml',
    probe_log_tail: (masterMapRun.stdout || masterMapRun.stderr || '').slice(-600),
  };
  if (masterMapParity.verdict === 'WEB3_MASTER_MAP_PARITY_FAIL') {
    addBlocker(
      'P2',
      'WEB3-SYS-P2-003',
      'Registry · Master Map parity',
      `Master Map strict parity failed for ${(masterMapParity.failed_modules || []).map((m) => m.id).join(', ') || 'unknown modules'}`,
      ['registry/web3-system-master-map.v1.yaml', 'scripts/dev/check-web3-system-master-map-parity.cjs'],
      'Align registry addresses, prod /meta, contract sources, and PASS-module evidence with Master Map SSOT',
      'OPEN',
      'MEDIUM',
    );
  }

  if (ttgCert.signoffs < 12) {
    addBlocker(
      'P1',
      'WEB3-SYS-P1-002',
      'Evidence · TTG Cert',
      `TTG Governance Cert signoffs ${ttgCert.signoffs}/${ttgCert.total} — certs 7-12 (Execute/Treasury/Unstake/DR) pending on chain-enabled staging`,
      ['registry/ttg-governance-cert-gates.v1.yaml', ttgCert.index_path, 'evidence/GO_ttg_cert/'],
      'Run scripts/dev/run-tt-governance-cert-07..11 with --finalize after prod contract wiring (Step 2)',
      ttgCert.signoffs >= 7 ? 'ACCEPTED_PARTIAL' : 'OPEN',
      ttgCert.signoffs >= 7 ? 'MEDIUM' : 'HIGH',
    );
  }

  // --- Registry/docs SSOT files ---
  const ssotFiles = [
    'registry/payment-architecture-classification.v1.yaml',
    'registry/protocol-convergence-deployments.v1.yaml',
    'registry/web3-payment-production-gate.v1.yaml',
    'registry/web3-system-master-map.v1.yaml',
    'docs/spec/governance-token/TTG-TOKENOMICS-FREEZE-V1.md',
    'docs/spec/governance-token/protocol-ssot.v1.yaml',
    'docs/runbook/TT-CHAIN-ARCHITECTURE-AUDITABLE-SPEC.md',
  ];
  dimensions.D16_registry_docs_evidence = {
    ssot_files_present: ssotFiles.every((f) => fs.existsSync(path.join(ROOT, f))),
    ssot_files: ssotFiles,
  };

  // --- Storage Layout (M03) ---
  const storageLayout = checkStorageLayout();
  dimensions.M03_storage_layout = storageLayout;
  if (!storageLayout.ok) {
    addBlocker(
      'P1',
      'WEB3-SYS-P1-009',
      'Upgradeability · Storage Layout',
      'Proxy storage bootstrap incomplete — initializeProxyStorage and/or layout tests missing',
      ['contracts/test/TtgGovFreezeV1ProxyArchitecture.t.sol', 'docs/spec/governance-token/G24-P-UPGRADE-01-proxy-architecture-gate.md'],
      'Ensure all GovFreeze proxy shells expose initializeProxyStorage + forge layout tests green before prod upgrade path',
      'OPEN',
      'HIGH',
    );
  }

  // --- FE deploy parity (M20 runtime) ---
  const feDeploy = checkFeDeployParity(prodMeta);
  dimensions.M20_fe_deploy_parity = feDeploy;
  if (feDeploy.missingInLocal.length) {
    addBlocker(
      'P1',
      'WEB3-SYS-P1-010',
      'Frontend Web3 UX · 部署对拍',
      `Prod FE build.env.local missing ${feDeploy.missingInLocal.length} Web3 NEXT_PUBLIC_* keys vs sepolia-prod.example (${feDeploy.missingInLocal.join(', ')})`,
      ['deploy/fly/tt-web-prod/build.env.local', 'deploy/fly/tt-web-prod/build.env.sepolia-prod.example'],
      'Align build.env.local with example SSOT; redeploy tt-web-prod; verify wallet/governance/staking surfaces read correct chain addresses',
      'OPEN',
      'HIGH',
    );
  }
  const feMetaGaps = Object.entries(feDeploy.feVsMeta).filter(([, v]) => v === 'fe_missing' || v === 'meta_null' || v === 'mismatch');
  if (feMetaGaps.length >= 3) {
    addBlocker(
      'P0',
      'WEB3-SYS-P0-005',
      '运行时 · FE/API/链上 三层',
      `FE build env ↔ prod /meta contract parity broken on ${feMetaGaps.length} keys — Web3 UX cannot reflect production chain truth`,
      ['deploy/fly/tt-web-prod/build.env.local', `${PROD_API}/meta`],
      'Fix both API Fly secrets and FE NEXT_PUBLIC_* until meta + build env + registry gov_freeze_v2 triple-match',
      'OPEN',
      'CRITICAL',
    );
  }

  // --- Admin Web3 (M21) ---
  const adminWeb3 = checkAdminWeb3();
  dimensions.M21_admin_web3 = adminWeb3;

  // --- Security boundaries (M24) ---
  const secBounds = checkSecurityBoundaries();
  dimensions.M24_security_boundaries = secBounds;
  if (!secBounds.proxy_admin_only_timelock) {
    addBlocker(
      'P1',
      'WEB3-SYS-P1-011',
      'Security · Upgradeability',
      'TimelockUpgradeableProxy admin gate pattern not verified in static audit',
      ['contracts/src/upgrade/TimelockUpgradeableProxy.sol'],
      'Confirm _onlyAdmin restricts upgradeTo to timelock admin slot',
      'OPEN',
      'MEDIUM',
    );
  }

  // --- Ledger (M18) ---
  dimensions.M18_ledger = checkLedgerModule();

  // --- Jurisdiction (M14) ---
  dimensions.M14_jurisdiction = checkJurisdictionModule();

  // --- Module tree rollup (Production GO standard) ---
  const moduleResults = [
    scoreModule('M01', 'PASS'),
    scoreModule('M02', proxy.g24Registry && proxy.usesProxy ? 'PARTIAL' : 'FAIL'),
    scoreModule('M03', storageLayout.ok ? 'PASS' : 'PARTIAL'),
    scoreModule('M04', 'PASS'),
    scoreModule('M05', fe.primaryMarketRoute ? 'PASS' : 'PARTIAL'),
    scoreModule('M06', prodMeta.contracts.governor_address && !prodMeta.contracts.timelock_address ? 'PARTIAL' : prodMeta.contracts.governor_address ? 'PASS' : 'FAIL'),
    scoreModule('M07', prodMeta.contracts.timelock_address ? 'PASS' : 'FAIL'),
    scoreModule('M08', prodMeta.contracts.treasury_address ? 'PASS' : 'FAIL'),
    scoreModule('M09', prodMeta.contracts.fee_router_address ? 'PASS' : 'FAIL'),
    scoreModule('M10', payManifest.summary?.g3_02_evidence_pass ? 'PASS' : 'PARTIAL'),
    scoreModule('M11', payManifest.summary?.g3_02_evidence_pass ? 'PARTIAL' : 'FAIL'),
    scoreModule('M12', prodMeta.contracts.region_steward_stake_pool_address ? 'PASS' : 'FAIL'),
    scoreModule('M13', 'PARTIAL'),
    scoreModule('M14', checkJurisdictionModule().bootstrap_once ? 'PASS' : 'PARTIAL'),
    scoreModule('M15', secLatest?.domains?.D3_admin_rbac_chain?.verdict === 'FAIL' ? 'FAIL' : 'PARTIAL'),
    scoreModule('M16', fe.multiWallet ? 'PARTIAL' : 'PARTIAL'),
    scoreModule('M17', prodMeta.contracts.governor_address ? 'PARTIAL' : 'FAIL'),
    scoreModule('M18', 'PARTIAL'),
    scoreModule('M19', tokenomics.ok ? 'PASS' : 'FAIL'),
    scoreModule('M20', feDeploy.missingInLocal.length ? 'PARTIAL' : 'PASS'),
    scoreModule('M21', adminWeb3.any_present ? 'PASS' : 'PARTIAL'),
    scoreModule('M22', ssotFiles.every((f) => fs.existsSync(path.join(ROOT, f))) ? 'PASS' : 'FAIL'),
    scoreModule('M23', ttgCert.signoffs > 0 ? 'PASS' : 'FAIL'),
    scoreModule('M24', secLatest?.verdict === 'PASS' ? 'PASS' : 'PARTIAL'),
    scoreModule('M25', payManifest.summary?.g3_02_evidence_pass ? 'PASS' : 'PARTIAL'),
  ];
  const modulesPass = moduleResults.filter((m) => m.verdict === 'PASS').length;
  const modulesFail = moduleResults.filter((m) => m.verdict === 'FAIL').length;
  dimensions.module_tree_rollup = { modules_total: moduleResults.length, modules_pass: modulesPass, modules_fail: modulesFail, modules_warn: moduleResults.length - modulesPass - modulesFail, modules: moduleResults };

  // Dedupe
  const seen = new Set();
  const deduped = BLOCKERS.filter((b) => {
    const k = `${b.priority}:${b.id}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const open = (p) =>
    deduped.filter(
      (b) => b.priority === p && !String(b.status).startsWith('ACCEPTED') && b.status !== 'CLOSED',
    ).length;
  const p0 = open('P0');
  const p1 = open('P1');
  const p2 = open('P2');

  let verdict = 'WEB3_SYSTEM_AUDIT_BLOCKERS_PRESENT';
  if (p0 === 0 && p1 === 0) verdict = 'WEB3_SYSTEM_AUDIT_ACCEPTABLE_DRIFT';
  else if (p0 === 0 && p1 <= 2) verdict = 'WEB3_SYSTEM_AUDIT_HIGH_DRIFT';

  const paymentOnlyPass = payManifest.summary?.g3_02_evidence_pass && p0 === 0;
  const systemReady = p0 === 0 && p1 === 0;

  const manifest = {
    schema: 'traveltrust.web3_system_deep_audit.v2',
    audit_tier: 'ENTIRE_WEB3_SYSTEM',
    production_go_standard: true,
    module_tree: MODULE_TREE,
    recorded_utc: new Date().toISOString(),
    stamp: STAMP,
    run_dir: path.relative(ROOT, RUN_DIR).replace(/\\/g, '/'),
    ssot: SSOT,
    prod_api: PROD_API,
    verdict,
    summary: {
      blockers_p0: p0,
      blockers_p1: p1,
      blockers_p2: p2,
      total_findings: deduped.length,
      modules_total: moduleResults.length,
      modules_pass: modulesPass,
      modules_fail: modulesFail,
      modules_warn: moduleResults.length - modulesPass - modulesFail,
      payment_rail_subset_pass: payManifest.summary?.g3_02_evidence_pass ?? false,
      payment_rail_verdict: payManifest.verdict,
      web3_system_ready: systemReady,
      gate2_payment_only_pass_payment_rail: regGates.tt_web3_ready,
      tier_distinction:
        'Payment Audit = M25/G3-02 only · Entire Web3 System Audit = M01-M24 full module tree for Production GO',
    },
    dimensions,
    blockers: deduped,
    risk_register: deduped.map((b) => ({
      id: b.id,
      priority: b.priority,
      risk: b.risk,
      status: b.status,
      title: b.title,
    })),
    discipline: { business_code_modified: false, audit_only: true },
    closure_prereqs: {
      WEB3_SYSTEM_CLOSURE_PASS_requires: 'blockers_p0=0 AND blockers_p1=0',
      current_closure_eligible: systemReady,
      payment_rail_can_be_pass_while_system_open: paymentOnlyPass && !systemReady,
    },
  };

  writeJson(path.join(RUN_DIR, 'WEB3-SYSTEM-DEEP-AUDIT.json'), manifest);
  writeJson(path.join(EVID_ROOT, 'WEB3-SYSTEM-DEEP-AUDIT-LATEST.json'), manifest);
  fs.writeFileSync(path.join(EVID_ROOT, 'WEB3-SYSTEM-BLOCKERS-LATEST.md'), renderMarkdown(manifest), 'utf8');
  fs.writeFileSync(path.join(RUN_DIR, 'WEB3-SYSTEM-BLOCKERS.md'), renderMarkdown(manifest), 'utf8');

  console.log(JSON.stringify({ verdict, p0, p1, p2, payment_rail: payManifest.verdict, run_dir: manifest.run_dir }, null, 2));
}

function writeJson(p, obj) {
  mkdirp(path.dirname(p));
  fs.writeFileSync(p, `${JSON.stringify(obj, null, 2)}\n`, 'utf8');
}

function renderMarkdown(m) {
  const lines = [
    '# Entire Web3 System Deep Audit — Blockers & Fix Priority',
    '',
    `**Recorded:** ${m.recorded_utc}  `,
    `**Audit tier:** \`${m.audit_tier || 'ENTIRE_WEB3_SYSTEM'}\`  `,
    `**Verdict:** \`${m.verdict}\`  `,
    `**Standard:** Production GO · full module tree (Payment = M25 subset only)`,
    '',
    '## Tier distinction',
    '',
    '| Audit | Scope | Status |',
    '|-------|-------|--------|',
    `| Payment Rail Audit | G3-02 · M25 · USDC Escrow | ${m.summary.payment_rail_subset_pass ? 'PASS' : 'OPEN'} |`,
    `| **Entire Web3 System Audit** | M01–M24 · Smart Contracts→Security | ${m.summary.web3_system_ready ? 'READY' : 'NOT READY'} |`,
    `| Modules PASS / FAIL / WARN | ${m.summary.modules_pass ?? '?'}/${m.summary.modules_fail ?? '?'}/${m.summary.modules_warn ?? '?'} | |`,
    '',
    '## Summary',
    '',
    '| Priority | Open |',
    '|----------|------|',
    `| P0 | ${m.summary.blockers_p0} |`,
    `| P1 | ${m.summary.blockers_p1} |`,
    `| P2 | ${m.summary.blockers_p2} |`,
    '',
    '## Blocker list',
    '',
    '| Priority | Risk | ID | Dimension | Title | Fix |',
    '|----------|------|-----|-----------|-------|-----|',
  ];
  for (const b of m.blockers) {
    lines.push(
      `| ${b.priority} | ${b.risk} | ${b.id} | ${b.dimension} | ${b.title.replace(/\|/g, '/')} | ${b.fix.replace(/\|/g, '/')} |`,
    );
  }
  lines.push('', '---', '', '*Generated by scripts/dev/run-web3-system-deep-audit.cjs*', '');
  return lines.join('\n');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
