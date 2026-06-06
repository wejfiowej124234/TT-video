//! **`DID_RANK_SEED_MARKET_DEMO=1`**：本地 ① 为 provider / acquisition 副榜注入已发布 **`market_listings`**（幂等）。

use chrono::Utc;
use serde_json::json;
use sqlx::postgres::PgPool;
use uuid::Uuid;

use super::governance::get_governance_pool;
use super::market_listings::{did_rank_owner_role_for_variant, insert_market_listing};
use super::users_sessions::insert_user;

const PROVIDER_DEMO_EMAIL: &str = "provider-did-rank-demo@test.com";
const STEWARD_DEMO_EMAIL: &str = "steward-did-rank-demo@test.com";
const DEMO_PASSWORD: &str = "Test123!";

/// 固定 UUID，便于本地重置与 E2E 对拍（非生产账号）。
const PROVIDER_USER_ID: Uuid = Uuid::from_u128(0x0000_0000_0000_4000_8000_0000_0000_0101);
const STEWARD_USER_ID: Uuid = Uuid::from_u128(0x0000_0000_0000_4000_8000_0000_0000_0102);

async fn published_listing_count(pool: &PgPool, variant: &str) -> Result<i64, sqlx::Error> {
    let row: (i64,) = sqlx::query_as(
        "SELECT COUNT(*)::bigint FROM market_listings WHERE variant = $1 AND status = 'published'",
    )
    .bind(variant)
    .fetch_one(pool)
    .await?;
    Ok(row.0)
}

async fn ensure_demo_user(
    pool: &PgPool,
    id: Uuid,
    email: &str,
    role: &str,
    nickname: &str,
    now: chrono::DateTime<Utc>,
) {
    let password_hash = match bcrypt::hash(DEMO_PASSWORD, bcrypt::DEFAULT_COST) {
        Ok(h) => Some(h),
        Err(_) => return,
    };
    if insert_user(
        pool,
        id,
        email,
        password_hash.as_deref(),
        role,
        "none",
        Some(nickname),
        None,
        None,
        now,
        now,
    )
    .await
    .is_err()
    {
        // 已存在或其它非致命：副榜仅读 role + listings
    }
}

fn governance_pool_balance_display_i64(raw: Option<&str>) -> Option<i64> {
    let s = raw?.trim();
    if s.is_empty() || s.starts_with("0x") {
        return None;
    };    let digits: String = s.chars().filter(|c| c.is_ascii_digit()).collect();
    if digits.is_empty() {
        return None;
    }
    digits.parse::<i64>().ok().filter(|&n| n > 0)
}

/// 无十进制余额时写入演示值，使 **`GET …/prize-pool`** 可走 **`governance_pool_db`**（仍 illustrative）。
async fn seed_governance_pool_display_for_prize_pool(pool: &PgPool) {
    let Ok(Some(row)) = get_governance_pool(pool).await else {
        return;
    };    if governance_pool_balance_display_i64(row.balance.as_deref()).is_some() {
        return;
    };    if sqlx::query(
        "UPDATE governance_pool SET balance = $1, currency = COALESCE(NULLIF(trim(currency), ''), 'TTG'), updated_at = NOW()",
    )
    .bind("125000")
    .execute(pool)
    .await
    .is_ok()
    {
        eprintln!("[did-rank] DID_RANK_SEED_MARKET_DEMO: governance_pool balance demo=125000 TTG");
    }
}

pub async fn seed_did_rank_market_demo_if_empty(pool: &PgPool) {
    if std::env::var("DID_RANK_SEED_MARKET_DEMO").ok().as_deref() != Some("1") {
        return;
    }
    seed_governance_pool_display_for_prize_pool(pool).await;
    let now = Utc::now();

    if published_listing_count(pool, "provider").await.unwrap_or(0) == 0 {
        if did_rank_owner_role_for_variant("provider") == Some("provider") {
            ensure_demo_user(
                pool,
                PROVIDER_USER_ID,
                PROVIDER_DEMO_EMAIL,
                "provider",
                "DID榜演示商家",
                now,
            )
            .await;
            let titles = [
                "DID rank demo provider A",
                "DID rank demo provider B",
                "DID rank demo provider C",
            ];
            for (i, title) in titles.iter().enumerate() {
                let id = Uuid::from_u128(0x0000_0000_0000_4000_8000_0000_0000_1101 + i as u128);
                let payload = json!({
                    "kind": "merchant_showcase_studio_v1",
                    "title": title,
                });
                let _ = insert_market_listing(
                    pool,
                    id,
                    "provider",
                    PROVIDER_USER_ID,
                    &payload,
                    now,
                    "demo",
                )
                .await;
            }
            eprintln!(
                "[did-rank] DID_RANK_SEED_MARKET_DEMO: seeded provider board ({} listings)",
                titles.len()
            );
        }
    };
    if published_listing_count(pool, "acquisition").await.unwrap_or(0) == 0 {
        if did_rank_owner_role_for_variant("acquisition") == Some("region_steward") {
            ensure_demo_user(
                pool,
                STEWARD_USER_ID,
                STEWARD_DEMO_EMAIL,
                "region_steward",
                "DID榜演示收购",
                now,
            )
            .await;
            let titles = ["DID rank demo acquisition A", "DID rank demo acquisition B"];
            for (i, title) in titles.iter().enumerate() {
                let id = Uuid::from_u128(0x0000_0000_0000_4000_8000_0000_0000_1201 + i as u128);
                let payload = json!({
                    "kind": "acquisition_carry_studio_v1",
                    "title": title,
                });
                let _ = insert_market_listing(
                    pool,
                    id,
                    "acquisition",
                    STEWARD_USER_ID,
                    &payload,
                    now,
                    "demo",
                )
                .await;
            }
            eprintln!(
                "[did-rank] DID_RANK_SEED_MARKET_DEMO: seeded acquisition board ({} listings)",
                titles.len()
            );
        }
    }
}
