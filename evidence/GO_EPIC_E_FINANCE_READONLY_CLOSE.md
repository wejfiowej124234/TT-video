# GO · Epic E 只读财务 / 对账视角收口（E-01～E-10）

**标识**：文档收口 **`TT-DOC-EPIC-E-FINANCE-READONLY-CLOSE-001`**（与代码 Gate 分离；**不**替代 CI）。  
**Runbook 主入口**：[docs/runbook/Epic-E-finance-readonly-ladder.md](../docs/runbook/Epic-E-finance-readonly-ladder.md)。

## 完成项汇总（摘要）

- **04 / 200 / 70**：财务枢纽依赖的只读路径与边界（无二 Σ、API 主入口）。
- **前端**：`/admin/finance-reconciliation` 枢纽；`finance/summary`、`cross-check`、`drift-summary` 只读块；Epic D 对照说明；契约测试（形状 / 已用键路径）。
- **运维脚本**：`scripts/finance-readonly-smoke.sh`（**curl** + **jq**；**不**跨接口对账；**exit** 不含 drift 业务结论）。

## 边界与排除项

| 范围 | 说明 |
|------|------|
| **B-115 / B-116 / P5** | **不**改已封口 Snapshot/Claim/分配、FeeRouter/RegionVault/逐国账本等语义与实现。 |
| **Epic A / Epic C / Epic D** | **不**改已封口的治理执行 UX、Admin cross-check/drift UI 真值源、索引器运维脚本与 artifact 语义。 |
| **脚本** | **非** API SSOT；**禁止**跨响应运算或推导一致性。 |

## 验收命令

**有本地 API + Admin 会话**（须 **jq**、**`ADMIN_BEARER_TOKEN`**，与 **`indexer-public-snapshot.sh`** 同形）：

```bash
bash scripts/finance-readonly-smoke.sh
# 可选：追加本地 Epic D-10 落盘文件，仅校验 bundle_closure 结构
bash scripts/finance-readonly-smoke.sh docs/runbook/Epic-D-ops-artifact.v1.example-d10-go-bundle/epic_d_go_bundle_closure.json
```

**无环境占位**（**exit 0**）：

```bash
FINANCE_READONLY_SMOKE_SKIP=1 bash scripts/finance-readonly-smoke.sh
```

**前端契约（形状）**：

```bash
cd frontend && npx vitest run lib/financeReconciliationHub.contract.test.ts
```

## 母表

**[docs/任务母表.md](../docs/任务母表.md)** — 检索 **Epic E**。
