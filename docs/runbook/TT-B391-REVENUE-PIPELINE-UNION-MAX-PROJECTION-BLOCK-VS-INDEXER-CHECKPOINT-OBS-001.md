# TT-B391 · B-391 `revenue_pipeline` — union max 投影块 vs indexer checkpoint

**卡号**：`TT-B391-REVENUE-PIPELINE-UNION-MAX-PROJECTION-BLOCK-VS-INDEXER-CHECKPOINT-OBS-001` · **母表** `B-391`  
**日期**：2026-04-15  
**状态**：**已实现**（**不**入 **`compound_gate`**）

**Scope 锁定**：[TT-B391-REVENUE-PIPELINE-UNION-MAX-PROJECTION-BLOCK-VS-INDEXER-CHECKPOINT-OBS-SCOPE-LOCK.md](./TT-B391-REVENUE-PIPELINE-UNION-MAX-PROJECTION-BLOCK-VS-INDEXER-CHECKPOINT-OBS-SCOPE-LOCK.md)

---

## 1. 目的

对 **本链** **三** **经济投影表**（**`fee_router_routed_events`** / **`region_vault_forwarded_events`** / **`p5_country_ledger_lines`**）取 **`max(block_number)`** 之 **union max**，与 **进程内 indexer checkpoint** 计算 **`gap_blocks = checkpoint − union_max`**；**负** **`gap_blocks`**（**`marker=drift`**）表示 **投影最大块高于 checkpoint**。

---

## 2. 边界

| 项 | 说明 |
|----|------|
| **不**替代 | **B-383～B-390** **子** **观测** **JSON** **形状**；**只** **追加** **本键** **。 |
| **RPC** | **无** **`eth_getLogs`**；**只读** **DB** **stats** **+** **reconcile** **上下文** **checkpoint** **。 |

---

## 3. 验收（实现轮）

- [x] **`cargo test -p traveltrust-api`** 绿。  
- [x] **`bash scripts/run-check-04-routes.sh`** **exit** **0**。  
- [x] **`docs/spec/04-后端与API.md`** **契约句** **同批**。  
- [x] **`bash scripts/ops/b391-revenue-pipeline-union-max-projection-block-vs-indexer-checkpoint-reconcile-admin-overview-smoke.sh`** **exit** **0**（**勿** **含** **密钥**）。  

---

## 4. 互证

| 文档 / 代码 | 说明 |
|-------------|------|
| **实现** | **`crates/api/src/db/revenue_pipeline_union_max_projection_block_vs_indexer_checkpoint_obs.rs`**、**`indexer_reconcile.rs`** |

---

## 5. 验收（封口）

- [x] **§3 首轮**：**`cargo test -p traveltrust-api`** **+** **`bash scripts/run-check-04-routes.sh`** **（** **2026-04-15** **）** **。**
- [x] **§3 运行时 smoke**（**须** **在线** **API** **+** **`DATABASE_URL`** **+** **admin**）：[`scripts/ops/b391-revenue-pipeline-union-max-projection-block-vs-indexer-checkpoint-reconcile-admin-overview-smoke.sh`](../../scripts/ops/b391-revenue-pipeline-union-max-projection-block-vs-indexer-checkpoint-reconcile-admin-overview-smoke.sh) **`exit 0`**（**2026-04-15**）。

### §5.1 留证句式（§3 **`exit 0`** 后补录）

- **命令**：`bash scripts/ops/b391-revenue-pipeline-union-max-projection-block-vs-indexer-checkpoint-reconcile-admin-overview-smoke.sh`  
- **脚本末行示例**（**无** **密钥**）：`ok (marker=<aligned|drift|incomparable>; anchor=391-REVENUE-PIPELINE-UNION-MAX-PROJECTION-BLOCK-VS-INDEXER-CHECKPOINT-OBS-V1; reconcile == admin overview)`  
- **本仓库封口留证（目标环境）**  
  - **`API_BASE_URL`**：**`http://127.0.0.1:8081`**（**可覆写**；**本批**：**8080** **进程为旧构建** **不含** **B-391** **reconcile** **字段**，故以 **`cargo build --release -p traveltrust-api`** **+** **`DATABASE_URL=postgres://traveltrust:traveltrust@localhost:5432/traveltrust`** **另起** **监听**）。  
  - **密钥**：**`INTERNAL_API_SECRET=tt-local-b387-b388-smoke`**（与 **`scripts/ops/_local_b387_b388_smoke_orchestrator.sh`** **默认** **一致**；须与**运行中** **API** **对齐）；**`ADMIN_BEARER_TOKEN`** 由 **`POST …/auth/login`**（**`tourist@test.com`** **/** **`Test123!`**，**`seed-test-accounts`** **后**）取得；**勿**将 **Bearer** **全文** **提交** **到** **公开** **fork**。  
  - **脚本末行（脱敏，stdout 最后一行原样粘贴）**：`b391-revenue-pipeline-union-max-projection-block-vs-indexer-checkpoint-reconcile-admin-overview-smoke.sh: ok (marker=incomparable; anchor=391-REVENUE-PIPELINE-UNION-MAX-PROJECTION-BLOCK-VS-INDEXER-CHECKPOINT-OBS-V1; reconcile == admin overview)`  
  - **依赖**：**`INTERNAL_API_SECRET`**、**`ADMIN_BEARER_TOKEN`**、**`jq`**。
