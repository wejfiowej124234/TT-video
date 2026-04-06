# 260-阶段 定时任务系统（Scheduler）

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **与 250 边界（调度 vs 队列）** | **§一** → **1.1** |
| **定时任务清单与状态机映射** | **§二**、**§2.1** |
| **时间语义权威** | **03**、**04**（**§二** 任务锚点） |
| **对账/AI 串联** | **200**、**170**（**§二**） |

## 一、文档定位

本文定义 TravelTrust 在 260 阶段的“定时任务系统（Scheduler）”开发规范。

260 阶段将所有时间驱动任务从业务代码中拆出，纳入统一调度、执行、监控与告警体系。

### 1.1 与 250 阶段边界（防止重复建设）

`260` 仅负责时间语义与调度运行面，`250` 负责队列执行面：

| 能力域 | 260（Scheduler）负责 | 250（Job / Queue）负责 |
|---|---|---|
| 定时计划 | `cron_jobs` 定义、启停、时区、触发窗口 | 不负责 |
| 运行与防重 | `job_runs/job_errors/job_locks`、单实例锁、补跑 | 不负责 |
| 异步执行 | 仅将触发任务投递到队列 | queue、worker、retry、DLQ、replay |
| 后台操作面 | Scheduler 中心（计划/运行/锁） | 异步任务中心（任务/重试/死信） |

冲突处理：`260` 与 `250` 文本冲突时，以本边界表 + `04 §3.4` + `14` 路由状态列为准。

## 二、必须覆盖的业务任务

旅游项目必有以下定时任务：

- 超时未确认处理
- 未付款自动取消
- 行程结束自动结算
- 争议超时处理
- 评分超时处理
- AI 缓存清理
- token 统计任务
- 对账批次任务

任务锚点（防抽象漂移）：

- 订单超时/取消/评分/争议时间语义：`03`、`04`。
- 对账批次任务：`200`。
- AI 运行治理与配额联动：`170`。

### 2.1 任务-状态机副作用映射（对齐 `01/03/04`）

Scheduler 只负责“何时触发”，不直接改资金终态；状态迁移与资金口径以 `01/03/04` 为准。

| 调度任务 | 触发条件（时间语义） | 允许触发前状态 | 状态枚举来源 | 触发后动作 | 幂等键建议 | 失败补偿 |
|---|---|---|---|---|---|---|
| 接单超时取消 | Created 超过接单窗口 | `Created` | `04 §二 2.2 orders.status`（对齐 `01` 状态机） | 发起取消流程并释放占档 | `job_code + order_id + window_start` | 重跑前先校验订单状态仍为 `Created` |
| 支付超时取消 | Accepted 超过支付窗口 | `Accepted` | `04 §二 2.2 orders.status`（对齐 `01` 状态机） | 发起取消流程并释放占档 | `job_code + order_id + payment_deadline` | 若状态已变更为 Escrowed 则跳过并记审计 |
| 行程结束后自动结算检查 | 服务结束后到达结算窗口 | `Escrowed` 或结算待确认子状态 | `04 §二 2.2 orders.status` + 结算子状态字段（如 `orders.sub_status` 或等效字段），枚举值以 `200` 定稿为准 | 触发结算确认流程（不绕过链事件） | `job_code + order_id + settlement_window` | 失败进入错误归档并按 Runbook 补跑 |
| 争议超时处理 | dispute 达到窗口上限 | `Disputed` | `04 §二 2.2 orders.status` + 争议流（对齐 `03`） | 触发争议超时处置流程 | `job_code + dispute_id + deadline` | 仅在争议仍未关闭时允许补跑 |
| 评分超时处理 | 完成后评分窗口到期 | `Completed`（评分待确认） | `04` 评分相关 API + `03` 评分窗口规则 | 触发评分超时默认动作 | `job_code + order_id + rating_window` | 若双方已确认评分则幂等跳过 |

