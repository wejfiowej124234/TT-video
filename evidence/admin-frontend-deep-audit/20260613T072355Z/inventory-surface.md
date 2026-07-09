# Admin 深审计 · 机读表面盘点（生成）

**口径**：`已实现 / 缺失 / 仅壳 / 未验证` 中，本文件仅自动填 **「前端路由存在」** 与 **「后端是否存在可 grep 到的相关 `/api/v1/admin/*` 前缀」**；
**写路径 / RBAC / 空态 / UI↔API 字段** 须以 Playwright 深批 + 手工登记 `inventory.md` 正文。

- 前端 `page.tsx` 数：**107**
- 后端 admin 路由串（去重）：**65**

## 前端 Admin 路由 → 后端前缀命中（启发式）

| UI 路由 | 命中 API（子串列举，最多 8 条） | 机读结论 |
|---------|-----------------------------------|----------|
| `/admin` | /api/v1/admin/users<br>/api/v1/admin/users/:id/role-change-request<br>/api/v1/admin/users/:id<br>/api/v1/admin/guides/:id<br>/api/v1/admin/guides<br>/api/v1/admin/orders<br>/api/v1/admin/orders/:id<br>/api/v1/admin/finance/summary | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/alerts/incidents` | /api/v1/admin/alerts/incidents/:id | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/alerts/incidents/[id]` | /api/v1/admin/alerts/incidents/:id | **未验证**（动态段；须对拍详情 GET/写路径） |
| `/admin/api-versions` | /api/v1/admin/api-versions | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/approvals` | /api/v1/admin/approvals<br>/api/v1/admin/approvals/:id<br>/api/v1/admin/approvals/:id/approve<br>/api/v1/admin/approvals/:id/reject | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/approvals/[id]` | /api/v1/admin/approvals<br>/api/v1/admin/approvals/:id<br>/api/v1/admin/approvals/:id/approve<br>/api/v1/admin/approvals/:id/reject | **未验证**（动态段；须对拍详情 GET/写路径） |
| `/admin/audit` | /api/v1/admin/audit/operations | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/audit/logs/[id]` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/audit/operations` | /api/v1/admin/audit/operations | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/auth-audit-events` | /api/v1/admin/auth-audit-events | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/community/abuse-policy` | /api/v1/admin/community/abuse-policy | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/community/appeals` | /api/v1/admin/community/appeals<br>/api/v1/admin/community/appeals/:id/review | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/community/appeals/review` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/community/comments/visibility` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/community/moderation/cases` | /api/v1/admin/community/moderation/cases | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/community/penalties` | /api/v1/admin/community/penalties | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/community/policy-change-logs` | /api/v1/admin/community/policy-change-logs | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/community/ranking/snapshots` | /api/v1/admin/community/ranking/snapshots | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/community/reports` | /api/v1/admin/community/reports | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/community/risk-signals` | /api/v1/admin/community/risk-signals | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/compliance` | /api/v1/admin/compliance/data-requests/:request_id/events<br>/api/v1/admin/compliance/data-requests/:request_id/update<br>/api/v1/admin/compliance/data-requests | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/compliance/requests` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/compliance/requests/[requestId]/events` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/compliance/requests/[requestId]/update` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/config` | /api/v1/admin/config/releases<br>/api/v1/admin/config/releases/:id | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/config/releases` | /api/v1/admin/config/releases<br>/api/v1/admin/config/releases/:id | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/config/releases/[id]` | /api/v1/admin/config/releases<br>/api/v1/admin/config/releases/:id | **未验证**（动态段；须对拍详情 GET/写路径） |
| `/admin/content` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/content/catalog-dashboard` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/content/cities` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/content/countries` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/content/country-market` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/content/geo-validation` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/content/hotel-tiers` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/content/import-operations` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/content/intercity-routes` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/content/landing-ambient` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/content/media-assets` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/content/poi-images` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/content/poi-images/batches/[id]` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/content/pois` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/content/pricing` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/content/publish-queue` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/content/revisions` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/content/revisions/compare` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/content/transport-region-rules` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/conversion-analytics` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/cross-check` | /api/v1/admin/cross-check | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/disputes` | /api/v1/admin/disputes<br>/api/v1/admin/disputes/:id | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/disputes/[id]` | /api/v1/admin/disputes<br>/api/v1/admin/disputes/:id | **未验证**（动态段；须对拍详情 GET/写路径） |
| `/admin/drift-summary` | /api/v1/admin/drift-summary | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/fee-router` | /api/v1/admin/fee-router/routed-events | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/finance` | /api/v1/admin/finance/summary<br>/api/v1/admin/finance/summary/export | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/finance-reconciliation` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/finance-suite` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/flags` | /api/v1/admin/flags<br>/api/v1/admin/flags/:id/publish | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/governance/execution-uat` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/growth` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/growth/airdrop-campaigns` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/growth/analytics` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/growth/anti-fraud` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/growth/early-bird` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/growth/kol-center` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/growth/referral-codes` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/growth/reward-ledger` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/guide-applications` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/guides` | /api/v1/admin/guides/:id<br>/api/v1/admin/guides | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/guides/[id]` | /api/v1/admin/guides/:id<br>/api/v1/admin/guides | **未验证**（动态段；须对拍详情 GET/写路径） |
| `/admin/inbox` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/indexer` | /api/v1/admin/indexer/health<br>/api/v1/admin/indexer/reconcile-report/:id<br>/api/v1/admin/indexer/reconcile-reports<br>/api/v1/admin/indexer/reconcile-reports/export | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/indexer/reconcile-reports` | /api/v1/admin/indexer/reconcile-reports<br>/api/v1/admin/indexer/reconcile-reports/export | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/indexer/reconcile/[id]` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/internal-tools/audits` | /api/v1/admin/internal-tools/audits | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/jobs` | /api/v1/admin/jobs | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/lifecycle` | /api/v1/admin/lifecycle/state-machines | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/media/access-logs` | /api/v1/admin/media/access-logs | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/media/signed-url-tokens` | /api/v1/admin/media/signed-url-tokens | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/observability` | /api/v1/admin/observability/overview<br>/api/v1/admin/observability/alert-rules | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/official` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/official/accounts` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/official/cold-start` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/official/guides` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/official/itinerary-templates` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/onboarding` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/onboarding/compliance-audit` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/onboarding/entitlements` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/onboarding/entitlements/[id]` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/onboarding/payment-events` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/onboarding/webhook-jobs` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/operator-guide` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/orders` | /api/v1/admin/orders<br>/api/v1/admin/orders/:id | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/orders/[id]` | /api/v1/admin/orders<br>/api/v1/admin/orders/:id | **未验证**（动态段；须对拍详情 GET/写路径） |
| `/admin/permissions` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/policies` | /api/v1/admin/policies<br>/api/v1/admin/policies/:id/publish | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/provider-applications` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/region-share/reconcile` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/region-vault` | /api/v1/admin/region-vault/forwarded-events<br>/api/v1/admin/region-vault/forwarded-events/export | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/reviews` | /api/v1/admin/reviews<br>/api/v1/admin/reviews/:id | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/reviews/[id]` | /api/v1/admin/reviews<br>/api/v1/admin/reviews/:id | **未验证**（动态段；须对拍详情 GET/写路径） |
| `/admin/scheduler/jobs` | /api/v1/admin/scheduler/jobs<br>/api/v1/admin/scheduler/jobs/:job_code/rerun | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/schema` | /api/v1/admin/schema/migrations | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/secrets/metadata` | /api/v1/admin/secrets/metadata | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/steward-applications` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/tenants/scopes` | /api/v1/admin/tenants/scopes<br>/api/v1/admin/tenants/scopes/:id/publish | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/trust-growth` | — | **缺失**（无 `/api/v1/admin` 前缀命中；可能走非 admin API 或 Target） |
| `/admin/users` | /api/v1/admin/users<br>/api/v1/admin/users/:id/role-change-request<br>/api/v1/admin/users/:id | **未验证**（有 API 前缀；须 Playwright / 登录角色） |
| `/admin/users/[id]` | /api/v1/admin/users<br>/api/v1/admin/users/:id/role-change-request<br>/api/v1/admin/users/:id | **未验证**（动态段；须对拍详情 GET/写路径） |

## 后端 `/api/v1/admin/*` 全量（grep，含重复装配排除前原始去重）

- `/api/v1/admin/users`
- `/api/v1/admin/users/:id/role-change-request`
- `/api/v1/admin/users/:id`
- `/api/v1/admin/guides/:id`
- `/api/v1/admin/guides`
- `/api/v1/admin/orders`
- `/api/v1/admin/orders/:id`
- `/api/v1/admin/finance/summary`
- `/api/v1/admin/finance/summary/export`
- `/api/v1/admin/fee-router/routed-events`
- `/api/v1/admin/region-vault/forwarded-events`
- `/api/v1/admin/region-vault/forwarded-events/export`
- `/api/v1/admin/schema/migrations`
- `/api/v1/admin/disputes`
- `/api/v1/admin/disputes/:id`
- `/api/v1/admin/reviews`
- `/api/v1/admin/reviews/:id`
- `/api/v1/admin/observability/overview`
- `/api/v1/admin/observability/alert-rules`
- `/api/v1/admin/alerts/incidents/:id`
- `/api/v1/admin/audit/operations`
- `/api/v1/admin/indexer/health`
- `/api/v1/admin/indexer/reconcile-report/:id`
- `/api/v1/admin/indexer/reconcile-reports`
- `/api/v1/admin/indexer/reconcile-reports/export`
- `/api/v1/admin/audit-logs/:id`
- `/api/v1/admin/audit-logs`
- `/api/v1/admin/auth-audit-events`
- `/api/v1/admin/approvals`
- `/api/v1/admin/approvals/:id`
- `/api/v1/admin/approvals/:id/approve`
- `/api/v1/admin/approvals/:id/reject`
- `/api/v1/admin/flags`
- `/api/v1/admin/flags/:id/publish`
- `/api/v1/admin/secrets/metadata`
- `/api/v1/admin/config/releases`
- `/api/v1/admin/config/releases/:id`
- `/api/v1/admin/jobs`
- `/api/v1/admin/scheduler/jobs`
- `/api/v1/admin/scheduler/jobs/:job_code/rerun`
- `/api/v1/admin/api-versions`
- `/api/v1/admin/lifecycle/state-machines`
- `/api/v1/admin/policies`
- `/api/v1/admin/policies/:id/publish`
- `/api/v1/admin/tenants/scopes`
- `/api/v1/admin/tenants/scopes/:id/publish`
- `/api/v1/admin/compliance/data-requests/:request_id/events`
- `/api/v1/admin/compliance/data-requests/:request_id/update`
- `/api/v1/admin/compliance/data-requests`
- `/api/v1/admin/internal-tools/audits`
- `/api/v1/admin/media/access-logs`
- `/api/v1/admin/media/signed-url-tokens`
- `/api/v1/admin/community/reports`
- `/api/v1/admin/community/appeals`
- `/api/v1/admin/community/moderation/:id`
- `/api/v1/admin/community/appeals/:id/review`
- `/api/v1/admin/community/ranking/snapshots`
- `/api/v1/admin/community/penalties`
- `/api/v1/admin/community/moderation/cases`
- `/api/v1/admin/community/comments/:id`
- `/api/v1/admin/community/risk-signals`
- `/api/v1/admin/community/policy-change-logs`
- `/api/v1/admin/community/abuse-policy`
- `/api/v1/admin/cross-check`
- `/api/v1/admin/drift-summary`

