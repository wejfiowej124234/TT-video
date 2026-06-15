# Gate-2.3 Projection & Reconciliation Package v1

**Package ID:** `country-pool-settlement-gate2.3-projection-v1`  
**Version:** v1-20260615  
**Status:** **PRE-REVIEW（Projection & Reconciliation · 零 ② 实施）**  
**Baseline commit:** `76aff11c` · branch `feature/country-pool-net-profit-ledger`  
**Gate-2.2 evidence:** `evidence/GO_local_country_pool_net_profit_gate2.2/GATE2.2-LOCAL-ACCEPTANCE-REPORT.md`

**上位 SSOT：** [country-pool-settlement-architecture-package-v1.md](country-pool-settlement-architecture-package-v1.md) · [country-pool-accounting-mapping-matrix-v1.md](country-pool-accounting-mapping-matrix-v1.md) · [country-pool-net-profit-accounting-spec-v1.md](country-pool-net-profit-accounting-spec-v1.md)

---

## 0. 阶段边界（写死）

> **① 本地合约绿（Gate-2.2 · 38+10 passed），不等于 ② Sepolia GO。**

| 本包允许 | 本包 **禁止** |
|----------|----------------|
| Gate-2.3 设计 delta · 投影/对账规格 · backlog 定案 | **Sepolia broadcast** |
| Gate-2.4 **前置条件** 清单（文档） | **staging 部署** · **② GO 宣称** |
| Gate-3 **设计**（indexer/API/DB 规格 · 无 migration 合入） | **`recordAccrualBatch` 未经 Gate-2.3 签字即合入** |

**Gate-2.2 机读基线（`76aff11c`）：**

```bash
cd contracts && forge test --match-contract CountryPoolNetProfit   # 38 passed
cd contracts && forge test --match-contract FeeRouterTest          # 10 passed
```

---

## 1. Executive summary

Gate-2.2 已交付 **D-4555-B 最小 Settlement 三件套 + Payload + T-* 矩阵**（① 本地）。Gate-2.3 本包 **不新增链上行为**，而是将 **投影层（Indexer/API/DB）**、**财务对账（R-01～R-08）**、**Solidity delta（batch/fuzz/资金路径终局）** 与 **Gate-2.4 Sepolia 前置** 编排为 **可签字 backlog**。

| 轨道 | Gate-2.3 产出 | 实施阶段 |
|------|----------------|----------|
| **Solidity delta** | `recordAccrualBatch` · fuzz/invariant · 资金路径终局测试 | Gate-2.3 PR（①） |
| **ABI / 事件稳定** | Topic0 冻结 · `14` / registry 登记规格 | Gate-2.4 同批 |
| **Indexer / DB / API** | 表结构 · decoder · 读路由规格 | Gate-3（② 读面） |
| **财务对账** | ERP 行 ↔ 链上事件映射 · obs 脚本 | Gate-3 + ② 切片 |
| **Sepolia** | 前置条件清单 **仅文档** | Gate-2.4（Owner 授权后） |

---

## 2. Gate-2.2 → Gate-2.3 delta（`76aff11c` 对照）

### 2.1 已实现且与 arch 对齐

| 项 | Gate-2.2 实现 | arch 锚 |
|----|---------------|---------|
| 记账/现金分离 | `recordAccrual` 不 transfer · `fundLedgerForSplit` + `epochFunded` | DR-02 |
| Split 45/55 + S-02 | `_splitLegs` remainder → global | FIN-SPLIT-01 |
| Q-F01 | 非 eligible → `UnallocatedStewardPathVault` | L-07 |
| Q-02 | `RegionStewardStakePool` view at split block | DR-01 |
| Timelock batch | Payload encode · T-GOV-02/04 | §7.3 |
| 分轨回归 | T-REG-01～04 · FeeRouter 不变 | V-01/V-03/P-04 |

### 2.2 已知命名/ABI delta（Gate-2.3 须冻结后再登记 `14`）

