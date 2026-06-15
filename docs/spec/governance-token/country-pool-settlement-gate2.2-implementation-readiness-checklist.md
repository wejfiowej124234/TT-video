# Gate-2.2 Implementation Readiness Checklist

**Checklist ID:** `country-pool-settlement-gate2.2-readiness`  
**Version:** v1-20260615  
**Status:** **READY（② · 全绿 · 允许创建 Solidity 分支）**  
**Architecture SSOT:** [country-pool-settlement-architecture-package-v1.md](country-pool-settlement-architecture-package-v1.md) **v1-final**

**硬闸：** 本表 **任一 ☐** → **禁止** 创建 / checkout **`feature/country-pool-net-profit-ledger`**（或等价）分支 · **禁止** 新增 **`CountryPoolNetProfit*.sol`**

**阶段边界：** 全绿 **=** Gate-2.2 **开分支许可** · **≠** ② Sepolia GO · **≠** ③ Production GO

---

## 0. 使用说明

| 列 | 含义 |
|----|------|
| **ID** | 可 grep 追踪项 |
| **验证** | 本地命令 / 文档锚点 |
| **产品/财务/法务/工程** | 四方确认列（Gate-2.1 已签则 **✅**） |

**开分支前命令（工程自检）：**

```bash
# 须 exit 0 · 无 CountryPoolNetProfit*.sol
! glob_files CountryPoolNetProfit*.sol 2>/dev/null | head -1
test -f docs/spec/governance-token/country-pool-settlement-architecture-package-v1.md
grep -q "GATE-2.1 CLOSEOUT" docs/spec/governance-token/country-pool-settlement-architecture-package-v1.md
grep -q "READY" docs/spec/governance-token/country-pool-settlement-gate2.2-implementation-readiness-checklist.md
cd contracts && forge test --match-contract FeeRouterTest
```

---

## 1. Gate-0 / Gate-2.1 前置（须 ✅）

| ID | 检查项 | 验证 | 产 | 财 | 法 | 工 |
|----|--------|------|----|----|----|-----|
| **G22-P-01** | Gate-0 Exit · accounting-spec v1.0.3 | §11 全绿 | ✅ | ✅ | ✅ | ✅ |
| **G22-P-02** | Architecture Package **v1 Final** | 文首 `v1-final-gate2.1-closeout` | ✅ | ✅ | ✅ | ✅ |
| **G22-P-03** | Gate-2.1 四方设计签字 | arch §12 | ✅ | ✅ | ✅ | ✅ |
| **G22-P-04** | **零** 既有 Settlement Solidity | `Glob CountryPoolNetProfit*` empty | ✅ | ✅ | ✅ | ✅ |

---

## 2. DR 决议关闭（须 ✅）

| ID | 检查项 | SSOT | 产 | 财 | 法 | 工 |
|----|--------|------|----|----|----|-----|
| **G22-DR-01** | **ActiveStewardConfig** + split batch 原子性 | arch §6.1 · §11 DR-01 | ✅ | ✅ | ✅ | ✅ |
| **G22-DR-02** | 记账 **`recordAccrual`** / 归集 **`fundLedgerForSplit`** 分步 | arch §4.2 · §7.4 · DR-02 | ✅ | ✅ | ✅ | ✅ |
| **G22-DR-03** | v1 **单笔** accrual · batch = Gate-2.3 | arch §11 DR-03 | ✅ | ✅ | ✅ | ✅ |
| **G22-DR-04** | 定名 **`CountryPoolNetProfitLedger`** + 双 Vault | arch §11 DR-04 | ✅ | ✅ | ✅ | ✅ |
| **G22-DR-05** | Env 键 + **`JURISDICTION_COUNTRY_POOL_NET_PROFIT_CONFIG_PATH`** | arch §11.1 | ✅ | ✅ | ✅ | ✅ |
| **G22-DR-06** | **Triplet Bundle** 部署模式 | arch §11.2 | ✅ | ✅ | ✅ | ✅ |
| **G22-DR-07** | 跨国 JSON 模板 · 一国一条 | arch §11.3 · `config/jurisdiction_country_pool_net_profit.template.json` | ✅ | ✅ | ✅ | ✅ |

