//! 资格行：读/写、列表、用户角色（**96-18**）。

use chrono::{DateTime, Utc};
use serde_json::{json, Value};
use sqlx::types::Json;
use sqlx::PgPool;
use uuid::Uuid;

use super::types::{InsertPendingEntitlementOutcome, OnboardingEntitlementRow};

fn fee_schedule_metadata_idempotency_matches(stored: &Value, expected: &Value) -> bool {
    let Some(exp) = expected.get("fee_schedule") else {
        return stored.get("fee_schedule").is_none();
    };
    let Some(st) = stored.get("fee_schedule") else {
        return false;
    };
    let same_i64 = |key: &str| {
        st.get(key).and_then(|v| v.as_i64()) == exp.get(key).and_then(|v| v.as_i64())
    };
    let same_str = |key: &str| {
        st.get(key).and_then(|v| v.as_str()) == exp.get(key).and_then(|v| v.as_str())
    };
    same_i64("computed_amount_minor")
        && same_i64("amount_minor")
        && same_str("currency")
        && same_str("refund_policy_version")
        && st.get("jurisdictions") == exp.get("jurisdictions")
}

pub fn entitlement_to_json(e: &OnboardingEntitlementRow) -> Value {
    let stripe = e.metadata.0.get("stripe");
    let stripe_pi = stripe
        .and_then(|s| s.get("payment_intent_id"))
        .and_then(|v| v.as_str());
    let stripe_cs = stripe
        .and_then(|s| s.get("checkout_session_id"))
        .and_then(|v| v.as_str());
    let fee_schedule = e.metadata.0.get("fee_schedule");
    let mut out = json!({
        "id": e.id,
        "role_target": e.role_target,
        "sku": e.sku,
        "fee_schedule_version": e.fee_schedule_version,
        "status": e.status,
        "provider_payment_ref": e.provider_payment_ref,
        "stripe_payment_intent_id": stripe_pi,
        "stripe_checkout_session_id": stripe_cs,
        "paid_at": e.paid_at.map(|t| t.to_rfc3339()),
        "expires_at": e.expires_at.map(|t| t.to_rfc3339()),
        "created_at": e.created_at.to_rfc3339(),
    });
    if let Some(fs) = fee_schedule {
        if let Some(m) = out.as_object_mut() {
            if let Some(v) = fs.get("computed_amount_minor") {
                m.insert("computed_amount_minor".into(), v.clone());
            };
    if let Some(v) = fs.get("amount_minor") {
                m.insert("amount_minor".into(), v.clone());
            };
    if let Some(v) = fs.get("jurisdictions") {
                m.insert("jurisdictions".into(), v.clone());
            };
    if let Some(v) = fs.get("refund_policy_version") {
                m.insert("refund_policy_version".into(), v.clone());
            };
    if let Some(v) = fs.get("renewal_policy_version") {
                m.insert("renewal_policy_version".into(), v.clone());
            }
        }
    }
    out
}

/// B 轨 **`metadata.fee_schedule.amount_minor`**（Stripe / 审计）；无则 **None**。
pub fn entitlement_amount_minor_from_metadata(row: &OnboardingEntitlementRow) -> Option<i64> {
    row.metadata
        .0
        .get("fee_schedule")
        .and_then(|v| v.get("amount_minor"))
        .and_then(|v| v.as_i64())
}

pub fn entitlement_currency_from_metadata(row: &OnboardingEntitlementRow) -> Option<String> {
    row.metadata
        .0
        .get("fee_schedule")
        .and_then(|v| v.get("currency"))
        .and_then(|v| v.as_str())
        .map(str::to_string)
}

