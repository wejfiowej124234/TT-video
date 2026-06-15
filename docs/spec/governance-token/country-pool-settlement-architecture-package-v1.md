# Settlement Architecture Package v1

**Package ID:** `country-pool-settlement-architecture-v1`  
**Version:** v1-final-gate2.1-closeout-20260615  
**Status:** **GATE-2.1 CLOSEOUT · DESIGN REVIEW FINAL（② · 零 Solidity · Gate-2.2 就绪清单已生成）**  
**Gate-0 SSOT（已冻结）：**

| 文档 | 角色 |
|------|------|
| [country-pool-net-profit-accounting-spec-v1.md](country-pool-net-profit-accounting-spec-v1.md) v1.0.3 | 科目 · 周期 · 亏损 · 45/55 · 资格 · 签字 |
| [country-pool-accounting-mapping-matrix-v1.md](country-pool-accounting-mapping-matrix-v1.md) v1.0.2 | COA · NetProfit' · carriedLoss · 2150 Unallocated |
| [country-pool-legal-freeze-matrix-v1.md](country-pool-legal-freeze-matrix-v1.md) v1.0.3 | L-01～L-07 · LEG-XJ · 披露 |
| [country-pool-net-profit-settlement-v1-design.md](country-pool-net-profit-settlement-v1-design.md) | 上位 D-4555-B 设计 sketch |

**链上对齐登记：** [PHASE2-COUNTRY-POOL-ONCHAIN-ALIGNMENT-AUDIT-20260615.md](PHASE2-COUNTRY-POOL-ONCHAIN-ALIGNMENT-AUDIT-20260615.md)

**阶段边界：** Gate-2.1 **已关闭**。**禁止** 在 [Gate-2.2 Implementation Readiness Checklist](country-pool-settlement-gate2.2-implementation-readiness-checklist.md) **全绿前** 创建 **`CountryPoolNetProfit*.sol`** 分支。**≠** ② 测试网 GO · **≠** ③ Production GO。

**Gate-2.2 入口：** [country-pool-settlement-gate2.2-implementation-readiness-checklist.md](country-pool-settlement-gate2.2-implementation-readiness-checklist.md)

---

## 0. Gate-2.1 评审目标与硬闸

| 规则 | 说明 |
|------|------|
| **G2.1-HARD-01** | 本包 **零** Solidity · **零** migration · **零** API 实现 |
| **G2.1-HARD-02** | Gate-2.2 合约 PR **须** 与本包 **1:1** 可追溯（函数名 · 事件 · 存储键 · 测试 ID） |
| **G2.1-HARD-03** | **禁止** 修改 `FeeRouter` 第一层语义 · **禁止** 用 `PlatformFeeRouted.toCountry` 冒充 split |
| **G2.1-HARD-04** | `CountryPoolRedemptionEpochV0` 的 `EpochOpened/Settled` **≠** 本包 `EpochClosed` |
| **G2.1-HARD-05** | 三轨提案 **分轨**（G-03）：D-4555-A / 募资 / D-4555-B **不得** 同 calldata |

**评审产出：** §12 设计评审签字 **✅ Closeout** · [Gate-2.2 Readiness Checklist](country-pool-settlement-gate2.2-implementation-readiness-checklist.md) **全绿后** 开 Solidity 分支。

---

## 1. 合约边界（Contract Boundaries）

### 1.1 模块拓扑

```text
                    ┌─────────────────────────────────────┐
                    │     GovernanceTimelock (existing)    │
                    │  schedule / execute · allowlist B-407 │
                    └──────────────┬──────────────────────┘
                                   │ owner / onlyTimelock
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
 CountryPoolNetProfitLedger   StewardPathVault          UnallocatedStewardPathVault
 (per jurisdiction · NEW)     (per jurisdiction · NEW)  (per jurisdiction · NEW)
         │                         ▲                         ▲
         │ splitNetProfit          │ 45% eligible            │ 45% Q-F01
         └─────────────────────────┴─────────────────────────┘
                                   │
                                   ▼ 55% leg
                          GovernanceTreasury (existing)
```

**Companion library（Gate-2.2 · 无链上状态）：** `CountryPoolNetProfitGovernancePayload` — 平行 `RouterTreasuryGovernancePayload` · 编码 `closeEpoch` / `splitNetProfit` / `releaseUnallocated` / 参数更新。

### 1.2 模块职责矩阵

| 模块 | 职责 | **在边界内** | **在边界外** |
|------|------|-------------|-------------|
| **`CountryPoolNetProfitLedger`** | P&L accrual · epoch 关账 · split 编排 · `carriedLoss` SSOT | `accrue*` · `openEpoch` · `closeEpoch` · `splitNetProfit` · 读 `epochs` / `carriedLoss` | 不路由 Escrow 订单费 · 不改 NAV 赎回 · 不 mint TTG |
| **`StewardPathVault`** | 接收 **eligible** 45% · 供后续 RegionDistribution / 治理分配 | `depositFromLedger` · 余额 view · Timelock `sweep`（若需） | 不直付 EOA（**Q-F05**） · 不自动按质押比例分 |
| **`UnallocatedStewardPathVault`** | **Q-F01** 45% 协议托管 · 治理释放 | `depositFromLedger` · `releaseToStewardPath`（Timelock） | **禁止** forward 至 Global · burn · 跨 **J** |
| **`GovernanceTreasury`** | 接收 55% global 腿 | 现有 `receive` / 余额 · `spend` 仍经治理 | 不吸收 Unallocated |
| **`CountryPoolLedgerV0`** | P5 运营 credit 账本 | `CountryLedgerCredited` 可作 **R-100 链下归因输入** | **不能** 替代 Ledger accrual / close / split |
| **`FeeRouter`** | D-4555-A | 不变 | **零** 净利润 split 逻辑 |
| **`CountryPoolRedemptionEpochV0`** | NAV 赎回窗 | 并行存在 | **零** 写入 net-profit epoch 投影 |
| **`RegionStewardStakePool`** | Q-02 质押门槛 | `hasJurisdictionStake` · `minStakeAmount` view | 不接收净利润 token（v1） |

