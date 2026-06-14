# Governance Params L5 · ① 本地全页冻结（2026-06-12）

**阶段：① 本地** — `/governance/params` 协议参数公示（84 文档镜像只读 · 现行 vs 待生效对拍 · 费用拆分 · Phase-1 十国表）；**不**表示 ② 测试网 / ③ 生产 GO。

**代码真源：** `frontend/app/governance/params/GovernanceParamsPageMain.tsx` · `frontend/components/governance/GovernanceParamsL5Shell.tsx` · `frontend/lib/governance/governanceParamsPageL5ClosureSprintModel.ts`

---

## 冻结结论（ACTIVE）

| 项 | 状态 |
|----|------|
| **全页 UI** | `data-tt-governance-params-page="1"` · `data-tt-ui-frozen=governance-params-l5-20260612` |
| **视觉壳** | 暖色 cinematic（同源 `/` · `/orders` · `/governance/proposals`） |
| **客态文案** | 中/英润色 · params 专用 notice · 技术/API note 折叠 · 主文案无开发者词 |
| **参与引导** | 治理三卡入口（提案/委托/Hub）· 主理人 deep link 隐藏 · 无全站 funnel rail |
| **校验和** | 十国表下客态一句 + `<details>` 折叠明细 |
| **数据链** | `GET /api/v1/governance/protocol-reference` + `pending`（公开读 · doc mirror） |
| **对拍区** | 五项费用拆分 · 一致/不一致客态 · 不一致 gate→`/governance/proposals` |
| **费用拆分** | 百分条可视化 · 国家桶 / 全球池 / 质押·储备·运营 |
| **十国表** | EN 国别/备注本地化 · 表 caption + th scope |
| **回程** | `?from=steward_workbench` → 主理人工作台回程链 |
| **分区导航** | sticky 锚点 pill（参数核对 / 费用拆分 / 十国表） |
| **a11y** | 费用百分条 `role=meter` · 表 caption · focus ring |
| **冻结日** | **2026-06-12** |

**维护期纪律：** 仅允许 bugfix · 数据链/i18n/a11y · 门闸；**禁止**页面结构 / layout token 回流。

**诚实边界：** ② 待生效包链上/治理流程真值 · ③ 生产 SSOT / 法务签字 **未**纳入本冻结。

---

## 机读验收

```bash
bash scripts/dev/record-governance-params-l5-evidence.sh
```

末行：`TT_GOVERNANCE_PARAMS_L5_EVIDENCE: OK`

**快速烟测：**

```bash
bash scripts/dev/smoke-governance-params-l5-local.sh
```

末行：`TT_GOVERNANCE_PARAMS_L5_SMOKE: OK`

---

## 互指

| 读者 | 文档 |
|------|------|
| 路由 README | `frontend/app/governance/params/README.md` |
| 企业审计 | [GOVERNANCE-PARAMS-L5-ENTERPRISE-AUDIT.md](./GOVERNANCE-PARAMS-L5-ENTERPRISE-AUDIT.md) |
| 主理人工作台 | [STEWARD-WORKBENCH-L5-FREEZE.md](../GO_local_steward_workbench_l5/STEWARD-WORKBENCH-L5-FREEZE.md) |
| 84 只读 lib | `frontend/lib/governanceParams84Readonly.ts` |
| C-GOV-011 矩阵 | `frontend/evidence/GO_local_marketing_front_closure/governance-matrix-local-gate.v1.json` |
| Agent | `AGENTS.md` |
