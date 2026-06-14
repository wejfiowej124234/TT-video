//! G-S3 · Early Bird 注册序号 · Stage 倍率（102 §6）

use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::PgPool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct EarlyBirdStageRow {
    pub id: Uuid,
    pub stage_number: i32,
    pub user_rank_from: i32,
    pub user_rank_to: Option<i32>,
    pub multiplier: f64,
    pub is_active: bool,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize)]
pub struct EarlyBirdAssignResult {
    pub registration_rank: i64,
    pub stage_number: Option<i32>,
    pub multiplier: f64,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct EarlyBirdStageStats {
    pub stage_number: i32,
    pub user_count: i64,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct EarlyBirdReconcileSummary {
    pub next_rank: i64,
    pub users_with_rank: i64,
    pub users_with_stage: i64,
    pub stage_mismatch_count: i64,
}

pub fn early_bird_enabled() -> bool {
    match std::env::var("TRAVELTRUST_GROWTH_EARLY_BIRD")
        .ok()
        .as_deref()
        .map(str::trim)
    {
        Some("0") | Some("false") | Some("off") => false,
        _ => true,
    }
}

pub fn resolve_stage_for_rank(
    stages: &[EarlyBirdStageRow],
    rank: i64,
) -> (Option<i32>, f64) {
    for s in stages.iter().filter(|s| s.is_active) {
        let from = i64::from(s.user_rank_from);
        let to_ok = s
            .user_rank_to
            .map(|t| rank <= i64::from(t))
            .unwrap_or(true);
        if rank >= from && to_ok {
            return (Some(s.stage_number), s.multiplier);
        }
    }
    (None, 1.0)
}

pub fn apply_early_bird_multiplier(base_points: i64, multiplier: f64) -> i64 {
    if multiplier <= 0.0 || !multiplier.is_finite() {
        return base_points;
    }
    ((base_points as f64) * multiplier).round() as i64
}

pub async fn list_early_bird_stages(pool: &PgPool) -> Result<Vec<EarlyBirdStageRow>, sqlx::Error> {
    sqlx::query_as(
        r#"
        SELECT id, stage_number, user_rank_from, user_rank_to,
               multiplier::float8 AS multiplier, is_active, updated_at
        FROM early_bird_stages
        ORDER BY stage_number ASC
        "#,
    )
    .fetch_all(pool)
    .await
}

pub async fn resolve_early_bird_for_award(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<(Option<i32>, f64), sqlx::Error> {
    if !early_bird_enabled() {
        return Ok((None, 1.0));
    }
    let row: Option<(Option<i32>,)> =
        sqlx::query_as("SELECT early_bird_stage FROM users WHERE id = $1")
            .bind(user_id)
            .fetch_optional(pool)
            .await?;
    let Some(stage_num) = row.and_then(|(s,)| s) else {
        return Ok((None, 1.0));
    };
    let mult: Option<(f64,)> = sqlx::query_as(
        r#"
        SELECT multiplier::float8
        FROM early_bird_stages
        WHERE stage_number = $1 AND is_active = true
        "#,
    )
    .bind(stage_num)
    .fetch_optional(pool)
    .await?;
    Ok((
        Some(stage_num),
        mult.map(|(m,)| m).unwrap_or(1.0),
    ))
}

/// 注册成功后原子分配全局序号与 `users.early_bird_stage`（102 §6.3）。
pub async fn assign_early_bird_on_register(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<EarlyBirdAssignResult, sqlx::Error> {
    if !early_bird_enabled() {
        return Ok(EarlyBirdAssignResult {
            registration_rank: 0,
            stage_number: None,
            multiplier: 1.0,
        });
    }

    let stages = list_early_bird_stages(pool).await?;
    let mut tx = pool.begin().await?;

    let rank_row: (i64,) = sqlx::query_as(
        r#"
        UPDATE growth_registration_seq
        SET next_rank = next_rank + 1
        WHERE id = 1
        RETURNING next_rank - 1
        "#,
    )
    .fetch_one(&mut *tx)
    .await?;
    let registration_rank = rank_row.0;
    let (stage_number, multiplier) = resolve_stage_for_rank(&stages, registration_rank);

    sqlx::query(
        r#"
        UPDATE users
        SET growth_registration_rank = $2,
            early_bird_stage = $3,
            updated_at = now()
        WHERE id = $1
          AND growth_registration_rank IS NULL
        "#,
    )
    .bind(user_id)
    .bind(registration_rank)
    .bind(stage_number)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;

    Ok(EarlyBirdAssignResult {
        registration_rank,
        stage_number,
        multiplier,
    })
}

#[derive(Debug, Default)]
pub struct PatchEarlyBirdStageInput {
    pub is_active: Option<bool>,
    pub user_rank_from: Option<i32>,
    pub user_rank_to: Option<i32>,
    pub multiplier: Option<f64>,
}

pub async fn patch_early_bird_stage_admin(
    pool: &PgPool,
    stage_number: i32,
    input: PatchEarlyBirdStageInput,
) -> Result<Option<EarlyBirdStageRow>, sqlx::Error> {
    sqlx::query_as(
        r#"
        UPDATE early_bird_stages
        SET
            is_active = COALESCE($2, is_active),
            user_rank_from = COALESCE($3, user_rank_from),
            user_rank_to = COALESCE($4, user_rank_to),
            multiplier = COALESCE($5, multiplier),
            updated_at = now()
        WHERE stage_number = $1
        RETURNING id, stage_number, user_rank_from, user_rank_to,
                  multiplier::float8 AS multiplier, is_active, updated_at
        "#,
    )
    .bind(stage_number)
    .bind(input.is_active)
    .bind(input.user_rank_from)
    .bind(input.user_rank_to)
    .bind(input.multiplier)
    .fetch_optional(pool)
    .await
}

pub async fn early_bird_stage_user_counts(
    pool: &PgPool,
) -> Result<Vec<EarlyBirdStageStats>, sqlx::Error> {
    sqlx::query_as(
        r#"
        SELECT early_bird_stage AS stage_number, COUNT(*)::bigint AS user_count
        FROM users
        WHERE early_bird_stage IS NOT NULL
        GROUP BY early_bird_stage
        ORDER BY early_bird_stage ASC
        "#,
    )
    .fetch_all(pool)
    .await
}

pub async fn early_bird_reconcile_summary(pool: &PgPool) -> Result<EarlyBirdReconcileSummary, sqlx::Error> {
    let next: (i64,) = sqlx::query_as(
        "SELECT next_rank FROM growth_registration_seq WHERE id = 1",
    )
    .fetch_one(pool)
    .await?;

    let counts: (i64, i64, i64) = sqlx::query_as(
        r#"
        SELECT
            COUNT(*) FILTER (WHERE growth_registration_rank IS NOT NULL)::bigint,
            COUNT(*) FILTER (WHERE early_bird_stage IS NOT NULL)::bigint,
            COUNT(*) FILTER (
                WHERE growth_registration_rank IS NOT NULL
                  AND early_bird_stage IS NULL
            )::bigint
        FROM users
        "#,
    )
    .fetch_one(pool)
    .await?;

    Ok(EarlyBirdReconcileSummary {
        next_rank: next.0,
        users_with_rank: counts.0,
        users_with_stage: counts.1,
        stage_mismatch_count: counts.2,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_stages() -> Vec<EarlyBirdStageRow> {
        vec![
            EarlyBirdStageRow {
                id: Uuid::new_v4(),
                stage_number: 1,
                user_rank_from: 1,
                user_rank_to: Some(1000),
                multiplier: 3.0,
                is_active: true,
                updated_at: Utc::now(),
            },
            EarlyBirdStageRow {
                id: Uuid::new_v4(),
                stage_number: 2,
                user_rank_from: 1001,
                user_rank_to: Some(5000),
                multiplier: 2.0,
                is_active: true,
                updated_at: Utc::now(),
            },
        ]
    }

    #[test]
    fn rank_800_is_stage1_3x() {
        let (stage, mult) = resolve_stage_for_rank(&sample_stages(), 800);
        assert_eq!(stage, Some(1));
        assert!((mult - 3.0).abs() < f64::EPSILON);
    }

    #[test]
    fn apply_multiplier_rounds() {
        assert_eq!(apply_early_bird_multiplier(100, 3.0), 300);
    }
}
