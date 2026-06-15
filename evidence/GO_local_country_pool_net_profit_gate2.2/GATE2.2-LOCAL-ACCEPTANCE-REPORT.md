# Gate-2.2 Local Acceptance Report · D-4555-B Settlement

**Report ID:** `GO_local_country_pool_net_profit_gate2.2`  
**Branch:** `feature/country-pool-net-profit-ledger`  
**Phase:** **① 本地**（Foundry · Anvil-ready deploy script · **非** ② broadcast）  
**Date:** 2026-06-15  
**Witness:** Sebastian Ward（工程 · Gate-2.2 收口）

---

## 阶段边界（写死）

> **① 本地合约绿，不等于 ② Sepolia GO。**

本报告 **仅** 证明 Gate-2.2 最小 Settlement 合约包在本地 Foundry 矩阵 **exit 0**。**禁止** 用本报告宣称 ② 测试网部署 / Sepolia broadcast / staging GO / ③ Production GO。

---

## 交付范围（Gate-2.2 · 最小包）

| 类型 | 路径 |
|------|------|
| Ledger | `contracts/src/CountryPoolNetProfitLedger.sol` |
| Vaults | `contracts/src/StewardPathVault.sol` · `UnallocatedStewardPathVault.sol` |
| Payload | `contracts/src/CountryPoolNetProfitGovernancePayload.sol` |
| Tests | `contracts/test/CountryPoolNetProfit*.t.sol`（3 文件） |
| Deploy | `contracts/script/DeployCountryPoolNetProfitStack.s.sol`（Anvil / 本地 dry-run） |
| Compiler | `contracts/foundry.toml` · `via_ir` + optimizer |

**本轮未纳入（硬闸）：** indexer migration · 公网 API · Sepolia broadcast · `recordAccrualBatch` · Phase 2.3+ 功能

---

## 机读验收（exit 0）

| 命令 | 结果 | 证据 |
|------|------|------|
| `cd contracts && forge test --match-contract CountryPoolNetProfit` | **38 passed** · 0 failed | `forge_country_pool_net_profit.log` |
| `cd contracts && forge test --match-contract FeeRouterTest` | **10 passed** · 0 failed | `forge_fee_router_regression.log` |

**Solc:** 0.8.19 · **EVM:** paris · **Profile:** `via_ir=true` · `optimizer_runs=200`

---

## Foundry 矩阵（arch §10）

| 组 | 覆盖 | 套件 |
|----|------|------|
| T-ACC | 01～05 | `CountryPoolNetProfitLedger.t.sol` |
| T-CLS | 01～06 | 同上 |
| T-FND | 01～04 | 同上 |
| T-SPL | 01～08 | 同上 |
| T-UNA | 01～05 | 同上 |
| T-QLF | 01～06 | 同上 |
| T-GOV | 01～04 | Ledger + `CountryPoolNetProfitGovernancePayload.t.sol`（T-GOV-03） |
| T-REG | 01～04 | `CountryPoolNetProfitRegression.t.sol` |

---

## G22-D 完成度（Gate-2.2 首 PR DoD）

| ID | 项 | 状态 | 备注 |
|----|-----|------|------|
| **G22-D-01** | CountryPoolNetProfit 全 T-* | **✅** | 38 passed |
| **G22-D-02** | Payload selector parity | **✅** | T-GOV-03 |
| **G22-D-03** | ABI sync → `contracts/abi/` | **⏳ Gate-2.4** | 非 Gate-2.2 阻塞 |
| **G22-D-04** | Deploy script Anvil dry-run | **✅ 本地** | 脚本就绪；**≠** ② broadcast |

---

## Gate-2.2 结论

| 项 | 结论 |
|----|------|
| **Gate-2.2 本地收口** | **✅ ACTIVE（①）** |
| **② Sepolia GO** | **❌ 未开始 · 禁止跳阶** |
| **下一合法阶段** | **Gate-2.3 前置审查**（见 `GATE2.3-PRE-REVIEW.md`） |

**SSOT：** `docs/spec/governance-token/country-pool-settlement-gate2.2-implementation-readiness-checklist.md` · `country-pool-settlement-architecture-package-v1.md`
