# TT-B390 · B-390 `revenue_pipeline` freshness → drift 关联 suspect 观测

**卡号**：`TT-B390-REVENUE-PIPELINE-FRESHNESS-DRIFT-SUSPECT-OBS-001` · **母表** `B-390`（承 **B-389** + **B-386** **bundle**）  
**日期**：2026-04-15  
**状态**：**已实现**（**不**入 **`compound_gate`**）

---

## 1. 目的

在 **B-389**（**最近** **B-386** **bundle** **persist** **年龄**）与 **B-386**（**三腿** **`marker`** **+** **`rollup.marker`**）之间建立 **机读关联**：当 **freshness** **异常**（**无** **历史** **bundle** **报告** **或** **`age_seconds`****>****`TRAVELTRUST_REVENUE_PIPELINE_FRESHNESS_STALE_SUSPECT_SECS`**，**默认** **86400**）时，对 **本** **次** **请求** **已** **算得** **之** **B-386** **bundle** **逐** **腿** **/** **`rollup`** 输出 **`suspect_due_to_freshness`**：

- **`freshness_abnormal_reason`****=****`missing_bundle`**：**三** **腿** **+** **`rollup`** **一律** **`true`**（**无** **可** **对齐** **之** **persist** **基线**）。
- **`stale`**：**仅** **`marker`****∈****`drift`****/****`incomparable`** **之** **腿** **与** **`rollup`** **为** **`true`**。

**无** **同** **请求** **B-386** **bundle** **体** **时**：**`bundle_in_request:false`**，**`suspect_due_to_freshness`** **为** **`null`**（**不** **臆造** **marker**）。

**出口**：**`POST …/internal/indexer-reconcile`** **`persist:true`** **且** **`include_revenue_pipeline_freshness_drift_suspect_observability:true`**（**隐式** **拉取** **B-389** **同源** **DB** **元数据**；**与** **`include_revenue_pipeline_latest_persist_freshness_observability`** **共享** **一次** **查询**）；**`GET …/admin/observability/overview`** **`overview.revenue_pipeline_freshness_drift_suspect_observability`** **同键回读**；一键 smoke：**[`scripts/ops/b390-revenue-pipeline-freshness-drift-suspect-reconcile-admin-overview-smoke.sh`](../../scripts/ops/b390-revenue-pipeline-freshness-drift-suspect-reconcile-admin-overview-smoke.sh)**。

---

## 2. 边界

| 项 | 说明 |
|----|------|
| **不**替代 | **不** **改写** **B-383～B-389** **子** **观测** **JSON** **形状**；**只** **追加** **关联** **布尔** **。 |
| **ENV** | **`TRAVELTRUST_REVENUE_PIPELINE_FRESHNESS_STALE_SUSPECT_SECS`**（**正** **整数** **秒**；**非法** **或** **缺省** **→** **86400**）。 |

---

## 3. 验收（实现轮）

- [x] **`cargo test -p traveltrust-api`**（**含** **`revenue_pipeline_freshness_drift_suspect`** **模块** **单测**）绿。  
- [x] **`bash scripts/run-check-04-routes.sh`** **exit** **0**。  
- [x] **`docs/spec/04-后端与API.md`** **契约句** **同批**。  
- [x] **`bash scripts/ops/b390-revenue-pipeline-freshness-drift-suspect-reconcile-admin-overview-smoke.sh`** **exit** **0**（**勿** **含** **密钥**）。  

---

## 4. 互证

| 文档 / 代码 | 说明 |
|-------------|------|
| **B-389** | [`TT-B389-REVENUE-PIPELINE-LATEST-PERSIST-FRESHNESS-OBS-001.md`](./TT-B389-REVENUE-PIPELINE-LATEST-PERSIST-FRESHNESS-OBS-001.md) |
| **实现** | **`crates/api/src/db/revenue_pipeline_freshness_drift_suspect_obs.rs`**、**`indexer_reconcile.rs`** |

---

## 5. 验收（封口）

- [x] **§3 运行时 smoke**：[`scripts/ops/b390-revenue-pipeline-freshness-drift-suspect-reconcile-admin-overview-smoke.sh`](../../scripts/ops/b390-revenue-pipeline-freshness-drift-suspect-reconcile-admin-overview-smoke.sh) **`exit 0`**。

### §5.1 留证句式

- **命令**：`bash scripts/ops/b390-revenue-pipeline-freshness-drift-suspect-reconcile-admin-overview-smoke.sh`  
- **脚本末行示例**：`ok (freshness_abnormal_reason=…; bundle_in_request=true; anchor=390-REVENUE-PIPELINE-FRESHNESS-DRIFT-SUSPECT-OBS-V1; reconcile == admin overview)`  
- **本仓库封口留证（2026-04-15）**：*（跑通后补一行 `ok (...)`）*