约束：若任务触发时发现状态已不满足“允许触发前状态”，必须 `skip + 审计留痕`，不得强制改写状态。

## 三、系统目标

1. 定时触发可控：任务按计划稳定触发。
2. 执行可观测：知道哪个任务失败、执行多久、是否卡住。
3. 并发可防重：同一任务同一窗口不重复执行。
4. 失败可恢复：失败重试、错误归档、人工补跑。

## 四、数据模型（必须具备）

必须具备以下实体：

- `cron_jobs`
- `job_runs`
- `job_errors`
- `job_locks`

字段级要求：

- `cron_jobs`：`job_code`、`cron_expr`、`enabled`、`timezone`、`owner`。
- `job_runs`：`run_id`、`job_code`、`started_at`、`ended_at`、`duration_ms`、`status`。
- `job_errors`：`run_id`、`error_code`、`error_message`、`stack_digest`、`recorded_at`。
- `job_locks`：`job_code`、`lock_key`、`locked_at`、`expires_at`、`holder`。

字段口径说明：`job_code` 为 Scheduler 主业务键；若管理后台展示 `schedule_id`，仅作为展示别名，不替代 `job_code`。

### 4.1 落地状态标签（2026-03-08）

| 实体 | 状态 | 证据口径 |
|---|---|---|
| `cron_jobs` | Target（未落库） | 进入实现阶段后需补 `crates/api/migrations/` 建表与索引证据 |
| `job_runs`（概念模型） | **部分替代**：**`scheduler_job_runs`** 已落库（Admin 只读/补跑登记基线） | **`20260328000025_admin_jobs_scheduler_config_releases.sql`**；与 **`250`** 边界表一致；完整 **`cron_jobs`/`job_locks`** 仍为 **Target** |
| `job_errors` | Target（未落库） | 可与运行记录或观测链路合并演进 |
| `job_locks` | Target（未落库） | 分布式锁表待补 |

## 五、核心执行约束（必须写死）

1. 单实例锁：同一作业同一周期只允许一个执行实例。
2. 超时保护：任务超过阈值自动标记并告警。
3. 失败重试：调度层仅处理 missfire/re-run；队列消费重试归 `250`。
4. 依赖顺序：涉及资金与状态的任务必须定义前后依赖。
5. 时区一致：所有调度统一时区策略，避免跨区误触发。

### 5.1 重试边界声明（260 vs 250）

- `260` 重试：计划触发失败、执行超时、补跑失败（scheduler 控制面）。
- `250` 重试：worker 消费失败、DLQ、回放（queue 执行面）。
- 任何“消费级失败”不得在 `260` 文档中标注为 scheduler 已处理完成。

## 六、API 与后台模块要求

### 6.1 概念 API 与权威路由映射（对齐 `04 §3.4`、`14`）

| 概念 API | 当前路由锚点（已登记） | 落地状态（必须显式） |
|---|---|---|
| Scheduler Job API | `GET /api/v1/admin/scheduler/jobs` | Implemented（基线）；**`meta.build`** 同 **`GET /meta.build`**；证据 **`crates/api/src/routes/admin.rs`** |
| Scheduler 手动补跑 API | `POST /api/v1/admin/scheduler/jobs/:job_code/rerun` | Implemented（基线）；**`200`** 含 **`meta.build`**；证据同左、**`04 §3.5`**、**`14`** |

口径说明：本节用于能力审计与对齐；Admin 路由实现状态以 **`04 §3.5`** 状态列为准。

### 6.2 后台模块

后台新增一级模块：`Scheduler 中心`

子模块（必须）：

- 任务定义列表
- 运行记录
- 错误记录
- 锁状态
- 手动触发/补跑
- 告警与SLA

后台必须直接可见：

- 哪个 job 失败。
- 执行多久。
- 是否卡住。

后台审计字段最小集：`job_code`、`run_id`、`lock_key`、`retry_ticket`、`operator`。

## 七、权限模型（最小角色）

