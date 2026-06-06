use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;

use crate::routes::orders;
use crate::routes::orders::CHAIN_SYNC_SUCCESS_ENVELOPE_STATUS;
use crate::state::test_support::TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS_ENV_TEST_LOCK;

use super::cleanup::cleanup_order_participants;
use super::flows_esc::run_b_esc_001_mock_pay_flow_with_app;
use super::support::{
    app_stack_router, auth_bearer_value, mock_pay_itin_app_stack_it_lock, pool_or_skip,
    response_json, RestoreP3ChainOff,
};

/// **93 · B-TRN-003** → **§8.2 · F-025**：**`POST …/dispute`→`GET …/orders/:id`** **`order.status=disputed`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_trn_003b_f025_get_order_detail_disputed_after_open_dispute_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_trn_003b_f025_get_order_detail_disputed_after_open_dispute_app_stack_ok_pg (DATABASE_URL unset)"
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
    let (app, tourist_email, guide_email, order_id, token_t, _token_g) =
        run_b_esc_001_mock_pay_flow_with_app(&pool, app).await;

    let open = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/dispute"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::from(
                    json!({ "reason": "matrix_93_b_trn_003b" }).to_string(),
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
    assert_eq!(gj["order"]["status"], "disputed");

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
}

/// **93 · B-ESC-004** → **§8.2 · F-029**：**`mock-pay` 后** **`GET …/chain-sync-status`** **`200`** **`chain_sync`** **机读键**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_esc_004b_f029_get_order_chain_sync_status_ok_shape_after_escrow_app_stack_ok_pg(
) {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_esc_004b_f029_get_order_chain_sync_status_ok_shape_after_escrow_app_stack_ok_pg (DATABASE_URL unset)"
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
    let (app, tourist_email, guide_email, order_id, token_t, _token_g) =
        run_b_esc_001_mock_pay_flow_with_app(&pool, app).await;

    let sync_path = orders::CHAIN_SYNC_ROUTE_PATH.replace(":id", &order_id);
    let sync = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&sync_path)
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        sync.status(),
        StatusCode::OK,
        "{:?}",
        response_json(sync).await
    );
    let sj = response_json(sync).await;
    assert_eq!(sj["status"], CHAIN_SYNC_SUCCESS_ENVELOPE_STATUS);
    assert_eq!(sj["order_id"], order_id);
    let cs = &sj["chain_sync"];
    assert!(
        cs["status"].is_string(),
        "chain_sync.status present: {sj:?}"
    );
    assert_eq!(cs["last_event"]["state"], "escrowed");

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
}