| arch 设计名 | `76aff11c` 实现 | Gate-2.3 动作 |
|-------------|-----------------|---------------|
| Vault `Deposit` | `StewardPathDeposit` · `UnallocatedStewardDeposit` | **冻结 v1 事件名** · decoder 按实现 · **禁止** ② 前 rename |
| `EpochStatus.CLOSED` | `NO_SPLIT` / `SPLIT_PENDING`（无独立 CLOSED enum） | Indexer 用 `EpochClosed.epochStatus` uint8 · 文档对齐 |
| `ActiveStewardConfig` mapping 名 | `activeSteward` public struct | ABI 读 `activeSteward()` · 投影列 `qualified_steward` 来自 split 事件 |
| G22-D-03 ABI JSON | **未** export 至 `contracts/abi/` | **Gate-2.4 阻塞项** · 非 Gate-2.3  Solidity delta |

### 2.3 仓库读面现状（投影 **未** 实现）

| 模块 | 现状 | Gate-2.3 结论 |
|------|------|---------------|
| `ChainConfig` | 仅有 `COUNTRY_POOL_LEDGER_ADDRESS`（P5） | 须 **新键** `COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS` + registry JSON loader（Gate-3 代码） |
| Indexer tick | ingest `CountryLedgerCredited` → `p5_country_ledger_lines` | **平行** net-profit decoder · **禁止** 混入 P5 表 |
| API | `GET …/governance/country-ledger/{j}` | **新** `…/net-profit-epochs` · 404 当 registry 无部署 |
| DB | 无 `country_pool_net_profit_*` 表 | Gate-3 migration（本包 §7 规格） |

---

## 3. G23-01 · `recordAccrualBatch`（Solidity delta · DR-03）

### 3.1 动机

v1 **单笔** `recordAccrual` 运维成本：大 epoch（>20 行 R/E）须 **多提案** 或 Timelock multi-call。Gate-2.3 引入 **可选** batch 以降低 calldata/治理次数，**不改变** 记账语义与 DR-02 现金分离。

### 3.2 提议接口（Gate-2.3 定案候选）

```solidity
struct AccrualLine {
    bytes32 accountCode;
    int256 amountSigned;
    bytes32 ref;
}

function recordAccrualBatch(uint256 epochId, AccrualLine[] calldata lines) external onlyOwner whenNotPaused;
```

| 规则 | 说明 |
|------|------|
| **G23-B-01** | `lines.length ∈ [1, 32]` · 超限 revert |
| **G23-B-02** | 每行独立校验：OPEN · 白名单 code · `amountSigned != 0` · **ref 唯一**（批内 + 历史 `accrualRefs`） |
| **G23-B-03** | **原子**：任一行失败 **整批 revert** |
| **G23-B-04** | 每行 emit **`NetProfitAccrued`**（与单笔相同 schema · 便于 indexer） |
| **G23-B-05** | **禁止** batch 内 transfer token |
| **G23-B-06** | Payload 增 **`CPNP_RECORD_ACCRUAL_BATCH`** + `encodeRecordAccrualBatch` |

### 3.3 治理 / 财务

| 方 | 审查点 |
|----|--------|
| **产品** | 32 行/tx 是否覆盖 95p epoch 行数 · 超大 epoch multi-proposal 兜底 |
| **财务** | 批内行仍映射 **4101/5101** 等 GL · ERP 一行 ↔ 一 `ref` |
| **法务** | 提案前缀 **`[D-4555-B]`** · **禁止** 与 D-4555-A / FUNDRAISE 同批（G-03） |
| **工程** | Foundry **T-BAT-01～05**（空批 · 超限 · 重复 ref · 混合 R/E · 原子 revert） |

**Gate-2.3 出口：** 四方签字 **G23-01** → 方可开 Gate-2.3 Solidity PR。

---

## 4. G23-02 · Fuzz / Invariant（arch §10.7）

