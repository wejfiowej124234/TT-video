# Country Pool Net Profit Accounting Specification v1

---

## Protocol Version Freeze · Vacancy Ledger

| 项 | 值 |
|----|-----|
| **Protocol Version** | **Vacancy Ledger V1** |
| **Spec Status** | **FROZEN** |
| **Implementation Status** | **IN_PROGRESS** |
| **PCM** | [protocol-conformance-matrix-vacancy-ledger-v1.md](protocol-conformance-matrix-vacancy-ledger-v1.md) |

**版本纪律：** FROZEN 期间仅 Implementation；Spec 升级仅 Governance Spec Change → V1.1 bump。

---

**Spec ID:** `country-pool-net-profit-accounting-v1`  
**Version:** v1.0.4-vacancy-ledger-freeze-20260709  
**Status:** **GATE-0 EXIT + Vacancy Ledger V1 FROZEN（2026-07-09）**  
**阶段：** **② 测试网前必完成** · **Gate-0 Exit ✅** · **Settlement 合约 PR 须 Gate-2 开工 checklist**

**上位设计：** [country-pool-net-profit-settlement-v1-design.md](country-pool-net-profit-settlement-v1-design.md) · **D-4555-B**  
**Companion 叙事：** [country-revenue-model-v1-draft.md §2](country-revenue-model-v1-draft.md) · **[ttg-allocation-permissions-flows-ssot-v1.md §3B](ttg-allocation-permissions-flows-ssot-v1.md)**（图解 · 改逻辑必改图）  
**分轨（读前必知）：** **D-4555-A** = FeeRouter **可分配平台手续费** 第一层 45/55（[84 §1.1](../84-第一阶段10国Country-Pool发行参数总表.md)）· **D-4555-B** = 本文件 **单国国家池净利润** 45/55 — **不同分母、不同结算时点、不同合约**

**链上对齐登记：** [PHASE2-COUNTRY-POOL-ONCHAIN-ALIGNMENT-AUDIT-20260615.md](PHASE2-COUNTRY-POOL-ONCHAIN-ALIGNMENT-AUDIT-20260615.md)

---

## 0. Gate-0 硬闸

| 规则 | 说明 |
|------|------|
| **G0-HARD-01** | 本文 **v1 科目表 + §1～§8 规则** 经 **产品 · 财务 · 法务** 三方书面确认前，**禁止** 编写 / 部署 **`CountryPoolNetProfitLedger`**（或等价 Settlement）Solidity |
| **G0-HARD-02** | Gate-2 开工条件 = 本文 **§10 签字表** 全部 **☑** + **§11 Gate-0 退出清单** 全绿 |
| **G0-HARD-03** | ① 工程/UI **仅** doc-mirror；**不得** 用 FeeRouter `PlatformFeeRouted.toCountry` **冒充** 净利润 split |
| **G0-HARD-04** | 科目变更 = **bump 本文 Version** + 治理提案 + **LEGAL-SIGNOFF ② 切片** 同批 |

### 0.1 产品 Gate-0 决议（已录入 · 2026-06-15）

| 决议 ID | 内容 | 状态 |
|---------|------|------|
| **PR-01** | **默认结算周期固定为 `QUARTER`**（自然季 · **UTC** 边界 · **`closeDelayDays=15`**）— Phase ② 测试网与首版 Settlement **不得** 默认启用 MONTH/YEAR | **✅ 产品已确认** |
| **PR-02** | **Q-F01 定案：** 无 Active Steward / Seat 不满足 §7 / StewardPath 暂不可分配时，原 **45%** 份额 **必须** 进入 **`UnallocatedStewardPathVault(jurisdiction)`** 托管 | **✅ 产品已确认** |
| **PR-03** | **禁止** 将上述 45% **转入 Global Treasury**、**销毁** 或 **静默改分/重分配**；仅可在 **符合 §7 且经治理确认** 后自 Unallocated 池 **释放** 至 StewardPath | **✅ 产品已确认** |

**Gate-2：** 见 **§0.3** — **Gate-0 Exit 通过** · **允许设计评审** · 合约 PR 仍须 checklist。

### 0.2 财务 Gate-0 决议（已录入 · 2026-06-15）

| 决议 ID | 内容 | 状态 |
|---------|------|------|
| **FIN-01** | 科目映射矩阵 **[country-pool-accounting-mapping-matrix-v1.md](country-pool-accounting-mapping-matrix-v1.md)** 冻结 **R/E** COA · 索引源 · **200 D-4555-B** 段 | **✅ 财务已确认** |
| **FIN-L02-01** | **`carriedLoss`**：**链上 SSOT** + ERP **`1250-CP-CARRIED-{J}`** 镜像 · 下期 **`E-199-CLF`** 扣减 | **✅ 财务已确认** |
| **FIN-CAL-01** | **QUARTER UTC** 关账日历 · **`closeDelayDays=15`**（2026 起算表见 mapping-matrix §6） | **✅ 财务已确认** |
| **FIN-U-01** | **`UnallocatedStewardPathVault`** → GL **`2150-CP-UNALLOC-{J}`** · 释放 → **`2201-CP-STEWARD-{J}`** | **✅ 财务已确认** |
| **FIN-DISC-01～05** | 财务披露口径（mapping-matrix §8）· **对外印刷仍须法务 L-01～L-07** | **✅ 财务已确认** |

