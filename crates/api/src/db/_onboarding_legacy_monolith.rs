//! 96-18 准入费：`onboarding_entitlements` / `onboarding_payment_events`（04-附录-DDL §10.7）。
//! **默认** 会话写 **`pending`**、内网 Webhook 幂等推进 **`paid`**。
//! **可选**：**`TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1`** 时由 **`stripe_onboarding`** 创建 **Stripe PaymentIntent** 并写入 **`metadata.stripe`**。

use chrono::{DateTime, Utc};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::types::Json;
use sqlx::PgPool;
use std::env;
use uuid::Uuid;

fn onboarding_webhook_async_jobs_mirror_enabled() -> bool {
    env::var("ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR")
        .map(|s| {
            let t = s.trim().to_ascii_lowercase();
            t == "1" || t == "true" || t == "yes"
        })
        .unwrap_or(false)
}

/// **250 / 迁移笔记阶段 1**：**`onboarding_webhook_jobs`** 入队后 **best-effort** 镜像 **`async_jobs`**（**Admin** 控制面；**不**替代 worker 消费面）。
async fn mirror_onboarding_webhook_job_to_async_jobs(
    pool: &PgPool,
    onboarding_job_id: Uuid,
) -> Result<(), sqlx::Error> {
    let idem = format!("onboarding_webhook_job:{onboarding_job_id}");
    sqlx::query(
        r#"
        INSERT INTO async_jobs (
            queue_name, job_type, status, attempt_count, max_attempts,
            payload_ref, idempotency_key
        )
        VALUES (
            'onboarding_webhook', 'onboarding_webhook_apply', 'pending', 0, 8,
            $1, $2
        )
        "#,
    )
    .bind(onboarding_job_id.to_string())
    .bind(&idem)
    .execute(pool)
    .await?;
    Ok(())
}

fn onboarding_webhook_async_jobs_mirror_idempotency_key(onboarding_job_id: Uuid) -> String {
    format!("onboarding_webhook_job:{onboarding_job_id}")
}

/// **`claim_next_pending_onboarding_webhook_job`** 后：镜像 **`pending` → `running`**（**`async_jobs.status`** CHECK 对齐）。
async fn sync_async_jobs_mirror_onboarding_webhook_running(
    pool: &PgPool,
    onboarding_job_id: Uuid,
) -> Result<(), sqlx::Error> {
    let idem = onboarding_webhook_async_jobs_mirror_idempotency_key(onboarding_job_id);
    sqlx::query(
        r#"
        UPDATE async_jobs
        SET status = 'running', updated_at = now()
        WHERE queue_name = 'onboarding_webhook'
          AND job_type = 'onboarding_webhook_apply'
          AND idempotency_key = $1
        "#,
    )
    .bind(&idem)
    .execute(pool)
    .await?;
    Ok(())
}

