//! **`onboarding_payment_events`** 列表查询。

use sqlx::PgPool;
use uuid::Uuid;

use super::types::OnboardingPaymentEventListRow;

/// **Admin 70**：按 **`entitlement_id`** 列出 **`onboarding_payment_events`**（**`received_at DESC`**）。
pub async fn list_onboarding_payment_events_for_entitlement_admin(
    pool: &PgPool,
    entitlement_id: Uuid,
    limit: i64,
) -> Result<Vec<OnboardingPaymentEventListRow>, sqlx::Error> {
    sqlx::query_as::<_, OnboardingPaymentEventListRow>(
        r#"
        SELECT id, entitlement_id, event_type, payload_ref, received_at
        FROM onboarding_payment_events
        WHERE entitlement_id = $1
        ORDER BY received_at DESC, id DESC
        LIMIT $2
        "#,
    )
    .bind(entitlement_id)
    .bind(limit)
    .fetch_all(pool)
    .await
}

/// **Admin 70**：全局 **`onboarding_payment_events`**（可选 **`entitlement_id`** / **`event_type`** **精确** 匹配；**`received_at DESC`**）。
pub async fn list_onboarding_payment_events_admin(
    pool: &PgPool,
    filter_entitlement_id: Option<Uuid>,
    filter_event_type: Option<&str>,
    limit: i64,
) -> Result<Vec<OnboardingPaymentEventListRow>, sqlx::Error> {
    sqlx::query_as::<_, OnboardingPaymentEventListRow>(
        r#"
        SELECT id, entitlement_id, event_type, payload_ref, received_at
        FROM onboarding_payment_events
        WHERE ($1::uuid IS NULL OR entitlement_id = $1)
          AND ($2::text IS NULL OR event_type = $2)
        ORDER BY received_at DESC, id DESC
        LIMIT $3
        "#,
    )
    .bind(filter_entitlement_id)
    .bind(filter_event_type)
    .bind(limit)
    .fetch_all(pool)
    .await
}
