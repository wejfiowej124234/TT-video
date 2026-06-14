# Governance Proposals L5 · ① 本地全路由冻结（2026-06-13）

**阶段：① 本地** — `/governance/proposals` · `/new` · `/[id]` 治理议题列表/创建/详情 + 主理人发议题走廊；**不**表示 ② Sepolia / ③ 生产 GO。

**代码真源：** `frontend/components/governance/GovernanceProposalsL5Shell.tsx` · `frontend/lib/governance/governanceProposalsL5ClosureSprintModel.ts`

**审计对读：** [GOVERNANCE-PROPOSALS-L5-ENTERPRISE-AUDIT.md](./GOVERNANCE-PROPOSALS-L5-ENTERPRISE-AUDIT.md) · [GOVERNANCE-PROPOSALS-L5-CLOSURE.md](./GOVERNANCE-PROPOSALS-L5-CLOSURE.md)

---

## 冻结结论（ACTIVE）

| 项 | 状态 |
|----|------|
| **全路由 UI** | `data-tt-governance-proposals-page="1"` · `data-tt-ui-frozen=governance-proposals-l5-20260613` |
| **创建 IA** | 5 步向导（模板 → 摘要 → 链上动作 → 风险 → 提交）+ 页内 Connect |
| **详情 IA** | 链上 vote · Timelock queue/execute · 提案人 cancel · operationId |
| **主理人走廊** | 工作台 CTA → `?from=steward_workbench` 回程（list/create/detail） |
| **钱包 L5** | chainId 硬闸 · getPastVotes · simulate 降级 · switchChain · explorer 链接 |
| **联调种子** | `multi-demo@test.com` / `Test123!` |
| **冻结日** | **2026-06-13** |

**维护期纪律：** 仅允许 bugfix · 数据链/i18n/a11y · 门闸；**禁止**页面结构 / layout token 回流（对齐 Provider / Steward / Params L5 纪律）。

**诚实边界：** ② Sepolia propose→vote→queue→execute 全链 · ③ 生产法务 **未**纳入本冻结。

---

## 机读验收

```bash
bash scripts/dev/smoke-governance-proposals-l5-local.sh
```

末行：`TT_GOVERNANCE_PROPOSALS_L5_SMOKE: OK`

**可选 Playwright 全走廊：**

```bash
SKIP_PLAYWRIGHT=0 bash scripts/dev/smoke-governance-proposals-l5-local.sh
```

---

## 互指

| 读者 | 文档 |
|------|------|
| 主理人工作台 | [STEWARD-WORKBENCH-L5-FREEZE.md](../GO_local_steward_workbench_l5/STEWARD-WORKBENCH-L5-FREEZE.md) |
| 协议参数 | [GOVERNANCE-PARAMS-L5-FREEZE.md](../GO_local_governance_params_l5/GOVERNANCE-PARAMS-L5-FREEZE.md) |
| Agent | `AGENTS.md` |