### 1.3 部署粒度（v1 冻结建议）

| 项 | 定案 |
|----|------|
| **Ledger** | **一 jurisdiction 一合约**（与 `CountryPoolLedgerV0` / `CountryPoolRedemptionEpochV0` 试点模式一致） |
| **Vault 对** | 每 **J** 各 1× `StewardPathVault` + 1× `UnallocatedStewardPathVault` |
| **Token** | Phase ② 试点 **单币 USDC** per **J**（**S-03** · 多币 = 多 Ledger 实例） |
| **Owner** | 全部 **`GovernanceTimelock`** · 无 EOA owner 直调 split |

### 1.4 与 Gate-0 科目映射

| 链上动作 | Spec 科目 | FIN GL |
|----------|-----------|--------|
| `NetProfitAccrued` + | R-100～R-199 | 410x-CP-{J} |
| `NetProfitAccrued` − | E-100～E-199 | 510x-CP-{J} |
| `closeEpoch` · `carriedLossApplied` | E-199-CLF | 5109-CLF-{J} |
| `splitNetProfit` steward | 45% eligible | 2201-CP-STEWARD-{J} |
| `splitNetProfit` unallocated | 45% Q-F01 | 2150-CP-UNALLOC-{J} |
| `splitNetProfit` global | 55% | 2101-CP-GLOBAL-DUE |

---

## 2. 状态机（`country_pool_net_profit_settlement`）

**SSOT 登记（Gate-2.2 同批）：** 扩展 [state-machine.v1.md](state-machine.v1.md) **§4a** `country_pool_net_profit_settlement`（本文 §2 详述）。

### 2.1 Epoch 级状态（per `jurisdiction` × `epochId`）

```text
                    openEpoch (Timelock)
                           │
                           ▼
                      ┌─────────┐
         accrue* ───► │  OPEN   │ ◄─── NetProfitAccrued (±)
                      └────┬────┘
                           │ closeEpoch (Timelock · P-03 时间闸)
                           ▼
                      ┌─────────┐
                      │ CLOSED  │
                      └────┬────┘
                           │
              ┌────────────┴────────────┐
              │ netProfit' <= 0         │ netProfit' > 0
              ▼                         ▼
        ┌───────────┐            ┌─────────────┐
        │ NO_SPLIT  │            │SPLIT_PENDING│
        └───────────┘            └──────┬──────┘
              │                         │ splitNetProfit (Timelock)
              │                         ▼
              │                  ┌────────────────┐
              │                  │ SPLIT_COMPLETED│
              │                  └────────────────┘
              └──────────► (terminal)
```

| 状态 | 含义 | 允许转换 |
|------|------|----------|
| **`OPEN`** | 周期内 accrual · **P-05** 禁止 split | → `CLOSED` |
| **`CLOSED`** | P&L 冻结 · `EpochClosed` 已发 | → `NO_SPLIT` · `SPLIT_PENDING` |
| **`NO_SPLIT`** | **L-01/L-04** · 无 `NetProfitSplit` | 终态 |
| **`SPLIT_PENDING`** | **NetProfit' > 0** · 待 split | → `SPLIT_COMPLETED` |
| **`SPLIT_COMPLETED`** | `NetProfitSplit` 已发 · 资金已路由 | 终态 |

**非法转换（Must Revert）：** `OPEN` → split · 重复 `closeEpoch` · 重复 `splitNetProfit` · `CLOSED` 前 accrue（v1 **禁止** 关账后补 accrual）。

### 2.2 Jurisdiction 级状态（per `jurisdiction` × `token`）

| 字段 | 类型 | 说明 |
|------|------|------|
| **`carriedLoss`** | uint256 | **FIN-L02-01** 链上 SSOT · 仅 `closeEpoch` 增加 · `split` 前扣减 |
| **`latestEpochId`** | uint256 | **P-01** 单调递增 |
| **`settlementPaused`** | bool | 治理暂停 accrue/close/split（Runbook ③） |

### 2.3 Unallocated 释放子状态（正交 · per vault）

```text
UNALLOC_IDLE ── depositFromLedger ──► UNALLOC_HOLDING
UNALLOC_HOLDING ── releaseToStewardPath (Timelock · U-04) ──► UNALLOC_REDUCED
```

**禁止边：** `UNALLOC_HOLDING` → `GovernanceTreasury`（**U-02 · Q-F02 · LEG-L07**）。

---

## 3. 存储结构（Storage Layout · 设计）

### 3.1 `CountryPoolNetProfitLedger` — 核心映射