### 0.3 法务 Gate-0 决议（已录入 · 2026-06-15）

| 决议 ID | 内容 | 状态 |
|---------|------|------|
| **LEG-01** | **[country-pool-legal-freeze-matrix-v1.md](country-pool-legal-freeze-matrix-v1.md)** 冻结 **L-01～L-07** 合规边界 + 披露句草案 | **✅ 法务已确认** |
| **LEG-L01** | **D-4555-A / D-4555-B 双轨披露** · 禁止双重 45/55 | **✅ 法务已确认** |
| **LEG-L02** | **收益分配非收益保证** · 禁止保本/固定收益/股息/股权承诺 | **✅ 法务已确认** |
| **LEG-L03** | **StewardPath** = 治理裁量路径 · **§7 Q-01～Q-04** · 非工资/非股权分红 | **✅ 法务已确认** |
| **LEG-L04** | **证券化风险隔离** · 08-4 §2 Howey **覆盖 D-4555-B** | **✅ 法务已确认** |
| **LEG-L05** | **亏损期无 split** + **`carriedLoss`** 披露 | **✅ 法务已确认** |
| **LEG-L06** | **Global Treasury vs StewardPath/Unallocated 分轨** · LEGAL-SIGNOFF D-4555-B 切片 ☑ | **✅ 法务已确认** |
| **LEG-L07** | **UnallocatedStewardPathVault** 协议托管性质 · **禁止** Global/burn/跨 **J** | **✅ 法务已确认** |
| **LEG-XJ** | **跨辖区** 一国一池 · epoch/Unallocated/carriedLoss **不混用** | **✅ 法务已确认** |

**Gate-2：** **Gate-2.1 Closeout ✅** · **Gate-2.2 Readiness 全绿** — **允许** Solidity 分支；**≠** ② broadcast GO。

---

## 1. 国家池净利润定义（Net Profit · D-4555-B）

### 1.1 核算单元

| 项 | 规则 |
|----|------|
| **Pool** | 单一 **`jurisdiction`**（ISO 3166-1 alpha-2）之 **Country Pool 核算账套** |
| **资产轨** | **R2 · USDC/USDT Country Pool**（[fund-flow-ssot.v1 §2](fund-flow-ssot.v1.md)）— **与 R3 Escrow、R1 TTG 分账** |
| **混池禁止** | **禁止** 多国净利润合并后再按国切回（[country-revenue-model §1](country-revenue-model-v1-draft.md)） |

### 1.2 公式（结算周期内 · 单币种计价）

```text
GrossCountryRevenue(epoch)     = Σ 收入科目（§2 · In）
AllowableCountryExpense(epoch) = Σ 成本/冲回科目（§3 · Out）
NetProfit(epoch)               = GrossCountryRevenue − AllowableCountryExpense
```

| 项 | 规则 |
|----|------|
| **计价币** | 该国 Pool **主记账稳定币**（Phase ② 试点默认 **USDC**；多币须 **分币账套** 或治理批准 FX 规则 — **v1 不启用 FX**） |
| **时点** | **权责发生制（accrual）** 入账至 **`closeEpoch`** 冻结；链上 **`splitNetProfit`** 仅对 **已关闭且 NetProfit > 0** 的 epoch 执行 |
| **与 NAV 关系** | 净利润结算 **不** 改变认购者 **NAV 赎回公式**（[fund-flow-ssot §4](fund-flow-ssot.v1.md)）；Operations 已花费用 **不退**（[08-4 R5](../08-4-对外口径包.md)） |

### 1.3 明确不属于净利润的对象（正交 · 84 §1.1.1）

下列 **不得** 进入 §2 收入或 §3 成本，**不得** 参与 D-4555-B 45/55：

| ID | 对象 | 归宿 / 说明 |
|----|------|-------------|
| **X-01** | 旅行者 **Escrow 订单本金** | R3 · 用户托管 |
| **X-02** | 用户自付 **L1/L2 gas** | 链上发送方承担 |
| **X-03** | **争议仲裁费 / 仲裁运营成本** | Runbook §7.1 专表 · **≠** FeeRouter 分母 |
| **X-04** | 向导 **`IdentityStakingPool` 系 slash** | SlashRouter / 81 · **≠** 国家池 P&L |
| **X-05** | **D-4555-A** 整笔 `PlatformFeeRouted` 至 Global 的 **55% 全球腿** | Global Pool 65/20/15 · **非** 单国净利润 |
| **X-06** | **TTG 质押 / 释放 / slash** | R1 · `RegionStewardStakePool` |
| **X-07** | **募资法币**（Country Pool 认购款 **本金**） | R2 份额 · **非** 周期利润 |

### 1.4 与 D-4555-A 的归因关系（防混读）

| 路径 | 是否进入 D-4555-B 收入 | 说明 |
|------|------------------------|------|
| FeeRouter → **countryBucket** → **RegionVault.forward** → **该国运营/子 Vault** | **是（有条件）** | 须 **按 jurisdiction 归因** 记入 **R-100**；**不是** 把 FeeRouter 第一层 45% **整体** 当作 NetProfit |
| FeeRouter → Global 55% 腿 | **否** | D-4555-A · Global 内部分配 |
| `CountryPoolLedgerV0.credit` | **是（有条件）** | 须 **`ref` 映射 §2 白名单科目** · **禁止** 无 ref 自动计利润 |
| RegionDistributionClaim 手工 accrual | **否（默认）** | 仅为 **分配执行层**；来源须可追溯至 **已关闭 epoch** 的 **NetProfitSplit** |