| Test ID | 属性 | Gate-2.3 实现要点 |
|---------|------|-------------------|
| **T-FUZ-01** | 随机 accrual 序列 → close → fund → split · 守恒 | bound `int256` 幅度 · eligible/ineligible 两分支 |
| **T-FUZ-02** | `carriedLoss` 单调 · 仅 close 增 · split 减 applied | 跨 2+ epoch stateful fuzz |
| **T-INV-01** | post-fund pre-split：`balance(ledger) >= netProfitPrime` | 可选 invariant 合约 wrapper |

**优先级：** **推荐** Gate-2.3 · **非** ② 阻塞（Gate-2.2 单元矩阵已绿）。

**CI：** 独立 job `forge test --match-contract CountryPoolNetProfitFuzz` · 可与主矩阵分文件。

---

## 5. G23-03 · 资金路径终局（`fundLedgerForSplit` · DR-02 / §7.4）

### 5.1 `76aff11c` 现状

- **`fundingSource`** + **`transferFrom(fundingSource, ledger, pull)`**（T-FND-01 覆盖）
- **`epochFunded`** 可在 `bal >= need` 时零 pull 标记（ledger 预存）

### 5.2 两路径对照（须财务 Gate-2.3 选一为 ② 生产默认）

| 路径 | 流程 | 优点 | 风险 |
|------|------|------|------|
| **A · Allowance**（当前） | Operations/Treasury **approve** Ledger · `fundLedgerForSplit` pull | 简单 · 已测 | allowance 生命周期 · 多签 approve 流程 |
| **B · Treasury spend** | Timelock **`GovernanceTreasury.spend(ledger, amount)`** 先于 fund | 与 B-090 叙事一致 | 两 tx · spend 权限模型 |

### 5.3 Gate-2.3 定案要求

| ID | 项 |
|----|-----|
| **G23-F-01** | 财务选定 **A 或 B** 为 **② pilot 默认** |
| **G23-F-02** | Runbook 写清 **approve/spend SOP** · Safe 模板 |
| **G23-F-03** | Foundry **T-FND-05/06** 覆盖选定路径 + 负向（revoke allowance / spend 不足） |
| **G23-F-04** | **`LedgerFundedForSplit.amount`** 语义：实际 pull 量（0 = 已足额）· indexer 对账键 |

**禁止：** 在 **`recordAccrual`** 或 **`recordAccrualBatch`** 混入 token 移动。

---

## 6. G23-04 · ABI / 事件稳定性（Gate-2.4 登记前置）

### 6.1 冻结面（② 前不可 breaking change）

| 合约 | 冻结项 |
|------|--------|
| `CountryPoolNetProfitLedger` | 全部 **event** topic · `openEpoch/recordAccrual/closeEpoch/fundLedgerForSplit/splitNetProfit` selector · `epochs` / `carriedLoss` public layout |
| Vaults | `depositFromLedger` · `releaseToStewardPath` |
| Payload | 现有 `CPNP_*` selector 常量 |

### 6.2 Topic0 登记包（Gate-2.4 同批 · 本包仅规格）

| 事件 | indexed | Gate-2.4 产出 |
|------|---------|---------------|
| `NetProfitAccrued` | jurisdiction, epochId, token | `registry/event-decoders/country_pool_net_profit.v1.yaml` |
| `EpochClosed` | jurisdiction, epochId, token | 同上 |
| `NetProfitSplit` | jurisdiction, epochId, token | 同上 |
| `LedgerFundedForSplit` | jurisdiction, epochId, token | 同上 |
| `UnallocatedStewardDeposit` / `Released` | jurisdiction, token | 同上 |
| `StewardPathDeposit` | jurisdiction, token | P1 |

**硬约束：** decoder **独立** B-383/B-385 FeeRouter · **独立** `CountryLedgerCredited`（P5）。

### 6.3 ABI export（G22-D-03 → Gate-2.4）

```bash
# Gate-2.4 实施时
./scripts/sync-abi-from-forge.sh   # 含 CountryPoolNetProfitLedger.json 等
bash scripts/check-55-s13.sh
```

**Gate-2.3：** 仅审查 **事件字段 ↔ mapping-matrix ↔ API JSON** 三方一致 · **不** 合入 ABI 文件。

---

