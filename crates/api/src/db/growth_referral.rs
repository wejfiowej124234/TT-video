//! G-S1 · Referral minimum loop（102 §4 · 124 G1）

use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::PgPool;
use uuid::Uuid;

pub const REFERRAL_CODE_PREFIX: &str = "TT-";
const CODE_BODY_LEN: usize = 6;
const REFERRAL_HOURLY_BIND_LIMIT: i64 = 50;

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct ReferralCodeRow {
    pub id: Uuid,
    pub code: String,
    pub code_type: String,
    pub owner_user_id: Option<Uuid>,
    pub region_iso: Option<String>,
    pub label: Option<String>,
    pub is_active: bool,
    pub max_uses: Option<i32>,
    pub use_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ReferralValidateOk {
    pub valid: bool,
    pub code: String,
    pub code_type: Option<String>,
    pub label: Option<String>,
    pub is_active: Option<bool>,
    pub reason: Option<String>,
}

#[derive(Debug, Clone)]
pub struct ReferralBindResult {
    pub referral_code: String,
    pub referrer_user_id: Uuid,
    pub referral_event_id: Uuid,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ReferralRejectReason {
    InvalidFormat,
    NotFound,
    Inactive,
    Exhausted,
    SelfReferral,
    RateLimited,
    AlreadyReferred,
}

impl ReferralRejectReason {
    pub fn as_key(self) -> &'static str {
        match self {
            Self::InvalidFormat => "referral_code_invalid",
            Self::NotFound => "referral_code_invalid",
            Self::Inactive => "referral_code_inactive",
            Self::Exhausted => "referral_code_exhausted",
            Self::SelfReferral => "referral_self_forbidden",
            Self::RateLimited => "referral_rate_limited",
            Self::AlreadyReferred => "referral_already_bound",
        }
    }
}

pub fn normalize_referral_code(raw: &str) -> String {
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return String::new();
    }
    let upper = trimmed.to_ascii_uppercase();
    if upper.starts_with(REFERRAL_CODE_PREFIX) {
        upper
    } else {
        format!("{REFERRAL_CODE_PREFIX}{upper}")
    }
}

pub fn is_valid_referral_code_format(code: &str) -> bool {
    if !code.starts_with(REFERRAL_CODE_PREFIX) {
        return false;
    }
    let body = &code[REFERRAL_CODE_PREFIX.len()..];
    (4..=12).contains(&body.len())
        && body
            .chars()
            .all(|c| c.is_ascii_uppercase() || c.is_ascii_digit())
}

fn generate_code_body() -> String {
    const CHARSET: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let seed = Uuid::new_v4().as_u128();
    let mut out = String::with_capacity(CODE_BODY_LEN);
    let mut n = seed;
    for _ in 0..CODE_BODY_LEN {
        let idx = (n % CHARSET.len() as u128) as usize;
        out.push(CHARSET[idx] as char);
        n /= CHARSET.len() as u128;
        if n == 0 {
            n = Uuid::new_v4().as_u128();
        }
    }
    out
}

pub async fn generate_unique_referral_code(pool: &PgPool) -> Result<String, sqlx::Error> {
    for _ in 0..12 {
        let candidate = format!("{REFERRAL_CODE_PREFIX}{}", generate_code_body());
        let exists: Option<(i32,)> = sqlx::query_as(
            "SELECT 1 FROM referral_codes WHERE code = $1 UNION SELECT 1 FROM users WHERE referral_code = $1 LIMIT 1",
        )
        .bind(&candidate)
        .fetch_optional(pool)
        .await?;
        if exists.is_none() {
            return Ok(candidate);
        }
    }
    Err(sqlx::Error::Protocol("referral_code_generate_exhausted".into()))
}

