# 主理人工作台 L5 审计 · v3（① 本地 · ACTIVE）

**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产  
**路由：** `/governance?view=region` · 质押锚点 `#steward-ttg-stake`  
**SSOT 对读：** [WORKSPACE-DEFINITION-SSOT.v1.md](./WORKSPACE-DEFINITION-SSOT.v1.md) §2.4 · [protocol-ssot.v1.md](../../../docs/spec/governance-token/protocol-ssot.v1.md) · [fund-flow-ssot.v1.md](../../../docs/spec/governance-token/fund-flow-ssot.v1.md) · [state-machine.v1.md](../../../docs/spec/governance-token/state-machine.v1.md)

---

## 总表

| 项 | 结论 |
|----|------|
| **有没有收口** | **是（①）** — 工作台 UX + 质押 SSOT + 机读绿集 + 专用烟测 |
| **有没有 UI 冻结** | **是（① · 2026-06-12）** — [STEWARD-WORKBENCH-L5-FREEZE.md](../GO_local_steward_workbench_l5/STEWARD-WORKBENCH-L5-FREEZE.md) · `data-tt-ui-frozen=steward-workbench-l5-20260612` |

**诚实边界：** ① 本地收口 ≠ ② Sepolia GO ≠ ③ Production GO

---

## 1. 治理币 / TTG 逻辑（产品真源摘要）

| 轨 | 资金 | 用户动作 | 能否「随时兑换稳定币」 |
|----|------|----------|------------------------|
| **R1 · TTG Seat 质押** | `RegionStewardStakePool` | 申请主理人 → approve TTG → `stake(jurisdiction)` | **否** — 任内锁定；辞任/驳回后 **90 天延迟 + 365 天线性释放** |
| **L2 任期** | 同上 | 主动辞任 | **最短 24 个月** + 180 天通知（protocol-ssot `steward_seat_min_tenure_months`） |
| **R2 · 区域治理池** | FeeRouter / RegionVault 聚合 | 工作台 **只读** `GET /governance/pool` | **否** — 平台池观测，非个人余额 |
| **R2 · Country Pool USDC 赎回** | NAV 赎回轨 | 认购人 · 季度窗口 · 24 月封闭 | **与主理人 Seat 质押无关**（fund-flow-ssot §4） |
| **激励 / Claim** | ClaimVault / distribution | `/governance/distribution-claim` | 按 Snapshot 规则；**非** 质押本金退还 |

---

## 2. L5 信息架构（v3 · 对齐商家/向导工作台）

**纵向顺序（`StewardRegionWorkbenchMain`）：**

```
顶部门闸（need_onboarding / need_stake）或质押满足细条
  → 治理待办三卡
  → TTG 质押操作区（#steward-ttg-stake）
  → 区域治理观测（仅 gate satisfied）
  → 底栏交叉链（StewardWorkbenchL5CrossNav）
```

| 模块 | 文件 | 说明 |
|------|------|------|
| Gate 模式 | `stewardWorkbenchWorkspaceL5.ts` | `resolveStewardWorkbenchGateMode` · `shouldShowStewardGovernanceObservation` |
| 顶部门闸 | `StewardWorkbenchStakingGateCard` | 未质押时隐藏治理观测；占位文案在门闸内 |
| 满足细条 | `StewardWorkbenchStakingSatisfiedStrip` | 链下 Seat + 链上摘要 |
| 底栏 | `StewardWorkbenchL5CrossNav` | 首页 · 治理 Hub · 费率路由 · 设置 · 身份 Hub · 帮助 |
| 去重 | `hideGateCtas` on stake panel | 顶部门闸显示时不重复入驻 CTA |

**已移除：** 页中 `StewardWorkbenchFooter` 按钮行；治理区内联 Hub 链接（迁至底栏）。

---

## 3. ① 本地清单（v3 · 2026-06-12）

