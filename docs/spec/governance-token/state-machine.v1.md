# State Machine SSOT v1 — 治理域状态枚举唯一真源

**Version:** 1.0.0  
**Status:** **LOCKED（Protocol Convergence · P0）**  
**Companion:** [protocol-ssot.v1.md](protocol-ssot.v1.md) · [fund-flow-ssot.v1.md](fund-flow-ssot.v1.md) · [ttg-allocation-permissions-flows-ssot-v1.md](ttg-allocation-permissions-flows-ssot-v1.md)

**命名规则（写死）：** 全部 **`snake_case`**。前端、后端、合约、DB **禁止** 另造同义枚举（如 `activeSeat` / `SeatLive` / `seat_active`）。

**与 350 订单/Escrow 状态机关系：** 本文 **仅** 治理域（Steward / Country / Redemption / Seat KPI）。订单域见 [350](../350-阶段状态机可视化与状态校验系统.md) · **分域**。

---

## §0 注册表（machine_code）

| machine_code | domain | entity_type | SSOT 章节 |
|--------------|--------|-------------|-----------|
| `steward_application` | governance | steward_application | §1 |
| `steward_seat` | governance | region_seat | §2 |
| `country_jurisdiction` | governance | jurisdiction | §3 |
| `country_pool_redemption` | governance | pool_redemption_request | §4 |
| `country_pool_net_profit_settlement` | governance | net_profit_epoch | **§4a** |
| `region_share_eligibility` | governance | region_share_position | §5 |

---

## §1 Steward 申请生命周期（`steward_application`）

**资金：** TTG **StewardStakePool**（非 USDC 退还轨）。

```text
draft
  → stake_pending          # 用户已提交资料，待链上 stake 确认
  → under_review           # stake 已确认 + Admin/运营审核
  → approved               # 可 role_confirm → users.role=region_steward
  → rejected               # 可进入 stake_release_pending
  → withdrawn              # 用户取消（仅 draft/stake_pending）

stake_release_pending      # 驳回或取消后等待解锁
  → released               # TTG 已退回钱包（延迟见 protocol-ssot lock_tiers）
```

| 状态 | 允许迁移至 |
|------|------------|
| `draft` | `stake_pending`, `withdrawn` |
| `stake_pending` | `under_review`, `rejected`, `withdrawn` |
| `under_review` | `approved`, `rejected` |
| `approved` | （终态）触发 `steward_seat` → `active` |
| `rejected` | `stake_release_pending` |
| `stake_release_pending` | `released` |
| `withdrawn` | （终态） |
| `released` | （终态） |

---

## §2 Steward Seat 生命周期（`steward_seat` · 与身份解耦）

**说明：** `users.role=region_steward` **映射** Seat，但 Seat KPI 状态 **独立** 于账号存在。

```text
pending                  # approved 后、KPI 未激活
  → active
  → watch                  # KPI 未达标 1 次（83 附录 A）
  → probation              # 连续未达标 2 次
  → inactive               # 连续未达标 3 次或辞任完成
  → replaceable            # 可被 Buyout（83 §11）
  → released               # 辞任/收购完成；TTG 进入 stake_release_pending
```

| 状态 | SeatBonus 系数（83 A.3 镜像） |
|------|-------------------------------|
| `active` | 100% |
| `watch` | 70% |
| `probation` | 0% |
| `inactive` | 0% |
| `replaceable` | 0% |

**Buyout 子流程（`buyout_proposal` · 可选独立 machine）：**  
`submitted` → `locked` → `notified` → `accepted` | `dao_vote` → `executed` | `expired`

### §2.1 Seat 主动退出（`steward_exit` · 不退 USDC）

**SSOT：** [ttg-primary-market-and-exit-policy-v1 §2](ttg-primary-market-and-exit-policy-v1-draft.md) · [protocol-ssot §3](protocol-ssot.v1.md) lock tiers

```text
exit_requested           # steward 提交辞任 · 180 天 notice 起算
  → exit_cooling         # steward_resign_notice_days (=180)
  → exit_kpi_review      # Admin / Council · KPI 审查
  → stake_release_pending
  → released             # TTG 回申请人钱包 · 非 USDC 兑付
```

| 规则 | 内容 |
|------|------|
| **资金** | **仅 R1 TTG** · **禁止** R2 USDC 原价退出 |
| **时钟** | `exit_cooling` = **180d** → `exit_kpi_review` → `stake_release_delay_days` **90d** → `stake_release_vest_days` **365d** 线性释（② 可简化为一次 unlock） |

---

