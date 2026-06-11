//! PD-009：旅行收购发布押金、频控与信用分（① 本地 · PG SSOT）。

use chrono::{DateTime, Duration, Utc};
use sqlx::postgres::PgPool;
use std::collections::HashMap;
use uuid::Uuid;

use super::users_sessions::UserRow;

pub const ACQUISITION_PUBLISH_BOND_MIN_USDC: &str = "50";
pub const ACQUISITION_TRUST_WAIVE_BOND_THRESHOLD: i32 = 700;
pub const ACQUISITION_PUBLISH_DAILY_MAX: i64 = 5;
pub const ACQUISITION_FULFILLMENT_BOND_THRESHOLD_USDC: f64 = 1000.0;
pub const ACQUISITION_FULFILLMENT_BOND_MIN_USDC: &str = "100";

/// SQL：`orders` 属于收购履约池（**L5** 优先 **`order_kind`**；**NULL** 行回退 guide 启发式）。
pub const ACQUISITION_ORDER_POOL_SQL: &str = r#"
    (
        o.order_kind = 'acquisition_listing'
        OR (
            o.order_kind IS NULL
            AND EXISTS (
                SELECT 1 FROM guides g
                WHERE g.id = o.guide_id
                  AND g.service_types @> '["acquisition_fulfillment"]'::jsonb
            )
        )
    )
"#;

/// 收购信用分：评价计入 **`reviewee_id = user`** 或 **`reviewee_id = guides.id`**（与 **`POST …/reviews`** 写 **`order.guide_id`** 同源）。
pub const ACQUISITION_TRUST_REVIEWEE_SQL: &str =
    r"(r.reviewee_id = $1 OR r.reviewee_id IN (SELECT id FROM guides WHERE user_id = $1))";

pub async fn order_is_acquisition_pool(
    pool: &PgPool,
    order_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let ok: bool = sqlx::query_scalar(&format!(
        "SELECT EXISTS(SELECT 1 FROM orders o WHERE o.id = $1 AND {ACQUISITION_ORDER_POOL_SQL})"
    ))
    .bind(order_id)
    .fetch_one(pool)
    .await?;
    Ok(ok)
}

pub async fn slash_acquisition_publish_bond(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let r = sqlx::query(
        r#"
        UPDATE staking_positions
        SET status = 'slashed', updated_at = now()
        WHERE user_id = $1
          AND kind = 'acquisition_publish_bond'
          AND status = 'locked'
        "#,
    )
    .bind(user_id)
    .execute(pool)
    .await?;
    Ok(r.rows_affected() > 0)
}

pub async fn slash_acquisition_fulfillment_bond(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let r = sqlx::query(
        r#"
        UPDATE staking_positions
        SET status = 'slashed', updated_at = now()
        WHERE user_id = $1
          AND kind = 'acquisition_fulfillment_bond'
          AND status = 'locked'
        "#,
    )
    .bind(user_id)
    .execute(pool)
    .await?;
    Ok(r.rows_affected() > 0)
}

/// 争议裁决后：收购池订单对发布方/受托方保证金 **slash**（① mock · PG）。
pub async fn apply_acquisition_dispute_outcomes(
    pool: &PgPool,
    order_id: Uuid,
    tourist_id: Uuid,
    guide_id: Uuid,
    refund_ratio: f64,
    slash_guide: bool,
) -> Result<(), sqlx::Error> {
    if !order_is_acquisition_pool(pool, order_id).await? {
        return Ok(());
    };
    let guide_user: Option<Uuid> =
        sqlx::query_scalar("SELECT user_id FROM guides WHERE id = $1")
            .bind(guide_id)
            .fetch_optional(pool)
            .await?;
    let Some(guide_user_id) = guide_user else {
        return Ok(());
    };
    if refund_ratio >= 0.75 {
        let _ = slash_acquisition_publish_bond(pool, tourist_id).await?;
    };
    if slash_guide || refund_ratio >= 0.5 {
        let _ = slash_acquisition_fulfillment_bond(pool, guide_user_id).await?;
    }
;
    Ok(())
}

#[derive(Debug, Clone)]
pub struct AcquisitionTrustSnapshot {
    pub trust_score: i32,
    pub publish_eligible: bool,
    pub bond_waived_by_trust: bool,
    pub has_publish_bond: bool,
    pub bond_display: Option<String>,
    pub listings_published_24h: i64,
    pub slot_state: &'static str,
    pub publish_suspended: bool,
    pub has_fulfillment_bond: bool,
    pub fulfillment_bond_display: Option<String>,
}

