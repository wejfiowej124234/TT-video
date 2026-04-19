# TT-B395 · B-395 `revenue_pipeline` — spread 异常原因分层观测

**卡号**：`TT-B395-REVENUE-PIPELINE-SPREAD-STRATIFIED-OBS-001` · **母表** `B-395`  
**日期**：2026-04-15  
**状态**：**已实现**（**不**入 **`compound_gate`**）

**Scope 锁定**：[TT-B395-REVENUE-PIPELINE-SPREAD-STRATIFIED-OBS-SCOPE-LOCK.md](./TT-B395-REVENUE-PIPELINE-SPREAD-STRATIFIED-OBS-SCOPE-LOCK.md)

---

## 1. 目的

在 **B-394** 同源 **三腿** **`max(block_number)`** 与 **`spread_blocks`** 之上，输出 **`spread_anomaly_layer`**（**空投影** / **仅单腿** / **缺第三腿的双腿面** / **三腿齐**）与 **`inter_leg_drift`**（**当且仅当** **≥2** **腿** **有** **max** **且** **`spread_blocks > 0`** **为** **真**），用于机读区分 **无数据**、**coverage 不完整（单腿或缺一腿）** 与 **腿间真实漂移**。

---

## 2. 边界

| 项 | 说明 |
|----|------|
| **不**替代 | **B-391** / **B-392** / **B-393**（外参照或 bundle rollup）。 |
| **与 B-394** | **同源** **spread** **计算**；本键 **额外** **分层** **字段** **。 |
| **RPC** | **无** **`eth_getLogs`**；**只读** **DB** **stats** **。 |

---

## 3. 验收（实现轮）

- [x] **`cargo test -p traveltrust-api`** 绿。  
- [x] **`bash scripts/run-check-04-routes.sh`** **exit** **0**。  
- [x] **`docs/spec/04-后端与API.md`** **契约句** **同批**。  
- [x] **`bash scripts/ops/b395-revenue-pipeline-spread-stratified-reconcile-admin-overview-smoke.sh`** **exit** **0**（**勿** **含** **密钥**；**以** **与** **API** **同源** **二进制** **为准** **；** **须** **在线** **API** **+** **`DATABASE_URL`** **+** **admin** **；** **`POST …/internal/indexer-reconcile`** **须** **已挂载** **`ChainConfig`** **（** **见** **§5.1** **环境** **注** **）** **）。  

---

## 4. 互证

| 文档 / 代码 | 说明 |
|-------------|------|
| **实现** | **`crates/api/src/db/revenue_pipeline_spread_stratified_obs.rs`**、**`indexer_reconcile.rs`** |

---

## 5. 验收（封口）

- [x] **§3 首轮**：**`cargo test -p traveltrust-api`** **+** **`bash scripts/run-check-04-routes.sh`** **（** **2026-04-15** **）** **。**
- [x] **§3 运行时 smoke**（**须** **在线** **API** **+** **`DATABASE_URL`** **+** **admin**）：[`scripts/ops/b395-revenue-pipeline-spread-stratified-reconcile-admin-overview-smoke.sh`](../../scripts/ops/b395-revenue-pipeline-spread-stratified-reconcile-admin-overview-smoke.sh) **`exit 0`** **（** **2026-04-15** **）** **。**

### §5.1 留证句式（§3 **`exit 0`** 后补录）

- **命令**：`bash scripts/ops/b395-revenue-pipeline-spread-stratified-reconcile-admin-overview-smoke.sh`  
- **脚本末行示例**（**无** **密钥**）：`ok (marker=<aligned|drift|incomparable>; spread_anomaly_layer=<…>; anchor=395-REVENUE-PIPELINE-SPREAD-STRATIFIED-OBS-V1; reconcile == admin overview)`  
- **本仓库封口留证（目标环境）**  
  - **环境注**：**`POST …/internal/indexer-reconcile`** 依赖 **`ApiMetaState.chain_config`**（**`CHAIN_RPC_URL`** **等** **，见** **`chain::ChainConfig::from_env`** **）**；**仅** **`.env`** **中** **`P3_CHAIN_OFF=1`** **且** **未** **配置** **`CHAIN_RPC_URL`** **时** **进程** **`chain_config`** **为** **`None`** **→** **`503`** **`chain_not_configured`** **（** **hint** **同** **响应** **）** **，smoke** **无法** **封口** **。** **本批** **封口** **启动** **前** **显式** **`P3_CHAIN_OFF=0`**（**或** **unset** **与** **链上** **开发** **一致** **）** **并** **`export CHAIN_RPC_URL=https://rpc-amoy.polygon.technology`**、**`CHAIN_ID=80002`** **（** **与** **`GET /meta` → `chain.chain_id`** **一致** **）** **；** **未** **强制** **本** **批** **填** **`ESCROW_FACTORY_ADDRESS`** **（** **B-395** **观测** **为** **DB-only** **stats** **）** **。**  
  - **`API_BASE_URL`**：**`http://127.0.0.1:8080`**（**与** **smoke** **默认** **一致** **；** **勿** **与** **仅** **链下** **`.env`** **之** **`PORT=3012`** **混淆** **）。  
  - **`DATABASE_URL`**：**`postgres://traveltrust:traveltrust@localhost:5432/traveltrust`**（**Docker** **容器** **`traveltrust-postgres`** **；** **与** **仓库** **根** **`.env`** **接库** **串** **同形** **）** **。**  
  - **`INTERNAL_API_SECRET`**：**`tt-local-b387-b388-smoke`**（**须** **与** **运行中** **API** **一致** **；** **与** **`scripts/ops/_local_b387_b388_smoke_orchestrator.sh`** **默认** **对齐** **）** **。**  
  - **`ADMIN_BEARER_TOKEN`**：**`POST /auth/login`**（**`tourist@test.com`** **/** **`Test123!`** **；** **`seed-test-accounts`** **后** **且** **库内** **`role=admin`** **）** **取得** **；** **勿** **将** **Bearer** **全文** **提交** **到** **公开** **fork** **。**  
  - **二进制**：**`cargo build --release -p traveltrust-api`** **（** **与** **封口** **运行** **同源** **）** **。**  
  - **脚本末行（脱敏，stdout 最后一行原样粘贴）**：`b395-revenue-pipeline-spread-stratified-reconcile-admin-overview-smoke.sh: ok (marker=incomparable; spread_anomaly_layer=empty_projection; anchor=395-REVENUE-PIPELINE-SPREAD-STRATIFIED-OBS-V1; reconcile == admin overview)`  
  - **依赖**：**`INTERNAL_API_SECRET`**、**`ADMIN_BEARER_TOKEN`**、**`jq`**。
