use axum::body::Body;
use axum::http::{header, HeaderValue, Request, StatusCode};
use chrono::Utc;
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use crate::db::{insert_session, insert_user};

use super::helpers::{
    app_with_pool, cleanup_itinerary_orders, pool_or_skip, response_json, triple_lock,
};

/// **F-033**：**`POST /api/v1/itineraries/custom`** **200** + **`orders`/`itineraries` PG**（**`router::app`** + **`x-user-id`**）。
#[tokio::test]
async fn matrix_93_d_itn_002_f033_post_itineraries_custom_persists_orders_pg() {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_itn_002_f033_post_itineraries_custom_persists_orders_pg (DATABASE_URL unset)"
        );
        return;
    };
    let uid = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("f033-app-{uid}@traveltrust.test");

    cleanup_itinerary_orders(&pool, uid).await;

    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert_user");

    let router = app_with_pool(pool.clone());
    let body = json!({
        "creator_type": "tourist",
        "country": "中国",
        "total_days": 2,
        "amount": 1500,
        "currency": "USD",
        "day_plans": [
            { "city": "北京", "attractions": ["故宫"], "food": [], "hotel": "Hotel A" },
            { "city": "上海", "attractions": [], "food": ["小笼"], "hotel": null }
        ]
    });

    let res = router
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/itineraries/custom")
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-user-id", uid.to_string())
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    assert_eq!(v["order_status"], "draft");
    let order_id: Uuid = v["order_id"].as_str().unwrap().parse().unwrap();

    let cnt: (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM orders WHERE id = $1 AND tourist_id = $2")
            .bind(order_id)
            .bind(uid)
            .fetch_one(&pool)
            .await
            .expect("count orders");
    assert_eq!(cnt.0, 1);

    let icnt: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM itineraries WHERE order_id = $1")
        .bind(order_id)
        .fetch_one(&pool)
        .await
        .expect("count itineraries");
    assert_eq!(icnt.0, 1);

    cleanup_itinerary_orders(&pool, uid).await;
}

/// **93 · D-ITN-002** → **§8.2 · F-033**：**`POST /api/v1/itineraries/custom`**（**`Authorization: Bearer`** + **`sessions`**；**`router::app`**）**200** + **`orders`/`itineraries` PG**。
#[tokio::test]
async fn matrix_93_d_itn_002b_f033_post_itineraries_custom_persists_orders_bearer_app_stack_ok_pg()
{
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_itn_002b_f033_post_itineraries_custom_persists_orders_bearer_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let uid = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("f033-bearer-app-{uid}@traveltrust.test");
    let session_token = format!("f033_bearer_sess_{}", Uuid::new_v4());

    cleanup_itinerary_orders(&pool, uid).await;

    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &session_token, uid)
        .await
        .expect("insert_session");

    let router = app_with_pool(pool.clone());
    let auth = format!("Bearer {}", session_token);
    let body = json!({
        "creator_type": "tourist",
        "country": "中国",
        "total_days": 2,
        "amount": 1500,
        "currency": "USD",
        "day_plans": [
            { "city": "北京", "attractions": ["故宫"], "food": [], "hotel": "Hotel A" },
            { "city": "上海", "attractions": [], "food": ["小笼"], "hotel": null }
        ]
    });

    let res = router
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/itineraries/custom")
                .header(header::CONTENT_TYPE, "application/json")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth header"),
                )
                .body(Body::from(body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    assert_eq!(v["order_status"], "draft");
    let order_id: Uuid = v["order_id"].as_str().unwrap().parse().unwrap();

    let cnt: (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM orders WHERE id = $1 AND tourist_id = $2")
            .bind(order_id)
            .bind(uid)
            .fetch_one(&pool)
            .await
            .expect("count orders");
    assert_eq!(cnt.0, 1);

    let icnt: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM itineraries WHERE order_id = $1")
        .bind(order_id)
        .fetch_one(&pool)
        .await
        .expect("count itineraries");
    assert_eq!(icnt.0, 1);

    cleanup_itinerary_orders(&pool, uid).await;
}

/// **93 · D-ITN-003** → **§8.2 · F-033**：**`POST /api/v1/itineraries/custom/drafts`** **200** → **`GET /api/v1/itineraries/custom/drafts/:id`** **`payload`** 回读（**`router::app`** + **`x-user-id`** + **`itinerary_custom_drafts`** **PG**）。
#[tokio::test]
async fn matrix_93_d_itn_003_f033_post_custom_draft_then_get_roundtrip_pg() {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_itn_003_f033_post_custom_draft_then_get_roundtrip_pg (DATABASE_URL unset)"
        );
        return;
    };
    let uid = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("f033-draft-app-{uid}@traveltrust.test");

    cleanup_itinerary_orders(&pool, uid).await;

    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert_user");

    let router = app_with_pool(pool.clone());
    let payload = json!({ "creatorType": "tourist", "note": "matrix_93_d_itn_003" });
    let post_body = json!({ "payload": payload.clone() });

    let res = router
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/itineraries/custom/drafts")
                .header(header::CONTENT_TYPE, "application/json")
                .header("x-user-id", uid.to_string())
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot post draft");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    let draft_id: Uuid = v["draft_id"].as_str().unwrap().parse().unwrap();

    let res_get = router
        .oneshot(
            Request::builder()
                .method("GET")
                .uri(format!("/api/v1/itineraries/custom/drafts/{draft_id}"))
                .header("x-user-id", uid.to_string())
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot get draft");

    assert_eq!(
        res_get.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res_get).await
    );
    let vg = response_json(res_get).await;
    assert_eq!(vg["status"], "ok");
    assert_eq!(vg["draft_id"], draft_id.to_string());
    assert_eq!(vg["payload"], payload);

    let cnt: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM itinerary_custom_drafts WHERE id = $1 AND owner_user_id = $2",
    )
    .bind(draft_id)
    .bind(uid)
    .fetch_one(&pool)
    .await
    .expect("count itinerary_custom_drafts");
    assert_eq!(cnt.0, 1);

    cleanup_itinerary_orders(&pool, uid).await;
}

