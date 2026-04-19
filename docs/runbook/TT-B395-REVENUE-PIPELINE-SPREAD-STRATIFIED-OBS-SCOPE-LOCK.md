# TT-B395 · Scope lock（实现前钉死）

**卡号**：`TT-B395-REVENUE-PIPELINE-SPREAD-STRATIFIED-OBS-001` · **母表** `B-395`  
**日期**：2026-04-15  
**状态**：**已实现**（**实现** **见** **[TT-B395-REVENUE-PIPELINE-SPREAD-STRATIFIED-OBS-001.md](./TT-B395-REVENUE-PIPELINE-SPREAD-STRATIFIED-OBS-001.md)**；**本** **文件** **仍** **保留** **scope** **真源** **。）

---

## 1. 单一 scope（不可再拆）

**一句话**：在 **`POST /api/v1/internal/indexer-reconcile`** 成功路径上，对 **本链** **三** **经济投影表**（**`fee_router_routed_events`** / **`region_vault_forwarded_events`** / **`p5_country_ledger_lines`**）复用 **与** **B-394** **一致** **的** **`max(block_number)`** **（** **仅** **当** **该** **表** **本** **链** **有** **行** **时** **参与** **）** **与** **`spread_blocks`** **，** **并** **输出** **`spread_anomaly_layer`** **与** **`inter_leg_drift`** **。**

**`spread_anomaly_layer`**（**钉死**）：

- **`empty_projection`**：**三** **腿** **行数** **均为** **0**  
- **`single_leg_only`**：**恰好** **一** **腿** **有** **行**  
- **`dual_leg_missing_third`**：**恰好** **两** **腿** **有** **行**  
- **`triple_leg_surface`**：**三** **腿** **均** **有** **行**  

**`inter_leg_drift`**：**`true`** **当且仅当** **参与** **spread** **的** **腿** **数** **≥2** **且** **`spread_blocks > 0`**（**与** **B-394** **`marker=drift`** **条件** **对齐** **于** **双腿** **+** **三腿** **面** **）。**

**不**做：**eth_getLogs**、**不**替代 **B-391～B-393**。

---

## 2. 机读标识符（钉死）

| 项 | 锁定值 |
|----|--------|
| **`persist` / `200` 根级 / `summary` 根级 JSON 键** | **`revenue_pipeline_spread_stratified_observability`** |
| **`POST …/internal/indexer-reconcile` body flag** | **`include_revenue_pipeline_spread_stratified_observability`**（**`bool`**，默认 **`false`**） |
| **`GET …/admin/observability/overview` 回读键** | **`overview.revenue_pipeline_spread_stratified_observability`**（自 **最新** **`orders_projection_vs_orders`** 型 **`reconciliation_reports.summary`** 读 **同键**） |
| **机读 `anchor` 字面量** | **`395-REVENUE-PIPELINE-SPREAD-STRATIFIED-OBS-V1`** |
| **是否进入 `compound_gate` / `reconcile_compound_pass`** | **否** |
| **失败机读键（`500`）** | **`revenue_pipeline_spread_stratified_observability_failed`** |

---

## 3. 最小 JSON 形状（实现时可增字段，**不得**改名上表键）

- **`anchor`**: **`395-REVENUE-PIPELINE-SPREAD-STRATIFIED-OBS-V1`**
- **`expected_chain_id`**: **`i64`**
- **`spread_anomaly_layer`**: **`empty_projection`** | **`single_leg_only`** | **`dual_leg_missing_third`** | **`triple_leg_surface`**
- **`inter_leg_drift`**: **`bool`**
- **`per_leg_max_block_number`**: 三固定键（**仅**有行时非 **`null`**）
- **`min_leg_max_block_number`** / **`max_leg_max_block_number`** / **`spread_blocks`**: 与 **B-394** **同** **空** **/ ** **`i64`** **语义**
- **`marker`**: **`aligned`** / **`drift`** / **`incomparable`**（**与** **B-394** **一致**）

---

## 4. 启用与落库条件（钉死）

- **`include_revenue_pipeline_spread_stratified_observability: true`** 且对账 **`200`** 时：**`200` 根级** 含 **同键**（**DB-only**）。
- **`persist: true`** 时另将 **同对象** 写入 **`reconciliation_reports.summary` 根级**。

---

## 5. 验收闭环（实现轮勾选）

- **`cargo test -p traveltrust-api`** 绿（**含** **`indexer_reconcile_body_deserializes_include_revenue_pipeline_spread_stratified_observability`**）。
- **`bash scripts/run-check-04-routes.sh`** **exit** **0**（**04 §3.4** **契约句** **同批**）。
- **`bash scripts/ops/b395-revenue-pipeline-spread-stratified-reconcile-admin-overview-smoke.sh`** **exit** **0**（**勿** **含** **密钥**）。
- **`docs/spec/04-后端与API.md`** **`POST …/internal/indexer-reconcile`** **与** **`GET …/admin/observability/overview`** **表格行** **同批** 增 **契约**。

---

## 6. 与 B-391～B-394 的边界（防混）

| 卡 | 本 B-395 **不**覆盖 |
|----|---------------------|
| **B-391** | **union max** **vs** **indexer checkpoint** |
| **B-392** | **union max** **vs** **`event_log`** **尾块** |
| **B-393** | **B-391+B-392** **bundle** **rollup** |
| **B-394** | **仅** **spread** **标量** **；** **B-395** **补** **分层** **原因** **字段** **。 |
