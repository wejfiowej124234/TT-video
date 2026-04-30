# GO_95 · §8.2 · F-001～F-005 生产级四验证据 · 2026-04-21

本目录对应 **[`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md`](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md)** **§3** 身份前五项与 **§8.2** 母表行；**不**替代 **93 §7.1 Release Gate** 或 **R-001 `report.json`**。

---

## 1 · §3 对读（每条 F 与 SSOT 一致）

| F | §3 能力 | 前端（示例） | API（摘要） | 持久化 |
|---|---------|--------------|-------------|--------|
| **F-001** | 用户注册 | `/auth/register` | `POST /auth/register` | `users` + `sessions` |
| **F-002** | 登录 / 会话 | `/auth/login` | `POST /auth/login` | `sessions` + hydrate |
| **F-003** | 登出 | Me / 头栏 | `POST /auth/logout` | `sessions` |
| **F-004** | 会话恢复 / getMe | `/me` | `GET /api/v1/me` | `users` |
| **F-005** | 改资料昵称钱包 | `/me` | `PUT /api/v1/me` | `users` |

**路由 SSOT**：**[`docs/spec/04-后端与API.md`](../../docs/spec/04-后端与API.md)** **§3.4**；门禁 **`bash scripts/run-check-04-routes.sh`** → **exit 0**（本证据包登记日已跑）。

---

## 2 · 四验（按 F）

### 2.1 代码验证

| F | 后端主路径 | 测试 / 契约锚点 |
|---|------------|-----------------|
| F-001～003 | **`crates/api/src/routes/auth.rs`**（及 auth 子模块） | **`auth_register_login_logout_db_api_tests`** 模块头注释 **F-001/F-002/F-003** |
| F-004～005 | **`crates/api/src/routes/me.rs`** + **`chain_off::auth`** | 同上 IT + **`p21_get_me_put_me`**（内存链 UT，见 **`routes/mod.rs`** 挂载） |

### 2.2 路由验证

- **`bash scripts/run-check-04-routes.sh`** → **exit 0**（**04 §3.4** 与 **`frontend/app`** 对齐）。

### 2.3 状态验证（须区分「有 PG」与「无 PG」）

- **有 `DATABASE_URL` + 已迁移库**：**`auth_register_login_logout_db_api_tests`** 断言 **`sessions`** 创建 / 删除、**`GET /api/v1/me`** 在登出后 **401**，与 **§3** **Durable*** 叙述一致。
- **无 `DATABASE_URL` 或空串**：上述 **4** 个 **PG·IT** 用例 **`skip`**（见源文件 **`pool_or_skip`**），**不得**据此宣称 **93 A-REG-001** 等已 **PASS**（**93 §1** 要求 **HTTP + DB 或再登录证明**）。

### 2.4 真实数据或 mock 验证

| 命令 | 环境 | 本仓库一次跑通结果（登记日） |
|------|------|------------------------------|
| **`cargo test -p traveltrust-api auth_logout_api_tests`** | 无 **PG** 要求（内存 **`ChainOffState`**） | **7 passed** |
| **`cargo test -p traveltrust-api auth_register_login_logout_db_api_tests`** | **须**非空 **`DATABASE_URL`** + 迁移 | **4 passed**（本机/Agent 环境已配置 **PG** 时） |

---

## 3 · §8.2 五格对拍（诚实结论）

| 列 | F-001～F-005 结论 | 证据 |
|----|-------------------|------|
| **UT** | **可 `[x]`**（已在 **95 §8.2** 母表体现） | **`auth_logout_api_tests`** + **`p21_get_me_put_me`** 等 |
| **API·IT** | **可 `[x]`**（已在母表体现） | **`auth_register_login_logout_db_api_tests`** |
| **93** | **`[ ]`** | 映射：**A-REG-001**、**A-LOG-001～003**、**A-ME-001～002**（**[`93 §1`](../../docs/spec/93-全站功能验证矩阵-域别回归清单.md)**）；须 **`report.json` PASS** 或 **staging** 等价证据；**CI `build.yml` · `e2e`** 下 **`DATABASE_URL: ""`** 不满足 **「二次可读」** 闭证 → **ISS-007** |
| **E2E** | **`[ ]`** | 旁证规格：**`frontend/e2e/93-matrix-path-f1-f4.spec.ts`**、**`auth-login-logout-me.spec.ts`**、**`auth-ui-logout-me.spec.ts`**、**`auth-register-login-market-chain.spec.ts`**、**`93-matrix-enterprise-p1-batch.spec.ts`**（**A-ME-002**）；在 **ISS-007** 修复前 **不**作为 **§8.2** **E2E** 列 **`[x]`** 闭证 |
| **负例** | **可 `[x]`** | **`auth_logout_api_tests`**（**A-NEG-001/002** 等映射见 **95 §8.2** 脚注） |
| **行完成** | **`[ ]`** | **仅当**前五格全 **`[x]`**（**95 §8.1**） |