---

## 3. 实现规格冻结（须 ✅ · Gate-2.2 须 1:1）

| ID | 检查项 | SSOT | 工 |
|----|--------|------|-----|
| **G22-S-01** | 状态机 **`country_pool_net_profit_settlement`** | state-machine §4a | ✅ |
| **G22-S-02** | 事件 **`NetProfitAccrued` / `EpochClosed` / `NetProfitSplit` / `LedgerFundedForSplit`** | arch §5 | ✅ |
| **G22-S-03** | **`CountryPoolNetProfitGovernancePayload`** selector 表 | arch §7.2 | ✅ |
| **G22-S-04** | Foundry 矩阵 **T-ACC…T-INV** + **T-FND** + **T-QLF-05/06** | arch §10 | ✅ |
| **G22-S-05** | Timelock allowlist ×3 + **B-407** 负向 | arch §7.1 | ✅ |
| **G22-S-06** | FeeRouter 回归 **不变**（开分支前基线绿） | `forge test --match-contract FeeRouterTest` | ✅ |
| **G22-S-07** | 分轨负向 **T-REG-01～04** 列入首 PR DoD | arch §10.6 | ✅ |
| **G22-S-08** | Indexer/API **仅设计** · 首 PR **不** 改 migration | arch §8～§9 · Gate-3 | ✅ |

---

## 4. 合规 / 财务交叉（须 ✅）

| ID | 检查项 | SSOT | 财 | 法 |
|----|--------|------|----|-----|
| **G22-C-01** | Unallocated **≠** Global · Q-F02 | legal-matrix L-06/L-07 | ✅ | ✅ |
| **G22-C-02** | **`carriedLoss`** 链上 SSOT | mapping-matrix FIN-L02 | ✅ | ✅ |
| **G22-C-03** | 无收益保证 / 亏损期无 split 披露链 | legal-matrix L-02/L-05 | ✅ | ✅ |
| **G22-C-04** | D-4555-A/B 双轨 · 禁止双重 45/55 | legal-matrix L-01 | ✅ | ✅ |

---

## 5. Exit 结论

| 项 | 状态 |
|----|------|
| **Checklist 行数** | **G22-P-04** + **DR-01～07** + **S-01～08** + **C-01～04** = **全 ✅** |
| **开分支许可** | **✅ 2026-06-15** |
| **首 PR 范围（Gate-2.2）** | `CountryPoolNetProfitLedger` + Vaults + Payload lib + **`CountryPoolNetProfit*.t.sol`** · **不含** indexer migration / 公网 API |
| **仍禁止** | Sepolia broadcast · ③ 对外印刷 · **`recordAccrualBatch`**（Gate-2.3） |

**签字（Readiness 见证）：** **Sebastian Ward（工程 Gate-2.2 Readiness · 2026-06-15）**

---

## 6. Gate-2.2 首 PR 完成定义（开分支 **后** · 非本表前置）

| ID | 项 | 目标 |
|----|-----|------|
| **G22-D-01** | `forge test --match-contract CountryPoolNetProfit` exit 0 | 全 **T-*** |
| **G22-D-02** | `RouterTreasuryGovernancePayload.t.sol` 模式 payload 测试 | selector parity |
| **G22-D-03** | ABI sync **`CountryPoolNetProfitLedger.json`** | ✅ Gate-2.3 G23-04 · manifest |
| **G22-D-04** | **`DeployCountryPoolNetProfitStack.s.sol`** dry-run Anvil | DR-06 |

---

## 7. 变更记录

| Version | Date | Note |
|---------|------|------|
| v1-20260615 | 2026-06-15 | Gate-2.1 Closeout 后首版 · 全绿 · 允许 Solidity 分支 |
