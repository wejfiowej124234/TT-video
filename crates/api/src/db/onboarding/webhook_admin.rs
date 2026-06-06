//! Admin：**webhook jobs / DLQ** 列表（**Admin 70 / 96-09**）。

use sqlx::PgPool;
use uuid::Uuid;

use super::types::{OnboardingWebhookDlqListRow, OnboardingWebhookJobListRow};

pub async fn list_onboarding_webhook_jobs_admin(
    pool: &PgPool,
    filter_user_id: Option<Uuid>,
    limit: i64,
) -> Result<Vec<OnboardingWebhookJobListRow>, sqlx::Error> {
    sqlx::query_as::<_, OnboardingWebhookJobListRow>(
        r#"
        SELECT j.id, j.created_at, j.updated_at, j.status, j.attempts, j.last_error, j.resolution, j.payload
        FROM onboarding_webhook_jobs j
        WHERE (
            $1::uuid IS NULL
            OR j.payload->>'idempotency_key' IN (
                SELECT e.idempotency_key
                FROM onboarding_entitlements e
                WHERE e.user_id = $1 AND e.idempotency_key IS NOT NULL
            )
        )
        ORDER BY j.created_at DESC
        LIMIT $2
        "#,
    )
    .bind(filter_user_id)
    .bind(limit)
    .fetch_all(pool)
    .await
}

/// **Admin 70 / 96-09**：**`onboarding_webhook_dlq`** 列表（可选 **`user_id`**：与 **`onboarding_entitlements.idempotency_key`** 交集）。
pub async fn list_onboarding_webhook_dlq_admin(
    pool: &PgPool,
    filter_user_id: Option<Uuid>,
    limit: i64,
) -> Result<Vec<OnboardingWebhookDlqListRow>, sqlx::Error> {
    sqlx::query_as::<_, OnboardingWebhookDlqListRow>(
        r#"
        SELECT d.id, d.created_at, d.idempotency_key, d.provider_event_id, d.outcome, d.raw_body, d.error_message, d.replayed_at
        FROM onboarding_webhook_dlq d
        WHERE (
            $1::uuid IS NULL
            OR d.idempotency_key IN (
                SELECT e.idempotency_key
                FROM onboarding_entitlements e
                WHERE e.user_id = $1 AND e.idempotency_key IS NOT NULL
            )
        )
        ORDER BY d.created_at DESC
        LIMIT $2
        "#,
    )
    .bind(filter_user_id)
    .bind(limit)
    .fetch_all(pool)
    .await
}
