# TT-ADMIN-OPERATOR-MAP-SSOT

**Version:** 1.0.0 · **生效：** 2026-07-01  
**用途：** Production Review · 运营地图 — 每个 Admin 侧栏菜单须回答 **Source → Target → Owner**  
**导航 SSOT：** `frontend/lib/admin/adminShellSidebarModel.ts` · `adminShell*NavLinks.ts`  
**机读摘要：** [`registry/admin-platform-production-readiness.v1.yaml`](../../registry/admin-platform-production-readiness.v1.yaml)

---

## 0 · 纪律

| 问题 | 含义 |
|------|------|
| **Source** | 数据/API/表真源（读列表或写操作的 HTTP 前缀） |
| **Target** | 影响的公众前台页面或用户可见面（无公众面则 `—`） |
| **Owner** | 责任域（团队/子系统），非个人姓名 |

**Expected Difference：** Content Center（catalog/media）与 Official Ops（展示运营）**分域** — 不得混写 Source。

---

## 1 · workspace

| Menu | Source | Target | Owner |
|------|--------|--------|-------|
| `/admin` | `GET /api/v1/admin/metrics/home-overview` | — | admin-shell |
| `/admin/inbox` | 入驻/审批/举报队列 API 聚合 | — | admin-shell |
| `/admin/operator-guide` | —（文档页） | — | admin-shell |

---

## 2 · onboarding

| Menu | Source | Target | Owner |
|------|--------|--------|-------|
| `/admin/provider-applications` | `GET /api/v1/admin/provider-applications` | `/provider/register` | admin-onboarding |
| `/admin/guide-applications` | `GET /api/v1/admin/users`（向导入驻队列） | 向导入驻 | admin-onboarding |
| `/admin/steward-applications` | `GET /api/v1/admin/steward-applications` | `/steward/register` | admin-onboarding |
| `/admin/approvals` | `GET /api/v1/admin/approvals` | — | admin-onboarding |
| `/admin/onboarding` | `GET /api/v1/admin/onboarding/*` | — | admin-onboarding |
| `/admin/onboarding/entitlements` | `…/onboarding/entitlements` | 用户入驻权益 | admin-onboarding |
| `/admin/onboarding/payment-events` | `…/onboarding/payment-events` | — | admin-onboarding |
| `/admin/onboarding/webhook-jobs` | `…/onboarding/webhook-jobs` | — | admin-onboarding |
| `/admin/onboarding/compliance-audit` | `…/onboarding/compliance-audit-events` | — | admin-onboarding |

---

## 3 · operations

| Menu | Source | Target | Owner |
|------|--------|--------|-------|
| `/admin/users` | `GET /api/v1/admin/users` | `/me` | admin-operations |
| `/admin/orders` | `GET /api/v1/admin/orders` | `/orders` · `/market` | admin-operations |
| `/admin/disputes` | `GET /api/v1/admin/disputes` | `/disputes` | admin-operations |
| `/admin/guides` | `GET /api/v1/admin/guides` | `/guides` · `/market` | admin-operations |
| `/admin/reviews` | `GET /api/v1/admin/reviews` | 订单评价面 | admin-operations |

---

## 4 · content（Content Center · 冻结 1.0）

