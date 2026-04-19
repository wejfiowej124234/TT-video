# TT-B397 · B-397 — Scope lock · spread vs event_log tail slack

**卡号**：`TT-B397-REVENUE-PIPELINE-SPREAD-VS-EVENT-LOG-TAIL-OBS-001` · **母表** `B-397`

---

## 单一观测面（冻结）

| 项 | 值 |
|----|-----|
| **顶键（summary / overview）** | **`revenue_pipeline_spread_vs_event_log_tail_observability`** |
| **机读锚** | **`397-REVENUE-PIPELINE-SPREAD-VS-EVENT-LOG-TAIL-OBS-V1`** |
| **`POST …/internal/indexer-reconcile` flag** | **`include_revenue_pipeline_spread_vs_event_log_tail_observability:true`**（**须** **`persist:true`** 方写入 **`reconciliation_reports.summary`**；**admin overview** 自最新 **`summary`** 回读） |
| **主导字段** | **`dominance_signal`**（**腿间** **`spread_blocks`** **与** **正** **`tail_slack_blocks`** **（** **`event_log_max_block_number − union_max`** **，** **与** **B-392** **同源** **）** **之** **相对** **叙事** **）** |

---

## 与 B-391～B-396 边界

| 卡 | 本键 **不** 替代之内容 |
|----|------------------------|
| **B-392** | **单键** **`tail_slack_blocks`** **/** **`event_log_max_block_number`** **计** **面** **；** **本键** **重复** **同源** **数** **仅** **为** **与** **`spread`** **合读** **，** **判读** **ingestion** **尾** **间隙** **仍以** **B-392** **为** **真值** **面** **。** |
| **B-394** | **裸** **`spread_blocks` / `marker`** **叙事** **；** **本键** **重复** **携带** **同源** **数** **仅** **为** **自洽** **JSON** **。** |
| **B-395** | **`spread_anomaly_layer`** **/** **缺腿** **枚举** **；** **本键** **不** **输出** **`spread_anomaly_layer`** **。** |
| **B-396** | **`gap_blocks = checkpoint − union_max`** **与** **checkpoint** **叙事** **；** **本键** **对** **`event_log`** **尾** **间隙** **（** **`tail_slack_blocks`** **）** **，** **与** **B-396** **正交** **。** |

**`event_log_max_block_number`**：与 **B-392** **同源** **`event_log_max_block_number_for_chain`** **（** **DB** **）** **。**
