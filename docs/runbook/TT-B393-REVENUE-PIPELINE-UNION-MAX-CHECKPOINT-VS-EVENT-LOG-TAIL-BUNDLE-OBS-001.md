# TT-B393 · B-393 `revenue_pipeline` — B-391 + B-392 rollup bundle

**卡号**：`TT-B393-REVENUE-PIPELINE-UNION-MAX-CHECKPOINT-VS-EVENT-LOG-TAIL-BUNDLE-OBS-001` · **母表** `B-393`  
**日期**：2026-04-15  
**状态**：**已实现**（**不**入 **`compound_gate`**）

---

## 1. 目的

在 **单次** **`indexer-reconcile`** 响应中提供 **B-391**（**union max** **vs** **indexer checkpoint**）与 **B-392**（**union max** **vs** **`event_log`** **尾块**）的 **嵌套** **子** **JSON** **及** **`rollup.marker`**（**worst-of**：**drift** **>** **incomparable** **>** **aligned**），便于 **Admin overview** **与** **reconcile** **根级** **同键** **对读**。

---

## 2. 边界

| 项 | 说明 |
|----|------|
| **不**替代 | **B-391** **/** **B-392** **独立** **键**；**本** **bundle** **为** **汇总** **视图** **。 |
| **隐式** | **`include_revenue_pipeline_union_max_checkpoint_vs_event_log_tail_bundle_observability:true`** **时** **必** **算** **两** **子** **腿**（**不** **要求** **同** **请求** **再** **显式** **开** **B-391/B-392** **flag** **）** **。 |

---

## 3. 验收（实现轮）

- [x] **`cargo test -p traveltrust-api`** 绿。  
- [x] **`bash scripts/run-check-04-routes.sh`** **exit** **0**。  
- [x] **`docs/spec/04-后端与API.md`** **契约句** **同批**。  
- [x] **`bash scripts/ops/b393-revenue-pipeline-union-max-checkpoint-vs-event-log-tail-bundle-reconcile-admin-overview-smoke.sh`** **exit** **0**（**勿** **含** **密钥**）。  

---

## 4. 互证

| 文档 / 代码 | 说明 |
|-------------|------|
| **子腿** | **B-391**、**B-392** **实现** **模块** |
| **bundle** | **`crates/api/src/db/revenue_pipeline_union_max_checkpoint_vs_event_log_tail_bundle_obs.rs`**、**`indexer_reconcile.rs`** |

---

## 5. 验收（封口）

- [x] **§3 首轮**：**`cargo test -p traveltrust-api`** **+** **`bash scripts/run-check-04-routes.sh`** **（** **2026-04-15** **）** **。**
- [x] **§3 运行时 smoke**（**须** **在线** **API** **+** **`DATABASE_URL`** **+** **admin**）：[`scripts/ops/b393-revenue-pipeline-union-max-checkpoint-vs-event-log-tail-bundle-reconcile-admin-overview-smoke.sh`](../../scripts/ops/b393-revenue-pipeline-union-max-checkpoint-vs-event-log-tail-bundle-reconcile-admin-overview-smoke.sh) **`exit 0`**（**2026-04-15**）。

### §5.1 留证句式（§3 **`exit 0`** 后补录）

- **命令**：`bash scripts/ops/b393-revenue-pipeline-union-max-checkpoint-vs-event-log-tail-bundle-reconcile-admin-overview-smoke.sh`  
- **脚本末行示例**（**无** **密钥**）：`ok (rollup.marker=<aligned|drift|incomparable>; anchor=393-REVENUE-PIPELINE-UNION-MAX-CHECKPOINT-VS-EVENT-LOG-TAIL-BUNDLE-OBS-V1; reconcile == admin overview)`  
- **本仓库封口留证（目标环境）**  
  - **`API_BASE_URL`**：**`http://127.0.0.1:8081`**（**可覆写**；**同** **TT-B391** **§5.1** **本批** **说明**）。  
  - **密钥**：**`INTERNAL_API_SECRET=tt-local-b387-b388-smoke`**（与 **API** **对齐**）；**`ADMIN_BEARER_TOKEN`** 由 **`POST …/auth/login`**（**`tourist@test.com`** **/** **`Test123!`**）取得；**勿**将 **Bearer** **全文** **提交** **到** **公开** **fork**。  
  - **脚本末行（脱敏，stdout 最后一行原样粘贴）**：`b393-revenue-pipeline-union-max-checkpoint-vs-event-log-tail-bundle-reconcile-admin-overview-smoke.sh: ok (rollup.marker=incomparable; anchor=393-REVENUE-PIPELINE-UNION-MAX-CHECKPOINT-VS-EVENT-LOG-TAIL-BUNDLE-OBS-V1; reconcile == admin overview)`  
  - **依赖**：**`INTERNAL_API_SECRET`**、**`ADMIN_BEARER_TOKEN`**、**`jq`**。
