use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use super::cleanup::{arb_email_for_mockpay_tourist, cleanup_arb_user, cleanup_order_participants};
use super::flows_esc::{run_b_esc_001_mock_pay_flow, run_b_esc_001_mock_pay_flow_with_app};
use super::flows_itn_ord::run_b_ord_005_itin_then_confirm_final;
use super::support::{
    app_stack_router, auth_bearer_value, mock_pay_itin_app_stack_it_lock, pool_or_skip,
    response_json, RestoreEnvVar, RestoreP3ChainOff,
};

#[tokio::test]
async fn f012_f013_itinerary_create_then_confirm_final_plan_db_api() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: f012_f013_itinerary_create_then_confirm_final_plan_db_api (DATABASE_URL unset)"
        );
        return;
    };
    let (tourist_email, unused_guide_email) = run_b_ord_005_itin_then_confirm_final(&pool).await;
    cleanup_order_participants(&pool, &tourist_email, &unused_guide_email).await;
}

/// **93 · B-ESC-001** → **§8.2 · F-010**（**§2.5 · AUTO-P0**）。
#[tokio::test]
async fn matrix_93_b_esc_001_mock_pay_then_get_order_escrowed() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_esc_001_mock_pay_then_get_order_escrowed (DATABASE_URL unset)"
        );
        return;
    };
    let _env_lock = crate::test_env_serial::lock();
    std::env::remove_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS");
    std::env::remove_var("TRAVELTRUST_DENY_MOCK_PAY");
    let prev_p3 = std::env::var("P3_CHAIN_OFF").ok();
    std::env::set_var("P3_CHAIN_OFF", "1");
    let _p3_restore = RestoreP3ChainOff { previous: prev_p3 };

    let (_app, tourist_email, guide_email, _, _, _) = run_b_esc_001_mock_pay_flow(&pool).await;
    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
}

/// **93 · B-DSP-001** → **§8.2 · F-025**：**`POST /api/v1/orders/:id/dispute`** **200** → **`GET /api/v1/disputes`** **`items[]`** 含新 **`id`**。
#[tokio::test]
async fn matrix_93_b_dsp_001_f025_post_order_dispute_then_list_contains_dispute_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_dsp_001_f025_post_order_dispute_then_list_contains_dispute_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _env_lock = crate::test_env_serial::lock();
    std::env::remove_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS");
    std::env::remove_var("TRAVELTRUST_DENY_MOCK_PAY");
    let prev_p3 = std::env::var("P3_CHAIN_OFF").ok();
    std::env::set_var("P3_CHAIN_OFF", "1");
    let _p3_restore = RestoreP3ChainOff { previous: prev_p3 };

    let (app, tourist_email, guide_email, order_id, token_t, _token_g) =
        run_b_esc_001_mock_pay_flow(&pool).await;

    let open = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/dispute"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::from(
                    json!({ "reason": "matrix_93_b_dsp_001" }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        open.status(),
        StatusCode::OK,
        "{:?}",
        response_json(open).await
    );
    let open_j = response_json(open).await;
    assert_eq!(open_j["status"], "ok");
    let dispute_id = open_j["dispute"]["id"]
        .as_str()
        .expect("dispute id")
        .to_string();

    let list = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/disputes?limit=50")
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
    assert_eq!(list_j["status"], "ok");
    let items = list_j["items"].as_array().expect("items");
    assert!(
        items
            .iter()
            .any(|it| it["id"].as_str() == Some(dispute_id.as_str())),
        "B-DSP-001: disputes list should include opened dispute"
    );

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
}

/// **93 · B-DSP-001** → **§8.2 · F-025**：**`POST …/dispute`** → **`GET /api/v1/disputes`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_dsp_001b_f025_post_order_dispute_then_list_contains_dispute_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _env_lock = crate::test_env_serial::lock();
    std::env::remove_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS");
    std::env::remove_var("TRAVELTRUST_DENY_MOCK_PAY");
    let prev_p3 = std::env::var("P3_CHAIN_OFF").ok();
    std::env::set_var("P3_CHAIN_OFF", "1");
    let _p3_restore = RestoreP3ChainOff { previous: prev_p3 };

    let _lock = mock_pay_itin_app_stack_it_lock().lock().await;
    let stack_app = app_stack_router(pool.clone());
    let (app, tourist_email, guide_email, order_id, token_t, _token_g) =
        run_b_esc_001_mock_pay_flow_with_app(&pool, stack_app).await;

    let open = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/dispute"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::from(
                    json!({ "reason": "matrix_93_b_dsp_001b" }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        open.status(),
        StatusCode::OK,
        "{:?}",
        response_json(open).await
    );
    let open_j = response_json(open).await;
    assert_eq!(open_j["status"], "ok");
    let dispute_id = open_j["dispute"]["id"]
        .as_str()
        .expect("dispute id")
        .to_string();

    let list = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/disputes?limit=50")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
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
    assert_eq!(list_j["status"], "ok");
    let items = list_j["items"].as_array().expect("items");
    assert!(
        items
            .iter()
            .any(|it| it["id"].as_str() == Some(dispute_id.as_str())),
        "B-DSP-001 app_stack: disputes list should include opened dispute"
    );

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
}

