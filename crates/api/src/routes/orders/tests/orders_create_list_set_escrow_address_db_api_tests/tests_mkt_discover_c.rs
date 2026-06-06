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

/// **93 · B-MKT-001 / B-MKT-002** → **§8.2 · F-009**：**`GET /api/v1/discover/orders?country=…&city=…&limit=…`** **`page.limit`** **且** **`items`** **含** **`order_id`**（**`router::app`**；**`country`+`city`+`limit`** **组合**；与 **`matrix_93_b_mkt_001c_*`**/**`matrix_93_b_mkt_002b_*`** **互补**）。
#[tokio::test]
async fn matrix_93_b_mkt_001d_f009_get_discover_orders_country_city_limit_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_001d_f009_get_discover_orders_country_city_limit_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let _lock = orders_app_stack_it_lock().lock().await;

    let suffix = Uuid::new_v4();
    let tourist_email = format!("93-b-mkt-001d-{suffix}-t@traveltrust.test");
    let placeholder_guide = format!("93-b-mkt-001d-{suffix}-g@traveltrust.test");

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
                        "nickname": "tourist_mkt001d"
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
    let uri = format!("/api/v1/discover/orders?country={country_q}&city={city_q}&limit=5");

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
    assert_eq!(dj["page"]["limit"], 5);
    let items = dj["items"].as_array().expect("discover items");
    assert!(
        items.iter().any(|c| {
            c["order_id"].as_str() == Some(order_id.as_str())
                || c["id"].as_str() == Some(order_id.as_str())
        }),
        "discover country+city+limit should list draft order_id={order_id}: {dj:?}"
    );

    cleanup_order_participants(&pool, &tourist_email, &placeholder_guide).await;
}

/// **93 · B-MKT-002** → **§8.2 · F-009**：**`GET /api/v1/discover/orders?limit=…`** **`page.limit`** **且** **`items`** **含** **`order_id`**（**`router::app`**；**不传** **country/city**；与 **`matrix_93_b_mkt_002b_*`** **互补**）。
#[tokio::test]
async fn matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_001e_f009_get_discover_orders_limit_only_includes_draft_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let _lock = orders_app_stack_it_lock().lock().await;

    let suffix = Uuid::new_v4();
    let tourist_email = format!("93-b-mkt-001e-{suffix}-t@traveltrust.test");
    let placeholder_guide = format!("93-b-mkt-001e-{suffix}-g@traveltrust.test");

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
                        "nickname": "tourist_mkt001e"
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
                        "city": "厦门",
                        "travel_date": "2025-08-01",
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

    let uri = "/api/v1/discover/orders?limit=20";
    let disc = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(uri)
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
    assert_eq!(dj["page"]["limit"], 20);
    let items = dj["items"].as_array().expect("discover items");
    assert!(
        items.iter().any(|c| {
            c["order_id"].as_str() == Some(order_id.as_str())
                || c["id"].as_str() == Some(order_id.as_str())
        }),
        "discover limit-only should list draft order_id={order_id}: {dj:?}"
    );

    cleanup_order_participants(&pool, &tourist_email, &placeholder_guide).await;
}

/// **93 · B-MKT-002** → **§8.2 · F-009**：**`GET /api/v1/discover/orders?city=…&limit=1`** **`page.limit`** + **`items`**（**`router::app`**；**预设 `city`** + **串行锁**；**列表按更新时间倒序** 下本测草稿应落在 **limit=1** 的首条）。
#[tokio::test]
async fn matrix_93_b_mkt_002b_f009_get_discover_orders_limit_ok_shape_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_002b_f009_get_discover_orders_limit_ok_shape_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let _lock = orders_app_stack_it_lock().lock().await;

    let suffix = Uuid::new_v4();
    let city_preset = "北京";
    let tourist_email = format!("93-b-mkt-002b-{suffix}-t@traveltrust.test");
    let placeholder_guide = format!("93-b-mkt-002b-{suffix}-g@traveltrust.test");

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
                        "nickname": "tourist_mkt002b"
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
                        "city": city_preset,
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
    let order_id = itin_j["order_id"].as_str().expect("order_id").to_string();

    let city_q = utf8_pct_encode_query_component(city_preset);
    let q = format!("/api/v1/discover/orders?city={city_q}&limit=1");
    let disc = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&q)
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
    let page = dj["page"].as_object().expect("page object");
    assert_eq!(page.get("limit"), Some(&json!(1)));
    let items = dj["items"].as_array().expect("items");
    assert_eq!(items.len(), 1, "{dj:?}");
    assert!(
        items[0]["order_id"].as_str() == Some(order_id.as_str())
            || items[0]["id"].as_str() == Some(order_id.as_str()),
        "{dj:?}"
    );

    cleanup_order_participants(&pool, &tourist_email, &placeholder_guide).await;
}