fn wallet_linked(user: &UserRow) -> bool {
    user.default_wallet_address
        .as_ref()
        .map(|s| !s.trim().is_empty())
        .unwrap_or(false)
}

pub fn acquisition_publish_trust_blocked(identity_status: &str, risk_level: &str) -> bool {
    identity_status == "restricted" || risk_level == "high"
}

pub async fn has_locked_acquisition_publish_bond(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let ok: bool = sqlx::query_scalar(
        r#"
        SELECT EXISTS(
            SELECT 1 FROM staking_positions
            WHERE user_id = $1
              AND kind = 'acquisition_publish_bond'
              AND status = 'locked'
              AND amount::numeric >= $2::numeric
        )
        "#,
    )
    .bind(user_id)
    .bind(ACQUISITION_PUBLISH_BOND_MIN_USDC)
    .fetch_one(pool)
    .await?;
    Ok(ok)
}

pub async fn acquisition_publish_bond_display(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Option<String>, sqlx::Error> {
    let row: Option<(String, String)> = sqlx::query_as(
        r#"
        SELECT amount, currency FROM staking_positions
        WHERE user_id = $1
          AND kind = 'acquisition_publish_bond'
          AND status = 'locked'
        ORDER BY updated_at DESC
        LIMIT 1
        "#,
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(|(amount, currency)| format!("{amount} {currency}")))
}

pub async fn count_acquisition_listings_published_since(
    pool: &PgPool,
    user_id: Uuid,
    since: DateTime<Utc>,
) -> Result<i64, sqlx::Error> {
    let n: i64 = sqlx::query_scalar(
        r#"
        SELECT COUNT(*)::bigint FROM market_listings
        WHERE owner_user_id = $1
          AND variant = 'acquisition'
          AND status = 'published'
          AND created_at >= $2
        "#,
    )
    .bind(user_id)
    .bind(since)
    .fetch_one(pool)
    .await?;
    Ok(n)
}

/// 收购信用分中 **`market_listings`** 项（内存路径不投影 listing 表时，对拍须从 PG 扣减/补齐）。
pub fn acquisition_listing_trust_bonus(published_count: i64) -> i32 {
    (published_count as i32) * 10
}

pub async fn published_acquisition_listing_count(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<i64, sqlx::Error> {
    sqlx::query_scalar(
        r#"
        SELECT COUNT(*)::bigint FROM market_listings
        WHERE owner_user_id = $1
          AND variant = 'acquisition'
          AND status = 'published'
        "#,
    )
    .bind(user_id)
    .fetch_one(pool)
    .await
}

pub async fn compute_acquisition_trust_score(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<i32, sqlx::Error> {
    let score: Option<i32> = sqlx::query_scalar(&format!(
        r#"
        SELECT COALESCE(LEAST(1000, GREATEST(0,
            500
            + COALESCE((
                SELECT COALESCE(SUM((r.weight::float8) * r.score::float8), 0)::int
                FROM reviews r
                INNER JOIN orders o ON o.id = r.order_id
                WHERE {reviewee}
                  AND {pool}
              ), 0) * 5
            + COALESCE((
                SELECT COUNT(*)::int FROM orders o
                INNER JOIN guides g ON g.id = o.guide_id
                WHERE g.user_id = $1
                  AND {pool}
                  AND o.status IN ('completed', 'escrowed', 'accepted')
              ), 0) * 15
            + COALESCE((
                SELECT COUNT(*)::int FROM market_listings
                WHERE owner_user_id = $1 AND variant = 'acquisition' AND status = 'published'
              ), 0) * 10
            - COALESCE((
                SELECT COUNT(*)::int FROM disputes d
                INNER JOIN orders o ON o.id = d.order_id
                WHERE d.status = 'resolved'
                  AND COALESCE(d.refund_ratio, 0) >= 0.5
                  AND (
                    o.tourist_id = $1
                    OR o.guide_id IN (SELECT id FROM guides WHERE user_id = $1)
                  )
                  AND {pool}
              ), 0) * 120
            - COALESCE((
                SELECT COUNT(*)::int FROM disputes d
                INNER JOIN orders o ON o.id = d.order_id
                WHERE d.status = 'open'
                  AND (
                    o.tourist_id = $1
                    OR o.guide_id IN (SELECT id FROM guides WHERE user_id = $1)
                  )
                  AND {pool}
              ), 0) * 80
        ))::int, 500)
        "#,
        pool = ACQUISITION_ORDER_POOL_SQL,
        reviewee = ACQUISITION_TRUST_REVIEWEE_SQL
    ))
    .bind(user_id)
    .fetch_one(pool)
    .await?;
    Ok(score.unwrap_or(500))
}

/// Admin/风控暂停收购发布直至指定时刻（`NULL` = 解除）。
pub async fn set_acquisition_publish_suspended_until(
    pool: &PgPool,
    user_id: Uuid,
    until: Option<DateTime<Utc>>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE users SET acquisition_publish_suspended_until = $2, updated_at = now() WHERE id = $1",
    )
    .bind(user_id)
    .bind(until)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn acquisition_publish_is_suspended(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<bool, sqlx::Error> {
    Ok(acquisition_publish_suspended_until(pool, user_id)
        .await?
        .is_some_and(|t| t > Utc::now()))
}

pub async fn acquisition_publish_suspended_until(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Option<DateTime<Utc>>, sqlx::Error> {
    let row: Option<(Option<DateTime<Utc>>,)> = sqlx::query_as(
        "SELECT acquisition_publish_suspended_until FROM users WHERE id = $1",
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?;
    Ok(row.and_then(|(until,)| until))
}

/// Admin 列表/详情：`acquisition_publish_suspended` + RFC3339 `until`（PG SSOT）。
pub fn acquisition_suspend_admin_projection(
    until: Option<DateTime<Utc>>,
) -> (bool, Option<String>) {
    let active = until.is_some_and(|t| t > Utc::now());
    (active, until.map(|t| t.to_rfc3339()))
}

/// **`GET /api/v1/admin/users`** 批量 enrichment（仅 PG 可用时）。
pub async fn acquisition_publish_suspended_until_batch(
    pool: &PgPool,
    user_ids: &[Uuid],
) -> Result<HashMap<Uuid, Option<DateTime<Utc>>>, sqlx::Error> {
    if user_ids.is_empty() {
        return Ok(HashMap::new());
    };
    let rows: Vec<(Uuid, Option<DateTime<Utc>>)> = sqlx::query_as(
        r#"
        SELECT id, acquisition_publish_suspended_until
        FROM users
        WHERE id = ANY($1)
        "#,
    )
    .bind(user_ids)
    .fetch_all(pool)
    .await?;
    Ok(rows.into_iter().collect())
}

/// PD-009：收购接单须 **`orders.guide_id`**；无向导行时自动创建最小 **`active`** guide（**`acquisition_fulfillment`**）。
pub async fn ensure_acquisition_fulfillment_guide_id(
    pool: &PgPool,
    user_id: Uuid,
    wallet_address: Option<&str>,
) -> Result<Uuid, sqlx::Error> {
    if let Some(id) = super::guides::select_active_guide_id_for_user(pool, user_id).await? {
        return Ok(id);
    };
    let guide_id = Uuid::new_v4();
    let now = Utc::now();
    crate::db::insert_guide_with_data_origin(
        pool,
        guide_id,
        user_id,
        "Global",
        "XX",
        &["en".to_string()],
        &["acquisition_fulfillment".to_string()],
        Some("PD-009 acquisition fulfillment (auto-provisioned)"),
        wallet_address,
        None,
        None,
        None,
        None,
        None,
        "0",
        None,
        None,
        "active",
        now,
        now,
        "demo",
    )
    .await?;
    Ok(guide_id)
}

pub async fn upsert_acquisition_publish_bond(
    pool: &PgPool,
    user_id: Uuid,
    amount: &str,
) -> Result<(), sqlx::Error> {
    let id = Uuid::new_v4();
    sqlx::query(
        "DELETE FROM staking_positions WHERE user_id = $1 AND kind = 'acquisition_publish_bond'",
    )
    .bind(user_id)
    .execute(pool)
    .await?;
    sqlx::query(
        r#"
        INSERT INTO staking_positions (
            id, application_id, user_id, kind, amount, currency, status, created_at, updated_at
        ) VALUES ($1, NULL, $2, 'acquisition_publish_bond', $3, 'USDC', 'locked', now(), now())
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(amount)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn acquisition_fulfillment_bond_display(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<Option<String>, sqlx::Error> {
    let row: Option<(String, String)> = sqlx::query_as(
        r#"
        SELECT amount, currency FROM staking_positions
        WHERE user_id = $1
          AND kind = 'acquisition_fulfillment_bond'
          AND status = 'locked'
        ORDER BY updated_at DESC
        LIMIT 1
        "#,
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?;
    Ok(row.map(|(amount, currency)| format!("{amount} {currency}")))
}

pub async fn upsert_acquisition_fulfillment_bond(
    pool: &PgPool,
    user_id: Uuid,
    amount: &str,
) -> Result<(), sqlx::Error> {
    let id = Uuid::new_v4();
    sqlx::query(
        "DELETE FROM staking_positions WHERE user_id = $1 AND kind = 'acquisition_fulfillment_bond'",
    )
    .bind(user_id)
    .execute(pool)
    .await?;
    sqlx::query(
        r#"
        INSERT INTO staking_positions (
            id, application_id, user_id, kind, amount, currency, status, created_at, updated_at
        ) VALUES ($1, NULL, $2, 'acquisition_fulfillment_bond', $3, 'USDC', 'locked', now(), now())
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(amount)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn acquisition_trust_snapshot(
    pool: &PgPool,
    user_id: Uuid,
    user: &UserRow,
    identity_status: &str,
    risk_level: &str,
) -> Result<AcquisitionTrustSnapshot, sqlx::Error> {
    let since = Utc::now() - Duration::hours(24);
    let listings_published_24h =
        count_acquisition_listings_published_since(pool, user_id, since).await?;
    let trust_score = compute_acquisition_trust_score(pool, user_id).await?;
    let has_publish_bond = has_locked_acquisition_publish_bond(pool, user_id).await?;
    let bond_display = acquisition_publish_bond_display(pool, user_id).await?;
    let has_fulfillment_bond = has_locked_acquisition_fulfillment_bond(pool, user_id).await?;
    let fulfillment_bond_display = acquisition_fulfillment_bond_display(pool, user_id).await?;
    let bond_waived_by_trust = trust_score >= ACQUISITION_TRUST_WAIVE_BOND_THRESHOLD;
    let wallet_ok = wallet_linked(user);
    let trust_blocked = acquisition_publish_trust_blocked(identity_status, risk_level);
    let suspended = acquisition_publish_is_suspended(pool, user_id).await?;
    let publish_eligible = wallet_ok
        && !trust_blocked
        && !suspended
        && (has_publish_bond || bond_waived_by_trust);
    let slot_state = if trust_blocked || suspended {
        "restricted"
    } else if publish_eligible {
        "active"
    } else {
        "inactive"
    }
;
    Ok(AcquisitionTrustSnapshot {
        trust_score,
        publish_eligible,
        bond_waived_by_trust,
        has_publish_bond,
        bond_display,
        listings_published_24h,
        slot_state,
        publish_suspended: suspended,
        has_fulfillment_bond,
        fulfillment_bond_display,
    })
}

pub async fn ensure_acquisition_publish_allowed(
    pool: &PgPool,
    user: &UserRow,
    identity_status: &str,
    risk_level: &str,
) -> Result<AcquisitionTrustSnapshot, &'static str> {
    if !wallet_linked(user) {
        return Err("acquisition_wallet_required");
    };
    if acquisition_publish_trust_blocked(identity_status, risk_level) {
        return Err("acquisition_trust_restricted");
    };
    if acquisition_publish_is_suspended(pool, user.id)
        .await
        .map_err(|_| "acquisition_trust_lookup_failed")?
    {
        return Err("acquisition_publish_suspended");
    };
    let snapshot =
        acquisition_trust_snapshot(pool, user.id, user, identity_status, risk_level)
            .await
            .map_err(|_| "acquisition_trust_lookup_failed")?;
    if !snapshot.has_publish_bond && !snapshot.bond_waived_by_trust {
        return Err("acquisition_publish_bond_required");
    };
    if snapshot.listings_published_24h >= ACQUISITION_PUBLISH_DAILY_MAX {
        return Err("acquisition_publish_rate_limited");
    }
;
    Ok(snapshot)
}

pub async fn has_locked_acquisition_fulfillment_bond(
    pool: &PgPool,
    user_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let ok: bool = sqlx::query_scalar(
        r#"
        SELECT EXISTS(
            SELECT 1 FROM staking_positions
            WHERE user_id = $1
              AND kind = 'acquisition_fulfillment_bond'
              AND status = 'locked'
              AND amount::numeric >= $2::numeric
        )
        "#,
    )
    .bind(user_id)
    .bind(ACQUISITION_FULFILLMENT_BOND_MIN_USDC)
    .fetch_one(pool)
    .await?;
    Ok(ok)
}
