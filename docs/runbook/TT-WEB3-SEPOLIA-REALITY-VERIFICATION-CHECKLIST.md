# TT Web3 Sepolia Reality Verification Checklist

**Document ID:** `TT-WEB3-SEPOLIA-REALITY-VERIFICATION`  
**Phase:** **② 测试网 · Reality Verification**（≠ ③ Production GO）  
**Baseline chain:** `9f500335` → `4f56727e` → `f575d459` → `1f205af1` → `d1bee7fc` → `ee9df065`  
**Status:** **PREPARED · NOT STARTED** — 禁止无 Owner 授权 broadcast

> **职责：** 将 [WEB3-FULL-SYSTEM-CLOSURE-AUDIT-LATEST.md](../spec/governance-token/WEB3-FULL-SYSTEM-CLOSURE-AUDIT-LATEST.md) §7 六条验证落实为**可逐条执行 · 记录 tx hash · 留证据**的操作清单。  
> **不等于：** ① 本地 PASS · ③ 主网部署 · Production GO。

---

## 0. 入口闸（任何链上写操作前）

| # | 项 | 要求 | 记录 |
|---|-----|------|------|
| 0.1 | Owner 授权 | `TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1` **本轮书面授权** | ☐ |
| 0.2 | 网络 | `chain_id=11155111` · Sepolia RPC 可用 | ☐ |
| 0.3 | 钱包 | Owner / 测试钱包 **非 Agent 模拟** | ☐ |
| 0.4 | 地址 SSOT | [protocol-convergence-deployments.v1.yaml](../../registry/protocol-convergence-deployments.v1.yaml) · gov_freeze_v2_clean_baseline | ☐ |

**禁止：** 裸 `forge script … --broadcast` · 主网 chain_id · 真实商业 USDC 预算支出

---

## 1. SV-01 · Primary Market USDC sink 对拍

**目标：** 链上 `TtgPrimaryMarketV1.usdcTreasury()` == `GovernanceTreasuryP4Cap` 地址

| 字段 | 值 |
|------|-----|
| **Read 命令** | `cast call $PRIMARY_MARKET "usdcTreasury()(address)" --rpc-url $SEPOLIA_RPC` |
| **期望** | `0xc1de17cd47b3ef2a68a4dc6cb1a5cc4fd4eb5ce2`（Sepolia baseline · 部署变更则更新） |
| **对比** | `cast call $GOVERNANCE_TREASURY_P4CAP "..."` 或 env `GOVERNANCE_TREASURY_P4CAP_ADDRESS` |
| **Tx hash** | N/A（read-only） |
| **证据路径** | `evidence/GO_phase2_testnet_20260526/sepolia-reality/SV-01-pm-usdc-sink-<stamp>.json` |
| **Pass 标准** | 两地址 equal · checksum 一致 |
| **状态** | ☐ NOT RUN |

```json
{
  "check_id": "SV-01",
  "primary_market_usdc_treasury": "OWNER_FILL",
  "governance_treasury_p4cap": "OWNER_FILL",
  "match": false,
  "rpc_url_redacted": true,
  "verified_utc": null
}
```

---

## 2. SV-02 · Escrow V1 全生命周期 smoke

**目标：** create → fund → release **或** refund **或** dispute→resolve 至少一条完整路径

| 步骤 | 动作 | 记录 |
|------|------|------|
| 2.1 | `EscrowFactory.createEscrow(orderId, …)` | tx: `0x…` |
| 2.2 | `Escrow.deposit(amount)` USDC test | tx: `0x…` |
| 2.3a | **Happy path** `release()` | tx: `0x…` |
| 2.3b | **或 Refund path** `refund()` | tx: `0x…` |
| 2.3c | **或 Dispute path** `openDispute` → `executeResolution` | tx: `0x…` / `0x…` |
| 2.4 | `POST /api/v1/internal/indexer-tick` 投影 | orders.chain-sync-status = aligned |
| 2.5 | UI `/escrow/[id]` 状态与链一致 | screenshot optional |

**本地烟测前置（①）：** `bash scripts/dev/smoke-web3-itinerary-full-chain-local.sh` exit 0  
**Sepolia 脚本参考：** `scripts/dev/run-g3-02-web3-payment-production-verification.cjs`（PAY-W* 子集）  
**证据路径：** `evidence/GO_phase2_testnet_20260526/sepolia-reality/SV-02-escrow-lifecycle-<stamp>.json`  
**状态** | ☐ NOT RUN

---

## 3. SV-03 · FeeRouter → RegionVault + Global Treasury

**目标：** 一笔 `PlatformFeeRouted` 事件 · country 45% + global 55% 可链上读取 · indexer 投影