| 存储键 | 类型（概念） | 说明 |
|--------|-------------|------|
| **`jurisdiction`** | `bytes2 immutable` | 单池 pilot · 如 DE/CN |
| **`settlementToken`** | `address immutable` | USDC · **S-03** |
| **`closeDelaySeconds`** | `uint64` | 默认 **15d** · 治理可改（独立提案） |
| **`bpsStewardPath`** | `uint16` | 默认 **4500** |
| **`bpsGlobalTreasury`** | `uint16` | 默认 **5500** · **须** steward+global ≤ 10000 |
| **`carriedLoss`** | `uint256` | per token（v1 单币可扁平） |
| **`epochs[epochId]`** | `EpochRecord` | 见 §3.2 |
| **`latestEpochId`** | `uint256` | |
| **`accrualRefs[refHash]`** | `bool` | 防重复 `ref` 双计 |
| **`stewardPathVault`** | `address` | 收款 |
| **`unallocatedStewardPathVault`** | `address` | 收款 |
| **`globalTreasury`** | `address` | 55% 收款 |
| **`stewardStakePool`** | `address` | Q-02 view |
| **`activeStewardRegistry`** | `ActiveStewardConfig` | Q-01/Q-03/Q-04 · **DR-01** · Timelock **`setActiveStewardConfig`** |
| **`fundingSource`** | `address` | **DR-02** · USDC 来源（Treasury / Operations 子 Vault）· Timelock 设 |
| **`epochFunded[epochId]`** | `bool` | **DR-02** · `fundLedgerForSplit` 完成标记 |

### 3.2 `EpochRecord` 字段

| 字段 | 类型 | SSOT |
|------|------|------|
| `epochStart` | `uint64` | **P-02** UTC |
| `epochEnd` | `uint64` | **P-02** |
| `grossRevenue` | `int256` | Σ R-* accrual |
| `allowableExpense` | `int256` | Σ E-* accrual（含 CLF 在 close 时注入） |
| `netProfit` | `int256` | gross − expense |
| `carriedLossBefore` | `uint256` | close 时快照 |
| `carriedLossApplied` | `uint256` | **E-199-CLF** |
| `netProfitPrime` | `int256` | **NetProfit'** |
| `carriedLossAfter` | `uint256` | 亏损时 += abs(netProfit) |
| `status` | `enum` | §2.1 |
| `closedAt` | `uint64` | block.timestamp |
| `qualificationSnapshotBlock` | `uint64` | **P-04** |
| `qualifiedSteward` | `address` | Q-01 解析结果 |
| `stewardPathEligible` | `bool` | Q-01～Q-04 合成 |
| `stewardAmount` | `uint256` | split 后填 |
| `unallocatedAmount` | `uint256` | split 后填 |
| `globalAmount` | `uint256` | split 后填 |
| `splitAt` | `uint64` | 0 = 未 split |

### 3.3 Vault 存储（最小）

| Vault | 键 | 说明 |
|-------|-----|------|
| **StewardPathVault** | `ledger` · `jurisdiction` · `token` · `totalReceived` | 仅 Ledger 可 `deposit` |
| **UnallocatedStewardPathVault** | 同上 + `totalReleased` | 仅 Timelock `release` |

### 3.4 索引友好键

```text
primary:   (chain_id, jurisdiction, epoch_id)
accrual:   (chain_id, jurisdiction, epoch_id, account_code, ref_id)
split:     (chain_id, jurisdiction, epoch_id, token)
carried:   (chain_id, jurisdiction, token)
unalloc:   (chain_id, jurisdiction, token)
```

---

## 4. Epoch 生命周期（UTC · PR-01 · FIN-CAL-01）

### 4.1 时间线（以 2026-Q1 为例）

| 阶段 | UTC 窗口 | 链上动作 | 角色 |
|------|----------|----------|------|
| **T0 开账** | 2026-01-01 00:00:00 | `openEpoch(1, start, end)` | Timelock |
| **T0～T1 accrual** | → 2026-03-31 23:59:59 | `recordAccrual` / 治理 batch accrue | Timelock · 财务编排 |
| **T1+15 关账** | ≥ 2026-04-15 | `closeEpoch(1)` | Timelock |
| **T1+15+ 快照** | close 后 | 链下/链上 Q-01～Q-04 核验 | Admin + 链上 view |
| **Split** | 快照完成后 | `splitNetProfit(1, snapshotBlock, steward, eligible)` | Timelock |
| **ERP 对账** | 同日 | 索引 + API 读回 | Gate-3 |

### 4.2 函数语义（Gate-2.2 实现对照 · 非代码）

| 函数 | 前置 | 效果 | 事件 |
|------|------|------|------|
| **`openEpoch(epochId, epochStart, epochEnd)`** | `epochId == latest+1` · 时间顺序 | 创建 `OPEN` | `EpochOpened`（**≠** redemption） |
| **`recordAccrual(epochId, accountCode, amountSigned, ref)`** | `OPEN` · ref 唯一 · code ∈ R/E 白名单 | **仅记账** gross/expense（**DR-02 · 不拉 token**） | **`NetProfitAccrued`** |
| **`fundLedgerForSplit(epochId)`** | `SPLIT_PENDING` · **`token.balanceOf(ledger) >= uint256(netProfitPrime)`** | **`transferFrom(fundingSource)`** 补款至 Ledger · 设 **`epochFunded`** | **`LedgerFundedForSplit`** |
| **`closeEpoch(epochId)`** | `OPEN` · `block.timestamp ≥ epochEnd + closeDelay` | 算 netProfit · CLF · 更新 carriedLoss · → `CLOSED`/`NO_SPLIT`/`SPLIT_PENDING` | **`EpochClosed`** |
| **`splitNetProfit(epochId)`** | `SPLIT_PENDING` · **`epochFunded`** · 资格验证 | 算 45/45/55 · ERC20 transfer · → `SPLIT_COMPLETED` | **`NetProfitSplit`** + **`UnallocatedStewardDeposit`**（若适用） |
| **`releaseUnallocated(amount, proposalRef)`** | Unallocated vault · Timelock | → StewardPathVault | **`UnallocatedStewardReleased`** |

### 4.3 `closeEpoch` 算法（FIN-NP-01 · FIN-L02）

