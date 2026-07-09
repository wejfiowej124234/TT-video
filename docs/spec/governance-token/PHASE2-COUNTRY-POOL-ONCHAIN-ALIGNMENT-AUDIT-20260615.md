# Phase ② Country Pool 链上对齐审计（2026-06-15）

**阶段口径：** **② 测试网**专项 · **NOT STARTED（D-4555-B）** · **≠** ① 本地 doc-mirror **≠** ③ Production GO

**设计真源（只读对照）：** [country-pool-net-profit-settlement-v1-design.md](country-pool-net-profit-settlement-v1-design.md)  
**Companion 叙事：** [country-revenue-model-v1-draft.md §2](country-revenue-model-v1-draft.md) · **D-4555-B**  
**分轨提醒：** [THREE-TRACK-INDEPENDENT-PARAMS-CONSISTENCY-AUDIT-20260615.md](THREE-TRACK-INDEPENDENT-PARAMS-CONSISTENCY-AUDIT-20260615.md) · **D-4555-A**（FeeRouter 平台费 45/55）**≠** 本文（国家池 **净利润** 45/55）

**审计性质：** **缺口登记 + ② 实施顺序** — **禁止** 在本轮新增合约/API/业务功能。

---

## 1. 命名对照（审计项 ↔ 仓库现实）

| 审计模块名 | 仓库合约 / 模块 | 与 D-4555-B 关系 | ② 测试网「可验收」条件 |
|------------|-----------------|------------------|------------------------|
| **CountryPoolLedger** | `CountryPoolLedgerV0.sol` | **正交** — P5 试点 **运营 credit 账本**；**非** 净利润 P&L | owner `credit` + `CountryLedgerCredited` 索引 + B-385 对拍 |
| **CountryPoolSettlement** | **不存在**（设计草图 **`CountryPoolNetProfitLedger.closeEpoch` / `splitNetProfit`**） | **缺失 — 核心阻塞** | 须 **新合约** + 独立事件 + 独立测试 |
| **CountryPoolDistribution** | **不存在**（近邻：**`RegionDistributionClaim`** = owner 登记 accrual + holder `claim`） | **缺失** — 无 **45%/55% 净利润** 自动分账路径 | 须 **StewardPathVault / GlobalTreasury** 收款 + 分账事件或可核对 transfer |
| **RegionStewardStakePool** | `RegionStewardStakePool.sol` | **正交** — Seat **责任质押**（protocol-ssot bps） | stake/release 路径 + Sepolia owner→Timelock |
| **FeeRouter** | `FeeRouter.sol` | **D-4555-A** — 单笔 **platform fee** 45/55 + Global 65/20/15 | **`_bpsCountry=4500`** 不变；**禁止** 冒充 D-4555-B |
| **Governance Proposal Flow** | `TravelTrustGovernor` + `GovernanceTimelock` + `RouterTreasuryGovernancePayload` | **部分** — 仅 FeeRouter/Treasury/Reserve 载荷 | 须 Timelock **allowlist** + **分提案** payload 扩展 |

**Sepolia 已广播（② spine · 与 D-4555-B 无关）：** 见 [TT-PHASE2-SEPOLIA-SYSTEM-ACCEPTANCE-REPORT.md](../../runbook/TT-PHASE2-SEPOLIA-SYSTEM-ACCEPTANCE-REPORT.md) — `RegionStewardStakePool` · `CountryPoolRedemptionEpochV0`（CN）· `CountryPoolLedgerV0`（DE pilot）· FundStack `FeeRouter` — **均不闭合** 净利润结算。

---

## 2. 设计真源 ↔ 现状矩阵

设计 §4 草图：

```
CountryPoolNetProfitLedger (per jurisdiction)
  ├─ accrue(revenue/expense refs)
  ├─ closeEpoch(epochId)
  ├─ splitNetProfit(epochId)   // 45% steward / 55% global treasury
  └─ events: EpochClosed, NetProfitSplit
```

