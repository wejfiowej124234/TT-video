//! **`onboarding_entitlements.metadata`** 合并（Stripe 等）。

use serde_json::json;
use sqlx::types::Json;
use sqlx::PgPool;
use uuid::Uuid;

/// 合并写入 **`metadata.stripe.payment_intent_id`**（幂等覆盖同键对象）。
pub async fn merge_entitlement_stripe_payment_intent(
    pool: &PgPool,
    entitlement_id: Uuid,
    payment_intent_id: &str,
) -> Result<(), sqlx::Error> {
    let patch = json!({
        "stripe": { "payment_intent_id": payment_intent_id }
    });
    sqlx::query(
        r#"
        UPDATE onboarding_entitlements
        SET metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
            updated_at = now()
        WHERE id = $1
        "#,
    )
    .bind(entitlement_id)
    .bind(Json(patch))
    .execute(pool)
    .await?;
    Ok(())
}

/// 合并 **`metadata.stripe.charge_id`**（**Stripe `PaymentIntent.latest_charge`**），供 **`charge.dispute.funds_withdrawn`** 等按 **Charge** 匹配。
pub async fn merge_entitlement_stripe_charge_id_by_idempotency_key(
    pool: &PgPool,
    idempotency_key: &str,
    charge_id: &str,
) -> Result<(), sqlx::Error> {
    let ch = charge_id.trim();
    if ch.is_empty() {
        return Ok(());
    }
;
    sqlx::query(
        r#"
        UPDATE onboarding_entitlements
        SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
            'stripe',
            COALESCE(metadata->'stripe', '{}'::jsonb) || jsonb_build_object('charge_id', to_jsonb($2::text))
          ),
          updated_at = now()
        WHERE trim(COALESCE(idempotency_key, '')) = trim($1)
        "#,
    )
    .bind(idempotency_key)
    .bind(ch)
    .execute(pool)
    .await?;
    Ok(())
}

/// 按 **`entitlement.id`** 合并 **`metadata.stripe.charge_id`**（与 **`merge_entitlement_stripe_charge_id_by_idempotency_key`** 同形）。
pub async fn merge_entitlement_stripe_charge_id(
    pool: &PgPool,
    entitlement_id: Uuid,
    charge_id: &str,
) -> Result<(), sqlx::Error> {
    let ch = charge_id.trim();
    if ch.is_empty() {
        return Ok(());
    }
;
    sqlx::query(
        r#"
        UPDATE onboarding_entitlements
        SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
            'stripe',
            COALESCE(metadata->'stripe', '{}'::jsonb) || jsonb_build_object('charge_id', to_jsonb($2::text))
          ),
          updated_at = now()
        WHERE id = $1
        "#,
    )
    .bind(entitlement_id)
    .bind(ch)
    .execute(pool)
    .await?;
    Ok(())
}

/// 合并 **`metadata.stripe.checkout_session_id`**；若提供 **`payment_intent_id`** 则一并写入（**Checkout Session** 创建响应常见）。
pub async fn merge_entitlement_stripe_checkout(
    pool: &PgPool,
    entitlement_id: Uuid,
    checkout_session_id: &str,
    payment_intent_id: Option<&str>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE onboarding_entitlements
        SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
            'stripe',
            COALESCE(metadata->'stripe', '{}'::jsonb)
              || jsonb_build_object('checkout_session_id', to_jsonb($2::text))
              || CASE
                  WHEN $3::text IS NOT NULL AND btrim($3::text) <> '' THEN
                    jsonb_build_object('payment_intent_id', to_jsonb(btrim($3::text)))
                  ELSE '{}'::jsonb
                END
          ),
          updated_at = now()
        WHERE id = $1
        "#,
    )
    .bind(entitlement_id)
    .bind(checkout_session_id)
    .bind(payment_intent_id.unwrap_or(""))
    .execute(pool)
    .await?;
    Ok(())
}
