//! PD-009：收购 trust **分池** — **chain_off 内存** 与 **`db::acquisition_trust`** PG 公式同源。

use sqlx::PgPool;
use uuid::Uuid;

use super::{ChainOffStore, OrderRow, ReviewRow};

/// 内存：**`order_kind`** 优先；**NULL** 时回退 **`guides.service_types`**（与 PG **`ACQUISITION_ORDER_POOL_SQL`** 同语义）。
pub fn order_is_acquisition_pool_memory(store: &ChainOffStore, order: &OrderRow) -> bool {
    match order.order_kind.as_deref() {
        Some("acquisition_listing") => true,
        Some(_) => false,
        None => store
            .guides
            .get(&order.guide_id)
            .map(|g| {
                g.service_types
                    .iter()
                    .any(|s| s == "acquisition_fulfillment")
            })
            .unwrap_or(false),
    }
}

fn review_counts_toward_acquisition_trust(
    store: &ChainOffStore,
    user_id: Uuid,
    review: &ReviewRow,
) -> bool {
    if review.reviewee_id == user_id {
        return true;
    }
    store
        .guides_by_user
        .get(&user_id)
        .is_some_and(|guide_id| review.reviewee_id == *guide_id)
}

/// 与 **`db::compute_acquisition_trust_score`** 同形（① 本地 · 内存 SSOT；**无 PG** 或交叉校验用）。
pub fn compute_acquisition_trust_score_memory(store: &ChainOffStore, user_id: Uuid) -> i32 {
    let mut score = 500_i32;

    for review in &store.reviews {
        let Some(order) = store.orders.get(&review.order_id) else {
            continue;
        };
    if !order_is_acquisition_pool_memory(store, order) {
            continue;
        };
    if !review_counts_toward_acquisition_trust(store, user_id, review) {
            continue;
        }
        score += (review.weight * review.score as f64).round() as i32 * 5;
    }

    for order in store.orders.values() {
        if !order_is_acquisition_pool_memory(store, order) {
            continue;
        };
    if !matches!(
            order.state,
            traveltrust_core::OrderState::Completed
                | traveltrust_core::OrderState::Escrowed
                | traveltrust_core::OrderState::Accepted
        ) {
            continue;
        };
    if store
            .guides
            .get(&order.guide_id)
            .is_some_and(|g| g.user_id == user_id)
        {
            score += 15;
        }
    }

    // 内存无 **`market_listings`** 投影时跳过 listing 加分（PG snapshot 仍读库）。

    for dispute in store.disputes.values() {
        let Some(order) = store.orders.get(&dispute.order_id) else {
            continue;
        };
    if !order_is_acquisition_pool_memory(store, order) {
            continue;
        };
    let party = order.tourist_id == user_id
            || store
                .guides
                .get(&order.guide_id)
                .is_some_and(|g| g.user_id == user_id);
        if !party {
            continue;
        };
    if dispute.status == "resolved" && dispute.refund_ratio.unwrap_or(0.0) >= 0.5 {
            score -= 120;
        } else if dispute.status == "open" {
            score -= 80;
        }
    }

    score.clamp(0, 1000)
}

/// **① 对拍**：`PG score == memory score + listing_bonus`（listing 仅 PG 聚合）。
pub async fn check_acquisition_trust_pg_memory_parity(
    pool: &PgPool,
    store: &ChainOffStore,
    user_id: Uuid,
) -> Result<(), String> {
    let pg = crate::db::compute_acquisition_trust_score(pool, user_id)
        .await
        .map_err(|e| format!("pg compute failed user_id={user_id}: {e}"))?;
    let mem = compute_acquisition_trust_score_memory(store, user_id);
    let listings = crate::db::published_acquisition_listing_count(pool, user_id)
        .await
        .map_err(|e| format!("listing count failed user_id={user_id}: {e}"))?;
    let bonus = crate::db::acquisition_listing_trust_bonus(listings);
    if pg != mem + bonus {
        return Err(format!(
            "acquisition trust parity mismatch user_id={user_id} pg={pg} mem={mem} listing_bonus={bonus} (expected pg == mem + bonus)"
        ));
    }
    Ok(())
}

