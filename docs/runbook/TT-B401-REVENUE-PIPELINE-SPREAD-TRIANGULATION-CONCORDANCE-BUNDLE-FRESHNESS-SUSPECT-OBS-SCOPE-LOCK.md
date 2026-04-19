# TT-B401 · B-401 — Scope lock · bundle × freshness suspect

**卡号**：`TT-B401-REVENUE-PIPELINE-SPREAD-TRIANGULATION-CONCORDANCE-BUNDLE-FRESHNESS-SUSPECT-OBS-001` · **母表** `B-401`

---

## 纳入（IN）

| 项 | 说明 |
|----|------|
| **freshness 基线** | **与** **B-389** **同源** **`latest_revenue_pipeline_bundle_report_meta_for_chain`** **→** **`revenue_pipeline_latest_persist_freshness_observability_v1`** **（** **共享** **查询** **路径** **）** |
| **bundle 体** | **本** **次** **reconcile** **已** **算得** **之** **`revenue_pipeline_spread_triangulation_concordance_bundle_observability`** **（** **B-400** **）** **；** **无** **则** **`b400_bundle_in_request:false`** **且** **`suspect_due_to_freshness`** **`null`** |
| **阈值** | **`TRAVELTRUST_REVENUE_PIPELINE_FRESHNESS_STALE_SUSPECT_SECS`** **（** **与** **B-390** **同** **ENV** **）** |
| **显式 flag** | **`include_revenue_pipeline_spread_triangulation_concordance_bundle_freshness_suspect_observability:true`** |

---

## 排除（OUT）

| 项 | 说明 |
|----|------|
| **不** **新** **历史** **序列** | **不** **做** **跨** **persist** **`rollup.marker`** **时间** **序列** **/** **streak** **（** **见** **规划** **候选** **轴** **1** **；** **非** **本** **卡** **）** |
| **不** **改** **子** **腿** **形状** | **不** **改写** **B-398/B-399/B-400** **JSON** **；** **只** **追加** **关联** **suspect** **布尔** **族** |
| **不** **入** | **`compound_gate`** |

---

## 与邻卡关系

- **B-389 / B-390**：**freshness** **与** **`stale_suspect_threshold_seconds`** **同源** **语义** **；** **bundle** **换** **B-400** **（** **非** **B-386** **）** **。**
- **B-400**：**须** **同** **请求** **内** **已** **计算** **B-400** **bundle** **（** **B-401** **flag** **隐式** **拉起** **B-398/B-399/B-400** **）** **。**
