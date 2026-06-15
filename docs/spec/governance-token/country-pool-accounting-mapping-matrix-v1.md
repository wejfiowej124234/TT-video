# Country Pool Accounting Mapping Matrix v1

**Matrix ID:** `country-pool-accounting-mapping-v1`  
**Version:** v1.0.3-funding-path-final-20260615  
**Status:** **GATE-0 FINANCE FREEZE（② · 随 accounting-spec v1.0.2）**  
**SSOT 规格：** [country-pool-net-profit-accounting-spec-v1.md](country-pool-net-profit-accounting-spec-v1.md)  
**阶段：** ② · **Gate-2 仍锁定**（待法务 §9 签字）

---

## 1. 使用说明

| 列 | 含义 |
|----|------|
| **Spec 科目** | accounting-spec **R-xxx / E-xxx** |
| **GL 代码** | 集团总账 **COA v1**（一国一池 **子账** `{J}` = jurisdiction） |
| **链上/索引源** | ② 对账用 · **≠** ① 自动过账 |
| **200 报表段** | [200](../200-阶段财务对账结算与报表.md) **D-4555-B** 行（Gate-1 台账同批） |

**分轨：** 本矩阵 **仅 D-4555-B** · **禁止** 与 **D-4555-A**（`fee_router_routed_events` 聚合行）合并。

---

## 2. 收入科目映射（R-100～R-199）

| Spec | GL 代码 | 总账名称（ZH） | 类型 | 链上/业务源 | 过账时点 | 200 报表段 |
|------|---------|----------------|------|-------------|----------|------------|
| **R-100** | **`4101-CP-{J}`** | 国家池 · 归因平台手续费收入 | 收入 | `region_vault_forwarded_events`（按 **jurisdiction 归因**）+ 订单/FeeRouter 交叉索引 · **非** 整笔 `toCountry` | 周期内 **accrual** · `NetProfitAccrued` | **B-R100** |
| **R-110** | **`4102-CP-{J}`** | 国家池 · 治理批准其它收入 | 收入 | Governor 提案附件 · 财务凭证 · `ref=governance_proposal_id` | 批准日计入本 epoch | **B-R110** |
| **R-120** | **`4103-CP-{J}`** | 国家池 · 子 Vault 利息/增值 | 收入 | 银行/链上 yield 证明 · `ref=treasury_yield` | 周期内按日/按季 accrual | **B-R120** |
| **R-199** | **`4109-CP-{J}`** | 国家池 · 跨期收入调整 | 收入 | 审计/监管调整 · `ref=adjustment_id` | **`closeEpoch` 前** 补记 | **B-R199** |

**R-100 财务归因规则（FIN-R100-01）：**

1. 金额 = **该国 RegionVault 转发至 Country Pool 子账** 且 **可映射订单/批次** 的 **可分配手续费** 累计。  
2. **排除：** Global 55% 腿 · 未归因 forward · Escrow 本金 · X-01～X-07。  
3. **对账键：** `{chain_id, jurisdiction, token, epoch_id}` ↔ Σ `region_vault_forwarded_events`（归因过滤器 **Gate-3** 实现）。

**R-199 亏损结转收入侧（FIN-L02-02）：** 当 **`carriedLoss` 冲减** 在本期 **E-199-CLF** 体现时，**不在 R-199 重复记收入** — 见 §5。

---

## 3. 成本科目映射（E-100～E-199）

