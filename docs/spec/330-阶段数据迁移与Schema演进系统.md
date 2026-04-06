# 330-阶段 数据迁移 / Schema 演进系统

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **演进压力与目标** | **§二**、**§三** |
| **Expand-Contract / 双写** | **§五**（**5.1**、**5.2**） |
| **能力判定口径** | 篇首 **阅读口径**；正文 **11.3 当前达成度快照** |
| **DDL/表域 SSOT** | **[04](04-后端与API.md)**、**[35-完整DDL](35-完整DDL架构与索引策略.md)**（若与实现对照） |
| **串联** | **[140](140-阶段开发云部署与交付架构.md)**、**[07 §五](07-开发流程与顺序.md)** |

## 一、文档定位

本文定义 TravelTrust 在 330 阶段的“生产可回滚数据迁移与 Schema 演进系统”开发规范。

330 阶段关注的是可回滚、可审计、可灰度的生产迁移策略，不是单一 migration 工具用法。

阅读口径：本文件是阶段规范文档，能力实现判定以 `11.3 当前达成度快照` 为主，不以文末单一标签替代能力级判定。

## 二、演进压力来源

后续必然出现：

- 表结构变更
- 字段拆分
- 状态机重构
- 新订单模型
- 新合约字段

若无演进体系，将导致生产库变更高风险、业务中断和数据不一致。

## 三、系统目标

1. 变更可计划：Schema 演进具备版本路线图。
2. 变更可回滚：失败场景可安全回退。
3. 变更可验证：迁移前后数据一致性可验证。
4. 变更可灰度：支持双写、读切换、分批切流。
5. 变更可审计：每次迁移都有审批、记录、结果。

## 四、必备能力（必须具备）

- `schema version`
- `migration history`
- `rollback`
- `data backfill`
- `双写 / 读切换`

## 五、迁移策略框架

### 5.1 Expand-Contract

- 先扩展（加字段/加表/兼容读写）。
- 再切换（双写、灰度读新）。
- 后收缩（移除旧字段/旧表）。

### 5.2 双写与一致性验证

- 新旧模型双写。
- 一致性校验任务持续对比。
- 不一致告警与修复工单。

### 5.3 读切换策略

- 按租户/区域/流量比例切读。
- 可一键回切旧读路径。

### 5.4 回滚策略

- 结构回滚与数据回滚分离。
- 失败阈值触发自动回滚。

## 六、数据模型建议

建议最小实体：

- `schema_versions`
- `migration_histories`
- `migration_rollbacks`
- `backfill_jobs`
- `dual_write_checks`

字段级要求：

- `schema_versions`：`version_no`、`status`、`released_at`。
- `migration_histories`：`migration_id`、`from_version`、`to_version`、`executed_by`、`result`。
- `migration_rollbacks`：`rollback_id`、`target_version`、`trigger_reason`、`result`。
- `backfill_jobs`：`job_id`、`scope`、`progress`、`error_count`。
- `dual_write_checks`：`check_id`、`old_digest`、`new_digest`、`diff_count`。

## 七、概念 API 与权威路由映射

| 概念 API | 当前路由锚点（已登记） | 落地状态（必须显式） | 状态来源（权威） |
|---|---|---|---|
| Schema Migration Overview API | `GET /api/v1/admin/schema/migrations` | Implemented-Minimal（最小只读；**`meta.build`** 与 **`GET /meta.build`** 同源） | **`04 §3.5`** + **`14`** |
| Migration Rollback Ledger API | `GET /api/v1/admin/schema/migrations`（同路由子能力） | Implemented-Minimal（**`items.migration_rollbacks`** 可查；业务流程自动化仍 **Target**） | **`04 §3.5`** + **`14`** |
| Backfill Job Runtime API | `GET /api/v1/admin/schema/migrations`（同路由子能力） | Implemented-Minimal（**`items.backfill_jobs`** 可查；运行时作业链仍 **Target**） | **`04 §3.5`** + **`14`** |
| Dual Write Verification API | `GET /api/v1/admin/schema/migrations`（同路由子能力） | Implemented-Minimal（**`items.dual_write_checks`** 可查；持续校验闭环仍 **Target**） | **`04 §3.5`** + **`14`** |

口径说明：实现状态与契约状态以 **`04 §3.5`** 与 **`14`** 为准；本节仅做 330 能力映射与门禁锚点。

补充说明：**`GET /api/v1/admin/schema/migrations`** 在 **`04 §3.5`** 为 **Implemented（最小只读）**；聚合路由与子表投影为 **Implemented-Minimal**，编排/自动写入/演练平台能力仍按 **Target → Implemented** 规则推进。

## 八、核心硬约束

1. No Direct Breaking Change：禁止直接破坏性变更上线。
2. Migration With Gate：迁移必须有门禁与审批。
3. Rollback Ready：每次迁移必须预置回滚脚本与演练。
4. Backfill Observable：回填进度、失败率、耗时必须可观测。
5. Dual Write Verified：双写阶段必须通过一致性检查。

## 九、后台模块要求

