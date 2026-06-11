//! **94 · listing→order**：**`POST …/market/{provider|acquisition}/listings/:id/orders`**

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use chrono::Utc;
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::db::{insert_guide, insert_market_listing, insert_session, insert_user};

use super::helpers::{
    app_stack_mkt_catalog, auth_bearer, cleanup_listing_and_user, db_it_lock, pool_or_skip,
    response_json,
};

/// **`POST …/market/provider/listings/:id/orders`** 创建 **`Order`** 并返回 **`order.id`**。
#[tokio::test]
async fn matrix_94_provider_listing_post_order_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: matrix_94_provider_listing_post_order_app_stack_ok_pg (DATABASE_URL unset)");
        return;
    };
    let owner_id = Uuid::new_v4();
    let buyer_id = Uuid::new_v4();
    let listing_id = Uuid::new_v4();
    let guide_id = Uuid::new_v4();
    let now = Utc::now();
    let buyer_token = format!("tts_mkt_ord_{}", Uuid::new_v4());
    let owner_email = format!("mkt-own-{owner_id}@traveltrust.test");
    let buyer_email = format!("mkt-buy-{buyer_id}@traveltrust.test");

    let _ = sqlx::query("DELETE FROM orders WHERE tourist_id = $1")
        .bind(buyer_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM guides WHERE id = $1")
        .bind(guide_id)
        .execute(&pool)
        .await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(buyer_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(buyer_id)
        .execute(&pool)
        .await;

    insert_user(
        &pool, owner_id, &owner_email, None, "provider", "none", None, None, None, now, now,
    )
    .await
    .expect("insert owner");
    insert_guide(
        &pool,
        guide_id,
        owner_id,
        "Tokyo",
        "JP",
        &["ja".to_string()],
        &["walking".to_string()],
        Some("market listing fulfillment guide"),
        None,
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
    )
    .await
    .expect("insert_guide");
    let payload = json!({
        "kind": "merchant_showcase_studio_v1",
        "title": "matrix_94 provider order listing",
        "priceUsdc": 120
    });
    insert_market_listing(&pool, listing_id, "provider", owner_id, &payload, now, "test")
        .await
        .expect("insert_market_listing");

    insert_user(
        &pool, buyer_id, &buyer_email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert buyer");
    insert_session(&pool, &buyer_token, buyer_id)
        .await
        .expect("insert_session");

    let router = app_stack_mkt_catalog(pool.clone());
    let uri = format!("/api/v1/market/provider/listings/{listing_id}/orders");
    let res = router
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&uri)
                .header(header::AUTHORIZATION, auth_bearer(&buyer_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK, "post listing order");
    let j = response_json(res).await;
    assert_eq!(j["status"], "ok");
    assert_eq!(j["order_kind"], "merchant_listing");
    assert_eq!(j["market_listing_id"], listing_id.to_string());
    let order_id = j["order"]["id"].as_str().expect("order.id");

    let _ = sqlx::query("DELETE FROM orders WHERE id = $1")
        .bind(Uuid::parse_str(order_id).expect("order uuid"))
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM guides WHERE id = $1")
        .bind(guide_id)
        .execute(&pool)
        .await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(buyer_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(buyer_id)
        .execute(&pool)
        .await;
}

/// **`POST …/market/acquisition/listings/:id/orders`** — 承运向导接单创 **`Order`**。
#[tokio::test]
async fn matrix_94_acquisition_listing_post_order_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_94_acquisition_listing_post_order_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let owner_id = Uuid::new_v4();
    let carrier_id = Uuid::new_v4();
    let listing_id = Uuid::new_v4();
    let now = Utc::now();
    let carrier_token = format!("tts_mkt_acq_{}", Uuid::new_v4());
    let owner_email = format!("mkt-acq-own-{owner_id}@traveltrust.test");
    let carrier_email = format!("mkt-acq-car-{carrier_id}@traveltrust.test");

    let _ = sqlx::query("DELETE FROM orders WHERE tourist_id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM guides WHERE user_id = $1")
        .bind(carrier_id)
        .execute(&pool)
        .await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(carrier_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(carrier_id)
        .execute(&pool)
        .await;

    insert_user(
        &pool, owner_id, &owner_email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert owner");
    let payload = json!({
        "kind": "acquisition_carry_studio_v1",
        "title": "matrix_94 acquisition order listing",
        "bountyMinUsdc": 200
    });
    insert_market_listing(&pool, listing_id, "acquisition", owner_id, &payload, now, "test")
        .await
        .expect("insert_market_listing");

    insert_user(
        &pool,
        carrier_id,
        &carrier_email,
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
    .expect("insert carrier");
    insert_session(&pool, &carrier_token, carrier_id)
        .await
        .expect("insert_session");

    let router = app_stack_mkt_catalog(pool.clone());
    let uri = format!("/api/v1/market/acquisition/listings/{listing_id}/orders");
    let res = router
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&uri)
                .header(header::AUTHORIZATION, auth_bearer(&carrier_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK, "post acquisition listing order");
    let j = response_json(res).await;
    assert_eq!(j["status"], "ok");
    assert_eq!(j["order_kind"], "acquisition_listing");
    assert_eq!(j["market_listing_id"], listing_id.to_string());
    let order_id = j["order"]["id"].as_str().expect("order.id");

    let auto_guide_id: Uuid = sqlx::query_scalar(
        "SELECT id FROM guides WHERE user_id = $1 AND status = 'active' LIMIT 1",
    )
    .bind(carrier_id)
    .fetch_one(&pool)
    .await
    .expect("auto-provisioned acquisition guide");
    let svc_types: serde_json::Value = sqlx::query_scalar(
        "SELECT service_types FROM guides WHERE id = $1",
    )
    .bind(auto_guide_id)
    .fetch_one(&pool)
    .await
    .expect("guide service_types");
    assert!(
        svc_types
            .as_array()
            .map(|a| a.iter().any(|v| v.as_str() == Some("acquisition_fulfillment")))
            .unwrap_or(false),
        "expected acquisition_fulfillment service type"
    );

    let _ = sqlx::query("DELETE FROM orders WHERE id = $1")
        .bind(Uuid::parse_str(order_id).expect("order uuid"))
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM guides WHERE user_id = $1")
        .bind(carrier_id)
        .execute(&pool)
        .await;
    cleanup_listing_and_user(&pool, listing_id, owner_id).await;
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = $1")
        .bind(carrier_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(carrier_id)
        .execute(&pool)
        .await;
}
