use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use super::cleanup::cleanup_order_participants;
use super::support::{
    app_stack_router, auth_bearer_value, orders_app_stack_it_lock, pool_or_skip, response_json,
};

/// **93 · B-MKT-001** → **§8.2 · F-009**：**`POST /api/v1/itineraries`** **draft** 后 **`GET /api/v1/discover/orders`** **`{ status, items }`** 主栈（**`items`** 含该 **`order_id`**）。
#[tokio::test]
async fn matrix_93_b_mkt_001b_f009_get_discover_orders_ok_shape_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_001b_f009_get_discover_orders_ok_shape_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _lock = orders_app_stack_it_lock().lock().await;

    let suffix = Uuid::new_v4();
    let tourist_email = format!("93-b-mkt-001b-{suffix}-t@traveltrust.test");
    let placeholder_guide = format!("93-b-mkt-001b-{suffix}-g@traveltrust.test");

    cleanup_order_participants(&pool, &tourist_email, &placeholder_guide).await;

    let app = app_stack_router(pool.clone());

    let reg_t = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/register")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &tourist_email,
                        "password": "TestPass12!",
                        "nickname": "tourist_mkt001b"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        reg_t.status(),
        StatusCode::OK,
        "{:?}",
        response_json(reg_t).await
    );
    let token_t = response_json(reg_t).await["token"]
        .as_str()
        .expect("tourist token")
        .to_string();

    let itin = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/itineraries")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::from(
                    json!({
                        "destination": "中国",
                        "city": "北京",
                        "travel_date": "2025-07-01",
                        "days": 2,
                        "budget_min": 1000.0,
                        "budget_max": 2000.0
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        itin.status(),
        StatusCode::OK,
        "{:?}",
        response_json(itin).await
    );
    let itin_j = response_json(itin).await;
    assert_eq!(itin_j["status"], "ok");
    assert_eq!(itin_j["order_status"], "draft");
    let order_id = itin_j["order_id"].as_str().expect("order_id").to_string();

    let disc = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/discover/orders")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        disc.status(),
        StatusCode::OK,
        "{:?}",
        response_json(disc).await
    );
    let dj = response_json(disc).await;
    assert_eq!(dj.get("status"), Some(&json!("ok")));
    let items = dj["items"].as_array().expect("discover items");
    assert!(
        items.iter().any(|c| {
            c["order_id"].as_str() == Some(order_id.as_str())
                || c["id"].as_str() == Some(order_id.as_str())
        }),
        "discover should list draft order_id={order_id}: {dj:?}"
    );

    cleanup_order_participants(&pool, &tourist_email, &placeholder_guide).await;
}
