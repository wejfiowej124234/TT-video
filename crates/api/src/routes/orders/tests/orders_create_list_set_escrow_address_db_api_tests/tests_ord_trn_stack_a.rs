use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;

use super::cleanup::cleanup_order_participants;
use super::ctx::{guide_staked_orders_ctx_app_stack_or_skip, guide_staked_orders_ctx_or_skip};
use super::support::{auth_bearer_value, response_json};

/// **93 · B-ORD-001** → **§8.2 · F-008**：**`POST /api/v1/orders`** **200**；**`orders`** 行存在。
#[tokio::test]
async fn matrix_93_b_ord_001_post_orders_ok_persisted_pg_row() {
    let Some(cx) = guide_staked_orders_ctx_or_skip().await else {
        eprintln!("skip: matrix_93_b_ord_001_post_orders_ok_persisted_pg_row (DATABASE_URL unset)");
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
    let create_j = response_json(create).await;
    assert_eq!(create_j["status"], "ok");
    let order_id = create_j["order"]["id"]
        .as_str()
        .expect("order id")
        .to_string();
    let oid = uuid::Uuid::parse_str(&order_id).expect("order id uuid");

    let cnt: i64 = sqlx::query_scalar("SELECT COUNT(*)::bigint FROM orders WHERE id = $1")
        .bind(oid)
        .fetch_one(&cx.pool)
        .await
        .unwrap();
    assert_eq!(cnt, 1, "B-ORD-001 expects orders row");

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}

/// **93 · B-ORD-001** → **§8.2 · F-008**：**`POST /api/v1/orders`** **200**；**`orders`** 行存在（**`router::app`** **主栈**）。
#[tokio::test]
async fn matrix_93_b_ord_001b_f008_post_orders_ok_persisted_pg_row_app_stack_ok_pg() {
    let Some(cx) = guide_staked_orders_ctx_app_stack_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_ord_001b_f008_post_orders_ok_persisted_pg_row_app_stack_ok_pg (DATABASE_URL unset)"
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
    let create_j = response_json(create).await;
    assert_eq!(create_j["status"], "ok");
    let order_id = create_j["order"]["id"]
        .as_str()
        .expect("order id")
        .to_string();
    let oid = uuid::Uuid::parse_str(&order_id).expect("order id uuid");

    let cnt: i64 = sqlx::query_scalar("SELECT COUNT(*)::bigint FROM orders WHERE id = $1")
        .bind(oid)
        .fetch_one(&cx.pool)
        .await
        .unwrap();
    assert_eq!(cnt, 1, "B-ORD-001 app_stack expects orders row");

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}

/// **93 · B-ORD-001** → **§8.2 · F-008**：**`POST /api/v1/orders`** 后 **`GET /api/v1/orders/:id`** **`200`**；**`order.status`**=`created`（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_ord_001c_f008_post_order_get_detail_created_app_stack_ok_pg() {
    let Some(cx) = guide_staked_orders_ctx_app_stack_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_ord_001c_f008_post_order_get_detail_created_app_stack_ok_pg (DATABASE_URL unset)"
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

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}

/// **93 · B-ORD-004** → **§8.2 · F-008**：**`PATCH /api/v1/orders/:id/itinerary`**（**旅客 Bearer**）**200**；**`GET …/orders/:id`** **`itinerary.daily_itinerary[0].content_text`** **读回**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg() {
    let Some(cx) = guide_staked_orders_ctx_app_stack_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_ord_004b_f008_patch_itinerary_then_get_detail_reflects_app_stack_ok_pg (DATABASE_URL unset)"
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

    let patch = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!("/api/v1/orders/{order_id}/itinerary"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::from(
                    json!({
                        "daily_itinerary": [{
                            "day_index": 1,
                            "city": "上海",
                            "content_text": "matrix_93_b_ord_004b_patch_ok"
                        }]
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        patch.status(),
        StatusCode::OK,
        "{:?}",
        response_json(patch).await
    );
    let pj = response_json(patch).await;
    assert_eq!(pj["status"], "ok");
    assert_eq!(pj["version"], 2);

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
    let daily = dj["order"]["itinerary"]["daily_itinerary"]
        .as_array()
        .expect("daily_itinerary");
    assert_eq!(
        daily[0]["content_text"].as_str().expect("content_text"),
        "matrix_93_b_ord_004b_patch_ok"
    );

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}
