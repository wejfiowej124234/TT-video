use axum::body::Body;
use axum::http::{Method, Request, StatusCode};
use axum::Router;
use chrono::Utc;
use http_body_util::BodyExt;
use serde_json::json;
use sqlx::PgPool;
use std::sync::{Arc, OnceLock};
use tokio::sync::{Mutex, RwLock};
use tower::ServiceExt;
use uuid::Uuid;

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::db::{insert_guide_with_data_origin, insert_itinerary, insert_market_listing, insert_user, upsert_order_with_data_origin};
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::state::test_support::api_meta_state;

use crate::routes::market_subsite;

pub(super) static MARKET_SUBSITE_CATALOG_DB_IT_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

pub(super) fn db_it_lock() -> &'static Mutex<()> {
    MARKET_SUBSITE_CATALOG_DB_IT_LOCK.get_or_init(|| Mutex::new(()))
}

/// PD-009 / mock-pay IT：**`POST …/mock-pay`** 须 **`P3_CHAIN_OFF=1`**（与 **orders** IT **`RestoreP3ChainOff`** 同源）。
pub(super) struct RestoreP3ChainOff {
    previous: Option<String>,
}

impl RestoreP3ChainOff {
    pub(super) fn set_chain_off() -> Self {
        let previous = std::env::var("P3_CHAIN_OFF").ok();
        std::env::set_var("P3_CHAIN_OFF", "1");
        Self { previous }
    }
}

impl Drop for RestoreP3ChainOff {
    fn drop(&mut self) {
        match &self.previous {
            None => std::env::remove_var("P3_CHAIN_OFF"),
            Some(v) => std::env::set_var("P3_CHAIN_OFF", v),
        }
    }
}

pub(super) fn auth_bearer(token: &str) -> axum::http::HeaderValue {
    format!("Bearer {}", token).parse().expect("bearer header")
}

pub(super) async fn pool_or_skip() -> Option<PgPool> {
    crate::it_db_pool::connect_migrated_pg_it_pool().await
}

pub(super) async fn response_json(res: axum::response::Response) -> serde_json::Value {
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).unwrap_or_else(|_| json!({}))
}

/// **`market_subsite`** 写路径与 **`find_paid_entitlement_for_role`** 对齐（**IT** 种子）。
/// **`POST …/market/provider/listings`** 强闸：PG **`users.role=provider`** + **paid entitlement** + **`role_applications` approved**。
pub(super) async fn seed_provider_market_publish_prereqs(pool: &PgPool, user_id: Uuid) {
    sqlx::query("UPDATE users SET role = 'provider', updated_at = now() WHERE id = $1")
        .bind(user_id)
        .execute(pool)
        .await
        .expect("seed_provider_market_publish_prereqs role");
    insert_paid_onboarding_for_market_variant(pool, user_id, "provider").await;
    let app_id = Uuid::new_v4();
    let _ = sqlx::query("DELETE FROM role_applications WHERE user_id = $1 AND kind = 'provider_onboarding'")
        .bind(user_id)
        .execute(pool)
        .await;
    sqlx::query(
        r#"
        INSERT INTO role_applications (
            id, user_id, kind, status, legacy_ref, rejection_codes, metadata, submitted_at, decided_at, created_at, updated_at
        ) VALUES ($1, $2, 'provider_onboarding', 'approved', '{}'::jsonb, '[]'::jsonb, '{}'::jsonb, now(), now(), now(), now())
        "#,
    )
    .bind(app_id)
    .bind(user_id)
    .execute(pool)
    .await
    .expect("seed_provider_market_publish_prereqs application");
}

pub(super) fn acquisition_listing_post_json(payload: serde_json::Value) -> serde_json::Value {
    json!({ "payload": payload, "agree_escrow_copy": true })
}

