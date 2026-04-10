# B-127-1 · Finality 硬闸门（资金终态 `orders_projection`）最小闭环

**锚点 ID**：**`TT-DOC-B127-1-FINALITY-GATE-CLOSE-001`**

**收口日期**：2026-04-10

## 目标

- **未达 `FINALITY_N`（实现钉死：`block_number > chain_tip - max(1, FINALITY_N)`）**：**不得**对 **`orders_projection`** 执行会物化 **资金终态列** 的双写（**`Paid` / `Released` / `Refunded` / `ResolutionExecuted` / `PartialRefundExecuted` / `SlashedExecuted`**，与 **`db::upsert_orders_projection_chain_snapshot`** 中 **`paid_at_*` / `completed_at_*`** 一致）。
- **达到上述深度后**：**允许**上述终态事件写入 **`orders_projection`**（与 tick 既有 **`to_block`** 上界同源；**不**改 **B-114** reorg / scan 行为）。

## 修改范围（本轮实现）

- **`crates/api/src/chain/indexer.rs`**：`escrow_event_is_orders_projection_funds_terminal`、`block_has_indexer_finality_depth`、`allow_orders_projection_funds_terminal_write`（与 **`indexer_finalized_upper_bound`** 同源）。
- **`crates/api/src/routes/internal.rs`**：在 **`upsert_orders_projection_chain_snapshot`** 前调用闸门；**`indexer-tick`** 响应体与 **`GET …/internal/indexer-status`** 之 **`state`** 增补观测字段（**无新 HTTP 路由**）。

## 新增 / 对齐的观测字段

- **`finality_n_used`**：与配置 **`FINALITY_N`**（母表 **`state.finality_n`**）同源。
- **`chain_tip`**、**`indexer_finalized_upper_bound`**：**`GET …/internal/indexer-status`** 的 **`state`**（RPC 不可用时可为 **null**）；**`indexer-tick`** 成功/空跑体中 **`indexer_finalized_upper_bound`** 与 **`to_block`** 一致。

## 硬边界（未触碰）

- **不**改写 **B-114 / B-116 / P5 / Epic A / C / D / E / F** 已封口语义；**spec/110** 更广 **Target** 仍以 **B-126** 对照表与正文为准。

## 验收命令（写死）

```bash
cargo test -p traveltrust-api b127_finality_gate
```

## 测试结果（登记时）

**2 passed**，0 failed。

## 互指

- **母表**：[docs/任务母表.md](../docs/任务母表.md) **B-127**
- **总索引**：[docs/runbook/sealed-programs-and-epics-master-index.md](../docs/runbook/sealed-programs-and-epics-master-index.md)
- **evidence 入口**：[evidence/README.md · #b127-finality-gate](README.md#b127-finality-gate)
