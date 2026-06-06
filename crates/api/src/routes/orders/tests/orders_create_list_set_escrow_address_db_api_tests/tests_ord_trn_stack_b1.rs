use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;

use super::cleanup::cleanup_order_participants;
use super::ctx::{guide_staked_orders_ctx_app_stack_or_skip, guide_staked_orders_ctx_or_skip};
use super::support::{auth_bearer_value, response_json};

/// **93 · B-TRN-001** → **§8.2 · F-008**：**`POST /api/v1/orders/:id/accept`**（**向导 Bearer**）**200**；**`order.status`**=`accepted`。
#[tokio::test]
async fn matrix_93_b_trn_001_f008_post_order_accept_sets_status_accepted_pg() {
    let Some(cx) = guide_staked_orders_ctx_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_trn_001_f008_post_order_accept_sets_status_accepted_pg (DATABASE_URL unset)"
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

    let accept = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/accept"))
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_guide))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        accept.status(),
        StatusCode::OK,
        "{:?}",
        response_json(accept).await
    );
    let aj = response_json(accept).await;
    assert_eq!(aj["order"]["status"], "accepted");
    assert_eq!(aj["order"]["id"], order_id);

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}

/// **93 · B-TRN-001** → **§8.2 · F-008**：**`POST /api/v1/orders/:id/accept`**（**向导 Bearer**）**200**；**`order.status`**=`accepted`（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_trn_001b_f008_post_order_accept_sets_status_accepted_app_stack_ok_pg() {
    let Some(cx) = guide_staked_orders_ctx_app_stack_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_trn_001b_f008_post_order_accept_sets_status_accepted_app_stack_ok_pg (DATABASE_URL unset)"
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

    let accept = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/accept"))
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_guide))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        accept.status(),
        StatusCode::OK,
        "{:?}",
        response_json(accept).await
    );
    let aj = response_json(accept).await;
    assert_eq!(aj["order"]["status"], "accepted");
    assert_eq!(aj["order"]["id"], order_id);

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}

/// **93 · B-ORD-002** → **§8.2 · F-009**：**`GET /api/v1/orders`** **200**；**`items[]`** 含刚创建订单 **`id`**。
#[tokio::test]
async fn matrix_93_b_ord_002_f009_get_orders_list_contains_created_order_pg() {
    let Some(cx) = guide_staked_orders_ctx_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_ord_002_f009_get_orders_list_contains_created_order_pg (DATABASE_URL unset)"
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

    let list = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/orders")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        list.status(),
        StatusCode::OK,
        "{:?}",
        response_json(list).await
    );
    let list_j = response_json(list).await;
    let items = list_j["items"].as_array().expect("items");
    assert!(
        items
            .iter()
            .any(|it| it["id"].as_str() == Some(order_id.as_str())),
        "B-ORD-002: list should include created order id"
    );

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}

/// **93 · B-ORD-002** → **§8.2 · F-009**：**`GET /api/v1/orders`** **200**；**`items[]`** 含刚创建订单 **`id`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_ord_002b_f009_get_orders_list_contains_created_order_app_stack_ok_pg() {
    let Some(cx) = guide_staked_orders_ctx_app_stack_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_ord_002b_f009_get_orders_list_contains_created_order_app_stack_ok_pg (DATABASE_URL unset)"
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

    let list = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/orders")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        list.status(),
        StatusCode::OK,
        "{:?}",
        response_json(list).await
    );
    let list_j = response_json(list).await;
    let items = list_j["items"].as_array().expect("items");
    assert!(
        items
            .iter()
            .any(|it| it["id"].as_str() == Some(order_id.as_str())),
        "B-ORD-002 app_stack: list should include created order id"
    );

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}