---

## 2. 收入科目表（In · v1 冻结）

**编码规则：** `R-{三位}` · 链上 **`accrue`** / 链下财务过账 **须** 带 `account_code` + `ref_id`

| 代码 | 名称 | 定义 | 典型来源 / 证据 | ② 链上锚点（计划） |
|------|------|------|-----------------|-------------------|
| **R-100** | 该国 attributable 平台手续费净额 | 已 **按国归因** 且 **进入该国 Country Pool 子账** 的 **订单可分配手续费** 累计 | RegionVault `forward` + 订单/FeeRouter 索引 · B-116/B-384 | `NetProfitAccrued` · ref=order/fee_route |
| **R-110** | 国家池其它治理批准收入 | 治理提案 **明示** 计入该国 P&L 的入账（赞助、合规补贴等） | Governor 提案附件 · 财务凭证 | `NetProfitAccrued` · ref=governance_proposal_id |
| **R-120** | 子 Vault 利息/增值（如有） | 该国 Pool 资产 **经披露** 的利息或协议内增值 | 银行/链上证明 · 法务披露 | 同上 · ref=treasury_yield |
| **R-199** | 跨期调整收入 | **`closeEpoch` 前** 治理裁定的 **收入补记**（须提案） | 审计调整 · 监管要求 | `NetProfitAccrued` · ref=adjustment_id |

**禁止作为 R-100 的误用：**

- 未 attribution 到 jurisdiction 的 **全局 countryBucket 余额** 一次性计入某国  
- **D-4555-A 比例本身**（45%）— 须是 **该国实际收到/应计** 金额  

---

## 3. 成本与冲回科目表（Out · v1 冻结）

| 代码 | 名称 | 定义 | 典型来源 / 证据 | ② 链上锚点（计划） |
|------|------|------|-----------------|-------------------|
| **E-100** | 国家运营成本（预算制） | **OperationsVault** 已 **批准预算** 内实际发生、**归因该国** 的运营支出 | 预算提案 · 发票 · 多签拨付记录 | `NetProfitAccrued`（负向）· ref=budget_line |
| **E-110** | 订单退款 / Chargeback 冲回 | 导致 **该国 Pool 资产减少** 的 **订单级退款**（相对已计收入） | 订单状态机 · Escrow refund 索引 | ref=order_id |
| **E-120** | 准备金计提调整 | **ReserveVault** 强制计提 **影响 P&L 披露** 的调整（**非** 个人可提） | 治理参数 · actuarial memo | ref=reserve_policy |
| **E-130** | 治理裁定费用扣减 | 违规、监管罚款等 **经提案** 从该国 Pool 扣减 | 治理 / 合规记录 | ref=governance_sanction |
| **E-199** | 跨期调整费用 | **`closeEpoch` 前** 审计 **费用补记/冲回** | 审计报告 | ref=adjustment_id |

**明确不得列入 E-100 的项（走 X-表）：** 仲裁运营成本（X-03）、Identity slash（X-04）、Global 运营费（Global Pool 15% 腿）。

---

## 4. 结算周期（Settlement Period）

### 4.1 Phase ② 固定默认（产品决议 PR-01）

| 参数 | v1 冻结值 | 说明 |
|------|-----------|------|
| **`settlementPeriod`** | **`QUARTER`** | **产品固定默认** · 自然季（1–3 / 4–6 / 7–9 / 10–12 月） |
| **时区** | **UTC** | **`epochStart` / `epochEnd`** 边界 **仅** UTC |
| **`closeDelayDays`** | **15** | **`epochEnd` 后** 最早 **`closeEpoch`** 的关账延迟（财务关账） |

| 枚举 | Phase ② 默认 | 启用条件 |
|------|--------------|----------|
| **`QUARTER`** | **✅ 固定默认** | 无需额外提案即可按季结算 |
| **`MONTH`** | ❌ 非默认 | **须** 治理提案 + 财务确认月结能力 |
| **`YEAR`** | ❌ 非默认 | **须** 治理提案 + 法务/税务评审 |
### 4.2 周期边界规则

| 规则 ID | 内容 |
|---------|------|
| **P-01** | **`epochId`** = 顺序递增整数 · **per jurisdiction** · **不可复用** |
| **P-02** | **`epochStart`** = 周期首日 **00:00:00 UTC** · **`epochEnd`** = 末日 **23:59:59 UTC**（或治理指定 TZ — **v1 固定 UTC**） |
| **P-03** | **`closeEpoch`** 最早在 **`epochEnd` + `closeDelayDays`**（默认 **15 日** · 财务关账）后执行 |
| **P-04** | **`splitNetProfit`** 最早在 **`closeEpoch` 成功** 且 **主理人资格快照**（§7）完成后执行 |
| **P-05** | **禁止** 在周期未结束时 **split**；**禁止** 同一 `epochId` **重复 close/split** |

### 4.3 与赎回窗口关系

| 项 | 规则 |
|----|------|
| **CountryPoolRedemptionEpochV0** | **NAV 赎回窗** · 事件 `EpochOpened/Settled` **≠** 本规格 **`closeEpoch`** |
| **读法** | 赎回 epoch **不得** 写入 `country_pool_net_profit_epochs` 投影 |

