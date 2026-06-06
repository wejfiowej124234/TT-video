# Admin workspace (`/admin`)

**Phase:** ① local only — not staging/production GO.

## Access

- URL: `/admin` (and sub-routes). **Not** linked from five-main public navigation by design.
- Roles: API `require_admin_actor` accepts `admin` | `super_admin` only ([`crates/api/src/routes/admin/mod.rs`](../../../crates/api/src/routes/admin/mod.rs)). **UI 导航/RBAC banner 为 advisory**；真实安全边界在 API + [`AdminConsoleActorGate`](../../components/admin/AdminConsoleActorGate.tsx) / RSC [`adminLayoutServerGate`](../../lib/admin/adminLayoutServerGate.ts)（① · 非 ③ Production 终验）。
- **RBAC v3 DB prep (①)**: `admin_console_roles` table · `PUT /api/v1/admin/users/:id/console-role` · `GET /api/v1/admin/rbac/route-matrix` · `GET/PATCH /api/v1/admin/security/2fa-policy` · [`admin_rbac.rs`](../../../crates/api/src/routes/admin/admin_rbac.rs) · UI [`/admin/permissions`](./permissions/page.tsx). Local smoke: `bash scripts/dev/smoke-admin-rbac-matrix-local.sh` (needs `DATABASE_URL`). Override: `TRAVELTRUST_ADMIN_CONSOLE_ROLE_OVERRIDE=CS` (`.env.example`).
- **ADM-U02 (①)**: 控制台角色 **`POST …/console-role-change-request`** + **`POST …/approvals/:id/approve`**（`admin.console_role.change`）· 2FA `PATCH …/2fa-policy` + TOTP · 审计 `admin_audit_logs`。直写 `PUT …/console-role` 仅当 `TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT=1`。Runbook: [`docs/runbook/ADM-U02-admin-permissions-2fa-approval.md`](../../../docs/runbook/ADM-U02-admin-permissions-2fa-approval.md) · `bash scripts/dev/smoke-admin-adm-u02-local.sh` · Playwright `e2e/admin-adm-u02-permissions-local.spec.ts`。
- **Phase ② env 模板（勿提交密钥）**: [`scripts/dev/.env.staging-admin.example`](../../../scripts/dev/.env.staging-admin.example) → `scripts/dev/.env.staging-onboarding.local`
- **Finance suite hub (①)**: [`/admin/finance-suite`](./finance-suite/page.tsx) — spec 70 七件套导航（② 深度另闸）。
- **Compliance / DSAR hub (①)**: [`/admin/compliance`](./compliance/page.tsx) → [`/admin/compliance/requests`](./compliance/requests/page.tsx).
- **Onboarding admin**: `admin_onboarding::router()` mounted · UI [`/admin/onboarding/*`](./onboarding/page.tsx).
- Local promote: `POST /auth/seed-test-accounts` with `{"promote_admin_email":"you@example.com"}` when `SEED_TEST_ACCOUNTS=1`, then **re-login**（同步内存 store + PG；仅 `psql` 改 `users.role` **不够**）。
- Header shortcut (① L5): user menu → **管理后台** / **Admin workspace** when `GET /me` role is admin/super_admin`.

## ① L5 surfaces (2026-06-03 · ACTIVE)

### Visual SSOT（2026-06-04 · 同源 `/` 整体配色 · ①）

**页壳 = `/orders` cinematic 深壳 + `/` 氛围叠层**（无 Ken Burns 摄影）。

| Layer | Token / component |
|-------|-------------------|
| Page shell | `TT_ADMIN_ZONE_ROOT` → `#0c0a09` + `text-slate-100` |
| Ambient | `AdminZoneAmbientBackdrop` → vignette + `HOME_AMBIENT_GLOW` + dot-grid |
| Shell chrome | `TT_MARKETING_ADMIN_SHELL_BAR` · `ADMIN_SHELL_SIDEBAR_SURFACE_CLASS` |
| Widgets | `AdminWarmL5Surface` → gold frame + `ORDERS_DARK_GLASS_INNER` |
| Data tables | `ADMIN_SURFACE_PLAIN_CLASS` → white `bg-bg-console` lift |
| Primary CTA | `TT_MARKETING_BTN_PRIMARY_WARM_WIDGET` |
| Body text on dark | `ADMIN_TEXT_*` · `globals.css` `[data-tt-admin-zone-content-stack]` ink remap |
| Dark panels | `ADMIN_DARK_GLASS_PANEL_*` — **no** `#faf8f6` on shell widgets |
| Secondary CTA (dark) | `ADMIN_BTN_GHOST_DARK_CLASS` · shell preview `ADMIN_SHELL_BTN_GHOST_DARK` |
| Inbox focus inset | `ADMIN_INBOX_FOCUS_INSET_CLASS` · workflow `ADMIN_INBOX_WORKFLOW_NAV_PANEL` |
| Primary CTA split | Banner inline `ADMIN_INBOX_FOCUS_CTA` · queue full-width `ADMIN_INBOX_TASK_CTA_ACTIVE` |
| Dot grid | `TT_MARKETING_ADMIN_ZONE_DOT_GRID` opacity **0.06** (quieter than `/`) |

