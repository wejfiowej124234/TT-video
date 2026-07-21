//! `/health`、`/health/ready`、`/meta`、`/meta/build`、`/metrics` 路由装配。

use axum::{routing::get, Router};

use crate::state::ApiMetaState;

use super::handlers::{health_ready, meta, meta_build_only, meta_release_identity, metrics};

async fn health() -> &'static str {
    "ok"
}

pub fn router() -> Router<ApiMetaState> {
    Router::new()
        .route("/health", get(health))
        .route("/health/ready", get(health_ready))
        .route("/meta", get(meta))
        .route("/meta/build", get(meta_build_only))
        .route("/meta/release-identity", get(meta_release_identity))
        .route("/metrics", get(metrics))
}