---

## 5. 亏损处理规则（NetProfit ≤ 0）

| 规则 ID | 条件 | 处理 |
|---------|------|------|
| **L-01** | **`NetProfit(epoch) < 0`** | **不执行** `splitNetProfit` · **Steward 45% = 0** · **Global 55% = 0** |
| **L-02** | **亏损结转** | **`carriedLoss(jurisdiction)` 链上 SSOT**（Settlement 合约字段）· ERP 镜像 **`1250-CP-CARRIED-{J}`** · 下期以 **`E-199-CLF`** 扣减 **`NetProfit'`**（见 [mapping-matrix §5](country-pool-accounting-mapping-matrix-v1.md) **FIN-L02-01～05**） |
| **L-03** | **后续盈利** | **`NetProfit'`** = 本期 Gross−Expense **− carriedLoss`**；仅当 **`NetProfit' > 0`** 方可 split |
| **L-04** | **`NetProfit = 0`** | 同 L-01 · 仅 **`EpochClosed`** · 无 split |
| **L-05** | **治理覆盖** | **特殊核销** 须 **独立提案** · **不得** 与 FeeRouter 路由提案合并 |
| **L-06** | **对外表述** | **禁止** 「亏损补底」「保底分配」「刚性 45%」— 见 §9 法务 |

---

## 6. 45/55 分账边界（Split · D-4555-B）

### 6.1 分账基数

| 项 | 规则 |
|----|------|
| **对象** | **`NetProfit(epoch)`** 经 L-03 调整后的 **正余额** |
| **比例** | **Steward path 45%** · **Global Treasury 55%**（bps 默认 **4500 / 5500**） |
| **分母** | **仅** 该国 **单 epoch 正 NetProfit** — **不是** FeeRouter 100% · **不是** 全球 Pool |

### 6.2 收款路径（② 设计对齐 · 含 PR-02/PR-03）

| 份额 | 收款模块 | 触发条件 |
|------|----------|----------|
| **45% · 可分配** | **`StewardPathVault(jurisdiction)`** | §7 **Q-01～Q-04** 在 **`qualificationSnapshotBlock`** **全部满足** |
| **45% · 暂不可分配** | **`UnallocatedStewardPathVault(jurisdiction)`** | **Q-F01** — 无 Active Steward / 资格不满足 / StewardPath 不可用 |
| **55%** | **`GovernanceTreasury`**（或 SSOT **Global Treasury**） | **`NetProfit' > 0`** 且 **`splitNetProfit`** 成功 · **与 45% 路径独立** |

**读法：** **55% 照常** 进入 Global Treasury；**仅** 原属 Steward 的 **45% 腿** 在资格缺失时 **不得** 改道 Global。

### 6.3 UnallocatedStewardPathVault（Q-F01 · 产品定案）

| 规则 ID | 内容 |
|---------|------|
| **U-01** | **`splitNetProfit`** 在 Q-01～Q-04 **未全满足** 时，**45% 金额** **必须** 转入 **`UnallocatedStewardPathVault(jurisdiction)`** |
| **U-02** | **禁止** 将该 45% **并入 Global 55%**、**burn**、**捐赠** 或 **无提案改分** |
| **U-03** | Unallocated 余额 **per jurisdiction** 累计；**须** 链上可审计余额与 **`NetProfitSplit`** / **`UnallocatedStewardDeposit`** 事件 |
| **U-04** | **释放** 至 **`StewardPathVault`** **仅当**：(a) 新 Active Steward 满足 §7；(b) **独立治理提案** + Timelock **`releaseUnallocatedStewardPath`**（或等价）**execute** |
| **U-05** | **禁止** 释放提案与 **FeeRouter 路由**、**募资参数**、**D-4555-A** 变更 **同一 calldata** |
| **U-06** | Unallocated **不** 产生 **个人 EOA 直提**；后续 **RegionDistributionClaim** 等 **须** 追溯 **释放记录** |

### 6.4 舍入与零头

| 规则 ID | 内容 |
|---------|------|
| **S-01** | 按 **wei/最小单位** 整数运算 · **`stewardAmount + unallocatedStewardAmount + globalAmount = NetProfit'`** |
| **S-02** | 算术 **余数**（非 Unallocated 语义）归入 **Global 55% 腿** · **不得** 因舍入将 **本属 45% 的份额** 划入 Global（**≠ U-02 禁止的「资格缺失改道」**） |
| **S-03** | **单币** split · **禁止** 一 epoch 多 token 混 split（多币 = 多账套） |

### 6.5 与 Fee Points / 募资 / 质押（三轨独立）
| 轨 | 与 45/55 split 关系 |
|----|---------------------|
| **Fee Points** | **等级标签** · **不** 自动改变 4500/5500 |
| **募资目标（万元）** | **独立** [country-pool-fundraise-governance-v1](country-pool-fundraise-governance-v1.md) · **不参与** split 公式 |
| **Seat 质押 TTG** | **责任抵押** · **不** 按质押量比例 **替代** 45% 金额 |

---

## 6.6 Vacancy Ledger · Sweep · Jurisdiction Reserve（FROZEN · 2026-07-09）

**SSOT 数值键：** [protocol-ssot.v1 §3b](protocol-ssot.v1.md) · **状态机：** [state-machine.v1 §4b](state-machine.v1.md)

