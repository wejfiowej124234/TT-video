# TT-B400 · B-400 `revenue_pipeline` — spread triangulation–concordance bundle 观测

**卡号**：`TT-B400-REVENUE-PIPELINE-SPREAD-TRIANGULATION-CONCORDANCE-BUNDLE-OBS-001` · **母表** `B-400`  
**日期**：2026-04-15  
**状态**：**已封口**（**2026-04-15** · **§5.1** **目标环境** **smoke** **`exit 0`** **留证** **）**（**不**入 **`compound_gate`**）

**Scope 锁定**：[TT-B400-REVENUE-PIPELINE-SPREAD-TRIANGULATION-CONCORDANCE-BUNDLE-OBS-SCOPE-LOCK.md](./TT-B400-REVENUE-PIPELINE-SPREAD-TRIANGULATION-CONCORDANCE-BUNDLE-OBS-SCOPE-LOCK.md)

**规划登记已 superseded**：[TT-B400-REVENUE-PIPELINE-POST-B399-NEXT-SLICE-PLANNING-001.md](./TT-B400-REVENUE-PIPELINE-POST-B399-NEXT-SLICE-PLANNING-001.md)

---

## 1. 目的

在 **B-398**（**`triangulation_signal`** **/** **双** **slack** **三角化** **）** 与 **B-399**（**`concordance_signal`** **/** **双轴** **`dominance`** **一致性** **）** **已** **各自** **封口** **的** **前提** **下**，**增** **单顶键** **`revenue_pipeline_spread_triangulation_concordance_bundle_observability`**，**在** **`components`** **内** **并列** **嵌入** **两** **完整** **JSON**，**并** **以** **worst-of** **`rollup.marker`** **汇总** **子** **`marker`** **（** **与** **B-393** **同** **族** **）** **。**

---

## 2. 锚与请求键（v1）

| 项 | 值 |
|----|-----|
| **机读锚** | **`400-REVENUE-PIPELINE-SPREAD-TRIANGULATION-CONCORDANCE-BUNDLE-OBS-V1`** |
| **summary / overview 键** | **`revenue_pipeline_spread_triangulation_concordance_bundle_observability`** |
| **`POST …/internal/indexer-reconcile` body** | **`include_revenue_pipeline_spread_triangulation_concordance_bundle_observability:true`**（**须** **`persist:true`** **以** **落** **`summary`** **供** **overview** **回读** **；** **隐式** **计算** **B-398/B-399** **子** **键** **）** |

**实现**：`crates/api/src/db/revenue_pipeline_spread_triangulation_concordance_bundle_obs.rs`；**契约**：`docs/spec/04-后端与API.md` **§3.4**；**运维**：`ops/RUNBOOK.md` **§2.55**。

---

## 3. 验收

- [x] **`cargo test -p traveltrust-api`** 绿。  
- [x] **`bash scripts/run-check-04-routes.sh`** **exit** **0**。  
- [x] **`docs/spec/04-后端与API.md`** **契约句** **同批**。  
- [x] **`bash scripts/ops/b400-revenue-pipeline-spread-triangulation-concordance-bundle-reconcile-admin-overview-smoke.sh`** **exit** **0**（**目标** **环境** **；** **勿** **含** **密钥** **；** **须** **`ChainConfig`** **挂载** **，** **见** **§5.1** **）** **。**

---

## 4. 互证

| 文档 / 代码 | 说明 |
|-------------|------|
| **前驱** | **B-398** **/** **B-399** **；** **B-393** **worst-of** **rollup** **模式** |
| **代码** | **`revenue_pipeline_spread_triangulation_concordance_bundle_observability`** **/** **`admin_last_*`** **/** **`indexer-reconcile` body** **/** **admin overview** |

---

## 5. 验收（封口）

- [x] **§3 首轮**：**`cargo test -p traveltrust-api`** **+** **`bash scripts/run-check-04-routes.sh`** **（** **2026-04-15** **）** **。**
- [x] **§3 运行时 smoke**（**须** **在线** **API** **+** **`DATABASE_URL`** **+** **admin** **+** **含** **B-400** **之** **二进制** **）：[../../scripts/ops/b400-revenue-pipeline-spread-triangulation-concordance-bundle-reconcile-admin-overview-smoke.sh](../../scripts/ops/b400-revenue-pipeline-spread-triangulation-concordance-bundle-reconcile-admin-overview-smoke.sh) **`exit 0`** **（** **2026-04-15** **）** **。**

### §5.1 留证句式（§3 **`exit 0`** 后补录）

- **命令**：`bash scripts/ops/b400-revenue-pipeline-spread-triangulation-concordance-bundle-reconcile-admin-overview-smoke.sh`  
- **脚本末行示例**（**无** **密钥**）：`ok (rollup.marker=<aligned|drift|incomparable>; anchor=400-REVENUE-PIPELINE-SPREAD-TRIANGULATION-CONCORDANCE-BUNDLE-OBS-V1; reconcile == admin overview)`  
- **本仓库封口留证（目标环境）**  
  - **二进制**：**`cargo build -p traveltrust-api --target-dir target/b400-smoke-build`** **后** **`PORT=18086`** **`./target/b400-smoke-build/debug/traveltrust-api`** **（** **与** **smoke** **同源** **构建** **）** **。**  
  - **环境注**：**`CHAIN_RPC_URL`** **、** **`CHAIN_ID`** **（** **与** **`GET /meta` → `chain.chain_id`** **一致** **）** **；** **`DATABASE_URL`** **（** **自** **`.env`** **）** **。**  
  - **`INTERNAL_API_SECRET`** **/** **`ADMIN_BEARER_TOKEN`**：**`POST /auth/login`** **等** **取得** **admin** **会话** **；** **`API_BASE_URL=http://127.0.0.1:18086`** **。**  
  - **脚本末行（stdout 最后一行，脱敏原样）**：`b400-revenue-pipeline-spread-triangulation-concordance-bundle-reconcile-admin-overview-smoke.sh: ok (rollup.marker=incomparable; anchor=400-REVENUE-PIPELINE-SPREAD-TRIANGULATION-CONCORDANCE-BUNDLE-OBS-V1; reconcile == admin overview)`  
  - **依赖**：**`INTERNAL_API_SECRET`**、**`ADMIN_BEARER_TOKEN`**、**`jq`**。

**说明**：**`rollup.marker`** **为** **worst-of** **；** **`components`** **内** **为** **B-398/B-399** **完整** **JSON** **。**

**后续** **（** **B-401** **）** **：** **[TT-B401-REVENUE-PIPELINE-SPREAD-TRIANGULATION-CONCORDANCE-BUNDLE-FRESHNESS-SUSPECT-OBS-001.md](./TT-B401-REVENUE-PIPELINE-SPREAD-TRIANGULATION-CONCORDANCE-BUNDLE-FRESHNESS-SUSPECT-OBS-001.md)** **（** **bundle** **×** **freshness/suspect** **）** **；** **规划** **登记** **已** **superseded** **：** **[TT-B401-REVENUE-PIPELINE-POST-B400-NEXT-SLICE-PLANNING-001.md](./TT-B401-REVENUE-PIPELINE-POST-B400-NEXT-SLICE-PLANNING-001.md)** **。**