建议最小角色：

- `SCHED_VIEWER`
- `SCHED_OPERATOR`
- `SCHED_RETRY_MANAGER`
- `SCHED_AUDITOR`

权限约束：

- 手动补跑和批量重试需审批。
- 资金相关 job 的手动触发必须双人复核。

## 八、实施计划（260 阶段）

### 8.1 P0（必须）

- 完成四张核心表落地。
- 完成调度执行引擎与分布式锁。
- 完成失败重试与错误归档。
- 完成后台可视化与告警。

### 8.2 P1（增强）

- 任务依赖编排与 DAG 执行。
- 自动补偿与智能重试策略。
- SLA 预测与容量规划。

### 8.3 P2（规模化）

- 多区域调度协调。
- 高可用主备调度。
- 调度策略自优化。

## 九、发布门禁（必须全过）

1. 关键定时任务全部接入统一调度。
2. 失败、卡住、超时可实时发现。
3. 锁机制防重演练通过。
4. 资金与结算类 job 的补跑审计完整。

### 9.1 门禁执行锚点（运维）

- Runbook 处置锚点：`ops/RUNBOOK.md` §14（250/260 联动处置）。
- 调度漏触发与重复触发：Runbook §14.2。
- 补跑审批与证据登记：Runbook §14.3。

Scheduler 证据命名模板（建议固定）：

- `evidence/GO_YYYYMMDD/scheduler_runs_*.json`
- `evidence/GO_YYYYMMDD/scheduler_missfire_*.json`
- `evidence/GO_YYYYMMDD/scheduler_lockcheck_*.json`
- `evidence/GO_YYYYMMDD/scheduler_rerun_approval_*.json`

### 9.2 `Target` -> `Implemented` 升级条件矩阵

| 能力项 | 从 `Target` 升级到 `Implemented` 的最小条件 | 必要证据 |
|---|---|---|
| Scheduler Job API | `/api/v1/admin/scheduler/jobs` 路由与 handler 实现，可返回计划/运行/锁状态 | `crates/api/src/routes/admin.rs` + 集成测试或 e2e |
| 调度防重锁 | 单窗口单实例执行演练通过，重复触发被拒绝或合并 | 锁演练记录 + 运行日志 |
| 漏触发补跑能力 | missfire 可识别并可审批补跑 | Runbook 处置记录 + evidence |
| 调度错误归档 | 失败执行写入 `job_errors` 或等效审计域，支持检索 | 数据落库证据或审计快照 |

升级规则：若缺任一“最小条件 + 必要证据”，状态保持 `Target`，不得在 `04/14/70` 标记为已实现。

## 十、结论

Scheduler 是业务时间语义的执行中枢。没有 260 阶段，超时、取消、结算、对账类流程将长期依赖人工兜底并且不可控。

## 文档同步门禁（与权威层级对齐）

- 冲突优先级：与 `01/03` 冲突时以 `01/03` 为准。
- API/契约变更：新增、删除、改名接口或状态口径变更，必须同步 `04 §3.4` 与 `14`。
- 数据模型/运维门禁口径变更：必须同步 `70` 与 Runbook。
- 文档串联变更：必须同步 **[07-开发流程与顺序](07-开发流程与顺序.md)（§零～§五正文）**、[00-文档索引](00-文档索引.md)；[00-文档体系与阅读串联](00-文档体系与阅读串联.md) 为兼容壳（涉及 CI 关键词如 `82` 时须核对）。

---

文档版本：1.0.3
最后更新：2026-03-08
适用阶段：260-阶段开发（定时任务系统 Scheduler）

> 实现状态标签：`Target`（阶段规划文档）
> 证据口径：与代码不一致时，以代码事实为准；进入上线验收前需补 `Implemented` 证据条目。
> Implemented 证据回填路径：`docs/spec/15-多维度文档与技术检查报告.md` 附录〇 + `evidence/GO_YYYYMMDD/`。

