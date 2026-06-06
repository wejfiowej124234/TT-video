use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use axum::Router;
use serde_json::json;
use sqlx::PgPool;
use tower::ServiceExt;
use uuid::Uuid;

use super::cleanup::cleanup_order_participants;
use super::support::{auth_bearer_value, db_router, response_json};

/// **D-ITN-001**：**`POST /itineraries`** **200** + **`itineraries`** **PG** 行；返回 **`order_id`** + **`token_t`** 供 **`001c`** **`GET /orders/:id`** 链。**不** cleanup。
pub(super) async fn run_d_itn_001_draft_bundle_with_app(
    pool: &PgPool,
    app: Router,
) -> (String, String, String, String) {
    let suffix = Uuid::new_v4();
    let tourist_email = format!("93-d-itn-001-t-{suffix}@traveltrust.test");
    let unused_guide_email = format!("93-d-itn-001-ph-{suffix}@traveltrust.test");

    cleanup_order_participants(pool, &tourist_email, &unused_guide_email).await;

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
                        "nickname": "tourist_ditn"
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
    assert_eq!(itin_j["version"], 1);
    assert_eq!(itin_j["order_status"], "draft");
    let order_id = itin_j["order_id"].as_str().expect("order_id").to_string();
    let oid = Uuid::parse_str(&order_id).expect("order_id uuid");

    let cnt: i64 =
        sqlx::query_scalar("SELECT COUNT(*)::bigint FROM itineraries WHERE order_id = $1")
            .bind(oid)
            .fetch_one(pool)
            .await
            .unwrap();
    assert_eq!(cnt, 1, "D-ITN-001 expects itineraries row");

    (tourist_email, unused_guide_email, order_id, token_t)
}

pub(super) async fn run_d_itn_001_draft_only_with_app(
    pool: &PgPool,
    app: Router,
) -> (String, String) {
    let (tourist_email, unused_guide_email, _, _) =
        run_d_itn_001_draft_bundle_with_app(pool, app).await;
    (tourist_email, unused_guide_email)
}

pub(super) async fn run_d_itn_001_draft_only(pool: &PgPool) -> (String, String) {
    run_d_itn_001_draft_only_with_app(pool, db_router(pool.clone())).await
}

/// **B-ORD-005**：**`POST /itineraries`** → **`confirm-final-plan`**（**`expected_version: 1`**）→ **`snapshot_hash`**。**不** cleanup。
pub(super) async fn run_b_ord_005_itin_then_confirm_final_with_app(
    pool: &PgPool,
    app: Router,
) -> (String, String) {
    let suffix = Uuid::new_v4();
    let tourist_email = format!("93-b-ord-005-t-{suffix}@traveltrust.test");
    let unused_guide_email = format!("93-b-ord-005-ph-{suffix}@traveltrust.test");

    cleanup_order_participants(pool, &tourist_email, &unused_guide_email).await;

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
                        "nickname": "tourist_b05"
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
    assert_eq!(itin_j["version"], 1);
    assert_eq!(itin_j["order_status"], "draft");
    let order_id = itin_j["order_id"].as_str().expect("order_id").to_string();

    let confirm = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/confirm-final-plan"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::from(json!({ "expected_version": 1 }).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        confirm.status(),
        StatusCode::OK,
        "{:?}",
        response_json(confirm).await
    );
    let confirm_j = response_json(confirm).await;
    assert_eq!(confirm_j["status"], "ok");
    let snap = confirm_j["snapshot_hash"].as_str().expect("snapshot_hash");
    assert!(snap.starts_with("0x"), "snapshot_hash: {snap}");

    (tourist_email, unused_guide_email)
}

pub(super) async fn run_b_ord_005_itin_then_confirm_final(pool: &PgPool) -> (String, String) {
    run_b_ord_005_itin_then_confirm_final_with_app(pool, db_router(pool.clone())).await
}