```text
netProfit = grossRevenue - allowableExpense
carriedLossApplied = min(carriedLoss, max(netProfit, 0))
netProfitPrime = netProfit - carriedLossApplied   // int256 safe

if netProfit < 0:
  carriedLoss += abs(netProfit)
  status = CLOSED → NO_SPLIT
elif netProfitPrime <= 0:
  status = CLOSED → NO_SPLIT
else:
  status = CLOSED → SPLIT_PENDING
emit EpochClosed(..., netProfit, carriedLossApplied, netProfitPrime, carriedLossAfter)
```

### 4.4 `splitNetProfit` 算法（FIN-SPLIT-01 · S-02）

```text
stewardLeg = floor(netProfitPrime * bpsStewardPath / 10000)
globalLeg  = floor(netProfitPrime * bpsGlobalTreasury / 10000)
remainder  = netProfitPrime - stewardLeg - globalLeg    // S-02 → globalLeg += remainder

if stewardPathEligible:
  transfer stewardLeg → StewardPathVault
  unallocatedLeg = 0
else:
  transfer stewardLeg → UnallocatedStewardPathVault
  unallocatedLeg = stewardLeg

transfer globalLeg → GovernanceTreasury
assert stewardLeg + unallocatedLeg + globalLeg == netProfitPrime
carriedLoss -= carriedLossApplied
```

---

## 5. 事件 schema（Indexer · 财务对账）

### 5.1 `NetProfitAccrued`

| 字段 |  indexed | 类型 | 说明 |
|------|----------|------|------|
| `jurisdiction` | ✓ | bytes2 | |
| `epochId` | ✓ | uint256 | |
| `token` | ✓ | address | USDC |
| `accountCode` | | bytes32 | `R-100` … `E-199` UTF-8 padded |
| `amountSigned` | | int256 | 收入 + · 费用 − |
| `ref` | | bytes32 | order_id / proposal_id / adjustment_id |
| `recordedAt` | | uint64 | block.timestamp |

**投影表：** `country_pool_net_profit_accrual_lines`（Gate-3 · 可选归并进 epoch 汇总）。

### 5.2 `EpochClosed`

| 字段 | indexed | 类型 | 说明 |
|------|---------|------|------|
| `jurisdiction` | ✓ | bytes2 | |
| `epochId` | ✓ | uint256 | |
| `token` | ✓ | address | |
| `grossRevenue` | | int256 | |
| `allowableExpense` | | int256 | |
| `netProfit` | | int256 | |
| `carriedLossBefore` | | uint256 | |
| `carriedLossApplied` | | uint256 | **E-199-CLF** |
| `netProfitPrime` | | int256 | |
| `carriedLossAfter` | | uint256 | |
| `epochStatus` | | uint8 | CLOSED / NO_SPLIT / SPLIT_PENDING |

### 5.3 `NetProfitSplit`

| 字段 | indexed | 类型 | 说明 |
|------|---------|------|------|
| `jurisdiction` | ✓ | bytes2 | |
| `epochId` | ✓ | uint256 | |
| `token` | ✓ | address | |
| `netProfitPrime` | | uint256 | >0 |
| `stewardAmount` | | uint256 | 进 StewardPath 或 0 |
| `unallocatedAmount` | | uint256 | 进 Unallocated · **Q-F01** |
| `globalAmount` | | uint256 | 含 **S-02** remainder |
| `stewardPathEligible` | | bool | |
| `qualificationSnapshotBlock` | | uint64 | **P-04** |
| `qualifiedSteward` | | address | **Q-F05** 审计 · 非收款 |

### 5.4 辅助事件

| 事件 | 用途 |
|------|------|
| **`UnallocatedStewardDeposit`** | U-03 余额审计 · 对拍 **2150** |
| **`UnallocatedStewardReleased`** | U-04 治理释放 · proposalRef |
| **`EpochOpened`** | net-profit 周期开账（**命名空间 ≠ redemption `EpochOpened`** — topic 不同合约地址） |
| **`LedgerFundedForSplit`** | DR-02 · fund 完成 · amount · fundingSource |
| **`SettlementParamsUpdated`** | bps / closeDelay / vault 指针变更 |

**Topic0 登记（Gate-2.2）：** 写入 `registry/` 或 `14` 合约表 · 与 B-383/B-385 **独立** decoder。

---

## 6. 角色与权限（RBAC）

| 角色 | 能力 | 禁止 |
|------|------|------|
| **`GovernanceTimelock`** | 全部 mutating：`openEpoch` · `recordAccrual` · `closeEpoch` · `splitNetProfit` · 参数更新 · `releaseUnallocated` | — |
| **`TravelTrustGovernor`** | 提案 → queue → Timelock | **不得** 直调 Ledger |
| **Timelock `admin()`** | `setAllowedExecutionTarget(Ledger/Vaults, true)` | 不得 bypass Governor 改 split 比例（须提案） |
| **Ledger 合约** | 仅向 Vaults `transfer` · 读 StakePool | 不得 `transfer` 至 EOA |
| **StewardPathVault** | 接收 deposit | 无 owner 外泄函数（v1） |
| **UnallocatedStewardPathVault** | 接收 deposit · Timelock `release` | 无 Global 出口 |
| **Finance Operator（链下）** | 编排 accrual calldata · ERP | 无链上 key |
| **Indexer / API** | 只读 | 不写 SSOT |

### 6.1 Steward 资格验证（§7 · Gate-2.2 须实现 · **DR-01 定案**）