| 设计能力 | CountryPoolLedgerV0 | CountryPoolSettlement（缺） | CountryPoolDistribution（缺） | RegionStewardStakePool | FeeRouter | Governance Flow |
|----------|---------------------|----------------------------|------------------------------|------------------------|-----------|-----------------|
| 按 **jurisdiction** 分池 | ✅ `pilotJurisdiction`（单试点/部署） | ❌ | ❌ | ✅ 十国 bps | ❌ 单 `countryBucket` | ❌ |
| **净利润** 科目 accrue/debit | ❌ 仅 `credit` 入账 | ❌ | ❌ | ❌ | ❌ | ❌ |
| **closeEpoch** 冻结 P&L | ❌ | ❌ | ❌ | ❌（赎回窗 `EpochOpened/Settled` **不同语义**） | ❌ | ❌ |
| **45/55 净利润** split | ❌ | ❌ | ❌ | ❌ | ⚠️ **45% 是平台费层** | ❌ |
| **StewardPath** 收款 | ❌ | ❌ | ⚠️ `RegionDistributionClaim` 手工登记 | ❌ | ❌ | ❌ |
| **Global Treasury** 55% | ❌ | ❌ | ⚠️ `GovernanceTreasury.spend` 通用 | ❌ | ✅ `globalOps` 等 | ✅ payload 已有 |
| Timelock **owner** | ② 应 Timelock | — | — | ✅ | ✅ | ✅ |
| 独立 **test suite** | ✅ P5 | ❌ | ⚠️ RegionDistribution 单测 | ✅ | ✅ | ✅ |

---

## 3. 缺失字段（合约 storage / 参数）

| ID | 模块 | 设计期望字段 | 现状 | ② 阻塞 |
|----|------|--------------|------|--------|
| **F-01** | Settlement | `epochId` · `epochStart`/`epochEnd` · `revenueAccrued` · `expenseAccrued` · `netProfit` · `closed` · `splitDone` | **无合约** | **P0** |
| **F-02** | Settlement | `stewardShareBps` / `globalShareBps`（默认 **4500/5500** · 治理可改） | **无** | **P0** |
| **F-03** | Settlement | `settlementPeriod`（季度/年度 enum） | **无** | **P1** |
| **F-04** | Settlement | `revenueExpenseRef` / 科目白名单 hash（§3 草案） | **无** | **P1**（待财务/法务冻结科目） |
| **F-05** | Ledger | P&L 维度字段 | 仅有 `_totalCredited[j][token]` | **P0** — 不能复用 Ledger 冒充 Settlement |
| **F-06** | Distribution | `distributionId` ↔ `epochId` 绑定 · `stewardAmount` · `globalAmount` | `RegionDistributionClaim` 无 epoch 键 | **P0** |
| **F-07** | FeeRouter | per-jurisdiction 路由 | 单一 `countryBucket` 地址 | **P2** — D-4555-B **不应** 先改 FeeRouter 结构 |
| **F-08** | Steward pool | 净利润份额 vs 质押 TTG | 仅 `StakePosition` | **正交** — 不混读 |
| **F-09** | Governor | 提案元数据：「净利润结算 vs 募资 vs FeeRouter」类型 | 无 typed proposal | **P1** |

---

## 4. 缺失事件（indexer 依赖）

| ID | 设计事件 | 现状 | ② 需要 |
|----|----------|------|--------|
| **E-01** | **`EpochClosed(jurisdiction, epochId, netProfit, …)`** | ❌ | 新 topic0 + 解码器 |
| **E-02** | **`NetProfitSplit(jurisdiction, epochId, stewardAmount, globalAmount, …)`** | ❌ | 同上 |
| **E-03** | **`NetProfitAccrued` / expense 冲回**（设计 §4 `accrue`） | ❌ | 科目审计链 |
| **E-04** | `CountryLedgerCredited` | ✅ `CountryPoolLedgerV0` | **保留** — **不** 推导净利润 |
| **E-05** | `PlatformFeeRouted` | ✅ `FeeRouter` | **回归不变** |
| **E-06** | `EpochSettled`（赎回） | ✅ `CountryPoolRedemptionEpochV0` | **禁止** 与 D-4555-B 混索引 |
| **E-07** | `RegionAccrualRegistered` | ✅ `RegionDistributionClaim` | **不足** — 无链上 45/55 来源证明 |

