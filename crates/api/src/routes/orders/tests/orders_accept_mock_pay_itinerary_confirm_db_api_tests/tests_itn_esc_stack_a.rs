use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use tower::ServiceExt;

use crate::state::test_support::TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS_ENV_TEST_LOCK;

use super::cleanup::cleanup_order_participants;
use super::flows_esc::{
    run_b_esc_001_mock_pay_flow_with_app, run_b_esc_001_to_accepted_with_app,
    run_b_esc_002_completed_with_app,
};
use super::flows_itn_ord::{run_b_ord_005_itin_then_confirm_final, run_d_itn_001_draft_only};
use super::support::{
    app_stack_router, auth_bearer_value, mock_pay_itin_app_stack_it_lock, pool_or_skip,
    response_json, RestoreP3ChainOff,
};

/// **93 · D-ITN-001** → **§8.2 · F-012**（**§4 · MANUAL-P1**；**ISS-007** 单列 **`matrix_93_d_itn_001`**）。
#[tokio::test]
async fn matrix_93_d_itn_001_post_itineraries_draft_persists_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_itn_001_post_itineraries_draft_persists_pg (DATABASE_URL unset)"
        );
        return;
    }
    let (tourist_email, unused_guide_email) = run_d_itn_001_draft_only(&pool).await;
    cleanup_order_participants(&pool, &tourist_email, &unused_guide_email).await;
}

/// **93 · B-ORD-005** → **§8.2 · F-013**（**§2.3 · MANUAL-P1**；**ISS-007** 单列 **`matrix_93_b_ord_005`**）。
#[tokio::test]
async fn matrix_93_b_ord_005_itinerary_then_confirm_final_snapshot() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_ord_005_itinerary_then_confirm_final_snapshot (DATABASE_URL unset)"
        );
        return;
    }
    let (tourist_email, unused_guide_email) = run_b_ord_005_itin_then_confirm_final(&pool).await;
    cleanup_order_participants(&pool, &tourist_email, &unused_guide_email).await;
}

/// **93 · B-ESC-001** → **§8.2 · F-010**：**`mock-pay`**→**`escrowed`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_esc_001b_f010_mock_pay_then_get_order_escrowed_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let _env_lock = TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS_ENV_TEST_LOCK
        .lock()
        .expect("env test lock");
    std::env::remove_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS");
    std::env::remove_var("TRAVELTRUST_DENY_MOCK_PAY");
    let prev_p3 = std::env::var("P3_CHAIN_OFF").ok();
    std::env::set_var("P3_CHAIN_OFF", "1");
    let _p3_restore = RestoreP3ChainOff { previous: prev_p3 };

    let _lock = mock_pay_itin_app_stack_it_lock().lock().await;
    let app = app_stack_router(pool.clone());
    let (_app, tourist_email, guide_email, _, _, _) =
        run_b_esc_001_mock_pay_flow_with_app(&pool, app).await;
    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
}

/// **93 · B-ESC-002** → **§8.2 · F-010**：**向导 Bearer** **`POST …/confirm-completion`**→**`GET …/orders/:id`** **`order.status=completed`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_esc_002b_f010_guide_confirm_completion_then_get_order_completed_app_stack_ok_pg(
) {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_esc_002b_f010_guide_confirm_completion_then_get_order_completed_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let _env_lock = TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS_ENV_TEST_LOCK
        .lock()
        .expect("env test lock");
    std::env::remove_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS");
    std::env::remove_var("TRAVELTRUST_DENY_MOCK_PAY");
    let prev_p3 = std::env::var("P3_CHAIN_OFF").ok();
    std::env::set_var("P3_CHAIN_OFF", "1");
    let _p3_restore = RestoreP3ChainOff { previous: prev_p3 };

    let _lock = mock_pay_itin_app_stack_it_lock().lock().await;
    let app = app_stack_router(pool.clone());
    let (_app, tourist_email, guide_email, _, _, _) =
        run_b_esc_002_completed_with_app(&pool, app).await;

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
}

/// **93 · B-ORD-005** → **§8.2 · F-013**：**`accepted`** 下 **旅客→向导** **`POST …/confirm-bilateral`**→**`GET …/orders/:id`** **`sub_status=confirmed`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_ord_005c_f013_accepted_bilateral_confirm_both_then_get_order_sub_status_confirmed_app_stack_ok_pg(
) {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_ord_005c_f013_accepted_bilateral_confirm_both_then_get_order_sub_status_confirmed_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let _env_lock = TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS_ENV_TEST_LOCK
        .lock()
        .expect("env test lock");
    std::env::remove_var("TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS");
    std::env::remove_var("TRAVELTRUST_DENY_MOCK_PAY");
    let prev_p3 = std::env::var("P3_CHAIN_OFF").ok();
    std::env::set_var("P3_CHAIN_OFF", "1");
    let _p3_restore = RestoreP3ChainOff { previous: prev_p3 };

    let _lock = mock_pay_itin_app_stack_it_lock().lock().await;
    let app = app_stack_router(pool.clone());
    let (app, tourist_email, guide_email, order_id, token_t, token_g) =
        run_b_esc_001_to_accepted_with_app(&pool, app).await;

    let cb_t = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/confirm-bilateral"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        cb_t.status(),
        StatusCode::OK,
        "{:?}",
        response_json(cb_t).await
    );

    let cb_g = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/confirm-bilateral"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_g))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        cb_g.status(),
        StatusCode::OK,
        "{:?}",
        response_json(cb_g).await
    );

    let get = app
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
    assert_eq!(gj["order"]["status"], "accepted");
    assert_eq!(gj["order"]["sub_status"], "confirmed");
    assert_eq!(gj["order"]["tourist_confirmed"], true);
    assert_eq!(gj["order"]["guide_confirmed"], true);

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
}