pub(super) async fn seed_acquisition_market_publish_prereqs(pool: &PgPool, user_id: Uuid) {
    let wallet = "0xacquisitionpd009aaaaaaaaaaaaaaaaaaaaaaaaaa";
    sqlx::query(
        "UPDATE users SET default_wallet_address = $2, updated_at = now() WHERE id = $1",
    )
    .bind(user_id)
    .bind(wallet)
    .execute(pool)
    .await
    .expect("seed_acquisition_market_publish_prereqs wallet");
    let bond_id = Uuid::new_v4();
    let _ = sqlx::query(
        "DELETE FROM staking_positions WHERE user_id = $1 AND kind = 'acquisition_publish_bond'",
    )
    .bind(user_id)
    .execute(pool)
    .await;
    sqlx::query(
        r#"INSERT INTO staking_positions (
            id, application_id, user_id, kind, amount, currency, status, created_at, updated_at
        ) VALUES ($1, NULL, $2, 'acquisition_publish_bond', $3, 'USDC', 'locked', now(), now())"#,
    )
    .bind(bond_id)
    .bind(user_id)
    .bind("50")
    .execute(pool)
    .await
    .expect("seed_acquisition_market_publish_prereqs bond");
}

pub(super) async fn insert_paid_onboarding_for_market_variant(
    pool: &PgPool,
    user_id: Uuid,
    role_target: &str,
) {
    let id = Uuid::new_v4();
    let idem = format!("mkt-it-ent-{}", id);
    sqlx::query(
        r#"INSERT INTO onboarding_entitlements (
            id, user_id, role_target, sku, fee_schedule_version, status, idempotency_key, paid_at, created_at, updated_at
        ) VALUES ($1, $2, $3, 'matrix_it_sku', 'v0', 'paid', $4, now(), now(), now())"#,
    )
    .bind(id)
    .bind(user_id)
    .bind(role_target)
    .bind(&idem)
    .execute(pool)
    .await
    .expect("insert_paid_onboarding_for_market_variant");
}

pub(super) fn chain_off_for_pool(pool: &PgPool) -> ChainOffState {
    ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    }
}

pub(super) fn app_stack_mkt_catalog(pool: PgPool) -> Router {
    let co = chain_off_for_pool(&pool);
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(co)), idem, Some(pool))
}

/// **`require_admin_actor`** 须 **chain_off** 内存含 **admin** 用户；IT 在 PG 写入后 **hydrate**。
pub(super) async fn app_stack_mkt_catalog_hydrated(pool: PgPool) -> Router {
    let mut store = ChainOffStore::default();
    crate::startup::hydrate_from_db(&pool, &mut store)
        .await
        .expect("hydrate_from_db");
    let co = ChainOffState {
        store: Arc::new(RwLock::new(store)),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(co)), idem, Some(pool))
}

