# GO_95 · §8.2 · F-007 · 本机头像 PG·HTTP IT · 2026-04-22

**母表**：**`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md`**（**Version 1.4.91**）。

**范围**：（**A**）**本机直传** — **无** **`PROFILE_AVATAR_S3_*`** 时 **`POST /api/v1/me/profile-avatar`** → **`GET /api/v1/me`**；（**B**）**`presign`/`commit`** **HTTP 负例** — 见 **§3**。**不**覆盖 **S3 `presign`→PUT→`commit` 成功链**（**§9 ISS-008** 残余）。

---

## 1 · 四验

| 验 | 结论 | 锚点 |
|---|------|------|
| **代码** | **`me_profile_avatar_db_api_tests::post_profile_avatar_local_persists_avatar_url_on_get_me_pg`** | **`crates/api/src/routes/me_profile_avatar_db_api_tests.rs`** |
| **路由** | **`POST /auth/register`**、**`POST /api/v1/me/profile-avatar`**、**`GET /api/v1/me`** | **`routes/me.rs`** |
| **状态** | **`ChainOffState { db_pool: Some(PgPool) }`** + **`merge(auth|me)`** | 同源 **`auth_register_login_logout_db_api_tests`** |
| **真 / mock** | **`DATABASE_URL` 未设** → **skip**（**early return**，仍 **ok**） | **`pool_or_skip`** |

---

## 2 · 机读

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
cargo test -p traveltrust-api me_profile_avatar_db_api_tests -- --nocapture
```

**摘录**（本机，**已迁移** PG）：

```text
running 1 test
test routes::me_profile_avatar_db_api_tests::post_profile_avatar_local_persists_avatar_url_on_get_me_pg ... ok
test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; ...
```

```bash
bash scripts/run-check-04-routes.sh
```

**期望**：**exit 0**。

---

## 3 · `presign` / `commit` HTTP 负例（**v1.4.91**）

**文件**：**`crates/api/src/routes/me_profile_avatar_http_contract_tests.rs`**（**6** 测）。

```bash
cargo test -p traveltrust-api me_profile_avatar_http_contract_tests -- --nocapture
```

**摘录**（**`DATABASE_URL` 已设** 时 **6 passed**；未设时 **4+2 skip 日志** 仍 **ok**）：

```text
running 6 tests
...
test result: ok. 6 passed; 0 failed; ...
```

---

## 4 · `routes/` 顶层 `*.rs`

**登记日**：**35**（含 **`me_profile_avatar_db_api_tests.rs`**、**`me_profile_avatar_http_contract_tests.rs`**）。

```bash
find crates/api/src/routes -maxdepth 1 -name '*.rs' | wc -l
```
