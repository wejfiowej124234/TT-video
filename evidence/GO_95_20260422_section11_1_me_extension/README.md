# GO_95 — §11.1「Me 扩展」旁证

**登记日**：2026-04-22  
**对拍对象**：**`crates/api/src/routes/me.rs`** **`router()`** — **`GET /api/v1/me/stats`**、**`POST …/profile-avatar/presign`**/**`commit`**/**本机 `POST …/profile-avatar`**、**市场星标** **`/me/market-bookmarks`** 等；与 **04**、**§8.2 F-007**/**ISS-008** 叙事交叉（**不**在本文重复闭 **S3 成功链**）。

## 1. 挂载

**`api_router()`**（**`routes/mod.rs`**）：**`.merge(me::router())`**（序在 **`admin`** 后、**`market_subsite`** 前）。

## 2. 路径表（**`me::router()`** 摘录）

| 方法 | 路径 |
|------|------|
| GET, PUT | `/api/v1/me`、`/api/v1/me/` |
| GET | `/api/v1/me/stats` |
| GET, POST | `/api/v1/me/market-bookmarks` |
| DELETE | `/api/v1/me/market-bookmarks/:target_type/:target_id` |
| PUT | `/api/v1/me/password` |
| POST | `/api/v1/me/profile-avatar`、`…/presign`、`…/commit` |
| GET | `/api/v1/uploads/profile-avatars/:name` |

**`GET /api/v1/me/stats`**：有 **`chain_off`** + 会话用户时走 **`chain_off::me_unified_stats_json`**（与 **`GET /me`** 同源统计口径，见 **`chain_off/me.rs`**）；**无 `chain_off`** → **`not_impl_json("GET /api/v1/me/stats")`**（**`me.rs`**）。

## 3. 机读命令与诚实边界

| 步骤 | 命令 / 结果（本登记日） |
|------|-------------------------|
| **`routes::me`** 市场星标子集 | **`cargo test -p traveltrust-api 'routes::me::' -- --test-threads=1`** → **6 passed**（**`market_bookmark_route_tests`**） |
| **头像 presign/commit/本机** | **`cargo test -p traveltrust-api me_profile_avatar -- --test-threads=1`** → **7 passed**（**`me_profile_avatar_db_api_tests` 1** + **`me_profile_avatar_http_contract_tests` 6**） |
| 路由契约门禁 | **`bash scripts/run-check-04-routes.sh`** → **exit 0** |

**诚实边界**：

- **`GET /api/v1/me/stats`** **无** 独立 **`Router::oneshot`** 专测；本包**不**声称 **HTTP 200** 全字段契约已 **§8.2 行完成** 闭证。  
- **`presign`→S3 PUT→`commit`** **成功路径** 仍 **ISS-008** / **F-007 PARTIAL**；**§8.2**/**`…f007_*` 证据包** 为 **F-007** 主链旁证，**不**因本卫星 **`[x]`** 重复升格。  
- **`market-bookmarks`** 与 **§8.2 F-020** 主表语义**正交** — 本包**不**替 **93**/**staging** 星标全量。
