use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;

use super::cleanup::cleanup_order_participants;
use super::flows_esc::run_b_esc_002_completed_with_app;
use super::support::{
    app_stack_router, auth_bearer_value, mock_pay_itin_app_stack_it_lock, pool_or_skip,
    response_json, RestoreP3ChainOff,
};

/// **93 · B-ESC-003** → **§8.2 · F-027**：**`completed`** 后 **旅客+向导** **`POST …/reviews`**→**`GET …/reviews`** **`items` 长度 `2`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_esc_005b_f027_dual_reviews_after_completed_get_list_len_two_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_esc_005b_f027_dual_reviews_after_completed_get_list_len_two_app_stack_ok_pg (DATABASE_URL unset)"
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
    let app = app_stack_router(pool.clone());
    let (app, tourist_email, guide_email, order_id, token_t, token_g) =
        run_b_esc_002_completed_with_app(&pool, app).await;

    let reviews_uri = format!("/api/v1/orders/{order_id}/reviews");

    let rv_t = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&reviews_uri)
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::from(
                    json!({"score": 5, "comment": "matrix_93_b_esc_005b_t"}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        rv_t.status(),
        StatusCode::OK,
        "{:?}",
        response_json(rv_t).await
    );

    let rv_g = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&reviews_uri)
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_g))
                .body(Body::from(
                    json!({"score": 4, "comment": "matrix_93_b_esc_005b_g"}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        rv_g.status(),
        StatusCode::OK,
        "{:?}",
        response_json(rv_g).await
    );

    let list = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&reviews_uri)
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
    let lj = response_json(list).await;
    let items = lj["items"].as_array().expect("reviews items");
    assert_eq!(items.len(), 2);

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
}

/// **93 · B-ESC-003 / 53-S8** → **§8.2 · F-010**：**双评** 后 **旅客+向导** **`POST …/confirm-rating`**→**`GET …/orders/:id`** **`sub_status=rating_confirmed`**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_esc_005d_f010_bilateral_confirm_rating_then_order_sub_status_rating_confirmed_app_stack_ok_pg(
) {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_esc_005d_f010_bilateral_confirm_rating_then_order_sub_status_rating_confirmed_app_stack_ok_pg (DATABASE_URL unset)"
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
    let app = app_stack_router(pool.clone());
    let (app, tourist_email, guide_email, order_id, token_t, token_g) =
        run_b_esc_002_completed_with_app(&pool, app).await;

    let reviews_uri = format!("/api/v1/orders/{order_id}/reviews");

    let rv_t = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&reviews_uri)
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::from(
                    json!({"score": 5, "comment": "matrix_93_b_esc_005d_t"}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        rv_t.status(),
        StatusCode::OK,
        "{:?}",
        response_json(rv_t).await
    );

    let rv_g = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(&reviews_uri)
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_g))
                .body(Body::from(
                    json!({"score": 5, "comment": "matrix_93_b_esc_005d_g"}).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        rv_g.status(),
        StatusCode::OK,
        "{:?}",
        response_json(rv_g).await
    );

    let cr_t = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/confirm-rating"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        cr_t.status(),
        StatusCode::OK,
        "{:?}",
        response_json(cr_t).await
    );

    let cr_g = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/confirm-rating"))
                .header(header::AUTHORIZATION, auth_bearer_value(&token_g))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        cr_g.status(),
        StatusCode::OK,
        "{:?}",
        response_json(cr_g).await
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
    assert_eq!(gj["order"]["status"], "completed");
    assert_eq!(gj["order"]["sub_status"], "rating_confirmed");
    assert_eq!(gj["order"]["rating_tourist_confirmed"], true);
    assert_eq!(gj["order"]["rating_guide_confirmed"], true);

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
}
