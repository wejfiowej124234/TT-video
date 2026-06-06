//! Worker：**`apply_onboarding_webhook_job_payload`** / **`run_onboarding_webhook_job_worker`**。

use serde::Deserialize;
use serde_json::Value;
use sqlx::types::Json;
use sqlx::PgPool;
use uuid::Uuid;

use super::async_jobs_mirror::{
    onboarding_webhook_async_jobs_mirror_enabled, sync_async_jobs_mirror_onboarding_webhook_running,
};
use super::webhook_apply::apply_payment_webhook;
use super::webhook_jobs_claim::{
    finalize_onboarding_webhook_job_after_apply, mark_onboarding_webhook_job_dead,
};

const WEBHOOK_JOB_IDEMPOTENCY_KEY_MAX_BYTES: usize = 256;
const WEBHOOK_JOB_PROVIDER_EVENT_ID_MAX_BYTES: usize = 512;

#[derive(Debug, Deserialize)]
struct QueuedOnboardingWebhookBody {
    schema_version: u32,
    idempotency_key: String,
    provider_event_id: String,
    outcome: String,
    #[serde(default)]
    provider_payment_ref: Option<String>,
}

/// 在 **`claim_next_pending_onboarding_webhook_job`** 或 **`run_onboarding_webhook_job_worker`** 已将行置为 **`processing`** 后，反序列化 **`payload`**、**`apply_payment_webhook`**、**`finalize_onboarding_webhook_job_after_apply`**。
pub async fn apply_onboarding_webhook_job_payload(
    pool: &PgPool,
    job_id: Uuid,
    payload: &Value,
) -> Result<(), sqlx::Error> {
    let body: QueuedOnboardingWebhookBody = match serde_json::from_value(payload.clone()) {
        Ok(b) => b,
        Err(e) => {
            mark_onboarding_webhook_job_dead(
                pool,
                job_id,
                &format!("deserialize_job_payload: {e}"),
            )
            .await?;
            return Ok(());
        }
    };
    if body.schema_version != 1 {
        mark_onboarding_webhook_job_dead(pool, job_id, "invalid_schema_version").await?;
        return Ok(());
    };
    let idem = body.idempotency_key.trim();
    let ev = body.provider_event_id.trim();
    let oc = body.outcome.trim();
    if idem.is_empty() || ev.is_empty() || oc.is_empty() {
        mark_onboarding_webhook_job_dead(pool, job_id, "invalid_webhook_fields").await?;
        return Ok(());
    };
    if idem.len() > WEBHOOK_JOB_IDEMPOTENCY_KEY_MAX_BYTES
        || ev.len() > WEBHOOK_JOB_PROVIDER_EVENT_ID_MAX_BYTES
    {
        mark_onboarding_webhook_job_dead(pool, job_id, "invalid_onboarding_webhook_field_length")
            .await?;
        return Ok(());
    };
    let pref = body
        .provider_payment_ref
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());

    let outcome = apply_payment_webhook(pool, idem, ev, oc, pref).await;
    finalize_onboarding_webhook_job_after_apply(pool, job_id, &outcome, idem, ev, oc, payload).await
}

/// 后台 worker：**`pending` → `processing` → `apply_payment_webhook`** → 终态（**`dead`** 时写 **DLQ**）。
pub async fn run_onboarding_webhook_job_worker(
    pool: &PgPool,
    job_id: Uuid,
) -> Result<(), sqlx::Error> {
    let payload_opt: Option<Json<Value>> = sqlx::query_scalar(
        r#"
        UPDATE onboarding_webhook_jobs
        SET status = 'processing', updated_at = now(), attempts = attempts + 1
        WHERE id = $1 AND status = 'pending'
        RETURNING payload
        "#,
    )
    .bind(job_id)
    .fetch_optional(pool)
    .await?;

    let Some(Json(payload)) = payload_opt else {
        return Ok(());
    }
;
    if onboarding_webhook_async_jobs_mirror_enabled() {
        if let Err(e) = sync_async_jobs_mirror_onboarding_webhook_running(pool, job_id).await {
            eprintln!(
                "[onboarding_webhook] ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR async_jobs running sync failed job_id={job_id}: {e}"
            );
        }
    }

    apply_onboarding_webhook_job_payload(pool, job_id, &payload).await
}