| 字段 | 值 |
|------|-----|
| **触发** | 测试订单 settlement 或 staged `FeeRouter.distribute`（按部署文档） |
| **链上验证** | `cast logs` / Etherscan 查 `PlatformFeeRouted` |
| **Indexer** | `GET /api/v1/governance/fee-routes` 含该 tx 投影 |
| **RegionVault** | `GET /api/v1/governance/vault-forwards` 若有 forward leg |
| **Global 55% leg** | 进入 `GovernanceTreasuryP4Cap` 或 Legacy 15% ops（按 fund-flow-ssot R4 叙事） |
| **Tx hash** | `0x…` |
| **证据路径** | `evidence/.../SV-03-fee-router-<stamp>.json` |
| **状态** | ☐ NOT RUN |

---

## 4. SV-04 · Governor propose → vote → queue → execute

**目标：** 测试提案完整治理路径（**非**主网升级 · 可用 noop/calldata 测试）

| 步骤 | 动作 | tx hash |
|------|------|---------|
| 4.1 | `propose(targets, values, calldatas, description)` | `0x…` |
| 4.2 | `cast vote` / UI vote | `0x…` |
| 4.3 | `queue` after quorum | `0x…` |
| 4.4 | wait Timelock 48h **或** Sepolia 测试缩短配置 | block/time |
| 4.5 | `execute` | `0x…` |
| 4.6 | Indexer Governor 事件 + `/governance/proposals/[id]` | API aligned |

**前置：** Governor V1.1 `cap_disabled` 升级若未 broadcast → 先 [TT-PHASE2-GOVERNANCE-STACK-SEPOLIA-BROADCAST-CHECKLIST.md](TT-PHASE2-GOVERNANCE-STACK-SEPOLIA-BROADCAST-CHECKLIST.md)  
**证据路径：** `evidence/.../SV-04-governance-path-<stamp>.json`  
**状态** | ☐ NOT RUN

---

## 5. SV-05 · Vacancy indexer reconcile

**目标：** `bash scripts/gates/check-web3-vacancy-indexer-reconcile-gate.sh` exit 0 on Sepolia RPC

| 字段 | 值 |
|------|-----|
| **命令** | `CHAIN_RPC_URL=$SEPOLIA_RPC CHAIN_ID=11155111 bash scripts/gates/check-web3-vacancy-indexer-reconcile-gate.sh` |
| **API** | `GET /api/v1/governance/vacancy-ledger` vs chain view |
| **Tx hash** | N/A 或 vacancy 触发 tx 列表 |
| **证据路径** | `evidence/.../SV-05-vacancy-reconcile-<stamp>.json` |
| **状态** | ☐ NOT RUN |

---

## 5b. SV-05-NP · Country Pool Net Profit（D-4555-B）indexer → API → UI

**目标：** 链上 `EpochOpened` … `NetProfitSplit` / Vault deposit 事件经 indexer 投影后，治理页与 Admin 控制台可读且 **45/55 会计守恒** PASS

| 字段 | 值 |
|------|-----|
| **① 能力闸** | `bash scripts/gates/run-country-pool-net-profit-closure-audit.sh` exit 0 |
| **Indexer** | `POST /internal/indexer-tick`（Sepolia · `COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS` 已配置） |
| **API** | `GET /api/v1/governance/net-profit-ledger?jurisdiction=DE` · `GET /api/v1/admin/net-profit-ledger` |
| **UI** | `/governance/net-profit-ledger` · `/admin/net-profit-ledger` |
| **会计** | 响应 `accountingAudit.status` == `PASS`（`NetProfitSplit` 守恒） |
| **证据路径** | `evidence/GO_phase2_testnet_20260526/sepolia-reality/SV-05-NP-net-profit-<stamp>.json` |
| **状态** | ☐ NOT RUN |

---

## 6. SV-06 · Treasury P4 cap 实花 tx（GOV-01）

**目标：** 证明 P4 deploy 受 30% cap 约束 · **非** spend 本身 GO

| 字段 | 值 |
|------|-----|
| **Read** | `treasuryP4DeployCapBps()` == 3000 |
| **Attempt** | Timelock 队列一笔 **超 cap** P4 spend → expect revert `P4CapExceeded` |
| **Attempt** | Timelock 队列一笔 **合法** P4 spend → success |
| **Tx hash** | revert tx: `0x…` · success tx: `0x…` |
| **参考测试** | `contracts/test/TtgGovFreezeV1Enforcement.t.sol` |
| **证据路径** | `evidence/.../SV-06-p4-cap-<stamp>.json` |
| **状态** | ☐ NOT RUN |

---

## 7. 汇总签字（② Reality Verification CLOSED 条件）

| 项 | 结论 |
|----|------|
| SV-01..06 全部 PASS | ☐ |
| SV-05-NP（Net Profit 全链）PASS | ☐ |
| 全部 tx hash 已登记 | ☐ |
| Indexer/API/UI 与链对拍无 P0 drift | ☐ |
| **② Sepolia Reality Verification** | **NOT STARTED** |

**诚实边界：** ② CLOSED **≠** ③ Mainnet OWNER_INPUT filled **≠** Production GO

---

## 8. 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1-20260712 | 2026-07-12 | 初版：六条 SV 可执行模板 · 无 broadcast |
