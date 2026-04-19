# TT-B394 · B-394 `revenue_pipeline` — per-leg projection max block spread

**卡号**：`TT-B394-REVENUE-PIPELINE-PER-LEG-PROJECTION-MAX-BLOCK-SPREAD-OBS-001` · **母表** `B-394`  
**日期**：2026-04-15  
**状态**：**已实现**（**不**入 **`compound_gate`**）

**Scope 锁定**：[TT-B394-REVENUE-PIPELINE-PER-LEG-PROJECTION-MAX-BLOCK-SPREAD-OBS-SCOPE-LOCK.md](./TT-B394-REVENUE-PIPELINE-PER-LEG-PROJECTION-MAX-BLOCK-SPREAD-OBS-SCOPE-LOCK.md)

---

## 1. 目的

对 **本链** **三** **经济投影表**（**`fee_router_routed_events`** / **`region_vault_forwarded_events`** / **`p5_country_ledger_lines`**）分别取 **`max(block_number)`**（**仅** **有** **行** **的** **腿** **参与**），计算 **`spread_blocks = max(leg_max) − min(leg_max)`**，用于 **机读** **发现** **腿间** **索引** **进度** **不一致**（**`marker=drift`** **当** **`spread_blocks>0`** **且** **≥2** **腿**）。

---

## 2. 边界

| 项 | 说明 |
|----|------|
| **不**替代 | **B-391** / **B-392** / **B-393**（**外** **参照** **或** **bundle** **rollup**）。 |
| **RPC** | **无** **`eth_getLogs`**；**只读** **DB** **stats** **。 |

---

## 3. 验收（实现轮）

- [x] **`cargo test -p traveltrust-api`** 绿。  
- [x] **`bash scripts/run-check-04-routes.sh`** **exit** **0**。  
- [x] **`docs/spec/04-后端与API.md`** **契约句** **同批**。  
- [x] **`bash scripts/ops/b394-revenue-pipeline-per-leg-projection-max-block-spread-reconcile-admin-overview-smoke.sh`** **exit** **0**（**勿** **含** **密钥**；**以** **与** **API** **同源** **二进制** **为准** **）。  

---

## 4. 互证

| 文档 / 代码 | 说明 |
|-------------|------|
| **实现** | **`crates/api/src/db/revenue_pipeline_per_leg_projection_max_block_spread_obs.rs`**、**`indexer_reconcile.rs`** |

---

## 5. 验收（封口）

- [x] **§3 首轮**：**`cargo test -p traveltrust-api`** **+** **`bash scripts/run-check-04-routes.sh`** **（** **2026-04-15** **）** **。**
- [x] **§3 运行时 smoke**（**须** **在线** **API** **+** **`DATABASE_URL`** **+** **admin**）：[`scripts/ops/b394-revenue-pipeline-per-leg-projection-max-block-spread-reconcile-admin-overview-smoke.sh`](../../scripts/ops/b394-revenue-pipeline-per-leg-projection-max-block-spread-reconcile-admin-overview-smoke.sh) **`exit 0`**（**2026-04-15**）。

### §5.1 留证句式（§3 **`exit 0`** 后补录）

- **命令**：`bash scripts/ops/b394-revenue-pipeline-per-leg-projection-max-block-spread-reconcile-admin-overview-smoke.sh`  
- **脚本末行示例**（**无** **密钥**）：`ok (marker=<aligned|drift|incomparable>; anchor=394-REVENUE-PIPELINE-PER-LEG-PROJECTION-MAX-BLOCK-SPREAD-OBS-V1; reconcile == admin overview)`  
- **本仓库封口留证（目标环境）**  
  - **`API_BASE_URL`**：**`http://127.0.0.1:8081`**（**可覆写**；**本批**：**`cargo build --release -p traveltrust-api`** **+** **`DATABASE_URL=postgres://traveltrust:traveltrust@localhost:5432/traveltrust`** **另起** **监听** **；** **与** **`scripts/ops/_local_b387_b388_smoke_orchestrator.sh`** **默认** **`INTERNAL_API_SECRET`** **对齐** **）。  
  - **密钥**：**`INTERNAL_API_SECRET=tt-local-b387-b388-smoke`**（**须** **与** **运行中** **API** **一致**）；**`ADMIN_BEARER_TOKEN`** 由 **`POST …/auth/login`**（**`tourist@test.com`** **/** **`Test123!`**，**`seed-test-accounts`** **后**）取得；**勿**将 **Bearer** **全文** **提交** **到** **公开** **fork**。  
  - **脚本末行（脱敏，stdout 最后一行原样粘贴）**：`b394-revenue-pipeline-per-leg-projection-max-block-spread-reconcile-admin-overview-smoke.sh: ok (marker=incomparable; anchor=394-REVENUE-PIPELINE-PER-LEG-PROJECTION-MAX-BLOCK-SPREAD-OBS-V1; reconcile == admin overview)`  
  - **依赖**：**`INTERNAL_API_SECRET`**、**`ADMIN_BEARER_TOKEN`**、**`jq`**。
