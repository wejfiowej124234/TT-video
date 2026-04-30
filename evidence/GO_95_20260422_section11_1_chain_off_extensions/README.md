# GO_95 · §11.1 · chain_off 链下扩展面（旁证 · 2026-04-22）

## §1 机读扇面（真值）

- **`find crates/api/src/chain_off -name '*.rs' | wc -l`** → **36**（**v1.4.102** 纠 **95 文首「约 35」** 漂移 **+1**）。
- **顶层模块文件（`*.rs` 于 `chain_off/` 根）**：**`mod.rs`**（**`ChainOffConfig`/`ChainOffState`**）、**`auth.rs`**、**`orders.rs`**、**`itineraries.rs`**、**`guides.rs`**、**`me.rs`**、**`messages.rs`**、**`disputes.rs`**、**`reviews.rs`**、**`evidence.rs`**、**`discover.rs`**、**`pagination.rs`**、**`reload_orders_db.rs`**、**`reconcile.rs`**、**`replay_orders_projection.rs`**、**`replay_governance_proposals.rs`**、**`indexer_event_track.rs`**、**`persistence_gate.rs`** 及 **`governance_*_ssot.rs`** / **`governance_proposal_*`** 等（详见仓库 **`crates/api/src/chain_off/`** 目录树）。

## §2 与 **F-008～013** / **F-025～027** / **§8.2** / **93 B**

- **订单主路径**：**`orders.rs`** + **`orders_flow/`**（**`accept_cancel_pay_complete`/`dispute_bilateral_rating`**）↔ **F-008**/**F-010**/**F-011**/**F-025**/**F-027** 等 **§3** 行与 **`chain_off::tests_*`**/**`routes::orders::`** 脚注同源；**不**因 **`cargo test … chain_off::` 绿** 单独闭 **§8.2 行完成**（**ISS-007**/**93**/**E2E**）。
- **行程 / 托管 / 争议 / 证据 / 评价**：**`itineraries.rs`**、**`set_order_escrow_address_*`**（**`tests_events_itinerary`**）、**`disputes.rs`**、**`evidence.rs`**、**`reviews.rs`** — 与 **§11.1 Intents/Evidence**/**F-025** 旁证 **正交互补**（HTTP 面在 **`routes/`**）。

## §3 与 **F-029** / **110** / **internal**

- **`replay_orders_projection.rs`**、**`reconcile.rs`**、**`indexer_event_track.rs`**、**`reload_orders_db.rs`** ↔ **`routes/internal/`** **indexer-reconcile**/**tick** 叙事与 **§7.4 Escrow/orders_projection**/**§11.1 Internal indexer** 旁证；**闭证**仍以 **F-029**/**110**/**staging tick** 人签与 **§8.2** 为准。

## §4 **`ChainOffConfig` ↔ `GET /meta` / 缺口表**

- **`chain_off/mod.rs`** **`ChainOffConfig`**：**`GOVERNANCE_*_CHAIN_SSOT`** 布尔与 **`governance_order_deadline_chain_ssot`** 等 ↔ **`GET /meta`**/**Runbook**/**缺口官方总表** 按序核查 **Step 5/7**（**本包不**复述 env 矩阵全文）。
- **多实例 / 内存 SSOT**：**`RwLock`** 态与 **§7.5**/**§9 ISS-009** 同源；**`persistence_gate.rs`** 为 **PG 持久化门**（与 **F-028** 幂等/strict 叙事相邻，**不**合并 ISS）。

## §5 命令证据（本轮）

- **`bash scripts/run-check-04-routes.sh`** → **exit 0**。
- **`cargo test -p traveltrust-api chain_off::`** → **162 passed, 0 failed**（**全子模块**；**~1.8s** 本机）。

## §6 诚实边界

- **不**等价 **§12.2 · C-2** **`chain_off/`** **全文走读**或 **§12.2 · C-1** **路由挂载**逐条审计。
- **不**关闭 **ISS-009**/**ISS-007**/**缺口 P0** 任一条。
