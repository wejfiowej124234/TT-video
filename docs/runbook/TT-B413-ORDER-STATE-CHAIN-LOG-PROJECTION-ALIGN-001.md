# TT-B413 · B-413 — 订单状态事实：链上日志与投影对齐

**母表**：[B-413](../任务母表.md)  
**卡号**：`TT-B413-ORDER-STATE-CHAIN-LOG-PROJECTION-ALIGN-001`  
**状态**：已封口（2026-04-16）

---

## 1. 验收封口

**观测键（锚）**：`413-ORDER-STATE-FACTS-CHAIN-ALIGN-OBS-V1` → **`order_state_transition_facts_chain_align_observability`**（**`POST …/internal/indexer-reconcile`** + **`GET …/admin/observability/overview`** 同键回读；**不**新开 spread 类母表键）。

**代码锚**：`crates/api/src/db/order_state_transition_facts.rs`；`crates/api/src/routes/internal/reconcile/indexer_reconcile.rs`（B-413 接线）。

---

## 2. 互证

- **[spec/04](../spec/04-后端与API.md)**（订单 / 状态契约）· **[spec/110](../spec/110-阶段开发链上索引器与事件同步器.md)**  
- **[TT-B409](./TT-B409-ORDER-STATE-MACHINE-CHAIN-OFF-53-001.md)**、**[TT-B414](./TT-B414-REVENUE-E2E-GO-LIVE-CLOSEOUT-001.md)**（收口编排引用 B-413 键）  
- **[任务母表 B-413](../任务母表.md)**
