use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use super::cleanup::cleanup_order_participants;
use super::ctx::{guide_staked_orders_ctx_app_stack_or_skip, guide_staked_orders_ctx_or_skip};
use super::support::{auth_bearer_value, response_json};

/// **93 · B-TRN-002** → **§8.2 · F-009**：**`POST /api/v1/orders/:id/cancel`**（**旅客 Bearer**）**200**；**`order.status`**=`cancelled`；**`orders.status`** PG 读回。
#[tokio::test]
async fn matrix_93_b_trn_002_f009_post_order_cancel_created_sets_cancelled_pg() {
    let Some(cx) = guide_staked_orders_ctx_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_trn_002_f009_post_order_cancel_created_sets_cancelled_pg (DATABASE_URL unset)"
        );
        return;
    }
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
    let create_status = create.status();
    let create_j = response_json(create).await;
    assert_eq!(create_status, StatusCode::OK, "{:?}", create_j);
    let order_id = create_j["order"]["id"]
        .as_str()
        .expect("order id")
        .to_string();
    let oid = Uuid::parse_str(&order_id).expect("order id uuid");

    let cancel = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/cancel"))
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let cancel_status = cancel.status();
    let cj = response_json(cancel).await;
    assert_eq!(cancel_status, StatusCode::OK, "{:?}", cj);
    assert_eq!(cj["order"]["status"], "cancelled");
    assert_eq!(cj["order"]["id"], order_id);

    let st: String = sqlx::query_scalar("SELECT status FROM orders WHERE id = $1")
        .bind(oid)
        .fetch_one(&cx.pool)
        .await
        .unwrap();
    assert_eq!(st, "cancelled");

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}

/// **93 · B-TRN-002** → **§8.2 · F-009**：**`POST /api/v1/orders/:id/cancel`**（**旅客 Bearer**）**200**；**`order.status`**=`cancelled`；**`orders.status`** PG 读回（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_trn_002b_f009_post_order_cancel_created_sets_cancelled_app_stack_ok_pg() {
    let Some(cx) = guide_staked_orders_ctx_app_stack_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_trn_002b_f009_post_order_cancel_created_sets_cancelled_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
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
    let create_status = create.status();
    let create_j = response_json(create).await;
    assert_eq!(create_status, StatusCode::OK, "{:?}", create_j);
    let order_id = create_j["order"]["id"]
        .as_str()
        .expect("order id")
        .to_string();
    let oid = Uuid::parse_str(&order_id).expect("order id uuid");

    let cancel = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/cancel"))
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let cancel_status = cancel.status();
    let cj = response_json(cancel).await;
    assert_eq!(cancel_status, StatusCode::OK, "{:?}", cj);
    assert_eq!(cj["order"]["status"], "cancelled");
    assert_eq!(cj["order"]["id"], order_id);

    let st: String = sqlx::query_scalar("SELECT status FROM orders WHERE id = $1")
        .bind(oid)
        .fetch_one(&cx.pool)
        .await
        .unwrap();
    assert_eq!(st, "cancelled");

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}
