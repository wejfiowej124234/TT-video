//! Phase ② · `GET /api/v1/me/publish-summary` — 五轨计数真源（与 Next BFF 同形 JSON）。
//! 口径对齐 BFF 聚合：`orders?business_line=trip&hat=traveler&limit=50` · listings · guide-profile · governance `?mine=1`。

use axum::http::StatusCode;
use axum::Json;
use serde_json::{json, Value};
use uuid::Uuid;

use crate::chain::ChainConfig;
use crate::db::{self, get_user_default_wallet_by_id};

use super::{
    order_matches_orders_list_hat, order_visible_in_orders_list, ChainOffState, ChainOffStore,
    OrdersListHat,
};

const MERCHANT_LISTINGS_VARIANT: &str = "provider";
const ACQUISITION_LISTINGS_VARIANT: &str = "acquisition";
const TRIP_ORDER_CAP: usize = 50;
const GOVERNANCE_MINE_CAP: i64 = 50;

fn wallet_hex_to_bytes(wallet: &str) -> Option<Vec<u8>> {
    let h = wallet.trim().trim_start_matches("0x");
    hex::decode(h).ok().filter(|b| b.len() == 20)
}

fn governor_indexed_pool<'a>(
    chain_config: Option<&'a ChainConfig>,
    pool: Option<&'a sqlx::PgPool>,
) -> Option<(&'a sqlx::PgPool, i64)> {
    let cfg = chain_config?;
    let g = cfg.governor_address.as_ref()?.trim();
    if g.is_empty() {
        return None;
    }
    let pool = pool?;
    let chain_id_i64 = (cfg.chain_id.min(i64::MAX as u64)) as i64;
    Some((pool, chain_id_i64))
}

/// 与 BFF `guideHasListing` 一致：`none` / `rejected` → 0；其余有 guide 行 → 1。
fn guide_publish_hub_count(store: &ChainOffStore, user_id: Uuid) -> u64 {
    let Some(gid) = store.guides_by_user.get(&user_id) else {
        return 0;
    };
    let Some(g) = store.guides.get(gid) else {
        return 0;
    };
    let status = g.status.trim().to_lowercase();
    if status.is_empty() || status == "none" || status == "rejected" {
        return 0;
    }
    1
}

fn count_trip_traveler_orders(
    store: &ChainOffStore,
    user_id: Uuid,
    business_chain_id: Option<i64>,
) -> u64 {
    let mut rows: Vec<_> = store
        .orders
        .values()
        .filter(|o| {
            order_visible_in_orders_list(
                store,
                o,
                user_id,
                None,
                Some("trip"),
                business_chain_id,
                None,
            ) && order_matches_orders_list_hat(store, o, user_id, Some(OrdersListHat::Traveler))
        })
        .collect();
    rows.sort_by(|a, b| (b.updated_at, b.id).cmp(&(a.updated_at, a.id)));
    rows.len().min(TRIP_ORDER_CAP) as u64
}

async fn count_listing_buckets(
    pool: Option<&sqlx::PgPool>,
    variant: &str,
    user_id: Uuid,
) -> (u64, u64) {
    let Some(pool) = pool else {
        return (0, 0);
    };
    let published = db::count_published_market_listings_by_owner(pool, variant, user_id)
        .await
        .unwrap_or(0)
        .max(0) as u64;
    let drafts = db::count_market_listing_drafts_by_owner(pool, variant, user_id)
        .await
        .unwrap_or(0)
        .max(0) as u64;
    (published, drafts)
}

async fn count_governance_mine(
    chain_config: Option<&ChainConfig>,
    pool: Option<&sqlx::PgPool>,
    user_id: Uuid,
) -> u64 {
    let Some((pool, chain_id_i64)) = governor_indexed_pool(chain_config, pool) else {
        return 0;
    };
    let wallet = match get_user_default_wallet_by_id(pool, user_id).await {
        Ok(Some(w)) if !w.trim().is_empty() => w,
        _ => return 0,
    };
    let Some(proposer_bytes) = wallet_hex_to_bytes(&wallet) else {
        return 0;
    };
    db::list_governance_proposals_for_proposer(
        pool,
        chain_id_i64,
        &proposer_bytes,
        GOVERNANCE_MINE_CAP,
    )
    .await
    .map(|rows| rows.len() as u64)
    .unwrap_or(0)
}

