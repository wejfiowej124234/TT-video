//! **`onboarding_webhook_jobs`**：入队、终态、认领、stale 回灌（**96-09** / **250**）。

use serde_json::Value;
use sqlx::types::Json;
use sqlx::PgPool;
use uuid::Uuid;

use super::async_jobs_mirror::{
    mirror_onboarding_webhook_job_to_async_jobs, onboarding_webhook_async_jobs_mirror_enabled,
    sync_async_jobs_mirror_after_stale_requeue, sync_async_jobs_mirror_onboarding_webhook_running,
    sync_async_jobs_mirror_onboarding_webhook_terminal,
};
use super::types::WebhookApplyOutcome;
use super::webhook_dlq::insert_onboarding_webhook_dlq;

#[derive(Debug, sqlx::FromRow)]
struct ClaimedOnboardingWebhookJobRow {
    id: Uuid,
    payload: Json<Value>,
}

/// **96-09**：先入 **`onboarding_webhook_jobs`**（**`pending`**），再由内联或后台 worker **`apply_payment_webhook`**。
///
/// 可选 **`ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR=1`**：镜像一行到 **`async_jobs`**（见 **`contracts/planned/ONBOARDING_WEBHOOK_ASYNC_JOBS_MIGRATION_NOTES.md`**）；镜像失败仅 **stderr**，**不**回滚域队列表。
pub async fn insert_onboarding_webhook_job(
    pool: &PgPool,
    payload: &Value,
) -> Result<Uuid, sqlx::Error> {
    let id: Uuid = sqlx::query_scalar(
        r#"
        INSERT INTO onboarding_webhook_jobs (status, payload)
        VALUES ('pending', $1::jsonb)
        RETURNING id
        "#,
    )
    .bind(Json(payload.clone()))
    .fetch_one(pool)
    .await?;

    if onboarding_webhook_async_jobs_mirror_enabled() {
        if let Err(e) = mirror_onboarding_webhook_job_to_async_jobs(pool, id).await {
            eprintln!(
                "[onboarding_webhook] ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR async_jobs insert failed job_id={id}: {e}"
            );
        }
    }

    Ok(id)
}

async fn mark_onboarding_webhook_job_done(
    pool: &PgPool,
    job_id: Uuid,
    resolution: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE onboarding_webhook_jobs
        SET status = 'done', resolution = $2, last_error = NULL, updated_at = now()
        WHERE id = $1
        "#,
    )
    .bind(job_id)
    .bind(resolution)
    .execute(pool)
    .await?;
    if onboarding_webhook_async_jobs_mirror_enabled() {
        if let Err(e) =
            sync_async_jobs_mirror_onboarding_webhook_terminal(pool, job_id, "completed", None)
                .await
        {
            eprintln!(
                "[onboarding_webhook] ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR async_jobs terminal sync (completed) failed job_id={job_id}: {e}"
            );
        }
    }
;
    Ok(())
}

pub(crate) async fn mark_onboarding_webhook_job_dead(
    pool: &PgPool,
    job_id: Uuid,
    last_error: &str,
) -> Result<(), sqlx::Error> {
    let msg: String = last_error.chars().take(8000).collect();
    sqlx::query(
        r#"
        UPDATE onboarding_webhook_jobs
        SET status = 'dead', last_error = $2, updated_at = now()
        WHERE id = $1
        "#,
    )
    .bind(job_id)
    .bind(&msg)
    .execute(pool)
    .await?;
    if onboarding_webhook_async_jobs_mirror_enabled() {
        if let Err(e) =
            sync_async_jobs_mirror_onboarding_webhook_terminal(pool, job_id, "failed", Some(&msg))
                .await
        {
            eprintln!(
                "[onboarding_webhook] ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR async_jobs terminal sync (failed) failed job_id={job_id}: {e}"
            );
        }
    }
;
    Ok(())
}