---

## 4 · 与 **§9** 关系

- **ISS-007**（**v1.4.65 进展**）：**`.github/workflows/build.yml`** **`e2e` job** 已接 **`services.postgres`**（**`postgres:16-alpine`**）+ **`DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`**；**API** 进程内 **`sqlx::migrate`** 于启动时应用（与 **ISS-007** 历史根因「空串 **DATABASE_URL**」解耦）。**仍开**：**§8.2** 各 **F** 之 **93**/**E2E**/**行完成** **`[x]`** 须 **合并后主 `Build` workflow · `e2e` job 成功**（**`github.run_id`**）或 **staging `report.json` / R-001** — 见 **95 §9 ISS-007** 正文。
- **ISS-002**：**§3.1** 在 **行完成** 前不得勾选。

**对照**：**L4** workflow（**`l4-parallel-ci.yml`**）对 **`e2e:sepolia`** 可写 **`DATABASE_URL=postgres://…`** — 与 **默认 PR `build.yml` e2e** 不同轨；**95** 闭证须明确写的是哪条 CI 或 **staging `report.json`**。

---

## 5 · **v1.4.65** 机读复跑（本机 · 2026-04-21）

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cd crates/api && sqlx migrate run`**（**`DATABASE_URL`** 同上） | 已应用至最新迁移（若库滞后须先执行） |
| **`cargo test -p traveltrust-api auth_register_login_logout_db_api_tests`**（**`DATABASE_URL` 已设**） | **4 passed**（**`put_me_updates_nickname_visible_on_get_me_pg`** 断言 **`/user/nickname`**，与 **04 §3.4** 一致） |
| **`cargo test -p traveltrust-api auth_logout_api_tests`** | **7 passed** |

**代码锚**：**`crates/api/src/routes/auth_register_login_logout_db_api_tests.rs`**（**`put_me_updates_nickname_visible_on_get_me_pg`**）；**CI 锚**：**`.github/workflows/build.yml`** **`e2e.services.postgres`** + **`Start API on 8080 for E2E` · `DATABASE_URL`**。

---

## 6 · Agent 本机复跑（2026-04-22 · F-001～F-005 四验补强）

**互证**：**[`evidence/GO_95_20260422_section8_2_f001_f005/README.md`](../GO_95_20260422_section8_2_f001_f005/README.md)** **§7～§8**（**§7** 含本机 Playwright 绿边界；**§8** 记 **Windows WebServer `exe` 锁** 差分）。

**环境**：Git Bash · **Windows**；**`DATABASE_URL`** = **`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`**（与证据 §5 同源口径）。

| 四验 | 结论 | 命令 / 锚点 |
|------|------|-------------|
| **代码** | **通过** | **`crates/api/src/routes/auth.rs`** / **`me.rs`**；**`auth_register_login_logout_db_api_tests.rs`**（F-001～003 + F-004～006 密码链）；**`auth_logout_api_tests.rs`** |
| **路由** | **通过** | **`bash scripts/run-check-04-routes.sh`** → **exit 0**（本机 **2026-04-22**） |
| **状态（PG）** | **通过** | **`auth_register_login_logout_db_api_tests`** **4 passed**（**`sessions`** 创建/删除、登出后 **`GET /api/v1/me` 401**、换密后旧 token **401** 等） |
| **mock / PG 真链** | **通过** | **`auth_logout_api_tests`** **7 passed**（无池 **Router** 负例）；上表 **4** 项须 **非空 `DATABASE_URL`** |

**§8.2 诚实边界（未闭合列）**

- **93**：未执行 **93 §1** 全量矩阵登记 **`report.json`**；**不**将上表替代 **A-REG-001** / **A-LOG-001～003** / **A-ME-001～002** 的 **PASS** 勾。**仍归 §9 ISS-007**。
- **E2E**：曾尝试 **`PLAYWRIGHT_FULL_STACK=1`** + **`PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1`** 跑 **`frontend/e2e/auth-login-logout-me.spec.ts`**（**`--project=chromium`**）；**WebServer** 在 **`cargo run -p traveltrust-api`** 阶段失败：**`failed to remove file …\target\debug\traveltrust-api.exe` · `拒绝访问`（os error 5）** — 典型 **Windows 文件锁** / 并发占用 **`traveltrust-api.exe`**。**不**记 **§8.2 E2E `[x]`**；闭证仍须 **CI `build.yml` · `e2e` 成功 `run_id`** 或 **staging** 等价物（**ISS-007**）。
- **行完成**：**`[ ]`**（**93**/**E2E** 未闭）。
- **§3.1**：按 **95 §0.3 步骤 3**，**不得**勾选 **F-001～F-005**。
