# TT-B399 · B-399 `revenue_pipeline` — spread 双轴 dominance 一致性观测

**卡号**：`TT-B399-REVENUE-PIPELINE-SPREAD-DUAL-AXIS-DOMINANCE-CONCORDANCE-OBS-001` · **母表** `B-399`  
**日期**：2026-04-15  
**状态**：**已封口**（**2026-04-15** · **§5.1** **目标环境** **smoke** **`exit 0`** **留证** **）**（**不**入 **`compound_gate`**）

**Scope 锁定**：[TT-B399-REVENUE-PIPELINE-SPREAD-DUAL-AXIS-DOMINANCE-CONCORDANCE-OBS-SCOPE-LOCK.md](./TT-B399-REVENUE-PIPELINE-SPREAD-DUAL-AXIS-DOMINANCE-CONCORDANCE-OBS-SCOPE-LOCK.md)

**规划登记已 superseded**：[TT-B399-REVENUE-PIPELINE-POST-B398-NEXT-SLICE-PLANNING-001.md](./TT-B399-REVENUE-PIPELINE-POST-B398-NEXT-SLICE-PLANNING-001.md) **（** **仅** **互指** **）**

---

## 1. 目的

在 **B-396**（**`dominance_signal`** **vs** **checkpoint/gap** **轴** **）** 与 **B-397**（**同源** **`dominance_signal`** **vs** **`event_log`** **尾** **/** **tail** **轴** **）** **已** **各自** **封口** **的** **前提** **下**，**增** **单顶键** **`revenue_pipeline_spread_dual_axis_dominance_concordance_observability`**，**rollup** **两** **轴** **`dominance_signal`** **为** **`concordance_signal`** **（** **含** **`n_a_*`** **/** **张力** **桶** **）** **；** **与** **B-398** **正交** **——** **B-398** **输出** **`triangulation_signal`** **；** **本** **键** **不** **输出** **`triangulation_signal`** **。**

---

## 2. 锚与请求键（v1）

| 项 | 值 |
|----|-----|
| **机读锚** | **`399-REVENUE-PIPELINE-SPREAD-DUAL-AXIS-DOMINANCE-CONCORDANCE-OBS-V1`** |
| **summary / overview 键** | **`revenue_pipeline_spread_dual_axis_dominance_concordance_observability`** |
| **`POST …/internal/indexer-reconcile` body** | **`include_revenue_pipeline_spread_dual_axis_dominance_concordance_observability:true`**（**须** **`persist:true`** **以** **落** **`summary`** **供** **overview** **回读**） |

**实现**：`crates/api/src/db/revenue_pipeline_spread_dual_axis_dominance_concordance_obs.rs`；**契约**：`docs/spec/04-后端与API.md` **§3.4**；**运维**：`ops/RUNBOOK.md` **§2.55**。

---

## 3. 验收

- [x] **`cargo test -p traveltrust-api`** 绿。  
- [x] **`bash scripts/run-check-04-routes.sh`** **exit** **0**。  
- [x] **`docs/spec/04-后端与API.md`** **契约句** **同批**。  
- [x] **`bash scripts/ops/b399-revenue-pipeline-spread-dual-axis-dominance-concordance-reconcile-admin-overview-smoke.sh`** **exit** **0**（**目标** **环境** **；** **勿** **含** **密钥** **；** **须** **`ChainConfig`** **挂载** **，** **见** **§5.1** **）** **。**

---

## 4. 互证

| 文档 / 代码 | 说明 |
|-------------|------|
| **前驱** | **B-396** **/** **B-397** **`dominance_signal`** **；** **B-398** **边界** **（** **无** **`triangulation_signal`** **）** |
| **代码** | **`revenue_pipeline_spread_dual_axis_dominance_concordance_observability`** **/** **`admin_last_*`** **/** **`indexer-reconcile` body** **/** **admin overview** |

---

## 5. 验收（封口）

- [x] **§3 首轮**：**`cargo test -p traveltrust-api`** **+** **`bash scripts/run-check-04-routes.sh`** **（** **2026-04-15** **）** **。**
- [x] **§3 运行时 smoke**（**须** **在线** **API** **+** **`DATABASE_URL`** **+** **admin** **+** **含** **B-399** **之** **二进制** **）：[../../scripts/ops/b399-revenue-pipeline-spread-dual-axis-dominance-concordance-reconcile-admin-overview-smoke.sh](../../scripts/ops/b399-revenue-pipeline-spread-dual-axis-dominance-concordance-reconcile-admin-overview-smoke.sh) **`exit 0`** **（** **2026-04-15** **）** **。**