/// **93 · B-DSP-003** → **§8.2 · F-025**：**`POST /api/v1/disputes/:id/resolve`**（**`P3_SEED_ARBITRATOR_EMAIL`** **注册** **`arbitrator`** **`Bearer`**）→ **`disputes.status=resolved`**（**`router::app`** + **PG**）。
#[tokio::test]
async fn matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_dsp_003b_f025_post_dispute_resolve_then_pg_status_resolved_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _env_lock = crate::test_env_serial::lock();
    std::env::remove_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS");
    std::env::remove_var("TRAVELTRUST_DENY_MOCK_PAY");
    let prev_p3 = std::env::var("P3_CHAIN_OFF").ok();
    std::env::set_var("P3_CHAIN_OFF", "1");
    let _p3_restore = RestoreP3ChainOff { previous: prev_p3 };

    let _lock = mock_pay_itin_app_stack_it_lock().lock().await;
    let stack_app = app_stack_router(pool.clone());
    let (app, tourist_email, guide_email, order_id, token_t, _token_g) =
        run_b_esc_001_mock_pay_flow_with_app(&pool, stack_app).await;

    let open = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/dispute"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::from(
                    json!({ "reason": "matrix_93_b_dsp_003b" }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        open.status(),
        StatusCode::OK,
        "{:?}",
        response_json(open).await
    );
    let open_j = response_json(open).await;
    assert_eq!(open_j["status"], "ok");
    let dispute_id = open_j["dispute"]["id"]
        .as_str()
        .expect("dispute id")
        .to_string();
    let dispute_uuid = Uuid::parse_str(&dispute_id).expect("dispute uuid");

    let arb_email = arb_email_for_mockpay_tourist(&tourist_email);
    cleanup_arb_user(&pool, &arb_email).await;
    let prev_seed = std::env::var("P3_SEED_ARBITRATOR_EMAIL").ok();
    std::env::set_var("P3_SEED_ARBITRATOR_EMAIL", &arb_email);
    let _restore_seed = RestoreEnvVar {
        key: "P3_SEED_ARBITRATOR_EMAIL",
        previous: prev_seed,
    };

    let reg_a = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/register")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": &arb_email,
                        "password": "TestPass12!",
                        "nickname": "arb_mp"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        reg_a.status(),
        StatusCode::OK,
        "{:?}",
        response_json(reg_a).await
    );
    let reg_a_j = response_json(reg_a).await;
    assert_eq!(reg_a_j["role"], "arbitrator");
    let token_a = reg_a_j["token"]
        .as_str()
        .expect("arbitrator token")
        .to_string();

    let resolve = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/disputes/{dispute_id}/resolve"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_a))
                .body(Body::from(
                    json!({ "refund_ratio": 1.0, "slash_guide": false }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        resolve.status(),
        StatusCode::OK,
        "{:?}",
        response_json(resolve).await
    );
    let resolve_j = response_json(resolve).await;
    assert_eq!(resolve_j["status"], "ok");
    assert_eq!(resolve_j["dispute"]["status"], "resolved");

    let st: String = sqlx::query_scalar("SELECT status FROM disputes WHERE id = $1")
        .bind(dispute_uuid)
        .fetch_one(&pool)
        .await
        .expect("disputes row");
    assert_eq!(st, "resolved");

    let detail = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(format!("/api/v1/disputes/{dispute_id}"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
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
    let detail_j = response_json(detail).await;
    assert_eq!(detail_j["dispute"]["status"], "resolved");

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
    cleanup_arb_user(&pool, &arb_email).await;
}
