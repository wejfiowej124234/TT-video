# GO_95 · §8.2 · F-006～F-010 审计复跑 · 2026-04-22

对应 **`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md`** **§3**、**§8.2** 行 **F-006～F-010**。**不**宣称 **93 PASS** / **E2E 闭证** / **行完成** / **§3.1**（**ISS-007**、**ISS-002**；**F-007** 另受 **ISS-008**；**F-010** **§3 NOT_READY**）。

## 1 · 环境

| 项 | 值 |
|----|-----|
| **`DATABASE_URL`** | `postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust` |

## 2 · 命令与机读结果（本轮 Cursor Agent）

| 命令 | 结果 |
|------|------|
| `bash scripts/run-check-04-routes.sh` | **exit 0** |
| `cargo test -p traveltrust-api put_me_password_session_invalidation` | **1 passed**（内存 `ChainOffStore`） |
| `cargo test -p traveltrust-api put_me_password_revokes_pg_session` | **1 passed**（**PG** `auth_register_login_logout_db_api_tests`） |
| `cargo test -p traveltrust-api me_profile_avatar` | **7 passed** |
| `cargo test -p traveltrust-api profile_avatar_presign` | **7 passed** |
| `cargo test -p traveltrust-api p21_order_create_accept_mock_pay_confirm` | **1 passed**（内存 `ChainOffStore`，`db_pool: None`） |
| `cargo test -p traveltrust-api order_create_forbidden_when_tourist` | **2 passed** |
| `cargo test -p traveltrust-api order_mock_pay_forbidden_when_tourist_becomes_restricted` | **1 passed** |
| `cargo test -p traveltrust-api b102_get_orders_chain_scope_matches_db_ssot_and_filters_rows` | **1 passed** |
| `cargo test -p traveltrust-api b097_get_order_by_id_order_object_has_projection_terminal_key` | **1 passed** |
| `cargo test -p traveltrust-api order_mock_pay_env_tests` | **3 passed** |
| `cd frontend && npx vitest run lib/travelTrustUiGuards.test.ts` | **2 passed** |

## 3 · 四验诚实结论

- **F-006**：PG 改密吊销会话 **成立**；forgot/reset 全路径 oneshot 仍缺（§3 备注）。
- **F-007**：**PARTIAL**；本地 PG 头像 + HTTP 负例 **成立**；**S3 成功链 ISS-008**。
- **F-008**：**主路径 UT 为内存态**，**不等价** §3「PG orders+itineraries tx」终验；KYC/risk **403** 负例 **成立**。
- **F-009**：**b102/b097** UT **成立**；**93 B-ORD-003** 仍 **ISS-007**。
- **F-010**：环境闸 **3/3** + Vitest **成立**；**§3 NOT_READY** 不变。

## 4 · §8.2 五格

与母表一致：**F-008～010** **API·IT**/**93**/**E2E**/**行完成** 均为 **`[ ]`**；**§3.1** 禁勾。

## 5 · §9

不另开 **ISS**（**ISS-007**/**ISS-008**/**F-010 NOT_READY** 已覆盖）。
