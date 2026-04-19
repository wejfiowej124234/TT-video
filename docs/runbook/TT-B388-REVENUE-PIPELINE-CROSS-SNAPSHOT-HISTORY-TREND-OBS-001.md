# TT-B388 · B-388 `revenue_pipeline` cross-snapshot — 历史趋势与连续漂移观测

**卡号**：`TT-B388-REVENUE-PIPELINE-CROSS-SNAPSHOT-HISTORY-TREND-OBS-001` · **母表** `B-388`（承 **B-387** 单点对拍）  
**日期**：2026-04-15  
**状态**：**已实现**（**不**替代 **B-387**；**不**入 **`compound_gate`**）

---

## 1. 目的

在 **B-387**（**本次** **`rollup.marker`** vs **insert 前** **persist** **`summary`** **bundle**）之上，把 **连续两次及以上** 的 cross-snapshot 结果做成 **可追踪闭环**：

1. **时序**：对 **`orders_projection_vs_orders`** 最近 **N** 笔报告（**insert 前** **新→旧**，**cap** **32**），从 **`summary`** 抽取 **`revenue_pipeline_bundle_cross_snapshot_drift_observability`**，与 **本次** **B-387** 合并为 **`series_newest_first`**。
2. **趋势语义**（机读锚 **`388-REVENUE-PIPELINE-CROSS-SNAPSHOT-HISTORY-TREND-OBS-V1`**）：**`consecutive_drift_streak`**（自**最新**起连续 **`marker=drift`**）、**`consecutive_incomparable_tail`**、**`last_flip`**（**aligned↔drift** **最近一次**，**时间** **序** **扫描**）；**`observation_note`**：**`sparse_series_need_two_or_more_b387_points`** **/** **`ok`**。
3. **出口**：**`POST …/internal/indexer-reconcile`** 在 **`persist:true`** 且 **`include_revenue_pipeline_cross_snapshot_history_trend_observability:true`** 时写入 **`summary`** 键 **`revenue_pipeline_cross_snapshot_history_trend_observability`**；**`GET …/admin/observability/overview`** **`overview.revenue_pipeline_cross_snapshot_history_trend_observability`** **同键回读**；一键 smoke：**[`scripts/ops/b388-revenue-pipeline-cross-snapshot-history-trend-reconcile-admin-overview-smoke.sh`](../../scripts/ops/b388-revenue-pipeline-cross-snapshot-history-trend-reconcile-admin-overview-smoke.sh)**（**reconcile** **JSON** **深相等** **admin overview**）。

---

## 2. 边界

| 项 | 说明 |
|----|------|
| **不**重复 | **B-387** 仍负责 **单步** **prior vs current**；本卡只做 **≥2** **点** **序列** **/ 滚动聚合**。 |
| **数据源** | 仅 **`reconciliation_reports.summary`** 已落库字段 + 本次计算；**不**引入新表。 |
| **gate** | **不**参与 **`indexer_reconcile_compound_pass`**。 |

---

## 3. 验收（实现轮）

- [x] **`cargo test -p traveltrust-api`** 绿。  
- [x] **`bash scripts/run-check-04-routes.sh`** **exit** **0**。  
- [x] **`docs/spec/04-后端与API.md`** **`indexer-reconcile`** / **`admin/observability/overview`** 契约句与 **新键** **同批**。  
- [x] **`bash scripts/ops/b388-revenue-pipeline-cross-snapshot-history-trend-reconcile-admin-overview-smoke.sh`** **exit** **0**（**勿** **含** **密钥**；**须** **目标** **环境** **API** **+** **`DATABASE_URL`** **+** **链** **与** **B-386～B-387** **一致**）。  
- [x] **母表** **B-388** **状态** **列** **封口**（**§5.1** **留证** **见** **下**）。

---

## 4. 互证

| 文档 / 代码 | 说明 |
|-------------|------|
| **B-387** | [`TT-B387-REVENUE-PIPELINE-BUNDLE-CROSS-SNAPSHOT-DRIFT-VERIFY-001.md`](./TT-B387-REVENUE-PIPELINE-BUNDLE-CROSS-SNAPSHOT-DRIFT-VERIFY-001.md) |
| **趋势参照** | **B-156** **`orders_chain_health_trend_snapshot`** **`merge_*`** 模式（**`crates/api/src/db/reconciliation_reports.rs`**） |
| **实现** | **`crates/api/src/db/revenue_pipeline_cross_snapshot_history_trend_obs.rs`**、**`crates/api/src/routes/internal/reconcile/indexer_reconcile.rs`** |

---

## 5. 验收（封口 · 与 **B-387** **同形**）

- [x] **§3 运行时 smoke**：[`scripts/ops/b388-revenue-pipeline-cross-snapshot-history-trend-reconcile-admin-overview-smoke.sh`](../../scripts/ops/b388-revenue-pipeline-cross-snapshot-history-trend-reconcile-admin-overview-smoke.sh) **`exit 0`**。

### §5.1 留证句式（§3 **`exit 0`** 后补录）

- **命令**：`bash scripts/ops/b388-revenue-pipeline-cross-snapshot-history-trend-reconcile-admin-overview-smoke.sh`  
- **脚本末行示例**（**无** **密钥**）：`ok (observation_note=<ok|sparse_series_need_two_or_more_b387_points>; consecutive_drift_streak=<n>; anchor=388-REVENUE-PIPELINE-CROSS-SNAPSHOT-HISTORY-TREND-OBS-V1; reconcile == admin overview)`  
- **本仓库封口留证（2026-04-15 · 本地目标环境）**  
  - **`API_BASE_URL`**：**`http://127.0.0.1:8080`**。  
  - **脚本末行（脱敏）**：`ok (observation_note=ok; consecutive_drift_streak=0; anchor=388-REVENUE-PIPELINE-CROSS-SNAPSHOT-HISTORY-TREND-OBS-V1; reconcile == admin overview)`  
  - **依赖**：**须** **先** **具备** **B-387** **同源** **链** **+** **DB** **；** **三步** **POST** **见** **脚本** **头注释**。
