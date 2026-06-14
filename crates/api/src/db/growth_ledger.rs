//! G-S2 · Growth point ledger（102 §5 · append-only SSOT）

use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct GrowthLedgerRow {
    pub id: Uuid,
    pub user_id: Uuid,
    pub source: String,
    pub points: i64,
    pub base_points: Option<i64>,
    pub early_bird_multiplier: Option<f64>,
    pub early_bird_stage: Option<i32>,
    pub related_user_id: Option<Uuid>,
    pub related_entity_type: Option<String>,
    pub related_entity_id: Option<Uuid>,
    pub idempotency_key: String,
    pub fraud_status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AwardOutcomeKind {
    Awarded,
    Duplicate,
    SkippedFrozen,
    SkippedDisabled,
    SkippedZeroPoints,
}

#[derive(Debug, Clone)]
pub struct AwardOutcome {
    pub kind: AwardOutcomeKind,
    pub ledger_id: Option<Uuid>,
    pub points: i64,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct GrowthReconcileRow {
    pub user_id: Uuid,
    pub cached_points: i64,
    pub ledger_sum: i64,
    pub drift: i64,
}

pub async fn user_growth_fraud_status(pool: &PgPool, user_id: Uuid) -> Result<String, sqlx::Error> {
    let row: (String,) = sqlx::query_as("SELECT growth_fraud_status FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_one(pool)
        .await?;
    Ok(row.0)
}

pub async fn referred_by_user_id(pool: &PgPool, user_id: Uuid) -> Result<Option<Uuid>, sqlx::Error> {
    let row: Option<(Option<Uuid>,)> =
        sqlx::query_as("SELECT referred_by_user_id FROM users WHERE id = $1")
            .bind(user_id)
            .fetch_optional(pool)
            .await?;
    Ok(row.and_then(|(r,)| r))
}

/// 幂等发积分：`idempotency_key` UNIQUE · 更新 `users.growth_points` 物化缓存。
pub async fn award_growth_points(
    pool: &PgPool,
    user_id: Uuid,
    source: &str,
    base_points: i64,
    idempotency_key: &str,
    related_user_id: Option<Uuid>,
    related_entity_type: Option<&str>,
    related_entity_id: Option<Uuid>,
) -> Result<AwardOutcome, sqlx::Error> {
    if base_points <= 0 {
        return Ok(AwardOutcome {
            kind: AwardOutcomeKind::SkippedZeroPoints,
            ledger_id: None,
            points: 0,
        });
    }

    if let Some(existing) = find_ledger_by_idempotency_key(pool, idempotency_key).await? {
        return Ok(AwardOutcome {
            kind: AwardOutcomeKind::Duplicate,
            ledger_id: Some(existing.id),
            points: existing.points,
        });
    }

    let fraud_status = user_growth_fraud_status(pool, user_id).await?;
    if matches!(
        fraud_status.as_str(),
        "points_frozen" | "banned" | "airdrop_ineligible"
    ) {
        return Ok(AwardOutcome {
            kind: AwardOutcomeKind::SkippedFrozen,
            ledger_id: None,
            points: 0,
        });
    }

    let (early_bird_stage, early_bird_multiplier) =
        crate::db::resolve_early_bird_for_award(pool, user_id).await?;
    let points = crate::db::apply_early_bird_multiplier(base_points, early_bird_multiplier);
    let ledger_id = Uuid::new_v4();
    let mut tx = pool.begin().await?;

    let inserted = sqlx::query(
        r#"
        INSERT INTO growth_point_ledger (
            id, user_id, source, points, base_points, early_bird_multiplier, early_bird_stage,
            related_user_id, related_entity_type, related_entity_id, idempotency_key, fraud_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'cleared')
        ON CONFLICT (idempotency_key) DO NOTHING
        "#,
    )
    .bind(ledger_id)
    .bind(user_id)
    .bind(source)
    .bind(points)
    .bind(base_points)
    .bind(early_bird_multiplier)
    .bind(early_bird_stage)
    .bind(related_user_id)
    .bind(related_entity_type)
    .bind(related_entity_id)
    .bind(idempotency_key)
    .execute(&mut *tx)
    .await?;

    if inserted.rows_affected() == 0 {
        tx.rollback().await?;
        if let Some(existing) = find_ledger_by_idempotency_key(pool, idempotency_key).await? {
            return Ok(AwardOutcome {
                kind: AwardOutcomeKind::Duplicate,
                ledger_id: Some(existing.id),
                points: existing.points,
            });
        }
        return Ok(AwardOutcome {
            kind: AwardOutcomeKind::Duplicate,
            ledger_id: None,
            points: 0,
        });
    }

    sqlx::query(
        r#"
        UPDATE users
        SET growth_points = growth_points + $2, updated_at = now()
        WHERE id = $1
        "#,
    )
    .bind(user_id)
    .bind(points)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok(AwardOutcome {
        kind: AwardOutcomeKind::Awarded,
        ledger_id: Some(ledger_id),
        points,
    })
}

async fn find_ledger_by_idempotency_key(
    pool: &PgPool,
    idempotency_key: &str,
) -> Result<Option<GrowthLedgerRow>, sqlx::Error> {
    sqlx::query_as(
        r#"
        SELECT id, user_id, source, points, base_points,
               early_bird_multiplier::float8 AS early_bird_multiplier,
               early_bird_stage,
               related_user_id, related_entity_type, related_entity_id, idempotency_key, fraud_status, created_at
        FROM growth_point_ledger
        WHERE idempotency_key = $1
        "#,
    )
    .bind(idempotency_key)
    .fetch_optional(pool)
    .await
}

pub async fn list_growth_ledger_admin(
    pool: &PgPool,
    user_id: Option<Uuid>,
    source: Option<&str>,
    fraud_status: Option<&str>,
    limit: i64,
) -> Result<Vec<GrowthLedgerRow>, sqlx::Error> {
    let limit = limit.clamp(1, 500);
    sqlx::query_as(
        r#"
        SELECT id, user_id, source, points, base_points,
               early_bird_multiplier::float8 AS early_bird_multiplier,
               early_bird_stage,
               related_user_id, related_entity_type, related_entity_id, idempotency_key, fraud_status, created_at
        FROM growth_point_ledger
        WHERE ($1::uuid IS NULL OR user_id = $1)
          AND ($2::text IS NULL OR source = $2)
          AND ($3::text IS NULL OR fraud_status = $3)
        ORDER BY created_at DESC
        LIMIT $4
        "#,
    )
    .bind(user_id)
    .bind(source)
    .bind(fraud_status)
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub async fn reconcile_user_growth_points(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<GrowthReconcileRow, sqlx::Error> {
    let cached: (i64,) = sqlx::query_as("SELECT growth_points FROM users WHERE id = $1")
        .bind(user_id)
        .fetch_one(pool)
        .await?;
    let sum: (Option<i64>,) = sqlx::query_as(
        "SELECT COALESCE(SUM(points), 0)::bigint FROM growth_point_ledger WHERE user_id = $1",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    let ledger_sum = sum.0.unwrap_or(0);
    Ok(GrowthReconcileRow {
        user_id,
        cached_points: cached.0,
        ledger_sum,
        drift: cached.0 - ledger_sum,
    })
}

pub async fn list_growth_points_drift(
    pool: &PgPool,
    limit: i64,
) -> Result<Vec<GrowthReconcileRow>, sqlx::Error> {
    let limit = limit.clamp(1, 500);
    sqlx::query_as(
        r#"
        SELECT u.id AS user_id,
               u.growth_points AS cached_points,
               COALESCE(SUM(l.points), 0)::bigint AS ledger_sum,
               (u.growth_points - COALESCE(SUM(l.points), 0))::bigint AS drift
        FROM users u
        LEFT JOIN growth_point_ledger l ON l.user_id = u.id
        GROUP BY u.id, u.growth_points
        HAVING u.growth_points <> COALESCE(SUM(l.points), 0)
        ORDER BY ABS(u.growth_points - COALESCE(SUM(l.points), 0)) DESC
        LIMIT $1
        "#,
    )
    .bind(limit)
    .fetch_all(pool)
    .await
}

pub async fn count_user_posts(pool: &PgPool, user_id: Uuid) -> Result<i64, sqlx::Error> {
    let row: (i64,) = sqlx::query_as(
        "SELECT COUNT(*)::bigint FROM community_posts WHERE user_id = $1",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}

pub async fn count_completed_orders_for_tourist(
    pool: &PgPool,
    tourist_id: Uuid,
) -> Result<i64, sqlx::Error> {
    let row: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*)::bigint FROM orders
        WHERE tourist_id = $1 AND status = 'completed'
        "#,
    )
    .bind(tourist_id)
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}

pub async fn count_completed_escrow_orders_for_tourist(
    pool: &PgPool,
    tourist_id: Uuid,
) -> Result<i64, sqlx::Error> {
    let row: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*)::bigint FROM orders
        WHERE tourist_id = $1 AND status = 'completed'
          AND (escrowed_at IS NOT NULL OR NULLIF(TRIM(COALESCE(escrow_address, '')), '') IS NOT NULL)
        "#,
    )
    .bind(tourist_id)
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn award_outcome_kinds_distinct() {
        assert_ne!(AwardOutcomeKind::Awarded, AwardOutcomeKind::Duplicate);
    }
}
