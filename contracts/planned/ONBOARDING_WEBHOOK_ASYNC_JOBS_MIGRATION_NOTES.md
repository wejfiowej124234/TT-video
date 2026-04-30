# Onboarding webhook 队列 → `async_jobs` 统一面（工程笔记 · 未实现）

**Status:** **Target / Partial** — 与 **[250-阶段 Job/Queue](../../docs&#47;spec/250-阶段Job-Queue-异步任务系统.md)** **§二 / §3.1**、**[96-18-未完成 · §0～§2 / P2 · 96-09](../../docs&#47;spec/96-18-未完成清单与多维检查.md#9618-one-page-priority)** **v1.0.118+** 对读。当前 **`onboarding_webhook_jobs` / `onboarding_webhook_dlq`** 仍为 **域侧旁路**（**[TT-9618 §3.6](../../docs/runbook/TT-9618-onboarding-local-testnet.md)**）；**阶段 1（可选）**：**`ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR=1`** 时 **`insert_onboarding_webhook_job`**、**`requeue_onboarding_webhook_dlq_to_pending_jobs`**（**每行** **`RETURNING id`** **后** **`mirror_*`**）**best-effort** 镜像 **`async_jobs`**；**`requeue_stale_onboarding_webhook_jobs_processing`** **后** **`async_jobs`** **与** **域表** **`pending` + `stale_processing_requeued`** **对拍**；**`claim_next_pending_onboarding_webhook_job`** **+** **`apply_onboarding_webhook_job_payload`** **路径** **`pending`→`running`→`completed`**（**PG·IT**：**`matrix_93_d_onb_008b_f036_*`**、**`009_*`**、**`010_*`** / **`012_*`** **在** **`MIRROR=1`** **下** **断言**）。**阶段 2（可选闸 · Partial）**：**`ONBOARDING_WEBHOOK_ASYNC_JOBS_PRIMARY_CLAIM=1`**（**须** **`MIRROR=1`**）时 **独立** **`traveltrust-api onboarding-webhook-worker`** **用** **`claim_next_pending_onboarding_webhook_job_from_async_jobs`**（**`async_jobs`** **`SKIP LOCKED`** **主选队**；**PG·IT** **`matrix_93_d_onb_009b_*`**）；**`apply_*`/`mark_*`** **仍** **以** **域表** **为** **载荷** **SSOT**。**本文件不宣称** **阶段 2** **全闭** **或** **阶段 3** **已迁移**。

**迁移前现状（①② 证据，仍走域表）：** **`bash scripts/gates/tt-9618-onboarding-pg-evidence.sh`**（**[TT-9618 §3.5.3](../../docs/runbook/TT-9618-onboarding-local-testnet.md#tt-9618-pg-evidence-one-shot)**）首段 **`cargo test … matrix_93_admin_onb`** **已含** **`031_*`** **`GET …/admin/jobs?queue_name=onboarding_webhook`** **`async_jobs`** **镜像** **对拍**；其后串 **`matrix_93_d_onb_008b`**、**`009`–`012`** 等；与 **`async_jobs`** 合流后须重选 worker 消费面并保留本笔记 **§迁移前须拍板的决策** 审计边界。

## 为何迁（目标）

- **单一控制面**：Admin **`GET /api/v1/admin/jobs`**、重试/DLQ 政策、审计与 **120** 告警命名与 **`async_jobs`** 家族对齐。
- **运维心智**：值班一套 playbook，而非「通用 jobs + onboarding 专用表」双轨。

## 迁移前须拍板的决策

1. **Job 模型**：`job_type` 字符串（例：`onboarding_webhook_apply`）与 **`payload_ref`** 是否仅存 **`onboarding_webhook_dlq.id`** / **`jobs.id`** 或内嵌 **`raw_body` 哈希**。
2. **幂等**：保留 **`onboarding_payment_events`** / **`entitlements`** 为 SSOT；**`async_jobs`** 仅承载 **投递与重试**，**不**重复定义支付真值。
3. **Worker**：`onboarding-webhook-worker` 改为消费 **`async_jobs`**，或与通用 worker **合并进程**（**NATS / outbox** 若上线路径见 **250**）。
4. **指标**：**`traveltrust_onboarding_webhook_*`** 与 **`async_jobs_*`** 并存窗口期的 **Grafana** 双面板，避免静默丢 SLI。

## 建议里程碑（另闸 PR）

| 阶段 | 内容 |
|------|------|
| **0** | 本笔记 + **250** 表行评审签字（产品/架构） |
| **1** | 双写（**Partial**）：入队仍写 **`onboarding_webhook_jobs`**，**`ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR=1`** 时 **`insert_onboarding_webhook_job`**、**`requeue_onboarding_webhook_dlq_to_pending_jobs`**（**`RETURNING id`** **后** **逐行** **`mirror_*`**）镜像 **`async_jobs`** **`pending`**；**`claim_next_*` / `run_onboarding_webhook_job_worker`** 置域表 **`processing`** 时镜像 **`running`**；**`mark_*` 终态** 时镜像 **`completed`/`failed`**；**`requeue_stale_onboarding_webhook_jobs_processing`** **后** **`async_jobs`** **`pending` + `last_error`** **与** **域表** **对拍** |
| **2** | Worker 读 **`async_jobs`** 为主，旧表只读排障。**Partial（闸）**：**`ONBOARDING_WEBHOOK_ASYNC_JOBS_PRIMARY_CLAIM=1`** **+** **`claim_next_pending_onboarding_webhook_job_from_async_jobs`** **+** **`matrix_93_d_onb_009b_*`**（**认领** **以** **`async_jobs`** **`SKIP LOCKED`** **为先**；**`apply_*`/`mark_*`** **仍** **以** **域表** **为** **载荷** **SSOT**；**`MIRROR=1`** **时** **`mark_*`** **终态** **同步** **`async_jobs`** **`completed`/`failed`**）。**仍** **Target**：唯一消费面、域表只读排障与指标统一 |
| **3** | 删 **`onboarding_webhook_*`** 热路径（保留历史表或归档） |

**相关代码锚点**：`crates/api/migrations/*onboarding_webhook*`、`onboarding_webhook_worker_cli.rs`、**`db::onboarding`** **`claim_next_pending_onboarding_webhook_job_from_async_jobs`**、**`db::async_jobs_status_counts`/`list_async_jobs`**（**`GET /api/v1/admin/jobs`**，**可选** **`queue_name`** **精确匹配** **单列队** **如** **`onboarding_webhook`**）、**`matrix_93_admin_onb_031_*`**、**`matrix_93_d_onb_009b_*`**。
