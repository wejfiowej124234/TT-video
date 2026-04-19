# TT-B391 · Scope lock（实现前钉死）

**卡号**：`TT-B391-REVENUE-PIPELINE-UNION-MAX-PROJECTION-BLOCK-VS-INDEXER-CHECKPOINT-OBS-001` · **母表** `B-391`  
**日期**：2026-04-15  
**状态**：**已实现**（**实现** **见** **[TT-B391-REVENUE-PIPELINE-UNION-MAX-PROJECTION-BLOCK-VS-INDEXER-CHECKPOINT-OBS-001.md](./TT-B391-REVENUE-PIPELINE-UNION-MAX-PROJECTION-BLOCK-VS-INDEXER-CHECKPOINT-OBS-001.md)**；**本** **文件** **仍** **保留** **scope** **真源** **。）

---

## 1. 单一 scope（不可再拆）

**一句话**：在 **`POST /api/v1/internal/indexer-reconcile`** 成功路径上，对 **本链** 计算 **经济三投影表**（**FeeRouter** **`fee_router_routed_events`**、**RegionVault** **`region_vault_forwarded_events`**、**CountryPool** **`p5_country_ledger_lines`**）在 **DB** 中的 **`max(block_number)`** 之 **union max**（三表各自有行时取 **max**；某表空则 **omit** 该腿，**仅**在 **至少一腿** 有 **`max`** 时形成 **union_max_block_number**），与 **进程内索引器 checkpoint**（与 **`GET /api/v1/admin/observability/overview` → `overview.indexer.checkpoint.block_number`** **同源语义**：**`checkpoints_sharded`** / **`INDEXER_CHECKPOINT_CONSUMER_ID`** 路径，与现有 reconcile 内其它 **indexer checkpoint** 观测一致）比较，输出 **有符号整型** **`gap_blocks = indexer_checkpoint_block_number - union_max_block_number`**（**checkpoint ≥ union_max** 为 **非负**，表示「checkpoint 已覆盖到投影最大块」；**负值** 表示 **投影声称的块 **高于** checkpoint**，**机读异常**）。

**不**做：**eth_getLogs**、**不**汇总 **B-383/B-384/B-385** 子 JSON、**不**改写 **B-386** bundle、**不**替代 **B-389**（报告 **年龄**）或 **B-390**（**freshness × marker suspect**）。

---

## 2. 机读标识符（钉死）

| 项 | 锁定值 |
|----|--------|
| **`persist` / `200` 根级 / `summary` 根级 JSON 键** | **`revenue_pipeline_union_max_projection_block_vs_indexer_checkpoint_observability`** |
| **`POST …/internal/indexer-reconcile` body flag** | **`include_revenue_pipeline_union_max_projection_block_vs_indexer_checkpoint_observability`**（**`bool`**，默认 **`false`**） |
| **`GET …/admin/observability/overview` 回读键** | **`overview.revenue_pipeline_union_max_projection_block_vs_indexer_checkpoint_observability`**（自 **最新** **`orders_projection_vs_orders`** 型 **`reconciliation_reports.summary`** 读 **同键**，无则 **`getter_note`** / **`null`** 与 **B-383～B-390** 模式一致） |
| **机读 `anchor` 字面量** | **`391-REVENUE-PIPELINE-UNION-MAX-PROJECTION-BLOCK-VS-INDEXER-CHECKPOINT-OBS-V1`** |
| **是否进入 `compound_gate` / `reconcile_compound_pass`** | **否**（与 **B-383～B-390** **一致**；**不**参与 **`indexer_reconcile_compound_gate`** **AND**） |

---

## 3. 最小 JSON 形状（实现时可增 **`schema_version`** / **`observation_note`**，**不得**改名上表键）

建议 **v1** 根对象字段（与现有 obs 风格对齐）：

- **`anchor`**: **`391-REVENUE-PIPELINE-UNION-MAX-PROJECTION-BLOCK-VS-INDEXER-CHECKPOINT-OBS-V1`**
- **`expected_chain_id`**: **`i64`**
- **`per_leg_max_block_number`**: 对象，键为固定三键（**仅**在有统计时呈现）：**`fee_router_routed_events`**、**`region_vault_forwarded_events`**、**`p5_country_ledger_lines`** → **`i64`** 或 **`null`**（表空或无 max）
- **`union_max_block_number`**: **`i64`** 或 **`null`**（三腿皆空 / 无法形成 union 时）
- **`indexer_checkpoint_block_number`**: **`u64`** 或 **`i64`**（与现有 **checkpoint** JSON **同形**）或 **`null`**（无 indexer 句柄 / 无 checkpoint 行）
- **`gap_blocks`**: **`i64`** 或 **`null`**（**仅当** **`union_max_block_number`** 与 **`indexer_checkpoint_block_number`** **皆** **Some** 时计算 **`checkpoint - union_max`**；否则 **`null`** + **`observation_note`**）
- **`marker`**（可选，便于 **`jq`**）：**`aligned`**（**`gap_blocks >= 0`**）/** **`drift`**（**`gap_blocks < 0`**）/** **`incomparable`**（缺腿 / 无 checkpoint / SQL 失败等）

---

## 4. 启用与落库条件（钉死）

- **`include_revenue_pipeline_union_max_projection_block_vs_indexer_checkpoint_observability: true`** 且对账 **`200`** 时：**`200` 根级** 含 **同键**（与 **B-389** **一致**：**DB-only**、**不**强制 **B-386**）。
- **`persist: true`** 时另将 **同对象** 写入 **`reconciliation_reports.summary` 根级**（与 **B-389** **双写** 模式一致）。

---

## 5. 验收闭环（实现轮勾选）

- **`cargo test -p traveltrust-api`** 绿（**含** 本观测 **单元测试** + **`indexer_reconcile_body_deserializes_…`** 机读反序列化）。
- **`bash scripts/run-check-04-routes.sh`** **exit 0**（**04 §3.4** **契约句** **同批**）。
- **`bash scripts/ops/b391-revenue-pipeline-union-max-projection-block-vs-indexer-checkpoint-reconcile-admin-overview-smoke.sh`** **exit 0**（**勿** **含** **密钥**；脚本名 **钉死**）。
- **`docs/spec/04-后端与API.md`** **`POST …/internal/indexer-reconcile`** **与** **`GET …/admin/observability/overview`** **表格行** **同批** 增 **一行**（与 **B-383～B-390** 句式一致）。

---

## 6. 母表与 RUNBOOK 指针（实现批）

- **`docs/任务母表.md`**：新增 **`B-391`** **一行**（本 scope **摘要** + 上表 **路径** 指针）。
- **`ops/RUNBOOK.md`** / **`scripts/README.md`**：**§2.55** 邻域 **一条** smoke **指针**（**同** **B-386～B-390** **风格**）。

---

## 7. 与 B-383～B-390 的边界（防混）

| 卡 | 本 B-391 **不**覆盖 |
|----|---------------------|
| **B-383～B-385** | **RPC `eth_getLogs` 条数** vs **DB COUNT** **同块窗** |
| **B-386** | 三腿 **marker rollup** **bundle** |
| **B-387 / B-388** | **跨 persist** / **历史 streak** |
| **B-389** | **最近带 B-386 键之报告** **`created_at` → age** |
| **B-390** | **B-389 freshness × B-386 marker suspect** |

**B-391** 仅回答：**三投影表 **DB** **max 块** 与 **indexer checkpoint** **是否一致覆盖**（**checkpoint 相对 union max 的间隙**）。
