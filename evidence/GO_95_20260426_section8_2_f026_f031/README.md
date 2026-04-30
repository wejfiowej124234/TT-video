# GO_95 · §8.2 · F-026～F-031 审计复跑 · 2026-04-26

对应 **[`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md`](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md)** **§3**/**§8.2**。**不**替代 **93** / **R-001** / **ISS-007**。

---

## 1 · 环境

| 项 | 值 |
|----|-----|
| **Postgres（F-031 `tests_create_post_commerce`；F-029 深路径）** | `postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`（**Docker**） |

---

## 2 · 机读命令与结果（本轮）

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api routes::messages::tests`** | **13 passed**（**F-026**） |
| **`cargo test -p traveltrust-api orders::tests::suite`** | **20 passed**（**F-027**） |
| **`cargo test -p traveltrust-api idempotency_http_contract_tests`** | **2 passed**（**F-028** HTTP 负例） |
| **`cargo test -p traveltrust-api internal::tests`** | **93 passed**（**F-029**；无 **`DATABASE_URL`** 时 stdout 含 **`skip (DATABASE_URL unset)`** 提示，仍 **93 ok** — **非** **indexer_tick_persists_*** 真 PG 断言闭证） |
| **`DATABASE_URL=…` `cargo test -p traveltrust-api internal::tests -- --test-threads=1`** | **93 passed**（**F-029**；**`indexer_tick_persists_*_when_db_configured`** 等走实库路径，**~4.97s**） |
| **`cargo test -p traveltrust-api routes::admin::tests`** | **172 passed**（**F-030**） |
| **`cargo test -p traveltrust-api create_post_commerce_parse`** | **5 passed**（**F-031** **UT**，与 **F-015** 同源模块） |
| **`DATABASE_URL=…` `cargo test -p traveltrust-api tests_create_post_commerce -- --test-threads=1`** | **3 passed**（**F-031** **IA/橱窗** 与 listing 绑定；与 **F-015** 同源 **`tests_create_post_commerce_db`**） |

---

## 3 · 四验摘要

| F | 代码 / 路由 | 备注 |
|---|-------------|------|
| **F-026** | **`messages.rs`** **`GET|POST /api/v1/orders/:id/messages`**（约 **L16–L20**） | **13** 测：**503/401/403/404/400/200** |
| **F-027** | **`routes/orders`** **`reviews`** 等；**`orders::tests::suite`** | 评价 + 订单读/链同步契约等 **20** 测 |
| **F-028** | **`idempotency_http_contract_tests.rs`** + 全局中间件 | **400** **`missing_idempotency_key`**；**503** **`idempotency_db_persist_failed`** |
| **F-029** | **`routes/internal`** **tick/replay/reconcile** | **须 `DATABASE_URL`** 方闭合 **tick 落库** 子路径终验 |
| **F-030** | **`routes/admin::tests`** | 非 admin **禁止** + 大量 **400/503** 门禁 |
| **F-031** | **`create_post_commerce_parse`** + **`tests_create_post_commerce_db`** | **commerce_* 帖** 与 **market listing** 绑定 |

---

## 4 · §8.2 五格（与 **95** 母表一致）

| F | UT | API·IT | 93 | E2E | 负例 | 行完成 |
|---|:---:|:------:|:--:|:---:|:----:|:------:|
| F-026 | [x] | [ ] | [ ] | [ ] | [x] | [ ] |
| F-027 | [x] | [ ] | [ ] | [ ] | [x] | [ ] |
| F-028 | [x] | [ ] | [ ] | [ ] | [x] | [ ] |
| F-029 | [x] | [ ] | [ ] | [ ] | [x] | [ ] |
| F-030 | [x] | [ ] | [ ] | [ ] | [x] | [ ] |
| F-031 | [x] | [ ] | [ ] | [ ] | [x] | [ ] |

**§3.1**：**不得**勾选。

---

## 5 · §9

**ISS-007**；**ISS-002**；**ISS-008** **不**覆盖本批主路径。
