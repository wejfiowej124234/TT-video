# GO_95 · §8.2 · F-006～F-010 生产级四验证据 · 2026-04-21

与 **[`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md`](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md)** **§3**/**§8.2** 对读；**不**替代 **93 §7.1** / **R-001**。

---

## 1 · §3 对读

| F | 能力 | 前端 | API（摘要） | 备注 |
|---|------|------|-------------|------|
| **F-006** | 改密码 | `/me/password` | `PUT /api/v1/me/password` | **READY*** |
| **F-007** | 头像 | `/me` | `POST …/profile-avatar`（presign/commit） | **PARTIAL**；**API·IT** 见 **ISS-008** |
| **F-008** | 创建订单 | `/orders/new` | `POST /api/v1/orders` | **READY*** |
| **F-009** | 订单读 | `/orders`、`/escrow/[id]` | `GET /api/v1/orders`、详情 | **PARTIAL**（投影/链读） |
| **F-010** | Mock 支付 | `/pay` | `POST …/mock-pay` | **§3 NOT_READY**；闸 **ISS-001** 已闭 |

---

## 2 · 四验摘要

| 验证 | F-006 | F-007 | F-008 | F-009 | F-010 |
|------|-------|-------|-------|-------|-------|
| **代码** | **`me` password`**；**`chain_off::auth`** | **`storage/profile_avatar_presign.rs`** | **`chain_off` orders**；**`routes/orders`** | **`routes/orders/tests/suite`** | **`mutations.rs` mock-pay**；**`travelTrustUiGuards`** |
| **路由** | 全批 | **`run-check-04-routes.sh` exit 0** | 同左 | 同左 | 同左 |
| **状态** | **PG·IT**：**`put_me_password_revokes_pg_session_login_with_new_password`**（**`auth_register_login_logout_db_api_tests`**） | 无 **Router+PG+桶** 全链 IT | 内存链 **`p21_order_create_accept_mock_pay_confirm`** | **`b102_*` SSOT** 与 DB 过滤叙事 | 部署变量 **`TRAVELTRUST_*`** 闸 |
| **mock / 真** | **UT**：**`memory_mode_removes_all_sessions_after_password_change`** **1 passed**；**负例**：**`put_me_password_wrong_old_password_returns_401`**（**`auth_logout_api_tests`**） | **`cargo test -p traveltrust-api profile_avatar_presign`** **4 passed** | **`p21_order_create_accept_mock_pay_confirm`** **1 passed** | **`b102_get_orders_chain_scope_matches_db_ssot_and_filters_rows`** **1 passed** | **`order_mock_pay_env_tests`** **3 passed**；前端 **`npx vitest run lib/travelTrustUiGuards.test.ts`**（见 **95 §8.2** **F-010** 脚注） |

---

## 3 · §8.2 五格（本批诚实结论）

| 列 | F-006 | F-007 | F-008 | F-009 | F-010 |
|----|-------|-------|-------|-------|-------|
| **UT** | **[x]** | **[x]** | **[x]** | **[x]** | **[x]** |
| **API·IT** | **[x]**（同 **F-001～006** **PG·IT** 文件内 **`put_me_password_*`**） | **`[x]`**（**本机子链**：**`me_profile_avatar_db_api_tests`** + **`me_profile_avatar_http_contract_tests`** **presign/commit** **401/503**；**`presign`→桶 PUT→`commit` 成功链** 仍 **ISS-008** / **270**） | **`[ ]`** | **`[ ]`** | **`[ ]`** |
| **93** | **`[ ]`** | **`[ ]`** | **`[ ]`** | **`[ ]`** | **`[ ]`** |
| **E2E** | **`[ ]`** | **`[ ]`** | **`[ ]`** | **`[ ]`** | **`[ ]`** |
| **负例** | **[x]** | **[x]** | **[x]** | **[x]** | **[x]** |
| **行完成** | **`[ ]`** | **`[ ]`** | **`[ ]`** | **`[ ]`** | **`[ ]`** |

**93 映射（仍未闭）**：**F-006** → **93 §1 · A-PWD-001**（MANUAL-P1，须「改密后旧密不可登」全证据）；**F-008** → **B-ORD-001**；**F-009** → **B-ORD-003** 等；**F-010** → **B 域 mock-pay**（与 **§3 NOT_READY** 一致）。**E2E**/**93**/**行完成** 仍受 **ISS-007** 约束（**v1.4.65** 起 **`build.yml` · `e2e`** 已接 **Postgres + `DATABASE_URL`**；**须** **CI 绿存档**/**`report.json`** 方可勾母表，见 **95 §9 ISS-007**）。