### 6.6.1 定义

**Jurisdiction Reserve（辖区受限储备 · Restricted Treasury）：**

> Jurisdiction Reserve is a **restricted treasury** belonging to the **jurisdiction**, rather than to any individual steward.

- **属该国**，不属 Global Treasury 常规收入叙事，**不**自动归属任何个人 Steward。
- 出库 **仅** Governor → Timelock → **`disburseJurisdictionReserve`** 提案（本地推广、市场补贴、KOL/Guide 激励、新 Steward 启动基金等）。
- **禁止** Seat 激活时自动将历史 Reserve 划入 Steward 个人路径。

### 6.6.2 VacancyLedger（链上账本 · 每 jurisdiction）

| 字段 | 语义 |
|------|------|
| `principal` | 空窗期内 **`UnallocatedStewardDeposit`** 累计入账 |
| `swept` | 已 **vacancy sweep** 至 **`GovernanceTreasury`** 之累计 |
| `reserve` | **Jurisdiction Reserve** 链上余额（Restricted Treasury） |
| `disbursed` | 经 DAO 从 `reserve` 批准支出之累计（审计） |

**账本迁移（写死）：**

| 事件 | `principal` | `swept` | `reserve` | `disbursed` |
|------|-------------|---------|-----------|-------------|
| Unallocated deposit `x` | `+= x` | — | `+= x` | — |
| Vacancy sweep `a` → Global | — | `+= a` | `-= a` | — |
| DAO disburse `x` from reserve | — | — | `-= x` | `+= x` |

### 6.6.3 Ledger Invariants（协议级）

**任何状态迁移、任何 mutating 调用均不得破坏下列不变量：**

| ID | 不变量 |
|----|--------|
| **VL-01** | `principal == swept + reserve + disbursed` |
| **VL-02** | `reserve >= 0` |
| **VL-03** | `swept <= principal × vacancy_sweep_cap_bps / 10000` |
| **VL-04** | 当 `sweepEnabled == false`：`reserve >= principal × jurisdiction_reserve_bps / 10000` |
| **VL-05** | `disbursed` 仅经 **`disburseJurisdictionReserve`** 增加 |

**实现要求：** Forge **invariant tests** · 审计脚本 · Dashboard/Indexer **须** 以 VL-01～VL-05 校验。

### 6.6.4 Vacancy 状态机

```text
STEWARD_ACTIVE
  → VACANT              emit VacancyEntered · Ledger 新开/重置
  → GRACE_PERIOD        emit GraceStarted · 仅 deposit，不 sweep
  → SWEEP               sweepEnabled=true · 见 §6.6.5
  → STEWARD_ACTIVE      emit StewardActivated · stewardActivationEpochId · Ledger 归档
```

- **`ReserveReached`**：**事件 only**（达到 sweep cap 或 floor 且 `sweepAmount==0`）→ 置 `sweepEnabled=false`；**状态仍为 `SWEEP`**。
- **`sweepEnabled=false` 后默认不自动恢复**（`vacancy_sweep_auto_reenable: false`）。
- 重新开启 sweep **仅** 治理：`setVacancySweepEnabled(jurisdiction, true)`（**独立提案** · Timelock · **禁止**与 FeeRouter/募资/D-4555-A 同 calldata · 延续 **U-05**）。

### 6.6.5 Sweep 触发（Quarter Settlement only）

**禁止** 在任意 block 由 EOA/keeper 单独调用 sweep。

**唯一触发链：**

```text
Quarter Settlement
  → closeEpoch(epochId)
  → splitNetProfit(epochId)
  → evaluateVacancySweep(epochId)    # 内置于 split 路径或 Ledger onlyOwner 紧随 split
```

**前置条件（全部满足才执行 sweep）：**

- `vacancy_state == SWEEP`
- `sweepEnabled == true`
- Q-01～Q-04 **未** 满足（45% 腿进 Unallocated · 见 **U-01**）
- 当前 `epochId` 为 **QUARTER** 结算关账 epoch（**PR-01**）

**Sweep 金额（固定线性 · 默认参数）：**

```text
nominalSweep   = principal × vacancy_sweep_rate_bps / 10000
capRemaining   = principal × vacancy_sweep_cap_bps / 10000 − swept
floorReserve   = principal × jurisdiction_reserve_bps / 10000
maxFromReserve = reserve − floorReserve   # 若 ≤0 则本 epoch 不 sweep

sweepAmount = min(nominalSweep, capRemaining, maxFromReserve)
```

**默认 25%/季 · cap 75% · floor 25%：** 无后续 deposit 时，`principal` 不变 → 约 **3 个有效 sweep 季** 后 emit **`ReserveReached`** · `sweepEnabled=false`。

**`sweepEnabled=false` 后之 deposit：** 仍 `principal += x; reserve += x`；**不** 自动恢复 sweep。

### 6.6.6 StewardActivationEpoch Gate（协议级 · 反套利）

| 规则 ID | 内容 |
|---------|------|
| **G-01** | Seat 激活时写入 **`stewardActivationEpochId`**（或等价 timestamp 映射至 epoch） |
| **G-02** | **`epochId <= stewardActivationEpochId`** 之 Unallocated / Reserve **禁止** 自动 **`releaseToStewardPath`** 归新 Steward |
| **G-03** | 新 Steward **仅** 参与 **`epochId > stewardActivationEpochId`** 且 Q-01～Q-04 满足之 **45%** 路径 |
| **G-04** | 历史 **Jurisdiction Reserve** 出库 **仅** **`disburseJurisdictionReserve`** · **非** activate 自动发放 |