/// 内联路径：**`apply`** 之后把 **`job`** 行收敛到 **`done`/`dead`**（与 **`onboarding_webhook_dlq`** 对齐 **`Err`**）。
pub(crate) async fn finalize_onboarding_webhook_job_after_apply(
    pool: &PgPool,
    job_id: Uuid,
    outcome: &Result<WebhookApplyOutcome, sqlx::Error>,
    idem_trim: &str,
    ev_trim: &str,
    outcome_str: &str,
    raw_body: &Value,
) -> Result<(), sqlx::Error> {
    match outcome {
        Ok(WebhookApplyOutcome::UnknownIdempotencyKey) => {
            mark_onboarding_webhook_job_done(pool, job_id, "unknown_idempotency_key").await
        }
        Ok(WebhookApplyOutcome::DuplicateEvent) => {
            mark_onboarding_webhook_job_done(pool, job_id, "duplicate").await
        }
        Ok(WebhookApplyOutcome::Accepted) => {
            mark_onboarding_webhook_job_done(pool, job_id, "accepted").await
        }
        Err(e) => {
            if let Err(e2) = insert_onboarding_webhook_dlq(
                pool,
                idem_trim,
                ev_trim,
                outcome_str,
                raw_body,
                &e.to_string(),
            )
            .await
            {
                eprintln!(
                    "[onboarding_webhook_job] job_id={} apply err={} dlq_persist_failed={}",
                    job_id, e, e2
                );
            }
            mark_onboarding_webhook_job_dead(pool, job_id, &e.to_string()).await
        }
    }
}

/// **96-09 · 独立进程**：原子认领最老一条 **`pending`**（**`FOR UPDATE SKIP LOCKED`**），并 **`pending` → `processing`**；与 **`run_onboarding_webhook_job_worker`** 首段语义一致，供 **`traveltrust-api onboarding-webhook-worker`** 与多副本 worker 安全并发。
///
/// 返回 **`None`** 表示当前无 **`pending`** 行。调用方须接着 **`apply_onboarding_webhook_job_payload`**（**勿**与 **`tokio::spawn(run_onboarding_webhook_job_worker)`** 并发抢同一队列，除非 **`ONBOARDING_WEBHOOK_QUEUE_EXTERNAL_ONLY=1`** 已关 API 内联 spawn — 见 Runbook **TT-9618**）。
pub async fn claim_next_pending_onboarding_webhook_job(
    pool: &PgPool,
) -> Result<Option<(Uuid, Value)>, sqlx::Error> {
    let row = sqlx::query_as::<_, ClaimedOnboardingWebhookJobRow>(
        r#"
        WITH picked AS (
            SELECT id
            FROM onboarding_webhook_jobs
            WHERE status = 'pending'
            ORDER BY created_at ASC
            FOR UPDATE SKIP LOCKED
            LIMIT 1
        )
        UPDATE onboarding_webhook_jobs AS j
        SET status = 'processing', updated_at = now(), attempts = attempts + 1
        FROM picked
        WHERE j.id = picked.id
        RETURNING j.id, j.payload
        "#,
    )
    .fetch_optional(pool)
    .await?;
    match &row {
        Some(r) if onboarding_webhook_async_jobs_mirror_enabled() => {
            if let Err(e) = sync_async_jobs_mirror_onboarding_webhook_running(pool, r.id).await {
                eprintln!(
                    "[onboarding_webhook] ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR async_jobs running sync failed job_id={}: {e}",
                    r.id
                );
            }
        }
        _ => {}
    }
;
    Ok(row.map(|r| (r.id, r.payload.0)))
}

