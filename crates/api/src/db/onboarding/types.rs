//! 准入费域：行类型与结果枚举（**96-18** / **Admin 70**）。

use chrono::{DateTime, Utc};
use serde_json::Value;
use sqlx::types::Json;
use uuid::Uuid;

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

/// **`record_paid_entitlement_financial_reversal_admin`**：目标行 **非** **`paid`** 或 **已** **`refunded`/`revoked`**（**已冲销**）；**`reversal_kind`** 非法时 **`InvalidReversalKind`**。
#[derive(Debug)]
pub enum RecordPaidFinancialReversalOutcome {
    Recorded(OnboardingEntitlementRow),
    NotFound,
    NotPaid,
    AlreadyRefunded,
    InvalidReversalKind,
}

/// **`revoke_onboarding_entitlement_pending_admin`**：`UPDATE` **未命中**（**无行** 或 **非** **`pending`**）。
#[derive(Debug)]
pub enum RevokePendingEntitlementAdminOutcome {
    Revoked(OnboardingEntitlementRow),
    NotFoundOrNotPending,
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

/// **`charge.refunded`**（Stripe 公网 webhook）→ **`paid` → `refunded`** 的幂等应用结果。
#[derive(Debug, PartialEq, Eq)]
pub enum StripeChargeRefundWebhookOutcome {
    Applied,
    DuplicateEvent,
    UnknownEntitlement,
    /// 已 **`refunded`/`revoked`**：仅 **首见** **`stripe_evt:{event_id}`** 写入 **`onboarding_payment_events`**（审计），**不**改 **`status`**。
    AuditOnlyAlreadyFinal,
}

/// **`charge.refunded`** **部分退款**（**`0 < amount_refunded < amount`**）**审计** 结果；**不**改 **`onboarding_entitlements.status`**。
#[derive(Debug, PartialEq, Eq)]
pub enum StripePartialRefundWebhookOutcome {
    Recorded,
    DuplicateEvent,
    UnknownEntitlement,
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

#[derive(Debug, PartialEq, Eq)]
pub enum WebhookApplyOutcome {
    Accepted,
    DuplicateEvent,
    UnknownIdempotencyKey,
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
