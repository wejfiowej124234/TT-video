# Steward Workbench L5 · ① 本地全页冻结（2026-06-12）

**阶段：① 本地** — `/governance?view=region` 区域主理人工作台全页（治理待办 · TTG Seat 质押 · 区域池/奖励观测；**资料编辑** 在 `/me/identities/region-steward/settings`）+ `#steward-ttg-stake` 质押 SSOT；**不**表示 ② 测试网 / ③ 生产 GO。

**代码真源：** `frontend/app/governance/StewardRegionWorkbenchMain.tsx` · `frontend/components/governance/StewardWorkbench*.tsx` · `frontend/lib/governance/stewardWorkbenchL5ClosureSprintModel.ts`

**审计对读：** [STEWARD-WORKBENCH-L5-AUDIT.md](../GO_local_identity_workspace/STEWARD-WORKBENCH-L5-AUDIT.md)

---

## 冻结结论（ACTIVE）

| 项 | 状态 |
|----|------|
| **全页 UI** | `data-tt-steward-workspace-page="1"` · `data-tt-ui-frozen=steward-workbench-l5-20260612` |
| **纵向 IA** | 顶部门闸 / 质押满足细条 → 治理待办三卡 → `#steward-ttg-stake` → 区域治理观测（门闸满足时）→ `StewardWorkbenchL5CrossNav` |
| **门闸** | `resolveStewardWorkbenchGateMode` · need_stake 仅「前往质押操作区」· 未质押隐藏池/奖励观测 |
| **待办** | 提案 / 委托 / Claim 深链 · **① API 诚实计数**（active 提案 / 委托态 / rewards 条数） |
| **质押 SSOT** | 工作台唯一完整 UI · settings 仅回链 · legacy `/me/identities/region-steward/stake` redirect |
| **最低质押展示** | 链读 `formatTtgAmount` + protocol-ssot 回退 · CN = **400,000 TTG**（400 bps · 非 wei） |
| **联调种子** | `multi-demo@test.com` / `Test123!`（steward-seat + steward-application API 烟测） |
| **冻结日** | **2026-06-12** |

**维护期纪律：** 仅允许 bugfix · 数据链/i18n/a11y · 门闸；**禁止**页面结构 / layout token 回流（对齐 Provider / Guide Workbench L5 纪律）。

**诚实边界：** ② Governor 投票/Claim 链真值 · 待办真计数 · ③ 生产 SSOT **未**纳入本冻结。

---

## 机读验收

```bash
bash scripts/dev/record-steward-workbench-l5-evidence.sh
```

末行：`TT_STEWARD_WORKBENCH_L5_EVIDENCE: OK`

**快速烟测：**

```bash
bash scripts/dev/smoke-steward-workbench-l5-local.sh
```

末行：`TT_STEWARD_WORKBENCH_L5_SMOKE: OK`

---

## 互指

| 读者 | 文档 |
|------|------|
| 主理人入驻 UI | [STEWARD-REGISTER-UI-FREEZE.md](../GO_local_steward_register_closure/STEWARD-REGISTER-UI-FREEZE.md) · `/steward/register` |
| 主理人 settings | `frontend/app/me/identities/region-steward/settings/` |
| Provider 对标 | [PROVIDER-WORKBENCH-L5-FREEZE.md](../GO_local_provider_workbench_l5/PROVIDER-WORKBENCH-L5-FREEZE.md) |
| Guide 对标 | [GUIDE-WORKBENCH-L5-FREEZE.md](../GO_local_guide_workbench_l5/GUIDE-WORKBENCH-L5-FREEZE.md) |
| protocol-ssot | `docs/spec/governance-token/protocol-ssot.v1.md` |
| Agent | `AGENTS.md` |