| Menu | Source | Target | Owner |
|------|--------|--------|-------|
| `/admin/content` | Hub | — | admin-content |
| `/admin/content/countries` | `GET /api/v1/admin/content/countries` | `/countries` · Catalog | admin-content |
| `/admin/content/cities` | `…/content/cities` | Catalog 城市 | admin-content |
| `/admin/content/pois` | `…/content/pois` | POI 详情 · 行程 | admin-content |
| `/admin/content/pricing` | `…/content/pricing-templates` | 报价模板 | admin-content |
| `/admin/content/hotel-tiers` | `…/content/hotel-tiers` | — | admin-content |
| `/admin/content/transport-region-rules` | `…/content/transport-region-rules` | — | admin-content |
| `/admin/content/intercity-routes` | `…/content/intercity-routes` | — | admin-content |
| `/admin/content/media-assets` | `…/content/media-assets` | 媒体资源 | admin-content |
| `/admin/content/landing-ambient` | `…/countries/:id/landing-ambient` | `/` Landing 氛围 | admin-content |
| `/admin/content/poi-images` | `…/content/poi-image-batches` | POI 配图 | admin-content |
| `/admin/content/publish-queue` | `…/content/publish-queue` | Catalog 发布 | admin-content |
| `/admin/content/revisions` | `…/content/revisions` | — | admin-content |
| `/admin/content/import-operations` | `…/content/import/history` | — | admin-content |
| `/admin/content/catalog-dashboard` | `…/content/catalog/observability` | — | admin-content |
| `/admin/content/geo-validation` | `…/content/catalog/geo-validation` | — | admin-content |
| `/admin/content/country-market` | `GET /api/v1/admin/country-market/launches` | `/market` 国家上线 | admin-content |

---

## 5 · official_ops（Official Ops 1.0 · 冻结）

| Menu | Source | Target | Owner |
|------|--------|--------|-------|
| `/admin/official` | Hub | — | admin-official |
| `/admin/official/accounts` | `GET /api/v1/admin/official/accounts` | 官方账号内容 | admin-official |
| `/admin/official/itinerary-templates` | `…/official/itinerary-templates` | 官方行程模板 | admin-official |
| `/admin/official/guides` | `…/official/guides` | `/market` 官方向导卡 | admin-official |
| `/admin/official/cold-start` | `…/official/cold-start/campaigns` | `/` Campaign 冷启动 | admin-official |
| `/admin/official/public-operations` | `…/official/public-operations/stats` | `/market` · `/` 展示统计 | admin-official |

**示例链（用户给定）：** Public Operations → Official Guides → `/market` · Content POI Images → Travel Page · Cold Start → Homepage

---

## 6 · growth

| Menu | Source | Target | Owner |
|------|--------|--------|-------|
| `/admin/growth` | Hub | — | admin-growth |
| `/admin/growth/referral-codes` | `…/growth/referral-codes` | `/me/referrals` | admin-growth |
| `/admin/growth/early-bird` | `…/growth/early-bird/stages` | — | admin-growth |
| `/admin/growth/airdrop-campaigns` | `…/growth/airdrop-campaigns` | — | admin-growth |
| `/admin/growth/kol-center` | `…/growth/kol-center` | — | admin-growth |
| `/admin/growth/reward-ledger` | `…/growth/reward-ledger` | — | admin-growth |
| `/admin/growth/anti-fraud` | `…/growth/anti-fraud/rules` | — | admin-growth |
| `/admin/growth/analytics` | `…/growth/analytics/overview` | — | admin-growth |
| `/admin/conversion-analytics` | 浏览器 PES 漏斗（`usePesAnalytics`） | `/` · 五主路由转化 | admin-growth |

---

## 7 · community

| Menu | Source | Target | Owner |
|------|--------|--------|-------|
| `/admin/community/reports` | `GET /api/v1/admin/community/reports` | `/community` | admin-community |
| `/admin/community/penalties` | `…/community/penalties` | `/community/me` | admin-community |
| `/admin/community/appeals` | `…/community/appeals` | — | admin-community |
| `/admin/community/moderation/cases` | `…/community/moderation/cases` | `/community` | admin-community |
| `/admin/community/risk-signals` | `…/community/risk-signals` | — | admin-community |
| `/admin/community/policy-change-logs` | `…/community/policy-change-logs` | — | admin-community |
| `/admin/community/ranking/snapshots` | `…/community/ranking/snapshots` | `/did-rank` | admin-community |
| `/admin/community/comments/visibility` | `…/community/comments/:id` | `/community` | admin-community |
| `/admin/community/abuse-policy` | `…/community/abuse-policy` | — | admin-community |

---

## 8 · finance