/// **`mark_onboarding_webhook_job_*`** 后：镜像终态（**`done` → `completed`**，**`dead` → `failed`**）。
async fn sync_async_jobs_mirror_onboarding_webhook_terminal(
    pool: &PgPool,
    onboarding_job_id: Uuid,
    async_status: &str,
    last_error: Option<&str>,
) -> Result<(), sqlx::Error> {
    let idem = onboarding_webhook_async_jobs_mirror_idempotency_key(onboarding_job_id);
    sqlx::query(
        r#"
        UPDATE async_jobs
        SET status = $1,
            last_error = $2,
            updated_at = now()
        WHERE queue_name = 'onboarding_webhook'
          AND job_type = 'onboarding_webhook_apply'
          AND idempotency_key = $3
        "#,
    )
    .bind(async_status)
    .bind(last_error)
    .bind(&idem)
    .execute(pool)
    .await?;
    Ok(())
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct OnboardingEntitlementRow {
    pub id: Uuid,
    pub user_id: Uuid,
    pub role_target: String,
    pub sku: String,
    pub fee_schedule_version: String,
    pub status: String,
    pub idempotency_key: Option<String>,
    pub provider_payment_ref: Option<String>,
    pub metadata: Json<Value>,
    pub paid_at: Option<DateTime<Utc>>,
    pub expires_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// **`insert_or_get_pending_entitlement`** 的语义：成功幂等或 **全局键冲突**（其它用户 / 不同请求体）。
#[derive(Debug)]
pub enum InsertPendingEntitlementOutcome {
    Ok(OnboardingEntitlementRow),
    /// **`idempotency_key`** 已存在且 **非** 当前用户或 **role/sku/schedule** 与已存行不一致。
    IdempotencyConflict,
}

pub fn entitlement_to_json(e: &OnboardingEntitlementRow) -> Value {
    let stripe = e.metadata.0.get("stripe");
    let stripe_pi = stripe.and_then(|s| s.get("payment_intent_id")).and_then(|v| v.as_str());
    let stripe_cs = stripe.and_then(|s| s.get("checkout_session_id")).and_then(|v| v.as_str());
    json!({
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
    })
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

/// 幂等：**`idempotency_key`** 已存在则返回已有行（**不**覆盖 **`paid`** 等终态）。
pub async fn insert_or_get_pending_entitlement(
    pool: &PgPool,
    user_id: Uuid,
    role_target: &str,
    sku: &str,
    fee_schedule_version: &str,
    idempotency_key: &str,
    expires_at: Option<DateTime<Utc>>,
) -> Result<InsertPendingEntitlementOutcome, sqlx::Error> {
    let ins = sqlx::query_as::<_, OnboardingEntitlementRow>(
        r#"
        INSERT INTO onboarding_entitlements (
            user_id, role_target, sku, fee_schedule_version, status, idempotency_key, expires_at
        ) VALUES ($1, $2, $3, $4, 'pending', $5, $6)
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
    .fetch_optional(pool)
    .await?;

    if let Some(row) = ins {
        return Ok(InsertPendingEntitlementOutcome::Ok(row));
    };    let row = sqlx::query_as::<_, OnboardingEntitlementRow>(
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
    {
        return Ok(InsertPendingEntitlementOutcome::IdempotencyConflict);
    }

    Ok(InsertPendingEntitlementOutcome::Ok(row))
}

pub async fn list_entitlements_for_user(pool: &PgPool, user_id: Uuid) -> Result<Vec<OnboardingEntitlementRow>, sqlx::Error> {
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

/// **`record_paid_entitlement_financial_reversal_admin`**：目标行 **非** **`paid`** 或 **已** **`refunded`/`revoked`**（**已冲销**）；**`reversal_kind`** 非法时 **`InvalidReversalKind`**。
#[derive(Debug)]
pub enum RecordPaidFinancialReversalOutcome {
    Recorded(OnboardingEntitlementRow),
    NotFound,
    NotPaid,
    AlreadyRefunded,
    InvalidReversalKind,
}

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
        return Ok(RecordPaidFinancialReversalOutcome::Recorded(ent));
    };    let status_opt: Option<String> = sqlx::query_scalar(
        "SELECT status::text FROM onboarding_entitlements WHERE id = $1",
    )
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

/// **`revoke_onboarding_entitlement_pending_admin`**：`UPDATE` **未命中**（**无行** 或 **非** **`pending`**）。
#[derive(Debug)]
pub enum RevokePendingEntitlementAdminOutcome {
    Revoked(OnboardingEntitlementRow),
    NotFoundOrNotPending,
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
    Ok(RevokePendingEntitlementAdminOutcome::Revoked(ent))
}

/// **Admin 70 / 96-18**：**`onboarding_payment_events`** 行（按 **`entitlement_id`** 列表）。
#[derive(Debug, Clone, sqlx::FromRow)]
pub struct OnboardingPaymentEventListRow {
    pub id: i64,
    pub entitlement_id: Uuid,
    pub event_type: String,
    pub payload_ref: Option<String>,
    pub received_at: DateTime<Utc>,
}

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
    Ok(WebhookApplyOutcome::Accepted)
}

/// **`charge.refunded`**（Stripe 公网 webhook）→ **`paid` → `refunded`** 的幂等应用结果。
#[derive(Debug, PartialEq, Eq)]
pub enum StripeChargeRefundWebhookOutcome {
    Applied,
    DuplicateEvent,
    UnknownEntitlement,
    /// 已 **`refunded`/`revoked`**：仅 **首见** **`stripe_evt:{event_id}`** 写入 **`onboarding_payment_events`**（审计），**不**改 **`status`**。
    AuditOnlyAlreadyFinal,
}

/// **Stripe `charge.refunded`**：**全额**（**`amount_refunded` ≥ `amount`** 且 **`amount` > 0**）时 **幂等** 落 **`stripe_charge_refunded`** 事件并 **`refunded`**；**`payload_ref = stripe_evt:{stripe_event_id}`**。
pub async fn apply_stripe_charge_full_refund_webhook(
    pool: &PgPool,
    stripe_event_id: &str,
    payment_intent_id: &str,
) -> Result<StripeChargeRefundWebhookOutcome, sqlx::Error> {
    let pi = payment_intent_id.trim();
    if pi.is_empty() {
        return Ok(StripeChargeRefundWebhookOutcome::UnknownEntitlement);
    };    let payload_ref = format!("stripe_evt:{stripe_event_id}");
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
    };    if locked.len() > 1 {
        tx.rollback().await.ok();
        return Ok(StripeChargeRefundWebhookOutcome::UnknownEntitlement);
    };    let (ent_id, status) = &locked[0];

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
    if status != "paid" {
        tx.rollback().await.ok();
        return Ok(StripeChargeRefundWebhookOutcome::UnknownEntitlement);
    };    let ins = sqlx::query_scalar::<_, i64>(
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
    sqlx::query_as::<_, OnboardingEntitlementRow>(
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
    Ok(StripeChargeRefundWebhookOutcome::Applied)
}

/// **`charge.refunded`** **部分退款**（**`0 < amount_refunded < amount`**）**审计** 结果；**不**改 **`onboarding_entitlements.status`**。
#[derive(Debug, PartialEq, Eq)]
pub enum StripePartialRefundWebhookOutcome {
    Recorded,
    DuplicateEvent,
    UnknownEntitlement,
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
    };    let payload_ref = format!("stripe_partial_evt:{stripe_event_id}");
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
    };    let ent_id = locked[0];
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

/// **`charge.dispute.funds_withdrawn`** → **`paid` → `revoked`**（拒付资金划出，与 Admin **`chargeback`** 语义对齐）。
#[derive(Debug, PartialEq, Eq)]
pub enum StripeDisputeWebhookOutcome {
    Applied,
    DuplicateEvent,
    UnknownEntitlement,
    /// 已 **`refunded`/`revoked`**：**`stripe_dispute_evt`** 审计行（**不**改 **`status`**）。
    AuditOnlyAlreadyFinal,
}

/// **Stripe `charge.dispute.funds_withdrawn`**：按 **`metadata.stripe.charge_id`** 或（回退）**`payment_intent_id` / `provider_payment_ref`** 匹配 **单行** **`paid`**；**`payload_ref = stripe_dispute_evt:{stripe_event_id}`** 幂等。
pub async fn apply_stripe_dispute_funds_withdrawn_webhook(
    pool: &PgPool,
    stripe_event_id: &str,
    charge_id_in: &str,
    payment_intent_id_in: Option<&str>,
) -> Result<StripeDisputeWebhookOutcome, sqlx::Error> {
    let ch = charge_id_in.trim();
    let pi_opt = payment_intent_id_in.map(str::trim).filter(|s| !s.is_empty());
    if ch.is_empty() && pi_opt.is_none() {
        return Ok(StripeDisputeWebhookOutcome::UnknownEntitlement);
    };    let ch_bind = if ch.is_empty() { "" } else { ch };
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
    };    if locked.len() > 1 {
        tx.rollback().await.ok();
        return Ok(StripeDisputeWebhookOutcome::UnknownEntitlement);
    };    let (ent_id, status) = &locked[0];

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
    if status != "paid" {
        tx.rollback().await.ok();
        return Ok(StripeDisputeWebhookOutcome::UnknownEntitlement);
    };    let ins = sqlx::query_scalar::<_, i64>(
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
    sqlx::query_as::<_, OnboardingEntitlementRow>(
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
    Ok(StripeDisputeWebhookOutcome::Applied)
}

#[derive(Debug, PartialEq, Eq)]
pub enum WebhookApplyOutcome {
    Accepted,
    DuplicateEvent,
    UnknownIdempotencyKey,
}

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
    };    let max_rows = max_rows.min(500);
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

const WEBHOOK_JOB_IDEMPOTENCY_KEY_MAX_BYTES: usize = 256;
const WEBHOOK_JOB_PROVIDER_EVENT_ID_MAX_BYTES: usize = 512;

/// **96-09**：先入 **`onboarding_webhook_jobs`**（**`pending`**），再由内联或后台 worker **`apply_payment_webhook`**。
///
/// 可选 **`ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR=1`**：镜像一行到 **`async_jobs`**（见 **`contracts/planned/ONBOARDING_WEBHOOK_ASYNC_JOBS_MIGRATION_NOTES.md`**）；镜像失败仅 **stderr**，**不**回滚域队列表。
pub async fn insert_onboarding_webhook_job(pool: &PgPool, payload: &Value) -> Result<Uuid, sqlx::Error> {
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

async fn mark_onboarding_webhook_job_done(pool: &PgPool, job_id: Uuid, resolution: &str) -> Result<(), sqlx::Error> {
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
            sync_async_jobs_mirror_onboarding_webhook_terminal(pool, job_id, "completed", None).await
        {
            eprintln!(
                "[onboarding_webhook] ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR async_jobs terminal sync (completed) failed job_id={job_id}: {e}"
            );
        }
    }
    Ok(())
}

async fn mark_onboarding_webhook_job_dead(pool: &PgPool, job_id: Uuid, last_error: &str) -> Result<(), sqlx::Error> {
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
            sync_async_jobs_mirror_onboarding_webhook_terminal(pool, job_id, "failed", Some(&msg)).await
        {
            eprintln!(
                "[onboarding_webhook] ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR async_jobs terminal sync (failed) failed job_id={job_id}: {e}"
            );
        }
    }
    Ok(())
}

/// 内联路径：**`apply`** 之后把 **`job`** 行收敛到 **`done`/`dead`**（与 **`onboarding_webhook_dlq`** 对齐 **`Err`**）。
pub async fn finalize_onboarding_webhook_job_after_apply(
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
        Ok(WebhookApplyOutcome::DuplicateEvent) => mark_onboarding_webhook_job_done(pool, job_id, "duplicate").await,
        Ok(WebhookApplyOutcome::Accepted) => mark_onboarding_webhook_job_done(pool, job_id, "accepted").await,
        Err(e) => {
            if let Err(e2) =
                insert_onboarding_webhook_dlq(pool, idem_trim, ev_trim, outcome_str, raw_body, &e.to_string()).await
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

#[derive(Debug, sqlx::FromRow)]
struct ClaimedOnboardingWebhookJobRow {
    id: Uuid,
    payload: Json<Value>,
}

#[derive(Debug, Deserialize)]
struct QueuedOnboardingWebhookBody {
    schema_version: u32,
    idempotency_key: String,
    provider_event_id: String,
    outcome: String,
    #[serde(default)]
    provider_payment_ref: Option<String>,
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
    };    let res = sqlx::query(
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
    Ok(n)
}

/// **`requeue_stale_onboarding_webhook_jobs_processing`** 之后：域表 **`pending` + `stale_processing_requeued`** 的行，将 **`async_jobs`** 从 **`running`**（或 **`pending`**）拉回 **`pending`** 与同源 **`last_error`**。
async fn sync_async_jobs_mirror_after_stale_requeue(pool: &PgPool) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE async_jobs aj
        SET status = 'pending',
            last_error = 'stale_processing_requeued',
            updated_at = now()
        FROM onboarding_webhook_jobs j
        WHERE j.id::text = aj.payload_ref
          AND aj.queue_name = 'onboarding_webhook'
          AND aj.job_type = 'onboarding_webhook_apply'
          AND j.status = 'pending'
          AND j.last_error = 'stale_processing_requeued'
        "#,
    )
    .execute(pool)
    .await?;
    Ok(())
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
            mark_onboarding_webhook_job_dead(pool, job_id, &format!("deserialize_job_payload: {e}")).await?;
            return Ok(());
        }
    };
    if body.schema_version != 1 {
        mark_onboarding_webhook_job_dead(pool, job_id, "invalid_schema_version").await?;
        return Ok(());
    };    let idem = body.idempotency_key.trim();
    let ev = body.provider_event_id.trim();
    let oc = body.outcome.trim();
    if idem.is_empty() || ev.is_empty() || oc.is_empty() {
        mark_onboarding_webhook_job_dead(pool, job_id, "invalid_webhook_fields").await?;
        return Ok(());
    };    if idem.len() > WEBHOOK_JOB_IDEMPOTENCY_KEY_MAX_BYTES || ev.len() > WEBHOOK_JOB_PROVIDER_EVENT_ID_MAX_BYTES {
        mark_onboarding_webhook_job_dead(pool, job_id, "invalid_onboarding_webhook_field_length").await?;
        return Ok(());
    };    let pref = body
        .provider_payment_ref
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty());

    let outcome = apply_payment_webhook(pool, idem, ev, oc, pref).await;
    finalize_onboarding_webhook_job_after_apply(pool, job_id, &outcome, idem, ev, oc, payload).await
}

