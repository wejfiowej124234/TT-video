# TT-B397 · B-397 `revenue_pipeline` — spread vs event_log tail 相对主导观测

**卡号**：`TT-B397-REVENUE-PIPELINE-SPREAD-VS-EVENT-LOG-TAIL-OBS-001` · **母表** `B-397`  
**日期**：2026-04-15  
**状态**：**已封口**（**2026-04-15** · **§5.1** **目标环境** **smoke** **`exit 0`** **留证** **）**（**不**入 **`compound_gate`**）

**Scope 锁定**：[TT-B397-REVENUE-PIPELINE-SPREAD-VS-EVENT-LOG-TAIL-OBS-SCOPE-LOCK.md](./TT-B397-REVENUE-PIPELINE-SPREAD-VS-EVENT-LOG-TAIL-OBS-SCOPE-LOCK.md)

---

## 1. 目的

在 **B-394** **腿间** **`spread_blocks`** 与 **B-392** **同源** **`tail_slack_blocks`**（**`event_log_max_block_number − union_max`**）之上，输出 **`dominance_signal`**，机读区分 **腿间 spread** 相对 **ingestion 尾间隙** 何者占主导（及 **非正尾间隙** **场景**），**与** **B-396** **checkpoint** **`gap_blocks`** **叙事** **正交** **。**

---

## 2. `dominance_signal` 枚举（schema v1）

| 值 | 条件（概要） |
|----|----------------|
| **`n_a_empty_projection`** | **零** **腿** **max** |
| **`n_a_single_leg_surface`** | **仅** **一** **腿** **有** **max**（**与** **B-396** **单腿** **面** **可** **并** **读** **）** |
| **`n_a_event_log_tail_incomparable`** | **`event_log`** **链** **上** **无** **行** **（** **`event_log_max`** **不可用** **）** |
| **`aligned_multi_leg_no_inter_leg_spread`** | **≥2** **腿** **且** **`spread_blocks=0`** |
| **`inter_leg_drift_small_vs_positive_tail_slack`** | **`inter_leg_drift`** **且** **`tail_slack_blocks>0`** **且** **`spread_blocks < tail_slack_blocks`** |
| **`inter_leg_drift_large_vs_positive_tail_slack`** | **`inter_leg_drift`** **且** **`tail_slack_blocks>0`** **且** **`spread_blocks ≥ tail_slack_blocks`** |
| **`inter_leg_drift_with_non_positive_tail_slack`** | **`inter_leg_drift`** **且** **`tail_slack_blocks ≤ 0`** |

**`spread_to_positive_tail_ratio`**：**仅** **在** **`inter_leg_drift`** **且** **`tail_slack_blocks>0`** **时** **为** **`spread_blocks / tail_slack_blocks`** **（** **f64** **）** **；** **否则** **`null`** **。**

---

## 3. 验收（实现轮）

- [x] **`cargo test -p traveltrust-api`** 绿。  
- [x] **`bash scripts/run-check-04-routes.sh`** **exit** **0**。  
- [x] **`docs/spec/04-后端与API.md`** **契约句** **同批**。  
- [x] **`bash scripts/ops/b397-revenue-pipeline-spread-vs-event-log-tail-reconcile-admin-overview-smoke.sh`** **exit** **0**（**目标** **环境** **；** **勿** **含** **密钥** **；** **须** **`ChainConfig`** **挂载** **，** **见** **§5.1** **）** **。**

---

## 4. 互证

| 文档 / 代码 | 说明 |
|-------------|------|
| **实现** | **`crates/api/src/db/revenue_pipeline_spread_vs_event_log_tail_obs.rs`**、**`indexer_reconcile.rs`** |

---

## 5. 验收（封口）

