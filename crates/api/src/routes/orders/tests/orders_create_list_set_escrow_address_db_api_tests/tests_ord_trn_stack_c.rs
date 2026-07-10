use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use super::cleanup::cleanup_order_participants;
use super::ctx::{guide_staked_orders_ctx_app_stack_or_skip, guide_staked_orders_ctx_or_skip};
use super::support::{auth_bearer_value, response_json};

/// **93 · B-ORD-003** → **§8.2 · F-009**：**`GET /api/v1/orders/:id`** **200**；**`order.id` / `order.status`** 与 **`orders`** 行 **`status`** PG 读回一致（**`created`**）。
#[tokio::test]
async fn matrix_93_b_ord_003_f009_get_order_detail_status_matches_orders_pg() {
    let Some(cx) = guide_staked_orders_ctx_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_ord_003_f009_get_order_detail_status_matches_orders_pg (DATABASE_URL unset)"
        );
        return;
    };
    let create = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/orders")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::from(
                    json!({
                        "guide_id": &cx.guide_row_id,
                        "amount": "100",
                        "currency": "USD"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        create.status(),
        StatusCode::OK,
        "{:?}",
        response_json(create).await
    );
    let order_id = response_json(create).await["order"]["id"]
        .as_str()
        .expect("order id")
        .to_string();
    let oid = Uuid::parse_str(&order_id).expect("order id uuid");

    let detail = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/orders/{order_id}"))
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        detail.status(),
        StatusCode::OK,
        "{:?}",
        response_json(detail).await
    );
    let dj = response_json(detail).await;
    assert_eq!(dj["order"]["id"], order_id);
    assert_eq!(dj["order"]["status"], "created");

    let st: String = sqlx::query_scalar("SELECT status FROM orders WHERE id = $1")
        .bind(oid)
        .fetch_one(&cx.pool)
        .await
        .unwrap();
    assert_eq!(st, "created");

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}

/// **93 · B-ORD-003** → **§8.2 · F-009**：**`GET /api/v1/orders/:id`** **200**；**`order.status`** 与 **`orders.status`** PG 一致（**`created`**；**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_ord_003b_f009_get_order_detail_status_matches_orders_app_stack_ok_pg() {
    let Some(cx) = guide_staked_orders_ctx_app_stack_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_ord_003b_f009_get_order_detail_status_matches_orders_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let create = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/orders")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::from(
                    json!({
                        "guide_id": &cx.guide_row_id,
                        "amount": "100",
                        "currency": "USD"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        create.status(),
        StatusCode::OK,
        "{:?}",
        response_json(create).await
    );
    let order_id = response_json(create).await["order"]["id"]
        .as_str()
        .expect("order id")
        .to_string();
    let oid = Uuid::parse_str(&order_id).expect("order id uuid");

    let detail = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/orders/{order_id}"))
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        detail.status(),
        StatusCode::OK,
        "{:?}",
        response_json(detail).await
    );
    let dj = response_json(detail).await;
    assert_eq!(dj["order"]["id"], order_id);
    assert_eq!(dj["order"]["status"], "created");

    let st: String = sqlx::query_scalar("SELECT status FROM orders WHERE id = $1")
        .bind(oid)
        .fetch_one(&cx.pool)
        .await
        .unwrap();
    assert_eq!(st, "created");

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}
