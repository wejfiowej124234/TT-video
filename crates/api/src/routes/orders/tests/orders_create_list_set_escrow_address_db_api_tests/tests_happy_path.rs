use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use serde_json::json;
use tower::ServiceExt;
use uuid::Uuid;

use super::cleanup::cleanup_order_participants;
use super::support::{auth_bearer_value, db_router, pool_or_skip, response_json};

#[tokio::test]
async fn post_orders_get_list_get_detail_set_escrow_address_happy_path_db_api() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!(
            "skip: post_orders_get_list_get_detail_set_escrow_address_happy_path_db_api (DATABASE_URL unset)"
        );
        return;
    }
    let suffix = Uuid::new_v4();
    let tourist_email = format!("orders-db-it-t-{suffix}@traveltrust.test");
    let guide_email = format!("orders-db-it-g-{suffix}@traveltrust.test");

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;

    let app = db_router(pool.clone());

    let reg_t = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/register")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": tourist_email,
                        "password": "TestPass12!",
                        "nickname": "tourist_it"
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
    let reg_t_j = response_json(reg_t).await;
    let token_t = reg_t_j
        .get("token")
        .and_then(|t| t.as_str())
        .expect("tourist token")
        .to_string();

    let reg_g = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/register")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": guide_email,
                        "password": "TestPass12!",
                        "nickname": "guide_it"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        reg_g.status(),
        StatusCode::OK,
        "{:?}",
        response_json(reg_g).await
    );
    let reg_g_j = response_json(reg_g).await;
    let token_g = reg_g_j
        .get("token")
        .and_then(|t| t.as_str())
        .expect("guide token")
        .to_string();

    let gc = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/guides")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_g))
                .body(Body::from(
                    json!({
                        "city": "Shanghai",
                        "country_code": "CN",
                        "languages": ["zh"],
                        "service_types": ["walking"]
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(gc.status(), StatusCode::OK, "{:?}", response_json(gc).await);
    let gc_j = response_json(gc).await;
    let guide_row_id = gc_j["guide"]["id"].as_str().expect("guide id");

    let stake = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/guides/{guide_row_id}/stake"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_g))
                .body(Body::from(json!({"amount": "1"}).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        stake.status(),
        StatusCode::OK,
        "{:?}",
        response_json(stake).await
    );

    let create = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/v1/orders")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::from(
                    json!({
                        "guide_id": guide_row_id,
                        "amount": "100",
                        "currency": "USD"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        create.status(),
        StatusCode::OK,
        "{:?}",
        response_json(create).await
    );
    let create_j = response_json(create).await;
    assert_eq!(create_j["status"], "ok");
    let order_id = create_j["order"]["id"]
        .as_str()
        .expect("order id")
        .to_string();
    assert_eq!(create_j["order"]["status"], "created");

    let list = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/orders")
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
    let items = list_j["items"].as_array().expect("items");
    assert!(
        items.iter().any(|it| it["id"].as_str() == Some(&order_id)),
        "list should include created order"
    );

    let detail = app
        .clone()
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
        detail.status(),
        StatusCode::OK,
        "{:?}",
        response_json(detail).await
    );
    let detail_j = response_json(detail).await;
    assert_eq!(detail_j["order"]["id"], order_id);

    let escrow_addr = "0x1234567890123456789012345678901234567890";
    let set_esc = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri(format!("/api/v1/orders/{order_id}/set-escrow-address"))
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, auth_bearer_value(&token_t))
                .body(Body::from(
                    json!({ "escrow_address": escrow_addr }).to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(
        set_esc.status(),
        StatusCode::OK,
        "{:?}",
        response_json(set_esc).await
    );
    let set_j = response_json(set_esc).await;
    assert_eq!(set_j["status"], "ok");
    assert_eq!(set_j["escrow_address"], escrow_addr);

    let detail2 = app
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
        detail2.status(),
        StatusCode::OK,
        "{:?}",
        response_json(detail2).await
    );
    let detail2_j = response_json(detail2).await;
    assert_eq!(detail2_j["order"]["escrow_address"], escrow_addr);

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;
}