**L5 visual audit (home):** [70 §3.0.1](../../../docs/spec/70-管理员系统开发文档.md#301-首页-l5-视觉审计清单-2026-06-04--①) · [70 §3.0.2](../../../docs/spec/70-管理员系统开发文档.md)（数据链 / L5 confirm / SWR）— contrast, focus hierarchy, forbidden cream panels. **Screenshot walkthrough (2026-06-04):** [`ADMIN-L5-HOME-SCREENSHOT-AUDIT-20260604.md`](../evidence/GO_local_admin_workspace_closure/ADMIN-L5-HOME-SCREENSHOT-AUDIT-20260604.md) — 靠色 / 套盒 / 双 primary / meta 字号 **Vis-P0–P2** backlog（① 机读仍绿）。**系统概况代码真源 (2026-06-05):** [`ADMIN-L5-HOME-SYSTEM-OVERVIEW-CODE-SSOT.md`](../evidence/GO_local_admin_workspace_closure/ADMIN-L5-HOME-SYSTEM-OVERVIEW-CODE-SSOT.md).

Spec: [86 §6.0.1 `/admin/*`](../../../docs/spec/86-UI-双系统未来风-风格与动效技术规格.md) · [70 §3.0](../../../docs/spec/70-管理员系统开发文档.md#30-admin-console-视觉与-l5-2026-06-04).

| Surface | SSOT |
|--------|------|
| Home `/admin` | [`AdminHomeClient.tsx`](../../components/admin/AdminHomeClient.tsx) · [`adminHomeModel.ts`](../../lib/admin/adminHomeModel.ts) |
| **System overview（系统概况）** | [`AdminHomeSystemOverviewSection.tsx`](../../components/admin/AdminHomeSystemOverviewSection.tsx) · [`AdminHomeSystemOverview.tsx`](../../components/admin/AdminHomeSystemOverview.tsx) · [`useAdminHomeSystemOverview.ts`](../../lib/admin/useAdminHomeSystemOverview.ts) · [`adminHomeSystemOverviewMetrics.ts`](../../lib/admin/adminHomeSystemOverviewMetrics.ts) |
| **Dangerous-write L5 confirm** | [`AdminL5ConfirmProvider.tsx`](../../components/admin/AdminL5ConfirmProvider.tsx) · [`useAdminL5ConfirmState.ts`](../../lib/admin/useAdminL5ConfirmState.ts) · mounted in [`AdminCapabilitiesShell.tsx`](../../components/admin/AdminCapabilitiesShell.tsx) |
| **List / detail SWR cache** | [`useAdminStandardListFetch.ts`](../../lib/admin/useAdminStandardListFetch.ts) · [`useAdminStandardDetailFetch.ts`](../../lib/admin/useAdminStandardDetailFetch.ts) · [`adminListFetchCache.ts`](../../lib/admin/adminListFetchCache.ts) · invalidator [`AdminListFetchCacheInvalidator.tsx`](../../components/admin/AdminListFetchCacheInvalidator.tsx) |
| Operator guide `/admin/operator-guide` | [`operator-guide/page.tsx`](./operator-guide/page.tsx) · ① 主路径动线 |
| Inbox + KPI | [`AdminHomeInboxStrip.tsx`](../../components/admin/AdminHomeInboxStrip.tsx) · [`AdminHomeKpiStrip.tsx`](../../components/admin/AdminHomeKpiStrip.tsx) |
| Card tiers + `super_admin` visibility | [`adminHomeCardCapability.ts`](../../lib/admin/adminHomeCardCapability.ts) · [`adminHomeVisibility.ts`](../../lib/admin/adminHomeVisibility.ts) · `data-tt-admin-card-tier` |
| Capability honesty strip | [`AdminActorCapabilityStrip.tsx`](../../components/admin/AdminActorCapabilityStrip.tsx) in [`layout.tsx`](./layout.tsx) |
| Onboarding ops hub | [`/admin/onboarding`](./onboarding/page.tsx) |
| Onboarding queues | `/admin/provider-applications` · `/admin/steward-applications` · `/admin/approvals` — [`AdminQueueListPageChrome.tsx`](../../components/admin/AdminQueueListPageChrome.tsx) |
| Shell bar (grouped nav) | [`AdminShellBar.tsx`](../../components/admin/AdminShellBar.tsx) · [`AdminShellNavGroup.tsx`](../../components/admin/AdminShellNavGroup.tsx) |
| Subpage breadcrumb | [`AdminLayoutSubpageNav.tsx`](../../components/admin/AdminLayoutSubpageNav.tsx) in [`layout.tsx`](./layout.tsx) — injects when subpage lacks back link |
| Dev API map | Collapsible on home — [`AdminHomeDevApiReference.tsx`](../../components/admin/AdminHomeDevApiReference.tsx) |
| Build honesty | `git_sha: unknown` → `data-tt-admin-build-git-unknown` on meta panel |

### Home · 系统概况（2026-06-05 · ① 代码真源）

**折叠策略（`adminShellUxPolicy.ts`）：** 非聚焦 · 无待办 → 默认展开；有待办 → 默认收起；**聚焦待办** → `frame="compact"` · `persistOpen={false}` · 默认收起。

| 能力 | 实现 |
|------|------|
| 指标来源 | 优先 **`GET /api/v1/admin/metrics/home-overview`**（`source`: `postgres` \| `memory`）；404 回退 **`GET /admin/users?limit=500`** 样本 |
| 标签诚实 | `postgres` →「用户（全库）」；`memory` →「用户（内存库）」；无 metrics →「用户（样本）」 |
| 控制台角色 | **`by_console_role`** 存在时标题「控制台角色分布」+ 已分配人数求和；top-4 +「另有 N 个」 |
| 链 / 滞后 | `31337`/`1337` →「本地链 · 滞后 N 块」；其它链 ID 原样 + 滞后块数 |
| 聚焦待办 | 隐藏趋势图与域健康嵌入块；inbox pending **不**重复暖色强调（hero 已在收件箱条） |
| 会话缓存 | [`adminHomeOverviewFetchCache.ts`](../../lib/admin/adminHomeOverviewFetchCache.ts) · 90s TTL · auth 变更时与列表 cache 一并失效 |

**机读：** `adminHomeL5.contract.test.ts` · `adminHomeSystemOverviewMetrics.test.ts` · `adminHomeOverviewFetchCache.test.ts`

### Dangerous-write · L5 二次确认（2026-06-05 · ①）

- **禁止** `window.confirm`（`app/admin` + `components/admin` 写路径）。
- 统一 **`AdminL5ConfirmDialog`** + **`useAdminL5ConfirmRequest`**；高危 POST/PATCH/PUT 须 **`Idempotency-Key`**（API 层）。
- **已接线域（机读 20 面）：** trust-growth · onboarding entitlement revoke · approvals · community penalties/appeals/reports/abuse/visibility · compliance DSAR update · scheduler rerun · users role · flags/policies/tenant publish · acquisition suspend · permissions TOTP / 2FA policy。
- **Contract：** [`adminL5ConfirmL5.contract.test.ts`](../../lib/admin/adminL5ConfirmL5.contract.test.ts)

### 列表 / 详情 SWR（2026-06-05 · ①）

| 层 | 范围 | Hook |
|----|------|------|
| 列表 | **41** 队列/台账页（含 `provider-applications` · `steward-applications`） | `useAdminStandardListFetch` |
| 详情 | **11** 详情页（order/dispute/user/guide/review/approval/audit-log/alert/config-release/entitlement/indexer-reconcile） | `useAdminStandardDetailFetch` |
| 失效 | 登出 / `traveltrust:auth-change` | [`resetAdminAuthSessionState`](../../lib/admin/adminAuthSessionReset.ts)（boot latch · prefetch · 全 SWR） |
| 写后失效 | L5 Confirm 成功 · 权限角色分配 | [`invalidateAdminCachesAfterWrite`](../../lib/admin/adminPostWriteCacheInvalidation.ts) + `traveltrust:admin-data-mutated` |
| Inbox 去重 | 首页四通道与列表 SWR 同源 key | [`adminHomeInboxQueueListCache.ts`](../../lib/admin/adminHomeInboxQueueListCache.ts) · [`fetchAdminQueueList.ts`](../../lib/admin/fetchAdminQueueList.ts) |
| TTL | 与列表同源 | `ADMIN_LIST_FETCH_CACHE_TTL_MS`（90s） |

**Contract：** [`adminNavPerfL5.contract.test.ts`](../../lib/admin/adminNavPerfL5.contract.test.ts) · [`adminBatchADataFreshnessL5.contract.test.ts`](../../lib/admin/adminBatchADataFreshnessL5.contract.test.ts)

### Batch A · 数据 freshness（2026-06-05 · ①）

| ID | 项 | 实现 |
|----|-----|------|
| ADM-P0-02 | capabilities 失败 · 最小侧栏 | [`adminShellCapabilitiesFailureNav.ts`](../../lib/admin/adminShellCapabilitiesFailureNav.ts) · `/admin` + `/admin/permissions` + `/admin/operator-guide` |
| ADM-P1-01 | auth-change 全链路 reset | [`adminAuthSessionReset.ts`](../../lib/admin/adminAuthSessionReset.ts) · [`AdminListFetchCacheInvalidator.tsx`](../../components/admin/AdminListFetchCacheInvalidator.tsx) |
| ADM-P1-02 | 写后统一 cache 失效 | [`useAdminL5ConfirmState.ts`](../../lib/admin/useAdminL5ConfirmState.ts) · optional `invalidateListScopes` |
| ADM-P1-03 | Inbox ↔ List SWR 去重 | [`adminHomeInboxQueueListCache.ts`](../../lib/admin/adminHomeInboxQueueListCache.ts) |

### Phase ① 满分收口 · TT-ADMIN-PHASE1-FULL-CLOSURE（2026-06-05）

**Attestation：** [`TT-ADMIN-PHASE1-FULL-CLOSURE.md`](../evidence/GO_local_admin_workspace_closure/TT-ADMIN-PHASE1-FULL-CLOSURE.md) · **P0=0 · P1=0**（① 企业审计）

| ID | 项 | SSOT |
|----|-----|------|
| ADM-P0-01 | RSC + client admin actor gate | [`adminLayoutServerGate.ts`](../../lib/admin/adminLayoutServerGate.ts) · [`AdminConsoleActorGate.tsx`](../../components/admin/AdminConsoleActorGate.tsx) |
| ADM-P0-03 | UI RBAC advisory | [`adminUiRbacAdvisory.ts`](../../lib/admin/adminUiRbacAdvisory.ts) |
| ADM-P1-04 | Shell 预览 vs API 诚实 | [`AdminConsoleRoleShellPreview.tsx`](./permissions/AdminConsoleRoleShellPreview.tsx) |
| ADM-P1-05 | inbox/operator-guide RBAC | [`adminHomeCardPermission.ts`](../../lib/admin/adminHomeCardPermission.ts) |
| ADM-P1-06 | stale-while-error | [`adminListStaleWhileErrorL5.contract.test.ts`](../../lib/admin/adminListStaleWhileErrorL5.contract.test.ts) |
| ADM-P1-07 | list bypass SSOT | [`adminListFetchBypassSSOT.ts`](../../lib/admin/adminListFetchBypassSSOT.ts) |
| ADM-P1-08 | i18n parity | [`adminLocaleParityL5.contract.test.ts`](../../lib/admin/adminLocaleParityL5.contract.test.ts) |
| ADM-P1-09 | modal a11y | [`adminModalA11yL5.contract.test.ts`](../../lib/admin/adminModalA11yL5.contract.test.ts) |
| ADM-P1-10 | 绿集并集 | [`run-admin-l5-green.sh`](../../../scripts/dev/run-admin-l5-green.sh) |

### 子页切页 Nav Perf L5（2026-06-05 · ①）

| 层 | 策略 | 实现 |
|----|------|------|
| 首屏冷启动 | capabilities 未就绪时 **全骨架** | [`AdminMainBootGate.tsx`](../../components/admin/AdminMainBootGate.tsx) + [`AdminSubpageRouteLoading.tsx`](../../components/admin/AdminSubpageRouteLoading.tsx) |
| 会话内切页 | **stale-while-navigate** + 顶栏进度 | [`AdminNavContentTransition.tsx`](../../components/admin/AdminNavContentTransition.tsx) |
| Route loading | boot 就绪 → `null`（不 blank 闪屏） | [`AdminRouteLoadingBoundary.tsx`](../../components/admin/AdminRouteLoadingBoundary.tsx) · 61× `loading.tsx` |
| Capabilities SWR | 90s 内存 · auth 失效 · 命中即 boot ready | [`adminCapabilitiesFetchCache.ts`](../../lib/admin/adminCapabilitiesFetchCache.ts) |
| 列表/详情 SWR | instant paint + 后台 refresh | [`useAdminStandardListFetch.ts`](../../lib/admin/useAdminStandardListFetch.ts) |
| Prefetch | `pointerdown` + hover + idle 分批 | 侧栏 · 顶栏 · 面包屑 · ⌘K · [`adminShellPrefetchHref.ts`](../../lib/admin/adminShellPrefetchHref.ts) |
| 最近访问预热 | idle 预热最近 4 条 | [`AdminRecentVisitsTracker.tsx`](../../components/admin/AdminRecentVisitsTracker.tsx) |
| Finance `/admin/finance` | 纳入列表 SWR（`finance-summary`） | [`useAdminFinancePage.ts`](../../app/admin/finance/useAdminFinancePage.ts) |
| Finance recon hub | 三 API **`Promise.all`** 并行 bootstrap | [`adminFinanceReconciliationBundleFetch.ts`](../../lib/admin/adminFinanceReconciliationBundleFetch.ts) |
| 首页卡片 / KPI / 收件箱 | `AdminShellPrefetchLink` + idle 卡片预热 | [`AdminShellPrefetchLink.tsx`](../../components/admin/AdminShellPrefetchLink.tsx) · [`AdminHomeClient.tsx`](../../components/admin/AdminHomeClient.tsx) |

**诚实边界：** ① 本地 dev（Turbopack 冷编译）仍可能比 production 慢；本方案优化 **重复切页 / 缓存命中 / 骨架闪屏**，**非** ② staging 全矩阵 GO。

Spec context: [`docs/spec/70-管理员系统开发文档.md`](../../../docs/spec/70-管理员系统开发文档.md) · **§3.0.2**。

## Local verification

```bash
bash scripts/dev/verify-admin-audit-closure.sh       # ① 审计批次一键验收（推荐）
# 或分项：
bash scripts/dev/check-admin-capabilities-route.sh   # 8080 须 HTTP 401（非 404）
bash scripts/dev/smoke-admin-pages-local.sh          # ① M-03 · HTTP 面探针
bash scripts/dev/smoke-admin-rbac-matrix-local.sh    # ① M-01 · RBAC + console_role（SEED_TEST_ACCOUNTS=1 · docker postgres）
bash scripts/dev/smoke-admin-adm-u02-local.sh        # ① M-02 · 审批链 + 2FA + 审计 · TT_ADM_U02_LOCAL: PASS
bash scripts/dev/run-admin-l5-green.sh
# ① 剩余项本地预备（L5 + RBAC + ADM-U02 + Shell 预览矩阵 · 非 ② GO）：
bash scripts/dev/run-admin-remaining-local-prep.sh
# 或仅 ADM-U01 子集：
bash scripts/dev/run-admin-adm-u01-local-prep.sh
bash scripts/dev/run-admin-adm-u02-local-prep.sh
# ADM_U02_LOCAL_PREP=1 bash scripts/dev/run-admin-adm-u02-local-prep.sh  # + Playwright
# ② 脚本链自检（不触 Staging）：
bash scripts/dev/check-admin-phase2-prep-toolchain.sh --with-l5
# or combined with Web3 ① green:
bash scripts/dev/run-admin-web3-l5-green.sh
```

**Capabilities 503 / `admin_capabilities_route_missing`：** Next 代理正常但 8080 为旧 API → 重启 `traveltrust-api`（见上探针）；须 **admin/super_admin 会话登录**（非仅钱包）。

Task backlog (②③ only): [`evidence/GO_local_admin_workspace_closure/README.md`](../evidence/GO_local_admin_workspace_closure/README.md) · [`ADMIN-L5-PHASE-GAP-TASK-LIST.md`](../evidence/GO_local_admin_workspace_closure/ADMIN-L5-PHASE-GAP-TASK-LIST.md) · ① 闭环 [`ADMIN-L5-AUDIT-TASKS.md`](../evidence/GO_local_admin_workspace_closure/ADMIN-L5-AUDIT-TASKS.md).

## 技术文档互指（对齐代码 · ①）

| 文档 | 用途 |
|------|------|
| **本文档** | 代码 SSOT · 路由 · L5 · smoke |
| [`docs/spec/70-管理员系统开发文档.md`](../../../docs/spec/70-管理员系统开发文档.md) **§3.0.2** | 首页数据链 · L5 confirm · SWR · smoke |
| [`docs/spec/04-后端与API.md`](../../../docs/spec/04-后端与API.md) **§3.5** | Admin HTTP 契约表 |
| [`docs/spec/13-1-UI产品级SSOT与页面规范.md`](../../../docs/spec/13-1-UI产品级SSOT与页面规范.md) **表 2-补充** | 各 `/admin/*` Partial 能力 |
| [`ADMIN-L5-HOME-SYSTEM-OVERVIEW-CODE-SSOT.md`](../evidence/GO_local_admin_workspace_closure/ADMIN-L5-HOME-SYSTEM-OVERVIEW-CODE-SSOT.md) | 系统概况 |
| [`docs/dev-local-smoke-baseline.md`](../../../docs/dev-local-smoke-baseline.md) **§11** | 本地烟测命令 |
| [`docs/runbook/ADM-U02-admin-permissions-2fa-approval.md`](../../../docs/runbook/ADM-U02-admin-permissions-2fa-approval.md) | RBAC · 2FA · 审批链 |

Optional manual: API on `:8080`, FE dev server, open `/admin` after promote + re-login. Use **`super_admin`** to see all platform write cards; plain **`admin`** hides `superAdminOnly` home cards.

## Boundaries

- **≠** staging 93 deep-matrix GO / 2FA TOTP enforced (② `ADM-U01`/`ADM-U02` formal). **ADM-U01 runbook:** [`docs/runbook/ADM-U01-staging-rbac-matrix.md`](../../../docs/runbook/ADM-U01-staging-rbac-matrix.md).
- **≠** phase ② staging or ③ production GO.
- Card copy is **product language**; REST paths live in the dev fold on the home page only.
- Inbox/KPI counts are **within list API limits**, not full-database KPIs.