/// **93 · D-ITN-003** → **§8.2 · F-033**：**`POST|GET …/itineraries/custom/drafts*`**（**`Authorization: Bearer`** + **`sessions`**；**`router::app`**）**PG** 回读。
#[tokio::test]
async fn matrix_93_d_itn_003b_f033_post_custom_draft_then_get_roundtrip_bearer_app_stack_ok_pg() {
    let _g = triple_lock().lock().await;
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: matrix_93_d_itn_003b_f033_post_custom_draft_then_get_roundtrip_bearer_app_stack_ok_pg (DATABASE_URL unset)"
        );
        return;
    };
    let uid = Uuid::new_v4();
    let now = Utc::now();
    let email = format!("f033-draft-bearer-app-{uid}@traveltrust.test");
    let session_token = format!("f033_draft_bearer_sess_{}", Uuid::new_v4());

    cleanup_itinerary_orders(&pool, uid).await;

    insert_user(
        &pool, uid, &email, None, "tourist", "none", None, None, None, now, now,
    )
    .await
    .expect("insert_user");
    insert_session(&pool, &session_token, uid)
        .await
        .expect("insert_session");

    let router = app_with_pool(pool.clone());
    let auth = format!("Bearer {}", session_token);
    let payload = json!({ "creatorType": "tourist", "note": "matrix_93_d_itn_003b" });
    let post_body = json!({ "payload": payload.clone() });

    let res = router
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/itineraries/custom/drafts")
                .header(header::CONTENT_TYPE, "application/json")
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth header"),
                )
                .body(Body::from(post_body.to_string()))
                .unwrap(),
        )
        .await
        .expect("oneshot post draft");

    assert_eq!(
        res.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res).await
    );
    let v = response_json(res).await;
    assert_eq!(v["status"], "ok");
    let draft_id: Uuid = v["draft_id"].as_str().unwrap().parse().unwrap();

    let res_get = router
        .oneshot(
            Request::builder()
                .method("GET")
                .uri(format!("/api/v1/itineraries/custom/drafts/{draft_id}"))
                .header(
                    header::AUTHORIZATION,
                    HeaderValue::from_str(&auth).expect("auth header"),
                )
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .expect("oneshot get draft");

    assert_eq!(
        res_get.status(),
        StatusCode::OK,
        "{:?}",
        response_json(res_get).await
    );
    let vg = response_json(res_get).await;
    assert_eq!(vg["status"], "ok");
    assert_eq!(vg["draft_id"], draft_id.to_string());
    assert_eq!(vg["payload"], payload);

    let cnt: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM itinerary_custom_drafts WHERE id = $1 AND owner_user_id = $2",
    )
    .bind(draft_id)
    .bind(uid)
    .fetch_one(&pool)
    .await
    .expect("count itinerary_custom_drafts");
    assert_eq!(cnt.0, 1);

    cleanup_itinerary_orders(&pool, uid).await;
}