| Spec | GL 代码 | 总账名称（ZH） | 类型 | 链上/业务源 | 过账时点 | 200 报表段 |
|------|---------|----------------|------|-------------|----------|------------|
| **E-100** | **`5101-CP-{J}`** | 国家池 · 运营成本（预算制） | 费用 | OperationsVault 预算行 · 发票 · 多签拨付 · `ref=budget_line` | 费用 **发生** 计入本 epoch | **B-E100** |
| **E-110** | **`5102-CP-{J}`** | 国家池 · 订单退款冲回 | 费用 | Escrow refund / chargeback · `ref=order_id` | 退款确认日 | **B-E110** |
| **E-120** | **`5103-CP-{J}`** | 国家池 · 准备金计提调整 | 费用 | ReserveVault 政策 · `ref=reserve_policy` | 计提日 | **B-E120** |
| **E-130** | **`5104-CP-{J}`** | 国家池 · 治理裁定扣减 | 费用 | 制裁/罚款提案 · `ref=governance_sanction` | 裁定执行日 | **B-E130** |
| **E-199** | **`5109-CP-{J}`** | 国家池 · 跨期费用调整 | 费用 | 审计调整 · `ref=adjustment_id` | **`closeEpoch` 前** | **B-E199** |
| **E-199-CLF** | **`5109-CLF-{J}`** | 国家池 · **亏损结转扣减**（子目） | 费用 | 链上 **`carriedLoss`** 镜像 · `EpochClosed` 导入 | **新 epoch 首条 accrual 前** | **B-E199-CLF** |

**E-100 边界（FIN-E100-01）：** **不得** 含仲裁运营成本（X-03）、Identity slash（X-04）、FeeRouter Global 15% 运营腿。

---

## 4. NetProfit 计算规则（财务冻结 · FIN-NP-01）

### 4.1 周期内公式

```text
GrossCountryRevenue(epoch,J)     = Σ R-100..R-199  (贷方 − 借方冲回)
AllowableCountryExpense(epoch,J) = Σ E-100..E-199 + E-199-CLF
NetProfit(epoch,J)               = GrossCountryRevenue − AllowableCountryExpense
```

### 4.2 关账后可分配利润（split 基数）

```text
NetProfit'(epoch,J) = NetProfit(epoch,J) − carriedLossApplied(epoch,J)
```

| 项 | 规则 |
|----|------|
| **`carriedLossApplied`** | 自 **`carriedLoss(J)`** 余额 **min(carriedLoss, max(NetProfit,0))** 在本 epoch **E-199-CLF** 一次性扣减 |
| **split 条件** | **`EpochClosed`** 且 **`NetProfit' > 0`** |
| **GL 关账分录（概念）** | `closeEpoch` 时：**Dr/Cr 3301-CP-NP-{J}** 冻结本 epoch P&L · 转入 **`3201-CP-NP-CLEARING-{J}`** 待 split |

### 4.3 Split 分录映射（`NetProfit'` > 0）

| 腿 | 金额 | GL / 链上 |
|----|------|-----------|
| **Steward 45%** | `floor(NetProfit' × 4500/10000)` | **Dr** `3201` **Cr** **`2201-CP-STEWARD-{J}`** · 链上 **`StewardPathVault`** |
| **Unallocated 45%** | 同上公式 · 资格缺失时 | **Dr** `3201` **Cr** **`2150-CP-UNALLOC-{J}`** · 链上 **`UnallocatedStewardPathVault`** |
| **Global 55%** | `NetProfit' − stewardLeg − unallocatedLeg`（含 S-02 余数） | **Dr** `3201` **Cr** **`2101-CP-GLOBAL-DUE`** · 链上 **`GovernanceTreasury`** |

**FIN-SPLIT-01：** `stewardLeg + unallocatedLeg + globalLeg = NetProfit'`（最小单位整数）。

### 4.3.1 Fund clearing（`fundLedgerForSplit` · FIN-FND-01 · **G23-03 FINAL**）

| 项 | 规则 |
|----|------|
| **时点** | **`EpochClosed`** 且 **`SPLIT_PENDING`** 后 · **`splitNetProfit` 前** |
| **Pilot 默认路径** | **路径 A · Allowance** — `fundingSource` **`approve`** → Ledger **`transferFrom(pull)`**（Architecture **§7.4.1**） |
| **`LedgerFundedForSplit.amount`** | 本次 **`transferFrom` 实际 pull 量**；ledger 已 `balance >= netProfitPrime` 时为 **0**（Foundry **T-FND-05/06**） |
| **`fundingSource`（事件字段）** | calldata 配置的 pull 来源 · 通常为 Operations / Treasury 子 Vault |
| **GL（概念 · ② 过账）** | **Dr** `3201-CP-NP-CLEARING-{J}` **Cr** `fundingSource` 对应子账 · 金额 = **`amount`** |
| **indexer 对账键** | `{chain_id, jurisdiction, epoch_id, tx_hash}` + **`amount`** + **`fundingSource`** |

