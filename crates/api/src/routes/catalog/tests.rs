//! Catalog API contract smoke（S2-API-RO）
//! 需 `DATABASE_URL` + 已 import catalog 数据；无数据时 skip。

use axum::body::Body;
use axum::http::{Request, StatusCode};
use http_body_util::BodyExt;
use std::sync::Arc;
use tower::ServiceExt;

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::it_db_pool;
use crate::middleware::IdempotencyCache;
use crate::router::app;
use crate::state::test_support::api_meta_state;
use tokio::sync::RwLock;

async fn response_json(res: axum::response::Response) -> serde_json::Value {
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).unwrap_or_else(|_| serde_json::json!({}))
}

fn chain_off_with_pool(pool: sqlx::PgPool) -> ChainOffState {
    ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    }
}

fn app_with_pool(pool: sqlx::PgPool) -> axum::Router {
    let co = chain_off_with_pool(pool.clone());
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    app(api_meta_state(Some(co)), idem, Some(pool))
}

async fn get_catalog(app: &axum::Router, path: &str) -> (StatusCode, serde_json::Value) {
    let req = Request::builder()
        .uri(path)
        .body(Body::empty())
        .unwrap();
    let res = app.clone().oneshot(req).await.unwrap();
    let status = res.status();
    (status, response_json(res).await)
}

#[tokio::test]
async fn catalog_ro_endpoints_smoke_when_db_and_data_present() {
    let Some(pool) = it_db_pool::connect_migrated_pg_it_pool().await else {
        eprintln!("skip catalog_ro_endpoints_smoke: DATABASE_URL unset");
        return;
    };
    let summary = crate::db::count_catalog_published_summary(&pool).await;
    let Ok((countries, cities, pois, pricing, routes, media, hotel_tiers)) = summary else {
        eprintln!("skip catalog_ro_endpoints_smoke: count failed");
        return;
    };
    if countries == 0 {
        eprintln!("skip catalog_ro_endpoints_smoke: no catalog countries (run catalog-import apply)");
        return;
    }

    let app = app_with_pool(pool);

    let paths = [
        ("/api/v1/catalog/countries", countries),
        ("/api/v1/catalog/cities", cities),
        ("/api/v1/catalog/pois", pois),
        ("/api/v1/catalog/pricing", pricing),
        ("/api/v1/catalog/intercity-routes", routes),
        ("/api/v1/catalog/media", media),
        ("/api/v1/catalog/hotel-tiers", hotel_tiers),
    ];

    for (path, expected) in paths {
        let (status, body) = get_catalog(&app, path).await;
        assert_eq!(status, StatusCode::OK, "{} body={}", path, body);
        assert_eq!(body["status"], "ok", "{}", path);
        assert_eq!(
            body["count"].as_i64().unwrap_or(-1),
            expected,
            "{}",
            path
        );
        assert!(body["items"].is_array(), "{}", path);
    }

    let (status, body) = get_catalog(&app, "/api/v1/catalog/cities?country_iso=CN").await;
    assert_eq!(status, StatusCode::OK);
    assert!(body["count"].as_i64().unwrap_or(0) >= 1);

    let (status, _) = get_catalog(
        &app,
        "/api/v1/catalog/intercity-routes?from_city=东京&to_city=大阪",
    )
    .await;
    assert_eq!(status, StatusCode::OK);

    let (status, body) = get_catalog(&app, "/api/v1/catalog/pricing?country_iso=CN").await;
    assert_eq!(status, StatusCode::OK, "pricing body={}", body);
    let row = &body["items"][0];
    assert_eq!(row["currency_code"], "CNY");
    for key in [
        "per_attraction_cents",
        "per_food_cents",
        "hotel_base_per_night_cents",
        "city_transport_price",
        "intercity_price_per_person",
        "guide_levels_per_day",
    ] {
        assert!(row.get(key).is_some(), "missing pricing key {key}");
    }
    assert!(row["city_transport_price"]["sedan"].is_number());
    assert!(row["city_transport_price"]["suv"].is_number());
    assert!(row["city_transport_price"]["van"].is_number());
    assert!(row["intercity_price_per_person"]["flight"].is_number());
    assert!(row["intercity_price_per_person"]["rail"].is_number());
    assert!(row["guide_levels_per_day"]["primary"].is_number());
    assert!(row["guide_levels_per_day"]["intermediate"].is_number());
    assert!(row["guide_levels_per_day"]["advanced"].is_number());
    assert!(row["guide_levels_per_day"]["expert"].is_number());
}