---

## 5. 缺失索引 / API / DB

| ID | 设计（§5） | 现状 | 缺口 |
|----|------------|------|------|
| **I-01** | 表 **`country_pool_net_profit_epochs`** | **无 migration** | 全表缺失 |
| **I-02** | `GET …/governance/country-pool/{jurisdiction}/net-profit-epochs` | **无 route**（`rg net_profit` API = 0） | 全路径缺失 |
| **I-03** | indexer-tick 拉取 Settlement 事件 | 仅有 `p5_country_ledger_lines` · `fee_router_routed_events` · `governance_proposals_projection` | **无** net-profit 投影 |
| **I-04** | `ChainConfig` env 键（Settlement 合约 per jurisdiction） | 有 `COUNTRY_POOL_LEDGER_*` · `COUNTRY_POOL_REDEMPTION_*` · **无** `COUNTRY_POOL_NET_PROFIT_*` | registry 未登记 |
| **I-05** | UI `/governance/params` **② 读数** | ① doc-mirror bullet（D-4555-B 文案） | **无** 链上读面 |
| **I-06** | state-machine | 仅 `country_pool_redemption` | **无** `country_pool_net_profit_settlement` 状态机 |

**已有（勿混读）：**

- `p5_country_ledger_lines` + B-385 — **Ledger credit** 对拍  
- `fee_router_routed_events` + B-383 — **D-4555-A**  
- `governance_proposals_projection` — **Governor** 提案  

---

## 6. 缺失治理提案流程

| ID | 流程 | 现状 | ② 需要 |
|----|------|------|--------|
| **G-01** | Timelock **`setAllowedExecutionTarget`** 含 Settlement/Distribution 合约 | FundStack 仅 allow：**FeeRouter · Treasury · ReserveVault · RegionVault · Governor · Token**（`DeployFundStackUnderTimelock` / `Phase2SafeExec`） | 部署后 **admin** 提案登记新 target |
| **G-02** | **`RouterTreasuryGovernancePayload`** 编码 Settlement 调用 | 仅 FeeRouter / Treasury / Reserve selectors | **新 library 或扩展**（`closeEpoch` · `splitNetProfit` · 参数更新） |
| **G-03** | 提案 **分轨**（设计 §4）：募资参数 **≠** 净利润 45/55 **≠** FeeRouter 路由 | 无分类；运营易混 **三轨** | Runbook 提案模板 + 描述前缀 |
| **G-04** | **`splitNetProfit` 执行路径** | 无 | Governor → queue → Timelock → execute |
| **G-05** | **`configureJurisdiction` / 质押 bps** 与 **净利润 split** 分提案 | Steward pool 已有 owner 配置 | **禁止** 单提案同时改 D-4555-A 与 D-4555-B |
| **G-06** | 链下 **`governance_proposals_projection`** 关联 Settlement tx | 仅 Governor 事件 | 可选 **②** 观测：proposalId ↔ epochId 外链 |

---

## 7. 缺失对账逻辑

