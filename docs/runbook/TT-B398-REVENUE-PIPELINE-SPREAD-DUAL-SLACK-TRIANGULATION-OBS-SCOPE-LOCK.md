# TT-B398 · B-398 — Scope lock · spread 双 slack 三角化

**卡号**：`TT-B398-REVENUE-PIPELINE-SPREAD-DUAL-SLACK-TRIANGULATION-OBS-001` · **母表** `B-398`

---

## 纳入（IN）

| 项 | 说明 |
|----|------|
| **只读** | **DB** **三** **经济** **投影** **腿** **`max(block_number)`** **、** **`event_log`** **尾块** **、** **进程** **indexer checkpoint** **（** **与** **B-391/B-392/B-394** **同源** **）** |
| **单顶键** | **`revenue_pipeline_spread_dual_slack_triangulation_observability`** **+** **`triangulation_signal`** **（** **schema** **v1** **在** **主** **Runbook** **定稿** **）** |
| **显式** **flag** | **`include_revenue_pipeline_spread_dual_slack_triangulation_observability:true`** |

---

## 排除（OUT）

| 项 | 说明 |
|----|------|
| **不** **替代** | **B-396** **/** **B-397** **各自** **`dominance_signal`** **单轴** **叙事** |
| **不** **输出** | **`spread_anomaly_layer`** **（** **B-395** **独占** **）** |
| **不** **入** | **`compound_gate`** |
| **不** **重做** | **B-393** **union** **checkpoint** **vs** **tail** **bundle** **（** **无** **腿间** **`spread`** **）** |

---

## 与邻卡关系

- **B-396** **/** **B-397**：**本** **键** **在** **双** **slack** **可比** **且** **`inter_leg_drift`** **时** **提供** **第三** **视角** **；** **缺** **条件** **时** **`triangulation_signal`** **须** **落** **`n_a_*`** **族** **，** **与** **B-395** **分层** **空** **/** **单腿** **表面** **可** **并读** **。**
