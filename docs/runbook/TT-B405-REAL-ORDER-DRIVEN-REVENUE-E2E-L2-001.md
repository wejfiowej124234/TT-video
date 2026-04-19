# TT-B405 · B-405 — 真实订单驱动 Revenue E2E（L2 · **可执行实现卡**）

**卡号**：`TT-B405-REAL-ORDER-DRIVEN-REVENUE-E2E-L2-001`  
**母表**：`B-405`（实现封口时再登记 **任务母表** / **AI 任务卡索引**；**本卡不强制同批改 00/07**）  
**前置**：[TT-B402](./TT-B402-MIN-REVENUE-E2E-DATA-BUSINESS-CLOSE-LOOP-001.md)、[TT-B403](./TT-B403-REVENUE-E2E-REPEATABLE-RUNNER-L0-001.md)、[TT-B404](./TT-B404-REVENUE-E2E-RUN-STATUS-L1-001.md)  
**日期**：2026-04-15  

**目标**：在 **B-403/B-404** 不变语义前提下，增加 **L2**：留证 **`b405_round`** 绑定 **`order_id`**；**`GET …/revenue-e2e-run-status`** 返回 **`manifest_kind`** / **`order_id`** / **`order_phase`** / **`orders_row_excerpt`**（白名单）；**无新 DB 迁移**。

---

## 1. 文件改动清单（**≤ 8 个文件**）

| # | 路径 | 动作 | 内容摘要 |
|---|------|------|----------|
| 1 | `crates/api/src/routes/internal/revenue_e2e_run_status.rs` | 改 | 见 **§2**；单元测试同文件 `#[cfg(test)]` 追加 |
| 2 | `docs/spec/04-后端与API.md` | 改 | **§3.4** 大表 **`GET …/internal/revenue-e2e-run-status`** 一行：双 manifest、`b405_round`、新响应键、`TRAVELTRUST_B405_MANIFEST_PATH` |
| 3 | `scripts/ops/b405-revenue-e2e-order-driven-runner.sh` | **新建** | 见 **§3**；可执行、`set -euo pipefail` |
| 4 | `evidence/b405_revenue_e2e_runs/README.md` | **新建** | 目录说明 + manifest 文件名 + 与 **B-403** 目录区分 |
| 5 | `ops/RUNBOOK.md` | 改 | **§2.55** 增加 **B-405** 小段（命令 + env + 与 B-403 关系） |
| 6 | `docs/runbook/TT-B405-REAL-ORDER-DRIVEN-REVENUE-E2E-L2-001.md` | 改 | 本卡 |

