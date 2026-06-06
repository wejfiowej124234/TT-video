//! **DLQ** 与 **96-09** 回灌（**`onboarding_webhook_dlq`**）。

use serde_json::Value;
use sqlx::types::Json;
use sqlx::PgPool;
use uuid::Uuid;

use super::async_jobs_mirror::{
    mirror_onboarding_webhook_job_to_async_jobs, onboarding_webhook_async_jobs_mirror_enabled,
};

/// **96-09（可选）**：将 **`replayed_at IS NULL`** 且 **`created_at` 已冷却** 的 **DLQ** 行 **`raw_body`** 批量插入 **`onboarding_webhook_jobs`**（**`pending`**），并 **`UPDATE replayed_at = now()`**（**单条** **SQL** **内** **`RETURNING id`** **逐行** **对拍**）。
///
/// **运维**：须与 **`traveltrust-api onboarding-webhook-worker`** 的 **`ONBOARDING_WEBHOOK_DLQ_AUTO_REPLAY=1`** 同读 **TT-9618**；**`min_age_secs`** 防抖动（默认 **120**）；**不**替代人工读 **`error_message`** 与 **§3.6.2** 安全重放序；**已 `paid`** 再灌同一 **`provider_event_id`** 时 **`apply`** 走 **`DuplicateEvent`**（job 仍 **`done`**）。**可选** **`ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR=1`**：**每** **新** **`jobs.id`** **best-effort** **`async_jobs`** **一行**（**stderr-only** **失败**）。
pub async fn requeue_onboarding_webhook_dlq_to_pending_jobs(
    pool: &PgPool,
    min_age_secs: i64,
    max_rows: i64,
) -> Result<u64, sqlx::Error> {
    if max_rows <= 0 {
        return Ok(0);
    };
    let max_rows = max_rows.min(500);
    let min_age_secs = min_age_secs.max(0);
    let ids: Vec<Uuid> = sqlx::query_scalar(
        r#"
WITH picked AS (
    SELECT id, raw_body
    FROM onboarding_webhook_dlq
    WHERE replayed_at IS NULL
      AND created_at <= (now() - ($1::bigint * interval '1 second'))
    ORDER BY id ASC
    FOR UPDATE SKIP LOCKED
    LIMIT $2
),
ins AS (
    INSERT INTO onboarding_webhook_jobs (status, payload)
    SELECT 'pending', raw_body FROM picked
    RETURNING id
),
dlq_done AS (
    UPDATE onboarding_webhook_dlq AS d
    SET replayed_at = now()
    FROM picked
    WHERE d.id = picked.id
)
SELECT id FROM ins
"#,
    )
    .bind(min_age_secs)
    .bind(max_rows)
    .fetch_all(pool)
    .await?;

    let n = ids.len() as u64;
    if onboarding_webhook_async_jobs_mirror_enabled() {
        for jid in &ids {
            if let Err(e) = mirror_onboarding_webhook_job_to_async_jobs(pool, *jid).await {
                eprintln!(
                    "[onboarding_webhook] ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR async_jobs insert (dlq replay) failed job_id={jid}: {e}"
                );
            }
        }
    }

    Ok(n)
}

/// **`onboarding_webhook_dlq`**：**`apply_payment_webhook`** 返回 **`Err`** 时写入，供运维对照 **`raw_body`** 手工或脚本重放（96-09 DLQ 子集）。
pub async fn insert_onboarding_webhook_dlq(
    pool: &PgPool,
    idempotency_key: &str,
    provider_event_id: &str,
    outcome: &str,
    raw_body: &Value,
    error_message: &str,
) -> Result<(), sqlx::Error> {
    let msg: String = error_message.chars().take(8000).collect();
    sqlx::query(
        r#"
        INSERT INTO onboarding_webhook_dlq (idempotency_key, provider_event_id, outcome, raw_body, error_message)
        VALUES ($1, $2, $3, $4, $5)
        "#,
    )
    .bind(idempotency_key)
    .bind(provider_event_id)
    .bind(outcome)
    .bind(Json(raw_body.clone()))
    .bind(msg)
    .execute(pool)
    .await?;
    Ok(())
}
