# TT-B398 · B-398 `revenue_pipeline` — spread 双 slack 三角化观测

**卡号**：`TT-B398-REVENUE-PIPELINE-SPREAD-DUAL-SLACK-TRIANGULATION-OBS-001` · **母表** `B-398`  
**日期**：2026-04-15  
**状态**：**已封口**（**2026-04-15** · **§5.1** **目标环境** **smoke** **`exit 0`** **留证** **）**（**不**入 **`compound_gate`**）

**Scope 锁定**：[TT-B398-REVENUE-PIPELINE-SPREAD-DUAL-SLACK-TRIANGULATION-OBS-SCOPE-LOCK.md](./TT-B398-REVENUE-PIPELINE-SPREAD-DUAL-SLACK-TRIANGULATION-OBS-SCOPE-LOCK.md)

---

## 1. 目的

在 **B-396**（**腿间** **`spread_blocks`** **vs** **indexer checkpoint** **`gap_blocks`**）与 **B-397**（**同源** **`spread_blocks`** **vs** **`tail_slack_blocks`** **=** **`event_log_max−union_max`**）**已** **各自** **输出** **`dominance_signal`** **的** **前提** **下**，**再** **增** **第** **三** **枚** **单顶键** **`revenue_pipeline_spread_dual_slack_triangulation_observability`**，**专答** **当** **`inter_leg_drift`** **且** **两侧** **slack** **（** **`gap_blocks`** **、** **`tail_slack_blocks`** **）** **均** **为** **正** **时**，**`spread_blocks`** **相对** **`min(gap,tail)`** **/** **`max(gap,tail)`** **之** **分桶** **（** **`triangulation_signal`** **）** **及** **`tighter_slack_axis`** **；** **与** **B-393** **（** **union** **级** **checkpoint** **vs** **tail** **bundle** **）** **正交** **——** **B-393** **不** **含** **腿间** **`spread`** **语义** **。**

---

## 2. 锚与请求键（v1）

| 项 | 值 |
|----|-----|
| **机读锚** | **`398-REVENUE-PIPELINE-SPREAD-DUAL-SLACK-TRIANGULATION-OBS-V1`** |
| **summary / overview 键** | **`revenue_pipeline_spread_dual_slack_triangulation_observability`** |
| **`POST …/internal/indexer-reconcile` body** | **`include_revenue_pipeline_spread_dual_slack_triangulation_observability:true`**（**须** **`persist:true`** **以** **落** **`summary`** **供** **overview** **回读**） |

**实现**：`crates/api/src/db/revenue_pipeline_spread_dual_slack_triangulation_obs.rs`；**契约**：`docs/spec/04-后端与API.md` **§3.4**；**运维**：`ops/RUNBOOK.md` **§2.55**。

---

## 3. 验收

- [x] **`cargo test -p traveltrust-api`** 绿。  
- [x] **`bash scripts/run-check-04-routes.sh`** **exit** **0**。  
- [x] **`docs/spec/04-后端与API.md`** **契约句** **同批**。  
- [x] **`bash scripts/ops/b398-revenue-pipeline-spread-dual-slack-triangulation-reconcile-admin-overview-smoke.sh`** **exit** **0**（**目标** **环境** **；** **勿** **含** **密钥** **；** **须** **`ChainConfig`** **挂载** **，** **见** **§5.1** **）** **。**

---

## 4. 互证

| 文档 / 代码 | 说明 |
|-------------|------|
| **前驱** | **B-396**、**B-397** **计面** **；** **B-394** **`spread_blocks`** **；** **B-391** **`gap_blocks`** **；** **B-392** **`tail_slack_blocks`** |
| **代码** | **`revenue_pipeline_spread_dual_slack_triangulation_observability`** **/** **`admin_last_*`** **/** **`indexer-reconcile` body** **/** **admin overview** |

---

## 5. 验收（封口）

