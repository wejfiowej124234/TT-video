//! G-S5 · Growth anti-fraud & reward ops（102 §8 · Admin 最小闭环）

use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::PgPool;
use uuid::Uuid;

pub const USER_FRAUD_STATUSES: &[&str] = &[
    "normal",
    "points_frozen",
    "airdrop_ineligible",
    "banned",
];

pub const LEDGER_FRAUD_MARKS: &[&str] = &["cleared", "suspect", "flagged"];

#[derive(Debug, Clone, Serialize)]
pub struct GrowthFraudRuleRow {
    pub id: &'static str,
    pub signal_type: &'static str,
    pub risk_level: &'static str,
    pub description: &'static str,
    pub action: &'static str,
    pub source: &'static str,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct GrowthFraudSignalRow {
    pub id: Uuid,
    pub subject_user_id: Uuid,
    pub signal_type: String,
    pub risk_level: String,
    pub payload: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct GrowthFraudUserRow {
    pub user_id: Uuid,
    pub email: Option<String>,
    pub referral_code: Option<String>,
    pub growth_fraud_status: String,
    pub growth_points: i64,
    pub signal_count: i64,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct GrowthFraudCaseRow {
    pub id: Uuid,
    pub subject_user_id: Uuid,
    pub status: String,
    pub resolution: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub fn growth_fraud_rules_catalog() -> Vec<GrowthFraudRuleRow> {
    vec![
        GrowthFraudRuleRow {
            id: "referral_hourly_rate_limit",
            signal_type: "referral_hourly_rate_limit",
            risk_level: "HIGH",
            description: "Referrer exceeds hourly bind limit (50/h)",
            action: "Reject bind + record signal",
            source: "G-S1 growth_referral",
        },
        GrowthFraudRuleRow {
            id: "referral_self_forbidden",
            signal_type: "referral_self_forbidden",
            risk_level: "HIGH",
            description: "Self-referral attempt at register",
            action: "Reject bind",
            source: "G-S1 register",
        },
        GrowthFraudRuleRow {
            id: "points_frozen_skip_award",
            signal_type: "points_frozen",
            risk_level: "HIGH",
            description: "User growth_fraud_status blocks new awards",
            action: "Observer skips award (SkippedFrozen)",
            source: "G-S2 growth_ledger",
        },
        GrowthFraudRuleRow {
            id: "ledger_drift",
            signal_type: "ledger_cache_drift",
            risk_level: "MEDIUM",
            description: "users.growth_points ≠ SUM(ledger)",
            action: "Admin reconcile fix",
            source: "G-S5 reward ops",
        },
    ]
}

pub fn is_valid_user_fraud_status(status: &str) -> bool {
    USER_FRAUD_STATUSES.contains(&status)
}

pub fn is_valid_ledger_fraud_mark(status: &str) -> bool {
    LEDGER_FRAUD_MARKS.contains(&status)
}

pub async fn list_growth_fraud_signals(
    pool: &PgPool,
    subject_user_id: Option<Uuid>,
    risk_level: Option<&str>,
    limit: i64,
) -> Result<Vec<GrowthFraudSignalRow>, sqlx::Error> {
    let limit = limit.clamp(1, 200);
    sqlx::query_as(
        r#"
        SELECT id, subject_user_id, signal_type, risk_level, payload, created_at
        FROM growth_fraud_signals
        WHERE ($1::uuid IS NULL OR subject_user_id = $1)
          AND ($2::text IS NULL OR risk_level = $2)
        ORDER BY created_at DESC
        LIMIT $3
        "#,
    )
    .bind(subject_user_id)
    .bind(risk_level)
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub async fn list_growth_fraud_users(
    pool: &PgPool,
    fraud_status: Option<&str>,
    limit: i64,
) -> Result<Vec<GrowthFraudUserRow>, sqlx::Error> {
    let limit = limit.clamp(1, 200);
    sqlx::query_as(
        r#"
        SELECT
            u.id AS user_id,
            u.email,
            u.referral_code,
            u.growth_fraud_status,
            u.growth_points,
            COALESCE(s.cnt, 0)::bigint AS signal_count
        FROM users u
        LEFT JOIN (
            SELECT subject_user_id, COUNT(*)::bigint AS cnt
            FROM growth_fraud_signals
            GROUP BY subject_user_id
        ) s ON s.subject_user_id = u.id
        WHERE ($1::text IS NULL OR u.growth_fraud_status = $1)
          AND (
            $1::text IS NOT NULL
            OR u.growth_fraud_status <> 'normal'
            OR COALESCE(s.cnt, 0) > 0
          )
        ORDER BY u.growth_fraud_status DESC, COALESCE(s.cnt, 0) DESC, u.updated_at DESC
        LIMIT $2
        "#,
    )
    .bind(fraud_status)
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub async fn list_open_fraud_cases(
    pool: &PgPool,
    limit: i64,
) -> Result<Vec<GrowthFraudCaseRow>, sqlx::Error> {
    let limit = limit.clamp(1, 100);
    sqlx::query_as(
        r#"
        SELECT id, subject_user_id, status, resolution, created_at, updated_at
        FROM growth_fraud_cases
        WHERE status = 'open'
        ORDER BY created_at DESC
        LIMIT $1
        "#,
    )
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub async fn patch_user_growth_fraud_status(
    pool: &PgPool,
    user_id: Uuid,
    status: &str,
    disable_referral_codes: bool,
) -> Result<Option<GrowthFraudUserRow>, sqlx::Error> {
    if !is_valid_user_fraud_status(status) {
        return Err(sqlx::Error::Protocol("invalid_growth_fraud_status".into()));
    }
    let mut tx = pool.begin().await?;

    let updated = sqlx::query(
        r#"
        UPDATE users
        SET growth_fraud_status = $2, updated_at = now()
        WHERE id = $1
        "#,
    )
    .bind(user_id)
    .bind(status)
    .execute(&mut *tx)
    .await?;
    if updated.rows_affected() == 0 {
        let _ = tx.rollback().await;
        return Ok(None);
    }

    if matches!(status, "points_frozen" | "banned" | "airdrop_ineligible") {
        sqlx::query(
            r#"
            INSERT INTO growth_fraud_cases (subject_user_id, status)
            VALUES ($1, 'open')
            "#,
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await?;
    } else if status == "normal" {
        sqlx::query(
            r#"
            UPDATE growth_fraud_cases
            SET status = 'resolved', resolution = 'admin_unfreeze', updated_at = now()
            WHERE subject_user_id = $1 AND status = 'open'
            "#,
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await?;
    }

    if disable_referral_codes {
        sqlx::query(
            r#"
            UPDATE referral_codes
            SET is_active = false, updated_at = now()
            WHERE owner_user_id = $1
            "#,
        )
        .bind(user_id)
        .execute(&mut *tx)
        .await?;
    }

    tx.commit().await?;

    let rows = list_growth_fraud_users(pool, None, 200).await?;
    Ok(rows.into_iter().find(|r| r.user_id == user_id))
}

pub async fn patch_ledger_fraud_status(
    pool: &PgPool,
    ledger_id: Uuid,
    fraud_status: &str,
) -> Result<bool, sqlx::Error> {
    if !is_valid_ledger_fraud_mark(fraud_status) {
        return Err(sqlx::Error::Protocol("invalid_ledger_fraud_status".into()));
    }
    let result = sqlx::query(
        r#"
        UPDATE growth_point_ledger
        SET fraud_status = $2
        WHERE id = $1
        "#,
    )
    .bind(ledger_id)
    .bind(fraud_status)
    .execute(pool)
    .await?;
    Ok(result.rows_affected() > 0)
}

pub async fn fix_user_growth_points_drift(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<super::GrowthReconcileRow, sqlx::Error> {
    sqlx::query(
        r#"
        UPDATE users u
        SET growth_points = COALESCE((
            SELECT SUM(l.points)::bigint FROM growth_point_ledger l WHERE l.user_id = u.id
        ), 0),
        updated_at = now()
        WHERE u.id = $1
        "#,
    )
    .bind(user_id)
    .execute(pool)
    .await?;
    super::reconcile_user_growth_points(pool, user_id).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn user_fraud_status_validation() {
        assert!(is_valid_user_fraud_status("points_frozen"));
        assert!(!is_valid_user_fraud_status("invalid"));
    }

    #[test]
    fn rules_catalog_non_empty() {
        assert!(!growth_fraud_rules_catalog().is_empty());
    }
}
