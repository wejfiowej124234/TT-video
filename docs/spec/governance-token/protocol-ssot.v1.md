# Protocol SSOT v1 — 协议数值与辖区参数唯一真源

---

## Protocol Version Freeze · Vacancy Ledger

| 项 | 值 |
|----|-----|
| **Protocol Version** | **Vacancy Ledger V1** |
| **Spec Status** | **FROZEN** |
| **Implementation Status** | **IN_PROGRESS** |
| **PCM** | [protocol-conformance-matrix-vacancy-ledger-v1.md](protocol-conformance-matrix-vacancy-ledger-v1.md) |

**版本纪律：** FROZEN 期间仅 **Implementation**；经济语义变更 **仅** Governance Spec Change → **V1.1** SSOT bump → Review。见 **§3c**。

---

**Version:** 1.0.3  
**Status:** **LOCKED（Protocol Convergence · P0+P1 + TTG Tokenomics Freeze V1 + Vacancy Ledger V1）** — **本文件为数值/辖区/锁仓层级的唯一写入口**  
**机读镜像：** [protocol-ssot.v1.yaml](protocol-ssot.v1.yaml) · **P1 纪要：** [protocol-convergence-P1-memo.md](protocol-convergence-P1-memo.md)  
**阶段：** **Target（① 文档定稿 · ② 测试网合约对齐 · ③ 主网另闸）**  
**受众：** 合约、后端、前端、84/89/96/83 叙事文档（**只读引用，禁止自写数字**）

**Companion（同批 P0）：**

| 文件 | 职责 |
|------|------|
| **[TTG-TOKENOMICS-GENESIS-V2.md](TTG-TOKENOMICS-GENESIS-V2.md)** | **创世分配唯一业务真源（四块 15/5/30/50）** |
| **[TTG-TOKENOMICS-FREEZE-V1.md](TTG-TOKENOMICS-FREEZE-V1.md)** | **GOV-01～04 经济闸 · Gate-2.4 / Sepolia 读口**（分配表 → Genesis V2） |
| **[fund-flow-ssot.v1.md](fund-flow-ssot.v1.md)** | 四类资金分轨、Vault 职责、可提/不可提 |
| **[state-machine.v1.md](state-machine.v1.md)** | Steward / Country / Redemption 状态枚举（`snake_case`） |
| **[ttg-allocation-permissions-flows-ssot-v1.md](ttg-allocation-permissions-flows-ssot-v1.md)** | **图解 SSOT**：TTG 供应 · 四轨 · 两轨收益 · 申请 · 权限（**分配表 SUPERSEDED → Genesis V2**） |
| **[protocol-conformance-matrix-vacancy-ledger-v1.md](protocol-conformance-matrix-vacancy-ledger-v1.md)** | **PCM**：Vacancy Ledger Spec → Module → Test → Audit（**Sprint 1 前必 READ**） |
| **[traveltrust-web3-protocol-master-matrix-v1.md](traveltrust-web3-protocol-master-matrix-v1.md)** | **Web3 运维总账**：部署 · Registry · 层就绪 · 风险（**W1+ 必 READ**） |

**对外披露上限：** [08-4](../08-4-对外口径包.md)、[LEGAL-SIGNOFF-CHECKLIST](LEGAL-SIGNOFF-CHECKLIST.md) — 本文件 **不** 替代法务定稿措辞。

---

## §0 团队规则（写死）