- [x] **§3 首轮**：**`cargo test -p traveltrust-api`** **+** **`bash scripts/run-check-04-routes.sh`** **（** **2026-04-15** **）** **。**
- [x] **§3 运行时 smoke**（**须** **在线** **API** **+** **`DATABASE_URL`** **+** **admin** **+** **含** **B-398** **之** **二进制** **）：[../../scripts/ops/b398-revenue-pipeline-spread-dual-slack-triangulation-reconcile-admin-overview-smoke.sh](../../scripts/ops/b398-revenue-pipeline-spread-dual-slack-triangulation-reconcile-admin-overview-smoke.sh) **`exit 0`** **（** **2026-04-15** **）** **。**

### §5.1 留证句式（§3 **`exit 0`** 后补录）

- **命令**：`bash scripts/ops/b398-revenue-pipeline-spread-dual-slack-triangulation-reconcile-admin-overview-smoke.sh`  
- **脚本末行示例**（**无** **密钥**）：`ok (marker=<aligned|drift|incomparable>; triangulation_signal=<…>; anchor=398-REVENUE-PIPELINE-SPREAD-DUAL-SLACK-TRIANGULATION-OBS-V1; reconcile == admin overview)`  
- **本仓库封口留证（目标环境）**  
  - **二进制**：**`cargo build -p traveltrust-api`** **后** **`cargo run -p traveltrust-api`** **（** **与** **smoke** **同源** **构建** **）** **；** **若** **8080** **已** **被** **旧** **二进制** **占用** **（** **缺** **`revenue_pipeline_spread_dual_slack_triangulation_observability`** **）** **须** **换** **含** **B-398** **之** **构建** **或** **另** **端口** **起** **进程** **。**  
  - **环境注**：**`CHAIN_RPC_URL`** **（** **如** **`https://rpc-amoy.polygon.technology`** **）** **、** **`CHAIN_ID=80002`** **（** **与** **`GET /meta` → `chain.chain_id`** **一致** **）** **；** **`DATABASE_URL`** **指向** **可写** **库** **（** **`persist:true`** **）** **。**  
  - **`INTERNAL_API_SECRET`** **/** **`ADMIN_BEARER_TOKEN`**：**`POST /auth/seed-test-accounts`** **（** **若** **启用** **）** **后** **`POST /auth/login`** **`tourist@test.com`** **/** **`Test123!`** **（** **admin** **角色** **）** **；** **勿** **将** **Bearer** **提交** **公开** **fork** **。**  
  - **脚本末行（stdout 最后一行，脱敏原样）**：`b398-revenue-pipeline-spread-dual-slack-triangulation-reconcile-admin-overview-smoke.sh: ok (marker=incomparable; triangulation_signal=n_a_empty_projection; anchor=398-REVENUE-PIPELINE-SPREAD-DUAL-SLACK-TRIANGULATION-OBS-V1; reconcile == admin overview)`  
  - **本仓库复跑注（** **2026-04-15** **）** **：** **`cargo build -p traveltrust-api --target-dir target/b398-smoke-build`** **后** **`PORT=18084`** **`CHAIN_RPC_URL`** **+** **`CHAIN_ID`** **与** **`GET /meta` → `chain.chain_id`** **一致** **、** **`DATABASE_URL`** **（** **自** **`.env`** **）** **、** **`INTERNAL_API_SECRET`** **（** **与** **`scripts/ops/_local_b387_b388_smoke_orchestrator.sh`** **默认可选** **`tt-local-b387-b388-smoke`** **）** **、** **`API_BASE_URL=http://127.0.0.1:18084`** **、** **`ADMIN_BEARER_TOKEN`** **（** **登录** **）** **起** **进程** **再** **跑** **脚本** **；** **本条** **末行** **为** **该** **路径** **`exit 0`** **实录** **。**  
  - **依赖**：**`INTERNAL_API_SECRET`**、**`ADMIN_BEARER_TOKEN`**、**`jq`**。

**说明**：与 **B-397** **smoke** **同形** **；** **`marker`** **为** **JSON** **`marker`** **；** **`triangulation_signal`** **为** **分桶** **字符串** **（** **含** **`n_a_*`** **/** **`inter_leg_drift_*`** **等** **）** **。**