| ID | 验证层 | v1 定案（Gate-2.1 ☑） |
|----|--------|----------------------|
| **Q-01** Active Seat | Admin SSOT → 链上 registry | **`ActiveStewardConfig.steward != 0`** · 须匹配该国 **唯一** Active Seat（链下 Admin 对拍后 Timelock 写入） |
| **Q-02** Stake | 链上 | **`stewardStakePool.hasJurisdictionStake(steward,j)`** && **`stakes(steward,j).amount >= minStakeAmount(j)`** at **`splitNetProfit` 执行块** |
| **Q-03** 未暂停 | registry | **`ActiveStewardConfig.suspended == false`** |
| **Q-04** 任期 | registry | **`ActiveStewardConfig.tenureSatisfied == true`** **或** **`tenureWaived == true`**（治理提案显式） |
| **Q-05** KPI | v1 不启用 | 硬编码跳过 |

**`ActiveStewardConfig`（Ledger 存储 · Timelock-only 写）：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `steward` | address | Q-01 · **Q-F05** 非收款 |
| `suspended` | bool | Q-03 |
| `tenureSatisfied` | bool | Q-04 |
| `tenureWaived` | bool | 治理豁免 |
| `updatedAtBlock` | uint64 | 须 **≤** split 块 · 与 close 同事务或 close 之后 |
| `proposalRef` | bytes32 | 治理提案 id 哈希 |

**`stewardPathEligible`（split 时链上计算）：**  
`steward != 0 && !suspended && (tenureSatisfied || tenureWaived) && Q-02`

**`qualificationSnapshotBlock`：** **`splitNetProfit` 内部固定为 `block.number`**（禁止 calldata 注入 · 防历史块 gaming）。

**治理原子性：** 若 close 后 steward 变更，**须** 同一 Timelock **`execute` 批次** 内 **`setActiveStewardConfig` → `fundLedgerForSplit` → `splitNetProfit`**（见 §7.3）。

---

## 7. Timelock 接入点

### 7.1 Allowlist（G-01）

部署 FundStack / Settlement 后 **`admin`** 经 Safe 执行：

```text
setAllowedExecutionTarget(CountryPoolNetProfitLedger, true)
setAllowedExecutionTarget(StewardPathVault, true)
setAllowedExecutionTarget(UnallocatedStewardPathVault, true)
```

**不** allow EOA · **不** allow FeeRouter 新 selector 混入 Settlement 提案。

### 7.2 治理载荷库（G-02 · 设计）

**新库：** `CountryPoolNetProfitGovernancePayload`（平行 B-407）

| Selector 常量 | 目标函数 |
|---------------|----------|
| `CPNP_OPEN_EPOCH` | `openEpoch` |
| `CPNP_RECORD_ACCRUAL` | `recordAccrual` |
| `CPNP_CLOSE_EPOCH` | `closeEpoch` |
| `CPNP_FUND_LEDGER_FOR_SPLIT` | `fundLedgerForSplit` |
| `CPNP_SPLIT_NET_PROFIT` | `splitNetProfit` |
| `CPNP_RELEASE_UNALLOCATED` | `UnallocatedStewardPathVault.releaseToStewardPath` |
| `CPNP_SET_ACTIVE_STEWARD` | `setActiveStewardConfig` |
| `CPNP_SET_SETTLEMENT_PARAMS` | bps / closeDelay / vault 指针 |

### 7.3 典型 Timelock 操作序列（G-04）

```text
1. [Governor] 提案：openEpoch(1, …)                              target=Ledger
2. [Governor] 提案：recordAccrual × N（单笔 · DR-03）               target=Ledger
3. [Governor] 提案：closeEpoch(1)                                  target=Ledger  （≥ epochEnd+15d）
4. [Governor] 提案（原子 batch · DR-01/DR-02）：
     a. setActiveStewardConfig(steward, …)                        target=Ledger
     b. fundLedgerForSplit(1)                                       target=Ledger
     c. splitNetProfit(1)                                           target=Ledger
── 可选 ──
5. [Governor] 提案：releaseUnallocated → StewardPath               target=UnallocatedVault
```

**G-03 提案前缀（Runbook · Gate-2.3）：** `[D-4555-B]` · **禁止** 与 `[D-4555-A]` / `[FUNDRAISE]` 同批。

### 7.4 资金位置（**DR-02 定案 · Funding Path FINAL · G23-03**）

| 阶段 | USDC 所在 | 链上动作 |
|------|-----------|----------|
| accrual 期 | Operations / Country 子账 · Treasury | **`recordAccrual` 仅记账** · **不** transfer |
| close 后 · split 前 | 仍在外部 fundingSource | **`fundLedgerForSplit`** · **`LedgerFundedForSplit`** |
| split 执行 | Ledger → Vaults + Treasury | **`splitNetProfit`** · 要求 **`balance >= netProfitPrime`** |
| split 后 | StewardPath / Unallocated / Global | 审计 **`NetProfitSplit`** |

**`fundingSource`：** Timelock 配置的 **`address`**（通常为 **`GovernanceTreasury`** 或该国 Operations 子 Vault）· 须 pre-approve Ledger **`transferFrom`** 或由 Timelock 先 **`Treasury.spend` → Ledger**（Gate-2.2 二选一 · 测试须覆盖）。

**禁止：** 在 **`recordAccrual`** 混入 token 转移（财务 accrual 与现金归集 **分步** · 对拍 ERP）。

#### 7.4.1 Pilot 资金路径 FINAL（G23-03 · ① 本地 · 2026-06-15）

| 项 | 定案 |
|----|------|
| **Pilot 默认** | **路径 A · Allowance** — `fundingSource` 对 Ledger **`approve`** · `fundLedgerForSplit` **`transferFrom(pull)`** |
| **路径 B** | `GovernanceTreasury.spend(ledger, amount)` **② 可选** · Runbook 附录 · **非** ① 默认 |
| **`LedgerFundedForSplit.amount`** | 本次 **实际 pull**；ledger 已 `balance >= netProfitPrime` 时 **0** |
| **② 前置** | Safe approve SOP · `fundingSource` env 与 Treasury/Operations 子 Vault 对拍 |

