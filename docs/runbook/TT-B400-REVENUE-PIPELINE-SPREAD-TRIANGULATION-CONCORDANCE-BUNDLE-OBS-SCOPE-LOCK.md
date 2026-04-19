# TT-B400 · B-400 — Scope lock · spread triangulation–concordance bundle

**卡号**：`TT-B400-REVENUE-PIPELINE-SPREAD-TRIANGULATION-CONCORDANCE-BUNDLE-OBS-001` · **母表** `B-400`

---

## 纳入（IN）

| 项 | 说明 |
|----|------|
| **只读组装** | **`components`** **内** **完整** **嵌入** **B-398** **/** **B-399** **JSON** **（** **与** **单** **独** **请求** **两** **键** **时** **同源** **计算** **）** |
| **rollup** | **`rollup.marker`** **=** **worst-of** **（** **`drift`** **>** **`incomparable`** **>** **`aligned`** **）** **子** **`marker`** **（** **与** **B-393** **同** **族** **）** |
| **显式** **flag** | **`include_revenue_pipeline_spread_triangulation_concordance_bundle_observability:true`** **（** **须** **`persist:true`** **以** **落** **`summary`** **供** **overview** **回读** **）** |

---

## 排除（OUT）

| 项 | 说明 |
|----|------|
| **不** **重算** | **B-394～B-397** **腿面** **（** **`spread_blocks`** **/** **`gap_blocks`** **/** **`tail_slack_blocks`** **等** **）** **—** **仅** **调** **B-398** **/** **B-399** **已有** **异步** **入口** |
| **不** **新设** | **第三** **套** **`dominance_signal`** **/** **`triangulation_signal`** **/** **`concordance_signal`** **语义** **—** **bundle** **顶** **层** **仅** **`rollup.marker`** **+** **`components`** |
| **不** **替代** | **独立** **B-398** **/** **B-399** **运维** **叙事** **；** **bundle** **为** **并列** **总览** |
| **不** **入** | **`compound_gate`** |

---

## 与邻卡关系

- **B-398** **/** **B-399**：**子** **对象** **锚** **与** **单** **键** **响应** **一致** **；** **本** **键** **锚** **独立** **（** **`400-…`** **）** **。**
- **B-393**：**同** **worst-of** **`marker`** **rollup** **模式** **，** **子** **腿** **换** **为** **B-398/B-399** **。**