后台新增一级模块：`Schema 演进中心`

子模块（必须）：

- 版本总览
- 迁移历史
- 回滚中心
- 回填任务
- 双写校验
- 迁移审计

## 十、实施计划（330 阶段）

口径说明：本章是目标态计划，不代表当前已实现状态；发布与验收判定以 `11.2/11.3/11.4/11.5` 为准。

### 10.1 P0（必须）

- 建立 schema 版本与迁移历史台账。
- 建立回滚与回填作业框架。
- 建立双写与读切换能力。

### 10.2 P1（增强）

- 自动化迁移风险评估。
- 分区/分租户渐进迁移编排。

### 10.3 P2（规模化）

- 零停机迁移平台化。
- 跨区域迁移一致性治理。

## 十一、发布门禁

1. 迁移方案含回滚与验证步骤。
2. 双写一致性检查通过。
3. 回填任务可追踪可中断可恢复。
4. 生产迁移演练结果可审计。

### 11.1 门禁执行锚点（运维/后台）

- 迁移执行锚点：`crates/api/src/startup/mod.rs`（启动时迁移执行路径）。
- 迁移文件锚点：`crates/api/migrations/`。
- 迁移中心契约锚点：`GET /api/v1/admin/schema/migrations`（当前 **Implemented（最小只读）**；**`meta.build`** 与 **`GET /meta.build`** 同源，便于与部署版本对账）。
- 管理审计锚点：`GET /api/v1/admin/audit/operations`。
- 证据归档路径：`evidence/GO_YYYYMMDD/`。

门禁阈值与回切触发（最小执行口径）：

- 回滚触发阈值：满足任一条件即触发回滚流程：
	- 迁移校验失败（DDL 执行失败或启动迁移失败）。
	- 关键写路径 `5xx` 比例在连续 `5` 分钟窗口内 `>= 1.0%`。
	- 双写校验 `diff_count > 0` 且连续 `3` 轮校验未收敛。
	- 回填任务 `error_count / processed_count >= 0.5%` 且持续 `10` 分钟。
- 回滚执行要求：必须记录触发原因、触发人/审批人、回滚开始/结束时间、影响范围。
- 回切判定：回滚后验证失败则禁止继续切流；回滚后验证通过方可恢复旧读路径。
- 审计留痕：阈值触发、回滚动作、回切结果三段证据必须完整归档。

阈值主源与参数同步：

- 运行阈值主源以 `08-3` 与 Runbook 参数口径为准；本节阈值为 330 阶段最小门禁默认值。
- 当阈值参数在 `08-3` 或 Runbook 变更时，本节需同次更新并补差异说明。

临时验收替代证据（Schema 中心能力仍为 `Target` 时）：

- 迁移台账证据：当次迁移文件清单、执行时间、执行人。
- 回滚演练证据：回滚脚本、回滚结果与恢复时间。
- 回填演练证据：回填作业进度、错误率、耗时快照。
- 双写校验证据：旧/新模型摘要比对结果与差异说明。

说明：替代证据仅用于阶段性核验，不得替代 `330` 目标能力落地后的长期门禁能力。

临时证据记录模板（建议最小字段）：

```json
{
	"capability": "Migration Rollback Ledger API",
	"status": "Target",
	"authority_source": ["04 §3.5", "14"],
	"migration_batch": "20260308_M2",
	"evidence_paths": [
		"evidence/GO_YYYYMMDD/schema/migration-history.json",
		"evidence/GO_YYYYMMDD/schema/rollback-drill.json",
		"evidence/GO_YYYYMMDD/schema/backfill-drill.json"
	],
	"verified_at": "2026-03-08",
	"verified_by": "admin_backend_oncall"
}
```

### 11.2 `Target` -> `Implemented` 升级条件矩阵

| 能力项 | 从 `Target` 升级到 `Implemented` 的最小条件 | 必要证据 |
|---|---|---|
| Schema Migration Overview API | 在 **`04 §3.5`** 与 **`14`** 完成登记并落地最小实现 | 路由实现证据 + 请求/响应样例（含 **`meta.build`**） |
| Migration Rollback Ledger | `migration_rollbacks` 结构落库并可检索导出 | 表结构证据 + 查询样例 + 审计样例 |
| Backfill Job Runtime | `backfill_jobs` 可观测（进度/错误率/耗时） | 作业日志 + 报表样例 |
| Dual Write Verification | 双写校验可生成 `old/new digest` 与 `diff_count` | 校验日志 + 差异处理工单 |

升级规则：若缺任一“最小条件 + 必要证据”，状态保持 `Target`。

单路由多子能力规则：`GET /api/v1/admin/schema/migrations` 作为聚合路由可为 `Implemented-Minimal`，但其子能力（Rollback/Backfill/Dual Write）可独立保持 `Target`；路由状态不得外推为所有子能力均已实现。

### 11.3 当前达成度快照（发布前必核）

最近核验日期：2026-03-29