pub async fn validate_referral_code(pool: &PgPool, raw: &str) -> ReferralValidateOk {
    let code = normalize_referral_code(raw);
    if code.is_empty() || !is_valid_referral_code_format(&code) {
        return ReferralValidateOk {
            valid: false,
            code,
            code_type: None,
            label: None,
            is_active: None,
            reason: Some(ReferralRejectReason::InvalidFormat.as_key().to_string()),
        };
    }
    let row: Option<ReferralCodeRow> = sqlx::query_as(
        r#"
        SELECT id, code, code_type, owner_user_id, region_iso, label, is_active, max_uses, use_count, created_at, updated_at
        FROM referral_codes
        WHERE code = $1
        "#,
    )
    .bind(&code)
    .fetch_optional(pool)
    .await
    .unwrap_or(None);

    let Some(row) = row else {
        return ReferralValidateOk {
            valid: false,
            code,
            code_type: None,
            label: None,
            is_active: None,
            reason: Some(ReferralRejectReason::NotFound.as_key().to_string()),
        };
    };
    if !row.is_active {
        return ReferralValidateOk {
            valid: false,
            code: row.code,
            code_type: Some(row.code_type),
            label: row.label,
            is_active: Some(false),
            reason: Some(ReferralRejectReason::Inactive.as_key().to_string()),
        };
    }
    if row.max_uses.is_some_and(|m| row.use_count >= m) {
        return ReferralValidateOk {
            valid: false,
            code: row.code,
            code_type: Some(row.code_type),
            label: row.label,
            is_active: Some(true),
            reason: Some(ReferralRejectReason::Exhausted.as_key().to_string()),
        };
    }
    ReferralValidateOk {
        valid: true,
        code: row.code,
        code_type: Some(row.code_type),
        label: row.label,
        is_active: Some(true),
        reason: None,
    }
}

async fn load_referral_code_row(pool: &PgPool, code: &str) -> Result<Option<ReferralCodeRow>, sqlx::Error> {
    sqlx::query_as(
        r#"
        SELECT id, code, code_type, owner_user_id, region_iso, label, is_active, max_uses, use_count, created_at, updated_at
        FROM referral_codes
        WHERE code = $1
        "#,
    )
    .bind(code)
    .fetch_optional(pool)
    .await
}

async fn referrer_hourly_bind_count(pool: &PgPool, referrer_user_id: Uuid) -> Result<i64, sqlx::Error> {
    let row: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*)::bigint
        FROM referral_events
        WHERE referrer_user_id = $1
          AND event_type = 'register'
          AND created_at > now() - interval '1 hour'
        "#,
    )
    .bind(referrer_user_id)
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}

async fn record_fraud_signal(
    pool: &PgPool,
    subject_user_id: Uuid,
    signal_type: &str,
    risk_level: &str,
    payload: serde_json::Value,
) {
    let _ = sqlx::query(
        r#"
        INSERT INTO growth_fraud_signals (subject_user_id, signal_type, risk_level, payload)
        VALUES ($1, $2, $3, $4)
        "#,
    )
    .bind(subject_user_id)
    .bind(signal_type)
    .bind(risk_level)
    .bind(payload)
    .execute(pool)
    .await;
}

pub async fn precheck_referral_for_register(
    pool: &PgPool,
    raw: &str,
) -> Result<(ReferralCodeRow, Uuid), ReferralRejectReason> {
    let code = normalize_referral_code(raw);
    if !is_valid_referral_code_format(&code) {
        return Err(ReferralRejectReason::InvalidFormat);
    }
    let row = load_referral_code_row(pool, &code)
        .await
        .map_err(|_| ReferralRejectReason::NotFound)?;
    let Some(row) = row else {
        return Err(ReferralRejectReason::NotFound);
    };
    if !row.is_active {
        return Err(ReferralRejectReason::Inactive);
    }
    if row.max_uses.is_some_and(|m| row.use_count >= m) {
        return Err(ReferralRejectReason::Exhausted);
    }
    let referrer_user_id = row.owner_user_id.ok_or(ReferralRejectReason::NotFound)?;
    let hourly = referrer_hourly_bind_count(pool, referrer_user_id)
        .await
        .unwrap_or(0);
    if hourly >= REFERRAL_HOURLY_BIND_LIMIT {
        record_fraud_signal(
            pool,
            referrer_user_id,
            "referral_hourly_rate_limit",
            "HIGH",
            serde_json::json!({ "code": code, "hourly_count": hourly }),
        )
        .await;
        return Err(ReferralRejectReason::RateLimited);
    }
    Ok((row, referrer_user_id))
}

