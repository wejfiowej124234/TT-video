# B-461 / TT-A01 · 认证与 `/me` 对齐表

**母表**：[B-461](../../docs/任务母表.md) · **Runbook**：[TT-A01](../../docs/runbook/TT-A01-FRONTEND-API-DB-ALIGN-AUTH-001.md)

**本文件**：页面 → API → DB/会话 真值与 **04 / 14** 互指；**2026-04-17** 批次含 **`/me` 与 `/me/stats` 统计同源修复**（`crates/api/src/chain_off/me.rs` **`me_stats_value_for_user`**）。

---

## 1 · 会话与鉴权（opaque token · sessions · X-User-Id）

| 项 | 真值 |
|----|------|
| 登录/注册返回 | 根级 **`status: ok`**，**`token`** 为不透明字符串（**`tts_<uuid>`** 有 DB；纯内存 **`bearer_<user_uuid>`**） |
| 服务端存储 | 有 **`DATABASE_URL`**：**`sessions`** 表存 **`token` → `user_id`**（与 **TT-B446** hydrate 互证） |
| 请求鉴权 | **`Authorization: Bearer <token>`** 优先；有 DB 时 **仅** **`sessions`** 命中接受 Bearer，**不**回退伪造 **`X-User-Id`**（见 **`crates/api/src/state.rs`** **`extract_user_with_session_check`**） |
| **`X-User-Id`** | 无 Bearer 时的联调/过渡；生产建议强门禁（**`STRICT_SESSION_GATE`** 等，见 **04 §二**） |
| 前端 | **`localStorage`** **`traveltrust_session_token`** / **`traveltrust_user_id`**；**`getAuthHeaders`** 优先 Bearer（**`frontend/lib/apiClient/core.ts`**） |

**04 / 14**：**04 §二 2.1**、**§3.1** `POST /auth/login` 行；**14 §2.1** `POST /auth/login`、`GET /api/v1/me` 表注。

---

## 2 · `GET /api/v1/me` 与 `GET /api/v1/me/stats` · `stats` 同源

| 项 | 说明 |
|----|------|
| 实现 | **`chain_off::me_stats_value_for_user`**（**`crates/api/src/chain_off/me.rs`**） |
| **`GET /api/v1/me`** | 成功体根级 **`stats`** = 上式输出 |
| **`GET /api/v1/me/stats`** | 根级 **`stats`** = 同上（**`routes/me.rs`** **`get_me_stats`**） |
| 订单参与 | 与 **`order_is_participant`** / **`order_guide_user_id`** 一致：**`orders.guide_id`** 为 **guides** 行 id，向导侧用 **`guides.user_id`** 判定，**不得**用 **`guide_id == users.id`** |

**04**：**04 §3.2** 统计摘要段（**`me_stats_value_for_user`** 句）。

---

## 3 · `GET /api/v1/me` 响应形状（字段边界）

| 块 | 主要键 / 说明 | 与 `users` 表 |
|----|----------------|---------------|
| **`user`** | **id, email, role, role_traveltrust, kyc_status, nickname, avatar_url, default_wallet_address, created_at** | **展示子集**；**不**含 **password_hash**；**email_verified_at** **默认不在** JSON（**04 §3.2** 边界句） |
| **`guide`** | 若有向导行：**id, wallet_address** | 可选 |
| **`trust`** | **kyc_status, wallet_linked, guide_registration_status, identity_status, risk_*, recommended_actions, rule, reputation…** | 规则块 + **90** 互证 |
| **`stats`** | 见 §2，随 **`users.role`** 分支 | 与 **`/me/stats`** 同源 |

**14**：**14 §2.1** **`GET /api/v1/me`** 表列「**`user`** 为 **`users`** 展示子集」。

---

## 4 · 注册 / 登录稳定错误码（`error` 键）

| HTTP | `error` | 场景 |
|------|---------|------|
| 400 | `invalid_email` | 邮箱格式/长度 |
| 400 | `password_too_short` / `password_too_long` | 密码长度 |
| 400 | `invalid_registration_role` | 非自服务 `role` |
| 409 | `email_already_registered` | 邮箱已存在 |
| 401 | `invalid_credentials` | 用户不存在或密码错误（统一码） |
| 503 | `auth_db_persist_failed` | 严格双写失败（**`TRAVELTRUST_STRICT_AUTH_DB_WRITE=1`**） |

**实现**：**`crates/api/src/chain_off/auth.rs`** · 前端映射：**`frontend/lib/apiClient/core.ts`**、**`mapAuthLoginSubmitError`**、注册页 **`registerApiCatch`**。

---

## 5 · 机读验收（TT-A01 §1）

| 命令 | 期望 |
|------|------|
| `bash scripts/run-check-04-routes.sh` | exit 0 |
| `cd frontend && npx tsc --noEmit` | 无错 |
| `cargo test -p traveltrust-api` | 绿（本批次 **996** passed） |

可选：**`DATABASE_URL=… cargo test -p traveltrust-api b446_`**（与 **TT-B446** 互证）。
