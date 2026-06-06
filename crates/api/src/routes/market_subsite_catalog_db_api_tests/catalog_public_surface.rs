use axum::body::Body;
use axum::http::{Request, StatusCode};
use tower::ServiceExt;
use uuid::Uuid;

use super::helpers::*;

fn restore_public_catalog_env(prev: Option<String>) {
    match prev {
        Some(v) => std::env::set_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE", v),
        None => std::env::remove_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE"),
    }
}

/// 企业级数据分离：**`TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1`** 时公众 **`GET …/provider/listings`** 不含 **`data_origin=test|demo`** 行。
#[tokio::test]
async fn public_catalog_surface_hides_test_and_demo_provider_listings() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: public_catalog_surface_hides_test_and_demo_provider_listings (DATABASE_URL unset)"
        );
        return;
    };
    let prev = std::env::var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE").ok();
    std::env::set_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE", "1");

    let (test_listing_id, test_owner_id) = seed_b_mkt_005_provider_listing(&pool).await;
    let (prod_listing_id, prod_owner_id) = seed_production_provider_listing(&pool).await;
    let router = app_stack_mkt_catalog(pool.clone());

    let res = router
        .clone()
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
        items.iter().any(|row| row["id"] == prod_listing_id.to_string()),
        "production listing must appear in public catalog: {items:?}"
    );
    assert!(
        !items.iter().any(|row| row["id"] == test_listing_id.to_string()),
        "test-origin listing must be hidden from public catalog: {items:?}"
    );

    let detail_test = router
        .clone()
        .oneshot(
            Request::builder()
                .uri(format!(
                    "/api/v1/market/provider/listings/{}",
                    test_listing_id
                ))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(detail_test.status(), StatusCode::NOT_FOUND);

    let detail_prod = router
        .oneshot(
            Request::builder()
                .uri(format!(
                    "/api/v1/market/provider/listings/{}",
                    prod_listing_id
                ))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(detail_prod.status(), StatusCode::OK);

    cleanup_listing_and_user(&pool, test_listing_id, test_owner_id).await;
    cleanup_listing_and_user(&pool, prod_listing_id, prod_owner_id).await;
    restore_public_catalog_env(prev);
}

/// 过滤关闭时（**`=0`**）烟测 listing 仍对 **`GET …/listings`** 可见（Admin/IT 直查）。
#[tokio::test]
async fn public_catalog_surface_off_includes_test_provider_listings() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: public_catalog_surface_off_includes_test_provider_listings (DATABASE_URL unset)"
        );
        return;
    };
    let prev = std::env::var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE").ok();
    std::env::set_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE", "0");

    let (listing_id, owner_id) = seed_b_mkt_005_provider_listing(&pool).await;
    let router = app_stack_mkt_catalog(pool.clone());
    assert_b_mkt_005_provider_catalog_listings(router, listing_id).await;

    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
    restore_public_catalog_env(prev);
}

/// **`GET /api/v1/discover/orders`** 在公众过滤开启时隐藏 **`data_origin=test`** 草稿。
#[tokio::test]
async fn public_catalog_surface_hides_test_discover_draft_orders() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: public_catalog_surface_hides_test_discover_draft_orders (DATABASE_URL unset)"
        );
        return;
    };
    let prev = std::env::var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE").ok();
    std::env::set_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE", "1");

    let city = format!("pcs-disc-{}", Uuid::new_v4());
    let (test_order_id, test_tourist_id) = seed_discover_draft_order(
        &pool,
        "test",
        &format!("disc-test-{}@traveltrust.test", Uuid::new_v4()),
        &city,
    )
    .await;
    let (prod_order_id, prod_tourist_id) = seed_discover_draft_order(
        &pool,
        "production",
        &format!("disc-prod-{}@example.com", Uuid::new_v4()),
        &city,
    )
    .await;

    let router = app_stack_mkt_catalog_hydrated(pool.clone()).await;
    let uri = format!("/api/v1/discover/orders?city={city}&limit=50");
    let res = router
        .oneshot(Request::builder().uri(uri).body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let j = response_json(res).await;
    assert_eq!(j["status"], "ok");
    let items = j["items"].as_array().expect("items");
    assert!(
        items.iter().any(|row| row["order_id"] == prod_order_id.to_string()),
        "production draft must appear in discover: {items:?}"
    );
    assert!(
        !items.iter().any(|row| row["order_id"] == test_order_id.to_string()),
        "test-origin draft must be hidden from discover: {items:?}"
    );

    cleanup_order_itinerary_user(&pool, test_order_id, test_tourist_id).await;
    cleanup_order_itinerary_user(&pool, prod_order_id, prod_tourist_id).await;
    restore_public_catalog_env(prev);
}

/// **`GET /api/v1/guides?city=`** 在公众过滤开启时隐藏 **`data_origin=test`** 向导。
#[tokio::test]
async fn public_catalog_surface_hides_test_guides() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: public_catalog_surface_hides_test_guides (DATABASE_URL unset)");
        return;
    };
    let prev = std::env::var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE").ok();
    std::env::set_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE", "1");

    let city = format!("pcs-gde-{}", Uuid::new_v4());
    let (test_guide_id, test_user_id) = seed_public_catalog_guide(
        &pool,
        "test",
        &format!("guide-test-{}@traveltrust.test", Uuid::new_v4()),
        &city,
    )
    .await;
    let (prod_guide_id, prod_user_id) = seed_public_catalog_guide(
        &pool,
        "production",
        &format!("guide-prod-{}@example.com", Uuid::new_v4()),
        &city,
    )
    .await;

    let router = app_stack_mkt_catalog_hydrated(pool.clone()).await;
    let uri = format!("/api/v1/guides?city={city}");
    let res = router
        .oneshot(Request::builder().uri(uri).body(Body::empty()).unwrap())
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let j = response_json(res).await;
    let guides = j["items"].as_array().expect("items");
    assert!(
        guides.iter().any(|row| row["id"] == prod_guide_id.to_string()),
        "production guide must appear: {guides:?}"
    );
    assert!(
        !guides.iter().any(|row| row["id"] == test_guide_id.to_string()),
        "test-origin guide must be hidden: {guides:?}"
    );

    cleanup_guide_user(&pool, test_guide_id, test_user_id).await;
    cleanup_guide_user(&pool, prod_guide_id, prod_user_id).await;
    restore_public_catalog_env(prev);
}

/// **`GET /api/v1/internal/public-catalog-surface/stats`** 返回 **`data_origin`** 分桶。
#[tokio::test]
async fn public_catalog_surface_stats_returns_data_origin_counts() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: public_catalog_surface_stats_returns_data_origin_counts (DATABASE_URL unset)"
        );
        return;
    };
    let prev = std::env::var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE").ok();
    std::env::set_var("TRAVELTRUST_PUBLIC_CATALOG_SURFACE", "1");

    let (listing_id, owner_id) = seed_b_mkt_005_provider_listing(&pool).await;
    let router = app_stack_mkt_catalog(pool.clone());

    let res = router
        .oneshot(
            Request::builder()
                .uri("/api/v1/internal/public-catalog-surface/stats")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let j = response_json(res).await;
    assert_eq!(j["status"], "ok");
    assert_eq!(j["filter_enabled"], true);
    let counts = &j["data_origin_counts"];
    assert!(counts["market_listings"]["test"].as_i64().unwrap_or(0) >= 1);
    assert!(counts["market_listings"]["total"].as_i64().unwrap_or(0) >= 1);

    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
    restore_public_catalog_env(prev);
}
