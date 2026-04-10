//! `/health`、`/meta`、`/meta/build`、`/metrics` 路由装配。

use axum::{routing::get, Router};

use crate::state::ApiMetaState;

use super::handlers::{meta, meta_build_only, metrics};

async fn health() -> &'static str {
    "ok"
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/health", get(health))
        .route("/meta", get(meta))
        .route("/meta/build", get(meta_build_only))
        .route("/metrics", get(metrics))
}
