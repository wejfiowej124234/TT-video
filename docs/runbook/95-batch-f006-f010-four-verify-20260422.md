# 95 · §3 批次 F-006～F-010 · 四验 + §8.2 对齐（2026-04-22）

> 与 **`../spec/95-全链路生产就绪检查清单与完成度矩阵.md`** **§3**/**§8.2**/**§9** 对读；**不**宣称 **93 PASS** / **E2E 归档** / **§8.2「行完成」** / **§3.1 `[x]`**（**ISS-007**/**ISS-002**）；**F-007** **S3 成功链**仍 **ISS-008**；**F-010** **§3 NOT_READY** 不变。

## 1. 环境

- **`DATABASE_URL`**：`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`（**`docker compose` · postgres healthy**）
- **前端**：仓库 **`frontend/`**，**Vitest** **v2.1.9**

## 2. 路由验证

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
bash scripts/run-check-04-routes.sh
```

**结果**：**exit 0**（**178** 路径 **`api.ts`↔04**）。

## 3. 机读命令与结果

| 命令 / 过滤 | passed | failed | 备注 |
|-------------|--------|--------|------|
| `cargo test -p traveltrust-api put_me_password_session_invalidation_tests` | 1 | 0 | 内存态改密吊销 **sessions** |
| `cargo test -p traveltrust-api put_me_password_revokes_pg_session_login_with_new_password` | 1 | 0 | **Router+PG** **`PUT /api/v1/me/password`** |
| `cargo test -p traveltrust-api profile_avatar_presign::` | 4 | 0 | **`storage/profile_avatar_presign.rs`** **`validate_*`** |
| `cargo test -p traveltrust-api me_profile_avatar` | 7 | 0 | **DB 子链 1** + **HTTP 契约 6**（**无 S3 真桶**） |
| `cargo test -p traveltrust-api p21_order_create_accept_mock_pay_confirm` | 1 | 0 | **`chain_off`** 内存主路径 |
| `cargo test -p traveltrust-api b102_get_orders_chain_scope_matches_db_ssot` | 1 | 0 | **须 PG** |
| `cargo test -p traveltrust-api b097_get_order_by_id_order_object_has_projection_terminal_key` | 1 | 0 | **须 PG** |
| `cargo test -p traveltrust-api order_mock_pay_env_tests` | 3 | 0 | 部署闸 **403** 语义（**无** **`DATABASE_URL`** 依赖） |
| `cd frontend && npx vitest run lib/travelTrustUiGuards.test.ts` | 2 | 0 | **`allowChainOffMockPayUi`** |

**F-006 负例（与 F-001 批次同源，本批未重跑）**：**`auth_logout_api_tests::put_me_password_wrong_old_password_returns_401`** — 见 **`docs/runbook/95-batch-f001-f005-four-verify-20260422.md`** 或 **`cargo test -p traveltrust-api auth_logout_api_tests`**。

## 4. 分 F 四验（§3）

| F | 代码 | 路由 | 状态 | mock·PG / 说明 |
|---|------|------|------|----------------|
| **F-006** | **`chain_off/auth.rs`** **`put_me_password`**；**`auth_register_login_logout_db_api_tests`** | **`PUT /api/v1/me/password`**；**`POST /auth/forgot-password`/`reset-password`** 在 **`routes/auth.rs`** **无** 对标 **`auth_register_*` 风格** 全路径 **oneshot**（**§3** 行注） | **PG**：改密吊销 **`sessions`**；**内存**：**`put_me_password_session_invalidation_tests`** | **1+1** 绿；**forgot/reset** **API·IT** 仍 **§8.2 脚注 / ISS-007** 同源缺口 |
| **F-007** | **`routes/me.rs`** **`post_me_profile_avatar_*`**；**`storage/profile_avatar_presign`** | **`POST …/profile-avatar`** **presign/commit** | **PG**：**`me_profile_avatar_db_api_tests`**；**HTTP**：**503/401** 负例 | **S3 presign→PUT→commit 成功链** **未**验 → **ISS-008**；**§3 PARTIAL** |
| **F-008** | **`orders`/`chain_off`** 创建路径；**`p21_order_create_accept_mock_pay_confirm`** | **`POST /api/v1/orders`** **在 04 扇面** | **内存+PG**：**p21** 为 **chain_off** 集成测，**非** 独立 **Router+PG** **订单专母** | **93/B-ORD**/**§8.2·F-008·API·IT `[ ]]`** 口径**不变** |
| **F-009** | **`routes/orders/tests/suite`** | **`GET /api/v1/orders`** 等 | **b102**/**b097** 断言 **PG** 与 **projection** 键 | **2** 测绿；**hydrate+内存** 与 **§3 PARTIAL** 一致 |
| **F-010** | **`order_mock_pay_impl`**；**`mutations.rs`** **`order_mock_pay_denied_by_deploy_env`**；**`travelTrustUiGuards.test.ts`** | **`POST …/orders/:id/mock-pay`**；**`/pay`** UI 闸 | **403** **`mock_pay_forbidden`** 环境闸 | **3** API UT + **2** Vitest；**§3 NOT_READY** / **全栈 GO** 仍否 |

## 5. §8.2 五格（相对母表 · 无改表勾号）

| F | UT | API·IT | 93 | E2E | 负例 | 行完成 |
|---|-----|--------|-----|-----|------|--------|
| F-006 | 绿 | 母表已为 **`[x]`**（**不含** forgot/reset 全路径） | `[ ]` | `[ ]` | 绿 | `[ ]` |
| F-007 | 绿 | 母表 **`[x]`**（子链） | `[ ]` | `[ ]` | 绿 | `[ ]` |
| F-008 | 绿 | `[ ]` | `[ ]` | `[ ]` | 部分 | `[ ]` |
| F-009 | 绿 | `[ ]` | `[ ]` | `[ ]` | 部分 | `[ ]` |
| F-010 | 绿 | `[ ]` | `[ ]` | `[ ]` | 绿 | `[ ]` |

## 6. §9

- **不新增 ISS**：**forgot/reset** 缺口见 **§3 F-006**/**§11.1 Auth 扩展**/**ISS-007**；**F-007** **ISS-008**；**F-010** **NOT_READY** 与 **ISS-001** 已闭闸叙事并存。