- [x] **§3 首轮**：**`cargo test -p traveltrust-api`** **+** **`bash scripts/run-check-04-routes.sh`** **（** **2026-04-15** **）** **。**
- [x] **§3 运行时 smoke**（**须** **在线** **API** **+** **`DATABASE_URL`** **+** **admin** **+** **含** **B-397** **之** **二进制** **）：[../../scripts/ops/b397-revenue-pipeline-spread-vs-event-log-tail-reconcile-admin-overview-smoke.sh](../../scripts/ops/b397-revenue-pipeline-spread-vs-event-log-tail-reconcile-admin-overview-smoke.sh) **`exit 0`** **（** **2026-04-15** **）** **。**

### §5.1 留证句式（§3 **`exit 0`** 后补录）

- **命令**：`bash scripts/ops/b397-revenue-pipeline-spread-vs-event-log-tail-reconcile-admin-overview-smoke.sh`  
- **脚本末行示例**（**无** **密钥**）：`ok (marker=<aligned|drift|incomparable>; dominance_signal=<…>; anchor=397-REVENUE-PIPELINE-SPREAD-VS-EVENT-LOG-TAIL-OBS-V1; reconcile == admin overview)`  
- **本仓库封口留证（目标环境）**  
  - **二进制**：**`cargo build -p traveltrust-api`** **后** **`cargo run -p traveltrust-api`** **（** **与** **smoke** **同源** **构建** **）** **；** **若** **8080** **已** **被** **旧** **二进制** **占用** **须** **先** **结束** **该** **进程** **再** **启** **含** **B-397** **之** **构建** **。**  
  - **环境注**：**`P3_CHAIN_OFF=0`** **、** **`CHAIN_RPC_URL`** **（** **如** **`https://rpc-amoy.polygon.technology`** **）** **、** **`CHAIN_ID=80002`** **（** **与** **`GET /meta` → `chain.chain_id`** **一致** **）** **；** **`DATABASE_URL`** **指向** **可写** **库** **（** **`persist:true`** **）** **。**  
  - **`INTERNAL_API_SECRET`** **/** **`ADMIN_BEARER_TOKEN`**：**`seed-test-accounts`** **后** **`POST /auth/login`** **`tourist@test.com`** **/** **`Test123!`** **（** **admin** **角色** **）** **；** **勿** **将** **Bearer** **提交** **公开** **fork** **。**  
  - **脚本末行（stdout 最后一行，脱敏原样）**：`b397-revenue-pipeline-spread-vs-event-log-tail-reconcile-admin-overview-smoke.sh: ok (marker=incomparable; dominance_signal=n_a_empty_projection; anchor=397-REVENUE-PIPELINE-SPREAD-VS-EVENT-LOG-TAIL-OBS-V1; reconcile == admin overview)`  
  - **本仓库复跑注（** **2026-04-15** **）** **：** **`8080`** **上** **进程** **若为** **旧** **二进制** **（** **缺** **`revenue_pipeline_spread_vs_event_log_tail_observability`** **）** **则** **须** **换** **含** **B-397** **之** **构建** **；** **Windows** **可** **`cargo build -p traveltrust-api --target-dir target/b397-smoke-build`** **后** **`PORT=18082`** **`CHAIN_RPC_URL`** **+** **`ESCROW_FACTORY_ADDRESS`** **+** **`CHAIN_ID`** **与** **`GET /meta` → `chain.chain_id`** **一致** **、`DATABASE_URL`****、** **`INTERNAL_API_SECRET`** **（** **与** **`scripts/ops/_local_b387_b388_smoke_orchestrator.sh`** **默认** **同源** **可** **选** **`tt-local-b387-b388-smoke`** **）** **、** **`ADMIN_BEARER_TOKEN`** **（** **DB** **`sessions.token`** **或** **登录** **）** **起** **进程** **再** **跑** **脚本** **；** **本条** **末行** **为** **该** **路径** **`exit 0`** **实录** **。**  
  - **依赖**：**`INTERNAL_API_SECRET`**、**`ADMIN_BEARER_TOKEN`**、**`jq`**。
