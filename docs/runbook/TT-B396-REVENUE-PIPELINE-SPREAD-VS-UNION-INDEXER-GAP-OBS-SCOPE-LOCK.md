# TT-B396 · B-396 — Scope lock · spread vs union–indexer gap

**卡号**：`TT-B396-REVENUE-PIPELINE-SPREAD-VS-UNION-INDEXER-GAP-OBS-001` · **母表** `B-396`

---

## 单一观测面（冻结）

| 项 | 值 |
|----|-----|
| **顶键（summary / overview）** | **`revenue_pipeline_spread_vs_union_indexer_gap_observability`** |
| **机读锚** | **`396-REVENUE-PIPELINE-SPREAD-VS-UNION-INDEXER-GAP-OBS-V1`** |
| **`POST …/internal/indexer-reconcile` flag** | **`include_revenue_pipeline_spread_vs_union_indexer_gap_observability:true`**（**须** **`persist:true`** 方写入 **`reconciliation_reports.summary`**；**admin overview** 自最新 **`summary`** 回读） |
| **主导字段** | **`dominance_signal`**（**腿间** **`spread`** **与** **正** **`gap_blocks`** **之** **相对** **叙事** **；** **见** **主** **Runbook** **）** |

---

## 与 B-394 / B-395 / B-391 边界

| 卡 | 本键 **不** 替代之内容 |
|----|------------------------|
| **B-394** | **裸** **`spread_blocks` / `marker`** **叙事** **；** **本键** **重复** **携带** **同源** **数** **仅** **为** **自洽** **JSON** **，** **判读** **仍以** **B-394** **为** **spread** **真值** **面** **。** |
| **B-395** | **`spread_anomaly_layer`** **/** **缺腿** **枚举** **；** **本键** **不** **输出** **上述** **字段** **。** |
| **B-391** | **单键** **`gap_blocks = checkpoint − union_max`** **；** **本键** **重复** **`gap_blocks`** **语义** **对齐** **B-391** **，** **但** **专** **答** **与** **腿间** **`spread`** **之** **`dominance_signal`** **。** |

**checkpoint**：与 **B-391** **同源** **`ApiMetaState.indexer_checkpoint.block_number`** **（** **进程** **内存** **）** **。**
