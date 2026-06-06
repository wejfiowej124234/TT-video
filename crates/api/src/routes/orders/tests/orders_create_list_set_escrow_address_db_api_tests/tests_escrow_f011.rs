use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;

use super::cleanup::cleanup_order_participants;
use super::ctx::{guide_staked_orders_ctx_app_stack_or_skip, guide_staked_orders_ctx_or_skip};
use super::support::{auth_bearer_value, response_json};

/// **93 · B-ORD-006** → **§8.2 · F-011**：**`POST …/set-escrow-address`** **200**；**`GET …/orders/:id`** 再读 **`escrow_address`** 一致（**MANUAL-P1** 用例的 **PG·oneshot** 回填）。
#[tokio::test]
async fn matrix_93_b_ord_006_set_escrow_address_get_detail_reflects() {
    let Some(cx) = guide_staked_orders_ctx_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_ord_006_set_escrow_address_get_detail_reflects (DATABASE_URL unset)"
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

    let escrow_addr = "0x1234567890123456789012345678901234567890";
    let set_esc = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/set-escrow-address"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::from(
                    json!({ "escrow_address": escrow_addr }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        set_esc.status(),
        StatusCode::OK,
        "{:?}",
        response_json(set_esc).await
    );
    let sj = response_json(set_esc).await;
    assert_eq!(sj["status"], "ok");
    assert_eq!(sj["escrow_address"], escrow_addr);

    let detail2 = cx
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
        detail2.status(),
        StatusCode::OK,
        "{:?}",
        response_json(detail2).await
    );
    let d2j = response_json(detail2).await;
    assert_eq!(
        d2j["order"]["escrow_address"].as_str(),
        Some(escrow_addr),
        "{:?}",
        d2j
    );

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}

/// **93 · B-ORD-006** → **§8.2 · F-011**：**`POST …/set-escrow-address`** **200**；**`GET …/orders/:id`** 再读 **`escrow_address`** 一致（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg() {
    let Some(cx) = guide_staked_orders_ctx_app_stack_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_ord_006b_f011_set_escrow_address_get_detail_reflects_app_stack_ok_pg (DATABASE_URL unset)"
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

    let escrow_addr = "0x1234567890123456789012345678901234567890";
    let set_esc = cx
        .app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/set-escrow-address"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&cx.token_tourist))
                .body(Body::from(
                    json!({ "escrow_address": escrow_addr }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        set_esc.status(),
        StatusCode::OK,
        "{:?}",
        response_json(set_esc).await
    );
    let sj = response_json(set_esc).await;
    assert_eq!(sj["status"], "ok");
    assert_eq!(sj["escrow_address"], escrow_addr);

    let detail2 = cx
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
        detail2.status(),
        StatusCode::OK,
        "{:?}",
        response_json(detail2).await
    );
    let d2j = response_json(detail2).await;
    assert_eq!(
        d2j["order"]["escrow_address"].as_str(),
        Some(escrow_addr),
        "{:?}",
        d2j
    );

    cleanup_order_participants(&cx.pool, &cx.tourist_email, &cx.guide_email).await;
}
