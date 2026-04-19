# TT-B386 · B-386 经济投影三腿汇总 — `revenue_pipeline` bundle 对拍

**卡号**：`TT-B386-REVENUE-PIPELINE-LOG-COUNT-CHAIN-VS-DB-BUNDLE-OBS-001` · **母表** `B-386`（承 **B-383/B-384/B-385** 汇总）  
**日期**：2026-04-15  
**范围**：**运维验证 / 证据**；**不**替代子卡 **B-383/B-384/B-385** 独立观测；**`rollup.marker`** 为 **worst-of**：**`drift`** **>** **`unavailable`** **>** **`incomparable`** **>** **`aligned`**。

---

## 1. 目的

在 **本地** 或 **测试链** 上证明：

1. **`POST /api/v1/internal/indexer-reconcile`** 在 **`persist:true`** 且 **`include_revenue_pipeline_log_count_chain_vs_db_bundle_observability:true`** 时，**`200`** 根级 **`revenue_pipeline_log_count_chain_vs_db_bundle_observability`**（含 **`components`** 三子观测与 **`rollup.marker`**）与 **`persist` 写入的 `summary` 同键**。
2. **`GET /api/v1/admin/observability/overview`** 的 **`overview.revenue_pipeline_log_count_chain_vs_db_bundle_observability`** 自最新 **`orders_projection_vs_orders`** 报告 **`summary`** **回读**，与 **(1)** **同一次 reconcile 响应** 内该键 **JSON 深相等**。

**隐式行为**：**bundle** 为 **true** 时，服务端 **同时** 计算 **B-383/B-384/B-385** 三腿（**无需**再单独传三个 **`include_*`**）。

---

## 2. 前置条件

| 项 | 说明 |
|----|------|
| **进程** | API 已监听。 |
| **DB** | **`DATABASE_URL`**；三投影表迁移齐全（**`fee_router_routed_events`** / **`region_vault_forwarded_events`** / **`p5_country_ledger_lines`**）。 |
| **链** | **`CHAIN_RPC_URL`**、**`ESCROW_FACTORY_ADDRESS`** 等与 **`indexer-reconcile`** 一致（**非** **`chain_not_configured`**）。 |
| **内部密钥** | **`INTERNAL_API_SECRET`**。 |
| **Admin** | **admin** **Bearer**。 |

---

## 3. 一键 smoke（机读）

```bash
export API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:8080}"
export INTERNAL_API_SECRET="***"
export ADMIN_BEARER_TOKEN="***"
bash scripts/ops/b386-revenue-pipeline-log-count-bundle-reconcile-admin-overview-smoke.sh
```

- **退出码 `0`**：reconcile 与 overview 两段观测 **深相等**，**`anchor`**=`**`386-REVENUE-PIPELINE-LOG-COUNT-CHAIN-VS-DB-BUNDLE-OBS-V1`**。  
- **`rollup.marker`** 随三子 **`marker`** 聚合；封口 **exit 0** 只要求 **两段 JSON 一致**，**不**强制 **`aligned`**。

---

## 4. 互证

| 文档 / 代码 | 说明 |
|-------------|------|
| **母表 B-386** | [`docs/任务母表.md`](../任务母表.md) |
| **实现** | `crates/api/src/db/revenue_pipeline_log_count_chain_vs_db_bundle_obs.rs`；子观测同源 **B-383/B-384/B-385** |
| **04** | [`docs/spec/04-后端与API.md`](../spec/04-后端与API.md) **`indexer-reconcile`** / **`admin/observability/overview`** |

---

## 5. 验收（封口）

- [x] **`cargo test -p traveltrust-api`** 绿（**860** **passed**，**2026-04-15**）。  
- [x] **`bash scripts/run-check-04-routes.sh`** **exit** **0**（**2026-04-15**）。  
- [x] 目标环境执行 **§3** **`exit 0`**（**勿**在证据中贴密钥）；**留证**（**2026-04-15**）：**`rollup.marker=incomparable`**（最小链 **ENV** 下三子观测 **`marker`** 可为 **`unavailable`**/**`incomparable`**，**worst-of** 聚合）；**`anchor`**=`**`386-REVENUE-PIPELINE-LOG-COUNT-CHAIN-VS-DB-BUNDLE-OBS-V1`**`；reconcile 与 admin overview **JSON** 深相等。
