# Admin Frontend Deep Audit 报告

**记录时间：** 2026-06-13T07:29:49.487951+00:00  
**Web：** [https://tt-web-staging.fly.dev](https://tt-web-staging.fly.dev)  
**API：** [https://tt-api-staging.fly.dev](https://tt-api-staging.fly.dev)  
**管理员种子：** `tourist@test.com`  
**git_sha：** `5ab1f8ba2229ccf20b99deb35e7ae1370954a328`  
**证据：** `D:/TravelTrust-V1.1/evidence/admin-frontend-deep-audit/20260613T072355Z/afda-findings.json`  

> **暂停 Production GO** · Admin Frontend Deep Audit · ② staging  
> 口径：可见≠可用 · 可用≠有权限 · 有权限≠可越权  
> **禁止新增功能** · 仅登记/修复阻塞缺陷

---

## Executive verdict

| 项 | 结果 |
|----|------|
| **AFDA overall** | **CONDITIONAL** |
| **P0** | **0** |
| **P1** | **18** |
| **P2** | **1** |
| **Admin 路由** | **107** |
| **API PASS/WARN/FAIL/SKIP** | **88/0/18/1** |

```text
AFDA_ADMIN_FRONTEND_DEEP: CONDITIONAL
```

---

## 1 · Admin 全域功能矩阵

| 域 | 路由 | 权限 | API | UI 可达 | 备注 |
|----|------|------|-----|---------|------|
| 工作台 | `/admin` | `admin.read` | PASS | PASS | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 审计观测 | `/admin/alerts/incidents` | `admin.read` | PASS | PASS | GET /api/v1/admin/observability/overview → 200 |
| 审计观测 | `/admin/alerts/incidents/00000000-0000-4000-8000-0000000000ad` | `admin.read` | PASS | PASS | GET /api/v1/admin/alerts/incidents/00000000-0000-4000-8000-0 |
| 平台配置 | `/admin/api-versions` | `admin.platform.read` | PASS | PASS | GET /api/v1/admin/api-versions → 200 |
| 入驻审核 | `/admin/approvals` | `admin.approve` | PASS | PASS | GET /api/v1/admin/approvals?limit=3 → 200 |
| 入驻审核 | `/admin/approvals/00000000-0000-4000-8000-0000000000ad` | `admin.approve` | FAIL | PASS | GET /api/v1/admin/approvals/00000000-0000-4000-8000-00000000 |
| 审计观测 | `/admin/audit` | `admin.read` | PASS | PASS | GET /api/v1/admin/audit-logs?limit=3 → 200 |
| 审计观测 | `/admin/audit/logs/00000000-0000-4000-8000-0000000000ad` | `admin.read` | PASS | PASS | GET /api/v1/admin/audit-logs/00000000-0000-4000-8000-0000000 |
| 审计观测 | `/admin/audit/operations` | `admin.read` | PASS | PASS | GET /api/v1/admin/audit/operations?limit=10 → 200 |
| 审计观测 | `/admin/auth-audit-events` | `admin.read` | PASS | PASS | GET /api/v1/admin/auth-audit-events?limit=3 → 200 |
| 社区治理 | `/admin/community/abuse-policy` | `admin.community.super` | SKIP | PASS | 无映射读 API（纯导航/写壳页） |
| 社区治理 | `/admin/community/appeals` | `admin.community.read` | PASS | PASS | GET /api/v1/admin/community/appeals?limit=3 → 200 |
| 社区治理 | `/admin/community/appeals/review` | `admin.community.super` | FAIL | PASS | GET /api/v1/admin/community/appeals?limit=3&status=pending → |
| 社区治理 | `/admin/community/comments/visibility` | `admin.community.moderate` | PASS | PASS | GET /api/v1/admin/community/reports?limit=1 → 200 |
| 社区治理 | `/admin/community/moderation/cases` | `admin.community.read` | FAIL | PASS | GET /api/v1/admin/community/moderation/cases?limit=3 → 0 |
| 社区治理 | `/admin/community/penalties` | `admin.community.moderate` | FAIL | PASS | GET /api/v1/admin/community/penalties?limit=3 → 0 |
| 社区治理 | `/admin/community/policy-change-logs` | `admin.community.read` | PASS | PASS | GET /api/v1/admin/community/policy-change-logs?limit=3 → 200 |
| 社区治理 | `/admin/community/ranking/snapshots` | `admin.community.read` | PASS | PASS | GET /api/v1/admin/community/ranking/snapshots?limit=3 → 200 |
| 社区治理 | `/admin/community/reports` | `admin.community.read` | FAIL | PASS | GET /api/v1/admin/community/reports?limit=3 → 0 |
| 社区治理 | `/admin/community/risk-signals` | `admin.community.read` | FAIL | PASS | GET /api/v1/admin/community/risk-signals?limit=3 → 0 |
| 平台配置 | `/admin/compliance` | `admin.read` | PASS | PASS | GET /api/v1/admin/compliance/data-requests?limit=1 → 200 |
| 平台配置 | `/admin/compliance/requests` | `admin.read` | PASS | PASS | GET /api/v1/admin/compliance/data-requests?limit=3 → 200 |
| 平台配置 | `/admin/compliance/requests/00000000-0000-4000-8000-0000000000ad/events` | `admin.read` | FAIL | — | GET /api/v1/admin/compliance/data-requests?limit=3 → 0 |
| 平台配置 | `/admin/compliance/requests/00000000-0000-4000-8000-0000000000ad/update` | `admin.read` | PASS | — | GET /api/v1/admin/compliance/data-requests?limit=3 → 200 |
| 平台配置 | `/admin/config` | `admin.platform.read` | PASS | PASS | GET /api/v1/admin/flags?limit=1 → 200 |
| 平台配置 | `/admin/config/releases` | `admin.platform.publish` | PASS | PASS | GET /api/v1/admin/config/releases?limit=3 → 200 |
| 平台配置 | `/admin/config/releases/00000000-0000-4000-8000-0000000000ad` | `admin.platform.publish` | PASS | PASS | GET /api/v1/admin/config/releases/00000000-0000-4000-8000-00 |
| 其他 | `/admin/content` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/content/catalog-dashboard` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/content/cities` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/content/countries` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/content/country-market` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/content/geo-validation` | `admin.read` | FAIL | — | GET /api/v1/admin/capabilities → 0; GET /api/v1/admin/metric |
| 其他 | `/admin/content/hotel-tiers` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/content/import-operations` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/content/intercity-routes` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/content/landing-ambient` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 平台配置 | `/admin/content/media-assets` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/content/poi-images` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/content/poi-images/batches/00000000-0000-4000-8000-0000000000ad` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/content/pois` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/content/pricing` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/content/publish-queue` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/content/revisions` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/content/revisions/compare` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/content/transport-region-rules` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/conversion-analytics` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 对账治理 | `/admin/cross-check` | `admin.read` | PASS | PASS | GET /api/v1/admin/cross-check → 200 |
| 经营运维 | `/admin/disputes` | `admin.orders.read` | PASS | PASS | GET /api/v1/admin/disputes?limit=3 → 200 |
| 经营运维 | `/admin/disputes/00000000-0000-4000-8000-0000000000ad` | `admin.orders.read` | PASS | PASS | GET /api/v1/admin/disputes/00000000-0000-4000-8000-000000000 |
| 对账治理 | `/admin/drift-summary` | `admin.read` | FAIL | PASS | GET /api/v1/admin/drift-summary → 0 |
| 财务链上 | `/admin/fee-router` | `admin.finance.read` | FAIL | PASS | GET /api/v1/admin/fee-router/routed-events?limit=3 → 0 |
| 财务链上 | `/admin/finance` | `admin.finance.read` | PASS | PASS | GET /api/v1/admin/finance/summary → 200 |
| 财务链上 | `/admin/finance-reconciliation` | `admin.finance.read` | PASS | PASS | GET /api/v1/admin/finance/summary → 200; GET /api/v1/admin/c |
| 财务链上 | `/admin/finance-suite` | `admin.finance.read` | PASS | PASS | GET /api/v1/admin/finance/summary → 200 |
| 平台配置 | `/admin/flags` | `admin.platform.publish` | PASS | PASS | GET /api/v1/admin/flags?limit=3 → 200 |
| 对账治理 | `/admin/governance/execution-uat` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/growth` | `admin.read` | FAIL | — | GET /api/v1/admin/capabilities → 0; GET /api/v1/admin/metric |
| 其他 | `/admin/growth/airdrop-campaigns` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/growth/analytics` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/growth/anti-fraud` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/growth/early-bird` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/growth/kol-center` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/growth/referral-codes` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/growth/reward-ledger` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/guide-applications` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 经营运维 | `/admin/guides` | `admin.users.read` | PASS | PASS | GET /api/v1/admin/guides?limit=3 → 200 |
| 经营运维 | `/admin/guides/00000000-0000-4000-8000-0000000000ad` | `admin.users.read` | PASS | PASS | GET /api/v1/admin/guides/00000000-0000-4000-8000-0000000000a |
| 入驻审核 | `/admin/inbox` | `admin.read` | PASS | PASS | GET /api/v1/admin/capabilities → 200 |
| 财务链上 | `/admin/indexer` | `admin.read` | PASS | PASS | GET /api/v1/admin/indexer/health → 200 |
| 财务链上 | `/admin/indexer/reconcile-reports` | `admin.read` | PASS | PASS | GET /api/v1/admin/indexer/reconcile-reports?limit=3 → 200 |
| 财务链上 | `/admin/indexer/reconcile/00000000-0000-4000-8000-0000000000ad` | `admin.read` | PASS | PASS | GET /api/v1/admin/indexer/reconcile-report/00000000-0000-400 |
| 审计观测 | `/admin/internal-tools/audits` | `admin.read` | PASS | PASS | GET /api/v1/admin/internal-tools/audits?limit=3 → 200 |
| 平台配置 | `/admin/jobs` | `admin.platform.read` | PASS | PASS | GET /api/v1/admin/jobs?limit=3 → 200 |
| 平台配置 | `/admin/lifecycle` | `admin.platform.read` | PASS | PASS | GET /api/v1/admin/lifecycle/state-machines → 200 |
| 平台配置 | `/admin/media/access-logs` | `admin.read` | PASS | PASS | GET /api/v1/admin/media/access-logs?limit=3 → 200 |
| 平台配置 | `/admin/media/signed-url-tokens` | `admin.read` | PASS | PASS | GET /api/v1/admin/media/signed-url-tokens?limit=3 → 200 |
| 审计观测 | `/admin/observability` | `admin.read` | PASS | PASS | GET /api/v1/admin/observability/overview → 200 |
| 其他 | `/admin/official` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/official/accounts` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/official/cold-start` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 经营运维 | `/admin/official/guides` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 其他 | `/admin/official/itinerary-templates` | `admin.read` | PASS | — | GET /api/v1/admin/capabilities → 200; GET /api/v1/admin/metr |
| 入驻审核 | `/admin/onboarding` | `admin.onboarding.read` | PASS | PASS | GET /api/v1/admin/onboarding/entitlements?limit=1 → 200 |
| 入驻审核 | `/admin/onboarding/compliance-audit` | `admin.onboarding.read` | PASS | PASS | GET /api/v1/admin/onboarding/compliance-audit-events?limit=3 |
| 入驻审核 | `/admin/onboarding/entitlements` | `admin.onboarding.read` | PASS | PASS | GET /api/v1/admin/onboarding/entitlements?limit=3 → 200 |
| 入驻审核 | `/admin/onboarding/entitlements/00000000-0000-4000-8000-0000000000ad` | `admin.onboarding.read` | PASS | PASS | GET /api/v1/admin/onboarding/entitlements/00000000-0000-4000 |
| 入驻审核 | `/admin/onboarding/payment-events` | `admin.onboarding.read` | PASS | PASS | GET /api/v1/admin/onboarding/payment-events?limit=3 → 200 |
| 入驻审核 | `/admin/onboarding/webhook-jobs` | `admin.onboarding.read` | FAIL | PASS | GET /api/v1/admin/onboarding/webhook-jobs?limit=3 → 0 |
| 工作台 | `/admin/operator-guide` | `admin.read` | FAIL | PASS | GET /api/v1/admin/capabilities → 0 |
| 经营运维 | `/admin/orders` | `admin.orders.read` | PASS | PASS | GET /api/v1/admin/orders?limit=3 → 200 |
| 经营运维 | `/admin/orders/00000000-0000-4000-8000-0000000000ad` | `admin.orders.read` | FAIL | PASS | GET /api/v1/admin/orders/00000000-0000-4000-8000-0000000000a |
| 平台配置 | `/admin/permissions` | `admin.read` | FAIL | PASS | GET /api/v1/admin/capabilities → 0; GET /api/v1/admin/rbac/r |
| 平台配置 | `/admin/policies` | `admin.platform.publish` | PASS | PASS | GET /api/v1/admin/policies?limit=3 → 200 |
| 入驻审核 | `/admin/provider-applications` | `admin.onboarding.provider_review` | FAIL | PASS | GET /api/v1/admin/provider-applications?limit=3 → 0 |
| 其他 | `/admin/region-share/reconcile` | `admin.read` | FAIL | — | GET /api/v1/admin/capabilities → 0; GET /api/v1/admin/metric |
| 财务链上 | `/admin/region-vault` | `admin.finance.read` | PASS | PASS | GET /api/v1/admin/region-vault/forwarded-events?limit=3 → 20 |
| 经营运维 | `/admin/reviews` | `admin.read` | PASS | PASS | GET /api/v1/admin/reviews?limit=3 → 200 |
| 经营运维 | `/admin/reviews/00000000-0000-4000-8000-0000000000ad` | `admin.read` | PASS | PASS | GET /api/v1/admin/reviews/00000000-0000-4000-8000-0000000000 |
| 平台配置 | `/admin/scheduler/jobs` | `admin.approve` | PASS | PASS | GET /api/v1/admin/scheduler/jobs?limit=3 → 200 |
| 审计观测 | `/admin/schema` | `admin.read` | PASS | PASS | GET /api/v1/admin/schema/migrations?limit=3 → 200 |
| 平台配置 | `/admin/secrets/metadata` | `admin.platform.read` | PASS | PASS | GET /api/v1/admin/secrets/metadata?limit=3 → 200 |
| 入驻审核 | `/admin/steward-applications` | `admin.onboarding.steward_review` | PASS | PASS | GET /api/v1/admin/steward-applications?limit=3 → 200 |
| 平台配置 | `/admin/tenants/scopes` | `admin.platform.publish` | FAIL | PASS | GET /api/v1/admin/tenants/scopes?limit=3 → 0 |
| 对账治理 | `/admin/trust-growth` | `admin.trust_growth.write` | PASS | PASS | GET /api/v1/admin/trust-growth/observability → 200 |
| 经营运维 | `/admin/users` | `admin.users.read` | PASS | PASS | GET /api/v1/admin/users?limit=3 → 200 |
| 经营运维 | `/admin/users/00000000-0000-4000-8000-0000000000ad` | `admin.users.read` | PASS | PASS | GET /api/v1/admin/users/00000000-0000-4000-8000-0000000000ad |

---

## 2 · 权限矩阵（探针摘要）

_无权限探针记录。_

---

## 3 · 问题矩阵（按优先级）

### P0（0）

_无记录。_

### P1（18）

| ID | 类别 | 路由 | 标题 | 观察 | 真人影响 |
|----|------|------|------|------|----------|
| AFDA-1-001 | API连通性 | `/admin/approvals/00000000-0000-4000-8000-0000000000ad` | API 异常: /api/v1/admin/approvals/00000000-0000-4000-8000-0000000000ad | HTTP 0 | 管理员页不可用或间歇失败 |
| AFDA-1-002 | API连通性 | `/admin/community/appeals/review` | API 异常: /api/v1/admin/community/appeals?limit=3&status=pending | HTTP 0 | 管理员页不可用或间歇失败 |
| AFDA-1-003 | API连通性 | `/admin/community/moderation/cases` | API 异常: /api/v1/admin/community/moderation/cases?limit=3 | HTTP 0 | 管理员页不可用或间歇失败 |
| AFDA-1-004 | API连通性 | `/admin/community/penalties` | API 异常: /api/v1/admin/community/penalties?limit=3 | HTTP 0 | 管理员页不可用或间歇失败 |
| AFDA-1-005 | API连通性 | `/admin/community/reports` | API 异常: /api/v1/admin/community/reports?limit=3 | HTTP 0 | 管理员页不可用或间歇失败 |
| AFDA-1-006 | API连通性 | `/admin/community/risk-signals` | API 异常: /api/v1/admin/community/risk-signals?limit=3 | HTTP 0 | 管理员页不可用或间歇失败 |
| AFDA-1-007 | API连通性 | `/admin/compliance/requests/00000000-0000-4000-8000-0000000000ad/events` | API 异常: /api/v1/admin/compliance/data-requests?limit=3 | HTTP 0 | 管理员页不可用或间歇失败 |
| AFDA-1-008 | API连通性 | `/admin/content/geo-validation` | API 异常: /api/v1/admin/capabilities | HTTP 0 | 管理员页不可用或间歇失败 |
| AFDA-1-009 | API连通性 | `/admin/drift-summary` | API 异常: /api/v1/admin/drift-summary | HTTP 0 | 管理员页不可用或间歇失败 |
| AFDA-1-010 | API连通性 | `/admin/fee-router` | API 异常: /api/v1/admin/fee-router/routed-events?limit=3 | HTTP 0 | 管理员页不可用或间歇失败 |
| AFDA-1-011 | API连通性 | `/admin/growth` | API 异常: /api/v1/admin/capabilities | HTTP 0 | 管理员页不可用或间歇失败 |
| AFDA-1-012 | API连通性 | `/admin/onboarding/webhook-jobs` | API 异常: /api/v1/admin/onboarding/webhook-jobs?limit=3 | HTTP 0 | 管理员页不可用或间歇失败 |
| AFDA-1-013 | API连通性 | `/admin/operator-guide` | API 异常: /api/v1/admin/capabilities | HTTP 0 | 管理员页不可用或间歇失败 |
| AFDA-1-014 | API连通性 | `/admin/orders/00000000-0000-4000-8000-0000000000ad` | API 异常: /api/v1/admin/orders/00000000-0000-4000-8000-0000000000ad | HTTP 0 | 管理员页不可用或间歇失败 |
| AFDA-1-015 | API连通性 | `/admin/permissions` | API 异常: /api/v1/admin/capabilities | HTTP 0 | 管理员页不可用或间歇失败 |
| AFDA-1-016 | API连通性 | `/admin/provider-applications` | API 异常: /api/v1/admin/provider-applications?limit=3 | HTTP 0 | 管理员页不可用或间歇失败 |
| AFDA-1-017 | API连通性 | `/admin/region-share/reconcile` | API 异常: /api/v1/admin/capabilities | HTTP 0 | 管理员页不可用或间歇失败 |
| AFDA-1-018 | API连通性 | `/admin/tenants/scopes` | API 异常: /api/v1/admin/tenants/scopes?limit=3 | HTTP 0 | 管理员页不可用或间歇失败 |

### P2（1）

| ID | 类别 | 路由 | 标题 | 观察 | 真人影响 |
|----|------|------|------|------|----------|
| AFDA-2-019 | 边界条件 | `/auth/register` | 无法注册非 admin 旅行者 |  | RBAC 越权探针降级 |

---

## 4 · 问题矩阵（按类别）

### API连通性（18）

- **AFDA-1-001** (P1) · `/admin/approvals/00000000-0000-4000-8000-0000000000ad` — API 异常: /api/v1/admin/approvals/00000000-0000-4000-8000-0000000000ad
- **AFDA-1-002** (P1) · `/admin/community/appeals/review` — API 异常: /api/v1/admin/community/appeals?limit=3&status=pending
- **AFDA-1-003** (P1) · `/admin/community/moderation/cases` — API 异常: /api/v1/admin/community/moderation/cases?limit=3
- **AFDA-1-004** (P1) · `/admin/community/penalties` — API 异常: /api/v1/admin/community/penalties?limit=3
- **AFDA-1-005** (P1) · `/admin/community/reports` — API 异常: /api/v1/admin/community/reports?limit=3
- **AFDA-1-006** (P1) · `/admin/community/risk-signals` — API 异常: /api/v1/admin/community/risk-signals?limit=3
- **AFDA-1-007** (P1) · `/admin/compliance/requests/00000000-0000-4000-8000-0000000000ad/events` — API 异常: /api/v1/admin/compliance/data-requests?limit=3
- **AFDA-1-008** (P1) · `/admin/content/geo-validation` — API 异常: /api/v1/admin/capabilities
- **AFDA-1-009** (P1) · `/admin/drift-summary` — API 异常: /api/v1/admin/drift-summary
- **AFDA-1-010** (P1) · `/admin/fee-router` — API 异常: /api/v1/admin/fee-router/routed-events?limit=3
- **AFDA-1-011** (P1) · `/admin/growth` — API 异常: /api/v1/admin/capabilities
- **AFDA-1-012** (P1) · `/admin/onboarding/webhook-jobs` — API 异常: /api/v1/admin/onboarding/webhook-jobs?limit=3
- **AFDA-1-013** (P1) · `/admin/operator-guide` — API 异常: /api/v1/admin/capabilities
- **AFDA-1-014** (P1) · `/admin/orders/00000000-0000-4000-8000-0000000000ad` — API 异常: /api/v1/admin/orders/00000000-0000-4000-8000-0000000000ad
- **AFDA-1-015** (P1) · `/admin/permissions` — API 异常: /api/v1/admin/capabilities
- **AFDA-1-016** (P1) · `/admin/provider-applications` — API 异常: /api/v1/admin/provider-applications?limit=3
- **AFDA-1-017** (P1) · `/admin/region-share/reconcile` — API 异常: /api/v1/admin/capabilities
- **AFDA-1-018** (P1) · `/admin/tenants/scopes` — API 异常: /api/v1/admin/tenants/scopes?limit=3

### 边界条件（1）

- **AFDA-2-019** (P2) · `/auth/register` — 无法注册非 admin 旅行者

---

## 5 · 手操缺口（非阻塞）

| ID | 优先级 | 域 | 标题 | 说明 |
|----|--------|-----|------|------|
| AFDA-GAP-M01 | P2 | 批量操作 | 各列表页批量勾选/导出未逐按钮手操 | API 读路径 PASS；写/批处理仍须 UI 手测 |
| AFDA-GAP-M02 | P2 | 防误操作 | L5 确认弹窗/Idempotency-Key 未全页手操 | 20 写域 wired；须抽样高危写路径 |
| AFDA-GAP-M03 | P2 | 六角色壳 | ADM-U01 六 console 角色侧栏可见性未本轮浏览器扫 | super_admin 单会话探针；CS/Risk/Finance 仍 OPEN |
| AFDA-GAP-M04 | P2 | 审计日志 | 写操作后 audit-logs 对拍未全链手操 | 读路径 PASS；mutating 后 log 仍 OPEN |

---

## 6 · 审计范围

| 维度 | 覆盖 | 未覆盖 |
|------|------|--------|
| UI 可达 | 全静态+详情占位路由 main/h1/capabilities | 批量/导出/弹窗逐控件 |
| API | 管理员读路径 + 越权探针 | 全写路径 + 六角色矩阵 |
| RBAC | 旅行者越权 + 匿名 | ADM-U01 staging 六角色（可选 leg） |
| 会话 | logout + 重登 | 多 Tab 刷新恢复 |

**复跑：** `bash scripts/dev/run-admin-frontend-deep-audit.sh`

*Generated 2026-06-13 · AFDA v1*
