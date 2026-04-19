# TT-B387 · B-387 `revenue_pipeline` bundle — 跨 persist `rollup.marker` 快照对拍

**卡号**：`TT-B387-REVENUE-PIPELINE-BUNDLE-CROSS-SNAPSHOT-DRIFT-OBS-001` · **母表** `B-387`（承 **B-386** bundle）  
**日期**：2026-04-15  
**范围**：**运维验证 / 证据**；对比 **本次 reconcile** 计算的 **B-386** **`rollup.marker`** 与 **本笔 insert 之前** 最新已落库 **`summary`** 内同键 bundle；**不**入 **`compound_gate`**。

---

## 1. 目的

在 **本地** 或 **测试链** 上证明：

1. **`POST /api/v1/internal/indexer-reconcile`** 在 **`persist:true`** 且 **`include_revenue_pipeline_bundle_cross_snapshot_observability:true`** 时，**`200`** 根级 **`revenue_pipeline_bundle_cross_snapshot_drift_observability`**（锚 **`387-REVENUE-PIPELINE-BUNDLE-CROSS-SNAPSHOT-DRIFT-OBS-V1`**）与 **`persist` 写入的 `summary` 同键**。
2. **`GET /api/v1/admin/observability/overview`** 的 **`overview.revenue_pipeline_bundle_cross_snapshot_drift_observability`** 自最新 **`orders_projection_vs_orders`** 报告 **`summary`** **回读**，与 **(1)** **同一次 reconcile 响应** 内该键 **JSON 深相等**。

**隐式行为**：**cross_snapshot** 为 **true** 时，服务端 **同时** 计算 **B-386** **bundle**（含 **B-383/B-384/B-385** 三腿）。

**语义**：**无** 上一份 **`orders_projection_vs_orders`** 报告、或 **prior** **`summary`** **缺** **`revenue_pipeline_log_count_chain_vs_db_bundle_observability`**、或任一侧 **缺** **`rollup.marker`** 时，体 **`marker`**=`**`incomparable`**`；否则比较 **`rollup.marker`**，**`aligned`** / **`drift`**，并附 **`rollup_marker_delta`**（**`none`** / **`changed`**）。

---

## 2. 前置条件

| 项 | 说明 |
|----|------|
| **进程** | API 已监听。 |
| **DB** | **`DATABASE_URL`**；与 **B-383～B-386** 相同之三投影表就绪。 |
| **链** | **`CHAIN_RPC_URL`**、**`ESCROW_FACTORY_ADDRESS`** 等与 **`indexer-reconcile`** 一致。 |
| **内部密钥** | **`INTERNAL_API_SECRET`**。 |
| **Admin** | **admin** **Bearer**。 |

---

## 3. 一键 smoke（机读）

**须** 先 **persist** 一笔 **仅** **B-386** **bundle**（或等价地保证库内已有一份带 **`revenue_pipeline_log_count_chain_vs_db_bundle_observability`** 的 **`orders_projection_vs_orders`** 报告），再跑 **cross_snapshot**；脚本 **`scripts/ops/b387-revenue-pipeline-bundle-cross-snapshot-reconcile-admin-overview-smoke.sh`** 已内置 **两步 POST**。

```bash
export API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:8080}"
export INTERNAL_API_SECRET="***"
export ADMIN_BEARER_TOKEN="***"
bash scripts/ops/b387-revenue-pipeline-bundle-cross-snapshot-reconcile-admin-overview-smoke.sh
```

- **退出码 `0`**：第二次 reconcile 与 overview 该键 **深相等**，**`anchor`**=`**`387-REVENUE-PIPELINE-BUNDLE-CROSS-SNAPSHOT-DRIFT-OBS-V1`**。  
- **`marker`**：**`aligned`** / **`drift`** / **`incomparable`** 均可能；封口 **exit 0** 只要求 **两段 JSON 一致**，**不**强制 **`aligned`**。

---

## 4. 互证

| 文档 / 代码 | 说明 |
|-------------|------|
| **母表 B-387** | [`docs/任务母表.md`](../任务母表.md) |
| **实现** | `crates/api/src/db/revenue_pipeline_bundle_cross_snapshot_obs.rs`；**prior** 读取 **`indexer_reconcile`** 内 **`get_latest_reconciliation_report_by_type`**（**insert 前**） |
| **04** | [`docs/spec/04-后端与API.md`](../spec/04-后端与API.md) **`indexer-reconcile`** / **`admin/observability/overview`** |

---

## 5. 验收（封口）

- [x] **`cargo test -p traveltrust-api`** 绿（**864** **passed**，**2026-04-15**）。  
- [x] **`bash scripts/run-check-04-routes.sh`** **exit** **0**（**2026-04-15**）。  
- [x] **§3 运行时封口**：**`GET /health`** **200** 之 **目标环境** 下执行 [`scripts/ops/b387-revenue-pipeline-bundle-cross-snapshot-reconcile-admin-overview-smoke.sh`](../../scripts/ops/b387-revenue-pipeline-bundle-cross-snapshot-reconcile-admin-overview-smoke.sh) **`exit 0`**；**勿**在证据中贴密钥；**`marker`** **/** **`rollup_marker_delta`** **/** **`anchor`** **见** **§5.1**。

### §5.1 留证句式（§3 **`exit 0`** 后补录）

- **命令**：`bash scripts/ops/b387-revenue-pipeline-bundle-cross-snapshot-reconcile-admin-overview-smoke.sh`  
- **脚本末行示例**（**无** **密钥**）：`ok (marker=<aligned|drift|incomparable>; rollup_marker_delta=<none|changed>; anchor=387-REVENUE-PIPELINE-BUNDLE-CROSS-SNAPSHOT-DRIFT-OBS-V1; reconcile == admin overview)`  
- **与 B-386 同链最小 ENV 时**：**`marker`** **常与** **`rollup.marker`** **worst-of** **同向**（**可** **`incomparable`** **/** **`aligned`** **/** **`drift`**）。
- **本仓库封口留证（2026-04-15 · 本地目标环境）**  
  - **`API_BASE_URL`**：**`http://127.0.0.1:8080`**（与 **`PORT=8080`** **监听** **一致**）。  
  - **脚本末行（脱敏）**：`ok (marker=aligned; rollup_marker_delta=none; anchor=387-REVENUE-PIPELINE-BUNDLE-CROSS-SNAPSHOT-DRIFT-OBS-V1; reconcile == admin overview)`  
  - **说明**：**`INTERNAL_API_SECRET`** **与** **admin** **`Authorization: Bearer`** **须** **与** **进程** **一致**；**未** **配全** **三腿** **合约** **窗** **时** **`marker=incomparable`** **仍** **可** **封口** **（** **脚本** **只** **要求** **reconcile** **与** **overview** **深相等** **）**。