**Status：** **FUNDING_PATH_FINAL（① · Path A）** · 见 [gate2.3/G23-03-funding-path-finalization.md](gate2.3/G23-03-funding-path-finalization.md) · Foundry **T-FND-05/06**

---

## 8. 索引需求（Gate-3 预备）

### 8.1 新表

| 表 | 来源 | 主键 |
|----|------|------|
| **`country_pool_net_profit_epochs`** | `EpochClosed` + `NetProfitSplit` | `(chain_id, jurisdiction, epoch_id)` |
| **`country_pool_net_profit_accrual_lines`** | `NetProfitAccrued` | `(chain_id, tx_hash, log_index)` |
| **`country_pool_unallocated_movements`** | Deposit + Released | `(chain_id, jurisdiction, seq)` |

### 8.2 `country_pool_net_profit_epochs` 列（I-01）

| 列 | 来源 |
|----|------|
| `chain_id` · `jurisdiction` · `epoch_id` | PK |
| `epoch_start` · `epoch_end` · `closed_at` · `split_at` | 事件 |
| `token` | |
| `gross_revenue` · `allowable_expense` · `net_profit` | EpochClosed |
| `carried_loss_before` · `carried_loss_applied` · `net_profit_prime` · `carried_loss_after` | |
| `epoch_status` | enum string |
| `steward_amount` · `unallocated_amount` · `global_amount` | NetProfitSplit |
| `steward_path_eligible` · `qualification_snapshot_block` · `qualified_steward` | |
| `close_tx_hash` · `split_tx_hash` | |
| `indexed_at` | |

**硬约束：** **不得**  ingest `CountryPoolRedemptionEpochV0.EpochOpened/Settled`（**P-04 读法**）。

### 8.3 观测 / 对账（R-01～R-08）

| Obs ID | 断言 | 脚本模式 |
|--------|------|----------|
| **R-01** | `steward+unalloc+global == net_profit_prime` | Forge + staging |
| **R-02** | DB epoch 行数 = `EpochClosed` logs | 新 B-xxx |
| **R-03** | Vault balance ≥ 累计 deposit − release | eth_call |
| **R-04** | Global leg = Treasury 增量（tx 维度） | 分账事件 |
| **R-05** | FeeRouter `toCountry` **≠** steward split | 负向测试 |
| **R-07** | 扩展 B-386 或独立 bundle | admin overview |
| **R-08** | `GET …/admin/observability/overview` 新键 | Gate-3 |

### 8.4 Indexer decoder 登记

| 合约 | 事件 | 优先级 |
|------|------|--------|
| `CountryPoolNetProfitLedger` | 5.1～5.4 | P0 |
| `StewardPathVault` | `Deposit` | P1 |
| `UnallocatedStewardPathVault` | `Deposit` · `Released` | P0 |

---

## 9. API 投影需求（Gate-3 预备）

### 9.1 新路由

| 方法 | 路径 | 说明 |
|------|------|------|
| **GET** | `/api/v1/governance/country-pool/{jurisdiction}/net-profit-epochs` | 列表 · 分页 · filter by status |
| **GET** | `/api/v1/governance/country-pool/{jurisdiction}/net-profit-epochs/{epoch_id}` | 单 epoch · accrual lines 嵌套或子路由 |
| **GET** | `/api/v1/governance/country-pool/{jurisdiction}/carried-loss` | 读 `carriedLoss` SSOT 镜像 |

### 9.2 响应字段（与 DB 对齐）

```json
{
  "jurisdiction": "DE",
  "epoch_id": 1,
  "epoch_start": "2026-01-01T00:00:00Z",
  "epoch_end": "2026-03-31T23:59:59Z",
  "status": "SPLIT_COMPLETED",
  "net_profit": "…",
  "net_profit_prime": "…",
  "carried_loss_after": "…",
  "split": {
    "steward_amount": "…",
    "unallocated_amount": "…",
    "global_amount": "…",
    "steward_path_eligible": true,
    "qualification_snapshot_block": 12345678
  },
  "chain": { "close_tx": "0x…", "split_tx": "0x…" }
}
```

### 9.3 边界

| 项 | 规则 |
|----|------|
| **protocol-reference** | **不** 新增 `net_profit_settled: true` 假旗（**V-08**） |
| **country-ledger API** | P5-1-C **不变** · 与 net-profit **正交** |
| **Admin finance** | 200 D-4555-B 段读 **投影** · Gate-1 台账 |
| **Auth** | 公开读 · Admin 对账 export Gate-3 |

---

## 10. Foundry 测试矩阵（Gate-2.2 · 独立套件）

**命令 SSOT：** `forge test --match-contract CountryPoolNetProfit` · **须** 与 `FeeRouterTest` **分文件** · CI 先跑 FeeRouter 回归（**V-01**）。

### 10.1 单元 — Ledger accrual & close

| Test ID | 场景 | 断言 |
|---------|------|------|
| **T-ACC-01** | 单 R-100 accrual | gross ↑ · `NetProfitAccrued` emit |
| **T-ACC-02** | E-100 负向 accrual | expense ↑ |
| **T-ACC-03** | 重复 `ref` revert | `accrualRefs` |
| **T-ACC-04** | 非法 accountCode revert | 白名单 |
| **T-ACC-05** | CLOSED 后 accrual revert | **P-05** |
| **T-CLS-01** | 正 profit close | `netProfitPrime>0` → SPLIT_PENDING |
| **T-CLS-02** | 亏损 close | `carriedLoss` += abs · NO_SPLIT |
| **T-CLS-03** | 零 profit close | NO_SPLIT · carriedLoss 不变 |
| **T-CLS-04** | 过早 close revert | **P-03** closeDelay |
| **T-CLS-05** | CLF 扣减 | carriedLossApplied = min · **FIN-L02-03** |
| **T-CLS-06** | 重复 close revert | |
| **T-FND-01** | `fundLedgerForSplit` 补款 | `epochFunded` · `LedgerFundedForSplit` |
| **T-FND-02** | 未 fund 时 split revert | **DR-02** |
| **T-FND-03** | fund 不足 netProfitPrime revert | |
| **T-FND-04** | `recordAccrual` 不改变 token balance | 记账/现金分离 |

