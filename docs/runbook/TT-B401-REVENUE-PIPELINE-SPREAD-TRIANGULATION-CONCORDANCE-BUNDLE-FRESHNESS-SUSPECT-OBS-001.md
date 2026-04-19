# TT-B401 · B-401 `revenue_pipeline` — B-400 bundle × B-389 freshness suspect 观测

**卡号**：`TT-B401-REVENUE-PIPELINE-SPREAD-TRIANGULATION-CONCORDANCE-BUNDLE-FRESHNESS-SUSPECT-OBS-001` · **母表** `B-401`（承 **B-389** + **B-400**）  
**日期**：2026-04-15  
**状态**：**已实现**（**不**入 **`compound_gate`**）

**Scope 锁定**：[TT-B401-REVENUE-PIPELINE-SPREAD-TRIANGULATION-CONCORDANCE-BUNDLE-FRESHNESS-SUSPECT-OBS-SCOPE-LOCK.md](./TT-B401-REVENUE-PIPELINE-SPREAD-TRIANGULATION-CONCORDANCE-BUNDLE-FRESHNESS-SUSPECT-OBS-SCOPE-LOCK.md)

**规划登记已 superseded**：[TT-B401-REVENUE-PIPELINE-POST-B400-NEXT-SLICE-PLANNING-001.md](./TT-B401-REVENUE-PIPELINE-POST-B400-NEXT-SLICE-PLANNING-001.md)

---

## 1. 目的

在 **B-389**（**最近** **B-386** **hub** **报告** **年龄**）与 **B-400**（**B-398/B-399** **`components`** **+** **`rollup.marker`**）之间建立 **机读关联**（**与** **B-390** **同** **族** **`classify_freshness`** **/** **`suspect_for_marker`** **，** **bundle** **换** **为** **B-400** **）**：**`b400_bundle_in_request:false`** 时 **`suspect_due_to_freshness`** **`null`**；**否则** 按 **`freshness_abnormal_reason`** **与** **子** **`marker`** **输出** **`suspect_due_to_freshness`** **与** **`rollup_suspect_due_to_freshness`**。

**出口**：**`POST …/internal/indexer-reconcile`** **`persist:true`** **且** **`include_revenue_pipeline_spread_triangulation_concordance_bundle_freshness_suspect_observability:true`**（**隐式** **B-389** **base** **+** **B-400** **bundle** **同** **请求** **计算**）；**`GET …/admin/observability/overview`** **`overview.revenue_pipeline_spread_triangulation_concordance_bundle_freshness_suspect_observability`**；一键 smoke：**[`scripts/ops/b401-revenue-pipeline-spread-triangulation-concordance-bundle-freshness-suspect-reconcile-admin-overview-smoke.sh`](../../scripts/ops/b401-revenue-pipeline-spread-triangulation-concordance-bundle-freshness-suspect-reconcile-admin-overview-smoke.sh)**。

---

## 2. 锚与请求键（v1）

| 项 | 值 |
|----|-----|
| **机读锚** | **`401-REVENUE-PIPELINE-SPREAD-TRIANGULATION-CONCORDANCE-BUNDLE-FRESHNESS-SUSPECT-OBS-V1`** |
| **summary / overview 键** | **`revenue_pipeline_spread_triangulation_concordance_bundle_freshness_suspect_observability`** |
| **`POST …/internal/indexer-reconcile` body** | **`include_revenue_pipeline_spread_triangulation_concordance_bundle_freshness_suspect_observability:true`**（**须** **`persist:true`** **以** **落** **`summary`** **；** **隐式** **B-400** **bundle** **+** **B-398/B-399** **子** **键** **）** |

**实现**：`crates/api/src/db/revenue_pipeline_spread_triangulation_concordance_bundle_freshness_suspect_obs.rs`；**契约**：`docs/spec/04-后端与API.md` **§3.4**；**运维**：`ops/RUNBOOK.md` **§2.55**。

---

## 3. 验收（实现轮）

- [x] **`cargo test -p traveltrust-api`** 绿。  
- [x] **`bash scripts/run-check-04-routes.sh`** **exit** **0**。  
- [x] **`docs/spec/04-后端与API.md`** **契约句** **同批**。  
- [ ] **`bash scripts/ops/b401-revenue-pipeline-spread-triangulation-concordance-bundle-freshness-suspect-reconcile-admin-overview-smoke.sh`** **exit** **0**（**目标** **环境** **；** **勿** **含** **密钥** **）** **。**

---

## 4. 互证

| 文档 / 代码 | 说明 |
|-------------|------|
| **B-389 / B-390 / B-400** | 语义 **族** **与** **worst-of** **bundle** |
| **代码** | **`revenue_pipeline_spread_triangulation_concordance_bundle_freshness_suspect_observability_v1`** **/** **`admin_last_*`** **/** **`indexer-reconcile` body** **/** **admin overview** |
