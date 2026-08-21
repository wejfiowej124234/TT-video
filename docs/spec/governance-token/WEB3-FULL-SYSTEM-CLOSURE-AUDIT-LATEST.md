# Web3 全系统业务—资金—合约一致性大审计 — Latest


> **STATUS (V9 Documentation Truth Convergence · phase-2):** **SUPERSEDED as Official ACTIVE V9 path** · **DO_NOT_USE_AS_ACTIVE_TRUTH** · **HISTORICAL**.  
> Sole living upstream: [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · Design Lock **DL_R1** · Mainnet `DEPLOYED_PENDING_CUTOVER` / `TIMELOCK_CUTOVER_PENDING` · **≠** `MAINNET_FULLY_ACTIVE` · **≠** `TT_PRODUCTION_GO`.  
> Public-sale USDC→P4Cap · globalStakers 35.75% · R2_FINAL/Remint · Safe/old Timelock as V9 Official admin = **LEGACY / SUPERSEDED**. Evidence retained.

**Verdict:** `WARN` · **Stamp:** `20260712T234554Z` · **Level:** L1 Engineering Certification · **Phase:** ① local

**Engineering HEAD（冻结建议）:** `9de9c1eb`

**Baseline:** `9f500335 → 4f56727e → f575d459 → 1f205af1 → ee9df065 → 9de9c1eb`

## 重新冻结建议

| 项 | 值 |
|----|-----|
| **Recommendation** | `HOLD_L1_ENGINEERING_FREEZE` |
| **L1 Certification** | `PASS_WITH_OPEN_L2_L3_GAPS` |
| **Rationale** | All L1 machine gates PASS; registered P0/P1 gaps are L2/L3 Owner/on-chain items. Continue L1 freeze; next legitimate work = L2 Reality Certification execution. |

**冻结期间允许：** L2 Reality Certification evidence (blockchain-reality/) · bugfix blocking L2 SC execution · documentation/evidence for Certification

**禁止（直至 L2 CLOSED 或明确 unfreeze）：** new Web3 feature contracts · parallel audit-only doc churn without Certification progress

---

## 1. Web3 全功能清单

### 1.1 业务域（全 Web3 · 非仅治理币）

| ID | 域 | 范围 | SSOT |
|----|-----|------|------|
| `BD-TTG-SUPPLY` | TTG Genesis V2 四块分配 | 10M · team 15% · community_incentive 5% · treasury_dao 30% · public_sale 50% | TTG-TOKENOMICS-GENESIS-V2 · ttg-vesting-registry |
| `BD-VESTING` | Team Vesting | cliff+duration · Timelock · revocable=false · single wallet · no advisors track | vesting_tracks.team |
| `BD-PM-3R` | Primary Market 三轮 | Public Sale 5M · round amounts Registry · R2/R3 governance open | TtgPrimaryMarketV1 · public_sale |
| `BD-PM-USDC` | USDC 兑换 TTG | Buyer USDC → GovernanceTreasuryP4Cap · TTG→buyer | TtgPrimaryMarketV1.usdcTreasury SSOT |
| `BD-TREASURY-USDC` | USDC Global Treasury / P1–P4 | GovernanceTreasuryP4Cap · Timelock spend · GOV-01 P4 cap 30% | asset-denomination-treasury-separation.v1.yaml |
| `BD-TREASURY-TTG` | DAO TTG Treasury | treasury_dao 3M · no Mint · not voting-power source · ≠ USDC | treasury_dao |
| `BD-TREASURY-SAFE` | Treasury Safe / 多签 | timelock_admin · treasury_safe · emergency_safe | multisig-registry.v1.yaml · RULE-ADMIN-001 |
| `BD-FEE` | FeeRouter 平台手续费 | Escrow settlement → 45% country · 55% global → 65/20/15 | FeeRouter · fund-flow R4 |
| `BD-NP-4555` | 国家池净利润 45/55 | CountryPoolNetProfitLedger · D-4555-B · orthogonal to FeeRouter 45/55 | CountryPoolNetProfitLedger |
| `BD-ESCROW` | Escrow/Settlement 订单托管 | V1 Sepolia legacy · V2 mainnet path · bilateral confirm | EscrowFactory(V2) · Escrow(V2) |
| `BD-SEAT` | Seat/Stake Region Steward | RegionStewardStakePool · no country_shelf genesis · source-agnostic | TtgSeatConcentrationRegistry |
| `BD-GOV` | Governor/Timelock 治理栈 | propose→vote→queue→execute · 48h delay · payload contracts | TravelTrustGovernor · GovernanceTimelock |
| `BD-ALLOC` | Allocation Pool / Claim | RegionDistributionClaim · InvestorDistributionClaim · snapshot claim | RegionDistributionClaim |
| `BD-VAC` | Vacancy Ledger | UnallocatedStewardPathVault · six events · governance sweep | vacancy/* · indexer reconcile |
| `BD-IDX` | Indexer → DB → API | indexer-tick · escrow/vacancy/net-profit projections | crates/api/src/chain/* |
| `BD-FE` | 前端写链与对拍 | /governance/* · /escrow/[id] · net-profit/vacancy ledgers · wagmi | frontend/app/governance/* |
| `BD-UPGRADE` | 升级与暂停权限 | TimelockUpgradeableProxy · emergency pause · no withdraw on pause | upgrade/* · emergency_safe |
| `BD-MON` | 监控与生产指标 | production metrics catalog · alert rules · treasury ops policy | registry/monitoring-production-metrics-catalog.v1.yaml |
| `BD-CIP` | Community Incentive Program | Genesis Allocation 5% · Policy · DAO top-up OK | COMMUNITY-INCENTIVE-POLICY-V1 |

### 1.2 核心合约面

| 合约 | 功能 |
|------|------|
| `GovernanceVotesToken` | TTG voting token · snapshots · R1 |
| `TtgPrimaryMarketV1` | GOV-04 USDC→TTG primary market |
| `TravelTrustGovernor` | Propose/vote/queue/execute |
| `GovernanceTimelock` | 48h delayed execution |
| `GovernanceTreasuryP4Cap` | USDC Global Treasury · GOV-01 P4 cap |
| `GovernanceTreasury` | Legacy FeeRouter globalOps 15% leg |
| `TtgSeatConcentrationRegistry` | GOV-03 seat concentration |
| `RegionStewardStakePool` | Country pool TTG seat stake |
| `EscrowFactory` | V1 escrow deploy (testnet legacy) |
| `EscrowFactoryV2` | V2 bilateral escrow (mainnet path) |
| `Escrow` | Per-order USDC escrow V1 |
| `EscrowV2` | Bilateral service confirmation before release |
| `FeeRouter` | Platform fee 45/55 + global 65/20/15 |
| `RegionVault` | Country bucket receiver |
| `CountryPoolNetProfitLedger` | Quarter net profit 45/55 split |
| `UnallocatedStewardPathVault` | Vacancy ledger V1 |
| `ReserveVault` | Slash reserve · Timelock spend |
| `SlashRouter` | Slash routing to reserve/treasury |

**API：** governance/* · vacancy/net-profit ledgers · orders/* · disputes/* · internal/indexer-tick · GET /meta

**前端：** /governance/* · /escrow/[id] · net-profit-ledger · vacancy-ledger · staking · distribution-claim

## 2. 资金流与权限矩阵

### 2.1 权限矩阵（谁有权限 · 失败回滚）

| 功能 | 合约 | 操作主体 | 授权/Timelock | 资产 | 失败回滚 |
|------|------|----------|---------------|------|----------|
| TTG mint/transfer | GovernanceVotesToken | Timelock/minter role | Governance proposal → Timelock 48h | TTG | revert if unauthorized minter |
| Primary Market purchase | TtgPrimaryMarketV1 | Any buyer wallet | USDC approve + purchase() | USDC→P4Cap · TTG→buyer | revert insufficient USDC/cap |
| Treasury USDC spend | GovernanceTreasuryP4Cap | Timelock only | P1–P4 policy + GOV-01 cap | USDC | revert P4CapExceeded |
| Treasury TTG grant | treasury_dao bucket | Timelock | Proposal→Vote→Queue→Execute | TTG only | no USDC from TTG bucket |
| Escrow deposit | Escrow/EscrowV2 | Payer wallet | transferFrom→escrow | USDC isolated | revert on fail · no partial mint |
| Escrow release/refund | Escrow/EscrowV2 | Parties/arbitrator/rules | State machine + V2 bilateral confirm | USDC to beneficiary | revert wrong state |
| FeeRouter distribute | FeeRouter | Authorized settlement caller | 45/55 split on-chain | USDC | revert zero/ wrong token |
| Country net profit close | CountryPoolNetProfitLedger | Governor→Timelock | Epoch close + splitNetProfit payload | USDC | state machine no advance if unfunded |
| Seat stake lock | RegionStewardStakePool | Steward wallet | stake(jurisdiction,amount) | TTG lock | slash path via SlashRouter |
| Vacancy sweep | UnallocatedStewardPathVault | Governance payload | Proposal→Timelock | USDC/TTG policy | governance gated only |
| Governor upgrade | TimelockUpgradeableProxy | Timelock admin Safe | Governance only | N/A | no EOA admin |
| Emergency pause | FeeRouter/EscrowFactory | emergency_safe | pause() only · no withdraw | N/A | unpause via governance |

### 2.2 端到端资金流（来源→合约→治理→回滚）

| ID | 流 | 资产 | 从 | 到 | 合约 | 权限 | 治理/Timelock | 失败回滚 |
|----|-----|------|----|----|------|------|---------------|----------|
| FF-PM-USDC | Primary Market USDC leg | USDC | Buyer wallet | GovernanceTreasuryP4Cap | TtgPrimaryMarketV1 | Buyer sign purchase | — | tx revert · USDC stays wallet |
| FF-PM-TTG | Primary Market TTG leg | TTG | public_sale 5M bucket | Buyer wallet | TtgPrimaryMarketV1 | Round cap GOV-04 | — | revert over cap |
| FF-ESC-DEP | Escrow deposit | USDC | Traveler/provider | Escrow instance | EscrowFactory(V2) | Payer approve | — | revert · escrow unfunded |
| FF-ESC-REL | Escrow release | USDC | Escrow instance | Beneficiary | Escrow state machine | Parties/V2 confirm | — | revert wrong state |
| FF-FEE-4555A | Platform fee split A | USDC | Order settlement | RegionVault 45% | FeeRouter | Settlement hook | DAO param change | revert · fee undistributed |
| FF-FEE-4555A-G | Platform fee global 55% | USDC | Order settlement | Global pool 65/20/15 | FeeRouter | Settlement hook | Governance | revert |
| FF-NP-45 | Net profit country 45% | USDC | CountryPoolNetProfit | StewardPathVault/sub | Governor payload | Epoch close proposal | Timelock | split blocked until funded |
| FF-NP-55 | Net profit global 55% | USDC | CountryPoolNetProfit | GovernanceTreasuryP4Cap | Governor payload | Epoch close proposal | Timelock P1–P4 | revert over P4 cap on spend |
| FF-TTG-VEST | Team vesting | TTG | team 1.5M bucket | Beneficiary | Vesting contract | Timelock deploy | — | cliff prevents early claim |
| FF-TTG-CIP | Community Incentive Program | TTG | community_incentive 0.5M Allocation | Program recipients | Policy + governance | Program rules | Timelock when applicable | not cliff vesting |
| FF-TTG-DAO | DAO treasury TTG | TTG | treasury_dao 3M | Grant recipients | Governance | Proposal→Vote | Timelock | ≠ USDC treasury · not voting source |
| FF-VAC-SWEEP | Vacancy sweep | USDC/TTG | Unallocated path | Reserve/governance | VacancyGovernance | Governance proposal | Timelock | governance only |

SSOT: [asset-denomination-treasury-separation.v1.yaml](../../../registry/asset-denomination-treasury-separation.v1.yaml) · [fund-flow-ssot.v1.md](fund-flow-ssot.v1.md) · [ttg-vesting-registry.v1.yaml](../../../registry/ttg-vesting-registry.v1.yaml)

### 2.3 风险扫描（混池/越权/混读）

| ID | 风险 | 缓解 | SSOT |
|----|------|------|------|
| `RISK-MIX-PM-ESC` | USDC Primary Market vs Escrow 混池 | PM usdcTreasury MUST == P4Cap · escrow isolated | asset-denomination-treasury-separation |
| `RISK-MIX-TTG-USDC` | TTG dao bucket vs USDC treasury 混读 | treasury_dao asset=TTG · P4Cap asset=USDC | asset-denomination-treasury-separation |
| `RISK-MIX-FEE-NP` | FeeRouter 45/55 vs NetProfit 45/55 混读 | D-4555-A orthogonal D-4555-B | fund-flow-ssot R4 vs CountryPoolNetProfit |
| `RISK-GOV-ESC` | Governor 直接动用 Escrow | governor_direct_spend forbidden on R3 | asset-denomination fund_rails R3 |
| `RISK-P4-UNCAP` | P4 超 cap 支出 | GOV-01 treasuryP4DeployCapBps enforced | GovernanceTreasuryP4Cap.sol |
| `RISK-UPGRADE-EOA` | 升级权限 EOA | timelock_admin MUST be Safe | multisig-registry RULE-ADMIN-001 |
| `RISK-IDX-GAP` | Indexer 丢/重事件 | unique (chain,block,log_index) · rewind | indexer tick + reconcile gates |
| `RISK-VEST-OWNER` | Vesting 商业参数缺失 | team OWNER_INPUT | ttg-vesting-registry READY_TEMPLATE |

## 3. 智能合约清单

| 合约 | 层级 | 用途 | 源码 | ABI | FE ABI |
|------|------|------|------|-----|--------|
| `GovernanceVotesToken` | core | TTG voting token · snapshots · R1 | ✅ | ✅ | — |
| `TtgPrimaryMarketV1` | core | GOV-04 USDC→TTG primary market | ✅ | ✅ | — |
| `TravelTrustGovernor` | core | Propose/vote/queue/execute | ✅ | ✅ | — |
| `GovernanceTimelock` | core | 48h delayed execution | ✅ | ✅ | — |
| `GovernanceTreasuryP4Cap` | core | USDC Global Treasury · GOV-01 P4 cap | ✅ | ✅ | — |
| `GovernanceTreasury` | core | Legacy FeeRouter globalOps 15% leg | ✅ | ✅ | — |
| `TtgSeatConcentrationRegistry` | core | GOV-03 seat concentration | ✅ | ✅ | — |
| `RegionStewardStakePool` | core | Country pool TTG seat stake | ✅ | ✅ | — |
| `EscrowFactory` | core | V1 escrow deploy (testnet legacy) | ✅ | ✅ | ✅ |
| `EscrowFactoryV2` | core | V2 bilateral escrow (mainnet path) | ✅ | ✅ | ✅ |
| `Escrow` | core | Per-order USDC escrow V1 | ✅ | ✅ | ✅ |
| `EscrowV2` | core | Bilateral service confirmation before release | ✅ | ✅ | ✅ |
| `FeeRouter` | core | Platform fee 45/55 + global 65/20/15 | ✅ | ✅ | ✅ |
| `RegionVault` | core | Country bucket receiver | ✅ | ✅ | ✅ |
| `CountryPoolNetProfitLedger` | core | Quarter net profit 45/55 split | ✅ | ✅ | — |
| `UnallocatedStewardPathVault` | core | Vacancy ledger V1 | ✅ | ✅ | — |
| `ReserveVault` | core | Slash reserve · Timelock spend | ✅ | ✅ | — |
| `SlashRouter` | core | Slash routing to reserve/treasury | ✅ | ✅ | — |
| `StewardPathVault` | country | Country steward path USDC vault | ✅ | ✅ | — |
| `CountryPoolSubVaultsV0` | country | R2 sub-vaults target | ✅ | ✅ | — |
| `RegionDistributionClaim` | country | Country pool claim / allocation | ✅ | ✅ | ✅ |
| `IdentityStakingPool` | identity | Guide identity stake (orthogonal R4) | ✅ | — | — |
| `GuideIdentityStakingPool` | identity | Guide slash stake pool | ✅ | ✅ | ✅ |
| `ProviderIdentityStakingPool` | identity | Provider identity stake | ✅ | ✅ | ✅ |
| `TimelockUpgradeableProxy` | upgrade | Governed upgrade shell | ✅ | — | — |
| `CountryPoolNetProfitGovernancePayload` | governance | Net profit governance payloads | ✅ | ✅ | — |
| `RouterTreasuryGovernancePayload` | governance | Router/treasury governance payloads | ✅ | — | — |
| `InvestorDistributionClaim` | legacy | Investor claim track (legacy) | ✅ | ✅ | ✅ |
| `OnboardingFeeReceiver` | legacy | Onboarding fee (off R4) | ✅ | ✅ | ✅ |

## 4. 生产级缺口与风险清单

- **GAP-MAINNET-001** (P0 · L3 · deployment): Mainnet address registry all OWNER_INPUT — mainnet-address-registry.v2 deploy_status NOT_STARTED · _Blocking Risk_
- **GAP-ESCROW-V2-002** (P1 · L3 · escrow): EscrowFactoryV2 mainnet wiring + FE default write path — V2 ABI synced; production factory env + UI default path pending Owner · _Blocking Risk_
- **GAP-TREASURY-OPS-003** (P1 · L3 · treasury): Treasury ops spend classes OWNER_INPUT — refunds/taxes/supplier/payroll in asset-denomination + treasury-ops-policy · _Non-blocking Risk until L3_
- **GAP-IDX-NP-004** (P2 · L2 · indexer · **CLOSED_L1**): CountryPoolNetProfit live chain certification — CLOSED L1 — indexer→DB→API→FE→accounting; L2 Target Chain live tx pending Owner · _Expected Difference until L2_
- **GAP-PM-005** (P1 · L3 · primary_market): Primary Market on-chain ACTIVE + round lockup — Contract exists · optional_lockup_seconds OWNER_INPUT · mainnet not deployed · _Blocking Risk_
- **GAP-VESTING-006** (P1 · L3 · vesting): Vesting contracts deploy vs registry FROZEN amounts — team cliff/duration/start/beneficiary OWNER_INPUT · _Blocking Risk_
- **GAP-MATRIX-007** (P2 · L2 · coverage): Governance full-coverage matrix partial rows — ttg-governance-full-coverage-matrix: 51 PASS · 23 PARTIAL · 1 FAIL · 12 NOT_TESTED (86.2% tested) · _Non-blocking Risk_

## 5. AI 已修复项

- GAP-IDX-NP-004 L1: country_pool_net_profit_indexer + DB migration + governance/admin API + FE ledgers (ee9df065)
- Indexer: EscrowV2 ServiceCompleteConfirmed topic0 decode + unit test (d1bee7fc)
- Frontend: sync EscrowV2.json + EscrowFactoryV2.json from contracts/abi
- Treasury separation SSOT — TTG dao bucket ≠ USDC P4Cap (1f205af1)
- L2 SSOT: TT-WEB3-REALITY-CERTIFICATION + TT-CERTIFICATION-FRAMEWORK (d94a918d)

## 6. Owner 人工项

- [ ] Fill ttg-vesting-registry commercial OWNER_INPUT (cliff/duration/start/beneficiary for team)
- [ ] Primary Market round optional_lockup_seconds (3 rounds) — commercial decision
- [ ] Treasury ops: refunds/taxes/supplier/payroll routing + Safe signers + caps
- [ ] Mainnet address registry OWNER_INPUT fill + bytecode verify on Target Chain
- [ ] L2 Reality Certification: SC-0 Owner + Broadcast auth for write SVs
- [ ] L2 Certificate Owner attestation after SC-A…H PASS
- [ ] Legal sign-off vesting + primary market (L3)

## 7. L2 Blockchain Reality Certification（② 主线）

Execute per [TT-WEB3-REALITY-CERTIFICATION.md](../../runbook/TT-WEB3-REALITY-CERTIFICATION.md) Overview — SC-0 → SC-A…H

Overview + SC-0…H + Dashboard: [TT-WEB3-REALITY-CERTIFICATION.md](../../runbook/TT-WEB3-REALITY-CERTIFICATION.md)

## 8. 主网上线阻塞项（L3）

- mainnet-address-registry.v2 all core slots VERIFIED/ACTIVE
- EscrowFactoryV2 REQUIRED (V1 forbidden on mainnet policy)
- L2 Blockchain Reality Certification CLOSED (SC-A…H + Failure paths)
- Legal sign-off vesting + primary market
- Production PSP / webhook L3 gates (orthogonal but GO-blocking)
- Multisig timelock_admin MUST be Safe (RULE-ADMIN-001)
- Treasury ops policy OWNER_INPUT caps filled
- Team vesting contract deployed with FROZEN 1.5M amount

## Automated checks (L1 union)

- ✅ `GATE-web3-alignment` — TT_WEB3_ALIGN_SUMMARY: PASS pass=19 fail=0 warn=0
- ✅ `GATE-treasury-separation` — TT_ASSET_TREASURY_SEPARATION_SUMMARY: WARN
- ✅ `GATE-governance-consistency` — TT_GOV_CONSISTENCY_SUMMARY: PASS
- ✅ `GATE-vesting-registry` — OK: ttg-vesting-registry v4 GenesisV2 team=1.5M community=0.5M dao=3M public_sale=5M rounds=800k+1.2M+3M no_shelf no_advisors
- ✅ `GATE-net-profit-closure` — TT_NP004_AUDIT_SUMMARY: verdict=PASS stamp=20260712T234608Z checks=10 failed=0
- ✅ `SSOT-genesis-v2-allocation` — Genesis V2 15/5/30/50 · PM registry 800k+1.2M+3M
- ✅ `SSOT-pm-usdc-sink-p4cap` — PM USDC → GovernanceTreasuryP4Cap · isolated from escrow
- ✅ `SSOT-treasury-separation-active` — asset-denomination-treasury-separation v1
- ✅ `IDX-escrow-v2-service-complete-event` — EscrowV2 ServiceCompleteConfirmed topic decode
- ✅ `CON-GovernanceVotesToken` — contracts/src/GovernanceVotesToken.sol
- ✅ `CON-TtgPrimaryMarketV1` — contracts/src/TtgPrimaryMarketV1.sol
- ✅ `CON-TravelTrustGovernor` — contracts/src/TravelTrustGovernor.sol
- ✅ `CON-GovernanceTimelock` — contracts/src/GovernanceTimelock.sol
- ✅ `CON-GovernanceTreasuryP4Cap` — contracts/src/GovernanceTreasuryP4Cap.sol
- ✅ `CON-GovernanceTreasury` — contracts/src/GovernanceTreasury.sol
- ✅ `CON-TtgSeatConcentrationRegistry` — contracts/src/TtgSeatConcentrationRegistry.sol
- ✅ `CON-RegionStewardStakePool` — contracts/src/RegionStewardStakePool.sol
- ✅ `CON-EscrowFactory` — contracts/src/EscrowFactory.sol
- ✅ `CON-EscrowFactoryV2` — contracts/src/EscrowFactoryV2.sol
- ✅ `CON-Escrow` — contracts/src/Escrow.sol
- ✅ `CON-EscrowV2` — contracts/src/EscrowV2.sol
- ✅ `CON-FeeRouter` — contracts/src/FeeRouter.sol
- ✅ `CON-RegionVault` — contracts/src/RegionVault.sol
- ✅ `CON-CountryPoolNetProfitLedger` — contracts/src/CountryPoolNetProfitLedger.sol
- ✅ `CON-UnallocatedStewardPathVault` — contracts/src/UnallocatedStewardPathVault.sol
- ✅ `CON-ReserveVault` — contracts/src/ReserveVault.sol
- ✅ `CON-SlashRouter` — contracts/src/SlashRouter.sol
- ✅ `CON-EXT-StewardPathVault` — extended StewardPathVault
- ✅ `CON-EXT-CountryPoolSubVaultsV0` — extended CountryPoolSubVaultsV0
- ✅ `CON-EXT-RegionDistributionClaim` — extended RegionDistributionClaim
- ✅ `CON-EXT-IdentityStakingPool` — extended IdentityStakingPool
- ✅ `CON-EXT-GuideIdentityStakingPool` — extended GuideIdentityStakingPool
- ✅ `CON-EXT-ProviderIdentityStakingPool` — extended ProviderIdentityStakingPool
- ✅ `CON-EXT-TimelockUpgradeableProxy` — extended TimelockUpgradeableProxy
- ✅ `CON-EXT-CountryPoolNetProfitGovernancePayload` — extended CountryPoolNetProfitGovernancePayload
- ✅ `CON-EXT-RouterTreasuryGovernancePayload` — extended RouterTreasuryGovernancePayload
- ✅ `CON-EXT-InvestorDistributionClaim` — extended InvestorDistributionClaim
- ✅ `CON-EXT-OnboardingFeeReceiver` — extended OnboardingFeeReceiver
- ✅ `ABI-escrow-v2-fe-sync` — frontend/dapp/abis EscrowV2+EscrowFactoryV2
- ✅ `REG-mainnet-ready-template` — mainnet slots OWNER_INPUT · deploy NOT_STARTED
- ✅ `API-indexer-internal-tick` — POST /internal/indexer-tick
- ✅ `FE-governance-hub` — frontend\app\governance\page.tsx
- ✅ `FE-escrow-detail` — frontend\app\escrow\[id]\page.tsx
- ✅ `FE-net-profit-ledger` — frontend\app\governance\net-profit-ledger\page.tsx
- ✅ `FE-vacancy-ledger` — frontend\app\governance\vacancy-ledger\page.tsx
- ✅ `IDX-country-net-profit-full-projection` — Full net-profit epoch events — indexer + DB + API + FE pipeline
- ✅ `DOC-fund-flow-ssot` — fund-flow-ssot R1-R4 LOCKED
- ✅ `DOC-l2-reality-cert-ssot` — L2 Blockchain Reality Certification SSOT
- ✅ `DOC-certification-framework` — L1/L2/L3 Certification Framework
- ✅ `TEST-escrow-v2-event-decode` — cargo test maps_service_complete_confirmed

Machine-readable: `evidence/GO_web3_full_system_closure_audit/20260712T234554Z/web3-full-system-closure-audit.json`
