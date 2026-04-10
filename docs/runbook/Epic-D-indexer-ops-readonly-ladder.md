# Epic D：索引器 / 对账运维闭环 — 阶梯稿（D-01～D-10）

**策略定位**：在 **不触碰 B-115、B-116、P5** 已封口业务语义与契约的前提下，把 **tick / reconcile / dry-run / 探针 / 留痕** 运维流程收敛为**可重复、可 diff、可归档**的闭环；与 **[Runbook §2.55](../../ops/RUNBOOK.md)**、**[110 §3.1.2～3.1.4](../spec/110-阶段开发链上索引器与事件同步器.md)**、**[04 §3.4 · internal](../spec/04-后端与API.md)**、**[14 §2.1 · 运维 JSON 快照](../spec/14-合约-API-ABI-前后端对齐.md)** 同锚。

**110 覆盖边界（台账 · 与 Epic D 并行只读）**：**[GO_B114](../../evidence/GO_B114_INDEXER_TARGET_SLICE_CLOSE.md)**（**B-114-1～5**）**不**等同于 **spec/110** 全文 **Target** 均已闭合；**spec/110** 其余句与 **B-114 / B-101 / B-102 / B-116 / B-115 / P5** 等承接关系见 **母表 [B-126](../任务母表.md)** 行内 **HTML 对照表** 与 **[evidence/README · #b126-110-target-alignment](../../evidence/README.md#b126-110-target-alignment)**。**不重开 B-114-6**；本阶梯 **不**改写上述 **GO** 封口语义。

**Finality 闭环边界（母表 backlog · 与 Epic D 并行）**：**spec/110 §3.3** / **§3.1.1** 与 **`meta.indexer` / `finality_n_used` / tick 安全上界** 及 **资金终态投影** 的 **DoD** 与验收占位见 **母表 [B-127](../任务母表.md)**、**[evidence/README · #b127-finality-gate](../../evidence/README.md#b127-finality-gate)**；**不**替代 **B-114 / B-116** 已封口证据卷语义。

---

## 与 Epic E / F 的硬约束（最终推荐版 · 一条读）

| Epic | 必须补一句（防 AI / 执行漂移） |
|------|--------------------------------|
| **D（本 Epic）** | 所有运维流程**必须输出标准化 artifact JSON**（**字段稳定、可 diff、可归档**），**不得**仅以供人读的文本日志作为**唯一**产物。 |
| **E**（财务 / Admin 只读面） | **以只读 API 为主入口**，脚本**仅为消费层**；**不得**出现「仅脚本存在而无 API 对应能力」的对账逻辑。阶梯全文与防线见 **[Epic-E-finance-readonly-ladder.md](./Epic-E-finance-readonly-ladder.md)**。 |
| **F**（E2E 三项包） | E2E **允许 mock 外部依赖**，但 **不得 mock B-115 / B-116 / P5 已封口语义路径**；**必须至少保留一条路径**覆盖**真实状态机流转**（本地链或**固定 fixture**，二者择一钉死）。 |

**推荐执行顺序**：**D → E → F**（不变）。

---

## Epic D 硬边界（全程遵守）

- **不修改** **B-115 / B-116 / P5** 封口目录下的**行为、路由契约或分配 / FeeRouter / 逐国账本**等已登记语义。
- **不**把本 Epic 的产出绑进 **Epic A / Epic C** 的 UI 真值源；若 Admin 只读消费，须走 **Epic E** 的「API 主入口」规则。
- **写路径**（如 **`persist:true`**、**`indexer-tick`**、**execute 类 rollback**）仅允许在**独立值班 TT** 中显式批准；**本阶梯默认落盘对象以只读 / `persist:false` / `*_dry_run` 响应体为主**。

---

## 标准化 Artifact 总壳（`traveltrust.ops_artifact.v1`）

**机器可读 SSOT（JSON Schema）**：[Epic-D-ops-artifact.v1.schema.json](./Epic-D-ops-artifact.v1.schema.json)  
**Task → `artifact_type` / `payload` 最小键 / `ops_summary` 是否必填**：[epic-d-d01-tasks-min-keys.json](./epic-d-d01-tasks-min-keys.json)  
**示例（envelope + `ops_summary`）**：[Epic-D-ops-artifact.v1.example-d05-reconcile.json](./Epic-D-ops-artifact.v1.example-d05-reconcile.json)、[Epic-D-ops-artifact.v1.example-d06-dry-run-chain.json](./Epic-D-ops-artifact.v1.example-d06-dry-run-chain.json)、[Epic-D-ops-artifact.v1.example-d07-dry-run-event-log.json](./Epic-D-ops-artifact.v1.example-d07-dry-run-event-log.json)、[Epic-D-ops-artifact.v1.example-d08-dry-run-correction-executor.json](./Epic-D-ops-artifact.v1.example-d08-dry-run-correction-executor.json)、[Epic-D-ops-artifact.v1.example-d09-probe.json](./Epic-D-ops-artifact.v1.example-d09-probe.json)（**`probe`** · 无 **`ops_summary`**）；**D-10 GO 目录形状**：[Epic-D-ops-artifact.v1.example-d10-go-bundle/](./Epic-D-ops-artifact.v1.example-d10-go-bundle/README.md)

凡本 Epic 落盘的 **`*.json`**，**须**带齐下表 **顶域**（若文件**仅为** API 响应原文，则**须**同目录 **`…Sidecar.json`** 或 **`manifest.json` 条目的 `artifact_envelope`** 满足同形，**禁止**「只有 A/B/C 三种 JSON 长得一样却**无法 `artifact_type` 区分**」）。

| 键 | 类型 | 必填 | 说明 |
|----|------|------|------|
| **`artifact_schema_id`** | string | ✅ | 固定 **`traveltrust.ops_artifact.v1`** |
| **`artifact_schema_version`** | string | ✅ | **SemVer**，当前 **`1.0.0`**；**仅**在字段语义变更时 bump |
| **`artifact_type`** | string | ✅ | **决定性分类**（机读索引 / bundle 校验 / evidence 目录分类）。**枚举**：**`snapshot_public`**（D-02）\|**`indexer_status`**（D-03、D-04）\|**`reconcile`**（D-05）\|**`dry_run_chain`**（D-06）\|**`dry_run_event_log`**（D-07）\|**`dry_run_correction_executor`**（D-08）\|**`probe`**（D-09）\|**`bundle`**（D-10 或 D-01 登记包） |
| **`captured_at`** | string | ✅ | **RFC3339** UTC |
| **`epic_task_id`** | string | ✅ | 如 **`Epic-D-D05`** |
| **`provenance`** | object | ✅ | 至少 **`host_git_commit`**、**`host_git_branch`**、**`host_repo_dirty`**（与 **`snapshot_provenance`** 对齐） |
| **`api_context`** | object | ✅ | **`internal_invoked`**（bool）；**`api_base_url_redacted`**、**`chain_id`**（若适用） |
| **`ops_summary`** | object | 条件必填 | 见下段 **`reconcile` / dry-run** 规则 |
| **`payload`** | object | ✅ | **API 响应全文**或快照合并根；**禁止**仅 **`human_text`** |

### `ops_summary`（**D-05～D-08 强制**；结构全 Epic 统一）

**`artifact_type` ∈ { `reconcile`, `dry_run_chain`, `dry_run_event_log`, `dry_run_correction_executor` }** 时 **必填**，且**四键齐全**（供通用 **probe / gate** 消费，避免 chain / event_log / correction_executor 各用一套字段名）：

```json
{
  "dry_run": true,
  "domain": "orders | chain | event_log | correction_executor",
  "issues_total": 0,
  "clean": true
}
```

| `artifact_type` | `ops_summary.dry_run` | `ops_summary.domain` | `issues_total` / `clean` 映射（规范） |
|-----------------|-------------------------|----------------------|----------------------------------------|
| **`reconcile`**（D-05） | **`false`** | **`orders`** | **`issues_total`** ← `payload.issues_total`；**`clean`** ← `payload.projection_reconcile_clean`（缺省时 **`clean:false`**） |
| **`dry_run_chain`**（D-06） | **`true`** | **`chain`** | **`issues_total`** ← **`internal-indexer-ops.sh`** 落盘时取 **`payload.orders_chain_scope_rollback_dry_run.orders_chain_id_null_with_escrow_address`**（缺对象或非 JSON 成功体时按脚本保守策略）；**`clean`** ← **`issues_total === 0`**（或规范在 **110** 另钉「允许预警阈值」时按该规范） |
| **`dry_run_event_log`**（D-07） | **`true`** | **`event_log`** | **`issues_total`** ← **`payload.event_log_chain_scope_rollback_dry_run`** 四计数之和（**`event_log_rows`+`checkpoints_sharded_rows`+`fee_router_routed_events_rows`+`region_vault_forwarded_events_rows`**；缺块时 **`0`**）；**`clean`** ← **`issues_total==0`**；**`reason_code`**：成功且块存在 **`null`**，否则 **`payload.error`** 字符串或 **`event_log_chain_scope_rollback_dry_run_absent`** / **`indexer_reconcile_response_without_event_log_dry_run`**（见 **`internal-indexer-ops.sh`**） |
| **`dry_run_correction_executor`**（D-08） | **`true`** | **`correction_executor`** | **`issues_total`** ← **`correction_log_rows`+`executor_executions_rows`**（**`payload.correction_executor_chain_scope_rollback_dry_run`**；缺块时 **`0`**）；**`clean`** ← **`issues_total==0`**；**`reason_code`**：成功且块存在 **`null`**，否则 **`payload.error`** 或 **`correction_executor_chain_scope_rollback_dry_run_absent`** / **`indexer_reconcile_response_without_correction_executor_dry_run`** |

**D-02 / D-03 / D-04 / D-09 / D-10**：**不强制** `ops_summary`；若 bundle 内聚合多段，子 artifact 各自遵守上表。

**禁止**：将**仅有** `stdout` 文本、无 **可解析 JSON 体** 的文件作为该 Task 的**唯一**归档物（日志可作为附录 **`.txt`**，**不得替代** **`payload` + 顶域**）。

---

## D-01 — Artifact SSOT 与字段登记

**目标**：**仅定义** **`traveltrust.ops_artifact.v1`**（含**强制 **`artifact_type`**、**`tasks_min_keys`**、**`ops_summary` 约束**），**不实现**业务逻辑；后续 **D-02～D-10** 落盘**须**可校验地遵循 **[Epic-D-ops-artifact.v1.schema.json](./Epic-D-ops-artifact.v1.schema.json)**。

**Runbook**：无 API；文档互指 **[14 §2.1](../spec/14-合约-API-ABI-前后端对齐.md)** / **[110 §3.1.2](../spec/110-阶段开发链上索引器与事件同步器.md)**（各加一句「运维 artifact 总壳见 **Epic-D-ops-artifact.v1**」即可，**另开 TT**，本稿不改 **B-115/B-116/P5/Epic A/Epic C** 语义）。

**Artifact（登记用）**：[epic-d-d01-tasks-min-keys.json](./epic-d-d01-tasks-min-keys.json)（内嵌 **`tasks_min_keys`**；**`artifact_type`：`bundle`**）。

**验收**：**`artifact_type`** 与 **`tasks_min_keys.Epic-D-Dxx.artifact_type`** 一致；**D-05～D-08** 在 **`tasks_min_keys`** 中 **`ops_summary_required`: true**。

---

## D-02 — 公开面快照（无 internal）

**目标**：**`/health` + `/meta`** 合并 JSON，顶域 **`snapshot_provenance`** 与 **04 / 110** 对读。

**Runbook 命令**（仓库根，**Git Bash**）：

```bash
API_BASE_URL=http://127.0.0.1:8080 bash scripts/indexer-public-snapshot.sh
# 勿设 INTERNAL_API_SECRET，确保无 internal 段
```

**落盘 envelope**：**`artifact_type`：`snapshot_public`**（与 **D-03 `indexer_status`** 区分，供 **evidence/README** / bundle 索引）。

**落盘 `payload` 须含**：**`health`**、**`meta`**、**`snapshot_provenance`**（**`script`** / **`script_semver`** / **`host_git_commit`** / **`host_git_branch`** / **`host_repo_dirty`**）。

**验收**：输出为**合法 JSON**；`jq -e '.artifact_version == "v1" and .artifact_type == "snapshot_public" and .payload.health and .payload.meta and .payload.snapshot_provenance'`。**结构示例（非实时抓取）**：[Epic-D-ops-artifact.v1.example-d02-snapshot-public.json](./Epic-D-ops-artifact.v1.example-d02-snapshot-public.json)。

---

## D-03 — `GET …/internal/indexer-status`（基线）

**目标**：机读 **checkpoint / lag / reorg 提示**；**无** **`POST indexer-reconcile`**、**无**落库；基线 **勿**加 **`--live-reconcile`**（该路径归 **D-04**）。

**Runbook 命令（`traveltrust.ops_artifact.v1` 封装 stdout）**：

```bash
API_BASE_URL=http://127.0.0.1:8080 INTERNAL_API_SECRET='…' \
  bash scripts/internal-indexer-ops.sh status --ops-artifact > evidence/GO_YYYYMMDD/artifacts/epic-d-d03-indexer-status.json
# 可选：CHAIN_ID=1 …（写入 **`api_context.chain_id`**）
```

**裸 API JSON（无 envelope）**仍可用：`…/internal-indexer-ops.sh status`（**无** **`--ops-artifact`**）。

**落盘 envelope**：**`artifact_type`：`indexer_status`**；**`artifact_version`：`v1`**；顶层 **`status`**、**`checkpoint`**、**`lag`**（与 **`payload`** 同源，供 **D-04/D-05** 叠加）；**`indexer_surface`**（自 **`payload`** 扁平抽取）；**`live_reconcile_surface`：`null`**（**D-04** 非 null）。

**落盘 `payload` 须含**：与 **04** 一致的 **`indexer-status` 成功体**根级键（**`indexer`**、**`state`** 等）。

**验收**：`jq -e '.artifact_version == "v1" and .artifact_type == "indexer_status" and .epic_task_id == "Epic-D-D03" and (.status != null) and (.checkpoint != null) and (.lag != null) and .indexer_surface and .live_reconcile_surface == null and .payload.indexer and .payload.state'`。**结构示例**：[Epic-D-ops-artifact.v1.example-d03-indexer-status.json](./Epic-D-ops-artifact.v1.example-d03-indexer-status.json)。

---

## D-04 — `GET …/internal/indexer-status?live_reconcile=1`

**目标**：**单次 GET** 附带 **即时 `orders`↔`orders_projection` 只读对账**（与 **Runbook §2.55**「DB 干净度」互补 **metrics**）；**不**调用 **`POST …/indexer-reconcile`**，**无** **`persist`**，**无**落库报告。

**Runbook 命令（`traveltrust.ops_artifact.v1` 封装）**：

```bash
API_BASE_URL=http://127.0.0.1:8080 INTERNAL_API_SECRET='…' \
  bash scripts/internal-indexer-ops.sh status --live-reconcile --ops-artifact > evidence/GO_YYYYMMDD/artifacts/epic-d-d04-indexer-status-live.json
```

**裸 GET JSON**（无 envelope）：仍可用 **curl** … **`?live_reconcile=1`**（与上表同路径）。

**落盘 envelope**：**`artifact_type`：`indexer_status`**；**`epic_task_id`：`Epic-D-D04`**；**`api_context.live_reconcile_query`：`true`**；**`live_reconcile_surface`**（**`projection_reconcile_clean`**、**`issues_total`**、**`ok`**、**`error`**）；顶层仍含与 **D-03** 同形的 **`status`**、**`checkpoint`**、**`lag`**，以便 **D-05** 叠加。

**落盘 `payload` 须含**：**`live_orders_projection_reconcile`**（与 **04 / internal.rs** 同源；成功时 **`issues_total`**、**`projection_reconcile_clean`** 在该子树内）。

**验收**：`jq -e '.artifact_version == "v1" and .epic_task_id == "Epic-D-D04" and .live_reconcile_surface != null and .payload.live_orders_projection_reconcile != null'`。**结构示例**：[Epic-D-ops-artifact.v1.example-d04-indexer-status-live.json](./Epic-D-ops-artifact.v1.example-d04-indexer-status-live.json)。

---

## D-05 — `POST …/internal/indexer-reconcile`（`persist:false` 空体或最小体）

**目标**：**主对账 + B-101 compound** 根级机读键归档；**不落库** **`reconciliation_reports`**。

**Runbook 命令（`traveltrust.ops_artifact.v1` 封装）**：

```bash
API_BASE_URL=http://127.0.0.1:8080 INTERNAL_API_SECRET='…' \
  bash scripts/internal-indexer-ops.sh reconcile --ops-artifact > evidence/GO_YYYYMMDD/artifacts/epic-d-d05-indexer-reconcile.json
# body 无 persist（等价 false）；**禁止**与本命令同用 **`--persist`**
```

**裸 POST JSON**（无 envelope）：`…/internal-indexer-ops.sh reconcile`（**无** **`--ops-artifact`**）。

**落盘 envelope**：**`artifact_type`：`reconcile`**；**根级 **`dry_run`：`false`**（与 **D-06～D-08** **`dry_run:true`** / **`dry_run_*`** 类型对读）；**`epic_task_id`：`Epic-D-D05`**；**`api_context.persist_requested`：`false`**；**`reconcile_surface`**；**强制 **`ops_summary`**（**`dry_run:false`**，**`domain:"orders"`**，**`issues_total`** / **`clean`** 按 **D-01 映射表** 自 **`payload`** 填）。

**落盘 `payload` 须含**（与 **internal.rs** / **04** 对齐）：**`issues_total`**、**`projection_reconcile_clean`**、**`orders_projection_reconcile_gate`**、**`reconcile_compound_pass`**、**`indexer_reconcile_compound_gate`**（**`B101-INDEXER-RECONCILE-COMPOUND-GATE`**）。

**验收**：`jq -e '.artifact_version == "v1" and .artifact_type == "reconcile" and .dry_run == false and .epic_task_id == "Epic-D-D05" and .api_context.persist_requested == false and .ops_summary.dry_run == false and .payload.reconcile_compound_pass == .payload.indexer_reconcile_compound_gate.pass'`。**结构示例**：[Epic-D-ops-artifact.v1.example-d05-reconcile.json](./Epic-D-ops-artifact.v1.example-d05-reconcile.json)。

---

## D-06 — 链域 `dry-run`（`orders_chain_scope_rollback_dry_run`）

**目标**：**只读计数**路径；**不**执行 **DELETE**、**不**落库 **`reconciliation_reports`**、**不**带 **`orders_chain_scope_rollback_execute`**。

**Runbook 命令（`traveltrust.ops_artifact.v1` 封装）**：

```bash
CHAIN_ID=1 API_BASE_URL=http://127.0.0.1:8080 INTERNAL_API_SECRET='…' \
  bash scripts/internal-indexer-ops.sh reconcile --chain-scope-dry-run --ops-artifact > evidence/GO_YYYYMMDD/artifacts/epic-d-d06-chain-scope-dry-run.json
# **禁止**同用 **`--persist`**、**`--chain-scope-rollback-execute`** 或与其它 dry-run flag 叠用
```

**裸 POST JSON**（无 envelope）：`…/internal-indexer-ops.sh reconcile --chain-scope-dry-run`（**无** **`--ops-artifact`**）。

**落盘 envelope**：**`artifact_type`：`dry_run_chain`**；**根级 **`dry_run`：`true`**；**`epic_task_id`：`Epic-D-D06`**；**`api_context.persist_requested`：`false`**、**`orders_chain_scope_rollback_execute_requested`：`false`**；**`dry_run_chain_surface`**（**`issues_total`**、**`orders_chain_scope_rollback_dry_run_present`**、**`anchor`**、**`orders_chain_id_null_with_escrow_address`**）；**强制 **`ops_summary`**（**`dry_run:true`**，**`domain:"chain"`**；与 **D-07/D-08** **同一四键形**）。

**落盘 `payload` 须含**：**`orders_chain_scope_rollback_dry_run`**（**`110-ORDERS-CHAIN-SCOPE-DRY-RUN`**）；可为完整 **`indexer-reconcile`** **200** 体（主对账与 dry-run 块并存）。

**验收**：`jq -e '.artifact_version == "v1" and .artifact_type == "dry_run_chain" and .dry_run == true and .epic_task_id == "Epic-D-D06" and .ops_summary.dry_run == true and .ops_summary.domain == "chain" and .payload.orders_chain_scope_rollback_dry_run.anchor == "110-ORDERS-CHAIN-SCOPE-DRY-RUN"'`。**结构示例**：[Epic-D-ops-artifact.v1.example-d06-dry-run-chain.json](./Epic-D-ops-artifact.v1.example-d06-dry-run-chain.json)。

---

## D-07 — `event_log` 域 `dry-run`（`event_log_chain_scope_rollback_dry_run`）

**目标**：与 **110 §3.1.4** 规划/多链留痕一致；**仍为只读计数**；**不**落库 **`reconciliation_reports`**、**不**执行 **`event_log_chain_scope_rollback_execute`**。

**Runbook 命令（`traveltrust.ops_artifact.v1` 封装）**：

```bash
CHAIN_ID=1 API_BASE_URL=http://127.0.0.1:8080 INTERNAL_API_SECRET='…' \
  bash scripts/internal-indexer-ops.sh reconcile --event-log-scope-dry-run --ops-artifact > evidence/GO_YYYYMMDD/artifacts/epic-d-d07-event-log-scope-dry-run.json
# **禁止**同用 **`--persist`**、**`--event-log-scope-rollback-execute`** 或与其它 dry-run flag 叠用
```

**裸 POST JSON**（无 envelope）：`…/internal-indexer-ops.sh reconcile --event-log-scope-dry-run`（**无** **`--ops-artifact`**）。

**落盘 envelope**：**`artifact_type`：`dry_run_event_log`**；**根级 **`dry_run`：`true`**；**`epic_task_id`：`Epic-D-D07`**；**`api_context.persist_requested`：`false`**、**`event_log_chain_scope_rollback_execute_requested`：`false`**；**`dry_run_event_log_surface`**（**`issues_total`**、**`event_log_chain_scope_rollback_dry_run_present`**、**`anchor`**、四表行数）；**`reason_code`**：**`null`** 当 **`payload.event_log_chain_scope_rollback_dry_run`** 存在，否则机读码（**`payload.error`** 优先，或 **`event_log_chain_scope_rollback_dry_run_absent`** / **`indexer_reconcile_response_without_event_log_dry_run`**）；**强制 **`ops_summary`**（**`dry_run:true`**，**`domain:"event_log"`**，与 **D-05/D-06** 同四键形）。

**落盘 `payload` 须含**（成功时）：**`event_log_chain_scope_rollback_dry_run`**（锚 **`110-EVENT-LOG-CHAIN-SCOPE-DRY-RUN`**）；可为完整 **`indexer-reconcile`** **200** 体（主对账与 dry-run 块并存）。失败 / 非 JSON 体仍写入 **`payload`**（如 **`non_json_body`** 或 **`error`**），**禁止**仅以 stderr 为唯一产物。

**验收**：`jq -e '.artifact_version == "v1" and .artifact_type == "dry_run_event_log" and .dry_run == true and .epic_task_id == "Epic-D-D07" and .ops_summary.dry_run == true and .ops_summary.domain == "event_log" and (.reason_code == null or (.reason_code | type) == "string") and (.payload.event_log_chain_scope_rollback_dry_run == null or .payload.event_log_chain_scope_rollback_dry_run.anchor == "110-EVENT-LOG-CHAIN-SCOPE-DRY-RUN")'`。**结构示例**：[Epic-D-ops-artifact.v1.example-d07-dry-run-event-log.json](./Epic-D-ops-artifact.v1.example-d07-dry-run-event-log.json)。

---

## D-08 — `correction_executor` 域 `dry-run`（`correction_executor_chain_scope_rollback_dry_run`）

**目标**：与 **110 §3.1.4** / **Runbook §2.55** 一致；**只读计数**；**不**落库 **`reconciliation_reports`**、**不**执行 **`correction_executor_chain_scope_rollback_execute`**。

**Runbook 命令（`traveltrust.ops_artifact.v1` 封装）**：

```bash
CHAIN_ID=1 API_BASE_URL=http://127.0.0.1:8080 INTERNAL_API_SECRET='…' \
  bash scripts/internal-indexer-ops.sh reconcile --correction-executor-scope-dry-run --ops-artifact > evidence/GO_YYYYMMDD/artifacts/epic-d-d08-correction-executor-scope-dry-run.json
# **禁止**同用 **`--persist`**、**`--correction-executor-scope-rollback-execute`** 或与其它 dry-run flag 叠用
```

**裸 POST JSON**（无 envelope）：`…/internal-indexer-ops.sh reconcile --correction-executor-scope-dry-run`（**无** **`--ops-artifact`**）。

**落盘 envelope**：**`artifact_type`：`dry_run_correction_executor`**；**根级 **`dry_run`：`true`**；**`epic_task_id`：`Epic-D-D08`**；**`api_context.persist_requested`：`false`**、**`correction_executor_chain_scope_rollback_execute_requested`：`false`**；**`dry_run_correction_executor_surface`**；**`reason_code`**：**`null`** 当 **`payload.correction_executor_chain_scope_rollback_dry_run`** 存在，否则机读码（**`payload.error`** 优先，或 **`correction_executor_chain_scope_rollback_dry_run_absent`** / **`indexer_reconcile_response_without_correction_executor_dry_run`**）；**强制 **`ops_summary`**（**`dry_run:true`**，**`domain:"correction_executor"`**）。

**落盘 `payload` 须含**（成功时）：**`correction_executor_chain_scope_rollback_dry_run`**（锚 **`110-CORRECTION-EXECUTOR-CHAIN-SCOPE-DRY-RUN`**）。失败 / 非 JSON 体仍写入 **`payload`**，**禁止**仅以 stderr 为唯一产物。

**验收**：`jq -e '.artifact_version == "v1" and .artifact_type == "dry_run_correction_executor" and .dry_run == true and .epic_task_id == "Epic-D-D08" and .ops_summary.dry_run == true and .ops_summary.domain == "correction_executor" and (.reason_code == null or (.reason_code | type) == "string") and (.payload.correction_executor_chain_scope_rollback_dry_run == null or .payload.correction_executor_chain_scope_rollback_dry_run.anchor == "110-CORRECTION-EXECUTOR-CHAIN-SCOPE-DRY-RUN")'`。**结构示例**：[Epic-D-ops-artifact.v1.example-d08-dry-run-correction-executor.json](./Epic-D-ops-artifact.v1.example-d08-dry-run-correction-executor.json)。

---

## D-09 — 门禁探针与 **`indexer-reconcile-gate`**（**B-120**）同锚

**目标**：**`GET …/internal/indexer-status?live_reconcile=1`** 只读探针；**不** **`POST indexer-reconcile`**、**不**落库、**不**自动修复；**`gate_workflow_checks_total_expected`** 与 **`.github/workflows/indexer-reconcile-gate.yml`** **`checks_total`**（当前 **106**）**同值**，**`gate_workflow_rule_id`**：**`indexer-reconcile-gate`**（与 workflow **`rule_id`** 摘要互证）。

**Runbook 命令（`traveltrust.ops_artifact.v1` 封装 stdout）**：

```bash
CHAIN_ID=1 API_BASE_URL=http://127.0.0.1:8080 INTERNAL_API_SECRET='…' \
  bash scripts/indexer-reconcile-probe.sh --ops-artifact > evidence/GO_YYYYMMDD/artifacts/epic-d-d09-indexer-reconcile-probe.json
# 或：bash scripts/internal-indexer-ops.sh probe --ops-artifact > …
echo $?
```

**裸探针**（无 envelope）：`…/indexer-reconcile-probe.sh`（**无** **`--ops-artifact`**）— 行为与退出码 **0～5** 不变（见脚本头注释）。

**落盘 envelope**：**`artifact_type`：`probe`**；**`artifact_version`：`v1`**；**根级** **`probe_exit_code`**、**`issues_total`**（无 **`live_orders_projection_reconcile`** 时为 **`null`**）、**`clean`**（**`probe_exit_code==0`** 时为 **`true`**）；**`gate_workflow_checks_total_expected`**、**`gate_workflow_rule_id`**、**`gate_workflow_job`**；**不**强制 **`ops_summary`**（与 schema **D-05～D-08** 区分）。

**落盘 `payload` 须含**：**`indexer_status`**（**GET** 响应全文或解析失败时的 **`non_json_body`** 包装）、**`probe_exit_code`**、**`issues_total`**、**`projection_reconcile_clean`**、**`gate_*`** 三键（与根级 gate 字段一致）。

**验收**：`jq -e '.artifact_version == "v1" and .artifact_type == "probe" and .epic_task_id == "Epic-D-D09" and (.probe_exit_code | type) == "number" and (.clean | type) == "boolean" and .gate_workflow_checks_total_expected == 106 and .gate_workflow_rule_id == "indexer-reconcile-gate"'`。**结构示例**：[Epic-D-ops-artifact.v1.example-d09-probe.json](./Epic-D-ops-artifact.v1.example-d09-probe.json)。

**维护**：变更 **`indexer-reconcile-gate.yml`** **`checks_total`** 时**须**同批更新 **`indexer-reconcile-probe.sh`** 内 **`INDEXER_RECONCILE_GATE_CHECKS_TOTAL`** 与 **110 B-120** 互证段。

---

## D-10 — Evidence bundle 与 **GO** manifest 挂钩

**目标**：**`write-indexer-evidence.sh` / `internal-indexer-ops.sh evidence|evidence-bundle`** 在 **`INDEXER_EVIDENCE_WRITE_MANIFEST=1`** 或 **`INDEXER_EVIDENCE_BUNDLE_ZIP=1`** 时收口：**`manifest.json`**（与 **`indexer_public_snapshot_manifest.json`** 同形）、**`manifest.sha256`**（**`sha256sum -c`**）、**`epic_d_go_bundle_closure.json`**（**`traveltrust.ops_artifact.v1`** · **`artifact_type:bundle`** · **`Epic-D-D10`** · 根级 **`bundle_closure`**：**`epic`**、**`closure_status`**（**`INDEXER_EVIDENCE_CLOSURE_STATUS`**，默认 **`GO`**）、**`artifact_version`**、**`included_tasks`** 据目录推断）；**只读**打包，**不**落业务库、**不**触发修复。

**Runbook 命令**：

```bash
INTERNAL_API_SECRET='…' INDEXER_EVIDENCE_BUNDLE_ZIP=1 \
  EVIDENCE_GO_DIR=evidence/GO_$(date -u +%Y%m%d) bash scripts/write-indexer-evidence.sh
# 或（等价 bundle 路径）
INTERNAL_API_SECRET='…' INDEXER_EVIDENCE_BUNDLE_ZIP=1 \
  bash scripts/internal-indexer-ops.sh evidence-bundle
# 无密钥时仍写快照 + manifest，但 **artifacts/epic_d_d0*.json** 省略（**`artifact_types_detected`** 可能仅 **snapshot_public**）；正式 D-10 收口建议带密钥。**`INDEXER_EVIDENCE_EPIC_D_ENVELOPES=0`** 可关闭 D-03～05 附档拉取。
```

**落盘**：**`artifacts/`** 下 **D-03/D-04/D-05** 由 **`internal-indexer-ops.sh`** **`status --ops-artifact`** / **`status --live-reconcile --ops-artifact`** / **`reconcile --ops-artifact`** 生成（与 **D-02** **`indexer_public_snapshot_*.json`** 合包）；**`zip`** 含 **`manifest.json`**、**`manifest.sha256`**、**`epic_d_go_bundle_closure.json`**、快照与 **`artifacts/*.json`**。

**落盘 `epic_d_go_bundle_closure.json`**：根级 **`bundle_closure.included_tasks`** 由 **`snapshot_public`**（D-02）、**`artifacts/epic_d_d03|d04|d05_*.json`**（D-03～05）及 **`artifacts/*.json`** 内 **`artifact_type`**（**`dry_run_*`** → D-06～08、**`probe`** → D-09）汇总，且**始终**含 **D-10**，供 bundle 完整性 / 历史 diff / release gate。**`payload` 须含**：**`manifest`**（对象，与 **`manifest.json`** 一致）、**`manifest_sha256_file`**、**`artifact_types_detected`**（数组）、**`artifacts_min_epic_d_hint`**（机读映射表）。

**验收**：**`sha256sum -c manifest.sha256`**；**`jq`** 在目录或 zip 内可解析 **≥2** 个 **`artifact_type`**（**D-02～D-05** 范围，典型 **snapshot_public + indexer_status + reconcile**）。**结构示例**：[Epic-D-ops-artifact.v1.example-d10-go-bundle/](./Epic-D-ops-artifact.v1.example-d10-go-bundle/README.md)。

---

## 连续执行顺序（Epic D 内）

**D-01 → D-02 → D-03 → D-04 → D-05 → D-06 → D-07 → D-08 → D-09 → D-10**

**说明**：**D-07 / D-08** 依赖环境开关；若未启用，**仍须**产出结构化 **JSON** 说明「未调用 / 未启用」**`reason_code`**，**禁止**跳过归档用纯日志替代。

---

## 前端 / 类型门禁

与本 Epic **正交**；合入前后端时保持 **`cd frontend && npx tsc --noEmit`** 绿（**母表 B-125**）。

---

## 维护

- **增删 internal 锚点或 `checks_total`**：同步 **B-120**、**110**、**`indexer-reconcile-gate.yml`**，**不在本 Epic 下改 B-115/B-116/P5**。
- **bump `artifact_schema_version`**：仅当 **`traveltrust.ops_artifact.v1`** 顶域语义变更。