pub async fn bind_referral_on_register(
    pool: &PgPool,
    referred_user_id: Uuid,
    raw: &str,
) -> Result<ReferralBindResult, ReferralRejectReason> {
    let (row, referrer_user_id) = precheck_referral_for_register(pool, raw).await?;
    if referrer_user_id == referred_user_id {
        return Err(ReferralRejectReason::SelfReferral);
    }
    let already: Option<(Uuid,)> = sqlx::query_as(
        "SELECT referred_by_user_id FROM users WHERE id = $1 AND referred_by_user_id IS NOT NULL",
    )
    .bind(referred_user_id)
    .fetch_optional(pool)
    .await
    .unwrap_or(None);
    if already.is_some() {
        return Err(ReferralRejectReason::AlreadyReferred);
    }

    let mut tx = pool.begin().await.map_err(|_| ReferralRejectReason::NotFound)?;

    let updated = sqlx::query(
        r#"
        UPDATE users
        SET referred_by_user_id = $2, updated_at = now()
        WHERE id = $1 AND referred_by_user_id IS NULL
        "#,
    )
    .bind(referred_user_id)
    .bind(referrer_user_id)
    .execute(&mut *tx)
    .await
    .map_err(|_| ReferralRejectReason::NotFound)?;
    if updated.rows_affected() == 0 {
        let _ = tx.rollback().await;
        return Err(ReferralRejectReason::AlreadyReferred);
    }

    let idempotency_key = format!("register:{referred_user_id}");
    let event_id = Uuid::new_v4();
    sqlx::query(
        r#"
        INSERT INTO referral_events (
            id, referrer_user_id, referred_user_id, referral_code_id, event_type,
            points_awarded_referrer, points_awarded_referred, idempotency_key
        )
        VALUES ($1, $2, $3, $4, 'register', 0, 0, $5)
        "#,
    )
    .bind(event_id)
    .bind(referrer_user_id)
    .bind(referred_user_id)
    .bind(row.id)
    .bind(&idempotency_key)
    .execute(&mut *tx)
    .await
    .map_err(|_| ReferralRejectReason::NotFound)?;

    sqlx::query(
        r#"
        UPDATE referral_codes
        SET use_count = use_count + 1, updated_at = now()
        WHERE id = $1
        "#,
    )
    .bind(row.id)
    .execute(&mut *tx)
    .await
    .map_err(|_| ReferralRejectReason::NotFound)?;

    tx.commit().await.map_err(|_| ReferralRejectReason::NotFound)?;

    Ok(ReferralBindResult {
        referral_code: row.code,
        referrer_user_id,
        referral_event_id: event_id,
    })
}

pub async fn ensure_user_referral_code(pool: &PgPool, user_id: Uuid) -> Result<String, sqlx::Error> {
    let existing: Option<(String,)> =
        sqlx::query_as("SELECT referral_code FROM users WHERE id = $1 AND referral_code IS NOT NULL")
            .bind(user_id)
            .fetch_optional(pool)
            .await?;
    if let Some((code,)) = existing {
        return Ok(code);
    }
    for _ in 0..12 {
        let candidate = generate_unique_referral_code(pool).await?;
        let updated = sqlx::query(
            r#"
            UPDATE users
            SET referral_code = $2, updated_at = now()
            WHERE id = $1 AND referral_code IS NULL
            "#,
        )
        .bind(user_id)
        .bind(&candidate)
        .execute(pool)
        .await?;
        if updated.rows_affected() > 0 {
            let _ = sqlx::query(
                r#"
                INSERT INTO referral_codes (code, code_type, owner_user_id, label, is_active)
                VALUES ($1, 'user', $2, 'auto-generated', true)
                ON CONFLICT (code) DO NOTHING
                "#,
            )
            .bind(&candidate)
            .bind(user_id)
            .execute(pool)
            .await;
            return Ok(candidate);
        }
        let again: Option<(String,)> =
            sqlx::query_as("SELECT referral_code FROM users WHERE id = $1 AND referral_code IS NOT NULL")
                .bind(user_id)
                .fetch_optional(pool)
                .await?;
        if let Some((code,)) = again {
            return Ok(code);
        }
    }
    Err(sqlx::Error::Protocol("user_referral_code_assign_failed".into()))
}

