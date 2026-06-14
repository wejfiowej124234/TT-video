# 协议参数公示 · `/governance/params`

**阶段：** **① 本地**（**不**冒充 **②③**）

**C-GOV-011 · 84 文档镜像只读：** 现行 vs 待生效对拍 · 费用拆分 · Phase-1 十国表。

| 读者 | 入口 |
|------|------|
| 公开核对 | `/governance/params` |
| 主理人工作台 deep link | `/governance/params?from=steward_workbench`（回程 → `/governance?view=region`） |
| 不一致 gate | `/governance/proposals` |

**代码真源：** [`GovernanceParamsPageMain.tsx`](GovernanceParamsPageMain.tsx) · [`GovernanceParamsL5Shell.tsx`](../../components/governance/GovernanceParamsL5Shell.tsx) · [`governanceParamsPageL5ClosureSprintModel.ts`](../../lib/governance/governanceParamsPageL5ClosureSprintModel.ts)

**① L5 冻结（2026-06-12）：** [GOVERNANCE-PARAMS-L5-FREEZE.md](../../evidence/GO_local_governance_params_l5/GOVERNANCE-PARAMS-L5-FREEZE.md) · [企业审计](../../evidence/GO_local_governance_params_l5/GOVERNANCE-PARAMS-L5-ENTERPRISE-AUDIT.md)

**机读验收：**

```bash
bash scripts/dev/smoke-governance-params-l5-local.sh
bash scripts/dev/record-governance-params-l5-evidence.sh
```

末行：`TT_GOVERNANCE_PARAMS_L5_SMOKE: OK` / `TT_GOVERNANCE_PARAMS_L5_EVIDENCE: OK`

**数据链（公开读）：** `GET /api/v1/governance/protocol-reference` · `GET /api/v1/governance/protocol-reference/pending`

**维护纪律：** 仅 bugfix · 数据链/i18n/a11y · 门闸；**禁止**页面结构 / layout token 回流。
