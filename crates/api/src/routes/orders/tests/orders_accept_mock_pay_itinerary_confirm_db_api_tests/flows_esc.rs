use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use axum::Router;
use serde_json::json;
use sqlx::PgPool;
use tower::ServiceExt;
use uuid::Uuid;

use super::cleanup::cleanup_order_participants;
use super::support::{auth_bearer_value, db_router, response_json};

/// **B-ESC-001（前缀）**：注册 → 向导 **`POST …/guides`** → **`stake`** → 旅客 **`POST …/orders`** → 向导 **`POST …/accept`** → **`accepted`**。**不** **`mock-pay`**。**不** cleanup。
/// 返回 **`(app, tourist_email, guide_email, order_id, token_tourist, token_guide)`** 供 **`confirm-bilateral`** / **`mock-pay`** 等续链。
pub(super) async fn run_b_esc_001_to_accepted_with_app(
    pool: &PgPool,
    app: Router,
) -> (Router, String, String, String, String, String) {
    let suffix = Uuid::new_v4();
    let tourist_email = format!("orders-mockpay-it-t-{suffix}@traveltrust.test");
    let guide_email = format!("orders-mockpay-it-g-{suffix}@traveltrust.test");

    cleanup_order_participants(pool, &tourist_email, &guide_email).await;

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
                        "nickname": "tourist_mp"
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

    let reg_g = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/register")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &guide_email,
                        "password": "TestPass12!",
                        "nickname": "guide_mp"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        reg_g.status(),
        StatusCode::OK,
        "{:?}",
        response_json(reg_g).await
    );
    let token_g = response_json(reg_g).await["token"]
        .as_str()
        .expect("guide token")
        .to_string();

    let gc = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/guides")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_g))
                .body(Body::from(
                    json!({
                        "city": "Shanghai",
                        "country_code": "CN",
                        "languages": ["zh"],
                        "service_types": ["walking"]
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    let gc_status = gc.status();
    let gc_j = response_json(gc).await;
    assert_eq!(gc_status, StatusCode::OK, "{:?}", gc_j);
    let guide_row_id = gc_j["guide"]["id"].as_str().expect("guide id").to_string();

    let stake = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/guides/{guide_row_id}/stake"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_g))
                .body(Body::from(json!({"amount": "1"}).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        stake.status(),
        StatusCode::OK,
        "{:?}",
        response_json(stake).await
    );

    let create = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/orders")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::from(
                    json!({
                        "guide_id": guide_row_id,
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
    let order_id = create_j["order"]["id"]
        .as_str()
        .expect("order id")
        .to_string();

    let accept = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/accept"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_g))
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
    let accept_j = response_json(accept).await;
    assert_eq!(accept_j["order"]["status"], "accepted");

    (app, tourist_email, guide_email, order_id, token_t, token_g)
}

/// **B-ESC-001**：接单 → **`mock-pay`** → **`escrowed`**；**`GET /orders/:id`** 再读一致。**不** cleanup。
/// 返回 **`(app, tourist_email, guide_email, order_id, token_tourist, token_guide)`** 供 **`B-DSP-001`** / **`B-ESC-002`** 等续链。
pub(super) async fn run_b_esc_001_mock_pay_flow_with_app(
    pool: &PgPool,
    app: Router,
) -> (Router, String, String, String, String, String) {
    let (app, tourist_email, guide_email, order_id, token_t, token_g) =
        run_b_esc_001_to_accepted_with_app(pool, app).await;

    let pay = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/mock-pay"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        pay.status(),
        StatusCode::OK,
        "{:?}",
        response_json(pay).await
    );
    let pay_j = response_json(pay).await;
    assert_eq!(pay_j["status"], "ok");
    assert_eq!(pay_j["order"]["status"], "escrowed");
    assert!(pay_j["order"]["escrowed_at"].is_string());

    let get = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/orders/{order_id}"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        get.status(),
        StatusCode::OK,
        "{:?}",
        response_json(get).await
    );
    let gj = response_json(get).await;
    assert_eq!(gj["order"]["status"], "escrowed");

    (app, tourist_email, guide_email, order_id, token_t, token_g)
}

/// **`mock-pay`→`escrowed`** → 向导 **`POST …/confirm-completion`** → **`completed`**（**`GET …/orders/:id`** 再读）。
pub(super) async fn run_b_esc_002_completed_with_app(
    pool: &PgPool,
    app: Router,
) -> (Router, String, String, String, String, String) {
    let (app, tourist_email, guide_email, order_id, token_t, token_g) =
        run_b_esc_001_mock_pay_flow_with_app(pool, app).await;

    let cc = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/confirm-completion"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_g))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(cc.status(), StatusCode::OK, "{:?}", response_json(cc).await);
    let cc_j = response_json(cc).await;
    assert_eq!(cc_j["order"]["status"], "completed");

    let get = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/orders/{order_id}"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        get.status(),
        StatusCode::OK,
        "{:?}",
        response_json(get).await
    );
    let gj = response_json(get).await;
    assert_eq!(gj["order"]["status"], "completed");

    (app, tourist_email, guide_email, order_id, token_t, token_g)
}

pub(super) async fn run_b_esc_001_mock_pay_flow(
    pool: &PgPool,
) -> (Router, String, String, String, String, String) {
    run_b_esc_001_mock_pay_flow_with_app(pool, db_router(pool.clone())).await
}