## 7. Indexer 投影（Gate-3 规格 · Gate-2.3 审查）

### 7.1 架构（平行 P5）

```text
CountryPoolNetProfitLedger logs
  → decoder (chain_id filter + contract address from registry)
  → country_pool_net_profit_accrual_lines | country_pool_net_profit_epochs | country_pool_unallocated_movements
```

**参照实现：** `crates/api/src/routes/internal/indexer/tick.rs` · `p5_country_ledger_lines`（`20260425000054_p5_country_ledger_lines.sql`）。

### 7.2 摄入规则

| 规则 ID | 断言 |
|---------|------|
| **I-NP-01** | 仅 **`COUNTRY_POOL_NET_PROFIT_LEDGER_{J}`** 注册地址 |
| **I-NP-02** | **`EpochClosed` + `NetProfitSplit`** upsert 同一 `(chain_id, jurisdiction, epoch_id)` |
| **I-NP-03** | **禁止** ingest `CountryPoolRedemptionEpochV0` redemption 事件入 net-profit 表（P-04） |
| **I-NP-04** | **禁止** ingest `CountryLedgerCredited` 入 net-profit 表（P5 正交） |
| **I-NP-05** | Reorg：幂等键 `(chain_id, block_number, log_index)` |

### 7.3 Config 扩展（Gate-3 代码 · 本包定 spec）

| 键 | 用途 |
|----|------|
| `COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS` | 默认 pilot · indexer tick |
| `JURISDICTION_COUNTRY_POOL_NET_PROFIT_CONFIG_PATH` | 多国 JSON · 平行 country-ledger loader |

---

## 8. API 读面（Gate-3 规格 · Gate-2.3 审查）

### 8.1 新路由（arch §9 · 与 P5 正交）

| 方法 | 路径 | 行为 |
|------|------|------|
| GET | `/api/v1/governance/country-pool/{jurisdiction}/net-profit-epochs` | 列表 · cursor 分页 · status filter |
| GET | `…/net-profit-epochs/{epoch_id}` | 单 epoch + split 块 |
| GET | `…/carried-loss` | 镜像 `carriedLoss` · 注明 projection |

**404 语义：** registry 无 `{j}` 或未部署 → 同 `country-ledger` 404 模式（LEG-XJ-05）。

### 8.2 响应约束

| ID | 规则 |
|----|------|
| **A-NP-01** | **不** 在 protocol-reference 增 `net_profit_settled: true`（V-08） |
| **A-NP-02** | **不** 复用 `GET …/governance/pool` 根级 `country_pool*` 字段 |
| **A-NP-03** | `data_source: "projection"` · `is_chain_ssot: false` 直至 ② 观测闸通过 |
| **A-NP-04** | Admin finance export（Gate-3）读 200 D-4555-B 段 · 仅投影 |

---

## 9. DB schema（Gate-3 migration 规格）

### 9.1 新表（arch §8.1 · I-01）

**`country_pool_net_profit_epochs`** — PK `(chain_id, jurisdiction_id, epoch_id)` · 列见 arch §8.2（`gross_revenue` … `split_tx_hash`）。

**`country_pool_net_profit_accrual_lines`** — PK `(chain_id, tx_hash, log_index)` · mirror `NetProfitAccrued`。

**`country_pool_unallocated_movements`** — deposit/release · 对拍 GL **2150-CP-UNALLOC-{J}**。

### 9.2 Migration

建议路径：`crates/api/migrations/YYYYMMDDHHMMSS_country_pool_net_profit_projection.sql`

**Gate-2.3：** schema **评审签字** · **不合入** migration 直至 Gate-3 实施 PR。

---

## 10. 财务对账（Reconciliation · Gate-2.3 审查）

### 10.1 链上 ↔ GL（mapping-matrix v1.0.2）

