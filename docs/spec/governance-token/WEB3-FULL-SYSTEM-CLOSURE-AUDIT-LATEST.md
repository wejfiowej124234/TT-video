# Web3 Full-System Closure Audit — Latest

**Verdict:** `WARN` · **Stamp:** `20260712T124548Z` · **Phase:** ① local

**Baseline:** `9f500335 → 4f56727e → f575d459 → 1f205af1`

## 1. Web3 全功能清单

| 合约 | 功能 |
|------|------|
| `GovernanceVotesToken` | TTG voting token · snapshots |
| `TtgPrimaryMarketV1` | GOV-04 USDC→TTG primary market |
| `TravelTrustGovernor` | Propose/vote/queue/execute |
| `GovernanceTimelock` | 48h delayed execution |
| `GovernanceTreasuryP4Cap` | USDC Global Treasury · GOV-01 P4 cap |
| `GovernanceTreasury` | Legacy FeeRouter globalOps 15% leg |
| `TtgSeatConcentrationRegistry` | GOV-03 seat concentration |
| `RegionStewardStakePool` | Country pool TTG seat stake |
| `EscrowFactory` | V1 escrow deploy (Sepolia legacy) |
| `EscrowFactoryV2` | V2 bilateral escrow (mainnet path) |
| `Escrow` | Per-order USDC escrow V1 |
| `EscrowV2` | Bilateral service confirmation before release |
| `FeeRouter` | Platform fee 45/55 + global 65/20/15 |
| `RegionVault` | Country bucket receiver |
| `CountryPoolNetProfitLedger` | Quarter net profit 45/55 split |
| `UnallocatedStewardPathVault` | Vacancy ledger V1 |
| `ReserveVault` | Slash reserve · Timelock spend |
| `SlashRouter` | Slash routing to reserve/treasury |

