use super::helpers::*;

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use chrono::Utc;
use serde_json::json;
use uuid::Uuid;

use crate::db::{insert_session, insert_user};
use tower::ServiceExt;

/// **93 · B-MKT-008** → **§8.2 · F-022**：**`router::app`** **`POST /api/v1/market/acquisition/listings`**（**Bearer**）→**`GET …/market/acquisition/listings`** 含新 **`listing_id`**。
#[tokio::test]
async fn matrix_93_b_mkt_008_f022_post_acquisition_listing_then_get_catalog_app_stack_ok_pg() {
    let _mkt = MktItEnvGuard::lock();
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_008_f022_post_acquisition_listing_then_get_catalog_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let owner_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_mkt_acq_{}", Uuid::new_v4());
    let email = format!("mkt-pub-acq-{owner_id}@example.com");

    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;

    insert_user(
        &pool, owner_id, &email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, owner_id)
        .await
        .expect("insert_session");
    seed_acquisition_market_publish_prereqs(&pool, owner_id).await;

    let router = app_stack_mkt_catalog(pool.clone());
    let post_body = acquisition_listing_post_json(json!({
        "kind": "acquisition_carry_studio_v1",
        "title": "matrix_93_b_mkt_008 acquisition publish"
    }));
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/market/acquisition/listings")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_j = response_json(post_res).await;
    assert_eq!(post_j["status"], "ok");
    let listing_id_str = post_j["listing_id"].as_str().expect("listing_id");
    let listing_id = Uuid::parse_str(listing_id_str).expect("listing uuid");

    assert_b_mkt_006_acquisition_catalog_listings(router, listing_id).await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
}

/// **93 · B-MKT-008 + B-MKT-010** → **§8.2 · F-022**：**`router::app`** **`POST …/market/acquisition/listings`** → **`GET …/market/acquisition/listings/:id`** **`listing.payload.title`** **读回**。
#[tokio::test]
async fn matrix_93_b_mkt_008c_f022_post_acquisition_listing_then_get_detail_payload_title_app_stack_ok_pg(
) {
    let _mkt = MktItEnvGuard::lock();
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_008c_f022_post_acquisition_listing_then_get_detail_payload_title_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let owner_id = Uuid::new_v4();
    let now = Utc::now();
    let token = format!("tts_mkt_acqc_{}", Uuid::new_v4());
    let email = format!("mkt-pubc-acq-{owner_id}@example.com");
    let title = "matrix_93_b_mkt_008c acquisition publish detail title";

    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;

    insert_user(
        &pool, owner_id, &email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &token, owner_id)
        .await
        .expect("insert_session");
    seed_acquisition_market_publish_prereqs(&pool, owner_id).await;

    let router = app_stack_mkt_catalog(pool.clone());
    let post_body = acquisition_listing_post_json(json!({
        "kind": "acquisition_carry_studio_v1",
        "title": title
    }));
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/market/acquisition/listings")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let post_j = response_json(post_res).await;
    assert_eq!(post_j["status"], "ok");
    let listing_id_str = post_j["listing_id"].as_str().expect("listing_id");
    let listing_id = Uuid::parse_str(listing_id_str).expect("listing uuid");

    let uri = format!("/api/v1/market/acquisition/listings/{listing_id}");
    let get_res = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let j = response_json(get_res).await;
    assert_eq!(j["status"], "ok");
    assert_eq!(j["listing"]["id"], listing_id.to_string());
    assert_eq!(j["listing"]["payload"]["title"], title);

    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
}

/// **93 · B-MKT-009** → **§8.2 · F-021**：**`router::app`** **`GET /api/v1/market/provider/listings/:id`** **`listing`** **JSON**（**`postgres_catalog`**）。
#[tokio::test]
async fn matrix_93_b_mkt_009_f021_get_provider_listing_detail_app_stack_ok_pg() {
    let _mkt = MktItEnvGuard::lock();
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_009_f021_get_provider_listing_detail_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let (listing_id, owner_id) = seed_b_mkt_005_provider_listing(&pool).await;
    let router = app_stack_mkt_catalog(pool.clone());
    assert_b_mkt_009_provider_listing_detail(router, listing_id).await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
}

/// **93 · B-MKT-010** → **§8.2 · F-022**：**`router::app`** **`GET /api/v1/market/acquisition/listings/:id`** **`listing`** **JSON**（**`postgres_catalog`**）。
#[tokio::test]
async fn matrix_93_b_mkt_010_f022_get_acquisition_listing_detail_app_stack_ok_pg() {
    let _mkt = MktItEnvGuard::lock();
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_010_f022_get_acquisition_listing_detail_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let (listing_id, owner_id) = seed_b_mkt_006_acquisition_listing(&pool).await;
    let router = app_stack_mkt_catalog(pool.clone());
    assert_b_mkt_010_acquisition_listing_detail(router, listing_id).await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
}