| 能力项 | 目标状态 | 当前状态（2026-03-29） | 状态来源参考 | 结论 |
|---|---|---|---|---|
| Schema Migration Overview API | Implemented | Implemented-Minimal（最小只读；**`meta`** 含 **`build`**） | **`04 §3.5`**、**`14`**、`crates/api/src/routes/admin.rs` | 已达最小可用 |
| schema_versions | Implemented | Implemented-Minimal（结构落库，治理流程待补） | `crates/api/migrations/20260308000020_schema_evolution_center.sql` | 已达最小可用 |
| migration_histories | Implemented | Implemented-Minimal（结构落库，自动写入待补） | `crates/api/migrations/20260308000020_schema_evolution_center.sql` | 已达最小可用 |
| migration_rollbacks | Implemented | Implemented-Minimal（结构落库 + 查询可见） | `crates/api/migrations/20260308000020_schema_evolution_center.sql`、`crates/api/src/routes/admin.rs` | 已达最小可用 |
| backfill_jobs | Implemented | Implemented-Minimal（结构落库 + 查询可见） | `crates/api/migrations/20260308000020_schema_evolution_center.sql`、`crates/api/src/routes/admin.rs` | 已达最小可用 |
| dual_write_checks | Implemented | Implemented-Minimal（结构落库 + 查询可见） | `crates/api/migrations/20260308000020_schema_evolution_center.sql`、`crates/api/src/routes/admin.rs` | 已达最小可用 |

### 11.4 Implemented 证据回填占位（验收必填）

| 能力项 | 代码/配置证据路径 | 审计/样例证据路径 |
|---|---|---|
| Schema Migration Overview API | `crates/api/src/routes/admin.rs`（实现 PR 回填） | `evidence/GO_YYYYMMDD/schema/api-overview/` |
| Migration Rollback Ledger | `crates/api/migrations/*` + `crates/api/src/db/**`（实现 PR 回填） | `evidence/GO_YYYYMMDD/schema/rollback-ledger/` |
| Backfill Job Runtime | `crates/api/src/**`（作业实现 PR 回填） | `evidence/GO_YYYYMMDD/schema/backfill-runtime/` |
| Dual Write Verification | `crates/api/src/**`（校验实现 PR 回填） | `evidence/GO_YYYYMMDD/schema/dual-write-checks/` |

### 11.5 快照与证据维护规则（避免状态漂移）

1. 任一能力项状态变更（`Target/Implemented-Minimal/Implemented`）时，必须同次更新：`11.3`、`11.4`、**`04 §3.4` / `04 §3.5`**、`14`。
2. `11.3` 的“最近核验日期”必须与最新证据时间一致，不得仅改状态不改日期。
3. `11.4` 中占位路径在进入发布候选前必须替换为真实证据路径。
4. 若证据缺失或不可复核，能力状态保持 `Target`，不得标记为 `Implemented`。
5. 版本同步门禁：本文件版本变更后，必须同步 `00-文档索引` 的 330 版本行。
6. 发布候选前必须验证 `11.4` 所列证据路径实际存在且可打开；缺任一路径视为门禁未通过。
7. 证据目录建议至少包含：样例请求响应、执行日志、审计快照、校验摘要（如 `manifest.json` 与 `manifest.sha256`）。

## 架构分层对齐（与 02 一致）

- 分层归位：`330` 属于平台治理与数据演进能力，承接 `02` 的 `0~8` 九层架构中的“数据与治理支撑层”能力，不改变 `01/03` 的业务硬约束优先级。
- 主链路关系：`330` 服务于订单、争议、索引与对账等主链路的数据结构演进，不单独定义业务终态。

## 链为准边界（与 01 一致）

- 迁移/回滚不得直接改写链上真相字段对应的终态口径。
- 资金终态仍以链上事件与投影重放结果为准；`330` 仅治理 schema 演进、回填、双写与读切换流程。
- 若迁移策略与“链为准”冲突，必须按 `01/03` 优先级回退策略并补审计证据。

## 十二、结论

Schema 演进系统是长期迭代的生命线。没有 330 阶段，生产库结构变更将成为高概率故障源。

## 文档同步门禁（与权威层级对齐）

- 冲突优先级：与 `01/03` 冲突时以 `01/03` 为准。
- API/契约变更：新增、删除、改名接口或状态口径变更，必须同步 **`04 §3.4` / `04 §3.5`** 与 **`14`**。
- 数据模型/运维门禁口径变更：必须同步 `70` 与 Runbook。
- 文档串联变更：必须同步 **[07-开发流程与顺序](07-开发流程与顺序.md)（§零～§五正文）**、[00-文档索引](00-文档索引.md)；[00-文档体系与阅读串联](00-文档体系与阅读串联.md) 为兼容壳（涉及 CI 关键词如 `82` 时须核对）。

---

文档版本：1.0.7
最后更新：2026-03-29
适用阶段：330-阶段开发（数据迁移 / Schema 演进系统）

> 实现状态标签：`Mixed`（阶段规范文档；能力状态并存 `Target` 与 `Implemented-Minimal`）
> 证据口径：与代码不一致时，以代码事实为准；进入上线验收前需补 `Implemented` 证据条目。

