# GO_95 · §11.1 · Auth 扩展面（旁证 · 2026-04-22）

## §1 范围（代码真值）

- **`crates/api/src/routes/auth.rs`** **`Router::new()`** 挂载 **9** 条 **`POST /auth/*`**：
  - **`/auth/register`**、**`/auth/login`**、**`/auth/logout`**
  - **`/auth/refresh`**（body **`refresh_token`** 或 **`Authorization: Bearer`**）
  - **`/auth/verify-email`**、**`/auth/forgot-password`**、**`/auth/reset-password`**
  - **`/auth/seed-test-accounts`**、**`/auth/seed-governance-e2e`**（**`SEED_TEST_ACCOUNTS=1`** 门）

## §2 与 **04** 对拍

- **`docs/spec/04-后端与API.md`** **`### 3.4`** 表行与 **§3.4** 散文（**`POST /auth/seed-test-accounts`** 等）已覆盖上述路径；**`router.rs`** **`auth_post_rate_limit_layer`** 与 **04 §7.8**/**Batch E/F/G** 互指一致（**不**在本包重述阈值）。

## §3 `read_contract_route_guard`（若适用）

- **`crates/api/src/routes/read_contract_route_guard.rs`** **无** **`/auth`** 字面量表 — **N/A**（该守卫主锚 **admin/meta/governance** 等 JSON 契约扇面；**不**表示 **`/auth`** 无 HTTP 契约，**以 04 + 门禁脚本为准**）。

## §4 前端 **`api.ts`**

- **`frontend/lib/api.ts`** **`routes.auth`**：**`seedTestAccounts`**、**`seedGovernanceE2e`**、**`refresh`**、**`verifyEmail`**、**`forgotPassword`**、**`resetPassword`** 与 **`auth.rs`** 路径前缀同源。

## §5 本轮命令证据

- **`bash scripts/run-check-04-routes.sh`** → **exit 0**（含 **`check-04-api-ts-routes-vs-doc-34.py`** **178** 条 **`/auth|/api/v1|/meta|/health`** 归一比对 **04**）。
- **`cargo test -p traveltrust-api auth_register_login_logout_db_api_tests`** → **4 passed**（本机已设 **`DATABASE_URL`** 时；与 **§8.2 F-001～006** **PG·IT** 子链同源，**不**单独闭 **`forgot-password`/`reset-password`/`verify-email`/`refresh`** 全 HTTP 矩阵）。

## §6 诚实边界（禁止机读扇面当闭证）

- **不**新增 **F-034**：**§11.1** 本条标 **`[x]`** 表示 **已并入 §3 F-001 / F-002 / F-006 备注** + **04** 已登记，**非** **§8.2** **93 / E2E / 行完成** 升格。
- **`POST /auth/forgot-password`** / **`reset-password`** / **`verify-email`** / **`refresh`** **无** 对标 **`auth_register_login_logout_db_api_tests`** 之 **全路径 Router::oneshot** 专母文件（与 **§8.2** **API·IT `[ ]`**、**ISS-007** 脚注一致）。
- **`seed-*`**：**403** **`seed_test_accounts_disabled`** 当 **`SEED_TEST_ACCOUNTS≠1`**；**生产**不得依赖其为产品能力。
