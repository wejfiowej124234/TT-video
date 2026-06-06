//! **A5 · ①**：**`INTERNAL_API_SECRET`** 下全栈 **`/api/v1/internal`** 与 **`/api/v1/internal/*`** 同 **403**（**04** §7.6）。

use axum::body::Body;
use axum::http::{Request, StatusCode};
use std::sync::{Mutex, OnceLock};
use tower::ServiceExt;

use super::helpers::*;

static INTERNAL_SECRET_PG_ENV_MUTEX: OnceLock<Mutex<()>> = OnceLock::new();

fn env_lock() -> std::sync::MutexGuard<'static, ()> {
    INTERNAL_SECRET_PG_ENV_MUTEX
        .get_or_init(|| Mutex::new(()))
        .lock()
        .expect("internal secret pg env mutex")
}

struct InternalSecretPgEnvGuard {
    previous: Option<String>,
}

impl InternalSecretPgEnvGuard {
    fn set(value: &str) -> Self {
        let previous = std::env::var("INTERNAL_API_SECRET").ok();
        std::env::set_var("INTERNAL_API_SECRET", value);
        Self { previous }
    }
}

impl Drop for InternalSecretPgEnvGuard {
    fn drop(&mut self) {
        match &self.previous {
            Some(s) => std::env::set_var("INTERNAL_API_SECRET", s),
            None => std::env::remove_var("INTERNAL_API_SECRET"),
        }
    }
}

async fn get_internal(
    app: &axum::Router,
    uri: &str,
    secret: Option<&str>,
) -> (StatusCode, serde_json::Value) {
    let mut req = Request::builder().method("GET").uri(uri);
    if let Some(s) = secret {
        req = req.header("X-Internal-Api-Secret", s);
    };    let res = app
        .clone()
        .oneshot(req.body(Body::empty()).unwrap())
        .await
        .expect("internal request");
    (res.status(), response_json(res).await)
}

#[tokio::test]
async fn matrix_93_internal_secret_gate_root_and_subpath_forbidden_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: internal secret gate (DATABASE_URL unset)");
        return;
    };    let _db = db_it_lock().lock().await;
    let _env = env_lock();
    let _g = InternalSecretPgEnvGuard::set("pg-internal-gate-secret");
    let app = app_stack_router(pool);

    let (st_root, j_root) = get_internal(&app, "/api/v1/internal", None).await;
    assert_eq!(st_root, StatusCode::FORBIDDEN, "{:?}", j_root);
    assert_eq!(j_root["error"].as_str(), Some("internal_api_forbidden"));

    let (st_slash, j_slash) = get_internal(&app, "/api/v1/internal/", None).await;
    assert_eq!(st_slash, StatusCode::FORBIDDEN, "{:?}", j_slash);
    assert_eq!(j_slash["error"].as_str(), Some("internal_api_forbidden"));

    let (st_sub, j_sub) = get_internal(&app, "/api/v1/internal/indexer-status", None).await;
    assert_eq!(st_sub, StatusCode::FORBIDDEN, "{:?}", j_sub);
    assert_eq!(j_sub["error"].as_str(), Some("internal_api_forbidden"));
}

#[tokio::test]
async fn matrix_93_internal_secret_gate_ok_with_header_pg() {
    let Some(pool) = pool_or_skip().await else {
        eprintln!("skip: internal secret gate ok header (DATABASE_URL unset)");
        return;
    };    let _db = db_it_lock().lock().await;
    let _env = env_lock();
    let _g = InternalSecretPgEnvGuard::set("pg-internal-gate-secret");
    let app = app_stack_router(pool);

    let (st, j) = get_internal(
        &app,
        "/api/v1/internal/indexer-status",
        Some("pg-internal-gate-secret"),
    )
    .await;
    assert_eq!(st, StatusCode::OK, "{:?}", j);
    assert_eq!(j["status"], "ok");
}