/// 后台 worker：**`pending` → `processing` → `apply_payment_webhook`** → 终态（**`dead`** 时写 **DLQ**）。
pub async fn run_onboarding_webhook_job_worker(pool: &PgPool, job_id: Uuid) -> Result<(), sqlx::Error> {
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
    if onboarding_webhook_async_jobs_mirror_enabled() {
        if let Err(e) = sync_async_jobs_mirror_onboarding_webhook_running(pool, job_id).await {
            eprintln!(
                "[onboarding_webhook] ONBOARDING_WEBHOOK_ASYNC_JOBS_MIRROR async_jobs running sync failed job_id={job_id}: {e}"
            );
        }
    }

    apply_onboarding_webhook_job_payload(pool, job_id, &payload).await
}

/// **Admin 70 / 96-09**：**`onboarding_webhook_jobs`** 列表（**`user_id`** 可选：仅 **`payload.idempotency_key`** 属于该用户 **`onboarding_entitlements`** 的行）。
#[derive(Debug, Clone, sqlx::FromRow)]
pub struct OnboardingWebhookJobListRow {
    pub id: Uuid,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub status: String,
    pub attempts: i32,
    pub last_error: Option<String>,
    pub resolution: Option<String>,
    pub payload: Json<Value>,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct OnboardingWebhookDlqListRow {
    pub id: i64,
    pub created_at: DateTime<Utc>,
    pub idempotency_key: String,
    pub provider_event_id: String,
    pub outcome: String,
    pub raw_body: Json<Value>,
    pub error_message: String,
    pub replayed_at: Option<DateTime<Utc>>,
}

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

/// **96-04 / 96-18 R3**：**`ONBOARDING_COMPLIANCE_EMAIL_DENYLIST`** 命中后 **best-effort** 插入（**不**含 email）。
pub async fn insert_onboarding_compliance_audit_event(
    pool: &PgPool,
    user_id: Uuid,
    request_id: Option<&str>,
    route: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        INSERT INTO onboarding_compliance_audit_events (user_id, request_id, route)
        VALUES ($1, $2, $3)
        "#,
    )
    .bind(user_id)
    .bind(request_id)
    .bind(route)
    .execute(pool)
    .await?;
    Ok(())
}