**实现状态（2026-04-15）**：上表 **6** **项** **已** **落地** **（** **代码** **+** **脚本** **+** **04** **+** **ops** **+** **evidence** **README** **）** **；** **母表** **/** **AI** **索引** **登记** **仍** **按** **仓库** **封口** **流程** **另批** **。**

**显式不在本批（避免 >8）**：`crates/api/src/routes/internal/mod.rs`（路由已挂则 **不动**）、`crates/api/src/db/orders.rs`（**不** 新增函数除非复用 `get_order_by_id` 不足）、`docs/任务母表.md` / `docs/AI任务卡索引.md`（**封口登记** 另批）、`main.rs`。

---

## 2. API 改动（仅 **`revenue_e2e_run_status.rs` + 04**）

### 2.1 路由

- **不改路径、不改方法**：仍为 **`GET /api/v1/internal/revenue-e2e-run-status?run_id=<uuid>`**  
- **鉴权**：不变，**`X-Internal-Api-Secret`**

### 2.2 Manifest 解析顺序（**向后兼容**）

1. 读 **B-403 文件**（现有逻辑：`TRAVELTRUST_B403_MANIFEST_PATH` → `TRAVELTRUST_REPO_ROOT` → cwd）  
2. 若不存在 **`kind=b403_round` 且 `run_id` 匹配**，再读 **B-405 文件**：  
   - 路径：**`TRAVELTRUST_B405_MANIFEST_PATH`**（若设置）  
   - 否则 **`$TRAVELTRUST_REPO_ROOT/evidence/b405_revenue_e2e_runs/b405-run-manifest.jsonl`**  
   - 否则 **`cwd/evidence/b405_revenue_e2e_runs/b405-run-manifest.jsonl`**  
3. 在 **B-405 文件** 中查找 **`kind=b405_round` 且 `run_id` 匹配**  
4. **任一路命中** 即进入 **200** 组装；**两路皆无** → **404** `revenue_e2e_run_not_found`（`detail` 可注明已查 **b403+b405** 路径）  
5. **任一路文件不可读** → 若另一路可读仍继续；**两路皆不可读** → **404** `b403_manifest_not_readable`（与现行为一致，**detail** 列明尝试路径）

解析器：继续复用 **`parse_b403_manifest_json_values`**（**NDJSON** / **连续 JSON**）。

### 2.3 响应 JSON 增量（**`anchor` 不变**）

- 保持 **`anchor`=`404-REVENUE-E2E-RUN-STATUS-V1`**（**不** 新开 anchor，避免探针分叉）  
- 新增（**可选键，缺省 `null`**）：  
  - **`manifest_source`**：`"b403"` \| `"b405"` — 命中行来自哪个文件  
  - **`manifest_kind`**：`"b403_round"` \| `"b405_round"`  
  - **`order_id`**：字符串 UUID；**仅 `b405_round`** 时有值，否则 **`null`**  
  - **`order_phase`**：字符串；建议取 **`order_phase_after_b402`**，缺省则 **`order_phase_before_tick`**，再无则 **`null`**  
  - **`orders_row_excerpt`**：有 **`PgPool`** 且 **`order_id` 合法 UUID** 时 **`db::get_order_by_id`**；序列化 **仅白名单**：`id`、`status`、`escrow_address`、`chain_id`、`amount`、`currency`、`created_at`、`updated_at`（**不含** `tourist_id`/`guide_id`/邮箱）  
  - 行不存在：**`orders_row_excerpt`** = **`null`**，可加 **`orders_row_excerpt_note`**=`"order_not_found"`（**04** 一句带過即可）

**`manifest_round`**：仍为 **命中行的完整 JSON 对象**（**b403_round** 或 **b405_round**）。**`manifest_session`**：对 **`b405_round`** 用 **`session_id`** 匹配 **`b405_session_start`**（无则 `null`）。

### 2.4 数据库

- **无新表、无新列、无 migration**  
- 只读 **`db::get_order_by_id(pool, order_uuid)`**（已有 **`crates/api/src/db/orders.rs`**）

---

## 3. 脚本（**`b405-revenue-e2e-order-driven-runner.sh`**）

**行为（实现时钉死）**：

1. 校验 **`INTERNAL_API_SECRET`**、**`ADMIN_BEARER_TOKEN`**、**`jq`**（与 **B-403** 一致）  
2. **`API_BASE_URL`** 默认 `http://127.0.0.1:8080`  
3. **每轮**：  
   - **`ORDER_ID` 来源**（二选一，实现 PR 选稳的一种并写进脚本注释）：  
     - **A**：`GET /api/v1/orders?limit=1` + **`Authorization: Bearer`**，取 **`items[0].id`**；空列表则 **exit 非 0** 并 stderr 说明「须先有订单」  
     - **B**：`POST /api/v1/orders` 最小合法 body（从 **`order_create`** / 现有集成测试抄 **JSON** 形状）创建后取 **`order.id`**  
   - 写 **`b405_session_start`**（首轮仅一次）/ **`b405_round`**：`session_id`、`run_id`、`round`、`order_id`、`order_phase_before_tick`=`order_selected`  
   - **`POST /api/v1/internal/indexer-tick`** → 更新相位 **`post_tick_pre_b402`**（可再写一行 manifest 或 **单条 round 内多字段**，为控制行数 **推荐单条 `b405_round` 在 b402 前写一版、后 `jq` 原地追加字段** — 若过复杂则 **允许两轮 NDJSON**：`b405_round_tick` + `b405_round`，**04** 只要求 **最终** **`b405_round` 含 `run_id`+`order_id`+`b402_*`**；**最小实现**：**一行 `b405_round` 在 b402 成功后一次性写入全部字段**)  
   - 调用 **`bash scripts/ops/b402-min-revenue-e2e-reconcile-smoke.sh`**（与 **B-403** 相同）  
   - 将 **`b402_exit`**、**`b402_last_line`**（截断）写入 manifest  
4. **`B405_ROUNDS`** 默认 `2`；输出目录 **`B405_RUNS_OUT`** 默认 `evidence/b405_revenue_e2e_runs`  
5. **退出码**：对齐 **B-403**（tick 非 200 → **2**；b402 非 0 → **5**；写 manifest 失败 → **6**）

**说明**：若采用 **「单行 `b405_round`」**，脚本在 round 末尾 **一次 `jq -n` 写出整对象** 即可，避免 NDJSON 多行同一 `run_id`。

---

## 4. 测试步骤（实现验收）

| 步骤 | 命令 / 操作 | 期望 |
|------|-------------|------|
| 1 | `cargo test -p traveltrust-api` | 通过（含 **`revenue_e2e_run_status`** 新用例） |
| 2 | `bash scripts/run-check-04-routes.sh` | 通过 |
| 3 | 构造最小 **`b405-run-manifest.jsonl`**（含 **`b405_session_start` + `b405_round`**，`run_id`/`order_id` 为合法 UUID；`order_id` 在 DB 无行） | **`GET …/revenue-e2e-run-status`** **200**，**`orders_row_excerpt`**=`null` |
| 4 | 目标环境：`B405_ROUNDS=2 bash scripts/ops/b405-revenue-e2e-order-driven-runner.sh` | **exit 0** |
| 5 | `curl` **GET** `…/revenue-e2e-run-status?run_id=<manifest 中 run_id>` | **200**，**`manifest_kind`**=`b405_round`，**`order_id`** 与 manifest 一致 |
| 6 | 同环境 `bash scripts/ops/b403-revenue-e2e-repeatable-runner.sh`（**B403_ROUNDS=2**） | **不回归** **exit 0**（**B-403** 仍只读 **b403** manifest） |

**单元测试建议（同文件）**：

- **`find_round` 逻辑**：内存字符串 **仅 b405 文件** 命中 **`b405_round`**  
- **`order_id` 非法 UUID**：**`orders_row_excerpt`**=`null`，**不 panic**  
- **先 b403 命中**：不读 b405 文件（可用 **test-only** 路径注入或临时文件 — 若过重则 **只测** b405 分支 + 代码审查 b403 优先序）

---

## 5. 状态机（脚本 / manifest 字段值）

| `order_phase_*` | 含义 |
|-----------------|------|
| `order_selected` | 已选定 **`order_id`**，尚未 tick |
| `post_tick_pre_b402` | tick **200**，尚未 b402 |
| `post_b402` | b402 **exit 0**（写入 **`order_phase_after_b402`** 时） |

---

## 6. 互证

- 实现：`crates/api/src/routes/internal/revenue_e2e_run_status.rs`  
- 契约：`docs/spec/04-后端与API.md` **§3.4**  
- 运维：`ops/RUNBOOK.md` **§2.55**  