### §5.1 留证句式（§3 **`exit 0`** 后补录）

- **命令**：`bash scripts/ops/b399-revenue-pipeline-spread-dual-axis-dominance-concordance-reconcile-admin-overview-smoke.sh`  
- **脚本末行示例**（**无** **密钥**）：`ok (marker=<aligned|drift|incomparable>; concordance_signal=<…>; anchor=399-REVENUE-PIPELINE-SPREAD-DUAL-AXIS-DOMINANCE-CONCORDANCE-OBS-V1; reconcile == admin overview)`  
- **本仓库封口留证（目标环境）**  
  - **二进制**：**`cargo build -p traveltrust-api`** **后** **`cargo run -p traveltrust-api`** **（** **与** **smoke** **同源** **构建** **）** **。**  
  - **环境注**：**`CHAIN_RPC_URL`** **、** **`CHAIN_ID`** **（** **与** **`GET /meta` → `chain.chain_id`** **一致** **）** **；** **`DATABASE_URL`** **指向** **可写** **库** **（** **`persist:true`** **）** **。**  
  - **`INTERNAL_API_SECRET`** **/** **`ADMIN_BEARER_TOKEN`**：**`POST /auth/seed-test-accounts`** **（** **若** **启用** **）** **后** **`POST /auth/login`** **`tourist@test.com`** **/** **`Test123!`** **（** **admin** **角色** **）** **；** **勿** **将** **Bearer** **提交** **公开** **fork** **。**  
  - **脚本末行（stdout 最后一行，脱敏原样）**：`b399-revenue-pipeline-spread-dual-axis-dominance-concordance-reconcile-admin-overview-smoke.sh: ok (marker=incomparable; concordance_signal=n_a_empty_projection; anchor=399-REVENUE-PIPELINE-SPREAD-DUAL-AXIS-DOMINANCE-CONCORDANCE-OBS-V1; reconcile == admin overview)`  
  - **本仓库复跑注（** **2026-04-15** **）** **：** **`cargo build -p traveltrust-api --target-dir target/b399-smoke-build`** **后** **`PORT=18085`** **`CHAIN_RPC_URL`** **+** **`CHAIN_ID`** **与** **`GET /meta` → `chain.chain_id`** **一致** **、** **`DATABASE_URL`** **（** **自** **`.env`** **）** **、** **`INTERNAL_API_SECRET`** **（** **与** **`scripts/ops/_local_b387_b388_smoke_orchestrator.sh`** **默认可选** **`tt-local-b387-b388-smoke`** **）** **、** **`API_BASE_URL=http://127.0.0.1:18085`** **、** **`ADMIN_BEARER_TOKEN`** **（** **登录** **）** **起** **进程** **再** **跑** **脚本** **；** **若** **18085** **已** **被** **旧** **二进制** **占用** **（** **缺** **`revenue_pipeline_spread_dual_axis_dominance_concordance_observability`** **）** **须** **换** **含** **B-399** **之** **构建** **或** **另** **端口** **起** **进程** **。** **本条** **末行** **为** **该** **路径** **`exit 0`** **实录** **。**  
  - **依赖**：**`INTERNAL_API_SECRET`**、**`ADMIN_BEARER_TOKEN`**、**`jq`**。

**说明**：**`marker`** **为** **JSON** **`marker`** **；** **`concordance_signal`** **为** **rollup** **字符串** **（** **含** **`n_a_*`** **/** **张力** **桶** **）** **。**

**后续** **（** **B-400** **）** **：** **[TT-B400-REVENUE-PIPELINE-SPREAD-TRIANGULATION-CONCORDANCE-BUNDLE-OBS-001.md](./TT-B400-REVENUE-PIPELINE-SPREAD-TRIANGULATION-CONCORDANCE-BUNDLE-OBS-001.md)** **（** **规划** **已** **superseded** **：** **[TT-B400-REVENUE-PIPELINE-POST-B399-NEXT-SLICE-PLANNING-001.md](./TT-B400-REVENUE-PIPELINE-POST-B399-NEXT-SLICE-PLANNING-001.md)** **）** **。**
