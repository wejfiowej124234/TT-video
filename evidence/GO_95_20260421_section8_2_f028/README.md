# GO_95 · §8.2 · F-028 幂等 · HTTP 负例四验 · 2026-04-21

**95 台账版本**：**v1.4.77**（**§6** 登记 **§4** 机读）；历史批次 **v1.4.55**（**HTTP 负例** 首批）。与 **[`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md`](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md)** **§3**/**§8.2** 对读；**不**替代 **93** / **R-001**。

---

## 1 · §3 / §8.2 对读

| F | 能力 | 锚点 |
|---|------|------|
| **F-028** | 幂等写（中间件 + **`idempotency_keys`** 投影） | **`router::app`** + **`middleware::idempotency_key_layer`** |

---

## 2 · 四验与命令（登记日）

| 验 | 命令 | 结果 |
|---|------|------|
| **代码** | **`crates/api/src/idempotency_http_contract_tests.rs`**（**`router::app`** 全栈） | **`post_missing_idempotency_key_returns_400_when_require_idempotency_key`**、**`post_idempotency_db_persist_failed_returns_503_on_dead_pool`** |
| **mock·PG** | **`cargo test -p traveltrust-api idempotency_http_contract_tests`** | **2 passed** |
| **路由** | **`bash scripts/run-check-04-routes.sh`** | **exit 0** |

**实现注**：**`auth_placeholder_layer`** 在幂等层外先执行；**`POST /api/v1/guides`** 会先 **401**，**不**命中 **`missing_idempotency_key`**。专测选用 **`POST /api/v1/trust-growth/ingest`**（**`middleware::auth_placeholder_layer`** **public POST** 白名单），使 **`REQUIRE_IDEMPOTENCY_KEY=1`** 时无头 **`Idempotency-Key`** → **400**；**`Idempotency-Key` + `connect_lazy` dead `PgPool`** 在 handler **503** 体落盘后 **`save_cached_response`** 失败 → **503 `idempotency_db_persist_failed`**。

---

## 3 · §8.2 五格（诚实结论）

| 列 | F-028 |
|----|--------|
| **UT** | **[x]**（含 **`db::idempotency::key_hash_tests`** 等，见 **95** 脚注 **F-027～031**） |
| **API·IT** | **`[ ]`** |
| **93** | **`[ ]`**（须 **`report.json` PASS** 或 **CI `e2e` 绿存档**；**ISS-007**） |
| **E2E** | **`[ ]`** |
| **负例** | **[x]**（本包：**HTTP 400/503** 专测） |
| **行完成** | **`[ ]`** |

---

## 4 · **v1.4.77** 机读复跑（本机 · `DATABASE_URL` 已设 · 2026-04-21）

与 **95 §8.2** 脚注 **F-027～031** 中 **F-028** **UT** 子集对齐（**负例** 仍以 **§2** **`idempotency_http_contract_tests`** 为主）。

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api idempotency_http_contract_tests`** | **2 passed** |
| **`cargo test -p traveltrust-api key_hash_tests`** | **1 passed**（**`db::idempotency::key_hash_tests`**） |
| **`cargo test -p traveltrust-api middleware::rate_limit::tests`** | **4 passed** |
| **`cargo test -p traveltrust-api idempotency_cache_meta_top_keys_order_and_literals_753`** | **1 passed**（**`routes::health_meta::tests`**） |

**注**：**`…f027_f031` §4** 已含 **`idempotency_http_contract_tests` 2**；本 **§4** 为 **F-028** 专包 **UT 扇面** 补登记，**不**单独升格 **§8.2** **行完成**/**93**。
