//! POST `/auth/logout`：无 Bearer → 401；登录态登出后同一 token 访问 `GET /api/v1/me` → 401（`login_required`）。

use axum::body::Body;
use axum::http::{header, Method, Request, StatusCode};
use axum::Router;
use http_body_util::BodyExt;
use serde_json::{json, Value};
use std::sync::Arc;
use tokio::sync::RwLock;
use tower::ServiceExt;
use uuid::Uuid;

use crate::chain_off::{ChainOffConfig, ChainOffState, ChainOffStore};
use crate::routes::{auth, me};
use crate::state::test_support::api_meta_state;

fn test_router() -> Router {
    let chain_off = ChainOffState {
        store: Arc::new(RwLock::new(ChainOffStore::default())),
        config: ChainOffConfig::default(),
        db_pool: None,
    };
    Router::new()
        .merge(auth::router())
        .merge(me::router())
        .with_state(api_meta_state(Some(chain_off)))
}

async fn response_json(res: axum::response::Response) -> Value {
    let body = res.into_body().collect().await.unwrap().to_bytes();
    serde_json::from_slice(&body).unwrap_or_else(|_| json!({}))
}

#[tokio::test]
async fn logout_without_bearer_returns_401() {
    let app = test_router();
    let res = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/logout")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
    let v = response_json(res).await;
    assert_eq!(v.get("error").and_then(|e| e.as_str()), Some("session_token_required"));
}

#[tokio::test]
async fn register_me_logout_me_returns_401_login_required() {
    let app = test_router();
    let email = format!("logout-api-{}@example.com", Uuid::new_v4());

    let reg = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/register")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "email": email,
                        "password": "TestPass12!",
                        "nickname": "u"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(reg.status(), StatusCode::OK);
    let reg_j = response_json(reg).await;
    let token = reg_j
        .get("token")
        .and_then(|t| t.as_str())
        .expect("register returns token");
    assert!(!token.is_empty());

    let me_ok = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, format!("Bearer {}", token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me_ok.status(), StatusCode::OK);

    let logout = app
        .clone()
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/auth/logout")
                .header(header::CONTENT_TYPE, "application/json")
                .header(header::AUTHORIZATION, format!("Bearer {}", token))
                .body(Body::from("{}"))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(logout.status(), StatusCode::OK);

    let me_after = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/v1/me")
                .header(header::AUTHORIZATION, format!("Bearer {}", token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(me_after.status(), StatusCode::UNAUTHORIZED);
    let me_j = response_json(me_after).await;
    assert_eq!(me_j.get("error").and_then(|e| e.as_str()), Some("login_required"));
}
