# GO_95 · §7.5 · 数据库 / hydrate / 双写 · 域级审计

**日期**：2026-04-22  
**范围**：`95` **§7.5** 四条；**不**替代 **§8.2** 行级闭证、**§10.5** 干净 clone 全栈终验、**staging** 拔线实演。

## 1. Migrations 已在目标环境应用

**实现真值**：`crates/api/src/startup/mod.rs` — 当 **`DATABASE_URL`** 非空时，使用 **`sqlx::migrate::Migrator::new`** 指向 **`CARGO_MANIFEST_DIR`/`migrations`**，**`migrator.run(&pool).await`**，成功则 `println!("database: connected and migrations applied");`

**本仓库迁移扇面**（真值，Git Bash / WSL）：

```bash
find crates/api/migrations -name '*.sql' | wc -l
# → 70
```

**本地 Postgres**：`docker-compose.yml` **`postgres:16-alpine`**；操作入口见 `docs/测试账号与本地联调.md` §五。

**对读**：`95` **文首**/**§12.3.2**（本 PR 将 **约 66** 纠正为与 **`find`** 一致的 **70**）；**不**用「有 `*.sql` 文件」单独替代**生产** `migrate run` 成功 — 生产以 **API 启动日志** 或 **运维迁移台账** 为准。

## 2. Hydrate 计数与 DB 抽检一致

**实现真值**：`crates/api/src/startup/hydrate.rs` **`hydrate_from_db`** — 自 PG **`list_users`** / **`list_sessions`** / **`list_orders`** / **`list_itineraries`** 等灌入 **`ChainOffStore`**；收尾 **`println!`** 打印：

`database: hydrated {users} users, {sessions} sessions, {guides} guides, {orders} orders, …`

`order_messages` 计数为 `store.messages` 全序消息条数之和（见同一 **`println!`** 行内 **`sum()`**）。

**抽检方法（人工/脚本）**：启动 API 后，将 `println` 中 **users/orders/…** 与 PostgreSQL

`SELECT count(*) FROM users;` / `orders;` / … 对照；须在同一 **`DATABASE_URL`** 下执行。

**旁证**：`docs/测试账号与本地联调.md` 中「**database: hydrated N users…**」提示行。

**对读**：`crates/api/src/chain_off/discover.rs` **`list_itineraries_for_draft_orders`** — 发现列表合并 DB 中尚未进内存的 draft 行（多副本策略，与 `orders_list_impl` 一致）；**不**与 **启动 hydrate 计数行** 混为一谈。

## 3. 孤儿订单/行程策略（内存补全 / repair）

**策略已代码化 + 文档可索引**：

- `crates/api/src/chain_off/orders.rs` — **`backfill_minimal_itineraries_for_orders_without_row`**：仅有 **`orders`、无 `itineraries` 行** 的遗留数据，在 **hydrate 末尾** 注入与 **`minimal_itinerary_bundle_for_simple_order`** 同源的最小行程（**仅内存**；新建路径为 **`POST /orders` 时 orders+itineraries 同事务**，见同文件 **`persist_created_order_and_minimal_itinerary_tx`** 注释链）。
- `crates/api/src/startup/hydrate.rs` — 若 backfill 计数 **>0**，`eprintln!` 说明 **legacy** 行为。
- 单元测试： **`chain_off::orders::backfill_minimal_itinerary_memory_tests::backfill_inserts_minimal_bundle_when_order_has_no_itinerary`** — `cargo test -p traveltrust-api backfill_inserts_minimal` **1 passed**（本证据包登记日机读）。

**对读**：[48-后端模块化拆分与落地清单](../../docs/spec/48-后端模块化拆分与落地清单.md) **`db`/订单** 叙事；**110** 级 **repair job** 若与链上/投影对账不同轨，仍归 **F-029** / **Runbook** — **不**在本条闭 **§8.2**。

## 4. Strict 双写失败回滚（实现与 Runbook 互证；非拔线实演）

- **`DUAL_WRITE_FAILURE_POLICY`** 与 **`GET /meta` → `dual_write`**：`crates/api/src/state.rs` **`dual_write_failure_policy`**
- 任一 **`TRAVELTRUST_STRICT_*_DB_WRITE=1`**：**`any_traveltrust_strict_db_write`**；无策略且已接库时 **startup** 打 **`WARN: … no strict dual-write policy …`**
- 订单流 **DB 写失败** 在 **`TRAVELTRUST_STRICT_ORDER_DB_WRITE=1`** 时 **内存回滚**（JSON **`rule`** 句）：`crates/api/src/chain_off/orders_flow/accept_cancel_pay_complete.rs` 多处（accept / cancel / pay-expired / escrow / complete 等路径）

**Runbook 锚点**：`ops/RUNBOOK.md` 约 **§9** / **50-O-R1** 叙述（`dual_write` / `strict_db_write` / 各 `TRAVELTRUST_STRICT_*` 分轨）。

**闭证边界**：本登记为 **代码路径 + 运维文档** 对拍；**不**替代 **生产故障注入演练** 或 **§10.5** 一次端到端在 **STRICT** 全开启下的全栈验收 — 若需单独 ISS，归 **§9**。

## 5. 机读复跑（登记日）

```bash
find crates/api/migrations -name '*.sql' | wc -l
# 70
cargo test -p traveltrust-api backfill_inserts_minimal
# 1 passed
bash scripts/run-check-04-routes.sh
# exit 0
```

**Python 总完成度**（`95` **§0.2** 派生，与 **v1.4.84** 同批）：

`python -c "x=(15/33)+(34/78)+(1/22); print(round(100*x/4))"` → **23**