### 6.6.7 审计事件

| 事件 | 说明 |
|------|------|
| `VacancyEntered` | 进入空窗 |
| `GraceStarted` | 宽限计时开始 |
| `SweepExecuted` | 每季 sweep（含 `epochId` · `sweepAmount` · ledger 四维） |
| `ReserveReached` | sweep 关闭（**非状态**） |
| `StewardActivated` | Seat 激活 + `stewardActivationEpochId` |
| `JurisdictionReserveDisbursed` | DAO 从 reserve 支出 + `proposalRef` |

### 6.6.8 与 §6.3 U-02 的关系（例外）

| 规则 ID | 内容 |
|---------|------|
| **U-07** | **Vacancy sweep**（§6.6.5）允许将 **reserve 之一部** 转至 **`GovernanceTreasury`** — **≠** U-02 禁止之「资格缺失改道 Global 55% 腿」 |
| **U-08** | **禁止** 将 **Jurisdiction Reserve**（`reserve` 在 `sweepEnabled=false` 后之地板部分）**无提案** 并入 Global 或 burn |
| **U-09** | **禁止** 跨 **jurisdiction** 混用 VacancyLedger |

---

## 6.7 实现纪律与 Sprint 顺序（FROZEN · 2026-07-09）

**SSOT 索引：** [protocol-ssot.v1 §3c](protocol-ssot.v1.md)

### 6.7.1 硬闸

**经济规则（§6.6 · VL-01～VL-05 · Governance Parameters 默认值）已冻结。**

| ✅ 允许 | ❌ 禁止（除非 Governance Spec Change → SSOT bump → Review） |
|---------|--------------------------------------------------------------|
| Gas / storage / event / interface 优化 | 链上硬编码 180 天（须读治理参数） |
| Forge / fuzz / invariant 测试补充 | 擅自改 25% / 75% / 25% 经济语义 |
| Indexer / Dashboard **只读** | 削弱或绕过 StewardActivationEpoch Gate |
| 审计脚本 | 破坏 `principal == swept + reserve + disbursed` |

**顺序（写死）：** SSOT → Review → Implementation。**禁止** 先改合约再补文档。

### 6.7.2 Sprint 顺序（建议 · ② 测试网）

| Sprint | 模块 | DoD |
|--------|------|-----|
| **S1 · VacancyLedger Core** | `UnallocatedStewardPathVault` / Lib | Exit Criteria：PCM §3 I-01～I-06 · V-01～V-03 · **零 Ledger/API 依赖** |
| **S2 · 证明协议** | Forge fuzz | **100% Invariant**（非 coverage）· VL-01～VL-05 连续 pass |
| **S3 · Ledger 接入** | `CountryPoolNetProfitLedger` | S3a→S3b→S3c |
| **S4 · 展示层** | Indexer / Dashboard | Read Only |

**PCM：** [protocol-conformance-matrix-vacancy-ledger-v1.md §3·§5.1](protocol-conformance-matrix-vacancy-ledger-v1.md)

**S4 不得** 反向驱动经济规则变更。协议层（S1～S3）才是真源。

### 6.7.3 Gate 交叉引用

- Gate-2.2 首 PR DoD 扩展：**G22-D-05** Vacancy invariant suite green（见 [Gate-2.2 checklist §8](country-pool-settlement-gate2.2-implementation-readiness-checklist.md)）
- **Protocol Conformance Matrix（PCM）：** [protocol-conformance-matrix-vacancy-ledger-v1.md](protocol-conformance-matrix-vacancy-ledger-v1.md) — Spec → Risk → Module → Test → Audit · **Sprint 1 前必 READ** · PR Critical 纪律 **§5.1**

---

## 7. 主理人资格边界（Steward Eligibility · 45% 路径）

**45% 份额** 进入 **`StewardPathVault`** 的 **前提** 是 **主理人资格** 在 **`qualificationSnapshotBlock`** 满足下列 **全部** 条件：

| ID | 条件 | 真源 / 验证 |
|----|------|-------------|
| **Q-01** | 该国存在 **唯一 Active Seat / Region Steward**（`jurisdiction` 匹配） | [83 §7](83-区域治理与收益分配-协议白皮书.md) · Admin/链上状态 |
| **Q-02** | **`RegionStewardStakePool`** 对该 jurisdiction **`hasJurisdictionStake[steward] == true`** 且 **`active`** | 链上 view · **质押量 ≥ minStakeAmount** |
| **Q-03** | **未** 处于 **处罚 / 暂停 / 辞任流程中** | state-machine `steward_application` / Admin 标记 |
| **Q-04** | **最短任期**（若适用）：`steward_seat_min_tenure_months` 已满足 **或** 治理 **豁免提案** | [protocol-ssot.v1 §3](protocol-ssot.v1.md) |
| **Q-05** | **KPI / SeatBonus 门槛**（若 Phase ② 启用）：**83 §8** · **`bonusRate`/`bonusCap`** — **v1 默认：Q-05 不启用 KPI 硬闸** · 仅 **Q-01～Q-04** |

