use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;

use super::cleanup::cleanup_order_participants;
use super::flows_itn_ord::{
    run_b_ord_005_itin_then_confirm_final_with_app, run_d_itn_001_draft_bundle_with_app,
    run_d_itn_001_draft_only_with_app,
};
use super::support::{
    app_stack_router, auth_bearer_value, mock_pay_itin_app_stack_it_lock, pool_or_skip,
    response_json,
};

/// **93 · D-ITN-001** → **§8.2 · F-012**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_itn_001b_f012_post_itineraries_draft_persists_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_itn_001b_f012_post_itineraries_draft_persists_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let _lock = mock_pay_itin_app_stack_it_lock().lock().await;
    let app = app_stack_router(pool.clone());
    let (tourist_email, unused_guide_email) = run_d_itn_001_draft_only_with_app(&pool, app).await;
    cleanup_order_participants(&pool, &tourist_email, &unused_guide_email).await;
}

/// **93 · D-ITN-001** → **§8.2 · F-012**：**`POST …/itineraries`→`GET /api/v1/orders/:id`** **`order.itinerary.destination`** **与** **`POST` 体** **一致**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_itn_001c_f012_post_itineraries_get_order_detail_destination_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_itn_001c_f012_post_itineraries_get_order_detail_destination_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let _lock = mock_pay_itin_app_stack_it_lock().lock().await;
    let app = app_stack_router(pool.clone());
    let (tourist_email, unused_guide_email, order_id, token_t) =
        run_d_itn_001_draft_bundle_with_app(&pool, app.clone()).await;

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
    assert_eq!(gj["order"]["status"], "draft");
    assert_eq!(
        gj["order"]["itinerary"]["destination"]
            .as_str()
            .expect("destination"),
        "中国"
    );

    cleanup_order_participants(&pool, &tourist_email, &unused_guide_email).await;
}

/// **93 · D-ITN-001 / B-ORD-004** → **§8.2 · F-012**：**`POST …/itineraries`** **draft** → **`PATCH …/orders/:id/itinerary`** → **`GET …/orders/:id`** **`daily_itinerary[0].content_text`** **读回**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg()
{
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_itn_001d_f012_post_itineraries_patch_order_itinerary_reflects_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let _lock = mock_pay_itin_app_stack_it_lock().lock().await;
    let app = app_stack_router(pool.clone());
    let (tourist_email, unused_guide_email, order_id, token_t) =
        run_d_itn_001_draft_bundle_with_app(&pool, app.clone()).await;

    let patch = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::PATCH)
                .uri(format!("/api/v1/orders/{order_id}/itinerary"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::from(
                    json!({
                        "daily_itinerary": [{
                            "day_index": 1,
                            "city": "北京",
                            "content_text": "matrix_93_d_itn_001d_patch_ok"
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
    let daily = gj["order"]["itinerary"]["daily_itinerary"]
        .as_array()
        .expect("daily_itinerary");
    assert_eq!(
        daily[0]["content_text"].as_str().expect("content_text"),
        "matrix_93_d_itn_001d_patch_ok"
    );

    cleanup_order_participants(&pool, &tourist_email, &unused_guide_email).await;
}

/// **93 · B-ORD-005** → **§8.2 · F-013**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_ord_005b_f013_itinerary_then_confirm_final_snapshot_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let _lock = mock_pay_itin_app_stack_it_lock().lock().await;
    let app = app_stack_router(pool.clone());
    let (tourist_email, unused_guide_email) =
        run_b_ord_005_itin_then_confirm_final_with_app(&pool, app).await;
    cleanup_order_participants(&pool, &tourist_email, &unused_guide_email).await;
}
