# TT-B394 · Scope lock（实现前钉死）

**卡号**：`TT-B394-REVENUE-PIPELINE-PER-LEG-PROJECTION-MAX-BLOCK-SPREAD-OBS-001` · **母表** `B-394`  
**日期**：2026-04-15  
**状态**：**已实现**（**实现** **见** **[TT-B394-REVENUE-PIPELINE-PER-LEG-PROJECTION-MAX-BLOCK-SPREAD-OBS-001.md](./TT-B394-REVENUE-PIPELINE-PER-LEG-PROJECTION-MAX-BLOCK-SPREAD-OBS-001.md)**；**本** **文件** **仍** **保留** **scope** **真源** **。）

---

## 1. 单一 scope（不可再拆）

**一句话**：在 **`POST /api/v1/internal/indexer-reconcile`** 成功路径上，对 **本链** **三** **经济投影表**（**`fee_router_routed_events`** / **`region_vault_forwarded_events`** / **`p5_country_ledger_lines`**）分别取 **`max(block_number)`**（**仅** **当** **该** **表** **本** **链** **有** **行** **时** **参与**），计算 **跨腿** **`spread_blocks = max(leg_max) − min(leg_max)`**。**零** **非空** **腿** **→** **`marker=incomparable`**；**单** **腿** **→** **`spread_blocks=0`** **且** **`marker=aligned`**；**≥2** **腿** **时** **`spread_blocks>0`** **→** **`marker=drift`** **（** **腿间** **块** **高** **不一致** **）**。

**不**做：**eth_getLogs**、**不**替代 **B-391**（**union max vs checkpoint**）、**B-392**（**union max vs `event_log` 尾**）、**B-393**（**bundle rollup**）。

---

## 2. 机读标识符（钉死）

| 项 | 锁定值 |
|----|--------|
| **`persist` / `200` 根级 / `summary` 根级 JSON 键** | **`revenue_pipeline_per_leg_projection_max_block_spread_observability`** |
| **`POST …/internal/indexer-reconcile` body flag** | **`include_revenue_pipeline_per_leg_projection_max_block_spread_observability`**（**`bool`**，默认 **`false`**） |
| **`GET …/admin/observability/overview` 回读键** | **`overview.revenue_pipeline_per_leg_projection_max_block_spread_observability`**（自 **最新** **`orders_projection_vs_orders`** 型 **`reconciliation_reports.summary`** 读 **同键**，无则 **`getter_note`** / **`null`** 与 **B-383～B-393** 模式一致） |
| **机读 `anchor` 字面量** | **`394-REVENUE-PIPELINE-PER-LEG-PROJECTION-MAX-BLOCK-SPREAD-OBS-V1`** |
| **是否进入 `compound_gate` / `reconcile_compound_pass`** | **否** |

---

## 3. 最小 JSON 形状（实现时可增 **`schema_version`** / **`observation_note`**，**不得**改名上表键）

- **`anchor`**: **`394-REVENUE-PIPELINE-PER-LEG-PROJECTION-MAX-BLOCK-SPREAD-OBS-V1`**
- **`expected_chain_id`**: **`i64`**
- **`per_leg_max_block_number`**: 三固定键（**仅**有行时非 **`null`**）：**`fee_router_routed_events`**、**`region_vault_forwarded_events`**、**`p5_country_ledger_lines`**
- **`min_leg_max_block_number`** / **`max_leg_max_block_number`**: **`i64`** 或 **`null`**
- **`spread_blocks`**: **`i64`** 或 **`null`**
- **`marker`**: **`aligned`** / **`drift`** / **`incomparable`**

---

## 4. 启用与落库条件（钉死）

- **`include_revenue_pipeline_per_leg_projection_max_block_spread_observability: true`** 且对账 **`200`** 时：**`200` 根级** 含 **同键**（**DB-only**）。
- **`persist: true`** 时另将 **同对象** 写入 **`reconciliation_reports.summary` 根级**。

---

## 5. 验收闭环（实现轮勾选）

- **`cargo test -p traveltrust-api`** 绿（**含** **`indexer_reconcile_body_deserializes_include_revenue_pipeline_per_leg_projection_max_block_spread_observability`**）。
- **`bash scripts/run-check-04-routes.sh`** **exit** **0**（**04 §3.4** **契约句** **同批**）。
- **`bash scripts/ops/b394-revenue-pipeline-per-leg-projection-max-block-spread-reconcile-admin-overview-smoke.sh`** **exit** **0**（**勿** **含** **密钥**）。
- **`docs/spec/04-后端与API.md`** **`POST …/internal/indexer-reconcile`** **与** **`GET …/admin/observability/overview`** **表格行** **同批** 增 **契约**。

---

## 6. 与 B-391～B-393 的边界（防混）

| 卡 | 本 B-394 **不**覆盖 |
|----|---------------------|
| **B-391** | **union max** **vs** **indexer checkpoint** |
| **B-392** | **union max** **vs** **`event_log`** **尾块** |
| **B-393** | **B-391+B-392** **rollup** **bundle** |

**B-394** 仅回答：**三** **腿** **各自** **已索引** **到的** **最大块** **是否** **彼此** **对齐**（**腿间** **spread**）。
