# ADM-U02 · 权限中心 · 2FA · 控制台角色审批链

**阶段：** ① 本地可验 → ② 须持久 Staging（与 ADM-U01 `ADM_U01_REQUIRE_PERSISTENT_HOST=1` 同闸）

## 能力摘要

| 项 | API / 行为 |
|----|------------|
| Shell 能力包 | **`GET /api/v1/admin/capabilities`** → **`console_role_70`** · **`permissions[]`** · **`role_matrix_preview`** · **`route_deny_matrix_preview`** · **`phase2_prep`**（**`admin_console_role_db`** · **`adm_u02_local_ready`** · **`console_role_direct_allowed`**） |
| 路由矩阵 | **`GET /api/v1/admin/rbac/route-matrix`**（与 **`/admin/permissions`** 对读） |
| 控制台角色审批 | `POST /api/v1/admin/users/:id/console-role-change-request` → `POST /api/v1/admin/approvals/:id/approve`（`admin.console_role.change`） |
| 审批驳回 | **`POST /api/v1/admin/approvals/:id/reject`**（**`reason`** 必填） |
| 直写（仅烟测） | `PUT …/console-role` 须 `TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT=1`，否则 **409** `console_role_use_approval_flow` |
| 2FA 策略 | `GET/PATCH /api/v1/admin/security/2fa-policy`；`enforced=true` 时策略内角色写操作须 `x-traveltrust-admin-2fa-session` |
| TOTP | `POST …/totp/enroll` · `POST …/totp/verify`（见 `admin_security_totp.rs`） |
| 审计落库 | 审批创建/批准同事务写 `admin_audit_logs`（`admin.console_role.change.requested` / `.approved`） |

## ① 本地验收

**账号模型：** 矩阵 [§0.1 唯一身份来源](../runbook/TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-single-source-of-identity) — **Admin Persona** = `admin_console_roles` + Permission Matrix；**Ephemeral** = 本地 smoke 动态注册。

**前提：** API `:8080` · `DATABASE_URL`（默认 `postgres://traveltrust:traveltrust@localhost:5432/traveltrust`）· migrate · **`SEED_TEST_ACCOUNTS=1`**（注册后须 `seed-test-accounts` promote + **重登**，不可仅 `psql` 改 role）。

```bash
# API + DATABASE_URL 已 migrate
bash scripts/dev/smoke-admin-adm-u02-local.sh

cd frontend && npx playwright test e2e/admin-adm-u02-permissions-local.spec.ts --project=chromium
```

- 当 API 启用 **`TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT=1`** 时，脚本 **跳过** direct `PUT …/console-role` 须 **409** 的探针，仍验审批链 + 2FA + 审计。
- 本机无 `psql` 时脚本经 **`docker exec traveltrust-postgres`** 执行 SQL（与 M-01 同源）。

**通过信号：** `GET /api/v1/admin/capabilities` → `phase2_prep.adm_u02_local_ready: true` · 末行 **`TT_ADM_U02_LOCAL: PASS`**

**文档互指：** [`frontend/app/admin/README.md`](../../frontend/app/admin/README.md) · [70 §3.0.2](../spec/70-管理员系统开发文档.md) · [04 §3.5 capabilities/RBAC 行](../spec/04-后端与API.md) · [dev-local-smoke-baseline §11](../dev-local-smoke-baseline.md)

## ② 持久 Staging（Fly URL 就绪后 · 须 U01 先绿）

**编排（推荐）：** [`PHASE2-ADMIN-STAGING-ADM-U01-U02.md`](PHASE2-ADMIN-STAGING-ADM-U01-U02.md)

```bash
export ADM_U02_REQUIRE_PERSISTENT_HOST=1
export STAGING_API_BASE=https://<fly-api>
export STAGING_DATABASE_URL=postgresql://...
bash scripts/dev/record-adm-u02-staging-evidence.sh
# 或：bash scripts/dev/record-phase2-admin-adm-u01-then-u02.sh
```


**最新 ② 证据（2026-07-01）：** `evidence/GO_staging_admin_adm_u02/run_20260701T100804Z/` · `release_gate: GO` · Sign-off `evidence/manual-uat/signoff/ADM-U02-STAGING-PERMISSIONS-SIGNOFF-20260701.md`
末行 **`TT_ADM_U02_STAGING_EVIDENCE: PASS`** · `evidence/GO_staging_admin_adm_u02/<run_id>/report.json` **`release_gate: GO`**。

## 前端

- [`/admin/permissions`](../../frontend/app/admin/permissions/page.tsx)：**`AdminPermissions*`** · 角色变更走审批；2FA 策略面板 + TOTP 面板 · **`AdminPermissionsProductionSafetyPanel`**（③ 生产 **`console_role_direct_allowed`** 诚实提示）
- Shell：**`AdminCapabilitiesShell`** · **`AdminActorCapabilityStrip`** · 首页模块由 **`GET …/capabilities`** 过滤（**`adminHomeCardCapability.ts`**）