pub async fn list_referral_codes_admin(
    pool: &PgPool,
    is_active: Option<bool>,
    code_type: Option<&str>,
    limit: i64,
) -> Result<Vec<ReferralCodeRow>, sqlx::Error> {
    let limit = limit.clamp(1, 500);
    sqlx::query_as(
        r#"
        SELECT id, code, code_type, owner_user_id, region_iso, label, is_active, max_uses, use_count, created_at, updated_at
        FROM referral_codes
        WHERE ($1::bool IS NULL OR is_active = $1)
          AND ($2::text IS NULL OR code_type = $2)
        ORDER BY created_at DESC
        LIMIT $3
        "#,
    )
    .bind(is_active)
    .bind(code_type)
    .bind(limit)
    .fetch_all(pool)
    .await
}

#[derive(Debug)]
pub struct CreateReferralCodeInput {
    pub code: Option<String>,
    pub code_type: String,
    pub owner_user_id: Option<Uuid>,
    pub region_iso: Option<String>,
    pub label: Option<String>,
    pub max_uses: Option<i32>,
    pub created_by: Option<Uuid>,
}

pub async fn create_referral_code_admin(
    pool: &PgPool,
    input: CreateReferralCodeInput,
) -> Result<ReferralCodeRow, sqlx::Error> {
    let code = match input.code.as_deref().map(normalize_referral_code).filter(|c| !c.is_empty()) {
        Some(c) if is_valid_referral_code_format(&c) => c,
        Some(_) => {
            return Err(sqlx::Error::Protocol("referral_code_invalid".into()));
        }
        None => generate_unique_referral_code(pool).await?,
    };
    sqlx::query_as(
        r#"
        INSERT INTO referral_codes (
            code, code_type, owner_user_id, region_iso, label, max_uses, created_by, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, true)
        RETURNING id, code, code_type, owner_user_id, region_iso, label, is_active, max_uses, use_count, created_at, updated_at
        "#,
    )
    .bind(&code)
    .bind(&input.code_type)
    .bind(input.owner_user_id)
    .bind(input.region_iso.as_deref())
    .bind(input.label.as_deref())
    .bind(input.max_uses)
    .bind(input.created_by)
    .fetch_one(pool)
    .await
}

#[derive(Debug, Default)]
pub struct PatchReferralCodeInput {
    pub is_active: Option<bool>,
    pub label: Option<String>,
    pub max_uses: Option<i32>,
}

pub async fn patch_referral_code_admin(
    pool: &PgPool,
    id: Uuid,
    input: PatchReferralCodeInput,
) -> Result<Option<ReferralCodeRow>, sqlx::Error> {
    sqlx::query_as(
        r#"
        UPDATE referral_codes
        SET
            is_active = COALESCE($2, is_active),
            label = COALESCE($3, label),
            max_uses = COALESCE($4, max_uses),
            updated_at = now()
        WHERE id = $1
        RETURNING id, code, code_type, owner_user_id, region_iso, label, is_active, max_uses, use_count, created_at, updated_at
        "#,
    )
    .bind(id)
    .bind(input.is_active)
    .bind(input.label.as_deref())
    .bind(input.max_uses)
    .fetch_optional(pool)
    .await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_adds_prefix_and_uppercases() {
        assert_eq!(normalize_referral_code("kol888"), "TT-KOL888");
        assert_eq!(normalize_referral_code("tt-abc123"), "TT-ABC123");
    }

    #[test]
    fn valid_format_accepts_tt_prefix_body() {
        assert!(is_valid_referral_code_format("TT-ABC123"));
        assert!(is_valid_referral_code_format("TT-KOL888"));
        assert!(!is_valid_referral_code_format("TT-AB"));
        assert!(!is_valid_referral_code_format("XX-ABC123"));
    }
}