**API 消费面：** governance/* · orders/* · disputes/* · internal/indexer-tick · GET /meta

**前端写链面：** /governance/* · /escrow/[id] · staking · distribution-claim · wagmi + dapp/abis

## 2. 合约与权限矩阵

| 功能 | 合约 | 操作主体 | 授权 | 资产 |
|------|------|----------|------|------|
| TTG mint/transfer | GovernanceVotesToken | Timelock/minter role | Governance proposal | TTG |
| Primary Market purchase | TtgPrimaryMarketV1 | Any buyer wallet | USDC pull + TTG transfer | USDC→P4Cap · TTG→buyer |
| Treasury USDC spend | GovernanceTreasuryP4Cap | Timelock only | P1–P4 policy | USDC |
| Treasury TTG grant | treasury_dao bucket | Timelock | Proposal→Vote | TTG only |
| Escrow deposit | Escrow/EscrowV2 | Payer wallet | transferFrom→escrow | USDC isolated |
| Escrow release/refund | Escrow/EscrowV2 | Arbitrator/parties/rules | State machine | USDC to beneficiary |
| FeeRouter distribute | FeeRouter | Authorized caller | 45/55 split | USDC |
| Country net profit close | CountryPoolNetProfitLedger | Governor→Timelock | Quarter close + split | USDC |
| Seat stake lock | RegionStewardStakePool | Steward wallet | Stake lock per jurisdiction | TTG |
| Governor upgrade | TimelockUpgradeableProxy | Timelock admin Safe | Governance only | N/A |
| Emergency pause | FeeRouter/EscrowFactory | emergency_safe | Pause only · no withdraw | N/A |

## 3. 端到端资金流矩阵

| ID | 流 | 资产 | 来源 | 目标 | 通道 | 支出/备注 |
|----|-----|------|------|------|------|-----------|
| FF-PM | Primary Market | USDC | Buyer | GovernanceTreasuryP4Cap | TtgPrimaryMarketV1.usdcTreasury | Timelock spend P1–P4 |
| FF-PM-TTG | Primary Market TTG leg | TTG | public_global bucket | Buyer wallet | TtgPrimaryMarketV1 | Round caps GOV-04 |
| FF-ESC | Order Escrow | USDC | Traveler/provider | Escrow instance | EscrowFactory(V2) | Release/refund/dispute only |
| FF-FEE | Platform fee | USDC | Escrow settlement | FeeRouter→country+global | FeeRouter | 45% country · 55% global pool |
| FF-NP45 | Country net profit 45% | USDC | CountryPoolNetProfit | Country sub-vaults | StewardPathVault etc. | Country pool ops |
| FF-NP55 | Country net profit 55% | USDC | CountryPoolNetProfit | GovernanceTreasuryP4Cap | Global leg | P1–P4 |
| FF-TTG-DAO | DAO TTG bucket | TTG | treasury_dao 2M | Timelock grants | Governance | ≠ USDC treasury |
| FF-VAC | Vacancy sweep | USDC/TTG policy | Unallocated path | Reserve/governance paths | Vacancy ledger | Governance gated |

SSOT: [asset-denomination-treasury-separation.v1.yaml](../../../registry/asset-denomination-treasury-separation.v1.yaml) · [fund-flow-ssot.v1.md](fund-flow-ssot.v1.md)

## 4. 缺口与风险清单

- **GAP-MAINNET-001** (P0 · ③): Mainnet address registry all OWNER_INPUT — mainnet-address-registry.v2 deploy_status NOT_STARTED
- **GAP-ESCROW-V2-002** (P1 · ③): EscrowFactoryV2 mainnet wiring + FE write path — V2 ABI synced; production factory env + UI default path pending Owner
- **GAP-TREASURY-OPS-003** (P1 · ③): Treasury ops spend classes OWNER_INPUT — refunds/taxes/supplier/payroll in asset-denomination separation SSOT
- **GAP-IDX-NP-004** (P2 · ②): CountryPoolNetProfit full epoch event projection — Vacancy + CountryLedgerCredited indexed; full quarter-close UI projection partial
- **GAP-PM-005** (P1 · ③): Primary Market on-chain ACTIVE — Contract exists · commercial round lockup OWNER_INPUT · mainnet not deployed
- **GAP-VESTING-006** (P1 · ③): Vesting contracts deploy vs registry FROZEN amounts — team/advisors commercial params OWNER_INPUT

## 5. AI 已修复项

- Indexer: EscrowV2 ServiceCompleteConfirmed topic0 decode + unit test
- Frontend: sync EscrowV2.json + EscrowFactoryV2.json from contracts/abi
- Treasury separation SSOT (commit 1f205af1) — TTG dao bucket ≠ USDC P4Cap

## 6. Owner 人工项

- [ ] Fill ttg-vesting-registry commercial OWNER_INPUT (cliff/duration/start/beneficiary)
- [ ] Treasury ops: refunds/taxes/supplier/payroll routing + Safe signers
- [ ] Mainnet address registry OWNER_INPUT fill + bytecode verify
- [ ] Certificate §4 Owner attestation
- [ ] Sepolia Governor V1.1 broadcast auth (TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1)

## 7. ② Sepolia 验证清单

- [ ] Verify PM usdcTreasury == GovernanceTreasuryP4Cap on-chain
- [ ] Escrow V1 lifecycle smoke (create→fund→release/refund/dispute)
- [ ] FeeRouter PlatformFeeRouted → RegionVault + global treasury legs
- [ ] Governor propose/vote/queue/execute dry-run on test proposal
- [ ] Vacancy indexer reconcile gate PASS
- [ ] Treasury P4 cap enforcement tx (GOV-01)

## 8. ③ 主网上线阻塞项

- mainnet-address-registry.v2 all core slots VERIFIED/ACTIVE
- EscrowFactoryV2 REQUIRED (V1 forbidden on mainnet policy)
- Legal sign-off vesting + primary market
- Production PSP / webhook ③ gates (orthogonal but GO-blocking)
- Multisig timelock_admin MUST be Safe (RULE-ADMIN-001)
- Treasury ops policy OWNER_INPUT caps filled

## Automated checks

- ✅ `GATE-web3-alignment` — TT_WEB3_ALIGN_SUMMARY: PASS pass=19 fail=0 warn=0
- ✅ `GATE-treasury-separation` — TT_ASSET_TREASURY_SEPARATION_SUMMARY: PASS
- ✅ `GATE-governance-consistency` — TT_GOV_CONSISTENCY_SUMMARY: PASS
- ✅ `GATE-vesting-registry` — TT_TTG_VESTING_SUMMARY: PASS v3 vesting=team+advisors pm=500k+500k+1m ecosystem=governance bucket_paths=ok
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
- ✅ `ABI-escrow-v2-fe-sync` — frontend/dapp/abis EscrowV2+EscrowFactoryV2
- ✅ `SSOT-treasury-separation-active` — asset-denomination-treasury-separation v1
- ✅ `REG-mainnet-ready-template` — mainnet slots OWNER_INPUT · deploy NOT_STARTED
- ✅ `API-indexer-internal-tick` — POST /internal/indexer-tick
- ✅ `FE-governance-pages` — /governance + /escrow/[id]
- ✅ `IDX-country-net-profit-full-projection` — Full net-profit epoch events — partial indexer coverage (WARN expected)
- ✅ `DOC-fund-flow-ssot` — fund-flow-ssot R1-R4
- ✅ `TEST-escrow-v2-event-decode` — cargo test maps_service_complete_confirmed

Machine-readable: `evidence/GO_web3_full_system_closure_audit/20260712T124548Z/web3-full-system-closure-audit.json`
