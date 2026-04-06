# 250-阶段 Job / Queue / 异步任务系统

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **与 260 边界（队列 vs 调度）** | **§一** → **1.1** |
| **须纳管异步任务清单** | **§二** |
| **系统目标与模型** | **§三** 起 |
| **冲突裁决** | **§一 1.1** 表末行（**04 §3.4**、**14**） |
| **观测串联** | **[120](120-阶段开发观测告警日志与审计链路.md)**（**§一**） |

## 一、文档定位

本文定义 TravelTrust 在 250 阶段的“Job / Queue / 异步任务系统”开发规范。

250 阶段将不可同步执行的任务统一收敛到队列与 worker 执行体系，避免 API 阻塞、重试丢失和状态错乱。

与现有体系关系：

- 文档主入口：`docs/spec/00-文档索引.md`
- 架构与事件处理：`docs/spec/02-架构设计.md`
- 后端 API 与执行器：`docs/spec/04-后端与API.md`
- 合约/API/ABI 对齐：`docs/spec/14-合约-API-ABI-前后端对齐.md`
- 索引与同步：`docs/spec/110-阶段开发链上索引器与事件同步器.md`
- 观测与审计：`docs/spec/120-阶段开发观测告警日志与审计链路.md`
- AI/财务/风控链路：`docs/spec/170-阶段开发AI行程系统运行管理治理层.md`、`docs/spec/200-阶段财务对账结算与报表.md`、`docs/spec/100-阶段开发风控与仲裁执行系统.md`

### 1.1 与 260 阶段边界（防止重复建设）

`250` 与 `260` 的边界按下表固定，避免同一能力在两份文档重复定义：

| 能力域 | 250（Job / Queue）负责 | 260（Scheduler）负责 |
|---|---|---|
| 任务投递与消费 | queue topic、producer、worker、retry、DLQ、replay | 不负责 |
| 定时触发与编排 | 仅消费由 scheduler 投递的任务 | cron 定义、触发窗口、运行记录、锁、防重 |
| 数据模型 | `async_jobs/job_attempts/job_dead_letters/job_audit_logs` | `cron_jobs/job_runs/job_errors/job_locks` |
| 后台操作面 | 任务中心（队列深度、重试、死信、回放） | Scheduler 中心（计划、运行、锁、补跑） |

冲突处理：若 `250` 与 `260` 文本冲突，以本边界表 + `04 §3.4` + `14` 的路由状态列为准。

## 二、异步任务范围（必须纳管）

至少纳管以下任务：

- AI 生成
- 邮件发送
- 通知发送
- 索引器处理
- 结算执行
- 对账任务
- 风控扫描
- 评分计算
- 报表生成

## 三、系统目标

250 阶段目标：

1. API 快速返回：耗时任务异步化。
2. 任务可恢复：失败可重试、可回放。
3. 任务可隔离：不同域任务互不拖垮。
4. 任务可观测：队列深度、失败率、耗时可监控。
5. 任务可审计：任务状态和执行轨迹可追溯。

### 3.1 Current 快照（Target / Current / 证据锚点）

| 领域 | Target（250 目标） | Current（当前现状） | 证据锚点 |
|---|---|---|---|
| 异步执行引擎 | 统一 queue + worker + retry + dead letter | 已有 outbox worker 最小基线（claim/retry/reschedule/dead letter） | `crates/api/src/startup/outbox.rs`、`crates/api/src/startup/mod.rs` |
| 延时投递接入能力 | 队列侧支持 delayed enqueue / reschedule（不负责 cron 编排） | 已有 `schedule_engine` 初始化与档期锁联动基线（仅作为队列触发接入） | `crates/api/src/startup/mod.rs`、`crates/api/src/chain_off/orders_flow/accept_cancel_pay_complete.rs`（档期锁与接单/支付/完成路径） |
| Admin 任务控制面 | `GET /api/v1/admin/jobs`、`GET /api/v1/admin/scheduler/jobs`、`POST …/scheduler/jobs/:job_code/rerun` 可查询/登记补跑（DB 基线） | **`Implemented（基线）`**：`async_jobs` / `scheduler_job_runs` 表 + `04 §3.5`；worker/NATS 全链路仍按本文 §三～§六 推进 | `crates/api/src/routes/admin.rs`、`04 §3.5` |
| 任务门禁与证据 | 250 专项 gate + build 主流水线并轨，fail-closed | 本文版本起要求执行 `job-queue-gate` 与 `build.job-queue` 双门禁 | `.github/workflows/job-queue-gate.yml`、`.github/workflows/build.yml` |
| 校验模式边界 | Target/Implemented 边界清晰 | 当前采用“Target 路由文档锚点校验 + Implemented 代码锚点校验” | `docs/spec/04-后端与API.md`、`docs/spec/14-合约-API-ABI-前后端对齐.md` |

