# TT-B399 · B-399 — Scope lock · spread 双轴 dominance 一致性

**卡号**：`TT-B399-REVENUE-PIPELINE-SPREAD-DUAL-AXIS-DOMINANCE-CONCORDANCE-OBS-001` · **母表** `B-399`

---

## 纳入（IN）

| 项 | 说明 |
|----|------|
| **只读** | **与** **B-396/B-397** **同源** **DB** **三腿** **`max(block_number)`** **、** **`event_log`** **尾块** **、** **进程** **indexer checkpoint** |
| **单顶键** | **`revenue_pipeline_spread_dual_axis_dominance_concordance_observability`** **+** **`concordance_signal`** **（** **由** **两** **`dominance_signal`** **字符串** **推导** **）** |
| **显式** **flag** | **`include_revenue_pipeline_spread_dual_axis_dominance_concordance_observability:true`** **（** **须** **`persist:true`** **）** |

---

## 排除（OUT）

| 项 | 说明 |
|----|------|
| **不** **输出** | **`triangulation_signal`** **、** **`tighter_slack_axis`** **（** **B-398** **独占** **）** |
| **不** **输出** | **`spread_anomaly_layer`** **（** **B-395** **独占** **）** |
| **不** **替代** | **B-396** **/** **B-397** **各自** **单轴** **`dominance_signal`** **叙事** |
| **不** **入** | **`compound_gate`** |

---

## 与邻卡关系

- **B-398**：**三角化** **专答** **双正** **slack** **下** **`spread`** **相对** **`min/max(gap,tail)`** **；** **本** **键** **仅** **比较** **两** **`dominance_signal`** **是否** **同向** **或** **落** **`n_a_*`** **/** **张力** **桶** **。**
