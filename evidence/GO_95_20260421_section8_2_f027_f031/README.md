# GO_95 · §8.2 · F-027～F-031 生产级四验证据 · 2026-04-21

**95 台账版本**：**v1.4.75**（**§6** 登记 **§4** 机读）。与 **[`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md`](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md)** **§3**/**§8.2** 对读；**不**替代 **93 §7.1** / **R-001**。

---

## 1 · §3 对读

| F | 能力 | 锚点（摘要） |
|---|------|-------------|
| **F-027** | 订单评价 | **`routes::orders::tests::suite`** |
| **F-028** | 幂等键 / HTTP 负例 | **`idempotency_http_contract_tests`**（详 **`…f028/README.md`**） |
| **F-029** | internal / indexer | **`routes::internal::tests`** |
| **F-030** | admin | **`routes::admin::tests`** |
| **F-031** | 社区橱窗 commerce | **`create_post_commerce_parse_tests`** + **`tests_create_post_commerce_db`** |

---

## 2 · 四验与命令（登记日）

| F | 命令 | 结果（本登记） |
|---|------|----------------|
| **F-027** | **`cargo test -p traveltrust-api orders::tests::suite`** | **20 passed** |
| **F-028** | **`cargo test -p traveltrust-api idempotency_http_contract_tests`** | **2 passed** |
| **F-029** | **`cargo test -p traveltrust-api internal::tests`** | **93 passed** |
| **F-030** | **`cargo test -p traveltrust-api routes::admin::tests`** | **172 passed** |
| **F-031** | **`cargo test -p traveltrust-api create_post_commerce_parse_tests`** + **`tests_create_post_commerce`** | **5** + **3 passed** |

**路由**：**`bash scripts/run-check-04-routes.sh`** → **exit 0**。

**代码纠偏（F-029 · B-115-4）**：**`indexer_tick_persists_region_share_snapshot_line_when_db_configured`** 二次 **`indexer_tick`** 须共用首 tick 之 **`IndexerStateHandle`**（对齐生产 **`AppState`**）；mock RPC 须应答 **`eth_getBlockByNumber`** 以过 reorg 门禁（与 mock log **`blockHash`** 一致）。见 **`crates/api/src/routes/internal/tests/suite_early.rs`**。

---

## 3 · §8.2 五格（诚实结论）

| 列 | F-027～F-031 |
|----|----------------|
| **UT** | **[x]**（与母表一致） |
| **API·IT** | **`[ ]`**（**F-028** 负例 HTTP 专测**不**单独闭全表；**无** **`auth_register_*` 风格** 母文件闭 **F-027～031** 全行） |
| **93** | **`[ ]`**（须 **`report.json` PASS** 或 **CI `e2e` 绿存档**；**ISS-007**） |
| **E2E** | **`[ ]`** |
| **负例** | **F-028 `[x]`**（见 **`…f028`**）；其余 F **子集 `[x]`** 与母表一致 |
| **行完成** | **`[ ]`** |

---

## 4 · **v1.4.75** 机读复跑（本机 · `DATABASE_URL` 已设 · 2026-04-21）

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api orders::tests::suite`** | **20 passed** |
| **`cargo test -p traveltrust-api idempotency_http_contract_tests`** | **2 passed** |
| **`cargo test -p traveltrust-api internal::tests`** | **93 passed** |
| **`cargo test -p traveltrust-api routes::admin::tests`** | **172 passed** |
| **`cargo test -p traveltrust-api create_post_commerce_parse_tests`** | **5 passed** |
| **`cargo test -p traveltrust-api tests_create_post_commerce`** | **3 passed** |

**注**：母表脚注 **F-027** 曾记 **`orders::tests::suite` 22 passed**；当前机读过滤为 **20 passed**（以 **`cargo test`** 汇总为准）。**§8.2** **93**/**E2E**/**行完成** **不**因本 **§4** 单独升格 **`[x]`**（**ISS-007** 未闭）。

---

## 5 · Agent 本机复跑（2026-04-22 · F-027～F-030 · Cursor · Windows）

**`DATABASE_URL`** = **`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`**。**F-031** 专跑见 **§6**（与 **`…f011_f015` §5** 互证）。

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api orders::tests::suite`** | **20 passed**（**F-027**） |
| **`cargo test -p traveltrust-api idempotency_http_contract_tests`** | **2 passed**（**F-028**；日志含 **`pool timed out`** 预期路径） |
| **`cargo test -p traveltrust-api internal::tests`** | **93 passed**（**F-029**） |
| **`cargo test -p traveltrust-api routes::admin::tests`** | **172 passed**（**F-030**） |

**§8.2 边界不变**（**ISS-007** / **ISS-009** 叙事仍适用于 **F-029** 生产多副本）；**§3.1** **禁勾** **F-027～F-030**。

---

## 6 · Agent 本机复跑（2026-04-22 · **F-031**）

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api create_post_commerce_parse`** | **5 passed** |
| **`cargo test -p traveltrust-api tests_create_post_commerce`** | **3 passed** |

**§8.2**：**UT**/**API·IT**/**负例** 子证据与母表 **F-015**/**F-031** 行一致；**93**/**E2E**/**行完成** **`[ ]`**（**ISS-007**）；**§3.1** **禁勾** **F-031**。

---

## 7 · Cursor agent 复跑（**2026-04-22** · 本对话 · **F-026～F-031** 同会话汇总）

**`DATABASE_URL`** = **`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`**。**F-026** 专条另见 **`evidence/GO_95_20260421_section8_2_f026/README.md` §6**。

| 命令 | 结果 | 映射 |
|------|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** | 路由四验 |
| **`cargo test -p traveltrust-api routes::messages::tests`** | **13 passed** | **F-026** |
| **`cargo test -p traveltrust-api orders::tests::suite`** | **20 passed** | **F-027** |
| **`cargo test -p traveltrust-api idempotency_http_contract_tests`** | **2 passed** | **F-028** |
| **`cargo test -p traveltrust-api internal::tests`** | **93 passed** | **F-029** |
| **`cargo test -p traveltrust-api routes::admin::tests`** | **172 passed** | **F-030** |
| **`cargo test -p traveltrust-api create_post_commerce_parse`** | **5 passed** | **F-031** |
| **`cargo test -p traveltrust-api tests_create_post_commerce -- --test-threads=1`** | **3 passed** | **F-031** |

**结论**：与 **§5**/**§6** 机读**同计数**；**不**因 **`internal`/`admin`/`b118` 类 PG 子测绿** 升格 **§8.2** **API·IT**/**93**/**E2E**/**行完成**/**§3.1**（**ISS-007**/**ISS-009** 叙事仍适用于 **F-029** 多副本）。
