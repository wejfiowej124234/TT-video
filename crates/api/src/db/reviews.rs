//! reviews 表：DbReviewRow、insert_review、list_reviews（48 §6.7）
//! Phase 5：运营侧 `list_reviews_admin`（与 GET /admin/reviews 筛选一致）

use chrono::{DateTime, Utc};
use sqlx::postgres::PgPool;
use sqlx::QueryBuilder;
use uuid::Uuid;

/// 评价行（用于 hydrate）
#[derive(Debug)]
pub struct DbReviewRow {
    pub id: Uuid,
    pub order_id: Uuid,
    pub reviewer_id: Uuid,
    pub reviewee_id: Uuid,
    pub score: i16,
    pub weight: f64,
    pub comment: Option<String>,
    pub created_at: DateTime<Utc>,
}

/// Admin 列表/详情：`reviews` **`LEFT JOIN orders`** 附 **`orders.tourist_id`**（**87** 双读源；无订单行 **`None`**）。
#[derive(Debug)]
pub struct DbReviewAdminRow {
    pub row: DbReviewRow,
    pub order_tourist_id: Option<Uuid>,
}

/// 插入评价（提交评价时双写）。`true` = 新插入；`false` = 已存在 (order_id, reviewer_id)。
pub async fn insert_review(
    pool: &PgPool,
    id: Uuid,
    order_id: Uuid,
    reviewer_id: Uuid,
    reviewee_id: Uuid,
    score: i16,
    weight: f64,
    comment: Option<&str>,
    created_at: DateTime<Utc>,
) -> Result<bool, sqlx::Error> {
    let inserted: Option<Uuid> = sqlx::query_scalar(
        "INSERT INTO reviews (id, order_id, reviewer_id, reviewee_id, score, weight, comment, created_at) \
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) \
         ON CONFLICT (order_id, reviewer_id) DO NOTHING \
         RETURNING id",
    )
    .bind(id)
    .bind(order_id)
    .bind(reviewer_id)
    .bind(reviewee_id)
    .bind(score)
    .bind(weight as f64)
    .bind(comment)
    .bind(created_at)
    .fetch_optional(pool)
    .await?;
    Ok(inserted.is_some())
}

/// 按订单与评审人读取一条评价（用于 INSERT 冲突后的内存对齐 / 幂等恢复）
pub async fn fetch_review_by_order_and_reviewer(
    pool: &PgPool,
    order_id: Uuid,
    reviewer_id: Uuid,
) -> Result<Option<DbReviewRow>, sqlx::Error> {
    let row = sqlx::query_as::<
        _,
        (
            Uuid,
            Uuid,
            Uuid,
            Uuid,
            i16,
            f64,
            Option<String>,
            DateTime<Utc>,
        ),
    >(
        "SELECT id, order_id, reviewer_id, reviewee_id, score, weight::float8, comment, created_at \
         FROM reviews WHERE order_id = $1 AND reviewer_id = $2 LIMIT 1",
    )
    .bind(order_id)
    .bind(reviewer_id)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(
        |(id, order_id, reviewer_id, reviewee_id, score, weight, comment, created_at)| {
            DbReviewRow {
                id,
                order_id,
                reviewer_id,
                reviewee_id,
                score,
                weight,
                comment,
                created_at,
            }
        },
    ))
}

/// 加载所有评价（启动 hydrate）
pub async fn list_reviews(pool: &PgPool) -> Result<Vec<DbReviewRow>, sqlx::Error> {
    let rows = sqlx::query_as::<_, (Uuid, Uuid, Uuid, Uuid, i16, f64, Option<String>, DateTime<Utc>)>(
        "SELECT id, order_id, reviewer_id, reviewee_id, score, weight::float8, comment, created_at FROM reviews",
    )
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(
            |(id, order_id, reviewer_id, reviewee_id, score, weight, comment, created_at)| {
                DbReviewRow {
                    id,
                    order_id,
                    reviewer_id,
                    reviewee_id,
                    score,
                    weight,
                    comment,
                    created_at,
                }
            },
        )
        .collect())
}

/// Admin 单条评价：按主键读 + **`orders.tourist_id`**（与 `GET /api/v1/admin/reviews/:id` 一致）。
pub async fn fetch_review_by_id(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<DbReviewAdminRow>, sqlx::Error> {
    let row = sqlx::query_as::<
        _,
        (
            Uuid,
            Uuid,
            Uuid,
            Uuid,
            i16,
            f64,
            Option<String>,
            DateTime<Utc>,
            Option<Uuid>,
        ),
    >(
        "SELECT r.id, r.order_id, r.reviewer_id, r.reviewee_id, r.score, r.weight::float8, r.comment, r.created_at, \
         o.tourist_id AS order_tourist_id \
         FROM reviews r LEFT JOIN orders o ON o.id = r.order_id WHERE r.id = $1 LIMIT 1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(
        |(
            id,
            order_id,
            reviewer_id,
            reviewee_id,
            score,
            weight,
            comment,
            created_at,
            order_tourist_id,
        )| {
            DbReviewAdminRow {
                row: DbReviewRow {
                    id,
                    order_id,
                    reviewer_id,
                    reviewee_id,
                    score,
                    weight,
                    comment,
                    created_at,
                },
                order_tourist_id,
            }
        },
    ))
}

/// Admin 评价列表：按分值筛选，按创建时间倒序；**`LEFT JOIN orders`** 附 **`tourist_id`**。
pub async fn list_reviews_admin(
    pool: &PgPool,
    limit: i64,
    min_score: Option<i16>,
    max_score: Option<i16>,
) -> Result<Vec<DbReviewAdminRow>, sqlx::Error> {
    let mut qb = QueryBuilder::new(
        "SELECT r.id, r.order_id, r.reviewer_id, r.reviewee_id, r.score, r.weight::float8, r.comment, r.created_at, \
         o.tourist_id AS order_tourist_id FROM reviews r LEFT JOIN orders o ON o.id = r.order_id WHERE 1=1",
    );
    if let Some(mn) = min_score {
        qb.push(" AND r.score >= ");
        qb.push_bind(mn);
    }
    if let Some(mx) = max_score {
        qb.push(" AND r.score <= ");
        qb.push_bind(mx);
    }
    qb.push(" ORDER BY r.created_at DESC LIMIT ");
    qb.push_bind(limit);
    let rows = qb
        .build_query_as::<(
            Uuid,
            Uuid,
            Uuid,
            Uuid,
            i16,
            f64,
            Option<String>,
            DateTime<Utc>,
            Option<Uuid>,
        )>()
        .fetch_all(pool)
        .await?;
    Ok(rows
        .into_iter()
        .map(
            |(
                id,
                order_id,
                reviewer_id,
                reviewee_id,
                score,
                weight,
                comment,
                created_at,
                order_tourist_id,
            )| {
                DbReviewAdminRow {
                    row: DbReviewRow {
                        id,
                        order_id,
                        reviewer_id,
                        reviewee_id,
                        score,
                        weight,
                        comment,
                        created_at,
                    },
                    order_tourist_id,
                }
            },
        )
        .collect())
}
