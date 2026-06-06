use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;

use super::helpers::{
    app_stack_bm004, assert_bm004_post_get_guide_bookmarks, assert_bm004_post_get_market_bookmarks,
    auth_bearer, cleanup_bookmark_order_bundle, db_it_lock, pool_or_skip, response_json,
    seed_bm004_bookmark_fixture,
};

/// **93 · B-MKT-004** → **§8.2 · F-020**：**`router::app`** **`POST` order 星标** **后** **`POST`** **`target_type=listing`** **→** **400** **`invalid_target_type`** **再** **`GET …/me/market-bookmarks`** **`order_ids`** **仍含** **`orders.id`**。
#[tokio::test]
async fn matrix_93_b_mkt_004h_f020_post_order_bookmark_invalid_target_type_then_get_preserves_order_app_stack_ok_pg(
) {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_004h_f020_post_order_bookmark_invalid_target_type_then_get_preserves_order_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let (order_id, guide_row_id, tourist_id, guide_user_id, token) =
        seed_bm004_bookmark_fixture(&pool).await;
    let router = app_stack_bm004(pool.clone());
    assert_bm004_post_get_market_bookmarks(router.clone(), &token, order_id).await;

    let bad = json!({
        "target_type": "listing",
        "target_id": order_id.to_string(),
    });
    let bad_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/market-bookmarks")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(bad.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(bad_res.status(), StatusCode::BAD_REQUEST);
    let bj = response_json(bad_res).await;
    assert_eq!(bj["error"], "invalid_target_type");

    let get_res = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me/market-bookmarks")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let gj = response_json(get_res).await;
    assert_eq!(gj["status"], "ok");
    let order_ids: Vec<String> = gj["order_ids"]
        .as_array()
        .expect("order_ids")
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect();
    assert!(
        order_ids.contains(&order_id.to_string()),
        "expected order_id preserved after invalid POST: {order_ids:?}"
    );

    cleanup_bookmark_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}

/// **93 · B-MKT-004 + B-MKT-013** → **§8.2 · F-020**：**order** **与** **guide** **双 `POST` 星标** **后** **`POST` `target_type=listing`** **→** **400** **`invalid_target_type`** **再** **`GET …/me/market-bookmarks`** **`order_ids`/`guide_ids`** **仍各含** **原 id**（**`router::app`**；与 **`004h_*` 仅 order** **互补**）。
#[tokio::test]
async fn matrix_93_b_mkt_004i_f020_post_order_guide_bookmarks_invalid_listing_then_get_preserves_both_app_stack_ok_pg(
) {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_004i_f020_post_order_guide_bookmarks_invalid_listing_then_get_preserves_both_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let (order_id, guide_row_id, tourist_id, guide_user_id, token) =
        seed_bm004_bookmark_fixture(&pool).await;
    let router = app_stack_bm004(pool.clone());
    assert_bm004_post_get_market_bookmarks(router.clone(), &token, order_id).await;
    assert_bm004_post_get_guide_bookmarks(router.clone(), &token, guide_row_id).await;

    let bad = json!({
        "target_type": "listing",
        "target_id": order_id.to_string(),
    });
    let bad_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/market-bookmarks")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(bad.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(bad_res.status(), StatusCode::BAD_REQUEST);
    let bj = response_json(bad_res).await;
    assert_eq!(bj["error"], "invalid_target_type");

    let get_res = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me/market-bookmarks")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let gj = response_json(get_res).await;
    assert_eq!(gj["status"], "ok");
    let order_ids: Vec<String> = gj["order_ids"]
        .as_array()
        .expect("order_ids")
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect();
    let guide_ids: Vec<String> = gj["guide_ids"]
        .as_array()
        .expect("guide_ids")
        .iter()
        .filter_map(|v| v.as_str().map(|s| s.to_string()))
        .collect();
    assert!(
        order_ids.contains(&order_id.to_string()),
        "expected order_id preserved: {order_ids:?}"
    );
    assert!(
        guide_ids.contains(&guide_row_id.to_string()),
        "expected guide_row_id preserved: {guide_ids:?}"
    );

    cleanup_bookmark_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}
