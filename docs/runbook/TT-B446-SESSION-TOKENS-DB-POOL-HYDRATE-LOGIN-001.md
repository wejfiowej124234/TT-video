# TT-B446-SESSION-TOKENS-DB-POOL-HYDRATE-LOGIN-001 · `db_pool` 会话：`hydrate` 后旧 token + 登录换发新 token

**母表**：[B-446](../任务母表.md)

**依赖真值**：[TT-B445-HYDRATE-AND-DEV-STACK-PORTS-001](./TT-B445-HYDRATE-AND-DEV-STACK-PORTS-001.md)（`hydrate_from_db` 灌回 `users` / `sessions`）

---

## 1. 验收（封口条件）

### 1.1 环境

- **`DATABASE_URL`** 指向已迁移的 PostgreSQL；未设置则相关测试 **跳过**（不当作本卡失败）。

### 1.2 机读（两条契约）

```bash
DATABASE_URL=postgres://… cargo test -p traveltrust-api b446_ -- --nocapture
```

1. **`b446_hydrated_legacy_token_authenticates_get_me`**：对 `users` + `sessions` 做 `insert_*` 后 **`hydrate_from_db`**，再用 **旧** `tts_*` Bearer 走 **`extract_user_with_session_check`**（**`db_pool`**）与 **`get_me_impl`**，须解析到同一用户且邮箱一致。语义：**进程内 `hydrate` 后，持久化 session token 仍可作为认证真值**（类比重启后旧 token 仍可用）。
2. **`b446_login_issues_distinct_token_prior_session_row_remains_valid`**：在已有 session 行 + hydrate 之后调用 **`auth_login`**，须 **新 token 字符串 ≠ 旧 token**，且 **两条 Bearer 均解析到同一 `user_id`**，且该用户 **`sessions` 行数 ≥ 2**。语义：**新登录换发 token 时，服务端默认不删除同用户其它 session 行**。

**实现**：`crates/api/src/routes/auth_session_contract_b446.rs`（直接调用与 HTTP 同源的 handler / 提取逻辑，不经 Axum `oneshot`）。

---

## 2. 产品与文档边界（非服务端自动行为）

- **PostgreSQL 持久化 sessions**：服务端以 DB 为 SSOT 时，**多条有效 session 行可并存**，除非显式 **登出 / 删除 session** 等路径删除行。
- **产品侧「登录后只保留最新 token」**：属于 **客户端存储与 UX 策略**（例如只覆盖 localStorage 里最后一个 token），**不要**与「服务端自动吊销其它会话」混为一谈；若产品需要「单端登录」，须在规格中单独立项（例如登出其它设备、或服务端策略变更），**不在本卡默认验收范围内**。

---

## 3. 非目标

- **不** 要求完整 HTTP E2E（本卡以 **`db_pool` + hydrate + 同源 handler** 机读为主）。
- **不** 在本卡验收「主动 revoke / 单 session 策略」——见 **§2**。

---

**文档版本**：1.0 · 2026-04-17
