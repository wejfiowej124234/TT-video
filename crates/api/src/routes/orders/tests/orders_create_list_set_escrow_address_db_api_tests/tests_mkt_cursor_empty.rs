use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use super::cleanup::cleanup_order_participants;
use super::support::{
    app_stack_router, orders_app_stack_it_lock, pool_or_skip, response_json,
    utf8_pct_encode_query_component,
};

use std::collections::HashSet;

use super::itinerary_draft::post_itinerary_draft_ok;

/// **93 · B-MKT-002** → **§8.2 · F-009**：**`GET /api/v1/discover/orders?city=…&limit=1&cursor=`** 第二页 **`items[0].order_id`** ≠ 首页（**`router::app`**；**双草稿** **`厦门`**；**`orders_app_stack_it_lock`**）。
#[tokio::test]
async fn matrix_93_b_mkt_002c_f009_discover_orders_cursor_second_page_app_stack_ok_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_002c_f009_discover_orders_cursor_second_page_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let _lock = orders_app_stack_it_lock().lock().await;

    let suffix = Uuid::new_v4();
    let city_preset = "厦门";
    let tourist_email = format!("93-b-mkt-002c-{suffix}-t@traveltrust.test");
    let placeholder_guide = format!("93-b-mkt-002c-{suffix}-g@traveltrust.test");

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
                        "nickname": "tourist_mkt002c"
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

    let order_a = post_itinerary_draft_ok(app.clone(), &token_t, city_preset, "2025-07-10").await;
    let order_b = post_itinerary_draft_ok(app.clone(), &token_t, city_preset, "2025-07-11").await;
    let mut ours = HashSet::new();
    ours.insert(order_a.clone());
    ours.insert(order_b.clone());

    let city_q = utf8_pct_encode_query_component(city_preset);
    let q_wide = format!("/api/v1/discover/orders?city={city_q}&limit=30");
    let disc_wide = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&q_wide)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(disc_wide.status(), StatusCode::OK);
    let wide_j = response_json(disc_wide).await;
    assert_eq!(wide_j.get("status"), Some(&json!("ok")));
    let wide_items = wide_j["items"].as_array().expect("items");
    let mut found = HashSet::new();
    for c in wide_items {
        let oid = c["order_id"]
            .as_str()
            .or_else(|| c["id"].as_str())
            .unwrap_or("");
        if ours.contains(oid) {
            found.insert(oid.to_string());
        }
    };    assert_eq!(
        found.len(),
        2,
        "discover should list both draft order_ids for {city_preset}: {wide_j:?}"
    );

    let q1 = format!("/api/v1/discover/orders?city={city_q}&limit=1");
    let disc1 = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&q1)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(disc1.status(), StatusCode::OK);
    let p1 = response_json(disc1).await;
    let page1 = p1["page"].as_object().expect("page");
    assert_eq!(page1.get("limit"), Some(&json!(1)));
    assert_eq!(
        page1.get("has_more"),
        Some(&json!(true)),
        "need >=2 discover cards for {city_preset}: {p1:?}"
    );
    let items1 = p1["items"].as_array().expect("items");
    assert_eq!(items1.len(), 1);
    let first_id = items1[0]["order_id"]
        .as_str()
        .or_else(|| items1[0]["id"].as_str())
        .expect("order_id");
    let next_c = page1["next_cursor"].as_str().expect("next_cursor");

    let q2 = format!("/api/v1/discover/orders?city={city_q}&limit=1&cursor={next_c}");
    let disc2 = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&q2)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(disc2.status(), StatusCode::OK);
    let p2 = response_json(disc2).await;
    let items2 = p2["items"].as_array().expect("items p2");
    assert_eq!(items2.len(), 1, "{p2:?}");
    let second_id = items2[0]["order_id"]
        .as_str()
        .or_else(|| items2[0]["id"].as_str())
        .expect("order_id p2");
    assert_ne!(first_id, second_id, "{p1:?} {p2:?}");
    assert!(
        found.contains(first_id) && found.contains(second_id),
        "cursor walk should stay within discover cards for this tourist's drafts: first={first_id} second={second_id} found={found:?}"
    );

    cleanup_order_participants(&pool, &tourist_email, &placeholder_guide).await;
}

/// **93 · B-MKT-003** → **§8.2 · F-009**：**`GET /api/v1/discover/orders?city=…`** **无匹配草稿** 时 **`items`** 空数组且 **200**（**`router::app`**）。
#[tokio::test]
async fn matrix_93_b_mkt_003b_f009_get_discover_orders_filter_city_empty_items_200_app_stack_ok_pg()
{
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_b_mkt_003b_f009_get_discover_orders_filter_city_empty_items_200_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    }
    let _lock = orders_app_stack_it_lock().lock().await;

    let suffix = Uuid::new_v4();
    let tourist_email = format!("93-b-mkt-003b-{suffix}-t@traveltrust.test");
    let placeholder_guide = format!("93-b-mkt-003b-{suffix}-g@traveltrust.test");

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
                        "nickname": "tourist_mkt003b"
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

    let _beijing_oid = post_itinerary_draft_ok(app.clone(), &token_t, "北京", "2025-09-01").await;

    let city_q = utf8_pct_encode_query_component("广州");
    let q = format!("/api/v1/discover/orders?city={city_q}&limit=20");
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
    let items = dj["items"].as_array().expect("items");
    assert!(
        items.is_empty(),
        "expected no Beijing draft under Guangzhou filter: {dj:?}"
    );

    cleanup_order_participants(&pool, &tourist_email, &placeholder_guide).await;
}