pub async fn get_me_publish_summary_impl(
    state: ChainOffState,
    chain_config: Option<&ChainConfig>,
    user_id: Uuid,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let store = state.store.read().await;
    if !store.users.contains_key(&user_id) {
        return Err((
            StatusCode::NOT_FOUND,
            Json(crate::api_json::err_key("user_not_found")),
        ));
    }
    let trip = count_trip_traveler_orders(&store, user_id, state.config.business_chain_id);
    let guide = guide_publish_hub_count(&store, user_id);
    drop(store);

    let pool = state.db_pool.as_ref();
    let (merchant_published, merchant_drafts) =
        count_listing_buckets(pool, MERCHANT_LISTINGS_VARIANT, user_id).await;
    let (acquisition_published, acquisition_drafts) =
        count_listing_buckets(pool, ACQUISITION_LISTINGS_VARIANT, user_id).await;
    let governance = count_governance_mine(chain_config, pool, user_id).await;

    Ok(Json(json!({
        "status": "ok",
        "counts": {
            "trip": trip,
            "guide": guide,
            "merchantPublished": merchant_published,
            "merchantDrafts": merchant_drafts,
            "acquisitionPublished": acquisition_published,
            "acquisitionDrafts": acquisition_drafts,
            "governance": governance,
        },
        "meta": {
            "implementation_status": "me_publish_summary_api_v1",
            "source": "traveltrust-api",
        }
    })))
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;
    use std::sync::Arc;
    use tokio::sync::RwLock;
    use traveltrust_core::OrderState;

    use crate::chain_off::{ChainOffConfig, GuideRow, OrderRow, UserRow};

    fn sample_user(id: Uuid) -> UserRow {
        let now = Utc::now();
        UserRow {
            id,
            email: "u@test.com".to_string(),
            password_hash: None,
            role: "traveler".to_string(),
            kyc_status: "none".to_string(),
            nickname: None,
            avatar_url: None,
            default_wallet_address: None,
            created_at: now,
            updated_at: now,
        }
    }

    fn sample_trip_order(tourist_id: Uuid) -> OrderRow {
        let now = Utc::now();
        OrderRow {
            id: Uuid::new_v4(),
            tourist_id,
            guide_id: Uuid::new_v4(),
            amount: "100".into(),
            currency: "USDC".into(),
            state: OrderState::Created,
            escrow_address: None,
            created_at: now,
            updated_at: now,
            accepted_at: None,
            escrowed_at: None,
            completed_at: None,
            dispute_deadline_at: None,
            auto_complete_at: None,
            start_date: None,
            end_date: None,
            sub_status: None,
            tourist_confirmed: None,
            guide_confirmed: None,
            rating_tourist_confirmed: None,
            rating_guide_confirmed: None,
            chain_id: None,
            data_origin: "production".into(),
            order_kind: None,
            market_listing_id: None,
            ..Default::default()
            }
    }

    fn sample_guide(guide_id: Uuid, user_id: Uuid, status: &str) -> GuideRow {
        GuideRow {
            id: guide_id,
            user_id,
            city: "Hangzhou".into(),
            country_code: "CN".into(),
            languages: vec![],
            service_types: vec![],
            bio: None,
            hourly_rate: None,
            wallet_address: None,
            real_name: None,
            passport_number_hash: None,
            id_photo_url: None,
            language_cert_url: None,
            guide_license_url: None,
            avatar_url: None,
            public_title: None,
            stake_amount: "0".into(),
            status: status.into(),
            rejection_codes: vec![],
            rejection_message: None,
            data_origin: "production".into(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            ..Default::default()
            }
    }

    #[test]
    fn guide_count_rejects_none_and_rejected() {
        let user_id = Uuid::new_v4();
        let guide_id = Uuid::new_v4();
        let mut store = ChainOffStore::default();
        store.users.insert(user_id, sample_user(user_id));
        for status in ["none", "rejected", "pending", "active"] {
            store.guides.insert(guide_id, sample_guide(guide_id, user_id, status));
            store.guides_by_user.insert(user_id, guide_id);
            let n = guide_publish_hub_count(&store, user_id);
            if status == "none" || status == "rejected" {
                assert_eq!(n, 0, "status={status}");
            } else {
                assert_eq!(n, 1, "status={status}");
            }
        }
    }

    #[test]
    fn trip_count_caps_at_fifty_and_filters_business_line() {
        let user_id = Uuid::new_v4();
        let mut store = ChainOffStore::default();
        store.users.insert(user_id, sample_user(user_id));
        for _ in 0..55 {
            let o = sample_trip_order(user_id);
            store.orders.insert(o.id, o);
        }
        let mut merchant_order = sample_trip_order(user_id);
        merchant_order.order_kind = Some("merchant_listing".into());
        store.orders.insert(merchant_order.id, merchant_order);

        let n = count_trip_traveler_orders(&store, user_id, None);
        assert_eq!(n, 50);
    }

    #[tokio::test]
    async fn publish_summary_envelope_matches_bff_schema() {
        let user_id = Uuid::new_v4();
        let guide_id = Uuid::new_v4();
        let mut store = ChainOffStore::default();
        store.users.insert(user_id, sample_user(user_id));
        store.guides_by_user.insert(user_id, guide_id);
        store.guides.insert(guide_id, sample_guide(guide_id, user_id, "active"));
        let trip = sample_trip_order(user_id);
        store.orders.insert(trip.id, trip);

        let state = ChainOffState {
            store: Arc::new(RwLock::new(store)),
            config: ChainOffConfig::default(),
            db_pool: None,
        };
        let Ok(Json(body)) = get_me_publish_summary_impl(state, None, user_id).await else {
            panic!("publish summary should succeed");
        };
        assert_eq!(body["status"], "ok");
        assert_eq!(body["counts"]["trip"], 1);
        assert_eq!(body["counts"]["guide"], 1);
        assert_eq!(body["counts"]["merchantPublished"], 0);
        assert_eq!(body["counts"]["governance"], 0);
        assert_eq!(
            body["meta"]["implementation_status"],
            "me_publish_summary_api_v1"
        );
        for key in [
            "trip",
            "guide",
            "merchantPublished",
            "merchantDrafts",
            "acquisitionPublished",
            "acquisitionDrafts",
            "governance",
        ] {
            assert!(body["counts"][key].is_number(), "missing count {key}");
        }
    }
}