**不满足 Q-01～Q-04 时（Q-F01 · 产品定案 PR-02/PR-03）：**

| 规则 ID | 处理 |
|---------|------|
| **Q-F01** | 原 **45%** **`stewardLegAmount`** **全额** 进入 **`UnallocatedStewardPathVault(jurisdiction)`** — **非** StewardPath · **非** Global · **非** burn |
| **Q-F02** | **禁止** 将 Unallocated 45% **转入 Global Treasury** 或 **提高 globalAmount** 以「补齐」55% — Global 腿 **仅** 为 **`NetProfit' × 5500/10000`**（+ S-02 算术余数） |
| **Q-F03** | **禁止** **销毁**、**无提案改分** 或 **跨 jurisdiction 混用** Unallocated 余额 |
| **Q-F04** | **释放**：当辖区产生 **符合 §7** 的 Active Steward 时，**仅** 经 **独立治理提案** 自 Unallocated → **`StewardPathVault`**（见 **U-04**） |
| **Q-F05** | **主理人个人 EOA** **不得** 在 **`splitNetProfit`** 或 **Unallocated 释放** 中 **直接收款** |
**Seat 权限边界（83 §7 · 重申）：** 主理人 **不得** 单方修改 **Fee 比例 / Snapshot / Global 参数**；**45% 路径分配** 仍受 **GlobalDAO 否决** 与 **Timelock** 约束。

---

## 8. 财务核算与对账要求（Finance · Gate-0）

| ID | 要求 | 交付物 |
|----|------|--------|
| **F-01** | 各国 **独立总账子账** 映射 §2/§3 科目 | **[country-pool-accounting-mapping-matrix-v1.md](country-pool-accounting-mapping-matrix-v1.md)**（**Gate-0 已冻结**） |
| **F-02** | **`closeEpoch`** 与 ERP **关账周期** 对齐 | 关账日历 · **closeDelayDays** 签字 |
| **F-03** | **链上 `NetProfitAccrued` / `EpochClosed` / `NetProfitSplit`** ↔ 财务凭证 **双向 ref** | 对账 Runbook 草案 |
| **F-04** | **B-385 类** 观测 **扩展** 至 net-profit 投影（**Gate-3**） | 与 [PHASE2 审计 §7](PHASE2-COUNTRY-POOL-ONCHAIN-ALIGNMENT-AUDIT-20260615.md) R-02 对齐 |
| **F-05** | **[200-阶段财务对账结算与报表](../200-阶段财务对账结算与报表.md)** 报表行 **新增 D-4555-B 段**（Gate-1 台账） | 不得与 D-4555-A 行合并 |

---

## 9. 法务与对外表述要求（Legal · Gate-0）

**须** 与 [08-4 对外口径包](../08-4-对外口径包.md) **证券隔离** 一致；**合规边界 + 披露句草案** 见 **[country-pool-legal-freeze-matrix-v1.md](country-pool-legal-freeze-matrix-v1.md)**（**Gate-0 已冻结** · **定稿前不得对外印刷**）：

| ID | 要求 |
|----|------|
| **L-01** | 对外 **必须** 区分 **「平台可分配手续费路由（D-4555-A）」** 与 **「单国国家池净利润结算（D-4555-B）」** — **禁止** 同页加总暗示 **「双重 45/55」** |
| **L-02** | **禁止** 保本、固定收益、股息、股权、利润分成承诺 |
| **L-03** | **45%** 表述为 **「协议治理裁量下的区域分配路径」** · **非** 工资 · **非** 股权分红 |
| **L-04** | **亏损期无 split**（§5）须在 **风险披露** 中 **明示** |
| **L-05** | **NAV 赎回非保本**（08-4 R4）与 **净利润 split** **分段披露** |
| **L-06** | 启用 **② 链上读数** 前，**LEGAL-SIGNOFF** 增 **D-4555-B 切片**（见 §10 · legal-matrix §6） |
| **L-07** | **Jurisdiction Reserve（Restricted Treasury）** 须披露为 **「辖区受限储备 · 属 jurisdiction 而非个人 Steward · DAO 提案用途」** — **非** Global 常规收入 · **非** 已放弃权益 · **非** 销毁 · **非** 新 Steward 自动历史领取 |

**扩展 [LEGAL-SIGNOFF-CHECKLIST](LEGAL-SIGNOFF-CHECKLIST.md)（Gate-0 · D-4555-B 切片 ☑ · 2026-06-15）：**

| ☐ | 项 |
|---|-----|
| ☑ | **D-4555-B 分轨披露**：对外材料 **不** 将 FeeRouter 45/55 图 **等同** 国家池净利润 45/55 |
| ☑ | **科目与亏损**：§2/§3/§5 与 **无保底分配** 表述一致 |
| ☑ | **主理人路径**：§7 **非** 证券型收益承诺 |
| ☑ | **Unallocated 托管**：§6.3 **U-02** / §7 **Q-F02～Q-F03** 与 08-4 证券隔离一致 |
| ☑ | **08-4 第 2 章**：Howey / 收益证券隔离 **覆盖** D-4555-B |

## 10. Gate-0 签字表（三方 · 未完成禁止 Gate-2）

