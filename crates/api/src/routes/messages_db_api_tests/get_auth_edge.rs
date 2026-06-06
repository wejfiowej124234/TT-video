use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use http_body_util::BodyExt;
use tower::ServiceExt;

use super::helpers::{
    app_stack_f026, auth_bearer, cleanup_order_bundle, db_it_lock, pool_or_skip,
    seed_f026_order_messages_fixture,
};

/// **93 · B-MSG-001** → **§8.2 · F-026**：**`router::app`** **`GET /api/v1/orders/:id/messages`** **Bearer** **在** **无** **`POST`** **前** **`items=[]`**（**`order_messages` PG SSOT**）。
#[tokio::test]
async fn matrix_93_b_msg_001b_f026_get_order_messages_empty_list_ok_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_msg_001b_f026_get_order_messages_empty_list_ok_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let (order_id, guide_row_id, tourist_id, guide_user_id, token) =
        seed_f026_order_messages_fixture(&pool).await;
    let app = app_stack_f026(pool.clone());
    let get_uri = format!("/api/v1/orders/{}/messages", order_id);
    let get_res = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&get_uri)
                .header(header::AUTHORIZATION, auth_bearer(&token))
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
    assert!(items.is_empty(), "expected empty messages list: {items:?}");
    cleanup_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}

/// **93 · B-MSG-003** → **§8.2 · F-026**：**`router::app`** **`GET …/orders/:id/messages`** **无** **`Authorization`/`X-User-Id`** **→** **401** **`unauthorized`**（**`auth_placeholder_layer`**）。
#[tokio::test]
async fn matrix_93_b_msg_003b_f026_get_order_messages_no_auth_unauthorized_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_msg_003b_f026_get_order_messages_no_auth_unauthorized_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let (order_id, guide_row_id, tourist_id, guide_user_id, _token) =
        seed_f026_order_messages_fixture(&pool).await;
    let app = app_stack_f026(pool.clone());
    let get_uri = format!("/api/v1/orders/{}/messages", order_id);
    let get_res = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&get_uri)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(get_res.status(), StatusCode::UNAUTHORIZED);
    let get_j: serde_json::Value =
        serde_json::from_slice(&get_res.into_body().collect().await.unwrap().to_bytes())
            .expect("get json");
    assert_eq!(get_j["error"], "unauthorized");
    assert_eq!(get_j["message"], "unauthorized");
    cleanup_order_bundle(&pool, order_id, guide_row_id, tourist_id, guide_user_id).await;
}
