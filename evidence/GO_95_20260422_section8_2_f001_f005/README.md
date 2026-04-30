# GO_95 · §8.2 · F-001～F-005 审计复跑 · 2026-04-22

对应 **[`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md`](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md)** **§3** 身份前五项、**§8.2** 母表行。**不**宣称 **93 PASS** / **E2E 闭证** / **行完成**（仍受 **§9 ISS-007**、**ISS-002**）。

---

## 1 · 环境

| 项 | 值 |
|----|-----|
| **Postgres** | `docker compose up -d postgres`（**`postgres:16-alpine`**，`127.0.0.1:5432`） |
| **`DATABASE_URL`（PG·IT）** | `postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust` |
| **迁移** | `cd crates/api && sqlx migrate run`（**exit 0**） |

---

## 2 · 命令与机读结果（本轮）

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api auth_logout_api_tests`** | **7 passed**（无 **PG** 要求） |
| **`cargo test -p traveltrust-api p21_get_me_put_me`** | **1 passed**（**F-004/F-005** 内存链 **UT** 补充，**`chain_off::tests_guides_me_orders`**） |
| **`DATABASE_URL=…` `cargo test -p traveltrust-api auth_register_login_logout_db_api_tests -- --test-threads=1`** | **4 passed**（**无** `skip:` 日志 — **真实 PG 断言**） |

---

## 3 · 四验（F-001～F-005）

| 验 | 结论 | 锚点 |
|----|------|------|
| **代码** | **成立** | **`crates/api/src/routes/auth.rs`**（`/auth/register|login|logout`）；**`me.rs`**（`GET|PUT /api/v1/me`）；**`auth_register_login_logout_db_api_tests.rs`**（**F-001～006** PG·IT）；**`auth_logout_api_tests.rs`**（负例 + 无池路径） |
| **路由** | **成立** | **`run-check-04-routes.sh` exit 0**（**04 §3.4** ↔ **`api.ts`** ↔ **`frontend/app`**） |
| **状态** | **有 `DATABASE_URL` 时成立** | IT 中断言 **`sessions` / `users`** 与 **§3 Durable** 一致；**无库** 时 **`pool_or_skip` 提前 return**，**不得**作为 PG 终验（见 §4） |
| **真实数据 / mock** | **成立（本轮 PG）** | **7+1+4** 见 §2；**mock** 路径：**`auth_logout_api_tests`** 内存 **`ChainOffState`** |

---

## 4 · 风险：`DATABASE_URL` 未设时的「假绿」

**`auth_register_login_logout_db_api_tests`** 在 **`DATABASE_URL` unset** 时对每个用例 **`return`**，**`cargo` 仍计为 passed**（非 **`ignored`**）。生产级门禁须：

- 在跑 **API·IT** 闭证时 **强制**非空 **`DATABASE_URL`** + 已迁移库；或
- 将用例改为 **`#[ignore]`** / **`require_env!`** 等，使无库时 **`ignored`/`failed`**，避免与 **§8.2 API·IT `[x]`** 语义冲突。

**§9**：全矩阵 **93/E2E/行完成** 仍归 **ISS-007**；**§3.1** 仍归 **ISS-002** 母规则。

---

## 5 · §8.2 五格（诚实状态 · 与母表一致）

| 列 | F-001～F-005 |
|----|----------------|
| **UT** | **`[x]`** |
| **API·IT** | **`[x]`**（**须**有 **PG** 时跑；本轮已复证） |
| **93** | **`[ ]`** → **A-REG-001**、**A-LOG-001～003**、**A-ME-001～002**（**[`93 §1`](../../docs/spec/93-全站功能验证矩阵-域别回归清单.md)**）；待 **`report.json` / R-002** 或 **ISS-007** 闭证 |
| **E2E** | **`[ ]`**（**ISS-007**：须 **CI `e2e` run_id** 或 **staging** 等价） |
| **负例** | **`[x]`** |
| **行完成** | **`[ ]`** |

---

## 6 · §3.1

**禁止勾选** **F-001～F-005**（**§8.2** **行完成** 仍为 **`[ ]`**）。

---