| ☐ | 角色 | 确认范围 | 签字人 | 日期 |
|---|------|----------|--------|------|
| ☑ | **产品负责人** | **PR-01** `QUARTER`+UTC+`closeDelayDays=15` 固定默认 · **PR-02/PR-03** **`UnallocatedStewardPathVault`** · §7 Q-F01～Q-F05 · §4/§6.3 | **Sebastian Ward（产品决议 · 2026-06-15）** | 2026-06-15 |
| ☑ | **财务负责人** | **FIN-01** mapping-matrix · **FIN-L02** 链上+ERP · **FIN-CAL-01** QUARTER 日历 · **FIN-U-01** **`2150`** · **FIN-DISC-01～05** | **Sebastian Ward（财务 Gate-0 · 2026-06-15）** | 2026-06-15 |
| ☑ | **法务负责人** | **LEG-01** legal-matrix · **L-01～L-07** · **LEG-XJ** · LEGAL-SIGNOFF D-4555-B 切片 · 08-4 §2 | **Sebastian Ward（法务 Gate-0 · 2026-06-15）** | 2026-06-15 |
| ☑ | **工程负责人（见证）** | 确认 **无** Settlement 合约 PR（**G0-09**）；Gate-0 Exit → **Gate-2 设计评审** 入口 | **Sebastian Ward（工程见证 · 2026-06-15）** | 2026-06-15 |

**Gate-2 状态：** **Gate-0 Exit 通过** — **允许 Gate-2 设计评审**；**Settlement Solidity PR** 仍须 Gate-2 开工 checklist · **≠** ③ 对外印刷 GO。
**Owner 自证索引（① · 非 ③ 法务 counsel）：** [SOLO-MAINTAINER-SIGNATURE-INDEX](../../frontend/evidence/GO_local_phase1/SOLO-MAINTAINER-SIGNATURE-INDEX.md)

---

## 11. Gate-0 Exit Review（全绿 → 允许 Gate-2 设计评审）

| # | 检查项 | 产品 | 财务 | 法务 | 工程 |
|---|--------|------|------|------|------|
| G0-01 | **Q-F01** 定案 **`UnallocatedStewardPathVault`** · §6.3 **U-01～U-06** | **✅** | **✅** | **✅** | **✅** |
| G0-02 | §2/§3 科目 **代码表冻结** · [mapping-matrix v1](country-pool-accounting-mapping-matrix-v1.md) | **✅** | **✅** | **✅** | **✅** |
| G0-03 | **PR-01** **`QUARTER` · UTC · `closeDelayDays=15`** · FIN-CAL-01 | **✅** | **✅** | **✅** | **✅** |
| G0-04 | **FIN-L02** 亏损结转 **链上 SSOT + ERP 镜像 + E-199-CLF** | **✅** | **✅** | **✅** | **✅** |
| G0-05 | §9 **L-01～L-07**（法务 · [legal-matrix v1](country-pool-legal-freeze-matrix-v1.md)）· **FIN-DISC-01～05** | **✅** | **✅** | **✅** | **✅** |
| G0-06 | §10 **产品 ☑ + 财务 ☑ + 法务 ☑** | **✅** | **✅** | **✅** | **✅** |
| G0-07 | [country-revenue-model §7](country-revenue-model-v1-draft.md) 与本文一致 | **✅** | **✅** | **✅** | **✅** |
| G0-08 | [settlement-v1-design §3](country-pool-net-profit-settlement-v1-design.md) 指向本文 | **✅** | **✅** | **✅** | **✅** |
| G0-09 | **无** `CountryPoolNetProfit*.sol` / Settlement PR | **✅** | **✅** | **✅** | **✅** |

**Exit 结论：** **✅ Gate-0 通过（2026-06-15）** — 产品+财务+法务+工程见证全绿。**允许进入 Gate-2 设计评审**；**Settlement 合约实现/部署 PR** 仍须 **Gate-2 开工 checklist** 与独立评审 — **禁止** 跳步至 ③ 对外印刷 GO。

**Gate-2 入口（Gate-0 Exit ✅）：** [country-pool-settlement-architecture-package-v1.md](country-pool-settlement-architecture-package-v1.md) **v1-final** → [Gate-2.2 Readiness Checklist](country-pool-settlement-gate2.2-implementation-readiness-checklist.md) **全绿后** Solidity 分支
---

## 12. 变更记录

| Version | Date | Note |
|---------|------|------|
| v1.0.4-vacancy-ledger-freeze-20260709 | 2026-07-09 | **Vacancy Ledger V1 FROZEN**：§6.6 · §6.7 实现纪律与 Sprint · VL-01～VL-05 · Quarter-only sweep · Jurisdiction Reserve · StewardActivationEpoch Gate · L-07 更新 |
| v1.0.3-legal-freeze-20260615 | 2026-06-15 | **法务 Gate-0**：legal-freeze-matrix v1 · L-01～L-07 · LEG-XJ · LEGAL-SIGNOFF D-4555-B · §10 法务 ☑ · **Gate-0 Exit** |
| v1.0.2-finance-freeze-20260615 | 2026-06-15 | **财务 Gate-0**：mapping-matrix v1 · **FIN-L02** 链上+ERP · QUARTER 日历 · **2150 Unallocated** · FIN-DISC · G0-02/03/04/05 财务列 ☑ |
| v1.0.1-product-res-20260615 | 2026-06-15 | **产品 Gate-0 决议 PR-01～PR-03** |
| v1-20260615 | 2026-06-15 | Gate-0 冻结审查首版 |