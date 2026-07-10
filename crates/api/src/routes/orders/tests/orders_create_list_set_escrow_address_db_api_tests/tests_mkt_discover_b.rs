use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use super::cleanup::cleanup_order_participants;
use super::support::{
    app_stack_router, auth_bearer_value, orders_app_stack_it_lock, pool_or_skip, response_json,
    utf8_pct_encode_query_component,
};

/// **93 · B-MKT-001** → **§8.2 · F-009**：**`GET /api/v1/discover/orders?country=…&city=…`** **UTF-8 百分号编码** **筛选** **`itineraries`** **`destination`/`city`**（**`router::app`**；与 **`matrix_93_b_mkt_001b_f009_*`** **互补**）。
#[tokio::test]
async fn matrix_93_b_mkt_001c_f009_get_discover_orders_country_city_query_filters_draft_app_stack_ok_pg(
) {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_001c_f009_get_discover_orders_country_city_query_filters_draft_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let _lock = orders_app_stack_it_lock().lock().await;

    let suffix = Uuid::new_v4();
    let tourist_email = format!("93-b-mkt-001c-{suffix}-t@traveltrust.test");
    let placeholder_guide = format!("93-b-mkt-001c-{suffix}-g@traveltrust.test");

    cleanup_order_participants(&pool, &tourist_email, &placeholder_guide).await;

    let app = app_stack_router(pool.clone());

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
                        "nickname": "tourist_mkt001c"
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
    assert_eq!(itin_j["order_status"], "draft");
    let order_id = itin_j["order_id"].as_str().expect("order_id").to_string();

    let country_q = utf8_pct_encode_query_component("中国");
    let city_q = utf8_pct_encode_query_component("北京");
    let uri = format!("/api/v1/discover/orders?country={country_q}&city={city_q}");

    let disc = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        disc.status(),
        StatusCode::OK,
        "{:?}",
        response_json(disc).await
    );
    let dj = response_json(disc).await;
    assert_eq!(dj.get("status"), Some(&json!("ok")));
    let items = dj["items"].as_array().expect("discover items");
    assert!(
        items.iter().any(|c| {
            c["order_id"].as_str() == Some(order_id.as_str())
                || c["id"].as_str() == Some(order_id.as_str())
        }),
        "discover country+city filter should list draft order_id={order_id}: {dj:?}"
    );

    cleanup_order_participants(&pool, &tourist_email, &placeholder_guide).await;
}
