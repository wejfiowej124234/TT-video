//! Stripe 公网 webhook：**`charge.refunded`** / **`charge.dispute.funds_withdrawn`** 等。

use chrono::Utc;
use serde_json::json;
use sqlx::types::Json;
use sqlx::PgPool;
use uuid::Uuid;

use super::types::{
    OnboardingEntitlementRow, StripeChargeRefundWebhookOutcome, StripeDisputeWebhookOutcome,
    StripePartialRefundWebhookOutcome,
};

/// **Stripe `charge.refunded`**：**全额**（**`amount_refunded` ≥ `amount`** 且 **`amount` > 0**）时 **幂等** 落 **`stripe_charge_refunded`** 事件并 **`refunded`**；**`payload_ref = stripe_evt:{stripe_event_id}`**。
pub async fn apply_stripe_charge_full_refund_webhook(
    pool: &PgPool,
    stripe_event_id: &str,
    payment_intent_id: &str,
) -> Result<StripeChargeRefundWebhookOutcome, sqlx::Error> {
    let pi = payment_intent_id.trim();
    if pi.is_empty() {
        return Ok(StripeChargeRefundWebhookOutcome::UnknownEntitlement);
    };
    let payload_ref = format!("stripe_evt:{stripe_event_id}");
    let admin_patch = json!({
        "reversed_at": Utc::now().to_rfc3339(),
        "reversed_by": "stripe_webhook",
        "reversal_reason": format!("stripe charge.refunded event_id={stripe_event_id}"),
        "reversal_kind": "refund",
        "stripe_webhook_event_id": stripe_event_id,
    });
    let mut tx = pool.begin().await?;
    let locked: Vec<(Uuid, String)> = sqlx::query_as(
        r#"
        SELECT id, status FROM onboarding_entitlements
        WHERE status IN ('paid', 'refunded', 'revoked')
          AND (
            trim(COALESCE(provider_payment_ref, '')) = $1
            OR trim(COALESCE(metadata->'stripe'->>'payment_intent_id', '')) = $1
          )
        ORDER BY updated_at DESC
        LIMIT 2
        FOR UPDATE
        "#,
    )
    .bind(pi)
    .fetch_all(&mut *tx)
    .await?;
    if locked.is_empty() {
        tx.rollback().await.ok();
        return Ok(StripeChargeRefundWebhookOutcome::UnknownEntitlement);
    };
    if locked.len() > 1 {
        tx.rollback().await.ok();
        return Ok(StripeChargeRefundWebhookOutcome::UnknownEntitlement);
    };
    let (ent_id, status) = &locked[0];

    if status == "refunded" || status == "revoked" {
        let ins = sqlx::query_scalar::<_, i64>(
            r#"
        INSERT INTO onboarding_payment_events (entitlement_id, event_type, payload_ref)
        VALUES ($1, 'stripe_charge_refunded', $2)
        ON CONFLICT (entitlement_id, payload_ref) DO NOTHING
        RETURNING id
        "#,
        )
        .bind(ent_id)
        .bind(&payload_ref)
        .fetch_optional(&mut *tx)
        .await?;
        if ins.is_none() {
            tx.commit().await?;
            return Ok(StripeChargeRefundWebhookOutcome::DuplicateEvent);
        }
        tx.commit().await?;
        return Ok(StripeChargeRefundWebhookOutcome::AuditOnlyAlreadyFinal);
    }
;
    if status != "paid" {
        tx.rollback().await.ok();
        return Ok(StripeChargeRefundWebhookOutcome::UnknownEntitlement);
    };
    let ins = sqlx::query_scalar::<_, i64>(
        r#"
        INSERT INTO onboarding_payment_events (entitlement_id, event_type, payload_ref)
        VALUES ($1, 'stripe_charge_refunded', $2)
        ON CONFLICT (entitlement_id, payload_ref) DO NOTHING
        RETURNING id
        "#,
    )
    .bind(ent_id)
    .bind(&payload_ref)
    .fetch_optional(&mut *tx)
    .await?;
    if ins.is_none() {
        tx.commit().await?;
        return Ok(StripeChargeRefundWebhookOutcome::DuplicateEvent);
    };
    let ent = sqlx::query_as::<_, OnboardingEntitlementRow>(
        r#"
        UPDATE onboarding_entitlements
        SET status = 'refunded',
            metadata = jsonb_set(
                COALESCE(metadata, '{}'::jsonb),
                '{admin}',
                COALESCE(metadata->'admin', '{}'::jsonb) || $2::jsonb,
                true
            ),
            updated_at = now()
        WHERE id = $1 AND status = 'paid'
        RETURNING
            id, user_id, role_target, sku, fee_schedule_version, status,
            idempotency_key, provider_payment_ref, metadata, paid_at, expires_at, created_at, updated_at
        "#,
    )
    .bind(ent_id)
    .bind(Json(admin_patch))
    .fetch_one(&mut *tx)
    .await?;
    tx.commit().await?;
    super::super::role_identity::dual_write_after_onboarding_entitlement(pool, &ent).await;
    Ok(StripeChargeRefundWebhookOutcome::Applied)
}

