# TT-B396 · B-396 `revenue_pipeline` — spread vs union–indexer gap 相对主导观测

**卡号**：`TT-B396-REVENUE-PIPELINE-SPREAD-VS-UNION-INDEXER-GAP-OBS-001` · **母表** `B-396`  
**日期**：2026-04-15  
**状态**：**已封口**（**2026-04-15** · **§5.1** **目标环境** **smoke** **`exit 0`** **留证** **）**（**不**入 **`compound_gate`**）

**Scope 锁定**：[TT-B396-REVENUE-PIPELINE-SPREAD-VS-UNION-INDEXER-GAP-OBS-SCOPE-LOCK.md](./TT-B396-REVENUE-PIPELINE-SPREAD-VS-UNION-INDEXER-GAP-OBS-SCOPE-LOCK.md)

---

## 1. 目的

在 **B-394** **腿间** **`spread_blocks`** 与 **B-391** **`gap_blocks`（indexer checkpoint − union max）** 同源数值之上，输出 **`dominance_signal`**，机读区分 **「腿间 spread 相对全局 indexer 落后（正 gap）较小」** vs **「腿间 spread 相对正 gap 占主导或可比」**，以及 **checkpoint 相对 union 非正 gap** **场景** **（** **与** **B-391** **`marker=drift`** **家族** **可** **并** **读** **）** **。**

---

## 2. `dominance_signal` 枚举（schema v1）

| 值 | 条件（概要） |
|----|----------------|
| **`n_a_empty_projection`** | **零** **腿** **max** |
| **`n_a_single_leg_surface`** | **仅** **一** **腿** **有** **max** |
| **`aligned_multi_leg_no_inter_leg_spread`** | **≥2** **腿** **且** **`spread_blocks=0`** |
| **`inter_leg_drift_small_vs_positive_union_gap`** | **`inter_leg_drift`** **且** **`gap_blocks>0`** **且** **`spread_blocks < gap_blocks`** |
| **`inter_leg_drift_large_vs_positive_union_gap`** | **`inter_leg_drift`** **且** **`gap_blocks>0`** **且** **`spread_blocks ≥ gap_blocks`** |
| **`inter_leg_drift_with_non_positive_union_gap`** | **`inter_leg_drift`** **且** **`gap_blocks ≤ 0`** |

**`spread_to_positive_gap_ratio`**：**仅** **在** **`inter_leg_drift`** **且** **`gap_blocks>0`** **时** **为** **`spread_blocks / gap_blocks`** **（** **f64** **）** **；** **否则** **`null`** **。**

---

## 3. 验收（实现轮）

- [x] **`cargo test -p traveltrust-api`** 绿。  
- [x] **`bash scripts/run-check-04-routes.sh`** **exit** **0**。  
- [x] **`docs/spec/04-后端与API.md`** **契约句** **同批**。  
- [x] **`bash scripts/ops/b396-revenue-pipeline-spread-vs-union-indexer-gap-reconcile-admin-overview-smoke.sh`** **exit** **0**（**目标** **环境** **；** **勿** **含** **密钥** **；** **须** **`ChainConfig`** **挂载** **，** **见** **§5.1** **）** **。**

---

## 4. 互证

| 文档 / 代码 | 说明 |
|-------------|------|
| **实现** | **`crates/api/src/db/revenue_pipeline_spread_vs_union_indexer_gap_obs.rs`**、**`indexer_reconcile.rs`** |

---

## 5. 验收（封口）

- [x] **§3 首轮**：**`cargo test -p traveltrust-api`** **+** **`bash scripts/run-check-04-routes.sh`** **（** **2026-04-15** **）** **。**
- [x] **§3 运行时 smoke**（**须** **在线** **API** **+** **`DATABASE_URL`** **+** **admin** **+** **含** **B-396** **之** **二进制** **）**：[../../scripts/ops/b396-revenue-pipeline-spread-vs-union-indexer-gap-reconcile-admin-overview-smoke.sh](../../scripts/ops/b396-revenue-pipeline-spread-vs-union-indexer-gap-reconcile-admin-overview-smoke.sh) **`exit 0`** **（** **2026-04-15** **）** **。**

### §5.1 留证句式（§3 **`exit 0`** 后补录）

- **命令**：`bash scripts/ops/b396-revenue-pipeline-spread-vs-union-indexer-gap-reconcile-admin-overview-smoke.sh`  
- **脚本末行示例**（**无** **密钥**）：`ok (marker=<aligned|drift|incomparable>; dominance_signal=<…>; anchor=396-REVENUE-PIPELINE-SPREAD-VS-UNION-INDEXER-GAP-OBS-V1; reconcile == admin overview)`  
- **本仓库封口留证（目标环境）**  
  - **二进制**：**`cargo build -p traveltrust-api`** **后** **`cargo run -p traveltrust-api`** **（** **与** **smoke** **同源** **构建** **）** **；** **若** **8080** **已** **被** **旧** **二进制** **占用** **须** **先** **结束** **该** **进程** **再** **启** **含** **B-396** **之** **构建** **。**  
  - **环境注**：**`P3_CHAIN_OFF=0`** **、** **`CHAIN_RPC_URL`** **（** **如** **`https://rpc-amoy.polygon.technology`** **）** **、** **`CHAIN_ID=80002`** **（** **与** **`GET /meta` → `chain.chain_id`** **一致** **）** **；** **`DATABASE_URL`** **指向** **可写** **库** **（** **`persist:true`** **）** **。**  
  - **`INTERNAL_API_SECRET`** **/** **`ADMIN_BEARER_TOKEN`**：**`seed-test-accounts`** **后** **`POST /auth/login`** **`tourist@test.com`** **/** **`Test123!`** **（** **admin** **角色** **）** **；** **勿** **将** **Bearer** **提交** **公开** **fork** **。**  
  - **脚本末行（stdout 最后一行，脱敏原样）**：`b396-revenue-pipeline-spread-vs-union-indexer-gap-reconcile-admin-overview-smoke.sh: ok (marker=incomparable; dominance_signal=n_a_empty_projection; anchor=396-REVENUE-PIPELINE-SPREAD-VS-UNION-INDEXER-GAP-OBS-V1; reconcile == admin overview)`  
  - **依赖**：**`INTERNAL_API_SECRET`**、**`ADMIN_BEARER_TOKEN`**、**`jq`**。
