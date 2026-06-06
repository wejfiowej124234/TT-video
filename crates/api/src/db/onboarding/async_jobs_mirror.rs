//! **`ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR`**：`async_jobs` 双写（**stderr-only** 失败不回滚域表）。

use sqlx::PgPool;
use std::env;
use uuid::Uuid;

pub(super) fn onboarding_webhook_async_jobs_mirror_enabled() -> bool {
    env::var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR")
        .map(|s| {
            let t = s.trim().to_ascii_lowercase();
            t == "1" || t == "true" || t == "yes"
        })
        .unwrap_or(false)
}

/// **250 / 迁移笔记阶段 1**：**`onboarding_webhook_jobs`** 入队后 **best-effort** 镜像 **`async_jobs`**（**Admin** 控制面；**不**替代 worker 消费面）。
pub(super) async fn mirror_onboarding_webhook_job_to_async_jobs(
    pool: &PgPool,
    onboarding_job_id: Uuid,
) -> Result<(), sqlx::Error> {
    let idem = format!("onboarding_webhook_job:{onboarding_job_id}");
    sqlx::query(
        r#"
        INSERT INTO async_jobs (
            queue_name, job_type, status, attempt_count, max_attempts,
            payload_ref, idempotency_key
        )
        VALUES (
            'onboarding_webhook', 'onboarding_webhook_apply', 'pending', 0, 8,
            $1, $2
        )
        "#,
    )
    .bind(onboarding_job_id.to_string())
    .bind(&idem)
    .execute(pool)
    .await?;
    Ok(())
}

pub(super) fn onboarding_webhook_async_jobs_mirror_idempotency_key(
    onboarding_job_id: Uuid,
) -> String {
    format!("onboarding_webhook_job:{onboarding_job_id}")
}

/// **`claim_next_pending_onboarding_webhook_job`** 后：镜像 **`pending` → `running`**（**`async_jobs.status`** CHECK 对齐）。
pub(super) async fn sync_async_jobs_mirror_onboarding_webhook_running(
    pool: &PgPool,
    onboarding_job_id: Uuid,
) -> Result<(), sqlx::Error> {
    let idem = onboarding_webhook_async_jobs_mirror_idempotency_key(onboarding_job_id);
    sqlx::query(
        r#"
        UPDATE async_jobs
        SET status = 'running', updated_at = now()
        WHERE queue_name = 'onboarding_webhook'
          AND job_type = 'onboarding_webhook_apply'
          AND idempotency_key = $1
        "#,
    )
    .bind(&idem)
    .execute(pool)
    .await?;
    Ok(())
}

/// **`mark_onboarding_webhook_job_*`** 后：镜像终态（**`done` → `completed`**，**`dead` → `failed`**）。
pub(super) async fn sync_async_jobs_mirror_onboarding_webhook_terminal(
    pool: &PgPool,
    onboarding_job_id: Uuid,
    async_status: &str,
    last_error: Option<&str>,
) -> Result<(), sqlx::Error> {
    let idem = onboarding_webhook_async_jobs_mirror_idempotency_key(onboarding_job_id);
    sqlx::query(
        r#"
        UPDATE async_jobs
        SET status = $1,
            last_error = $2,
            updated_at = now()
        WHERE queue_name = 'onboarding_webhook'
          AND job_type = 'onboarding_webhook_apply'
          AND idempotency_key = $3
        "#,
    )
    .bind(async_status)
    .bind(last_error)
    .bind(&idem)
    .execute(pool)
    .await?;
    Ok(())
}

/// **`requeue_stale_onboarding_webhook_jobs_processing`** 之后：域表 **`pending` + `stale_processing_requeued`** 的行，将 **`async_jobs`** 从 **`running`**（或 **`pending`**）拉回 **`pending`** 与同源 **`last_error`**。
pub(super) async fn sync_async_jobs_mirror_after_stale_requeue(
    pool: &PgPool,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE async_jobs aj
        SET status = 'pending',
            last_error = 'stale_processing_requeued',
            updated_at = now()
        FROM onboarding_webhook_jobs j
        WHERE j.id::text = aj.payload_ref
          AND aj.queue_name = 'onboarding_webhook'
          AND aj.job_type = 'onboarding_webhook_apply'
          AND j.status = 'pending'
          AND j.last_error = 'stale_processing_requeued'
        "#,
    )
    .execute(pool)
    .await?;
    Ok(())
}