/// **Stripe `charge.refunded`** **部分**：**`paid`** 行 **唯一** 匹配 **PI** 时插入 **`stripe_charge_refund_partial`**；**`payload_ref = stripe_partial_evt:{stripe_event_id}`** 幂等。
pub async fn apply_stripe_charge_partial_refund_webhook_audit(
    pool: &PgPool,
    stripe_event_id: &str,
    payment_intent_id: &str,
) -> Result<StripePartialRefundWebhookOutcome, sqlx::Error> {
    let pi = payment_intent_id.trim();
    if pi.is_empty() {
        return Ok(StripePartialRefundWebhookOutcome::UnknownEntitlement);
    };
    let payload_ref = format!("stripe_partial_evt:{stripe_event_id}");
    let mut tx = pool.begin().await?;
    let locked: Vec<Uuid> = sqlx::query_scalar(
        r#"
        SELECT id FROM onboarding_entitlements
        WHERE status = 'paid'
          AND (
            trim(COALESCE(provider_payment_ref, '')) = $1
            OR trim(COALESCE(metadata->'stripe'->>'payment_intent_id', '')) = $1
          )
        ORDER BY updated_at DESC
        LIMIT 2
        FOR UPDATE
        "#,
    )
    .bind(pi)
    .fetch_all(&mut *tx)
    .await?;
    if locked.is_empty() || locked.len() > 1 {
        tx.rollback().await.ok();
        return Ok(StripePartialRefundWebhookOutcome::UnknownEntitlement);
    };
    let ent_id = locked[0];
    let ins = sqlx::query_scalar::<_, i64>(
        r#"
        INSERT INTO onboarding_payment_events (entitlement_id, event_type, payload_ref)
        VALUES ($1, 'stripe_charge_refund_partial', $2)
        ON CONFLICT (entitlement_id, payload_ref) DO NOTHING
        RETURNING id
        "#,
    )
    .bind(ent_id)
    .bind(&payload_ref)
    .fetch_optional(&mut *tx)
    .await?;
    if ins.is_none() {
        tx.commit().await?;
        return Ok(StripePartialRefundWebhookOutcome::DuplicateEvent);
    }
    tx.commit().await?;
    Ok(StripePartialRefundWebhookOutcome::Recorded)
}