## 7 · Agent 复跑（2026-04-22 · 本机证据）

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api auth_logout_api_tests`** | **7 passed** |
| **`cargo test -p traveltrust-api p21_get_me_put_me`** | **1 passed** |
| **`DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust` `cargo test -p traveltrust-api auth_register_login_logout_db_api_tests -- --test-threads=1`** | **4 passed**（**无 skip**） |
| **Playwright**（**`frontend/`**）**`npx playwright test e2e/auth-login-logout-me.spec.ts --project=chromium`** | **2 passed**（**`setup-meta-chain`** 内 **2 skipped**）；**前置**：**`docker compose up -d postgres`** + **`cargo run -p traveltrust-api`**（**`SEED_TEST_ACCOUNTS=1` `P3_CHAIN_OFF=1` `PORT=8080`** 等同 **`scripts/dev/start-api-for-playwright.sh`** 口径） |

**诚实边界**：上表 **Playwright** 为**本机**绿，**不**满足 **§9 ISS-007** 闭证条件（**合并主 `Build` · `e2e` job `github.run_id`** 或 **staging `report.json` / R-001**）。故 **§8.2** **F-001～F-005** 之 **93**/**E2E**/**行完成** 母表 **`[ ]`** **不变**；**§3.1** **F-001～F-005** **仍禁勾**。

---

## 8 · Agent 补充机读（Cursor · **Windows** · 2026-04-22）

与 **§7** 为**同日不同环境**差分记录；**不**改变 **§5** 母表 **`[ ]`** 列。

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust` `cargo test -p traveltrust-api auth_logout_api_tests`** | **7 passed** |
| **同上 `DATABASE_URL` `cargo test -p traveltrust-api auth_register_login_logout_db_api_tests`** | **4 passed** |
| **`PLAYWRIGHT_FULL_STACK=1` `PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1` `npx playwright test e2e/auth-login-logout-me.spec.ts --project=chromium`**（**`frontend/`**） | **失败**：**`webServer`** 在编译/替换 **`target\debug\traveltrust-api.exe`** 时报 **`拒绝访问`（os error 5）** — **Windows 文件锁** / **`traveltrust-api.exe` 被占用**。**无** Playwright 通过记录。 |

**结论**：**UT / API·IT / 负例** 与 **四验** 在本机 **PG 可达** 前提下再次成立；**E2E**/**93**/**行完成** 仍仅能以 **§9 ISS-007** 闭证边界为准。姊妹证据包 **`evidence/GO_95_20260421_section8_2_f001_f005/README.md` §6** 同旨。

---

## 9 · Cursor agent 补充机读（**2026-04-22** · 本对话 · **F-001～F-005**）

**本轮未**复跑 Playwright（**§8** 已记 **Windows** **`traveltrust-api.exe`** 占用导致的 **E2E** 失败态）。

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api auth_logout_api_tests`** | **7 passed** |
| **`cargo test -p traveltrust-api p21_get_me_put_me`** | **1 passed** |
| **`DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust` `cargo test -p traveltrust-api auth_register_login_logout_db_api_tests -- --test-threads=1`** | **4 passed**（**无** `skip:` 日志 — **PG·IT 真断言**） |

---

## 9 · Cursor Agent 复跑（2026-04-22 · 本批 F-001～F-005 四验）

| 命令 | 结果 |
|------|------|
| `bash scripts/run-check-04-routes.sh` | **exit 0** |
| `cargo test -p traveltrust-api auth_logout_api_tests -- --test-threads=1` | **7 passed** |
| `cargo test -p traveltrust-api p21_get_me_put_me -- --test-threads=1` | **1 passed** |
| `DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust cargo test -p traveltrust-api auth_register_login_logout_db_api_tests -- --test-threads=1` | **4 passed**（无 `skip`） |
| `gh run list --workflow=build.yml --limit 8`（**闭证旁证**） | 最近 **8** 条均为 **`failure`**；**不满足** **ISS-007** 要求的合并主 **`e2e` success + `github.run_id`** |

**结论**：**代码 / 路由 / PG 状态 / PG·IT+UT** 四验本轮成立；**§8.2** **93**/**E2E**/**行完成** 与 **§3.1** 仍 **禁勾**（**ISS-007**/**ISS-002**）；不另开 **ISS**。