| ID | 对拍对象 | 现状 | ② 需要 |
|----|----------|------|--------|
| **R-01** | 链上 **`NetProfitSplit` 总额** = 45/55 × **`netProfit`** | ❌ | Forge + staging 脚本 |
| **R-02** | **`country_pool_net_profit_epochs` 行数** vs **`eth_getLogs`** | ❌ | 新 B-xxx obs（平行 B-385 模式） |
| **R-03** | Steward 路径余额 vs **`stewardAmount`** | ❌ | `eth_call` + 金库余额探针 |
| **R-04** | Global 55% vs **`GovernanceTreasury`** / 指定 Treasury 地址 | ⚠️ Treasury 通用 `spend` 无 epoch 维度 | 分账事件 **必须** 可独立审计 |
| **R-05** | **`FeeRouter.PlatformFeeRouted.toCountry`** vs 国家 **净利润** | **无等价关系** | 文档 + 测试 **显式 assert 不等** |
| **R-06** | **`CountryLedgerCredited` 累计** vs 净利润 In | ❌ 无科目映射 | 财务 SSOT 冻结后链下规则引擎 |
| **R-07** | B-386 bundle（三表 log count） | FeeRouter + RegionVault + Ledger | **扩展第四路** 或 **独立** net-profit reconcile |
| **R-08** | Admin overview 回读 | 无 net-profit obs 键 | `GET …/admin/observability/overview` 新字段（②） |

---

## 8. 各模块 ② 测试网实现条件核查

### 8.1 CountryPoolLedger（`CountryPoolLedgerV0`）

| 条件 | 状态 | 备注 |
|------|------|------|
| 合约 + Foundry 测试 | ✅ | `CountryPoolLedgerV0.t.sol` |
| Sepolia 部署 + Timelock owner | ✅ | DE pilot · [TT-PHASE2-P51-COUNTRY-LEDGER-SEPOLIA-BROADCAST-CHECKLIST](../../runbook/TT-PHASE2-P51-COUNTRY-LEDGER-SEPOLIA-BROADCAST-CHECKLIST.md) |
| Indexer + B-385 | ✅ | `p5_country_ledger_lines` |
| API P5-1-C | ✅ | `GET …/governance/country-ledger/:jurisdiction` |
| **满足 D-4555-B Settlement 前置** | ❌ | Ledger **不能** 替代 Settlement；最多作为 **In 科目** 链上锚点之一 |

### 8.2 CountryPoolSettlement（缺失）

| 条件 | 状态 |
|------|------|
| 合约实现 `closeEpoch` / `splitNetProfit` | ❌ **NOT STARTED** |
| 部署脚本 | ❌ |
| Timelock allowlist | ❌ |
| 独立 Foundry 套件（**FeeRouter 测试不变**） | ❌ |
| Sepolia broadcast checklist | ❌ |
| **② 测试网 GO** | ❌ **阻塞于 C-02** |

### 8.3 CountryPoolDistribution（缺失 · 近邻 `RegionDistributionClaim`）

| 条件 | 状态 |
|------|------|
| 自动 45/55 分账到 holder | ❌ |
| `RegionDistributionClaim` Sepolia owner | ⚠️ FundStack 部署 · **手工 accrual** |
| epoch 绑定 + 来源事件 | ❌ |
| **② 测试网 GO** | ❌ |

### 8.4 RegionStewardStakePool

| 条件 | 状态 |
|------|------|
| 合约 + 测试 | ✅ |
| Sepolia + Timelock | ✅ |
| API stake-quote | ✅ |
| **接收净利润 45% 路径** | ❌ 无 StewardPathVault / 无 Settlement 调用 |
| **② 与 D-4555-B 联调** | ❌ 须 Settlement **之后** |

### 8.5 FeeRouter

| 条件 | 状态 |
|------|------|
| D-4555-A 45/55 + Global 65/20/15 | ✅ |
| Sepolia FundStack | ✅ |
| Indexer B-383 + setRoutingConfig 治理 | ✅ |
| **D-4555-B 净利润结算** | ❌ **刻意不在本合约** |
| ② 回归：**第一层测试不变** | 设计 §6 门禁 — **实施 Settlement 时必须跑** |

### 8.6 Governance Proposal Flow