| 链上 | GL / 200 段 | Obs |
|------|-------------|-----|
| Σ `NetProfitAccrued` R-* | 4101-CP-{J} 等 | ERP accrual |
| Σ `NetProfitAccrued` E-* | 5101-CP-{J} 等 | |
| `carriedLossApplied` | 5109-CLF-{J} | FIN-L02-03 |
| split steward / unalloc / global | 2201 / 2150 / 2101 | R-01 · Q-F01 · R-04 |
| `carriedLoss` storage | 1250-CP-CARRIED-{J} | FIN-L02-01 |

### 10.2 对账脚本 backlog（Gate-3 · ② 切片）

| Obs ID | 断言 |
|--------|------|
| **R-01** | steward+unalloc+global == net_profit_prime |
| **R-02** | DB epoch 行数 = EpochClosed logs |
| **R-03** | Unallocated vault balance ≥ deposits − releases |
| **R-04** | Global leg = Treasury token delta（split tx） |
| **R-05** | FeeRouter toCountry ≠ steward split（T-REG-02 ✅） |
| **R-06** | Σ accrual lines gross−expense = epoch netProfit |
| **R-07** | Admin overview bundle |
| **R-08** | observability overview 新键 |

---

## 11. 观测指标（Observability · Gate-3）

| 键 | 含义 |
|----|------|
| `country_pool_net_profit_epochs_indexed_total{j,status}` | 投影 epoch 计数 |
| `country_pool_net_profit_accrual_lines_lag_blocks` | indexer 落后 |
| `country_pool_net_profit_reconcile_r01_failures` | 守恒失败 |
| `country_pool_unallocated_vault_balance{j}` | Q-F01 custody |
| `country_pool_carried_loss{j}` | CLF 镜像 |

**禁止：** 用 obs 键 **冒充** ② GO。

---

## 12. Gate-2.4 Sepolia 前置条件（仅清单 · 禁止本包执行 broadcast）

| ID | 条件 |
|----|------|
| **G24-P-01** | Gate-2.3 Projection Package v1 四方 Pre-Review 签字 |
| **G24-P-02** | Gate-2.3 Solidity delta merged（若适用） |
| **G24-P-03** | ABI export + `14` 登记 + check-55-s13 |
| **G24-P-04** | registry event-decoders Topic0 登记 |
| **G24-P-05** | G-1/G-2 + PHASE2-START-CHECKLIST |
| **G24-P-06** | Timelock setAllowedExecutionTarget ×3 Safe 预案 |
| **G24-P-07** | pilot DE registry JSON 填实地址 |
| **G24-P-08** | Sepolia STEWARD_STAKE_POOL + jurisdiction 配置 |
| **G24-P-09** | Phase2ControlPlane · non-Anvil owner ≠ deployer EOA |
| **G24-P-10** | Runbook `[D-4555-B]` Anvil 全序列 documented |
| **G24-P-11** | Legal LEG-XJ-05 未部署国不暗示已结算 |

**Sepolia deploy 命令：** Gate-2.4 ONLY · Owner 授权 · **本阶段禁止执行**。

---

## 13. Gate-2.3 Pre-Review 签字板

| 方 | 审查范围 | Pre-Review |
|----|----------|------------|
| **产品** | §3 batch · §8 API · G-03 | ☐ |
| **财务** | §5 资金路径 · §10 对账 | ☐ |
| **法务** | LEG-XJ · Q-F01/Q-F02 披露 | ☐ |
| **工程** | §6 ABI · §7 Indexer · §9 DB · §12 G24 | ☐ |

**结论：** ☐ ACCEPT · ☐ REVISE

---

## 14. 实施顺序

```text
Gate-2.3 Pre-Review 签字
  → Gate-2.3 PR（batch + fuzz + 资金路径 · ① forge 绿）
  → Gate-2.4（ABI + decoder + Sepolia checklist · Owner 授权）
  → Gate-3（migration + indexer + API + R-01～R-06 · ② 读面）
```

**① 本地合约绿 ≠ ② Sepolia GO ≠ ③ Production GO。**

---

## 15. 变更记录

| Version | Date | Note |
|---------|------|------|
| v1-20260615 | 2026-06-15 | Gate-2.2 收口后首版 · baseline 76aff11c · Pre-Review OPEN |
