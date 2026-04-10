# GO · Epic C Admin 对拍 / Drift 只读 UI 收口（C-01～C-10）

**标识**：文档收口 **`TT-DOC-EPIC-C-ADMIN-CROSS-CHECK-DRIFT-UI-CLOSE-001`**（与代码 Gate 分离；**不**替代 CI）。  
**Runbook 主入口**：[docs/runbook/Epic-C-admin-cross-check-drift-ui-ladder.md](../docs/runbook/Epic-C-admin-cross-check-drift-ui-ladder.md)。  
**Read Contract**：[`read-contract-admin-read-apis.md` § cross-check / drift-summary](../docs/runbook/read-contract-admin-read-apis.md)。

## 完成项汇总（前端）

- **路由与客户端**：`routes.admin.crossCheck` / `routes.admin.driftSummary`；`getAdminCrossCheck` / `getAdminDriftSummary`（`frontend/lib/apiClient/adminCrossCheck.ts`）。
- **宽读取**：`normalizeAdminCrossCheckRead`、`normalizeAdminDriftSummaryRead`、`readAdminJsonStatus`、`normalizeCrossCheckSlot`；`drift_detected` **undefined** 与 **false** 区分（单测锁定）。
- **页面**：`/admin/cross-check`（三槽分区、页内锚点、只读边界提示）；`/admin/drift-summary`（`drift_detected` / `delta` JSON、只读说明）。
- **i18n 口径**：`admin_audit_tools_read_only_scope`、导航与副标题统一「只读 / 不修复」边界；`admin_audit_compare_links_heading`（互链区）。
- **导航**：`AdminShellBar` 顶栏 **Cross-check · read-only** / **Drift · read-only**；`AdminHomeClient` 工作台卡片 + 顶栏快链。
- **横向互链**：`AdminAuditCompareLinks` — `finance` / `indexer` / `observability` 页眉下轻量入口（**不**嵌三槽、**不**复制对拍逻辑）。
- **契约测试**：`page.c08-contract.test.tsx`（两页 **GET-only**、`fetch` **无 body**、无 `button` / `form` / 链上关键词）；既有 `adminCrossCheck` / `cross-check/page` / `drift-summary/page` 等单测。

## 边界与排除项

| 范围 | 说明 |
|------|------|
| **B-115** | **不**改 Snapshot / Claim / 分配对账封口路径与语义；对拍 UI **仅消费**已有 Admin GET 聚合体。 |
| **B-116** | **不**改 FeeRouter / RegionVault / `fee-pool-aggregates` 等 MVP 封口实现。 |
| **P5** | **不**改 P5-1～P5-5 程序族已封口专项及相关约定代码。 |
| **后端** | **不**新增 `GET`、**不**改 `crates/api` 对拍算法或 `admin_cross_check` / `get_admin_drift_summary` 行为。 |
| **Epic A** | **正交**：Epic A 钉 **治理提案执行态只读**（Execute skeleton、无钱包）；Epic C 钉 **运营/审计向多源 JSON 与 drift 观测**；**不**共用 Timelock ETA / 块高 SSOT 叙事。 |
| **Epic A2**（未单独立项前） | **禁止**在本 Epic 内接钱包、真实 `execute`、或把 **drift** 做成「一键上链修复」；须 **另开 Epic + Runbook/权限**。 |

## 前端验收命令（最小复跑）

```bash
cd frontend && npm run lint && npx tsc --noEmit
npm run test:i18n:ci
npm test -- --run adminCrossCheck
npm test -- --run cross-check/page
npm test -- --run drift-summary/page
npm test -- --run page.c08-contract
npm test -- --run AdminShellBar
npm test -- --run AdminHomeClient
npm test -- --run AdminAuditCompareLinks
```

## 母表

**[docs/任务母表.md](../docs/任务母表.md)** — 检索 **Epic-C** 行。