/// **Admin 70**：单笔 **`onboarding_entitlements`** 响应体（**`entitlement_to_json`** + **`user_id`** / **`idempotency_key`** / 全量 **`metadata`** / **`updated_at`**）。
pub fn admin_onboarding_entitlement_detail_json(e: &OnboardingEntitlementRow) -> Value {
    let mut v = entitlement_to_json(e);
    if let Some(m) = v.as_object_mut() {
        m.insert("user_id".to_string(), json!(e.user_id));
        m.insert("idempotency_key".to_string(), json!(e.idempotency_key));
        m.insert("metadata".to_string(), e.metadata.0.clone());
        m.insert("updated_at".to_string(), json!(e.updated_at.to_rfc3339()));
    }
    v
}

/// 幂等：**`idempotency_key`** 已存在则返回已有行（**不**覆盖 **`paid`** 等终态）。
pub async fn insert_or_get_pending_entitlement(
    pool: &PgPool,
    user_id: Uuid,
    role_target: &str,
    sku: &str,
    fee_schedule_version: &str,
    idempotency_key: &str,
    expires_at: Option<DateTime<Utc>>,
    initial_metadata: &Value,
) -> Result<InsertPendingEntitlementOutcome, sqlx::Error> {
    let ins = sqlx::query_as::<_, OnboardingEntitlementRow>(
        r#"
        INSERT INTO onboarding_entitlements (
            user_id, role_target, sku, fee_schedule_version, status, idempotency_key, expires_at, metadata
        ) VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7)
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING
            id, user_id, role_target, sku, fee_schedule_version, status,
            idempotency_key, provider_payment_ref, metadata, paid_at, expires_at, created_at, updated_at
        "#,
    )
    .bind(user_id)
    .bind(role_target)
    .bind(sku)
    .bind(fee_schedule_version)
    .bind(idempotency_key)
    .bind(expires_at)
    .bind(Json(initial_metadata.clone()))
    .fetch_optional(pool)
    .await?;

    if let Some(row) = ins {
        super::super::role_identity::dual_write_after_onboarding_entitlement(pool, &row).await;
        return Ok(InsertPendingEntitlementOutcome::Ok(row));
    };
    let row = sqlx::query_as::<_, OnboardingEntitlementRow>(
        r#"
        SELECT id, user_id, role_target, sku, fee_schedule_version, status,
               idempotency_key, provider_payment_ref, metadata, paid_at, expires_at, created_at, updated_at
        FROM onboarding_entitlements
        WHERE idempotency_key = $1
        "#,
    )
    .bind(idempotency_key)
    .fetch_one(pool)
    .await?;

    if row.user_id != user_id
        || row.role_target != role_target
        || row.sku != sku
        || row.fee_schedule_version != fee_schedule_version
        || !fee_schedule_metadata_idempotency_matches(&row.metadata.0, initial_metadata)
    {
        return Ok(InsertPendingEntitlementOutcome::IdempotencyConflict);
    }

    super::super::role_identity::dual_write_after_onboarding_entitlement(pool, &row).await;
    Ok(InsertPendingEntitlementOutcome::Ok(row))
}

