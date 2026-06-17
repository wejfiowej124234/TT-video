# 协议参数公示 · `/governance/params`

**阶段：** **① 本地**（**不**冒充 **②③**）

**C-GOV-011 · 文档镜像只读：** D-4555-A/B 双轨 · 三轨独立参数 · 现行 vs 待生效对拍 · FeeRouter 第一层 · Phase-1 十国表（募资合计 53,500 万）。

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

**三轨独立参数 SSOT：** [country-pool-fundraise-governance-v1.md](../../../docs/spec/governance-token/country-pool-fundraise-governance-v1.md) · [country-revenue-model-v1-draft.md](../../../docs/spec/governance-token/country-revenue-model-v1-draft.md) · [ttg-reference-price-v1-draft.md](../../../docs/spec/governance-token/ttg-reference-price-v1-draft.md) · **[ttg-allocation-permissions-flows-ssot-v1.md](../../../docs/spec/governance-token/ttg-allocation-permissions-flows-ssot-v1.md)**（**分配/权限/申请流程图解 · 改逻辑必改图**） · **[TTG-TOKENOMICS-FREEZE-V1.md](../../../docs/spec/governance-token/TTG-TOKENOMICS-FREEZE-V1.md)**（**GOV-01～04 · Gate-2.4 唯一经济读口 · `#gov-params-tokenomics-freeze`**）

**数据链（公开读）：** `GET /api/v1/governance/protocol-reference` · `GET /api/v1/governance/protocol-reference/pending`

**维护纪律：** 仅 bugfix · 数据链/i18n/a11y · 门闸；**禁止**页面结构 / layout token 回流。
