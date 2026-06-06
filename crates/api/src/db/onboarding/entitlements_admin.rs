//! Admin：**`paid`/`pending`** 冲销与撤销（**96-18** / **96-08**）。

use chrono::Utc;
use serde_json::json;
use sqlx::types::Json;
use sqlx::PgPool;
use uuid::Uuid;

use super::types::{
    OnboardingEntitlementRow, RecordPaidFinancialReversalOutcome,
    RevokePendingEntitlementAdminOutcome,
};

/// **Admin 70 / 96-18 / 96-08**：**`paid` → `refunded`**（**`reversal_kind`** **`refund`**）或 **`paid` → `revoked`**（**`chargeback`**，银行拒付收回资金、资格收回 **≠** 友好退款）；合并 **`metadata.admin`**；**不**改 **`users.role`**；**同事务** 写 **`onboarding_payment_events`**（**`admin_refund_recorded`** 或 **`admin_chargeback_recorded`**，**`payload_ref`** 唯一）。
/// **PSP**：本函数**仅** DB；**Stripe Refunds** 由 **`stripe_onboarding::try_admin_psp_refund_after_financial_reversal`** 在路由层 **opt-in** 追加（**`TRAVELTRUST_ONBOARDING_STRIPE_ADMIN_PSP_REFUND=1`**）。
pub async fn record_paid_entitlement_financial_reversal_admin(
    pool: &PgPool,
    id: Uuid,
    reason: &str,
    reversal_kind: &str,
    actor_id: Uuid,
) -> Result<RecordPaidFinancialReversalOutcome, sqlx::Error> {
    let kind_lc = reversal_kind.trim().to_ascii_lowercase();
    let event_type = if kind_lc == "refund" {
        "admin_refund_recorded"
    } else if kind_lc == "chargeback" {
        "admin_chargeback_recorded"
    } else {
        return Ok(RecordPaidFinancialReversalOutcome::InvalidReversalKind);
    }
;
    let new_status: &str = if kind_lc == "refund" {
        "refunded"
    } else {
        "revoked"
    };
    let mut tx = pool.begin().await?;
    let row = sqlx::query_as::<_, OnboardingEntitlementRow>(
        r#"
        UPDATE onboarding_entitlements
        SET status = $3,
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
    .bind(id)
    .bind(Json(json!({
        "reversed_at": Utc::now().to_rfc3339(),
        "reversed_by": actor_id.to_string(),
        "reversal_reason": reason,
        "reversal_kind": kind_lc,
    })))
    .bind(new_status)
    .fetch_optional(&mut *tx)
    .await?;

    if let Some(ent) = row {
        let payload_ref = format!("{event_type}:{}", Uuid::new_v4());
        sqlx::query(
            r#"
            INSERT INTO onboarding_payment_events (entitlement_id, event_type, payload_ref)
            VALUES ($1, $2, $3)
            "#,
        )
        .bind(id)
        .bind(event_type)
        .bind(&payload_ref)
        .execute(&mut *tx)
        .await?;
        tx.commit().await?;
        super::super::role_identity::dual_write_after_onboarding_entitlement(pool, &ent).await;
        return Ok(RecordPaidFinancialReversalOutcome::Recorded(ent));
    };
    let status_opt: Option<String> =
        sqlx::query_scalar("SELECT status::text FROM onboarding_entitlements WHERE id = $1")
            .bind(id)
            .fetch_optional(&mut *tx)
            .await?;
    tx.rollback().await.ok();
    Ok(match status_opt {
        None => RecordPaidFinancialReversalOutcome::NotFound,
        Some(s) if s == "refunded" || s == "revoked" => {
            RecordPaidFinancialReversalOutcome::AlreadyRefunded
        }
        _ => RecordPaidFinancialReversalOutcome::NotPaid,
    })
}

/// **Admin 70 / 96-18**：仅 **`status = 'pending'`** → **`revoked`**，并合并 **`metadata.admin`** 撤销审计（**不**改 **`users.role`**）；**同事务** 写入 **`onboarding_payment_events`**（**`event_type = 'admin_revoke'`**，**`payload_ref`** 唯一）。
pub async fn revoke_onboarding_entitlement_pending_admin(
    pool: &PgPool,
    id: Uuid,
    reason: &str,
    actor_id: Uuid,
) -> Result<RevokePendingEntitlementAdminOutcome, sqlx::Error> {
    let admin_patch = json!({
        "revoked_at": Utc::now().to_rfc3339(),
        "revoked_by": actor_id.to_string(),
        "revoke_reason": reason,
    });
    let mut tx = pool.begin().await?;
    let row = sqlx::query_as::<_, OnboardingEntitlementRow>(
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
        WHERE id = $1 AND status = 'pending'
        RETURNING
            id, user_id, role_target, sku, fee_schedule_version, status,
            idempotency_key, provider_payment_ref, metadata, paid_at, expires_at, created_at, updated_at
        "#,
    )
    .bind(id)
    .bind(Json(admin_patch))
    .fetch_optional(&mut *tx)
    .await?;

    let Some(ent) = row else {
        tx.rollback().await.ok();
        return Ok(RevokePendingEntitlementAdminOutcome::NotFoundOrNotPending);
    }
;
    let payload_ref = format!("admin_revoke:{}", Uuid::new_v4());
    sqlx::query(
        r#"
        INSERT INTO onboarding_payment_events (entitlement_id, event_type, payload_ref)
        VALUES ($1, 'admin_revoke', $2)
        "#,
    )
    .bind(id)
    .bind(&payload_ref)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    super::super::role_identity::dual_write_after_onboarding_entitlement(pool, &ent).await;
    Ok(RevokePendingEntitlementAdminOutcome::Revoked(ent))
}