---

## 4 · 本机已跑命令（登记日）

```bash
bash scripts/run-check-04-routes.sh
# exit 0

cargo test -p traveltrust-api chain_off::auth::put_me_password_session_invalidation_tests
# 1 passed

cargo test -p traveltrust-api auth_register_login_logout_db_api_tests
# 含 put_me_password_revokes_* — 须 DATABASE_URL；有 PG 时 4 passed（与 F-001～005 同文件）

cargo test -p traveltrust-api profile_avatar_presign
# 4 passed

cargo test -p traveltrust-api chain_off::tests_guides_me_orders::p21_order_create_accept_mock_pay_confirm
# 1 passed

cargo test -p traveltrust-api b102_get_orders_chain_scope_matches_db_ssot_and_filters_rows
# 1 passed

cargo test -p traveltrust-api order_mock_pay_env_tests
# 3 passed

cd frontend && npx vitest run lib/travelTrustUiGuards.test.ts
# Test Files 1 passed; Tests 2 passed（**F-010** UI 闸）
```

---

## 5 · **v1.4.67** 机读复跑（本机 · `DATABASE_URL` 已设 · 2026-04-21）

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api chain_off::auth::put_me_password_session_invalidation_tests`** | **1 passed**（**F-006** 内存吊销） |
| **`cargo test -p traveltrust-api put_me_password_wrong_old_password_returns_401`** | **1 passed**（**F-006** **负例** · **`auth_logout_api_tests`**） |
| **`cargo test -p traveltrust-api auth_register_login_logout_db_api_tests`** | **4 passed**（含 **`put_me_password_revokes_pg_session_login_with_new_password`** → **F-006** **PG·IT**） |
| **`cargo test -p traveltrust-api profile_avatar_presign`** | **4 passed**（**F-007** **UT**，**非** **API·IT** 全链） |
| **`cargo test -p traveltrust-api chain_off::tests_guides_me_orders::p21_order_create_accept_mock_pay_confirm`** | **1 passed**（**F-008**） |
| **`cargo test -p traveltrust-api b102_get_orders_chain_scope_matches_db_ssot_and_filters_rows`** | **1 passed**（**F-009**） |
| **`cargo test -p traveltrust-api order_mock_pay_env_tests`** | **3 passed**（**F-010** API 闸） |
| **`cd frontend && npx vitest run lib/travelTrustUiGuards.test.ts`** | **2 passed**（**F-010** UI 闸） |

**§8.2 诚实结论不变**：**F-006** **API·IT** 仍落在 **`auth_register_login_logout_db_api_tests`** 与 **§8.2 F-001～006** 同源；**F-007** **API·IT** 母表 **`[x]`** 与 **无 S3 真桶** 子链一致，**不**闭 **ISS-008**；**F-008～010** **API·IT**/**93**/**E2E**/**行完成** 仍 **`[ ]`**（**ISS-007** / **§3 F-010 NOT_READY** 全栈语义）。

---

## 6 · Agent 本机复跑（2026-04-22 · Cursor · Windows）

**`DATABASE_URL`** = **`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`**（与 **F-001～005** 证据包同源）。

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api chain_off::auth::put_me_password_session_invalidation_tests`** | **1 passed**（**F-006** 内存吊销） |
| **`cargo test -p traveltrust-api put_me_password_wrong_old_password_returns_401`** | **1 passed**（**F-006** **负例**） |
| **`cargo test -p traveltrust-api auth_register_login_logout_db_api_tests`** | **4 passed**（含 **`put_me_password_revokes_pg_session_login_with_new_password`** → **F-006** **PG·IT**） |
| **`cargo test -p traveltrust-api profile_avatar_presign`** | **7 passed**（**`storage::profile_avatar_presign`** **UT** + 与 **presign** 同过滤路径下的 **`me_profile_avatar_http_contract_tests`** 子集） |
| **`cargo test -p traveltrust-api chain_off::tests_guides_me_orders::p21_order_create_accept_mock_pay_confirm`** | **1 passed**（**F-008**） |
| **`cargo test -p traveltrust-api b102_get_orders_chain_scope_matches_db_ssot_and_filters_rows`** | **1 passed**（**F-009**） |
| **`cargo test -p traveltrust-api order_mock_pay_env_tests`** | **3 passed**（**F-010** API 闸） |
| **`cargo test -p traveltrust-api me_profile_avatar_db_api_tests`** | **1 passed**（**F-007** **PG·本地头像**） |
| **`cargo test -p traveltrust-api me_profile_avatar_http_contract_tests`** | **6 passed**（**F-007** **HTTP 负例/503**） |
| **`cd frontend && npx vitest run lib/travelTrustUiGuards.test.ts`** | **2 passed**（**F-010** **`allowChainOffMockPayUi`** 等） |