| 条件 | 状态 |
|------|------|
| Governor + Timelock + 提案投影 | ✅ |
| FeeRouter/Treasury 治理载荷 | ✅ `RouterTreasuryGovernancePayload` |
| **净利润 Settlement 提案** | ❌ 无 target · 无 calldata SSOT · 无 Runbook |
| **② 测试网：Settlement 参数变更 E2E** | ❌ |

---

## 9. ② 实施顺序（仅登记 · 禁止跳步）

**Gate-2.1（Closeout · 2026-06-15）：**

1. **架构包 Final：** [country-pool-settlement-architecture-package-v1.md](country-pool-settlement-architecture-package-v1.md) **v1-final** · DR-01～07 ☑ · 四方签字 ☑  
2. **Gate-2.2 Readiness：** [country-pool-settlement-gate2.2-implementation-readiness-checklist.md](country-pool-settlement-gate2.2-implementation-readiness-checklist.md) **全绿** → **允许** `CountryPoolNetProfit*.sol` 分支  
3. **下一合法动作：** Gate-2.2 Solidity PR（Ledger + Vaults + Payload + Foundry **T-***）

**Gate-0（已完成）：**

1. **Gate-0 SSOT：** [country-pool-net-profit-accounting-spec-v1.md](country-pool-net-profit-accounting-spec-v1.md) **v1.0.3** + [country-pool-accounting-mapping-matrix-v1.md](country-pool-accounting-mapping-matrix-v1.md) + [country-pool-legal-freeze-matrix-v1.md](country-pool-legal-freeze-matrix-v1.md) — **Gate-0 Exit ✅（2026-06-15）** · **允许 Gate-2 设计评审**  
2. accounting-spec **§11 Exit Review** 全列 ☑ — **下一合法动作：Gate-2.1 合约设计评审**（**仍禁止** 裸 merge Settlement PR 直至 checklist）  
3. **Gate-0 Exit 已达成（2026-06-15）** — Settlement 合约 PR **须** Gate-2 开工 checklist + 设计评审通过

**Gate-1 · 规格（无链上）：**

| 序 | 动作 | 产出 |
|----|------|------|
| 1.1 | bump `country-revenue-model-v1-draft` §7 勾选 | 定稿标记 |
| 1.2 | 扩展 `state-machine.v1` **`country_pool_net_profit_settlement`** | 状态枚举 SSOT |
| 1.3 | 14 § 合约表 + 99 总览 + registry env 键设计 | `COUNTRY_POOL_NET_PROFIT_*` 命名 |

**Gate-2 · 合约（本地 Foundry · 再 Sepolia）：**

| 序 | 动作 | 依赖 |
|----|------|------|
| 2.1 | 新合约 **`CountryPoolNetProfitLedger`**（或 Settlement 定名）实现 §4 四函数语义 | Gate-0 §3 |
| 2.2 | **`StewardPathVault`** 地址模型 + 55% → **`GovernanceTreasury`**（或 SSOT 指定） | fund-flow-ssot |
| 2.3 | Foundry：**独立** test contract · **显式** `FeeRouter.t.sol` 全绿不变 | 2.1 |
| 2.4 | `DeployCountryPoolNetProfit*.s.sol` + ABI sync | 2.1 |
| 2.5 | Timelock **`setAllowedExecutionTarget`** + **`RouterTreasuryGovernancePayload`** 扩展 | 2.1 |

**Gate-3 · 索引 + API（staging）：**

| 序 | 动作 | 依赖 |
|----|------|------|
| 3.1 | migration **`country_pool_net_profit_epochs`** | E-01/E-02 |
| 3.2 | `crates/api/src/chain/` 解码 + `indexer-tick` 追加拉取 | 3.1 |
| 3.3 | `GET …/net-profit-epochs` + `X-Implementation-Status` | 3.2 |
| 3.4 | B-xxx **`eth_getLogs` count vs DB** + admin overview obs | 3.2 |