### 10.2 单元 — Split & 45/55

| Test ID | 场景 | 断言 |
|---------|------|------|
| **T-SPL-01** | eligible · 正 profit | 45% StewardPath · 55% Treasury |
| **T-SPL-02** | 非 eligible · Q-F01 | 45% Unallocated · **0** StewardPath |
| **T-SPL-03** | FIN-SPLIT-01 守恒 | sum == netProfitPrime |
| **T-SPL-04** | S-02 余数 | remainder → global |
| **T-SPL-05** | NO_SPLIT 后 split revert | |
| **T-SPL-06** | 重复 split revert | |
| **T-SPL-07** | Q-F02 负向 | global **≠** 55%+45% 挪用 |
| **T-SPL-08** | 非 eligible 时 global 仍 55% | Unallocated **额外** 45% |

### 10.3 单元 — Unallocated & 释放

| Test ID | 场景 | 断言 |
|---------|------|------|
| **T-UNA-01** | deposit 累计 | `UnallocatedStewardDeposit` |
| **T-UNA-02** | release → StewardPath | U-04 · 非 EOA |
| **T-UNA-03** | release 超余额 revert | |
| **T-UNA-04** | 非 Timelock release revert | |
| **T-UNA-05** | 无 Global 出口 | U-02 |

### 10.4 单元 — 资格 & StakePool

| Test ID | 场景 | 断言 |
|---------|------|------|
| **T-QLF-01** | Q-02 满足 | hasJurisdictionStake + min |
| **T-QLF-02** | 无 stake · eligible=false | → Unallocated |
| **T-QLF-03** | Q-F05 | 无 EOA 收款路径 |
| **T-QLF-04** | 错误 jurisdiction steward revert | **LEG-XJ** |
| **T-QLF-05** | `suspended` registry → Unallocated | **DR-01** |
| **T-QLF-06** | 缺 stake → Unallocated | Q-02 |

### 10.5 集成 — Timelock & 治理

| Test ID | 场景 | 断言 |
|---------|------|------|
| **T-GOV-01** | 非 allowlist target revert | B-407 |
| **T-GOV-02** | Governor → queue → execute close | **V-07** |
| **T-GOV-03** | Payload 库 selector parity | 平行 B-407 测试 |
| **T-GOV-04** | 参数变更独立提案 | G-05 |

### 10.6 回归 — 分轨负向

| Test ID | 场景 | 断言 |
|---------|------|------|
| **T-REG-01** | FeeRouter distribute 不变 | **V-01** bps 4500/5500 |
| **T-REG-02** | FeeRouter toCountry ≠ split steward | **V-03 · R-05** |
| **T-REG-03** | Ledger credit 不触发 split | CountryPoolLedgerV0 正交 |
| **T-REG-04** | Redemption epoch 不影响 net-profit state | **P-04** |

### 10.7 Fuzz / invariant（Gate-2.2 可选 · 推荐）

| Test ID | 属性 |
|---------|------|
| **T-FUZ-01** | 任意 accrual 序列 · close · split 守恒 |
| **T-FUZ-02** | carriedLoss 单调 · 仅 close 增 · split 减 applied |
| **T-INV-01** | Ledger token balance = 待 split 净值 |

---

## 11. 设计评审决议（DR-01～DR-07 · Gate-2.1 Closeout ☑）

| ID | 议题 | **定案（Final）** | 四方 |
|----|------|-------------------|------|
| **DR-01** | Q-01/Q-03/Q-04 registry vs attestation | **`ActiveStewardConfig`** on Ledger · Timelock-only **`setActiveStewardConfig`** · Q-02 链上 StakePool view · **`qualificationSnapshotBlock = block.number`** · split 与 config/fund **同一 Timelock batch** | ☑ |
| **DR-02** | Split 前 USDC 归集 | **`recordAccrual` 仅记账** · 独立 **`fundLedgerForSplit(epochId)`** · **`epochFunded` 硬闸** · **`splitNetProfit` 要求 `balance >= netProfitPrime`** · 事件 **`LedgerFundedForSplit`** | ☑ |
| **DR-03** | batch accrual | **v1 仅单笔 `recordAccrual`** · **`recordAccrualBatch`（≤32 行/tx）= Gate-2.3 backlog** · 多笔 accrual 用 **多提案或同批 multi-call** | ☑ |
| **DR-04** | 合约命名 | **`CountryPoolNetProfitLedger`** + **`StewardPathVault`** + **`UnallocatedStewardPathVault`**（与 PHASE2 审计一致） | ☑ |
| **DR-05** | 环境键 / registry | 见 **§11.1** · **`JURISDICTION_COUNTRY_POOL_NET_PROFIT_CONFIG_PATH`** · pilot 双键 alias | ☑ |
| **DR-06** | Vault 部署模式 | **§11.2 Triplet Bundle** · 单脚本 wired deploy · post-deploy allowlist ×3 | ☑ |
| **DR-07** | 跨国部署模板 | **§11.3** · `config/jurisdiction_country_pool_net_profit.template.json` · 一国一条 **不得** 混池 | ☑ |