**四验结论**：**F-006** 代码/路由/状态/PG+UT **成立**；**F-007** 代码/路由/UT+本机 **API·IT 子链** **成立**，**对象存储成功路径** **不**宣称生产闭证（**ISS-008**）；**F-008～009** **UT+负例+内存/DB 叙事** **成立**，**无** 对标 **`auth_register_*`** 之 **Router+PG 订单专母** **API·IT**；**F-010** **UT+负例+Vitest** **成立**，**§3** **NOT_READY** 与 **93 B-ESC-001**/**E2E** 仍须 **ISS-007**/**全栈** 证据。**行完成**/**§3.1** **均 `[ ]`**。

---

## 10 · Cursor agent 复跑（**2026-04-22** · 本对话 · **F-006～F-010**）

**`DATABASE_URL`** = **`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`**（**已迁移**库；与 **F-001～005** 证据包同源）。

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api chain_off::auth::put_me_password_session_invalidation_tests`** | **1 passed**（**F-006** 内存吊销） |
| **`cargo test -p traveltrust-api put_me_password_wrong_old_password_returns_401`** | **1 passed**（**F-006** **负例**） |
| **`cargo test -p traveltrust-api auth_register_login_logout_db_api_tests -- --test-threads=1`** | **4 passed**（含 **`put_me_password_revokes_pg_session_login_with_new_password`** → **F-006** **PG·IT**） |
| **`cargo test -p traveltrust-api storage::profile_avatar_presign`** | **4 passed**（**F-007** **`validate_*` UT**） |
| **`cargo test -p traveltrust-api me_profile_avatar_db_api_tests -- --test-threads=1`** | **1 passed**（**F-007** **本机头像 PG·子链**） |
| **`cargo test -p traveltrust-api me_profile_avatar_http_contract_tests -- --test-threads=1`** | **6 passed**（**F-007** **HTTP 负例**；**不**闭 **S3 PUT→commit**） |
| **`cargo test -p traveltrust-api p21_order_create_accept_mock_pay_confirm`** | **1 passed**（**F-008**） |
| **`cargo test -p traveltrust-api b102_get_orders_chain_scope_matches_db_ssot_and_filters_rows`** | **1 passed**（**F-009**） |
| **`cargo test -p traveltrust-api order_mock_pay_env_tests`** | **3 passed**（**F-010** **部署闸**） |
| **`cd frontend && npx vitest run lib/travelTrustUiGuards.test.ts`** | **2 passed**（**F-010** **UI 闸**） |

**母表**：**§8.2** **F-006**/**F-007** **UT**/**API·IT**/**负例** 仍 **`[x]`**；**F-008～010** **API·IT**/**93**/**E2E**/**行完成** 仍 **`[ ]`**；**§3.1** **仍禁勾**（**ISS-002**/**ISS-007**；**F-007** **ISS-008** 残余；**F-010** **§3 NOT_READY**）。