**路径 B（`GovernanceTreasury.spend`）：** ② 可选 Runbook · **非** Pilot 默认 · **① 无** 链上实现变更。

---

## 5. 亏损结转规则（FIN-L02 · Gate-0 定案）

| ID | 规则 | 链上 SSOT | ERP 镜像 |
|----|------|-----------|----------|
| **FIN-L02-01** | **`carriedLoss`** **per jurisdiction** · **链上字段为 SSOT** | `CountryPoolNetProfitLedger.carriedLoss(j, token)` | **`1250-CP-CARRIED-{J}`** 只读镜像 |
| **FIN-L02-02** | 当 **`NetProfit(epoch) < 0`**：`carriedLoss += abs(NetProfit)` · **无 split** | `EpochClosed` 事件写入 | ERP **Dr** `1250` **Cr** `3301`（或等价） |
| **FIN-L02-03** | 下期 **`NetProfit' > 0`** 前： **`E-199-CLF`** = **`carriedLossApplied`** | 链上扣减 `carriedLoss` | ERP 同步 **`5109-CLF-{J}`** |
| **FIN-L02-04** | **`NetProfit = 0`**：仅关账 · 不 split · 不增加 carriedLoss | 同 L-04 | 无 split 分录 |
| **FIN-L02-05** | **特殊核销** carriedLoss **须** 独立治理提案 · **不得** 与 FeeRouter 同批 | 治理 tx ref | 手工 **`E-199`** + 审批号 |

**禁止：** 用 **Global 55%** 或 **Unallocated** 填补当期亏损（**≠** Q-F02 语义）。

---

## 6. 季度关账日历（UTC · PR-01 · FIN-CAL-01）

**参数：** `settlementPeriod=QUARTER` · `closeDelayDays=15` · 时区 **UTC**

| epochId | jurisdiction | epochStart (UTC) | epochEnd (UTC) | 最早 closeEpoch (UTC) | 最早 splitNetProfit |
|---------|--------------|------------------|----------------|----------------------|---------------------|
| 1 | *（每国独立计数可同序）* | 2026-01-01 00:00:00 | 2026-03-31 23:59:59 | **2026-04-15** | close 成功后 + 资格快照 |
| 2 | | 2026-04-01 00:00:00 | 2026-06-30 23:59:59 | **2026-07-15** | 同上 |
| 3 | | 2026-07-01 00:00:00 | 2026-09-30 23:59:59 | **2026-10-15** | 同上 |
| 4 | | 2026-10-01 00:00:00 | 2026-12-31 23:59:59 | **2027-01-15** | 同上 |

**关账动作顺序（FIN-CAL-02）：**

1. T+0～T+15：收集 R/E  accrual · 对账 RegionVault / Operations 凭证  
2. T+15：**`closeEpoch`** · 冻结 **`3301-CP-NP-{J}`**  
3. T+15+：主理人资格快照 · **`splitNetProfit`**（若 **`NetProfit' > 0`**）  
4. ERP：**同一 UTC 日** 过账 split 分录 · 与链上 **`NetProfitSplit`** 对拍  

---

## 7. UnallocatedStewardPathVault 总账映射（FIN-U-01）