状态说明：`Current` 描述仓库事实，不等同于 250 阶段已全面验收完成。

## 四、必备能力（必须写死）

1. `queue`
2. `worker`
3. `retry`
4. `dead letter`
5. `delayed dispatch`（延时投递，不含 cron 编排）

缺失后风险：

- API 卡死
- 重试丢失
- 状态错乱

## 五、架构建议与选型

当前默认选型（与 `09` 对齐）：

- NATS 或 Redis Streams（当前推荐）

可选扩展（非当前默认）：

- Kafka
- RabbitMQ
- Redis Lists（历史兼容写法）

口径说明：`09` 为技术栈定稿层，当前消息队列口径以 `NATS / Redis Streams` 为主，Kafka/RabbitMQ 为后续扩展候选。

选型原则：

- 至少一次投递 + 幂等消费。
- 支持延迟任务与重试退避。
- 支持死信队列与补偿处理。
- 支持多消费者组与优先级队列。

## 六、任务模型设计

建议最小实体：

- `async_jobs`
- `job_attempts`
- `job_dead_letters`
- `job_dispatch_windows`
- `job_audit_logs`

字段级要求：

- `async_jobs`：`job_id`、`job_type`、`payload_ref`、`status`、`priority`、`next_run_at`。
- `job_attempts`：`job_id`、`attempt_no`、`started_at`、`ended_at`、`error_code`。
- `job_dead_letters`：`job_id`、`failed_reason`、`moved_at`、`replay_status`。
- `job_dispatch_windows`：`window_id`、`job_id`、`dispatch_after`、`dispatched_at`。
- `job_audit_logs`：`actor_or_worker`、`action`、`job_id`、`occurred_at`。

### 6.1 落地状态标签（2026-03-08）

下表用于避免“文档模型 = 已落库”的误读：

| 实体 | 状态 | 证据口径 |
|---|---|---|
| `async_jobs` | Implemented（Admin 投影基线） | 建表见 **`crates/api/migrations/20260328000025_admin_jobs_scheduler_config_releases.sql`**（与 **`scheduler_job_runs`**、**`config_releases`** 同批）；**`job_attempts` / DLQ / 独立审计表**仍为后续增量 |
| `job_attempts` | Target（未落库） | 进入增强阶段后补迁移与 worker 轨迹 |
| `job_dead_letters` | Target（未落库） | 同上 |
| `job_dispatch_windows` | Target（未落库） | 仅保留队列侧延时投递引用；cron 主模型以 `260` 的 `cron_jobs/*` 为准 |
| `job_audit_logs` | Target（未落库） | 后续与 `70` 管理后台审计域联动 |

## 七、执行与一致性约束

- 幂等键：每类任务必须有 idempotency key。
- 重试策略：指数退避 + 最大重试次数。
- 死信策略：超过阈值必须入 DLQ，不得无限重试。
- 状态机约束：`queued -> running -> succeeded|failed|dead_lettered`。
- 补偿机制：关键任务失败需有补偿/人工介入流程。

## 八、API 与后台模块要求

### 8.1 概念 API 与权威路由映射（对齐 `04 §3.4`、`14`）

| 概念 API | 当前路由锚点（已登记） | 落地状态（必须显式） |
|---|---|---|
| Job Center API | `GET /api/v1/admin/jobs` | Implemented（基线）；**`meta.build`** 同 **`GET /meta.build`**；证据 **`admin.rs`**、**`04 §3.5`** |
| Scheduler Job API | `GET /api/v1/admin/scheduler/jobs` | Implemented（基线）；**`meta.build`** 同左；归属 **260** 控制面，路由实现在 **`admin.rs`** |
| Scheduler 手动补跑 API | `POST /api/v1/admin/scheduler/jobs/:job_code/rerun` | Implemented（基线）；**`200`** 含 **`meta.build`**；**super_admin**；证据 **`04 §3.5`**、**`14`** |
| Execution Outbox API | `POST /api/v1/internal/process-resolution-outbox` | Implemented-Minimal（最小可用执行入口） |

口径说明：本节用于能力分层与审计映射，表中 `Target/Implemented-Minimal` 仅表示能力落地进度，不等同于本阶段整体验收结论；Admin 路由状态以 **`04 §3.5`** 与实现证据为准。

### 8.2 后台模块

后台新增一级模块：`异步任务中心`

子模块（必须）：

- 队列总览
- 任务列表
- 重试与回放
- 死信队列
- 调度触发关联（只读）
- 执行日志与告警

