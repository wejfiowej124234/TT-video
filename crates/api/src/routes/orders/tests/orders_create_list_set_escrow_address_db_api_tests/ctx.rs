use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use axum::Router;
use serde_json::json;
use sqlx::PgPool;
use tower::ServiceExt;
use uuid::Uuid;

use super::cleanup::cleanup_order_participants;
use super::support::{
    app_stack_router, auth_bearer_value, db_router, orders_app_stack_it_lock, pool_or_skip,
    response_json,
};

/// 已注册旅客/向导、向导卡 **`active`**（**stake** 后）— 供 **`matrix_93_b_ord_*`** / **`matrix_93_b_trn_001_*`** 各自 **`POST /orders`** 起测。
pub(super) struct GuideStakedOrdersCtx {
    pub(super) app: Router,
    pub(super) pool: PgPool,
    pub(super) token_tourist: String,
    pub(super) token_guide: String,
    pub(super) guide_row_id: String,
    pub(super) tourist_email: String,
    pub(super) guide_email: String,
}

pub(super) async fn guide_staked_orders_ctx_from_app(
    app: Router,
    pool: PgPool,
    tourist_email: String,
    guide_email: String,
) -> GuideStakedOrdersCtx {
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
                        "nickname": "tourist_m93"
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
    let token_tourist = response_json(reg_t)
        .await
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
                        "nickname": "guide_m93"
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
    let token_g = response_json(reg_g)
        .await
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
    let guide_row_id = response_json(gc).await["guide"]["id"]
        .as_str()
        .expect("guide id")
        .to_string();

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

    GuideStakedOrdersCtx {
        app,
        pool,
        token_tourist,
        token_guide: token_g,
        guide_row_id,
        tourist_email,
        guide_email,
    }
}

pub(super) async fn guide_staked_orders_ctx_or_skip() -> Option<GuideStakedOrdersCtx> {
    let pool = pool_or_skip().await?;
    let suffix = Uuid::new_v4();
    let tourist_email = format!("93-b-ord-{suffix}-t@traveltrust.test");
    let guide_email = format!("93-b-ord-{suffix}-g@traveltrust.test");

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;

    let app = db_router(pool.clone());
    Some(guide_staked_orders_ctx_from_app(app, pool, tourist_email, guide_email).await)
}

pub(super) async fn guide_staked_orders_ctx_app_stack_or_skip() -> Option<GuideStakedOrdersCtx> {
    let pool = pool_or_skip().await?;
    let suffix = Uuid::new_v4();
    let tourist_email = format!("93-b-ord-{suffix}-t@traveltrust.test");
    let guide_email = format!("93-b-ord-{suffix}-g@traveltrust.test");

    cleanup_order_participants(&pool, &tourist_email, &guide_email).await;

    let _lock = orders_app_stack_it_lock().lock().await;
    let app = app_stack_router(pool.clone());
    Some(guide_staked_orders_ctx_from_app(app, pool, tourist_email, guide_email).await)
}
