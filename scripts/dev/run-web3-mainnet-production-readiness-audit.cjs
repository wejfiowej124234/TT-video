#!/usr/bin/env node
/**
 * Web3 Mainnet Production Readiness Audit — cross-validation only · no business logic mutation.
 *
 * Principle: never assume design correct. Ambiguity / missing evidence = Blocker.
 *
 *   node scripts/dev/run-web3-mainnet-production-readiness-audit.cjs
 *
 * Outputs (evidence/GO_production_readiness/web3-mainnet-audit/):
 *   WEB3-MAINNET-PRODUCTION-READINESS-LATEST.json
 *   WEB3-MAINNET-BLOCKERS-LATEST.md
 *   MAINNET-DEPLOYMENT-CHECKLIST-LATEST.md
 *   CONTRACT-DEPLOYMENT-MATRIX-LATEST.md
 *   SECURITY-REVIEW-LATEST.md
 *   BUSINESS-LOGIC-REVIEW-LATEST.md
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { request } = require('./lib/production-readiness-probe-http.cjs');
const {
  ROOT: MAP_ROOT,
  loadMasterMap,
  loadDeployRegistry,
  resolveRegistryAddress,
  isAddress,
} = require('./lib/web3-system-master-map.cjs');

const ROOT = path.join(__dirname, '../..');
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_readiness/web3-mainnet-audit');
const RUN_DIR = path.join(EVID_ROOT, `audit-${STAMP}`);
const PROD_API = (process.env.PROD_API || 'https://tt-api-prod.fly.dev').replace(/\/$/, '');

const BLOCKERS = [];
const FINDINGS = [];
const DIMENSIONS = {};

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

function exists(p) {
  return fs.existsSync(path.join(ROOT, p));
}

function addBlocker(priority, id, domain, title, paths, fix, risk = 'CRITICAL') {
  BLOCKERS.push({ priority, id, domain, title, paths, fix, risk, status: 'OPEN' });
}

function addFinding(severity, id, domain, note, evidence = []) {
  FINDINGS.push({ severity, id, domain, note, evidence });
}

function runCmd(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', ...opts });
}

function loadYamlViaPython(rel) {
  const p = path.join(ROOT, rel);
  const code = `
import json, yaml
from pathlib import Path
print(json.dumps(yaml.safe_load(Path(${JSON.stringify(p)}).read_text(encoding='utf-8'))))
`;
  const r = runCmd('python', ['-c', code]);
  if (r.status !== 0) return null;
  try {
    return JSON.parse(r.stdout);
  } catch {
    return null;
  }
}

function extractPerms() {
  const rust = new Set(
    [...readSafe('crates/api/src/routes/admin/admin_rbac.rs').matchAll(/pub const PERM_\w+: &str = "([^"]+)"/g)].map(
      (m) => m[1],
    ),
  );
  const yaml = new Set(
    [...readSafe('registry/admin-rbac-permissions.v1.yaml').matchAll(/^\s+-\s+id:\s+(\S+)/gm)].map((m) => m[1]),
  );
  const ts = new Set(
    [...readSafe('frontend/lib/admin/adminPermissionIds.ts').matchAll(/"((?:admin\.)[^"]+)"/g)].map((m) => m[1]),
  );
  return { rust, yaml, ts };
}

function globSolContracts() {
  const out = [];
  const stack = [path.join(ROOT, 'contracts/src')];
  while (stack.length) {
    const cur = stack.pop();
    for (const ent of fs.readdirSync(cur, { withFileTypes: true })) {
      const p = path.join(cur, ent.name);
      if (ent.isDirectory()) stack.push(p);
      else if (ent.name.endsWith('.sol') && !ent.name.startsWith('I')) out.push(path.relative(ROOT, p).replace(/\\/g, '/'));
    }
  }
  return out.sort();
}

function checkGovFreezeAbis() {
  const required = ['TtgPrimaryMarketV1.json', 'TtgSeatConcentrationRegistry.json', 'GovernanceTreasuryP4Cap.json'];
  return required.map((f) => ({
    file: f,
    ok: exists(`contracts/abi/${f}`),
  }));
}

function buildContractDeploymentMatrix(masterMap, deployReg) {
  const rows = [];
  for (const mod of masterMap.modules || []) {
    for (const c of mod.contracts || []) {
      const sepoliaAddr = c.registry_key
        ? resolveRegistryAddress(deployReg, c.registry_key, c.ssot_block || 'gov_freeze_v2_clean_baseline', c)
        : c.external_address || null;
      rows.push({
        module: mod.id,
        contract: c.name,
        source: c.source,
        upgrade: mod.upgrade?.type,
        accounting_track: mod.funds?.accounting_track,
        sepolia_address: isAddress(sepoliaAddr) ? sepoliaAddr : null,
        mainnet_address: null,
        mainnet_deploy_wave: mod.deployment_wave,
        mainnet_readiness: mod.readiness?.status,
        mainnet_blocker: 'No mainnet registry slot · GAP-99-07',
      });
    }
  }
  return rows;
}

function buildMainnetDeploymentChecklist() {
  return [
    { wave: 'PRE', item: 'PRODUCTION_SCOPE_MAINNET selected + Owner signoff', status: 'BLOCKED', ref: '148-PI3-005' },
    { wave: 'PRE', item: 'MAINNET_CUTOVER_AUTHORIZED=true', status: 'BLOCKED', ref: 'PRODUCTION-ENV-MATRIX' },
    { wave: 'PRE', item: 'External audit R-01 CLOSED', status: 'BLOCKED', ref: 'GAP-99-01' },
    { wave: 'PRE', item: 'TT-MAINNET G0–G6 + SL all GO', status: 'BLOCKED', ref: 'TT-MAINNET §0' },
    { wave: 'PRE', item: 'Mainnet Shadow Launch evidence GO', status: 'BLOCKED', ref: 'evidence/mainnet_shadow_launch/' },
    { wave: 'PRE', item: 'registry mainnet addresses populated', status: 'BLOCKED', ref: 'GAP-99-07' },
    { wave: 'PRE', item: 'WEB3_SYSTEM_CLOSURE_PASS (Sepolia)', status: 'IN_PROGRESS', ref: 'Cert #8–12 pending' },
    { wave: 'W1', item: 'Safe → Timelock admin (mainnet)', status: 'NOT_STARTED', ref: 'Deploy batch 0' },
    { wave: 'W1', item: 'GovernanceStack mainnet broadcast', status: 'NOT_STARTED', ref: 'DeployGovernanceStack' },
    { wave: 'W1', item: 'FundStack under Timelock (USDC mainnet)', status: 'NOT_STARTED', ref: 'DeployFundStackUnderTimelock' },
    { wave: 'W1', item: 'Escrow + FeeRouter + Settlement token = mainnet USDC', status: 'NOT_STARTED', ref: 'Master Map W1' },
    { wave: 'W1', item: 'G1 bytecode identity manifest (chain_id=1)', status: 'NOT_STARTED', ref: 'TT-MAINNET §1.3' },
    { wave: 'W1', item: 'G2 indexer full-path replay on mainnet', status: 'NOT_STARTED', ref: 'TT-MAINNET §2.2' },
    { wave: 'W1', item: 'G3 Timelock delay ≥ 86400s verified on-chain', status: 'NOT_STARTED', ref: 'TT-MAINNET §3.2' },
    { wave: 'W2', item: 'GovFreeze V2 proxy overlay mainnet', status: 'NOT_STARTED', ref: 'DeployGovFreezeV2CleanBaseline' },
    { wave: 'W2', item: 'RegionStewardStakePool + Seat + TTG lifecycle cert on mainnet', status: 'NOT_STARTED', ref: 'Cert replay mainnet' },
    { wave: 'W2', item: 'CountryPool NetProfit full jurisdiction rollout', status: 'TARGET', ref: 'GAP-99-03' },
    { wave: 'W3', item: 'SlashRouter wired to identity pools', status: 'TARGET', ref: 'GAP-99-02' },
    { wave: 'W3', item: 'Primary Market UI (if Owner lifts DEFER)', status: 'DEFER', ref: 'WEB3-PRIMARY-MARKET-DEFER-V1' },
  ];
}

function renderBlockersMd(manifest) {
  const lines = [
    '# Web3 Mainnet Production Readiness — Blockers',
    '',
    `**Recorded:** ${manifest.recorded_utc}`,
    `**Verdict:** \`${manifest.verdict}\``,
    `**Principle:** Cross-validation only — no design assumed correct.`,
    '',
    `| Priority | Count |`,
    `|----------|-------|`,
    `| P0 | ${manifest.summary.blockers_p0} |`,
    `| P1 | ${manifest.summary.blockers_p1} |`,
    `| P2 | ${manifest.summary.blockers_p2} |`,
    '',
  ];
  for (const p of ['P0', 'P1', 'P2']) {
    const items = manifest.blockers.filter((b) => b.priority === p);
    if (!items.length) continue;
    lines.push(`## ${p}`, '');
    for (const b of items) {
      lines.push(`### ${b.id} — ${b.title}`, '', `- **Domain:** ${b.domain}`, `- **Risk:** ${b.risk}`, `- **Fix:** ${b.fix}`, `- **Paths:** ${b.paths.join(', ')}`, '');
    }
  }
  return `${lines.join('\n')}\n`;
}

function renderSecurityReview(manifest) {
  const d = manifest.dimensions;
  return `# Web3 Mainnet — Security Review (Audit-Only)

**Recorded:** ${manifest.recorded_utc}

## Cross-validation summary

| Area | Sepolia verified | Mainnet verified | Blocker |
|------|------------------|------------------|---------|
| Proxy upgrade (G24) | ${d.D04_proxy_upgrade?.g24Pass ? 'YES' : 'PARTIAL'} | NO | Mainnet bytecode not deployed |
| RBAC API boundary | ${d.D15_rbac?.f01_closed ? 'YES' : 'OPEN'} | NO | Mainnet admin matrix not run |
| Reentrancy guards | ${d.D16_contract_security?.escrow_reentrancy_guard ? 'source YES' : 'unverified'} | NO | Mainnet not deployed |
| Timelock delay ≥24h | Sepolia 48h | NO | G3 not executed on mainnet |
| External audit R-01 | OPEN | OPEN | **P0** |
| P0 RBAC bypass isolated | ${d.D15_rbac?.p0_bypass_isolated ?? 'unknown'} | N/A | prod secrets review required |

## Replay / permission / upgrade risks (design review from source)

- **Escrow:** immutable instances — upgrade = new factory routing only; mainnet mis-wiring of \`platformFeeRecipient\` = **fund loss risk**.
- **Governor/Timelock:** controller non-upgradeable delay — wrong mainnet deploy = **governance lock or instant execute risk** (G3).
- **Proxy shells:** upgrade via Timelock only — compromised Timelock admin = **total protocol risk**.
- **FeeRouter vs CountryPoolLedger:** D-4555-A/B confusion in ops = **accounting misallocation** (not automatic exploit but financial loss).

## Verdict

**Mainnet security posture: NOT VERIFIABLE** until chain_id=1 deployment + G0–G6+SL + R-01.
`;
}

function renderBusinessLogicReview(manifest) {
  return `# Web3 Mainnet — Business Logic Review (Audit-Only)

**Recorded:** ${manifest.recorded_utc}

## Dual-track accounting (must not mix on mainnet)

| Track | ID | Source | Mainnet production status |
|-------|-----|--------|---------------------------|
| Platform fee country bucket | D-4555-A | Escrow → FeeRouter → RegionVault | Design OK · **mainnet unverified** |
| Net profit steward/treasury split | D-4555-B | CountryPoolNetProfitLedger | DE pilot only · **full rollout BLOCKED** |

## Lifecycle flows — mainnet evidence required

| Flow | Sepolia | Mainnet |
|------|---------|---------|
| TTG mint → delegate → vote → queue → execute | Cert #7 ✅ · #8 queued | **NO EVIDENCE** |
| Treasury spend | Cert #8 pending TL#2 | **NO EVIDENCE** |
| Steward TTG stake → unstake | Cert #9 pending | **NO EVIDENCE** |
| Traveler USDC → Escrow → release → FeeRouter | G3-02 PASS | **NO EVIDENCE** |
| Primary Market purchase | UI DEFER | **NO EVIDENCE** |
| CountryPool Snapshot/Claim/Payout | TARGET | **NO EVIDENCE** |

## Honest boundary

Sepolia Production readiness **≠** Mainnet Production readiness. Cross-validation found **no mainnet registry, no mainnet chain_id=1 evidence, scope not selected**.
`;
}

async function main() {
  mkdirp(RUN_DIR);

  // --- Scope & authorization (cross-check docs + registry) ---
  const scopeDoc = readSafe('docs/handbook/engineering/148-PI3-005-Production-Scope-Decision-Report.md');
  const mainnetNotSelected = /PRODUCTION_SCOPE_MAINNET:\s*NOT_SELECTED/.test(scopeDoc);
  const sepoliaSelected = /PRODUCTION_SCOPE_SEPOLIA:\s*SELECTED/.test(scopeDoc);
  DIMENSIONS.D01_scope = { mainnetNotSelected, sepoliaSelected, prod_api: PROD_API };
  if (mainnetNotSelected) {
    addBlocker(
      'P0',
      'MN-P0-001',
      'Scope',
      'PRODUCTION_SCOPE_MAINNET not selected — mainnet cutover unauthorized',
      ['docs/handbook/engineering/148-PI3-005-Production-Scope-Decision-Report.md', 'registry/web3-mainnet-production-readiness-gate.v1.yaml'],
      'Complete PI3-005-M program + Owner signoff before mainnet Web3 audit can pass',
      'CRITICAL',
    );
  }

  // --- Mainnet registry / addresses ---
  const deployReg = loadDeployRegistry();
  const hasMainnetEnv = Boolean(deployReg.environments?.mainnet || deployReg.environments?.ethereum_mainnet);
  DIMENSIONS.D02_mainnet_registry = { hasMainnetEnv, gap_99_07: !hasMainnetEnv };
  addBlocker(
    'P0',
    'MN-P0-002',
    'Registry',
    'No mainnet address registry slot in protocol-convergence-deployments (GAP-99-07)',
    ['registry/protocol-convergence-deployments.v1.yaml', 'docs/spec/99-链上合约与池子总览.md §13'],
    'Add environments.mainnet with chain_id=1 addresses after controlled mainnet broadcast',
    'CRITICAL',
  );

  // --- Prod runtime is Sepolia-scoped ---
  const meta = await request(`${PROD_API}/meta`);
  const prodChainId = String(meta.json?.chain?.chain_id || '');
  DIMENSIONS.D03_prod_runtime = {
    http: meta.status,
    chain_id: prodChainId,
    deployment_profile: meta.json?.build?.deployment_profile,
    mock_pay: meta.json?.orders?.order_mock_pay_enabled,
  };
  if (prodChainId !== '11155111') {
    addBlocker('P0', 'MN-P0-003', 'Runtime', `Prod /meta chain_id=${prodChainId} — not mainnet (1)`, [`${PROD_API}/meta`], 'Expected only when auditing mainnet prod; current scope is Sepolia', 'HIGH');
  } else {
    addFinding('info', 'MN-INFO-003', 'Runtime', 'Prod runtime correctly scoped to Sepolia — cannot substitute for mainnet verification', [`${PROD_API}/meta`]);
  }

  // --- G24 proxy architecture ---
  const g24 = runCmd('bash', ['scripts/gates/check-g24-p-upgrade-01-proxy-architecture.sh']);
  DIMENSIONS.D04_proxy_upgrade = {
    g24Pass: g24.status === 0,
    note: 'Source/deploy-script posture only — mainnet proxy instances not verified',
  };
  if (g24.status !== 0) {
    addBlocker('P1', 'MN-P1-001', 'Upgradeability', 'G24 proxy architecture gate FAIL on repo', ['registry/g24-p-upgrade-01-contract-posture.v1.yaml'], 'Fix G24 before mainnet deploy', 'HIGH');
  }

  // --- Tokenomics cross-validation ---
  const constants = readSafe('contracts/src/TtgGovFreezeConstants.sol');
  const protocolYaml = readSafe('docs/spec/governance-token/protocol-ssot.v1.yaml');
  const tokenomicsOk =
    /TTG_TOTAL_SUPPLY_UNITS = 10_000_000 ether/.test(constants) &&
    /governance_quorum_bps:\s*400/.test(protocolYaml) &&
    /governance_timelock_delay_hours:\s*48/.test(protocolYaml);
  DIMENSIONS.D05_tokenomics = { source_vs_protocol_ssot: tokenomicsOk };
  if (!tokenomicsOk) {
    addBlocker('P0', 'MN-P0-004', 'Tokenomics', 'TtgGovFreezeConstants vs protocol-ssot mismatch', ['contracts/src/TtgGovFreezeConstants.sol', 'docs/spec/governance-token/protocol-ssot.v1.yaml'], 'Align before any mainnet TTG deploy', 'CRITICAL');
  }

  // --- D-4555-A/B documentation cross-check ---
  const fundFlow = readSafe('docs/spec/governance-token/fund-flow-ssot.v1.md');
  const masterMapHuman = readSafe('docs/runbook/WEB3-SYSTEM-MASTER-MAP-V1.md');
  const dualTrackDocumented =
    /D-4555-A|platform fee|FeeRouter/.test(fundFlow) &&
    /D-4555-B|NetProfit|CountryPoolNetProfitLedger/.test(fundFlow) &&
    /两套 45%|D-4555-A/.test(masterMapHuman);
  DIMENSIONS.D06_dual_accounting = { documented: dualTrackDocumented, mainnet_ops_training: 'NOT_EVIDENCED' };
  if (!dualTrackDocumented) {
    addBlocker('P1', 'MN-P1-002', 'Business Logic', 'D-4555-A/B dual-track not fully documented in SSOT cross-check', ['docs/spec/governance-token/fund-flow-ssot.v1.md', 'docs/runbook/WEB3-SYSTEM-MASTER-MAP-V1.md'], 'Complete ops/finance training docs before mainnet', 'HIGH');
  }

  // --- Master Map parity (Sepolia baseline) ---
  const mmRun = runCmd(process.execPath, ['scripts/dev/check-web3-system-master-map-parity.cjs']);
  const mmParity = readJsonSafe(path.join(ROOT, 'evidence/GO_production_readiness/web3-system-audit/WEB3-MASTER-MAP-PARITY-LATEST.json'));
  DIMENSIONS.D07_master_map = { verdict: mmParity?.verdict, sepolia_only: true };

  // --- Sepolia system audit (baseline, not pass-through) ---
  const sepAudit = readJsonSafe(path.join(ROOT, 'evidence/GO_production_readiness/web3-system-audit/WEB3-SYSTEM-DEEP-AUDIT-LATEST.json'));
  DIMENSIONS.D08_sepolia_system_audit = {
    verdict: sepAudit?.verdict,
    p0: sepAudit?.summary?.blockers_p0,
    p1: sepAudit?.summary?.blockers_p1,
    note: 'Sepolia audit state — does NOT imply mainnet PASS',
  };
  if ((sepAudit?.summary?.blockers_p0 ?? 1) > 0) {
    addBlocker('P0', 'MN-P0-005', 'Sepolia prerequisite', 'Sepolia Web3 system audit has P0 blockers', ['evidence/GO_production_readiness/web3-system-audit/WEB3-SYSTEM-DEEP-AUDIT-LATEST.json'], 'Close Sepolia P0 first', 'CRITICAL');
  }
  if ((sepAudit?.summary?.blockers_p1 ?? 99) > 0) {
    addBlocker('P1', 'MN-P1-003', 'Sepolia prerequisite', `Sepolia Web3 system audit P1=${sepAudit?.summary?.blockers_p1} (Cert/RBAC/etc.)`, ['evidence/GO_production_readiness/web3-system-audit/WEB3-SYSTEM-BLOCKERS-LATEST.md'], 'Close Sepolia P1 before mainnet scope expansion', 'HIGH');
  }

  // --- TTG Cert ---
  const certIdx = readJsonSafe(path.join(ROOT, 'evidence/GO_production_readiness/web3-system-audit/TTG-CERT-EVIDENCE-INDEX-LATEST.json'));
  DIMENSIONS.D09_ttg_cert = { signoffs: certIdx?.signed_count, total: certIdx?.total_certs ?? 12 };
  if ((certIdx?.signed_count ?? 0) < 12) {
    addBlocker('P1', 'MN-P1-004', 'Governance lifecycle', `TTG Cert ${certIdx?.signed_count ?? '?'}/12 — mainnet governance lifecycle replay not started`, ['registry/ttg-governance-cert-gates.v1.yaml', 'evidence/GO_ttg_cert/'], 'Complete Cert #8–12 on Sepolia then plan mainnet replay', 'HIGH');
  }

  // --- R-01 external audit ---
  const gap99 = /GAP-99-01.*OPEN/s.test(readSafe('docs/spec/99-链上合约与池子总览.md'));
  DIMENSIONS.D10_external_audit = { r01_open: gap99 };
  addBlocker('P0', 'MN-P0-006', 'External audit', 'R-01 third-party contract audit OPEN (GAP-99-01)', ['docs/spec/99-链上合约与池子总览.md §13'], 'Close R-01 before mainnet deploy', 'CRITICAL');

  // --- TT-MAINNET G0-G6 + SL ---
  const shadowDir = path.join(ROOT, 'evidence/mainnet_shadow_launch');
  const shadowGo = (() => {
    if (!fs.existsSync(shadowDir)) return false;
    for (const ent of fs.readdirSync(shadowDir, { withFileTypes: true })) {
      if (!ent.isDirectory()) continue;
      const j = readJsonSafe(path.join(shadowDir, ent.name, 'shadow_go_no_go.json'));
      if (j?.shadow_launch_verdict === 'GO') return true;
    }
    return false;
  })();
  const g6File = path.join(ROOT, 'evidence/mainnet_launch_gate/G6_no_rollback_ack.md');
  DIMENSIONS.D11_tt_mainnet_gates = {
    G0: fs.existsSync(path.join(ROOT, 'docs/runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md')),
    SL_shadow_go: shadowGo,
    G6_ack: fs.existsSync(g6File),
  };
  addBlocker('P0', 'MN-P0-007', 'TT-MAINNET SL', 'Mainnet Shadow Launch evidence not GO', ['evidence/mainnet_shadow_launch/README.md'], 'Complete shadow launch per TT-MAINNET §7', 'CRITICAL');
  addBlocker('P0', 'MN-P0-008', 'TT-MAINNET G6', 'G6 no-rollback acknowledgment not evidenced', ['evidence/mainnet_launch_gate/G6_no_rollback_ack.md'], 'Record G6 team signoff before mainnet', 'HIGH');

  // --- RBAC cross-validation ---
  const perms = extractPerms();
  const f01Closed = [...perms.rust].every((p) => perms.yaml.has(p) && perms.ts.has(p));
  const rbacClosure = readJsonSafe(path.join(ROOT, 'evidence/GO_production_readiness/web3-system-audit/RBAC-D3-CLOSURE-LATEST.json'));
  DIMENSIONS.D15_rbac = {
    f01_closed: f01Closed,
    d3_closure: rbacClosure?.verdict,
    p0_bypass_isolated: 'prod TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT must be verified manually',
  };
  if (!f01Closed) {
    addBlocker('P0', 'MN-P0-009', 'RBAC', 'Permission ID drift across Rust/YAML/TS', ['registry/admin-rbac-permissions.v1.yaml'], 'Sync permission SSOT', 'CRITICAL');
  }

  // --- Contract security patterns (source grep) ---
  const escrow = readSafe('contracts/src/Escrow.sol');
  const feeRouter = readSafe('contracts/src/FeeRouter.sol');
  const proxy = readSafe('contracts/src/upgrade/TimelockUpgradeableProxy.sol');
  DIMENSIONS.D16_contract_security = {
    escrow_reentrancy_guard: /nonReentrant|ReentrancyGuard/.test(escrow),
    feerouter_pause: /setDistributePaused|distributePaused/.test(feeRouter),
    proxy_admin_gate: /_onlyAdmin|onlyAdmin/.test(proxy),
  };

  // --- ABI ---
  const abis = checkGovFreezeAbis();
  DIMENSIONS.D17_abi = { govfreeze_shells: abis };
  if (abis.some((a) => !a.ok)) {
    addBlocker('P1', 'MN-P1-005', 'ABI', 'GovFreeze shell ABIs missing', ['contracts/abi/'], 'Export ABIs before mainnet integrator/onboard', 'MEDIUM');
  }

  // --- CountryPool / business TARGET ---
  addBlocker('P1', 'MN-P1-006', 'Business Logic', 'CountryPool full Snapshot/Claim/Payout not production-wide (GAP-99-03)', ['docs/spec/99-链上合约与池子总览.md §13'], 'Complete Wave 2 before mainnet steward payouts at scale', 'HIGH');

  // --- Mainnet env matrix ---
  const flyProd = readSafe('deploy/fly/tt-api-prod/fly.toml');
  const hasMainnetRpcHint = /MAINNET_CHAIN_RPC_URL|chain_id.*1/.test(flyProd + readSafe('scripts/dev/.env.production.example'));
  DIMENSIONS.D18_deploy_env = {
    mainnet_rpc_documented: hasMainnetRpcHint,
    sepolia_prod_wired: true,
  };
  addBlocker('P1', 'MN-P1-007', 'Deploy/Env', 'Mainnet deployment env matrix not populated (addresses, RPC, USDC)', ['deploy/fly/', 'registry/protocol-convergence-deployments.v1.yaml'], 'Create mainnet env template + dual-control broadcast runbook', 'HIGH');

  // --- Contract inventory ---
  const solFiles = globSolContracts();
  DIMENSIONS.D19_contract_inventory = { sol_count: solFiles.length };

  // --- Protocol-grade audit (15 dimensions) ---
  const pgRun = runCmd(process.execPath, ['scripts/dev/run-web3-protocol-grade-audit.cjs']);
  const pgLatest = readJsonSafe(path.join(ROOT, 'evidence/GO_production_readiness/web3-protocol-grade-audit/WEB3-PROTOCOL-GRADE-AUDIT-LATEST.json'));
  DIMENSIONS.D20_protocol_grade = {
    exit_code: pgRun.status,
    verdict: pgLatest?.verdict,
    p0: pgLatest?.summary?.blockers_p0,
    p1: pgLatest?.summary?.blockers_p1,
    evidence: 'evidence/GO_production_readiness/web3-protocol-grade-audit/',
  };
  if ((pgLatest?.summary?.blockers_p0 ?? 1) > 0) {
    addBlocker(
      'P0',
      'MN-P0-010',
      'Protocol-Grade',
      `Protocol-grade audit P0=${pgLatest?.summary?.blockers_p0 ?? '?'}`,
      ['evidence/GO_production_readiness/web3-protocol-grade-audit/PROTOCOL-GRADE-BLOCKERS-LATEST.md'],
      'Close protocol-grade P0 blockers (fund lifecycle, G24, etc.)',
      'CRITICAL',
    );
  } else if ((pgLatest?.summary?.blockers_p1 ?? 0) > 0) {
    addBlocker(
      'P1',
      'MN-P1-008',
      'Protocol-Grade',
      `Protocol-grade audit P1=${pgLatest?.summary?.blockers_p1}`,
      ['evidence/GO_production_readiness/web3-protocol-grade-audit/PROTOCOL-GRADE-BLOCKERS-LATEST.md'],
      'Close fund lifecycle / drill / cert blockers before mainnet',
      'HIGH',
    );
  }

  // --- Master map for deployment matrix ---
  const masterMap = loadMasterMap();
  const contractMatrix = buildContractDeploymentMatrix(masterMap, deployReg);
  const deploymentChecklist = buildMainnetDeploymentChecklist();

  const p0 = BLOCKERS.filter((b) => b.priority === 'P0').length;
  const p1 = BLOCKERS.filter((b) => b.priority === 'P1').length;
  const p2 = BLOCKERS.filter((b) => b.priority === 'P2').length;

  const manifest = {
    schema: 'traveltrust.web3_mainnet_production_readiness.v1',
    audit_name: 'Web3 Mainnet Production Readiness Audit',
    recorded_utc: new Date().toISOString(),
    run_dir: path.relative(ROOT, RUN_DIR).replace(/\\/g, '/'),
    target_chain_id: '1',
    target_network: 'Ethereum Mainnet',
    current_scope: {
      production_scope: 'PRODUCTION_SCOPE_SEPOLIA',
      production_chain_id: '11155111',
      mainnet_cutover_authorized: false,
    },
    audit_principle:
      'Never assume design correct — conclusions require cross-validation of source, registry, master map, runtime, deploy scripts, and evidence',
    verdict: p0 === 0 && p1 === 0 ? 'WEB3_MAINNET_PRODUCTION_PASS' : 'WEB3_MAINNET_PRODUCTION_BLOCKED',
    summary: {
      blockers_p0: p0,
      blockers_p1: p1,
      blockers_p2: p2,
      findings_count: FINDINGS.length,
      sepolia_substitution_allowed: false,
    },
    dimensions: DIMENSIONS,
    blockers: BLOCKERS,
    findings: FINDINGS,
    contract_deployment_matrix: contractMatrix,
    mainnet_deployment_checklist: deploymentChecklist,
    fix_priority: [
      { order: 1, items: BLOCKERS.filter((b) => b.priority === 'P0').map((b) => b.id) },
      { order: 2, items: BLOCKERS.filter((b) => b.priority === 'P1').map((b) => b.id) },
      { order: 3, items: BLOCKERS.filter((b) => b.priority === 'P2').map((b) => b.id) },
    ],
    references: {
      gate_registry: 'registry/web3-mainnet-production-readiness-gate.v1.yaml',
      master_map: 'registry/web3-system-master-map.v1.yaml',
      protocol_grade_framework: 'registry/web3-protocol-grade-audit-framework.v1.yaml',
      tt_mainnet: 'docs/runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md',
      scope_decision: 'docs/handbook/engineering/148-PI3-005-Production-Scope-Decision-Report.md',
    },
    discipline: { business_code_modified: false, audit_only: true },
  };

  fs.writeFileSync(path.join(RUN_DIR, 'WEB3-MAINNET-PRODUCTION-READINESS.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(EVID_ROOT, 'WEB3-MAINNET-PRODUCTION-READINESS-LATEST.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(EVID_ROOT, 'WEB3-MAINNET-BLOCKERS-LATEST.md'), renderBlockersMd(manifest));
  fs.writeFileSync(path.join(EVID_ROOT, 'MAINNET-DEPLOYMENT-CHECKLIST-LATEST.md'), `# Mainnet Deployment Checklist\n\n${deploymentChecklist.map((r) => `- [ ] **${r.wave}** ${r.item} — **${r.status}** (${r.ref})`).join('\n')}\n`);
  fs.writeFileSync(
    path.join(EVID_ROOT, 'CONTRACT-DEPLOYMENT-MATRIX-LATEST.md'),
    `# Contract Deployment Matrix (Mainnet)\n\n| Module | Contract | Sepolia | Mainnet | Wave | Readiness |\n|--------|----------|---------|---------|------|-----------|\n${contractMatrix.map((r) => `| ${r.module} | ${r.contract} | ${r.sepolia_address || '—'} | — | ${(r.mainnet_deploy_wave || []).join(',')} | ${r.mainnet_readiness} |`).join('\n')}\n`,
  );
  fs.writeFileSync(path.join(EVID_ROOT, 'SECURITY-REVIEW-LATEST.md'), renderSecurityReview(manifest));
  fs.writeFileSync(path.join(EVID_ROOT, 'BUSINESS-LOGIC-REVIEW-LATEST.md'), renderBusinessLogicReview(manifest));

  console.log(
    JSON.stringify(
      {
        verdict: manifest.verdict,
        p0,
        p1,
        p2,
        evidence: path.relative(ROOT, EVID_ROOT).replace(/\\/g, '/'),
      },
      null,
      2,
    ),
  );
  process.exit(manifest.verdict === 'WEB3_MAINNET_PRODUCTION_PASS' ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