| Menu | Source | Target | Owner |
|------|--------|--------|-------|
| `/admin/finance-suite` | Hub（七件套导航） | — | admin-finance |
| `/admin/finance-reconciliation` | `…/finance/summary` · `cross-check` · `drift-summary` | — | admin-finance |
| `/admin/finance` | `…/finance/summary` | — | admin-finance |
| `/admin/fee-router` | `…/fee-router/routed-events` | 链上费用路由 | admin-finance |
| `/admin/region-vault` | `…/region-vault/forwarded-events` | 治理金库 | admin-finance |
| `/admin/region-share/reconcile` | `…/region-share/reconcile/latest` | — | admin-finance |
| `/admin/indexer` | `…/indexer/health` | — | admin-finance |
| `/admin/indexer/reconcile-reports` | `…/indexer/reconcile-reports` | — | admin-finance |
| `/admin/alerts/incidents` | `…/alerts/incidents/:id` | — | admin-finance |

---

## 9 · governance

| Menu | Source | Target | Owner |
|------|--------|--------|-------|
| `/admin/cross-check` | `GET /api/v1/admin/cross-check` | — | admin-governance |
| `/admin/drift-summary` | `…/drift-summary` | — | admin-governance |
| `/admin/governance/execution-uat` | Runbook / 证据 UI | `/governance` | admin-governance |
| `/admin/trust-growth` | `…/trust-growth/observability` | `/traveltrust` | admin-governance |

---

## 10 · more（平台 / 审计 / 配置）

| Menu | Source | Target | Owner |
|------|--------|--------|-------|
| `/admin/observability` | `…/observability/overview` | — | admin-platform-ops |
| `/admin/audit` | `…/audit-logs` | — | admin-platform-ops |
| `/admin/auth-audit-events` | `…/auth-audit-events` | `/auth/*` | admin-platform-ops |
| `/admin/config` | Hub | — | admin-platform-ops |
| `/admin/flags` | `…/flags` | 全站 Feature Flags | admin-platform-ops |
| `/admin/policies` | `…/policies` | — | admin-platform-ops |
| `/admin/secrets/metadata` | `…/secrets/metadata` | — | admin-platform-ops |
| `/admin/config/releases` | `…/config/releases` | — | admin-platform-ops |
| `/admin/lifecycle` | `…/lifecycle/state-machines` | — | admin-platform-ops |
| `/admin/api-versions` | `…/api-versions` | — | admin-platform-ops |
| `/admin/jobs` | `…/jobs` | — | admin-platform-ops |
| `/admin/approvals` | `…/approvals`（全量） | — | admin-platform-ops |
| `/admin/scheduler/jobs` | `…/scheduler/jobs` | — | admin-platform-ops |
| `/admin/tenants/scopes` | `…/tenants/scopes` | — | admin-platform-ops |
| `/admin/internal-tools/audits` | `…/internal-tools/audits` | — | admin-platform-ops |
| `/admin/media/signed-url-tokens` | `…/media/signed-url-tokens` | 媒体签发 | admin-platform-ops |
| `/admin/media/access-logs` | `…/media/access-logs` | — | admin-platform-ops |
| `/admin/compliance` | Hub | — | admin-platform-ops |
| `/admin/compliance/requests` | `…/compliance/data-requests` | DSAR | admin-platform-ops |
| `/admin/permissions` | `…/capabilities` · `…/rbac/route-matrix` | Admin RBAC 真值 | admin-platform-ops |

---

## 11 · 验证

```bash
# 侧栏路由与 SSOT 同构
rg "ADMIN_SHELL_SIDEBAR_GROUPS" frontend/lib/admin/adminShellSidebarModel.ts

# Official Ops 冻结闸
bash scripts/gates/check-official-ops-public-operations-ssot.sh

# ADM-U01 ② 证据
cat evidence/GO_staging_admin_rbac_matrix/latest-run-id.txt
python -c "import json; print(json.load(open('evidence/GO_staging_admin_rbac_matrix/latest/report.json'))['release_gate'])"
```

---

## 12 · 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-07-01 | 首版 · 91 侧栏路由 Source→Target→Owner · 对齐 Official Ops 1.0 冻结 |
