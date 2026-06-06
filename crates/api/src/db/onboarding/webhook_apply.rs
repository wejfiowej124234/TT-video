//! 内网 Webhook：**`apply_payment_webhook`**（**96-09**）。

use sqlx::PgPool;

use super::types::{OnboardingEntitlementRow, WebhookApplyOutcome};

/// 内网 Webhook：**`provider_event_id`** 写入 **`payload_ref`**；**`(entitlement_id, payload_ref)`** 唯一幂等。
pub async fn apply_payment_webhook(
    pool: &PgPool,
    idempotency_key: &str,
    provider_event_id: &str,
    outcome: &str,
    provider_payment_ref: Option<&str>,
) -> Result<WebhookApplyOutcome, sqlx::Error> {
    let mut tx = pool.begin().await?;
    let ent: Option<OnboardingEntitlementRow> = sqlx::query_as(
        r#"
        SELECT id, user_id, role_target, sku, fee_schedule_version, status,
               idempotency_key, provider_payment_ref, metadata, paid_at, expires_at, created_at, updated_at
        FROM onboarding_entitlements
        WHERE idempotency_key = $1
        FOR UPDATE
        "#,
    )
    .bind(idempotency_key)
    .fetch_optional(&mut *tx)
    .await?;

    let Some(ent) = ent else {
        tx.rollback().await.ok();
        return Ok(WebhookApplyOutcome::UnknownIdempotencyKey);
    }
;
    let ins = sqlx::query_scalar::<_, i64>(
        r#"
        INSERT INTO onboarding_payment_events (entitlement_id, event_type, payload_ref)
        VALUES ($1, 'webhook', $2)
        ON CONFLICT (entitlement_id, payload_ref) DO NOTHING
        RETURNING id
        "#,
    )
    .bind(ent.id)
    .bind(provider_event_id)
    .fetch_optional(&mut *tx)
    .await?;

    if ins.is_none() {
        tx.commit().await?;
        return Ok(WebhookApplyOutcome::DuplicateEvent);
    }
;
    if outcome.eq_ignore_ascii_case("succeeded") {
        sqlx::query(
            r#"
            UPDATE onboarding_entitlements
            SET status = 'paid',
                paid_at = COALESCE(paid_at, now()),
                provider_payment_ref = COALESCE($2, provider_payment_ref),
                updated_at = now()
            WHERE id = $1 AND status = 'pending'
            "#,
        )
        .bind(ent.id)
        .bind(provider_payment_ref)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    if outcome.eq_ignore_ascii_case("succeeded") {
        if let Ok(Some(ent)) = sqlx::query_as::<_, OnboardingEntitlementRow>(
            r#"
            SELECT id, user_id, role_target, sku, fee_schedule_version, status,
                   idempotency_key, provider_payment_ref, metadata, paid_at, expires_at, created_at, updated_at
            FROM onboarding_entitlements
            WHERE idempotency_key = $1
            "#,
        )
        .bind(idempotency_key)
        .fetch_optional(pool)
        .await
        {
            super::super::role_identity::dual_write_after_onboarding_entitlement(pool, &ent).await;
        }
    }

    Ok(WebhookApplyOutcome::Accepted)
}
