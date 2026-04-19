# Admin 独立域 · 路由盘点（对齐 `frontend/app/admin/**/page.tsx`）

**自动化**：`frontend/e2e/93-matrix-admin-domain-batch.spec.ts`  
**口径**：**PASS（已验证壳）** = 烟雾 Cookie 下 **`main` + `h1`** 可见；**深链** = 占位 UUID 详情/合规模板；**错误态** = `/admin/orders/not-a-uuid`；**权限** = 无 Cookie → `/auth/login?returnUrl=`。  
**计数**：静态路由 **45** + 占位详情/写壳 **12** = **57**（与 `frontend/app/admin` 下 `page.tsx` 文件数对齐）。

## 状态图例

| 标记 | 含义 |
|------|------|
| **PASS** | 本批次 Playwright 已断言（壳级） |
| **仅可达** | 历史 smoke 仅 `body`；本批升级为 **main+h1** |
| **写操作** | 表单/提交须在有数据/凭证环境单测，本批不自动点提交 |

## 静态列表与工具页（`ADMIN_STATIC_ROUTES`）

| 路径 | 本批 | 备注 |
|------|------|------|
| `/admin` | PASS | 工作台首页 |
| `/admin/trust-growth` | PASS | 93 P1 曾抽检；本批纳入域批次 |
| `/admin/cross-check` | PASS | 同上 |
| `/admin/drift-summary` | PASS | 同上 |
| `/admin/finance-reconciliation` | PASS | 同上 |
| `/admin/region-vault` | PASS | 同上 |
| `/admin/fee-router` | PASS | 仅可达 → 壳 PASS |
| `/admin/finance` | PASS | 同上 |
| `/admin/indexer` | PASS | 同上 |
| `/admin/indexer/reconcile-reports` | PASS | 同上 |
| `/admin/observability` | PASS | 同上 |
| `/admin/orders` | PASS | 列表壳 |
| `/admin/disputes` | PASS | 同上 |
| `/admin/reviews` | PASS | 同上 |
| `/admin/users` | PASS | 同上 |
| `/admin/guides` | PASS | 同上 |
| `/admin/approvals` | PASS | 同上 |
| `/admin/audit` | PASS | 同上 |
| `/admin/audit/operations` | PASS | 同上 |
| `/admin/alerts/incidents` | PASS | 同上 |
| `/admin/schema` | PASS | 同上 |
| `/admin/api-versions` | PASS | 同上 |
| `/admin/jobs` | PASS | 同上 |
| `/admin/scheduler/jobs` | PASS | 同上 |
| `/admin/lifecycle` | PASS | 同上 |
| `/admin/policies` | PASS | 同上 |
| `/admin/internal-tools/audits` | PASS | 同上 |
| `/admin/config` | PASS | 同上 |
| `/admin/config/releases` | PASS | 同上 |
| `/admin/flags` | PASS | 同上 |
| `/admin/secrets/metadata` | PASS | 同上 |
| `/admin/tenants/scopes` | PASS | 同上 |
| `/admin/compliance/requests` | PASS | 列表壳 |
| `/admin/community/reports` | PASS | 社区监管 |
| `/admin/community/appeals` | PASS | 同上 |
| `/admin/community/appeals/review` | PASS | 写壳入口（本批不提交） |
| `/admin/community/moderation/cases` | PASS | 同上 |
| `/admin/community/risk-signals` | PASS | 同上 |
| `/admin/community/policy-change-logs` | PASS | 同上 |
| `/admin/community/ranking/snapshots` | PASS | 同上 |
| `/admin/community/penalties` | PASS | 同上 |
| `/admin/community/comments/visibility` | PASS | 同上 |
| `/admin/community/abuse-policy` | PASS | 同上 |
| `/admin/media/access-logs` | PASS | 同上 |
| `/admin/media/signed-url-tokens` | PASS | 同上 |

## 详情 / 合规模板（占位 UUID）

| 路径模式 | 本批 | 备注 |
|----------|------|------|
| `/admin/orders/:id` | PASS | 占位 `…00ad`；API 404 允许 |
| `/admin/disputes/:id` | PASS | 同上 |
| `/admin/users/:id` | PASS | 同上 |
| `/admin/guides/:id` | PASS | 同上 |
| `/admin/reviews/:id` | PASS | 同上 |
| `/admin/approvals/:id` | PASS | 同上 |
| `/admin/audit/logs/:id` | PASS | 同上 |
| `/admin/indexer/reconcile/:id` | PASS | 同上 |
| `/admin/config/releases/:id` | PASS | 同上 |
| `/admin/alerts/incidents/:id` | PASS | 同上 |
| `…/compliance/requests/:id/events` | PASS | 只读事件时间线壳 |
| `…/compliance/requests/:id/update` | PASS | **写操作页壳**；本批不 POST |

## 横切

| 场景 | 本批 | 备注 |
|------|------|------|
| 无 Cookie `/admin/orders` | PASS | 中间件重定向登录 |
| 非法订单 id `not-a-uuid` | PASS | **错误态** `role=alert` 或仍含 `h1` 壳 |

## 未纳入（下一批 / 环境）

| 项 | 原因 |
|----|------|
| 真实写操作（审批通过、合规模板提交、Indexer 写） | 须 **ADMIN_BEARER** / 内部密钥与目标数据行；**MANUAL** 或专批 |
| 列表 **空态** 与 **API 字段对拍** | 须可控 DB 种子；建议 **93-D-ADM** 数据驱动子批 |
| 全 Admin **403/角色矩阵** | 当前仅 **Cookie 占位** 门闸；真 RBAC 另开 |