### 11.1 环境键（DR-05 · Gate-2.4 registry 同批登记）

| 键 | 用途 | 试点 alias |
|----|------|------------|
| **`COUNTRY_POOL_NET_PROFIT_LEDGER_{J}`** | 链上 Ledger（**J** = DE/CN/…） | **`COUNTRY_POOL_NET_PROFIT_LEDGER_PILOT_ADDRESS`** |
| **`COUNTRY_POOL_STEWARD_PATH_VAULT_{J}`** | Steward 45% 收款 | 同上 `_PILOT_` 前缀可选 |
| **`COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT_{J}`** | Unallocated 45% | 同上 |
| **`COUNTRY_POOL_NET_PROFIT_SETTLEMENT_TOKEN_{J}`** | USDC（**S-03** 单币） | **`SETTLEMENT_SSOT_TOKEN_ADDRESS`**（进程默认 · 与 pilot 同址） |
| **`COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS`** | API/indexer 默认读址 | **= pilot Ledger**（平行 **`COUNTRY_POOL_LEDGER_ADDRESS`**） |
| **`JURISDICTION_COUNTRY_POOL_NET_PROFIT_CONFIG_PATH`** | 多国 JSON registry | 平行 **`JURISDICTION_COUNTRY_LEDGER_CONFIG_PATH`** |

**`ChainConfig` / `99` 总览 / `.env.example`：** Gate-2.4 deploy PR **同批** · Gate-2.2 **仅** 本文冻结命名。

### 11.2 Vault 部署模式（DR-06）

| 项 | 定案 |
|----|------|
| **脚本** | **`DeployCountryPoolNetProfitStack.s.sol`**（Gate-2.4）· **单次 broadcast** 部署 **Triplet** |
| **顺序** | ① `StewardPathVault` + `UnallocatedStewardPathVault` ② `CountryPoolNetProfitLedger`（constructor 注入 vault 指针 + stakePool + treasury + token） |
| **Owner** | 三合约 **`owner = GovernanceTimelock`**（`Phase2ControlPlane.resolveChainOwner`） |
| **Wiring** | Vault **`onlyLedger`** deposit · Ledger **`onlyTimelock`** mutating |
| **Post-deploy** | Safe → **`setAllowedExecutionTarget` ×3** · **`setFundingSource`** · registry JSON 行写入 |
| **禁止** | 独立部署 Ledger **未** wire vault · EOA owner |

### 11.3 跨国部署模板（DR-07）

**文件（Gate-2.4 同批）：** [`config/jurisdiction_country_pool_net_profit.template.json`](../../../config/jurisdiction_country_pool_net_profit.template.json)

```json
{
  "schema_version": 1,
  "entries": [
    {
      "jurisdiction": "DE",
      "COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS": "0x0000000000000000000000000000000000000000",
      "COUNTRY_POOL_STEWARD_PATH_VAULT_ADDRESS": "0x0000000000000000000000000000000000000000",
      "COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT_ADDRESS": "0x0000000000000000000000000000000000000000",
      "COUNTRY_POOL_NET_PROFIT_SETTLEMENT_TOKEN_ADDRESS": "0x0000000000000000000000000000000000000000"
    }
  ]
}
```

| 规则 | 说明 |
|------|------|
| **LEG-XJ-01** | **entries[].jurisdiction** 唯一 · 与 Ledger **`immutable jurisdiction`** 一致 |
| **API** | **`GET …/governance/country-pool/{j}/net-profit-epochs`** 命中 registry **方** 链上读（平行 country-ledger 404 语义） |
| **Phase ② 试点** | 首 deploy **DE** · 第二条目 **CN** 须 **独立** Triplet · **禁止** 共享 Ledger |

---

## 12. Gate-2.1 设计评审签字（Closeout · Final）

| ☑ | 角色 | 确认范围 | 签字人 | 日期 |
|---|------|----------|--------|------|
| ☑ | **产品** | §4 生命周期 · §6 **DR-01** 资格 · PR-01～PR-03 / Q-F01 · **DR-03** 单笔 accrual | **Sebastian Ward（产品 · Gate-2.1）** | 2026-06-15 |
| ☑ | **财务** | §3 存储 · **DR-02** 记账/归集分步 · §5 事件 · FIN-NP/FIN-L02/FIN-U | **Sebastian Ward（财务 · Gate-2.1）** | 2026-06-15 |
| ☑ | **法务** | §1 边界 · **DR-06/07** 一国一池 · L-01～L-07 / LEG-XJ | **Sebastian Ward（法务 · Gate-2.1）** | 2026-06-15 |
| ☑ | **工程** | §7 Timelock · **DR-05/06/07** · §8～§10 · Gate-2.2 Checklist | **Sebastian Ward（工程 · Gate-2.1）** | 2026-06-15 |

**Gate-2.1 结论：** **✅ CLOSEOUT（2026-06-15）** — DR-01～DR-07 全闭 · 四方签字完成。

**Gate-2.2 入口：** [country-pool-settlement-gate2.2-implementation-readiness-checklist.md](country-pool-settlement-gate2.2-implementation-readiness-checklist.md) **全绿后** 方可创建 **`CountryPoolNetProfit*.sol`** 分支。

**当前 Solidity 状态：** 仓库 **无** `CountryPoolNetProfit*.sol`（维持至 Checklist 全绿后开分支）。

---

## 13. 变更记录

| Version | Date | Note |
|---------|------|------|
| v1-final-gate2.1-closeout-20260615 | 2026-06-15 | **Gate-2.1 Closeout** · DR-01～07 定案 · 四方签字 · Gate-2.2 Checklist |
| v1-gate2.1-design-review-20260615 | 2026-06-15 | Gate-2.1 首版 |