/// [93 §2.1 · B-MKT-005] 种子：`users` + **`market_listings`**（**`variant=provider`**）；调用方负责 **`cleanup_listing_and_user`**。
pub(super) async fn seed_b_mkt_005_provider_listing(pool: &PgPool) -> (Uuid, Uuid) {
    let owner_id = Uuid::new_v4();
    let listing_id = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("mkt-prov-{owner_id}@traveltrust.test");

    cleanup_listing_and_user(pool, listing_id, owner_id).await;

    insert_user(
        pool, owner_id, &email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert_user");

    let payload = json!({
        "kind": "merchant_showcase_studio_v1",
        "title": "b-mkt-005 catalog api it",
    });
    insert_market_listing(pool, listing_id, "provider", owner_id, &payload, now, "test")
        .await
        .expect("insert_market_listing");

    (listing_id, owner_id)
}

/// discover / guides 公众 catalog IT：Draft 订单 + 行程；调用方 **`cleanup_order_itinerary_user`**。
pub(super) async fn seed_discover_draft_order(
    pool: &PgPool,
    data_origin: &str,
    tourist_email: &str,
    city: &str,
) -> (Uuid, Uuid) {
    let tourist_id = Uuid::new_v4();
    let order_id = Uuid::new_v4();
    let now = Utc::now();
    let days_json = json!([{
        "day_index": 1,
        "content_text": "Public catalog surface discover IT day",
    }]);

    cleanup_order_itinerary_user(pool, order_id, tourist_id).await;

    insert_user(
        pool,
        tourist_id,
        tourist_email,
        None,
        "tourist",
        "none",
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("seed_discover_draft_order user");

    upsert_order_with_data_origin(
        pool,
        order_id,
        tourist_id,
        None,
        "100",
        "USD",
        "draft",
        None,
        now,
        now,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        None,
        data_origin,
        None,
        None,
    )
    .await
    .expect("seed_discover_draft_order order");

    insert_itinerary(
        pool,
        order_id,
        None,
        1,
        "CN",
        city,
        &days_json,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("seed_discover_draft_order itinerary");

    (order_id, tourist_id)
}

/// 公众 catalog IT：**`status=active`** 向导；调用方 **`cleanup_guide_user`**。
pub(super) async fn seed_public_catalog_guide(
    pool: &PgPool,
    data_origin: &str,
    guide_email: &str,
    city: &str,
) -> (Uuid, Uuid) {
    let user_id = Uuid::new_v4();
    let guide_id = Uuid::new_v4();
    let now = Utc::now();

    cleanup_guide_user(pool, guide_id, user_id).await;

    insert_user(
        pool,
        user_id,
        guide_email,
        None,
        "guide",
        "none",
        None,
        None,
        None,
        now,
        now,
    )
    .await
    .expect("seed_public_catalog_guide user");

    insert_guide_with_data_origin(
        pool,
        guide_id,
        user_id,
        city,
        "CN",
        &["zh".to_string()],
        &["walking".to_string()],
        Some("public catalog surface guide IT"),
        None,
        None,
        None,
        None,
        None,
        None,
        "0",
        "active",
        now,
        now,
        data_origin,
    )
    .await
    .expect("seed_public_catalog_guide guide");

    (guide_id, user_id)
}

pub(super) async fn cleanup_order_itinerary_user(pool: &PgPool, order_id: Uuid, user_id: Uuid) {
    let _ = sqlx::query("DELETE FROM itineraries WHERE order_id = $1")
        .bind(order_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM orders WHERE id = $1")
        .bind(order_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
}

pub(super) async fn cleanup_guide_user(pool: &PgPool, guide_id: Uuid, user_id: Uuid) {
    let _ = sqlx::query("DELETE FROM guides WHERE id = $1")
        .bind(guide_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(user_id)
        .execute(pool)
        .await;
}

pub(super) async fn assert_b_mkt_005_provider_catalog_listings(router: Router, listing_id: Uuid) {
    let res = router
        .oneshot(
            Request::builder()
                .uri("/api/v1/market/provider/listings")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let j = response_json(res).await;
    assert_eq!(j["status"], "ok");
    let items = j["items"].as_array().expect("items");
    assert!(
        items.iter().any(|row| row["id"] == listing_id.to_string()),
        "expected listing id in provider items: {items:?}"
    );
}

/// [93 §2.1 · B-MKT-009] **`GET /api/v1/market/provider/listings/:id`** **`status=ok`**；**`listing.id`** 与路径一致。
pub(super) async fn assert_b_mkt_009_provider_listing_detail(router: Router, listing_id: Uuid) {
    let uri = format!("/api/v1/market/provider/listings/{}", listing_id);
    let res = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let j = response_json(res).await;
    assert_eq!(j["status"], "ok");
    assert_eq!(j["listing"]["id"], listing_id.to_string());
    assert_eq!(j["meta"]["variant"], "provider");
}

/// [93 §2.1 · B-MKT-010] **`GET /api/v1/market/acquisition/listings/:id`** **`status=ok`**；**`listing.id`** 与路径一致。
pub(super) async fn assert_b_mkt_010_acquisition_listing_detail(router: Router, listing_id: Uuid) {
    let uri = format!("/api/v1/market/acquisition/listings/{}", listing_id);
    let res = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let j = response_json(res).await;
    assert_eq!(j["status"], "ok");
    assert_eq!(j["listing"]["id"], listing_id.to_string());
    assert_eq!(j["meta"]["variant"], "acquisition");
}

/// [93 §2.1 · B-MKT-005] `GET …/market/provider/listings` 含已发布 `listing_id`（**`market_subsite::router()`**）。
pub(super) async fn run_b_mkt_005_provider_catalog_listing_flow(pool: &PgPool) -> (Uuid, Uuid) {
    let (listing_id, owner_id) = seed_b_mkt_005_provider_listing(pool).await;
    let co = chain_off_for_pool(pool);
    let router = market_subsite::router().with_state(api_meta_state(Some(co)));
    assert_b_mkt_005_provider_catalog_listings(router, listing_id).await;
    (listing_id, owner_id)
}

/// [93 §2.1 · B-MKT-006] 种子：**`variant=acquisition`**；调用方负责 **`cleanup_listing_and_user`**。
pub(super) async fn seed_b_mkt_006_acquisition_listing(pool: &PgPool) -> (Uuid, Uuid) {
    let owner_id = Uuid::new_v4();
    let listing_id = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("mkt-acq-{owner_id}@traveltrust.test");

    cleanup_listing_and_user(pool, listing_id, owner_id).await;

    insert_user(
        pool, owner_id, &email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert_user");

    let payload = json!({
        "kind": "acquisition_carry_studio_v1",
        "title": "b-mkt-006 catalog api it",
    });
    insert_market_listing(pool, listing_id, "acquisition", owner_id, &payload, now, "test")
        .await
        .expect("insert_market_listing");

    (listing_id, owner_id)
}

/// 生产口径种子：**`data_origin=production`** + 非烟测邮箱（公众 catalog 过滤 IT）。
pub(super) async fn seed_production_provider_listing(pool: &PgPool) -> (Uuid, Uuid) {
    let owner_id = Uuid::new_v4();
    let listing_id = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("merchant-{owner_id}@example.com");

    cleanup_listing_and_user(pool, listing_id, owner_id).await;

    insert_user(
        pool, owner_id, &email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert_user");

    let payload = json!({
        "kind": "merchant_showcase_studio_v1",
        "title": "Production catalog merchant listing",
    });
    insert_market_listing(
        pool,
        listing_id,
        "provider",
        owner_id,
        &payload,
        now,
        "production",
    )
    .await
    .expect("insert_market_listing");

    (listing_id, owner_id)
}

pub(super) async fn assert_b_mkt_006_acquisition_catalog_listings(
    router: Router,
    listing_id: Uuid,
) {
    let res = router
        .oneshot(
            Request::builder()
                .uri("/api/v1/market/acquisition/listings")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let j = response_json(res).await;
    assert_eq!(j["status"], "ok");
    let items = j["items"].as_array().expect("items");
    assert!(
        items.iter().any(|row| row["id"] == listing_id.to_string()),
        "expected listing id in acquisition items: {items:?}"
    );
}

/// [93 §2.1 · B-MKT-006] `GET …/market/acquisition/listings` 含已发布 `listing_id`（**`market_subsite::router()`**）。
pub(super) async fn run_b_mkt_006_acquisition_catalog_listing_flow(pool: &PgPool) -> (Uuid, Uuid) {
    let (listing_id, owner_id) = seed_b_mkt_006_acquisition_listing(pool).await;
    let co = chain_off_for_pool(pool);
    let router = market_subsite::router().with_state(api_meta_state(Some(co)));
    assert_b_mkt_006_acquisition_catalog_listings(router, listing_id).await;
    (listing_id, owner_id)
}

pub(super) async fn cleanup_listing_and_user(pool: &PgPool, listing_id: Uuid, owner_id: Uuid) {
    let _ = sqlx::query("DELETE FROM staking_positions WHERE user_id = $1")
        .bind(owner_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM onboarding_entitlements WHERE user_id = $1")
        .bind(owner_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM community_posts WHERE commerce_market_listing_id = $1")
        .bind(listing_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM market_listings WHERE id = $1")
        .bind(listing_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(owner_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(owner_id)
        .execute(pool)
        .await;
}

pub(super) async fn cleanup_drafts_sessions_user(pool: &PgPool, owner_id: Uuid) {
    let _ = sqlx::query(
        "DELETE FROM role_applications WHERE user_id = $1 AND kind = 'provider_onboarding'",
    )
    .bind(owner_id)
    .execute(pool)
    .await;
    let _ = sqlx::query("DELETE FROM onboarding_entitlements WHERE user_id = $1")
        .bind(owner_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM market_listing_drafts WHERE owner_user_id = $1")
        .bind(owner_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(owner_id)
        .execute(pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(owner_id)
        .execute(pool)
        .await;
}
