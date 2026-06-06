//! DID rank 商家榜 / 收购榜：`market_listings` + `orders` 履约代理（04 附录 did-rank §1.2）

use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use super::users_sessions::UserRow;

pub struct MarketDidRankEntry {
    pub user: UserRow,
    pub completed_fulfillment_orders: i64,
    pub fulfillment_gross_total: String,
    pub published_listings: i64,
}

pub async fn list_market_did_rank_by_fulfillment(
    pool: &PgPool,
    variant: &str,
    owner_role_filter: Option<&str>,
    since: Option<DateTime<Utc>>,
    limit: i64,
) -> Result<Vec<MarketDidRankEntry>, sqlx::Error> {
    let rows = sqlx::query_as::<
        _,
        (
            Uuid,
            String,
            Option<String>,
            String,
            String,
            Option<String>,
            Option<String>,
            Option<String>,
            DateTime<Utc>,
            DateTime<Utc>,
            i64,
            String,
            i64,
        ),
    >(
        r#"
        WITH listing_owners AS (
            SELECT DISTINCT ml.owner_user_id AS user_id
            FROM market_listings ml
            INNER JOIN users u ON u.id = ml.owner_user_id
            WHERE ml.variant = $1
              AND ml.status = 'published'
              AND ($4::text IS NULL OR u.role = $4)
        ),
        fulfillment AS (
            SELECT g.user_id,
                   COUNT(*)::bigint AS completed_fulfillment_orders,
                   COALESCE(SUM(o.amount::numeric), 0)::text AS fulfillment_gross_total
            FROM orders o
            INNER JOIN guides g ON g.id = o.guide_id
            WHERE o.status = 'completed'
              AND ($2::timestamptz IS NULL OR o.completed_at >= $2)
            GROUP BY g.user_id
        ),
        published AS (
            SELECT owner_user_id AS user_id, COUNT(*)::bigint AS published_listings
            FROM market_listings
            WHERE variant = $1
              AND status = 'published'
              AND ($2::timestamptz IS NULL OR GREATEST(created_at, updated_at) >= $2)
            GROUP BY owner_user_id
        )
        SELECT u.id, u.email, u.password_hash, u.role, u.kyc_status, u.nickname, u.avatar_url,
               u.default_wallet_address, u.created_at, u.updated_at,
               COALESCE(f.completed_fulfillment_orders, 0),
               COALESCE(f.fulfillment_gross_total, '0'),
               COALESCE(p.published_listings, 0)
        FROM listing_owners lo
        INNER JOIN users u ON u.id = lo.user_id
        LEFT JOIN fulfillment f ON f.user_id = lo.user_id
        LEFT JOIN published p ON p.user_id = lo.user_id
        ORDER BY COALESCE(f.completed_fulfillment_orders, 0) DESC,
                 COALESCE(f.fulfillment_gross_total::numeric, 0) DESC,
                 COALESCE(p.published_listings, 0) DESC,
                 u.created_at ASC
        LIMIT $3
        "#,
    )
    .bind(variant)
    .bind(since)
    .bind(limit)
    .bind(owner_role_filter)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(
            |(
                id,
                email,
                password_hash,
                role,
                kyc_status,
                nickname,
                avatar_url,
                default_wallet_address,
                created_at,
                updated_at,
                completed_fulfillment_orders,
                fulfillment_gross_total,
                published_listings,
            )| MarketDidRankEntry {
                user: UserRow {
                    id,
                    email,
                    password_hash,
                    role,
                    kyc_status,
                    nickname,
                    avatar_url,
                    default_wallet_address,
                    created_at,
                    updated_at,
                },
                completed_fulfillment_orders,
                fulfillment_gross_total,
                published_listings,
            },
        )
        .collect())
}