## 九、权限模型（最小角色）

建议最小角色：

- `JOB_VIEWER`
- `JOB_OPERATOR`
- `JOB_REPLAY_MANAGER`
- `JOB_AUDITOR`

权限约束：

- 回放和批量重试需审批。
- 关键财务/结算任务回放必须双人复核。

## 十、实施计划（250 阶段）

### 10.1 P0（必须）

- 建立统一 queue + worker 框架。
- 完成 retry + dead letter + delayed-dispatch 三件套。
- 将 AI、通知、索引、结算、对账等关键任务迁移异步化。
- 打通告警、审计与人工补偿流程。

### 10.2 P1（增强）

- 队列优先级与资源隔离。
- 自动故障恢复与自愈重放。
- 任务 SLA 分层与容量预测。

### 10.3 P2（规模化）

- 跨区域任务编排与容灾。
- 多队列基础设施统一抽象。
- 历史任务分析与调优平台。

## 十一、发布门禁（分层：P0 必须全过）

### 11.1 P0（最小可发布门禁，必须全过）

1. 核心耗时任务已异步化。
2. retry / dead letter / replay 演练通过。
3. 幂等与状态机一致性测试通过。
4. 队列监控与告警生效。
5. 关键任务执行轨迹可审计可导出。
6. 250 专项 gate 与 build 并轨双门禁通过（fail-closed）。

### 11.2 门禁执行锚点（仓库现有入口）

| 门禁类别 | 执行入口 | 证据落点 |
|---|---|---|
| 250 专项门禁 | `.github/workflows/job-queue-gate.yml` | `evidence/GO_YYYYMMDD/job_queue_*.json` |
| build 并轨门禁 | `.github/workflows/build.yml` 的 `job-queue` job | `evidence/GO_YYYYMMDD/job_queue_*.json` |
| 运行态辅证 | `POST /api/v1/internal/process-resolution-outbox` | `evidence/GO_YYYYMMDD/` |

证据字段统一口径：`workflow/job/check/commit_sha/ci_run_id/env/rule_id/severity/owner/generated_at/passed`。

### 11.3 `Target` -> `Implemented` 升级条件矩阵

以下条件用于防止“仅文档登记即视为实现完成”：

| 能力项 | 从 `Target` 升级到 `Implemented` 的最小条件 | 必要证据 |
|---|---|---|
| Job Center API | `/api/v1/admin/jobs` 路由与 handler 实现，可返回任务列表与状态字段 | `crates/api/src/routes/admin.rs` + 集成测试或 e2e 结果 |
| Scheduler Job API（250 只做联动展示） | `/api/v1/admin/scheduler/jobs` 路由实现，且字段来源与 `260` 保持一致 | `crates/api/src/routes/admin.rs` + `260` 对齐记录 |
| 异步执行引擎 | worker 在非演示数据下完成 claim/retry/dead-letter 流程闭环 | `startup/outbox` 代码锚点 + 演练证据（`evidence/GO_YYYYMMDD/`） |
| 延时投递接入 | delayed-dispatch 在队列侧可观测（投递时间/实际触发时间可审计） | 运行日志 + 审计字段或快照证据 |

升级规则：若缺任一“最小条件 + 必要证据”，状态保持 `Target`，不得在 `04/14/70` 标记为已实现。

## 十二、结论

Job / Queue / 异步任务系统是全栈稳定性底座。没有 250 阶段，业务增长后 API 与状态一致性将不可控。

## 文档同步门禁（与权威层级对齐）

- 冲突优先级：与 `01/03` 冲突时以 `01/03` 为准。
- API/契约变更：新增、删除、改名接口或状态口径变更，必须同步 `04 §3.4` 与 `14`。
- 数据模型/运维门禁口径变更：必须同步 `70` 与 Runbook。
- 文档串联变更：必须同步 **[07-开发流程与顺序](07-开发流程与顺序.md)（§零～§五正文）**、[00-文档索引](00-文档索引.md)；[00-文档体系与阅读串联](00-文档体系与阅读串联.md) 为兼容壳（涉及 CI 关键词如 `82` 时须核对）。

---

文档版本：1.0.3
最后更新：2026-03-08
适用阶段：250-阶段开发（Job / Queue / 异步任务系统）

> 实现状态标签：`Target`（阶段规划文档）
> 证据口径：与代码不一致时，以代码事实为准；进入上线验收前需补 `Implemented` 证据条目。
> Implemented 证据回填路径：`docs/spec/15-多维度文档与技术检查报告.md` 附录〇 + `evidence/GO_YYYYMMDD/`。
