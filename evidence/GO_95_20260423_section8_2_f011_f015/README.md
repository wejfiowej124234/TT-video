# GO_95 · §8.2 · F-011～F-015 审计复跑 · 2026-04-23

对应 **[`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md`](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md)** **§3**/**§8.2**。**不**宣称 **93 PASS** / **E2E 闭证** / **行完成**（**ISS-007**）。

---

## 1 · 环境

| 项 | 值 |
|----|-----|
| **Postgres（F-015 API·IT）** | `postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`（**Docker** `traveltrust-postgres`） |
| **迁移** | **`crates/api` · `sqlx migrate run`**（与前几批同库） |

---

## 2 · 机读命令与结果（本轮）

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api set_order_escrow_address_impl_writes_address`** | **1 passed**（**F-011**） |
| **`cargo test -p traveltrust-api set_order_escrow_address_impl_rejects_invalid_escrow_address`** | **1 passed**（**F-011** **负例**） |
| **`cargo test -p traveltrust-api itinerary_create_impl_stores_draft_order_and_bundle`** | **1 passed**（**F-012**） |
| **`cargo test -p traveltrust-api confirm_final_plan_impl_stores_snapshot_hash`** | **1 passed**（**F-013**） |
| **`cargo test -p traveltrust-api confirm_final_plan_version_conflict_returns_409`** | **1 passed**（**F-013** **负例**） |
| **`cargo test -p traveltrust-api get_feed_no_db_returns_database_required`** | **1 passed**（**F-014**） |
| **`cargo test -p traveltrust-api create_post_commerce_parse`** | **5 passed**（**F-015** **UT**） |
| **`DATABASE_URL=…` `cargo test -p traveltrust-api tests_create_post_commerce -- --test-threads=1`** | **3 passed**（**F-015** **API·IT**；**无 skip**） |

---

## 3 · 四验（按 F）

| F | 代码 / 路由 | 状态与数据 |
|---|-------------|------------|
| **F-011** | **`chain_off::tests_events_itinerary`** **`set_order_escrow_address_impl_*`**；HTTP **`POST /api/v1/orders/:id/set-escrow-address`**（**`routes/orders/mod.rs`**） | **内存链 UT** + 无效地址 **负例**；**无** 独立 **Router+PG** **API·IT** 母文件（母表 **API·IT** **`[ ]`**） |
| **F-012** | **`chain_off::itinerary_create_impl`**；**`POST /api/v1/itineraries`**（**`routes/itineraries.rs`**） | **`itinerary_create_impl_stores_draft_order_and_bundle`** **1 passed** |
| **F-013** | **`confirm_final_plan_impl`**；**`POST …/confirm-final-plan`**（**`routes/orders/mod.rs`**） | **快照 hash** + **409** 版本冲突 **负例** |
| **F-014** | **`GET /api/v1/community/feed`**（**`routes/community/router.rs`**）；**`get_feed_no_db_returns_database_required`** | **503/缺库** 契约（非 Feed 全量 **93**） |
| **F-015** | **`create_post_commerce_parse_tests`** + **`tests_create_post_commerce_db`** | **PG·HTTP** 发帖 + listing 绑定 **3 passed**（须 **`DATABASE_URL`**） |

**HTTP 挂载锚**（订单子资源）：

- **`confirm-final-plan` / `set-escrow-address`**：**`crates/api/src/routes/orders/mod.rs`**（约 **L390–L404**）。

---

## 4 · §8.2 五格（与 **95** 母表一致 · 不升格）

| F | UT | API·IT | 93 | E2E | 负例 | 行完成 |
|---|:---:|:------:|:--:|:---:|:----:|:------:|
| F-011 | [x] | [ ] | [ ] | [ ] | [x] | [ ] |
| F-012 | [x] | [ ] | [ ] | [ ] | [x] | [ ] |
| F-013 | [x] | [ ] | [ ] | [ ] | [x] | [ ] |
| F-014 | [x] | [ ] | [ ] | [ ] | [x] | [ ] |
| F-015 | [x] | [x] | [ ] | [ ] | [x] | [ ] |

**§3.1**：**F-011～F-015** **不得**勾选（**行完成** 均为 **`[ ]`**）。

---

## 5 · §9

- **ISS-007**：**93** / **E2E** / **行完成**。
- **ISS-002**：**§3.1** 仅在 **§8.2 行完成** 后允许。
