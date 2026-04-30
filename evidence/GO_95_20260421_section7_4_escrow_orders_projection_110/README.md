# GO_95 · §7.4 · **Escrow / `orders_projection` / 110** · 2026-04-21

## 口径（SSOT）

- **[110-阶段开发链上索引器与事件同步器.md](../../docs/spec/110-阶段开发链上索引器与事件同步器.md)** **§3.1.2**（**`orders` ↔ `orders_projection`** 对账基线、**Internal `indexer-reconcile`**、**`report_type`**=`orders_projection_vs_orders`）· **§3.1.3**（**`110-RECONCILE-SEMANTICS`**：左集 = **`orders.escrow_address` 已非空**；**不**等价链上 **Funded** 全集；**`rpc_escrow_samples`** 并列）。
- **[04-后端与API.md](../../docs/spec/04-后端与API.md)** 附录 / **internal** 路由与 **110** 互指（订单读路径与投影终端字段）。
- **§3 · F-029**（索引器/投影）仍为 **PARTIAL** — 本条 **§7.4** 旁证 **不**宣称 **F-029** **行完成** 或 **93 / E2E** 闭证。

## 工程真值（代码 ↔ 110）

| 主题 | 位置 |
|------|------|
| **Escrow 事件 → 投影 upsert** | **`crates/api/src/db/orders_projection.rs`** **`upsert_orders_projection_chain_snapshot`**；模块头注释 **04 附录 §3、110** |
| **`orders` ↔ `orders_projection` 只读对账** | 同文件 **`reconcile_orders_projection_vs_orders`** → **`OrdersProjectionReconcileStats`**（**`issues_total`** / **`projection_reconcile_clean`**） |
| **对账语义锚** | 同文件 **`110-RECONCILE-SEMANTICS`** / **`list_orders_with_escrow`** |
| **`event_log` 回放投影** | **`crates/api/src/chain_off/replay_orders_projection.rs`** |
| **Internal reconcile 编排** | **`crates/api/src/routes/internal/reconcile/indexer_reconcile.rs`**（**`db::reconcile_orders_projection_vs_orders`**） |
| **持久化报告类型** | **`crates/api/src/db/reconciliation_reports.rs`** **`REPORT_TYPE_ORDERS_PROJECTION_VS_ORDERS`** |
| **HTTP 订单详情/列表 读投影** | **`crates/api/src/chain_off/orders.rs`** **`fetch_orders_projection_terminal*`** / **`apply_orders_projection_fields_to_*`**（**`orders_projection_read_failed` → 503** 与列表同源） |

## 命令结果（仓库根）

```bash
cargo test -p traveltrust-api orders_projection::
```

- **结果**：**19 passed**（**`db::orders_projection::tests`** + **`chain_off::replay_orders_projection::tests`**）。

```bash
bash scripts/run-check-04-routes.sh
```

- **结果**：**exit 0**（**04 §3.4** 路由/契约链不断）。

## 边界

- **不**替代 **staging** 上 **`POST …/internal/indexer-reconcile`** **`persist:true`** 与 **`report.json` / R-002** 运维终验。
- **不**替代 **§8.2 F-029** **行完成**、**全量链上扫链**（**110** Target）或 **F-011** 托管地址 **93:B** 闭证。
