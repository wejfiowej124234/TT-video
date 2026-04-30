//! `GET /me` 聚合只读：当配置 `DATABASE_URL` 时从 Postgres 计算，避免多副本 / 运维下
//! **仅内存 hydrate** 与库真值漂移（95 · P1-ME-SSOT）。

use chrono::{DateTime, Datelike, TimeZone, Utc};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

/// 与 `chain_off::me::MeCoreStats` 同形；保持 api crate 内 db → chain_off 单向依赖。
#[derive(Clone, Debug)]
pub struct MeCoreStatsSnapshot {
    pub orders_total: usize,
    pub total_spent: f64,
    pub total_earned: f64,
    pub reviews_count: usize,
    pub orders_guided: usize,
    pub completed_as_guide: usize,
    pub avg_score: Option<f64>,
    pub disputes_resolved: usize,
}

#[derive(Clone, Debug)]
pub struct MeReputationSnapshot {
    pub guide_received_count: usize,
    pub guide_sum_weights: f64,
    pub guide_weighted_avg: Option<f64>,
    pub reviewer_count: usize,
    pub reviewer_sum_weights: f64,
}

#[derive(Clone, Debug)]
pub struct MeAggregatesFromDb {
    pub core: MeCoreStatsSnapshot,
    pub reputation: MeReputationSnapshot,
    pub open_disputes_as_party: usize,
}

/// `OrderState` 终态资金口径，与 `traveltrust_core::OrderState::is_final_financial_state` 一致（小写存库）。
const FINAL_FIN_SQL: &str = "('completed','refunded','partially_refunded','slashed')";

async fn count_orders_as_participant(pool: &PgPool, user_id: Uuid) -> Result<i64, sqlx::Error> {
    let row: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*)::bigint
        FROM orders o
        WHERE o.tourist_id = $1
           OR EXISTS (
                SELECT 1 FROM guides g
                WHERE g.id = o.guide_id AND g.user_id = $1
           )
        "#,
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}

async fn sum_tourist_final_spend(pool: &PgPool, user_id: Uuid) -> Result<f64, sqlx::Error> {
    let q = format!(
        r#"
        SELECT SUM(NULLIF(trim(o.amount), '')::float8)
        FROM orders o
        WHERE o.tourist_id = $1
          AND LOWER(TRIM(o.status)) IN {FIN}
        "#,
        FIN = FINAL_FIN_SQL
    );
    let row: (Option<f64>,) = sqlx::query_as(&q).bind(user_id).fetch_one(pool).await?;
    Ok(row.0.unwrap_or(0.0))
}

async fn sum_guide_final_earned(pool: &PgPool, user_id: Uuid) -> Result<f64, sqlx::Error> {
    let q = format!(
        r#"
        SELECT SUM(NULLIF(trim(o.amount), '')::float8)
        FROM orders o
        INNER JOIN guides g ON g.id = o.guide_id
        WHERE g.user_id = $1
          AND LOWER(TRIM(o.status)) IN {FIN}
        "#,
        FIN = FINAL_FIN_SQL
    );
    let row: (Option<f64>,) = sqlx::query_as(&q).bind(user_id).fetch_one(pool).await?;
    Ok(row.0.unwrap_or(0.0))
}

async fn count_reviewer_reviews(pool: &PgPool, user_id: Uuid) -> Result<i64, sqlx::Error> {
    let row: (i64,) = sqlx::query_as("SELECT COUNT(*)::bigint FROM reviews WHERE reviewer_id = $1")
        .bind(user_id)
        .fetch_one(pool)
        .await?;
    Ok(row.0)
}

async fn count_orders_guided(pool: &PgPool, user_id: Uuid) -> Result<i64, sqlx::Error> {
    let row: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*)::bigint
        FROM orders o
        INNER JOIN guides g ON g.id = o.guide_id
        WHERE g.user_id = $1
        "#,
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}

async fn count_completed_as_guide(pool: &PgPool, user_id: Uuid) -> Result<i64, sqlx::Error> {
    let row: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*)::bigint
        FROM orders o
        INNER JOIN guides g ON g.id = o.guide_id
        WHERE g.user_id = $1 AND LOWER(TRIM(o.status)) = 'completed'
        "#,
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}