pub async fn list_entitlements_for_user(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Vec<OnboardingEntitlementRow>, sqlx::Error> {
    sqlx::query_as::<_, OnboardingEntitlementRow>(
        r#"
        SELECT id, user_id, role_target, sku, fee_schedule_version, status,
               idempotency_key, provider_payment_ref, metadata, paid_at, expires_at, created_at, updated_at
        FROM onboarding_entitlements
        WHERE user_id = $1
        ORDER BY created_at DESC
        "#,
    )
    .bind(user_id)
    .fetch_all(pool)
    .await
}

/// **Admin 70 / 96-18**：**`onboarding_entitlements`** 全局列表（**`user_id` / `status` / `role_target`** 可选 **精确** 过滤；**`created_at DESC`**）。
pub async fn list_onboarding_entitlements_admin(
    pool: &PgPool,
    filter_user_id: Option<Uuid>,
    filter_status: Option<&str>,
    filter_role_target: Option<&str>,
    limit: i64,
) -> Result<Vec<OnboardingEntitlementRow>, sqlx::Error> {
    sqlx::query_as::<_, OnboardingEntitlementRow>(
        r#"
        SELECT id, user_id, role_target, sku, fee_schedule_version, status,
               idempotency_key, provider_payment_ref, metadata, paid_at, expires_at, created_at, updated_at
        FROM onboarding_entitlements
        WHERE ($1::uuid IS NULL OR user_id = $1)
          AND ($2::text IS NULL OR status = $2)
          AND ($3::text IS NULL OR role_target = $3)
        ORDER BY created_at DESC
        LIMIT $4
        "#,
    )
    .bind(filter_user_id)
    .bind(filter_status)
    .bind(filter_role_target)
    .bind(limit)
    .fetch_all(pool)
    .await
}

/// **Admin 70 / 96-18**：按主键 **`id`** 读取单行 **`onboarding_entitlements`**。
pub async fn get_onboarding_entitlement_by_id(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<OnboardingEntitlementRow>, sqlx::Error> {
    sqlx::query_as::<_, OnboardingEntitlementRow>(
        r#"
        SELECT id, user_id, role_target, sku, fee_schedule_version, status,
               idempotency_key, provider_payment_ref, metadata, paid_at, expires_at, created_at, updated_at
        FROM onboarding_entitlements
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
}

/// **Admin 70 / 96-18**：将 **`admin_patch`** **浅合并** 入 **`metadata.admin`**（**不**改 **`status`** / **`paid_at`** 等支付真值列）。
pub async fn merge_onboarding_entitlement_admin_metadata(
    pool: &PgPool,
    id: Uuid,
    admin_patch: &Value,
) -> Result<Option<OnboardingEntitlementRow>, sqlx::Error> {
    sqlx::query_as::<_, OnboardingEntitlementRow>(
        r#"
        UPDATE onboarding_entitlements
        SET metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{admin}',
            COALESCE(metadata->'admin', '{}'::jsonb) || $2::jsonb,
            true
        ),
        updated_at = now()
        WHERE id = $1
        RETURNING
            id, user_id, role_target, sku, fee_schedule_version, status,
            idempotency_key, provider_payment_ref, metadata, paid_at, expires_at, created_at, updated_at
        "#,
    )
    .bind(id)
    .bind(Json(admin_patch.clone()))
    .fetch_optional(pool)
    .await
}

pub async fn find_paid_entitlement_for_role(
    pool: &PgPool,
    user_id: Uuid,
    role_target: &str,
) -> Result<Option<OnboardingEntitlementRow>, sqlx::Error> {
    sqlx::query_as::<_, OnboardingEntitlementRow>(
        r#"
        SELECT id, user_id, role_target, sku, fee_schedule_version, status,
               idempotency_key, provider_payment_ref, metadata, paid_at, expires_at, created_at, updated_at
        FROM onboarding_entitlements
        WHERE user_id = $1 AND role_target = $2 AND status = 'paid'
        ORDER BY paid_at DESC NULLS LAST
        LIMIT 1
        "#,
    )
    .bind(user_id)
    .bind(role_target)
    .fetch_optional(pool)
    .await
}

/// **`users.role`** 仅允许自服务枚举；**禁止**从本路径升为 **`admin`**/**`super_admin`**。
pub async fn update_user_role_if_safe(
    pool: &PgPool,
    user_id: Uuid,
    new_role: &str,
) -> Result<u64, sqlx::Error> {
    let r = sqlx::query(
        r#"
        UPDATE users
        SET role = $2, updated_at = now()
        WHERE id = $1
          AND role NOT IN ('admin', 'super_admin')
          AND $2 IN ('tourist', 'traveler', 'provider', 'region_steward', 'guide', 'arbitrator')
        "#,
    )
    .bind(user_id)
    .bind(new_role)
    .execute(pool)
    .await?;
    Ok(r.rows_affected())
}