| # | 清单项 | 状态 | 未完成应在哪阶 |
|---|--------|------|----------------|
| 1 | 治理待办三卡（提案/委托/Claim） | ✅ 完成 | — |
| 2 | 待办 badge 占位（`—`）+ ② 说明 | ✅ 完成 | ② 接真计数 |
| 3 | 池/奖励 **L5 扁平观测**（统计 + 分轨摘要 + Hub 入口） | ✅ 完成 | — |
| 4 | TTG 质押 **工作台 SSOT**（`#steward-ttg-stake`） | ✅ 完成 | — |
| 5 | 链下 Seat vs 链上质押 **双轨摘要** | ✅ 完成 | — |
| 6 | 生命周期标题（申请 / 任内 / 释放） | ✅ 完成 | — |
| 7 | `approved` 时隐藏「继续质押/准入」CTA | ✅ 完成 | — |
| 8 | 最低质押 **人类可读**（CN **400,000 TTG** · 400 bps · 非 wei） | ✅ 完成 · 已冻结 | — |
| 9 | 钱包不匹配展示期望地址 | ✅ 完成 | — |
| 10 | `CN-ZJ` → `CN` 辖区归一 | ✅ 完成 | — |
| 11 | `GET /me/steward-seat` + resign API | ✅ 完成 | — |
| 12 | 503 链读静默（Anvil 未起） | ✅ 完成 | — |
| 13 | 设置页仅「主理人工作台」入口（无重复质押页） | ✅ 完成 | — |
| 14 | legacy `/me/identities/region-steward/stake` → redirect | ✅ 完成 | — |
| 15 | L5 深色 Pool/Rewards variant | ✅ 完成 | — |
| 16 | 槽位 RBAC 门闸 + locked 继续申请 | ✅ 完成 | — |
| 17 | 分轨文案（质押 vs 治理池 vs USDC 赎回） | ✅ 完成 | — |
| 18 | 顶部门闸 + 质押满足细条（对齐 PWB/GWB） | ✅ 完成 | — |
| 19 | 治理观测门闸（未质押不展示池/奖励） | ✅ 完成 | — |
| 20 | 底栏交叉链 `StewardWorkbenchL5CrossNav` | ✅ 完成 | — |
| 21 | `stewardWorkbenchWorkspaceL5` 机读 + contract | ✅ 完成 | — |
| 22 | UI 冻结 + `data-tt-ui-frozen` | ✅ 完成 · 已冻结 | — |
| 23 | `smoke-steward-workbench-l5-local.sh` | ✅ 完成 | — |
| 24 | 工作台 **直达发起治理提案** CTA（→ `/proposals/new?from=steward_workbench`） | ✅ 完成 | — |
| 25 | 提案 create/detail **`from=steward_workbench` 回程链** | ✅ 完成 | — |

---

## 4. ② / ③ 留到对应阶段

| # | 清单项 | 状态 | 未完成应在哪阶 |
|---|--------|------|----------------|
| 1 | 链上 stake-status / wagmi 读链 **Sepolia 真值** | ❌ 未完成 | **②** |
| 2 | 治理待办 **真计数**（开放提案 / 待委托 / 可 Claim） | ❌ 未完成 | **②** |
| 3 | Governor **投票闭环**（Sepolia broadcast） | ❌ 未完成 | **②** |
| 4 | Claim **链上真值** vs DB 占位 | ❌ 未完成 | **②** |
| 5 | **Sepolia propose / vote** 全链验收（发议题走廊） | ❌ 未完成 | **②** |
| 6 | **Timelock queue / execute** 钱包写操作 UI | ❌ 未完成 | **②** |
| 7 | **多 action propose** UI | ❌ 未完成 | **②** |
| 8 | Seat KPI / watch / probation 仪表盘 | ❌ 未完成 | **② / ③** |
| 9 | 区域池 **chain_read SSOT** 生产对拍 | ❌ 未完成 | **③** |
| 10 | Country Pool USDC 赎回 UI（认购人轨） | ❌ 未完成 | **③** |
| 11 | LEGAL / 84 法务签字（R4/R5 经济宣称） | ❌ 未完成 | **③** |
| 12 | **Production Governor** 运维 + 法务签字（发议题） | ❌ 未完成 | **③** |

**Phase ② 任务登记：** [PHASE2-START-CHECKLIST.md §3.4](../../../docs/runbook/PHASE2-START-CHECKLIST.md#34-主理人工作台-ui--治理闭环-②-only)

---

## 5. 入口架构（① 定版）

| 入口 | 路径 | 用途 |
|------|------|------|
| 设置 | `/me/settings` → 主理人工作台 | 跳转 |
| 工作台 | `/governance?view=region#steward-ttg-stake` | **唯一** 完整质押/辞任/释放 UI |
| Legacy | `/me/identities/region-steward/stake` | `next.config` redirect |

---

## 6. 机读验收（①）

```bash
bash scripts/dev/smoke-steward-workbench-l5-local.sh
```

末行：`TT_STEWARD_WORKBENCH_L5_SMOKE: OK`

**证据归档：**

```bash
bash scripts/dev/record-steward-workbench-l5-evidence.sh
```

**Vitest 子集（烟测内嵌）：**

```bash
cd frontend && npx vitest run \
  lib/governance/stewardWorkbench.contract.test.ts \
  lib/governance/stewardWorkbenchWorkspaceL5.test.ts \
  lib/governance/stewardWorkbenchL5FullClosure.contract.test.ts \
  lib/governance/stewardTtgStakeManage.contract.test.ts \
  lib/governance/stewardWorkbenchGovernanceModel.test.ts \
  lib/steward/stewardStakeUiModel.test.ts
```

---

**Version:** steward-workbench-l5-v5 · 2026-06-13  
**一句话结论：** ① 主理人工作台 **IA 已与商家/向导 L5 对齐且 UI 已冻结**（门闸 → 待办 → 质押 → 观测 → 底栏）；**直达发议题 + 提案子页回程链** 已闭；**链上治理闭环与待办真计数 / Sepolia propose** 留 **②**，**生产 SSOT / 法务** 留 **③**。
