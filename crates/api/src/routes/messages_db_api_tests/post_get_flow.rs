use std::sync::Arc;

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use http_body_util::BodyExt;
use serde_json::json;
use tokio::sync::RwLock;
use tower::ServiceExt;

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::routes::messages;
use crate::state::test_support::api_meta_state;

use super::helpers::{
    app_stack_f026, assert_b_msg_002_post_get_messages,
    assert_b_msg_002_post_two_messages_then_get_lists_both, auth_bearer, cleanup_order_bundle,
    db_it_lock, pool_or_skip, seed_f026_order_messages_fixture,
    seed_f026_order_messages_fixture_dual,
};

#[tokio::test]
async fn matrix_93_b_msg_002_f026_post_order_messages_then_get_lists_content() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_msg_002_f026_post_order_messages_then_get_lists_content (DATABASE_URL unset)"
        );
        return;
    };
    let (order_id, guide_row_id, tourist_id, guide_user_id, token) =
        seed_f026_order_messages_fixture(&pool).await;

    let co = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: Some(pool.clone()),
    };
    let r = messages::router().with_state(api_meta_state(Some(co)));
    assert_b_msg_002_post_get_messages(r, &token, order_id, "router oneshot line").await;

    cleanup_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}

#[tokio::test]
async fn matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_msg_002_f026_post_get_order_messages_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let (order_id, guide_row_id, tourist_id, guide_user_id, token) =
        seed_f026_order_messages_fixture(&pool).await;
    let router = app_stack_f026(pool.clone()).await;
    assert_b_msg_002_post_get_messages(router, &token, order_id, "app_stack_msg_line").await;
    cleanup_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}

/// **93 · B-MSG-002** → **§8.2 · F-026**：**`router::app`** **连续** **`POST …/messages`×2** → **`GET`** **列表** **含两条**（**Bearer**）。
#[tokio::test]
async fn matrix_93_b_msg_002b_f026_post_two_order_messages_then_get_lists_both_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_msg_002b_f026_post_two_order_messages_then_get_lists_both_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let (order_id, guide_row_id, tourist_id, guide_user_id, token) =
        seed_f026_order_messages_fixture(&pool).await;
    let router = app_stack_f026(pool.clone()).await;
    assert_b_msg_002_post_two_messages_then_get_lists_both(
        router,
        &token,
        order_id,
        "app_stack_msg_a",
        "app_stack_msg_b",
    )
    .await;
    cleanup_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}

/// **93 · B-MSG-002** → **§8.2 · F-026**：**旅客 `POST …/messages`→向导 `GET`** **同线程可读**（**`router::app`**；**双 `sessions` Bearer**）。
#[tokio::test]
async fn matrix_93_b_msg_002c_f026_tourist_posts_guide_reads_messages_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_msg_002c_f026_tourist_posts_guide_reads_messages_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let (order_id, guide_row_id, tourist_id, guide_user_id, token_t, token_g) =
        seed_f026_order_messages_fixture_dual(&pool).await;
    let router = app_stack_f026(pool.clone()).await;
    let post_uri = format!("/api/v1/orders/{}/messages", order_id);
    let line = "matrix_93_b_msg_002c_dual_read";
    let post_res = router
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&post_uri)
                .header(header::AUTHORIZATION, auth_bearer(&token_t))
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({ "content": line }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(post_res.status(), StatusCode::OK);

    let get_res = router
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&post_uri)
                .header(header::AUTHORIZATION, auth_bearer(&token_g))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::OK);
    let get_j: serde_json::Value =
        serde_json::from_slice(&get_res.into_body().collect().await.unwrap().to_bytes())
            .expect("get json");
    assert_eq!(get_j["status"], "ok");
    let items = get_j["items"].as_array().expect("items");
    assert!(
        items.iter().any(|m| m["content"] == line),
        "guide bearer should see tourist message: {items:?}"
    );

    cleanup_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}