| 场景 | GL | 余额性质 | 披露分类（FIN-DISC-03） |
|------|-----|----------|-------------------------|
| **split 时资格缺失** · 45% 入账 | **`2150-CP-UNALLOC-{J}`** | **负债 · 协议托管**（待释放） | 附注：**「待主理人资格满足后治理释放」** · **非** 收入 · **非** 总部权益 |
| **释放** Unallocated → StewardPath | **Dr** `2201-CP-STEWARD-{J}` **Cr** `2150` | 负债转 **Steward 路径应付** | 附注：治理提案号 + 释放 epoch |
| **禁止** | — | **不得 Cr** `2101-CP-GLOBAL-DUE` 消化 Unallocated | 违反 PR-03 / Q-F02 |

**链上对账键：** `{jurisdiction, token}` **`UnallocatedStewardDeposit`** 累计 = GL **`2150`** 余额（± 释放）。

---

## 8. 财务披露口径（FIN-DISC · 影响报表 · 法务 L-04/L-05/L-07 交叉）

| ID | 披露项 | 口径 |
|----|--------|------|
| **FIN-DISC-01** | **D-4555-B 段标题** | **「单国 Country Pool 净利润结算（非平台 FeeRouter 第一层 45/55）」** |
| **FIN-DISC-02** | **亏损期** | 列示 **`carriedLoss`** 余额 · **明示** 当期 **无** steward/global split |
| **FIN-DISC-03** | **Unallocated** | 资产负债表 **2150** 附注 · **不** 并入总部收入行 |
| **FIN-DISC-04** | **与 NAV** | 净利润 split **不** 调整 NAV 赎回基数（交叉 08-4 R4） |
| **FIN-DISC-05** | **与 D-4555-A** | 管理报表 **分列** **B-R100** vs FeeRouter 路由行 · **禁止** 加总为「双重 45/55」 |

**Gate-0：** 财务确认 **FIN-DISC-01～05** 可用于 **200 报表 D-4555-B 段** 草案；**对外印刷** 须 **[legal-freeze-matrix v1](country-pool-legal-freeze-matrix-v1.md)** + 法务 **L-01～L-07** ☑（**2026-06-15**）。

---

## 9. 索引/对账映射（Gate-3 预备 · ① 只读参考）

| 投影表 / 观测 | 用途 | Spec 科目 |
|---------------|------|-----------|
| `region_vault_forwarded_events` | R-100 归因输入 | R-100 |
| `p5_country_ledger_lines` | 运营 credit 辅助 · **非** 自动 R-100 | 须 ref 白名单 |
| `fee_router_routed_events` | **D-4555-A 对账** · **禁止** 直接记 R-100 | X-归因 |
| `country_pool_net_profit_epochs`（② 新建） | `EpochClosed` / `NetProfitSplit` | 全 epoch |

---

## 10. Gate-0 财务签字（本矩阵）

| ☐ | 项 | 状态 |
|---|-----|------|
| ☑ | R-100～R-199 · E-100～E-199 · E-199-CLF 映射冻结 | **2026-06-15** |
| ☑ | FIN-NP-01 NetProfit / NetProfit' 规则 | **2026-06-15** |
| ☑ | FIN-L02-01～05 亏损结转（**链上 SSOT + ERP 镜像**） | **2026-06-15** |
| ☑ | FIN-CAL-01 季度关账日历 UTC+15d | **2026-06-15** |
| ☑ | FIN-U-01 Unallocated **`2150`** 映射 + 披露 | **2026-06-15** |
| ☑ | FIN-DISC-01～05 财务披露口径 | **2026-06-15** |

**签字：** **Sebastian Ward（财务 Gate-0 · Owner 自证）** · **2026-06-15**

---

## 11. 变更记录

| Version | Date | Note |
|---------|------|------|
| v1.0.3-funding-path-final-20260615 | 2026-06-15 | **G23-03** · §4.3.1 FIN-FND-01 · `LedgerFundedForSplit.amount` FINAL |
| v1.0.2-finance-freeze-20260615 | 2026-06-15 | 与 accounting-spec v1.0.2 对拍 · §10 财务签字完成 |
| v1-20260615 | 2026-06-15 | Gate-0 财务冻结首版 · 随 accounting-spec v1.0.2 |