## §3 Country / Jurisdiction 生命周期（`country_jurisdiction`）

**资金：** R2 Country Pool **聚合态**（非单人）。

```text
planned                  # 路线图/未开放认购
  → active                 # 开放认购 + Seat 竞逐
  → watch                  # KPI/合规预警
  → wind_down              # 停止新认购；处理赎回队列
  → dissolved              # 辖区归档（DAO 决议）
```

---

## §4 Redemption 生命周期（`country_pool_redemption`）

**资金：** R2 **NAV 赎回**（[fund-flow-ssot §4](fund-flow-ssot.v1.md)）。

```text
request                  # 用户提交赎回请求（封闭期后）
  → queued                 # 进入窗口队列
  → epoch_open             # 当前赎回窗口开放
  → pro_rata_settled       # 按比例结算（可能部分满足）
  → claimable              # USDC 可领取
  → claimed                # 终态
  → cancelled              # 用户取消（仅 request/queued）
  → rejected               # 制裁/KYC/池暂停
```

---

## §4a Net Profit Settlement 生命周期（`country_pool_net_profit_settlement` · D-4555-B）

**资金：** R2 **Country Pool 净利润 split**（[fund-flow-ssot §2](fund-flow-ssot.v1.md) · [accounting-spec §4～§6](country-pool-net-profit-accounting-spec-v1.md)）。

**与 `country_pool_redemption` 正交：** 赎回窗 **`EpochOpened/Settled`** **≠** 本机 **`EpochClosed` / `NetProfitSplit`**（不同合约 · 不同投影表）。

```text
open                       # openEpoch · 周期 accrual 窗口
  → open                   # recordAccrual（NetProfitAccrued）· 仍属 open
  → closed                 # closeEpoch · EpochClosed
  → no_split               # netProfit' <= 0 · 终态
  → split_pending          # netProfit' > 0 · 待 splitNetProfit
  → split_completed        # NetProfitSplit · 终态
```

---

## §4b Vacancy Ledger 生命周期（`vacancy_ledger` · D-4555-B · FROZEN 2026-07-09）

**SSOT：** [protocol-ssot.v1 §3b](protocol-ssot.v1.md) · [accounting-spec §6.6](country-pool-net-profit-accounting-spec-v1.md)

```text
STEWARD_ACTIVE
  → vacant                 # VacancyEntered · VacancyLedger reset/open
  → grace_period           # GraceStarted · deposit only
  → sweep                  # sweepEnabled may be true/false · ReserveReached = event only
  → steward_active         # StewardActivated · stewardActivationEpochId
```

**Ledger（正交于 enum · 链上四维）：** `principal` · `swept` · `reserve` · `disbursed` — **VL-01：** `principal == swept + reserve + disbursed`

**Sweep 触发：** **仅** `splitNetProfit(epochId)` → `evaluateVacancySweep(epochId)`（Quarter Settlement · **禁止** 任意时刻单独 sweep）

**Steward 历史释放（legacy · 仍有效于 eligible 路径）：**

```text
holding                    # UnallocatedStewardDeposit → VacancyLedger deposit
  → released               # releaseToStewardPath · 治理提案 · epoch > activationEpochId
```

**详设：** [country-pool-settlement-architecture-package-v1.md](country-pool-settlement-architecture-package-v1.md) **§2** · **accounting-spec §6.6**

---

## §5 RegionShare 资格（`region_share_eligibility`）

**与 Seat 正交：** 认购人 **不要** 求 `region_steward` role。

```text
ineligible
  → eligible               # Balance ≥ min_hold_bps + lock ≥ snapshot_min_lock_days
  → grace                    # 低于 min_hold
  → inactive                 # grace 30d 未恢复（83 §6）
```

---

## §6 API / DB / 合约 映射约定（P2）

| 层 | 要求 |
|----|------|
| **PostgreSQL** | `lifecycle_state_machines.current_state` **必须** 用本节枚举 |
| **Rust API** | `serde` 枚举与 §0 `machine_code` 一致 |
| **Solidity** | `enum` 名可不同，**事件 indexed 字段** 存 `snake_case` 字符串或同序 uint8 **须文档化** |
| **Frontend** | i18n 键 `governance_state_{machine_code}_{state}` |

---

## §7 变更记录

| Version | Date | Note |
|---------|------|------|
| 1.0.1 | 2026-06-15 | **§4a** `country_pool_net_profit_settlement` · Gate-2.1 架构包对齐 |
| 1.0.0 | 2026-05-27 | P0 初版：五机；统一 snake_case |
