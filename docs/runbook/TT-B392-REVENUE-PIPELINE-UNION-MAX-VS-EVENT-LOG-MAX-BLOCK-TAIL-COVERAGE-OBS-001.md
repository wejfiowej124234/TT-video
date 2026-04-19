# TT-B392 · B-392 `revenue_pipeline` — union max vs `event_log` 尾块覆盖

**卡号**：`TT-B392-REVENUE-PIPELINE-UNION-MAX-VS-EVENT-LOG-MAX-BLOCK-TAIL-COVERAGE-OBS-001` · **母表** `B-392`  
**日期**：2026-04-15  
**状态**：**已实现**（**不**入 **`compound_gate`**）

---

## 1. 目的

对 **本链** **三** **经济投影表**（**`fee_router_routed_events`** / **`region_vault_forwarded_events`** / **`p5_country_ledger_lines`**）取 **`max(block_number)`** 之 **union max**，与 **`event_log`** **本链** **`MAX(block_number)`** 计算 **`tail_slack_blocks = event_log_max − union_max`**；**负** **`tail_slack_blocks`**（**`marker=drift`**）表示 **投影尾块高于已物化 `event_log` 尾**（ingestion 覆盖缺口风险）。

---

## 2. 边界

| 项 | 说明 |
|----|------|
| **不**替代 | **B-391**（**union max** **vs** **indexer checkpoint**）；**本键** **对** **`event_log`** **尾** **。 |
| **RPC** | **无** **`eth_getLogs`**；**只读** **DB** **stats** **+** **`event_log`** **max** **。 |

---

## 3. 验收（实现轮）

- [x] **`cargo test -p traveltrust-api`** 绿。  
- [x] **`bash scripts/run-check-04-routes.sh`** **exit** **0**。  
- [x] **`docs/spec/04-后端与API.md`** **契约句** **同批**。  
- [x] **`bash scripts/ops/b392-revenue-pipeline-union-max-vs-event-log-max-block-tail-coverage-reconcile-admin-overview-smoke.sh`** **exit** **0**（**勿** **含** **密钥**）。  

---

## 4. 互证

| 文档 / 代码 | 说明 |
|-------------|------|
| **实现** | **`crates/api/src/db/revenue_pipeline_union_max_vs_event_log_max_block_tail_coverage_obs.rs`**、**`indexer_reconcile.rs`** |

---

## 5. 验收（封口）

- [x] **§3 首轮**：**`cargo test -p traveltrust-api`** **+** **`bash scripts/run-check-04-routes.sh`** **（** **2026-04-15** **）** **。**
- [x] **§3 运行时 smoke**（**须** **在线** **API** **+** **`DATABASE_URL`** **+** **admin**）：[`scripts/ops/b392-revenue-pipeline-union-max-vs-event-log-max-block-tail-coverage-reconcile-admin-overview-smoke.sh`](../../scripts/ops/b392-revenue-pipeline-union-max-vs-event-log-max-block-tail-coverage-reconcile-admin-overview-smoke.sh) **`exit 0`**（**2026-04-15**）。

### §5.1 留证句式（§3 **`exit 0`** 后补录）

- **命令**：`bash scripts/ops/b392-revenue-pipeline-union-max-vs-event-log-max-block-tail-coverage-reconcile-admin-overview-smoke.sh`  
- **脚本末行示例**（**无** **密钥**）：`ok (marker=<aligned|drift|incomparable>; anchor=392-REVENUE-PIPELINE-UNION-MAX-VS-EVENT-LOG-MAX-BLOCK-TAIL-COVERAGE-OBS-V1; reconcile == admin overview)`  
- **本仓库封口留证（目标环境）**  
  - **`API_BASE_URL`**：**`http://127.0.0.1:8081`**（**可覆写**；**同** **TT-B391** **§5.1** **本批** **说明**：**新** **release** **二进制** **+** **Docker** **Postgres**）。  
  - **密钥**：**`INTERNAL_API_SECRET=tt-local-b387-b388-smoke`**（与 **API** **对齐**）；**`ADMIN_BEARER_TOKEN`** 由 **`POST …/auth/login`**（**`tourist@test.com`** **/** **`Test123!`**）取得；**勿**将 **Bearer** **全文** **提交** **到** **公开** **fork**。  
  - **脚本末行（脱敏，stdout 最后一行原样粘贴）**：`b392-revenue-pipeline-union-max-vs-event-log-max-block-tail-coverage-reconcile-admin-overview-smoke.sh: ok (marker=incomparable; anchor=392-REVENUE-PIPELINE-UNION-MAX-VS-EVENT-LOG-MAX-BLOCK-TAIL-COVERAGE-OBS-V1; reconcile == admin overview)`  
  - **依赖**：**`INTERNAL_API_SECRET`**、**`ADMIN_BEARER_TOKEN`**、**`jq`**。