/// **Stripe `charge.dispute.funds_withdrawn`**：按 **`metadata.stripe.charge_id`** 或（回退）**`payment_intent_id` / `provider_payment_ref`** 匹配 **单行** **`paid`**；**`payload_ref = stripe_dispute_evt:{stripe_event_id}`** 幂等。
pub async fn apply_stripe_dispute_funds_withdrawn_webhook(
    pool: &PgPool,
    stripe_event_id: &str,
    charge_id_in: &str,
    payment_intent_id_in: Option<&str>,
) -> Result<StripeDisputeWebhookOutcome, sqlx::Error> {
    let ch = charge_id_in.trim();
    let pi_opt = payment_intent_id_in
        .map(str::trim)
        .filter(|s| !s.is_empty());
    if ch.is_empty() && pi_opt.is_none() {
        return Ok(StripeDisputeWebhookOutcome::UnknownEntitlement);
    };
    let ch_bind = if ch.is_empty() { "" } else { ch };
    let pi_bind = pi_opt.unwrap_or("");
    let payload_ref = format!("stripe_dispute_evt:{stripe_event_id}");
    let admin_patch = json!({
        "reversed_at": Utc::now().to_rfc3339(),
        "reversed_by": "stripe_webhook",
        "reversal_reason": format!("stripe charge.dispute.funds_withdrawn event_id={stripe_event_id}"),
        "reversal_kind": "chargeback",
        "stripe_webhook_event_id": stripe_event_id,
    });
    let mut tx = pool.begin().await?;
    let locked: Vec<(Uuid, String)> = sqlx::query_as(
        r#"
        SELECT id, status FROM onboarding_entitlements
        WHERE status IN ('paid', 'refunded', 'revoked')
          AND (
            ($1::text IS NOT NULL AND btrim($1::text) <> '' AND trim(COALESCE(metadata->'stripe'->>'charge_id', '')) = btrim($1::text))
            OR ($2::text IS NOT NULL AND btrim($2::text) <> '' AND (
                 trim(COALESCE(metadata->'stripe'->>'payment_intent_id', '')) = btrim($2::text)
                 OR trim(COALESCE(provider_payment_ref, '')) = btrim($2::text)
               ))
          )
        ORDER BY updated_at DESC
        LIMIT 2
        FOR UPDATE
        "#,
    )
    .bind(ch_bind)
    .bind(pi_bind)
    .fetch_all(&mut *tx)
    .await?;
    if locked.is_empty() {
        tx.rollback().await.ok();
        return Ok(StripeDisputeWebhookOutcome::UnknownEntitlement);
    };
    if locked.len() > 1 {
        tx.rollback().await.ok();
        return Ok(StripeDisputeWebhookOutcome::UnknownEntitlement);
    };
    let (ent_id, status) = &locked[0];

    if status == "refunded" || status == "revoked" {
        let ins = sqlx::query_scalar::<_, i64>(
            r#"
        INSERT INTO onboarding_payment_events (entitlement_id, event_type, payload_ref)
        VALUES ($1, 'stripe_dispute_funds_withdrawn', $2)
        ON CONFLICT (entitlement_id, payload_ref) DO NOTHING
        RETURNING id
        "#,
        )
        .bind(ent_id)
        .bind(&payload_ref)
        .fetch_optional(&mut *tx)
        .await?;
        if ins.is_none() {
            tx.commit().await?;
            return Ok(StripeDisputeWebhookOutcome::DuplicateEvent);
        }
        tx.commit().await?;
        return Ok(StripeDisputeWebhookOutcome::AuditOnlyAlreadyFinal);
    }
;
    if status != "paid" {
        tx.rollback().await.ok();
        return Ok(StripeDisputeWebhookOutcome::UnknownEntitlement);
    };
    let ins = sqlx::query_scalar::<_, i64>(
        r#"
        INSERT INTO onboarding_payment_events (entitlement_id, event_type, payload_ref)
        VALUES ($1, 'stripe_dispute_funds_withdrawn', $2)
        ON CONFLICT (entitlement_id, payload_ref) DO NOTHING
        RETURNING id
        "#,
    )
    .bind(ent_id)
    .bind(&payload_ref)
    .fetch_optional(&mut *tx)
    .await?;
    if ins.is_none() {
        tx.commit().await?;
        return Ok(StripeDisputeWebhookOutcome::DuplicateEvent);
    };
    let ent = sqlx::query_as::<_, OnboardingEntitlementRow>(
        r#"
        UPDATE onboarding_entitlements
        SET status = 'revoked',
            metadata = jsonb_set(
                COALESCE(metadata, '{}'::jsonb),
                '{admin}',
                COALESCE(metadata->'admin', '{}'::jsonb) || $2::jsonb,
                true
            ),
            updated_at = now()
        WHERE id = $1 AND status = 'paid'
        RETURNING
            id, user_id, role_target, sku, fee_schedule_version, status,
            idempotency_key, provider_payment_ref, metadata, paid_at, expires_at, created_at, updated_at
        "#,
    )
    .bind(ent_id)
    .bind(Json(admin_patch))
    .fetch_one(&mut *tx)
    .await?;
    tx.commit().await?;
    super::super::role_identity::dual_write_after_onboarding_entitlement(pool, &ent).await;
    Ok(StripeDisputeWebhookOutcome::Applied)
}