1. **任何** 新增/修改：**百分比、锁仓天数、辖区 cap、供应分解、质押 bps** → **必须先改本文件**，再改 84/89/96/合约/API/前端。  
2. **禁止** 在业务文档、UI 文案、合约常量中 **硬编码** 与下表冲突的数字；允许 **引用键名**（如 `jurisdiction.CN.steward_stake_bps`）。  
3. **两套 bps 不得混读：** `fee_route_bps`（FeeRouter 费用路由权重）**≠** `steward_stake_bps`（主理人 Seat 申请 TTG 质押占总量比例）。Phase 1 **数值相等** 仅为 **产品映射决策**，**不是** 同一语义。  
4. **双轨弱联动（与 B 轨价目表）：** `steward_stake_bps` 等 **只** 在本文件与链上 `RegionStewardStakePool` 消费；**平台准入费** **只** 在 **[onboarding-fee-schedule.v1](../artifacts/onboarding-fee-schedule.v1.md)**（**`fee_schedule_v1`**）+ **[96-18 §3.6](../96-18-商家与主理人准入费用与治理币兑换设计.md#9618-fee-schedule-v1)** / **`GET /api/v1/onboarding/*`** 消费。**禁止** 在本文件写准入费 **法币金额**；**禁止** `steward_stake_bps` ↔ 准入费 **等值映射**（见 **96-18 §3.5**）。  
5. **修订流程：** bump 本文件 `Version` → 同步 [protocol-ssot.v1.yaml](protocol-ssot.v1.yaml) 与 `crates/api/.../governance_doc_reference.rs` **`PROTOCOL_SSOT_VERSION`** → 同步 [fund-flow-ssot.v1](fund-flow-ssot.v1.md) / [state-machine.v1](state-machine.v1.md)（若涉及）→ 跑 **`bash scripts/gates/check-protocol-ssot-convergence.sh`** 与 **`bash scripts/check-governance-doc-linkage.sh`** → 按 [07 §二 2.4](../07-开发流程与顺序.md) 更新 84/83/08-4 附录 **镜像句**（**不**在 84 §四 另造数）。
6. **Vacancy Ledger 实现纪律（FROZEN · 2026-07-09）：** **经济规则已冻结** — **实现永远跟着 SSOT**，**禁止** 反过来。见 **§3c**。

---

## §1 代币总量与分配（TTG）

**Allocation SSOT：** [TTG-TOKENOMICS-GENESIS-V2.md](TTG-TOKENOMICS-GENESIS-V2.md)（四块创世分配 · **唯一业务真源**）。  
**机读镜像：** [protocol-ssot.v1.yaml](protocol-ssot.v1.yaml)#token_allocation_bps · [registry/ttg-vesting-registry.v1.yaml](../../../registry/ttg-vesting-registry.v1.yaml)。

```yaml
ttg:
  symbol: TTG
  name: TravelTrust Governance
  decimals: 18
  total_supply: 10000000          # 与 DeployGovernanceStack GOVERNANCE_VOTES_INITIAL_SUPPLY_WEI 默认一致
  total_supply_wei: "10000000000000000000000000"

# Genesis V2 four-block — sum MUST = 10000
token_allocation_bps:              # 占 total_supply 10000 = 100.00%
  team: 1500                       # 15% · 1.5M · Vesting（单受益钱包）
  community_incentive: 500         # 5% · 0.5M · Community Incentive Allocation（Program，非 vesting）
  treasury_dao: 3000               # 30% · 3M · DAO Treasury（托管位置 ≠ 投票权来源 · 禁 Mint 补仓）
  public_sale: 5000                # 50% · 5M · Public Sale（Registry 初值轮次 800k/1.2M/3M）
  # sum must equal 10000
# Removed in Genesis V2 (do not reintroduce without Genesis amendment):
# country_pool_shelf · advisors · ecosystem · public_global（V2 键为 public_sale）
```

**说明：** 改分配比例 **只改** [TTG-TOKENOMICS-GENESIS-V2](TTG-TOKENOMICS-GENESIS-V2.md) + 本节 YAML + 机读镜像同批；FeeRouter 45/55 等 **非** 供应表（见 §2）。

---

## §2 FeeRouter 第一层（可分配平台费用 · 非 TTG 供应）

**分母：** 可分配平台费用 = 10000 bps（定义 [84 §1.1.1](../84-第一阶段10国Country-Pool发行参数总表.md)）。

```yaml
fee_router_layer1_bps:
  country_bucket: 4500             # 45%
  global_pool: 5500                # 55%

global_pool_split_bps:             # 占 global_pool 10000
  ttg_staking_incentive: 6500      # 65% of Global — 非「全体持币分红」
  reserve: 2000                      # 20%
  operations: 1500                   # 15%
```

**机读镜像：** `governance_doc_reference::protocol_reference_json` · [08-4-附录](../08-4-附录-收益流闭环图-FeeRouter-Target.md) — **须与本节同批 bump**。

---

## §3 锁仓与周期层级（统一时钟 · 禁止混用）

```yaml
lock_tiers:
  # L0 — 防套利 / Snapshot 资格（RegionShare 叙事 · 83 附录 D）
  snapshot_min_lock_days: 7

  # L1 — Seat 收购 / 博弈冷却（83 §11～§12）
  seat_buyout_min_lock_days: 90
  buyout_cooldown_days: 180

  # L2 — 主理人 Seat 任期与 TTG 责任抵押（非本金退还）
  steward_seat_min_tenure_months: 24      # 主动辞任前最短任期
  steward_resign_notice_days: 180         # exit cooling / notice (EX-04)
  steward_exit_kpi_review_required: true  # Admin / Council before unlock (Phase ①)
  steward_stake_release_delay_days: 90    # after KPI pass · unlock batch starts
  steward_stake_release_vest_days: 365    # linear release after delay (optional impl)

  # L3 — 稳定币 Country Pool 认购（84 §六 中国块 · §七）
  country_pool_subscription_lock_months: 24

  # L4 — NAV 赎回窗口（fund-flow-ssot §4）
  redemption_window_days_per_quarter: 15
  redemption_max_nav_pct_bps: 1000        # 单窗口 ≤10% NAV
```

**层级关系：** L0 < L1 < L2 < L3；**不得** 用 7 天解释 2 年 Seat 任期，亦不得用 2 年替代 Snapshot 7 天锁。

---

## §3a TTG Tokenomics Freeze V1 · GOV-01～04（2026-06-16 · FROZEN）

**SSOT  prose：** [TTG-TOKENOMICS-FREEZE-V1.md](TTG-TOKENOMICS-FREEZE-V1.md) · **Audit：** [TTG-TOKENOMICS-FREEZE-V1-FINAL-AUDIT-REPORT.md](TTG-TOKENOMICS-FREEZE-V1-FINAL-AUDIT-REPORT.md)

```yaml
governance_freeze_v1:
  document_id: TTG-TOKENOMICS-FREEZE-V1
  frozen_at: "2026-06-16"
  GOV-01:
    treasury_p4_deploy_cap_bps: 3000          # P4 单周期 ≤ 30% TreasuryReserve
  GOV-02:
    governance_quorum_bps: 400                # 参与投票 ≥ 4% 总供应
    governance_approval_threshold_bps: 5000   # 赞成 ≥ 50% 已投
    governance_timelock_delay_hours: 48
  GOV-03:
    max_active_seats_per_controlling_entity: 1
    max_voting_power_cap_disabled: true
    max_voting_power_per_address_bps: 0          # V1.1 · disabled=true → unlimited, NOT no vote
    max_aggregate_seat_stake_per_entity_bps: 400
    gov_03_amendment: GOV-03-AMENDMENT-V1.1
  GOV-04:
    public_sale_per_wallet_cap_ttg: 25000       # 0.25% × 10M
    public_sale_min_purchase_usdc: 100
```

**修订：** bump 本节 **须** 同步 [TTG-TOKENOMICS-FREEZE-V1](TTG-TOKENOMICS-FREEZE-V1.md) · `protocol-ssot.v1.yaml` · `/governance/params` · 08-4 §9-c · Legal checklist。

---

## §3b Vacancy Ledger · Jurisdiction Reserve · Sweep（FROZEN · 2026-07-09）

**上位 prose：** [country-pool-net-profit-accounting-spec-v1.md §6.6](country-pool-net-profit-accounting-spec-v1.md) · **状态机：** [state-machine.v1.md §4b](state-machine.v1.md)

> **Jurisdiction Reserve** is a **restricted treasury** belonging to the **jurisdiction**, rather than to any individual steward.

**Governance Parameters（默认值 · 均经 Timelock 可改 · 合约不得写死 180）：**

```yaml
vacancy_ledger_v1:
  vacancy_grace_days_default: 180
  vacancy_sweep_interval: QUARTER          # 与 D-4555-B 结算 epoch 对齐
  vacancy_sweep_rate_bps: 2500             # 每季 principal 的 25%（固定线性）
  vacancy_sweep_cap_bps: 7500              # swept 累计上限 = principal 的 75%
  jurisdiction_reserve_bps: 2500           # reserve 地板 = principal 的 25%
  steward_activation_epoch_gate: true      # 新 Seat 不得领取激活前历史
  vacancy_sweep_auto_reenable: false       # sweepEnabled=false 后默认不自动恢复
```

**VacancyLedger（每 jurisdiction · 链上 SSOT）：**

```yaml
VacancyLedger:
  principal: uint256    # 空窗期 Unallocated 累计入账
  swept: uint256        # 已 sweep → Global Treasury（D-4555-B 55% 腿之外之 vacancy 路径）
  reserve: uint256        # Jurisdiction Reserve（Restricted Treasury）链上余额
  disbursed: uint256    # 经 DAO 从 reserve 批准支出（审计累计）
```

**Ledger Invariants（协议级 · 任何状态迁移不得破坏）：**

| ID | 不变量 |
|----|--------|
| **VL-01** | `principal == swept + reserve + disbursed` |
| **VL-02** | `reserve >= 0` · `swept >= 0` · `disbursed >= 0` |
| **VL-03** | `swept <= principal × vacancy_sweep_cap_bps / 10000` |
| **VL-04** | 当 `sweepEnabled == false` 时：`reserve >= principal × jurisdiction_reserve_bps / 10000` |
| **VL-05** | `disbursed` **仅** 经 `disburseJurisdictionReserve`（Governor → Timelock）增加；**禁止** EOA 直提 |

**Vacancy 状态（`vacancy_state` · 与余额正交）：**

```text
STEWARD_ACTIVE → VACANT → GRACE_PERIOD → SWEEP → STEWARD_ACTIVE
```

- **`sweepEnabled`**：`SWEEP` 态下为 bool；`ReserveReached` **仅为事件**，**非**独立终态。
- **`sweepEnabled = false` 后默认不自动恢复**；重新开启 **仅** 经治理：`setVacancySweepEnabled(jurisdiction, true)`（独立提案 · Timelock execute）。

**Sweep 触发（写死 · 禁止任意时刻调用）：**

```text
Quarter Settlement（epoch close）
  → splitNetProfit(epochId)
  → evaluateVacancySweep(epochId)    # 仅当 vacancy_state == SWEEP 且 sweepEnabled
```

**StewardActivationEpoch Gate（协议级反套利 · 须写合约）：**

- 写入 `stewardActivationEpochId`（或等价 `activationAt`）于 Seat 激活；
- `epochId <= activationEpochId` 之 Unallocated / Reserve **禁止** 自动 `releaseToStewardPath` 归新 Steward 个人路径；
- Jurisdiction Reserve 出库 **仅** `disburseJurisdictionReserve` 治理提案（推广 / 补贴 / Guide 激励 / 启动基金等）。

**修订：** bump §3b **须** 同步 accounting-spec §6.6 · state-machine §4b · `UnallocatedStewardPathVault` 实现 checklist · Forge invariant tests。

---

## §3c Vacancy Ledger · 实现纪律与 Sprint 顺序（FROZEN · 2026-07-09）

**原则：协议 SSOT 是唯一经济真源；合约/API/UI 是投影。**

### 实现纪律（硬闸）

| 允许（不改经济语义） | **禁止**（除非走 Governance Spec Change） |
|----------------------|-------------------------------------------|
| Gas 优化 | 修改 **180 天**宽限默认值之**链上硬编码**（须读 Governance Parameter） |
| Storage layout 优化 | 修改 **25% / 75% / 25%** sweep 与 reserve 比例之**默认经济语义** |
| Event / interface 优化 | 修改 **StewardActivationEpoch Gate** |
| 测试补充 · 审计脚本 | 修改 **VacancyLedger 恒等式 VL-01～VL-05** |
| Indexer / Dashboard 只读展示 | 在实现中「顺便」改 sweep 公式或状态机语义 |

**变更经济规则之唯一路径（写死）：**

```text
Governance Spec Change（治理规格变更提案）
  → SSOT 更新（protocol-ssot · accounting-spec · state-machine · yaml bump）
  → Review（产品 + 财务 + 法务 + 工程）
  → Implementation（合约 / API / UI 跟随 SSOT）
```

**禁止：** 先改合约常量或实现细节，再补文档。**实现永远跟着 SSOT，不要反过来。**

### 建议 Sprint 顺序（② 测试网前）

| Sprint | 范围 | 交付 |
|--------|------|------|
| **S1** | **VacancyLedger Core**（非 Ledger 接入） | struct · `depositToReserve` · `evaluateVacancySweep` · `disburseJurisdictionReserve` · 六事件 · 治理参数 · NatSpec |
| **S2** | **Forge Invariant / Fuzz** | VL-01～VL-05 连续成立 · **证明协议** |
| **S3** | `CountryPoolNetProfitLedger` 分步接入 | S3a split→sweep · S3b Epoch Gate · S3c 闭环 |
| **S4** | 展示层（最后） | Indexer · Dashboard · Admin · API Read Only |

**S1 明确不做：** Ledger · Settlement · API · Dashboard · Indexer。  
**S1 Exit Criteria：** PCM §3 · `invariant_VL01_ledgerIdentity` 通过 · 零外部编译依赖 · NatSpec 100%。

**S4 之前禁止** 以展示需求反向修改协议经济规则。

**详设：** [country-pool-net-profit-accounting-spec-v1.md §6.7](country-pool-net-profit-accounting-spec-v1.md)

**Conformance Matrix（Sprint 1 前必 READ · PCM v1.2）：** [protocol-conformance-matrix-vacancy-ledger-v1.md](protocol-conformance-matrix-vacancy-ledger-v1.md) — Exit Criteria §3 · PR 纪律 §5.1

---

## §4 辖区参数（Phase 1 · 十国）

**键：** ISO 3166-1 alpha-2 · `fee_route_bps` / `steward_stake_bps` 单位为 **占各自分母的一万分之一**（400 = 4.00%）。

| jurisdiction | tier | fee_route_bps | phase1_open_bps | steward_stake_bps | min_hold_bps | seat_cap | subscription_lock_months |
|--------------|------|---------------|-----------------|-------------------|--------------|----------|--------------------------|
| CN | S | 400 | 300 | 400 | 300 | 1 | 24 |
| US | S | 400 | 300 | 400 | 300 | 1 | 24 |
| FR | S | 450 | 350 | 450 | 350 | 1 | 24 |
| ES | S | 450 | 350 | 450 | 350 | 1 | 24 |
| JP | A | 250 | 200 | 250 | 200 | 1 | 24 |
| TH | A | 250 | 200 | 250 | 200 | 1 | 24 |
| SG | A | 200 | 150 | 200 | 200 | 1 | 24 |
| KR | A | 200 | 150 | 200 | 200 | 1 | 24 |
| AU | B | 150 | 100 | 150 | 100 | 1 | 24 |
| AE | B | 150 | 100 | 150 | 100 | 1 | 24 |

**字段语义（写死）：**

| 字段 | 分母 | 用途 |
|------|------|------|
| `fee_route_bps` | 可分配平台费用 10000 | FeeRouter / 84 叙事 · **非** TTG 质押 |
| `phase1_open_bps` | 同上 | Phase 1 费用展示强度；十国合计 2200 bps |
| `steward_stake_bps` | **TTG total_supply 10000** | 单国 **1 Seat** 须 **锁定** 之 TTG 比例；多国 **累加** |
| `min_hold_bps` | TTG total_supply 10000 | RegionShare **收益资格** 门槛（83 §5）；持席者 **应 ≥** 本国 `steward_stake_bps` |
| `seat_cap` | 每 jurisdiction 活跃 Seat | 先到先得 |
| `subscription_lock_months` | — | 稳定币认购 **封闭期**（与 TTG 质押无关） |

**多国质押累加示例：** CN(400) + FR(450) = **850 bps** → **85,000 TTG**（supply=10,000,000）。

**募资法币列：** 见 [country-pool-fundraise-governance-v1.md](country-pool-fundraise-governance-v1.md)（治理委员会独立参数 · **与** `steward_stake_bps` **无自动换算**）；[84 §四](../84-第一阶段10国Country-Pool发行参数总表.md) 为对外表镜像。

---

## §5 角色与资金边界（概念 · 非数值）

| 概念 | 绑定资金轨 | SSOT |
|------|------------|------|
| **Region Steward（Seat）** | TTG **`StewardStakePool`** 锁定 + 可选 USDC **`OnboardingFeeReceiver`** | [fund-flow-ssot.v1 §3](fund-flow-ssot.v1.md) |
| **Country Pool 认购人** | USDC **`CountryPool` → 子 Vault** | [fund-flow-ssot.v1 §2](fund-flow-ssot.v1.md) |
| **RegionShare 收益资格** | 持份额 + `min_hold_bps` + Snapshot | 83 §5～§6 |
| **Governor 投票权** | TTG **`getPastVotes`**（与 Seat 身份 **正交**） | 14 §1.1.0 · 89 §5.2 |

**禁止：** Seat 身份 **自动** 等于 Country Pool 本金可退；**禁止** TTG 质押按稳定币 1:1 退还叙事。

---

## §6 实现引用清单（P2 前须对齐）

| 消费方 | 引用方式 |
|--------|----------|
| **84** | §四 表 **fee_route_bps / phase1_open** 镜像 §4；**禁止** 写 steward_stake |
| **89 §5.0** | TTG 门槛 = `steward_stake_bps` + [fund-flow-ssot](fund-flow-ssot.v1.md) |
| **96-18 / fee_schedule_v1** | B 轨：**[onboarding-fee-schedule.v1](../artifacts/onboarding-fee-schedule.v1.md)**；**禁止** 在本文件写准入费法币 / 退款 / 续费 |
| **合约** | `RegionStewardStakePool` · `CountryPoolSubVaultsV0` · `CountryPoolRedemptionEpochV0`（**① forge test**） |
| **API** | `GET …/governance/protocol-reference` **`protocol_ssot`** · `GET …/governance/state-machines` · `/steward/*` · `/redemption/quote` |
| **前端** | `lib/governance/protocolSsot.v1.ts` · `/steward/register` |

---

## §8 P1 收敛决议（2026-05-27 · 工程 LOCKED）

详表见 **[protocol-convergence-P1-memo.md](protocol-convergence-P1-memo.md)**。摘要：

1. **Phase 1 映射：** `steward_stake_bps` **=** `fee_route_bps`（**数值**）；**语义**仍分轨（§0 规则 3）。  
2. **Seat 任期：** 主动辞任前 **24 个月** + **180 天** 预告；TTG **非本金退**。  
3. **稳定币认购：** **24 个月** 封闭；赎回走 **NAV 比例**（fund-flow-ssot §4），**禁止** 1:1 本金承诺。  
4. **赎回闸：** 每季 **15 天** 窗口；单窗 **≤10% NAV**；超额 **队列 pro-rata**。  
5. **运营费：** 仅 **OperationsVault** 预算帽内；**已花费不计入** 退出者可退 NAV。  
6. **法务：** R3～R5 对外印刷前须 **08-4 + LEGAL-SIGNOFF**（`legal_signoff_pending`）。

---

## §9 变更记录

| Version | Date | Note |
|---------|------|------|
| 1.0.3 | 2026-07-09 | **Vacancy Ledger V1 FROZEN**：§3b · §3c 实现纪律与 Sprint · VacancyLedger · VL-01～VL-05 · Quarter-only sweep · StewardActivationEpoch Gate |
| 1.0.2 | 2026-06-16 | TTG Tokenomics Freeze V1 · GOV-01～04 |
| 1.0.1 | 2026-05-27 | P1：收敛纪要 §8；yaml 镜像；API `protocol_ssot` 块（Rust 镜像） |
| 1.0.0 | 2026-05-27 | Protocol Convergence P0：初版；分离 fee_route vs steward_stake；锁仓层级；十国表 |
