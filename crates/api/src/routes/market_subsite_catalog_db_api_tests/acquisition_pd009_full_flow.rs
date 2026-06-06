//! **PD-009** 全链路 IT：发布 → 接单 → accept → mock-pay → escrowed。

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use chrono::Utc;
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::db::{insert_session, insert_user};

use super::helpers::*;

/// 旅行者发布收购 listing → 承运方接单 → 向导 **accept** → 委托方 **mock-pay** → **`escrowed`**。
#[tokio::test]
async fn matrix_pd009_full_flow_publish_order_accept_mock_pay_pg() {
    let _guard = db_it_lock().lock().await;
    let _p3 = RestoreP3ChainOff::set_chain_off();
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_pd009_full_flow_publish_order_accept_mock_pay_pg (DATABASE_URL unset)"
        );
        return;
    };
    let owner_id = Uuid::new_v4();
    let carrier_id = Uuid::new_v4();
    let now = Utc::now();
    let owner_token = format!("tts_pd009_full_own_{}", Uuid::new_v4());
    let carrier_token = format!("tts_pd009_full_car_{}", Uuid::new_v4());
    let owner_email = format!("pd009-full-own-{owner_id}@traveltrust.test");
    let carrier_email = format!("pd009-full-car-{carrier_id}@traveltrust.test");

    let _ = sqlx::query("DELETE FROM orders WHERE tourist_id = $1")
        .bind(owner_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM guides WHERE user_id = $1")
        .bind(carrier_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM staking_positions WHERE user_id = ANY(ARRAY[$1::uuid, $2::uuid])")
        .bind(owner_id)
        .bind(carrier_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = ANY(ARRAY[$1::uuid, $2::uuid])")
        .bind(owner_id)
        .bind(carrier_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = ANY(ARRAY[$1::uuid, $2::uuid])")
        .bind(owner_id)
        .bind(carrier_id)
        .execute(&pool)
        .await;

    insert_user(
        &pool, owner_id, &owner_email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert owner");
    insert_session(&pool, &owner_token, owner_id)
        .await
        .expect("owner session");

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
        .expect("carrier session");

    seed_acquisition_market_publish_prereqs(&pool, owner_id).await;

    let router = app_stack_mkt_catalog_hydrated(pool.clone()).await;

    let post_body = acquisition_listing_post_json(json!({
        "kind": "acquisition_carry_studio_v1",
        "title": "pd009 full flow listing",
        "bountyMinUsdc": 150,
        "bountyMaxUsdc": 400
    }));
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/market/acquisition/listings")
                .header(header::AUTHORIZATION, auth_bearer(&owner_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK, "publish listing");
    let post_j = response_json(post_res).await;
    let listing_id = post_j["listing_id"].as_str().expect("listing_id");

    let order_uri = format!("/api/v1/market/acquisition/listings/{listing_id}/orders");
    let order_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&order_uri)
                .header(header::AUTHORIZATION, auth_bearer(&carrier_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(order_res.status(), StatusCode::OK, "create order from listing");
    let order_j = response_json(order_res).await;
    assert_eq!(order_j["order_kind"], "acquisition_listing");
    let order_id = order_j["order"]["id"].as_str().expect("order.id");

    let accept_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/accept"))
                .header(header::AUTHORIZATION, auth_bearer(&carrier_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(accept_res.status(), StatusCode::OK, "guide accept order");
    let accept_j = response_json(accept_res).await;
    assert_eq!(accept_j["order"]["status"], "accepted");

    let pay_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/mock-pay"))
                .header(header::AUTHORIZATION, auth_bearer(&owner_token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(pay_res.status(), StatusCode::OK, "tourist mock-pay");
    let pay_j = response_json(pay_res).await;
    assert_eq!(pay_j["order"]["status"], "escrowed");

    let get_res = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/orders/{order_id}"))
                .header(header::AUTHORIZATION, auth_bearer(&owner_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let get_j = response_json(get_res).await;
    assert_eq!(get_j["order"]["status"], "escrowed");
    assert_eq!(get_j["order"]["order_kind"], "acquisition_listing");
    assert_eq!(get_j["order"]["market_listing_id"], listing_id);

    let listing_uuid = Uuid::parse_str(listing_id).unwrap();
    let order_uuid = Uuid::parse_str(order_id).unwrap();
    let _ = sqlx::query("DELETE FROM orders WHERE id = $1")
        .bind(order_uuid)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM guides WHERE user_id = $1")
        .bind(carrier_id)
        .execute(&pool)
        .await;
    cleanup_listing_and_user(&pool, listing_uuid, owner_id).await;
    let _ = sqlx::query("DELETE FROM sessions WHERE user_id = ANY(ARRAY[$1::uuid, $2::uuid])")
        .bind(owner_id)
        .bind(carrier_id)
        .execute(&pool)
        .await;
    let _ = sqlx::query("DELETE FROM users WHERE id = ANY(ARRAY[$1::uuid, $2::uuid])")
        .bind(owner_id)
        .bind(carrier_id)
        .execute(&pool)
        .await;
}
