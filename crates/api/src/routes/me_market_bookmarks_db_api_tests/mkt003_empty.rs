use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use super::helpers::{
    app_stack_bm004, auth_bearer, cleanup_user_by_email, db_it_lock, pool_or_skip, response_json,
};

/// **93 · B-MKT-003** → **§8.2 · F-020**：**`GET /api/v1/me/market-bookmarks`** **200**；**`order_ids`** **空**（**`router::app`**；**未** **`POST` 星标**）。
#[tokio::test]
async fn matrix_93_b_mkt_003b_f020_get_market_bookmarks_empty_order_ids_ok_app_stack_ok_pg() {
    let _guard = db_it_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_003b_f020_get_market_bookmarks_empty_order_ids_ok_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let suffix = Uuid::new_v4();
    let email = format!("93-b-mkt-003b-f020-{suffix}@traveltrust.test");
    cleanup_user_by_email(&pool, &email).await;

    let app = app_stack_bm004(pool.clone());

    let reg = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/register")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &email,
                        "password": "TestPass12!",
                        "nickname": "tourist_mkt003b"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let reg_j = response_json(reg).await;
    let token = reg_j["token"].as_str().expect("token").to_string();

    let get_res = app
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
    let ids = gj["order_ids"].as_array().expect("order_ids");
    assert!(ids.is_empty(), "expected empty order_ids: {gj:?}");

    cleanup_user_by_email(&pool, &email).await;
}
