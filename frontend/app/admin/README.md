# Admin workspace (`/admin`)

**Phase:** ① local only — not staging/production GO.

## Access

- URL: `/admin` (and sub-routes). **Not** linked from five-main public navigation by design.
- Roles: API `require_admin_actor` accepts `admin` | `super_admin` only ([`crates/api/src/routes/admin/mod.rs`](../../../crates/api/src/routes/admin/mod.rs)).
- **RBAC v3 DB prep (①)**: `admin_console_roles` table · `PUT /api/v1/admin/users/:id/console-role` · `GET /api/v1/admin/rbac/route-matrix` · `GET/PATCH /api/v1/admin/security/2fa-policy` · [`admin_rbac.rs`](../../../crates/api/src/routes/admin/admin_rbac.rs) · UI [`/admin/permissions`](./permissions/page.tsx). Local smoke: `bash scripts/dev/smoke-admin-rbac-matrix-local.sh` (needs `DATABASE_URL`). Override: `TRAVELTRUST_ADMIN_CONSOLE_ROLE_OVERRIDE=CS` (`.env.example`).
- **ADM-U02 (①)**: 控制台角色 **`POST …/console-role-change-request`** + **`POST …/approvals/:id/approve`**（`admin.console_role.change`）· 2FA `PATCH …/2fa-policy` + TOTP · 审计 `admin_audit_logs`。直写 `PUT …/console-role` 仅当 `TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT=1`。Runbook: [`docs/runbook/ADM-U02-admin-permissions-2fa-approval.md`](../../../docs/runbook/ADM-U02-admin-permissions-2fa-approval.md) · `bash scripts/dev/smoke-admin-adm-u02-local.sh` · Playwright `e2e/admin-adm-u02-permissions-local.spec.ts`。
- **Phase ② env 模板（勿提交密钥）**: [`scripts/dev/.env.staging-admin.example`](../../../scripts/dev/.env.staging-admin.example) → `scripts/dev/.env.staging-onboarding.local`
- **Finance suite hub (①)**: [`/admin/finance-suite`](./finance-suite/page.tsx) — spec 70 七件套导航（② 深度另闸）。
- **Compliance / DSAR hub (①)**: [`/admin/compliance`](./compliance/page.tsx) → [`/admin/compliance/requests`](./compliance/requests/page.tsx).
- **Onboarding admin**: `admin_onboarding::router()` mounted · UI [`/admin/onboarding/*`](./onboarding/page.tsx).
- Local promote: `POST /auth/seed-test-accounts` with `{"promote_admin_email":"you@example.com"}` when `SEED_TEST_ACCOUNTS=1`, then **re-login**.
- Header shortcut (① L5): user menu → **管理后台** / **Admin workspace** when `GET /me` role is admin/super_admin`.

## ① L5 surfaces (2026-06-03 · ACTIVE)

| Surface | SSOT |
|--------|------|
| Home `/admin` | [`AdminHomeClient.tsx`](../../components/admin/AdminHomeClient.tsx) · [`adminHomeModel.ts`](../../lib/admin/adminHomeModel.ts) |
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

Spec context: [`docs/spec/70-管理员系统开发文档.md`](../../../docs/spec/70-管理员系统开发文档.md).

## Local verification

```bash
bash scripts/dev/verify-admin-audit-closure.sh       # ① 审计批次一键验收（推荐）
# 或分项：
bash scripts/dev/check-admin-capabilities-route.sh   # 8080 须 HTTP 401（非 404）
bash scripts/dev/smoke-admin-pages-local.sh          # ① 轻量 HTTP 探针（可选）
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

Task backlog (②③ only): [`evidence/GO_local_admin_workspace_closure/ADMIN-L5-AUDIT-TASKS.md`](../evidence/GO_local_admin_workspace_closure/ADMIN-L5-AUDIT-TASKS.md).

Optional manual: API on `:8080`, FE dev server, open `/admin` after promote + re-login. Use **`super_admin`** to see all platform write cards; plain **`admin`** hides `superAdminOnly` home cards.

## Boundaries

- **≠** staging 93 deep-matrix GO / 2FA TOTP enforced (② `ADM-U01`/`ADM-U02` formal). **ADM-U01 runbook:** [`docs/runbook/ADM-U01-staging-rbac-matrix.md`](../../../docs/runbook/ADM-U01-staging-rbac-matrix.md).
- **≠** phase ② staging or ③ production GO.
- Card copy is **product language**; REST paths live in the dev fold on the home page only.
- Inbox/KPI counts are **within list API limits**, not full-database KPIs.
