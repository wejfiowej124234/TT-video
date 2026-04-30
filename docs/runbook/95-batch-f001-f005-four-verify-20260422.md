# 95 · §3 批次 F-001～F-005 · 四验 + §8.2 对齐（2026-04-22）

> 说明：仓库 **`.cursorignore`** 忽略 **`evidence/**`**，本文件作为本批**可索引证据**；若需与 **`evidence/GO_*`** 命名对齐，可由 Owner **复制**到 `evidence/` 树并 **git add -f**。

## 1. 环境

- **`DATABASE_URL`**：`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`
- **Postgres**：`docker compose up -d postgres` → **`traveltrust-postgres`** **`(healthy)`**

## 2. 路由验证

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
bash scripts/run-check-04-routes.sh
```

**结果**：**exit 0**（**`check-04-api-ts-routes-vs-doc-34`** **178** 路径）。

## 3. 测试命令与结果（本机 2026-04-22）

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
cargo test -p traveltrust-api auth_logout_api_tests -- --test-threads=1
cargo test -p traveltrust-api auth_register_login_logout_db_api_tests -- --test-threads=1
cargo test -p traveltrust-api p21_get_me_put_me -- --test-threads=1
```

| 过滤串 | passed | failed |
|--------|--------|--------|
| `auth_logout_api_tests` | 7 | 0 |
| `auth_register_login_logout_db_api_tests` | 4 | 0 |
| `p21_get_me_put_me` | 1 | 0 |

## 4. 代码路径（四验 · 代码真值）

- `crates/api/src/routes/auth.rs` — **`POST /auth/register`**, **`POST /auth/login`**, **`POST /auth/logout`**
- `crates/api/src/routes/me.rs` — **`GET /api/v1/me`**, **`PUT /api/v1/me`**
- `crates/api/src/routes/auth_logout_api_tests.rs`
- `crates/api/src/routes/auth_register_login_logout_db_api_tests.rs`
- `crates/api/src/chain_off/tests_guides_me_orders.rs` — **`p21_get_me_put_me`**

## 5. §8.2 五格结论（诚实）

| F | UT | API·IT | 93 | E2E | 负例 | 行完成 |
|---|-----|--------|-----|-----|------|--------|
| F-001～F-005 | 绿 | 绿（PG·Router IT） | **未勾** | **未勾** | 绿 | **未勾** |

**阻塞**：**`../spec/95-…§9`** **ISS-007**（须 **CI `e2e` 成功 `run_id`** 或 **staging `report.json`** 方可勾 **93/E2E/行完成**）；**ISS-002**（**§3.1** 依赖 **§8.2「行完成」**）。

## 6. 93 映射（未执行 R-001 归档）

| F | 93 用例（`../spec/93-全站功能验证矩阵-域别回归清单.md`） |
|---|-------------------------------------------------------------|
| F-001 | A-REG-001 |
| F-002 | A-LOG-001 / A-LOG-002 |
| F-003 | A-LOG-003 |
| F-004 | A-ME-001 |
| F-005 | A-ME-002 |

## 7. 本机 E2E（直连 API · 企业级旁证）

避免 **`PLAYWRIGHT_FULL_STACK=0`** 仍拉起 **Next dev**（Webpack 冷启动卡屏），并规避 **`/meta` 408**（根 `.env` 残留 **`CHAIN_RPC_URL`**）与 Windows **`cargo run`** 抢写 **`traveltrust-api.exe`**：

- **一键（推荐）**：在 **`frontend/`** 下 **`DATABASE_URL=… npm run e2e:api-auth-local`**
  - 脚本会设 **`PLAYWRIGHT_API_ONLY=1`**（仅 Playwright **`webServer` → API**）、**`PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1`**、**`CHAIN_RPC_URL=`**；Windows 默认 **`PLAYWRIGHT_API_START_MODE=binary`**（须先有 **`cargo build -p traveltrust-api`**）。
- **手工**：**`PLAYWRIGHT_API_ONLY=1`** + **`PLAYWRIGHT_FULL_STACK=0`** + **`PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1`** + **`CHAIN_RPC_URL=`** + 可选 **`PLAYWRIGHT_API_PORT`** / **`PLAYWRIGHT_API_BASE_URL`**；API 启动脚本 **`scripts/dev/start-api-for-playwright.*`** 在 **`PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1`** 时会清空子进程 **`CHAIN_RPC_URL`**。
- **母表 §8.2·E2E**：仍以 **ISS-007** 为准；本节为 **本机旁证**，不替代 CI **`e2e` run_id**。