/// **Admin 70 / 96-18**：**`onboarding_compliance_audit_events`** 列表（**`user_id`** 可选；**`created_at DESC`**）。
#[derive(Debug, Clone, sqlx::FromRow)]
pub struct OnboardingComplianceAuditEventListRow {
    pub id: Uuid,
    pub created_at: DateTime<Utc>,
    pub user_id: Uuid,
    pub request_id: Option<String>,
    pub route: String,
    pub decision: String,
    pub screening_tier: String,
    pub api_error: String,
}

pub async fn list_onboarding_compliance_audit_events_admin(
    pool: &PgPool,
    filter_user_id: Option<Uuid>,
    limit: i64,
) -> Result<Vec<OnboardingComplianceAuditEventListRow>, sqlx::Error> {
    sqlx::query_as::<_, OnboardingComplianceAuditEventListRow>(
        r#"
        SELECT id, created_at, user_id, request_id, route, decision, screening_tier, api_error
        FROM onboarding_compliance_audit_events
        WHERE ($1::uuid IS NULL OR user_id = $1)
        ORDER BY created_at DESC
        LIMIT $2
        "#,
    )
    .bind(filter_user_id)
    .bind(limit)
    .fetch_all(pool)
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
pub async fn update_user_role_if_safe(pool: &PgPool, user_id: Uuid, new_role: &str) -> Result<u64, sqlx::Error> {
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

/// **120 / 96-09**：**`GET /metrics`** 用 **`onboarding_webhook_jobs`**（按 **`status`**）、**`onboarding_webhook_dlq`** 总行数、以及 **`replayed_at IS NULL`** 的 **DLQ** 行数（**未回灌 / 待值班**）做**单次聚合**快照。表不存在或查询失败时由调用方回落 **`-1`**（与 **`traveltrust_active_sessions_missing_token_hash`** 同源语义）。
pub async fn snapshot_onboarding_webhook_queue_counts_for_metrics(
    pool: &PgPool,
) -> Result<(i64, i64, i64, i64, i64, i64), sqlx::Error> {
    sqlx::query_as::<_, (i64, i64, i64, i64, i64, i64)>(
        r#"
        SELECT
            COUNT(*) FILTER (WHERE status = 'pending')::bigint,
            COUNT(*) FILTER (WHERE status = 'processing')::bigint,
            COUNT(*) FILTER (WHERE status = 'done')::bigint,
            COUNT(*) FILTER (WHERE status = 'dead')::bigint,
            (SELECT COUNT(*)::bigint FROM onboarding_webhook_dlq),
            (SELECT COUNT(*)::bigint FROM onboarding_webhook_dlq WHERE replayed_at IS NULL)
        FROM onboarding_webhook_jobs
        "#,
    )
    .fetch_one(pool)
    .await
}