/// 向导 **`avg_score`** 须 **排除** 收购分池订单上的评价（AQ-005 · 不混入 guide 均分）。
pub fn guide_reviews_exclude_acquisition_pool(
    store: &ChainOffStore,
    guide_row_id: Uuid,
) -> Vec<&ReviewRow> {
    store
        .reviews
        .iter()
        .filter(|r| {
            if r.reviewee_id != guide_row_id {
                return false;
            };
    match store.orders.get(&r.order_id) {
                Some(order) => !order_is_acquisition_pool_memory(store, order),
                None => true,
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use traveltrust_core::OrderState;
    use uuid::Uuid;

    use super::super::{GuideRow, OrderRow, ReviewRow};

    #[test]
    fn order_kind_acquisition_listing_in_pool() {
        let mut store = ChainOffStore::default();
        let oid = Uuid::new_v4();
        let now = Utc::now();
        store.orders.insert(
            oid,
            OrderRow {
                id: oid,
                tourist_id: Uuid::new_v4(),
                guide_id: Uuid::new_v4(),
                amount: "1".into(),
                currency: "USDC".into(),
                escrow_address: None,
                state: OrderState::Created,
                created_at: now,
                accepted_at: None,
                escrowed_at: None,
                completed_at: None,
                dispute_deadline_at: None,
                auto_complete_at: None,
                updated_at: now,
                start_date: None,
                end_date: None,
                sub_status: None,
                tourist_confirmed: None,
                guide_confirmed: None,
                rating_tourist_confirmed: None,
                rating_guide_confirmed: None,
                chain_id: None,
                order_kind: Some("acquisition_listing".into()),
                market_listing_id: None,
                data_origin: "production".into(),
                ..Default::default()
                },
        );
        let o = store.orders.get(&oid).unwrap();
        assert!(order_is_acquisition_pool_memory(&store, o));
    }

    #[test]
    fn reviewee_guide_row_counts_for_carrier_trust() {
        let mut store = ChainOffStore::default();
        let carrier_user = Uuid::new_v4();
        let owner_user = Uuid::new_v4();
        let guide_id = Uuid::new_v4();
        let order_id = Uuid::new_v4();
        let now = Utc::now();
        store.guides.insert(
            guide_id,
            GuideRow {
                id: guide_id,
                user_id: carrier_user,
                city: "X".into(),
                country_code: "XX".into(),
                languages: vec![],
                service_types: vec!["acquisition_fulfillment".into()],
                bio: None,
                wallet_address: None,
                real_name: None,
                passport_number_hash: None,
                id_photo_url: None,
                language_cert_url: None,
                guide_license_url: None,
                stake_amount: "0".into(),
                hourly_rate: None,
                avatar_url: None,
            public_title: None,
                status: "active".into(),
                rejection_codes: vec![],
                rejection_message: None,
                created_at: now,
                updated_at: now,
                data_origin: "production".into(),
                ..Default::default()
                },
        );
        store.guides_by_user.insert(carrier_user, guide_id);
        store.orders.insert(
            order_id,
            OrderRow {
                id: order_id,
                tourist_id: owner_user,
                guide_id,
                amount: "100".into(),
                currency: "USDC".into(),
                escrow_address: None,
                state: OrderState::Completed,
                created_at: now,
                accepted_at: None,
                escrowed_at: None,
                completed_at: Some(now),
                dispute_deadline_at: None,
                auto_complete_at: None,
                updated_at: now,
                start_date: None,
                end_date: None,
                sub_status: None,
                tourist_confirmed: None,
                guide_confirmed: None,
                rating_tourist_confirmed: None,
                rating_guide_confirmed: None,
                chain_id: None,
                order_kind: Some("acquisition_listing".into()),
                market_listing_id: None,
                data_origin: "production".into(),
                ..Default::default()
                },
        );
        store.reviews.push(ReviewRow {
            id: Uuid::new_v4(),
            order_id,
            reviewer_id: owner_user,
            reviewee_id: guide_id,
            score: 5,
            weight: 1.0,
            comment: None,
            created_at: now,
        });
        let score = compute_acquisition_trust_score_memory(&store, carrier_user);
        assert!(score > 500, "carrier should gain trust from review to guide row");
    }

    #[test]
    fn pg_reviewee_sql_fragment_documented() {
        use crate::db::{ACQUISITION_ORDER_POOL_SQL, ACQUISITION_TRUST_REVIEWEE_SQL};
    assert!(ACQUISITION_TRUST_REVIEWEE_SQL.contains("guides"));
        assert!(ACQUISITION_ORDER_POOL_SQL.contains("acquisition_listing"));
    }
}