**Gate-4 · 治理 E2E（Sepolia）：**

| 序 | 动作 | 依赖 |
|----|------|------|
| 4.1 | Runbook：**提案模板**（分轨声明 + calldata 例） | 2.5 |
| 4.2 | 试点 jurisdiction（建议 **CN** 与现有 Redemption/Ledger  spine 对齐）广播 | 2.4 |
| 4.3 | **`closeEpoch` → `splitNetProfit`** 一笔完整 tx + 索引 + API 读回 | 4.2–3.3 |
| 4.4 | [TT-PHASE2-SEPOLIA-SYSTEM-ACCEPTANCE-REPORT](../../runbook/TT-PHASE2-SEPOLIA-SYSTEM-ACCEPTANCE-REPORT.md) **增节** D-4555-B | 4.3 |

**Gate-5 · UI / 对外（② 末 · 非阻塞链上）：**

| 序 | 动作 |
|----|------|
| 5.1 | `/governance/params` 国家收益 bullet **链到** API 读数（去 pure doc-mirror） |
| 5.2 | 03 摘抄索引 + IR 材料 **显式** D-4555-B **② GO** 条件 |

---

## 10. 验证计划（② · 可执行清单）

| # | 验证项 | 命令 / 入口 | 通过标准 |
|---|--------|-------------|----------|
| V-01 | FeeRouter **回归不变** | `cd contracts && forge test --match-contract FeeRouterTest` | exit 0 · bps 4500/5500 未变 |
| V-02 | Settlement **独立**套件 | `forge test --match-contract CountryPoolNetProfit*`（② 新增） | exit 0 · 45/55 split 精确 |
| V-03 | 分轨 **负向**测试 | Settlement 套件内 assert FeeRouter `toCountry` **≠** steward net-profit share | 测试通过 |
| V-04 | Indexer 投影 | `POST …/internal/indexer-reconcile` + persist | `country_pool_net_profit_epochs` 行 = log 条数 |
| V-05 | API 读面 | `GET …/governance/country-pool/CN/net-profit-epochs` | 200 · epoch 与链上 `epochId` 一致 |
| V-06 | B-385 **仍独立** | `bash scripts/ops/b385-p5-country-ledger-credited-log-count-reconcile-admin-overview-smoke.sh` | exit 0 · Ledger 不受 Settlement 影响 |
| V-07 | 治理 E2E | Governor 提案 → queue → Timelock execute → `NetProfitSplit` event | 链上 + 投影一致 |
| V-08 | protocol-reference | `GET …/governance/protocol-reference` | **`fee_router` 不变** · **无** 假 `net_profit_settled:true` |
| V-09 | 文档互扫 | `rg 'D-4555-B' docs/spec/governance-token` | 活跃路径 **不** 写「已链上 GO」除非 4.4 闭 |

---

## 11. 审计结论

| 项 | 结论 |
|----|------|
| **D-4555-B ② 测试网实现条件** | **不具备** — **C-02** 核心合约 **零实现** |
| **已部署 Country Pool 相关** | Ledger / Redemption / Steward / FeeRouter — **均不构成** 净利润结算 |
| **最大缺口** | **Settlement 合约 + E-01/E-02 + I-01/I-02 + G-02/G-04 + R-01/R-02** |
| **本轮范围** | **仅登记** — **未** 新增合约、API、migration |
| **下一合法动作** | **Gate-2.2** Solidity 分支 + Foundry **T-***（Readiness 全绿 · **②**）

**诚实边界：** Sepolia spine **PASS**（Stake / Redemption / Ledger / FeeRouter）**不得** 宣称 **国家池净利润 45/55 已测试网 GO**。

---

## 12. 变更记录

| 日期 | 说明 |
|------|------|
| 2026-06-15 | 初版：Phase ② 链上对齐审计 · 缺口登记 · 实施顺序 · 验证计划 |
