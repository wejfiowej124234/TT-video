use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;

use super::helpers::{
    app_stack_bm004, assert_bm004_post_get_market_bookmarks, auth_bearer,
    cleanup_bookmark_order_bundle, db_it_lock, pool_or_skip, response_json,
    seed_bm004_bookmark_fixture,
};

/// **93 · B-MKT-004 + B-MKT-013** → **§8.2 · F-020**：**`router::app`** **同一用户** **先** **`POST` order 星标** **再** **`POST` guide 星标**→**`GET …/me/market-bookmarks`** **`order_ids`** **与** **`guide_ids`** **各含目标 id**。
#[tokio::test]
async fn matrix_93_b_mkt_004f_f020_post_order_then_guide_bookmarks_get_lists_both_app_stack_ok_pg()
{
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_004f_f020_post_order_then_guide_bookmarks_get_lists_both_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let (order_id, guide_row_id, tourist_id, guide_user_id, token) =
        seed_bm004_bookmark_fixture(&pool).await;
    let router = app_stack_bm004(pool.clone());
    assert_bm004_post_get_market_bookmarks(router.clone(), &token, order_id).await;

    let post_guide = json!({
        "target_type": "guide",
        "target_id": guide_row_id.to_string(),
    });
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/market-bookmarks")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_guide.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    let pj = response_json(post_res).await;
    assert_eq!(pj["status"], "ok");

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
        "expected order_id in order_ids: {order_ids:?}"
    );
    assert!(
        guide_ids.contains(&guide_row_id.to_string()),
        "expected guide_row_id in guide_ids: {guide_ids:?}"
    );

    cleanup_bookmark_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}

/// **93 · B-MKT-004 + B-MKT-013** → **§8.2 · F-020**：**`router::app`** **order+guide 双星标** **后** **`DELETE …/me/market-bookmarks/order/:id`** **与** **`DELETE …/me/market-bookmarks/guide/:id`** **再** **`GET`** **两列表** **均不含** **对应 id**。
#[tokio::test]
async fn matrix_93_b_mkt_004g_f020_post_order_guide_bookmarks_delete_both_then_lists_absent_app_stack_ok_pg(
) {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_004g_f020_post_order_guide_bookmarks_delete_both_then_lists_absent_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let (order_id, guide_row_id, tourist_id, guide_user_id, token) =
        seed_bm004_bookmark_fixture(&pool).await;
    let router = app_stack_bm004(pool.clone());
    assert_bm004_post_get_market_bookmarks(router.clone(), &token, order_id).await;

    let post_guide = json!({
        "target_type": "guide",
        "target_id": guide_row_id.to_string(),
    });
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/me/market-bookmarks")
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(post_guide.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);
    assert_eq!(response_json(post_res).await["status"], "ok");

    let del_o = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri(format!("/api/v1/me/market-bookmarks/order/{order_id}"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(del_o.status(), StatusCode::OK);
    assert_eq!(response_json(del_o).await["status"], "ok");

    let del_g = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri(format!("/api/v1/me/market-bookmarks/guide/{guide_row_id}"))
                .header(header::AUTHORIZATION, auth_bearer(&token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(del_g.status(), StatusCode::OK);
    assert_eq!(response_json(del_g).await["status"], "ok");

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
        !order_ids.contains(&order_id.to_string()),
        "expected order_id absent: {order_ids:?}"
    );
    assert!(
        !guide_ids.contains(&guide_row_id.to_string()),
        "expected guide_row_id absent: {guide_ids:?}"
    );

    cleanup_bookmark_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}