async fn guide_weighted_avg_and_counts(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<(usize, f64, Option<f64>), sqlx::Error> {
    let row: (Option<f64>, Option<f64>, i64) = sqlx::query_as(
        r#"
        SELECT
            CASE WHEN SUM(r.weight::float8) > 0 THEN SUM(r.score::float8 * r.weight::float8) / SUM(r.weight::float8) ELSE NULL END,
            COALESCE(SUM(r.weight::float8), 0),
            COUNT(*)::bigint
        FROM reviews r
        WHERE r.reviewee_id = (SELECT id FROM guides WHERE user_id = $1 LIMIT 1)
        "#,
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    let n = row.2.max(0) as usize;
    let sum_w = row.1.unwrap_or(0.0);
    Ok((n, sum_w, row.0))
}

async fn reviewer_sum_weights(pool: &PgPool, user_id: Uuid) -> Result<f64, sqlx::Error> {
    let row: (Option<f64>,) = sqlx::query_as(
        "SELECT COALESCE(SUM(weight::float8), 0) FROM reviews WHERE reviewer_id = $1",
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(row.0.unwrap_or(0.0))
}

async fn count_disputes_as_arbitrator(pool: &PgPool, user_id: Uuid) -> Result<i64, sqlx::Error> {
    let row: (i64,) =
        sqlx::query_as("SELECT COUNT(*)::bigint FROM disputes WHERE arbitrator_id = $1")
            .bind(user_id)
            .fetch_one(pool)
            .await?;
    Ok(row.0)
}

async fn count_open_disputes_as_party(pool: &PgPool, user_id: Uuid) -> Result<i64, sqlx::Error> {
    let row: (i64,) = sqlx::query_as(
        r#"
        SELECT COUNT(*)::bigint
        FROM disputes d
        INNER JOIN orders o ON o.id = d.order_id
        WHERE LOWER(TRIM(d.status)) = 'open'
          AND (
              o.tourist_id = $1
              OR EXISTS (SELECT 1 FROM guides g WHERE g.id = o.guide_id AND g.user_id = $1)
          )
        "#,
    )
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}

/// 供 `GET /me`：与 `chain_off::me::compute_me_core_stats` + 开放争议 + 评价聚合 **同源口径（DB 真值）**。
pub async fn fetch_me_aggregates_from_db(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<MeAggregatesFromDb, sqlx::Error> {
    let (
        orders_total,
        total_spent,
        total_earned,
        reviews_count,
        orders_guided,
        completed_as_guide,
        disputes_resolved,
        open_d,
        (g_n, g_sum_w, g_avg),
        reviewer_sum_w,
    ) = tokio::try_join!(
        count_orders_as_participant(pool, user_id),
        sum_tourist_final_spend(pool, user_id),
        sum_guide_final_earned(pool, user_id),
        count_reviewer_reviews(pool, user_id),
        count_orders_guided(pool, user_id),
        count_completed_as_guide(pool, user_id),
        count_disputes_as_arbitrator(pool, user_id),
        count_open_disputes_as_party(pool, user_id),
        guide_weighted_avg_and_counts(pool, user_id),
        reviewer_sum_weights(pool, user_id),
    )?;

    let core = MeCoreStatsSnapshot {
        orders_total: orders_total.max(0) as usize,
        total_spent,
        total_earned,
        reviews_count: reviews_count.max(0) as usize,
        orders_guided: orders_guided.max(0) as usize,
        completed_as_guide: completed_as_guide.max(0) as usize,
        avg_score: g_avg,
        disputes_resolved: disputes_resolved.max(0) as usize,
    };

    let reputation = MeReputationSnapshot {
        guide_received_count: g_n,
        guide_sum_weights: g_sum_w,
        guide_weighted_avg: g_avg,
        reviewer_count: reviews_count.max(0) as usize,
        reviewer_sum_weights: reviewer_sum_w,
    };

    Ok(MeAggregatesFromDb {
        core,
        reputation,
        open_disputes_as_party: open_d.max(0) as usize,
    })
}

/// B-078：与 `chain_off::guide_period_dashboard_stats` 同源口径（UTC 自然月已结计数 + 全量进行中 `amount` 之和），
/// 从 **`orders` + `guides`** 读取，供 **`GET /me`** / **`GET /me/stats`** 多副本 SSOT（ME-GUIDE-PERIOD-DB-001）。
pub async fn fetch_guide_period_dashboard_from_db(
    pool: &PgPool,
    guide_user_id: Uuid,
    now: DateTime<Utc>,
) -> Result<serde_json::Value, sqlx::Error> {
    let y = now.year();
    let m = now.month();
    let period_start = Utc.with_ymd_and_hms(y, m, 1, 0, 0, 0).unwrap();
    let (ny, nm) = if m == 12 { (y + 1, 1) } else { (y, m + 1) };
    let period_end = Utc.with_ymd_and_hms(ny, nm, 1, 0, 0, 0).unwrap();
    let billing_period_utc = format!("{y}-{m:02}");

    let q_settled = format!(
        r#"
        SELECT COUNT(*)::bigint
        FROM orders o
        INNER JOIN guides g ON g.id = o.guide_id
        WHERE g.user_id = $1
          AND LOWER(TRIM(o.status)) IN {FIN}
          AND o.updated_at >= $2 AND o.updated_at < $3
        "#,
        FIN = FINAL_FIN_SQL
    );
    let (period_settled_orders_count,): (i64,) = sqlx::query_as(&q_settled)
        .bind(guide_user_id)
        .bind(period_start)
        .bind(period_end)
        .fetch_one(pool)
        .await?;

    let period_expected_earnings: f64 = sqlx::query_scalar(
        r#"
        SELECT COALESCE(SUM(NULLIF(trim(o.amount), '')::float8), 0)
        FROM orders o
        INNER JOIN guides g ON g.id = o.guide_id
        WHERE g.user_id = $1
          AND LOWER(TRIM(o.status)) IN ('accepted','escrowed','disputed')
        "#,
    )
    .bind(guide_user_id)
    .fetch_one(pool)
    .await?;

    Ok(json!({
        "billing_period_utc": billing_period_utc,
        "period_expected_earnings": period_expected_earnings,
        "period_settled_orders_count": period_settled_orders_count.max(0) as u64,
    }))
}