/// **250 / 阶段 2（可选）**：以 **`async_jobs`** 为**首要**选队面认领 **`onboarding_webhook`** 镜像行，并在**同一 SQL 语句**内将对应 **`onboarding_webhook_jobs`** **`pending` → `processing`**、**`async_jobs`** **`pending` → `running`**（**`FOR UPDATE SKIP LOCKED`** 锁在 **`async_jobs`** 最老 **`pending`** 上）。
///
/// **须** **`ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR=1`** 且镜像行 **`payload_ref`** 为域 **`jobs.id`**（**UUID** 文本）。**运维**：与 **`claim_next_pending_onboarding_webhook_job`**（域表先行）**勿**并发抢同一队列（**`ONBOARDING_WEBHOOK_QUEUE_EXTERNAL_ONLY=1`** + **关** API **`tokio::spawn`**，或部署**仅**启 **`traveltrust-api onboarding-webhook-worker`** **+** **`ONBOARDING_WEBHOOK_ASYNC_JOBS_PRIMARY_CLAIM=1`**）。
///
/// 返回 **`None`**：无 **`async_jobs`** **`pending`** 镜像行，或域行**非** **`pending`**（镜像漂移时本句**不**改 **`async_jobs`**，锁随事务结束释放）。
pub async fn claim_next_pending_onboarding_webhook_job_from_async_jobs(
    pool: &PgPool,
) -> Result<Option<(Uuid, Value)>, sqlx::Error> {
    let row = sqlx::query_as::<_, ClaimedOnboardingWebhookJobRow>(
        r#"
        WITH picked AS (
            SELECT aj.id AS async_id, trim(aj.payload_ref)::uuid AS job_id
            FROM async_jobs aj
            WHERE aj.queue_name = 'onboarding_webhook'
              AND aj.job_type = 'onboarding_webhook_apply'
              AND aj.status = 'pending'
              AND trim(aj.payload_ref) ~ '^[0-9a-fA-F-]{36}$'
            ORDER BY aj.created_at ASC, aj.id ASC
            FOR UPDATE SKIP LOCKED
            LIMIT 1
        ),
        upd_job AS (
            UPDATE onboarding_webhook_jobs j
            SET status = 'processing',
                updated_at = now(),
                attempts = attempts + 1
            FROM picked p
            WHERE j.id = p.job_id
              AND j.status = 'pending'
            RETURNING j.id, j.payload
        ),
        upd_async AS (
            UPDATE async_jobs aj
            SET status = 'running',
                updated_at = now()
            FROM picked p
            WHERE aj.id = p.async_id
              AND EXISTS (SELECT 1 FROM upd_job)
            RETURNING aj.id
        )
        SELECT id, payload FROM upd_job
        "#,
    )
    .fetch_optional(pool)
    .await?;
    Ok(row.map(|r| (r.id, r.payload.0)))
}

/// **96-09**：将 **`processing`** 且 **`updated_at` < now() − `stale_after_secs`** 的 **`onboarding_webhook_jobs`** 改回 **`pending`**，并写 **`last_error = stale_processing_requeued`**，供 **worker** 再次 **`claim`**（应对进程崩溃、**`apply`** 卡死或 **`EXTERNAL_ONLY`** 与 **spawn** 切换后的孤儿行）。**`stale_after_secs` ≤ 0`** 时 **no-op** 返回 **0**。**可选** **`ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR=1`** 且 **至少** **更新** **一行** 时：**`async_jobs`** **与** **域表** **同源** **`pending`/`stale_processing_requeued`**（**stderr-only** **失败**）。
///
/// **运维**：阈值须 **大于** 正常 **`apply`** 耗时，避免误伤进行中的任务（默认见 **`ONBOARDING_WEBHOOK_REQUEUE_STALE_PROCESSING_SECS`**）。
pub async fn requeue_stale_onboarding_webhook_jobs_processing(
    pool: &PgPool,
    stale_after_secs: i64,
) -> Result<u64, sqlx::Error> {
    if stale_after_secs <= 0 {
        return Ok(0);
    };
    let res = sqlx::query(
        r#"
        UPDATE onboarding_webhook_jobs
        SET status = 'pending',
            last_error = 'stale_processing_requeued',
            updated_at = now()
        WHERE status = 'processing'
          AND updated_at < (now() - ($1::bigint * interval '1 second'))
        "#,
    )
    .bind(stale_after_secs)
    .execute(pool)
    .await?;
    let n = res.rows_affected();
    if onboarding_webhook_async_jobs_mirror_enabled() && n > 0 {
        if let Err(e) = sync_async_jobs_mirror_after_stale_requeue(pool).await {
            eprintln!(
                "[onboarding_webhook] ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR async_jobs stale requeue sync failed: {e}"
            );
        }
    }
;
    Ok(n)
}
