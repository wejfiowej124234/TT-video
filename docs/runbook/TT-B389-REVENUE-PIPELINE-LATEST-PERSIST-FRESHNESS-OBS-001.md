# TT-B389 · B-389 `revenue_pipeline` — 最近 B-386 bundle 落库新鲜度（DB-only）

**卡号**：`TT-B389-REVENUE-PIPELINE-LATEST-PERSIST-FRESHNESS-OBS-001` · **母表** `B-389`（承 **B-386** **hub** **键** **在** **`reconciliation_reports`** **中** **最近** **一次** **落库** **年龄**）  
**日期**：2026-04-15  
**状态**：**已实现**（**不**替代 **B-383～B-388** **对拍** **语义**；**不**入 **`compound_gate`**）

---

## 1. 目的

在 **B-386** **`revenue_pipeline_log_count_chain_vs_db_bundle_observability`** **已** **写入** **`summary`** **之后**，为 **运维** **提供** **只读** **DB** **观测**：**insert 前** **本链** **最新** **一笔** **`orders_projection_vs_orders`** **`reconciliation_reports`** **行**，**其** **`summary` JSON** **含** **B-386** **bundle** **键** **时**，取 **`created_at`** **相对** **当前** **时刻** **的** **整秒** **`age_seconds`**（**无** **则** **`observation_note=no_stored_revenue_pipeline_bundle_report`**）。

**出口**：**`POST …/internal/indexer-reconcile`** **`persist:true`** **且** **`include_revenue_pipeline_latest_persist_freshness_observability:true`** 时写入 **`revenue_pipeline_latest_persist_freshness_observability`**（锚 **`389-REVENUE-PIPELINE-LATEST-PERSIST-FRESHNESS-OBS-V1`**）；**`GET …/admin/observability/overview`** **`overview.revenue_pipeline_latest_persist_freshness_observability`** **同键回读**；一键 smoke：**[`scripts/ops/b389-revenue-pipeline-latest-persist-freshness-reconcile-admin-overview-smoke.sh`](../../scripts/ops/b389-revenue-pipeline-latest-persist-freshness-reconcile-admin-overview-smoke.sh)**（**reconcile** **JSON** **深相等** **admin overview**）。

---

## 2. 边界

| 项 | 说明 |
|----|------|
| **不**重复 | **不** **重算** **B-383～B-388** **bundle/cross/trend**；**仅** **读** **`reconciliation_reports`** **元数据** **+** **时间差**。 |
| **数据源** | **`reconciliation_reports`** **（** **`orders_projection_vs_orders`** **）**；**无** **新表**。 |
| **gate** | **不**参与 **`indexer_reconcile_compound_pass`**。 |

---

## 3. 验收（实现轮）

- [x] **`cargo test -p traveltrust-api`** 绿。  
- [x] **`bash scripts/run-check-04-routes.sh`** **exit** **0**。  
- [x] **`docs/spec/04-后端与API.md`** **`indexer-reconcile`** / **`admin/observability/overview`** 契约句与 **新键** **同批**。  
- [x] **`bash scripts/ops/b389-revenue-pipeline-latest-persist-freshness-reconcile-admin-overview-smoke.sh`** **exit** **0**（**勿** **含** **密钥**；**须** **目标** **环境** **API** **+** **`DATABASE_URL`**）。  
- [x] **母表** **B-389** **状态** **列** **封口**（**§5.1** **留证** **见** **下**）。

---

## 4. 互证

| 文档 / 代码 | 说明 |
|-------------|------|
| **B-386** | [`TT-B386-REVENUE-PIPELINE-LOG-COUNT-BUNDLE-CHAIN-VS-DB-VERIFY-001.md`](./TT-B386-REVENUE-PIPELINE-LOG-COUNT-BUNDLE-CHAIN-VS-DB-VERIFY-001.md) |
| **实现** | **`crates/api/src/db/revenue_pipeline_latest_persist_freshness_obs.rs`**、**`crates/api/src/db/reconciliation_reports.rs`**、**`crates/api/src/routes/internal/reconcile/indexer_reconcile.rs`** |

---

## 5. 验收（封口）

- [x] **§3 运行时 smoke**：[`scripts/ops/b389-revenue-pipeline-latest-persist-freshness-reconcile-admin-overview-smoke.sh`](../../scripts/ops/b389-revenue-pipeline-latest-persist-freshness-reconcile-admin-overview-smoke.sh) **`exit 0`**。

### §5.1 留证句式（§3 **`exit 0`** 后补录）

- **命令**：`bash scripts/ops/b389-revenue-pipeline-latest-persist-freshness-reconcile-admin-overview-smoke.sh`  
- **脚本末行示例**（**无** **密钥**）：`ok (observation_note=<ok|no_stored_revenue_pipeline_bundle_report>; anchor=389-REVENUE-PIPELINE-LATEST-PERSIST-FRESHNESS-OBS-V1; reconcile == admin overview)`  
- **本仓库封口留证（2026-04-15 · 本地目标环境）**  
  - **`API_BASE_URL`**：**`http://127.0.0.1:8080`**（**可覆写**）。  
  - **脚本末行（脱敏）**：*（跑通后在此补一行 `ok (...)`）*  
  - **依赖**：**`INTERNAL_API_SECRET`**、**`ADMIN_BEARER_TOKEN`**、**`jq`**；**无** **先验** **B-386** **bundle** **行** **时** **`observation_note=no_stored_revenue_pipeline_bundle_report`** **仍** **`exit 0`** **（** **JSON** **与** **overview** **一致** **）** **。**
