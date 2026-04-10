# GO · Epic A 治理执行态只读 UX 收口（A-01～A-10）

**标识**：文档收口 **`TT-DOC-EPIC-A-GOVERNANCE-EXEC-UX-CLOSE-001`**（与代码 Gate 分离；**不**替代 CI）。  
**Runbook 主入口**：[docs/runbook/Epic-A-governance-execution-ux-ladder.md](../docs/runbook/Epic-A-governance-execution-ux-ladder.md)。

## 完成项汇总（前端）

- 列表：`proposal-status` 批量、`GovernanceProposalExecStatusBadge`、来源 SSOT/投影、`GovExecReadOnlyI18n`、Queued 短提示、列表→详情桥接与链上 `Link` 语义。
- 详情：`GovernancePreExecutionHint`、执行条件面板、投票区脚注、Timelock 骨架钮、限制/风险文案、承接段与共享叙事键。
- 库：`governanceExecutionReadiness.ts`、`governanceExecReadOnlyNarrative.ts`、`getGovernanceProposalStatus`。

## 边界与排除项

| 范围 | 说明 |
|------|------|
| **B-115** | **不**改 Snapshot/Claim/分配对账封口路径与语义。 |
| **B-116** | **不**改 FeeRouter/RegionVault/经济投影 MVP 封口实现。 |
| **P5** | **不**改 P5-1～P5-5 程序族已封口专项（含逐国账本、Vault 导出、RegionShare、投资者分配 UI、84 镜像等）相关约定代码。 |
| **后端** | **不**新增 `GET`、**不**改 `crates/api` 业务行为。 |
| **未做（初版 ladder 稿）** | 如 calldata **复制**钮、区块浏览器外链、详情再拉 `proposal-status`、投票权 JSON 折叠等——若需补做，**另开 TT/Epic**。 |

## 前端验收命令

与 [Epic-A-governance-execution-ux-ladder.md § 前端验收命令](../docs/runbook/Epic-A-governance-execution-ux-ladder.md) **一致**；最小复跑：

```bash
cd frontend && npm run test:i18n:ci && npm test -- --run governance.proposal-status && npm test -- --run GovernanceProposalExecStatusBadge && npm test -- --run governanceProposalsPage.contract && npm test -- --run governanceExecutionReadiness && npm test -- --run GovernanceProposalExecutionReadinessPanel && npm test -- --run GovernanceProposalExecutionActionsSkeleton && npm test -- --run governanceExecReadOnlyNarrative && npm test -- --run governanceProposalDetailPage.contract && npm test -- --run GovernancePreExecutionHint.contract
```

## 母表

**[docs/任务母表.md](../docs/任务母表.md)** — 检索 **Epic-A** 行。