#[tokio::test]
async fn catalog_ro_pricing_cn_cents_match_imported_data() {
    let Some(pool) = it_db_pool::connect_migrated_pg_it_pool().await else {
        eprintln!("skip catalog_ro_pricing_cn_cents: DATABASE_URL unset");
        return;
    };
    let summary = crate::db::count_catalog_published_summary(&pool).await;
    let Ok((countries, _, _, _, _, _, _)) = summary else {
        eprintln!("skip catalog_ro_pricing_cn_cents: count failed");
        return;
    };
    if countries == 0 {
        eprintln!("skip catalog_ro_pricing_cn_cents: no catalog data");
        return;
    }

    let app = app_with_pool(pool);
    let (status, body) = get_catalog(&app, "/api/v1/catalog/pricing?country_iso=CN").await;
    assert_eq!(status, StatusCode::OK);
    let row = &body["items"][0];
    assert_eq!(row["per_attraction_cents"].as_i64(), Some(1800));
    assert_eq!(row["per_food_cents"].as_i64(), Some(1000));
    assert_eq!(row["hotel_base_per_night_cents"].as_i64(), Some(5000));
    assert_eq!(row["city_transport_price"]["sedan"].as_i64(), Some(8000));
    assert_eq!(row["intercity_price_per_person"]["flight"].as_i64(), Some(40000));
    assert_eq!(row["guide_levels_per_day"]["primary"].as_i64(), Some(15000));
}

#[tokio::test]
async fn catalog_ro_poi_images_beijing_attractions_when_db_and_data_present() {
    let Some(pool) = it_db_pool::connect_migrated_pg_it_pool().await else {
        eprintln!("skip catalog_ro_poi_images: DATABASE_URL unset");
        return;
    };
    let summary = crate::db::count_catalog_published_summary(&pool).await;
    let Ok((countries, _, _, _, _, _, _)) = summary else {
        eprintln!("skip catalog_ro_poi_images: count failed");
        return;
    };
    if countries == 0 {
        eprintln!("skip catalog_ro_poi_images: no catalog data");
        return;
    }

    let app = app_with_pool(pool);
    let (status, body) = get_catalog(
        &app,
        "/api/v1/catalog/poi-images?country_iso=CN&city=北京&type=attraction",
    )
    .await;
    assert_eq!(status, StatusCode::OK, "poi-images body={}", body);
    assert!(body["count"].as_i64().unwrap_or(0) >= 1);
    let row = &body["items"][0];
    assert!(row["poi_id"].is_string());
    assert!(row["image_url"].as_str().unwrap_or("").starts_with("http"));
    assert!(row["image_source"].is_string());

    let poi_id = row["poi_id"].as_str().unwrap();
    let (status, one) = get_catalog(&app, &format!("/api/v1/catalog/poi-images/{poi_id}")).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(one["count"].as_i64(), Some(1));
    assert_eq!(one["items"][0]["image_url"], row["image_url"]);
}

#[tokio::test]
async fn catalog_ro_returns_503_without_db_pool() {
    let idem = Arc::new(RwLock::new(IdempotencyCache::default()));
    let app = app(api_meta_state(None), idem, None);
    for path in [
        "/api/v1/catalog/countries",
        "/api/v1/catalog/pricing",
        "/api/v1/catalog/hotel-tiers",
        "/api/v1/catalog/poi-images?country_iso=CN",
    ] {
        let (status, body) = get_catalog(&app, path).await;
        assert_eq!(status, StatusCode::SERVICE_UNAVAILABLE, "{}", path);
        assert_eq!(body["error"], "catalog_db_unavailable", "{}", path);
    }
}
